// pages/admin/tasks.tsx
import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

import Layout from "../../components/Layout";
import Card from "../../components/Card";
import Button from "../../components/Button";

import { storage } from "../../utils/storage";
import type { User, Task, Payment, Currency } from "../../utils/types";
import { findWorkerForTask, AssignmentExplanation } from "../../utils/taskAssignment";

import { Plus } from "lucide-react";

type NewTaskForm = {
  title: string;
  description: string;
  category: string;
  skills: string[];
  weeklyPayout: number; // stored in base USD
  deadline: string;
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
          // Merge DB skills with default, removing duplicates
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
        alert("Failed to load admin data. Please check console.");
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
      alert("Skill already added");
      return;
    }
    setNewTask(prev => ({
      ...prev,
      skills: [...prev.skills, trimmed]
    }));
    // Add to available list so it shows up in the grid
    setAvailableSkills(prev => {
      if (prev.some(s => s.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [...prev, trimmed];
    });
    setCustomSkill("");
  };

  /* -------------------------------------------------------
   * HANDLE CURRENCY CHANGE
   * ----------------------------------------------------- */
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
      alert("Failed to update currency preference.");
    } finally {
      setUpdatingCurrency(false);
    }
  };

  /* -------------------------------------------------------
   * WEEKLY PAYOUT INPUT HANDLER (FIXED)
   * ----------------------------------------------------- */
  const handleWeeklyPayoutChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Allow the field to be completely empty while typing
    setWeeklyPayoutInput(raw);

    if (raw === "") {
      setNewTask((prev) => ({ ...prev, weeklyPayout: 0 }));
      return;
    }

    const val = parseFloat(raw);
    if (isNaN(val)) {
      return;
    }

    const baseUsd = toBase(val, currency);
    setNewTask((prev) => ({ ...prev, weeklyPayout: baseUsd }));
  };

  /* -------------------------------------------------------
   * CREATE TASK
   * ----------------------------------------------------- */
  const handleCreateTask = async () => {
    if (
      !newTask.title.trim() ||
      !newTask.description.trim() ||
      !newTask.category.trim() ||
      newTask.skills.length === 0 ||
      !newTask.deadline
    ) {
      alert("Please fill all fields.");
      return;
    }

    if (!currentAdmin) {
      alert("Admin session missing.");
      return;
    }

    try {
      setBusy(true);

      // 🔹 Try to find a worker to auto-assign
      const { candidates, bestWorker, log, analysis } = findWorkerForTask(newTask, workers, tasks);

      const payload: Omit<Task, "id"> = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        category: newTask.category.trim(),
        skills: newTask.skills,
        weeklyPayout: Number(newTask.weeklyPayout) || 0, // stored as USD
        deadline: newTask.deadline,
        status: bestWorker ? "in-progress" : "available",
        assignedTo: bestWorker ? bestWorker.id : null,
        assignedAt: bestWorker ? new Date().toISOString() : null,
        submissionUrl: "",
        createdAt: new Date().toISOString(),
        createdBy: currentAdmin.id,
      };

      // Remove undefined values to please Firestore
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, v]) => v !== undefined)
      );

      // 🔹 Save new skills to DB
      const newSkills = newTask.skills.filter(s => !availableSkills.includes(s));
      if (newSkills.length > 0) {
        newSkills.forEach(s => storage.addSkill(s)); // non-blocking
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
      alert("An error occurred while preparing the task.");
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
        // Already set up for bestWorker in handleCreateTask logic
        // Just ensure status is valid
        if (!finalPayload.assignedTo) {
          // Fallback if came from a path where bestWorker wasn't set but 'assign' was clicked (unlikely)
          finalPayload.status = "available";
        }
      } else if (action === 'broadcast') {
        // Broadcast to all candidates
        finalPayload.status = "available";
        finalPayload.assignedTo = null;
        finalPayload.assignedAt = null;
        finalPayload.candidateWorkerIds = assignmentModal.candidates.map(u => u.id);
      } else {
        // create-open (Reject Assignment or manual create)
        finalPayload.status = "available";
        finalPayload.assignedTo = null;
        finalPayload.assignedAt = null;
        finalPayload.candidateWorkerIds = null; // No restriction
      }

      // @ts-ignore
      await storage.createTask(finalPayload);

      await reloadTasks();

      setNewTask({
        title: "",
        description: "",
        category: "",
        skills: [],
        weeklyPayout: 0,
        deadline: "",
      });
      setWeeklyPayoutInput("");
      setShowCreate(false);
      setAssignmentModal({ ...assignmentModal, visible: false });

      alert(action === 'assign' ? "Task created and assigned." :
        action === 'broadcast' ? `Task created and broadcasted to ${assignmentModal.candidates.length} candidates.` :
          "Task created (open availability).");
    } catch (err) {
      console.error("Failed to confirm task:", err);
      alert("Failed to create task");
    } finally {
      setBusy(false);
    }
  };

  /* -------------------------------------------------------
   * ASSIGN TASK
   * ----------------------------------------------------- */
  const handleAssignTask = async (taskId: string, workerId: string) => {
    if (!workerId) {
      alert("Select a worker to assign.");
      return;
    }

    if (!confirm("Assign this task to the selected worker?")) return;

    try {
      setBusy(true);
      await storage.updateTask(taskId, {
        assignedTo: workerId,
        status: "in-progress",
        assignedAt: new Date().toISOString(),
      });
      await reloadTasks();
      alert("Task assigned.");
    } catch (err) {
      console.error("assignTask error:", err);
      alert("Failed to assign task.");
    } finally {
      setBusy(false);
    }
  };

  /* -------------------------------------------------------
   * APPROVE TASK (mark completed + payment)
   * ----------------------------------------------------- */
  const handleApproveTask = async (taskId: string) => {
    const job = tasks.find((t) => t.id === taskId);
    if (!job) {
      alert("Task not found.");
      return;
    }
    if (!job.assignedTo) {
      alert("Task is not assigned to any worker.");
      return;
    }

    if (!confirm("Approve this task and release payment?")) return;

    try {
      setBusy(true);

      await storage.updateTask(taskId, {
        status: "completed",
        completedAt: new Date().toISOString(),
      });

      const payment: Omit<Payment, "id"> = {
        userId: job.assignedTo,
        amount: job.weeklyPayout, // base USD
        type: "task-payment",
        status: "completed",
        taskId: job.id,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      await storage.createPayment(payment);

      try {
        const worker = await storage.getUserById(job.assignedTo);
        if (worker) {
          const newBalance = (worker.balance || 0) + job.weeklyPayout;
          await storage.updateUser(worker.id, { balance: newBalance });
        }
      } catch (err) {
        console.warn("Failed to update worker balance:", err);
      }

      await reloadTasks();
      alert("Task approved and payment processed.");
    } catch (err) {
      console.error("approveTask error:", err);
      alert("Failed to approve task.");
    } finally {
      setBusy(false);
    }
  };

  /* -------------------------------------------------------
   * REJECT TASK
   * ----------------------------------------------------- */
  const handleRejectTask = async (taskId: string) => {
    const feedback = prompt("Enter rejection reason (optional):") || "";
    if (!feedback && !confirm("No feedback entered. Reject anyway?")) return;

    try {
      setBusy(true);
      await storage.updateTask(taskId, {
        status: "rejected",
        feedback: feedback || undefined,
      });
      await reloadTasks();
      alert("Task rejected.");
    } catch (err) {
      console.error("rejectTask error:", err);
      alert("Failed to reject task.");
    } finally {
      setBusy(false);
    }
  };

  /* -------------------------------------------------------
   * DELETE TASK
   * ----------------------------------------------------- */
  const handleDeleteTask = async (taskId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this task? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setBusy(true);
      // @ts-ignore allow dynamic method
      if (typeof (storage as any).deleteTask === "function") {
        // @ts-ignore
        await (storage as any).deleteTask(taskId);
      } else {
        console.warn("storage.deleteTask is not implemented.");
        alert("Delete is not supported by storage.");
      }

      await reloadTasks();
      alert("Task deleted.");
    } catch (err) {
      console.error("deleteTask error:", err);
      alert("Failed to delete task.");
    } finally {
      setBusy(false);
    }
  };

  /* -------------------------------------------------------
   * SKILL TOGGLE (CREATE FORM)
   * ----------------------------------------------------- */
  const handleSkillToggle = (skill: string) => {
    setNewTask((prev) => {
      if (prev.skills.includes(skill)) {
        return { ...prev, skills: prev.skills.filter((s) => s !== skill) };
      }
      return { ...prev, skills: [...prev.skills, skill] };
    });
  };

  if (pageLoading) return null;
  if (!currentAdmin) return null;

  return (
    <Layout>
      <Head>
        <title>Manage Tasks - Cehpoint</title>
      </Head>

      <div className="space-y-6">
        {/* Header + currency selector */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Manage Tasks</h1>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Display currency:</span>
            <select
              value={currency}
              onChange={(e) =>
                handleCurrencyChange(e.target.value as Currency)
              }
              disabled={updatingCurrency}
              className="px-3 py-1.5 border rounded-lg text-sm"
            >
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>

          <Button onClick={() => setShowCreate((s) => !s)}>
            <Plus size={18} />
            <span>{showCreate ? "Close" : "Create Task"}</span>
          </Button>
        </div>

        {/* CREATE TASK FORM */}
        {showCreate && (
          <Card>
            <h3 className="text-xl font-semibold mb-4">Create New Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Task description"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Category
                  </label>
                  <select
                    value={newTask.category}
                    onChange={(e) =>
                      setNewTask({ ...newTask, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Select category</option>
                    <option value="Development">Development</option>
                    <option value="Design">Design</option>
                    <option value="Video Editing">Video Editing</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Writing">Writing</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Weekly Payout ({currency === "INR" ? "INR" : "USD"})
                  </label>
                  <input
                    type="number"
                    value={weeklyPayoutInput}
                    onChange={handleWeeklyPayoutChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder={`Amount in ${currency}`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Stored internally in USD. Current base value:{" "}
                    {formatMoney(newTask.weeklyPayout, "USD")} (displayed as{" "}
                    {formatMoney(newTask.weeklyPayout, currency)}).
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Deadline
                </label>
                <input
                  type="date"
                  value={newTask.deadline}
                  onChange={(e) =>
                    setNewTask({ ...newTask, deadline: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Required Skills
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {availableSkills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleSkillToggle(skill)}
                      className={`px-3 py-2 rounded-lg border text-sm transition ${newTask.skills.includes(skill)
                        ? "border-indigo-600 bg-indigo-100 text-indigo-700"
                        : "border-gray-300 hover:border-gray-400"
                        }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>

                {/* Custom Skill Input */}
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="Add custom skill..."
                    className="px-3 py-2 border rounded-lg text-sm flex-1"
                    value={customSkill}
                    onChange={e => setCustomSkill(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSkill(); } }}
                  />
                  <button
                    type="button"
                    onClick={addCustomSkill}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900"
                  >
                    Add
                  </button>
                </div>

                {/* Display Custom/Extra Skills (Not in the *current* list, though we just added them to available, so this might be empty usually unless we want to distinguish 'recently added') */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {/* Only show skills here if you really want to highlight 'manually typed' that aren't in the button list yet, 
                        but since we added them to availableSkills dynamically, they might appear above. 
                        Let's keep this as 'Selected Skills' view or just highlight selection. 
                        Actually, let's just rely on the toggle buttons above for all skills now. 
                        But if the list is huge, we might want a 'Selected' view. */}
                </div>
              </div>

              <div className="flex space-x-3">
                <Button onClick={handleCreateTask} disabled={busy}>
                  Create Task
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreate(false)}
                  disabled={busy}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* TASK LIST */}
        <div className="grid gap-4">
          {tasks.length === 0 && (
            <Card>
              <p className="text-center text-gray-500 py-8">No tasks yet</p>
            </Card>
          )}

          {tasks.map((task) => {
            const assignedWorker =
              workers.find((w) => w.id === task.assignedTo) || null;

            return (
              <Card key={task.id}>
                <div className="flex justify-between items-start">
                  {/* LEFT: TASK DETAILS */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold">{task.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${task.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : task.status === "in-progress"
                            ? "bg-orange-100 text-orange-700"
                            : task.status === "submitted"
                              ? "bg-blue-100 text-blue-700"
                              : task.status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                      >
                        {task.status}
                      </span>
                    </div>

                    <p className="text-gray-600 mt-2">{task.description}</p>

                    <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-gray-500">Category:</span>{" "}
                        {task.category}
                      </div>
                      <div>
                        <span className="text-gray-500">Payout:</span>{" "}
                        {formatMoney(task.weeklyPayout, currency)}
                      </div>
                      <div>
                        <span className="text-gray-500">Deadline:</span>{" "}
                        {task.deadline
                          ? new Date(task.deadline).toLocaleDateString()
                          : "-"}
                      </div>
                    </div>

                    <div className="mt-3 text-sm">
                      <span className="text-gray-500">Required skills: </span>
                      <div className="inline-flex gap-2 flex-wrap ml-1">
                        {task.skills?.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 text-sm">
                      <span className="text-gray-500">Assigned to: </span>
                      {assignedWorker ? (
                        <span className="font-medium ml-2">
                          {assignedWorker.fullName} ({assignedWorker.email})
                        </span>
                      ) : (
                        <span className="italic ml-2 text-gray-500">
                          Not assigned
                        </span>
                      )}
                    </div>

                    {/* Broadcast Info */}
                    {task.status === "available" && task.candidateWorkerIds && task.candidateWorkerIds.length > 0 && (
                      <div className="mt-2 text-sm bg-purple-50 text-purple-700 px-2 py-1 rounded inline-block">
                        <strong>Broadcasted:</strong> Visible to {task.candidateWorkerIds.length} candidate(s).
                      </div>
                    )}

                    {/* TASK SUBMISSION (FROM WORKER) */}
                    {task.submissionUrl && (
                      <div className="mt-5 border border-indigo-100 rounded-xl overflow-hidden shadow-sm bg-white">
                        <div className="bg-indigo-50/50 px-4 py-3 border-b border-indigo-100 flex items-center gap-2">
                          <span className="text-xl">🚀</span>
                          <span className="text-sm font-semibold text-indigo-900">Worker Submission</span>
                          {task.submittedAt && (
                            <span className="text-xs text-indigo-600 ml-auto bg-white px-2 py-1 rounded-md border border-indigo-100 shadow-sm">
                              {new Date(task.submittedAt).toLocaleString()}
                            </span>
                          )}
                        </div>

                        <div className="p-4 bg-slate-50/50 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {/* Parse markdown-like syntax for better display */}
                          {task.submissionUrl.split('\n').map((line, idx) => {
                            // Check for Bold Headers
                            if (line.trim().startsWith('###')) {
                              return <h4 key={idx} className="text-base font-bold text-gray-800 mt-4 mb-2 first:mt-0">{line.replace('###', '').trim()}</h4>;
                            }
                            if (line.trim().startsWith('**')) {
                              // Replace bold syntax **...** with actual bold tags and render links if present
                              const content = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

                              // Detect and render links inside the line
                              const parts = content.split(/(https?:\/\/[^\s]+)/g);
                              return (
                                <div key={idx} className="mb-1.5 flex flex-wrap gap-1 items-center">
                                  {parts.map((part, pIdx) => {
                                    if (part.match(/^https?:\/\//)) {
                                      return (
                                        <a
                                          key={pIdx}
                                          href={part}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium inline-flex items-center gap-0.5"
                                        >
                                          {part} ↗
                                        </a>
                                      );
                                    }
                                    return <span key={pIdx} dangerouslySetInnerHTML={{ __html: part }} />;
                                  })}
                                </div>
                              );
                            }

                            // Regular text lines
                            return <p key={idx} className="mb-1 text-gray-600">{line}</p>;
                          })}
                        </div>
                      </div>
                    )}
                    {task.feedback && (
                      <p className="text-xs text-gray-600 mt-2">
                        Feedback: {task.feedback}
                      </p>
                    )}
                  </div>

                  {/* RIGHT: ACTIONS */}
                  <div className="flex flex-col space-y-2 min-w-[190px] ml-4">
                    {task.status === "available" && (
                      <select
                        value={task.assignedTo || ""}
                        onChange={(e) =>
                          handleAssignTask(task.id, e.target.value)
                        }
                        className="px-3 py-2 border rounded-lg"
                        disabled={busy}
                      >
                        <option value="">Select worker to assign</option>
                        {workers.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.fullName} — {w.email}
                          </option>
                        ))}
                      </select>
                    )}

                    {task.status === "submitted" && (
                      <>
                        <Button
                          onClick={() => handleApproveTask(task.id)}
                          disabled={busy}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleRejectTask(task.id)}
                          disabled={busy}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {task.status === "in-progress" && (
                      <>
                        <Button
                          onClick={() => handleApproveTask(task.id)}
                          disabled={busy}
                        >
                          Mark Complete &amp; Pay
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleRejectTask(task.id)}
                          disabled={busy}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    <Button
                      variant="outline"
                      onClick={() => handleDeleteTask(task.id)}
                      disabled={busy}
                    >
                      Delete Task
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* AUTO-ASSIGNMENT CONFIRMATION MODAL */}
      {
        assignmentModal.visible && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold text-gray-900">
                  {assignmentModal.bestWorker ? "Confirm Auto-Assignment" : "Auto-Assignment Failed"}
                </h3>
              </div>

              <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
                {assignmentModal.bestWorker ? (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <span className="text-xl">✨</span>
                    </div>
                    <div>
                      <p className="text-green-800 font-bold text-lg">Best Match Found</p>
                      <p className="text-green-700">
                        <strong>{assignmentModal.bestWorker.fullName}</strong> is the best fit for this task.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
                    <div className="bg-yellow-100 p-2 rounded-full">
                      <span className="text-xl">⚠️</span>
                    </div>
                    <div>
                      <p className="text-yellow-800 font-bold text-lg">No Auto-Assignment</p>
                      <p className="text-yellow-700">No suitable worker found. Task will be created as <strong>Available</strong>.</p>
                    </div>
                  </div>
                )}

                {/* RICH ANALYSIS UI */}
                {assignmentModal.analysis ? (
                  <div className="space-y-6">
                    {/* Requirements */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Requirements</h4>
                      <div className="bg-white p-3 border rounded-lg text-sm text-gray-700 shadow-sm">
                        {assignmentModal.analysis.requirements}
                      </div>
                    </div>

                    {/* Task Skills */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Required Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {assignmentModal.analysis.taskSkills.length > 0 ? (
                          assignmentModal.analysis.taskSkills.map(skill => (
                            <span key={skill} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full border border-indigo-100">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 italic text-sm">No skills specified</span>
                        )}
                      </div>
                    </div>

                    {/* Candidates Table */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Candidate Evaluation</h4>
                      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                            <tr>
                              <th className="px-4 py-3">Worker</th>
                              <th className="px-4 py-3">Skill Match</th>
                              <th className="px-4 py-3">Active Tasks</th>
                              <th className="px-4 py-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {assignmentModal.analysis.candidates.map((cand, idx) => (
                              <tr key={idx} className={cand.workerName === assignmentModal.bestWorker?.fullName ? "bg-green-50/50" : ""}>
                                <td className="px-4 py-3 font-medium text-gray-900">{cand.workerName}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full ${cand.matchPercentage >= 40 ? 'bg-green-500' : 'bg-gray-400'}`}
                                        style={{ width: `${cand.matchPercentage}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {cand.matchPercentage.toFixed(0)}% ({cand.matchCount}/{cand.totalRequired})
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-gray-600">{cand.activeTasks}</td>
                                <td className="px-4 py-3 text-right">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                                                    ${cand.status === 'Eligible' ? 'bg-green-100 text-green-800' :
                                      cand.status.includes('BUSY') ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'}`}>
                                    {cand.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {assignmentModal.analysis.candidates.length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">
                                  No candidates evaluated.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Fallback to raw log if analysis object is missing
                  <div className="bg-gray-900 text-gray-200 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap overflow-x-auto">
                    {assignmentModal.log}
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-white flex flex-wrap justify-end gap-3">
                <Button variant="outline" onClick={() => setAssignmentModal({ ...assignmentModal, visible: false })}>
                  Cancel
                </Button>

                <button
                  onClick={() => confirmAssignment('create-open')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
                >
                  Create as Open (Unassigned)
                </button>

                {assignmentModal.candidates.length > 0 && (
                  <button
                    onClick={() => confirmAssignment('broadcast')}
                    className="px-4 py-2 bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-medium hover:bg-purple-200"
                  >
                    Broadcast to {assignmentModal.candidates.length} Candidates
                  </button>
                )}

                {assignmentModal.bestWorker && (
                  <Button onClick={() => confirmAssignment('assign')} disabled={busy}>
                    Confirm & Assign to {assignmentModal.bestWorker.fullName}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )
      }

    </Layout >
  );
}
