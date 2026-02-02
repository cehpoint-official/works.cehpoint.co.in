// pages/admin/workers.tsx
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import Head from "next/head";

import Layout from "../../components/Layout";
import Card from "../../components/Card";
import Button from "../../components/Button";

import { storage } from "../../utils/storage";
import type { User, Currency } from "../../utils/types";

import {
  Zap,
  ShieldCheck,
  Users,
  UserPlus,
  ShieldAlert,
  Search,
  AtSign,
  Phone,
  Ban,
  Link as LinkIcon,
  Banknote
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
  const [filter, setFilter] = useState<"all" | "active" | "pending" | "suspended">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [currency, setCurrency] = useState<Currency>("USD");
  const [updatingCurrency, setUpdatingCurrency] = useState(false);

  // 🔹 Manual Grant State
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantWorker, setGrantWorker] = useState<User | null>(null);
  const [grantAmount, setGrantAmount] = useState("");
  const [grantNote, setGrantNote] = useState("");
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    const currentUser = storage.getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      router.push("/admin/login");
      return;
    }

    setUser(currentUser);
    setCurrency(currentUser.preferredCurrency || "USD");

    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      await loadWorkers();
    } catch (e) {
      toast.error("Failed to load data.");
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
      toast.success(`Currency changed to: ${value}`);
    } catch (err) {
      toast.error("Change failed.");
    } finally {
      setUpdatingCurrency(false);
    }
  };

  const loadWorkers = async () => {
    const allUsers = await storage.getUsers();
    setWorkers(allUsers.filter((u) => u.role === "worker"));
  };

  const handleApprove = async (workerId: string) => {
    await storage.updateUser(workerId, {
      accountStatus: "active",
      demoTaskSubmission: "", // 🔹 Clear data to save storage
      demoTaskScore: 0         // 🔹 Reset score as it's no longer needed
    });

    await storage.createNotification({
      userId: workerId,
      title: "Account Activated",
      message: "Congratulations! Your Cehpoint worker account has been approved. You can now start working.",
      type: "success",
      read: false,
      createdAt: new Date().toISOString(),
      link: "/dashboard"
    }).catch(e => console.error("Notification failed", e));

    await loadWorkers();
    toast.success("Worker approved successfully.");
  };

  const handleSuspend = async (workerId: string) => {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;

    await storage.updateUser(workerId, { accountStatus: "suspended" });
    if (worker.email) {
      await storage.blockEmail(worker.email);
    }

    await storage.createNotification({
      userId: workerId,
      title: "Account Suspended",
      message: "Your account has been temporarily suspended due to a policy review. Your email is now blocked.",
      type: "warning",
      read: false,
      createdAt: new Date().toISOString()
    }).catch(e => console.error("Notification failed", e));
    await loadWorkers();
    toast.error("Worker suspended and email blocked.");
  };

  const handleTerminate = async (workerId: string) => {
    if (workerId === user?.id) return toast.error("You cannot remove yourself.");
    if (!confirm("CRITICAL: This will permanently delete this worker's account and ALL associated data (payments, tasks, logs). This cannot be undone. Continue?")) return;

    setLoading(true);
    try {
      await storage.deleteUserFull(workerId);
      toast.success("Worker and all related data purged.");
      await loadWorkers();
    } catch (e) {
      console.error(e);
      toast.error("Purge failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualGrant = async () => {
    if (!grantWorker || !grantAmount) return;
    const amt = parseFloat(grantAmount);
    if (isNaN(amt) || amt <= 0) return toast.error("Invalid amount");

    try {
      setGranting(true);
      const baseUsd = currency === "INR" ? amt / INR_RATE : amt;

      await storage.createPayment({
        userId: grantWorker.id,
        amount: baseUsd,
        type: "manual",
        status: "completed",
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        payoutMethodDetails: grantNote || "Manual Performance Grant"
      });

      await storage.updateUser(grantWorker.id, {
        balance: (grantWorker.balance || 0) + baseUsd
      });

      await storage.createNotification({
        userId: grantWorker.id,
        title: "Credit Received",
        message: `Admin has credited ${formatMoney(baseUsd, grantWorker.preferredCurrency || "USD")} to your balance. Note: ${grantNote || 'Manual Hub Entry'}`,
        type: "success",
        read: false,
        createdAt: new Date().toISOString(),
        link: "/payments"
      });

      toast.success("Funds sent successfully.");
      setShowGrantModal(false);
      setGrantAmount("");
      setGrantNote("");
      loadWorkers();
    } catch (e) {
      toast.error("Payment failed.");
    } finally {
      setGranting(false);
    }
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
          <p className="font-semibold text-indigo-600 tracking-wider text-xs uppercase">Loading Workers...</p>
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

        {/* WORKER LIST */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-6 px-4">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Worker List</h2>

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

                    <div className="grid md:grid-cols-5 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Experience</p>
                        <p className="text-sm font-bold text-gray-900">{worker.experience}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Timezone</p>
                        <p className="text-sm font-bold text-gray-900">{worker.timezone}</p>
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned Task</p>
                        <p className="text-sm font-bold text-indigo-600 truncate">{worker.primaryDomain || "Unset"}</p>
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

                    {worker.demoTaskSubmission && (
                      <div className="mt-6 p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl flex items-center justify-between group/demo">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <LinkIcon size={14} />
                          </div>
                          <div className="flex gap-8">
                            <div>
                              <p className="text-[10px] font-black text-indigo-900/40 uppercase tracking-widest leading-none mb-1 text-center">Assigned Scope</p>
                              <span className="text-[11px] font-black text-indigo-900 bg-indigo-100/50 px-2 py-0.5 rounded-md border border-indigo-200 uppercase tracking-tight block text-center">
                                {worker.primaryDomain || "General Task"}
                              </span>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-indigo-900/40 uppercase tracking-widest leading-none mb-1">Submission Artifact</p>
                              <a
                                href={worker.demoTaskSubmission}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 truncate max-w-[250px] block"
                              >
                                {worker.demoTaskSubmission}
                              </a>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-indigo-900/40 uppercase tracking-widest leading-none mb-1">AI Score</p>
                          <p className="text-sm font-black text-indigo-600">{worker.demoTaskScore}%</p>
                        </div>
                      </div>
                    )}

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
                        onClick={() => {
                          setGrantWorker(worker);
                          setShowGrantModal(true);
                        }}
                        className="flex-1 xl:flex-none h-11 bg-white border border-indigo-200 text-indigo-600 rounded-xl font-bold text-[11px] uppercase tracking-wider hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Banknote size={14} /> Add Funds
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

      {/* Manual Grant Modal */}
      {showGrantModal && grantWorker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900">Manual Payment</h3>
              <button onClick={() => setShowGrantModal(false)} className="text-slate-400 hover:text-slate-600">
                <ShieldAlert className="rotate-45" size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                  {grantWorker.fullName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{grantWorker.fullName}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{grantWorker.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Payment Amount ({currency})</label>
                <input
                  type="number"
                  value={grantAmount}
                  onChange={(e) => setGrantAmount(e.target.value)}
                  className="w-full h-14 px-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 transition-all font-black text-xl text-indigo-600"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Memo / Purpose</label>
                <input
                  type="text"
                  value={grantNote}
                  onChange={(e) => setGrantNote(e.target.value)}
                  className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 transition-all font-medium text-sm"
                  placeholder="e.g. Special Performance Bonus"
                />
              </div>

              <Button onClick={handleManualGrant} disabled={granting} className="w-full h-14 rounded-2xl shadow-xl shadow-indigo-600/20">
                {granting ? "Processing..." : "Confirm Payment"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
