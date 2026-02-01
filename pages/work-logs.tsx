// pages/work-logs.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { motion } from "framer-motion";

import Layout from "../components/Layout";
import DailySubmissionForm from "../components/DailySubmission";
import SubmissionHistory from "../components/SubmissionHistory";

import { storage } from "../utils/storage";
import type { User, DailySubmission } from "../utils/types";

import {
    Calendar,
    History
} from "lucide-react";

export default function WorkLogs() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [mySubmissions, setMySubmissions] = useState<DailySubmission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const current = storage.getCurrentUser();
        if (!current) {
            router.push("/login");
            return;
        }
        if (current.role !== "worker") {
            router.push("/admin");
            return;
        }

        setUser(current);
        loadSubmissions(current.id);
    }, []);

    const loadSubmissions = async (userId: string) => {
        try {
            setLoading(true);
            const subs = await storage.getSubmissionsByUser(userId);
            setMySubmissions(subs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Layout>
            <Head>
                <title>Work Logs - Cehpoint</title>
            </Head>

            <div className="max-w-5xl mx-auto space-y-12 pb-20">
                {/* HEADER */}
                <section className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-10 md:p-14 text-white border border-white/5 shadow-2xl">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -mr-40 -mt-20" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md"
                            >
                                <Calendar size={12} className="text-indigo-400" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Your Work</span>
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-4xl md:text-5xl font-black tracking-tight"
                            >
                                Daily <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Work Logs</span>
                            </motion.h1>
                            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-2xl">
                                Record your work history every day. This helps us calculate your payments correctly and track your progress.
                            </p>
                        </div>
                    </div>
                </section>

                {/* LOG FORM */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <DailySubmissionForm userId={user.id} onSubmit={() => loadSubmissions(user.id)} />
                </motion.div>

                {/* HISTORY */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-8"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm">
                            <History size={20} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Past Submissions</h2>
                            <p className="text-slate-400 text-sm font-medium">Look at your previous work logs and any feedback you received.</p>
                        </div>
                    </div>

                    <SubmissionHistory submissions={mySubmissions} />
                </motion.div>
            </div>
        </Layout>
    );
}
