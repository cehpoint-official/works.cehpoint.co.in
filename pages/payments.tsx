// pages/payments.tsx
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  DollarSign,
  TrendingUp,
  Download,
  IndianRupee,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  CreditCard,
  Smartphone,
  Bitcoin,
  ChevronRight,
  Info,
  CheckCircle2,
  Clock,
  History,
  ShieldCheck,
  Zap,
  Plus,
  Briefcase
} from "lucide-react";

import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";

import { storage } from "../utils/storage";
import type { User, Payment, Currency } from "../utils/types";

const INR_RATE = 89;

function formatMoney(amountUsd: number, currency: Currency): string {
  const symbol = currency === "INR" ? "₹" : "$";
  const converted = currency === "INR" ? amountUsd * INR_RATE : amountUsd;
  return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function toDisplay(amountUsd: number, currency: Currency): number {
  return currency === "INR" ? amountUsd * INR_RATE : amountUsd;
}

function toBase(enteredAmount: number, currency: Currency): number {
  return currency === "INR" ? enteredAmount / INR_RATE : enteredAmount;
}

export default function Payments() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // payout details state
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [savingPayout, setSavingPayout] = useState(false);
  const [payoutType, setPayoutType] = useState<"upi" | "bank" | "paypal" | "crypto">("upi");

  const [upiId, setUpiId] = useState("");
  const [bankHolderName, setBankHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");

  const [paypalEmail, setPaypalEmail] = useState("");
  const [cryptoNetwork, setCryptoNetwork] = useState("");
  const [cryptoAddress, setCryptoAddress] = useState("");

  const [withdrawMethod, setWithdrawMethod] = useState<"upi" | "bank" | "paypal" | "crypto">("upi");
  const [currency, setCurrency] = useState<Currency>("USD");

  useEffect(() => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser || currentUser.role !== "worker") {
      router.replace("/login");
      return;
    }
    hydratePayoutState(currentUser);
    setUser(currentUser);
    setCurrency(currentUser.preferredCurrency || "USD");
    loadPayments(currentUser.id);
  }, [router]);

  const hydratePayoutState = (u: User) => {
    if (!u.payoutAccount) return;
    setPayoutType(u.payoutAccount.accountType);
    setWithdrawMethod(u.payoutAccount.accountType);
    setUpiId(u.payoutAccount.upiId ?? "");
    setBankHolderName(u.payoutAccount.accountHolderName ?? "");
    setBankName(u.payoutAccount.bankName ?? "");
    setBankAccountNumber(u.payoutAccount.bankAccountNumber ?? "");
    setBankIfsc(u.payoutAccount.bankIfsc ?? "");
    setPaypalEmail(u.payoutAccount.paypalEmail ?? "");
    setCryptoNetwork(u.payoutAccount.cryptoNetwork ?? "");
    setCryptoAddress(u.payoutAccount.cryptoAddress ?? "");
  };

  const loadPayments = async (userId: string) => {
    setLoading(true);
    try {
      const list = await storage.getPaymentsByUser(userId);
      setPayments(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      const updatedUser = await storage.getUserById(userId);
      if (updatedUser) {
        setUser(updatedUser);
        hydratePayoutState(updatedUser);
        storage.setCurrentUser(updatedUser);
      }
    } catch (err) {
      toast.error("Ledger sync failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyChange = async (value: Currency) => {
    if (!user || value === currency) return;
    setCurrency(value);
    try {
      const updatedUser: User = { ...user, preferredCurrency: value };
      await storage.updateUser(user.id, { preferredCurrency: value });
      storage.setCurrentUser(updatedUser);
      setUser(updatedUser);
    } catch (err) {
      toast.error("Preference update failed.");
    }
  };

  const handleSavePayoutDetails = async () => {
    if (!user) return;
    setSavingPayout(true);
    try {
      let payoutAccount: any = {
        accountType: payoutType,
        verified: user.payoutAccount?.verified ?? false,
      };

      if (payoutType === "upi") {
        if (!upiId.trim()) throw new Error("UPI ID required");
        payoutAccount = { ...payoutAccount, upiId: upiId.trim(), accountNumber: upiId.trim() };
      } else if (payoutType === "bank") {
        if (!bankAccountNumber.trim() || !bankIfsc.trim()) throw new Error("Bank details incomplete");
        payoutAccount = { ...payoutAccount, bankName, accountHolderName: bankHolderName, bankAccountNumber, bankIfsc, accountNumber: bankAccountNumber };
      } else if (payoutType === "paypal") {
        if (!paypalEmail.trim()) throw new Error("PayPal email required");
        payoutAccount = { ...payoutAccount, paypalEmail, accountNumber: paypalEmail };
      } else {
        if (!cryptoAddress.trim()) throw new Error("Wallet address required");
        payoutAccount = { ...payoutAccount, cryptoNetwork, cryptoAddress, accountNumber: cryptoAddress };
      }

      await storage.updateUser(user.id, { payoutAccount });
      const updatedUser: User = { ...user, payoutAccount };
      storage.setCurrentUser(updatedUser);
      setUser(updatedUser);
      toast.success("Settlement Vault Updated");
      setShowPayoutForm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save.");
    } finally {
      setSavingPayout(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user) return;
    const enteredDisplayAmount = parseFloat(withdrawAmount);
    if (isNaN(enteredDisplayAmount) || enteredDisplayAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const baseAmount = toBase(enteredDisplayAmount, currency);
    if (baseAmount > user.balance) {
      toast.error("Insufficient balance");
      return;
    }

    setSubmitting(true);
    try {
      const pa = user.payoutAccount!;
      let details = "";
      if (withdrawMethod === "upi") details = pa.upiId!;
      else if (withdrawMethod === "bank") details = `${pa.bankName} (${pa.bankAccountNumber})`;
      else if (withdrawMethod === "paypal") details = pa.paypalEmail!;
      else details = `${pa.cryptoNetwork}: ${pa.cryptoAddress}`;

      await storage.createPayment({
        userId: user.id,
        amount: baseAmount,
        type: "withdrawal",
        status: "pending",
        createdAt: new Date().toISOString(),
        payoutMethod: withdrawMethod,
        payoutMethodDetails: details,
      });

      toast.success("Withdrawal Synchronized! 🚀");
      setWithdrawAmount("");
      setShowWithdraw(false);
      loadPayments(user.id);
    } catch (err) {
      toast.error("Synchronization failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return null;

  const totalEarnings = payments.filter(p => p.type === 'task-payment' && p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const totalWithdrawn = payments.filter(p => p.type === 'withdrawal' && p.status === 'completed').reduce((s, p) => s + p.amount, 0);

  return (
    <Layout>
      <Head>
        <title>Wealth Management - Cehpoint</title>
      </Head>

      <div className="max-w-[1400px] mx-auto space-y-8 pb-20">
        {/* PREMIUM HEADER */}
        <section className="bg-slate-900 rounded-[2.5rem] p-10 md:p-14 text-white border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] -mr-60 -mt-20" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
                <ShieldCheck size={12} className="text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Secure Payments Active</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">Financial <span className="text-emerald-400">Hub.</span></h1>
              <p className="text-slate-400 font-medium max-w-lg">Track your earnings, manage your settlement accounts, and request secure withdrawals in real-time.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-4">
              <div className="bg-white/5 border border-white/10 p-5 rounded-[2rem] backdrop-blur-xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Available Liquidity</p>
                <p className="text-3xl font-black text-white">{formatMoney(user.balance, currency)}</p>
              </div>

              <button
                onClick={() => setShowWithdraw(!showWithdraw)}
                className="h-20 px-10 rounded-[2rem] bg-emerald-600 hover:bg-emerald-700 font-black text-sm uppercase tracking-widest shadow-2xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Download size={20} /> Withdraw
              </button>
            </div>
          </div>
        </section>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: "Net Profit", value: formatMoney(totalEarnings, currency), icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Liquidated", value: formatMoney(totalWithdrawn, currency), icon: Download, color: "text-rose-500", bg: "bg-rose-500/10" },
            { label: "Active Nodes", value: payments.filter(p => p.status === 'pending').length, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" }
          ].map((stat, idx) => (
            <Card key={idx} className="p-8 border-slate-100 flex items-center gap-6">
              <div className={`w-16 h-16 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* WITHDRAWAL & VAULT */}
          <div className="lg:col-span-1 space-y-6">
            <AnimatePresence>
              {showWithdraw && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <Card className="bg-emerald-50/50 border-emerald-100 p-8 space-y-6">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Initiate Withdrawal</h2>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Quantum Amount</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="w-full px-5 py-4 bg-white border border-emerald-100 rounded-2xl outline-none focus:border-emerald-600 font-bold"
                            placeholder="0.00"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600 font-black">{currency}</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Destination Node</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['upi', 'bank', 'paypal', 'crypto'].map(m => (
                            <button
                              key={m}
                              disabled={payoutType !== m && !user.payoutAccount}
                              onClick={() => setWithdrawMethod(m as any)}
                              className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${withdrawMethod === m ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-white border-emerald-100 text-slate-400 hover:text-emerald-600 disabled:opacity-30'}`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Button onClick={handleWithdraw} disabled={submitting} className="w-full h-14 rounded-2xl bg-emerald-600 shadow-xl shadow-emerald-500/20">
                        {submitting ? "Finalizing Sync..." : "Secure Withdraw"}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <Card className="p-8 space-y-8">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Settlement Vault</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Payout Node</p>
                </div>
                <button
                  onClick={() => setShowPayoutForm(!showPayoutForm)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${showPayoutForm ? 'bg-rose-50 text-rose-600 rotate-45' : 'bg-slate-100 text-slate-600'}`}
                >
                  <Plus size={20} />
                </button>
              </div>

              {showPayoutForm ? (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'upi', icon: Smartphone, label: 'UPI' },
                      { id: 'bank', icon: CreditCard, label: 'Bank' },
                      { id: 'paypal', icon: Briefcase, label: 'PayPal' },
                      { id: 'crypto', icon: Bitcoin, label: 'Crypto' }
                    ].map(type => (
                      <button key={type.id} onClick={() => setPayoutType(type.id as any)} className={`flex-1 min-w-[80px] p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${payoutType === type.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'}`}>
                        <type.icon size={18} />
                        <span className="text-[9px] font-black uppercase">{type.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {payoutType === 'upi' && <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none focus:bg-white border border-slate-100 focus:border-indigo-600 font-bold" placeholder="your-id@upi" />}
                    {payoutType === 'bank' && (
                      <div className="space-y-3">
                        <input type="text" value={bankHolderName} onChange={(e) => setBankHolderName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-indigo-600 font-bold text-sm" placeholder="Account Holder" />
                        <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-indigo-600 font-bold text-sm" placeholder="Bank Name" />
                        <input type="text" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-indigo-600 font-bold text-sm" placeholder="Account Number" />
                        <input type="text" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-indigo-600 font-bold text-sm" placeholder="IFSC Code" />
                      </div>
                    )}
                    {payoutType === 'paypal' && <input type="email" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none focus:bg-white border border-slate-100 focus:border-indigo-600 font-bold" placeholder="paypal-email@host.com" />}
                    {payoutType === 'crypto' && (
                      <div className="space-y-3">
                        <input type="text" value={cryptoNetwork} onChange={(e) => setCryptoNetwork(e.target.value)} className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-indigo-600 font-bold text-sm" placeholder="Network (e.g. SOL, ETH)" />
                        <input type="text" value={cryptoAddress} onChange={(e) => setCryptoAddress(e.target.value)} className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-indigo-600 font-bold text-sm" placeholder="Wallet Address" />
                      </div>
                    )}
                  </div>

                  <Button onClick={handleSavePayoutDetails} disabled={savingPayout} className="w-full h-14 rounded-2xl shadow-xl shadow-indigo-600/10">
                    {savingPayout ? "Syncing Workspace..." : "Initialize Settlement Hub"}
                  </Button>
                </div>
              ) : user.payoutAccount ? (
                <div className="p-6 bg-slate-900 rounded-[2rem] text-white space-y-4">
                  <div className="flex justify-between items-center text-indigo-400">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{user.payoutAccount.accountType} ACTIVE</span>
                    <Info size={14} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-black truncate">{user.payoutAccount.accountNumber}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{user.fullName}</p>
                  </div>
                  <div className="pt-4 border-t border-white/5 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol Verified</span>
                  </div>
                </div>
              ) : (
                <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2rem] text-center">
                  <CreditCard className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Add Settlement Details</p>
                </div>
              )}
            </Card>
          </div>

          {/* HISTORY */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center px-4">
              <div className="flex items-center gap-3">
                <History className="text-slate-900" size={24} />
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Ledger Records</h2>
              </div>
              <div className="flex p-1 bg-slate-100/50 rounded-xl border border-slate-200">
                <button onClick={() => setCurrency('USD')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${currency === 'USD' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500'}`}>USD</button>
                <button onClick={() => setCurrency('INR')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${currency === 'INR' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500'}`}>INR</button>
              </div>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {payments.length === 0 ? (
                  <Card className="p-20 text-center border-slate-100">
                    <History className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">No ledger records found</p>
                  </Card>
                ) : (
                  payments.map((p, idx) => (
                    <motion.div key={p.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} layout>
                      <Card className="p-6 border-slate-100 hover:shadow-xl transition-all group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 ${p.type === 'withdrawal' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                              {p.type === 'withdrawal' ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{format(new Date(p.createdAt), 'MMM dd, yyyy')}</p>
                              <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                                {p.type === 'task-payment' ? 'Mission Payout' :
                                  p.type === 'manual' ? 'Standard Credit' :
                                    p.type === 'bonus' ? 'Performance Bonus' :
                                      p.type.replace('-', ' ')}
                              </h3>
                              <p className="text-xs font-medium text-slate-500 italic">
                                {p.payoutMethodDetails || (p.type === 'withdrawal' ? 'Secure Redistribution' : 'Direct Ledger Entry')}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className={`text-2xl font-black tracking-tight ${p.type === 'withdrawal' ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {p.type === 'withdrawal' ? '-' : '+'}{formatMoney(p.amount, currency)}
                            </p>
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest mt-2 ${p.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                              p.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                'bg-rose-50 text-rose-600'
                              }`}>
                              {p.status === 'completed' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                              {p.status}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}