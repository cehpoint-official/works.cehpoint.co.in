// "use client";


// import { useState } from 'react';
// import Head from 'next/head';
// import Link from 'next/link';
// import { useRouter } from 'next/router';
// import { CheckCircle } from 'lucide-react';
// import { googleAuth, githubAuth } from "../utils/authProviders";
// import { firebaseSignup } from "../utils/authEmailPassword";
// import { db } from "../utils/firebase";
// import { doc, setDoc } from "firebase/firestore";


// import { storage, User } from '../utils/storage';
// import { initGemini, generateKnowledgeQuestions } from '../utils/gemini';
// import Button from '../components/Button';

// import { auth } from "../utils/firebase";
// import {
//   GoogleAuthProvider,
//   GithubAuthProvider,
//   signInWithPopup,
// } from "firebase/auth";

// export default function Signup() {
//   const router = useRouter();
//   const [step, setStep] = useState(1);
//   const [geminiKey, setGeminiKey] = useState('');
//   const [formData, setFormData] = useState({
//     email: '',
//     password: '',
//     fullName: '',
//     phone: '',
//     skills: [] as string[],
//     experience: '',
//     timezone: '',
//     preferredWeeklyPayout: 500,
//   });

//   const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
//   const [knowledgeQuestions, setKnowledgeQuestions] = useState<any[]>([]);
//   const [answers, setAnswers] = useState<number[]>([]);
//   const [score, setScore] = useState(0);
//   const [loading, setLoading] = useState(false);

//   const skillOptions = [
//     'React', 'Node.js', 'Python', 'Java', 'PHP', 'Angular', 'Vue.js',
//     'Video Editing', 'Adobe Premiere', 'After Effects', 'UI/UX Design',
//     'Graphic Design', 'Content Writing', 'Digital Marketing', 'SEO'
//   ];

//   const handleSkillToggle = (skill: string) => {
//     if (selectedSkills.includes(skill)) {
//       setSelectedSkills(selectedSkills.filter(s => s !== skill));
//     } else {
//       setSelectedSkills([...selectedSkills, skill]);
//     }
//   };

//   // -----------------------------------------------------

//   // =========================
// // GOOGLE SIGNUP
// // =========================
// const handleGoogleSignup = async () => {
//   try {
//     const result = await googleAuth();
//     const user = result.user;

//     const newUser = {
//       id: user.uid,
//       email: user.email,
//       fullName: user.displayName || "",
//       role: "worker",
//       accountStatus: "pending",
//       createdAt: new Date().toISOString(),
//       skills: [],
//       balance: 0,
//     };

//     await setDoc(doc(db, "users", user.uid), newUser);

//     storage.setCurrentUser(newUser);
//     router.push("/dashboard");
//   } catch (err) {
//     console.error(err);
//     alert("Google signup failed.");
//   }
// };



// // =========================
// // GITHUB SIGNUP
// // =========================
// const handleGithubSignup = async () => {
//   try {
//     const result = await githubAuth();
//     const user = result.user;

//     const name =
//       user.displayName ||
//       (user as any)?.reloadUserInfo?.screenName ||
//       user.email?.split("@")[0];

//     const newUser = {
//       id: user.uid,
//       email: user.email || "",
//       fullName: name,
//       role: "worker",
//       accountStatus: "pending",
//       createdAt: new Date().toISOString(),
//       skills: [],
//       balance: 0,
//     };

//     await setDoc(doc(db, "users", user.uid), newUser);

//     storage.setCurrentUser(newUser);
//     router.push("/dashboard");
//   } catch (err) {
//     console.error(err);
//     alert("GitHub signup failed");
//   }
// };


//   // email
//   const handleEmailSignup = async () => {
//     try {
//       const result = await firebaseSignup(formData.email, formData.password);

//       alert("Verification email sent! Please check your inbox.");
//       console.log("Trying to send verification email to:", formData.email);

//       router.push("/login"); // Force email verification
//     } catch (err: any) {
//       console.error(err);

