// // pages/admin/tasks.tsx
// import { useEffect, useState } from "react";
// import { useRouter } from "next/router";
// import Head from "next/head";

// import Layout from "../../components/Layout";
// import Card from "../../components/Card";
// import Button from "../../components/Button";

// import { storage } from "../../utils/storage";
// import type { User, Task, Payment } from "../../utils/types";

// import { Plus } from "lucide-react";

// export default function AdminTasks() {
//   const router = useRouter();

//   const [user, setUser] = useState<User | null>(null);
//   const [tasks, setTasks] = useState<Task[]>([]);
//   const [workers, setWorkers] = useState<User[]>([]);
//   const [showCreate, setShowCreate] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const [newTask, setNewTask] = useState({
//     title: "",
//     description: "",
//     category: "",
//     skills: [] as string[],
//     weeklyPayout: 500,
//     deadline: "",
//   });

//   const skillOptions = [
//     "React",
//     "Node.js",
//     "Python",
//     "Java",
//     "PHP",
//     "Angular",
//     "Vue.js",
//     "Video Editing",
//     "Adobe Premiere",
//     "After Effects",
//     "UI/UX Design",
//     "Graphic Design",
//     "Content Writing",
//     "Digital Marketing",
//     "SEO",
//   ];

//   /* -------------------------------------------------------
//    * AUTH + INITIAL LOAD
//    * ----------------------------------------------------- */
//   useEffect(() => {
//     const init = async () => {
//       const currentUser = storage.getCurrentUser();
//       if (!currentUser || currentUser.role !== "admin") {
//         router.push("/login");
//         return;
//       }
//       setUser(currentUser);

//       await loadWorkers();
//       await loadTasks();
//     };

//     init();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   /* -------------------------------------------------------
//    * LOADS
//    * ----------------------------------------------------- */
//   const loadTasks = async () => {
//     setLoading(true);
//     try {
//       const list = await storage.getTasks();
//       // ensure deterministic ordering (newest first)
//       setTasks(list.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1)));
//     } catch (err) {
//       console.error("loadTasks:", err);
//       alert("Failed to load tasks.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadWorkers = async () => {
//     try {
//       const users = await storage.getUsers();
//       setWorkers(users.filter((u) => u.role === "worker"));
//     } catch (err) {
//       console.error("loadWorkers:", err);
//       setWorkers([]);
//     }
//   };

//   /* -------------------------------------------------------
//    * CREATE TASK (Firestore)
//    * ----------------------------------------------------- */
//   const handleCreateTask = async () => {
//     if (
//       !newTask.title ||
//       !newTask.description ||
//       !newTask.category ||
//       newTask.skills.length === 0 ||
//       !newTask.deadline
//     ) {
//       alert("Please fill all fields");
//       return;
//     }

//     if (!user) {
//       alert("Not authenticated");
//       return;
//     }

//     const taskPayload: Omit<Task, "id"> = {
//       title: newTask.title,
//       description: newTask.description,
//       category: newTask.category,
//       skills: newTask.skills,
//       weeklyPayout: newTask.weeklyPayout,
//       deadline: newTask.deadline,
//       status: "available",
//       assignedTo: null,
//       submissionUrl: "",
//       createdAt: new Date().toISOString(),
//       createdBy: user.id,
//     };

//     try {
//       setLoading(true);
//       await storage.createTask(taskPayload);
//       setShowCreate(false);
//       setNewTask({
//         title: "",
//         description: "",
//         category: "",
//         skills: [],
//         weeklyPayout: 500,
//         deadline: "",
//       });

//       await loadTasks();
//       alert("Task created successfully!");
//     } catch (err) {
//       console.error("createTask:", err);
//       alert("Failed to create task.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* -------------------------------------------------------
//    * ASSIGN TASK to a worker
//    * ----------------------------------------------------- */
//   const handleAssignTask = async (taskId: string, workerId: string) => {
//     if (!workerId) {
//       alert("Choose a worker to assign");
//       return;
//     }

