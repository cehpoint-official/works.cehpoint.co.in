import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { CheckCircle, X } from 'lucide-react';
import { storage, User } from '../utils/storage';
import { initGemini, generateKnowledgeQuestions } from '../utils/gemini';
import Button from '../components/Button';

export default function Signup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [geminiKey, setGeminiKey] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    skills: [] as string[],
    experience: '',
    timezone: '',
    preferredWeeklyPayout: 500,
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [knowledgeQuestions, setKnowledgeQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const skillOptions = [
    'React', 'Node.js', 'Python', 'Java', 'PHP', 'Angular', 'Vue.js',
    'Video Editing', 'Adobe Premiere', 'After Effects', 'UI/UX Design',
    'Graphic Design', 'Content Writing', 'Digital Marketing', 'SEO'
  ];

  const handleSkillToggle = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!formData.email || !formData.password || !formData.fullName || !formData.phone) {
        alert('Please fill all fields');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (selectedSkills.length === 0 || !formData.experience || !formData.timezone) {
        alert('Please complete all fields');
        return;
      }
      setFormData({ ...formData, skills: selectedSkills });
      
      if (!geminiKey) {
        alert('For demo purposes, please enter a Gemini API key or skip with test mode');
        setStep(3);
        setKnowledgeQuestions([
          {
            question: 'Sample Question: What is React?',
            options: ['A Library', 'A Framework', 'A Language', 'A Database'],
            correctAnswer: 0
          }
        ]);
        return;
      }
      
      setLoading(true);
      try {
        initGemini(geminiKey);
        const questions = await generateKnowledgeQuestions(selectedSkills);
        setKnowledgeQuestions(questions);
        setAnswers(new Array(questions.length).fill(-1));
        setStep(3);
      } catch (error) {
        console.error('Error generating questions:', error);
        alert('Using sample questions for demo');
        setKnowledgeQuestions([
          {
            question: 'Sample Question: What is React?',
            options: ['A Library', 'A Framework', 'A Language', 'A Database'],
            correctAnswer: 0
          }
        ]);
        setAnswers([0]);
        setStep(3);
      }
      setLoading(false);
    } else if (step === 3) {
      const correctCount = answers.filter((ans, idx) => ans === knowledgeQuestions[idx].correctAnswer).length;
      const finalScore = (correctCount / knowledgeQuestions.length) * 100;
      setScore(finalScore);
      
      if (finalScore < 60) {
        alert('Knowledge check score too low. Please try again or improve your skills.');
        return;
      }
      
      const newUser: User = {
        id: `worker-${Date.now()}`,
        ...formData,
        skills: selectedSkills,
        accountStatus: 'pending',
        role: 'worker',
        knowledgeScore: finalScore,
        demoTaskCompleted: false,
        createdAt: new Date().toISOString(),
        balance: 0,
      };
      
      const users = storage.getUsers();
      storage.setUsers([...users, newUser]);
      storage.setCurrentUser(newUser);
      
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 py-12">
      <Head>
        <title>Sign Up - Cehpoint</title>
      </Head>

      <div className="max-w-2xl mx-auto px-4 animate-fade-in">
        <div className="text-center mb-10">
          <Link href="/">
            <span className="text-4xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent cursor-pointer hover:scale-110 inline-block transition-transform">
              Cehpoint
            </span>
          </Link>
          <h1 className="text-4xl font-black mt-6 text-gray-900">Join Our Platform</h1>
          <p className="text-gray-600 mt-3 text-lg">Start your project-based work journey today</p>
        </div>

        <div className="glass-card rounded-3xl premium-shadow p-10">
          <div className="flex justify-between mb-10">
            <div className={`flex-1 text-center ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-12 h-12 rounded-full ${step >= 1 ? 'bg-gradient-to-br from-indigo-600 to-purple-600' : 'bg-gray-300'} text-white flex items-center justify-center mx-auto mb-2 font-bold shadow-lg`}>
                {step > 1 ? <CheckCircle size={22} /> : '1'}
              </div>
              <p className="text-sm font-bold">Basic Info</p>
            </div>
            <div className={`flex-1 text-center ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-12 h-12 rounded-full ${step >= 2 ? 'bg-gradient-to-br from-indigo-600 to-purple-600' : 'bg-gray-300'} text-white flex items-center justify-center mx-auto mb-2 font-bold shadow-lg`}>
                {step > 2 ? <CheckCircle size={22} /> : '2'}
              </div>
              <p className="text-sm font-bold">Skills</p>
            </div>
            <div className={`flex-1 text-center ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-12 h-12 rounded-full ${step >= 3 ? 'bg-gradient-to-br from-indigo-600 to-purple-600' : 'bg-gray-300'} text-white flex items-center justify-center mx-auto mb-2 font-bold shadow-lg`}>
                3
              </div>
              <p className="text-sm font-bold">Verification</p>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-3 text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-5 py-4 premium-input rounded-xl text-base font-medium"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-3 text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-5 py-4 premium-input rounded-xl text-base font-medium"
                  placeholder="john@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-3 text-gray-700">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-5 py-4 premium-input rounded-xl text-base font-medium"
                  placeholder="••••••••"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-3 text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-5 py-4 premium-input rounded-xl text-base font-medium"
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-3 text-gray-700">Select Your Skills</label>
                <div className="grid grid-cols-2 gap-2">
                  {skillOptions.map(skill => (
                    <button
                      key={skill}
                      onClick={() => handleSkillToggle(skill)}
                      className={`px-4 py-2 rounded-lg border-2 transition ${
                        selectedSkills.includes(skill)
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-3 text-gray-700">Experience Level</label>
                <select
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="">Select experience</option>
                  <option value="beginner">Beginner (0-1 years)</option>
                  <option value="intermediate">Intermediate (1-3 years)</option>
                  <option value="advanced">Advanced (3-5 years)</option>
                  <option value="expert">Expert (5+ years)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-3 text-gray-700">Timezone</label>
                <input
                  type="text"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                  placeholder="e.g., IST, PST, EST"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-3 text-gray-700">Preferred Weekly Payout ($)</label>
                <input
                  type="number"
                  value={formData.preferredWeeklyPayout}
                  onChange={(e) => setFormData({ ...formData, preferredWeeklyPayout: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                  placeholder="500"
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-bold mb-3 text-gray-700">Gemini API Key (Optional - for AI features)</label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                  placeholder="Enter your Gemini API key or leave blank for demo"
                />
                <p className="text-xs text-gray-600 mt-2">
                  Get your free API key from <a href="https://ai.google.dev" target="_blank" className="text-indigo-600 underline">Google AI Studio</a>
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Knowledge Check</h3>
              <p className="text-sm text-gray-600">Answer these questions to verify your skills</p>
              
              {knowledgeQuestions.map((q, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <p className="font-medium mb-3">{idx + 1}. {q.question}</p>
                  <div className="space-y-2">
                    {q.options.map((option: string, optIdx: number) => (
                      <button
                        key={optIdx}
                        onClick={() => {
                          const newAnswers = [...answers];
                          newAnswers[idx] = optIdx;
                          setAnswers(newAnswers);
                        }}
                        className={`w-full text-left px-4 py-2 rounded-lg border-2 transition ${
                          answers[idx] === optIdx
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-between">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={loading}
              className={step === 1 ? 'ml-auto' : ''}
              fullWidth={step === 1}
            >
              {loading ? 'Loading...' : step === 3 ? 'Complete Signup' : 'Next'}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 font-medium">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
