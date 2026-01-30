// pages/demo-setup.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Code,
  Video,
  Palette,
  BarChart,
  PenTool,
  User as UserIcon,
  ChevronRight,
  Sparkles,
  Search,
  Zap,
  CheckCircle2,
  Rocket
} from "lucide-react";

import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";

import { storage } from "../utils/storage";
import type { User } from "../utils/types";

type Expertise =
  | "Developer"
  | "Video Editor"
  | "Designer"
  | "Marketing"
  | "Writing"
  | "General";

const EXPERTISE_OPTIONS: { id: Expertise, icon: any, description: string, color: string }[] = [
  { id: "Developer", icon: Code, description: "Full-stack, Frontend, or Backend engineering", color: "bg-blue-500" },
  { id: "Video Editor", icon: Video, description: "Professional video montage & production", color: "bg-rose-500" },
  { id: "Designer", icon: Palette, description: "UI/UX, Graphics, or Product design", color: "bg-purple-500" },
  { id: "Marketing", icon: BarChart, description: "Strategy, SEO, and Growth operations", color: "bg-emerald-500" },
  { id: "Writing", icon: PenTool, description: "Content creation, Copywriting, & Technical writing", color: "bg-amber-500" },
  { id: "General", icon: UserIcon, description: "Operations, QA, and Data entry", color: "bg-indigo-500" },
];

interface DisplayOption {
  id: string;
  name: string;
  icon: any;
  description: string;
  color: string;
}