//       if (err.code === "auth/email-already-in-use") {
//         alert("Email already exists.");
//       } else if (err.code === "auth/weak-password") {
//         alert("Weak password.");
//       } else {
//         alert("Signup failed");
//       }
//     }
//   };

//   // -----------------------------------------------------
//   // ON NORMAL FORM SIGNUP (Your Steps)
//   // -----------------------------------------------------
//   const handleNext = async () => {
//     if (step === 1) {
//       if (!formData.email || !formData.password || !formData.fullName || !formData.phone) {
//         alert('Please fill all fields');
//         return;
//       }
//       setStep(2);
//     }
//     else if (step === 2) {
//       if (selectedSkills.length === 0 || !formData.experience || !formData.timezone) {
//         alert('Please complete all fields');
//         return;
//       }

//       setFormData({ ...formData, skills: selectedSkills });

//       if (!geminiKey) {
//         alert('Using demo knowledge check (Gemini key missing)');
//         setStep(3);
//         setKnowledgeQuestions([
//           {
//             question: 'Sample Question: What is React?',
//             options: ['A Library', 'A Framework', 'A Language', 'A Database'],
//             correctAnswer: 0
//           }
//         ]);
//         return;
//       }

//       setLoading(true);
//       try {
//         initGemini(geminiKey);
//         const questions = await generateKnowledgeQuestions(selectedSkills);
//         setKnowledgeQuestions(questions);
//         setAnswers(new Array(questions.length).fill(-1));
//         setStep(3);
//       } catch (error) {
//         console.error(error);
//         alert('Using sample questions.');
//         setKnowledgeQuestions([
//           {
//             question: 'Sample Question: What is React?',
//             options: ['A Library', 'A Framework', 'A Language', 'A Database'],
//             correctAnswer: 0
//           }
//         ]);
//         setAnswers([0]);
//         setStep(3);
//       }
//       setLoading(false);
//     }
//     else if (step === 3) {
//       const correctCount = answers.filter((ans, idx) => ans === knowledgeQuestions[idx].correctAnswer).length;
//       const finalScore = (correctCount / knowledgeQuestions.length) * 100;
//       setScore(finalScore);

//       if (finalScore < 60) {
//         alert('Knowledge check score too low. Please try again or improve your skills.');
//         return;
//       }

//       // ⭐ Firebase email OTP verification signup
//       await handleEmailSignup();
//       return;
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 py-12">
//       <Head>
//         <title>Sign Up - Cehpoint</title>
//       </Head>

//       <div className="max-w-2xl mx-auto px-4 animate-fade-in">

//         {/* HEADER */}
//         <div className="text-center mb-10">
//           <Link href="/">
//             <span className="text-4xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent cursor-pointer hover:scale-110 inline-block transition-transform">
//               Cehpoint
//             </span>
//           </Link>
//           <h1 className="text-4xl font-black mt-6 text-gray-900">Join Our Platform</h1>
//           <p className="text-gray-600 mt-3 text-lg">Start your project-based work journey today</p>
//         </div>

//         {/* FORM CARD */}
//         <div className="glass-card rounded-3xl premium-shadow p-10">

//           {/* STEP INDICATOR */}
//           <div className="flex justify-between mb-10">
//             {['Basic Info', 'Skills', 'Verification'].map((label, i) => (
//               <div key={i} className={`flex-1 text-center ${step >= i + 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
//                 <div className={`w-12 h-12 rounded-full ${step >= i + 1 ? 'bg-gradient-to-br from-indigo-600 to-purple-600' : 'bg-gray-300'
//                   } text-white flex items-center justify-center mx-auto mb-2 font-bold shadow-lg`}>
//                   {step > i + 1 ? <CheckCircle size={22} /> : i + 1}
//                 </div>
//                 <p className="text-sm font-bold">{label}</p>
//               </div>
//             ))}
//           </div>

