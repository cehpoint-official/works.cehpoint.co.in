import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Briefcase,
  Clock,
  Shield,
  Zap,
  Play,
  BadgeCheck,
  CreditCard,
  Code,
  TrendingUp,
  PieChart,
  ShieldCheck,
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Monitor,
  Smartphone,
  GraduationCap,
  Target,
  Users,
  Rocket,
  Award,
  BookOpen
} from "lucide-react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import HeroAnimation from "../components/HeroAnimation"; // Fix import
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// --- COMPONENTS ---

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b",
        scrolled
          ? "bg-white/90 backdrop-blur-md border-gray-200 py-3"
          : "bg-white border-transparent py-4"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Cehpoint <span className="text-indigo-600">Work</span>
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/login"
            className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-6 py-2.5 sm:px-8 sm:py-3 text-[11px] sm:text-xs font-black uppercase tracking-widest text-white transition-all bg-indigo-600 rounded-full hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-95"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
};

// --- DECORATIVE COMPONENTS ---
const GridPattern = () => (
  <svg
    className="absolute inset-0 -z-10 h-full w-full stroke-gray-200 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
    aria-hidden="true"
  >
    <defs>
      <pattern
        id="0787a7c5-978c-4f66-83c7-11c213f99cb7"
        width={200}
        height={200}
        x="50%"
        y={-1}
        patternUnits="userSpaceOnUse"
      >
        <path d="M.5 200V.5H200" fill="none" />
      </pattern>
    </defs>
    <rect
      width="100%"
      height="100%"
      strokeWidth={0}
      fill="url(#0787a7c5-978c-4f66-83c7-11c213f99cb7)"
    />
  </svg>
);

