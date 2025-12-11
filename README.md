# works.cehpoint.co.in
A task-based work platform with worker dashboards, admin controls, payouts, and currency support
# 🚀 **Cehpoint Workforce Platform**

*A modern task-based workforce & payout management system built with Next.js + Firebase.*

<p align="center">
  <img src="https://i.imgur.com/gceC2lK.png" width="500" />
</p>

---

## 🏅 **Badges**

<p align="left">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=nextdotjs" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-blue?style=for-the-badge&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Firebase-Firestore-orange?style=for-the-badge&logo=firebase" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel" />
</p>

---

## 📸 **UI Preview**

### **Worker Dashboard**

![Worker Dashboard](https://i.imgur.com/7RCQYQg.png)

### **Admin Task Manager**

![Admin Tasks](https://i.imgur.com/DQC7qi1.png)

---

## 🧭 System Architecture
<p align="center">
  <img src="https://i.imgur.com/uq1zIzd.png" width="700"/>
</p>


---

## ✨ **Core Features**

### 👷 Workers

* Personalized dashboard
* Choose currency (**USD / INR**)
* Skill-based task recommendations
* Daily submission system
* Withdraw via **UPI / Bank**
* Update profile, skills & payout details

### 🛠️ Admin

* Approve / suspend / terminate workers
* Create, assign, approve, reject tasks
* Manage payments & withdrawal requests
* Platform-wide analytics
* Currency preference control

---

## 🧰 **Tech Stack**

| Layer    | Technology                    |
| -------- | ----------------------------- |
| Frontend | Next.js 14, React, TypeScript |
| Styling  | Tailwind CSS                  |
| Backend  | Firebase Firestore            |
| Hosting  | Vercel                        |
| Icons    | Lucide Icons                  |

---

## 📦 **Installation**

```bash
git clone https://github.com/cehpoint-official/work-platform.git
cd work-platform
npm install
npm run dev
```

---

## 🔐 **Environment Variables**

Create `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## 💱 **Currency Logic**

* Base storage currency → **USD**
* Worker/Admin can switch UI currency
* Auto-convert amounts using fixed INR rate
* Dynamic icon switch (₹ / $)

---

## 🗺️ **Roadmap**

* Real-time Firestore listeners
* Monthly earning reports
* Automated UPI verification
* Worker KYC onboarding

---

## 👤 **Author**

**Sarthak Roy**
GitHub: [https://github.com/cehpoint-official](https://github.com/cehpoint-official)
