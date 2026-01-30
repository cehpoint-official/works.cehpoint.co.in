// utils/firestore.ts
import { db } from "./firebase";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import type { User, Task, DailySubmission, Domain } from "./types";

// Helper to remove any 'undefined' values (Firestore rejects them)
function cleanObject(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanObject);
  const cleaned: any = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      cleaned[key] = cleanObject(obj[key]);
    }
  });
  return cleaned;
}


const usersCol = collection(db, "users");
const tasksCol = collection(db, "tasks");
const submissionsCol = collection(db, "submissions");

// ----------------- USERS -----------------
export async function createUser(user: Omit<User, "id">) {
  // add doc with auto-id
  const cleaned = cleanObject(user);
  const ref = await addDoc(usersCol, cleaned);
  return { id: ref.id, ...user } as User;
}

export async function setUser(userId: string, user: Partial<User>) {
  const ref = doc(db, "users", userId);
  const cleaned = cleanObject(user);
  await setDoc(ref, cleaned, { merge: true });
  const snap = await getDoc(ref);
  return { id: snap.id, ...(snap.data() as User) } as User;
}

export async function getUserById(userId: string) {
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as User) } as User;
}

export async function getUserByEmail(email: string) {
  const q = query(usersCol, where("email", "==", email));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const doc0 = snap.docs[0];
  return { id: doc0.id, ...(doc0.data() as User) } as User;
}

export async function listUsers() {
  try {
    const snap = await getDocs(usersCol);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as User) })) as User[];
  } catch (err) {
    console.warn("[Firestore] listUsers permission denied or error:", err);
    return [];
  }
}

export async function updateUser(userId: string, payload: Partial<User>) {
  const ref = doc(db, "users", userId);
  const cleaned = cleanObject(payload);
  await updateDoc(ref, cleaned);
  return getUserById(userId);
}

export async function deleteUser(userId: string) {
  await deleteDoc(doc(db, "users", userId));
}

// ----------------- TASKS -----------------
export async function createTask(task: Omit<Task, "id">) {
  const cleaned = cleanObject(task);
  const ref = await addDoc(tasksCol, cleaned);
  return { id: ref.id, ...task } as Task;
}

export async function listTasks() {
  const snap = await getDocs(tasksCol);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Task) })) as Task[];
}

export async function getTaskById(taskId: string) {
  const snap = await getDoc(doc(db, "tasks", taskId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Task) } as Task;
}

export async function updateTask(taskId: string, payload: Partial<Task>) {
  const ref = doc(db, "tasks", taskId);
  const cleaned = cleanObject(payload);
  await updateDoc(ref, cleaned);
  return getTaskById(taskId);
}

export async function deleteTask(taskId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "tasks", taskId));
    console.log("🔥 Task deleted from Firestore:", taskId);
  } catch (err) {
    console.error("deleteTask error:", err);
    throw err;
  }
}


// ----------------- SUBMISSIONS -----------------
export async function createSubmission(data: Omit<DailySubmission, "id">) {
  const cleaned = cleanObject(data);
  const ref = await addDoc(collection(db, "submissions"), cleaned);
  return { id: ref.id, ...data };
}

// ----------------- PAYMENTS -----------------
import type { Payment } from "./types";

const paymentsCol = collection(db, "payments");

export async function createPayment(data: Omit<Payment, "id">) {
  const cleaned = cleanObject(data);
  const ref = await addDoc(paymentsCol, cleaned);
  return { id: ref.id, ...data } as Payment;
}

export async function listPaymentsByUser(userId: string) {
  const q = query(paymentsCol, where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Payment) })) as Payment[];
}

export async function listPayments() {
  const snap = await getDocs(paymentsCol);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Payment) })) as Payment[];
}

export async function updatePayment(id: string, payload: Partial<Payment>) {
  const ref = doc(db, "payments", id);
  const cleaned = cleanObject(payload);
  await updateDoc(ref, cleaned);
  return id;
}


// UPDATE a submission
export async function updateSubmission(
  id: string,
  payload: Partial<DailySubmission>
): Promise<void> {
  if (!id) {
    console.error("updateSubmission: Missing ID");
    throw new Error("Document ID is required for update");
  }

  try {
    const cleaned = cleanObject(payload);
    const subRef = doc(db, "submissions", id);
    console.log("📡 Attempting setDoc for submission:", id);
    // Use setDoc with merge: true as a more robust alternative to updateDoc
    await setDoc(subRef, cleaned, { merge: true });
    console.log("✅ Submission updated successfully:", id);
  } catch (err) {
    console.error("❌ updateSubmission error for ID:", id, err);
    throw err;
  }
}


