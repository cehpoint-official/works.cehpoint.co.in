// pages/admin/payments.tsx
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
    Clock,
    CheckCircle2,
    XCircle,
    Copy,
    History,
    Filter,
    Search,
    ExternalLink,
    ShieldCheck,
    CreditCard,
    Smartphone,
    Briefcase,
    Bitcoin,
    AlertCircle,
    User as UserIcon,
    ChevronRight,
    ArrowRight,
    Waves,
    Zap
} from "lucide-react";

import Layout from "../../components/Layout";
import Card from "../../components/Card";
import Button from "../../components/Button";

import { storage } from "../../utils/storage";
import type { User, Payment, Currency } from "../../utils/types";

const INR_RATE = 89;

function formatMoney(amountUsd: number, currency: Currency): string {
    const symbol = currency === "INR" ? "₹" : "$";
    const converted = currency === "INR" ? amountUsd * INR_RATE : amountUsd;
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export default function AdminPayments() {
    const router = useRouter();

    const [currentAdmin, setCurrentAdmin] = useState<User | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [currency, setCurrency] = useState<Currency>("USD");

    const [filterType, setFilterType] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const [activeTab, setActiveTab] = useState<'history' | 'requests'>('history');

    useEffect(() => {
        const init = async () => {
            const user = storage.getCurrentUser();
            if (!user || user.role !== "admin") {
                router.replace("/admin/login");
                return;
            }
            setCurrentAdmin(user);
            setCurrency(user.preferredCurrency || "USD");
            await loadData();
        };
        init();
    }, [router]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [allPayments, allUsers] = await Promise.all([
                storage.getPayments(),
                storage.getUsers()
            ]);
            setPayments(allPayments.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            }));
            setUsers(allUsers);
        } catch (err) {
            toast.error("Failed to load records.");
        } finally {
            setLoading(false);
        }
    };

    const handleApproveWithdrawal = async (paymentId: string) => {
        if (!currentAdmin) return;
        try {
            setBusy(true);
            const payment = payments.find(p => p.id === paymentId);
            if (!payment) return;

            const worker = users.find(u => u.id === payment.userId);
            if (!worker) {
                toast.error("User not found.");
                return;
            }

            if (worker.balance < payment.amount) {
                toast.error("Insufficient user balance.");
                return;
            }

            await storage.updatePayment(paymentId, {
                status: "completed",
                completedAt: new Date().toISOString()
            });

            const newBalance = (worker.balance || 0) - payment.amount;
            await storage.updateUser(worker.id, { balance: newBalance });

            await storage.createNotification({
                userId: worker.id,
                title: "Withdrawal Successful",
                message: `Your withdrawal of ${formatMoney(payment.amount, worker.preferredCurrency || "USD")} has been processed and sent.`,
                type: "success",
                read: false,
                createdAt: new Date().toISOString(),
                link: "/payments"
            });

            toast.success("Withdrawal approved.");
            await loadData();
        } catch (err) {
            toast.error("Transaction failed.");
        } finally {
            setBusy(false);
        }
    };

    const handleRejectWithdrawal = async (paymentId: string) => {
        const reason = prompt("Enter rejection reason (sent to user):");
        if (reason === null) return;

        try {
            setBusy(true);
            const payment = payments.find(p => p.id === paymentId);
            if (!payment) return;

            await storage.updatePayment(paymentId, {
                status: "failed",
                completedAt: new Date().toISOString()
            });

            await storage.createNotification({
                userId: payment.userId,
                title: "Withdrawal Rejected",
                message: `Your withdrawal request was rejected. Reason: ${reason || "No reason provided"}`,
                type: "error",
                read: false,
                createdAt: new Date().toISOString(),
                link: "/payments"
            });

            toast.success("Request rejected.");
            await loadData();
        } catch (err) {
            toast.error("Process failed.");
        } finally {
            setBusy(false);
        }
    };

    const pendingWithdrawals = payments.filter(p => p.status === "pending" && p.type === "withdrawal");

    const filteredPayments = payments.filter(p => {
        const user = users.find(u => u.id === p.userId);
        const userName = user?.fullName || "";
        const userEmail = user?.email || "";
        const matchesSearch = userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.id.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType = filterType === "all" || p.type === filterType;
        const matchesStatus = filterStatus === "all" || p.status === filterStatus;

        return matchesSearch && matchesType && matchesStatus;
    });

    const totalPayoutVolume = payments
        .filter(p => p.status === "completed" && (p.type === "task-payment" || p.type === "manual" || p.type === "bonus"))
        .reduce((s, p) => s + p.amount, 0);

    const totalWithdrawalVolume = payments
        .filter(p => p.status === "completed" && p.type === "withdrawal")
        .reduce((s, p) => s + p.amount, 0);

    if (loading || !currentAdmin) return null;

    return (
        <Layout>
            <Head>
                <title>Payment Hub - Cehpoint Admin</title>
            </Head>

            <div className="max-w-[1400px] mx-auto space-y-10 pb-24">
                {/* HERO STATS */}
                <section className="bg-slate-950 rounded-[2.5rem] p-12 text-white border border-white/5 relative overflow-hidden shadow-2xl shadow-slate-950/20">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px] -mr-40 -mt-20" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] -ml-20 -mb-20" />

                    <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
                                <Zap size={14} className="text-amber-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Financial Engine v2.0</span>
                            </div>
                            <h1 className="text-5xl font-black font-outfit uppercase tracking-tight leading-none">Payment <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">Terminal.</span></h1>
                            <p className="text-slate-400 text-base max-w-xl font-medium leading-relaxed">Centralized liquidity management and institutional-grade transaction auditing for the Cehpoint ecosystem.</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 lg:gap-8">
                            <div className="flex-auto min-w-fit bg-white/5 border border-white/10 px-8 py-7 rounded-[2rem] backdrop-blur-md">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Total Payout Volume</p>
                                <p className="text-xl md:text-2xl lg:text-3xl font-black text-white tracking-tight leading-none whitespace-nowrap">
                                    {formatMoney(totalPayoutVolume, currency)}
                                </p>
                            </div>
                            <div className="flex-auto min-w-fit bg-white/5 border border-white/10 px-8 py-7 rounded-[2rem] backdrop-blur-md">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Total Liquidated</p>
                                <p className="text-xl md:text-2xl lg:text-3xl font-black text-rose-500 tracking-tight leading-none whitespace-nowrap">
                                    {formatMoney(totalWithdrawalVolume, currency)}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* TAB NAVIGATION & CONTROLS */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 sticky top-24 z-40 bg-[#FDFDFF]/90 backdrop-blur-2xl py-6 px-4 rounded-[2.5rem]">
                    <div className="flex p-1.5 bg-slate-200/40 rounded-full border border-slate-200/60 backdrop-blur-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-10 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-3 ${activeTab === 'history' ? 'bg-white text-slate-950 shadow-xl shadow-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <History size={16} /> History
                        </button>
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`px-10 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-3 relative ${activeTab === 'requests' ? 'bg-white text-slate-950 shadow-xl shadow-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Clock size={16} /> Requests
                            {pendingWithdrawals.length > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-rose-500 rounded-full border-[4px] border-[#FDFDFF] flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-rose-500/20"
                                >
                                    {pendingWithdrawals.length}
                                </motion.span>
                            )}
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 flex-1 justify-end">
                        {activeTab === 'history' && (
                            <div className="relative group flex-1 max-w-md">
                                <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-950 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Filter Ledger records..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-14 pr-6 h-14 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:shadow-xl focus:shadow-indigo-500/5 transition-all text-sm font-bold"
                                />
                            </div>
                        )}
                        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 backdrop-blur-md">
                            <button
                                onClick={() => setCurrency('USD')}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all duration-300 ${currency === 'USD' ? 'bg-white text-slate-900 shadow-xl shadow-slate-200 active:scale-95' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                USD
                            </button>
                            <button
                                onClick={() => setCurrency('INR')}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all duration-300 ${currency === 'INR' ? 'bg-white text-slate-900 shadow-xl shadow-slate-200 active:scale-95' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                INR
                            </button>
                        </div>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'requests' ? (
                        <motion.div
                            key="requests-view"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-6"
                        >
                            {pendingWithdrawals.length === 0 ? (
                                <div className="py-40 text-center bg-white rounded-[3.5rem] border-2 border-dashed border-slate-100 shadow-sm flex flex-col items-center">
                                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8 border border-slate-50">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <p className="text-slate-900 font-black uppercase tracking-[0.3em] text-lg">Clear Workspace</p>
                                    <p className="text-slate-400 text-xs font-bold mt-3 uppercase tracking-widest leading-relaxed">No pending liquidation requests require your attention at this time.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="flex items-center gap-4 px-6 mb-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em]">Awaiting Professional Audit</span>
                                    </div>
                                    {pendingWithdrawals.map((payment) => {
                                        const worker = users.find(u => u.id === payment.userId);
                                        return (
                                            <motion.div
                                                layout
                                                key={payment.id}
                                                className="group relative bg-white border-2 border-amber-100 rounded-[3rem] p-10 hover:shadow-2xl hover:shadow-amber-500/10 transition-all flex flex-col xl:flex-row xl:items-center gap-10"
                                            >
                                                <div className="flex items-center gap-6 flex-1 min-w-0">
                                                    <div className="w-20 h-20 rounded-3xl bg-slate-950 text-white flex items-center justify-center font-black text-3xl shadow-2xl shadow-slate-900/40 shrink-0">
                                                        {worker?.fullName.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="text-[10px] font-black bg-amber-500 text-white px-3 py-1 rounded-full tracking-widest">REQUEST</span>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: #{payment.id.slice(-8)}</span>
                                                        </div>
                                                        <p className="font-black text-slate-900 text-2xl truncate">{worker?.fullName || 'Active Member'}</p>
                                                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{worker?.email}</p>
                                                    </div>
                                                </div>

                                                <div className="flex-1 bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100">
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-950 shadow-sm border border-slate-100">
                                                            {payment.payoutMethod === 'upi' && <Smartphone size={22} />}
                                                            {payment.payoutMethod === 'bank' && <CreditCard size={22} />}
                                                            {payment.payoutMethod === 'paypal' && <Briefcase size={22} />}
                                                            {payment.payoutMethod === 'crypto' && <Bitcoin size={22} />}
                                                            {!payment.payoutMethod && <ArrowRight size={22} />}
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-0.5">Payment Methodology</p>
                                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{payment.payoutMethod || 'Standard'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-3 mb-2 px-1">
                                                            <div className="w-1 h-4 bg-slate-900 rounded-full" />
                                                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Account Specification</span>
                                                        </div>

                                                        {(() => {
                                                            try {
                                                                // Layer 1: Try to parse the transaction payload
                                                                let details = null;
                                                                try {
                                                                    details = JSON.parse(payment.payoutMethodDetails || '{}');
                                                                } catch (e) { /* ignore */ }

                                                                // Layer 2: If legacy (string), try to find a matching account in the worker's history
                                                                let accountSource = (details && details.accountType) ? details : null;
                                                                let isSyncedFromProfile = false;

                                                                if (!accountSource && worker?.payoutAccounts) {
                                                                    // Deep search for a matching account number/UPI in the worker's profile
                                                                    const raw = payment.payoutMethodDetails.toLowerCase();
                                                                    const match = worker.payoutAccounts.find(acc =>
                                                                        raw.includes(acc.accountNumber?.toLowerCase()) ||
                                                                        (acc.upiId && raw.includes(acc.upiId.toLowerCase()))
                                                                    );
                                                                    if (match) {
                                                                        accountSource = match;
                                                                        isSyncedFromProfile = true;
                                                                    }
                                                                }

                                                                // Final Fallback: use the legacy account if no match found
                                                                if (!accountSource) accountSource = worker?.payoutAccount;

                                                                return (
                                                                    <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                                                                        <div className="divide-y divide-slate-50">
                                                                            {/* Dynamic Detail Mapping */}
                                                                            {payment.payoutMethod === 'bank' ? (
                                                                                <>
                                                                                    <DetailRow label="Account Holder" value={details?.accountHolderName || accountSource?.accountHolderName} />
                                                                                    <DetailRow label="Bank Name" value={details?.bankName || accountSource?.bankName} />
                                                                                    <DetailRow label="Account Number" value={details?.bankAccountNumber || accountSource?.bankAccountNumber || (payment.payoutMethodDetails.includes('(') ? payment.payoutMethodDetails.split('(')[1].replace(')', '') : payment.payoutMethodDetails)} copy />
                                                                                    <DetailRow label="IFSC Code" value={details?.bankIfsc || accountSource?.bankIfsc} copy />
                                                                                </>
                                                                            ) : payment.payoutMethod === 'upi' ? (
                                                                                <DetailRow label="UPI Address" value={details?.upiId || accountSource?.upiId || payment.payoutMethodDetails} copy />
                                                                            ) : payment.payoutMethod === 'paypal' ? (
                                                                                <DetailRow label="PayPal Email" value={details?.paypalEmail || accountSource?.paypalEmail || payment.payoutMethodDetails} copy />
                                                                            ) : (
                                                                                <DetailRow label="Identifier" value={payment.payoutMethodDetails} copy />
                                                                            )}
                                                                        </div>

                                                                        {isSyncedFromProfile && (
                                                                            <div className="px-6 py-3 bg-indigo-50/50 border-t border-indigo-100/50 flex items-center gap-2">
                                                                                <ShieldCheck size={12} className="text-indigo-600" />
                                                                                <span className="text-[9px] font-black text-indigo-600/60 uppercase tracking-widest">Profile Metadata Synced</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            } catch (e) {
                                                                return (
                                                                    <div className="p-6 bg-white rounded-2xl border border-slate-100">
                                                                        <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Legacy Spec</p>
                                                                        <p className="text-sm font-black text-slate-900">{payment.payoutMethodDetails}</p>
                                                                    </div>
                                                                );
                                                            }
                                                        })()}
                                                    </div>
                                                </div>

                                                <div className="xl:text-right shrink-0">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Liquidate Amount</p>
                                                    <p className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3 whitespace-nowrap">
                                                        {formatMoney(payment.amount, currency)}
                                                    </p>
                                                    <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-amber-50 text-amber-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-amber-100">
                                                        <Clock size={12} strokeWidth={3} /> {payment.createdAt ? format(new Date(payment.createdAt), 'MMM dd, HH:mm') : 'Just Now'}
                                                    </div>
                                                </div>

                                                <div className="flex xl:flex-col gap-5 shrink-0 px-8 border-l border-slate-100/50">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <button
                                                            disabled={busy}
                                                            onClick={() => handleApproveWithdrawal(payment.id)}
                                                            className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 hover:shadow-[0_12px_40px_rgba(16,185,129,0.4)] active:scale-90 transition-all shadow-xl shadow-emerald-500/20 group/verified"
                                                            title="Confirm Settlement"
                                                        >
                                                            <CheckCircle2 size={28} strokeWidth={2.5} className="group-hover/verified:rotate-12 transition-transform" />
                                                        </button>
                                                        <span className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">Approve</span>
                                                    </div>

                                                    <div className="flex flex-col items-center gap-2">
                                                        <button
                                                            disabled={busy}
                                                            onClick={() => handleRejectWithdrawal(payment.id)}
                                                            className="w-16 h-16 rounded-full bg-white border-2 border-rose-100 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white hover:border-rose-500 hover:shadow-[0_12px_40px_rgba(244,63,94,0.3)] active:scale-90 transition-all shadow-sm group/deny"
                                                            title="Reject Request"
                                                        >
                                                            <XCircle size={28} strokeWidth={2.5} className="group-hover/deny:rotate-12 transition-transform" />
                                                        </button>
                                                        <span className="text-[10px] font-black text-rose-500/60 uppercase tracking-widest">Decline</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="history-view"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-5"
                        >
                            {filteredPayments.length === 0 ? (
                                <div className="py-40 text-center bg-white rounded-[3rem] border-2 border-slate-50 flex flex-col items-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                                        <History size={32} />
                                    </div>
                                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No ledger entries matching your current filters.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {filteredPayments.map((payment) => {
                                        const worker = users.find(u => u.id === payment.userId);
                                        const isWithdrawal = payment.type === 'withdrawal';
                                        const isPending = payment.status === 'pending';

                                        return (
                                            <div
                                                key={payment.id}
                                                className={`group relative bg-white border rounded-[2rem] p-7 transition-all hover:bg-slate-50/50 hover:border-slate-300 flex flex-col lg:flex-row lg:items-center gap-8 ${isPending ? 'border-amber-200/50' : 'border-slate-100/80 shadow-sm'}`}
                                            >
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all group-hover:rotate-12 ${isWithdrawal ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600 shadow-emerald-100'}`}>
                                                    {isWithdrawal ? <ArrowUpRight size={22} /> : <ArrowDownLeft size={22} />}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                                                        <span className="text-[9px] font-black bg-slate-900 text-white px-2.5 py-1 rounded-lg uppercase tracking-widest">ID: {payment.id.slice(-8)}</span>
                                                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-[0.2em] ${payment.type === 'task-payment' ? 'bg-indigo-600 text-white' :
                                                            payment.type === 'withdrawal' ? 'bg-rose-600 text-white' :
                                                                payment.type === 'manual' ? 'bg-blue-600 text-white' :
                                                                    'bg-amber-600 text-white'
                                                            }`}>{payment.type.replace('-', ' ')}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                            • {payment.createdAt ? format(new Date(payment.createdAt), 'MMM dd, HH:mm') : 'LEGACY'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-950 font-black border border-slate-200 shadow-sm">
                                                            {worker?.fullName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 leading-none">{worker?.fullName || 'System User'}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{worker?.email}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex-1 hidden xl:block">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Audit Target</p>
                                                    <p className="text-xs font-bold text-slate-600 bg-slate-100 px-4 py-2 rounded-xl inline-block border border-slate-200 max-w-[250px] truncate" title={payment.payoutMethodDetails}>
                                                        {(() => {
                                                            if (!payment.payoutMethodDetails) return 'INTERNAL SETTLEMENT';
                                                            try {
                                                                const d = JSON.parse(payment.payoutMethodDetails);
                                                                const type = (d.accountType || payment.payoutMethod || '').toUpperCase();
                                                                const detail = d.bankAccountNumber || d.accountNumber || d.upiId || d.paypalEmail || d.cryptoAddress || payment.payoutMethodDetails;
                                                                return type ? `${type} (${detail})` : detail;
                                                            } catch (e) {
                                                                return payment.payoutMethodDetails;
                                                            }
                                                        })()}
                                                    </p>
                                                </div>

                                                <div className="lg:text-right shrink-0">
                                                    <p className={`text-lg md:text-xl lg:text-2xl font-black tracking-tighter whitespace-nowrap ${isWithdrawal ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                        {isWithdrawal ? '-' : '+'}{formatMoney(payment.amount, currency)}
                                                    </p>
                                                    <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors ${payment.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                                        payment.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                                            'bg-rose-50 text-rose-600'
                                                        }`}>
                                                        {payment.status === 'completed' ? <CheckCircle2 size={12} strokeWidth={3} /> : payment.status === 'pending' ? <Clock size={12} strokeWidth={3} /> : <XCircle size={12} strokeWidth={3} />}
                                                        {payment.status}
                                                    </div>
                                                </div>

                                                <div className="hidden lg:flex items-center gap-2 border-l border-slate-100 pl-8 h-12">
                                                    {isPending && isWithdrawal ? (
                                                        <button
                                                            onClick={() => setActiveTab('requests')}
                                                            className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-lg shadow-amber-500/20"
                                                            title="Action Required"
                                                        >
                                                            <Clock size={22} />
                                                        </button>
                                                    ) : (
                                                        <div className="w-12 h-12 flex items-center justify-center text-slate-200">
                                                            <ArrowRight size={22} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Layout>
    );
}

function DetailRow({ label, value, copy }: { label: string; value?: string; copy?: boolean }) {
    if (!value) return (
        <div className="px-6 py-4 flex items-center justify-between group">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            <span className="text-[11px] font-bold text-rose-300 uppercase tracking-tighter">Not Provided</span>
        </div>
    );

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        toast.success(`${label} copied!`, {
            icon: '📋',
            style: {
                borderRadius: '12px',
                background: '#1e293b',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
            }
        });
    };

    return (
        <div className="px-6 py-4 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            <div className="flex items-center gap-3 cursor-pointer" onClick={copy ? handleCopy : undefined}>
                <span className={`text-[12px] font-black text-slate-900 tracking-tight ${copy ? 'group-hover:text-indigo-600 transition-colors' : ''}`}>
                    {value}
                </span>
                {copy && <Copy size={12} className="text-slate-300 group-hover:text-indigo-600 transition-all" />}
            </div>
        </div>
    );
}

function DetailField({ label, value, copy, full }: { label: string; value?: string; copy?: boolean; full?: boolean }) {
    if (!value) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        toast.success(`${label} copied!`, {
            icon: '📋',
            style: {
                borderRadius: '12px',
                background: '#1e293b',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
            }
        });
    };

    return (
        <div className={`space-y-1 ${full ? 'col-span-2' : ''}`}>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <div className="flex items-center gap-2 group/field cursor-pointer" onClick={copy ? handleCopy : undefined}>
                <p className={`text-[13px] font-black text-slate-900 truncate tracking-tight ${copy ? 'group-hover/field:text-indigo-600 transition-colors' : ''}`}>
                    {value}
                </p>
                {copy && (
                    <Copy size={12} className="text-slate-300 group-hover/field:text-indigo-600 group-hover/field:scale-110 transition-all" />
                )}
            </div>
        </div>
    );
}


