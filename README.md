# 🌐 Cehpoint Work: Immersive Specialist Platform

Welcome to the **Cehpoint Work** Command Center. This is a high-fidelity, production-grade ecosystem designed for elite specialists to manage missions, track professional growth, and secure transparent payouts.

---

## 🚀 "Model-Ready" Quick Start
If you are an AI model or developer inheriting this project, please follow the documentation index below for a 360-degree understanding of the architecture.

### 📚 Documentation Hub
1.  [**🛠️ Tech Stack & Dependencies**](./docs/TECH_STACK.md): Detailed mapping of Next.js 16, Firebase, Three.js, and Framer Motion roles.
2.  [**🌊 System Flow & State**](./docs/SYSTEM_FLOW.md): End-to-end lifecycle of tasks, currency synchronization, and role-based routing.
3.  [**🗺️ AI-Model Handover Map**](./docs/AI_DEVELOPER_MAP.md): A topological guide to every directory and file, with extension guides for future features.

---

## 🚄 Local Development Suite

### 1. Pre-requisites
- **Node.js**: v20 or higher.
- **Firebase**: A configured project with Auth, Firestore, and Storage enabled.

### 2. Environment Setup
Create a `.env.local` in the root:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Installation & Boot
```bash
# Install high-fidelity dependencies
npm install

# Launch the Command Center (Local Dev)
npm run dev
```

---

## 🏗️ Project Philosophy
**Cehpoint Work** is built on the principle of **Interaction First**. 
- Every transition is managed by **Framer Motion**.
- The onboarding experience uses **WebGL (Three.js)** for ultra-premium immersion.
- The design system follows a **"Command Center"** aesthetic: dark, high-contrast, and informative.

---

## 🛡️ Maintainer Integrity
This repository is optimized for **Clarity and Extensibility**. All business logic is centralized in `/utils/storage.ts` to ensure that data integrity can be audited with zero friction.

*Built with precision by Cehpoint Systems.*
