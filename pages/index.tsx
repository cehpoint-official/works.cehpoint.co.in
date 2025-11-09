import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight, Briefcase, Clock, DollarSign, Globe, Shield, TrendingUp, Users } from 'lucide-react';

const Home: NextPage = () => {
  return (
    <div className="min-h-screen">
      <Head>
        <title>Cehpoint - Project-Based Work Platform | Earn Weekly with Flexible Projects</title>
        <meta name="description" content="Join Cehpoint's world-class platform for flexible project-based work. Weekly payouts, global opportunities, and quality projects in software development, video editing, and more." />
      </Head>

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Cehpoint
            </div>
            <div className="flex space-x-4">
              <Link href="/login">
                <button className="px-6 py-2 text-indigo-600 hover:text-indigo-700 font-medium">
                  Login
                </button>
              </Link>
              <Link href="/signup">
                <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                  Sign Up
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="gradient-bg text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-5xl font-bold mb-6">
            Work on Your Terms, Get Paid Weekly
          </h1>
          <p className="text-xl mb-8 text-indigo-100 max-w-3xl mx-auto">
            Join Cehpoint's project-based work platform. No long-term commitments, 
            flexible schedules, and weekly payouts for quality work.
          </p>
          <Link href="/signup">
            <button className="px-8 py-4 bg-white text-indigo-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition flex items-center mx-auto space-x-2">
              <span>Start Your Journey</span>
              <ArrowRight />
            </button>
          </Link>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900 animate-fade-in">
            Why Choose Cehpoint?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 card-hover bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="text-indigo-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Flexible Schedule</h3>
              <p className="text-gray-600">
                Work from any timezone, choose your projects, and maintain complete control over your schedule.
              </p>
            </div>

            <div className="text-center p-6 card-hover bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Weekly Payouts</h3>
              <p className="text-gray-600">
                Get paid based on completed projects. No waiting for monthly cycles, withdraw anytime.
              </p>
            </div>

            <div className="text-center p-6 card-hover bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="text-purple-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Career Growth</h3>
              <p className="text-gray-600">
                Top performers get opportunities for full-time positions and higher-paying projects.
              </p>
            </div>

            <div className="text-center p-6 card-hover bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Diverse Projects</h3>
              <p className="text-gray-600">
                Software development, video editing, design, and more. Find projects matching your skills.
              </p>
            </div>

            <div className="text-center p-6 card-hover bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-red-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure Platform</h3>
              <p className="text-gray-600">
                Advanced verification, AI-powered quality checks, and secure payment processing.
              </p>
            </div>

            <div className="text-center p-6 card-hover bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="text-yellow-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Global Opportunities</h3>
              <p className="text-gray-600">
                Work with an international IT company from anywhere in the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900 animate-fade-in">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl font-bold text-indigo-600 mb-4">1</div>
              <h3 className="text-lg font-semibold mb-2">Sign Up</h3>
              <p className="text-gray-600">
                Complete our knowledge check to verify your skills and prevent fake registrations.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl font-bold text-indigo-600 mb-4">2</div>
              <h3 className="text-lg font-semibold mb-2">Demo Task</h3>
              <p className="text-gray-600">
                Complete a demo task to showcase your abilities and qualify for projects.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl font-bold text-indigo-600 mb-4">3</div>
              <h3 className="text-lg font-semibold mb-2">Accept Projects</h3>
              <p className="text-gray-600">
                Browse and accept weekly projects that match your skills and schedule.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl font-bold text-indigo-600 mb-4">4</div>
              <h3 className="text-lg font-semibold mb-2">Get Paid</h3>
              <p className="text-gray-600">
                Complete tasks, earn money, and withdraw anytime to your verified account.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-xl mb-8 text-indigo-100">
            Join thousands of professionals working flexibly on Cehpoint
          </p>
          <Link href="/signup">
            <button className="px-8 py-4 bg-white text-indigo-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition">
              Create Your Account
            </button>
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Cehpoint</h3>
              <p className="text-sm">
                Connecting skilled professionals with project-based work opportunities worldwide.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/signup">Sign Up</Link></li>
                <li><Link href="/login">Login</Link></li>
                <li><Link href="/policies/terms">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Policies</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/policies/privacy">Privacy Policy</Link></li>
                <li><Link href="/policies/payment">Payment Policy</Link></li>
                <li><Link href="/policies/termination">Termination Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:support@cehpoint.com">Contact Us</a></li>
                <li><Link href="/faq">FAQ</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 Cehpoint. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
