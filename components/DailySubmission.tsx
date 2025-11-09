import { useState } from 'react';
import { Calendar, Github, Video, Clock, Send } from 'lucide-react';
import { storage, DailySubmission } from '../utils/storage';
import Button from './Button';

interface DailySubmissionFormProps {
  userId: string;
  onSubmit: () => void;
}

export default function DailySubmissionForm({ userId, onSubmit }: DailySubmissionFormProps) {
  const [formData, setFormData] = useState({
    githubCommitUrl: '',
    videoUrl: '',
    description: '',
    workType: 'development' as 'development' | 'design' | 'video-editing' | 'content' | 'other',
    hoursWorked: 0,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const user = storage.getUsers().find(u => u.id === userId);
  const isDevelopmentWorker = user?.skills.some(skill => 
    ['React', 'Node.js', 'Python', 'Java', 'PHP', 'Angular', 'Vue.js'].includes(skill)
  );

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const hasSubmittedToday = () => {
    const submissions = storage.getDailySubmissions();
    const today = getTodayDate();
    return submissions.some(s => s.userId === userId && s.date === today);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (hasSubmittedToday()) {
      setError('You have already submitted your daily work for today!');
      return;
    }

    if (isDevelopmentWorker && !formData.githubCommitUrl) {
      setError('GitHub commit link is mandatory for development workers!');
      return;
    }

    if (!formData.description || formData.hoursWorked <= 0) {
      setError('Please provide work description and hours worked.');
      return;
    }

    const newSubmission: DailySubmission = {
      id: `submission-${Date.now()}`,
      userId,
      date: getTodayDate(),
      githubCommitUrl: formData.githubCommitUrl,
      videoUrl: formData.videoUrl,
      description: formData.description,
      workType: formData.workType,
      hoursWorked: formData.hoursWorked,
      createdAt: new Date().toISOString(),
      adminReviewed: false,
    };

    const submissions = storage.getDailySubmissions();
    storage.setDailySubmissions([...submissions, newSubmission]);

    setSuccess('Daily work submitted successfully! 🎉');
    setFormData({
      githubCommitUrl: '',
      videoUrl: '',
      description: '',
      workType: 'development',
      hoursWorked: 0,
    });

    setTimeout(() => {
      onSubmit();
    }, 1500);
  };

  if (hasSubmittedToday()) {
    return (
      <div className="glass-card rounded-3xl premium-shadow p-10 text-center animate-fade-in">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Calendar className="text-white" size={40} />
        </div>
        <h3 className="text-2xl font-black text-gray-900 mb-3">All Set for Today! ✅</h3>
        <p className="text-gray-600 text-lg">
          You've already submitted your daily work. Great job!
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl premium-shadow p-10 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 mb-2">Daily Work Submission</h2>
        <p className="text-gray-600 text-lg">
          {isDevelopmentWorker && (
            <span className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
              <Github size={16} /> GitHub commit link is mandatory
            </span>
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl font-medium animate-fade-in">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-2 border-green-200 text-green-700 px-5 py-4 rounded-xl font-medium animate-fade-in">
            {success}
          </div>
        )}

        <div>
          <label className="block text-sm font-bold mb-3 text-gray-700 flex items-center gap-2">
            <Calendar size={18} className="text-indigo-600" />
            Work Type
          </label>
          <select
            value={formData.workType}
            onChange={(e) => setFormData({ ...formData, workType: e.target.value as any })}
            className="w-full px-5 py-4 premium-input rounded-xl text-base font-medium"
          >
            <option value="development">Software Development</option>
            <option value="design">UI/UX Design</option>
            <option value="video-editing">Video Editing</option>
            <option value="content">Content Writing</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold mb-3 text-gray-700 flex items-center gap-2">
            <Github size={18} className="text-indigo-600" />
            GitHub Commit URL {isDevelopmentWorker && <span className="text-red-600">*</span>}
          </label>
          <input
            type="url"
            value={formData.githubCommitUrl}
            onChange={(e) => setFormData({ ...formData, githubCommitUrl: e.target.value })}
            className="w-full px-5 py-4 premium-input rounded-xl text-base font-medium"
            placeholder="https://github.com/username/repo/commit/..."
            required={isDevelopmentWorker}
          />
          <p className="text-sm text-gray-500 mt-2">
            Paste your GitHub commit link or repository URL
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold mb-3 text-gray-700 flex items-center gap-2">
            <Video size={18} className="text-indigo-600" />
            Video/Demo URL (Optional)
          </label>
          <input
            type="url"
            value={formData.videoUrl}
            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
            className="w-full px-5 py-4 premium-input rounded-xl text-base font-medium"
            placeholder="https://drive.google.com/... or YouTube link"
          />
          <p className="text-sm text-gray-500 mt-2">
            Share a video demo, screen recording, or work sample
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold mb-3 text-gray-700">
            Work Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-5 py-4 premium-input rounded-xl text-base font-medium"
            rows={4}
            placeholder="Describe what you worked on today..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-3 text-gray-700 flex items-center gap-2">
            <Clock size={18} className="text-indigo-600" />
            Hours Worked
          </label>
          <input
            type="number"
            min="0.5"
            max="24"
            step="0.5"
            value={formData.hoursWorked || ''}
            onChange={(e) => setFormData({ ...formData, hoursWorked: parseFloat(e.target.value) || 0 })}
            className="w-full px-5 py-4 premium-input rounded-xl text-base font-medium"
            placeholder="8"
            required
          />
        </div>

        <Button type="submit" fullWidth>
          <Send size={20} />
          <span>Submit Daily Work</span>
        </Button>
      </form>
    </div>
  );
}
