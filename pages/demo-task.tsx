// import { useEffect, useState } from "react";
// import { useRouter } from "next/router";
// import Head from "next/head";

// import Layout from "../components/Layout";
// import Card from "../components/Card";
// import Button from "../components/Button";

// import { storage } from "../utils/storage";
// import type { User } from "../utils/types";

// export default function DemoTask() {
//   const router = useRouter();

//   const [user, setUser] = useState<User | null>(null);
//   const [submission, setSubmission] = useState("");

//   /* ---------------------------------------------------------
//    * AUTH CHECK
//    * ------------------------------------------------------- */
//   useEffect(() => {
//     const currentUser = storage.getCurrentUser();

//     if (!currentUser || currentUser.role !== "worker") {
//       router.push("/login");
//       return;
//     }

//     if (currentUser.demoTaskCompleted) {
//       router.push("/dashboard");
//       return;
//     }

//     setUser(currentUser);
//   }, []);

//   /* ---------------------------------------------------------
//    * SUBMIT DEMO TASK
//    * ------------------------------------------------------- */
//   const handleSubmit = async () => {
//     if (!submission.trim()) {
//       alert("Please enter your submission");
//       return;
//     }

//     // random score between 70-100
//     const score = Math.floor(Math.random() * 30) + 70;

//     // Update Firestore user
//     await storage.updateUser(user!.id, {
//       demoTaskCompleted: true,
//       demoTaskScore: score,
//     });

//     // Update local current user
//     storage.setCurrentUser({
//       ...user!,
//       demoTaskCompleted: true,
//       demoTaskScore: score,
//     });

//     alert(`Demo task submitted! Score: ${score}/100. You can now accept regular tasks.`);
//     router.push("/dashboard");
//   };

//   if (!user) return null;

//   return (
//     <Layout>
//       <Head>
//         <title>Demo Task - Cehpoint</title>
//       </Head>

//       <div className="max-w-3xl mx-auto space-y-6">
//         <Card>
//           <h1 className="text-3xl font-bold text-gray-900 mb-4">Complete Your Demo Task</h1>
//           <p className="text-gray-600 mb-6">
//             This task helps us evaluate your skills and qualify you for paid projects.
//           </p>

//           <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
//             <h2 className="text-xl font-semibold mb-3">Task Description</h2>
//             <p className="text-gray-700 mb-4">
//               Based on your selected skills: <strong>{user.skills.join(', ')}</strong>
//             </p>
//             <div className="space-y-2 text-gray-700">
//               <p><strong>Task:</strong> Create a simple project that demonstrates your core skills.</p>
//               <ul className="list-disc list-inside ml-4 space-y-1">
//                 <li>For developers: Build a small functional application or component</li>
//                 <li>For video editors: Create a 30-60 second sample video with transitions</li>
//                 <li>For designers: Design a landing page mockup or UI component</li>
//               </ul>
//               <p className="mt-4"><strong>Deliverable:</strong> Submit a link to your work (GitHub, Google Drive, Figma, etc.)</p>
//             </div>
//           </div>

//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium mb-2">Your Submission Link/Description</label>
//               <textarea
//                 value={submission}
//                 onChange={(e) => setSubmission(e.target.value)}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
//                 placeholder="Enter your submission link or detailed description of your work"
//                 rows={6}
//               />
//             </div>

//             <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
//               <p className="text-sm text-yellow-800">
//                 <strong>Note:</strong> Your submission will be evaluated by our AI system. 
//                 Make sure to provide clear and detailed information about your work.
//               </p>
//             </div>

//             <Button onClick={handleSubmit} fullWidth>
//               Submit Demo Task
//             </Button>
//           </div>
//         </Card>
//       </div>
//     </Layout>
//   );
// }







// pages/demo-task.tsx
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import Head from "next/head";

import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";

import { storage } from "../utils/storage";
import type { User } from "../utils/types";

type DemoCategory =
  | "developer"
  | "video-editor"
  | "designer"
  | "marketing"
  | "writing"
  | "general";

function getDemoCategory(user: User): DemoCategory {
  const skills = (user.skills ?? []).map((s) => s.toLowerCase());

  if (skills.includes("developer")) return "developer";
  if (skills.includes("video editor")) return "video-editor";
  if (skills.includes("designer")) return "designer";
  if (skills.includes("marketing")) return "marketing";
  if (skills.includes("writing")) return "writing";
  return "general";
}

