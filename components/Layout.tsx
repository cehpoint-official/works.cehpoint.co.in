import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import {
  LogOut,
  Briefcase,
  Home,
  Calendar,
  Menu,
  X,
  Users,
  Wallet,
  LayoutDashboard
} from "lucide-react";

import { storage } from "../utils/storage";
import type { User as UserType } from "../utils/types";
import { useUser } from "../context/UserContext";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout, loading: userLoading } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [router.pathname]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return <>{children}</>;

  const isAdmin = user.role === "admin";

  const linkClass = (path: string) => `
    relative flex items-center gap-2 px-4 py-2 rounded-xl text-[14px] font-semibold transition-all duration-200
    ${router.pathname === path
      ? 'text-indigo-600 bg-indigo-50 border border-indigo-100/50 shadow-sm'
      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/80'}
  `;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm py-3' : 'bg-transparent py-5'
        }`}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="flex justify-between items-center">
            <Link
              href={isAdmin ? "/admin" : "/dashboard"}
              className="flex items-center"
            >
              <span className="text-xl font-bold tracking-tight text-gray-900">
                Cehpoint <span className="text-indigo-600 font-medium">Work</span>
              </span>
            </Link>

            {/* DESKTOP MENU */}
            <div className="hidden lg:flex items-center gap-1.5 p-1.5 bg-white/50 border border-gray-200/50 rounded-2xl">
              {isAdmin ? (
                <>
                  <Link href="/admin" className={linkClass("/admin")}>
                    <Home size={16} />
                    <span>Dashboard</span>
                  </Link>
                  <Link href="/admin/workers" className={linkClass("/admin/workers")}>
                    <Users size={16} />
                    <span>Workers</span>
                  </Link>
                  <Link href="/admin/daily-work" className={linkClass("/admin/daily-work")}>
                    <Calendar size={16} />
                    <span>Logs</span>
                  </Link>
                  <Link href="/admin/tasks" className={linkClass("/admin/tasks")}>
                    <Briefcase size={16} />
                    <span>Tasks</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard" className={linkClass("/dashboard")}>
                    <Home size={16} />
                    <span>Overview</span>
                  </Link>
                  <Link href="/tasks" className={linkClass("/tasks")}>
                    <Briefcase size={16} />
                    <span>My Tasks</span>
                  </Link>
                  <Link href="/payments" className={linkClass("/payments")}>
                    <Wallet size={16} />
                    <span>Earnings</span>
                  </Link>
                </>
              )}
            </div>

            {/* RIGHT: ACTIONS & PROFILE */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 pl-2">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-bold text-gray-900 leading-tight">{user.fullName}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">{user.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all duration-200"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>

              {/* MOBILE HAMBURGER */}
              <button
                className="lg:hidden w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE MENU DROPDOWN */}
        {menuOpen && (
          <div className="lg:hidden absolute top-full left-4 right-4 mt-3 p-5 bg-white border border-gray-200 shadow-xl rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              {isAdmin ? (
                <>
                  <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl font-bold text-sm text-gray-600 transition-all">
                    <Home size={18} /> Dashboard
                  </Link>
                  <Link href="/admin/workers" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl font-bold text-sm text-gray-600 transition-all">
                    <Users size={18} /> Workers
                  </Link>
                  <Link href="/admin/daily-work" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl font-bold text-sm text-gray-600 transition-all">
                    <Calendar size={18} /> Daily Work
                  </Link>
                  <Link href="/admin/tasks" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl font-bold text-sm text-gray-600 transition-all">
                    <Briefcase size={18} /> All Tasks
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl font-bold text-sm text-gray-600 transition-all">
                    <Home size={18} /> Overview
                  </Link>
                  <Link href="/tasks" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl font-bold text-sm text-gray-600 transition-all">
                    <Briefcase size={18} /> My Tasks
                  </Link>
                  <Link href="/payments" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl font-bold text-sm text-gray-600 transition-all">
                    <Wallet size={18} /> Payments
                  </Link>
                </>
              )}
              <div className="h-[1px] bg-gray-100 my-2" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3.5 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-all"
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="pt-24 md:pt-28 pb-20">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