const Geometric3DBackground = () => {
  useEffect(() => {
    const canvas = document.getElementById("canvas3d") as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", resize);
    resize();

    // 3D Particles
    const particles: { x: number; y: number; z: number }[] = [];
    const particleCount = 60; // Minimalist count
    const globeRadius = 300;

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      particles.push({
        x: globeRadius * Math.sin(phi) * Math.cos(theta),
        y: globeRadius * Math.sin(phi) * Math.sin(theta),
        z: globeRadius * Math.cos(phi),
      });
    }

    let angleX = 0;
    let angleY = 0;
    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const perspective = 800;

      angleX += 0.001;
      angleY += 0.002;

      // Rotate and Project
      const projectedPoints = particles.map((p) => {
        // Rotation Matrix
        let x = p.x * Math.cos(angleY) - p.z * Math.sin(angleY);
        let z = p.z * Math.cos(angleY) + p.x * Math.sin(angleY);

        let y = p.y * Math.cos(angleX) - z * Math.sin(angleX);
        z = z * Math.cos(angleX) + p.y * Math.sin(angleX);

        // Projection
        const scale = perspective / (perspective + z);
        return {
          x: x * scale + centerX,
          y: y * scale + centerY,
          scale: scale,
          z: z
        };
      });

      // Draw Connections
      ctx.strokeStyle = "rgba(99, 102, 241, 0.08)"; // Very subtle indigo
      ctx.lineWidth = 1;

      for (let i = 0; i < projectedPoints.length; i++) {
        for (let j = i + 1; j < projectedPoints.length; j++) {
          const p1 = projectedPoints[i];
          const p2 = projectedPoints[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw Particles
      projectedPoints.forEach((p) => {
        const opacity = Math.max(0.1, (1 - (p.z / globeRadius)) * 0.5); // Depth fog
        ctx.fillStyle = `rgba(99, 102, 241, ${opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 * p.scale, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <canvas
      id="canvas3d"
      className="absolute inset-0 -z-10 w-full h-full pointer-events-none opacity-60"
    />
  );
};

// --- Hyper-Premium 3D Liquid Chrome Button Component ---
const LiquidGlassButton = ({ href, children, icon: Icon }: { href: string, children: React.ReactNode, icon?: any }) => {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLAnchorElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <Link href={href}
      onMouseMove={handleMouseMove}
      ref={containerRef}
      className="group relative overflow-hidden rounded-full p-[1px] transition-all duration-700 hover:scale-[1.08] active:scale-95 flex items-center justify-center cursor-none lg:cursor-pointer w-full sm:w-auto"
    >
      {/* 3D Ambient Shadow */}
      <div className="absolute inset-0 bg-indigo-500/25 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

      {/* Outer Polished Shell */}
      <div className="relative flex h-14 sm:h-16 items-center justify-center rounded-full bg-gradient-to-b from-white via-slate-100 to-slate-400 p-[1.5px] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] w-full">

        {/* The Liquid Container */}
        <div className="relative h-full w-full flex items-center justify-center gap-4 rounded-full bg-[#050816] px-10 sm:px-12 text-sm sm:text-base font-black text-white overflow-hidden transition-all duration-700 border border-white/5 shadow-[inset_0_0_20px_rgba(99,102,241,0.2)]">

          {/* Layer 1: Base Mercury Pulse (Now persistent scale) */}
          <div className="absolute inset-0 pointer-events-none transition-transform duration-1000 scale-110 group-hover:scale-125">
            <div className="liquid-mercury-motion absolute inset-[-100%] opacity-90" style={{
              background: 'radial-gradient(circle at center, #ffffff 0%, #94a3b8 20%, #334155 50%, #020617 100%)',
              filter: 'url(#deep-mercury-distort)'
            }} />
          </div>

          {/* Layer 2: Shimmer Caustics (Now persistent) */}
          <div className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity duration-700 mix-blend-overlay">
            <div className="liquid-caustics absolute inset-[-50%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent,white,transparent,white,transparent)]" style={{ filter: 'url(#caustic-warp)' }} />
          </div>

          {/* Layer 3: Reactive Lighting Highlight (Now has a base visibility) */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-50 transition-opacity duration-500"
            style={{
              background: `radial-gradient(70% 70% at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,0.9) 0%, transparent 100%)`,
            }}
          />

          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-1000" />

          {/* Typography Layer */}
          <span className="relative z-10 flex items-center gap-3 tracking-[0.3em] uppercase text-[11px] sm:text-[13px] font-[1000] text-white/90 group-hover:text-white transition-all duration-500 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
            {Icon && <Icon className="w-5 h-5 text-indigo-400 group-hover:text-white group-hover:scale-125 transition-all duration-500" />}
            {children}
          </span>

          {/* Glass Top Edge Specular */}
          <div className="absolute inset-x-4 top-[1px] h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none opacity-80 shadow-[0_1px_8px_rgba(255,255,255,0.4)]" />
          <div className="absolute inset-x-0 top-0 h-full w-full rounded-full border-t-[0.5px] border-white/20 pointer-events-none" />
        </div>
      </div>

      {/* SVG Liquid Technology */}
      <svg width="0" height="0" className="hidden">
        <defs>
          <filter id="deep-mercury-distort">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" seed="15">
              <animate attributeName="baseFrequency" dur="20s" values="0.012;0.018;0.012" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="80" />
          </filter>
          <filter id="caustic-warp">
            <feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="2" seed="3" />
            <feDisplacementMap in="SourceGraphic" scale="15" />
          </filter>
        </defs>
      </svg>

      <style jsx>{`
        .liquid-mercury-motion {
          animation: fluid-spin 45s infinite linear;
        }
        .liquid-caustics {
          animation: shimmer-spin 12s infinite linear;
        }
        @keyframes fluid-spin {
          from { transform: rotate(0deg) scale(1); }
          50% { transform: scale(1.1); }
          to { transform: rotate(360deg) scale(1); }
        }
        @keyframes shimmer-spin {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
      `}</style>
    </Link>
  );
};

const Hero = () => {
  return (
    <section className="relative pt-20 pb-16 sm:pt-24 sm:pb-20 lg:pt-32 lg:pb-32 overflow-hidden bg-white isolate">
      {/* Background Decor */}
      <GridPattern />
      <Geometric3DBackground />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 lg:items-start">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-3xl mx-auto text-center lg:text-left lg:mx-0 lg:max-w-xl z-10 relative"
          >
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[10px] uppercase tracking-[0.2em] mb-8 shadow-sm mx-auto lg:mx-0">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Elite Execution Hub
            </div>

            <h1 className="text-[32px] sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.1] sm:leading-[1.15] mb-6">
              Your talent. <br className="hidden lg:block" />
              Our infrastructure. <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                Uninterrupted Revenue.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Cehpoint Work is the high-performance alternative to open marketplaces. We bridge the gap between top-tier specialists and premium milestones by managing the entire business layer—leaving you free to build at peak capacity.
            </p>

            {/* Credibility Pills */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap justify-start gap-3 mb-10 w-full lg:w-auto">
              {[
                { label: "Verified projects only", icon: BadgeCheck },
                { label: "Weekly payouts", icon: Zap },
                { label: "Skill-based onboarding", icon: Shield }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-start gap-2 px-4 py-2 sm:px-3 sm:py-1.5 rounded-full bg-white border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 cursor-default shadow-sm hover:border-indigo-200 transition-colors w-fit">
                  <item.icon className="w-4 h-4 text-indigo-600" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-stretch sm:items-center justify-center lg:justify-start w-full sm:w-auto mt-4 max-w-sm sm:max-w-none mx-auto lg:mx-0">
              <Link
                href="/signup"
                className="group relative inline-flex h-14 sm:h-16 items-center justify-center overflow-hidden rounded-full bg-slate-900 px-10 sm:px-12 font-bold text-white transition-all duration-500 hover:bg-slate-800 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/40 text-[13px] sm:text-base w-full sm:w-auto"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 transition-opacity duration-500 group-hover:opacity-20" />
                <span className="relative flex items-center gap-3">
                  Start Earning <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>

              <LiquidGlassButton href="/demo" icon={Play}>
                View Demo
              </LiquidGlassButton>
            </div>
          </motion.div>

          {/* Right Visual: Laptop Animation - Hidden on Mobile */}
          <div
            className="hidden lg:flex relative w-full h-[500px] items-center justify-center"
          >
            {/* Suble glow behind laptop */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-indigo-500/5 rounded-full blur-3xl -z-10" />
            <HeroAnimation />
          </div>
        </div>
      </div>
    </section>
  );
};

const EarnSteps = () => {
  const steps = [
    {
      title: "1. Skill Verification",
      desc: "Register and complete a domain-specific competency test. We prioritize proven capability over long resumes.",
      icon: Shield,
      color: "bg-blue-50 text-blue-600",
      delay: 0
    },
    {
      title: "2. Immediate Access",
      desc: "Once verified, you gain entry to our internal dashboard with real-time available projects matching your skill set.",
      icon: Zap,
      color: "bg-amber-50 text-amber-600",
      delay: 0.2
    },
    {
      title: "3. Direct Assignment",
      desc: "No proposal writing. When a mission fits your profile, you're assigned directly with a clear scope and budget.",
      icon: Play,
      color: "bg-indigo-50 text-indigo-600",
      delay: 0.4
    },
    {
      title: "4. Weekly Liquidity",
      desc: "Submissions are reviewed within 48 hours. Funds are liquidated to your account on a recurring weekly basis.",
      icon: CreditCard,
      color: "bg-emerald-50 text-emerald-600",
      delay: 0.6
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white border-t border-slate-100 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.4]"
        style={{ backgroundImage: "radial-gradient(#e2e8f0 1px, transparent 1px)", backgroundSize: "32px 32px" }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl text-left mb-12 sm:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-4xl font-bold text-slate-900 mb-4 sm:mb-6"
          >
            How professionals earn
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg text-slate-600"
          >
            A simplified, high-trust workflow designed for consistency.
          </motion.p>
        </div>

        <div className="relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-8 left-12 right-12 h-0.5 bg-slate-100 -z-10 overflow-hidden rounded-full">
            <motion.div
              className="h-full bg-indigo-600 origin-left"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: step.delay }}
                whileHover={{ y: -5 }}
                className="group flex flex-col items-start bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 relative z-10"
              >
                <div className={`w-12 h-12 rounded-xl border border-slate-100 flex items-center justify-center font-bold text-lg mb-6 shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${step.color}`}>
                  <step.icon className="w-5 h-5" />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">Step 0{idx + 1}</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed group-hover:text-slate-600 transition-colors">
                  {step.desc}
                </p>

                {/* Active Border Gradient on Hover */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-indigo-50/50 pointer-events-none transition-all duration-300" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const ValueGrid = () => {
  return (
    <section className="py-20 sm:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">

          {/* Main Value Prop */}
          <div className="lg:col-span-2 bg-slate-900 rounded-[2rem] sm:rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden flex flex-col justify-between min-h-[350px] sm:min-h-[400px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20" />

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white text-[10px] sm:text-xs font-semibold mb-6">
                <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Built for stability
              </div>
              <h3 className="text-2xl sm:text-4xl font-bold mb-4 leading-tight">
                Eliminating the friction between <br className="hidden sm:block" /><span className="text-indigo-400">talent and execution.</span>
              </h3>
              <p className="text-slate-400 text-base sm:text-lg max-w-md">
                We believe the best workers shouldn&apos;t have to be the best marketers. We handle the business, you handle the brilliance.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 mt-10 sm:mt-12">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">200+</div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Specialists</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-1">$200k+</div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Paid out</div>
              </div>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="space-y-4 sm:space-y-8">
            <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-100 group hover:bg-slate-100 transition-colors">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <Code className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Enterprise-Grade Works</h4>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Execute missions ranging from AI model training and full-stack architecture to security auditing and strategic marketing.
              </p>
            </div>

            <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-100 group hover:bg-slate-100 transition-colors">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Automated Skill Tuning</h4>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Our platform continuously evaluates your execution quality, automatically unlocking higher-tier projects as your proficiency increases.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

const ProfessionalGrowth = () => {
  const tracks = [
    {
      title: "Skill Hardening",
      desc: "Deep-dive projects that push your technical boundaries. From AI integration to high-scale architecture.",
      icon: Target,
      tag: "Technical Excellence",
      color: "blue"
    },
    {
      title: "Knowledge Hub",
      desc: "Access proprietary playbooks, research, and documentation from top-tier engineering leads.",
      icon: BookOpen,
      tag: "Continuous Learning",
      color: "indigo"
    },
    {
      title: "Career Hierarchy",
      desc: "Progress from Specialist to Architect. Clear performance-based levels with increasing responsibilities.",
      icon: Award,
      tag: "Career Path",
      color: "emerald"
    },
    {
      title: "Peer Sync",
      desc: "Collaborate in elite squads. Learn from the best while contributing your own expertise.",
      icon: Users,
      tag: "Collaboration",
      color: "violet"
    }
  ];

  return (
    <section className="py-24 sm:py-32 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-end justify-between gap-8 mb-16 sm:mb-20">
          <div className="max-w-2xl">
            <h2 className="text-xs sm:text-sm font-bold text-indigo-600 uppercase tracking-[0.2em] mb-4">Professional Ecosystem</h2>
            <h3 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1]">
              More than just projects. <br />
              <span className="text-slate-400 font-medium">A career trajectory.</span>
            </h3>
          </div>
          <p className="text-lg text-slate-600 max-w-md pb-1">
            We don't just provide work; we provide the environment for you to evolve into the top 0.1% of global talent.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {tracks.map((track, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500"
            >
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm",
                track.color === "blue" && "bg-blue-50 text-blue-600",
                track.color === "indigo" && "bg-indigo-50 text-indigo-600",
                track.color === "emerald" && "bg-emerald-50 text-emerald-600",
                track.color === "violet" && "bg-violet-50 text-violet-600",
              )}>
                <track.icon size={28} />
              </div>

              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{track.tag}</span>
              <h4 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{track.title}</h4>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                {track.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const WhoIsThisFor = () => {
  return (
    <section className="py-20 sm:py-32 bg-[#020617] relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 sm:gap-20 items-center relative z-10">
        {/* Left Content */}
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-indigo-500 uppercase tracking-[0.2em] mb-3">The Top 1%</h2>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
            Not for everyone. <br />
            <span className="text-slate-500">Just for the distinct.</span>
          </h3>

          <div className="space-y-4">
            {/* Card 1 */}
            <div className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/30 transition-all duration-300 cursor-default">
              <div className="flex items-start gap-5">
                <div className="p-3 rounded-lg bg-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
                  <Code className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">Builders, Not Marketers</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    You joined this industry to write clean code and ship products, not to write sales proposals or chase invoices.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-300 cursor-default">
              <div className="flex items-start gap-5">
                <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">Stability Seekers</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    You value consistent, high-quality work streams over the "feast or famine" cycle of traditional freelancing.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/30 transition-all duration-300 cursor-default">
              <div className="flex items-start gap-5">
                <div className="p-3 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">Value Maximizers</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    You know your worth. We connect you with enterprise clients who are happy to pay premium rates for premium results.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - The "Visual Proof" */}
        <div className="relative perspective-[1200px] group">
          <div className="absolute inset-0 bg-indigo-600/30 blur-[120px] rounded-full -z-10 animate-pulse" />

          {/* Abstract App Interface Mockup */}
          <motion.div
            initial={{ rotateY: 15, rotateX: 10, opacity: 0, scale: 0.9 }}
            whileInView={{ rotateY: -8, rotateX: 5, opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 lg:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />


            {/* Mocking a "Profile Stats" view */}
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-indigo-600 p-0.5 relative group-hover:scale-105 transition-transform duration-500">
                    <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center">
                      <span className="text-white font-black text-2xl tracking-tighter">TR</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-slate-900 rounded-full shadow-lg"></div>
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-white tracking-tight">Verified Expert</h4>
                  <div className="flex items-center gap-2 mt-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Top 1% Talent
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Weekly Earnings</div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="text-3xl font-bold text-white tracking-tighter tabular-nums"
                >
                  $4,250<span className="text-slate-500">.00</span>
                </motion.div>
              </div>
            </div>

            {/* Mocking "Recent Projects" */}
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between px-1">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Active Streams</div>
                <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '70%' }}
                    transition={{ duration: 1.5, delay: 1 }}
                    className="h-full bg-indigo-500"
                  />
                </div>
              </div>

              {[
                { title: 'Fintech Core UI', sub: 'Milestone 3 of 5', price: '$3,200', color: 'indigo', icon: Briefcase },
                { title: 'API Security Audit', sub: 'Final Verification', price: '$1,850', color: 'emerald', icon: ShieldCheck }
              ].map((project, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6 + (i * 0.15), duration: 0.6 }}
                  className="group/item p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all duration-300 flex justify-between items-center"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${project.color}-500/20 text-${project.color}-400 group-hover/item:scale-110 transition-transform`}>
                      <project.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-white font-bold tracking-tight">{project.title}</div>
                      <div className="text-xs text-slate-500 font-medium">{project.sub}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold tabular-nums">{project.price}</div>
                    <div className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">Escrowed</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Status Footer */}
            <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Available for hire</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Standard Payout: <span className="text-white">Weekly Cycle</span></div>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
};

const PlatformTransparency = () => {
  const pillars = [
    {
      title: "Zero Hidden Fees",
      desc: "We don't charge 'service fees' or 'commission' from your earnings. The budget you see is the amount you receive. Period.",
      icon: ShieldCheck
    },
    {
      title: "Guaranteed Payouts",
      desc: "Our escrow system secures project funds before any work begins. You never have to worry about client payment delays.",
      icon: Zap
    },
    {
      title: "Global Neutrality",
      desc: "We hire talent based on skill, not geography. As long as you can deliver at the highest level, our doors are open.",
      icon: CheckCircle2
    }
  ];

  return (
    <section className="py-24 sm:py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-950 rounded-[2.5rem] sm:rounded-[4rem] p-6 sm:p-16 lg:p-24 relative overflow-hidden border border-white/5 shadow-2xl">
          {/* Gradients */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px] -mr-40 -mt-20" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] -ml-20 -mb-20" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start gap-16 lg:gap-32">
            <div className="w-full lg:w-[55%] space-y-12">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  Transparency Protocol v2.1
                </div>
                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.05]">
                  Integrity & <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">Shielding.</span>
                </h2>
                <p className="text-slate-400 text-base sm:text-xl font-medium leading-relaxed max-w-xl">
                  Trust is our primary currency. We've optimized the administrative layer so you can focus on what you do best.
                </p>
              </div>

              <div className="space-y-10">
                {pillars.map((p, idx) => (
                  <div key={idx} className="flex gap-6 items-start group">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 shrink-0 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all duration-500">
                      <p.icon size={26} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-white mb-2 uppercase tracking-tight">{p.title}</h4>
                      <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
                        {p.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-[45%]">
              <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden backdrop-blur-md">
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="ml-2 text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 py-1 bg-white/5 rounded-lg">Operational Status</span>
                </div>

                <div className="space-y-8">
                  {[
                    { label: "Review Time", value: "< 48 Hours", sub: "Verification Window" },
                    { label: "Payout Cycle", value: "Every Friday", sub: "Institutional Liquidity" },
                    { label: "Platform Fee", value: "0% Commission", sub: "Direct Payouts" },
                    { label: "Work Model", value: "Fully Remote", sub: "GlobalNexus Engine" }
                  ].map((spec, i) => (
                    <div key={i} className="flex justify-between items-end border-b border-white/5 pb-6 last:border-0 last:pb-0 group">
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-indigo-400 transition-colors">{spec.label}</p>
                        <p className="text-sm font-bold text-slate-400 group-hover:text-slate-300 transition-colors">{spec.sub}</p>
                      </div>
                      <p className="text-xl font-black text-white uppercase tracking-tight">{spec.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-12 p-6 bg-indigo-600/10 border border-indigo-600/20 rounded-2xl flex items-center gap-5">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-600/20">
                    <ShieldCheck size={20} />
                  </div>
                  <p className="text-[11px] text-indigo-100/80 font-medium leading-relaxed">
                    All intellectual property remains protected under the <span className="text-white font-bold">Cehpoint Legal Protocol</span> until full settlement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const CTA = () => {
  return (
    <section className="min-h-[80vh] bg-[#020617] relative overflow-hidden flex flex-col items-center justify-center text-center py-20">
      {/* Background Warp Shared */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#020617] to-[#020617]" />
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight mb-10 leading-[1.1]"
        >
          Stop Searching. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-[length:200%_auto] animate-gradient">Start Building.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 text-base sm:text-xl md:text-2xl mb-12 sm:mb-16 max-w-2xl mx-auto leading-relaxed"
        >
          Stop wasting time on proposals. Join the managed workspace where potential is rewarded with immediate opportunity.
        </motion.p>

        <div className="flex flex-col items-center gap-6 sm:gap-8">
          <Link href="/login" className="group relative inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 sm:px-12 sm:py-6 text-lg sm:text-xl font-bold text-white bg-indigo-600 rounded-full overflow-hidden transition-all hover:scale-105 hover:bg-indigo-500 hover:shadow-[0_0_80px_rgba(79,70,229,0.4)] ring-offset-2 ring-offset-[#020617] focus:ring-2 focus:ring-indigo-500 shadow-xl shadow-indigo-600/20">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out" />
            <span className="relative flex items-center gap-3">
              Apply for Access <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2.5 text-sm sm:text-base text-slate-500 font-medium"
          >
            <ShieldCheck className="w-4 h-4 sm:w-5 h-5 text-emerald-500" />
            <span>Vetted & Verified Community</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200 pt-16 sm:pt-24 pb-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-10 sm:gap-12 lg:gap-8 mb-16 sm:mb-20">

          {/* Brand Column */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-2 sm:pr-8">
            <div className="flex items-center mb-6">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Cehpoint <span className="text-indigo-600 font-medium">Work</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-sm mb-8 text-slate-500">
              The premium project work marketplace for the modern economy. We empower skilled professionals with consistent, high-trust work streams.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Linkedin, href: "https://linkedin.com/company/cehpoint" }
              ].map((social, idx) => (
                <Link key={idx} href={social.href} target="_blank" className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-indigo-600 hover:border-indigo-600 hover:text-white transition-all text-slate-400 shadow-sm group">
                  <social.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h4 className="text-slate-900 font-bold mb-6 text-sm uppercase tracking-widest">Platform</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/login" className="hover:text-indigo-600 transition-colors inline-flex items-center group">Sign In <ArrowRight className="w-3 h-3 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" /></Link></li>
              <li><Link href="/signup" className="hover:text-indigo-600 transition-colors inline-flex items-center group">Join as Talent <ArrowRight className="w-3 h-3 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" /></Link></li>
              <li><Link href="/demo" className="hover:text-indigo-600 transition-colors">View Demo</Link></li>
              <li><Link href="/tasks" className="hover:text-indigo-600 transition-colors">Browse Projects</Link></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-slate-900 font-bold mb-6 text-sm uppercase tracking-widest">Company</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/about" className="hover:text-indigo-600 transition-colors">About Story</Link></li>
              <li><Link href="/culture" className="hover:text-indigo-600 transition-colors">Our Culture</Link></li>
              <li><Link href="/contact" className="hover:text-indigo-600 transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          <div className="col-span-1 sm:col-span-2">
            <h4 className="text-slate-900 font-bold mb-6 text-sm uppercase tracking-widest">Legal & Trust</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/policies/terms" className="hover:text-indigo-600 transition-colors">Terms of Service</Link></li>
              <li><Link href="/policies/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/compliance" className="hover:text-indigo-600 transition-colors">Compliance Standards</Link></li>
              <li className="pt-4 mt-2 border-t border-slate-100 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Enterprise Grade Security Enabled</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-8 sm:gap-6 text-center sm:text-left">
          <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 uppercase tracking-widest max-w-[250px] sm:max-w-none">
            &copy; {new Date().getFullYear()} Cehpoint Official. Built for the top 1%.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Status: Optimal</span>
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Region: Global Nexus</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

const MobileWarningPopup = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    const hasSeenWarning = sessionStorage.getItem("hasSeenMobileWarning");

    if (isMobile && !hasSeenWarning) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("hasSeenMobileWarning", "true");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl lg:hidden"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] border border-white relative overflow-hidden text-center"
          >
            {/* Ambient Background Glows */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative mb-10">
              <div className="flex items-center justify-center">
                <div className="relative">
                  <motion.div
                    initial={{ rotate: 10, scale: 0.9 }}
                    animate={{ rotate: 3, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
                    className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200 z-10 relative overflow-hidden"
                  >
                    <Monitor className="w-10 h-10" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
                  </motion.div>
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="absolute -bottom-2 -right-4 w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 border-2 border-slate-50 -rotate-6 shadow-xl z-20"
                  >
                    <Smartphone className="w-6 h-6" />
                  </motion.div>
                </div>
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                Desktop Optimized
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                Built for <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Workstations.</span>
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed px-2">
                Our portal utilizes advanced workstation interfaces for maximum productivity. For the most premium experience, please use a desktop browser.
              </p>
            </div>

            <div className="mt-10 space-y-4 relative z-10">
              <button
                onClick={handleClose}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-[0.98] text-sm"
              >
                Access Anyway
              </button>
              <button
                role="link"
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                onClick={handleClose}
              >
                Continue to Mobile View
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
      <Head>
        <title>Cehpoint Work Portal | Verified Project Work</title>
        <meta
          name="description"
          content="Earn weekly from verified project work. Cehpoint is the curated work portal for skilled professionals."
        />
      </Head>

      <Navbar />
      <MobileWarningPopup />

      <main>
        <Hero />
        <EarnSteps />
        <ValueGrid />
        <ProfessionalGrowth />
        <WhoIsThisFor />
        <PlatformTransparency />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}