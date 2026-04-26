import React, { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  orderBy, 
  limit 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { User, Task, Submission } from "../types";
import { 
  Trophy, 
  Star, 
  CheckCircle2, 
  ArrowUpRight, 
  Clock, 
  MessageSquare,
  ShieldCheck,
  Send
} from "lucide-react";
import { cn, formatDate } from "../lib/utils";
import Markdown from "react-markdown";

interface AmbassadorDashboardProps {
  user: User;
  view: string;
  setView: (v: any) => void;
}

export default function AmbassadorDashboard({ user, view, setView }: AmbassadorDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [view]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (view === "dashboard" || view === "tasks") {
        const tasksSnap = await getDocs(query(collection(db, "tasks"), where("status", "==", "active"), orderBy("createdAt", "desc")));
        setTasks(tasksSnap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
        
        const mySubSnap = await getDocs(query(collection(db, "submissions"), where("ambassadorId", "==", user.uid)));
        setSubmissions(mySubSnap.docs.map(d => ({ id: d.id, ...d.data() } as Submission)));
      }
      
      if (view === "leaderboard") {
        const leaderboardSnap = await getDocs(query(collection(db, "users"), where("role", "==", "ambassador"), orderBy("points", "desc"), limit(10)));
        setLeaderboard(leaderboardSnap.docs.map(d => ({ ...(d.data() as User), uid: d.id })));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "ambassador_data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmission = async (contentUrl: string, notes: string) => {
    if (!selectedTask) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "submissions"), {
        taskId: selectedTask.id,
        taskTitle: selectedTask.title,
        ambassadorId: user.uid,
        ambassadorName: user.name,
        contentUrl,
        notes,
        status: "pending",
        submittedAt: serverTimestamp(),
      });
      setSelectedTask(null);
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "submissions");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (view === "leaderboard") {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
            <Trophy size={48} className="mx-auto text-stone-900 mb-4" />
            <h2 className="text-4xl font-serif font-medium mb-2">Hall of Fame</h2>
            <p className="text-stone-400">Our top performing ambassadors this month</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
            {leaderboard.map((u, idx) => (
                <div key={u.uid} className={cn(
                    "p-6 flex items-center justify-between border-b border-stone-50 last:border-0",
                    u.uid === user.uid ? "bg-stone-50" : ""
                )}>
                    <div className="flex items-center gap-6">
                        <span className={cn(
                             "w-8 text-xl font-serif italic font-bold",
                             idx === 0 ? "text-stone-900" : "text-stone-300"
                        )}>{idx + 1}</span>
                        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-400">
                             {u.name[0]}
                        </div>
                        <div>
                            <h4 className="font-medium text-stone-900 flex items-center gap-2">
                                {u.name}
                                {u.uid === user.uid && <span className="text-[10px] bg-stone-900 text-white px-2 py-0.5 rounded-full uppercase">You</span>}
                            </h4>
                            <p className="text-xs text-stone-400 uppercase tracking-widest">{u.college || "Global Ambassador"}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-xl font-bold text-stone-900">{u.points}</span>
                        <p className="text-[10px] text-stone-400 uppercase tracking-widest">Points</p>
                    </div>
                </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header Stat Area */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
            <h2 className="text-4xl font-serif font-medium mb-2">Hello, {user.name.split(' ')[0]}</h2>
            <p className="text-stone-500">You have <span className="text-stone-900 font-bold">{tasks.length} tasks</span> available today.</p>
        </div>
        <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl shadow-sm border border-stone-100">
             <div className="p-2 bg-stone-900 text-white rounded-lg"><Star size={20} /></div>
             <div>
                 <span className="block text-2xl font-bold leading-none">{user.points}</span>
                 <span className="text-[10px] text-stone-400 uppercase tracking-widest">Total Points</span>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-serif font-medium flex items-center gap-2">
                Available Opportunities
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tasks.map(task => {
                    const submission = submissions.find(s => s.taskId === task.id);
                    return (
                        <div 
                            key={task.id} 
                            onClick={() => !submission && setSelectedTask(task)}
                            className={cn(
                                "bg-white p-6 rounded-3xl border border-stone-100 transition-all group overflow-hidden relative",
                                submission ? "opacity-60 cursor-default" : "hover:border-stone-900 cursor-pointer hover:shadow-xl hover:-translate-y-1"
                            )}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="px-3 py-1 bg-stone-50 rounded-full text-[10px] font-bold uppercase tracking-wider text-stone-500">{task.type}</span>
                                <div className="text-right">
                                    <span className="block text-lg font-bold text-stone-900">+{task.points}</span>
                                    <span className="text-[8px] text-stone-400 uppercase tracking-widest">Points</span>
                                </div>
                            </div>
                            <h4 className="text-xl font-medium mb-2">{task.title}</h4>
                            <p className="text-stone-400 text-sm line-clamp-2 mb-6">{task.description}</p>
                            
                            <div className="flex items-center justify-between text-xs mt-auto pt-4 border-t border-stone-50">
                                <div className="flex items-center gap-1 text-stone-400">
                                    <Clock size={12} />
                                    <span>ENDS {task.deadline ? formatDate(task.deadline) : "N/A"}</span>
                                </div>
                                {submission ? (
                                    <div className={cn(
                                        "flex items-center gap-1 font-bold italic",
                                        submission.status === "approved" ? "text-green-600" :
                                        submission.status === "rejected" ? "text-red-600" : "text-orange-500"
                                    )}>
                                        {submission.status === "approved" ? <ShieldCheck size={14} /> : <Clock size={14} />}
                                        <span className="uppercase text-[10px] tracking-widest">{submission.status}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 text-stone-900 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                        SUBMIT <ArrowUpRight size={14} />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-serif font-medium mb-6">Recent Status</h3>
                <div className="bg-white rounded-3xl border border-stone-100 divide-y divide-stone-50 overflow-hidden">
                    {submissions.length === 0 ? (
                        <div className="p-8 text-center text-stone-400 text-sm">No submissions yet. Start your first task!</div>
                    ) : (
                        submissions.slice(0, 4).map(sub => (
                            <div key={sub.id} className="p-4 flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                    sub.status === "approved" ? "bg-green-50 text-green-600" :
                                    sub.status === "rejected" ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"
                                )}>
                                    {sub.status === "approved" ? <CheckCircle2 size={18} /> : <MessageSquare size={18} />}
                                </div>
                                <div className="min-w-0">
                                    <h5 className="text-sm font-medium truncate">{sub.taskTitle}</h5>
                                    <p className="text-[10px] text-stone-400 uppercase tracking-widest">{sub.status}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="bg-stone-900 p-8 rounded-3xl text-white">
                <h4 className="text-xl font-serif italic mb-4">Ambassador Tip</h4>
                <p className="text-stone-400 text-sm leading-relaxed mb-6">
                    Quality matters more than quantity. Approved high-quality content 
                    content earns you bonus "Legacy" badges.
                </p>
                <button className="text-xs font-bold uppercase tracking-widest border-b border-white/20 pb-1">View Guidelines</button>
            </div>
        </div>
      </div>

      {selectedTask && (
          <SubmitTaskModal 
            task={selectedTask} 
            onClose={() => setSelectedTask(null)} 
            onSubmit={handleSubmission}
            isSubmitting={isSubmitting}
          />
      )}
    </div>
  );
}

function SubmitTaskModal({ task, onClose, onSubmit, isSubmitting }: any) {
    const [url, setUrl] = useState("");
    const [notes, setNotes] = useState("");

    return (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-8">
                    <div className="max-w-lg">
                        <span className="px-3 py-1 bg-stone-50 rounded-full text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-2 inline-block">{task.type}</span>
                        <h3 className="text-3xl font-serif font-medium mb-4">{task.title}</h3>
                        <div className="markdown-body text-stone-500 text-sm leading-relaxed prose prose-stone">
                            <Markdown>{task.description}</Markdown>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="block text-3xl font-bold font-serif italic">+{task.points}</span>
                        <span className="text-[10px] text-stone-400 uppercase tracking-widest">Points Reward</span>
                    </div>
                </div>

                <div className="space-y-6 pt-6 border-top border-stone-100">
                    <div>
                        <label className="block text-sm font-medium mb-2">Submission Link (Video/Post/Document)</label>
                        <input 
                            className="w-full px-4 py-3 bg-stone-50 border-none rounded-xl focus:ring-1 focus:ring-stone-900 outline-none"
                            placeholder="https://..."
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Reflections or Notes (Optional)</label>
                        <textarea 
                            className="w-full px-4 py-3 bg-stone-50 border-none rounded-xl min-h-[100px] focus:ring-1 focus:ring-stone-900 outline-none"
                            placeholder="What did you learn? How was the engagement?"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                        <button 
                            onClick={() => onSubmit(url, notes)}
                            disabled={!url || isSubmitting}
                            className="flex-1 py-4 bg-stone-900 text-stone-50 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? "Sending..." : <><Send size={18} /> Submit Entry</>}
                        </button>
                        <button 
                            disabled={isSubmitting}
                            onClick={onClose}
                            className="px-6 py-4 bg-stone-100 text-stone-500 rounded-2xl font-bold"
                        >Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
