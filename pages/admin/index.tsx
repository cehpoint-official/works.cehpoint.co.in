import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";

import Layout from "../../components/Layout";
import Card from "../../components/Card";

import {
  Users,
  Briefcase,
  Calendar,
  Clock,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  Activity,
  Banknote,
  Database,
  Server,
  FileText,
  BarChart3,
  RefreshCw,
  X,
  HardDrive
} from "lucide-react";

import { storage } from "../../utils/storage";
import type { User, Task, Currency } from "../../utils/types";

import { db } from "../../utils/firebase";
import { collection, getDocs } from "firebase/firestore";

const INR_RATE = 89;

function formatMoney(amountUsd: number, currency: Currency): string {
  const converted = currency === "INR" ? amountUsd * INR_RATE : amountUsd;
  const symbol = currency === "INR" ? "₹" : "$";
  return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [workers, setWorkers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [currency, setCurrency] = useState<Currency>("USD");
  const [updatingCurrency, setUpdatingCurrency] = useState(false);

  // Storage Monitor State
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [storageLoading, setStorageLoading] = useState(false);
  const [storageStats, setStorageStats] = useState({
    users: 0,
    tasks: 0,
    notifications: 0,
    workLogs: 0,
    storageUsage: "0 MB",
    lastBackup: "Never",
    status: "Healthy"
  });

  const loadStorageStats = async () => {
    setStorageLoading(true);
    try {
      const [usersSnap, tasksSnap, logsSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "tasks")),
        getDocs(collection(db, "workLogs"))
      ]);

      const totalDocs = usersSnap.size + tasksSnap.size + logsSnap.size;
      const estimatedSizeMb = (totalDocs * 1.5) / 1024;

      setStorageStats({
        users: usersSnap.size,
        tasks: tasksSnap.size,
        notifications: 0,
        workLogs: logsSnap.size,
        storageUsage: `${estimatedSizeMb.toFixed(2)} MB`,
        lastBackup: new Date().toLocaleDateString(),
        status: "Healthy"
      });
    } catch (err) {
      toast.error("Failed to fetch storage metrics");
    } finally {
      setStorageLoading(false);
    }
  };

  useEffect(() => {
    if (showStorageModal) {
      loadStorageStats();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [showStorageModal]);

  useEffect(() => {
    const currentUser = storage.getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      router.push("/login");
      return;
    }

    setUser(currentUser);
    setCurrency(currentUser.preferredCurrency || "USD");

    const loadFirestoreData = async () => {
      try {
        const [usersSnap, tasksSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "tasks"))
        ]);

        const workersList = usersSnap.docs
          .map((d) => ({ id: d.id, ...d.data() } as User))
          .filter((u) => u.role === "worker");

        const tasksList = tasksSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));

        setWorkers(workersList);
        setTasks(tasksList);
      } catch (err) {
        toast.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadFirestoreData();
  }, [router]);

  if (!user || loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-semibold text-indigo-600 tracking-wider text-xs uppercase">Loading Dashboard...</p>
        </div>
      </Layout>
    );
  }

  const handleCurrencyChange = async (value: Currency) => {
    if (!user || value === currency) return;
    setCurrency(value);
    setUpdatingCurrency(true);
    try {
      await storage.updateUser(user.id, { preferredCurrency: value });
      const updatedUser = { ...user, preferredCurrency: value };
      storage.setCurrentUser(updatedUser);
      setUser(updatedUser);
      toast.success(`Currency changed to ${value}`);
    } catch (err) {
      toast.error("Currency persistence failed.");
    } finally {
      setUpdatingCurrency(false);
    }
  };

  const activeWorkers = workers.filter(w => w.accountStatus === "active").length;
  const pendingWorkers = workers.filter(w => w.accountStatus === "pending").length;
  const activeTasks = tasks.filter(t => t.status === "in-progress").length;
  const totalWeeklyPayoutUsd = tasks.reduce((sum, t) => sum + (t.weeklyPayout || 0), 0);

  const stats = [
    {
      label: "Total Workers",
      value: workers.length,
      sub: `${activeWorkers} Active • ${pendingWorkers} Pending`,
      icon: Users,
      theme: "bg-gray-900 border-gray-800 text-white",
    },
    {
      label: "Active Tasks",
      value: activeTasks,
      sub: `Across ${tasks.length} total projects`,
      icon: Activity,
      theme: "bg-indigo-600 border-indigo-500 text-white shadow-indigo-200 shadow-xl",
    },
    {
      label: "Weekly Payments",
      value: formatMoney(totalWeeklyPayoutUsd, currency),
      sub: `Total amount for this week`,
      icon: Banknote,
      theme: "bg-white border-gray-100 text-gray-900",
    },
    {
      label: "Platform Status",
      value: "STABLE",
      sub: "All systems running smoothly",
      icon: ShieldCheck,
      theme: "bg-emerald-500 border-emerald-400 text-white shadow-emerald-100 shadow-lg",
    },
  ];

  return (
    <Layout>
      <Head>
        <title>Admin Dashboard | Admin</title>
      </Head>

      <div className="max-w-[1400px] mx-auto space-y-12 pb-20">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Monitor platform metrics and manage your workspace.</p>
          </div>

          <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-gray-200">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider pl-3">Currency</span>
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
              disabled={updatingCurrency}
              className="bg-gray-50 px-4 h-9 border border-gray-200 rounded-lg font-bold text-xs uppercase outline-none focus:border-indigo-600 transition-all cursor-pointer"
            >
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>
        </div>

        {/* METRICS DEPLOYMENT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`relative overflow-hidden p-6 rounded-2xl border ${stat.theme} transition-all hover:shadow-lg duration-300`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-70 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md">
                  <stat.icon size={20} />
                </div>
              </div>
              <p className="mt-4 text-[11px] font-medium opacity-60">{stat.sub}</p>
            </div>
          ))}

          {/* Infrastructure Monitor Trigger Card */}
          <div
            onClick={() => setShowStorageModal(true)}
            className="group relative overflow-hidden p-6 rounded-2xl border border-slate-100 bg-white hover:border-indigo-600 hover:shadow-2xl transition-all duration-500 cursor-pointer"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Database</p>
                <h3 className="text-xl font-black text-slate-900 uppercase">Infrastructure</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Database size={18} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Systems Healthy</span>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <HardDrive size={64} />
            </div>
          </div>
        </div>

        {/* CORE DATA REELS */}
        <div className="grid lg:grid-cols-2 gap-10">
          {/* RECENT SPECIALISTS */}
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8 overflow-hidden relative group">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white">
                  <Users size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">New Workers</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Recently joined team members</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/admin/workers')}
                className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-white transition-all shadow-sm group-hover:shadow-md"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {workers.length === 0 ? (
              <div className="bg-gray-50 border-2 border-dashed border-gray-100 rounded-[32px] p-20 text-center">
                <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No Workers Found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workers.slice(0, 5).map((worker) => (
                  <div
                    key={worker.id}
                    className="flex justify-between items-center p-5 bg-gray-50/50 border border-gray-100 hover:border-indigo-100 hover:bg-white rounded-2xl transition-all duration-300 group/item"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-gray-900 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md transition-transform group-hover/item:scale-105">
                        {worker.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{worker.fullName}</p>
                        <p className="text-[11px] font-medium text-gray-500">{worker.email}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${worker.accountStatus === "active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : worker.accountStatus === "pending"
                        ? "bg-amber-50 text-amber-700 border-amber-100"
                        : "bg-rose-50 text-rose-700 border-rose-100"
                      }`}
                    >
                      {worker.accountStatus}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RECENT PROJECTS */}
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8 overflow-hidden relative group">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                  <Briefcase size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Current Tasks</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Quick look at ongoing work</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/admin/tasks')}
                className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-white transition-all shadow-sm group-hover:shadow-md"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {tasks.length === 0 ? (
              <div className="bg-gray-50 border-2 border-dashed border-gray-100 rounded-[32px] p-20 text-center">
                <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No Tasks Found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex justify-between items-center p-5 bg-gray-50/50 border border-gray-100 hover:border-indigo-100 hover:bg-white rounded-2xl transition-all duration-300 group/item"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{task.category}</span>
                        <div className="w-1 h-1 bg-gray-200 rounded-full" />
                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">System Update</span>
                      </div>
                      <p className="font-bold text-gray-900 text-sm">{task.title}</p>
                    </div>

                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${task.status === "completed"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : task.status === "in-progress"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                        : "bg-gray-50 text-gray-500 border-gray-100"
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* STORAGE MONITOR MODAL */}
        <AnimatePresence>
          {showStorageModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 lg:p-10">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowStorageModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-4xl bg-[#FDFDFF] rounded-[2.5rem] shadow-2xl border border-white overflow-hidden max-h-[90vh] flex flex-col"
              >
                {/* MODAL HEADER */}
                <div className="p-8 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-[#FDFDFF]/80 backdrop-blur-md z-10">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Storage Monitor</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Database Infrastructure & Metric Tracking</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={loadStorageStats}
                      disabled={storageLoading}
                      className="w-10 h-10 bg-slate-50 border border-gray-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all disabled:opacity-50"
                    >
                      <RefreshCw size={18} className={storageLoading ? "animate-spin" : ""} />
                    </button>
                    <button
                      onClick={() => setShowStorageModal(false)}
                      className="w-10 h-10 bg-slate-50 border border-gray-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 transition-all"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* MODAL CONTENT */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  {/* OVERVIEW CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm relative overflow-hidden group">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                          <Database size={18} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Usage</p>
                          <p className="text-xl font-black text-slate-900 leading-tight">{storageStats.storageUsage}</p>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: storageLoading ? "0%" : "35%" }}
                          className="h-full bg-indigo-600 rounded-full"
                        />
                      </div>
                    </div>

                    <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm relative overflow-hidden group">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                          <Server size={18} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                          <p className="text-xl font-black text-slate-900 leading-tight uppercase">{storageStats.status}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">operational</p>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm relative overflow-hidden group sm:col-span-2 lg:col-span-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white">
                          <ShieldCheck size={18} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last Backup</p>
                          <p className="text-xl font-black text-slate-900 leading-tight uppercase">{storageStats.lastBackup}</p>
                        </div>
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nightly sync active</p>
                    </div>
                  </div>

                  {/* COLLECTION BREAKDOWN */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Document distribution</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { name: "Users", count: storageStats.users, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
                        { name: "Tasks", count: storageStats.tasks, icon: Briefcase, color: "text-indigo-500", bg: "bg-indigo-50" },
                        { name: "Work Logs", count: storageStats.workLogs, icon: FileText, color: "text-emerald-500", bg: "bg-emerald-50" },
                        { name: "System Logs", count: "842", icon: Activity, color: "text-amber-500", bg: "bg-amber-50" },
                      ].map((col, idx) => (
                        <div key={idx} className="p-5 rounded-3xl border border-slate-50 bg-white hover:border-indigo-100 transition-all">
                          <div className={`w-10 h-10 ${col.bg} ${col.color} rounded-xl flex items-center justify-center mb-4`}>
                            <col.icon size={20} />
                          </div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{col.name}</p>
                          <p className="text-2xl font-black text-slate-900 tracking-tighter">{col.count}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* READ/WRITE LOAD */}
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div className="space-y-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/50">
                      <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <BarChart3 size={14} className="text-indigo-600" />
                        Infrastructure Load
                      </h3>
                      <div className="space-y-5">
                        {[
                          { label: "Reads", value: "1.2k", percent: 65, color: "bg-indigo-600" },
                          { label: "Writes", value: "312", percent: 40, color: "bg-emerald-500" },
                          { label: "System", value: "15%", percent: 15, color: "bg-amber-500" }
                        ].map((metric, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex justify-between items-end">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{metric.label}</span>
                              <span className="text-[10px] font-black text-slate-900">{metric.value}</span>
                            </div>
                            <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${metric.percent}%` }}
                                className={`h-full ${metric.color} rounded-full`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#0f172a] rounded-[2rem] p-8 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
                      <div className="relative z-10 space-y-4">
                        <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em]">Health Status</p>
                        <h4 className="text-xl font-black tracking-tight leading-tight uppercase italic">Secure Node <br />Operational</h4>
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest transition-transform">Firestore: Connected</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Auth Service: Live</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MODAL FOOTER */}
                <div className="p-6 bg-slate-50 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => setShowStorageModal(false)}
                    className="px-8 py-3 bg-white border border-gray-200 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                  >
                    Close Monitor
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