//           {/* ---------------- STEP 1 ---------------- */}
//           {step === 1 && (
//             <div className="space-y-6">

//               {/* OAUTH BUTTONS */}
//               <div className="space-y-3">
//                 <button
//                   onClick={handleGoogleSignup}
//                   className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 px-5 py-3 rounded-xl shadow-sm hover:bg-gray-50 transition"
//                 >
//                   <img src="/google.png" className="w-5 h-5" />
//                   <span className="font-medium">Sign up with Google</span>
//                 </button>

//                 <button
//                   onClick={handleGithubSignup}
//                   className="w-full flex items-center justify-center gap-2 bg-black text-white px-5 py-3 rounded-xl shadow hover:bg-gray-800 transition"
//                 >
//                   <img src="/github.png" className="w-5 h-5 invert" />
//                   <span className="font-medium">Sign up with GitHub</span>
//                 </button>
//               </div>

//               {/* Divider */}
//               <div className="flex items-center gap-3">
//                 <div className="flex-1 h-px bg-gray-300" />
//                 <span className="text-sm text-gray-500">or</span>
//                 <div className="flex-1 h-px bg-gray-300" />
//               </div>

//               {/* BASIC INFO INPUTS */}
//               <div>
//                 <label className="block text-sm font-bold mb-3 text-gray-700">Full Name</label>
//                 <input
//                   type="text"
//                   value={formData.fullName}
//                   onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
//                   className="w-full px-5 py-4 premium-input rounded-xl text-base font-medium"
//                   placeholder="John Doe"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold mb-3 text-gray-700">Email</label>
//                 <input
//                   type="email"
//                   value={formData.email}
//                   onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//                   className="w-full px-5 py-4 premium-input rounded-xl text-base font-medium"
//                   placeholder="john@example.com"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold mb-3 text-gray-700">Password</label>
//                 <input
//                   type="password"
//                   value={formData.password}
//                   onChange={(e) => setFormData({ ...formData, password: e.target.value })}
//                   className="w-full px-5 py-4 premium-input rounded-xl text-base font-medium"
//                   placeholder="••••••••"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold mb-3 text-gray-700">Phone</label>
//                 <input
//                   type="tel"
//                   value={formData.phone}
//                   onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
//                   className="w-full px-5 py-4 premium-input rounded-xl text-base font-medium"
//                   placeholder="+1 234 567 8900"
//                 />
//               </div>
//             </div>
//           )}

//           {/* ---------------- STEP 2 ---------------- */}
//           {step === 2 && (
//             <div className="space-y-4">

//               <label className="block text-sm font-bold mb-3 text-gray-700">Select Your Skills</label>
//               <div className="grid grid-cols-2 gap-2">
//                 {skillOptions.map((skill) => (
//                   <button
//                     key={skill}
//                     onClick={() => handleSkillToggle(skill)}
//                     className={`px-4 py-2 rounded-lg border-2 transition ${selectedSkills.includes(skill)
//                       ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
//                       : 'border-gray-300 hover:border-gray-400'
//                       }`}
//                   >
//                     {skill}
//                   </button>
//                 ))}
//               </div>

//               <div>
//                 <label className="block text-sm font-bold mb-3 text-gray-700">Experience Level</label>
//                 <select
//                   value={formData.experience}
//                   onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
//                 >
//                   <option value="">Select experience</option>
//                   <option value="beginner">Beginner (0-1 years)</option>
//                   <option value="intermediate">Intermediate (1-3 years)</option>
//                   <option value="advanced">Advanced (3-5 years)</option>
//                   <option value="expert">Expert (5+ years)</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-bold mb-3 text-gray-700">Timezone</label>
//                 <input
//                   type="text"
//                   value={formData.timezone}
//                   onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
//                   placeholder="e.g., IST, PST, EST"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold mb-3 text-gray-700">Preferred Weekly Payout ($)</label>
//                 <input
//                   type="number"
//                   value={formData.preferredWeeklyPayout}
//                   onChange={(e) => setFormData({ ...formData, preferredWeeklyPayout: Number(e.target.value) })}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
//                   placeholder="500"
//                 />
//               </div>

