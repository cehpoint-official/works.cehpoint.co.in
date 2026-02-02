import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Lock, Landmark, CheckCircle2, Globe, FileCheck, UserCheck } from "lucide-react";

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

export default function ComplianceStandards() {
    const standards = [
        { title: "KYC/AML Compliance", desc: "Rigorous verification for all institutional entities and high-volume professionals.", icon: UserCheck },
        { title: "PCI DSS Ready", desc: "Highest standards for payment processing and financial data encryption.", icon: Lock },
        { title: "GDPR/CCPA Compliant", desc: "Strict adherence to global data privacy and professional portability standards.", icon: Globe },
        { title: "Tax Compliance", desc: "Automated reporting and withholding capabilities for multiple jurisdictions.", icon: Landmark },
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 border-t-8 border-indigo-600">
            <Head>
                <title>Compliance Standards | Cehpoint Work</title>
            </Head>

            <Navbar />

            <main className="pt-32 pb-24 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-100 rounded-full blur-[120px] -mr-40 -mt-20" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="max-w-4xl space-y-8 mb-20">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white font-bold text-[10px] uppercase tracking-[0.3em] shadow-xl">
                            Tier 1 Security
                        </div>
                        <h1 className="text-4xl sm:text-7xl font-black text-slate-900 tracking-tight leading-[1.05]">
                            Institutional <br />
                            <span className="text-indigo-600">Compliance.</span>
                        </h1>
                        <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl">
                            Cehpoint Work operates under the highest global standards for financial security, professional verification, and data integrity.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-100 border border-slate-100 rounded-[3rem] overflow-hidden shadow-2xl mb-24">
                        {standards.map((s, i) => (
                            <div key={i} className="bg-white p-12 hover:bg-slate-50 transition-colors group">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    <s.icon size={24} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">{s.title}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2 space-y-12">
                            <div className="space-y-6">
                                <h2 className="text-3xl font-black uppercase tracking-tight">Governance Framework</h2>
                                <div className="prose prose-slate max-w-none font-medium text-slate-600 leading-loose">
                                    <p>
                                        Our governance framework is designed to protect both the professional talent and the project owners.
                                        We implement automated compliance checks at every stage of the project lifecycle—from onboarding to final payout.
                                    </p>
                                    <ul className="space-y-4 pt-6">
                                        {[
                                            "Automated background checks through GlobalNexus API.",
                                            "Real-time fraud detection on all withdrawal requests.",
                                            "Multi-signature escrow approval for high-value milestones.",
                                            "Isolated data nodes for sensitive professional credentials."
                                        ].map((val, idx) => (
                                            <li key={idx} className="flex gap-4 items-start">
                                                <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={18} />
                                                <span>{val}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-200">
                                <FileCheck size={48} className="mb-8 opacity-50" />
                                <h3 className="text-xl font-black uppercase tracking-tight mb-4">Verification Audit</h3>
                                <p className="text-sm text-indigo-100 font-medium leading-relaxed mb-10">
                                    Need a detailed compliance report for your enterprise audit team?
                                </p>
                                <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-50 transition-all active:scale-95 shadow-lg">
                                    Request Audit Docs
                                </button>
                            </div>

                            <div className="p-8 border border-slate-100 rounded-[3rem] text-center">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Platform Version</h4>
                                <p className="text-sm font-black text-slate-900">v4.2.0-STABLE</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-12 text-center text-slate-400">
                <p className="text-[10px] font-black uppercase tracking-widest text-center">
                    &copy; {new Date().getFullYear()} Cehpoint Official Compliance Division.
                </p>
            </footer>
        </div>
    );
}
// Compliance Standards Page
