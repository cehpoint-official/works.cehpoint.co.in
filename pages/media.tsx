import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Download, FileText, ImageIcon, Box, ExternalLink } from "lucide-react";

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

export default function MediaKit() {
    const assets = [
        { title: "Brand Guidelines", type: "PDF", size: "1.2 MB", icon: FileText },
        { title: "Primary Logo Set", type: "SVG/PNG", size: "4.5 MB", icon: Box },
        { title: "App Screenshots", type: "ZIP", size: "12.8 MB", icon: ImageIcon },
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <Head>
                <title>Media Kit | Cehpoint Work</title>
            </Head>

            <Navbar />

            <main className="pt-32 pb-24 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px] -mr-60 -mt-20" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[10px] uppercase tracking-widest shadow-sm">
                            Press & Identity
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.05]">
                            Brand Hub & <br />
                            <span className="text-indigo-600">Media Assets.</span>
                        </h1>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                            Official resources for press, partners, and community builders. Please adhere to our brand guidelines when using our identity.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                        {assets.map((a, i) => (
                            <div key={i} className="bg-white border border-slate-100 p-8 rounded-[3rem] shadow-sm flex flex-col items-center text-center group hover:border-indigo-200 hover:shadow-2xl transition-all duration-500">
                                <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-400 mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                    <a.icon size={36} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 uppercase">{a.title}</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">{a.type} &bull; {a.size}</p>
                                <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest">
                                    <Download size={16} /> Download Asset
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[4rem] p-10 sm:p-20 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rotate-45 translate-x-10 -translate-y-10" />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Usage Permissions</h2>
                                <div className="space-y-6">
                                    {[
                                        "Do not alter or distort the Cehpoint Work logo proportions.",
                                        "Maintain a clear safety area around all brand elements.",
                                        "Use our primary indigo core #4F46E5 for brand-level applications.",
                                        "Ensure high contrast when placing logos on backgrounds."
                                    ].map((rule, i) => (
                                        <div key={i} className="flex gap-4 items-start">
                                            <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 text-[10px] font-black">{i + 1}</div>
                                            <p className="text-slate-500 font-medium leading-relaxed text-sm">{rule}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-10">
                                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                                    <h3 className="text-lg font-black uppercase tracking-tight mb-4">Color Palette</h3>
                                    <div className="flex gap-4">
                                        <div className="w-full space-y-2">
                                            <div className="h-20 bg-indigo-600 rounded-2xl shadow-lg" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Core Indigo</p>
                                        </div>
                                        <div className="w-full space-y-2">
                                            <div className="h-20 bg-slate-900 rounded-2xl shadow-lg" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Deep Slate</p>
                                        </div>
                                        <div className="w-full space-y-2">
                                            <div className="h-20 bg-white border border-slate-200 rounded-2xl shadow-lg" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Shell White</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <p className="text-sm text-slate-400 font-medium mb-4 italic">Need custom assets for a case study or interview?</p>
                                    <Link href="/contact" className="text-indigo-600 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:underline">
                                        Contact Media Relations <ExternalLink size={14} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-12 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    &copy; {new Date().getFullYear()} Cehpoint Official Brand Guidelines v2.0.
                </p>
            </footer>
        </div>
    );
}
