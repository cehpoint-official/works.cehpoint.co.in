"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import {
    CheckCircle2,
    TrendingUp,
    Layout,
    Globe,
    ArrowUpRight,
} from "lucide-react";

/* ================= DATA ================= */
const PROJECTS = [
    { id: 1, title: "AI Model Training", client: "DeepMind", status: "Reviewing", color: "bg-rose-500" },
    { id: 2, title: "React Dashboard", client: "Cehpoint Internal", status: "In Progress", color: "bg-blue-500" },
    { id: 3, title: "Smart Contract Audit", client: "DefiProtocol", status: "Pending", color: "bg-amber-500" },
];

/* ================= ANIMATED NUMBER ================= */
const AnimatedNumber = ({ value }: { value: number }) => {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        let start = 0;
        const duration = 1500;
        const startTime = performance.now();

        const animate = (time: number) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out quart
            const ease = 1 - Math.pow(1 - progress, 4);

            setDisplay(start + (value - start) * ease);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value]);

    return (
        <span className="tabular-nums">
            ${display.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
    );
};

/* ================= SCREEN CONTENT ================= */
const ScreenContent = () => (
    <div className="w-full h-full flex flex-col p-6 font-sans">
        {/* Header */}
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex items-center justify-between mb-8"
        >
            <div className="flex items-center">
                <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
                    Cehpoint<span className="text-indigo-600">Work</span>
                </span>
            </div>
            <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-200" />
                <div className="w-6 h-6 rounded-full bg-slate-200" />
            </div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-4 flex-1">
            {/* Left */}
            <div className="col-span-7 flex flex-col gap-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group text-white"
                >
                    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                    </div>

                    <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">
                        Total Earnings
                    </div>
                    <div className="text-3xl font-bold text-white mt-1 tracking-tight">
                        <AnimatedNumber value={12450.00} />
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: "auto", opacity: 1 }}
                            transition={{ delay: 1.5, duration: 0.5 }}
                            className="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-md text-[10px] font-medium flex items-center gap-1 overflow-hidden whitespace-nowrap border border-emerald-500/30"
                        >
                            <TrendingUp className="w-3 h-3" /> +12.5%
                        </motion.div>
                        <span className="text-[10px] text-slate-400 font-medium">this month</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm h-24 flex flex-col justify-center relative overflow-hidden"
                >
                    <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-full blur-2xl -mr-10 -mt-10" />

                    <div className="flex items-center justify-between mb-3 relative z-10">
                        <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                            Active Tasks
                        </div>
                        <ArrowUpRight className="w-3 h-3 text-slate-400" />
                    </div>
                    <div className="space-y-3 relative z-10">
                        <div className="flex justify-between text-[9px] mb-1 font-medium text-slate-600">
                            <span>Frontend Dev</span>
                            <span>66%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "66%" }}
                                transition={{ delay: 1.2, duration: 1, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                            />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Right */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="col-span-5 bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-3"
            >
                <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">
                    Your Projects
                </div>
                {PROJECTS.map((p, i) => (
                    <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 + (i * 0.15), duration: 0.4 }}
                        className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex items-center gap-3 hover:shadow-md transition-all hover:border-indigo-100 cursor-pointer group"
                    >
                        <div className={`w-2 h-8 rounded-full ${p.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                        <div className="flex-1">
                            <div className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">
                                {p.title}
                            </div>
                            <div className="text-[9px] text-slate-400 flex justify-between items-center mt-0.5">
                                <span>{p.client}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-medium ${p.status === "Reviewing" ? "bg-amber-50 text-amber-600" :
                                    p.status === "In Progress" ? "bg-blue-50 text-blue-600" :
                                        "bg-slate-100 text-slate-500"
                                    }`}>{p.status}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    </div>
);

/* ================= COMPONENT: CURSOR & NOTIFICATION ================= */
const NotificationSequence = () => {
    const cursorControls = useAnimation();

    useEffect(() => {
        const sequence = async () => {
            // Appear
            await cursorControls.start({ opacity: 1, x: 50, y: 150, transition: { duration: 0.5 } });
            // Move to click
            await cursorControls.start({ x: -120, y: -80, transition: { duration: 1, ease: "easeInOut", delay: 0.8 } });
            // Click Down
            await cursorControls.start({ scale: 0.8, transition: { duration: 0.1 } });
            // Click Up
            await cursorControls.start({ scale: 1, transition: { duration: 0.1 } });
            // Move away
            await cursorControls.start({ x: 100, y: 100, opacity: 0, transition: { duration: 0.8, delay: 0.5 } });
        };
        sequence();
    }, [cursorControls]);

    return (
        <>
            {/* Simulated Cursor */}
            <motion.div
                initial={{ x: 100, y: 100, opacity: 0 }}
                animate={cursorControls}
                className="absolute z-[60] pointer-events-none"
            >
                <div className="relative">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                        <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19177L11.7841 12.3673H5.65376Z" fill="black" stroke="white" strokeWidth="1.5" />
                    </svg>
                    {/* Click Ripple */}
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 2.5], opacity: [0.5, 0] }}
                        transition={{ delay: 2.3, duration: 0.6 }}
                        className="absolute top-0 left-0 w-8 h-8 -ml-3 -mt-3 bg-indigo-500/20 rounded-full pointer-events-none"
                    />
                </div>
            </motion.div>

            {/* Notification Popup */}
            <motion.div
                initial={{ y: -20, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 2.4, duration: 0.5, type: "spring", bounce: 0.4 }}
                className="absolute top-6 right-6 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-100 rounded-2xl p-4 flex gap-4 w-72 z-50 ring-1 ring-black/5 overflow-hidden group"
            >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start mb-0.5">
                        <span className="text-[12px] font-bold text-slate-800">Payment Released</span>
                        <span className="text-[10px] text-slate-400">now</span>
                    </div>
                    <div className="text-[11px] leading-relaxed text-slate-500">
                        <span className="font-bold text-slate-700">DeepMind</span> has sent <span className="text-emerald-600 font-bold">$2,450.00</span> to your balance.
                    </div>
                    <div className="mt-3 flex gap-2">
                        <button className="flex-1 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
                            View Transaction
                        </button>
                        <button className="px-3 py-1.5 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-bold border border-slate-100 hover:bg-slate-100 transition-colors">
                            Dismiss
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

/* ================= HERO ================= */
export default function HeroAnimation() {
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        const t1 = setTimeout(() => setPhase(1), 100);
        const t2 = setTimeout(() => setPhase(2), 800);
        const t3 = setTimeout(() => setPhase(3), 1800);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, []);

    return (
        <div className="relative w-full min-h-[600px] overflow-visible flex items-center justify-center">
            {/* Ground shadow */}
            <div className="absolute top-[65%] left-1/2 -translate-x-1/2 w-[420px] h-[60px] bg-black/20 blur-[50px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative perspective-[2000px]"
            >
                <motion.div
                    style={{ transformStyle: "preserve-3d" }}
                    initial={{ rotateX: 18, rotateY: -8 }}
                    animate={{
                        rotateX: 8,
                        rotateY: -4,
                        y: [0, -6, 0],
                    }}
                    transition={{
                        rotateX: { duration: 1.4 },
                        rotateY: { duration: 1.4 },
                        y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                    }}
                >
                    {/* Tablet Frame */}
                    <div className="relative w-[640px] h-[420px] bg-[#0f0f12] rounded-[32px] p-[10px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-[#2a2a2e]">
                        {/* Camera Notch Area (hidden under glass mostly but gives realism) */}
                        <div className="absolute top-[10px] left-1/2 -translate-x-1/2 h-[20px] w-[120px] bg-black rounded-b-xl z-50 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] ring-1 ring-[#333]" />
                        </div>

                        <div className="relative w-full h-full bg-[#1c1c1f] rounded-[24px] overflow-hidden highlight-white/10">

                            {/* Screen */}
                            <motion.div
                                initial={{ filter: "brightness(0.6)" }}
                                animate={{
                                    filter: phase >= 2 ? "brightness(1)" : "brightness(0.6)",
                                }}
                                transition={{ duration: 0.6 }}
                                className="w-full h-full bg-[#f8fafc] relative overflow-hidden"
                            >
                                <ScreenContent />
                                {phase >= 3 && <NotificationSequence />}

                                {/* Glass Reflection Overlay */}
                                <div className="absolute inset-0 z-40 bg-gradient-to-tr from-white/5 via-white/0 to-transparent pointer-events-none" />
                                <div className="absolute -top-[100%] -left-[100%] w-[200%] h-[200%] bg-gradient-to-b from-white/10 to-transparent transform -rotate-45 pointer-events-none" />
                            </motion.div>

                            {/* Screen Off Overlay */}
                            <AnimatePresence>
                                {phase < 2 && (
                                    <motion.div
                                        className="absolute inset-0 bg-black z-20"
                                        initial={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
