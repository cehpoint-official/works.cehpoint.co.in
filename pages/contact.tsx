import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, MessageSquare, ShieldCheck, MapPin, ExternalLink } from "lucide-react";

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

export default function ContactSupport() {
    const contactOptions = [
        { title: "General Support", desc: "Available for project-related inquiries and account issues.", label: "support@cehpoint.co.in", icon: Mail },
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            <Head>
                <title>Contact support | Cehpoint Work</title>
            </Head>

            <Navbar />

            <main className="pt-32 pb-24 relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -mr-40 -mt-20" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div className="space-y-12">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-[10px] uppercase tracking-widest shadow-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Global Support Live
                                </div>
                                <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.05]">
                                    How Can We <br />
                                    <span className="text-indigo-600">Assist You?</span>
                                </h1>
                                <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-lg">
                                    Direct communication channels for verified talent and enterprise partners. Our response time is typically under 12 hours.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                                {contactOptions.map((opt, i) => (
                                    <div key={i} className="flex gap-6 items-start p-6 rounded-3xl border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <opt.icon size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1">{opt.title}</h3>
                                            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-3">{opt.desc}</p>
                                            <a href={`mailto:${opt.label}`} className="text-indigo-600 font-bold text-sm hover:underline flex items-center gap-1.5">
                                                {opt.label} <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-0 bg-indigo-600 rotate-6 rounded-[3rem] opacity-5 -z-10 group-hover:rotate-3 transition-transform duration-700" />
                            <div className="bg-slate-950 rounded-[4rem] p-10 sm:p-14 text-white relative overflow-hidden border border-white/5 space-y-10 shadow-2xl">
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black uppercase tracking-tight leading-none text-indigo-400">Headquarters</h3>
                                    <div className="flex items-start gap-4 text-slate-400 font-medium">
                                        <MapPin className="text-indigo-600 shrink-0" size={24} />
                                        <p className="leading-relaxed">
                                            Cehpoint, Labpur, Sandipan Patsala Para,<br />
                                            Birbhum, Bolpur,<br />
                                            West Bengal - 731303, India
                                        </p>
                                    </div>
                                </div>

                                <div className="h-px bg-white/5 w-full" />

                                <div className="space-y-6">
                                    <h3 className="text-xl font-black uppercase tracking-tight text-white">Join Our Community</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Link href="https://linkedin.com/company/cehpoint" target="_blank" className="flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-indigo-500/30 transition-all font-bold text-sm">
                                            LinkedIn
                                        </Link>
                                        <Link href="/signup" className="flex items-center justify-center gap-3 py-4 bg-indigo-600 rounded-2xl hover:bg-indigo-500 transition-all font-bold text-sm shadow-xl shadow-indigo-600/20">
                                            Join Portal
                                        </Link>
                                    </div>
                                </div>

                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] pt-4">
                                    Cehpoint works official support network v4.2
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-12 border-t border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    &copy; {new Date().getFullYear()} Cehpoint Official Support Nexus.
                </p>
            </footer>
        </div>
    );
}