export default function DemoTask() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [submission, setSubmission] = useState("");

  /* ---------------------------------------------------------
   * AUTH CHECK
   * ------------------------------------------------------- */
  useEffect(() => {
    const currentUser = storage.getCurrentUser();

    if (!currentUser || currentUser.role !== "worker") {
      router.push("/login");
      return;
    }

    if (currentUser.demoTaskCompleted) {
      router.push("/dashboard");
      return;
    }

    // If no skills yet, force them to choose expertise first
    if (!currentUser.skills || currentUser.skills.length === 0) {
      router.push("/demo-setup");
      return;
    }

    setUser(currentUser);
  }, [router]);

  /* ---------------------------------------------------------
   * SUBMIT DEMO TASK
   * ------------------------------------------------------- */
  const handleSubmit = async () => {
    if (!submission.trim()) {
      toast.error("Please enter your submission details.");
      return;
    }

    if (!user) return;

    const demoCategory = getDemoCategory(user);
    const skillsLabel =
      user.skills && user.skills.length > 0
        ? user.skills.join(", ")
        : "Not specified";

    // random score between 70-100
    const score = Math.floor(Math.random() * 30) + 70;

    // Update Firestore user
    await storage.updateUser(user.id, {
      demoTaskCompleted: true,
      demoTaskScore: score,
    });

    // Update local current user
    storage.setCurrentUser({
      ...user,
      demoTaskCompleted: true,
      demoTaskScore: score,
    });

    // -----------------------------------------------------
    // SEND WHATSAPP MESSAGE (opens WhatsApp with pre-filled DM)
    // -----------------------------------------------------
    const adminNumber = process.env.NEXT_PUBLIC_WHATSAPP_ADMIN_NUMBER;

    if (adminNumber && typeof window !== "undefined") {
      const whatsappMessage =
        `New Demo Task Submission\n\n` +
        `Name: ${user.fullName}\n` +
        (user.email ? `Email: ${user.email}\n` : "") +
        `Role: ${demoCategory}\n` +
        `Skills: ${skillsLabel}\n` +
        `Score (auto-evaluated): ${score}/100\n\n` +
        `Submission:\n${submission}`;

      const encoded = encodeURIComponent(whatsappMessage);
      const url = `https://wa.me/${adminNumber}?text=${encoded}`;

      // open in new tab (or same tab if you prefer)
      window.open(url, "_blank");
    } else {
      console.warn(
        "WhatsApp admin number not set. Add NEXT_PUBLIC_WHATSAPP_ADMIN_NUMBER in your .env.local file."
      );
    }

    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[350px] p-2">
        <div className="flex items-start gap-3">
          <div className="bg-green-100 p-2 rounded-full text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-xl">Demo Task Complete! 🎉</h4>
            <p className="text-gray-600 mt-1">
              You scored <span className="font-bold text-green-600">{score}/100</span>.
            </p>
            <p className="text-gray-500 text-sm mt-1">
              You are now qualified to accept regular paid tasks.
            </p>
          </div>
        </div>
        <div className="mt-2 flex justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Dismiss
          </button>
        </div>
      </div>
    ), { duration: 8000, style: { padding: '20px' } });
    router.push("/dashboard");
  };

  if (!user) return null;

  const demoCategory = getDemoCategory(user);

  const pageTitle =
    demoCategory === "developer"
      ? "Developer Demo Task"
      : demoCategory === "video-editor"
        ? "Video Editor Demo Task"
        : demoCategory === "designer"
          ? "Designer Demo Task"
          : demoCategory === "marketing"
            ? "Marketing Demo Task"
            : demoCategory === "writing"
              ? "Writing Demo Task"
              : "Demo Task";

  const skillsLabel =
    user.skills && user.skills.length > 0
      ? user.skills.join(", ")
      : "Not specified";

  const placeholder =
    demoCategory === "developer"
      ? "GitHub repo link, live URL, and a short explanation of your app..."
      : demoCategory === "video-editor"
        ? "Google Drive / YouTube link and a short note about your edits..."
        : demoCategory === "designer"
          ? "Figma / design link and a brief explanation of your design choices..."
          : demoCategory === "marketing"
            ? "Link to your document / slides and a brief summary of your campaign..."
            : demoCategory === "writing"
              ? "Paste your article or share a doc link, plus a short context..."
              : "Link to your work and a brief explanation of what you did...";

  return (
    <Layout>
      <Head>
        <title>{pageTitle} - Cehpoint</title>
      </Head>

      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {pageTitle}
          </h1>
          <p className="text-gray-600 mb-6">
            This task helps us evaluate your skills and qualify you for paid
            projects.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-3">Task Description</h2>
            <p className="text-gray-700 mb-4">
              Based on your selected skills: <strong>{skillsLabel}</strong>
            </p>

            <div className="space-y-2 text-gray-700">
              {demoCategory === "developer" && (
                <>
                  <p>
                    <strong>Task:</strong> Build a small functional web
                    application.
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>
                      Create a mini CRUD app (todo list, notes app, task
                      manager, etc.).
                    </li>
                    <li>Use React / Next.js or your main tech stack.</li>
                    <li>Handle basic validation and show success/error states.</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Deliverable:</strong> GitHub repository link and (if
                    possible) a live demo URL.
                  </p>
                </>
              )}

              {demoCategory === "video-editor" && (
                <>
                  <p>
                    <strong>Task:</strong> Edit a 30–60 second video.
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>
                      Use any raw footage (your own or copyright-free clips).
                    </li>
                    <li>
                      Include basic cuts, transitions, background music, and at
                      least one text/title overlay.
                    </li>
                    <li>Export it in HD quality.</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Deliverable:</strong> Google Drive / YouTube link to
                    the final video and a short note on tools used.
                  </p>
                </>
              )}

              {demoCategory === "designer" && (
                <>
                  <p>
                    <strong>Task:</strong> Design a clean landing page or app
                    screen.
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Use Figma, Adobe XD, or any design tool.</li>
                    <li>
                      Include a hero section, at least 2 additional sections,
                      and clear CTAs.
                    </li>
                    <li>
                      Focus on visual hierarchy, spacing, and consistent
                      colors/typography.
                    </li>
                  </ul>
                  <p className="mt-4">
                    <strong>Deliverable:</strong> Figma/design file link and a
                    short explanation of your decisions.
                  </p>
                </>
              )}

              {demoCategory === "marketing" && (
                <>
                  <p>
                    <strong>Task:</strong> Create a basic marketing campaign
                    plan for any product or service.
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Define the target audience and main goal.</li>
                    <li>
                      Outline a simple strategy (social media, email, paid ads,
                      SEO, etc.).
                    </li>
                    <li>Write at least 3 short sample ad copies or posts.</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Deliverable:</strong> Google Doc / Notion / PDF link
                    summarizing your campaign.
                  </p>
                </>
              )}

              {demoCategory === "writing" && (
                <>
                  <p>
                    <strong>Task:</strong> Write a 300–500 word sample
                    (article, blog post, landing page copy, etc.).
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Pick any topic you&apos;re comfortable with.</li>
                    <li>
                      Use proper structure: introduction, body, and conclusion.
                    </li>
                    <li>Maintain good grammar, clarity, and flow.</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Deliverable:</strong> Google Doc link or the
                    complete text pasted in your submission.
                  </p>
                </>
              )}

              {demoCategory === "general" && (
                <>
                  <p>
                    <strong>Task:</strong> Share a sample work that best
                    represents your skills.
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>
                      Choose any project or work sample (design, document,
                      video, code, etc.).
                    </li>
                    <li>
                      It should be something you can complete or organize within
                      a few hours.
                    </li>
                    <li>
                      Clearly explain what you did and which skills it
                      demonstrates.
                    </li>
                  </ul>
                  <p className="mt-4">
                    <strong>Deliverable:</strong> Link to your work plus a short
                    description.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Your Submission Link / Description
              </label>
              <textarea
                value={submission}
                onChange={(e) => setSubmission(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                placeholder={placeholder}
                rows={6}
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Your submission will be evaluated by our
                system. Make sure to provide clear and detailed information
                about your work.
              </p>
            </div>

            <Button onClick={handleSubmit} fullWidth>
              Submit Demo Task
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}