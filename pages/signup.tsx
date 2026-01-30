
import { toast } from "react-hot-toast";
import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Star,
  CheckCircle2,
  Users,
  BadgeCheck,
  Brain,
  Zap,
  Eye,
  EyeOff,
  Layers
} from "lucide-react";

import { googleAuth } from "../utils/authProviders";
import { firebaseSignup } from "../utils/authEmailPassword";
import { db } from "../utils/firebase";
import { doc, setDoc } from "firebase/firestore";
import { storage } from "../utils/storage";
import Button from "../components/Button";
import { User, Domain } from "../utils/types";
import { useUser } from "../context/UserContext";
import { useEffect } from "react";

/* ================= TYPES & DATA ================= */
type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: number;
};

const QUESTION_SETS: Record<string, QuizQuestion[]> = {
  dev: [
    { question: "In React, which hook is used to manage component state?", options: ["useEffect", "useState", "useMemo", "useRef"], correctAnswer: 1 },
    { question: "In Node.js, which object is used to handle HTTP requests?", options: ["http.Server", "http.Request", "http.Client", "http.Handler"], correctAnswer: 0 },
    { question: "Which HTTP status code means 'Not Found'?", options: ["200", "301", "404", "500"], correctAnswer: 2 },
  ],
  design: [
    { question: "Which principle means 'space around elements'?", options: ["Hierarchy", "Contrast", "White space", "Alignment"], correctAnswer: 2 },
    { question: "Which tool is best suited for UI design?", options: ["Figma", "Excel", "VS Code", "Slack"], correctAnswer: 0 },
    { question: "In video editing, what does FPS stand for?", options: ["Frames Per Second", "First Primary Shot", "Fast Play Speed", "Frame Processing System"], correctAnswer: 0 },
  ],
  content: [
    { question: "What is the main goal of a blog article?", options: ["Entertain only", "Provide value to the reader", "Use as many keywords as possible", "Write as long as possible"], correctAnswer: 1 },
    { question: "Which is MOST important for good web copy?", options: ["Fancy words", "Short paragraphs", "Slang", "All caps text"], correctAnswer: 1 },
  ],
  marketing: [
    { question: "What does SEO stand for?", options: ["Search Engine Optimization", "Social Engagement Outreach", "Simple Email Operations", "Sales Engagement Objective"], correctAnswer: 0 },
    { question: "Which metric tells you how many people clicked your ad?", options: ["CTR", "CPC", "ROI", "ARPU"], correctAnswer: 0 },
  ],
  general: [
    { question: "Which of these is MOST important when working remotely?", options: ["Fast typing", "Clear communication", "Fancy laptop", "Dark mode"], correctAnswer: 1 },
    { question: "If you are stuck on a task, what should you do?", options: ["Ignore it", "Guess and submit", "Ask for clarification from the manager", "Wait for someone to notice"], correctAnswer: 2 },
  ],
};

function getQuestionsForSkills(skills: string[], domainName?: string): QuizQuestion[] {
  const name = domainName?.toLowerCase() || "";

  if (name.includes("development") || name.includes("frontend") || name.includes("backend") || name.includes("devops") || name.includes("cloud") || name.includes("stack")) {
    return QUESTION_SETS.dev;
  }
  if (name.includes("design") || name.includes("graphics") || name.includes("video") || name.includes("ui") || name.includes("ux")) {
    return QUESTION_SETS.design;
  }
  if (name.includes("content") || name.includes("writing") || name.includes("copy")) {
    return QUESTION_SETS.content;
  }
  if (name.includes("marketing") || name.includes("seo") || name.includes("ads") || name.includes("marketer")) {
    return QUESTION_SETS.marketing;
  }

  return QUESTION_SETS.general;
}

const TIMEZONE_OPTIONS = [
  { label: "India (IST, UTC+5:30)", value: "Asia/Kolkata" },
  { label: "UTC (Universal Time)", value: "UTC" },
  { label: "US Pacific (PT)", value: "America/Los_Angeles" },
  { label: "US Eastern (ET)", value: "America/New_York" },
  { label: "Europe (CET)", value: "Europe/Berlin" },
];

