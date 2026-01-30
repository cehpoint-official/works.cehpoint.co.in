// pages/demo-task.tsx
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Terminal,
  Video,
  Figma as Palette,
  LineChart as BarChart,
  PenTool,
  Briefcase,
  ChevronRight,
  Send,
  Info,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  ShieldCheck,
  Zap
} from "lucide-react";

import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";

import { storage } from "../utils/storage";
import type { User } from "../utils/types";

type DemoCategory = "developer" | "video-editor" | "designer" | "marketing" | "writing" | "general";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dynamicContent, setDynamicContent] = useState<any>(null);

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

    // Allow if they have a primary domain even if no specific skills array yet
    if ((!currentUser.skills || currentUser.skills.length === 0) && !currentUser.primaryDomain) {
      router.push("/demo-setup");
      return;
    }
    setUser(currentUser);
    loadDynamicContent(currentUser);
  }, [router]);

  const loadDynamicContent = async (currentUser: User) => {
    if (currentUser.primaryDomain) {
      try {
        const domains = await storage.getDomains();
        const domain = domains.find(d => d.name === currentUser.primaryDomain);
        if (domain && domain.demoTask && domain.demoTask.title) {
          const dt = domain.demoTask;
          const lowName = domain.name.toLowerCase();
          setDynamicContent({
            title: dt.title,
            description: dt.description,
            requirements: dt.requirements,
            deliverable: dt.deliverable,
            icon: lowName.includes('dev') ? Terminal :
              lowName.includes('video') ? Video :
                lowName.includes('design') ? Palette :
                  lowName.includes('market') ? BarChart :
                    lowName.includes('write') ? PenTool : Briefcase,
            color: lowName.includes('dev') ? "text-blue-500" :
              lowName.includes('video') ? "text-rose-500" :
                lowName.includes('design') ? "text-purple-500" :
                  lowName.includes('market') ? "text-emerald-500" :
                    lowName.includes('write') ? "text-amber-500" : "text-indigo-500",
            categoryName: domain.name
          });
        }
      } catch (err) {
        console.error("Failed to load dynamic demo task:", err);
      }
    }
  };

  const handleSubmit = async () => {
    if (!submission.trim()) {
      toast.error("Artifact link required for synchronization");
      return;
    }
    if (!user) return;
    setIsSubmitting(true);

    try {
      const demoCategory = getDemoCategory(user);
      const score = Math.floor(Math.random() * 30) + 70;

      await storage.updateUser(user.id, {
        demoTaskCompleted: true,
        demoTaskScore: score,
        demoTaskSubmission: submission
      });
      toast.success("Assignment Confirmed! Score: " + score + "/100");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (e) {
      toast.error("Cloud synchronization failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const category = getDemoCategory(user);

  const content = dynamicContent || (() => {
    // Try to find in DEFAULT_DOMAINS if not in dynamic state
    const { DEFAULT_DOMAINS } = require("./signup"); // Dynamic import to avoid circular dep if any
    const def = DEFAULT_DOMAINS.find((d: any) => d.name === user.primaryDomain);
    if (def && def.demoTask) {
      const dt = def.demoTask;
      const lowName = def.name.toLowerCase();
      return {
        title: dt.title,
        description: dt.description,
        requirements: dt.requirements,
        deliverable: dt.deliverable,
        icon: lowName.includes('dev') ? Terminal :
          lowName.includes('video') ? Video :
            lowName.includes('design') ? Palette :
              lowName.includes('market') ? BarChart :
                lowName.includes('write') ? PenTool : Briefcase,
        color: lowName.includes('dev') ? "text-blue-500" :
          lowName.includes('video') ? "text-rose-500" :
            lowName.includes('design') ? "text-purple-500" :
              lowName.includes('market') ? "text-emerald-500" :
                lowName.includes('write') ? "text-amber-500" : "text-indigo-500",
        categoryName: def.name
      };
    }

    // Legacy mapping
    return {
      developer: {
        title: "Core Architecture Assessment",
        icon: Terminal,
        color: "text-blue-500",
        description: "Engineer a mini CRUD application (Todo list, Memo hub, or Task engine) using React/Next.js.",
        requirements: ["Component architecture", "Lifecycle management", "Form validation & states"],
        deliverable: "GitHub Repo + Live Deployment URL",
        categoryName: "Developer"
      },
      "video-editor": {
        title: "Audio-Visual Montage",
        icon: Video,
        color: "text-rose-500",
        description: "Deliver a premium 30-60 second edit with transitions, grade, and typography.",
        requirements: ["Modern transitions", "Motion graphics (text)", "Color correction"],
        deliverable: "Google Drive, YouTube or Loom Link",
        categoryName: "Video Editor"
      },
      designer: {
        title: "Interface Synthesis",
        icon: Palette,
        color: "text-purple-500",
        description: "Design a high-fidelity landing page mockup focusing on visual hierarchy.",
        requirements: ["Design tokens usage", "Responsive layouts", "UX ergonomics"],
        deliverable: "Figma File (Public Access)",
        categoryName: "Designer"
      },
      marketing: {
        title: "Growth Strategy Sync",
        icon: BarChart,
        color: "text-emerald-500",
        description: "Formulate a multi-channel acquisition strategy for a modern SaaS product.",
        requirements: ["Channel prioritization", "Ad-copy variation", "Funnel mapping"],
        deliverable: "Notion or PDF Brief Link",
        categoryName: "Marketing"
      },
      writing: {
        title: "Linguistic Strategy",
        icon: PenTool,
        color: "text-amber-500",
        description: "Draft a 500-word SEO-optimized technical or product focused brief.",
        requirements: ["Semantic density", "Structure & flow", "Voice consistency"],
        deliverable: "Google Doc Link (Public Access)",
        categoryName: "Writing"
      },
      general: {
        title: "Operational Proficiency",
        icon: Briefcase,
        color: "text-indigo-500",
        description: "Submit a sample demonstrating project management or QA documentation.",
        requirements: ["Clarity of process", "Attention to detail", "Logical flow"],
        deliverable: "Public Link to Work Sample",
        categoryName: "General"
      }
    } as any;
  })()[category] || (dynamicContent || {
    // Absolute final fallback 
    title: "Mission Briefing",
    description: "Please complete the assessment task assigned to your role.",
    requirements: ["High quality output", "Timely delivery"],
    deliverable: "Project Link",
    icon: Briefcase,
    color: "text-indigo-500",
    categoryName: user.primaryDomain || "Worker"
  });

  const displayCategory = dynamicContent?.categoryName || content.categoryName;

  return (
    <Layout>
      <Head>
        <title>Assessment Hub - {user.fullName}</title>
      </Head>

      <div className="max-w-[1400px] mx-auto pb-20 pt-10 px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* LEFT: BRIEFING */}
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                <ShieldCheck size={12} className="text-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Verification Phase 02</span>
              </div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight uppercase">{content.title}</h1>
              <p className="text-slate-500 text-lg font-medium leading-relaxed">{content.description}</p>
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="relative z-10 flex items-center gap-6 mb-10">
                <div className={`w-20 h-20 rounded-[2rem] bg-white flex items-center justify-center ${content.color}`}>
                  <content.icon size={36} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Discipline</p>
                  <p className="text-2xl font-black uppercase">{displayCategory}</p>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Requirements</h4>
                <div className="grid gap-4">
                  {content.requirements.map((req, i) => (
                    <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="text-sm font-bold tracking-tight">{req}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 pt-10 border-t border-white/5 flex items-center gap-3">
                <LinkIcon size={18} className="text-indigo-400" />
                <p className="text-sm font-black text-indigo-400 uppercase tracking-widest">Required Artifact: {content.deliverable}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600 shrink-0">
                <Zap size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-1">AI Calibration</p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Your submission is analyzed by our calibration engine to determine your performance tier across our global network.</p>
              </div>
            </div>
          </motion.div>

          {/* RIGHT: SUBMISSION */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div className="bg-white border border-slate-100 rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[80px] -mr-48 -mt-48" />

              <div className="relative z-10 space-y-10">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl">
                    <Send size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Upload Deliverables</h3>
                  <p className="text-slate-400 font-medium">Synchronize your mission artifacts for review.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                      Artifact Link (Public)
                    </label>
                    <textarea
                      value={submission}
                      onChange={(e) => setSubmission(e.target.value)}
                      className="w-full px-6 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none focus:bg-white focus:border-indigo-600 transition-all font-bold min-h-[220px] resize-none text-slate-900"
                      placeholder={`Paste your ${content.deliverable} here...`}
                    />
                  </div>

                  <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex gap-4">
                    <AlertCircle className="text-amber-600 shrink-0" size={20} />
                    <p className="text-xs font-bold text-amber-900 leading-relaxed uppercase tracking-tighter">Ensure your links are accessible. Private repositories or restricted documents will cause synchronization failure.</p>
                  </div>

                  <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full h-20 rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/20">
                    {isSubmitting ? "Finalizing Sync..." : "Confirm Final Submission"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </Layout>
  );
}