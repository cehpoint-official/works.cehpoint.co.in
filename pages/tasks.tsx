import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";

import { storage } from "../utils/storage";
import { User, Task } from "../utils/types";
import { format } from "date-fns";

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
  }>({
    repoUrl: "",
    liveUrl: "",
    hoursSpent: "",
    challenges: "",
    notes: "",
    fileLink: ""
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
          if (!t.candidateWorkerIds || t.candidateWorkerIds.length === 0) return true;

          // If restricted (broadcast), show only if I am in the list
          if (t.candidateWorkerIds.includes(userId)) return true;
        }

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
        alert("Task not found.");
        return;
      }
      if (task.status !== "available" && task.assignedTo !== user.id) {
        alert("This task has already been accepted by another worker.");
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

      alert("Task accepted! You can now start working.");
      loadTasks(user.id);
    } catch (err) {
      console.error("accept error:", err);
      alert("Failed to accept task.");
    }
  };

  // Submit task (FIXED)
  // Submit task (FIXED)
  const openSubmitModal = (taskId: string) => {
    setSubmissionModal({ visible: true, taskId });
    setSubmitForm({
      repoUrl: "",
      liveUrl: "",
      hoursSpent: "",
      challenges: "",
      notes: "",
      fileLink: "",
    });
  };

  const handleConfirmSubmit = async () => {
    if (!submissionModal.taskId) return;

    // Validate basic requirements
    if (!submitForm.repoUrl && !submitForm.liveUrl && !submitForm.notes && !submitForm.fileLink) {
      alert("Please provide at least a URL, detailed notes, or a file link.");
      return;
    }

    // Double check submission state to prevent double-clicks
    if (submitting) return;

    console.log("[Tasks] Starting submission process...");
    setSubmitting(true);

    try {
      // Format a professional submission report
      const submissionContent = `
### 🚀 Submission Details

**🔗 Repository:** ${submitForm.repoUrl || "N/A"}
**🌐 Live Demo:** ${submitForm.liveUrl || "N/A"}
**⏱️ Time Spent:** ${submitForm.hoursSpent || "Not specified"}

**🐛 Challenges / Blockers:**
${submitForm.challenges || "None reported"}

**📝 Additional Notes:**
${submitForm.notes || "No additional notes"}

${submitForm.fileLink ? `**📎 File Link:** ${submitForm.fileLink}` : ""}
      `.trim();

      await storage.updateTask(submissionModal.taskId, {
        status: "submitted",
        submittedAt: new Date().toISOString(),
        submissionUrl: submissionContent,
      });

      alert("Task submitted successfully! Great work.");
      setSubmissionModal({ visible: false, taskId: null });
      if (user) loadTasks(user.id);
    } catch (err) {
      console.error("submit error:", err);
      // alert("Failed to submit task. " + (err as Error).message); // optional
      alert("Failed to submit task.");
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
                    <p className="text-gray-600 mt-2 text-sm md:text-base break-words">
                      {task.description}
                    </p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {task.skills.map((skill) => (
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
                      <Button
                        onClick={() => handleAcceptTask(task.id)}
                        className="w-full md:w-auto bg-green-600 hover:bg-green-700"
                      >
                        Accept Task
                      </Button>
                    )}

                    {task.status === "in-progress" && (
                      <Button
                        onClick={() => openSubmitModal(task.id)}
                        className="w-full md:w-auto"
                      >
                        Submit Task
                      </Button>
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
              <div>
                <h3 className="text-xl font-bold text-gray-900">🚀 Submit Your Work</h3>
                <p className="text-sm text-gray-500 mt-1">Please provide comprehensive details for the reviewer.</p>
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

              {/* Detailed Text Areas */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Challenges Faced 🐛
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
                  Final Notes / Description 📝
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
      )}
    </Layout>
  );
}
