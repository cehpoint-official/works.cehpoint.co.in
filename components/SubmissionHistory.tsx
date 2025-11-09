import { Github, Video, Calendar, Clock, MessageSquare } from 'lucide-react';
import { DailySubmission } from '../utils/storage';
import { format } from 'date-fns';

interface SubmissionHistoryProps {
  submissions: DailySubmission[];
}

export default function SubmissionHistory({ submissions }: SubmissionHistoryProps) {
  if (submissions.length === 0) {
    return (
      <div className="glass-card rounded-3xl premium-shadow p-10 text-center">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Submissions Yet</h3>
        <p className="text-gray-600">Start submitting your daily work to track your progress</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <div
          key={submission.id}
          className="glass-card rounded-2xl premium-shadow p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={18} className="text-indigo-600" />
                <span className="font-bold text-gray-900">
                  {format(new Date(submission.date), 'MMMM dd, yyyy')}
                </span>
              </div>
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">
                {submission.workType.replace('-', ' ').toUpperCase()}
              </span>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock size={16} />
                <span className="font-bold">{submission.hoursWorked}h</span>
              </div>
              {submission.adminReviewed && (
                <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                  ✓ Reviewed
                </span>
              )}
            </div>
          </div>

          <p className="text-gray-700 mb-4 leading-relaxed">{submission.description}</p>

          <div className="flex flex-wrap gap-3">
            {submission.githubCommitUrl && (
              <a
                href={submission.githubCommitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
              >
                <Github size={16} />
                View GitHub
              </a>
            )}
            {submission.videoUrl && (
              <a
                href={submission.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
              >
                <Video size={16} />
                View Video
              </a>
            )}
          </div>

          {submission.adminFeedback && (
            <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-600 rounded-lg">
              <div className="flex items-start gap-2">
                <MessageSquare size={18} className="text-blue-600 mt-1" />
                <div>
                  <p className="font-bold text-blue-900 mb-1">Admin Feedback:</p>
                  <p className="text-blue-800">{submission.adminFeedback}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