export async function listSubmissions() {
  try {
    const snap = await getDocs(submissionsCol);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as DailySubmission) })) as DailySubmission[];
  } catch (err) {
    console.warn("[Firestore] listSubmissions permission denied or error:", err);
    return [];
  }
}

export async function listSubmissionsByUser(userId: string) {
  const q = query(submissionsCol, where("userId", "==", userId), orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as DailySubmission) })) as DailySubmission[];
}

// ----------------- SKILLS -----------------
const skillsCol = collection(db, "skills");

export async function getSkills(): Promise<string[]> {
  try {
    const snap = await getDocs(skillsCol);
    return snap.docs.map((d) => d.data().name as string);
  } catch (err) {
    console.warn("Failed to fetch skills", err);
    return [];
  }
}

export async function addSkill(skill: string) {
  try {
    // Use normalized lowercase ID to prevent duplicates
    const id = skill.toLowerCase().trim();
    if (!id) return;
    const ref = doc(db, "skills", id);
    // Store original casing in 'name'
    await setDoc(ref, { name: skill.trim() }, { merge: true });
  } catch (err) {
    console.error("Failed to add skill", err);
  }
}

// ----------------- DOMAINS -----------------
const domainsCol = collection(db, "domains");

export async function listDomains(): Promise<Domain[]> {
  try {
    const snap = await getDocs(query(domainsCol, orderBy("createdAt", "asc")));
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Domain) })) as Domain[];
  } catch (err) {
    console.warn("Failed to fetch domains", err);
    return [];
  }
}

export async function createDomain(data: Omit<Domain, "id">): Promise<Domain> {
  try {
    console.log("📡 Firestore: Creating domain:", data.name);
    const cleaned = cleanObject(data);
    const ref = await addDoc(domainsCol, cleaned);
    console.log("✅ Firestore: Domain created with ID:", ref.id);
    return { id: ref.id, ...data } as Domain;
  } catch (err) {
    console.error("❌ Firestore: createDomain error:", err);
    throw err;
  }
}

export async function updateDomain(id: string, payload: Partial<Domain>): Promise<void> {
  const ref = doc(db, "domains", id);
  const cleaned = cleanObject(payload);
  await updateDoc(ref, cleaned);
}

export async function deleteDomain(id: string): Promise<void> {
  await deleteDoc(doc(db, "domains", id));
}

// ----------------- NOTIFICATIONS -----------------
import type { Notification } from "./types";
const notificationsCol = collection(db, "notifications");

export async function createNotification(data: Omit<Notification, "id">) {
  try {
    const cleaned = cleanObject(data);
    const ref = await addDoc(notificationsCol, cleaned);
    console.log("✅ Notification created:", ref.id);
    return { id: ref.id, ...data } as Notification;
  } catch (err) {
    console.error("❌ createNotification error:", err);
    // Don't throw here to allow the main process to continue
    return null;
  }
}

export async function listNotifications(userId: string) {
  try {
    const q = query(notificationsCol, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Notification) })) as Notification[];
  } catch (err) {
    console.warn("[Firestore] listNotifications permission denied or index missing:", err);
    return [];
  }
}

export async function markNotificationRead(id: string) {
  try {
    const ref = doc(db, "notifications", id);
    await updateDoc(ref, { read: true });
  } catch (err) {
    console.error("[Firestore] markNotificationRead error:", err);
  }
}

// ----------------- CHAT -----------------
import type { ChatMessage } from "./types";
const chatCol = collection(db, "chatMessages");

export async function saveChatMessage(data: Omit<ChatMessage, "id">) {
  const cleaned = cleanObject(data);
  const ref = await addDoc(chatCol, cleaned);
  return { id: ref.id, ...data } as ChatMessage;
}

export async function getChatMessages(taskId: string) {
  try {
    const q = query(chatCol, where("taskId", "==", taskId), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as ChatMessage) })) as ChatMessage[];
  } catch (err) {
    console.warn("[Firestore] getChatMessages index missing or error:", err);
    // Fallback if sorting fails due to missing index
    const q = query(chatCol, where("taskId", "==", taskId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as ChatMessage) }))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) as ChatMessage[];
  }
}

