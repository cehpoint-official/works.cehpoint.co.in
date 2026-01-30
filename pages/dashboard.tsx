// pages/dashboard.tsx
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";

import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";
import DailySubmissionForm from "../components/DailySubmission";
import SubmissionHistory from "../components/SubmissionHistory";

import { storage } from "../utils/storage";
import type { User, Task, DailySubmission, Currency } from "../utils/types";

import {
  DollarSign,
  IndianRupee,
  Briefcase,
  CheckCircle,
  Clock,
  Calendar,
  User as UserIcon,
  ChevronRight,
  TrendingUp,
  Award,
  Zap,
} from "lucide-react";

const INR_RATE = 89;

function formatMoney(amountUsd: number, currency: Currency): string {
  const symbol = currency === "INR" ? "₹" : "$";
  const converted = currency === "INR" ? amountUsd * INR_RATE : amountUsd;
  return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

type ProfileForm = {
  fullName: string;
  phone: string;
  experience: string;
  timezone: string;
  skills: string[];
};

const skillOptions = [
  "React", "Node.js", "Python", "Java", "PHP", "Angular", "Vue.js",
  "Video Editing", "Adobe Premiere", "After Effects",
  "UI/UX Design", "Graphic Design", "Content Writing", "Digital Marketing", "SEO",
];

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "daily-work">("overview");
  const [mySubmissions, setMySubmissions] = useState<DailySubmission[]>([]);

  const [currency, setCurrency] = useState<Currency>("USD");
  const [updatingCurrency, setUpdatingCurrency] = useState(false);

  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const current = storage.getCurrentUser();
    if (!current) {
      router.push("/login");
      return;
    }
    if (current.role !== "worker") {
      router.push("/admin");
      return;
    }

    setUser(current);
    setCurrency(current.preferredCurrency || "USD");

    setProfileForm({
      fullName: current.fullName || "",
      phone: current.phone || "",
      experience: current.experience || "",
      timezone: current.timezone || "",
      skills: current.skills || [],
    });

    loadData(current);
  }, []);

  const loadData = async (currentUser: User) => {
    const tasks = await storage.getTasks();
    setMyTasks(tasks.filter((t) => t.assignedTo === currentUser.id));
    setAvailableTasks(tasks.filter((t) => t.status === "available"));

    const subs = await storage.getSubmissionsByUser(currentUser.id);
    setMySubmissions(subs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  if (!user) return null;

  const handleCurrencyChange = async (value: Currency) => {
    if (!user || value === currency) return;
    setCurrency(value);
    setUpdatingCurrency(true);
    try {
      const updatedUser: User = { ...user, preferredCurrency: value };
      await storage.updateUser(user.id, { preferredCurrency: value });
      storage.setCurrentUser(updatedUser);
      setUser(updatedUser);
    } catch (err) {
      console.error(err);
      toast.error("Preference update failed.");
    } finally {
      setUpdatingCurrency(false);
    }
  };

  const stats = [
    { label: "Earnings", value: formatMoney(user.balance, currency), icon: currency === "INR" ? IndianRupee : DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Active Jobs", value: myTasks.filter((t) => t.status === "in-progress").length, icon: Briefcase, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Completed", value: myTasks.filter((t) => t.status === "completed").length, icon: CheckCircle, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Opportunities", value: availableTasks.length, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  const handleAcceptTask = async (taskId: string) => {
    await storage.updateTask(taskId, { status: "in-progress", assignedTo: user!.id });
    router.push("/tasks");
  };

  const handleProfileFieldChange = (field: keyof ProfileForm, value: string) => {
    if (profileForm) setProfileForm({ ...profileForm, [field]: value });
  };

  const handleSkillToggle = (skill: string) => {
    if (!profileForm) return;
    const skills = profileForm.skills.includes(skill)
      ? profileForm.skills.filter((s) => s !== skill)
      : [...profileForm.skills, skill];
    setProfileForm({ ...profileForm, skills });
  };

  const handleSaveProfile = async () => {
    if (!user || !profileForm) return;
    try {
      setSavingProfile(true);
      const updatePayload = { ...profileForm };
      await storage.updateUser(user.id, updatePayload);
      const updatedUser: User = { ...user, ...updatePayload };
      storage.setCurrentUser(updatedUser);
      setUser(updatedUser);
      toast.success("Profile Vetted & Updated");
    } catch (err) {
      toast.error("Profile sync failed");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Command Center - Cehpoint</title>
      </Head>

      <div className="max-w-[1400px] mx-auto space-y-8 pb-20">
        {/* PREMIUM HEADER AREA */}
        <section className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-10 md:p-14 text-white border border-white/5">
          {/* Animated Background Blobs */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -mr-40 -mt-20 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] -ml-20 -mb-20" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">System Online</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight"
              >
                Welcome, <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{user.fullName.split(' ')[0]}!</span>
              </motion.h1>
              <p className="text-slate-400 text-lg max-w-xl font-medium leading-relaxed">
                Your portal for elite project management and secure payouts. Let&apos;s build something extraordinary today.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-2xl backdrop-blur-xl">
                <div className="px-4 py-2">
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Currency</span>
                  <select
                    value={currency}
                    onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
                    disabled={updatingCurrency}
                    className="bg-transparent text-lg font-bold outline-none cursor-pointer"
                  >
                    <option className="text-slate-900" value="USD">USD ($)</option>
                    <option className="text-slate-900" value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => setShowProfile(!showProfile)}
                className="h-16 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <UserIcon size={18} />
                <span>Account Profile</span>
              </button>
            </div>
          </div>
        </section>

        {/* PROFILE DRAWER/PANEL */}
        <AnimatePresence>
          {showProfile && profileForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <Card className="border-indigo-100 bg-indigo-50/30">
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-indigo-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                      <Award size={20} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">Professional Identity</h2>
                  </div>
                  <button onClick={() => setShowProfile(false)} className="text-slate-400 hover:text-slate-600">
                    <Clock className="rotate-45" size={24} />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Name</label>
                    <input type="text" value={profileForm.fullName} onChange={(e) => handleProfileFieldChange("fullName", e.target.value)} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:border-indigo-600 outline-none transition-all font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Phone</label>
                    <input type="text" value={profileForm.phone} onChange={(e) => handleProfileFieldChange("phone", e.target.value)} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:border-indigo-600 outline-none transition-all font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Experience</label>
                    <input type="text" value={profileForm.experience} onChange={(e) => handleProfileFieldChange("experience", e.target.value)} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:border-indigo-600 outline-none transition-all font-medium" />
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vetted Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {skillOptions.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => handleSkillToggle(skill)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${profileForm.skills.includes(skill)
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white border-slate-100 text-slate-600 hover:border-slate-300"}`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-10 flex gap-4">
                  <Button onClick={handleSaveProfile} disabled={savingProfile} className="h-14 px-10 rounded-2xl shadow-lg">
                    {savingProfile ? "Syncing..." : "Secure & Save"}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:rotate-12`}>
                  <stat.icon size={24} />
                </div>
              </div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 bg-slate-100/50 backdrop-blur-md rounded-2xl border border-slate-200">
            {[
              { id: "overview", label: "Operations Hub", icon: TrendingUp },
              { id: "daily-work", label: "Mission Logs", icon: Calendar },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative flex items-center gap-3 px-8 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? "bg-white text-indigo-600 shadow-lg" : "text-slate-500 hover:text-slate-900"}`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB CONTENT */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: activeTab === 'overview' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-10"
        >
          {activeTab === "overview" ? (
            <div className="grid lg:grid-cols-2 gap-10">
              {/* STATUS CARDS */}
              <div className="space-y-6">
                {!user.demoTaskCompleted && (
                  <Card className="bg-amber-50 border-amber-200 p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                    <div className="flex items-start gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                        <Zap size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-amber-900 mb-1 tracking-tight">Vetting Stage Required</h3>
                        <p className="text-amber-700 font-medium mb-6">Complete your demo project to unlock enterprise-grade assignments and weekly earnings.</p>
                        <Button
                          variant="secondary"
                          onClick={() => router.push(user.primaryDomain ? "/demo-task" : "/demo-setup")}
                          className="px-8"
                        >
                          Initiate Demo
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {user.accountStatus === "pending" && (
                  <Card className="bg-blue-50 border-blue-200 p-8">
                    <div className="flex items-start gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                        <Award size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-blue-900 mb-1 tracking-tight">Assessment Review</h3>
                        <p className="text-blue-700 font-medium">Your credentials are being verified by our talent team. Full platform access will be granted shortly.</p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* MY ACTIVE TASKS */}
                <Card className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Deployments</h2>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">{myTasks.filter(t => t.status === 'in-progress').length} Running</span>
                  </div>

                  {myTasks.filter((t) => t.status === "in-progress").length === 0 ? (
                    <div className="py-20 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                      <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Zero Active Missions</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myTasks.filter((t) => t.status === "in-progress").map((task) => (
                        <div key={task.id} className="p-6 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all group">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">{task.category}</p>
                              <h3 className="text-lg font-black text-slate-900">{task.title}</h3>
                            </div>
                            <TrendingUp className="text-indigo-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={20} />
                          </div>
                          <div className="flex items-center justify-between mt-6">
                            <span className="text-lg font-black text-emerald-600">{formatMoney(task.weeklyPayout, currency)}<small className="text-[10px] font-bold text-slate-400 ml-1">/WEEK</small></span>
                            <Button onClick={() => router.push("/tasks")} className="h-11 px-6 rounded-xl">Control Center</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* AVAILABLE TASKS */}
              <div className="space-y-6">
                <Card className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">New Opportunities</h2>
                    <Zap className="text-amber-500 animate-pulse" size={20} />
                  </div>

                  {availableTasks.length === 0 ? (
                    <div className="py-20 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                      <Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Awaiting New Broadcasts</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {availableTasks.slice(0, 4).map((task) => (
                        <div key={task.id} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-xl transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-black text-slate-900 flex-1">{task.title}</h3>
                            <div className="flex gap-2">
                              {task.skills?.slice(0, 2).map((s: string) => (
                                <span key={s} className="px-2 py-1 bg-white border border-slate-200 text-[9px] font-bold text-slate-500 rounded-md uppercase tracking-wider">{s}</span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                            <span className="text-lg font-black text-emerald-600">{formatMoney(task.weeklyPayout, currency)}</span>
                            <Button onClick={() => handleAcceptTask(task.id)} disabled={!user.demoTaskCompleted} className="h-11 px-6 rounded-xl">Accept Slot</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-12">
              <DailySubmissionForm userId={user.id} onSubmit={() => loadData(user)} />
              <div className="space-y-6">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Submission History</h2>
                <SubmissionHistory submissions={mySubmissions} />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
