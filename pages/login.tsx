// import { useState } from "react";
// import Head from "next/head";
// import Link from "next/link";
// import { useRouter } from "next/router";

// import Button from "../components/Button";

// import { firebaseLogin } from "../utils/authEmailPassword";
// import { googleAuth, githubAuth } from "../utils/authProviders";

// import { db } from "../utils/firebase";
// import { doc, getDoc } from "firebase/firestore";

// export default function Login() {
//   const router = useRouter();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");

//   // ##############################################################
//   // 🔥 MAIN LOGIN HANDLER (Email + Password)
//   // ##############################################################
//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");

//     try {
//       const result = await firebaseLogin(email, password);
//       const uid = result.user.uid;

//       if (!result.user.emailVerified) {
//         setError("Please verify your email first.");
//         return;
//       }

//       // Fetch Firestore user profile
//       const userRef = doc(db, "users", uid);
//       const snap = await getDoc(userRef);

//       if (!snap.exists()) {
//         setError("User profile not found in database.");
//         return;
//       }

//       const user = snap.data();

//       // Save minimal session
//       localStorage.setItem("currentUser", JSON.stringify(user));

//       // Redirect based on role
//       if (user.role === "admin") {
//         router.push("/admin");
//       } else {
//         router.push("/dashboard");
//       }
//     } catch (err) {
//       console.error(err);
//       setError("Invalid email or password.");
//     }
//   };

//   // ##############################################################
//   // 🔥 GOOGLE LOGIN HANDLER
//   // ##############################################################
//   const handleGoogleLogin = async () => {
//     try {
//       const result = await googleAuth();
//       const uid = result.user.uid;

//       const userRef = doc(db, "users", uid);
//       const snap = await getDoc(userRef);

//       if (!snap.exists()) {
//         setError("Account does not exist. Please sign up first.");
//         return;
//       }

//       const user = snap.data();
//       localStorage.setItem("currentUser", JSON.stringify(user));

//       router.push(user.role === "admin" ? "/admin" : "/dashboard");
//     } catch (err) {
//       alert("Google Login Failed");
//     }
//   };

//   // ##############################################################
//   // 🔥 GITHUB LOGIN HANDLER
//   // ##############################################################
//   const handleGithubLogin = async () => {
//     try {
//       const result = await githubAuth();
//       const uid = result.user.uid;

//       const userRef = doc(db, "users", uid);
//       const snap = await getDoc(userRef);

//       if (!snap.exists()) {
//         setError("Account does not exist. Please sign up first.");
//         return;
//       }

//       const user = snap.data();
//       localStorage.setItem("currentUser", JSON.stringify(user));

//       router.push(user.role === "admin" ? "/admin" : "/dashboard");
//     } catch (err) {
//       alert("GitHub Login Failed");
//     }
//   };

//   // ##############################################################
//   // UI
//   // ##############################################################
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 flex items-center justify-center py-12 px-4">
//       <Head>
//         <title>Login - Cehpoint</title>
//       </Head>

//       <div className="max-w-md w-full animate-fade-in">
//         <div className="text-center mb-10">
//           <Link href="/">
//             <span className="text-4xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent cursor-pointer hover:scale-110 inline-block transition-transform">
//               Cehpoint
//             </span>
//           </Link>

//           <h1 className="text-4xl font-black mt-6 text-gray-900">Welcome Back</h1>
//           <p className="text-gray-600 mt-3 text-lg">Login to continue</p>
//         </div>

//         <div className="glass-card rounded-3xl premium-shadow p-10">
//           <form onSubmit={handleLogin} className="space-y-6">
//             {error && (
//               <div className="bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl font-medium">
//                 {error}
//               </div>
//             )}

//             {/* Google Login */}
//             <button
//               type="button"
//               onClick={handleGoogleLogin}
//               className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 px-5 py-3 rounded-xl shadow-sm hover:bg-gray-50 transition"
//             >
//               <img src="/google.png" alt="google" className="w-5 h-5" />
//               <span className="font-medium">Sign in with Google</span>
//             </button>

//             {/* GitHub Login */}
//             <button
//               type="button"
//               onClick={handleGithubLogin}
//               className="w-full flex items-center justify-center gap-2 bg-black text-white px-5 py-3 rounded-xl shadow hover:bg-gray-800 transition"
//             >
//               <img src="/github.png" alt="github" className="w-5 h-5 invert" />
//               <span className="font-medium">Sign in with GitHub</span>
//             </button>

//             <div className="flex items-center gap-3">
//               <div className="flex-1 h-px bg-gray-300" />
//               <span className="text-sm text-gray-500">or</span>
//               <div className="flex-1 h-px bg-gray-300" />
//             </div>

//             {/* Email */}
//             <input
//               type="email"
//               placeholder="Email"
//               className="premium-input w-full py-4 px-5 rounded-xl"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//             />

//             {/* Password */}
//             <input
//               type="password"
//               placeholder="Password"
//               className="premium-input w-full py-4 px-5 rounded-xl"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//             />

