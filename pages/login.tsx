import { useState } from "react";
import { toast } from "react-hot-toast";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  BadgeCheck,
  Zap,
  ArrowLeft,
  Mail,
  X
} from "lucide-react";

import Button from "../components/Button";
import { firebaseLogin, firebaseForgotPassword } from "../utils/authEmailPassword";
import { googleAuth } from "../utils/authProviders";
import { db } from "../utils/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { storage } from "../utils/storage";
import { User } from "../utils/types";
import { useUser } from "../context/UserContext";

export default function Login() {
  const router = useRouter();
  const { login } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await firebaseLogin(email, password);
      const uid = result.user.uid;

      if (!result.user.emailVerified) {
        setError("Please verify your email first.");
        setLoading(false);
        return;
      }

      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) {
        setError("User profile not found in database.");
        setLoading(false);
        return;
      }

      const user = snap.data();

      // 🔹 Check Account Status
      if (user.accountStatus === "suspended" || user.accountStatus === "terminated") {
        const msg = user.accountStatus === "suspended"
          ? "Your account has been suspended. Please contact support."
          : "Your account has been terminated.";
        setError(msg);
        setLoading(false);
        return;
      }

      // 🔹 Extra security: check blocklist
      const isBlocked = await storage.isEmailBlocked(email);
      if (isBlocked) {
        setError("This email address has been restricted.");
        setLoading(false);
        return;
      }

      if (user.emailVerified === false && result.user.emailVerified) {
        await updateDoc(doc(db, "users", uid), { emailVerified: true });
        user.emailVerified = true;
      }

      const fullUser: User = {
        id: uid,
        email: user.email || "",
        fullName: user.fullName || "",
        password: "",
        phone: user.phone || "",
        skills: user.skills || [],
        experience: user.experience || "",
        timezone: user.timezone || "",
        preferredWeeklyPayout: user.preferredWeeklyPayout || 0,
        role: user.role || "worker",
        accountStatus: user.accountStatus || "pending",
        knowledgeScore: user.knowledgeScore || 0,
        demoTaskCompleted: user.demoTaskCompleted || false,
        demoTaskScore: user.demoTaskScore || 0,
        primaryDomain: user.primaryDomain || "",
        preferredCurrency: user.preferredCurrency || "INR",
        createdAt: user.createdAt || new Date().toISOString(),
        balance: user.balance || 0,
        emailVerified: user.emailVerified ?? true,
      };

      storage.setCurrentUser(fullUser);
      login(fullUser);
      toast.success("Welcome back!");
      router.push(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      console.error(err);
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await googleAuth();
      const fbUser = result.user;
      const uid = fbUser.uid;

      let snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) {
        const usersCol = collection(db, "users");
        const qByUid = query(usersCol, where("uid", "==", uid));
        const qSnap = await getDocs(qByUid);
        if (!qSnap.empty) snap = qSnap.docs[0];
        else {
          if (fbUser.email) {
            const qByEmail = query(usersCol, where("email", "==", fbUser.email));
            const emailSnap = await getDocs(qByEmail);
            if (!emailSnap.empty) snap = emailSnap.docs[0];
            else {
              setError("Account does not exist. Please sign up first.");
              setLoading(false);
              return;
            }
          } else {
            setError("Account does not exist. Please sign up first.");
            setLoading(false);
            return;
          }
        }
      }

      const user = snap.data();
      const userId = snap.id;

      // 🔹 Check Account Status
      if (user.accountStatus === "suspended" || user.accountStatus === "terminated") {
        const msg = user.accountStatus === "suspended"
          ? "Your account has been suspended. Please contact support."
          : "Your account has been terminated.";
        setError(msg);
        setLoading(false);
        return;
      }

      // 🔹 Check blocklist (Google email might be different or same)
      const userEmail = user.email || fbUser.email;
      if (userEmail) {
        const isBlocked = await storage.isEmailBlocked(userEmail);
        if (isBlocked) {
          setError("This account has been restricted.");
          setLoading(false);
          return;
        }
      }

      const fullUser: User = {
        id: userId,
        email: user.email || fbUser.email || "",
        fullName: user.fullName || fbUser.displayName || "",
        password: "",
        phone: user.phone || "",
        skills: user.skills || [],
        experience: user.experience || "",
        timezone: user.timezone || "",
        preferredWeeklyPayout: user.preferredWeeklyPayout || 0,
        role: user.role || "worker",
        accountStatus: user.accountStatus || "pending",
        knowledgeScore: user.knowledgeScore || 0,
        demoTaskCompleted: user.demoTaskCompleted || false,
        demoTaskScore: user.demoTaskScore || 0,
        primaryDomain: user.primaryDomain || "",
        preferredCurrency: user.preferredCurrency || "INR",
        createdAt: user.createdAt || new Date().toISOString(),
        balance: user.balance || 0,
        emailVerified: user.emailVerified ?? true,
      };

      storage.setCurrentUser(fullUser);
      login(fullUser);
      toast.success("Login Successful");
      router.push(fullUser.role === "admin" ? "/admin" : "/dashboard");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Google Login Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error("Please enter your email address.");
      return;
    }

    setResetLoading(true);
    try {
      await firebaseForgotPassword(forgotEmail);
      toast.success("Password reset email sent! Check your inbox.");
      setShowForgotModal(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to send reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white selection:bg-indigo-100 selection:text-indigo-900">
      <Head>
        <title>Login | Cehpoint Work</title>
      </Head>

      {/* LEFT SIDE: VISUAL & DECORATIVE */}
      <div className="hidden md:flex md:w-[45%] lg:w-[40%] bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white border-r border-white/5">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Top: Logo */}
        <Link href="/" className="relative z-10 flex items-center group">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold text-slate-200 tracking-tight">Work Portal</span>
          </div>
        </Link>

        {/* Middle: Content */}
        <div className="relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
              Empowering the <br />
              <span className="text-indigo-400">top 1% talent</span> <br />
              globally.
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
              Premium project work with guaranteed weekly payouts and enterprise-grade tools.
            </p>
          </motion.div>

          {/* Testimonial / Features */}
          <div className="space-y-4">
            {[
              { icon: BadgeCheck, label: "Verified Project Stream", color: "blue" },
              { icon: Zap, label: "Weekly Friday Payouts", color: "amber" },
              { icon: ShieldCheck, label: "Secure Client Contracts", color: "emerald" }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (idx * 0.1) }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors group"
              >
                <div className={`p-2.5 rounded-xl bg-${item.color}-500/10 text-${item.color}-400 group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-slate-200">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom: Footer Info */}
        <div className="relative z-10">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Cehpoint Official
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: LOGIN FORM */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-20 bg-slate-50/30">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="mb-10">
            <div className="mb-8 flex justify-center md:hidden">
              <Link href="/">
                <span className="text-3xl font-black text-slate-900">
                  Cehpoint <span className="text-indigo-600">Work</span>
                </span>
              </Link>
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Welcome back</h1>
            <p className="text-slate-500 font-medium">Please enter your details to sign in.</p>
          </div>

          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mb-8 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <input
                type="email"
                placeholder="Enter email address"
                autoComplete="email"
                className="premium-input w-full py-4 px-5 rounded-2xl border-slate-200 outline-none focus:border-indigo-600 transition-all font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="premium-input w-full py-4 px-5 rounded-2xl border-slate-200 outline-none focus:border-indigo-600 transition-all font-medium pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              className="h-14 rounded-2xl text-base shadow-xl shadow-indigo-600/20"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Sign In <ArrowRight size={18} />
                </span>
              )}
            </Button>
          </form>

          {/* OR Divider */}
          <div className="my-10 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">OR LOGIN WITH</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Social Logins */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 bg-white border border-slate-200 py-3.5 rounded-2xl hover:bg-slate-50 transition-all font-bold text-sm text-slate-700 group h-14"
            >
              <img src="/google.png" className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Sign in with Google
            </button>
          </div>

          {/* Bottom Link */}
          <div className="mt-12 text-center">
            <p className="text-slate-500 font-medium">
              New here?{" "}
              <Link
                href="/signup"
                className="text-indigo-600 font-black hover:text-indigo-700 underline underline-offset-4 decoration-indigo-200"
              >
                Apply for an Account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
            >
              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-16 -mt-16" />

              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Mail size={24} />
                </div>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Recover Password</h3>
              <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter registered email"
                    className="premium-input w-full py-4 px-5 rounded-2xl border-slate-200 outline-none focus:border-indigo-600 transition-all font-medium shadow-sm"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  fullWidth
                  disabled={resetLoading}
                  className="h-14 rounded-2xl shadow-lg shadow-indigo-600/10"
                >
                  {resetLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}