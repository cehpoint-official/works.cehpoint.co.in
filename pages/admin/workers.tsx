import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import Head from "next/head";

import Layout from "../../components/Layout";
import Card from "../../components/Card";
import Button from "../../components/Button";

import { storage } from "../../utils/storage";
import type { User, Payment, Currency } from "../../utils/types";

import {
  Zap,
  Wallet,
  ShieldCheck,
  Users,
  UserPlus,
  ShieldAlert,
  Search,
  Banknote,
  AtSign,
  Phone,
  Ban
} from "lucide-react";

const INR_RATE = 89;

function formatMoney(amountUsd: number, currency: Currency): string {
  const converted = currency === "INR" ? amountUsd * INR_RATE : amountUsd;
  const symbol = currency === "INR" ? "₹" : "$";
  return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Workers() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [workers, setWorkers] = useState<User[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Payment[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "pending" | "suspended">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [currency, setCurrency] = useState<Currency>("USD");
  const [updatingCurrency, setUpdatingCurrency] = useState(false);

  useEffect(() => {
    const currentUser = storage.getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      router.push("/login");
      return;
    }

    setUser(currentUser);
    setCurrency(currentUser.preferredCurrency || "USD");

    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadWorkers(), loadWithdrawalRequests()]);
    } catch (e) {
      toast.error("Data sync failure.");
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyChange = async (value: Currency) => {
    if (!user || value === currency) return;
    setCurrency(value);
    setUpdatingCurrency(true);
    try {
      await storage.updateUser(user.id, { preferredCurrency: value });
      const updatedUser = { ...user, preferredCurrency: value };
      storage.setCurrentUser(updatedUser);
      setUser(updatedUser);
      toast.success(`Currency Node: ${value}`);
    } catch (err) {
      toast.error("Shift failed.");
    } finally {
      setUpdatingCurrency(false);
    }
  };

  const loadWorkers = async () => {
    const allUsers = await storage.getUsers();
    setWorkers(allUsers.filter((u) => u.role === "worker"));
  };

  const loadWithdrawalRequests = async () => {
    const payments = await storage.getPayments();
    const pending = payments.filter(
      (p) => p.type === "withdrawal" && p.status === "pending"
    );
    setPendingWithdrawals(pending);
  };

  const performApproveWithdrawal = async (payment: Payment) => {
    try {
      const worker = await storage.getUserById(payment.userId);
      if (!worker) return toast.error("Worker not found.");
      if (worker.balance < payment.amount) return toast.error("Insufficient worker balance.");

      await storage.updateUser(worker.id, { balance: worker.balance - payment.amount });
      await storage.updatePayment(payment.id!, {
        status: "completed",
        completedAt: new Date().toISOString(),
      });

      await storage.createNotification({
        userId: worker.id,
        title: "Withdrawal Successful",
        message: `Your withdrawal of ${payment.amount.toFixed(2)} USD has been approved and sent.`,
        type: "success",
        read: false,
        createdAt: new Date().toISOString(),
        link: "/payments"
      }).catch(e => console.error("Notification failed", e));

      await loadData();
      toast.success("Payment successfully sent.");
    } catch (err) {
      toast.error("Payment failed.");
    }
  };

  const performRejectWithdrawal = async (payment: Payment) => {
    try {
      await storage.updatePayment(payment.id!, { status: "failed" });

      await storage.createNotification({
        userId: payment.userId,
        title: "Withdrawal Rejected",
        message: `Your withdrawal request for ${payment.amount.toFixed(2)} USD was declined.`,
        type: "error",
        read: false,
        createdAt: new Date().toISOString(),
        link: "/payments"
      }).catch(e => console.error("Notification failed", e));

      await loadWithdrawalRequests();
      toast.success("Payment request rejected.");
    } catch (err) {
      toast.error("Action failed.");
    }
  };

  const handleApprove = async (workerId: string) => {
    await storage.updateUser(workerId, { accountStatus: "active" });

    await storage.createNotification({
      userId: workerId,
      title: "Account Activated",
      message: "Congratulations! Your Cehpoint worker account has been approved. You can now accept missions.",
      type: "success",
      read: false,
      createdAt: new Date().toISOString(),
      link: "/dashboard"
    }).catch(e => console.error("Notification failed", e));

    await loadWorkers();
    toast.success("Worker approved successfully.");
  };

  const handleSuspend = async (workerId: string) => {
    await storage.updateUser(workerId, { accountStatus: "suspended" });
    await loadWorkers();
    toast.error("Worker has been suspended.");
  };

  const handleTerminate = async (workerId: string) => {
    if (!confirm("DELETE WORKER: This will permanently remove their account. Continue?")) return;
    await storage.updateUser(workerId, { accountStatus: "terminated" });
    await loadWorkers();
    toast.error("Worker removed from system.");
  };

  const filteredWorkers = workers.filter((w) => {
    const matchesFilter = filter === "all" || w.accountStatus === filter;
    const matchesSearch = !searchQuery ||
      w.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (!user || loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-semibold text-indigo-600 tracking-wider text-xs uppercase">Syncing Workers...</p>
        </div>
      </Layout>
    );
  }

  const stats = [
    { label: "Total Workers", value: workers.length, icon: Users, theme: "bg-gray-900 text-white" },
    { label: "Active Team", value: workers.filter(w => w.accountStatus === "active").length, icon: Zap, theme: "bg-indigo-600 text-white shadow-indigo-100 shadow-lg" },
    { label: "New Requests", value: workers.filter(w => w.accountStatus === "pending").length, icon: UserPlus, theme: "bg-amber-500 text-white shadow-amber-100 shadow-lg" },
    { label: "Suspended", value: workers.filter(w => w.accountStatus === "suspended").length, icon: ShieldAlert, theme: "bg-white text-gray-900 border-gray-100" },
  ];

  return (
    <Layout>
      <Head>
        <title>Manage Workers | Admin</title>
      </Head>

      <div className="max-w-[1400px] mx-auto space-y-12 pb-20">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Workers</h1>
            <p className="text-sm text-gray-500">Manage your team members and account status.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search workers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-11 pr-4 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-600 transition-all shadow-sm"
              />
            </div>
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
              disabled={updatingCurrency}
              className="bg-white px-4 h-10 border border-gray-200 rounded-xl font-bold text-xs uppercase outline-none shadow-sm focus:border-indigo-600 transition-all cursor-pointer"
            >
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className={`p-6 rounded-2xl border ${stat.theme} transition-all hover:shadow-lg duration-300`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-70 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md">
                  <stat.icon size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* WITHDRAWALS */}
        {pendingWithdrawals.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
                <Banknote size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Payment Requests</h2>
                <p className="text-xs text-gray-400 mt-0.5">Pending payout approvals</p>
              </div>
            </div>

            <div className="space-y-4">
              {pendingWithdrawals.map((p) => {
                const w = workers.find((u) => u.id === p.userId);
                return (
                  <div key={p.id} className="p-6 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-white hover:shadow-md transition-all group">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-gray-900 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                          {w?.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{w?.fullName || "Unknown Worker"}</p>
                          <div className="flex items-center gap-2.5 mt-0.5 text-[11px]">
                            <span className="font-bold text-emerald-600 uppercase">{formatMoney(p.amount, currency)} Request</span>
                            <div className="w-1 h-1 bg-gray-200 rounded-full" />
                            <span className="font-medium text-gray-500 uppercase">Balance: {formatMoney(w?.balance || 0, currency)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-8 text-[11px]">
                        <div>
                          <p className="text-gray-400 uppercase mb-0.5">Method</p>
                          <p className="text-gray-900 font-bold uppercase">{p.payoutMethod || "MANUAL"}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 uppercase mb-0.5">Destination</p>
                          <p className="text-gray-900 font-bold truncate max-w-[150px]">
                            {p.payoutMethod === 'upi' ? (w?.payoutAccount?.upiId || p.payoutMethodDetails) :
                              p.payoutMethod === 'bank' ? w?.payoutAccount?.bankAccountNumber :
                                (p.payoutMethodDetails || "N/A")}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => performApproveWithdrawal(p)}
                          className="px-6 h-10 bg-emerald-600 text-white rounded-lg font-bold text-xs uppercase transition-all hover:bg-emerald-700 active:scale-95"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => performRejectWithdrawal(p)}
                          className="px-6 h-10 bg-white border border-gray-200 text-gray-400 rounded-lg font-bold text-xs uppercase hover:bg-gray-50 transition-all active:scale-95"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WORKER LIST */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-6 px-4">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Worker Registry</h2>

            <div className="flex gap-2">
              {["all", "active", "pending", "suspended"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type as any)}
                  className={`px-4 h-9 rounded-lg font-bold text-[11px] uppercase tracking-wider border transition-all ${filter === type
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                    }`}
                >
                  {type} ({workers.filter(w => type === 'all' || w.accountStatus === type).length})
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            {filteredWorkers.map((worker) => (
              <div key={worker.id} className="bg-white border border-gray-100 rounded-[24px] p-8 shadow-sm hover:border-indigo-100 transition-all group">
                <div className="flex flex-col xl:flex-row justify-between gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-5 mb-6">
                      <div className="relative">
                        <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                          {worker.fullName.charAt(0)}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${worker.accountStatus === 'active' ? 'bg-emerald-500' : 'bg-gray-300'
                          }`}>
                          <ShieldCheck size={12} className="text-white" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-gray-900 tracking-tight">{worker.fullName}</h3>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${worker.accountStatus === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            worker.accountStatus === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              'bg-rose-50 text-rose-700 border-rose-100'
                            }`}>
                            {worker.accountStatus}
                          </span>
                        </div>
                        <div className="flex gap-4 mt-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                            <AtSign size={13} className="text-indigo-600/70" />
                            {worker.email}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                            <Phone size={13} className="text-indigo-600/70" />
                            {worker.phone}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Experience</p>
                        <p className="text-sm font-bold text-gray-900">{worker.experience}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Timezone</p>
                        <p className="text-sm font-bold text-gray-900">{worker.timezone}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Knowledge Score</p>
                        <p className="text-sm font-bold text-indigo-600">{worker.knowledgeScore}%</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Net Balance</p>
                        <p className="text-sm font-bold text-emerald-600">{formatMoney(worker.balance, currency)}</p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {Array.isArray(worker.skills) && worker.skills.map((s) => (
                        <span key={s} className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="xl:border-l xl:border-gray-100 xl:pl-8 flex xl:flex-col justify-end gap-2 min-w-[160px]">
                    {worker.accountStatus === "pending" && (
                      <button
                        onClick={() => handleApprove(worker.id)}
                        className="flex-1 xl:flex-none h-11 bg-emerald-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider hover:bg-emerald-700 transition-all active:scale-95"
                      >
                        Approve
                      </button>
                    )}

                    {worker.accountStatus === "active" && (
                      <button
                        onClick={() => handleSuspend(worker.id)}
                        className="flex-1 xl:flex-none h-11 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold text-[11px] uppercase tracking-wider hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Ban size={14} /> Suspend
                      </button>
                    )}

                    {worker.accountStatus !== "terminated" && (
                      <button
                        onClick={() => handleTerminate(worker.id)}
                        className="w-11 xl:w-full h-11 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all group/shred"
                      >
                        <ShieldAlert size={18} />
                        <span className="hidden xl:ml-2 xl:inline-block font-bold text-[11px] uppercase tracking-wider">Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
