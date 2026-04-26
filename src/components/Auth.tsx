import React, { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { User } from "../types";
import { motion } from "motion/react";
import { LogIn, Sparkles, Shield, Rocket } from "lucide-react";

interface AuthProps {
  onAuthSuccess: (user: User) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        onAuthSuccess(userSnap.data() as User);
      } else {
        // Create new user profile
        const newUser: User = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || "New Ambassador",
          email: firebaseUser.email || "",
          role: "ambassador", // Default role
          points: 0,
          badges: [],
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, {
          ...newUser,
          createdAt: serverTimestamp(),
        });
        onAuthSuccess(newUser);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-stone-50 overflow-hidden font-sans">
      <div className="flex-1 p-8 md:p-16 flex flex-col justify-center bg-stone-900 text-stone-50 relative overflow-hidden">
        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-8">
              <Sparkles className="text-stone-400" size={32} />
              <h1 className="text-3xl font-serif italic font-medium tracking-wide">Amplify</h1>
            </div>
            <h2 className="text-5xl md:text-7xl font-serif font-light leading-tight mb-8">
              Scale Your <br />
              <span className="italic text-stone-400">Brand Presence</span>
            </h2>
            <p className="text-stone-400 text-lg mb-12 leading-relaxed">
              Empower your campus ambassadors with a centralized platform to manage tasks, 
              track performance, and reward impact. Moving beyond spreadsheets.
            </p>
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                <Shield className="text-stone-500 mb-2" size={24} />
                <h4 className="font-medium mb-1">Structured</h4>
                <p className="text-sm text-stone-500">Tiered tasks and automated tracking.</p>
              </div>
              <div>
                <Rocket className="text-stone-500 mb-2" size={24} />
                <h4 className="font-medium mb-1">Scalable</h4>
                <p className="text-sm text-stone-500">Manage hundreds of ambassadors with ease.</p>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-20">
          <svg className="absolute -top-24 -right-24 w-96 h-96 blur-3xl fill-stone-800" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" />
          </svg>
          <svg className="absolute bottom-24 -left-24 w-96 h-96 blur-3xl fill-stone-700" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" />
          </svg>
        </div>
      </div>

      <div className="flex-1 p-8 md:p-16 flex flex-col justify-center items-center bg-stone-50">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-sm"
        >
          <div className="mb-12 text-center md:text-left">
            <h3 className="text-2xl font-serif font-medium mb-2">Welcome to Amplify</h3>
            <p className="text-stone-500">Sign in to access your program dashboard</p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-all duration-200 shadow-sm disabled:opacity-50"
          >
            {loading ? (
               <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
            ) : (
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            )}
            <span className="font-semibold text-stone-800">Continue with Google</span>
          </button>

          {error && (
            <p className="mt-4 text-sm text-red-500 text-center">{error}</p>
          )}

          <p className="mt-12 text-center text-xs text-stone-400 uppercase tracking-widest leading-loose">
            Built for High-Growth Brands <br /> & Global Communities
          </p>
        </motion.div>
      </div>
    </div>
  );
}
