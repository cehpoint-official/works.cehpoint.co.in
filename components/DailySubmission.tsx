// components/DailySubmission.tsx
import { useState, useEffect } from 'react';
import { Calendar, Github, Video, Clock, Send, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { storage } from '../utils/storage';
import type { DailySubmission, User } from '../utils/types';

import Button from './Button';

interface DailySubmissionFormProps {
  userId: string;
  onSubmit: () => void;
}

export default function DailySubmissionForm({ userId, onSubmit }: DailySubmissionFormProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    githubCommitUrl: '',
    videoUrl: '',
    description: '',
    workType: 'development' as 'development' | 'design' | 'video-editing' | 'content' | 'other',
    hoursWorked: 0,
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const userData = await storage.getUserById(userId);
      setUser(userData);
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white border border-slate-100 rounded-[2.5rem]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Encrypting Workspace...</p>
      </div>
    );
  }

  if (!user) return null;

  const isDevelopmentWorker = (user.primaryDomain?.toLowerCase().includes("development")) || (user.skills?.some(skill =>
    ['React', 'Node.js', 'Python', 'Java', 'PHP', 'Angular', 'Vue.js', 'Next.js', 'TypeScript'].includes(skill)
  ));

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const submissions = await storage.getSubmissionsByUser(userId);
      const today = getTodayDate();
      if (submissions.some(s => s.date === today)) {
        setError('You have already submitted your work log for today.');
        setIsSubmitting(false);
        return;
      }

      if (isDevelopmentWorker && !formData.githubCommitUrl) {
        setError('Please provide a GitHub link. It is required for developers.');
        setIsSubmitting(false);
        return;
      }

      if (!formData.description || formData.hoursWorked <= 0) {
        setError('Please describe your work and enter the hours worked.');
        setIsSubmitting(false);
        return;
      }

      const submission: Omit<DailySubmission, 'id'> = {
        userId,
        date: today,
        githubCommitUrl: formData.githubCommitUrl,
        videoUrl: formData.videoUrl,
        description: formData.description,
        workType: formData.workType,
        hoursWorked: formData.hoursWorked,
        createdAt: new Date().toISOString(),
        adminReviewed: false,
      };

      await storage.createSubmission(submission);

      setSuccess('Work Log Saved! 🎉');
      setFormData({
        githubCommitUrl: '',
        videoUrl: '',
        description: '',
        workType: 'development',
        hoursWorked: 0,
      });

      setTimeout(() => onSubmit(), 1500);
    } catch (err) {
      setError('Failed to save. Please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-12 shadow-sm relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32" />

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-slate-900/10">
            <Send size={24} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Submit Work Log</h2>
          <p className="text-slate-500 font-medium">Log your work every day to ensure you get paid on time.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-bold">
                <AlertTriangle size={18} /> {error}
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 text-sm font-bold">
                <CheckCircle2 size={18} /> {success}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Calendar size={12} className="text-indigo-600" /> Type of Work
              </label>
              <select
                value={formData.workType}
                onChange={(e) => setFormData({ ...formData, workType: e.target.value as any })}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-600 rounded-2xl outline-none transition-all font-bold appearance-none cursor-pointer"
              >
                <option value="development">Development</option>
                <option value="design">Design</option>
                <option value="video-editing">Video Editing</option>
                <option value="content">Writing/Content</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Clock size={12} className="text-indigo-600" /> Hours Worked
              </label>
              <input
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                placeholder="How many hours?"
                value={formData.hoursWorked || ''}
                onChange={(e) => setFormData({ ...formData, hoursWorked: parseFloat(e.target.value) || 0 })}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-600 rounded-2xl outline-none transition-all font-bold"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Github size={12} className="text-indigo-600" /> GitHub Link
              {isDevelopmentWorker && <span className="text-rose-500">*</span>}
            </label>
            <div className="relative group">
              <input
                type="url"
                value={formData.githubCommitUrl}
                onChange={(e) => setFormData({ ...formData, githubCommitUrl: e.target.value })}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-600 rounded-2xl outline-none transition-all font-bold pl-12"
                placeholder="https://github.com/..."
                required={isDevelopmentWorker}
              />
              <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Video size={12} className="text-indigo-600" /> Video Link (Optional)
            </label>
            <div className="relative group">
              <input
                type="url"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-600 rounded-2xl outline-none transition-all font-bold pl-12"
                placeholder="Loom, Drive, or YouTube link"
              />
              <Video className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">What did you do today?</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-5 py-5 bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-600 rounded-2xl outline-none transition-all font-bold min-h-[150px] resize-none"
              placeholder="Describe the work you completed today..."
              required
            />
          </div>

          <div className="pt-6">
            <Button
              type="submit"
              className="w-full h-16 rounded-[1.25rem] shadow-2xl shadow-indigo-600/20 text-sm uppercase tracking-[0.2em]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Work Log"} <Send className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={18} />
            </Button>

            <div className="flex items-center justify-center gap-2 mt-6 py-2">
              <Info size={14} className="text-slate-400" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Once submitted, your logs will be used to calculate your weekly pay.</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}