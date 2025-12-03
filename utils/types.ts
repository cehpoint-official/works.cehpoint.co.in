// utils/types.ts

export type AccountStatus = "pending" | "active" | "suspended" | "terminated";
export type UserRole = "worker" | "admin";

/* ============================
   PAYOUT ACCOUNT
============================ */
export interface PayoutAccount {
  accountType: "upi" | "bank";  // restrict values
  verified: boolean;

  // UPI
  upiId?: string;

  // Bank details
  accountHolderName?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;

  // General / common
  accountNumber: string; // same as UPI or bank account number
}

/* ============================
   USER
============================ */
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

  role: UserRole;
  accountStatus: AccountStatus;

  knowledgeScore: number;
  demoTaskCompleted: boolean;
  demoTaskScore?: number;

  payoutAccount?: PayoutAccount;  // <-- use the clean interface

  emailVerified: boolean;

  createdAt: string;
  balance: number;

  // must always exist in DB
  uid?: string;  // Firebase Auth UID
}

/* ============================
   TASK
============================ */
export interface Task {
  id: string;

  title: string;
  description: string;
  category: string;

  skills: string[];
  weeklyPayout: number;
  deadline: string; // ISO date or '' if not provided

  status:
    | "available"
    | "assigned"
    | "in-progress"
    | "submitted"
    | "completed"
    | "rejected";

  createdBy: string;
  createdAt: string;

  assignedTo: string | null;
  assignedAt?: string;

  submittedAt?: string;
  submissionUrl?: string;

  completedAt?: string;
  feedback?: string;
}

/* ============================
   DAILY SUBMISSION
============================ */
export interface DailySubmission {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  githubCommitUrl?: string;
  videoUrl?: string;
  description: string;
  workType: "development" | "design" | "video-editing" | "content" | "other";
  hoursWorked: number;
  createdAt: string;
  adminReviewed: boolean;
  adminFeedback?: string;
}

/* ============================
   PAYMENT
============================ */
export interface Payment {
  id: string;
  userId: string;
  amount: number;
  type: "task-payment" | "manual" | "bonus" | "withdrawal";
  status: "pending" | "completed" | "failed";

  taskId?: string;

  createdAt: string;
  completedAt?: string;

  payoutMethod?: "upi" | "bank";
  payoutMethodDetails?: string;
}