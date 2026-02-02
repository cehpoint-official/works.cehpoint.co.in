import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Coffee, Zap, Palette, Heart, ShieldCheck, ZapIcon } from "lucide-react";

const Navbar = () => (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-slate-100 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                    Cehpoint <span className="text-indigo-600">Work</span>
                </span>
            </Link>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
                <ArrowLeft size={16} />
                Back Home
            </Link>
        </div>
    </nav>
);

export default function OurCulture() {
    const values = [
        { title: "Radical Transparency", desc: "No secrets, no office politics. We operate on merit and data-backed decisions.", icon: ShieldCheck },
        { title: "Elite Execution", desc: "We don't settle for 'good enough'. We aim for the top 1% in every task we deliver.", icon: Zap },
        { title: "Creative Autonomy", desc: "We hire experts to tell us what to do, not the other way around. Total freedom to create.", icon: Palette },
        { title: "Human Centered", desc: "Work serves life, not life serving work. We build tools that make lives better.", icon: Heart },
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <Head>
                <title>Our Culture | Cehpoint Work</title>
            </Head>

            <Navbar />

            <main className="pt-32 pb-24 relative overflow-hidden">
                {/* Glow Effects */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px] -mr-60 -mt-20" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -ml-40 -mb-20" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[10px] uppercase tracking-widest shadow-sm">
                            <ZapIcon className="w-3 h-3 fill-indigo-600 text-indigo-600" />
                            Inside Cehpoint
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.05]">
                            Built by Builders <br />
                            For the <span className="text-indigo-600">Top 1%.</span>
                        </h1>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                            Our culture isn't about ping-pong tables or free snacks. It's about the relentless pursuit of excellence and the freedom to work from anywhere on things that matter.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
                        {values.map((v, i) => (
                            <div key={i} className="group bg-white border border-slate-100 p-10 rounded-[3rem] shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-700 hover:-translate-y-2">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center text-indigo-600 mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                                    <v.icon size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">{v.title}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">{v.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-950 rounded-[4rem] p-10 sm:p-20 relative overflow-hidden text-center text-white border border-white/5">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] -mr-20 -mt-20" />
                        <div className="relative z-10 space-y-8">
                            <div className="inline-flex items-center gap-4 text-xs font-black uppercase tracking-[0.3em] text-slate-400">
                                <div className="w-12 h-px bg-slate-800" />
                                Collective Intelligence
                                <div className="w-12 h-px bg-slate-800" />
                            </div>
                            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-2xl mx-auto">
                                Join a Community That <span className="text-indigo-400">Respects Your Craft.</span>
                            </h2>
                            <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-xl mx-auto">
                                We believe in extreme ownership. If you're tired of micromanagement and meaningless meetings, you've found your new home.
                            </p>
                            <div className="pt-8">
                                <Link href="/signup" className="inline-flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-full hover:bg-indigo-500 hover:scale-105 transition-all shadow-xl shadow-indigo-600/20 active:scale-95">
                                    Begin Onboarding <ArrowLeft className="rotate-180 w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-12 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    &copy; {new Date().getFullYear()} Cehpoint Work Culture Manifest.
                </p>
            </footer>
        </div>
    );
}
