export interface User {
  uid: string;
  name: string;
  email: string;
  role: "admin" | "ambassador";
  college?: string;
  points: number;
  badges?: string[];
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "active" | "draft" | "completed";
  points: number;
  deadline?: string;
  type: "social" | "content" | "event" | "referral";
  creatorId: string;
  createdAt: string;
}

export interface Submission {
  id: string;
  taskId: string;
  ambassadorId: string;
  ambassadorName?: string;
  taskTitle?: string;
  status: "pending" | "approved" | "rejected";
  contentUrl: string;
  notes?: string;
  feedback?: string;
  pointsAwarded?: number;
  submittedAt: any;
  reviewedAt?: any;
}
