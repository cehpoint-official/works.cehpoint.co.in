// pages/admin/tasks.tsx
import { useEffect, useState, ChangeEvent } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import Head from "next/head";

import Layout from "../../components/Layout";
import Card from "../../components/Card";
import Button from "../../components/Button";

import { storage } from "../../utils/storage";
import type { User, Task, Payment, Currency, Domain } from "../../utils/types";
import { findWorkerForTask, AssignmentExplanation } from "../../utils/taskAssignment";
import { mailService } from "../../utils/mailService";
import Chat from "../../components/Chat";

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
  ExternalLink,
  MessageSquare,
  X,
  Search,
  UserMinus,
  AlertTriangle,
  ShieldAlert,
  Undo2
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
  assignedWorkerIds: string[];
  workerPayouts: Record<string, number>;
  payoutSchedule: "weekly" | "one-time";
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
    assignedWorkerIds: [],
    workerPayouts: {},
    payoutSchedule: "weekly",
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

  const [activeChatTask, setActiveChatTask] = useState<string | null>(null);
  const [workerSearch, setWorkerSearch] = useState("");

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

  // 🔹 Termination Modal State
  const [terminationModal, setTerminationModal] = useState<{
    visible: boolean;
    taskId: string | null;
    workerId: string | null;
    workerName: string;
    reason: string;
  }>({
    visible: false,
    taskId: null,
    workerId: null,
    workerName: "",
    reason: ""
  });

  // 🔹 Dynamic Skills
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);

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
        const [users, list, dbSkills, dbDomains] = await Promise.all([
          storage.getUsers(),
          storage.getTasks(),
          storage.getSkills(),
          storage.getDomains(),
        ]);

        if (!mounted) return;

        const workerList = users.filter((u) => u.role === "worker");
        setWorkers(workerList);

        // Aggregate unique names from Domains in DB + Skills in DB
        const domainNames = (dbDomains || []).map(d => d.name);

        const allExpertise = Array.from(new Set([
          ...domainNames,
          ...(dbSkills || []),
          ...(dbDomains || []).flatMap(d => d.stacks || [])
        ])).sort();

        if (dbDomains) setDomains(dbDomains);

        setAvailableSkills(allExpertise);

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
        status: (bestWorker || newTask.assignedWorkerIds.length > 0) ? "in-progress" : "available",
        assignedTo: newTask.assignedWorkerIds[0] || (bestWorker ? bestWorker.id : null),
        assignedWorkerIds: newTask.assignedWorkerIds.length > 0 ? newTask.assignedWorkerIds : (bestWorker ? [bestWorker.id] : []),
        assignedAt: (newTask.assignedWorkerIds.length > 0 || bestWorker) ? new Date().toISOString() : null,
        workerPayouts: newTask.workerPayouts,
        submissionUrl: "",
        createdAt: new Date().toISOString(),
        createdBy: currentAdmin.id,
        // @ts-ignore
        payoutSchedule: newTask.payoutSchedule,
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
        if (!finalPayload.assignedTo && (!finalPayload.assignedWorkerIds || finalPayload.assignedWorkerIds.length === 0)) {
          finalPayload.status = "available";
        }
      } else if (action === 'broadcast') {
        finalPayload.status = "available";
        finalPayload.assignedTo = null;
        finalPayload.assignedAt = null;
        finalPayload.assignedWorkerIds = [];
        finalPayload.candidateWorkerIds = assignmentModal.candidates.map(u => u.id);
      } else {
        finalPayload.status = "available";
        finalPayload.assignedTo = null;
        finalPayload.assignedAt = null;
        finalPayload.assignedWorkerIds = [];
        finalPayload.candidateWorkerIds = null;
      }

      // @ts-ignore
      const createdTask = await storage.createTask(finalPayload);
      await reloadTasks();

      // Notifications
      if (action === 'assign' && finalPayload.assignedWorkerIds?.length > 0) {
        await Promise.all(finalPayload.assignedWorkerIds.map((uid: string) =>
          storage.createNotification({
            userId: uid,
            title: "New Mission Assigned",
            message: `You've been selected for "${finalPayload.title}". Check your dashboard to begin.`,
            type: "success",
            read: false,
            createdAt: new Date().toISOString(),
            link: "/dashboard"
          })
        )).catch(e => console.error("Notification failed", e));
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
        assignedWorkerIds: [],
        workerPayouts: {},
        payoutSchedule: "weekly",
      });
      setWeeklyPayoutInput("");
      setShowCreate(false);
      setAssignmentModal({ ...assignmentModal, visible: false });

      if (action === 'broadcast') {
        const candidateEmails = assignmentModal.candidates.map(u => u.email).filter(Boolean);
        if (candidateEmails.length > 0) {
          toast.promise(
            mailService.sendBroadcastNotification(candidateEmails, finalPayload.title),
            {
              loading: 'Dispatching broadcast emails...',
              success: `Broadcast sent to ${candidateEmails.length} specialists.`,
              error: 'Broadcast email failed (check SMTP settings).',
            }
          );
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
      const task = tasks.find(t => t.id === taskId);
      const currentIds = task?.assignedWorkerIds || [];
      const newIds = Array.from(new Set([...currentIds, workerId]));

      await storage.updateTask(taskId, {
        assignedTo: workerId, // usually the most recent or primary
        assignedWorkerIds: newIds,
        status: "in-progress",
        assignedAt: task?.assignedAt || new Date().toISOString(),
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

  const confirmTerminateWorker = async () => {
    const { taskId, workerId, reason } = terminationModal;
    if (!taskId || !workerId) return;

    try {
      setBusy(true);
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedWorkerIds = (task.assignedWorkerIds || []).filter(id => id !== workerId);

      const updates: any = {
        assignedWorkerIds: updatedWorkerIds
      };

      if (task.assignedTo === workerId) {
        updates.assignedTo = updatedWorkerIds[0] || null;
      }

      await storage.updateTask(taskId, updates);

      await storage.createNotification({
        userId: workerId,
        title: "Project Termination",
        message: `Your assignment to "${task.title}" has been terminated. Reason: ${reason || "Policy violation"}.`,
        type: "error",
        read: false,
        createdAt: new Date().toISOString()
      }).catch(e => console.error("Notification failed", e));

      toast.success("Worker terminated from project.");
      setTerminationModal({ ...terminationModal, visible: false });
      await reloadTasks();
    } catch (err) {
      console.error("Termination failed:", err);
      toast.error("Failed to terminate worker.");
    } finally {
      setBusy(false);
    }
  };

  const handleApproveResignation = async (task: Task) => {
    try {
      setBusy(true);
      const workerId = task.resignationWorkerId || task.assignedTo || (task.assignedWorkerIds && task.assignedWorkerIds[0]);

      if (!workerId) {
        toast.error("Could not identify the worker to release.");
        return;
      }

      // Filter out the resigning worker
      const updatedWorkerIds = (task.assignedWorkerIds || []).filter(id => id !== workerId);

      const updates: any = {
        assignedWorkerIds: updatedWorkerIds,
        resignationRequested: false,
        resignationReason: "",
        resignationRequestedAt: "",
        resignationWorkerId: null
      };

      // Update primary assignedTo if necessary
      if (task.assignedTo === workerId) {
        updates.assignedTo = updatedWorkerIds.length > 0 ? updatedWorkerIds[0] : null;
      }

      // If no workers left, reset status to available
      if (updatedWorkerIds.length === 0) {
        updates.status = "available";
        updates.assignedAt = null;
      }

      await storage.updateTask(task.id, updates);

      await storage.createNotification({
        userId: workerId,
        title: "Withdrawal Approved",
        message: `Admin has approved your request to step back from project "${task.title}". Your seat has been released.`,
        type: "info",
        read: false,
        createdAt: new Date().toISOString()
      });

      toast.success("Specialist released from project.");
      await reloadTasks();
    } catch (e) {
      toast.error("Failed to release specialist.");
    } finally {
      setBusy(false);
    }
  };

  const handleDenyResignation = async (task: Task) => {
    try {
      setBusy(true);
      await storage.updateTask(task.id, {
        resignationRequested: false,
        resignationReason: "",
        resignationRequestedAt: ""
      });

      const workerId = task.assignedTo || (task.assignedWorkerIds && task.assignedWorkerIds[0]);
      if (workerId) {
        await storage.createNotification({
          userId: workerId,
          title: "Withdrawal Denied",
          message: `Admin has reviewed and denied your request to step back from "${task.title}". Please continue your assignment.`,
          type: "error",
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      toast.success("Resignation request denied.");
      await reloadTasks();
    } catch (e) {
      toast.error("Operation failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleApproveTask = async (taskId: string) => {
    const job = tasks.find((t) => t.id === taskId);
    if (!job || (!job.assignedTo && (!job.assignedWorkerIds || job.assignedWorkerIds.length === 0))) return;
    performApprove(job);
  };

  const performApprove = async (job: Task) => {
    try {
      setBusy(true);
      await storage.updateTask(job.id, {
        status: "completed",
        completedAt: new Date().toISOString(),
      });

      const primaryUid = job.assignedTo || (job.assignedWorkerIds && job.assignedWorkerIds[0]);
      if (!primaryUid) throw new Error("No worker assigned");

      // 🔹 Calculate correct payout (Priority: Override > Base)
      const payoutAmount = (job.workerPayouts && job.workerPayouts[primaryUid]) ?? job.weeklyPayout;
      const isOneTime = job.payoutSchedule === "one-time";

      await storage.createPayment({
        userId: primaryUid,
        amount: payoutAmount,
        type: isOneTime ? "manual" : "task-payment",
        status: "completed",
        taskId: job.id,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        payoutMethodDetails: `${isOneTime ? "Project Settlement" : "Weekly Payout"}: ${job.title}`
      });

      const worker = await storage.getUserById(primaryUid);
      if (worker) {
        await storage.updateUser(worker.id, { balance: (worker.balance || 0) + payoutAmount });

        await storage.createNotification({
          userId: worker.id,
          title: "Payment Received",
          message: `Your work on "${job.title}" was approved. ${formatMoney(payoutAmount, worker.preferredCurrency || "USD")} ${isOneTime ? "Settlement" : "Weekly Payout"} credited.`,
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
      const recipientId = rejectedTask?.assignedTo || (rejectedTask?.assignedWorkerIds && rejectedTask?.assignedWorkerIds[0]);

      if (recipientId) {
        await storage.createNotification({
          userId: recipientId,
          title: "Task Feedback",
          message: `Your submission for "${rejectedTask?.title}" requires revisions.`,
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
    if (confirm("Are you sure you want to delete this mission?")) {
      performDelete(taskId);
    }
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
                    {domains.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
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
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    {newTask.payoutSchedule === "one-time" ? `Final Project Grant (${currency})` : `Weekly Payout (${currency})`}
                  </label>
                  <input
                    type="number"
                    value={weeklyPayoutInput}
                    onChange={handleWeeklyPayoutChange}
                    className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl font-bold text-lg text-indigo-600 outline-none focus:border-indigo-600 transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Payment Model</label>
                  <div className="flex p-1 bg-white border border-gray-200 rounded-xl w-full">
                    <button
                      type="button"
                      onClick={() => setNewTask({ ...newTask, payoutSchedule: "weekly" })}
                      className={`flex-1 h-9 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${newTask.payoutSchedule === "weekly" ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      Weekly Payout
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTask({ ...newTask, payoutSchedule: "one-time" })}
                      className={`flex-1 h-9 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${newTask.payoutSchedule === "one-time" ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      Final Settlement
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Skill Matrix Selection</label>
                <div className="flex flex-wrap gap-2">
                  {availableSkills
                    .filter(skill => {
                      if (!newTask.category || newTask.category === "General") return true;
                      const selectedDomain = domains.find(d => d.name === newTask.category);
                      if (!selectedDomain) return true;
                      // Show if it's a stack of the selected domain OR if it's already selected
                      return (selectedDomain.stacks || []).includes(skill) || newTask.skills.includes(skill);
                    })
                    .map((skill) => (
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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider items-center flex gap-2">
                    <UserIcon size={14} className="text-indigo-600" /> Manually Assign Specialists <span className="text-[10px] text-gray-400 font-normal normal-case italic">(Optional)</span>
                  </label>
                  {newTask.assignedWorkerIds.length > 0 && (
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg animate-in zoom-in duration-300">
                      {newTask.assignedWorkerIds.length} Selected
                    </span>
                  )}
                </div>

                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-all duration-300" size={16} />
                  <input
                    type="text"
                    value={workerSearch}
                    onChange={(e) => setWorkerSearch(e.target.value)}
                    placeholder="Search specialists by domain or expertise (e.g. SEO, Developer)..."
                    className="w-full h-12 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-sm shadow-sm"
                  />
                  {workerSearch && (
                    <button
                      onClick={() => setWorkerSearch("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-5 bg-gray-50/50 border border-gray-100 rounded-[2rem] shadow-inner custom-scrollbar">
                  {workers
                    .filter(w =>
                      (w.primaryDomain || "").toLowerCase().includes(workerSearch.toLowerCase()) ||
                      (Array.isArray(w.skills) && w.skills.some(s => s.toLowerCase().includes(workerSearch.toLowerCase()))) ||
                      newTask.assignedWorkerIds.includes(w.id)
                    )
                    .sort((a, b) => {
                      const aSel = newTask.assignedWorkerIds.includes(a.id);
                      const bSel = newTask.assignedWorkerIds.includes(b.id);
                      if (aSel && !bSel) return -1;
                      if (!aSel && bSel) return 1;
                      return 0;
                    })
                    .map((worker) => {
                      const isSelected = newTask.assignedWorkerIds.includes(worker.id);
                      return (
                        <button
                          key={worker.id}
                          type="button"
                          onClick={() => {
                            setNewTask(prev => ({
                              ...prev,
                              assignedWorkerIds: isSelected
                                ? prev.assignedWorkerIds.filter(id => id !== worker.id)
                                : [...prev.assignedWorkerIds, worker.id]
                            }));
                          }}
                          className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-3 group/btn animate-in fade-in duration-300 ${isSelected
                            ? "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                            : "border-white bg-white text-gray-500 hover:border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                            }`}
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] shrink-0 transition-colors ${isSelected ? 'bg-white/20' : 'bg-gray-100 text-gray-400'}`}>
                            {worker.fullName.charAt(0)}
                          </div>
                          <div className="text-left min-w-0">
                            <p className="leading-none truncate max-w-[120px] mb-1">{worker.fullName}</p>
                            <p className={`text-[9px] font-black uppercase tracking-widest truncate max-w-[140px] ${isSelected ? 'text-white/80' : 'text-indigo-400'}`}>
                              {worker.primaryDomain || (Array.isArray(worker.skills) && worker.skills.length > 0 ? worker.skills[0] : "SPECIALIST")}
                            </p>
                          </div>
                          {isSelected && <X size={12} className="ml-1 opacity-60 hover:opacity-100 shrink-0" />}
                        </button>
                      );
                    })}

                  {workers.filter(w =>
                    (w.primaryDomain || "").toLowerCase().includes(workerSearch.toLowerCase()) ||
                    (Array.isArray(w.skills) && w.skills.some(s => s.toLowerCase().includes(workerSearch.toLowerCase())))
                  ).length === 0 && (
                      <div className="w-full text-center py-8">
                        <UserIcon className="mx-auto text-gray-200 mb-2" size={32} />
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">No matching specialists</p>
                      </div>
                    )}
                </div>
              </div>

              {newTask.assignedWorkerIds.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-500">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <Rocket size={14} className="text-indigo-600" /> Individual Payout Config <span className="text-[10px] text-gray-400 font-normal normal-case italic">(Optional)</span>
                    </label>
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-50 px-2 py-1 rounded-lg">Override Mode</span>
                  </div>
                  <div className="grid gap-3">
                    {newTask.assignedWorkerIds.map(uid => {
                      const worker = workers.find(w => w.id === uid);
                      if (!worker) return null;
                      return (
                        <div key={uid} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-indigo-100 transition-all group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              {worker.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-700">{worker.fullName}</p>
                              <p className="text-[9px] text-gray-400 font-bold uppercase">{worker.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-xl border border-transparent group-focus-within:border-indigo-100 group-focus-within:bg-white transition-all">
                            <span className="text-xs font-bold text-gray-400 ml-2">{currency === "INR" ? "₹" : "$"}</span>
                            <input
                              type="number"
                              placeholder="0.00"
                              className="w-24 h-9 px-3 bg-transparent rounded-lg outline-none transition-all text-sm font-bold text-right text-indigo-600 placeholder:text-gray-300"
                              value={newTask.workerPayouts[uid] ? (currency === "INR" ? Math.round(newTask.workerPayouts[uid] * INR_RATE) : newTask.workerPayouts[uid]) : ""}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const baseUsd = currency === "INR" ? val / INR_RATE : val;
                                setNewTask(prev => ({
                                  ...prev,
                                  workerPayouts: { ...prev.workerPayouts, [uid]: baseUsd }
                                }));
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
            const assignedWorkers = workers.filter((w) => task.assignedWorkerIds?.includes(w.id)) || [];
            const primaryWorker = workers.find((w) => w.id === task.assignedTo) || assignedWorkers[0] || null;

            // 🔹 Calculate total grant if manual overrides exist
            const totalOverride = task.workerPayouts && Object.keys(task.workerPayouts).length > 0
              ? Object.values(task.workerPayouts).reduce((sum, val) => sum + (Number(val) || 0), 0)
              : 0;
            const displayGrant = totalOverride > 0 ? totalOverride : task.weeklyPayout;

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
                        <p className="text-gray-400 font-bold uppercase tracking-wider mb-0.5">Specialists</p>
                        <p className="text-gray-900 font-bold whitespace-nowrap leading-none mb-1 text-sm">
                          {assignedWorkers.length > 0 ? (
                            assignedWorkers.length === 1 ? assignedWorkers[0].fullName : `${assignedWorkers.length} Specialists`
                          ) : 'Recruiting'}
                        </p>
                        {assignedWorkers.length === 1 && (
                          <div className="flex flex-col text-[10px] text-gray-400 font-medium tracking-tight">
                            <span>{assignedWorkers[0].email}</span>
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
                      <p className="text-xl font-bold text-gray-900 leading-none mb-1">
                        {formatMoney(displayGrant, currency)}
                        {task.payoutSchedule !== "one-time" && <span className="text-[10px] ml-1 opacity-40">/WK</span>}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-right">
                        {task.payoutSchedule === "one-time" ? "Manual / Final Settlement" : (totalOverride > 0 ? "Weekly (Overwritten)" : "Standard Weekly Payout")}
                      </p>
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

                        {task.resignationRequested && (
                          <section className="animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="bg-rose-50 border-2 border-rose-100 rounded-[2rem] p-8 space-y-6 relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-8 text-rose-100/20">
                                <Undo2 size={120} />
                              </div>
                              <div className="flex items-center gap-4 text-rose-600">
                                <AlertTriangle size={24} />
                                <div>
                                  <h4 className="text-lg font-black uppercase tracking-tight">Withdrawal Request Dispatched</h4>
                                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none">
                                    BY: {workers.find(w => w.id === (task.resignationWorkerId || task.assignedTo))?.fullName || "Unknown Specialist"}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-3 relative z-10">
                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest pl-1">Justification</p>
                                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-rose-100 text-sm font-medium text-rose-900 leading-relaxed shadow-sm">
                                  "{task.resignationReason}"
                                  <p className="mt-4 text-[10px] text-rose-400 font-bold uppercase whitespace-nowrap">
                                    Requested on {task.resignationRequestedAt && format(new Date(task.resignationRequestedAt), "MMM dd, yyyy • hh:mm a")}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-4 pt-4">
                                <Button
                                  onClick={() => handleApproveResignation(task)}
                                  disabled={busy}
                                  className="h-14 px-8 bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/20 rounded-2xl font-black uppercase tracking-widest text-[10px] flex-1"
                                >
                                  Approve Release
                                </Button>
                                <Button
                                  onClick={() => handleDenyResignation(task)}
                                  disabled={busy}
                                  variant="outline"
                                  className="h-14 px-8 border-rose-200 text-rose-600 hover:bg-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex-1"
                                >
                                  Deny Request
                                </Button>
                              </div>
                            </div>
                          </section>
                        )}

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
                          <section>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">LATEST SUBMISSION</h4>
                              <span className="text-[10px] font-bold text-gray-400 px-3 py-1 bg-white border border-gray-200 rounded-full uppercase">
                                Received {task.submittedAt && format(new Date(task.submittedAt), "MMM dd • hh:mm a")}
                              </span>
                            </div>
                            <div className="p-6 flex flex-col gap-4 bg-gray-50 border border-gray-100 rounded-2xl">
                              {task.submissionUrl.split('\n').map((line, i) => {
                                if (line.startsWith('###')) return null;
                                const kvMatch = line.match(/^\*\*(.*?):\*\*\s*(.*)$/);
                                if (kvMatch) {
                                  let label = kvMatch[1].replace(/🔗|🌐|⏱️|📎|📄/g, '').trim();
                                  let value = kvMatch[2].trim();
                                  const isUrl = value.startsWith('http');

                                  return (
                                    <div key={i} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 transition-all group">
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
                                            {value}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )
                                }
                                return <p key={i} className="text-xs text-gray-500 mt-2">{line}</p>;
                              })}
                            </div>
                          </section>
                        )}
                      </div>

                      <div className="flex flex-col gap-8">
                        <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 shadow-inner">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">PROJECT STEWARDS</h4>
                          {(task.status === "available" || assignedWorkers.length === 0) ? (
                            <div className="space-y-4">
                              <select
                                value={task.assignedTo || ""}
                                onChange={(e) => handleAssignTask(task.id, e.target.value)}
                                className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-2xl font-black text-sm text-gray-900 focus:ring-8 focus:ring-indigo-50 transition-all outline-none appearance-none cursor-pointer"
                              >
                                <option value="">MANUAL OVERRIDE...</option>
                                {workers.map((w) => (
                                  <option key={w.id} value={w.id}>
                                    {w.fullName} — {(w.primaryDomain || (w.skills?.[0] || "Specialist")).toUpperCase()}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {assignedWorkers.map(w => (
                                <div key={w.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                                    {w.fullName.charAt(0)}
                                  </div>
                                  <div className="flex-1 min-w-0 pr-2">
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-sm text-gray-900 truncate">{w.fullName}</p>
                                      {task.workerPayouts?.[w.id] && (
                                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100 uppercase tracking-tighter shrink-0">
                                          {formatMoney(task.workerPayouts[w.id], currency)}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase truncate">
                                      {w.primaryDomain || (w.skills && w.skills.length > 0 ? w.skills.slice(0, 2).join(", ") : w.email)}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => setTerminationModal({
                                      visible: true,
                                      taskId: task.id,
                                      workerId: w.id,
                                      workerName: w.fullName,
                                      reason: ""
                                    })}
                                    className="w-10 h-10 flex items-center justify-center bg-gray-50 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 border border-gray-200 rounded-2xl transition-all shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-95 group/term shrink-0"
                                    title="Terminate Specialist"
                                  >
                                    <UserMinus size={18} className="group-hover/term:rotate-6 transition-transform" />
                                  </button>
                                </div>
                              ))}

                              <div className="pt-4 border-t border-gray-100 mt-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Add Replacement / Extra Hand</p>
                                <select
                                  value=""
                                  onChange={(e) => handleAssignTask(task.id, e.target.value)}
                                  className="w-full px-5 py-3 bg-white border-2 border-slate-100 rounded-xl font-bold text-xs text-slate-600 focus:border-indigo-600 transition-all outline-none appearance-none cursor-pointer"
                                >
                                  <option value="">SELECT SPECIALIST...</option>
                                  {workers
                                    .filter(w => !task.assignedWorkerIds?.includes(w.id))
                                    .map((w) => {
                                      const specialization = w.primaryDomain || (w.skills && w.skills.length > 0 ? w.skills.slice(0, 2).join(", ") : "Specialist");
                                      return (
                                        <option key={w.id} value={w.id}>
                                          {w.fullName} — {specialization.toUpperCase()}
                                        </option>
                                      );
                                    })}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>

                        {assignedWorkers.length > 0 && (
                          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col gap-4">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">COMMUNICATION</span>
                            <Button
                              onClick={() => setActiveChatTask(task.id)}
                              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-black tracking-widest uppercase text-[10px] py-4 rounded-2xl transition-all shadow-xl shadow-indigo-100"
                            >
                              <MessageSquare size={16} /> Open Chat Channel
                            </Button>
                          </div>
                        )}

                        <div className="mt-auto space-y-4 pt-10 border-t border-gray-50">
                          {task.status === "submitted" && (
                            <div className="grid grid-cols-2 gap-4">
                              <Button
                                onClick={() => handleApproveTask(task.id)}
                                className="bg-green-600 hover:bg-green-700 shadow-xl shadow-green-100 font-black h-auto py-5 rounded-2xl text-[10px] uppercase tracking-widest"
                              >
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                onClick={() => handleRejectTask(task.id)}
                                className="font-black h-auto py-5 rounded-2xl text-[10px] uppercase tracking-widest"
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => handleDeleteTask(task.id)}
                            className="w-full border-2 border-red-50 text-red-500 hover:bg-red-50 font-black tracking-widest uppercase text-[10px] py-5 rounded-2xl"
                          >
                            DELETE MISSION
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
                }
              </Card>
            );
          })}
        </div>
      </div>

      {/* Assignment Modal */}
      {
        assignmentModal.visible && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[40px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-8 border-b flex justify-between items-center">
                <h3 className="text-2xl font-black">Assignment Engine</h3>
                <button onClick={() => setAssignmentModal({ ...assignmentModal, visible: false })} className="text-gray-400">✕</button>
              </div>
              <div className="p-8 overflow-y-auto flex-1">
                {/* Simplified modal content for brevity, can be expanded back if needed */}
                <p className="text-gray-600 mb-6">Confirm assignment for <strong>{assignmentModal.pendingTask?.title}</strong></p>
                <div className="space-y-4">
                  {assignmentModal.bestWorker && (
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                      <p className="text-xs font-bold text-indigo-400 uppercase mb-1">Recommended Specialist</p>
                      <p className="font-bold text-indigo-900">{assignmentModal.bestWorker.fullName}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-8 border-t flex flex-wrap justify-end gap-3 bg-gray-50">
                <Button variant="outline" onClick={() => setAssignmentModal({ ...assignmentModal, visible: false })}>Cancel</Button>
                <Button onClick={() => confirmAssignment('create-open')} variant="outline">Open to All</Button>
                <Button onClick={() => confirmAssignment('broadcast')} variant="outline">Broadcast</Button>
                <Button onClick={() => confirmAssignment('assign')}>Confirm</Button>
              </div>
            </div>
          </div>
        )
      }

      {/* Termination Modal */}
      {
        terminationModal.visible && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[110] text-gray-900">
            <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 border-b bg-red-50/50 flex flex-col gap-2">
                <div className="flex justify-between items-center text-red-600">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={20} />
                    <h3 className="text-xl font-black uppercase tracking-tight">Revoke Access</h3>
                  </div>
                  <button onClick={() => setTerminationModal({ ...terminationModal, visible: false })} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <p className="text-xs font-bold text-red-400 uppercase tracking-widest leading-none">Terminating {terminationModal.workerName}</p>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Termination Reason</label>
                  <textarea
                    value={terminationModal.reason}
                    onChange={(e) => setTerminationModal({ ...terminationModal, reason: e.target.value })}
                    className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-red-100 focus:bg-white rounded-3xl outline-none transition-all text-sm font-medium min-h-[120px]"
                    placeholder="Specify the violation or reason for early project termination..."
                  />
                </div>
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-4">
                  <ShieldAlert className="text-red-500 shrink-0" size={18} />
                  <p className="text-[11px] text-red-700 font-bold leading-tight">
                    This action will immediately remove the specialist from the project and notify them of the termination reason.
                  </p>
                </div>
              </div>
              <div className="p-8 border-t bg-gray-50 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setTerminationModal({ ...terminationModal, visible: false })} className="h-12 px-6 rounded-xl font-bold">Discard</Button>
                <Button onClick={confirmTerminateWorker} className="h-12 px-8 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-100 rounded-xl font-black uppercase tracking-widest text-[10px]">Execute Termination</Button>
              </div>
            </div>
          </div>
        )
      }

      {/* Rejection Modal */}
      {
        rejectionModal.visible && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 text-white">
            <div className="bg-white text-gray-900 rounded-[40px] shadow-2xl max-w-md w-full overflow-hidden">
              <div className="p-8 border-b flex justify-between items-center">
                <h3 className="text-xl font-bold">Feedback</h3>
                <button onClick={() => setRejectionModal({ visible: false, taskId: null, reason: "" })}>✕</button>
              </div>
              <div className="p-8 space-y-4">
                <textarea
                  value={rejectionModal.reason}
                  onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                  className="w-full p-4 bg-gray-50 border rounded-2xl outline-none"
                  rows={4}
                  placeholder="Why is this being rejected?"
                />
              </div>
              <div className="p-8 border-t flex justify-end gap-3">
                <Button variant="outline" onClick={() => setRejectionModal({ visible: false, taskId: null, reason: "" })}>Cancel</Button>
                <Button variant="danger" onClick={confirmRejectTask}>Confirm Rejection</Button>
              </div>
            </div>
          </div>
        )
      }

      {/* Chat Overlay */}
      {
        activeChatTask && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setActiveChatTask(null)}>
            <div className="relative w-full max-w-2xl" onClick={e => e.stopPropagation()}>
              <Chat
                taskId={activeChatTask}
                currentUser={currentAdmin!}
                onClose={() => setActiveChatTask(null)}
              />
            </div>
          </div>
        )
      }
    </Layout >
  );
}
