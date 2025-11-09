import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LogOut, User, Briefcase, Settings, DollarSign, Home, Calendar } from 'lucide-react';
import { storage, User as UserType } from '../utils/storage';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [user, setUser] = useState<UserType | null>(null);
  const router = useRouter();

  useEffect(() => {
    const currentUser = storage.getCurrentUser();
    setUser(currentUser);
  }, [router.pathname]);

  const handleLogout = () => {
    storage.setCurrentUser(null);
    router.push('/');
  };

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href={user.role === 'admin' ? '/admin' : '/dashboard'}>
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Cehpoint
                </span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {user.role === 'worker' && (
                <>
                  <Link href="/dashboard">
                    <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition">
                      <Home size={18} />
                      <span>Dashboard</span>
                    </button>
                  </Link>
                  <Link href="/tasks">
                    <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition">
                      <Briefcase size={18} />
                      <span>Tasks</span>
                    </button>
                  </Link>
                  <Link href="/payments">
                    <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition">
                      <DollarSign size={18} />
                      <span>Payments</span>
                    </button>
                  </Link>
                </>
              )}

              {user.role === 'admin' && (
                <>
                  <Link href="/admin">
                    <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition">
                      <Home size={18} />
                      <span>Dashboard</span>
                    </button>
                  </Link>
                  <Link href="/admin/workers">
                    <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition">
                      <User size={18} />
                      <span>Workers</span>
                    </button>
                  </Link>
                  <Link href="/admin/daily-work">
                    <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition">
                      <Calendar size={18} />
                      <span>Daily Work</span>
                    </button>
                  </Link>
                  <Link href="/admin/tasks">
                    <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition">
                      <Briefcase size={18} />
                      <span>Tasks</span>
                    </button>
                  </Link>
                </>
              )}

              <div className="border-l border-gray-300 h-6"></div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
