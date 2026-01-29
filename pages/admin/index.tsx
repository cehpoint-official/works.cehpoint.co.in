import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import Head from "next/head";

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
  Banknote
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
        toast.error("Telemetry failed to sync.");
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
          <p className="font-semibold text-indigo-600 tracking-wider text-xs uppercase">Syncing Dashboard...</p>
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
      toast.success(`Currency shifted to ${value}`);
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
        <title>Command Hub | Admin</title>
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
                <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Zero Specialist Data</p>
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
                <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Zero Mission Logs</p>
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
      </div>
    </Layout>
  );
}