//             <Button type="submit" fullWidth>
//               Login to Continue
//             </Button>
//           </form>

//           <div className="mt-8 text-center">
//             <p className="text-base text-gray-600">
//               Don&apos;t have an account?{" "}
//               <Link
//                 href="/signup"
//                 className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline"
//               >
//                 Sign Up Free
//               </Link>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }











// import { useState } from "react";
// import Head from "next/head";
// import Link from "next/link";
// import { useRouter } from "next/router";

// import Button from "../components/Button";

// import { firebaseLogin } from "../utils/authEmailPassword";
// import { googleAuth, githubAuth } from "../utils/authProviders";

// import { db } from "../utils/firebase";
// import { doc, DocumentData, DocumentReference, getDoc } from "firebase/firestore";

// export default function Login() {
//   const router = useRouter();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");

//   // ##############################################################
//   // 🔥 MAIN LOGIN HANDLER (Email + Password)
//   // ##############################################################
//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");

//     try {
//       const result = await firebaseLogin(email, password);
//       const uid = result.user.uid;

//       if (!result.user.emailVerified) {
//         setError("Please verify your email first.");
//         return;
//       }

//       const userRef = doc(db, "users", uid);
//       const snap = await getDoc(userRef);

//       if (!snap.exists()) {
//         setError("User profile not found in database.");
//         return;
//       }

//       const user = snap.data();

//       // 🔥 Auto-update Firestore emailVerified if needed
//       if (result.user.emailVerified && user.emailVerified === false) {
//         await updateDoc(userRef, { emailVerified: true });
//         user.emailVerified = true;
//       }

//       localStorage.setItem("currentUser", JSON.stringify(user));

//       router.push(user.role === "admin" ? "/admin" : "/dashboard");
//     } catch (err) {
//       console.error(err);
//       setError("Invalid email or password.");
//     }
//   };


//   // ##############################################################
//   // 🔥 GOOGLE LOGIN HANDLER
//   // ##############################################################
//   const handleGoogleLogin = async () => {
//     try {
//       const result = await googleAuth();
//       const uid = result.user.uid;

//       const userRef = doc(db, "users", uid);
//       const snap = await getDoc(userRef);

//       if (!snap.exists()) {
//         setError("Account does not exist. Please sign up first.");
//         return;
//       }

//       const user = snap.data();
//       localStorage.setItem("currentUser", JSON.stringify(user));

//       router.push(user.role === "admin" ? "/admin" : "/dashboard");
//     } catch (err) {
//       alert("Google Login Failed");
//     }
//   };

//   // ##############################################################
//   // 🔥 GITHUB LOGIN HANDLER
//   // ##############################################################
//   const handleGithubLogin = async () => {
//     try {
//       const result = await githubAuth();
//       const uid = result.user.uid;

//       const userRef = doc(db, "users", uid);
//       const snap = await getDoc(userRef);

//       if (!snap.exists()) {
//         setError("Account does not exist. Please sign up first.");
//         return;
//       }

//       const user = snap.data();
//       localStorage.setItem("currentUser", JSON.stringify(user));

//       router.push(user.role === "admin" ? "/admin" : "/dashboard");
//     } catch (err) {
//       alert("GitHub Login Failed");
//     }
//   };

//   // ##############################################################
//   // UI
//   // ##############################################################
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 flex items-center justify-center py-12 px-4">
//       <Head>
//         <title>Login - Cehpoint</title>
//       </Head>

//       <div className="max-w-md w-full animate-fade-in">
//         <div className="text-center mb-10">
//           <Link href="/">
//             <span className="text-4xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent cursor-pointer hover:scale-110 inline-block transition-transform">
//               Cehpoint
//             </span>
//           </Link>

//           <h1 className="text-4xl font-black mt-6 text-gray-900">Welcome Back</h1>
//           <p className="text-gray-600 mt-3 text-lg">Login to continue</p>
//         </div>

//         <div className="glass-card rounded-3xl premium-shadow p-10">
//           <form onSubmit={handleLogin} className="space-y-6">
//             {error && (
//               <div className="bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl font-medium">
//                 {error}
//               </div>
//             )}

//             {/* Google Login */}
//             <button
//               type="button"
//               onClick={handleGoogleLogin}
//               className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 px-5 py-3 rounded-xl shadow-sm hover:bg-gray-50 transition"
//             >
//               <img src="/google.png" alt="google" className="w-5 h-5" />
//               <span className="font-medium">Sign in with Google</span>
//             </button>

//             {/* GitHub Login */}
//             <button
//               type="button"
//               onClick={handleGithubLogin}
//               className="w-full flex items-center justify-center gap-2 bg-black text-white px-5 py-3 rounded-xl shadow hover:bg-gray-800 transition"
//             >
//               <img src="/github.png" alt="github" className="w-5 h-5 invert" />
//               <span className="font-medium">Sign in with GitHub</span>
//             </button>

