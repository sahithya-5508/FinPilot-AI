/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppMode = 'personal' | 'group';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  joinedAt: string;
}

export interface UserPreferences {
  userId: string;
  activeMode: AppMode;
  currency: string;
  theme: 'light' | 'dark';
  isOnboarded?: boolean;
  monthlySalary?: number;
  otherIncome?: number;
  monthlyBudgetLimit?: number;
  savingsGoal?: number;
  rentExpense?: number;
  emiExpense?: number;
  utilitiesExpense?: number;
  internetExpense?: number;
  insuranceExpense?: number;
  spendingStyle?: 'conservative' | 'moderate' | 'flexible';
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdById: string;
  createdAt: string;
  avatar: string;
  color: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  color: string;
  avatar: string;
}

export interface Expense {
  id: string;
  userId: string;
  groupId?: string; // present only in group mode
  amount: number;
  category: string;
  date: string;
  description: string;
  source: 'manual' | 'text' | 'voice' | 'ocr';
  receiptUrl?: string;
  splitWithIds?: string[]; // list of user IDs in group mode
  createdAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  isCustom: boolean;
}

export interface Budget {
  id: string;
  userId: string;
  groupId?: string; // present in group mode
  period: 'weekly' | 'monthly';
  category?: string; // optional: overall budget if empty, or category-specific
  amount: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  groupId?: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  createdAt: string;
  category: 'laptop' | 'mobile' | 'bike' | 'vacation' | 'emergency_fund' | 'other';
}

export interface BillReminder {
  id: string;
  userId: string;
  groupId?: string;
  title: string;
  amount: number;
  category: string;
  dueDate: string;
  frequency: 'once' | 'weekly' | 'monthly' | 'yearly';
  isPaid: boolean;
  googleCalendarEventId?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  isRead: boolean;
  createdAt: string;
}

export interface AIInsight {
  id: string;
  userId: string;
  groupId?: string;
  agentId: string;
  agentName: string;
  title: string;
  insight: string;
  recommendations: string[];
  score?: number; // e.g. for Financial Health Agent
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface VoiceLog {
  id: string;
  userId: string;
  transcript: string;
  parsedAmount?: number;
  parsedCategory?: string;
  parsedDescription?: string;
  createdAt: string;
}

export interface ReceiptUpload {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  extractedAmount?: number;
  extractedCategory?: string;
  extractedMerchant?: string;
  extractedDate?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}
