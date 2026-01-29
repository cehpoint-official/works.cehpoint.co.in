import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import Head from "next/head";

import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";

import { storage } from "../utils/storage";
import { User, Task } from "../utils/types";
import { format } from "date-fns";
import { Rocket } from "lucide-react";

export default function Tasks() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<
    "all" | "available" | "in-progress" | "submitted" | "completed"
  >("all");
  const [loading, setLoading] = useState(true);

  // Submission Modal State
  const [submissionModal, setSubmissionModal] = useState<{
    visible: boolean;
    taskId: string | null;
  }>({
    visible: false,
    taskId: null,
  });
  const [submitting, setSubmitting] = useState(false);

  // Enhanced Submission Form State
  const [submitForm, setSubmitForm] = useState<{
    repoUrl: string;
    liveUrl: string;
    hoursSpent: string;
    challenges: string;
    notes: string;
    fileLink: string;
    docUrl: string;
  }>({
    repoUrl: "",
    liveUrl: "",
    hoursSpent: "",
    challenges: "",
    notes: "",
    fileLink: "",
    docUrl: ""
  });

  // Progress Modal State
  const [progressModal, setProgressModal] = useState<{
    visible: boolean;
    taskId: string | null;
    currentProgress: number;
    checklist: { text: string; completed: boolean }[];
  }>({
    visible: false,
    taskId: null,
    currentProgress: 0,
    checklist: []
  });

  // AUTH CHECK
  useEffect(() => {
    const current = storage.getCurrentUser();

    if (!current || current.role !== "worker") {
      router.replace("/login");
      return;
    }

    setUser(current);
    loadTasks(current.id);
  }, []);

  // Load tasks
  const loadTasks = async (userId: string) => {
    try {
      const all = await storage.getTasks();
      console.log(`[Tasks] Loaded ${all.length} total tasks.`);

      const myTasks = all.filter((t) => {
        // 1. Task is assigned to me
        if (t.assignedTo === userId) return true;

        // 2. Available tasks
        if (t.status === "available") {
          // If no restrictions (open task), show it
          if (!Array.isArray(t.candidateWorkerIds) || t.candidateWorkerIds.length === 0) return true;

          // If restricted (broadcast), show only if I am in the list
          if (t.candidateWorkerIds.includes(userId)) return true;
        }

        if (t.declinedBy?.includes(userId)) return false;

        return false;
      });

      console.log(`[Tasks] Filtered down to ${myTasks.length} tasks for user ${userId}.`);
      setTasks(myTasks);
    } catch (e) {
      console.error("Failed to load tasks", e);
    } finally {
      setLoading(false);
    }
  };

  // Accept task
  const handleAcceptTask = async (taskId: string) => {
    if (!user) return;
    try {
      // 1. Check if task is still available (race condition check)
      const freshList = await storage.getTasks();
      const task = freshList.find(t => t.id === taskId);
      if (!task) {
        toast.error("Task not found.");
        return;
      }
      if (task.status !== "available" && task.assignedTo !== user.id) {
        toast.error("This task has already been accepted by another worker.");
        loadTasks(user.id);
        return;
      }

      // 2. Assign to self
      await storage.updateTask(taskId, {
        status: "in-progress",
        assignedTo: user.id,
        assignedAt: new Date().toISOString(),
        // optional: clear candidates to save space, but not strictly necessary if status check works
        // candidateWorkerIds: [] 
      });

      toast.success("Task accepted! You can now start working.");
      loadTasks(user.id);
    } catch (err) {
      console.error("accept error:", err);
      toast.error("Failed to accept task.");
    }
  };

  // Submit task (FIXED)
  // Submit task (FIXED)
  // Submit task (FIXED)
  const handleDeclineTask = (taskId: string) => {
    toast((t) => (
      <div className="flex flex-col items-center gap-4 min-w-[340px] max-w-[400px] p-6 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 bg-red-50 rounded-full text-red-600 mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900">Decline Task?</h3>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-[280px]">
            Are you sure you want to decline this task? It will be removed from your list.
          </p>
        </div>
        <div className="flex gap-3 w-full mt-2">
          <Button
            variant="outline"
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              toast.dismiss(t.id);
              performDeclineTask(taskId);
            }}
            className="flex-1 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 shadow-sm shadow-red-200 transition-all border-none"
          >
            Decline
          </Button>
        </div>
      </div>
    ), { duration: Infinity, style: { background: 'transparent', boxShadow: 'none' } });
  };

  const performDeclineTask = async (taskId: string) => {
    if (!user) return;
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const newDeclinedBy = [...(task.declinedBy || []), user.id];

      // If broadcast, also remove from candidates
      const newCtx = {
        declinedBy: newDeclinedBy,
        candidateWorkerIds: task.candidateWorkerIds?.filter(id => id !== user.id)
      };

      await storage.updateTask(taskId, newCtx);
      toast.success("Task declined.");
      loadTasks(user.id);
    } catch (err) {
      console.error("decline error:", err);
      toast.error("Failed to decline task.");
    }
  };

  /* -------------------------------------------------------
   * PROGRESS UPDATE LOGIC
   * ----------------------------------------------------- */
  const openProgressModal = (task: Task) => {
    setProgressModal({
      visible: true,
      taskId: task.id,
      currentProgress: task.progress || 0,
      checklist: task.checklist || [] // Load existing checklist or empty
    });
  };

  const handleSaveProgress = async () => {
    if (!progressModal.taskId) return;
    try {
      setSubmitting(true);
      await storage.updateTask(progressModal.taskId, {
        progress: progressModal.currentProgress,
        checklist: progressModal.checklist
      });
      toast.success("Progress updated.");
      setProgressModal({ visible: false, taskId: null, currentProgress: 0, checklist: [] });
      if (user) loadTasks(user.id);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update progress.");
    } finally {
      setSubmitting(false);
    }
  };

  const addChecklistItem = (text: string) => {
    if (!text.trim()) return;
    const newItem = { text: text.trim(), completed: false };
    setProgressModal(prev => ({
      ...prev,
      checklist: [...prev.checklist, newItem]
    }));
  };

  const toggleChecklistItem = (index: number) => {
    setProgressModal(prev => {
      const newList = [...prev.checklist];
      // Create a new object for the updated item to avoid mutation
      newList[index] = { ...newList[index], completed: !newList[index].completed };

      // Auto-calc progress
      let newProgress = prev.currentProgress;
      if (newList.length > 0) {
        const completedCount = newList.filter(i => i.completed).length;
        newProgress = Math.round((completedCount / newList.length) * 100);
      }

      return {
        ...prev,
        checklist: newList,
        currentProgress: newProgress
      };
    });
  };

  const removeChecklistItem = (index: number) => {
    setProgressModal(prev => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== index)
    }));
  };


  const openSubmitModal = (taskId: string) => {
    setSubmissionModal({ visible: true, taskId });
    setSubmitForm({
      repoUrl: "",
      liveUrl: "",
      hoursSpent: "",
      challenges: "",
      notes: "",
      fileLink: "",
      docUrl: "",
    });
  };

  const handleConfirmSubmit = async () => {
    if (!submissionModal.taskId) return;

    // Validate basic requirements
    if (!submitForm.repoUrl && !submitForm.liveUrl && !submitForm.notes && !submitForm.fileLink && !submitForm.docUrl) {
      toast.error("Please provide at least a URL, detailed notes, or a file link.");
      return;
    }

    // Double check submission state to prevent double-clicks
    if (submitting) return;

    console.log("[Tasks] Starting submission process...");
    setSubmitting(true);

    try {
      // Format a professional submission report
      const submissionContent = `
### Submission Details

**Repository:** ${submitForm.repoUrl || "N/A"}
**Live Demo:** ${submitForm.liveUrl || "N/A"}
**Time Spent:** ${submitForm.hoursSpent || "Not specified"}

**Challenges / Blockers:**
${submitForm.challenges || "None reported"}

**Additional Notes:**
${submitForm.notes || "No additional notes"}

${submitForm.fileLink ? `**File Link:** ${submitForm.fileLink}` : ""}
${submitForm.docUrl ? `**Documentation:** ${submitForm.docUrl}` : ""}
      `.trim();

      await storage.updateTask(submissionModal.taskId, {
        status: "submitted",
        submittedAt: new Date().toISOString(),
        submissionUrl: submissionContent,
      });

      toast.success("Task submitted successfully! Great work.");
      setSubmissionModal({ visible: false, taskId: null });
      if (user) loadTasks(user.id);
    } catch (err) {
      console.error("submit error:", err);
      // alert("Failed to submit task. " + (err as Error).message); // optional
      toast.error("Failed to submit task.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTasks =
    filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  if (loading || !user) return null;

  return (
    <Layout>
      <Head>
        <title>My Tasks - Cehpoint</title>
      </Head>

      <div className="space-y-6">
        {/* HEADER + FILTERS (RESPONSIVE) */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col md:flex-row md:items-baseline gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              My Tasks
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            {["all", "available", "in-progress", "submitted", "completed"].map((status) => (
              <button
                key={status}
                onClick={() =>
                  setFilter(
                    status as "all" | "available" | "in-progress" | "submitted" | "completed"
                  )
                }
                className={`px-3 py-2 rounded-lg text-sm md:text-base ${filter === status
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* TASK LIST */}
        {filteredTasks.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 py-10 md:py-12">
              No tasks found
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredTasks.map((task) => (
              <Card key={task.id} hover>
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 md:gap-6">
                  {/* LEFT: TASK DETAILS */}
                  <div className="flex-1 min-w-0">
                    {/* Title + Status */}
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      <h3 className="text-lg md:text-xl font-semibold break-words">
                        {task.title}
                      </h3>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${task.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : task.status === "submitted"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-orange-100 text-orange-700"
                          }`}
                      >
                        {task.status === "available" ? "Open for you" : task.status}
                      </span>
                    </div>

                    {/* Description */}
                    {/* Description */}
                    <p className="text-gray-600 mt-2 text-sm md:text-base break-words whitespace-pre-line leading-normal">
                      {task.description}
                    </p>

                    {/* Project Details Link */}
                    {task.projectDetails && (
                      <div className="mt-4 mb-2">
                        <a
                          href={task.projectDetails}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm border border-indigo-100"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                          Open Project Brief / Docs
                        </a>
                      </div>
                    )}

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {Array.isArray(task.skills) && task.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-indigo-100 text-indigo-600 text-xs rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mt-4 text-sm">
                      <div>
                        <span className="text-gray-500">Category:</span>{" "}
                        <span className="font-medium">{task.category}</span>
                      </div>

                      <div>
                        <span className="text-gray-500">Payout:</span>{" "}
                        <span className="font-medium text-green-600">
                          ${task.weeklyPayout}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-500">Deadline:</span>{" "}
                        <span className="font-medium">
                          {format(new Date(task.deadline), "MMM dd, yyyy")}
                        </span>
                      </div>

                      {task.submittedAt && (
                        <div>
                          <span className="text-gray-500">Submitted:</span>{" "}
                          <span className="font-medium">
                            {format(
                              new Date(task.submittedAt),
                              "MMM dd, yyyy"
                            )}
                          </span>
                        </div>
                      )}

                      {task.helperEmail && (
                        <div className="sm:col-span-2 mt-1">
                          <span className="text-gray-500 italic block mb-1">Project Guide / Mentor:</span>
                          <span className="flex items-center gap-2 font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 w-fit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                            {task.helperEmail}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Feedback */}
                    {task.feedback && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">
                          Feedback:
                        </p>
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap break-words">
                          {task.feedback}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* RIGHT: SUBMIT BUTTON (STACKED ON MOBILE) */}
                  <div className="flex md:block justify-start md:justify-end">
                    {task.status === "available" && (
                      <div className="flex flex-col gap-2 w-full md:w-auto">
                        <Button
                          onClick={() => handleAcceptTask(task.id)}
                          className="w-full md:w-auto bg-green-600 hover:bg-green-700"
                        >
                          Accept Task
                        </Button>
                        <Button
                          onClick={() => handleDeclineTask(task.id)}
                          variant="outline"
                          className="w-full md:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                        >
                          Decline
                        </Button>
                      </div>
                    )}

                    {task.status === "in-progress" && (
                      <div className="flex flex-col gap-2 w-full md:w-auto">
                        <Button
                          onClick={() => openSubmitModal(task.id)}
                          className="w-full md:w-auto"
                        >
                          Submit Task
                        </Button>
                        <Button
                          onClick={() => openProgressModal(task)}
                          variant="outline"
                          className="w-full md:w-auto text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                        >
                          Update Progress
                        </Button>
                      </div>
                    )}

                    {task.status === "submitted" && (
                      <Button disabled variant="outline" className="w-full md:w-auto">
                        Submitted ✓
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* SUBMISSION MODAL */}
      {submissionModal.visible && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  <Rocket size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Submit Your Work</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Provide comprehensive details for review.</p>
                </div>
              </div>
              <button
                onClick={() => setSubmissionModal({ visible: false, taskId: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">

              {/* Links Section */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    GitHub / Repository URL
                  </label>
                  <input
                    type="url"
                    value={submitForm.repoUrl}
                    onChange={(e) => setSubmitForm({ ...submitForm, repoUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm"
                    placeholder="https://github.com/username/project"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Live Demo / Deployment URL
                  </label>
                  <input
                    type="url"
                    value={submitForm.liveUrl}
                    onChange={(e) => setSubmitForm({ ...submitForm, liveUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm"
                    placeholder="https://my-app.vercel.app"
                  />
                </div>
              </div>

              {/* Time & File */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Time Spent (approx)
                  </label>
                  <input
                    type="text"
                    value={submitForm.hoursSpent}
                    onChange={(e) => setSubmitForm({ ...submitForm, hoursSpent: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm"
                    placeholder="e.g. 5 hours"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    File Link (Drive/Dropbox/WeTransfer)
                  </label>
                  <input
                    type="url"
                    value={submitForm.fileLink}
                    onChange={(e) => setSubmitForm({ ...submitForm, fileLink: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm"
                    placeholder="https://drive.google.com/..."
                  />
                </div>
              </div>

              {/* Documentation Field */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <label className="block text-sm font-bold text-blue-900 mb-1">
                  Project Documentation URL
                </label>
                <div className="text-xs text-blue-700 mb-2 leading-relaxed">
                  <strong>⚠️ Disclaimer:</strong> Documentation <u>must</u> be a <strong>Google Doc</strong>.
                  <ul className="list-disc pl-4 mt-1 space-y-0.5">
                    <li>The link must be <strong>Public</strong> (Anyone with the link can view).</li>
                    <li>It should be very detailed (include dependencies, setup guide, architecture).</li>
                  </ul>
                </div>
                <input
                  type="url"
                  value={submitForm.docUrl}
                  onChange={(e) => setSubmitForm({ ...submitForm, docUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm bg-white"
                  placeholder="https://docs.google.com/document/d/..."
                />
              </div>

              {/* Detailed Text Areas */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Challenges Faced
                </label>
                <textarea
                  value={submitForm.challenges}
                  onChange={(e) => setSubmitForm({ ...submitForm, challenges: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm"
                  rows={2}
                  placeholder="What difficulties did you encounter? How did you solve them?"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Final Notes / Description
                </label>
                <textarea
                  value={submitForm.notes}
                  onChange={(e) => setSubmitForm({ ...submitForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm"
                  rows={4}
                  placeholder="Provide a brief summary of the work done..."
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 sticky bottom-0">
              <Button
                variant="outline"
                onClick={() => setSubmissionModal({ visible: false, taskId: null })}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmSubmit} disabled={submitting} className="px-8">
                {submitting ? "Submitting..." : "Submit Task"}
              </Button>
            </div>
          </div>
        </div>
      )
      }

      {/* PROGRESS MODAL */}
      {
        progressModal.visible && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Update Progress</h3>
                  <p className="text-sm text-gray-500 mt-1">Track your work and checklist.</p>
                </div>
                <button
                  onClick={() => setProgressModal({ ...progressModal, visible: false })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                {/* Progress Slider */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4 flex justify-between items-center">
                    <span>Usage/Completion</span>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-lg font-bold border border-indigo-100">
                      {progressModal.currentProgress}%
                    </span>
                  </label>

                  <div className="relative w-full h-4">
                    {/* Track Background */}
                    <div className="absolute top-1/2 left-0 w-full h-3 bg-gray-100 rounded-full transform -translate-y-1/2 overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-100 ease-out"
                        style={{ width: `${progressModal.currentProgress}%` }}
                      />
                    </div>

                    {/* Range Input (Invisible but interactive) */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progressModal.currentProgress}
                      onChange={(e) => setProgressModal({ ...progressModal, currentProgress: Number(e.target.value) })}
                      className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />

                    {/* Custom Thumb (Visual Only - positioned by JS logic/CSS calc) */}
                    <div
                      className="absolute top-1/2 w-6 h-6 bg-white border-2 border-indigo-500 rounded-full shadow-md transform -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-100 ease-out flex items-center justify-center"
                      style={{ left: `${progressModal.currentProgress}%` }}
                    >
                      <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                    </div>
                  </div>

                  <div className="flex justify-between mt-2 text-xs text-gray-400 px-1 font-medium">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Checklist */}
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <span className="text-lg">📋</span> Work Breakdown
                    </label>
                    {progressModal.checklist.length > 0 && (
                      <span className="text-xs font-semibold px-2 py-1 bg-white border border-gray-200 rounded-full text-gray-600">
                        {progressModal.checklist.filter(i => i.completed).length}/{progressModal.checklist.length} Done
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-4 ml-1">
                    Create a checklist to track your steps. The admin will see these items to understand your progress.
                  </p>

                  {/* Add Item Input */}
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-400">+</span>
                        </div>
                        <input
                          type="text"
                          id="new-checklist-item"
                          placeholder="e.g., Created database schema..."
                          className="block w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addChecklistItem(e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                      <Button
                        onClick={() => {
                          const input = document.getElementById('new-checklist-item') as HTMLInputElement;
                          if (input) {
                            addChecklistItem(input.value);
                            input.value = '';
                          }
                        }}
                        className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                      >
                        Add Item
                      </Button>
                    </div>
                    <p className="text-[10px] text-gray-400 pl-1">
                      Type a task above and press <strong>Enter</strong> or click <strong>Add Item</strong>.
                    </p>
                  </div>

                  {/* List Items */}
                  <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                    {progressModal.checklist.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-white/50">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900">Your list is empty</h4>
                        <p className="text-xs text-gray-500 mt-1 max-w-[200px] mx-auto">
                          Add the specific steps you are working on (e.g., "Research", "Design", "Development") so the admin knows where you are at.
                        </p>
                      </div>
                    ) : (
                      progressModal.checklist.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => toggleChecklistItem(idx)}
                          className={`group flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${item.completed
                            ? "bg-indigo-50/40 border-indigo-100"
                            : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                            }`}
                        >
                          <div className="relative flex items-center">
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={() => toggleChecklistItem(idx)}
                              onClick={(e) => e.stopPropagation()}
                              className="peer w-5 h-5 cursor-pointer appearance-none rounded-md border-2 border-gray-300 checked:border-indigo-500 checked:bg-indigo-500 transition-all"
                            />
                            <svg className="absolute w-3.5 h-3.5 text-white left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>

                          <span
                            className={`flex-1 text-sm font-medium transition-colors select-none ${item.completed ? "text-gray-400 line-through decoration-2 decoration-gray-200" : "text-gray-700"
                              }`}
                          >
                            {item.text}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeChecklistItem(idx);
                            }}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                            title="Remove item"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 sticky bottom-0">
                <Button
                  variant="outline"
                  onClick={() => setProgressModal({ ...progressModal, visible: false })}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveProgress} disabled={submitting}>
                  {submitting ? "Saving..." : "Save Progress"}
                </Button>
              </div>
            </div>
          </div>
        )
      }
    </Layout >
  );
}
