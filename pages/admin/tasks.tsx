// pages/admin/tasks.tsx
import { useEffect, useState, ChangeEvent } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import Head from "next/head";

import Layout from "../../components/Layout";
import Card from "../../components/Card";
import Button from "../../components/Button";

import { storage } from "../../utils/storage";
import type { User, Task, Payment, Currency } from "../../utils/types";
import { findWorkerForTask, AssignmentExplanation } from "../../utils/taskAssignment";
import { mailService } from "../../utils/mailService";

import {
  Plus,
  Rocket,
  Globe,
  Link as LinkIcon,
  Clock,
  Paperclip,
  FileText,
  Bug,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  Calendar,
  ExternalLink
} from "lucide-react";

import { format } from "date-fns";

type NewTaskForm = {
  title: string;
  description: string;
  category: string;
  skills: string[];
  weeklyPayout: number; // stored in base USD
  deadline: string;
  projectDetails: string;
  helperEmail: string;
};

const INR_RATE = 89; // 🔹 simple fixed rate

function formatMoney(amountUsd: number, currency: Currency): string {
  const symbol = currency === "INR" ? "₹" : "$";
  const converted = currency === "INR" ? amountUsd * INR_RATE : amountUsd;
  return `${symbol}${converted.toFixed(2)}`;
}

function toBase(enteredAmount: number, currency: Currency): number {
  return currency === "INR" ? enteredAmount / INR_RATE : enteredAmount;
}

