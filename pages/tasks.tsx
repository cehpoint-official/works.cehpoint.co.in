// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/router';
// import Head from 'next/head';

// import Layout from '../components/Layout';
// import Card from '../components/Card';
// import Button from '../components/Button';

// import {storage} from '../utils/storage'
// import { User, Task } from '../utils/types';
// import { format } from 'date-fns';

// export default function Tasks() {
//   const router = useRouter();

//   const [user, setUser] = useState<User | null>(null);
//   const [tasks, setTasks] = useState<Task[]>([]);
//   const [filter, setFilter] = useState<'all' | 'in-progress' | 'submitted' | 'completed'>('all');
//   const [loading, setLoading] = useState(true);

//   // -----------------------------------------------
//   // AUTH CHECK (fixed)
//   // -----------------------------------------------
//   useEffect(() => {
//     const current = storage.getCurrentUser();

//     // wait for localStorage (fix for redirect to login)
//     if (!current) {
//       setTimeout(() => {
//         const retry = storage.getCurrentUser();
//         if (!retry || retry.role !== 'worker') {
//           router.replace('/login');
//         } else {
//           setUser(retry);
//           loadTasks(retry.id);
//         }
//       }, 50);

//       return;
//     }

//     if (current.role !== 'worker') {
//       router.replace('/login');
//       return;
//     }

//     setUser(current);
//     loadTasks(current.id);
//   }, []);

//   // -----------------------------------------------
//   // Load tasks
//   // -----------------------------------------------
//   const loadTasks = async (userId: string) => {
//     const all = await storage.getTasks();
//     const assigned = all.filter((t) => t.assignedTo === userId);
//     setTasks(assigned);
//     setLoading(false);
//   };

//   // -----------------------------------------------
//   // Submit task
//   // -----------------------------------------------
// const handleSubmitTask = async (taskId: string) => {
//   const submission = prompt("Enter your submission URL or description:");
//   if (!submission) return;

//   // save to Firestore
//   await storage.updateTask(taskId, {
//     status: "submitted",
//     submittedAt: new Date().toISOString(),
//     submissionUrl: submission,
//   });

//   alert("Task submitted successfully. Awaiting review.");

//   if (user) loadTasks(user.id);
// };


//   const filteredTasks =
//     filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

//   // -----------------------------------------------
//   // LOADING STATE (fix for redirect)
//   // -----------------------------------------------
//   if (loading) return null;

//   if (!user) return null;

//   return (
//     <Layout>
//       <Head>
//         <title>My Tasks - Cehpoint</title>
//       </Head>

//       <div className="space-y-6">
//         <div className="flex justify-between items-center">
//           <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>

//           <div className="flex space-x-2">
//             {['all', 'in-progress', 'submitted', 'completed'].map((status) => (
//               <button
//                 key={status}
//                 onClick={() =>
//                   setFilter(status as 'all' | 'in-progress' | 'submitted' | 'completed')
//                 }
//                 className={`px-4 py-2 rounded-lg ${
//                   filter === status
//                     ? 'bg-indigo-600 text-white'
//                     : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                 }`}
//               >
//                 {status.charAt(0).toUpperCase() + status.slice(1)}
//               </button>
//             ))}
//           </div>
//         </div>

//         {filteredTasks.length === 0 ? (
//           <Card>
//             <p className="text-center text-gray-500 py-12">No tasks found</p>
//           </Card>
//         ) : (
//           <div className="grid gap-4">
//             {filteredTasks.map((task) => (
//               <Card key={task.id} hover>
//                 <div className="flex justify-between items-start">
//                   <div className="flex-1">
//                     <div className="flex items-center space-x-3">
//                       <h3 className="text-xl font-semibold">{task.title}</h3>

//                       <span
//                         className={`px-3 py-1 rounded-full text-xs font-medium ${
//                           task.status === 'completed'
//                             ? 'bg-green-100 text-green-700'
//                             : task.status === 'submitted'
//                             ? 'bg-blue-100 text-blue-700'
//                             : 'bg-orange-100 text-orange-700'
//                         }`}
//                       >
//                         {task.status}
//                       </span>
//                     </div>

//                     <p className="text-gray-600 mt-2">{task.description}</p>

//                     <div className="flex flex-wrap gap-2 mt-3">
//                       {task.skills.map((skill) => (
//                         <span
//                           key={skill}
//                           className="px-2 py-1 bg-indigo-100 text-indigo-600 text-xs rounded"
//                         >
//                           {skill}
//                         </span>
//                       ))}
//                     </div>