export const DEFAULT_DOMAINS: Domain[] = [
  {
    id: 'd1', name: "Full Stack Development", stacks: ["React", "Node.js", "Next.js", "MongoDB", "PostgreSQL", "TypeScript"], createdAt: "",
    demoTask: {
      title: "Core Architecture Assessment",
      description: "Engineer a mini CRUD application (Todo list, Memo hub, or Task engine) using React/Next.js.",
      requirements: ["Component architecture", "Lifecycle management", "Form validation & states"],
      deliverable: "GitHub Repo + Live Deployment URL"
    }
  },
  {
    id: 'd2', name: "Frontend Development", stacks: ["React", "Vue.js", "Angular", "Tailwind CSS", "Redux", "Framer Motion"], createdAt: "",
    demoTask: {
      title: "UI Implementation Challenge",
      description: "Build a high-fidelity, responsive landing page section based on modern design principles.",
      requirements: ["Responsive design", "Aesthetic layout", "Clean component structure"],
      deliverable: "GitHub Repo + Live Preview"
    }
  },
  {
    id: 'd3', name: "Backend Development", stacks: ["Node.js", "Python", "Go", "Java", "Django", "FastAPI"], createdAt: "",
    demoTask: {
      title: "API Performance Sync",
      description: "Develop a secure RESTful API with authentication and database integration.",
      requirements: ["Auth implementation", "Database schema", "Error handling"],
      deliverable: "Source Code + API Documentation"
    }
  },
  {
    id: 'd4', name: "DevOps & Cloud", stacks: ["Docker", "Kubernetes", "AWS", "Azure", "GitHub Actions"], createdAt: "",
    demoTask: {
      title: "Infrastructure Deployment",
      description: "Create a CI/CD pipeline and containerize a sample application for production.",
      requirements: ["Dockerization", "Pipeline automation", "Security best practices"],
      deliverable: "GitHub Repo + Deployment Logs"
    }
  },
  {
    id: 'd5', name: "Graphics & Design", stacks: ["Photoshop", "Illustrator", "Figma", "UI/UX Design", "After Effects"], createdAt: "",
    demoTask: {
      title: "Interface Synthesis",
      description: "Design a high-fidelity landing page mockup focusing on visual hierarchy.",
      requirements: ["Design tokens usage", "Responsive layouts", "UX ergonomics"],
      deliverable: "Figma File (Public Access)"
    }
  },
  {
    id: 'd6', name: "Marketing & SEO", stacks: ["Google Ads", "SEO", "Content Strategy", "Social Media"], createdAt: "",
    demoTask: {
      title: "Growth Strategy Sync",
      description: "Formulate a multi-channel acquisition strategy for a modern SaaS product.",
      requirements: ["Channel prioritization", "Ad-copy variation", "Funnel mapping"],
      deliverable: "Notion or PDF Brief Link"
    }
  }
];

const CURRENCY_OPTIONS: Array<"INR" | "USD"> = ["INR", "USD"];

const skillOptions = [
  "React", "Node.js", "Python", "Java", "PHP", "Angular", "Vue.js", "Video Editing",
  "Adobe Premiere", "After Effects", "UI/UX Design", "Graphic Design", "Content Writing",
  "Digital Marketing", "SEO"
];

