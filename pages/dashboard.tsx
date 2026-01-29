// pages/dashboard.tsx
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import Head from "next/head";

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
} from "lucide-react";

const INR_RATE = 89; // simple fixed rate

function formatMoney(amountUsd: number, currency: Currency): string {
  const symbol = currency === "INR" ? "₹" : "$";
  const converted = currency === "INR" ? amountUsd * INR_RATE : amountUsd;
  return `${symbol}${converted.toFixed(2)}`;
}

type ProfileForm = {
  fullName: string;
  phone: string;
  experience: string;
  timezone: string;
  skills: string[];
};

// same skills list you use in admin/tasks
const skillOptions = [
  "React",
  "Node.js",
  "Python",
  "Java",
  "PHP",
  "Angular",
  "Vue.js",
  "Video Editing",
  "Adobe Premiere",
  "After Effects",
  "UI/UX Design",
  "Graphic Design",
  "Content Writing",
  "Digital Marketing",
  "SEO",
];

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "daily-work">(
    "overview"
  );
  const [mySubmissions, setMySubmissions] = useState<DailySubmission[]>([]);

  // display currency state
  const [currency, setCurrency] = useState<Currency>("USD");
  const [updatingCurrency, setUpdatingCurrency] = useState(false);

  // profile panel + form state
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  /* AUTH CHECK + INITIAL LOAD */
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

    // init profile form from current user
    setProfileForm({
      fullName: current.fullName || "",
      phone: current.phone || "",
      experience: current.experience || "",
      timezone: current.timezone || "",
      skills: current.skills || [],
    });

    loadData(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* LOAD USER TASKS + AVAILABLE TASKS + SUBMISSIONS */
  const loadData = async (currentUser: User) => {
    const skills = currentUser.skills ?? [];

    const tasks = await storage.getTasks();

    setMyTasks(tasks.filter((t) => t.assignedTo === currentUser.id));

    setAvailableTasks(
      tasks.filter((t) => {
        // Must be available
        if (t.status !== "available") return false;

        // Check filtering/broadcasting logic
        // 1. If it has candidate restrictions, I MUST be in the list
        if (Array.isArray(t.candidateWorkerIds) && t.candidateWorkerIds.length > 0) {
          return t.candidateWorkerIds.includes(currentUser.id);
        }

        // 2. If it is open (no candidates), fall back to skill matching or just show it
        // The previous logic was: t.skills?.some(s => skills.includes(s))
        // But let's align with "Open" meaning open for anyone, OR we can keep skill matching for relevance.
        // For consistency with tasks.tsx which shows "Open" tasks to everyone:
        return true;
      })
    );

    const subs = await storage.getSubmissionsByUser(currentUser.id);

    setMySubmissions(
      subs.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    );
  };

  if (!user) return null;

  /* HANDLE CURRENCY CHANGE (PERSIST TO DB) */
  const handleCurrencyChange = async (value: Currency) => {
    if (!user) return;
    if (value === currency) return;

    setCurrency(value);
    setUpdatingCurrency(true);

    try {
      const updatedUser: User = {
        ...user,
        preferredCurrency: value,
      };

      await storage.updateUser(user.id, { preferredCurrency: value });
      storage.setCurrentUser(updatedUser);
      setUser(updatedUser);
    } catch (err) {
      console.error("Failed to update currency preference:", err);
      toast.error("Failed to update currency preference.");
    } finally {
      setUpdatingCurrency(false);
    }
  };

  // choose icon for balance based on currency
  const BalanceIcon = currency === "INR" ? IndianRupee : DollarSign;

  /* OVERVIEW NUMBERS */
  const stats = [
    {
      label: "Balance",
      value: formatMoney(user.balance, currency),
      icon: BalanceIcon,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Active Tasks",
      value: myTasks.filter((t) => t.status === "in-progress").length,
      icon: Briefcase,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Completed",
      value: myTasks.filter((t) => t.status === "completed").length,
      icon: CheckCircle,
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "Available Tasks",
      value: availableTasks.length,
      icon: Clock,
      color: "bg-orange-100 text-orange-600",
    },
  ];

  /* ACCEPT TASK */
  const handleAcceptTask = async (taskId: string) => {
    await storage.updateTask(taskId, {
      status: "in-progress",
      assignedTo: user!.id,
    });

    router.push("/tasks");
  };

  /* PROFILE FORM HANDLERS */
  const handleProfileFieldChange = (field: keyof ProfileForm, value: string) => {
    if (!profileForm) return;
    setProfileForm({ ...profileForm, [field]: value });
  };

  const handleSkillToggle = (skill: string) => {
    if (!profileForm) return;
    if (profileForm.skills.includes(skill)) {
      setProfileForm({
        ...profileForm,
        skills: profileForm.skills.filter((s) => s !== skill),
      });
    } else {
      setProfileForm({
        ...profileForm,
        skills: [...profileForm.skills, skill],
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profileForm) return;

    try {
      setSavingProfile(true);

      const updatePayload = {
        fullName: profileForm.fullName.trim(),
        phone: profileForm.phone.trim(),
        experience: profileForm.experience.trim(),
        timezone: profileForm.timezone.trim(),
        skills: profileForm.skills,
      };

      await storage.updateUser(user.id, updatePayload);

      const updatedUser: User = {
        ...user,
        ...updatePayload,
      };

      storage.setCurrentUser(updatedUser);
      setUser(updatedUser);

      setUser(updatedUser);

      toast.success("Profile updated successfully.");
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast.error("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Dashboard - Cehpoint</title>
      </Head>

      <div className="space-y-6">
        {/* HEADER + CURRENCY SELECTOR + PROFILE ICON */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6 border-b border-gray-100">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Welcome back, {user.fullName}! 👋
            </h1>
            <p className="text-sm text-gray-500 max-w-lg">
              Monitor your work progress, manage tasks, and track your earnings.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 pl-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Currency</span>
              <select
                value={currency}
                onChange={(e) =>
                  handleCurrencyChange(e.target.value as Currency)
                }
                disabled={updatingCurrency}
                className="bg-gray-50 px-3 h-8 border border-gray-200 rounded-lg font-bold text-xs uppercase outline-none focus:border-indigo-600 transition-all cursor-pointer"
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowProfile((v) => !v)}
              className="flex items-center gap-2 px-4 h-11 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"
            >
              <UserIcon size={16} />
              <span>{showProfile ? 'Hide Profile' : 'Edit Profile'}</span>
            </button>
          </div>
        </div>

        {/* PROFILE PANEL (toggles from icon) */}
        {showProfile && profileForm && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-semibold">My Profile</h2>
              <button
                type="button"
                onClick={() => setShowProfile(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(e) =>
                    handleProfileFieldChange("fullName", e.target.value)
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Email (read-only)
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone
                </label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) =>
                    handleProfileFieldChange("phone", e.target.value)
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Experience
                </label>
                <input
                  type="text"
                  value={profileForm.experience}
                  onChange={(e) =>
                    handleProfileFieldChange("experience", e.target.value)
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="e.g., 2 years, Fresher"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Timezone
                </label>
                <input
                  type="text"
                  value={profileForm.timezone}
                  onChange={(e) =>
                    handleProfileFieldChange("timezone", e.target.value)
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="e.g., IST, PST"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">Skills</label>
              <p className="text-xs text-gray-500 mb-2">
                Select all skills that match your expertise. This helps us show
                better-matched tasks.
              </p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                {skillOptions.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillToggle(skill)}
                    className={`px-3 py-2 rounded-lg border text-sm transition ${profileForm.skills.includes(skill)
                      ? "border-indigo-600 bg-indigo-100 text-indigo-700"
                      : "border-gray-300 hover:border-gray-400"
                      }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? "Saving…" : "Save Profile"}
              </Button>
            </div>
          </Card>
        )}

        {/* TABS */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${activeTab === "overview"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <div className="flex items-center gap-2">
              <Briefcase size={14} />
              Overview
            </div>
          </button>
          <button
            onClick={() => setActiveTab("daily-work")}
            className={`px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${activeTab === "daily-work"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <div className="flex items-center gap-2">
              <Calendar size={14} />
              Daily Work
            </div>
          </button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <>
            {/* DEMO / STATUS BANNERS */}
            {!user.demoTaskCompleted && (
              <Card className="bg-yellow-50 border-yellow-200">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="font-semibold text-yellow-900">
                      Complete Your Demo Task
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      You need to complete a demo task before accepting regular
                      projects
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      variant="secondary"
                      onClick={() => router.push("/demo-setup")}
                    >
                      Start Demo
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {user.accountStatus === "pending" && (
              <Card className="bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-blue-900">
                  Account Verification Pending
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Your account is under review. You&apos;ll be notified once
                  approved.
                </p>
              </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                    <div className={`p-2.5 rounded-xl ${stat.color.replace('text-', 'bg-').replace('600', '50')} ${stat.color} group-hover:scale-110 transition-transform`}>
                      <stat.icon size={18} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* TASKS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* My Active Tasks */}
              <Card>
                <h2 className="text-lg md:text-xl font-semibold mb-4">
                  My Active Tasks
                </h2>
                {myTasks.filter((t) => t.status === "in-progress").length ===
                  0 ? (
                  <p className="text-gray-500 text-center py-8 text-sm md:text-base">
                    No active tasks
                  </p>
                ) : (
                  <div className="space-y-3">
                    {myTasks
                      .filter((t) => t.status === "in-progress")
                      .map((task) => (
                        <div
                          key={task.id}
                          className="border border-gray-200 rounded-lg p-3 md:p-4"
                        >
                          <h3 className="font-semibold text-sm md:text-base">
                            {task.title}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-600 mt-1">
                            {task.description}
                          </p>
                          <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center mt-3">
                            <span className="text-sm font-medium text-green-600">
                              {formatMoney(task.weeklyPayout, currency)}
                            </span>
                            <Button onClick={() => router.push("/tasks")}>
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </Card>

              {/* Available Tasks */}
              <Card>
                <h2 className="text-lg md:text-xl font-semibold mb-4">
                  Available Tasks for You
                </h2>
                {availableTasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-8 text-sm md:text-base">
                    No available tasks
                  </p>
                ) : (
                  <div className="space-y-3">
                    {availableTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className="border border-gray-200 rounded-lg p-3 md:p-4"
                      >
                        <h3 className="font-semibold text-sm md:text-base">
                          {task.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Array.isArray(task.skills) && task.skills.map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-1 bg-indigo-100 text-indigo-600 text-xs rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center mt-3">
                          <span className="text-sm font-medium text-green-600">
                            {formatMoney(task.weeklyPayout, currency)}/week
                          </span>
                          <Button
                            onClick={() => handleAcceptTask(task.id)}
                            disabled={!user.demoTaskCompleted}
                          >
                            Accept Task
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}

        {/* DAILY WORK TAB */}
        {activeTab === "daily-work" && (
          <div className="space-y-8">
            <DailySubmissionForm
              userId={user.id}
              onSubmit={() => loadData(user)}
            />

            <div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-4 md:mb-6">
                Submission History
              </h2>
              <SubmissionHistory submissions={mySubmissions} />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
