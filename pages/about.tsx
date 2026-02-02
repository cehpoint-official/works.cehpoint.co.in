import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Target, Users, Rocket, Award, ShieldCheck } from "lucide-react";

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

const SectionHeader = ({ title, subtitle, badge }: { title: string, subtitle: string, badge: string }) => (
    <div className="space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest leading-none">
            {badge}
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] max-w-2xl">
            {title}
        </h1>
        <p className="text-lg text-slate-500 max-w-xl font-medium leading-relaxed">
            {subtitle}
        </p>
    </div>
);

export default function AboutStory() {
    const milestones = [
        { year: "2020", title: "The Vision", desc: "Cehpoint was founded on the idea that talent shouldn't be limited by geography or office walls.", icon: Rocket },
        { year: "2021", title: "Institutional Shift", desc: "We pivoted from a simple marketplace to a high-fidelity work infrastructure platform.", icon: Target },
        { year: "2023", title: "Global Expansion", desc: "Surpassed 10,000+ verified professionals and partnered with major enterprise nodes.", icon: Users },
        { year: "2025", title: "The Gold Standard", desc: "Recognized as the most trusted portal for professional remote project execution.", icon: Award },
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            <Head>
                <title>About Our Story | Cehpoint Work</title>
            </Head>

            <Navbar />

            <main className="pt-32 pb-24 relative overflow-hidden">
                {/* Subtle Background Elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -mr-40 -mt-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -ml-40 -mb-20 pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:mt-12">
                    <SectionHeader
                        badge="The Foundation"
                        title="Bridging the Gap Between Talent and Execution."
                        subtitle="Cehpoint Work is not just a platform; it's the premium infrastructure for the next generation of professional talent."
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                        <div className="space-y-12">
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Our Mission</h3>
                                <p className="text-slate-600 leading-relaxed font-medium">
                                    We believe that the traditional marketplace model is broken. It's too noisy, too insecure, and doesn't respect the specialized needs of elite professionals.
                                    Our mission is to filter out the noise and provide a sterile, high-performance environment where you can build, create, and earn without friction.
                                </p>
                                <div className="p-6 bg-slate-950 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    <div className="relative z-10 flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-600/20">
                                            <ShieldCheck size={24} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-loose">
                                            <span className="text-white">Zero-Noise Protocol</span> enabled for all verified talent streams.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">How We're Different</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {[
                                        { t: "Curated Projects", d: "No bidding wars. We match talent to projects based on verified skills." },
                                        { t: "Escrow Security", d: "Funds are locked before you even start. No chasing invoices." },
                                    ].map((item, i) => (
                                        <div key={i} className="space-y-2 p-6 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                                            <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">{item.t}</h4>
                                            <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.d}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-slate-100 -rotate-3 rounded-[3rem] -z-10" />
                            <div className="bg-white border border-slate-200 p-8 sm:p-12 rounded-[3rem] shadow-2xl relative">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-10">Historical Timeline</h3>
                                <div className="space-y-10 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                                    {milestones.map((m, i) => (
                                        <div key={i} className="flex gap-8 items-start relative hover:translate-x-1 transition-transform">
                                            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm z-10 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                                                <m.icon size={20} />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{m.year}</div>
                                                <h4 className="text-lg font-black text-slate-900 tracking-tight">{m.title}</h4>
                                                <p className="text-sm text-slate-500 font-medium leading-relaxed">{m.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-12 border-t border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    &copy; {new Date().getFullYear()} Cehpoint Official Legal Archives.
                </p>
            </footer>
        </div>
    );
}
