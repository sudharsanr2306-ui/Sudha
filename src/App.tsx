import React, { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, getDocFromServer } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { User as AppUser } from "./types";
import Auth from "./components/Auth";
import AdminDashboard from "./components/AdminDashboard";
import AmbassadorDashboard from "./components/AmbassadorDashboard";
import Navbar from "./components/Navbar";
import { motion, AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"dashboard" | "tasks" | "leaderboard" | "profile">("dashboard");

  useEffect(() => {
    // Validate connection to Firestore
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, "test", "connection"));
      } catch (error) {
        if (error instanceof Error && error.message.includes("offline")) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as AppUser);
          } else {
            // New user triggered by Auth component sign up
            console.log("User doc not found yet");
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUserUpdate = (newUser: AppUser) => {
    setUser(newUser);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={handleUserUpdate} />;
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      <Navbar user={user} setView={setView} currentView={view} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {user.role === "admin" ? (
              <AdminDashboard user={user} view={view} setView={setView} />
            ) : (
              <AmbassadorDashboard user={user} view={view} setView={setView} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
