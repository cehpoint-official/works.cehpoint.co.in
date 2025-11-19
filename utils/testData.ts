// import type { User, Task, Payment } from './types';

// export const testUsers: User[] = [
//   {
//     id: 'admin-1',
//     email: 'admin@cehpoint.com',
//     password: 'admin123',
//     fullName: 'Admin User',
//     phone: '+1234567890',
//     skills: [],
//     experience: 'expert',
//     timezone: 'UTC',
//     preferredWeeklyPayout: 0,
//     accountStatus: 'active',
//     role: 'admin',
//     knowledgeScore: 100,
//     demoTaskCompleted: true,
//     createdAt: new Date('2024-01-01').toISOString(),
//     balance: 0,
//     emailVerified: false
//   },
//   {
//     id: 'worker-1',
//     email: 'john.dev@example.com',
//     password: 'test123',
//     fullName: 'John Anderson',
//     phone: '+1-555-0101',
//     skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
//     experience: 'senior',
//     timezone: 'America/New_York',
//     preferredWeeklyPayout: 800,
//     accountStatus: 'active',
//     role: 'worker',
//     knowledgeScore: 92,
//     demoTaskCompleted: true,
//     createdAt: new Date('2024-10-15').toISOString(),
//     balance: 1450.00,
//     emailVerified: false
//   },
//   {
//     id: 'worker-2',
//     email: 'sarah.designer@example.com',
//     password: 'test123',
//     fullName: 'Sarah Mitchell',
//     phone: '+1-555-0102',
//     skills: ['UI/UX Design', 'Figma', 'Adobe XD', 'Prototyping'],
//     experience: 'mid',
//     timezone: 'Europe/London',
//     preferredWeeklyPayout: 600,
//     accountStatus: 'active',
//     role: 'worker',
//     knowledgeScore: 88,
//     demoTaskCompleted: true,
//     createdAt: new Date('2024-10-20').toISOString(),
//     balance: 925.50,
//     emailVerified: false
//   },
//   {
//     id: 'worker-3',
//     email: 'mike.editor@example.com',
//     password: 'test123',
//     fullName: 'Michael Chen',
//     phone: '+1-555-0103',
//     skills: ['Video Editing', 'After Effects', 'Premiere Pro', 'Motion Graphics'],
//     experience: 'expert',
//     timezone: 'Asia/Singapore',
//     preferredWeeklyPayout: 1000,
//     accountStatus: 'active',
//     role: 'worker',
//     knowledgeScore: 95,
//     demoTaskCompleted: true,
//     createdAt: new Date('2024-09-01').toISOString(),
//     balance: 2340.75,
//     emailVerified: false
//   },
//   {
//     id: 'worker-4',
//     email: 'emma.data@example.com',
//     password: 'test123',
//     fullName: 'Emma Rodriguez',
//     phone: '+1-555-0104',
//     skills: ['Python', 'Data Analysis', 'Machine Learning', 'SQL'],
//     experience: 'senior',
//     timezone: 'America/Los_Angeles',
//     preferredWeeklyPayout: 850,
//     accountStatus: 'active',
//     role: 'worker',
//     knowledgeScore: 90,
//     demoTaskCompleted: true,
//     createdAt: new Date('2024-10-10').toISOString(),
//     balance: 675.00,
//     emailVerified: false
//   },
//   {
//     id: 'worker-5',
//     email: 'alex.mobile@example.com',
//     password: 'test123',
//     fullName: 'Alex Thompson',
//     phone: '+1-555-0105',
//     skills: ['React Native', 'Flutter', 'iOS', 'Android'],
//     experience: 'mid',
//     timezone: 'America/Chicago',
//     preferredWeeklyPayout: 700,
//     accountStatus: 'pending',
//     role: 'worker',
//     knowledgeScore: 85,
//     demoTaskCompleted: true,
//     createdAt: new Date('2024-11-05').toISOString(),
//     balance: 0,
//     emailVerified: false
//   },
//   {
//     id: 'worker-6',
//     email: 'lisa.content@example.com',
//     password: 'test123',
//     fullName: 'Lisa Chang',
//     phone: '+1-555-0106',
//     skills: ['Content Writing', 'SEO', 'Copywriting', 'Marketing'],
//     experience: 'senior',
//     timezone: 'America/Denver',
//     preferredWeeklyPayout: 750,
//     accountStatus: 'active',
//     role: 'worker',
//     knowledgeScore: 87,
//     demoTaskCompleted: true,
//     createdAt: new Date('2024-10-05').toISOString(),
//     balance: 380.00,
//     emailVerified: false
//   },
// ];