//     try {
//       setLoading(true);
//       await storage.updateTask(taskId, {
//         assignedTo: workerId,
//         status: "in-progress",
//         assignedAt: new Date().toISOString(),
//       });
//       await loadTasks();
//       alert("Task assigned.");
//     } catch (err) {
//       console.error("assignTask:", err);
//       alert("Failed to assign task.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* -------------------------------------------------------
//    * APPROVE TASK (mark complete + create payment)
//    * ----------------------------------------------------- */
//   const handleApproveTask = async (taskId: string) => {
//     const job = tasks.find((t) => t.id === taskId);
//     if (!job) {
//       alert("Task not found");
//       return;
//     }
//     if (!job.assignedTo) {
//       alert("Task has no assigned worker.");
//       return;
//     }

//     if (!confirm("Approve this task and release payment?")) return;

//     try {
//       setLoading(true);

//       // 1) mark task completed
//       await storage.updateTask(taskId, {
//         status: "completed",
//         completedAt: new Date().toISOString(),
//       });

//       // 2) create payment record
//       const payment: Omit<Payment, "id"> = {
//         userId: job.assignedTo,
//         amount: job.weeklyPayout,
//         type: "task-payment",
//         status: "completed",
//         taskId: job.id,
//         createdAt: new Date().toISOString(),
//         completedAt: new Date().toISOString(),
//       };

//       if (typeof (storage as any).createPayment === "function") {
//         await (storage as any).createPayment(payment);
//       } else {
//         console.warn("storage.createPayment not implemented");
//       }

//       // optionally update worker balance if you maintain it in user doc
//       if (
//         typeof (storage as any).getUserById === "function" &&
//         typeof (storage as any).updateUser === "function"
//       ) {
//         try {
//           const worker = await (storage as any).getUserById(job.assignedTo);
//           if (worker) {
//             const newBal = (worker.balance || 0) + job.weeklyPayout;
//             await (storage as any).updateUser(worker.id, { balance: newBal });
//           }
//         } catch (err) {
//           console.warn("failed to update worker balance:", err);
//         }
//       }

//       await loadTasks();
//       alert("Task approved and payment processed!");
//     } catch (err) {
//       console.error("approveTask:", err);
//       alert("Failed to approve task.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* -------------------------------------------------------
//    * REJECT TASK
//    * ----------------------------------------------------- */
//   const handleRejectTask = async (taskId: string) => {
//     const feedback = prompt("Enter rejection reason:");
//     if (!feedback) return;

//     try {
//       setLoading(true);
//       await storage.updateTask(taskId, {
//         status: "rejected",
//         feedback,
//       });
//       await loadTasks();
//       alert("Task rejected.");
//     } catch (err) {
//       console.error("rejectTask:", err);
//       alert("Failed to reject task.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* -------------------------------------------------------
//    * DELETE TASK
//    * ----------------------------------------------------- */
//   const handleDeleteTask = async (taskId: string) => {
//     if (!confirm("Are you sure you want to delete this task? This cannot be undone.")) {
//       return;
//     }

//     try {
//       setLoading(true);

//       if (typeof (storage as any).deleteTask === "function") {
//         // Proper DB delete if implemented
//         await (storage as any).deleteTask(taskId);
//       } else {
//         // Fallback: remove from task list if using local storage-based implementation
//         console.warn("storage.deleteTask not implemented, using fallback delete.");
//         const list: Task[] = await storage.getTasks();
//         const remaining = list.filter((t) => t.id !== taskId);

//         if (typeof (storage as any).setTasks === "function") {
//           await (storage as any).setTasks(remaining);
//         } else {
//           console.warn("storage.setTasks not implemented; cannot persist deletion.");
//         }
//       }

//       await loadTasks();
//       alert("Task deleted.");
//     } catch (err) {
//       console.error("deleteTask:", err);
//       alert("Failed to delete task.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* -------------------------------------------------------
//    * SKILL TOGGLE (create form)
//    * ----------------------------------------------------- */
//   const handleSkillToggle = (skill: string) => {
//     setNewTask((prev) => {
//       if (prev.skills.includes(skill)) {
//         return { ...prev, skills: prev.skills.filter((s) => s !== skill) };
//       }
//       return { ...prev, skills: [...prev.skills, skill] };
//     });
//   };

//   if (!user) return null;

//   return (
//     <Layout>
//       <Head>
//         <title>Manage Tasks - Cehpoint</title>
//       </Head>

