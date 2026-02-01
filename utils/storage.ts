// export interface User {
//   id: string;
//   email: string;
//   password: string;
//   fullName: string;
//   phone: string;
//   skills: string[];
//   experience: string;
//   timezone: string;
//   preferredWeeklyPayout: number;
//   accountStatus: 'pending' | 'active' | 'suspended' | 'terminated';
//   role: 'worker' | 'admin';
//   knowledgeScore: number;
//   demoTaskCompleted: boolean;
//   demoTaskScore?: number;
//   payoutAccount?: {
//     accountType: string;
//     accountNumber: string;
//     verified: boolean;
//   };
//   createdAt: string;
//   balance: number;
// }

// export interface Task {
//   id: string;
//   title: string;
//   description: string;
//   category: string;
//   skills: string[];
//   weeklyPayout: number;
//   deadline: string;
//   status: 'available' | 'assigned' | 'in-progress' | 'submitted' | 'completed' | 'rejected';
//   assignedTo?: string;
//   createdBy: string;
//   createdAt: string;
//   submittedAt?: string;
//   completedAt?: string;
//   submissionUrl?: string;
//   feedback?: string;
// }

// export interface Payment {
//   id: string;
//   userId: string;
//   amount: number;
//   type: 'task-payment' | 'withdrawal';
//   status: 'pending' | 'completed' | 'failed';
//   taskId?: string;
//   createdAt: string;
//   completedAt?: string;
// }

// export interface DailySubmission {
//   id: string;
//   userId: string;
//   date: string;
//   githubCommitUrl?: string;
//   videoUrl?: string;
//   description: string;
//   workType: 'development' | 'design' | 'video-editing' | 'content' | 'other';
//   hoursWorked: number;
//   createdAt: string;
//   adminReviewed: boolean;
//   adminFeedback?: string;
// }

// export const storage = {
//   getUsers: (): User[] => {
//     if (typeof window === 'undefined') return [];
//     const users = localStorage.getItem('cehpoint_users');
//     return users ? JSON.parse(users) : [];
//   },

//   setUsers: (users: User[]) => {
//     if (typeof window === 'undefined') return;
//     localStorage.setItem('cehpoint_users', JSON.stringify(users));
//   },

//   getCurrentUser: (): User | null => {
//     if (typeof window === 'undefined') return null;
//     const user = sessionStorage.getItem('cehpoint_current_user');
//     return user ? JSON.parse(user) : null;
//   },

//   setCurrentUser: (user: User | null) => {
//     if (typeof window === 'undefined') return;
//     if (user) {
//       sessionStorage.setItem('cehpoint_current_user', JSON.stringify(user));
//     } else {
//       sessionStorage.removeItem('cehpoint_current_user');
//     }
//   },

//   getTasks: (): Task[] => {
//     if (typeof window === 'undefined') return [];
//     const tasks = localStorage.getItem('cehpoint_tasks');
//     return tasks ? JSON.parse(tasks) : [];
//   },

//   setTasks: (tasks: Task[]) => {
//     if (typeof window === 'undefined') return;
//     localStorage.setItem('cehpoint_tasks', JSON.stringify(tasks));
//   },

//   getPayments: (): Payment[] => {
//     if (typeof window === 'undefined') return [];
//     const payments = localStorage.getItem('cehpoint_payments');
//     return payments ? JSON.parse(payments) : [];
//   },

//   setPayments: (payments: Payment[]) => {
//     if (typeof window === 'undefined') return;
//     localStorage.setItem('cehpoint_payments', JSON.stringify(payments));
//   },

//   getDailySubmissions: (): DailySubmission[] => {
//     if (typeof window === 'undefined') return [];
//     const submissions = localStorage.getItem('cehpoint_daily_submissions');
//     return submissions ? JSON.parse(submissions) : [];
//   },

//   setDailySubmissions: (submissions: DailySubmission[]) => {
//     if (typeof window === 'undefined') return;
//     localStorage.setItem('cehpoint_daily_submissions', JSON.stringify(submissions));
//   },
// };












// utils/storage.ts

// utils/storage.ts
import {
  createUser as fsCreateUser,
  getUserByEmail as fsGetUserByEmail,
  getUserById as fsGetUserById,
  listUsers as fsListUsers,
  setUser as fsSetUser,

  createTask as fsCreateTask,
  listTasks as fsListTasks,
  getTaskById as fsGetTaskById,
  updateTask as fsUpdateTask,

  createSubmission as fsCreateSubmission,
  listSubmissionsByUser as fsListSubmissionsByUser,
  listSubmissions as fsListSubmissions,
  updateSubmission as fsUpdateSubmission,

  createPayment as fsCreatePayment,
  listPayments as fsListPayments,
  listPaymentsByUser as fsListPaymentsByUser,

  deleteTask as fsDeleteTask,
  updatePayment as fsUpdatePayment,

  getSkills as fsGetSkills,
  addSkill as fsAddSkill,
  createNotification as fsCreateNotification,
  listNotifications as fsListNotifications,
  markNotificationRead as fsMarkNotificationRead,
  markAllNotificationsRead as fsMarkAllNotificationsRead,
  listDomains as fsListDomains,
  createDomain as fsCreateDomain,
  updateDomain as fsUpdateDomain,
  deleteDomain as fsDeleteDomain,
  saveChatMessage as fsSaveChatMessage,
  getChatMessages as fsGetChatMessages,
  subscribeChatMessages as fsSubscribeChatMessages
} from "./firestore";

