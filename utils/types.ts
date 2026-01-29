// // utils/types.ts

// export type AccountStatus = "pending" | "active" | "suspended" | "terminated";
// export type UserRole = "worker" | "admin";

// /* ============================
//    PAYOUT ACCOUNT
// ============================ */
// export interface PayoutAccount {
//   accountType: "upi" | "bank" | "paypal" | "crypto";
//   verified: boolean;

//   // UPI
//   upiId?: string;

//   // Bank details
//   accountHolderName?: string;
//   bankName?: string;
//   bankAccountNumber?: string;
//   bankIfsc?: string;

//   // PayPal
//   paypalEmail?: string;

//   // Crypto
//   cryptoNetwork?: string;
//   cryptoAddress?: string;

//   accountNumber: string;
// }


// /* ============================
//    USER
// ============================ */
// export interface User {
//   id: string;
//   email: string;
//   password: string;
//   fullName: string;

//   phone: string;
//   skills: string[];
//   experience: string;
//   timezone: string;                // e.g. "Asia/Kolkata"

//   preferredWeeklyPayout: number;   // numeric amount
//   payoutCurrency?: "INR" | "USD";  // <-- NEW (optional so old docs still valid)

//   role: UserRole;
//   accountStatus: AccountStatus;

//   knowledgeScore: number;
//   demoTaskCompleted: boolean;
//   demoTaskScore?: number;

//   payoutAccount?: PayoutAccount;

//   emailVerified: boolean;

//   createdAt: string;
//   balance: number;

//   uid?: string;  // Firebase Auth UID
// }

// /* ============================
//    TASK
// ============================ */
// export interface Task {
//   id: string;

//   title: string;
//   description: string;
//   category: string;

//   skills: string[];
//   weeklyPayout: number;
//   deadline: string; // ISO date or '' if not provided

//   status:
//     | "available"
//     | "assigned"
//     | "in-progress"
//     | "submitted"
//     | "completed"
//     | "rejected";

//   createdBy: string;
//   createdAt: string;

//   assignedTo: string | null;
//   assignedAt?: string;

//   submittedAt?: string;
//   submissionUrl?: string;

//   completedAt?: string;
//   feedback?: string;
// }

// /* ============================
//    DAILY SUBMISSION
// ============================ */
// export interface DailySubmission {
//   id: string;
//   userId: string;
//   date: string; // YYYY-MM-DD
//   githubCommitUrl?: string;
//   videoUrl?: string;
//   description: string;
//   workType: "development" | "design" | "video-editing" | "content" | "other";
//   hoursWorked: number;
//   createdAt: string;
//   adminReviewed: boolean;
//   adminFeedback?: string;
// }

// export type Currency = "INR" | "USD";

// /* ============================
//    PAYMENT
// ============================ */
// export interface Payment {
//   id: string;
//   userId: string;
//   amount: number;
//   type: "task-payment" | "manual" | "bonus" | "withdrawal";
//   status: "pending" | "completed" | "failed";

//   taskId?: string;

//   createdAt: string;
//   completedAt?: string;

//   payoutMethod?: "upi" | "bank" | "paypal" | "crypto";
//   payoutMethodDetails?: string;
// }



























// utils/types.ts

export type AccountStatus = "pending" | "active" | "suspended" | "terminated";
export type UserRole = "worker" | "admin";

// 🔹 Add this:
export type Currency = "USD" | "INR";

/* ============================
   PAYOUT ACCOUNT
============================ */
export interface PayoutAccount {
  accountType: "upi" | "bank" | "paypal" | "crypto";  // extended types
  verified: boolean;

  // UPI
  upiId?: string;

  // Bank details
  accountHolderName?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;

  // PayPal
  paypalEmail?: string;

  // Crypto
  cryptoNetwork?: string;
  cryptoAddress?: string;

  // General / common
  accountNumber: string; // same as UPI, bank account, paypal email, or crypto address
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

  // 🔹 Add this (display currency preference)
  preferredCurrency?: Currency;

  role: UserRole;
  accountStatus: AccountStatus;

  knowledgeScore: number;
  demoTaskCompleted: boolean;
  demoTaskScore?: number;

  payoutAccount?: PayoutAccount;

  emailVerified: boolean;

  createdAt: string;
  balance: number;

  uid?: string;
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
  deadline: string;

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

  // 🔹 Workers who passed the filter and can see/accept this task
  candidateWorkerIds?: string[];
  declinedBy?: string[];

  // 🔹 Progress Tracking
  progress?: number; // 0-100
  checklist?: { text: string; completed: boolean }[];

  submittedAt?: string;
  submissionUrl?: string;

  completedAt?: string;
  feedback?: string;

  projectDetails?: string;
  helperEmail?: string;
}

/* ============================
   DAILY SUBMISSION
============================ */
export interface DailySubmission {
  id: string;
  userId: string;
  date: string;
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
  amount: number; // 🔹 stored in BASE currency (USD)
  type: "task-payment" | "manual" | "bonus" | "withdrawal";
  status: "pending" | "completed" | "failed";

  taskId?: string;

  createdAt: string;
  completedAt?: string;

  payoutMethod?: "upi" | "bank" | "paypal" | "crypto";
  payoutMethodDetails?: string;
}

/* ============================
   NOTIFICATION
============================ */
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  link?: string;
}