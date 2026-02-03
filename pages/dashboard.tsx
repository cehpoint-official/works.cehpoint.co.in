// pages/dashboard.tsx
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";

import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";
import { storage } from "../utils/storage";
import type { User, Task, Currency } from "../utils/types";
import { X as CloseIcon } from "lucide-react";

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
  ShieldCheck,
  Phone,
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

const TIMEZONE_OPTIONS = [
  { label: "India (IST, UTC+5:30)", value: "Asia/Kolkata" },
  { label: "UTC (Universal Time)", value: "UTC" },
  { label: "US Pacific (PT)", value: "America/Los_Angeles" },
  { label: "US Eastern (ET)", value: "America/New_York" },
  { label: "Europe (CET)", value: "Europe/Berlin" },
];

const EXPERIENCE_OPTIONS = [
  { label: "Beginner (1-2y)", value: "beginner" },
  { label: "Intermediate (3-5y)", value: "intermediate" },
  { label: "Expert (5y+)", value: "expert" },
];

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);

  const [currency, setCurrency] = useState<Currency>("USD");
  const [updatingCurrency, setUpdatingCurrency] = useState(false);

  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [skillSearch, setSkillSearch] = useState("");

  const handleAddCustomSkill = () => {
    const skill = newSkill.trim() || skillSearch.trim();
    if (skill && profileForm) {
      if (!profileForm.skills.includes(skill)) {
        setProfileForm({
          ...profileForm,
          skills: [...profileForm.skills, skill]
        });
      }
      setNewSkill("");
      setSkillSearch("");
    }
  };

  useEffect(() => {
    if (showProfile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [showProfile]);

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

    // 🔹 RE-FETCH USER FROM FIRESTORE TO GET LATEST STATUS
    const fetchLatestUser = async () => {
      try {
        const latestUser = await storage.getUserById(current.id);
        if (latestUser) {
          setUser(latestUser);
          storage.setCurrentUser(latestUser);
          loadData(latestUser);
        } else {
          loadData(current);
        }
      } catch (err) {
        console.error("Failed to fetch latest user data:", err);
        loadData(current);
      }
    };

    fetchLatestUser();
  }, []);

  const loadData = async (currentUser: User) => {
    const tasks = await storage.getTasks();
    const userId = currentUser.id;

    // Filter my active/assigned tasks
    setMyTasks(tasks.filter((t) =>
      t.assignedTo === userId ||
      t.assignedWorkerIds?.includes(userId)
    ));

    // Filter available opportunities - ONLY if worker is active
    if (currentUser.accountStatus !== "active") {
      setAvailableTasks([]);
    } else {
      setAvailableTasks(tasks.filter((t) => {
        if (t.status !== "available") return false;
        if (t.declinedBy?.includes(userId)) return false;

        // If no specific candidates targeted, it's open
        if (!Array.isArray(t.candidateWorkerIds) || t.candidateWorkerIds.length === 0) return true;
        // Or if I'm invited
        if (t.candidateWorkerIds.includes(userId)) return true;

        return false;
      }));
    }
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
    if (!user) return;
    try {
      const task = (await storage.getTasks()).find(t => t.id === taskId);
      if (!task) return;

      await storage.updateTask(taskId, {
        status: "in-progress",
        assignedTo: task.assignedTo || user.id,
        assignedWorkerIds: task.assignedWorkerIds?.length ? task.assignedWorkerIds : [user.id],
        assignedAt: task.assignedAt || new Date().toISOString()
      });
      toast.success("Task Accepted!");
      router.push("/tasks");
    } catch (err) {
      toast.error("Failed to accept task.");
    }
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
      if (profileForm.phone.length !== 10) {
        toast.error("Phone number must be exactly 10 digits");
        return;
      }
      setSavingProfile(true);
      const updatePayload = { ...profileForm };
      await storage.updateUser(user.id, updatePayload);
      const updatedUser: User = { ...user, ...updatePayload };
      storage.setCurrentUser(updatedUser);
      setUser(updatedUser);
      toast.success("Profile Updated");
    } catch (err) {
      toast.error("Profile sync failed");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Worker Dashboard - Cehpoint</title>
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
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Dashboard Ready</span>
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
                Your portal to manage tasks and view your earnings. Let&apos;s build something extraordinary today.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-2xl backdrop-blur-xl group hover:border-white/20 transition-all">
                <div className="px-4 py-2 border-r border-white/10">
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Currency</span>
                  <select
                    value={currency}
                    onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
                    disabled={updatingCurrency}
                    className="bg-transparent text-lg font-black outline-none cursor-pointer text-white"
                  >
                    <option className="text-slate-900" value="USD">USD ($)</option>
                    <option className="text-slate-900" value="INR">INR (₹)</option>
                  </select>
                </div>
                <div className="px-4 py-1 pr-6 hidden md:block">
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Account Status</span>
                  <span className="text-indigo-400 font-black text-sm uppercase tracking-tight">Verified</span>
                </div>
              </div>

              <button
                onClick={() => setShowProfile(!showProfile)}
                className="h-16 px-8 rounded-2xl bg-white text-slate-900 hover:bg-indigo-50 font-black text-sm uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/0 via-indigo-600/5 to-indigo-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                  <UserIcon size={16} />
                </div>
                <span>{showProfile ? 'Hide Profile' : 'Account Profile'}</span>
                <ChevronRight size={16} className={`text-slate-400 transition-transform duration-300 ${showProfile ? 'rotate-90' : ''}`} />
              </button>
            </div>
          </div>
        </section>

        {/* PROFILE MODAL POPUP */}
        <AnimatePresence>
          {showProfile && profileForm && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowProfile(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />

              {/* Modal Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-[3rem] shadow-2xl border border-white/20 profile-modal-scrollbar scroll-smooth"
              >
                <style jsx global>{`
                  .profile-modal-scrollbar::-webkit-scrollbar {
                    width: 12px;
                  }
                  .profile-modal-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                    margin: 30px 0; /* Keeps scrollbar away from top/bottom rounded corners */
                  }
                  .profile-modal-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #e2e8f0;
                    border-radius: 20px;
                    border: 4px solid transparent; /* Creates 'floating' effect */
                    background-clip: content-box;
                  }
                  .profile-modal-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #cbd5e1;
                  }
                  /* Prevent layout shift */
                  .profile-modal-scrollbar {
                    scrollbar-gutter: stable;
                  }
                  /* Global Mini Scroll for Skills */
                  .custom-mini-scroll::-webkit-scrollbar {
                    width: 4px;
                  }
                  .custom-mini-scroll::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                  }
                `}</style>
                {/* Close Button */}
                <button
                  onClick={() => setShowProfile(false)}
                  className="absolute top-8 right-8 z-[210] w-12 h-12 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-2xl flex items-center justify-center transition-all group"
                >
                  <CloseIcon size={20} className="group-hover:rotate-90 transition-transform" />
                </button>
                <Card className="relative overflow-hidden border-indigo-100/50 bg-white/80 backdrop-blur-xl shadow-2xl p-0">
                  <div className="grid lg:grid-cols-[380px_1fr] divide-x divide-slate-100">
                    {/* Sidebar - Visual Identity */}
                    <div className="bg-slate-50/50 p-10 flex flex-col items-center text-center space-y-6">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-indigo-600/20">
                          {user.fullName.charAt(0)}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center text-white shadow-lg">
                          <ShieldCheck size={20} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h2 className="text-2xl font-black text-slate-900">{user.fullName}</h2>
                        <p className="text-slate-500 font-medium text-sm flex items-center justify-center gap-1.5 uppercase tracking-widest text-[10px] font-bold">
                          <Zap size={10} className="text-amber-500" />
                          {user.primaryDomain || "Verified Worker"}
                        </p>
                      </div>

                      <div className="w-full pt-6 space-y-3">
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Rank</span>
                          <span className="font-black text-emerald-600 uppercase text-[10px]">Elite Tier</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowProfile(false)}
                        className="text-slate-400 hover:text-slate-600 pt-4 text-xs font-bold uppercase tracking-widest transition-all"
                      >
                        Hide Profile Details
                      </button>
                    </div>

                    {/* Main Form Area */}
                    <div className="p-10 md:p-14 space-y-10">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Work Profile</h3>
                          <p className="text-slate-400 text-sm font-medium">Update your profile information in real-time.</p>
                        </div>
                        <Award className="text-indigo-600" size={32} />
                      </div>

                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                            <UserIcon size={10} className="text-indigo-600" /> Full Name
                          </label>
                          <input
                            type="text"
                            value={profileForm.fullName}
                            onChange={(e) => handleProfileFieldChange("fullName", e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-600 outline-none transition-all font-bold text-slate-900"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                            <Phone size={10} className="text-indigo-600" /> Secure Phone
                          </label>
                          <input
                            type="tel"
                            value={profileForm.phone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                              handleProfileFieldChange("phone", val);
                            }}
                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-600 outline-none transition-all font-bold text-slate-900"
                            placeholder="10-digit number"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                            <Award size={10} className="text-indigo-600" /> Industry Experience
                          </label>
                          <select
                            value={profileForm.experience}
                            onChange={(e) => handleProfileFieldChange("experience", e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-600 outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer"
                          >
                            <option value="">Select Level</option>
                            {EXPERIENCE_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                            <Clock size={10} className="text-indigo-600" /> Global Timezone
                          </label>
                          <select
                            value={profileForm.timezone}
                            onChange={(e) => handleProfileFieldChange("timezone", e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-600 outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer"
                          >
                            {TIMEZONE_OPTIONS.map(tz => (
                              <option key={tz.value} value={tz.value}>{tz.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">My Expertise</label>
                        <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-3xl min-h-[60px] border border-slate-100">
                          {profileForm.skills.length === 0 ? (
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-2 px-1">No skills selected yet</p>
                          ) : (
                            profileForm.skills.map((skill) => (
                              <div
                                key={skill}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-indigo-600 text-xs font-black rounded-xl shadow-sm hover:border-rose-200 hover:text-rose-600 transition-colors group cursor-pointer"
                                onClick={() => handleSkillToggle(skill)}
                              >
                                {skill}
                                <CloseIcon size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Update Skills</label>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Search or Pick from below</span>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={skillSearch}
                            onChange={(e) => setSkillSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomSkill())}
                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-600 outline-none transition-all font-bold text-slate-900 pr-24 placeholder:text-slate-300"
                            placeholder="Search skills or type a new one..."
                          />
                          {skillSearch.trim() && (
                            <button
                              onClick={handleAddCustomSkill}
                              className="absolute right-2 top-2 h-12 px-5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
                            >
                              Add
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Quick Add</p>
                          <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-2 custom-mini-scroll">
                            {skillOptions
                              .filter(o => !profileForm.skills.includes(o) && (o.toLowerCase().includes(skillSearch.toLowerCase()) || !skillSearch))
                              .map((skill) => (
                                <button
                                  key={skill}
                                  onClick={() => handleSkillToggle(skill)}
                                  className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 bg-white text-slate-500 hover:border-indigo-200 hover:text-indigo-600 transition-all active:scale-95"
                                >
                                  + {skill}
                                </button>
                              ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                          <ShieldCheck size={14} className="text-emerald-500" />
                          Your data is secure
                        </div>
                        <Button onClick={handleSaveProfile} disabled={savingProfile} className="h-14 px-12 rounded-2xl shadow-xl shadow-indigo-600/30">
                          {savingProfile ? "Saving..." : "Save Profile"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
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
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight truncate" title={stat.value.toString()}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* OVERVIEW CONTENT */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          <div className="grid lg:grid-cols-2 gap-10">
            {/* STATUS CARDS */}
            <div className="space-y-6">
              {!user.demoTaskSubmission && user.accountStatus !== "active" && (
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
                <Card className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-10 md:p-14 relative overflow-hidden text-white shadow-2xl border-none">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px] -mr-40 -mt-20" />
                  <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-sky-400/10 rounded-full blur-[80px] -ml-20 -mb-20" />

                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-10">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center shrink-0 shadow-2xl">
                      {user.demoTaskSubmission ? (
                        <ShieldCheck size={44} className="text-indigo-100" />
                      ) : (
                        <Award size={44} className="text-indigo-100" />
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500 border border-white/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Verification Engine Active</span>
                      </div>

                      <h3 className="text-3xl md:text-4xl font-black tracking-tight leading-tight uppercase">
                        {user.demoTaskSubmission ? "Verification in Progress" : "Onboarding Review"}
                      </h3>

                      <p className="text-indigo-100/80 text-lg font-medium leading-relaxed max-w-2xl">
                        {user.demoTaskSubmission
                          ? "Success! Your demo task has been securely received. Our talent experts are currently reviewing your work against our quality benchmarks. Once approved, your terminal will unlock exclusive high-paying assignments and weekly payouts."
                          : "Your profile and credentials have been prioritized for review. Please complete your vetting stage to transition to an active worker and start earning within our ecosystem."}
                      </p>

                      <div className="pt-4 flex flex-wrap gap-6 items-center">

                        <div className="flex items-center gap-2">
                          <Briefcase size={16} className="text-emerald-400" />
                          <span className="text-xs font-black uppercase tracking-wider">
                            Status: {user.demoTaskSubmission ? "Submission Received & Under Review" : "Pending Vetting Stage"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* MY ACTIVE TASKS */}
              <Card className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Tasks</h2>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">{myTasks.filter(t => t.status === 'in-progress').length} Active</span>
                </div>

                {myTasks.filter((t) => t.status === "in-progress").length === 0 ? (
                  <div className="py-20 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">No active tasks</p>
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
                          <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                              {task.payoutSchedule === "one-time" ? "Final Settlement" : "Weekly Payout"}
                            </p>
                            <span className="text-lg font-black text-emerald-600">
                              {task.payoutSchedule === "one-time" && task.weeklyPayout === 0 ? (
                                "Manual Payment"
                              ) : (
                                <>
                                  {formatMoney((task.workerPayouts && user && task.workerPayouts[user.id]) || task.weeklyPayout, currency)}
                                  {task.payoutSchedule !== "one-time" && <small className="text-[10px] font-bold text-slate-400 ml-1">/WEEK</small>}
                                </>
                              )}
                            </span>
                          </div>
                          <Button onClick={() => router.push("/tasks")} className="h-11 px-6 rounded-xl">View Task</Button>
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
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">No new tasks available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableTasks.slice(0, 4).map((task) => (
                      <div key={task.id} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-xl transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-black text-slate-900 flex-1">{task.title}</h3>
                          <div className="flex gap-2">
                            {(Array.isArray(task.skills) ? task.skills : []).slice(0, 2).map((s: string) => (
                              <span key={s} className="px-2 py-1 bg-white border border-slate-200 text-[9px] font-bold text-slate-500 rounded-md uppercase tracking-wider">{s}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                          <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                              {task.payoutSchedule === "one-time" ? "One-time" : "Weekly"}
                            </p>
                            <span className="text-lg font-black text-emerald-600">
                              {task.payoutSchedule === "one-time" && task.weeklyPayout === 0 ? "Manual" : formatMoney(task.weeklyPayout, currency)}
                            </span>
                          </div>
                          <Button onClick={() => handleAcceptTask(task.id)} disabled={user.accountStatus !== 'active' || !user.demoTaskCompleted} className="h-11 px-6 rounded-xl">Accept Task</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
