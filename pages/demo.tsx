import React, { Suspense, useRef, useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { Canvas, useFrame } from "@react-three/fiber";
import {
    Float,
    MeshDistortMaterial,
    Environment,
    ContactShadows,
    Sparkles,
    Html,
    PerspectiveCamera,
    Stars,
    Text,
    MeshWobbleMaterial
} from "@react-three/drei";
import * as THREE from "three";
import { motion, useScroll, useTransform, useSpring, AnimatePresence, useVelocity } from "framer-motion";
import { RotateCcw, ArrowRight, ShieldCheck, Zap, Globe, Code, Cpu, Activity, Lock, Target, MousePointer2, ChevronDown, Rocket, Search, UserCheck, DollarSign, Volume2, VolumeX, Monitor } from "lucide-react";

/* ================= 3D ELEMENTS ================= */

const InteractiveCore = ({ progress }: { progress: any }) => {
    const meshRef = useRef<THREE.Mesh>(null!);
    const ringRef = useRef<THREE.Group>(null!);
    const [hovered, setHover] = useState(false);

    useFrame((state) => {
        const p = progress.get();
        const t = state.clock.getElapsedTime();

        // Scale and position based on scroll + hover
        const targetScale = p < 0.3 ? 1 + (p / 0.3) * 1.5 :
            p < 0.6 ? 2.5 - ((p - 0.3) / 0.3) * 2 :
                0.5 + ((p - 0.6) / 0.4) * 4;

        const hoverScale = hovered ? 1.2 : 1;
        const finalScale = targetScale * hoverScale;

        // Smooth Lerp for scale
        meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, finalScale, 0.1);
        meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, finalScale, 0.1);
        meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, finalScale, 0.1);

        // Dynamic rotation with smoothing
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, p * Math.PI * 6 + t * 0.2, 0.1);
        meshRef.current.rotation.x = t * 0.3 + Math.sin(t) * 0.1;

        // Ring rotation
        if (ringRef.current) {
            ringRef.current.rotation.z = t * 0.5;
            ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.5) * 0.2;
            const ringTargetScale = finalScale * 1.4;
            ringRef.current.scale.setScalar(THREE.MathUtils.lerp(ringRef.current.scale.x, ringTargetScale, 0.1));
        }
    });

    return (
        <group>
            <mesh
                ref={meshRef}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
            >
                <icosahedronGeometry args={[1, 15]} />
                <MeshDistortMaterial
                    color={hovered ? "#6366f1" : "#4f46e5"}
                    speed={hovered ? 4 : 2}
                    distort={0.4}
                    radius={1}
                    emissive={hovered ? "#4f46e5" : "#4338ca"}
                    emissiveIntensity={0.8}
                />
            </mesh>

            {/* Outer Tech Ring */}
            <group ref={ringRef}>
                <mesh>
                    <torusGeometry args={[1.2, 0.02, 16, 100]} />
                    <meshStandardMaterial color="#818cf8" emissive="#4f46e5" emissiveIntensity={2} transparent opacity={0.6} />
                </mesh>
                {/* Orbits */}
                {[0, 1, 2].map((i) => (
                    <mesh key={i} position={[Math.cos(i * 2.1) * 1.2, Math.sin(i * 2.1) * 1.2, 0]}>
                        <sphereGeometry args={[0.05, 16, 16]} />
                        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
                    </mesh>
                ))}
            </group>
        </group>
    );
};

const AnimatedSparkles = ({ progress }: { progress: any }) => {
    const sparklesRef = useRef<any>(null!);
    const opacity = useTransform(progress, [0.8, 0.9], [0, 1]);

    useFrame(() => {
        if (sparklesRef.current) {
            sparklesRef.current.opacity = opacity.get();
        }
    });

    return <Sparkles ref={sparklesRef} count={500} scale={20} size={2} speed={0.5} color="#ffffff" />;
};

const AnimatedText = ({ value, suffix = "" }: { value: any, suffix?: string }) => {
    const ref = useRef<HTMLSpanElement>(null!);
    useEffect(() => {
        return value.on("change", (latest: any) => {
            if (ref.current) ref.current.textContent = latest + suffix;
        });
    }, [value, suffix]);
    return <span ref={ref}>{value.get()}{suffix}</span>;
};

const LiquidAudioController = ({ isMuted, scrollVelocity, ambientRef, flowRef }: any) => {
    useFrame(() => {
        if (isMuted) return;
        const velocity = Math.abs(scrollVelocity.get());

        if (ambientRef.current) {
            ambientRef.current.volume = 0.15;
        }

        if (flowRef.current) {
            const targetVol = Math.min(0.5, velocity * 8);
            flowRef.current.volume = THREE.MathUtils.lerp(flowRef.current.volume, targetVol, 0.1);
            flowRef.current.playbackRate = 0.8 + (velocity * 2);
        }
    });
    return null;
};