//             <div className="flex items-center gap-3">
//               <div className="flex-1 h-px bg-gray-300" />
//               <span className="text-sm text-gray-500">or</span>
//               <div className="flex-1 h-px bg-gray-300" />
//             </div>

//             {/* Email */}
//             <input
//               type="email"
//               placeholder="Email"
//               className="premium-input w-full py-4 px-5 rounded-xl"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//             />

//             {/* Password */}
//             <input
//               type="password"
//               placeholder="Password"
//               className="premium-input w-full py-4 px-5 rounded-xl"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//             />

//             <Button type="submit" fullWidth>
//               Login to Continue
//             </Button>
//           </form>

//           <div className="mt-8 text-center">
//             <p className="text-base text-gray-600">
//               Don&apos;t have an account?{" "}
//               <Link
//                 href="/signup"
//                 className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline"
//               >
//                 Sign Up Free
//               </Link>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function updateDoc(userRef: DocumentReference<DocumentData, DocumentData>, arg1: { emailVerified: boolean; }) {
//   throw new Error("Function not implemented.");
// }












import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import Button from "../components/Button";

// Firebase login
import { firebaseLogin } from "../utils/authEmailPassword";
import { googleAuth, githubAuth } from "../utils/authProviders";

// Firebase Firestore
import { db } from "../utils/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ======================================================
  // 🔥 EMAIL + PASSWORD LOGIN
  // ======================================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const result = await firebaseLogin(email, password);
      const uid = result.user.uid;

      // Require email verification
      if (!result.user.emailVerified) {
        setError("Please verify your email first.");
        return;
      }

      // Fetch user profile in Firestore
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        setError("User profile missing in database.");
        return;
      }

      const user = snap.data() as any;

      // Sync email verification to Firestore if still false
      if (user.emailVerified === false) {
        await updateDoc(userRef, { emailVerified: true });
        user.emailVerified = true;
      }

      // Save session
      localStorage.setItem("currentUser", JSON.stringify(user));

      // Redirect
      router.push(user.role === "admin" ? "/admin" : "/dashboard");

    } catch (err) {
      console.error(err);
      setError("Invalid email or password.");
    }
  };

  // ======================================================
  // 🔥 GOOGLE LOGIN
  // ======================================================
  const handleGoogleLogin = async () => {
    try {
      const result = await googleAuth();
      const uid = result.user.uid;

      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        setError("Account does not exist. Please sign up first.");
        return;
      }

      const user = snap.data() as any;
      localStorage.setItem("currentUser", JSON.stringify(user));

      router.push(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      console.error(err);
      setError("Google login failed.");
    }
  };

  // ======================================================
  // 🔥 GITHUB LOGIN
  // ======================================================
  const handleGithubLogin = async () => {
    try {
      const result = await githubAuth();
      const uid = result.user.uid;

      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        setError("Account does not exist. Please sign up first.");
        return;
      }

      const user = snap.data() as any;
      localStorage.setItem("currentUser", JSON.stringify(user));

      router.push(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      console.error(err);
      setError("GitHub login failed.");
    }
  };

  // ======================================================
  // UI
  // ======================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 flex items-center justify-center py-12 px-4">
      <Head>
        <title>Login - Cehpoint</title>
      </Head>

      <div className="max-w-md w-full animate-fade-in">
        <div className="text-center mb-10">
          <Link href="/">
            <span className="text-4xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent cursor-pointer hover:scale-110 inline-block transition-transform">
              Cehpoint
            </span>
          </Link>

          <h1 className="text-4xl font-black mt-6 text-gray-900">
            Welcome Back
          </h1>
          <p className="text-gray-600 mt-3 text-lg">Login to continue</p>
        </div>

        <div className="glass-card rounded-3xl premium-shadow p-10">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl font-medium">
                {error}
              </div>
            )}

            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 px-5 py-3 rounded-xl shadow-sm hover:bg-gray-50 transition"
            >
              <img src="/google.png" alt="google" className="w-5 h-5" />
              <span className="font-medium">Sign in with Google</span>
            </button>

            {/* GitHub Login */}
            <button
              type="button"
              onClick={handleGithubLogin}
              className="w-full flex items-center justify-center gap-2 bg-black text-white px-5 py-3 rounded-xl shadow hover:bg-gray-800 transition"
            >
              <img src="/github.png" alt="github" className="w-5 h-5 invert" />
              <span className="font-medium">Sign in with GitHub</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-300" />
              <span className="text-sm text-gray-500">or</span>
              <div className="flex-1 h-px bg-gray-300" />
            </div>

            {/* Email */}
            <input
              type="email"
              placeholder="Email"
              className="premium-input w-full py-4 px-5 rounded-xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* Password */}
            <input
              type="password"
              placeholder="Password"
              className="premium-input w-full py-4 px-5 rounded-xl"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" fullWidth>
              Login to Continue
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-base text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline"
              >
                Sign Up Free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}