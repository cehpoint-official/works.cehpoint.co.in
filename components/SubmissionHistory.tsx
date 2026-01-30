// components/SubmissionHistory.tsx
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  FileText,
  MessageSquare,
  Clock,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Github,
  Video,
  Calendar
} from "lucide-react";
import type { DailySubmission } from "../utils/types";

interface Props {
  submissions: DailySubmission[];
}

export default function SubmissionHistory({ submissions }: Props) {
  if (submissions.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-slate-100 rounded-[2.5rem] p-20 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200">
          <Calendar className="w-8 h-8" />
        </div>
        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">No mission logs recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((sub, idx) => (
        <motion.div
          key={sub.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="bg-white border border-slate-100 rounded-[2rem] p-6 md:p-8 hover:shadow-xl transition-all group overflow-hidden relative"
        >
          {/* Status Indicator Bar */}
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${sub.adminReviewed ? 'bg-emerald-500' : 'bg-amber-400'}`} />

          <div className="flex flex-col md:flex-row gap-8">
            {/* DATE & STATUS */}
            <div className="md:w-56 shrink-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <Calendar size={18} />
                </div>
                <div>
                  <span className="block text-sm font-black text-slate-900">{format(new Date(sub.date), "MMM dd, yyyy")}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(new Date(sub.date), "EEEE")}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  <Clock className="w-3.5 h-3.5" />
                  {sub.hoursWorked} Hours Logged
                </div>
                {sub.adminReviewed ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified by Admin
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-xl text-[10px] font-black text-amber-600 uppercase tracking-widest">
                    <Clock className="w-3.5 h-3.5" />
                    Pending Review
                  </div>
                )}
              </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 space-y-6">
              <div className="space-y-4">
                <div className="inline-block px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                  {sub.workType}
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-relaxed text-balance">
                  {sub.description}
                </h3>
              </div>

              {/* LINKS */}
              {(sub.githubCommitUrl || sub.videoUrl || sub.workUrl || sub.proofUrl) && (
                <div className="flex flex-wrap gap-3">
                  {sub.githubCommitUrl && (
                    <a href={sub.githubCommitUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 hover:-translate-y-1 transition-all shadow-lg shadow-slate-900/10">
                      <Github size={14} /> Repository
                    </a>
                  )}
                  {sub.videoUrl && (
                    <a href={sub.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-rose-600 text-white rounded-2xl text-xs font-bold hover:bg-rose-700 hover:-translate-y-1 transition-all shadow-lg shadow-rose-600/10">
                      <Video size={14} /> Proof Video
                    </a>
                  )}
                  {sub.workUrl && (
                    <a href={sub.workUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-2xl text-xs font-bold hover:bg-indigo-100 hover:-translate-y-1 transition-all">
                      <LinkIcon size={14} /> Deployment
                    </a>
                  )}
                </div>
              )}

              {/* FEEDBACK BOX */}
              {sub.adminFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mt-8 p-8 bg-slate-900 rounded-[2rem] relative overflow-hidden group/feedback"
                >
                  {/* Decorative element */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover/feedback:scale-150 transition-transform duration-1000" />

                  <div className="relative z-10 flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-indigo-400 shrink-0">
                      <MessageSquare size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3 block">Manager Feedback</span>
                      <p className="text-slate-200 text-base font-medium italic leading-relaxed">
                        &quot;{sub.adminFeedback}&quot;
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