//       <div className="space-y-6">
//         {/* Header */}
//         <div className="flex justify-between items-center">
//           <h1 className="text-3xl font-bold text-gray-900">Manage Tasks</h1>
//           <Button onClick={() => setShowCreate((s) => !s)}>
//             <Plus size={18} />
//             <span>Create Task</span>
//           </Button>
//         </div>

//         {/* CREATE TASK FORM */}
//         {showCreate && (
//           <Card>
//             <h3 className="text-xl font-semibold mb-4">Create New Task</h3>
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium mb-2">Title</label>
//                 <input
//                   type="text"
//                   value={newTask.title}
//                   onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
//                   className="w-full px-4 py-2 border rounded-lg"
//                   placeholder="Task title"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-2">Description</label>
//                 <textarea
//                   value={newTask.description}
//                   onChange={(e) =>
//                     setNewTask({ ...newTask, description: e.target.value })
//                   }
//                   className="w-full px-4 py-2 border rounded-lg"
//                   rows={3}
//                   placeholder="Task description"
//                 />
//               </div>

//               <div className="grid md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-2">Category</label>
//                   <select
//                     value={newTask.category}
//                     onChange={(e) =>
//                       setNewTask({ ...newTask, category: e.target.value })
//                     }
//                     className="w-full px-4 py-2 border rounded-lg"
//                   >
//                     <option value="">Select category</option>
//                     <option value="Development">Development</option>
//                     <option value="Design">Design</option>
//                     <option value="Video Editing">Video Editing</option>
//                     <option value="Marketing">Marketing</option>
//                     <option value="Writing">Writing</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-2">
//                     Weekly Payout ($)
//                   </label>
//                   <input
//                     type="number"
//                     value={newTask.weeklyPayout}
//                     onChange={(e) =>
//                       setNewTask({
//                         ...newTask,
//                         weeklyPayout: Number(e.target.value),
//                       })
//                     }
//                     className="w-full px-4 py-2 border rounded-lg"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-2">Deadline</label>
//                 <input
//                   type="date"
//                   value={newTask.deadline}
//                   onChange={(e) =>
//                     setNewTask({ ...newTask, deadline: e.target.value })
//                   }
//                   className="w-full px-4 py-2 border rounded-lg"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-2">
//                   Required Skills
//                 </label>
//                 <div className="grid grid-cols-3 gap-2">
//                   {skillOptions.map((skill) => (
//                     <button
//                       key={skill}
//                       type="button"
//                       onClick={() => handleSkillToggle(skill)}
//                       className={`px-3 py-2 rounded-lg border text-sm transition ${
//                         newTask.skills.includes(skill)
//                           ? "border-indigo-600 bg-indigo-100 text-indigo-700"
//                           : "border-gray-300 hover:border-gray-400"
//                       }`}
//                     >
//                       {skill}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               <div className="flex space-x-3">
//                 <Button onClick={handleCreateTask} disabled={loading}>
//                   Create Task
//                 </Button>
//                 <Button variant="outline" onClick={() => setShowCreate(false)}>
//                   Cancel
//                 </Button>
//               </div>
//             </div>
//           </Card>
//         )}

//         {/* TASK LIST */}
//         <div className="grid gap-4">
//           {tasks.length === 0 && (
//             <Card>
//               <p className="text-center text-gray-500 py-8">No tasks yet</p>
//             </Card>
//           )}

//           {tasks.map((task) => {
//             const assignedWorker =
//               workers.find((w) => w.id === task.assignedTo) || null;

//             return (
//               <Card key={task.id}>
//                 <div className="flex justify-between items-start">
//                   <div className="flex-1">
//                     <div className="flex items-center gap-3">
//                       <h3 className="text-xl font-semibold">{task.title}</h3>
//                       <span
//                         className={`px-3 py-1 rounded-full text-xs font-medium ${
//                           task.status === "completed"
//                             ? "bg-green-100 text-green-700"
//                             : task.status === "in-progress"
//                             ? "bg-orange-100 text-orange-700"
//                             : task.status === "submitted"
//                             ? "bg-blue-100 text-blue-700"
//                             : task.status === "rejected"
//                             ? "bg-red-100 text-red-700"
//                             : "bg-gray-100 text-gray-700"
//                         }`}
//                       >
//                         {task.status}
//                       </span>
//                     </div>

