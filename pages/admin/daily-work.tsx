import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { storage, DailySubmission, User } from '../../utils/storage';
import { Github, Video, Calendar, Clock, Users, Filter, MessageSquare, Send } from 'lucide-react';
import { format } from 'date-fns';
import Button from '../../components/Button';

export default function AdminDailyWork() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<DailySubmission[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedWorkType, setSelectedWorkType] = useState<string>('all');
  const [feedbackModal, setFeedbackModal] = useState<{ submissionId: string; feedback: string } | null>(null);

  useEffect(() => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadData();
  }, [router]);

  const loadData = () => {
    const allSubmissions = storage.getDailySubmissions();
    setSubmissions(allSubmissions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    const allWorkers = storage.getUsers().filter(u => u.role === 'worker');
    setWorkers(allWorkers);
  };

  const getWorkerName = (userId: string) => {
    const worker = workers.find(w => w.id === userId);
    return worker?.fullName || 'Unknown Worker';
  };

  const filteredSubmissions = submissions.filter(s => {
    if (selectedWorker !== 'all' && s.userId !== selectedWorker) return false;
    if (selectedDate && s.date !== selectedDate) return false;
    if (selectedWorkType !== 'all' && s.workType !== selectedWorkType) return false;
    return true;
  });

  const handleSubmitFeedback = (submissionId: string) => {
    if (!feedbackModal?.feedback) return;
    
    const allSubmissions = storage.getDailySubmissions();
    const updated = allSubmissions.map(s => 
      s.id === submissionId 
        ? { ...s, adminReviewed: true, adminFeedback: feedbackModal.feedback }
        : s
    );
    storage.setDailySubmissions(updated);
    loadData();
    setFeedbackModal(null);
  };

  if (!user) return null;

  const stats = [
    {
      label: 'Total Submissions',
      value: submissions.length,
      icon: Calendar,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      label: 'Today',
      value: submissions.filter(s => s.date === new Date().toISOString().split('T')[0]).length,
      icon: Clock,
      color: 'from-green-500 to-emerald-600',
    },
    {
      label: 'Active Workers',
      value: new Set(submissions.map(s => s.userId)).size,
      icon: Users,
      color: 'from-purple-500 to-pink-600',
    },
    {
      label: 'Needs Review',
      value: submissions.filter(s => !s.adminReviewed).length,
      icon: MessageSquare,
      color: 'from-orange-500 to-red-600',
    },
  ];

  return (
    <Layout>
      <Head>
        <title>Daily Work Submissions - Admin</title>
      </Head>

      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Daily Work Submissions</h1>
          <p className="text-gray-600 text-lg">Monitor worker progress and review daily submissions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="glass-card rounded-2xl premium-shadow p-6">
              <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                <stat.icon className="text-white" size={28} />
              </div>
              <p className="text-3xl font-black text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1 font-semibold">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-3xl premium-shadow p-8">
          <div className="flex items-center gap-4 mb-6">
            <Filter className="text-indigo-600" size={24} />
            <h2 className="text-2xl font-black text-gray-900">Filter Submissions</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">Worker</label>
              <select
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="w-full px-4 py-3 premium-input rounded-xl font-medium"
              >
                <option value="all">All Workers</option>
                {workers.map(w => (
                  <option key={w.id} value={w.id}>{w.fullName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 premium-input rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">Work Type</label>
              <select
                value={selectedWorkType}
                onChange={(e) => setSelectedWorkType(e.target.value)}
                className="w-full px-4 py-3 premium-input rounded-xl font-medium"
              >
                <option value="all">All Types</option>
                <option value="development">Development</option>
                <option value="design">Design</option>
                <option value="video-editing">Video Editing</option>
                <option value="content">Content</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {(selectedWorker !== 'all' || selectedDate || selectedWorkType !== 'all') && (
            <button
              onClick={() => {
                setSelectedWorker('all');
                setSelectedDate('');
                setSelectedWorkType('all');
              }}
              className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-bold"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-black text-gray-900">
            Submissions ({filteredSubmissions.length})
          </h2>

          {filteredSubmissions.length === 0 ? (
            <div className="glass-card rounded-3xl premium-shadow p-16 text-center">
              <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Submissions Found</h3>
              <p className="text-gray-600 text-lg">Try adjusting your filters or check back later</p>
            </div>
          ) : (
            filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="glass-card rounded-2xl premium-shadow p-8 hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg">
                        {getWorkerName(submission.userId).charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900">
                          {getWorkerName(submission.userId)}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-600 mt-1">
                          <Calendar size={16} />
                          <span className="font-semibold">
                            {format(new Date(submission.date), 'MMMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-block px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-lg text-sm font-black">
                        {submission.workType.replace('-', ' ').toUpperCase()}
                      </span>
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold">
                        <Clock size={16} />
                        {submission.hoursWorked}h
                      </span>
                    </div>
                  </div>
                  {!submission.adminReviewed && (
                    <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold">
                      Needs Review
                    </span>
                  )}
                  {submission.adminReviewed && (
                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold flex items-center gap-2">
                      ✓ Reviewed
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-2">Work Description:</h4>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl">
                    {submission.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 mb-6">
                  {submission.githubCommitUrl && (
                    <a
                      href={submission.githubCommitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-bold text-sm shadow-lg hover:shadow-xl"
                    >
                      <Github size={18} />
                      View GitHub
                    </a>
                  )}
                  {submission.videoUrl && (
                    <a
                      href={submission.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-xl transition-all font-bold text-sm shadow-lg"
                    >
                      <Video size={18} />
                      View Video
                    </a>
                  )}
                </div>

                {submission.adminFeedback ? (
                  <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 rounded-xl">
                    <div className="flex items-start gap-3">
                      <MessageSquare size={20} className="text-blue-600 mt-1" />
                      <div className="flex-1">
                        <p className="font-bold text-blue-900 mb-2">Your Feedback:</p>
                        <p className="text-blue-800">{submission.adminFeedback}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setFeedbackModal({ submissionId: submission.id, feedback: '' })}
                    variant="outline"
                  >
                    <MessageSquare size={18} />
                    <span>Add Feedback</span>
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {feedbackModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl premium-shadow p-10 max-w-2xl w-full animate-fade-in">
            <h3 className="text-3xl font-black text-gray-900 mb-6">Add Feedback</h3>
            <textarea
              value={feedbackModal.feedback}
              onChange={(e) => setFeedbackModal({ ...feedbackModal, feedback: e.target.value })}
              className="w-full px-5 py-4 premium-input rounded-xl text-base font-medium mb-6"
              rows={6}
              placeholder="Provide constructive feedback to the worker..."
              autoFocus
            />
            <div className="flex gap-4">
              <Button
                onClick={() => handleSubmitFeedback(feedbackModal.submissionId)}
                disabled={!feedbackModal.feedback}
              >
                <Send size={18} />
                <span>Submit Feedback</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setFeedbackModal(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