// export const testTasks: Task[] = [
//   {
//     id: 'task-1',
//     title: 'E-commerce Dashboard Development',
//     description: 'Build a comprehensive admin dashboard for an e-commerce platform with real-time analytics, order management, and inventory tracking. Requirements: React with TypeScript, Chart.js for analytics, RESTful API integration, Responsive design, Dark mode support.',
//     category: 'Web Development',
//     skills: ['React', 'TypeScript', 'API Integration'],
//     weeklyPayout: 1200,
//     deadline: new Date('2024-11-15').toISOString(),
//     status: 'available',
//     createdAt: new Date('2024-11-01').toISOString(),
//     createdBy: 'admin-1',
//     assignedTo: ''
//   },
//   {
//     id: 'task-2',
//     title: 'Mobile App UI Design',
//     description: 'Design a modern, user-friendly interface for a fitness tracking mobile application including onboarding, workout screens, and progress tracking. Requirements: Figma design files, Mobile-first approach, Light and dark mode, Interactive prototypes, Design system documentation.',
//     category: 'Design',
//     skills: ['UI/UX Design', 'Figma', 'Mobile Design'],
//     weeklyPayout: 900,
//     deadline: new Date('2024-11-20').toISOString(),
//     status: 'in-progress',
//     assignedTo: 'worker-2',
//     createdAt: new Date('2024-11-02').toISOString(),
//     createdBy: 'admin-1',
//   },
//   {
//     id: 'task-3',
//     title: 'Product Launch Video',
//     description: 'Create a compelling 2-minute product launch video for a SaaS platform, including motion graphics, voiceover sync, and brand integration. Requirements: Professional grade editing, 4K resolution, Background music integration, Motion graphics, Color grading.',
//     category: 'Video Editing',
//     skills: ['Video Editing', 'After Effects', 'Motion Graphics'],
//     weeklyPayout: 1500,
//     deadline: new Date('2024-11-18').toISOString(),
//     status: 'in-progress',
//     assignedTo: 'worker-3',
//     createdAt: new Date('2024-10-28').toISOString(),
//     createdBy: 'admin-1',
//   },
//   {
//     id: 'task-4',
//     title: 'Customer Data Analysis',
//     description: 'Analyze customer behavior patterns from e-commerce data, create visualizations, and provide actionable insights for marketing strategy. Requirements: Python with Pandas, Statistical analysis, Data visualization, Jupyter notebooks, Executive summary report.',
//     category: 'Data Science',
//     skills: ['Python', 'Data Analysis', 'SQL'],
//     weeklyPayout: 1050,
//     deadline: new Date('2024-11-25').toISOString(),
//     status: 'available',
//     createdAt: new Date('2024-11-03').toISOString(),
//     createdBy: 'admin-1',
//     assignedTo: ''
//   },
//   {
//     id: 'task-5',
//     title: 'REST API Development',
//     description: 'Develop a scalable RESTful API for a task management system with authentication, real-time updates, and comprehensive documentation. Requirements: Node.js with Express, PostgreSQL database, JWT authentication, API documentation, Unit tests.',
//     category: 'Backend Development',
//     skills: ['Node.js', 'PostgreSQL', 'API Development'],
//     weeklyPayout: 1800,
//     deadline: new Date('2024-11-30').toISOString(),
//     status: 'available',
//     createdAt: new Date('2024-11-04').toISOString(),
//     createdBy: 'admin-1',
//     assignedTo: ''
//   },
//   {
//     id: 'task-6',
//     title: 'Landing Page Optimization',
//     description: 'Redesign and optimize landing page for higher conversion rates, including A/B test setup and performance improvements. Requirements: Modern design principles, Fast loading times, SEO optimization, Mobile responsive, Analytics integration.',
//     category: 'Web Development',
//     skills: ['React', 'UI/UX Design', 'Performance Optimization'],
//     weeklyPayout: 600,
//     deadline: new Date('2024-11-12').toISOString(),
//     status: 'completed',
//     assignedTo: 'worker-1',
//     completedAt: new Date('2024-11-08').toISOString(),
//     createdAt: new Date('2024-10-25').toISOString(),
//     createdBy: 'admin-1',
//   },
// ];