/* ================= PAGE COMPONENT ================= */
export default function Signup() {
  const router = useRouter();
  const { login } = useUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    primaryDomain: "",
    skills: [] as string[],
    experience: "",
    timezone: "Asia/Kolkata",
    preferredWeeklyPayout: 500,
    payoutCurrency: "INR" as "INR" | "USD",
  });

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [knowledgeQuestions, setKnowledgeQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [authMethod, setAuthMethod] = useState<"email" | "google" | null>(null);
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [authEmailVerified, setAuthEmailVerified] = useState<boolean>(false);

  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);

  useEffect(() => {
    storage.getDomains().then(data => {
      if (data && data.length > 0) {
        setDomains(data);
      } else {
        setDomains(DEFAULT_DOMAINS);
      }
    });
  }, []);

  const handleDomainSelect = (domain: Domain) => {
    setSelectedDomain(domain);
    setSelectedSkills([]); // Reset skills when domain changes
    setFormData(prev => ({ ...prev, primaryDomain: domain.name }));
  };

  const handleSkillToggle = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const createFirestoreUser = async (uid: string, emailVerified: boolean, finalScore: number) => {
    const newUser: User = {
      id: uid,
      uid: uid,
      email: formData.email,
      password: authMethod === "email" ? formData.password : "",
      fullName: formData.fullName,
      primaryDomain: selectedDomain?.name || "",
      phone: formData.phone,
      skills: selectedSkills,
      experience: formData.experience,
      timezone: formData.timezone,
      preferredWeeklyPayout: formData.preferredWeeklyPayout,
      preferredCurrency: formData.payoutCurrency,
      emailVerified,
      role: "worker",
      accountStatus: "pending",
      knowledgeScore: finalScore,
      demoTaskCompleted: false,
      createdAt: new Date().toISOString(),
      balance: 0,
    };

    await setDoc(doc(db, "users", uid), newUser);

    if (authMethod === "google") {
      storage.setCurrentUser(newUser);
      login(newUser);
      router.push("/dashboard");
    } else {
      toast.success("Account created! Verify your email to continue.");
      router.push("/login");
    }
  };

  const handleSocialSignup = async (method: "google") => {
    try {
      setLoading(true);
      const result = await googleAuth();
      const user = result.user;
      setAuthMethod(method);
      setAuthUid(user.uid);
      setAuthEmailVerified(user.emailVerified ?? false);

      let name = user.displayName || "";
      setFormData((prev) => ({ ...prev, email: user.email || "", fullName: name }));
      setStep(1);
    } catch (err) {
      console.error(err);
      toast.error(`${method} signup failed.`);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!formData.fullName || !formData.phone || (!authMethod && (!formData.email || !formData.password))) {
        toast.error("Please fill all required fields");
        return;
      }
      if (!authMethod) setAuthMethod("email");
      setStep(2);
      return;
    }

    if (step === 2) {
      if (selectedSkills.length === 0 || !formData.experience || !formData.timezone) {
        toast.error("Please complete all skill details");
        return;
      }
      setLoading(true);

      // SYNC: Use admin-configured questions if available, otherwise fallback to generator
      let qs = selectedDomain?.questions && selectedDomain.questions.length > 0
        ? selectedDomain.questions
        : getQuestionsForSkills(selectedSkills, selectedDomain?.name);

      setKnowledgeQuestions(qs);
      setAnswers(new Array(qs.length).fill(-1));
      setStep(3);
      setLoading(false);
      return;
    }

    if (step === 3) {
      if (answers.some(a => a === -1)) {
        toast.error("Please answer all verification questions");
        return;
      }
      setLoading(true);
      const correct = answers.filter((ans, i) => ans === knowledgeQuestions[i].correctAnswer).length;
      const finalScore = (correct / knowledgeQuestions.length) * 100;

      if (finalScore < 60) {
        toast.error(`Score: ${finalScore.toFixed(0)}%. Minimum 60% required to join.`);
        setLoading(false);
        return;
      }

      try {
        if (authMethod === "email") {
          const result = await firebaseSignup(formData.email, formData.password);
          await createFirestoreUser(result.user.uid, false, finalScore);
        } else {
          await createFirestoreUser(authUid!, authEmailVerified, finalScore);
        }
      } catch (err) {
        console.error(err);
        toast.error("Signup failed. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fcfcfd]">
      <Head>
        <title>Apply for Access | Cehpoint Work</title>
      </Head>

      {/* LEFT ASPECT: ONBOARDING VALUE */}
      <div className="hidden md:flex md:w-[35%] lg:w-[40%] bg-[#0f172a] relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute top-0 right-0 w-full h-[600px] bg-indigo-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

        <Link href="/" className="relative z-10 flex items-center gap-3">
          <span className="text-2xl font-black">Cehpoint <span className="text-indigo-500">Work</span></span>
        </Link>

        <div className="relative z-10 space-y-12">
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-600/40 mb-8"
            >
              <Star className="w-8 h-8 fill-white text-white" />
            </motion.div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15]">
              Become a <br />
              <span className="text-indigo-400">Verified Expert</span> <br />
              on Cehpoint.
            </h1>
          </div>

          <div className="space-y-6">
            {[
              { icon: CheckCircle2, title: "Standardized Assessments", desc: "No resume padding here—prove your worth through skill checks." },
              { icon: Users, title: "Invite-Only Projects", desc: "Access enterprise-level projects that are never publicly listed." },
              { icon: BadgeCheck, title: "Financial Freedom", desc: "Automatic weekly payouts with no net-30 delays or chasing clients." }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
                className="flex gap-4"
              >
                <div className="mt-1 flex-shrink-0">
                  <item.icon className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-100">{item.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 py-6 border-t border-white/5">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0f172a] bg-slate-800" />
            ))}
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">+1,200 Experts Joined This Week</span>
        </div>
      </div>

      {/* RIGHT ASPECT: STEPPED FORM */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 lg:p-20 relative overflow-y-auto">
        <div className="w-full max-w-xl">
          {/* Progress Header */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Application Progress</span>
              <span className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em]">Step {step} of 3</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${(step / 3) * 100}%` }}
                className="h-full bg-indigo-600 rounded-full"
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* STEP 1: IDENTITY */}
              {step === 1 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Build your profile</h2>
                    <p className="text-slate-500 font-medium">Standardize your identity to get vetted for premium work.</p>
                  </div>

                  {!authMethod && (
                    <div className="space-y-4">
                      <button onClick={() => handleSocialSignup("google")} className="w-full h-14 border border-slate-200 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all font-bold group text-sm">
                        <img src="/google.png" className="w-5 h-5 group-hover:scale-110 transition-transform" /> Sign up with Google
                      </button>
                    </div>
                  )}

                  {!authMethod && (
                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <div className="flex-1 h-px bg-slate-100" /> OR EMAIL <div className="flex-1 h-px bg-slate-100" />
                    </div>
                  )}

                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                        <input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="premium-input w-full p-4 rounded-xl border-slate-200 outline-none" placeholder="Enter Full Name" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                        <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="premium-input w-full p-4 rounded-xl border-slate-200 outline-none" placeholder="Enter Phone Number" />
                      </div>
                    </div>

                    {!authMethod && (
                      <>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                          <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="premium-input w-full p-4 rounded-xl border-slate-200 outline-none" placeholder="Enter Email Address" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Secure Password</label>
                          <div className="relative">
                            <input type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="premium-input w-full p-4 rounded-xl border-slate-200 outline-none pr-12" placeholder="••••••••" />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                            >
                              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: EXPERTISE */}
              {step === 2 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Declare Expertise</h2>
                    <p className="text-slate-500 font-medium">Select your primary skills and payout preferences.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-indigo-600">Step A: Choose Main Domain</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {domains.map(domain => (
                            <button
                              key={domain.id}
                              onClick={() => handleDomainSelect(domain)}
                              className={`p-4 rounded-2xl border-2 text-xs font-black uppercase tracking-tight transition-all text-center flex flex-col items-center gap-3 ${selectedDomain?.id === domain.id
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20"
                                : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                                }`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedDomain?.id === domain.id ? 'bg-white/20' : 'bg-slate-50'}`}>
                                <Layers size={18} />
                              </div>
                              {domain.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <AnimatePresence mode="wait">
                        {selectedDomain && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                          >
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-emerald-600">Step B: Specialized Stacks in {selectedDomain.name}</label>
                            <div className="flex flex-wrap gap-2">
                              {selectedDomain.stacks.map(skill => (
                                <button
                                  key={skill}
                                  onClick={() => handleSkillToggle(skill)}
                                  className={`px-5 py-3 rounded-xl border-2 text-sm font-bold transition-all ${selectedSkills.includes(skill)
                                    ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                    : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
                                    }`}
                                >
                                  {skill}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Experience Level</label>
                        <select value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} className="premium-input w-full p-4 rounded-xl border-slate-200 outline-none appearance-none bg-white">
                          <option value="">Select Level</option>
                          <option value="beginner">Beginner (1-2y)</option>
                          <option value="intermediate">Intermediate (3-5y)</option>
                          <option value="expert">Expert (5y+)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Your Timezone</label>
                        <select value={formData.timezone} onChange={(e) => setFormData({ ...formData, timezone: e.target.value })} className="premium-input w-full p-4 rounded-xl border-slate-200 outline-none appearance-none bg-white">
                          {TIMEZONE_OPTIONS.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Target Weekly Payout</label>
                      <div className="flex gap-3">
                        <input type="number" value={formData.preferredWeeklyPayout} onChange={(e) => setFormData({ ...formData, preferredWeeklyPayout: Number(e.target.value) })} className="premium-input flex-1 p-4 rounded-xl border-slate-200 outline-none" />
                        <select value={formData.payoutCurrency} onChange={(e) => setFormData({ ...formData, payoutCurrency: e.target.value as any })} className="premium-input w-28 p-4 rounded-xl border-slate-200 outline-none appearance-none bg-white font-bold text-center">
                          {CURRENCY_OPTIONS.map(cur => <option key={cur} value={cur}>{cur}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: VERIFICATION */}
              {step === 3 && (
                <div className="space-y-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6">
                      <Brain className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Verify Capability</h2>
                    <p className="text-slate-500 font-medium max-w-sm">Complete this short technical assessment to unlock project access.</p>
                  </div>

                  <div className="space-y-6">
                    {knowledgeQuestions.map((q, qidx) => (
                      <div key={qidx} className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-4">
                        <p className="font-bold text-slate-800 leading-relaxed text-lg">
                          <span className="text-indigo-600 mr-2">Q{qidx + 1}.</span>
                          {q.question}
                        </p>
                        <div className="grid grid-cols-1 gap-3">
                          {q.options.map((opt, oidx) => (
                            <button
                              key={oidx}
                              onClick={() => {
                                const na = [...answers];
                                na[qidx] = oidx;
                                setAnswers(na);
                              }}
                              className={`p-4 rounded-xl text-left font-bold transition-all border-2 ${answers[qidx] === oidx
                                ? "bg-indigo-50 border-indigo-600 text-indigo-700"
                                : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                                }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-12 flex items-center justify-between gap-4">
                {step > 1 ? (
                  <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 px-6 py-4 font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
                    <ArrowLeft size={16} /> Back
                  </button>
                ) : <div />}

                <Button
                  onClick={handleNext}
                  className={`h-14 px-10 rounded-2xl shadow-xl shadow-indigo-600/20 ${step === 1 ? 'w-full md:w-auto' : ''}`}
                  disabled={loading}
                >
                  {loading ? "Processing..." : (
                    <span className="flex items-center gap-2">
                      {step === 3 ? "Complete Verification" : "Continue"} <ArrowRight size={18} />
                    </span>
                  )}
                </Button>
              </div>

              {step === 1 && (
                <div className="mt-8 text-center">
                  <p className="text-slate-500 font-medium">Already an expert? <Link href="/login" className="text-indigo-600 font-black underline underline-offset-4 decoration-indigo-200">Login to your portal</Link></p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating Credit */}
        <div className="mt-20 md:mt-0 md:absolute md:bottom-8 md:text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
          Premium Ecosystem for High-Trust Collaboration
        </div>
      </div>
    </div>
  );
}