//               <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                 <label className="block text-sm font-bold mb-3 text-gray-700">Gemini API Key (Optional)</label>
//                 <input
//                   type="password"
//                   value={geminiKey}
//                   onChange={(e) => setGeminiKey(e.target.value)}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
//                   placeholder="Enter Gemini API key"
//                 />
//               </div>

//             </div>
//           )}

//           {/* ---------------- STEP 3 ---------------- */}
//           {step === 3 && (
//             <div className="space-y-4">
//               <h3 className="text-lg font-semibold">Knowledge Check</h3>
//               {knowledgeQuestions.map((q, idx) => (
//                 <div key={idx} className="border border-gray-200 rounded-lg p-4">
//                   <p className="font-medium mb-3">{idx + 1}. {q.question}</p>
//                   <div className="space-y-2">
//                     {q.options.map((option: string, optIdx: number) => (
//                       <button
//                         key={optIdx}
//                         onClick={() => {
//                           const newAns = [...answers];
//                           newAns[idx] = optIdx;
//                           setAnswers(newAns);
//                         }}
//                         className={`w-full text-left px-4 py-2 rounded-lg border-2 transition ${answers[idx] === optIdx
//                           ? 'border-indigo-600 bg-indigo-50'
//                           : 'border-gray-300 hover:border-gray-400'
//                           }`}
//                       >
//                         {option}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* BUTTONS */}
//           <div className="mt-6 flex justify-between">
//             {step > 1 && (
//               <Button variant="outline" onClick={() => setStep(step - 1)}>
//                 Back
//               </Button>
//             )}

//             <Button
//               onClick={handleNext}
//               disabled={loading}
//               className={step === 1 ? 'ml-auto' : ''}
//               fullWidth={step === 1}
//             >
//               {loading ? 'Loading...' : step === 3 ? 'Complete Signup' : 'Next'}
//             </Button>
//           </div>

//           <div className="mt-6 text-center">
//             <p className="text-sm text-gray-600">
//               Already have an account?{' '}
//               <Link href="/login" className="text-indigo-600 font-medium">
//                 Login
//               </Link>
//             </p>
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// }














"use client";

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { CheckCircle } from "lucide-react";

// Firebase Auth Providers
import { googleAuth, githubAuth } from "../utils/authProviders";
import { firebaseSignup } from "../utils/authEmailPassword";
import { auth } from "../utils/firebase";

// Firestore
import { db } from "../utils/firebase";
import { doc, setDoc } from "firebase/firestore";

// Local Storage (for dashboard session only)
import { storage } from "../utils/storage";

// Gemini Questions
import { initGemini, generateKnowledgeQuestions } from "../utils/gemini";

// UI
import Button from "../components/Button";
import { User } from "../utils/types";