//                     <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
//                       <div>
//                         <span className="text-gray-500">Category:</span>{' '}
//                         <span className="font-medium">{task.category}</span>
//                       </div>

//                       <div>
//                         <span className="text-gray-500">Payout:</span>{' '}
//                         <span className="font-medium text-green-600">
//                           ${task.weeklyPayout}
//                         </span>
//                       </div>

//                       <div>
//                         <span className="text-gray-500">Deadline:</span>{' '}
//                         <span className="font-medium">
//                           {format(new Date(task.deadline), 'MMM dd, yyyy')}
//                         </span>
//                       </div>

//                       {task.submittedAt && (
//                         <div>
//                           <span className="text-gray-500">Submitted:</span>{' '}
//                           <span className="font-medium">
//                             {format(
//                               new Date(task.submittedAt),
//                               'MMM dd, yyyy'
//                             )}
//                           </span>
//                         </div>
//                       )}
//                     </div>

//                     {task.feedback && (
//                       <div className="mt-4 p-3 bg-gray-50 rounded-lg">
//                         <p className="text-sm font-medium text-gray-700">
//                           Feedback:
//                         </p>
//                         <p className="text-sm text-gray-600 mt-1">
//                           {task.feedback}
//                         </p>
//                       </div>
//                     )}
//                   </div>

//                   <div>
//                     {task.status === 'in-progress' && (
//                       <Button onClick={() => handleSubmitTask(task.id)}>
//                         Submit Task
//                       </Button>
//                     )}
//                   </div>
//                 </div>
//               </Card>
//             ))}
//           </div>
//         )}
//       </div>
//     </Layout>
//   );
// }






















import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";

import { storage } from "../utils/storage";
import { User, Task } from "../utils/types";
import { format } from "date-fns";

export default function Tasks() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<
    "all" | "in-progress" | "submitted" | "completed"
  >("all");
  const [loading, setLoading] = useState(true);

  // AUTH CHECK
  useEffect(() => {
    const current = storage.getCurrentUser();

    if (!current || current.role !== "worker") {
      router.replace("/login");
      return;
    }

    setUser(current);
    loadTasks(current.id);
  }, []);

  // Load tasks
  const loadTasks = async (userId: string) => {
    const all = await storage.getTasks();
    const assigned = all.filter((t) => t.assignedTo === userId);
    setTasks(assigned);
    setLoading(false);
  };

  // Submit task (FIXED)
  const handleSubmitTask = async (taskId: string) => {
    const submission = prompt("Enter your submission URL or description:");
    if (!submission) return;

    // Save to Firestore
    await storage.updateTask(taskId, {
      status: "submitted",
      submittedAt: new Date().toISOString(),
      submissionUrl: submission,
    });

    alert("Task submitted successfully. Awaiting review.");

    if (user) loadTasks(user.id);
  };

  const filteredTasks =
    filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  if (loading || !user) return null;

  return (
    <Layout>
      <Head>
        <title>My Tasks - Cehpoint</title>
      </Head>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>

          <div className="flex space-x-2">
            {["all", "in-progress", "submitted", "completed"].map((status) => (
              <button
                key={status}
                onClick={() =>
                  setFilter(
                    status as "all" | "in-progress" | "submitted" | "completed"
                  )
                }
                className={`px-4 py-2 rounded-lg ${
                  filter === status
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 py-12">No tasks found</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredTasks.map((task) => (
              <Card key={task.id} hover>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Title + Status */}
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xl font-semibold">{task.title}</h3>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          task.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : task.status === "submitted"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 mt-2">{task.description}</p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {task.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-indigo-100 text-indigo-600 text-xs rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <span className="text-gray-500">Category:</span>{" "}
                        <span className="font-medium">{task.category}</span>
                      </div>

                      <div>
                        <span className="text-gray-500">Payout:</span>{" "}
                        <span className="font-medium text-green-600">
                          ${task.weeklyPayout}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-500">Deadline:</span>{" "}
                        <span className="font-medium">
                          {format(new Date(task.deadline), "MMM dd, yyyy")}
                        </span>
                      </div>

                      {task.submittedAt && (
                        <div>
                          <span className="text-gray-500">Submitted:</span>{" "}
                          <span className="font-medium">
                            {format(
                              new Date(task.submittedAt),
                              "MMM dd, yyyy"
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Feedback */}
                    {task.feedback && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">
                          Feedback:
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {task.feedback}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div>
                    {task.status === "in-progress" && (
                      <Button onClick={() => handleSubmitTask(task.id)}>
                        Submit Task
                      </Button>
                    )}

                    {task.status === "submitted" && (
                      <Button disabled variant="outline">
                        Submitted ✓
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}