export default function AdminTasks() {
  const router = useRouter();

  const [currentAdmin, setCurrentAdmin] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // 🔹 Currency state (shared admin preference)
  const [currency, setCurrency] = useState<Currency>("USD");
  const [updatingCurrency, setUpdatingCurrency] = useState(false);

  const [newTask, setNewTask] = useState<NewTaskForm>({
    title: "",
    description: "",
    category: "",
    skills: [],
    weeklyPayout: 0, // stored as USD
    deadline: "",
    projectDetails: "",
    helperEmail: "",
  });

  // 🔹 Separate string state for the Weekly Payout input
  const [weeklyPayoutInput, setWeeklyPayoutInput] = useState<string>("");
  const [customSkill, setCustomSkill] = useState("");


  // 🔹 Auto-Assignment Modal State
  const [assignmentModal, setAssignmentModal] = useState<{
    visible: boolean;
    pendingTask: Omit<Task, "id"> | null;
    candidates: User[];
    bestWorker: User | null;
    log: string;
    analysis?: AssignmentExplanation;
    cleanPayload: any;
  }>({
    visible: false,
    pendingTask: null,
    candidates: [],
    bestWorker: null,
    log: "",
    cleanPayload: null
  });

  // 🔹 Expansion state for task cards
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // 🔹 Rejection Modal State
  const [rejectionModal, setRejectionModal] = useState<{
    visible: boolean;
    taskId: string | null;
    reason: string;
  }>({
    visible: false,
    taskId: null,
    reason: ""
  });

  // 🔹 Dynamic Skills
  const [availableSkills, setAvailableSkills] = useState<string[]>([
    "React", "Node.js", "Python", "Java", "PHP", "Angular", "Vue.js",
    "Video Editing", "Adobe Premiere", "After Effects",
    "UI/UX Design", "Graphic Design", "Content Writing",
    "Digital Marketing", "SEO"
  ]);

  /* -------------------------------------------------------
   * AUTH + INITIAL LOAD
   * ----------------------------------------------------- */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const currentUser = storage.getCurrentUser();
      if (!currentUser || currentUser.role !== "admin") {
        router.replace("/login");
        return;
      }

      if (!mounted) return;
      setCurrentAdmin(currentUser);
      setCurrency(currentUser.preferredCurrency || "USD");

      try {
        setPageLoading(true);
        const [users, list, dbSkills] = await Promise.all([
          storage.getUsers(),
          storage.getTasks(),
          storage.getSkills(),
        ]);

        if (dbSkills && dbSkills.length > 0) {
          setAvailableSkills(prev => Array.from(new Set([...prev, ...dbSkills])));
        }

        if (!mounted) return;

        setWorkers(users.filter((u) => u.role === "worker"));
        setTasks(
          list.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          )
        );
      } catch (err) {
        console.error("Failed to load admin data:", err);
        toast.error("Failed to load admin data.");
      } finally {
        if (mounted) setPageLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [router]);

  const reloadTasks = async () => {
    const list = await storage.getTasks();
    setTasks(
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (!trimmed) return;
    if (newTask.skills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Skill already added");
      return;
    }
    setNewTask(prev => ({
      ...prev,
      skills: [...prev.skills, trimmed]
    }));
    setAvailableSkills(prev => {
      if (prev.some(s => s.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [...prev, trimmed];
    });
    setCustomSkill("");
  };

  const handleCurrencyChange = async (value: Currency) => {
    if (!currentAdmin) return;
    if (value === currency) return;

    setCurrency(value);
    setUpdatingCurrency(true);

    try {
      const updated: User = {
        ...currentAdmin,
        preferredCurrency: value,
      };

      await storage.updateUser(currentAdmin.id, { preferredCurrency: value });
      storage.setCurrentUser(updated);
      setCurrentAdmin(updated);
    } catch (err) {
      console.error("Failed to update currency preference:", err);
      toast.error("Failed to update currency preference.");
    } finally {
      setUpdatingCurrency(false);
    }
  };

  const handleWeeklyPayoutChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setWeeklyPayoutInput(raw);

    if (raw === "") {
      setNewTask((prev) => ({ ...prev, weeklyPayout: 0 }));
      return;
    }

    const val = parseFloat(raw);
    if (isNaN(val)) return;

    const baseUsd = toBase(val, currency);
    setNewTask((prev) => ({ ...prev, weeklyPayout: baseUsd }));
  };

  const handleCreateTask = async () => {
    if (
      !newTask.title.trim() ||
      !newTask.description.trim() ||
      !newTask.category.trim() ||
      newTask.skills.length === 0 ||
      !newTask.deadline
    ) {
      toast.error("Please fill all fields.");
      return;
    }

    if (!currentAdmin) {
      toast.error("Admin session missing.");
      return;
    }

    try {
      setBusy(true);
      const { candidates, bestWorker, log, analysis } = findWorkerForTask(newTask, workers, tasks);

      const payload: Omit<Task, "id"> = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        projectDetails: newTask.projectDetails.trim() || "",
        helperEmail: newTask.helperEmail.trim() || "",
        category: newTask.category.trim(),
        skills: newTask.skills,
        weeklyPayout: Number(newTask.weeklyPayout) || 0,
        deadline: newTask.deadline,
        status: bestWorker ? "in-progress" : "available",
        assignedTo: bestWorker ? bestWorker.id : null,
        assignedAt: bestWorker ? new Date().toISOString() : null,
        submissionUrl: "",
        createdAt: new Date().toISOString(),
        createdBy: currentAdmin.id,
      };

      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, v]) => v !== undefined)
      );

      const newSkills = newTask.skills.filter(s => !availableSkills.includes(s));
      if (newSkills.length > 0) {
        newSkills.forEach(s => storage.addSkill(s));
        setAvailableSkills(prev => [...prev, ...newSkills]);
      }

      setAssignmentModal({
        visible: true,
        pendingTask: payload,
        candidates: candidates || [],
        bestWorker,
        log,
        analysis,
        cleanPayload
      });

    } catch (err) {
      console.error(err);
      toast.error("An error occurred while preparing the task.");
    } finally {
      setBusy(false);
    }
  };

  const confirmAssignment = async (action: 'assign' | 'broadcast' | 'create-open') => {
    if (!assignmentModal.pendingTask) return;

    setBusy(true);
    try {
      const finalPayload = { ...assignmentModal.cleanPayload };

      if (action === 'assign') {
        if (!finalPayload.assignedTo) finalPayload.status = "available";
      } else if (action === 'broadcast') {
        finalPayload.status = "available";
        finalPayload.assignedTo = null;
        finalPayload.assignedAt = null;
        finalPayload.candidateWorkerIds = assignmentModal.candidates.map(u => u.id);
      } else {
        finalPayload.status = "available";
        finalPayload.assignedTo = null;
        finalPayload.assignedAt = null;
        finalPayload.candidateWorkerIds = null;
      }

      // @ts-ignore
      const createdTask = await storage.createTask(finalPayload);
      await reloadTasks();

      // Notifications
      if (action === 'assign' && finalPayload.assignedTo) {
        await storage.createNotification({
          userId: finalPayload.assignedTo,
          title: "New Mission Assigned",
          message: `You've been selected for "${finalPayload.title}". Check your dashboard to begin.`,
          type: "success",
          read: false,
          createdAt: new Date().toISOString(),
          link: "/dashboard"
        }).catch(e => console.error("Notification failed", e));
      }

      if (action === 'broadcast' && assignmentModal.candidates.length > 0) {
        // Notify top candidates
        await Promise.all(assignmentModal.candidates.slice(0, 5).map(u =>
          storage.createNotification({
            userId: u.id,
            title: "New Opportunity",
            message: `A new ${finalPayload.category} task matches your skills perfectly.`,
            type: "info",
            read: false,
            createdAt: new Date().toISOString(),
            link: "/dashboard"
          })
        )).catch(e => console.error("Broadcast notifications failed", e));
      }

      setNewTask({
        title: "",
        description: "",
        category: "",
        skills: [],
        weeklyPayout: 0,
        deadline: "",
        projectDetails: "",
        helperEmail: "",
      });
      setWeeklyPayoutInput("");
      setShowCreate(false);
      setAssignmentModal({ ...assignmentModal, visible: false });

      if (action === 'broadcast') {
        const candidateEmails = assignmentModal.candidates.map(u => u.email).filter(Boolean);
        if (candidateEmails.length > 0) {
          mailService.sendBroadcastNotification(candidateEmails, assignmentModal.pendingTask.title)
            .catch(err => console.error("[BroadcastEmails] failed:", err));
        }
      }

      toast.success("Task processed successfully.");
    } catch (err) {
      console.error("confirmAssignment error:", err);
      toast.error("Failed to create task");
    } finally {
      setBusy(false);
    }
  };

  const handleAssignTask = async (taskId: string, workerId: string) => {
    if (!workerId) return;
    performAssign(taskId, workerId);
  };

  const performAssign = async (taskId: string, workerId: string) => {
    try {
      setBusy(true);
      await storage.updateTask(taskId, {
        assignedTo: workerId,
        status: "in-progress",
        assignedAt: new Date().toISOString(),
      });
      await reloadTasks();
      toast.success("Task assigned.");
    } catch (err) {
      console.error("assignTask error:", err);
      toast.error("Failed to assign task.");
    } finally {
      setBusy(false);
    }
  };

  const handleApproveTask = async (taskId: string) => {
    const job = tasks.find((t) => t.id === taskId);
    if (!job || !job.assignedTo) return;
    performApprove(job);
  };

  const performApprove = async (job: Task) => {
    try {
      setBusy(true);
      await storage.updateTask(job.id, {
        status: "completed",
        completedAt: new Date().toISOString(),
      });
      await storage.createPayment({
        userId: job.assignedTo!,
        amount: job.weeklyPayout,
        type: "task-payment",
        status: "completed",
        taskId: job.id,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });
      const worker = await storage.getUserById(job.assignedTo!);
      if (worker) {
        await storage.updateUser(worker.id, { balance: (worker.balance || 0) + job.weeklyPayout });

        await storage.createNotification({
          userId: worker.id,
          title: "Payment Received",
          message: `Your work on "${job.title}" was approved. ${job.weeklyPayout.toFixed(2)} USD added to balance.`,
          type: "success",
          read: false,
          createdAt: new Date().toISOString(),
          link: "/payments"
        }).catch(e => console.error("Notification failed", e));
      }
      await reloadTasks();
      toast.success("Approved and paid.");
    } catch (err) {
      console.error("approveTask error:", err);
      toast.error("Failed to approve.");
    } finally {
      setBusy(false);
    }
  };

  const handleRejectTask = (taskId: string) => {
    setRejectionModal({ visible: true, taskId, reason: "" });
  };

  const confirmRejectTask = async () => {
    if (!rejectionModal.taskId) return;
    try {
      setBusy(true);
      await storage.updateTask(rejectionModal.taskId, {
        status: "rejected",
        feedback: rejectionModal.reason || "",
      });

      const rejectedTask = tasks.find(t => t.id === rejectionModal.taskId);
      if (rejectedTask?.assignedTo) {
        await storage.createNotification({
          userId: rejectedTask.assignedTo,
          title: "Task Feedback",
          message: `Your submission for "${rejectedTask.title}" requires revisions.`,
          type: "warning",
          read: false,
          createdAt: new Date().toISOString(),
          link: "/dashboard"
        }).catch(e => console.error("Notification failed", e));
      }

      await reloadTasks();
      toast.success("Task rejected.");
      setRejectionModal({ visible: false, taskId: null, reason: "" });
    } catch (err) {
      console.error("rejectTask error:", err);
      toast.error("Failed to reject.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    performDelete(taskId);
  };

  const performDelete = async (taskId: string) => {
    try {
      setBusy(true);
      // @ts-ignore
      await storage.deleteTask(taskId);
      await reloadTasks();
      toast.success("Task deleted.");
    } catch (err) {
      console.error("deleteTask error:", err);
      toast.error("Failed to delete.");
    } finally {
      setBusy(false);
    }
  };

  const handleSkillToggle = (skill: string) => {
    setNewTask((prev) => {
      if (prev.skills.includes(skill)) {
        return { ...prev, skills: prev.skills.filter((s) => s !== skill) };
      }
      return { ...prev, skills: [...prev.skills, skill] };
    });
  };

  if (pageLoading || !currentAdmin) return null;

  return (
    <Layout>
      <Head>
        <title>Manage Tasks - Cehpoint</title>
      </Head>

      <div className="max-w-[1400px] mx-auto space-y-10 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manage Tasks</h1>
            <p className="text-sm text-gray-500">Create, assign, and track project milestones.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider pl-3">Currency</span>
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
                disabled={updatingCurrency}
                className="bg-gray-50 px-3 h-8 border border-gray-200 rounded-lg font-bold text-xs uppercase outline-none focus:border-indigo-600 transition-all cursor-pointer"
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
            <Button onClick={() => setShowCreate((s) => !s)}>
              <Plus size={18} />
              <span>{showCreate ? "Close Panel" : "New Task"}</span>
            </Button>
          </div>
        </div>

        {showCreate && (
          <Card className="animate-in fade-in slide-in-from-top-4 duration-300 border border-gray-100 bg-gray-50/50 p-8 rounded-[24px]">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
              <Rocket className="text-indigo-600" size={24} />
              Create New Mission
            </h3>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Project Name</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl focus:border-indigo-600 transition-all outline-none font-medium text-sm"
                    placeholder="e.g. Backend API Development"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl outline-none font-medium text-sm"
                  >
                    <option value="">Choose category...</option>
                    <option value="Development">Development</option>
                    <option value="Design">Design</option>
                    <option value="Video Editing">Video Editing</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Writing">Writing</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Briefing / Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full p-4 bg-white border border-gray-200 rounded-xl outline-none font-medium text-sm"
                  rows={4}
                  placeholder="Outline the core requirements and goals..."
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Project Link (Notion/Docs)</label>
                  <input
                    type="text"
                    value={newTask.projectDetails}
                    onChange={(e) => setNewTask({ ...newTask, projectDetails: e.target.value })}
                    className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl font-medium text-sm outline-none"
                    placeholder="https://docs.google.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Deadline</label>
                  <input
                    type="date"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                    className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl font-medium text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mentor Email</label>
                  <input
                    type="email"
                    value={newTask.helperEmail}
                    onChange={(e) => setNewTask({ ...newTask, helperEmail: e.target.value })}
                    className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl font-medium text-sm outline-none"
                    placeholder="mentor@cehpoint.co.in"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Weekly Payout ({currency})</label>
                  <input
                    type="number"
                    value={weeklyPayoutInput}
                    onChange={handleWeeklyPayoutChange}
                    className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl font-bold text-lg text-indigo-600 outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Skill Matrix Selection</label>
                <div className="flex flex-wrap gap-2">
                  {availableSkills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleSkillToggle(skill)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${newTask.skills.includes(skill)
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-100"
                        : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"
                        }`}
                    >
                      {skill}
                    </button>
                  ))}
                  <div className="flex gap-2 ml-auto">
                    <input
                      type="text"
                      className="px-3 h-8 bg-white border border-gray-200 rounded-lg text-xs font-medium outline-none"
                      placeholder="Add custom..."
                      value={customSkill}
                      onChange={e => setCustomSkill(e.target.value)}
                    />
                    <Button onClick={addCustomSkill} className="h-8 px-4 text-[11px]">Add</Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200/50">
                <Button onClick={handleCreateTask} disabled={busy} className="px-8 h-11">Broadcast Project</Button>
                <Button variant="outline" onClick={() => setShowCreate(false)} disabled={busy} className="h-11">Cancel</Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid gap-4">
          {tasks.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <ClipboardList className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 font-bold uppercase tracking-widest">No active projection data</p>
            </div>
          )}

          {tasks.map((task) => {
            const isExpanded = expandedTasks[task.id] || false;
            const assignedWorker = workers.find((w) => w.id === task.assignedTo) || null;

            return (
              <Card key={task.id} className={`overflow-hidden border transition-all duration-300 ${isExpanded ? 'border-indigo-100 shadow-md ring-1 ring-indigo-50' : 'border-gray-100 hover:border-gray-200 shadow-sm'}`}>
                <div
                  onClick={() => toggleExpand(task.id)}
                  className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 cursor-pointer bg-white hover:bg-gray-50/30 transition-colors"
                >
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${isExpanded ? 'bg-indigo-600 text-white rotate-180 shadow-md' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                      <ChevronDown size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${task.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : task.status === "in-progress"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                            : task.status === "submitted"
                              ? "bg-blue-50 text-blue-700 border-blue-100"
                              : task.status === "rejected"
                                ? "bg-red-50 text-red-700 border-red-100"
                                : "bg-gray-50 text-gray-500 border-gray-100"
                          }`}>
                          {task.status}
                        </span>
                        <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">{task.category}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 truncate tracking-tight">
                        {task.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-10">
                    <div className="hidden lg:flex items-center gap-4 border-r border-gray-100 pr-8">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                        <UserIcon className="text-gray-400" size={16} />
                      </div>
                      <div className="text-[11px]">
                        <p className="text-gray-400 font-bold uppercase tracking-wider mb-0.5">Specialist</p>
                        <p className="text-gray-900 font-bold whitespace-nowrap leading-none mb-1 text-sm">{assignedWorker ? assignedWorker.fullName : 'Recruiting'}</p>
                        {assignedWorker && (
                          <div className="flex flex-col text-[10px] text-gray-400 font-medium tracking-tight">
                            <span>{assignedWorker.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 min-w-[140px]">
                      <div className="text-amber-500 bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                        <Calendar size={16} />
                      </div>
                      <div className="text-[11px]">
                        <p className="text-gray-400 font-bold uppercase tracking-wider mb-0.5">Deadline</p>
                        <p className="text-gray-900 font-bold text-[13px]">
                          {task.deadline ? format(new Date(task.deadline), "MMM dd, yyyy") : 'UNSET'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end pl-8 border-l border-gray-100">
                      <p className="text-xl font-bold text-gray-900 leading-none mb-1">{formatMoney(task.weeklyPayout, currency)}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Grant</p>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-8 border-t border-gray-100 bg-white animate-in slide-in-from-top-2 duration-300">
                    <div className="grid md:grid-cols-[1fr_350px] gap-10">
                      <div className="flex flex-col gap-8">
                        <section>
                          <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <ClipboardList size={14} className="text-indigo-600" /> PROJECT BRIEF
                          </h4>
                          <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 p-6 rounded-2xl border border-gray-100">
                            {task.description}
                          </div>
                        </section>

                        <section>
                          <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">REQUIREMENTS</h4>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(task.skills) && task.skills.map((s) => (
                              <span key={s} className="px-3 py-1 bg-white text-indigo-600 text-[10px] font-bold uppercase rounded-lg border border-indigo-100 shadow-sm">
                                {s}
                              </span>
                            ))}
                          </div>
                        </section>

                        {task.submissionUrl && (
                          <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Rocket size={20} className="text-indigo-600" />
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Submission Review</h4>
                              </div>
                              <span className="text-[10px] font-bold text-gray-400 px-3 py-1 bg-white border border-gray-200 rounded-full uppercase">
                                Received {task.submittedAt && format(new Date(task.submittedAt), "MMM dd • hh:mm a")}
                              </span>
                            </div>
                            <div className="p-6 flex flex-col gap-4">
                              {task.submissionUrl.split('\n').map((line, i) => {
                                if (line.startsWith('###')) return null;
                                const kvMatch = line.match(/^\*\*(.*?):\*\*\s*(.*)$/);
                                if (kvMatch) {
                                  let label = kvMatch[1].replace(/🔗|🌐|⏱️|📎|📄/g, '').trim();
                                  let value = kvMatch[2].trim();
                                  const isUrl = value.startsWith('http');

                                  return (
                                    <div key={i} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-all group">
                                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                          {label.includes('Documentation') && <FileText size={14} />}
                                          {label.includes('File Link') && <Paperclip size={14} />}
                                          {label.includes('Live Demo') && <Globe size={14} />}
                                          {label.includes('Time Spent') && <Clock size={14} />}
                                          {label.includes('Repository') && <LinkIcon size={14} />}
                                          {(label.includes('Challenges') || label.includes('Blockers')) && <Bug size={14} />}
                                          {label.includes('Notes') && <ClipboardList size={14} />}
                                        </div>
                                        {label}
                                      </span>
                                      <div className="mt-3 lg:mt-0">
                                        {isUrl ? (
                                          <a href={value} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition-all shadow-sm">
                                            View Resource <ExternalLink size={12} />
                                          </a>
                                        ) : (
                                          <span className="text-sm font-bold text-gray-900">
                                            {label.toLowerCase().includes('time spent') && value && !isNaN(parseFloat(value)) && !value.toLowerCase().includes('hour')
                                              ? `${value} Hours`
                                              : value || <span className="text-gray-400 italic font-normal">N/A</span>}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )
                                }
                                if (line.startsWith('**') && !line.includes(':**')) {
                                  const isChallenges = line.includes('Challenges');
                                  return (
                                    <div key={i} className={`mt-8 mb-2 flex items-center gap-3 text-xs font-black uppercase tracking-[0.4em] ${isChallenges ? 'text-rose-400' : 'text-amber-400'}`}>
                                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                      {line.replace(/\*\*/g, '').trim()}
                                    </div>
                                  )
                                }
                                if (line.trim()) {
                                  return <p key={i} className="text-sm text-slate-300 leading-relaxed pl-6 border-l-2 border-white/10 ml-3 py-2 font-medium opacity-80">{line}</p>
                                }
                                return null;
                              })}
                            </div>
                          </section>
                        )}
                      </div>

                      <div className="flex flex-col gap-8">
                        <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 shadow-inner">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">PROJECT STEWARD</h4>
                          {task.status === "available" ? (
                            <div className="space-y-4">
                              <select
                                value={task.assignedTo || ""}
                                onChange={(e) => handleAssignTask(task.id, e.target.value)}
                                className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-2xl font-black text-sm text-gray-900 focus:ring-8 focus:ring-indigo-50 transition-all outline-none appearance-none cursor-pointer"
                              >
                                <option value="">MANUAL OVERRIDE...</option>
                                {workers.map((w) => <option key={w.id} value={w.id}>{w.fullName}</option>)}
                              </select>
                              {task.candidateWorkerIds && task.candidateWorkerIds.length > 0 && (
                                <div className="p-5 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100">
                                  <p className="text-[10px] font-black text-indigo-100 uppercase mb-2 flex items-center gap-2 tracking-widest">
                                    <Rocket size={14} className="animate-bounce" /> BROADCASTING ACTIVE
                                  </p>
                                  <p className="text-sm font-black text-white leading-tight">Syncing with {task.candidateWorkerIds.length} qualified specialists.</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-3xl shadow-xl ring-8 ring-indigo-50 mb-4">
                                {assignedWorker?.fullName.charAt(0)}
                              </div>
                              <p className="text-xl font-black text-gray-900 tracking-tight">{assignedWorker?.fullName}</p>
                              <p className="text-xs text-indigo-500 font-bold uppercase tracking-widest mt-1 opacity-60">Verified Specialist</p>
                              <div className="mt-6 w-full pt-6 border-t border-gray-50 flex justify-between">
                                <div className="text-left">
                                  <p className="text-[9px] font-black text-gray-300 uppercase leading-none">Reliability</p>
                                  <p className="text-sm font-black text-gray-900">98%</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[9px] font-black text-gray-300 uppercase leading-none">Sync Status</p>
                                  <p className="text-sm font-black text-green-500">OPTIMAL</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {task.status !== "available" && (
                          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-end mb-5">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PROJECT VELOCITY</span>
                              <span className="text-3xl font-black text-indigo-600 tracking-tighter leading-none">{task.progress || 0}%</span>
                            </div>
                            <div className="w-full h-4 bg-gray-50 rounded-full overflow-hidden shadow-inner p-1">
                              <div className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-400 h-full rounded-full transition-all duration-1000 shadow-lg" style={{ width: `${task.progress || 0}%` }} />
                            </div>
                            {task.checklist && task.checklist.length > 0 && (
                              <div className="mt-8 space-y-3">
                                {task.checklist.slice(0, 4).map((item, idx) => (
                                  <div key={idx} className="flex items-start gap-3">
                                    <div className={`mt-1 w-2 h-2 rounded-full ring-4 ${item.completed ? 'bg-indigo-600 ring-indigo-50' : 'bg-gray-200 ring-gray-50'}`} />
                                    <span className={`text-[11px] font-bold ${item.completed ? 'text-gray-400 line-through' : 'text-gray-700'} truncate`}>{item.text}</span>
                                  </div>
                                ))}
                                {task.checklist.length > 4 && <p className="text-[10px] font-black text-indigo-300 pl-5 uppercase tracking-widest">+ {task.checklist.length - 4} DATA NODES</p>}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-auto space-y-4">
                          {task.status === "submitted" && (
                            <div className="grid grid-cols-2 gap-4">
                              <Button
                                onClick={() => handleApproveTask(task.id)}
                                className="bg-green-600 hover:bg-green-700 shadow-xl shadow-green-100 font-black h-auto py-5 rounded-2xl text-[10px] uppercase tracking-widest"
                              >
                                Approve & Pay
                              </Button>
                              <Button
                                variant="danger"
                                onClick={() => handleRejectTask(task.id)}
                                className="font-black h-auto py-5 rounded-2xl text-[10px] uppercase tracking-widest"
                              >
                                Reject Submission
                              </Button>
                            </div>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => handleDeleteTask(task.id)}
                            className="w-full border-2 border-red-50 text-red-500 hover:bg-red-50 font-black tracking-widest uppercase text-xs p-5 rounded-2xl transition-all hover:border-red-100"
                          >
                            Delete Task
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {assignmentModal.visible && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-300">
            <div className="p-10 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-3xl font-black text-gray-900 tracking-tighter">
                {assignmentModal.bestWorker ? "Assignment Recommended" : "Manual Review Required"}
              </h3>
              <button
                onClick={() => setAssignmentModal({ ...assignmentModal, visible: false })}
                className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:shadow-lg transition-all"
              >✕</button>
            </div>

            <div className="p-10 overflow-y-auto bg-white flex-1 custom-scrollbar">
              {assignmentModal.bestWorker ? (
                <div className="mb-10 p-8 bg-gradient-to-br from-indigo-600 to-indigo-700 border border-indigo-500 rounded-[32px] flex items-center gap-6 shadow-2xl shadow-indigo-200">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                    <span className="text-4xl">✨</span>
                  </div>
                  <div>
                    <p className="text-white font-black text-2xl tracking-tight">Best Specialist Found</p>
                    <p className="text-indigo-100 font-bold text-sm mt-1">
                      {assignmentModal.bestWorker.fullName} is a perfect match for this project.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mb-10 p-8 bg-amber-50 border border-amber-100 rounded-[32px] flex items-center gap-6">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center border border-amber-100 shadow-md">
                    <span className="text-4xl text-amber-500">⚠️</span>
                  </div>
                  <div>
                    <p className="text-amber-900 font-black text-2xl tracking-tight">No Automatic Match</p>
                    <p className="text-amber-700 font-bold text-sm mt-1">Unable to find an ideal specialist for instant assignment.</p>
                  </div>
                </div>
              )}

              {assignmentModal.analysis && (
                <div className="space-y-10">
                  <section>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Matching Logic Overview</h4>
                    <div className="bg-gray-50 p-6 rounded-3xl text-sm text-gray-600 font-medium leading-relaxed border border-gray-100">
                      {assignmentModal.analysis.requirements}
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Qualified Talent Pool</h4>
                    <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                          <tr>
                            <th className="px-8 py-5">Specialist</th>
                            <th className="px-8 py-5">Skill Match</th>
                            <th className="px-8 py-5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {assignmentModal.analysis.candidates.map((cand, idx) => (
                            <tr key={idx} className={cand.workerName === assignmentModal.bestWorker?.fullName ? "bg-indigo-50/50" : ""}>
                              <td className="px-8 py-5 font-black text-gray-900">{cand.workerName}</td>
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]" style={{ width: `${cand.matchPercentage}%` }} />
                                  </div>
                                  <span className="text-[11px] font-black text-indigo-600">{cand.matchPercentage.toFixed(0)}%</span>
                                </div>
                              </td>
                              <td className="px-8 py-5 text-right">
                                <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${cand.status === 'Eligible' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-gray-50 text-gray-400'}`}>
                                  {cand.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              )}
            </div>

            <div className="p-10 border-t bg-gray-50/50 flex flex-wrap justify-end gap-4">
              <Button variant="outline" onClick={() => setAssignmentModal({ ...assignmentModal, visible: false })} className="px-8 h-14 rounded-2xl font-black">Cancel</Button>
              <button
                onClick={() => confirmAssignment('create-open')}
                className="px-8 h-14 border border-gray-200 rounded-2xl hover:bg-white transition-all text-gray-500 font-bold text-xs uppercase tracking-widest"
              >
                Create as Open
              </button>
              {assignmentModal.candidates.length > 0 && (
                <button
                  onClick={() => confirmAssignment('broadcast')}
                  className="px-8 h-14 bg-white text-indigo-600 border-2 border-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95"
                >
                  Broadcast to {assignmentModal.candidates.length} Workers
                </button>
              )}
              {assignmentModal.bestWorker && (
                <Button
                  onClick={() => confirmAssignment('assign')}
                  disabled={busy}
                  className="px-10 h-14 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 active:scale-95"
                >
                  Confirm Assignment
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {rejectionModal.visible && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full animate-in zoom-in duration-300 overflow-hidden border border-red-50">
            <div className="p-10 border-b bg-red-50/30 flex justify-between items-center">
              <h3 className="text-2xl font-black text-red-600 tracking-tighter">Review Feedback</h3>
              <button
                onClick={() => setRejectionModal({ visible: false, taskId: null, reason: "" })}
                className="text-gray-400 hover:text-gray-900 transition-all"
              >✕</button>
            </div>
            <div className="p-10 space-y-8">
              <p className="text-gray-500 text-sm font-bold leading-relaxed">Outline the critical issues preventing project seal. The specialist will receive this feedback immediately via encrypted link.</p>
              <textarea
                value={rejectionModal.reason}
                onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                className="w-full px-6 py-5 bg-gray-50 border border-gray-200 rounded-3xl focus:ring-8 focus:ring-red-50 transition-all outline-none text-sm font-bold"
                rows={4}
                placeholder="LOG DIAGNOSTIC..."
              />
            </div>
            <div className="p-10 border-t bg-gray-50/50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRejectionModal({ visible: false, taskId: null, reason: "" })} disabled={busy} className="rounded-2xl px-6">CANCEL</Button>
              <Button variant="danger" onClick={confirmRejectTask} disabled={busy} className="bg-red-600 hover:bg-red-700 font-black text-xs tracking-widest px-8 rounded-2xl shadow-2xl shadow-red-100">DISPATCH REJECTION</Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