export default function Signup() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [geminiKey, setGeminiKey] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    skills: [] as string[],
    experience: "",
    timezone: "",
    preferredWeeklyPayout: 500,
  });

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [knowledgeQuestions, setKnowledgeQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const skillOptions = [
    "React", "Node.js", "Python", "Java", "PHP", "Angular", "Vue.js",
    "Video Editing", "Adobe Premiere", "After Effects", "UI/UX Design",
    "Graphic Design", "Content Writing", "Digital Marketing", "SEO"
  ];

  const handleSkillToggle = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  /* ============================================================
     GOOGLE SIGNUP → FIRESTORE
  ============================================================ */
  const handleGoogleSignup = async () => {
    try {
      const result = await googleAuth();
      const user = result.user;

      const newUser: User = {
        id: user.uid,
        email: user.email || "",
        password: "",
        fullName: user.displayName || "",
        phone: "",
        experience: "",
        timezone: "",
        preferredWeeklyPayout: 0,
        skills: [],
        accountStatus: "pending" as const,
        role: "worker" as const,
        knowledgeScore: 0,
        demoTaskCompleted: false,
        createdAt: new Date().toISOString(),
        balance: 0,
      };


      await setDoc(doc(db, "users", user.uid), newUser);
      storage.setCurrentUser(newUser);

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Google signup failed.");
    }
  };

  /* ============================================================
     GITHUB SIGNUP → FIRESTORE
  ============================================================ */
  const handleGithubSignup = async () => {
    try {
      const result = await githubAuth();
      const user = result.user;

      const username =
        user.displayName ||
        (user as any)?.reloadUserInfo?.screenName ||
        user.email?.split("@")[0] ||
        "New User";

      const newUser: User = {
        id: user.uid,
        email: user.email || "",
        password: "",
        fullName: username,
        phone: "",
        experience: "",
        timezone: "",
        preferredWeeklyPayout: 0,
        skills: [],
        accountStatus: "pending" as const,
        role: "worker" as const,
        knowledgeScore: 0,
        demoTaskCompleted: false,
        createdAt: new Date().toISOString(),
        balance: 0,
      };

      await setDoc(doc(db, "users", user.uid), newUser);
      storage.setCurrentUser(newUser);

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("GitHub signup failed");
    }
  };

  /* ============================================================
     EMAIL + PASSWORD SIGNUP (Verification Required)
  ============================================================ */
const handleEmailSignup = async () => {
  try {
    const result = await firebaseSignup(formData.email, formData.password);
    const user = result.user;

    // Send verification email already handled
    alert("Verification email sent! Please check your inbox.");

    // Create Firestore user document
    const newUser = {
      uid: user.uid,
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      phone: formData.phone,
      experience: formData.experience,
      timezone: formData.timezone,
      preferredWeeklyPayout: formData.preferredWeeklyPayout,
      skills: selectedSkills,
      role: "worker",
      accountStatus: "pending",
      knowledgeScore: 0,
      demoTaskCompleted: false,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      balance: 0,
    };

    await setDoc(doc(db, "users", user.uid), newUser);

    router.push("/login");
  } catch (err) {
    console.error(err);
  }
};


  /* ============================================================
     STEP HANDLING
  ============================================================ */
  const handleNext = async () => {
    if (step === 1) {
      if (!formData.email || !formData.password || !formData.fullName || !formData.phone) {
        alert("Please fill all fields");
        return;
      }
      setStep(2);
    }

    else if (step === 2) {
      if (selectedSkills.length === 0 || !formData.experience || !formData.timezone) {
        alert("Please complete all fields");
        return;
      }

      setFormData({ ...formData, skills: selectedSkills });

      if (!geminiKey) {
        alert("Using demo knowledge check");
        setStep(3);
        setKnowledgeQuestions([
          {
            question: "Sample: What is React?",
            options: ["Library", "Framework", "Language", "Database"],
            correctAnswer: 0,
          },
        ]);
        return;
      }

      setLoading(true);
      try {
        initGemini(geminiKey);
        const questions = await generateKnowledgeQuestions(selectedSkills);
        setKnowledgeQuestions(questions);
        setAnswers(new Array(questions.length).fill(-1));
        setStep(3);
      } catch {
        alert("Using fallback question");
        setKnowledgeQuestions([
          {
            question: "Sample: What is React?",
            options: ["Library", "Framework", "Language", "Database"],
            correctAnswer: 0,
          },
        ]);
        setAnswers([0]);
        setStep(3);
      }
      setLoading(false);
    }

    else if (step === 3) {
      const correct = answers.filter(
        (ans, i) => ans === knowledgeQuestions[i].correctAnswer
      ).length;

      const finalScore = (correct / knowledgeQuestions.length) * 100;
      setScore(finalScore);

      if (finalScore < 60) {
        alert("Score too low!");
        return;
      }

      await handleEmailSignup();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 py-12">
      <Head>
        <title>Sign Up - Cehpoint</title>
      </Head>

      <div className="max-w-2xl mx-auto px-4 animate-fade-in">

        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/">
            <span className="text-4xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent cursor-pointer">
              Cehpoint
            </span>
          </Link>

          <h1 className="text-4xl font-black mt-6">Join Our Platform</h1>
          <p className="text-gray-600 mt-3 text-lg">Start your project-based work journey</p>
        </div>

        {/* FORM */}
        <div className="glass-card rounded-3xl premium-shadow p-10">

          {/* Step Indicators */}
          <div className="flex justify-between mb-10">
            {["Basic Info", "Skills", "Verification"].map((label, i) => (
              <div key={i} className={`flex-1 text-center ${step >= i + 1 ? "text-indigo-600" : "text-gray-400"}`}>
                <div
                  className={`w-12 h-12 rounded-full ${step >= i + 1 ? "bg-gradient-to-br from-indigo-600 to-purple-600" : "bg-gray-300"
                    } text-white flex items-center justify-center mx-auto mb-2 font-bold shadow-lg`}
                >
                  {step > i + 1 ? <CheckCircle size={22} /> : i + 1}
                </div>
                <p className="text-sm font-bold">{label}</p>
              </div>
            ))}
          </div>

          {/* ---------------- STEP 1 ---------------- */}
          {step === 1 && (
            <div className="space-y-6">

              {/* OAuth */}
              <div className="space-y-3">
                <button
                  onClick={handleGoogleSignup}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 px-5 py-3 rounded-xl"
                >
                  <img src="/google.png" className="w-5 h-5" />
                  Sign up with Google
                </button>

                <button
                  onClick={handleGithubSignup}
                  className="w-full flex items-center justify-center gap-2 bg-black text-white px-5 py-3 rounded-xl"
                >
                  <img src="/github.png" className="w-5 h-5 invert" />
                  Sign up with GitHub
                </button>
              </div>

              {/* Email Form */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-300" />
                <span className="text-sm text-gray-500">or</span>
                <div className="flex-1 h-px bg-gray-300" />
              </div>

              {/* BASIC FIELDS */}
              <div>
                <label className="block font-bold mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-5 py-4 premium-input rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-5 py-4 premium-input rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-5 py-4 premium-input rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-5 py-4 premium-input rounded-xl"
                />
              </div>

            </div>
          )}

          {/* ---------------- STEP 2 ---------------- */}
          {step === 2 && (
            <div className="space-y-4">
              <label className="font-bold">Select Your Skills</label>

              <div className="grid grid-cols-2 gap-2">
                {skillOptions.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => handleSkillToggle(skill)}
                    className={`px-4 py-2 rounded-lg border-2 ${selectedSkills.includes(skill)
                        ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                        : "border-gray-300"
                      }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>

              <div>
                <label className="block font-bold mb-2">Experience</label>
                <select
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select experience</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-2">Timezone</label>
                <input
                  type="text"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold mb-2">Weekly Payout ($)</label>
                <input
                  type="number"
                  value={formData.preferredWeeklyPayout}
                  onChange={(e) =>
                    setFormData({ ...formData, preferredWeeklyPayout: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold mb-2">Gemini API Key (optional)</label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
          )}

          {/* ---------------- STEP 3 ---------------- */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Knowledge Check</h3>

              {knowledgeQuestions.map((q, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <p className="font-medium mb-3">{q.question}</p>

                  {q.options.map((option: string, optIdx: number) => (
                    <button
                      key={optIdx}
                      onClick={() => {
                        const newAns = [...answers];
                        newAns[idx] = optIdx;
                        setAnswers(newAns);
                      }}
                      className={`w-full text-left px-4 py-2 rounded-lg border-2 mb-2 ${answers[idx] === optIdx
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-300"
                        }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* BUTTONS */}
          <div className="mt-6 flex justify-between">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}

            <Button onClick={handleNext} fullWidth={step === 1}>
              {step === 3 ? "Complete Signup" : "Next"}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-indigo-600 font-medium">
                Login
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}