const MobileProhibitionHUD = () => (
    <div className="fixed inset-0 z-[100] bg-[#020617] flex flex-col items-center justify-between p-8 py-12 text-center overflow-y-auto font-sans">
        {/* Abstract Background Texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-transparent to-[#020617]" />

        {/* Subtle Ambient Glows - Fixed position relative to viewport */}
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-[100%] rotate-12 pointer-events-none" />

        <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[400px]">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-sm relative z-10 space-y-10"
            >
                {/* Minimalist Icon */}
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full" />
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/80 relative backdrop-blur-sm">
                        <Monitor className="w-7 h-7 stroke-[1.5]" />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.4em] inline-block py-1 border-b border-indigo-500/30">
                        Desktop Optimized
                    </div>
                    <h2 className="text-3xl font-light text-white tracking-tight leading-tight">
                        Premium <br />
                        <span className="font-bold">Workstation Access</span>
                    </h2>
                </div>

                <p className="text-slate-400 text-sm leading-relaxed max-w-[280px] mx-auto font-medium opacity-60">
                    To maintain our high-fidelity workspace standards, this portal is exclusive to desktop browsers.
                </p>

                <div className="pt-2 flex flex-col items-center gap-6">
                    <div className="flex gap-2">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="w-1 h-1 rounded-full bg-white/20" />
                        ))}
                    </div>

                    <Link href="/" className="group flex items-center gap-3 px-8 py-3 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] hover:text-white hover:bg-white/10 transition-all duration-300">
                        <RotateCcw className="w-3.5 h-3.5" />
                        Back to Terminal
                    </Link>
                </div>
            </motion.div>
        </div>

        {/* Minimal Bottom Deco - Now part of flow to prevent overlap */}
        <div className="pt-12 flex items-center gap-4 opacity-10">
            <div className="w-8 h-[1px] bg-white" />
            <div className="text-[8px] font-black uppercase tracking-[0.5em] text-white">Cehpoint Systems</div>
            <div className="w-8 h-[1px] bg-white" />
        </div>
    </div>
);

/* ================= HUD COMPONENTS ================= */

