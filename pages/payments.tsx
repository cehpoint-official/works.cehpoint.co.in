// pages/payments.tsx
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import { format, isSameDay } from "date-fns";
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
  Briefcase,
  AlertCircle,
  Edit2,
  Trash2,
  Star,
  X
} from "lucide-react";

import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";

import { storage } from "../utils/storage";
import type { User, Payment, Currency, PayoutAccount } from "../utils/types";

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

  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [withdrawAccountId, setWithdrawAccountId] = useState("");
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

  const hydratePayoutState = (u: User, accountId?: string) => {
    const accounts = u.payoutAccounts || [];
    const account = accountId ? accounts.find(a => a.id === accountId) : (u.payoutAccount || accounts[0]);

    if (!account) {
      setPayoutType("upi");
      setUpiId("");
      setBankHolderName("");
      setBankName("");
      setBankAccountNumber("");
      setBankIfsc("");
      setPaypalEmail("");
      setCryptoNetwork("");
      setCryptoAddress("");
      return;
    }

    setPayoutType(account.accountType);
    setUpiId(account.upiId ?? "");
    setBankHolderName(account.accountHolderName ?? "");
    setBankName(account.bankName ?? "");
    setBankAccountNumber(account.bankAccountNumber ?? "");
    setBankIfsc(account.bankIfsc ?? "");
    setPaypalEmail(account.paypalEmail ?? "");
    setCryptoNetwork(account.cryptoNetwork ?? "");
    setCryptoAddress(account.cryptoAddress ?? "");

    if (accounts.length > 0) {
      setWithdrawAccountId(accountId || accounts[0].id);
    }
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
      toast.error("Failed to load payments.");
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
      let newAccount: any = {
        id: editingAccountId || Math.random().toString(36).substr(2, 9),
        accountType: payoutType,
        verified: false,
      };

      if (payoutType === "upi") {
        if (!upiId.trim()) throw new Error("UPI ID required");
        newAccount = { ...newAccount, upiId: upiId.trim(), accountNumber: upiId.trim() };
      } else if (payoutType === "bank") {
        if (!bankAccountNumber.trim() || !bankIfsc.trim()) throw new Error("Bank details incomplete");
        newAccount = { ...newAccount, bankName, accountHolderName: bankHolderName, bankAccountNumber, bankIfsc, accountNumber: bankAccountNumber };
      } else if (payoutType === "paypal") {
        if (!paypalEmail.trim()) throw new Error("PayPal email required");
        newAccount = { ...newAccount, paypalEmail, accountNumber: paypalEmail };
      } else {
        if (!cryptoAddress.trim()) throw new Error("Wallet address required");
        newAccount = { ...newAccount, cryptoNetwork, cryptoAddress, accountNumber: cryptoAddress };
      }

      const existingAccounts = user.payoutAccounts || [];
      let updatedAccounts: PayoutAccount[];

      if (editingAccountId) {
        updatedAccounts = existingAccounts.map(a => a.id === editingAccountId ? newAccount : a);
      } else {
        updatedAccounts = [...existingAccounts, newAccount];
      }

      const updateData = {
        payoutAccounts: updatedAccounts,
        payoutAccount: updatedAccounts[0] // Set first as primary legacy
      };

      await storage.updateUser(user.id, updateData);
      const updatedUser: User = { ...user, ...updateData };
      storage.setCurrentUser(updatedUser);
      setUser(updatedUser);

      // Auto-select if it's the first account added or if specifically desired
      if (updatedAccounts.length === 1) {
        setWithdrawAccountId(newAccount.id);
      }

      toast.success(editingAccountId ? "Method updated successfully" : "New method added successfully");
      setShowPayoutForm(false);
      setEditingAccountId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to save.");
    } finally {
      setSavingPayout(false);
    }
  };

  const handleDeletePayoutAccount = (accountId: string) => {
    if (!user) return;

    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[280px]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Trash2 size={24} />
          </div>
          <div>
            <p className="text-base font-black text-slate-900 leading-tight">Remove Method?</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">This action is irreversible</p>
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              await executeDelete(accountId);
            }}
            className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-rose-600/20"
          >
            Confirm
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 6000,
      position: 'top-center',
      style: {
        borderRadius: '2rem',
        padding: '24px',
        border: '1px solid #f8fafc',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }
    });
  };

  const executeDelete = async (accountId: string) => {
    if (!user) return;
    try {
      const remainingAccounts = (user.payoutAccounts || []).filter(a => a.id !== accountId);

      const updateData = {
        payoutAccounts: remainingAccounts,
        payoutAccount: remainingAccounts.length > 0 ? remainingAccounts[0] : undefined
      };

      await storage.updateUser(user.id, updateData);
      const updatedUser: User = { ...user, ...updateData };
      storage.setCurrentUser(updatedUser);
      setUser(updatedUser);

      if (withdrawAccountId === accountId) {
        setWithdrawAccountId(remainingAccounts.length > 0 ? remainingAccounts[0].id : "");
      }

      toast.success("Payment method removed", {
        icon: '🗑️',
        style: {
          borderRadius: '16px',
          background: '#1e293b',
          color: '#fff',
        },
      });
    } catch (err) {
      toast.error("Failed to delete method");
    }
  };

  const handleSetPrimaryAccount = async (accountId: string) => {
    if (!user) return;
    try {
      const accounts = user.payoutAccounts || [];
      const index = accounts.findIndex(a => a.id === accountId);
      if (index === -1) return;

      const selected = accounts[index];
      const others = accounts.filter(a => a.id !== accountId);
      const updatedAccounts = [selected, ...others];

      const updateData = {
        payoutAccounts: updatedAccounts,
        payoutAccount: selected
      };

      await storage.updateUser(user.id, updateData);
      const updatedUser: User = { ...user, ...updateData };
      storage.setCurrentUser(updatedUser);
      setUser(updatedUser);

      // Auto-select in withdrawal tab as requested
      setWithdrawAccountId(accountId);

      toast.success("Primary method updated");
    } catch (err) {
      toast.error("Failed to update primary method");
    }
  };

  const handleWithdraw = async () => {
    if (!user) return;
    const selectedAccount = (user.payoutAccounts || []).find(a => a.id === withdrawAccountId);
    if (!selectedAccount) {
      toast.error("Please select a payment method");
      return;
    }

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

    // Senior Developer Logic: Enforcement of daily withdrawal limit
    const todayWithdrawals = payments.filter(p =>
      p.type === 'withdrawal' &&
      isSameDay(new Date(p.createdAt), new Date())
    );

    if (todayWithdrawals.length >= 3) {
      toast.error("Daily Limit Reached! (Max 3 withdrawals daily)", {
        icon: '⚠️',
        style: {
          borderRadius: '16px',
          background: '#fef2f2',
          color: '#991b1b',
          border: '1px solid #fecaca',
        },
      });
      return;
    }

    setSubmitting(true);
    try {
      // Build comprehensive details object for Admin
      const details = JSON.stringify({
        ...selectedAccount,
        // Ensure no sensitive internal fields are leaked if any, 
        // but here we need all of them for the admin to pay.
      });

      await storage.createPayment({
        userId: user.id,
        amount: baseAmount,
        type: "withdrawal",
        status: "pending",
        createdAt: new Date().toISOString(),
        payoutMethod: selectedAccount.accountType,
        payoutMethodDetails: details,
      });

      toast.success("Withdrawal request sent! 🚀");
      setWithdrawAmount("");
      setShowWithdraw(false);
      loadPayments(user.id);
    } catch (err) {
      toast.error("Request failed.");
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
        <title>My Payments - Cehpoint</title>
      </Head>

      <div className="max-w-[1400px] mx-auto space-y-8 pb-20">
        {/* PREMIUM HEADER */}
        <section className="bg-slate-900 rounded-[2.5rem] p-6 sm:p-10 md:p-14 text-white border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] -mr-60 -mt-20" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 md:gap-10">
            <div className="space-y-3 md:space-y-4 w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
                <ShieldCheck size={12} className="text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Secure Payments Active</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.1]">
                Payments <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600 block sm:inline">Hub.</span>
              </h1>
              <p className="text-slate-400 font-medium max-w-lg text-sm md:text-base leading-relaxed">
                Track your earnings, manage your payment methods, and request secure withdrawals in real-time.
              </p>

              {(!user.payoutAccounts || user.payoutAccounts.length === 0) && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/20 backdrop-blur-md"
                >
                  <AlertCircle size={14} className="text-rose-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Payment Details Missing - Please add a method to withdraw</span>
                </motion.div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
              <div className="bg-white/5 border border-white/10 p-5 md:p-6 rounded-[2rem] backdrop-blur-xl flex-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Available Balance</p>
                <p className="text-2xl sm:text-3xl font-black text-white truncate">{formatMoney(user.balance, currency)}</p>
              </div>

              <button
                onClick={() => setShowWithdraw(!showWithdraw)}
                className="h-16 md:h-20 px-8 md:px-12 rounded-2xl md:rounded-[2.5rem] bg-emerald-600 hover:bg-emerald-700 font-black text-xs md:text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-3 shrink-0"
              >
                <Download size={18} /> Withdraw
              </button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[
            { label: "Total Earnings", value: formatMoney(totalEarnings, currency), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Withdrawn", value: formatMoney(totalWithdrawn, currency), icon: Download, color: "text-rose-600", bg: "bg-rose-50" },
            { label: "Pending Requests", value: payments.filter(p => p.status === 'pending').length, icon: Zap, color: "text-amber-600", bg: "bg-amber-50" }
          ].map((stat, idx) => (
            <Card key={idx} className="p-6 md:p-8 border-slate-100 flex items-center gap-4 md:gap-6 group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500">
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110 duration-500 shrink-0`}>
                <stat.icon className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <p className="text-xl md:text-2xl font-black text-slate-900 tracking-tight truncate">{stat.value}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* WITHDRAWAL & VAULT */}
          <div className="lg:col-span-2 space-y-6">
            {/* WITHDRAWAL & VAULT content remains same */}
            <AnimatePresence>
              {showWithdraw && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowWithdraw(false)}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                  />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-2xl z-10"
                  >
                    <Card className="bg-white border-slate-200 p-0 overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] rounded-2xl">
                      <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-lg shadow-slate-950/20">
                            <Download size={22} strokeWidth={2.5} />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-outfit uppercase">Withdraw Funds</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Institutional Liquidity Terminal</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowWithdraw(false)}
                          className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar text-left">
                        {(!user.payoutAccounts || user.payoutAccounts.length === 0) ? (
                          <div className="text-center py-10 space-y-6">
                            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                              <AlertCircle size={40} />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-lg font-black text-slate-900 uppercase">Missing Payout Method</h3>
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-[280px] mx-auto">
                                You must configure at least one payment method before you can initiate a withdrawal request.
                              </p>
                            </div>
                            <Button
                              onClick={() => { setShowPayoutForm(true); setShowWithdraw(false); setEditingAccountId(null); hydratePayoutState(user); }}
                              className="w-full h-14 bg-indigo-600 shadow-xl shadow-indigo-600/20 rounded-2xl"
                            >
                              Add Payment Method
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-8">
                            <div className="relative overflow-hidden p-6 bg-indigo-50/50 border border-indigo-100 rounded-xl group transition-all hover:bg-indigo-50 hover:border-indigo-200">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                              <div className="flex items-start gap-5 relative z-10">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-600/20">
                                  <ShieldCheck size={20} strokeWidth={2.5} />
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-xs font-bold text-slate-950 uppercase tracking-wider leading-none">Withdrawal Policy & Compliance</p>
                                    <p className="text-[11px] font-medium text-indigo-600 mt-1 uppercase tracking-widest">Protocol V2.4 Active</p>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                      <p className="text-[10px] font-semibold text-slate-600">Processing: 24-48 Business Hours</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                      <p className="text-[10px] font-semibold text-slate-600">Daily Limit: 3 Transactions</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                      <p className="text-[10px] font-semibold text-slate-600">Zero Liquidation Fees (0%)</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                      <p className="text-[10px] font-semibold text-slate-600">AES-256 Vault Verification</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em] ml-1 block">Specify Amount</label>
                              <div className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-950 transition-colors font-bold text-xl">
                                  {currency === 'INR' ? '₹' : '$'}
                                </div>
                                <input
                                  type="number"
                                  value={withdrawAmount}
                                  onChange={(e) => setWithdrawAmount(e.target.value)}
                                  className="w-full pl-14 pr-24 py-6 bg-white border border-slate-200 focus:border-slate-950 rounded-xl outline-none font-bold text-2xl text-slate-950 transition-all placeholder:text-slate-200 shadow-sm"
                                  placeholder="0.00"
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                  <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                    {currency}
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-between items-center px-1">
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Available Balance: <span className="text-slate-900 font-bold">{formatMoney(user.balance, currency)}</span></p>
                                <button
                                  onClick={() => setWithdrawAmount(toDisplay(user.balance, currency).toString())}
                                  className="text-[10px] font-bold text-slate-900 uppercase tracking-widest hover:bg-slate-100 px-4 py-2 rounded-lg transition-all border border-slate-200"
                                >
                                  Max Amount
                                </button>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em] ml-1 block">Destination Account</label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {user.payoutAccounts.map(acc => (
                                  <button
                                    key={acc.id}
                                    onClick={() => setWithdrawAccountId(acc.id)}
                                    className={`group relative flex items-center justify-between p-5 rounded-xl border transition-all text-left ${withdrawAccountId === acc.id ? 'bg-slate-950 border-slate-950 shadow-xl shadow-slate-900/10' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                                  >
                                    <div className="flex items-center gap-4 min-w-0">
                                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${withdrawAccountId === acc.id ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        {acc.accountType === 'upi' && <Smartphone size={20} />}
                                        {acc.accountType === 'bank' && <CreditCard size={20} />}
                                        {acc.accountType === 'paypal' && <Briefcase size={20} />}
                                        {acc.accountType === 'crypto' && <Bitcoin size={20} />}
                                      </div>
                                      <div className="min-w-0">
                                        <p className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-1 ${withdrawAccountId === acc.id ? 'text-white/40' : 'text-slate-400'}`}>{acc.accountType}</p>
                                        <p className={`font-bold text-sm truncate tracking-tight ${withdrawAccountId === acc.id ? 'text-white' : 'text-slate-900'}`}>{acc.accountNumber}</p>
                                      </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${withdrawAccountId === acc.id ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white'}`}>
                                      {withdrawAccountId === acc.id && <CheckCircle2 size={12} strokeWidth={3} />}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {user.payoutAccounts && user.payoutAccounts.length > 0 && (
                        <div className="p-8 bg-white border-t border-slate-100">
                          <Button
                            onClick={handleWithdraw}
                            disabled={submitting}
                            className="w-full h-14 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold uppercase tracking-[0.2em] text-xs transition-all active:scale-[0.98] shadow-xl shadow-slate-900/10"
                          >
                            <div className="flex items-center justify-center gap-3">
                              {submitting ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                  EXECUTING TRANSACTION...
                                </>
                              ) : (
                                <>
                                  INITIATE WITHDRAWAL
                                  <ArrowUpRight size={18} />
                                </>
                              )}
                            </div>
                          </Button>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <Card className="p-0 overflow-hidden flex flex-col border-slate-100 shadow-xl shadow-slate-200/40 lg:h-[850px] min-h-[400px]">
              <div className="p-8 pb-0 flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Payment Methods</h2>
                    {(!user.payoutAccounts || user.payoutAccounts.length === 0) && (
                      <span className="px-2 py-1 rounded-md bg-rose-50 text-rose-500 text-[8px] font-black uppercase tracking-wider border border-rose-100">
                        Not Added
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage your global payout accounts</p>
                </div>
                <button
                  onClick={() => {
                    if (showPayoutForm && !editingAccountId) {
                      setShowPayoutForm(false);
                    } else {
                      setEditingAccountId(null);
                      hydratePayoutState(user);
                      setShowPayoutForm(true);
                    }
                  }}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${showPayoutForm && !editingAccountId ? 'bg-rose-500 text-white rotate-45 hover:bg-rose-600' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200'}`}
                >
                  <Plus className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-6 custom-scrollbar">
                <AnimatePresence mode="wait">
                  {showPayoutForm && (
                    <motion.div
                      initial={{ opacity: 0, y: -20, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -20, height: 0 }}
                      className="overflow-hidden mb-6"
                    >
                      <div className="p-6 border-2 border-indigo-100/50 rounded-[2rem] bg-indigo-50/30 space-y-6 relative">
                        <div className="flex items-center justify-between mb-2 px-1">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                            <h3 className="text-[11px] font-black uppercase tracking-[0.1em] text-indigo-700">
                              {editingAccountId ? 'Update Existing Method' : 'Configure New Method'}
                            </h3>
                          </div>
                          <button
                            onClick={() => { setShowPayoutForm(false); setEditingAccountId(null); }}
                            className="bg-white/60 hover:bg-white p-1.5 rounded-full text-slate-400 hover:text-rose-500 transition-all shadow-sm"
                          >
                            <Plus className="rotate-45" size={16} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { id: 'upi', icon: Smartphone, label: 'UPI' },
                            { id: 'bank', icon: CreditCard, label: 'Bank' },
                            { id: 'paypal', icon: Briefcase, label: 'PayPal' },
                            { id: 'crypto', icon: Bitcoin, label: 'Crypto' }
                          ].map(type => {
                            const isConfigured = (user.payoutAccounts || []).some(a => a.accountType === type.id);
                            return (
                              <button
                                key={type.id}
                                onClick={() => setPayoutType(type.id as any)}
                                className={`p-3.5 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2.5 relative ${payoutType === type.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30 -translate-y-1' : 'bg-white border-white text-slate-400 hover:border-indigo-200 hover:text-slate-600 shadow-sm'}`}
                              >
                                {isConfigured && (
                                  <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" title="Configured" />
                                )}
                                {!isConfigured && (
                                  <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-slate-200" title="Not Configured" />
                                )}
                                <type.icon size={20} className={payoutType === type.id ? "scale-110 transition-transform" : ""} />
                                <span className="text-[10px] font-black uppercase tracking-wider">{type.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="space-y-4">
                          {payoutType === 'upi' && (
                            <div className="group">
                              <label className="text-[9px] font-black text-indigo-700/60 uppercase tracking-widest ml-4 mb-1 block">UPI Identifier</label>
                              <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="w-full px-6 py-4 bg-white rounded-[1.5rem] outline-none border-2 border-transparent focus:border-indigo-600 shadow-sm font-bold text-slate-700 placeholder:text-slate-300 transition-all" placeholder="Enter UPI ID" />
                            </div>
                          )}
                          {payoutType === 'bank' && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                  <label className="text-[9px] font-black text-indigo-700/60 uppercase tracking-widest ml-4 mb-1 block">Account Holder</label>
                                  <input type="text" value={bankHolderName} onChange={(e) => setBankHolderName(e.target.value)} className="w-full px-5 py-3 bg-white rounded-2xl outline-none border border-slate-100 focus:border-indigo-600 font-bold text-sm" placeholder="Enter Full Name" />
                                </div>
                                <div>
                                  <label className="text-[9px] font-black text-indigo-700/60 uppercase tracking-widest ml-4 mb-1 block">Bank Name</label>
                                  <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full px-5 py-3 bg-white rounded-2xl outline-none border border-slate-100 focus:border-indigo-600 font-bold text-sm" placeholder="Enter Bank Name" />
                                </div>
                                <div>
                                  <label className="text-[9px] font-black text-indigo-700/60 uppercase tracking-widest ml-4 mb-1 block">IFSC Code</label>
                                  <input type="text" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} className="w-full px-5 py-3 bg-white rounded-2xl outline-none border border-slate-100 focus:border-indigo-600 font-bold text-sm uppercase" placeholder="Enter IFSC Code" />
                                </div>
                                <div className="col-span-2">
                                  <label className="text-[9px] font-black text-indigo-700/60 uppercase tracking-widest ml-4 mb-1 block">Account Number</label>
                                  <input type="text" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} className="w-full px-5 py-3 bg-white rounded-2xl outline-none border border-slate-100 focus:border-indigo-600 font-bold text-sm" placeholder="Enter Account Number" />
                                </div>
                              </div>
                            </div>
                          )}
                          {payoutType === 'paypal' && (
                            <div className="group">
                              <label className="text-[9px] font-black text-indigo-700/60 uppercase tracking-widest ml-4 mb-1 block">PayPal Email</label>
                              <input type="email" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} className="w-full px-6 py-4 bg-white rounded-[1.5rem] outline-none border-2 border-transparent focus:border-indigo-600 shadow-sm font-bold text-slate-700 placeholder:text-slate-300 transition-all" placeholder="Enter PayPal Email" />
                            </div>
                          )}
                          {payoutType === 'crypto' && (
                            <div className="space-y-4">
                              <div>
                                <label className="text-[9px] font-black text-indigo-700/60 uppercase tracking-widest ml-4 mb-1 block">Network</label>
                                <input type="text" value={cryptoNetwork} onChange={(e) => setCryptoNetwork(e.target.value)} className="w-full px-6 py-4 bg-white rounded-[1.5rem] outline-none border-2 border-transparent focus:border-indigo-600 shadow-sm font-bold text-slate-700 placeholder:text-slate-300 transition-all" placeholder="Enter Network Name" />
                              </div>
                              <div>
                                <label className="text-[9px] font-black text-indigo-700/60 uppercase tracking-widest ml-4 mb-1 block">Wallet Address</label>
                                <input type="text" value={cryptoAddress} onChange={(e) => setCryptoAddress(e.target.value)} className="w-full px-6 py-4 bg-white rounded-[1.5rem] outline-none border-2 border-transparent focus:border-indigo-600 shadow-sm font-bold text-slate-700 placeholder:text-slate-300 transition-all" placeholder="Enter Wallet Address" />
                              </div>
                            </div>
                          )}
                        </div>

                        <Button onClick={handleSavePayoutDetails} disabled={savingPayout} className="w-full h-14 rounded-2xl shadow-xl shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest text-xs">
                          {savingPayout ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              Processing...
                            </div>
                          ) : (editingAccountId ? "Update Security Vault" : "Add to Security Vault")}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  {(!user.payoutAccounts || user.payoutAccounts.length === 0) ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 border-2 border-dashed border-slate-100 rounded-[2.5rem] text-center bg-slate-50/30">
                      <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Wallet className="w-8 h-8 text-slate-200" />
                      </div>
                      <h4 className="text-slate-900 font-black text-sm uppercase tracking-wider mb-2">No accounts detected</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">Please configure a payout method to enable withdrawals</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 block mb-4">Saved Payout Methods ({user.payoutAccounts.length})</label>
                      <AnimatePresence mode="popLayout">
                        {user.payoutAccounts.map((acc, idx) => (
                          <motion.div
                            key={acc.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group relative overflow-hidden p-6 rounded-[2.5rem] bg-slate-950 text-white shadow-2xl transition-all hover:-translate-y-1 duration-300 border border-white/5 active:scale-[0.98]"
                          >
                            {/* Sophisticated Background Glow */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/20 transition-colors duration-500" />
                            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-emerald-500/20 transition-colors duration-500" />

                            <div className="flex justify-between sm:items-center relative z-10 gap-4">
                              <div className="flex items-center gap-4 min-w-0 flex-1">
                                <div className={`w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${acc.accountType === 'upi' ? 'bg-indigo-500/20 text-indigo-400' : acc.accountType === 'bank' ? 'bg-emerald-500/20 text-emerald-400' : acc.accountType === 'paypal' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                  {acc.accountType === 'upi' && <Smartphone size={20} />}
                                  {acc.accountType === 'bank' && <CreditCard size={20} />}
                                  {acc.accountType === 'paypal' && <Briefcase size={20} />}
                                  {acc.accountType === 'crypto' && <Bitcoin size={20} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{acc.accountType} Account</span>
                                    {idx === 0 && <span className="bg-emerald-500/20 text-emerald-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-500/20">Primary</span>}
                                  </div>
                                  <p className="text-base font-black tracking-tight font-mono truncate text-white" title={acc.accountNumber}>{acc.accountNumber}</p>
                                </div>
                              </div>

                              <div className="flex flex-shrink-0 gap-1.5 self-start sm:self-center">
                                {idx !== 0 && (
                                  <button
                                    onClick={() => handleSetPrimaryAccount(acc.id)}
                                    className="w-8 h-8 bg-white/5 hover:bg-amber-500/20 rounded-xl flex items-center justify-center transition-all border border-white/5 hover:border-amber-500/20 group/star"
                                    title="Set as Primary"
                                  >
                                    <Star size={13} className="text-white/20 group-hover/star:text-amber-500 transition-colors" />
                                  </button>
                                )}
                                <button
                                  onClick={() => { setEditingAccountId(acc.id); hydratePayoutState(user, acc.id); setShowPayoutForm(true); }}
                                  className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all border border-white/5 group/edit"
                                  title="Edit Method"
                                >
                                  <Edit2 size={13} className="text-white/20 group-hover/edit:text-white transition-colors" />
                                </button>
                                <button
                                  onClick={() => handleDeletePayoutAccount(acc.id)}
                                  className="w-8 h-8 bg-white/5 hover:bg-rose-500/20 rounded-xl flex items-center justify-center transition-all border border-white/5 hover:border-rose-500/20 group/delete"
                                  title="Delete Method"
                                >
                                  <Trash2 size={13} className="text-white/20 group-hover/delete:text-rose-500 transition-colors" />
                                </button>
                              </div>
                            </div>

                            <div className="mt-8 pt-5 border-t border-white/5 flex items-center justify-between relative z-10">
                              <div className="flex items-center gap-3">
                                <div className="text-left">
                                  <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Holder</p>
                                  <p className="text-xs font-black text-white uppercase tracking-wider">{user.fullName}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Vault Verified</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* HISTORY */}
          <div className="lg:col-span-3">
            <Card className="p-6 md:p-8 lg:h-[850px] flex flex-col overflow-hidden border-slate-100 shadow-xl shadow-slate-200/40">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <History size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Payment History</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your transaction audit log</p>
                  </div>
                  <div className="flex p-1 bg-slate-100/50 rounded-xl border border-slate-200 mt-4 sm:mt-0">
                    <button onClick={() => setCurrency('USD')} className={`px-3 md:px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${currency === 'USD' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500'}`}>USD</button>
                    <button onClick={() => setCurrency('INR')} className={`px-3 md:px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${currency === 'INR' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500'}`}>INR</button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {payments.length === 0 ? (
                    <div className="py-20 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                      <History className="w-10 h-10 md:w-12 md:h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[9px] md:text-[10px]">No payment records found</p>
                    </div>
                  ) : (
                    payments.map((p, idx) => (
                      <motion.div key={p.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} layout className="mb-3 last:mb-0">
                        <div className="p-6 rounded-[2rem] border border-slate-50 bg-slate-50/30 hover:bg-white hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 md:gap-5">
                              <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 shrink-0 ${p.type === 'withdrawal' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                {p.type === 'withdrawal' ? <ArrowUpRight className="w-4 h-4 md:w-6 md:h-6" /> : <ArrowDownLeft className="w-4 h-4 md:w-6 md:h-6" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">{format(new Date(p.createdAt), 'MMM dd, yyyy')}</p>
                                <h3 className="text-sm md:text-lg font-black text-slate-900 tracking-tight uppercase truncate">
                                  {p.type === 'task-payment' ? 'Task Payment' :
                                    p.type === 'manual' ? 'Standard Payment' :
                                      p.type === 'bonus' ? 'Performance Bonus' :
                                        p.type.replace('-', ' ')}
                                </h3>
                                <p className="text-[10px] md:text-xs font-medium text-slate-500 italic truncate max-w-[150px] md:max-w-none">
                                  {(() => {
                                    if (!p.payoutMethodDetails) return p.type === 'withdrawal' ? 'Withdrawal' : 'Payment Credit';
                                    try {
                                      const d = JSON.parse(p.payoutMethodDetails);
                                      const type = (d.accountType || p.payoutMethod || '').toUpperCase();
                                      const detail = d.accountNumber || d.upiId || d.paypalEmail || d.cryptoAddress || p.payoutMethodDetails;
                                      return type ? `${type} (${detail})` : detail;
                                    } catch (e) {
                                      return p.payoutMethodDetails;
                                    }
                                  })()}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <p className={`text-sm md:text-2xl font-black tracking-tight ${p.type === 'withdrawal' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {p.type === 'withdrawal' ? '-' : '+'}{formatMoney(p.amount, currency)}
                              </p>
                              <div className={`inline-flex items-center gap-1 px-2 md:px-3 py-0.5 md:py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest mt-1 md:mt-2 ${p.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                p.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                  'bg-rose-50 text-rose-600'
                                }`}>
                                {p.status === 'completed' ? <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3" /> : <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />}
                                {p.status}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}