// export const testPayments: Payment[] = [
//   {
//     id: 'payment-1',
//     userId: 'worker-1',
//     taskId: 'task-6',
//     amount: 600,
//     type: 'task-payment',
//     status: 'completed',
//     createdAt: new Date('2024-11-08').toISOString(),
//     completedAt: new Date('2024-11-08').toISOString(),
//   },
//   {
//     id: 'payment-2',
//     userId: 'worker-1',
//     amount: 850,
//     type: 'task-payment',
//     status: 'completed',
//     createdAt: new Date('2024-10-30').toISOString(),
//     completedAt: new Date('2024-10-30').toISOString(),
//   },
//   {
//     id: 'payment-3',
//     userId: 'worker-2',
//     amount: 750,
//     type: 'task-payment',
//     status: 'completed',
//     createdAt: new Date('2024-10-28').toISOString(),
//     completedAt: new Date('2024-10-28').toISOString(),
//   },
//   {
//     id: 'payment-4',
//     userId: 'worker-2',
//     amount: 500,
//     type: 'withdrawal',
//     status: 'completed',
//     createdAt: new Date('2024-11-01').toISOString(),
//     completedAt: new Date('2024-11-03').toISOString(),
//   },
//   {
//     id: 'payment-5',
//     userId: 'worker-3',
//     amount: 1500,
//     type: 'task-payment',
//     status: 'completed',
//     createdAt: new Date('2024-10-20').toISOString(),
//     completedAt: new Date('2024-10-20').toISOString(),
//   },
//   {
//     id: 'payment-6',
//     userId: 'worker-3',
//     amount: 1200,
//     type: 'task-payment',
//     status: 'completed',
//     createdAt: new Date('2024-10-10').toISOString(),
//     completedAt: new Date('2024-10-10').toISOString(),
//   },
//   {
//     id: 'payment-7',
//     userId: 'worker-3',
//     amount: 1000,
//     type: 'withdrawal',
//     status: 'completed',
//     createdAt: new Date('2024-10-25').toISOString(),
//     completedAt: new Date('2024-10-27').toISOString(),
//   },
//   {
//     id: 'payment-8',
//     userId: 'worker-4',
//     amount: 675,
//     type: 'task-payment',
//     status: 'completed',
//     createdAt: new Date('2024-11-05').toISOString(),
//     completedAt: new Date('2024-11-05').toISOString(),
//   },
//   {
//     id: 'payment-9',
//     userId: 'worker-6',
//     amount: 380,
//     type: 'task-payment',
//     status: 'completed',
//     createdAt: new Date('2024-10-15').toISOString(),
//     completedAt: new Date('2024-10-15').toISOString(),
//   },
// ];

// export function initializeTestData() {
//   if (typeof window === 'undefined') return false;
  
//   const existingUsers = localStorage.getItem('cehpoint_users');
//   if (!existingUsers || JSON.parse(existingUsers).length === 0) {
//     localStorage.setItem('cehpoint_users', JSON.stringify(testUsers));
//     localStorage.setItem('cehpoint_tasks', JSON.stringify(testTasks));
//     localStorage.setItem('cehpoint_payments', JSON.stringify(testPayments));
//     console.log('✅ Test data initialized successfully!');
//     return true;
//   }
//   return false;
// }

// export function resetToTestData() {
//   if (typeof window === 'undefined') return;
  
//   localStorage.setItem('cehpoint_users', JSON.stringify(testUsers));
//   localStorage.setItem('cehpoint_tasks', JSON.stringify(testTasks));
//   localStorage.setItem('cehpoint_payments', JSON.stringify(testPayments));
//   sessionStorage.removeItem('cehpoint_current_user');
//   console.log('✅ Data reset to test accounts successfully!');
//   alert('Test data loaded! You can now login with:\n\nAdmin:\nadmin@cehpoint.com / admin123\n\nWorkers (all password: test123):\njohn.dev@example.com - Full-stack Developer\nsarah.designer@example.com - UI/UX Designer\nmike.editor@example.com - Video Editor\nemma.data@example.com - Data Analyst\nalex.mobile@example.com - Mobile Developer (pending)\nlisa.content@example.com - Content Writer');
// }
