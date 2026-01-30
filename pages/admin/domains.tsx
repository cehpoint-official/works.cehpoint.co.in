
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Trash2,
    Edit2,
    X,
    Layers,
    Database
} from "lucide-react";

import Layout from "../../components/Layout";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { storage } from "../../utils/storage";
import { User, Domain } from "../../utils/types";

export default function AdminDomains() {
    const router = useRouter();
    const [admin, setAdmin] = useState<User | null>(null);
    const [domains, setDomains] = useState<Domain[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editingDomain, setEditingDomain] = useState<Domain | null>(null);

    const [newDomain, setNewDomain] = useState({
        name: "",
        stacks: [] as string[],
        questions: [] as any[],
        demoTask: {
            title: "",
            description: "",
            requirements: [] as string[],
            deliverable: ""
        }
    });
    const [stackInput, setStackInput] = useState("");
    const [requirementInput, setRequirementInput] = useState("");
    const [questionInput, setQuestionInput] = useState({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0
    });

    useEffect(() => {
        const current = storage.getCurrentUser();
        if (!current || current.role !== "admin") {
            router.replace("/login");
            return;
        }
        setAdmin(current);
        loadDomains();
    }, []);

    const confirmToast = (message: string, onConfirm: () => void) => {
        toast((t) => (
            <div className="flex flex-col gap-4 min-w-[280px] py-1">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <Database size={20} />
                    </div>
                    <p className="text-sm font-black text-slate-900 tracking-tight">{message}</p>
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            onConfirm();
                        }}
                        className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
                    >
                        Proceed
                    </button>
                </div>
            </div>
        ), {
            duration: 8000,
            style: {
                borderRadius: '24px',
                padding: '20px',
                border: '1px solid #f1f5f9',
                background: '#fff',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
            }
        });
    };

    const loadDomains = async () => {
        setLoading(true);
        try {
            const list = await storage.getDomains();
            setDomains(list);
        } catch (err) {
            toast.error("Failed to load domains.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newDomain.name.trim() || newDomain.stacks.length === 0) {
            toast.error("Domain name and at least one tech stack required.");
            return;
        }
        try {
            await storage.createDomain({
                name: newDomain.name.trim(),
                stacks: newDomain.stacks,
                questions: newDomain.questions,
                demoTask: newDomain.demoTask,
                createdAt: new Date().toISOString(),
            });
            toast.success("Domain configured.");
            setNewDomain({
                name: "",
                stacks: [],
                questions: [],
                demoTask: { title: "", description: "", requirements: [], deliverable: "" }
            });
            setShowAdd(false);
            loadDomains();
        } catch (err) {
            toast.error("Sync failed.");
        }
    };

    const handleUpdate = async () => {
        if (!editingDomain) return;
        try {
            await storage.updateDomain(editingDomain.id, {
                name: editingDomain.name.trim(),
                stacks: editingDomain.stacks,
                questions: editingDomain.questions || [],
                demoTask: editingDomain.demoTask
            });
            toast.success("Domain updated.");
            setEditingDomain(null);
            loadDomains();
        } catch (err) {
            toast.error("Update failed.");
        }
    };

    const handleDelete = async (id: string) => {
        confirmToast("Permanently purge this protocol?", async () => {
            try {
                await storage.deleteDomain(id);
                toast.success("Domain purged.");
                loadDomains();
            } catch (err) {
                toast.error("Purge failed.");
            }
        });
    };

    const addStack = (isEdit: boolean) => {
        if (!stackInput.trim()) return;
        if (isEdit && editingDomain) {
            if (editingDomain.stacks.includes(stackInput.trim())) return;
            setEditingDomain({ ...editingDomain, stacks: [...editingDomain.stacks, stackInput.trim()] });
        } else {
            if (newDomain.stacks.includes(stackInput.trim())) return;
            setNewDomain({ ...newDomain, stacks: [...newDomain.stacks, stackInput.trim()] });
        }
        setStackInput("");
    };

    const removeStack = (stack: string, isEdit: boolean) => {
        if (isEdit && editingDomain) {
            setEditingDomain({ ...editingDomain, stacks: editingDomain.stacks.filter(s => s !== stack) });
        } else {
            setNewDomain({ ...newDomain, stacks: newDomain.stacks.filter(s => s !== stack) });
        }
    };

    const addQuestion = (isEdit: boolean) => {
        if (!questionInput.question.trim() || questionInput.options.some(o => !o.trim())) {
            toast.error("Complete all question fields and options");
            return;
        }
        if (isEdit && editingDomain) {
            setEditingDomain({ ...editingDomain, questions: [...(editingDomain.questions || []), { ...questionInput }] });
        } else {
            setNewDomain({ ...newDomain, questions: [...newDomain.questions, { ...questionInput }] });
        }
        setQuestionInput({ question: "", options: ["", "", "", ""], correctAnswer: 0 });
    };

    const removeQuestion = (idx: number, isEdit: boolean) => {
        if (isEdit && editingDomain) {
            setEditingDomain({ ...editingDomain, questions: (editingDomain.questions || []).filter((_, i) => i !== idx) });
        } else {
            setNewDomain({ ...newDomain, questions: newDomain.questions.filter((_, i) => i !== idx) });
        }
    };

    const addRequirement = (isEdit: boolean) => {
        if (!requirementInput.trim()) return;
        if (isEdit && editingDomain) {
            const dt = editingDomain.demoTask || { title: "", description: "", requirements: [], deliverable: "" };
            setEditingDomain({
                ...editingDomain,
                demoTask: { ...dt, requirements: [...dt.requirements, requirementInput.trim()] }
            });
        } else {
            setNewDomain({
                ...newDomain,
                demoTask: { ...newDomain.demoTask, requirements: [...newDomain.demoTask.requirements, requirementInput.trim()] }
            });
        }
        setRequirementInput("");
    };

    const removeRequirement = (idx: number, isEdit: boolean) => {
        if (isEdit && editingDomain) {
            const dt = editingDomain.demoTask || { title: "", description: "", requirements: [], deliverable: "" };
            setEditingDomain({
                ...editingDomain,
                demoTask: { ...dt, requirements: dt.requirements.filter((_, i) => i !== idx) }
            });
        } else {
            setNewDomain({
                ...newDomain,
                demoTask: { ...newDomain.demoTask, requirements: newDomain.demoTask.requirements.filter((_, i) => i !== idx) }
            });
        }
    };

    const handleLoadDemo = async () => {
        confirmToast("Synchronize demo ecosystem?", async () => {
            setLoading(true);
            const demoData = [
                {
                    name: "Full Stack Development",
                    stacks: ["React", "Node.js", "Next.js", "MongoDB", "TypeScript"],
                    questions: [
                        { question: "Which hook manages state in React?", options: ["useEffect", "useState", "useMemo", "useRef"], correctAnswer: 1 },
                        { question: "HTTP 404 means?", options: ["OK", "Unauthorized", "Not Found", "Server Error"], correctAnswer: 2 },
                        { question: "NodeJS is based on which engine?", options: ["V8", "SpiderMonkey", "Chakra", "Gecko"], correctAnswer: 0 }
                    ],
                    demoTask: {
                        title: "Core Architecture Assessment",
                        description: "Engineer a mini CRUD application (Todo list, Memo hub, or Task engine) using React/Next.js.",
                        requirements: ["Component architecture", "Lifecycle management", "Form validation & states"],
                        deliverable: "GitHub Repo + Live Deployment URL"
                    }
                },
                {
                    name: "Frontend Development",
                    stacks: ["React", "Vue.js", "Tailwind CSS", "Redux", "Framer Motion"],
                    questions: [
                        { question: "Side effects in React use?", options: ["useState", "useContext", "useEffect", "useReducer"], correctAnswer: 2 },
                        { question: "What is JSX?", options: ["A style sheet", "Javascript XML", "A database", "A server"], correctAnswer: 1 }
                    ],
                    demoTask: {
                        title: "Interface Synthesis",
                        description: "Design a high-fidelity landing page mockup focusing on visual hierarchy using React.",
                        requirements: ["Design tokens usage", "Responsive layouts", "UX ergonomics"],
                        deliverable: "GitHub Repo + Live Preview"
                    }
                },
                {
                    name: "Marketing & SEO",
                    stacks: ["Google Ads", "Content Strategy", "Email Marketing", "SEO"],
                    questions: [
                        { question: "What is SEO?", options: ["Search Optimization", "Social Outreach", "Email Ops", "Sales Obj"], correctAnswer: 0 },
                        { question: "What is CTR?", options: ["Click Through Rate", "Cost To Run", "Class Time Ratio", "Core Team Result"], correctAnswer: 0 }
                    ],
                    demoTask: {
                        title: "Growth Strategy Sync",
                        description: "Formulate a multi-channel acquisition strategy for a modern SaaS product.",
                        requirements: ["Channel prioritization", "Ad-copy variation", "Funnel mapping"],
                        deliverable: "Notion or PDF Brief Link"
                    }
                }
            ];

            try {
                for (const item of demoData) {
                    await storage.createDomain({
                        name: item.name,
                        stacks: item.stacks,
                        questions: item.questions,
                        demoTask: item.demoTask,
                        createdAt: new Date().toISOString(),
                    });
                }
                toast.success("Demo ecosystem loaded.");
                loadDomains();
            } catch (err: any) {
                console.error("Demo Load Error:", err);
                toast.error(`Failure loading demo: ${err.message || 'Unknown error'}`);
            } finally {
                setLoading(false);
            }
        });
    };

    if (loading || !admin) return null;

    return (
        <Layout>
            <Head>
                <title>Domain Protocols - Cehpoint Admin</title>
            </Head>

            <div className="max-w-[1400px] mx-auto space-y-8 pb-20 p-6 md:p-10">
                <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Domain Matrix</h1>
                        <p className="text-sm text-slate-500 font-medium">Configure primary expertise domains and specialized tech stacks.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={handleLoadDemo}>
                            <Database size={18} />
                            <span>Load Demo Ecosystem</span>
                        </Button>
                        <Button onClick={() => setShowAdd(!showAdd)}>
                            {showAdd ? <X size={18} /> : <Plus size={18} />}
                            <span>{showAdd ? "Close" : "Initialize Domain"}</span>
                        </Button>
                    </div>
                </section>

                <AnimatePresence>
                    {showAdd && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <Card className="bg-slate-50 border-slate-200 p-8 space-y-8">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Domain Identity</label>
                                        <input
                                            type="text"
                                            value={newDomain.name}
                                            onChange={(e) => setNewDomain({ ...newDomain, name: e.target.value })}
                                            className="w-full h-14 px-6 rounded-2xl border border-slate-200 focus:border-indigo-600 outline-none font-bold"
                                            placeholder="e.g. Full Stack Development"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tech Stack Matrix</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={stackInput}
                                                onChange={(e) => setStackInput(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && addStack(false)}
                                                className="flex-1 h-14 px-6 rounded-2xl border border-slate-200 focus:border-indigo-600 outline-none font-bold"
                                                placeholder="Add technology"
                                            />
                                            <button onClick={() => addStack(false)} className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center"><Plus size={20} /></button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {newDomain.stacks.map(s => (
                                                <span key={s} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-2">
                                                    {s} <button onClick={() => removeStack(s, false)}><X size={12} className="text-slate-400 hover:text-rose-500" /></button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-6 border-t border-slate-200">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Verification Quiz</label>
                                        <span className="text-[10px] font-bold text-indigo-600">{newDomain.questions.length} Questions Added</span>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                value={questionInput.question}
                                                onChange={(e) => setQuestionInput({ ...questionInput, question: e.target.value })}
                                                className="w-full h-14 px-6 rounded-2xl border border-slate-100 focus:border-indigo-600 outline-none font-bold text-sm"
                                                placeholder="Enter verification question"
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                {questionInput.options.map((opt, oi) => (
                                                    <input
                                                        key={oi}
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const newOps = [...questionInput.options];
                                                            newOps[oi] = e.target.value;
                                                            setQuestionInput({ ...questionInput, options: newOps });
                                                        }}
                                                        className={`h-11 px-4 rounded-xl border text-xs font-bold outline-none ${questionInput.correctAnswer === oi ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100'}`}
                                                        placeholder={`Option ${oi + 1}`}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <select
                                                    value={questionInput.correctAnswer}
                                                    onChange={(e) => setQuestionInput({ ...questionInput, correctAnswer: Number(e.target.value) })}
                                                    className="h-11 px-4 rounded-xl border border-slate-100 text-xs font-bold outline-none bg-slate-50"
                                                >
                                                    {questionInput.options.map((_, oi) => (
                                                        <option key={oi} value={oi}>Correct: {oi + 1}</option>
                                                    ))}
                                                </select>
                                                <Button onClick={() => addQuestion(false)} className="h-11">Add to Quiz</Button>
                                            </div>
                                        </div>

                                        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                                            {newDomain.questions.map((q, qi) => (
                                                <div key={qi} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-start gap-4">
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-black text-slate-700">{q.question}</p>
                                                        <p className="text-[10px] font-bold text-emerald-600">Answer: {q.options[q.correctAnswer]}</p>
                                                    </div>
                                                    <button onClick={() => removeQuestion(qi, false)} className="text-slate-400 hover:text-rose-500"><Trash2 size={14} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-6 border-t border-slate-200">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Demo Mission Briefing</label>
                                    <div className="grid md:grid-cols-2 gap-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                value={newDomain.demoTask.title}
                                                onChange={(e) => setNewDomain({ ...newDomain, demoTask: { ...newDomain.demoTask, title: e.target.value } })}
                                                className="w-full h-12 px-4 rounded-xl border border-slate-100 focus:border-indigo-600 outline-none font-bold text-sm"
                                                placeholder="Mission Title (e.g. Core Architecture Assessment)"
                                            />
                                            <textarea
                                                value={newDomain.demoTask.description}
                                                onChange={(e) => setNewDomain({ ...newDomain, demoTask: { ...newDomain.demoTask, description: e.target.value } })}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-100 focus:border-indigo-600 outline-none font-bold text-sm min-h-[100px] resize-none"
                                                placeholder="Mission Description..."
                                            />
                                            <input
                                                type="text"
                                                value={newDomain.demoTask.deliverable}
                                                onChange={(e) => setNewDomain({ ...newDomain, demoTask: { ...newDomain.demoTask, deliverable: e.target.value } })}
                                                className="w-full h-12 px-4 rounded-xl border border-slate-100 focus:border-indigo-600 outline-none font-bold text-sm"
                                                placeholder="Required Deliverable (e.g. GitHub Repo URL)"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={requirementInput}
                                                    onChange={(e) => setRequirementInput(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && addRequirement(false)}
                                                    className="flex-1 h-12 px-4 rounded-xl border border-slate-100 focus:border-indigo-600 outline-none font-bold text-sm"
                                                    placeholder="Add Requirement..."
                                                />
                                                <button onClick={() => addRequirement(false)} className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center"><Plus size={18} /></button>
                                            </div>
                                            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                                                {newDomain.demoTask.requirements.map((req, ri) => (
                                                    <div key={ri} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs font-bold text-slate-600">
                                                        <span>{req}</span>
                                                        <button onClick={() => removeRequirement(ri, false)} className="text-slate-400 hover:text-rose-500"><X size={14} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                <div className="pt-6 border-t border-slate-200 flex justify-end">
                                    <Button onClick={handleCreate}>Deploy Domain</Button>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {domains.map(domain => (
                        <Card key={domain.id} className="p-8 space-y-6 hover:shadow-2xl transition-all group overflow-hidden relative">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-700" />

                            <div className="relative z-10 flex justify-between items-start">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <Layers size={24} />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingDomain(domain)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-indigo-600"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(domain.id)} className="p-2 hover:bg-rose-50 rounded-xl transition-colors text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
                                </div>
                            </div>

                            <div className="relative z-10 space-y-4">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">{domain.name}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {domain.stacks.map(stack => (
                                        <span key={stack} className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-md text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            {stack}
                                        </span>
                                    ))}
                                </div>
                                <div className="pt-2 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <Database size={10} /> {(domain.questions || []).length} Questions
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <AnimatePresence>
                    {editingDomain && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                                <div className="p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
                                    <h3 className="text-2xl font-black text-slate-900">Modify Configuration</h3>
                                    <button onClick={() => setEditingDomain(null)}><X size={24} /></button>
                                </div>

                                <div className="p-8 space-y-8 overflow-y-auto">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Main Domain Name</label>
                                        <input
                                            type="text"
                                            value={editingDomain.name}
                                            onChange={(e) => setEditingDomain({ ...editingDomain, name: e.target.value })}
                                            className="w-full h-14 px-6 rounded-2xl border border-slate-100 focus:border-indigo-600 outline-none font-bold"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tech Stacks</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={stackInput}
                                                onChange={(e) => setStackInput(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && addStack(true)}
                                                className="flex-1 h-14 px-6 rounded-2xl border border-slate-100 focus:border-indigo-600 outline-none font-bold text-sm"
                                                placeholder="Add tech..."
                                            />
                                            <button onClick={() => addStack(true)} className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center"><Plus size={20} /></button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {editingDomain.stacks.map(s => (
                                                <span key={s} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-2">
                                                    {s} <button onClick={() => removeStack(s, true)}><X size={12} /></button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-6 border-t border-slate-100">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Verification Quiz</label>
                                            <span className="text-[10px] font-bold text-indigo-600">{(editingDomain.questions || []).length} synced</span>
                                        </div>

                                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                                            <input
                                                type="text"
                                                value={questionInput.question}
                                                onChange={(e) => setQuestionInput({ ...questionInput, question: e.target.value })}
                                                className="w-full h-12 px-4 rounded-xl border border-slate-200 outline-none font-bold text-sm"
                                                placeholder="New question..."
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                {questionInput.options.map((opt, oi) => (
                                                    <input
                                                        key={oi}
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const newOps = [...questionInput.options];
                                                            newOps[oi] = e.target.value;
                                                            setQuestionInput({ ...questionInput, options: newOps });
                                                        }}
                                                        className={`h-10 px-3 rounded-lg border text-xs font-bold ${questionInput.correctAnswer === oi ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}
                                                        placeholder={`Option ${oi + 1}`}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <select
                                                    value={questionInput.correctAnswer}
                                                    onChange={(e) => setQuestionInput({ ...questionInput, correctAnswer: Number(e.target.value) })}
                                                    className="flex-1 h-10 px-3 rounded-lg border border-slate-200 text-xs font-bold"
                                                >
                                                    {questionInput.options.map((_, oi) => (
                                                        <option key={oi} value={oi}>Correct: {oi + 1}</option>
                                                    ))}
                                                </select>
                                                <button onClick={() => addQuestion(true)} className="px-4 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-2"><Plus size={14} /> Add</button>
                                            </div>

                                            <div className="space-y-2 mt-2">
                                                {(editingDomain.questions || []).map((q, qi) => (
                                                    <div key={qi} className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                                                        <p className="text-[11px] font-bold text-slate-600 truncate mr-4">{q.question}</p>
                                                        <button onClick={() => removeQuestion(qi, true)} className="text-slate-400 hover:text-rose-500"><X size={14} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-6 border-t border-slate-100">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Demo Mission Briefing</label>
                                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                                            <input
                                                type="text"
                                                value={editingDomain.demoTask?.title || ""}
                                                onChange={(e) => setEditingDomain({ ...editingDomain, demoTask: { ...(editingDomain.demoTask || { title: "", description: "", requirements: [], deliverable: "" }), title: e.target.value } })}
                                                className="w-full h-12 px-4 rounded-xl border border-slate-200 outline-none font-bold text-sm"
                                                placeholder="Mission Title..."
                                            />
                                            <textarea
                                                value={editingDomain.demoTask?.description || ""}
                                                onChange={(e) => setEditingDomain({ ...editingDomain, demoTask: { ...(editingDomain.demoTask || { title: "", description: "", requirements: [], deliverable: "" }), description: e.target.value } })}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-bold text-sm min-h-[80px] resize-none"
                                                placeholder="Mission Description..."
                                            />
                                            <input
                                                type="text"
                                                value={editingDomain.demoTask?.deliverable || ""}
                                                onChange={(e) => setEditingDomain({ ...editingDomain, demoTask: { ...(editingDomain.demoTask || { title: "", description: "", requirements: [], deliverable: "" }), deliverable: e.target.value } })}
                                                className="w-full h-12 px-4 rounded-xl border border-slate-200 outline-none font-bold text-sm"
                                                placeholder="Required Deliverable..."
                                            />

                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={requirementInput}
                                                    onChange={(e) => setRequirementInput(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && addRequirement(true)}
                                                    className="flex-1 h-10 px-3 rounded-lg border border-slate-200 outline-none font-bold text-xs"
                                                    placeholder="Add Requirement..."
                                                />
                                                <button onClick={() => addRequirement(true)} className="px-4 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-2"><Plus size={14} /> Add</button>
                                            </div>

                                            <div className="space-y-2 mt-2">
                                                {(editingDomain.demoTask?.requirements || []).map((req, ri) => (
                                                    <div key={ri} className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center text-[11px] font-bold text-slate-600">
                                                        <span className="truncate mr-4">{req}</span>
                                                        <button onClick={() => removeRequirement(ri, true)} className="text-slate-400 hover:text-rose-500"><X size={14} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
                                    <Button variant="outline" onClick={() => setEditingDomain(null)} className="flex-1 h-14">Cancel</Button>
                                    <Button onClick={handleUpdate} className="flex-1 h-14">Save Changes</Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </Layout>
    );
}
