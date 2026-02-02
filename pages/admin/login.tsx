import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldCheck,
    Lock,
    ArrowRight,
    Eye,
    EyeOff,
    ChevronLeft,
    Command,
    Monitor,
    Activity,
    Cpu
} from "lucide-react";

import Button from "../../components/Button";
import { firebaseLogin } from "../../utils/authEmailPassword";
import { db } from "../../utils/firebase";
import { doc, getDoc } from "firebase/firestore";
import { storage } from "../../utils/storage";
import { User } from "../../utils/types";
import { useUser } from "../../context/UserContext";

export default function AdminLogin() {
    const router = useRouter();
    const { login } = useUser();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Redirect if already logged in as admin
        const currentUser = storage.getCurrentUser();
        if (currentUser && currentUser.role === "admin") {
            router.push("/admin");
        }
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await firebaseLogin(email, password);
            const uid = result.user.uid;

            const snap = await getDoc(doc(db, "users", uid));
            if (!snap.exists()) {
                setError("Admin profile not found.");
                setLoading(false);
                return;
            }

            const user = snap.data();

            if (user.role !== "admin") {
                setError("Access denied. Admin credentials required.");
                setLoading(false);
                return;
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
                role: "admin",
                accountStatus: "active",
                knowledgeScore: 100,
                demoTaskCompleted: true,
                demoTaskScore: 100,
                primaryDomain: "Administration",
                preferredCurrency: user.preferredCurrency || "USD",
                createdAt: user.createdAt || new Date().toISOString(),
                balance: user.balance || 0,
            };

            storage.setCurrentUser(fullUser);
            login(fullUser);
            toast.success("Welcome, Commander.");
            router.push("/admin");
        } catch (err) {
            console.error(err);
            setError("Invalid administrative credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden selection:bg-indigo-500/30">
            <Head>
                <title>Admin Terminal | Cehpoint</title>
            </Head>

            {/* BACKGROUND DECORATIONS */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600 rounded-full blur-[150px]" />
            </div>

            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

            {/* MAIN CONTAINER */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[1000px] h-full max-h-[650px] bg-slate-900 shadow-2xl rounded-[40px] border border-white/10 flex overflow-hidden relative z-10"
            >
                {/* LEFT SIDE: SYSTEM STATS/DECORS */}
                <div className="hidden lg:flex flex-col w-[40%] bg-black/40 border-r border-white/5 p-10 justify-between">
                    <div className="space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                <Command size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white tracking-widest uppercase">Admin</h2>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">Control Panel v2.0</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {[
                                { label: "Security", val: "ENC-LS-256", icon: ShieldCheck, color: "text-emerald-400" },
                                { label: "Status", val: "Operational", icon: Activity, color: "text-indigo-400" },
                                { label: "Uptime", val: "99.99%", icon: Monitor, color: "text-blue-400" },
                                { label: "Kernel", val: "v2.0.4-LTS", icon: Cpu, color: "text-amber-400" }
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 group-hover:border-indigo-500/30 group-hover:text-white transition-all">
                                        <item.icon size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{item.label}</p>
                                        <p className={`text-xs font-bold ${item.color} uppercase tracking-tight`}>{item.val}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Compliance Notice</p>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                            This terminal is for authorized personnel only. All access and activity is logged under the Global Security Protocol.
                        </p>
                    </div>
                </div>

                {/* RIGHT SIDE: LOGIN FORM */}
                <div className="flex-1 p-10 sm:p-16 flex flex-col justify-center relative">
                    <Link href="/login" className="absolute top-8 left-8 text-slate-500 hover:text-white flex items-center gap-2 group transition-colors">
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Worker Login</span>
                    </Link>

                    <div className="max-w-md mx-auto w-full">
                        <div className="mb-10 text-center">
                            <div className="inline-flex w-16 h-16 rounded-[24px] bg-slate-800 border-2 border-slate-700 items-center justify-center text-indigo-400 mb-6 shadow-2xl">
                                <Lock size={28} />
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight mb-2 uppercase">Authenticate</h1>
                            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Administrative Hub Entry</p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-4"
                            >
                                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                <p className="text-xs font-bold text-rose-400 uppercase tracking-tight">{error}</p>
                            </motion.div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Terminal ID (Email)</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-14 bg-white/[0.05] border border-white/10 rounded-2xl px-6 text-white outline-none focus:border-indigo-600 transition-all font-medium text-sm placeholder:text-slate-600"
                                    placeholder="admin@cehpoint.co.in"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Key</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full h-14 bg-white/[0.05] border border-white/10 rounded-2xl px-6 text-white outline-none focus:border-indigo-600 transition-all font-medium text-sm placeholder:text-slate-600 pr-14"
                                        placeholder="••••••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/10 font-black uppercase tracking-[0.2em] text-[11px] mt-4"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                                ) : (
                                    <span className="flex items-center justify-center gap-3">
                                        Verify Credentials <ArrowRight size={18} />
                                    </span>
                                )}
                            </Button>
                        </form>

                        <div className="mt-12 text-center border-t border-white/5 pt-8">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                System Time: <span className="text-slate-400">{new Date().toLocaleTimeString()}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* FOOTER INFO */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-8 opacity-40">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">&copy; 2024 CEHPOINT CORP</p>
                <div className="w-1 h-1 bg-slate-700 rounded-full" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">SECURE PORTAL</p>
            </div>
        </div>
    );
}