const HUD = ({ progress, isMuted, setIsMuted }: { progress: any, isMuted: boolean, setIsMuted: (v: boolean) => void }) => {
    const pVal = useTransform(progress, [0, 1], [0, 100]);
    const systemStatus = useTransform(progress, [0, 0.3, 0.6, 1], ["INITIALIZING", "STREAMS_ACTIVE", "PORTAL_OPEN", "ASCENDING"]);
    const syncProgress = useTransform(pVal, (v) => Math.round(v));
    const syncWidth = useTransform(pVal, (v) => `${v}%`);
    const [hex, setHex] = useState("0x000000");

    useEffect(() => {
        const interval = setInterval(() => {
            setHex("0x" + Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, '0'));
        }, 150);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-40 p-8 sm:p-12 overflow-hidden selection:bg-none">
            {/* HUD Corner Frames */}
            <div className="absolute top-0 left-0 w-32 h-32 border-l border-t border-white/10" />
            <div className="absolute top-0 right-0 w-32 h-32 border-r border-t border-white/10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 border-l border-b border-white/10" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-r border-b border-white/10" />

            {/* Top Corners */}
            <div className="absolute top-12 left-12 flex items-center gap-6">
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex items-center justify-center text-white pointer-events-auto hover:bg-white/10 transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)] group"
                >
                    {isMuted ? <VolumeX className="w-6 h-6 text-rose-400" /> : <Volume2 className="w-6 h-6 text-indigo-400 animate-pulse" />}
                </button>
                <div className="hidden sm:block">
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-1">Audio Engine</div>
                    <div className="text-[10px] font-mono font-bold text-indigo-400 tabular-nums">
                        {isMuted ? "READY_STANDBY" : "CORE_AUDIO_LIVE"}
                    </div>
                </div>
            </div>

            <div className="absolute top-8 right-8 flex items-end flex-col">
                <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">Sync Progress</div>
                <div className="flex items-center gap-3">
                    <div className="text-xl font-black text-white tabular-nums">
                        <AnimatedText value={syncProgress} suffix="%" />
                    </div>
                    <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div style={{ width: syncWidth }} className="h-full bg-indigo-500" />
                    </div>
                </div>
            </div>

            {/* Bottom Deco */}
            <div className="absolute bottom-8 left-8 hidden lg:block">
                <div className="flex gap-4">
                    {[Lock, Cpu, Globe].map((Icon, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                                <Icon className="w-4 h-4" />
                            </div>
                            <div className="w-[1px] h-4 bg-white/10" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="absolute bottom-8 right-8 hidden sm:block">
                <div className="text-right">
                    <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">Cehpoint Protocol</div>
                    <div className="text-[9px] font-bold text-indigo-400">ENCRYPTION: AES-256 ACTIVE</div>
                </div>
            </div>

            {/* Scanning & Noise Overlay */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
        </div>
    );
};

/* ================= MAIN EXPERIENCE ================= */

export default function EnhancedExperience() {
    const [isMounted, setIsMounted] = useState(false);
    const [isDesktop, setIsDesktop] = useState(true);

    useEffect(() => {
        setIsMounted(true);
        const checkScreen = () => setIsDesktop(window.innerWidth >= 1024);
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    const { scrollYProgress } = useScroll();

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 40,
        damping: 25,
        restDelta: 0.0001
    });

    const sparkleOpacity = useTransform(smoothProgress, [0.8, 0.92], [0, 1]);
    const finalOpacity = useTransform(smoothProgress, [0.97, 1], [0, 1]);
    const finalPointerEvents = useTransform(smoothProgress, [0.97, 1], ["none", "auto"]);

    const [isMuted, setIsMuted] = useState(true);
    const ambientRef = useRef<HTMLAudioElement>(null!);
    const flowRef = useRef<HTMLAudioElement>(null!);
    const lastPhase = useRef(-1);

    const scrollVelocity = useVelocity(smoothProgress);

    useEffect(() => {
        if (!isMuted) {
            ambientRef.current?.play().catch(() => { });
            flowRef.current?.play().catch(() => { });
        } else {
            ambientRef.current?.pause();
            flowRef.current?.pause();
        }
    }, [isMuted]);

    useEffect(() => {
        const unsubscribe = smoothProgress.on("change", (v) => {
            const currentPhase = v < 0.25 ? 0 : v < 0.5 ? 1 : v < 0.75 ? 2 : v < 0.95 ? 3 : 4;
            if (currentPhase !== lastPhase.current) {
                lastPhase.current = currentPhase;
            }
        });
        return () => unsubscribe();
    }, [smoothProgress]);

    if (!isMounted) return (
        <div className="h-screen w-full bg-[#020617] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
        </div>
    );

    if (!isDesktop) return <MobileProhibitionHUD />;

    return (
        <div className="relative h-[1000vh] bg-[#020617] font-sans overflow-x-hidden">
            <Head>
                <title>Immersive Hub | Cehpoint Work</title>
            </Head>

            {/* 3D Scene */}
            <div className="fixed inset-0 z-10">
                <Canvas dpr={[1, 2]}>
                    <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={45} />

                    <Suspense fallback={null}>
                        <Stars radius={150} depth={50} count={7000} factor={4} saturation={0} fade speed={1} />

                        <group>
                            <InteractiveCore progress={smoothProgress} />

                            {/* Hub Section - Pure Visuals */}
                            <group>
                                <Sparkles count={500} scale={20} size={2} speed={0.5} opacity={smoothProgress.get() > 0.4 ? 1 : 0} color="#ffffff" />
                            </group>

                            {/* Sparkle Field on Final Transition */}
                            <AnimatedSparkles progress={smoothProgress} />

                            <LiquidAudioController
                                isMuted={isMuted}
                                scrollVelocity={scrollVelocity}
                                ambientRef={ambientRef}
                                flowRef={flowRef}
                            />
                        </group>

                        <Environment preset="night" />
                        <ContactShadows position={[0, -8, 0]} opacity={0.4} scale={30} blur={2.5} far={15} />
                    </Suspense>
                </Canvas>
            </div>

            <HUD progress={smoothProgress} isMuted={isMuted} setIsMuted={setIsMuted} />

            {/* Liquid Audio Engine */}
            <audio ref={ambientRef} loop preload="auto" src="https://assets.mixkit.co/active_storage/sfx/2529/2529-preview.mp3" />
            <audio ref={flowRef} loop preload="auto" src="https://assets.mixkit.co/active_storage/sfx/2556/2556-preview.mp3" />

            {/* Narrative Scrolling Sections */}
            {[
                {
                    range: [0, 0.25],
                    title: "Clients, Managed.",
                    desc: "We handle the clients and the contracts. No more pitching or price wars—just log in, see your assigned tasks, and start building.",
                    icon: ShieldCheck
                },
                {
                    range: [0.25, 0.5],
                    title: "Earn from Day 1.",
                    desc: "If you have the potential, we have the projects. No long interviews or wait-lists. Start earning high-value rewards from your first hour.",
                    icon: Rocket
                },
                {
                    range: [0.5, 0.75],
                    title: "Talent Driven.",
                    desc: "We evaluate every task to ensure the best work goes to the best workers. Your skills alone define your access to elite projects.",
                    icon: Cpu
                },
                {
                    range: [0.75, 0.95],
                    title: "Guaranteed Pay.",
                    desc: "No more chasing invoices. We verify the code and send your earnings directly to your bank account every single week.",
                    icon: DollarSign
                }
            ].map((section, idx) => (
                <SectionOverlay
                    key={idx}
                    range={section.range as [number, number]}
                    progress={smoothProgress}
                    title={section.title}
                    desc={section.desc}
                    Icon={section.icon}
                />
            ))}

            {/* Final Call to Action */}
            <motion.div
                style={{
                    opacity: finalOpacity,
                    pointerEvents: finalPointerEvents as any
                }}
                className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-[#020617]/90 backdrop-blur-3xl px-6 text-center"
            >
                <motion.div className="max-w-3xl">
                    <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white mx-auto mb-12 shadow-[0_0_80px_rgba(79,70,229,0.4)] animate-pulse">
                        <Target className="w-12 h-12" />
                    </div>
                    <h2 className="text-5xl sm:text-8xl font-[1000] mb-6 tracking-tighter uppercase leading-[0.9] text-white">
                        Ascend to <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-400 to-white/40">Elite Status.</span>
                    </h2>
                    <p className="text-lg sm:text-xl text-slate-400 mb-12 font-medium max-w-xl mx-auto tracking-tight leading-relaxed">
                        Trade the stress of typical freelancing for a direct stream of verified project work.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Link href="/signup" className="group relative px-14 py-7 bg-indigo-600 text-white rounded-full font-black uppercase tracking-[0.2em] shadow-[0_20px_60px_-15px_rgba(79,70,229,0.5)] hover:scale-105 transition-all flex items-center gap-4 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            Apply for Access <ArrowRight className="w-6 h-6" />
                        </Link>
                        <Link href="/" className="px-14 py-7 bg-white/5 border border-white/10 text-white rounded-full font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center gap-4">
                            <RotateCcw className="w-6 h-6" /> Return
                        </Link>
                    </div>
                </motion.div>
            </motion.div>

            {/* Global Aesthetics */}
            <style jsx global>{`
        body { margin: 0; background: #020617; overflow-x: hidden; }
        ::-webkit-scrollbar { width: 0px; }
        @font-face {
            font-family: 'Space Grotesk';
            font-display: swap;
        }
      `}</style>
        </div>
    );
}

const SectionOverlay = ({ title, desc, progress, range, Icon }: { title: string, desc: string, progress: any, range: [number, number], Icon: any }) => {
    const opacity = useTransform(progress, [range[0], range[0] + 0.08, range[1] - 0.08, range[1]], [0, 1, 1, 0]);
    const scale = useTransform(progress, [range[0], range[0] + 0.08, range[1] - 0.08, range[1]], [0.98, 1, 1, 0.98]);
    const y = useTransform(progress, [range[0], range[0] + 0.08, range[1] - 0.08, range[1]], [30, 0, 0, -30]);

    return (
        <motion.div
            style={{ opacity, scale, y }}
            className="fixed inset-0 flex flex-col items-center justify-center px-10 text-center pointer-events-none z-30"
        >
            <div className="max-w-5xl relative">
                {/* Method Icon / Engaging Visual */}
                <motion.div
                    initial={{ rotate: -15, scale: 0.8, opacity: 0 }}
                    whileInView={{ rotate: 0, scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-white mx-auto mb-12 shadow-[0_32px_64px_-16px_rgba(79,70,229,0.3)] backdrop-blur-xl"
                >
                    <Icon className="w-10 h-10" />
                </motion.div>

                <div className="inline-flex items-center gap-4 px-5 py-2 rounded-full bg-white/[0.03] border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-[0.5em] mb-12 backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    Phase 0{Math.floor(range[0] * 4) + 1} // System Sync
                </div>

                <h2 className="text-5xl sm:text-8xl font-black mb-8 tracking-[-0.03em] uppercase leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 select-none drop-shadow-2xl">
                    {title}
                </h2>

                <p className="text-lg sm:text-xl text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto tracking-tight opacity-80 mb-12 drop-shadow-md">
                    {desc}
                </p>

                {/* Interaction Meta */}
                <div className="flex items-center justify-center gap-8">
                    <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/5">
                        <Activity className="w-4 h-4 text-indigo-400" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">Processing Status</span>
                    </div>
                    <div className="w-px h-8 bg-gradient-to-b from-white/10 to-transparent" />
                    <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/5">
                        <Lock className="w-4 h-4 text-emerald-400" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">Encrypted Protocol</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
