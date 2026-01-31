// pages/tasks.tsx
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Rocket,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Briefcase,
  ChevronRight,
  Link as LinkIcon,
  Github,
  Globe,
  Plus,
  Trash2,
  ExternalLink,
  Target,
  Zap,
  Mail,
  MessageSquare,
  X,
  Undo2
} from "lucide-react";

import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";

import { storage } from "../utils/storage";
import { User, Task } from "../utils/types";
import Chat from "../components/Chat";

const INR_RATE = 89;

function formatMoney(amountUsd: number, currency: string): string {
  const symbol = currency === "INR" ? "₹" : "$";
  const converted = currency === "INR" ? amountUsd * INR_RATE : amountUsd;
  return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function Tasks() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
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
  const [submitForm, setSubmitForm] = useState({
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

  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [activeChatTask, setActiveChatTask] = useState<string | null>(null);

  // 🔹 Resignation Modal State
  const [resignationModal, setResignationModal] = useState<{
    visible: boolean;
    taskId: string | null;
  }>({
    visible: false,
    taskId: null,
  });
  const [resignationReason, setResignationReason] = useState("");
  const [requestingResignation, setRequestingResignation] = useState(false);

  // AUTH CHECK
  useEffect(() => {
    const current = storage.getCurrentUser();
    if (!current || current.role !== "worker") {
      router.replace("/login");
      return;
    }
    setUser(current);
    setCurrency(current.preferredCurrency || "USD"); // 🔹 Hydrate preference
    loadTasks(current.id);
  }, []);

  const loadTasks = async (userId: string) => {
    try {
      setLoading(true);
      const all = await storage.getTasks();
      const myTasks = all.filter((t) => {
        // If I declined it, I NEVER see it (unless it was already assigned to me?? 
        // usually declinedBy is only for available broadcasted tasks)
        if (t.declinedBy?.includes(userId)) return false;

        // If explicitly assigned to me
        if (t.assignedTo === userId) return true;

        // If I'm one of the workers in a team task
        if (t.assignedWorkerIds?.includes(userId)) return true;

        // If it's an open broadcast (available)
        if (t.status === "available") {
          // If no specific candidates were targeted, it's open to all
          if (!Array.isArray(t.candidateWorkerIds) || t.candidateWorkerIds.length === 0) return true;
          // Or if I'm specifically invited to this broadcast
          if (t.candidateWorkerIds.includes(userId)) return true;
        }

        return false;
      });
      setTasks(myTasks);
    } catch (e) {
      toast.error("Cloud sync failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTask = async (taskId: string) => {
    if (!user) return;
    try {
      const freshList = await storage.getTasks();
      const task = freshList.find(t => t.id === taskId);
      if (!task || (task.status !== "available" && task.assignedTo !== user.id)) {
        toast.error("Task no longer available.");
        loadTasks(user.id);
        return;
      }
      await storage.updateTask(taskId, {
        status: "in-progress",
        assignedTo: task.assignedTo || user.id, // Keep original if exists
        assignedWorkerIds: task.assignedWorkerIds?.length ? task.assignedWorkerIds : [user.id],
        assignedAt: task.assignedAt || new Date().toISOString(),
      });
      toast.success("Deployment Confirmed!");
      loadTasks(user.id);
    } catch (err) {
      toast.error("Communication error.");
    }
  };

  const handleDeclineTask = (taskId: string) => {
    toast((t) => (
      <div className="p-4">
        <p className="font-bold text-slate-900 mb-2">Decline Assignment?</p>
        <p className="text-sm text-slate-500 mb-4">This will remove the task from your hub permanently.</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.dismiss(t.id)}>Cancel</Button>
          <Button className="bg-rose-600" onClick={() => {
            toast.dismiss(t.id);
            performDeclineTask(taskId);
          }}>Decline</Button>
        </div>
      </div>
    ));
  };

  const performDeclineTask = async (taskId: string) => {
    if (!user) return;
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      const newDeclinedBy = [...(task.declinedBy || []), user.id];
      await storage.updateTask(taskId, {
        declinedBy: newDeclinedBy,
        candidateWorkerIds: task.candidateWorkerIds?.filter(id => id !== user.id)
      });
      toast.success("Task archived.");
      loadTasks(user.id);
    } catch (err) {
      toast.error("Operation failed.");
    }
  };

  const openProgressModal = (task: Task) => {
    setProgressModal({
      visible: true,
      taskId: task.id,
      currentProgress: task.progress || 0,
      checklist: task.checklist || []
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
      toast.success("Progress Synchronized");
      setProgressModal({ visible: false, taskId: null, currentProgress: 0, checklist: [] });
      if (user) loadTasks(user.id);
    } catch (err) {
      toast.error("Cloud update failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestResignation = async () => {
    if (!resignationModal.taskId || !resignationReason.trim()) return;
    try {
      setRequestingResignation(true);
      await storage.updateTask(resignationModal.taskId, {
        resignationRequested: true,
        resignationReason: resignationReason.trim(),
        resignationRequestedAt: new Date().toISOString(),
        resignationWorkerId: user.id
      });

      // Notify Admin
      await storage.createNotification({
        userId: "admin",
        title: "Project Resignation Request",
        message: `${user?.fullName} has requested to step back from project "${tasks.find(t => t.id === resignationModal.taskId)?.title}". Reason: ${resignationReason.substring(0, 50)}...`,
        type: "warning",
        read: false,
        createdAt: new Date().toISOString(),
        link: "/admin/tasks"
      });

      toast.success("Withdrawal request dispatched to headquarters.");
      setResignationModal({ visible: false, taskId: null });
      setResignationReason("");
      if (user) loadTasks(user.id);
    } catch (e) {
      toast.error("Dispatch failed.");
    } finally {
      setRequestingResignation(false);
    }
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const newItem = { text: newChecklistItem.trim(), completed: false };
    setProgressModal(prev => ({
      ...prev,
      checklist: [...prev.checklist, newItem]
    }));
    setNewChecklistItem("");
  };

  const toggleChecklistItem = (index: number) => {
    setProgressModal(prev => {
      const newList = [...prev.checklist];
      newList[index] = { ...newList[index], completed: !newList[index].completed };
      const completedCount = newList.filter(i => i.completed).length;
      const newProgress = newList.length > 0 ? Math.round((completedCount / newList.length) * 100) : prev.currentProgress;
      return { ...prev, checklist: newList, currentProgress: newProgress };
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
    if (!submitForm.repoUrl && !submitForm.liveUrl && !submitForm.notes && !submitForm.fileLink && !submitForm.docUrl) {
      toast.error("Provide artifacts for review.");
      return;
    }
    setSubmitting(true);
    try {
      const submissionContent = `
### Submission Details
**Repository:** ${submitForm.repoUrl || "N/A"}
**Live Demo:** ${submitForm.liveUrl || "N/A"}
**Time Spent:** ${submitForm.hoursSpent || "Not specified"}

**Challenges:**
${submitForm.challenges || "None"}

**Notes:**
${submitForm.notes || "None"}

${submitForm.fileLink ? `**Artifacts:** ${submitForm.fileLink}` : ""}
${submitForm.docUrl ? `**Docs:** ${submitForm.docUrl}` : ""}
      `.trim();

      await storage.updateTask(submissionModal.taskId, {
        status: "submitted",
        submittedAt: new Date().toISOString(),
        submissionUrl: submissionContent,
      });

      toast.success("Assignment Finalized! 🚀");
      setSubmissionModal({ visible: false, taskId: null });
      if (user) loadTasks(user.id);
    } catch (err) {
      toast.error("Submission error.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTasks = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <Layout>
      <Head>
        <title>Mission Control - Tasks</title>
      </Head>

      <div className="max-w-[1400px] mx-auto space-y-8 pb-20">
        {/* HEADER AREA */}
        <section className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-12 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Active Assignments</h1>
              <p className="text-slate-500 font-medium">Manage your active projects and explore new opportunities.</p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex p-1 bg-slate-100/50 rounded-xl border border-slate-200">
                <button onClick={() => setCurrency('USD')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${currency === 'USD' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500'}`}>USD</button>
                <button onClick={() => setCurrency('INR')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${currency === 'INR' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500'}`}>INR</button>
              </div>

              <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200">
                {["all", "available", "in-progress", "submitted", "completed"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status as any)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === status ? "bg-white text-indigo-600 shadow-lg" : "text-slate-500 hover:text-slate-900"}`}
                  >
                    {status.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* TASK GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-[2.5rem]" />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-100 rounded-[2.5rem] p-24 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200">
              <Search className="w-10 h-10" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-sm">No assignments matching current parameters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task, idx) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  layout
                >
                  <Card className="h-full hover:shadow-2xl transition-all duration-500 group relative flex flex-col p-0 overflow-hidden border-slate-100">
                    <div className="p-8 space-y-6 flex-1">
                      {/* Top Meta */}
                      <div className="flex justify-between items-start">
                        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${task.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                          task.status === 'submitted' ? 'bg-blue-50 text-blue-600' :
                            task.status === 'in-progress' ? 'bg-indigo-50 text-indigo-600' :
                              'bg-amber-50 text-amber-600'
                          }`}>
                          {task.resignationRequested ? "Withdrawal Pending" : task.status.replace('-', ' ')}
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            {task.payoutSchedule === "one-time" ? "Final Settlement" : "Weekly Payout"}
                          </p>
                          <p className="text-xl font-black text-emerald-600">
                            {task.payoutSchedule === "one-time" && (!task.weeklyPayout && (!task.workerPayouts || !user || !task.workerPayouts[user.id])) ? (
                              "Manual Payment"
                            ) : (
                              <>
                                {formatMoney(
                                  (task.workerPayouts && user && task.workerPayouts[user.id]) || task.weeklyPayout,
                                  currency
                                )}
                                {task.payoutSchedule !== "one-time" && <span className="text-[10px] ml-1 opacity-40">/WEEK</span>}
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Main Info */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em]">{task.category}</p>
                        <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors uppercase">{task.title}</h3>
                        <p className="text-slate-500 font-medium line-clamp-3 leading-relaxed">{task.description}</p>
                      </div>

                      {/* Links and Skills */}
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {task.skills?.map(skill => (
                            <span key={skill} className="px-3 py-1 bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-600 rounded-lg uppercase tracking-wider">{skill}</span>
                          ))}
                        </div>

                        {task.projectDetails && (
                          <a href={task.projectDetails} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest hover:gap-3 transition-all">
                            <LinkIcon size={14} /> View Project Scope <ChevronRight size={14} />
                          </a>
                        )}
                      </div>

                      {/* Timeline Info */}
                      <div className="pt-6 border-t border-slate-50 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Deadline Date</p>
                          <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
                            <Clock size={12} /> {format(new Date(task.deadline), "MMM dd, yyyy")}
                          </div>
                        </div>
                        {task.helperEmail && (
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Squad Leader</p>
                            <a
                              href={`mailto:${task.helperEmail}`}
                              className="flex items-center gap-2 text-indigo-600 font-bold text-xs hover:text-indigo-700 transition-all"
                              title={`Contact Squad Leader: ${task.helperEmail}`}
                            >
                              <Mail size={12} /> {task.helperEmail}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                      {task.status === "available" && (
                        <>
                          <Button onClick={() => handleAcceptTask(task.id)} className="flex-1 h-12 rounded-xl text-[10px] uppercase font-black tracking-widest">Accept Seat</Button>
                          <Button onClick={() => handleDeclineTask(task.id)} variant="outline" className="h-12 border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl">Archieve</Button>
                        </>
                      )}
                      {task.status === "in-progress" && (
                        <>
                          {!task.resignationRequested ? (
                            <>
                              <Button onClick={() => openSubmitModal(task.id)} className="flex-1 h-12 rounded-xl text-[10px] uppercase font-black tracking-widest">Final Submit</Button>
                              <Button onClick={() => openProgressModal(task)} variant="outline" className="h-12 border-indigo-100 text-indigo-600 hover:bg-indigo-50 rounded-xl">Progress Sync</Button>
                              <Button
                                onClick={() => setResignationModal({ visible: true, taskId: task.id })}
                                variant="outline"
                                className="h-12 border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl px-4"
                              >
                                <Undo2 size={18} />
                              </Button>
                            </>
                          ) : (
                            <div className="w-full flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase text-amber-600 tracking-widest bg-amber-50 rounded-xl">
                              <Clock size={16} /> Resignation under Review
                            </div>
                          )}
                          <Button onClick={() => setActiveChatTask(task.id)} variant="outline" className="h-12 border-indigo-100 text-indigo-600 hover:bg-indigo-50 rounded-xl px-4">
                            <MessageSquare size={18} />
                          </Button>
                        </>
                      )}
                      {task.status === "submitted" && (
                        <div className="w-full flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase text-blue-600 tracking-widest">
                          <CheckCircle2 size={16} /> Awaiting Verification
                        </div>
                      )}
                      {task.status === "completed" && (
                        <div className="w-full flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase text-emerald-600 tracking-widest">
                          <CheckCircle2 size={16} /> Mission Success
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* SUBMISSION MODAL */}
      <AnimatePresence>
        {submissionModal.visible && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSubmissionModal({ visible: false, taskId: null })} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-full">
              <div className="p-8 md:p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                    <Rocket size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Project Handover</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upload your mission artifacts</p>
                  </div>
                </div>
                <button onClick={() => setSubmissionModal({ visible: false, taskId: null })} className="p-2 hover:bg-white rounded-xl transition-colors">
                  <Plus className="rotate-45 text-slate-400" size={24} />
                </button>
              </div>

              <div className="p-8 md:p-10 space-y-8 overflow-y-auto">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">GitHub Repository</label>
                    <div className="relative group">
                      <input type="url" value={submitForm.repoUrl} onChange={(e) => setSubmitForm({ ...submitForm, repoUrl: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 transition-all font-bold pl-12" placeholder="Repo URL" />
                      <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Deployment URL</label>
                    <div className="relative group">
                      <input type="url" value={submitForm.liveUrl} onChange={(e) => setSubmitForm({ ...submitForm, liveUrl: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 transition-all font-bold pl-12" placeholder="Live Site" />
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Total Effort</label>
                    <input type="text" value={submitForm.hoursSpent} onChange={(e) => setSubmitForm({ ...submitForm, hoursSpent: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 transition-all font-bold" placeholder="e.g. 40 Hours" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Documentation (G-Doc)</label>
                    <input type="url" value={submitForm.docUrl} onChange={(e) => setSubmitForm({ ...submitForm, docUrl: e.target.value })} className="w-full px-5 py-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl outline-none focus:bg-white focus:border-emerald-600 transition-all font-bold" placeholder="Public link required" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Bottlenecks & Challenges</label>
                  <textarea value={submitForm.challenges} onChange={(e) => setSubmitForm({ ...submitForm, challenges: e.target.value })} className="w-full px-5 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 transition-all font-bold min-h-[100px] resize-none" placeholder="What technical debt or blockers did you face?" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mission Synthesis</label>
                  <textarea value={submitForm.notes} onChange={(e) => setSubmitForm({ ...submitForm, notes: e.target.value })} className="w-full px-5 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 transition-all font-bold min-h-[120px] resize-none" placeholder="Final summary of features and deliverables..." />
                </div>
              </div>

              <div className="p-8 md:p-10 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                <Button variant="outline" onClick={() => setSubmissionModal({ visible: false, taskId: null })} className="h-14 px-8 rounded-2xl font-bold uppercase tracking-widest text-xs">Retort</Button>
                <Button onClick={handleConfirmSubmit} disabled={submitting} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-600/20">
                  {submitting ? "Processing..." : "Initiate Final Handover"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PROGRESS MODAL */}
      <AnimatePresence>
        {progressModal.visible && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setProgressModal({ ...progressModal, visible: false })} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl">
              <div className="p-8 md:p-10 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                    <Target size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Mission Sync</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Target: {progressModal.currentProgress}% Ready</p>
                  </div>
                </div>
              </div>

              <div className="p-8 md:p-10 space-y-10">
                {/* Visual Progress */}
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-black">Velocity Indicator</p>
                    <p className="text-4xl font-black text-indigo-600">{progressModal.currentProgress}<span className="text-lg opacity-20">%</span></p>
                  </div>
                  <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progressModal.currentProgress}%` }} className="absolute inset-0 bg-indigo-600 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)]" />
                    <input type="range" min="0" max="100" value={progressModal.currentProgress} onChange={(e) => setProgressModal({ ...progressModal, currentProgress: Number(e.target.value) })} className="absolute inset-0 w-full opacity-0 cursor-pointer z-10" />
                  </div>
                </div>

                {/* Checklist */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Task Breakdown</h4>
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{progressModal.checklist.filter(c => c.completed).length}/{progressModal.checklist.length} Verified</span>
                  </div>

                  <div className="space-y-3">
                    {progressModal.checklist.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between group">
                        <button onClick={() => toggleChecklistItem(idx)} className="flex items-center gap-4 flex-1 text-left">
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 bg-white'}`}>
                            {item.completed && <CheckCircle2 size={14} />}
                          </div>
                          <span className={`text-sm font-bold tracking-tight ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.text}</span>
                        </button>
                        <button onClick={() => removeChecklistItem(idx)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <input type="text" value={newChecklistItem} onChange={(e) => setNewChecklistItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()} placeholder="Add granular task item..." className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 transition-all font-bold text-sm" />
                    <button onClick={addChecklistItem} className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
                      <Plus size={24} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-8 md:p-10 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                <Button variant="outline" onClick={() => setProgressModal({ ...progressModal, visible: false })} className="h-14 px-8 rounded-2xl">Retreat</Button>
                <Button onClick={handleSaveProgress} disabled={submitting} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs">
                  {submitting ? "Syncing..." : "Finalize Progress Hub"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Overlay */}
      {activeChatTask && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setActiveChatTask(null)}>
          <div className="relative w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <Chat
              taskId={activeChatTask}
              currentUser={user!}
              onClose={() => setActiveChatTask(null)}
            />
          </div>
        </div>
      )}

      {/* Resignation Modal */}
      {resignationModal.visible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Step Back Request</h3>
                <p className="text-sm text-slate-500 font-medium">Please provide your reason for leaving the project hub.</p>
              </div>
              <button
                onClick={() => setResignationModal({ visible: false, taskId: null })}
                className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4">
                <AlertCircle className="text-rose-600 shrink-0 mt-1" size={24} />
                <p className="text-xs text-rose-700 font-bold leading-relaxed">
                  NOTE: Stepping back from a project too many times may impact your Elite Status and platform ranking. Please ensure your reason is valid.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reason for Withdrawal</label>
                <textarea
                  value={resignationReason}
                  onChange={(e) => setResignationReason(e.target.value)}
                  className="w-full h-32 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-rose-600 transition-all font-medium text-sm text-slate-700 resize-none"
                  placeholder="e.g. Skill mismatch, Personal bandwidth issues, or Technical blockers..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={() => setResignationModal({ visible: false, taskId: null })}
                  variant="outline"
                  className="flex-1 h-14 rounded-2xl"
                >
                  Stay on Project
                </Button>
                <Button
                  onClick={handleRequestResignation}
                  disabled={requestingResignation || !resignationReason.trim()}
                  className="flex-1 h-14 rounded-2xl bg-rose-600 shadow-xl shadow-rose-600/20"
                >
                  {requestingResignation ? "Dispatching..." : "Confirm Step Back"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