import { storage as firebaseStorage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import type { User, Task, DailySubmission, Payment, Notification, Domain, ChatMessage } from "./types";

/**
 * Firestore-backed storage module
 * Replaces previous localStorage wrapper. Most calls are async.
 */
export const storage = {
  /* -------------------------
   * PAYMENTS
   * ------------------------- */
  async createPayment(payment: Omit<Payment, "id">): Promise<Payment> {
    return await fsCreatePayment(payment);
  },

  async getPayments(): Promise<Payment[]> {
    return await fsListPayments();
  },

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    return await fsListPaymentsByUser(userId);
  },
  async updatePayment(id: string, payload: Partial<Payment>) {
    return await fsUpdatePayment(id, payload);
  },


  /* -------------------------
   * USERS
   * ------------------------- */
  async getUsers(): Promise<User[]> {
    return await fsListUsers();
  },

  async getUserByEmail(email: string): Promise<User | null> {
    return await fsGetUserByEmail(email);
  },

  async getUserById(id: string): Promise<User | null> {
    return await fsGetUserById(id);
  },

  async createUser(user: Omit<User, "id">): Promise<User> {
    return await fsCreateUser(user);
  },

  async updateUser(id: string, payload: Partial<User>): Promise<User | null> {
    return await fsSetUser(id, payload);
  },


  /* -------------------------
   * CURRENT USER (local session)
   * ------------------------- */
  setCurrentUser(user: User | null) {
    if (typeof window === "undefined") return;
    if (user) {
      localStorage.setItem("ceh_current_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("ceh_current_user");
    }
  },

  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("ceh_current_user");
      if (!raw) return null;
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  removeCurrentUser() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("ceh_current_user");
  },

  /* -------------------------
   * TASKS
   * ------------------------- */
  async getTasks(updatedTasks?: Task[]): Promise<Task[]> {
    return await fsListTasks();
  },

  async createTask(task: Omit<Task, "id">): Promise<Task> {
    return await fsCreateTask(task);
  },

  async getTaskById(id: string): Promise<Task | null> {
    return await fsGetTaskById(id);
  },

  async updateTask(id: string, payload: Partial<Task>): Promise<Task | null> {
    return await fsUpdateTask(id, payload);
  },

  async deleteTask(taskId: string): Promise<void> {
    return await fsDeleteTask(taskId);
  },

  /* -------------------------
   * DAILY SUBMISSIONS
   * ------------------------- */
  async createSubmission(sub: Omit<DailySubmission, "id">): Promise<DailySubmission> {
    return await fsCreateSubmission(sub);
  },

  async getSubmissionsByUser(userId: string): Promise<DailySubmission[]> {
    return await fsListSubmissionsByUser(userId);
  },

  async getAllSubmissions(): Promise<DailySubmission[]> {
    return await fsListSubmissions();
  },

  async updateSubmission(id: string, payload: Partial<DailySubmission>): Promise<void> {
    return await fsUpdateSubmission(id, payload);
  },

  /* -------------------------
   * SKILLS
   * ------------------------- */
  async getSkills(): Promise<string[]> {
    return await fsGetSkills();
  },

  async addSkill(skill: string): Promise<void> {
    return await fsAddSkill(skill);
  },

  /* -------------------------
   * NOTIFICATIONS
   * ------------------------- */
  async createNotification(notif: Omit<Notification, "id">): Promise<Notification> {
    return await fsCreateNotification(notif);
  },

  async getNotifications(userId: string): Promise<Notification[]> {
    return await fsListNotifications(userId);
  },

  async markNotificationRead(id: string): Promise<void> {
    return await fsMarkNotificationRead(id);
  },
  async markAllNotificationsRead(userId: string): Promise<void> {
    return await fsMarkAllNotificationsRead(userId);
  },

  /* -------------------------
   * STORAGE / FILES
   * ------------------------- */
  async uploadSubmissionFile(file: File, path: string): Promise<string> {
    console.log(`[Storage] Starting upload for ${file.name} to ${path}`);

    if (!firebaseStorage) {
      console.error("[Storage] Firebase Storage instance is missing. Check firebase.ts init.");
      throw new Error("Firebase Storage not initialized");
    }

    try {
      const storageRef = ref(firebaseStorage, path);
      console.log("[Storage] Reference created, starting uploadBytes...");

      const snapshot = await uploadBytes(storageRef, file);
      console.log("[Storage] Upload successful, fetching download URL...");

      const url = await getDownloadURL(snapshot.ref);
      console.log("[Storage] Download URL retrieved:", url);
      return url;
    } catch (error) {
      console.error("[Storage] Error uploading file:", error);
      throw error;
    }
  },

  /* -------------------------
   * DOMAINS
   * ------------------------- */
  async getDomains(): Promise<Domain[]> {
    return await fsListDomains();
  },

  async createDomain(domain: Omit<Domain, "id">): Promise<Domain> {
    return await fsCreateDomain(domain);
  },

  async updateDomain(id: string, payload: Partial<Domain>): Promise<void> {
    return await fsUpdateDomain(id, payload);
  },

  async deleteDomain(id: string): Promise<void> {
    return await fsDeleteDomain(id);
  },

  /* -------------------------
   * CHAT
   * ------------------------- */
  async saveChatMessage(msg: Omit<ChatMessage, "id">): Promise<ChatMessage> {
    return await fsSaveChatMessage(msg);
  },

  async getChatMessages(taskId: string): Promise<ChatMessage[]> {
    return await fsGetChatMessages(taskId);
  },

  subscribeChat(taskId: string, callback: (messages: ChatMessage[]) => void) {
    return fsSubscribeChatMessages(taskId, callback);
  },
};

export default storage;
