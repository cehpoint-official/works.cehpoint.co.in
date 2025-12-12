# works.cehpoint.co.in
A task-based work platform with worker dashboards, admin controls, payouts, and currency support
# 🚀 **Cehpoint Workforce Platform**

*A modern task-based workforce & payout management system built with Next.js + Firebase.*

<p align="center">
  <img src="https://github.com/user-attachments/assets/db8d9d36-13c8-4b99-bd38-a2f879550138"/>
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

![Worker Dashboard](https://github.com/user-attachments/assets/6a24bac5-2fda-4c5a-bd43-1eb3ee84beb5)

### **Admin Task Manager**

![Admin Tasks](https://github.com/user-attachments/assets/3027e180-5122-4b22-ac75-73c0a3126928)

---

## 🧭 System Architecture
<p align="center">
  <img src="https://github.com/user-attachments/assets/6bcd638d-6118-4686-966a-79f44a21885c"/>
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

## 👤 **Contributer**

**Sarthak Roy**
GitHub: (https://github.com/Sarthak4321)