//                     <p className="text-gray-600 mt-2">{task.description}</p>

//                     <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
//                       <div>
//                         <span className="text-gray-500">Category:</span>{" "}
//                         {task.category}
//                       </div>
//                       <div>
//                         <span className="text-gray-500">Payout:</span> $
//                         {task.weeklyPayout}
//                       </div>
//                       <div>
//                         <span className="text-gray-500">Deadline:</span>{" "}
//                         {task.deadline
//                           ? new Date(task.deadline).toLocaleDateString()
//                           : "-"}
//                       </div>
//                     </div>

//                     <div className="mt-3 text-sm">
//                       <span className="text-gray-500">Required skills: </span>
//                       <div className="inline-flex gap-2 flex-wrap ml-1">
//                         {task.skills?.map((s) => (
//                           <span
//                             key={s}
//                             className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded"
//                           >
//                             {s}
//                           </span>
//                         ))}
//                       </div>
//                     </div>

//                     <div className="mt-3 text-sm">
//                       <span className="text-gray-500">Assigned to: </span>
//                       {assignedWorker ? (
//                         <span className="font-medium ml-2">
//                           {assignedWorker.fullName} ({assignedWorker.email})
//                         </span>
//                       ) : (
//                         <span className="italic ml-2 text-gray-500">
//                           Not assigned
//                         </span>
//                       )}
//                     </div>

//                     {/* SUBMISSION DETAILS FOR ADMIN REVIEW */}
//                     {task.submissionUrl && (
//                       <div className="mt-4 p-3 bg-blue-50 rounded-lg">
//                         <p className="text-sm font-medium text-gray-800">
//                           Submission
//                         </p>
//                         <a
//                           href={task.submissionUrl}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="text-sm text-indigo-700 break-all underline mt-1 inline-block"
//                         >
//                           {task.submissionUrl}
//                         </a>
//                         {task.submittedAt && (
//                           <p className="text-xs text-gray-500 mt-1">
//                             Submitted on{" "}
//                             {new Date(task.submittedAt).toLocaleString()}
//                           </p>
//                         )}
//                         {task.feedback && (
//                           <p className="text-xs text-gray-600 mt-2">
//                             Feedback: {task.feedback}
//                           </p>
//                         )}
//                       </div>
//                     )}
//                   </div>

//                   {/* ACTIONS */}
//                   <div className="flex flex-col space-y-2 min-w-[190px]">
//                     {/* ASSIGN UI (available tasks) */}
//                     {task.status === "available" && (
//                       <select
//                         value={task.assignedTo || ""}
//                         onChange={(e) => {
//                           const workerId = e.target.value;
//                           if (!workerId) return;
//                           if (
//                             !confirm(
//                               "Assign selected worker to this task?"
//                             )
//                           )
//                             return;
//                           handleAssignTask(task.id, workerId);
//                         }}
//                         className="px-3 py-2 border rounded-lg"
//                       >
//                         <option value="">Select worker to assign</option>
//                         {workers.map((w) => (
//                           <option key={w.id} value={w.id}>
//                             {w.fullName} — {w.email}
//                           </option>
//                         ))}
//                       </select>
//                     )}

//                     {/* If submitted → approve / reject */}
//                     {task.status === "submitted" && (
//                       <>
//                         <Button
//                           onClick={() => handleApproveTask(task.id)}
//                           disabled={loading}
//                         >
//                           Approve
//                         </Button>
//                           <Button
//                           variant="danger"
//                           onClick={() => handleRejectTask(task.id)}
//                           disabled={loading}
//                         >
//                           Reject
//                         </Button>
//                       </>
//                     )}

//                     {/* For in-progress tasks allow manual complete/approve */}
//                     {task.status === "in-progress" && (
//                       <>
//                         <Button
//                           onClick={() => handleApproveTask(task.id)}
//                           disabled={loading}
//                         >
//                           Mark Complete & Pay
//                         </Button>
//                         <Button
//                           variant="danger"
//                           onClick={() => handleRejectTask(task.id)}
//                           disabled={loading}
//                         >
//                           Reject
//                         </Button>
//                       </>
//                     )}