export default function DemoSetup() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [selectedExpertise, setSelectedExpertise] = useState<string>("Developer");
  const [extraSkills, setExtraSkills] = useState("");
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<DisplayOption[]>([]);

  useEffect(() => {
    const current = storage.getCurrentUser();
    if (!current || current.role !== "worker") {
      router.push("/login");
      return;
    }
    loadDomains(current.id);
  }, [router]);

  const loadDomains = async (userId: string) => {
    try {
      setLoading(true);
      const freshUser = await storage.getUserById(userId);
      const domains = await storage.getDomains();

      const domainOptions = domains.map(d => {
        const lowName = d.name.toLowerCase();
        return {
          id: d.id,
          name: d.name,
          icon: lowName.includes('dev') ? Code :
            lowName.includes('video') ? Video :
              lowName.includes('design') ? Palette :
                lowName.includes('market') ? BarChart :
                  lowName.includes('write') ? PenTool : UserIcon,
          description: d.stacks ? d.stacks.join(", ") : "Expert domain specialization",
          color: lowName.includes('dev') ? "bg-blue-500" :
            lowName.includes('video') ? "bg-rose-500" :
              lowName.includes('design') ? "bg-purple-500" :
                lowName.includes('market') ? "bg-emerald-500" :
                  lowName.includes('write') ? "bg-amber-500" : "bg-indigo-500"
        };
      });

      // 🔹 STRATEGY: Identify exactly ONE target domain
      let finalTargetName = freshUser?.primaryDomain;

      // If missing, check if any of their skills match a known domain name
      if (!finalTargetName && freshUser?.skills) {
        const firstMatch = domainOptions.find(o =>
          freshUser.skills.some(s => s.toLowerCase() === o.name.toLowerCase())
        );
        if (firstMatch) finalTargetName = firstMatch.name;
      }

      let filtered: DisplayOption[] = [];

      if (finalTargetName) {
        // Strict match
        const match = domainOptions.find(o =>
          o.name.toLowerCase().trim() === finalTargetName!.toLowerCase().trim()
        );

        if (match) {
          filtered = [match];
        } else {
          // Fallback manual card for safety
          const lowName = finalTargetName.toLowerCase();
          filtered = [{
            id: 'manual-id',
            name: finalTargetName,
            icon: lowName.includes('dev') ? Code :
              lowName.includes('video') ? Video :
                lowName.includes('design') ? Palette :
                  lowName.includes('market') ? BarChart :
                    lowName.includes('write') ? PenTool : UserIcon,
            description: freshUser?.skills?.join(", ") || "Specialized Assessment",
            color: lowName.includes('dev') ? "bg-blue-500" :
              lowName.includes('video') ? "bg-rose-500" :
                lowName.includes('design') ? "bg-purple-500" :
                  lowName.includes('market') ? "bg-emerald-500" :
                    lowName.includes('write') ? "bg-amber-500" : "bg-indigo-500"
          }];
        }
      } else {
        // 🔹 LAST RESORT: If nothing found, show ONLY the first available domain
        // to prevent showing the whole list as requested.
        filtered = domainOptions.length > 0 ? [domainOptions[0]] : [];
      }

      setOptions(filtered);
      if (filtered.length > 0) setSelectedExpertise(filtered[0].name);

      // Sync State
      if (freshUser) {
        setUser(freshUser);
        storage.setCurrentUser(freshUser);
      }
    } catch (err) {
      console.error("Domain isolation failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    const skills: string[] = [selectedExpertise];
    if (extraSkills.trim()) {
      skills.push(...extraSkills.split(",").map((s) => s.trim()).filter(Boolean));
    }

    // Crucial: Set primaryDomain so demo-task.tsx can load dynamic content
    const primaryDomain = selectedExpertise;

    await storage.updateUser(user.id, { skills, primaryDomain });
    const updatedUser: User = { ...user, skills, primaryDomain };
    storage.setCurrentUser(updatedUser);
    router.push("/demo-task");
  };

  if (loading || !user) return null;

  return (
    <Layout>
      <Head>
        <title>Setup Your Profile - Cehpoint</title>
      </Head>

      <div className="relative min-h-[90vh]">
        <div className="relative z-10 max-w-[1200px] mx-auto pb-24 px-6 pt-12">
          {/* Friendly Header */}
          <section className="text-center space-y-6 max-w-2xl mx-auto mb-16">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-indigo-100 mx-auto border border-slate-100"
            >
              <Rocket size={32} className="text-indigo-600" />
            </motion.div>

            <div className="space-y-3">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight"
              >
                Let&apos;s personalize <span className="text-indigo-600">your journey.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-slate-500 text-lg font-medium leading-relaxed"
              >
                Confirm your primary expertise and add any additional skills. This helps us find the perfect missions for you.
              </motion.p>
            </div>
          </section>

          {/* Centered Large Focus Card */}
          <div className="flex justify-center mb-16">
            <AnimatePresence mode="wait">
              {options.map((option, idx) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  whileHover={{ scale: 1.01 }}
                  className="w-full max-w-2xl cursor-pointer"
                  onClick={() => setSelectedExpertise(option.name)}
                >
                  <div className={`relative overflow-hidden bg-white p-10 md:p-14 rounded-[3.5rem] border-2 transition-all duration-300 shadow-2xl shadow-indigo-100 text-center md:text-left ${selectedExpertise === option.name ? 'border-indigo-600 scale-100' : 'border-slate-100 opacity-60 scale-95 grayscale-[0.5]'
                    }`}>
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-bl-[100%] z-0" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                      <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-white shadow-2xl ${option.color}`}>
                        <option.icon size={40} />
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-center md:justify-start gap-4">
                          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                            {option.name}
                          </h3>
                          {selectedExpertise === option.name && (
                            <div className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full uppercase tracking-widest flex items-center gap-1.5 animate-in zoom-in-50 duration-300">
                              <CheckCircle2 size={12} /> Confirmed
                            </div>
                          )}
                        </div>

                        <p className="text-slate-600 text-lg font-medium">
                          You&apos;ve selected {option.name.toLowerCase()} as your primary domain. You will receive an assessment task tailored to this track.
                        </p>

                        <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                          {option.description.split(',').map((stack) => (
                            <span key={stack} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-2xl text-xs font-bold uppercase tracking-wider">
                              {stack.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Add Extras & Continue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-xl mx-auto space-y-10"
          >
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                  <Search size={14} className="text-indigo-600" /> Additional Expertise
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={extraSkills}
                    onChange={(e) => setExtraSkills(e.target.value)}
                    className="w-full px-8 py-6 bg-slate-50 border-2 border-transparent rounded-[2rem] outline-none focus:border-indigo-600 focus:bg-white transition-all font-bold placeholder:text-slate-300 pl-14 text-lg"
                    placeholder="e.g. React, UX Writing, AWS..."
                  />
                  <Zap className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={20} />
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleSubmit}
                  className="group w-full h-20 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  <span>Begin Task Phase</span>
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-center text-slate-400 text-xs font-medium">
                  Verified your skills? Click to proceed to the briefing.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout >
  );
}
