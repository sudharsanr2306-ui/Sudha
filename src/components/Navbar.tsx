import React from "react";
import { User } from "../types";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { LayoutDashboard, ListTodo, Trophy, UserCircle, LogOut, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";

interface NavbarProps {
  user: User;
  setView: (view: "dashboard" | "tasks" | "leaderboard" | "profile") => void;
  currentView: string;
}

export default function Navbar({ user, setView, currentView }: NavbarProps) {
  const handleLogout = () => signOut(auth);

  const navItems = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "tasks", label: user.role === "admin" ? "Manage Tasks" : "My Tasks", icon: ListTodo },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "profile", label: "Profile", icon: UserCircle },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-bottom border-stone-200 z-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView("dashboard")}>
          <Sparkles className="text-stone-900" size={24} />
          <span className="text-xl font-serif italic font-medium tracking-tight">Amplify</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as any)}
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors duration-200 py-1 border-b-2",
                currentView === item.id
                  ? "text-stone-900 border-stone-900"
                  : "text-stone-400 border-transparent hover:text-stone-600"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-sm font-semibold">{user.name}</span>
            <span className="text-[10px] text-stone-400 uppercase tracking-widest leading-none">
              {user.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-stone-400 hover:text-stone-900 transition-colors duration-200"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}
