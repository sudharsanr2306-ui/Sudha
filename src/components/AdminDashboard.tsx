import React, { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  orderBy, 
  limit,
  updateDoc,
  doc,
  getDoc
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { User, Task, Submission } from "../types";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  Settings,
  Users,
  Briefcase,
  Sparkles
} from "lucide-react";
import { cn, formatDate } from "../lib/utils";
import { generateTaskDescription } from "../lib/gemini";
import Markdown from "react-markdown";

interface AdminDashboardProps {
  user: User;
  view: string;
  setView: (v: any) => void;
}

export default function AdminDashboard({ user, view, setView }: AdminDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState({ totalAmbassadors: 0, activeTasks: 0, pendingReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [reviewingSubmission, setReviewingSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    fetchData();
  }, [view]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const usersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "ambassador")));
      const tasksSnap = await getDocs(query(collection(db, "tasks"), where("status", "==", "active")));
      const submissionsSnap = await getDocs(query(collection(db, "submissions"), where("status", "==", "pending")));
      
      setStats({
        totalAmbassadors: usersSnap.size,
        activeTasks: tasksSnap.size,
        pendingReviews: submissionsSnap.size
      });

      if (view === "dashboard") {
        const recentSubmissionsQuery = query(
          collection(db, "submissions"), 
          where("status", "==", "pending"),
          limit(5)
        );
        const subSnap = await getDocs(recentSubmissionsQuery);
        setSubmissions(subSnap.docs.map(d => ({ id: d.id, ...d.data() } as Submission)));
      } else if (view === "tasks") {
        const tasksQuery = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
        const tSnap = await getDocs(tasksQuery);
        setTasks(tSnap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "dashboard_data");
    } finally {
      setLoading(false);
    }
  };

  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    description: "",
    points: 50,
    type: "social",
    status: "active"
  });
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.description) return;
    
    try {
      await addDoc(collection(db, "tasks"), {
        ...newTask,
        creatorId: user.uid,
        createdAt: serverTimestamp(),
      });
      setIsCreatingTask(false);
      setNewTask({ title: "", description: "", points: 50, type: "social", status: "active" });
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "tasks");
    }
  };

  const handleAiDescription = async () => {
    if (!newTask.title) return;
    setIsGeneratingAi(true);
    const desc = await generateTaskDescription(newTask.title);
    setNewTask(prev => ({ ...prev, description: desc }));
    setIsGeneratingAi(false);
  };

  const handleReview = async (status: "approved" | "rejected", feedback: string, pointsAwarded: number) => {
    if (!reviewingSubmission) return;
    try {
      const subRef = doc(db, "submissions", reviewingSubmission.id);
      await updateDoc(subRef, {
        status,
        feedback,
        pointsAwarded,
        reviewedAt: serverTimestamp()
      });

      if (status === "approved") {
        const userRef = doc(db, "users", reviewingSubmission.ambassadorId);
        const userSnap = await getDoc(userRef);
        const currentPoints = userSnap.data()?.points || 0;
        await updateDoc(userRef, {
          points: currentPoints + pointsAwarded
        });
      }

      setReviewingSubmission(null);
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "submissions");
    }
  };

  if (view === "tasks") {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-serif font-medium">Program Tasks</h2>
          <button 
            onClick={() => setIsCreatingTask(true)}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-stone-50 rounded-lg hover:bg-stone-800 transition-colors"
          >
            <Plus size={18} /> New Task
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map(task => (
            <div key={task.id} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  task.type === "social" ? "bg-blue-50 text-blue-600" :
                  task.type === "content" ? "bg-purple-50 text-purple-600" : "bg-orange-50 text-orange-600"
                )}>{task.type}</span>
                <span className="text-sm font-bold text-stone-900">{task.points} PTS</span>
              </div>
              <h3 className="text-xl font-medium mb-2">{task.title}</h3>
              <p className="text-stone-500 text-sm line-clamp-3 mb-4">{task.description}</p>
              <div className="flex items-center gap-2 text-stone-400 text-xs mt-auto pt-4 border-t border-stone-50">
                <Clock size={12} />
                <span>Expires {task.deadline ? formatDate(task.deadline) : "N/A"}</span>
              </div>
            </div>
          ))}
        </div>

        {isCreatingTask && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-serif font-medium mb-6">Create New Task</h3>
              <form onSubmit={handleCreateTask} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Campaign Title</label>
                  <div className="flex gap-2">
                    <input 
                      className="flex-1 px-4 py-2 border border-stone-200 rounded-lg focus:ring-1 focus:ring-stone-900 outline-none"
                      value={newTask.title} 
                      onChange={e => setNewTask({...newTask, title: e.target.value})}
                      placeholder="e.g., Share our new collection on Instagram"
                    />
                    <button 
                      type="button"
                      onClick={handleAiDescription}
                      disabled={!newTask.title || isGeneratingAi}
                      className="px-4 py-2 bg-stone-100 text-stone-600 rounded-lg text-sm hover:bg-stone-200 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Sparkles size={14} /> AI Draft
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description (Markdown Supported)</label>
                  <textarea 
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg min-h-[200px] focus:ring-1 focus:ring-stone-900 outline-none font-mono text-sm"
                    value={newTask.description} 
                    onChange={e => setNewTask({...newTask, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Points</label>
                    <input 
                      type="number"
                      className="w-full px-4 py-2 border border-stone-200 rounded-lg"
                      value={newTask.points} 
                      onChange={e => setNewTask({...newTask, points: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <select 
                      className="w-full px-4 py-2 border border-stone-200 rounded-lg"
                      value={newTask.type} 
                      onChange={e => setNewTask({...newTask, type: e.target.value as any})}
                    >
                      <option value="social">Social Media</option>
                      <option value="content">Content Creation</option>
                      <option value="event">Event Promotion</option>
                      <option value="referral">Referral</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 py-3 bg-stone-900 text-stone-50 rounded-xl font-semibold">Create Task</button>
                  <button 
                    type="button" 
                    onClick={() => setIsCreatingTask(false)}
                    className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl font-semibold"
                  >Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Dashboard Overview
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Users size={24} /></div>
            <div>
              <h4 className="text-3xl font-serif font-medium">{stats.totalAmbassadors}</h4>
              <p className="text-stone-400 text-xs uppercase tracking-widest">Ambassadors</p>
            </div>
          </div>
          <div className="h-1 bg-stone-50 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-2/3"></div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Briefcase size={24} /></div>
            <div>
              <h4 className="text-3xl font-serif font-medium">{stats.activeTasks}</h4>
              <p className="text-stone-400 text-xs uppercase tracking-widest">Active Tasks</p>
            </div>
          </div>
           <div className="h-1 bg-stone-50 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 w-1/2"></div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><AlertCircle size={24} /></div>
            <div>
              <h4 className="text-3xl font-serif font-medium">{stats.pendingReviews}</h4>
              <p className="text-stone-400 text-xs uppercase tracking-widest">Pending Reviews</p>
            </div>
          </div>
           <div className="h-1 bg-stone-50 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 w-1/4"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-2xl font-serif font-medium">Recent Activity</h3>
          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
            {submissions.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 size={48} className="mx-auto text-stone-200 mb-4" />
                <p className="text-stone-400">All caught up! No pending submissions.</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-50">
                {submissions.map(sub => (
                  <div key={sub.id} className="p-6 flex items-center justify-between hover:bg-stone-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-400">
                        {sub.ambassadorName?.[0] || "A"}
                      </div>
                      <div>
                        <h4 className="font-medium text-stone-900">{sub.taskTitle || "Campaign Task"}</h4>
                        <p className="text-xs text-stone-400">Submitted by <span className="text-stone-600 font-medium">Ambassador</span> • {formatDate(sub.submittedAt?.toDate())}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setReviewingSubmission(sub)}
                      className="p-2 text-stone-300 hover:text-stone-900 transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-serif font-medium">Insights</h3>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 min-h-[300px]">
             <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[{name: 'Social', val: 45}, {name: 'Event', val: 30}, {name: 'Referral', val: 25}]}>
                  <Bar dataKey="val" radius={[10, 10, 0, 0]}>
                    <Cell fill="#141414" />
                    <Cell fill="#5A5A40" />
                    <Cell fill="#9e9e9e" />
                  </Bar>
                </BarChart>
             </ResponsiveContainer>
             <div className="mt-4 text-center">
               <p className="text-xs text-stone-400 uppercase tracking-widest">Tasks by Category</p>
             </div>
          </div>
        </div>
      </div>

      {reviewingSubmission && (
        <SubmissionReviewModal 
          submission={reviewingSubmission}
          onClose={() => setReviewingSubmission(null)}
          onReview={handleReview}
        />
      )}
    </div>
  );
}

function SubmissionReviewModal({ submission, onClose, onReview }: any) {
  const [feedback, setFeedback] = useState("");
  const [points, setPoints] = useState(submission.pointsAwarded || 50);

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-8">
        <h3 className="text-2xl font-serif font-medium mb-6">Review Submission</h3>
        <div className="space-y-4 mb-8">
          <div className="bg-stone-50 p-4 rounded-xl">
            <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Content Link</p>
            <a href={submission.contentUrl} target="_blank" className="text-blue-600 hover:underline break-all font-mono text-sm">{submission.contentUrl}</a>
          </div>
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Ambassador Notes</p>
            <p className="text-stone-600 text-sm">{submission.notes || "No notes provided."}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Feedback to Ambassador</label>
            <textarea 
              className="w-full px-4 py-2 border border-stone-200 rounded-lg min-h-[100px]"
              value={feedback} 
              onChange={e => setFeedback(e.target.value)}
              placeholder="Good job! Next time try to..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Points to Award</label>
            <input 
              type="number"
              className="w-full px-4 py-2 border border-stone-200 rounded-lg"
              value={points} 
              onChange={e => setPoints(parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="flex gap-4 pt-8">
          <button 
            onClick={() => onReview("approved", feedback, points)}
            className="flex-1 py-3 bg-stone-900 text-stone-50 rounded-xl font-semibold"
          >Approve & Award</button>
          <button 
             onClick={() => onReview("rejected", feedback, 0)}
             className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl font-semibold"
          >Reject</button>
          <button onClick={onClose} className="p-3 text-stone-400 hover:text-stone-900">Cancel</button>
        </div>
      </div>
    </div>
  );
}
