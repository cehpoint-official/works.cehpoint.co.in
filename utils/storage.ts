export interface User {
  id: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  skills: string[];
  experience: string;
  timezone: string;
  preferredWeeklyPayout: number;
  accountStatus: 'pending' | 'active' | 'suspended' | 'terminated';
  role: 'worker' | 'admin';
  knowledgeScore: number;
  demoTaskCompleted: boolean;
  demoTaskScore?: number;
  payoutAccount?: {
    accountType: string;
    accountNumber: string;
    verified: boolean;
  };
  createdAt: string;
  balance: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  weeklyPayout: number;
  deadline: string;
  status: 'available' | 'assigned' | 'in-progress' | 'submitted' | 'completed' | 'rejected';
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  submittedAt?: string;
  completedAt?: string;
  submissionUrl?: string;
  feedback?: string;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  type: 'task-payment' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed';
  taskId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface DailySubmission {
  id: string;
  userId: string;
  date: string;
  githubCommitUrl?: string;
  videoUrl?: string;
  description: string;
  workType: 'development' | 'design' | 'video-editing' | 'content' | 'other';
  hoursWorked: number;
  createdAt: string;
  adminReviewed: boolean;
  adminFeedback?: string;
}

export const storage = {
  getUsers: (): User[] => {
    if (typeof window === 'undefined') return [];
    const users = localStorage.getItem('cehpoint_users');
    return users ? JSON.parse(users) : [];
  },

  setUsers: (users: User[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cehpoint_users', JSON.stringify(users));
  },

  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const user = sessionStorage.getItem('cehpoint_current_user');
    return user ? JSON.parse(user) : null;
  },

  setCurrentUser: (user: User | null) => {
    if (typeof window === 'undefined') return;
    if (user) {
      sessionStorage.setItem('cehpoint_current_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('cehpoint_current_user');
    }
  },

  getTasks: (): Task[] => {
    if (typeof window === 'undefined') return [];
    const tasks = localStorage.getItem('cehpoint_tasks');
    return tasks ? JSON.parse(tasks) : [];
  },

  setTasks: (tasks: Task[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cehpoint_tasks', JSON.stringify(tasks));
  },

  getPayments: (): Payment[] => {
    if (typeof window === 'undefined') return [];
    const payments = localStorage.getItem('cehpoint_payments');
    return payments ? JSON.parse(payments) : [];
  },

  setPayments: (payments: Payment[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cehpoint_payments', JSON.stringify(payments));
  },

  getDailySubmissions: (): DailySubmission[] => {
    if (typeof window === 'undefined') return [];
    const submissions = localStorage.getItem('cehpoint_daily_submissions');
    return submissions ? JSON.parse(submissions) : [];
  },

  setDailySubmissions: (submissions: DailySubmission[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cehpoint_daily_submissions', JSON.stringify(submissions));
  },
};
