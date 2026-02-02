// components/Layout.tsx
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";

import {
  LogOut,
  Briefcase,
  Home,
  Calendar,
  Menu,
  X,
  Users,
  Wallet,
  Bell,
  Check,
  Zap,
  ShieldCheck,
  ChevronDown,
  LifeBuoy,
  Layers,
  Clock
} from "lucide-react";

import { storage } from "../utils/storage";
import { useUser } from "../context/UserContext";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout, loading: userLoading } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnreadCount = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isFirstLoad = useRef(true);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // 🔹 Initialize notification sound
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
  }, []);

  const loadNotifications = async (isInitial = false) => {
    if (user) {
      try {
        const list = await storage.getNotifications(user.id);
        const sorted = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const newUnreadCount = sorted.filter(n => !n.read).length;

        // 🔹 Play sound only if unread count increases AND it's not the initial load or a route change
        if (!isInitial && !isFirstLoad.current && newUnreadCount > prevUnreadCount.current) {
          audioRef.current?.play().catch(() => {
            // Browser might block auto-play until user interaction
          });
        }

        setNotifications(sorted);
        setUnreadCount(newUnreadCount);
        prevUnreadCount.current = newUnreadCount;
        if (isInitial) isFirstLoad.current = false;
      } catch (e) { }
    }
  };

  useEffect(() => {
    loadNotifications(true); // Mark as initial load to prevent sound
    const interval = setInterval(() => loadNotifications(false), 30000);

    return () => clearInterval(interval);
  }, [user]); // Removed router.pathname to prevent sound on every toggle

  useEffect(() => {
    if (notificationsOpen && user && unreadCount > 0) {
      const autoMarkRead = async () => {
        try {
          await storage.markAllNotificationsRead(user.id);
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          setUnreadCount(0);
          prevUnreadCount.current = 0;
        } catch (e) { }
      };
      autoMarkRead();
    }
  }, [notificationsOpen, user, unreadCount]);

  useEffect(() => {
    // Auto-redirect if user logs out or session expires
    if (!userLoading && !user && !['/login', '/signup', '/', '/demo-task'].includes(router.pathname)) {
      router.push('/login');
    }

    // 🔹 Strict Access Control: Non-approved workers stay on Dashboard
    if (!userLoading && user && user.role === 'worker' && user.accountStatus !== 'active') {
      const allowedPaths = ['/dashboard', '/demo-task', '/demo-setup'];
      if (!allowedPaths.includes(router.pathname)) {
        router.push('/dashboard');
      }
    }
  }, [user, userLoading, router.pathname]);



  if (userLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Dashboard...</p>
      </div>
    );
  }

  if (!user) return <>{children}</>;

  const isAdmin = user.role === "admin";

  const navLinks = isAdmin
    ? [
      { href: "/admin", label: "Dashboard", icon: Home },
      { href: "/admin/workers", label: "Workers", icon: Users },
      { href: "/admin/daily-work", label: "Work Logs", icon: Calendar },
      { href: "/admin/tasks", label: "Tasks", icon: Briefcase },
      { href: "/admin/payments", label: "Payments", icon: Wallet },
      { href: "/admin/domains", label: "Categories", icon: Layers }
    ]
    : user.accountStatus === "active"
      ? [
        { href: "/dashboard", label: "Dashboard", icon: Home },
        { href: "/work-logs", label: "Work Logs", icon: Calendar },
        { href: "/tasks", label: "Tasks", icon: Briefcase },
        { href: "/payments", label: "Payments", icon: Wallet }
      ]
      : [
        { href: "/dashboard", label: "Dashboard", icon: Home }
      ];

  return (
    <div className="min-h-screen bg-[#FDFDFF] selection:bg-indigo-600 selection:text-white">
      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled ? 'bg-white/80 backdrop-blur-2xl border-b border-slate-100 py-3 shadow-xl shadow-slate-900/5' : 'bg-transparent py-6'
        }`}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="flex justify-between items-center">

            <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-3 group">
              <span className="text-xl font-black tracking-tight text-slate-900 uppercase">
                Cehpoint <span className="text-indigo-600">Work</span>
              </span>
            </Link>

            {/* DESKTOP MENU */}
            <div className="hidden lg:flex items-center gap-1.5 p-1.5 bg-slate-100/50 rounded-[2rem] border border-slate-200/50 backdrop-blur-md">
              {navLinks.map((link) => {
                const isActive = router.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex items-center gap-2.5 px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${isActive ? 'text-indigo-600 bg-white shadow-xl shadow-indigo-600/10' : 'text-slate-400 hover:text-slate-900 hover:bg-white/50'
                      }`}
                  >
                    <link.icon size={14} strokeWidth={isActive ? 3 : 2} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-4">

              {!isAdmin && (
                <div className="relative">
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${unreadCount > 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-white border border-slate-100 text-slate-400 hover:text-slate-900'
                      }`}
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-white text-[9px] font-black flex items-center justify-center">{unreadCount}</span>}
                  </button>

                  <AnimatePresence>
                    {notificationsOpen && (
                      <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-full right-0 mt-4 w-96 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden z-[110]">
                        <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notifications</h3>
                          <button onClick={() => setNotificationsOpen(false)}><X size={16} className="text-slate-300 hover:text-slate-600" /></button>
                        </div>
                        <div className="max-h-[450px] overflow-y-auto p-4 space-y-2">
                          {notifications.length === 0 ? (
                            <div className="py-20 text-center opacity-20">
                              <ShieldCheck size={48} className="mx-auto mb-4" />
                              <p className="text-[10px] font-black uppercase tracking-widest">No notifications</p>
                            </div>
                          ) : (
                            notifications.map(n => (
                              <div key={n.id} className={`p-5 rounded-3xl transition-all border ${!n.read ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50 border-transparent hover:border-slate-100'}`}>
                                <div className="flex justify-between items-start gap-4">
                                  <div className="space-y-1">
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{n.title}</p>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{n.message}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{user.fullName.split(' ')[0]}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{user.role}</span>
                  </div>
                </div>
                <button
                  onClick={() => logout()}
                  className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all group"
                >
                  <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
              </div>

              <button className="lg:hidden w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE MENU */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="lg:hidden absolute top-full left-4 right-4 mt-4 p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl z-[100]">
              <div className="space-y-4">
                {navLinks.map(link => (
                  <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className={`flex items-center gap-4 p-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all ${router.pathname === link.href ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'bg-slate-50 text-slate-500'}`}>
                    <link.icon size={18} /> {link.label}
                  </Link>
                ))}
                <div className="h-px bg-slate-100 my-2" />
                <button onClick={() => { logout(); setMenuOpen(false); }} className="w-full flex items-center gap-4 p-5 bg-rose-50 text-rose-600 rounded-[1.5rem] font-black uppercase tracking-widest text-xs">
                  <LogOut size={18} /> Log Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="pt-28 md:pt-36 pb-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          {children}
        </div>
      </main>

      {/* Footer Meta */}
      <footer className="py-10 border-t border-slate-50 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Cehpoint Work &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