//                     {/* DELETE BUTTON (always available) */}
//                     <Button
//                       variant="outline"
//                       onClick={() => handleDeleteTask(task.id)}
//                       disabled={loading}
//                     >
//                       Delete Task
//                     </Button>
//                   </div>
//                 </div>
//               </Card>
//             );
//           })}
//         </div>
//       </div>
//     </Layout>
//   );
// }



















// pages/admin/tasks.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

import Layout from "../../components/Layout";
import Card from "../../components/Card";
import Button from "../../components/Button";

import { storage } from "../../utils/storage";
import type { User, Task, Payment } from "../../utils/types";

import { Plus } from "lucide-react";

type NewTaskForm = {
  title: string;
  description: string;
  category: string;
  skills: string[];
  weeklyPayout: number;
  deadline: string;
};

export default function AdminTasks() {
  const router = useRouter();

  const [currentAdmin, setCurrentAdmin] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [busy, setBusy] = useState(false); // for actions (assign/approve/reject/delete)

  const [newTask, setNewTask] = useState<NewTaskForm>({
    title: "",
    description: "",
    category: "",
    skills: [],
    weeklyPayout: 500,
    deadline: "",
  });

  const skillOptions = [
    "React",
    "Node.js",
    "Python",
    "Java",
    "PHP",
    "Angular",
    "Vue.js",
    "Video Editing",
    "Adobe Premiere",
    "After Effects",
    "UI/UX Design",
    "Graphic Design",
    "Content Writing",
    "Digital Marketing",
    "SEO",
  ];

  /* -------------------------------------------------------
   * AUTH + INITIAL LOAD
   * ----------------------------------------------------- */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const currentUser = storage.getCurrentUser();
      if (!currentUser || currentUser.role !== "admin") {
        router.replace("/login");
        return;
      }

      if (!mounted) return;
      setCurrentAdmin(currentUser);

      try {
        setPageLoading(true);
        const [users, list] = await Promise.all([
          storage.getUsers(),
          storage.getTasks(),
        ]);

        if (!mounted) return;

        setWorkers(users.filter((u) => u.role === "worker"));
        // newest first
        setTasks(
          list.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          )
        );
      } catch (err) {
        console.error("Failed to load admin data:", err);
        alert("Failed to load admin data. Please check console.");
      } finally {
        if (mounted) setPageLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [router]);

  const reloadTasks = async () => {
    const list = await storage.getTasks();
    setTasks(
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );
  };

  /* -------------------------------------------------------
   * CREATE TASK
   * ----------------------------------------------------- */
  const handleCreateTask = async () => {
    if (
      !newTask.title.trim() ||
      !newTask.description.trim() ||
      !newTask.category.trim() ||
      newTask.skills.length === 0 ||
      !newTask.deadline
    ) {
      alert("Please fill all fields.");
      return;
    }

    if (!currentAdmin) {
      alert("Admin session missing.");
      return;
    }

    const payload: Omit<Task, "id"> = {
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      category: newTask.category.trim(),
      skills: newTask.skills,
      weeklyPayout: Number(newTask.weeklyPayout) || 0,
      deadline: newTask.deadline,
      status: "available",
      assignedTo: null,
      submissionUrl: "",
      createdAt: new Date().toISOString(),
      createdBy: currentAdmin.id,
    };

    try {
      setBusy(true);
      await storage.createTask(payload);

      setNewTask({
        title: "",
        description: "",
        category: "",
        skills: [],
        weeklyPayout: 500,
        deadline: "",
      });
      setShowCreate(false);

      await reloadTasks();
      alert("Task created successfully.");
    } catch (err) {
      console.error("createTask error:", err);
      alert("Failed to create task.");
    } finally {
      setBusy(false);
    }
  };

  /* -------------------------------------------------------
   * ASSIGN TASK
   * ----------------------------------------------------- */
  const handleAssignTask = async (taskId: string, workerId: string) => {
    if (!workerId) {
      alert("Select a worker to assign.");
      return;
    }

    if (!confirm("Assign this task to the selected worker?")) return;

    try {
      setBusy(true);
      await storage.updateTask(taskId, {
        assignedTo: workerId,
        status: "in-progress",
        assignedAt: new Date().toISOString(),
      });
      await reloadTasks();
      alert("Task assigned.");
    } catch (err) {
      console.error("assignTask error:", err);
      alert("Failed to assign task.");
    } finally {
      setBusy(false);
    }
  };

  /* -------------------------------------------------------
   * APPROVE TASK (mark completed + payment)
   * ----------------------------------------------------- */
  const handleApproveTask = async (taskId: string) => {
    const job = tasks.find((t) => t.id === taskId);
    if (!job) {
      alert("Task not found.");
      return;
    }
    if (!job.assignedTo) {
      alert("Task is not assigned to any worker.");
      return;
    }

    if (!confirm("Approve this task and release payment?")) return;

    try {
      setBusy(true);

      // 1) update task
      await storage.updateTask(taskId, {
        status: "completed",
        completedAt: new Date().toISOString(),
      });

      // 2) create payment record
      const payment: Omit<Payment, "id"> = {
        userId: job.assignedTo,
        amount: job.weeklyPayout,
        type: "task-payment",
        status: "completed",
        taskId: job.id,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      await storage.createPayment(payment);

      // 3) optionally update worker balance if your system uses it
      try {
        const worker = await storage.getUserById(job.assignedTo);
        if (worker) {
          const newBalance = (worker.balance || 0) + job.weeklyPayout;
          await storage.updateUser(worker.id, { balance: newBalance });
        }
      } catch (err) {
        console.warn("Failed to update worker balance:", err);
      }

      await reloadTasks();
      alert("Task approved and payment processed.");
    } catch (err) {
      console.error("approveTask error:", err);
      alert("Failed to approve task.");
    } finally {
      setBusy(false);
    }
  };

  /* -------------------------------------------------------
   * REJECT TASK
   * ----------------------------------------------------- */
  const handleRejectTask = async (taskId: string) => {
    const feedback = prompt("Enter rejection reason (optional):") || "";
    if (!feedback && !confirm("No feedback entered. Reject anyway?")) return;

    try {
      setBusy(true);
      await storage.updateTask(taskId, {
        status: "rejected",
        feedback: feedback || undefined,
      });
      await reloadTasks();
      alert("Task rejected.");
    } catch (err) {
      console.error("rejectTask error:", err);
      alert("Failed to reject task.");
    } finally {
      setBusy(false);
    }
  };

  /* -------------------------------------------------------
   * DELETE TASK
   * ----------------------------------------------------- */
  const handleDeleteTask = async (taskId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this task? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setBusy(true);
      // assumes storage.deleteTask is implemented (Firestore)
      // and already wired to fsDeleteTask
      // which calls deleteDoc on "tasks" collection.
      // @ts-ignore: dynamic method allowed
      if (typeof (storage as any).deleteTask === "function") {
        await (storage as any).deleteTask(taskId);
      } else {
        console.warn("storage.deleteTask is not implemented.");
        alert("Delete is not supported by storage.");
      }

      await reloadTasks();
      alert("Task deleted.");
    } catch (err) {
      console.error("deleteTask error:", err);
      alert("Failed to delete task.");
    } finally {
      setBusy(false);
    }
  };

  /* -------------------------------------------------------
   * SKILL TOGGLE (CREATE FORM)
   * ----------------------------------------------------- */
  const handleSkillToggle = (skill: string) => {
    setNewTask((prev) => {
      if (prev.skills.includes(skill)) {
        return { ...prev, skills: prev.skills.filter((s) => s !== skill) };
      }
      return { ...prev, skills: [...prev.skills, skill] };
    });
  };

  if (pageLoading) return null;
  if (!currentAdmin) return null;

  return (
    <Layout>
      <Head>
        <title>Manage Tasks - Cehpoint</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Manage Tasks</h1>
          <Button onClick={() => setShowCreate((s) => !s)}>
            <Plus size={18} />
            <span>{showCreate ? "Close" : "Create Task"}</span>
          </Button>
        </div>

        {/* CREATE TASK FORM */}
        {showCreate && (
          <Card>
            <h3 className="text-xl font-semibold mb-4">Create New Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Task description"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Category
                  </label>
                  <select
                    value={newTask.category}
                    onChange={(e) =>
                      setNewTask({ ...newTask, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Select category</option>
                    <option value="Development">Development</option>
                    <option value="Design">Design</option>
                    <option value="Video Editing">Video Editing</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Writing">Writing</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Weekly Payout ($)
                  </label>
                  <input
                    type="number"
                    value={newTask.weeklyPayout}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        weeklyPayout: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Deadline
                </label>
                <input
                  type="date"
                  value={newTask.deadline}
                  onChange={(e) =>
                    setNewTask({ ...newTask, deadline: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Required Skills
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {skillOptions.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleSkillToggle(skill)}
                      className={`px-3 py-2 rounded-lg border text-sm transition ${
                        newTask.skills.includes(skill)
                          ? "border-indigo-600 bg-indigo-100 text-indigo-700"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <Button onClick={handleCreateTask} disabled={busy}>
                  Create Task
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreate(false)}
                  disabled={busy}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* TASK LIST */}
        <div className="grid gap-4">
          {tasks.length === 0 && (
            <Card>
              <p className="text-center text-gray-500 py-8">No tasks yet</p>
            </Card>
          )}

          {tasks.map((task) => {
            const assignedWorker =
              workers.find((w) => w.id === task.assignedTo) || null;

            return (
              <Card key={task.id}>
                <div className="flex justify-between items-start">
                  {/* LEFT: TASK DETAILS */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold">{task.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          task.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : task.status === "in-progress"
                            ? "bg-orange-100 text-orange-700"
                            : task.status === "submitted"
                            ? "bg-blue-100 text-blue-700"
                            : task.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>

                    <p className="text-gray-600 mt-2">{task.description}</p>

                    <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-gray-500">Category:</span>{" "}
                        {task.category}
                      </div>
                      <div>
                        <span className="text-gray-500">Payout:</span> $
                        {task.weeklyPayout}
                      </div>
                      <div>
                        <span className="text-gray-500">Deadline:</span>{" "}
                        {task.deadline
                          ? new Date(task.deadline).toLocaleDateString()
                          : "-"}
                      </div>
                    </div>

                    <div className="mt-3 text-sm">
                      <span className="text-gray-500">Required skills: </span>
                      <div className="inline-flex gap-2 flex-wrap ml-1">
                        {task.skills?.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 text-sm">
                      <span className="text-gray-500">Assigned to: </span>
                      {assignedWorker ? (
                        <span className="font-medium ml-2">
                          {assignedWorker.fullName} ({assignedWorker.email})
                        </span>
                      ) : (
                        <span className="italic ml-2 text-gray-500">
                          Not assigned
                        </span>
                      )}
                    </div>

                    {/* TASK SUBMISSION (FROM WORKER) */}
                    {task.submissionUrl && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-800">
                          Task Submission
                        </p>
                        <a
                          href={task.submissionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-700 break-all underline mt-1 inline-block"
                        >
                          {task.submissionUrl}
                        </a>
                        {task.submittedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Submitted on{" "}
                            {new Date(task.submittedAt).toLocaleString()}
                          </p>
                        )}
                        {task.feedback && (
                          <p className="text-xs text-gray-600 mt-2">
                            Feedback: {task.feedback}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* RIGHT: ACTIONS */}
                  <div className="flex flex-col space-y-2 min-w-[190px] ml-4">
                    {/* ASSIGN SELECT for available tasks */}
                    {task.status === "available" && (
                      <select
                        value={task.assignedTo || ""}
                        onChange={(e) =>
                          handleAssignTask(task.id, e.target.value)
                        }
                        className="px-3 py-2 border rounded-lg"
                        disabled={busy}
                      >
                        <option value="">Select worker to assign</option>
                        {workers.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.fullName} — {w.email}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* SUBMITTED → approve / reject */}
                    {task.status === "submitted" && (
                      <>
                        <Button
                          onClick={() => handleApproveTask(task.id)}
                          disabled={busy}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleRejectTask(task.id)}
                          disabled={busy}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {/* IN-PROGRESS → allow approve / reject manually */}
                    {task.status === "in-progress" && (
                      <>
                        <Button
                          onClick={() => handleApproveTask(task.id)}
                          disabled={busy}
                        >
                          Mark Complete & Pay
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleRejectTask(task.id)}
                          disabled={busy}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {/* DELETE TASK (always available) */}
                    <Button
                      variant="outline"
                      onClick={() => handleDeleteTask(task.id)}
                      disabled={busy}
                    >
                      Delete Task
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}