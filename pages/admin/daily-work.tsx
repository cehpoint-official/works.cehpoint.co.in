import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Layout from "../../components/Layout";

import { storage } from "../../utils/storage";
import type { DailySubmission, User } from "../../utils/types";

import {
  Github,
  Video,
  Calendar,
  Clock,
  Users,
  Filter,
  MessageSquare,
  Send,
  Search,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  User as UserIcon,
  Trash2,
  ExternalLink
} from "lucide-react";

import { format } from "date-fns";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { toast } from "react-hot-toast";

export default function AdminDailyWork() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const [submissions, setSubmissions] = useState<DailySubmission[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedWorker, setSelectedWorker] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedWorkType, setSelectedWorkType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [feedbackModal, setFeedbackModal] = useState<{
    submissionId: string;
    userId: string;
    feedback: string;
    workerName: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  // -------------------------------------------------
  // LOAD DATA
  // -------------------------------------------------
  useEffect(() => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      router.push("/login");
      return;
    }

    setUser(currentUser);
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subs, workersList] = await Promise.all([
        storage.getAllSubmissions(),
        storage.getUsers()
      ]);

      setSubmissions(
        subs.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
      setWorkers(workersList.filter((u) => u.role === "worker"));
    } catch (err) {
      console.error("Load error:", err);
      toast.error("Failed to load records.");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------
  // DYNAMIC FILTERING
  // -------------------------------------------------
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const matchesWorker = selectedWorker === "all" || s.userId === selectedWorker;
      const matchesDate = !selectedDate || s.date === selectedDate;
      const matchesType = selectedWorkType === "all" || s.workType === selectedWorkType;
      const matchesSearch = !searchQuery ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (workers.find(w => w.id === s.userId)?.fullName || "").toLowerCase().includes(searchQuery.toLowerCase());

      return matchesWorker && matchesDate && matchesType && matchesSearch;
    });
  }, [submissions, selectedWorker, selectedDate, selectedWorkType, searchQuery, workers]);

  const getWorker = (userId: string) => {
    return workers.find((w) => w.id === userId);
  };

  // -------------------------------------------------
  // ACTIONS
  // -------------------------------------------------
  const handleSubmitFeedback = async () => {
    if (!feedbackModal?.feedback) return;
    setBusy(true);

    try {
      await storage.updateSubmission(feedbackModal.submissionId, {
        adminReviewed: true,
        adminFeedback: feedbackModal.feedback,
      });

      // Notify worker
      await storage.createNotification({
        userId: feedbackModal.userId,
        title: "Work Status Update",
        message: `Admin has reviewed and provided feedback for your daily log. Check it out!`,
        type: "success",
        read: false,
        createdAt: new Date().toISOString(),
      });

      toast.success(`Feedback dispatched to ${feedbackModal.workerName}`);
      setFeedbackModal(null);
      await loadData();
    } catch (err: any) {
      console.error("Feedback error:", err);
      toast.error(`Failed to transmit feedback: ${err.message || 'Unknown error'}`);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    if (!confirm("Are you sure you want to purge this submission from the logs?")) return;

    try {
      // Assuming storage has a deleteSubmission or we use update to hide it
      // For now, let's just toast and log since delete is destructive
      toast.error("Delete function disabled for safety.");
    } catch (e) {
      toast.error("Operation failed.");
    }
  };

  if (!user || loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-black text-indigo-600 tracking-widest text-xs uppercase">Loading Logs...</p>
        </div>
      </Layout>
    );
  }

  // -------------------------------------------------
  // STATS ENGINE
  // -------------------------------------------------
  const stats = [
    {
      label: "Total Analytics",
      value: submissions.length,
      icon: Calendar,
      theme: "bg-gray-900 border-gray-800 text-white",
    },
    {
      label: "Active Today",
      value: submissions.filter(
        (s) => s.date === new Date().toISOString().split("T")[0]
      ).length,
      icon: Clock,
      theme: "bg-indigo-600 border-indigo-500 text-white",
    },
    {
      label: "Live Specialists",
      value: new Set(submissions.map((s) => s.userId)).size,
      icon: Users,
      theme: "bg-white border-gray-100 text-gray-900",
    },
    {
      label: "Pending Review",
      value: submissions.filter((s) => !s.adminReviewed).length,
      icon: AlertCircle,
      theme: "bg-amber-500 border-amber-400 text-white shadow-amber-200 shadow-lg",
    },
  ];

  return (
    <Layout>
      <Head>
        <title>Daily Logs | Admin</title>
      </Head>

      <div className="max-w-[1400px] mx-auto space-y-12 pb-20">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Daily Work Logs</h1>
            <p className="text-sm text-gray-500">Track and review daily submissions from your team.</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={loadData}
              className="px-5 h-10 border border-gray-200 rounded-xl font-bold text-xs uppercase hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              Update Records
            </button>
          </div>
        </div>

        {/* STATS DEPLOYMENT */}
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
                  <stat.icon size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* SEARCH & FILTERS GRID */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8">
          <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                <Filter size={18} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Filters</h2>
                <p className="text-xs text-gray-400 mt-0.5">Filter records with precision</p>
              </div>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs or names..."
                className="w-full h-10 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-sm focus:border-indigo-600 transition-all"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Worker</label>
              <select
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="w-full h-10 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs uppercase tracking-wider outline-none focus:border-indigo-600 transition-all cursor-pointer"
              >
                <option value="all">Every Worker</option>
                {workers.map(w => (
                  <option key={w.id} value={w.id}>{w.fullName}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Date Node</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-10 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs uppercase tracking-wider outline-none focus:border-indigo-600 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Work Type</label>
              <select
                value={selectedWorkType}
                onChange={(e) => setSelectedWorkType(e.target.value)}
                className="w-full h-10 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs uppercase tracking-wider outline-none focus:border-indigo-600 transition-all cursor-pointer"
              >
                <option value="all">All Channels</option>
                <option value="development">Development</option>
                <option value="design">Design</option>
                <option value="video-editing">Video Editing</option>
                <option value="marketing">Marketing</option>
                <option value="writing">Writing</option>
                <option value="other">General</option>
              </select>
            </div>
          </div>

          {(selectedWorker !== 'all' || selectedDate || selectedWorkType !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedWorker('all');
                setSelectedDate('');
                setSelectedWorkType('all');
                setSearchQuery('');
              }}
              className="mt-6 flex items-center gap-2 text-[11px] font-bold text-indigo-600 uppercase tracking-wider hover:text-indigo-700 transition-colors ml-1"
            >
              <Trash2 size={14} /> Clear Active Query
            </button>
          )}
        </div>

        {/* LOG ENTRIES REEL */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Logs</h2>
            <div className="h-[1px] flex-1 bg-gray-100" />
            <span className="px-4 py-1.5 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-400 uppercase tracking-wider border border-gray-100">
              {filteredSubmissions.length} Records
            </span>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-20 text-center">
              <Calendar className="text-gray-200 mx-auto mb-4" size={40} />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Submissions Found</h3>
              <p className="text-gray-400 text-sm">Adjust filters or search query.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredSubmissions.map((submission) => {
                const worker = getWorker(submission.userId);
                return (
                  <Card key={submission.id} className="overflow-hidden border border-gray-100 hover:border-indigo-100 transition-all duration-300">
                    <div className="p-8">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                              {worker?.fullName.charAt(0)}
                            </div>
                            {submission.adminReviewed && (
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-white">
                                <CheckCircle size={12} />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-bold text-gray-900 uppercase">{worker?.fullName}</h3>
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${submission.adminReviewed
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-amber-50 text-amber-700 border-amber-100'
                                }`}>
                                {submission.adminReviewed ? 'Reviewed' : 'Action Required'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1.5">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                <Calendar size={14} className="text-indigo-600/70" />
                                {format(new Date(submission.date), 'MMM dd, yyyy')}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                <Clock size={14} className="text-indigo-600/70" />
                                {submission.hoursWorked} Hours
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                            {submission.workType.replace('-', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="mb-8 p-6 bg-gray-50 border border-gray-100 rounded-2xl">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <MessageSquare size={14} className="text-indigo-600" /> Report
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed pl-4 border-l-2 border-indigo-200">
                          {submission.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-6">
                        <div className="flex flex-wrap gap-3">
                          {submission.githubCommitUrl && (
                            <a
                              href={submission.githubCommitUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-6 h-11 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-black transition-all"
                            >
                              <Github size={16} /> GitHub
                            </a>
                          )}
                          {submission.videoUrl && (
                            <a
                              href={submission.videoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-6 h-11 bg-white text-rose-600 border border-rose-200 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-rose-50 transition-all"
                            >
                              <Video size={16} /> Review Video
                            </a>
                          )}
                        </div>

                        {submission.adminFeedback ? (
                          <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-100 group/feedback">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                              <MessageSquare size={14} />
                            </div>
                            <div className="max-w-[250px]">
                              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Admin Feedback</p>
                              <p className="text-xs text-gray-600 truncate">"{submission.adminFeedback}"</p>
                            </div>
                            <button
                              onClick={() => setFeedbackModal({ submissionId: submission.id, userId: submission.userId, feedback: submission.adminFeedback || '', workerName: worker?.fullName || 'Specialist' })}
                              className="p-2 text-gray-400 hover:text-indigo-600 transition-all opacity-0 group-hover/feedback:opacity-100"
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => setFeedbackModal({ submissionId: submission.id, userId: submission.userId, feedback: submission.adminFeedback || '', workerName: worker?.fullName || 'Specialist' })}
                            className="px-8 h-11"
                          >
                            <Send size={16} /> Give Feedback
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {feedbackModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full animate-in zoom-in duration-200 overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Feedback</h3>
                  <p className="text-xs text-gray-400">{feedbackModal.workerName}</p>
                </div>
              </div>
              <button
                onClick={() => setFeedbackModal(null)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all"
              >✕</button>
            </div>

            <div className="p-6">
              <textarea
                value={feedbackModal.feedback}
                onChange={(e) => setFeedbackModal({ ...feedbackModal, feedback: e.target.value })}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium focus:border-indigo-600 transition-all min-h-[150px]"
                placeholder="Type your feedback here..."
                autoFocus
              />
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setFeedbackModal(null)}
                disabled={busy}
                className="h-10 px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitFeedback}
                disabled={!feedbackModal.feedback || busy}
                className="h-10 px-8"
              >
                {busy ? 'Sending...' : 'Send Feedback'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
