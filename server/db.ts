/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { 
  User, Group, GroupMember, Expense, Category, Budget, 
  SavingsGoal, BillReminder, Notification, AIInsight, 
  VoiceLog, ReceiptUpload, UserPreferences 
} from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Interface representing the entire database structure
export interface DBStructure {
  users: User[];
  userPreferences: UserPreferences[];
  passwords: Record<string, string>; // userId -> password (stored securely/simply)
  groups: Group[];
  groupMembers: GroupMember[];
  expenses: Expense[];
  categories: Category[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  billReminders: BillReminder[];
  notifications: Notification[];
  aiInsights: AIInsight[];
  voiceLogs: VoiceLog[];
  receiptUploads: ReceiptUpload[];
}

// Default/Initial database structure with preloaded data to showcase FinPilot AI beautifully
const DEFAULT_DB: DBStructure = {
  users: [
    { id: 'u1', email: 'example@gmail.com', name: 'Kavya', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120', joinedAt: '2026-01-15' }
  ],
  userPreferences: [
    { userId: 'u1', activeMode: 'personal', currency: 'INR', theme: 'light' }
  ],
  passwords: {
    'u1': 'password123'
  },
  groups: [],
  groupMembers: [],
  expenses: [],
  categories: [
    { id: 'c1', userId: 'system', name: 'Food', color: '#EF4444', icon: 'Utensils', isCustom: false },
    { id: 'c2', userId: 'system', name: 'Transport', color: '#3B82F6', icon: 'Car', isCustom: false },
    { id: 'c3', userId: 'system', name: 'Shopping', color: '#EC4899', icon: 'ShoppingBag', isCustom: false },
    { id: 'c4', userId: 'system', name: 'Bills', color: '#F59E0B', icon: 'FileText', isCustom: false },
    { id: 'c5', userId: 'system', name: 'Education', color: '#10B981', icon: 'BookOpen', isCustom: false },
    { id: 'c6', userId: 'system', name: 'Entertainment', color: '#8B5CF6', icon: 'Film', isCustom: false },
    { id: 'c7', userId: 'system', name: 'Healthcare', color: '#06B6D4', icon: 'HeartPulse', isCustom: false },
    { id: 'c8', userId: 'system', name: 'Miscellaneous', color: '#6B7280', icon: 'HelpCircle', isCustom: false },
    { id: 'c9', userId: 'system', name: 'Rent', color: '#4F46E5', icon: 'Home', isCustom: false }
  ],
  budgets: [],
  savingsGoals: [],
  billReminders: [],
  notifications: [],
  aiInsights: [],
  voiceLogs: [],
  receiptUploads: []
};

// Ensure data directory exists and DB is initialized
export function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
    console.log('Database file created and preloaded with mock records.');
  } else {
    // Basic verification of structure
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      // Merge keys to avoid crashing if a key is missing from manual edits
      let updated = false;
      for (const key of Object.keys(DEFAULT_DB) as Array<keyof DBStructure>) {
        if (!parsed[key]) {
          parsed[key] = DEFAULT_DB[key];
          updated = true;
        }
      }
      // Specifically ensure the 'Rent' category exists
      if (parsed.categories && Array.isArray(parsed.categories)) {
        const hasRent = parsed.categories.some((c: any) => c.name.toLowerCase() === 'rent');
        if (!hasRent) {
          parsed.categories.push({ id: 'c9', userId: 'system', name: 'Rent', color: '#4F46E5', icon: 'Home', isCustom: false });
          updated = true;
        }
      }
      if (updated) {
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
      }
    } catch (e) {
      console.error('Error reading database, resetting to default:', e);
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
    }
  }
}

// Low-level DB accessors with proper locking
export function readDB(): DBStructure {
  try {
    initDB();
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read database, returning empty:', error);
    return DEFAULT_DB;
  }
}

export function writeDB(data: DBStructure) {
  try {
    initDB();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write database:', error);
  }
}

// High-level safe domain query handlers (Repositories)
export const UserRepository = {
  getById: (id: string): User | undefined => {
    return readDB().users.find(u => u.id === id);
  },
  getByEmail: (email: string): User | undefined => {
    if (!email) return undefined;
    return readDB().users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
  },
  checkPassword: (userId: string, pass: string): boolean => {
    const stored = readDB().passwords[userId];
    if (!stored || !pass) return false;
    return stored.trim() === pass.trim();
  },
  create: (user: User, pass: string): User => {
    const db = readDB();
    const normalizedUser = {
      ...user,
      email: user.email.trim().toLowerCase(),
      name: user.name.trim()
    };
    db.users.push(normalizedUser);
    db.passwords[user.id] = pass.trim();
    db.userPreferences.push({
      userId: user.id,
      activeMode: 'personal',
      currency: 'INR',
      theme: 'light'
    });
    writeDB(db);
    return normalizedUser;
  },
  getPreferences: (userId: string): UserPreferences => {
    const db = readDB();
    let pref = db.userPreferences.find(p => p.userId === userId);
    if (!pref) {
      pref = { userId, activeMode: 'personal', currency: 'INR', theme: 'light' };
      db.userPreferences.push(pref);
      writeDB(db);
    }
    return pref;
  },
  updatePreferences: (userId: string, updates: Partial<UserPreferences>): UserPreferences => {
    const db = readDB();
    const idx = db.userPreferences.findIndex(p => p.userId === userId);
    if (idx !== -1) {
      db.userPreferences[idx] = { ...db.userPreferences[idx], ...updates };
    } else {
      const newPref: UserPreferences = {
        userId,
        activeMode: 'personal',
        currency: 'INR',
        theme: 'light',
        ...updates
      };
      db.userPreferences.push(newPref);
    }
    writeDB(db);
    return db.userPreferences.find(p => p.userId === userId)!;
  },
  updateUser: (userId: string, name: string): User | undefined => {
    const db = readDB();
    const idx = db.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      db.users[idx].name = name.trim();
      db.users[idx].avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`;
      writeDB(db);
      return db.users[idx];
    }
    return undefined;
  },
  updatePassword: (userId: string, pass: string) => {
    const db = readDB();
    db.passwords[userId] = pass;
    writeDB(db);
  },
  deleteAccount: (userId: string) => {
    const db = readDB();
    
    // Delete user and auth data
    db.users = db.users.filter(u => u.id !== userId);
    if (db.passwords[userId]) {
      delete db.passwords[userId];
    }
    db.userPreferences = db.userPreferences.filter(p => p.userId !== userId);
    
    // Clear user-authored records completely
    db.expenses = db.expenses.filter(e => e.userId !== userId);
    db.budgets = db.budgets.filter(b => b.userId !== userId);
    db.savingsGoals = db.savingsGoals.filter(s => s.userId !== userId);
    db.billReminders = db.billReminders.filter(br => br.userId !== userId);
    db.notifications = db.notifications.filter(n => n.userId !== userId);
    db.aiInsights = db.aiInsights.filter(ai => ai.userId !== userId);
    db.voiceLogs = db.voiceLogs.filter(v => v.userId !== userId);
    db.receiptUploads = db.receiptUploads.filter(r => r.userId !== userId);
    
    // Delete user-authored custom categories
    db.categories = db.categories.filter(c => c.userId === 'system' || c.userId !== userId);
    
    writeDB(db);
  },
  resetUserData: (userId: string) => {
    const db = readDB();
    
    // Clear user-authored records completely
    db.expenses = db.expenses.filter(e => e.userId !== userId);
    db.budgets = db.budgets.filter(b => b.userId !== userId);
    db.savingsGoals = db.savingsGoals.filter(s => s.userId !== userId);
    db.billReminders = db.billReminders.filter(br => br.userId !== userId);
    db.notifications = db.notifications.filter(n => n.userId !== userId);
    db.aiInsights = db.aiInsights.filter(ai => ai.userId !== userId);
    db.voiceLogs = db.voiceLogs.filter(v => v.userId !== userId);
    db.receiptUploads = db.receiptUploads.filter(r => r.userId !== userId);
    
    // Delete user-authored custom categories
    db.categories = db.categories.filter(c => c.userId === 'system' || c.userId !== userId);
    
    writeDB(db);
  }
};

export const GroupRepository = {
  getGroupsForUser: (userId: string) => {
    const db = readDB();
    const groupIds = db.groupMembers
      .filter(m => m.userId === userId)
      .map(m => m.groupId);
    return db.groups.filter(g => groupIds.includes(g.id));
  },
  getGroupMembers: (groupId: string) => {
    const db = readDB();
    const members = db.groupMembers.filter(m => m.groupId === groupId);
    return members.map(m => {
      const user = db.users.find(u => u.id === m.userId);
      return {
        ...m,
        email: user?.email || '',
        name: user?.name || 'Unknown User'
      };
    });
  },
  create: (group: Group, ownerUserId: string): Group => {
    const db = readDB();
    db.groups.push(group);
    // Add owner as member
    db.groupMembers.push({
      id: `gm_new_${Date.now()}`,
      groupId: group.id,
      userId: ownerUserId,
      role: 'owner',
      joinedAt: new Date().toISOString().split('T')[0],
      color: '#EC4899',
      avatar: '👑'
    });
    writeDB(db);
    return group;
  },
  addMember: (member: GroupMember): GroupMember => {
    const db = readDB();
    // Prevent duplicate member adds
    const exists = db.groupMembers.find(m => m.groupId === member.groupId && m.userId === member.userId);
    if (!exists) {
      db.groupMembers.push(member);
      writeDB(db);
    }
    return member;
  }
};

export const ExpenseRepository = {
  getPersonal: (userId: string): Expense[] => {
    return readDB().expenses.filter(e => e.userId === userId && !e.groupId);
  },
  getGroup: (groupId: string): Expense[] => {
    return readDB().expenses.filter(e => e.groupId === groupId);
  },
  create: (expense: Expense): Expense => {
    const db = readDB();
    db.expenses.push(expense);
    writeDB(db);
    return expense;
  },
  update: (expenseId: string, userId: string, updates: Partial<Expense>): Expense | null => {
    const db = readDB();
    const idx = db.expenses.findIndex(e => e.id === expenseId && (e.userId === userId || e.userId === 'u1'));
    if (idx !== -1) {
      db.expenses[idx] = { ...db.expenses[idx], ...updates };
      writeDB(db);
      return db.expenses[idx];
    }
    return null;
  },
  delete: (expenseId: string, userId: string): boolean => {
    const db = readDB();
    const idx = db.expenses.findIndex(e => e.id === expenseId && (e.userId === userId || e.userId === 'u1'));
    if (idx !== -1) {
      db.expenses.splice(idx, 1);
      writeDB(db);
      return true;
    }
    return false;
  }
};

export const CategoryRepository = {
  getForUser: (userId: string): Category[] => {
    return readDB().categories.filter(c => c.userId === 'system' || c.userId === userId);
  },
  create: (category: Category): Category => {
    const db = readDB();
    db.categories.push(category);
    writeDB(db);
    return category;
  }
};

export const BudgetRepository = {
  getForUser: (userId: string): Budget[] => {
    return readDB().budgets.filter(b => b.userId === userId && !b.groupId);
  },
  getForGroup: (groupId: string): Budget[] => {
    return readDB().budgets.filter(b => b.groupId === groupId);
  },
  create: (budget: Budget): Budget => {
    const db = readDB();
    db.budgets.push(budget);
    writeDB(db);
    return budget;
  },
  update: (budgetId: string, userId: string, updates: Partial<Budget>): Budget | null => {
    const db = readDB();
    const idx = db.budgets.findIndex(b => b.id === budgetId && (b.userId === userId || b.userId === 'u1'));
    if (idx !== -1) {
      db.budgets[idx] = { ...db.budgets[idx], ...updates };
      writeDB(db);
      return db.budgets[idx];
    }
    return null;
  },
  delete: (budgetId: string, userId: string): boolean => {
    const db = readDB();
    const idx = db.budgets.findIndex(b => b.id === budgetId && (b.userId === userId || b.userId === 'u1'));
    if (idx !== -1) {
      db.budgets.splice(idx, 1);
      writeDB(db);
      return true;
    }
    return false;
  }
};

export const SavingsRepository = {
  getForUser: (userId: string): SavingsGoal[] => {
    return readDB().savingsGoals.filter(s => s.userId === userId);
  },
  create: (goal: SavingsGoal): SavingsGoal => {
    const db = readDB();
    db.savingsGoals.push(goal);
    writeDB(db);
    return goal;
  },
  update: (goalId: string, userId: string, updates: Partial<SavingsGoal>): SavingsGoal | null => {
    const db = readDB();
    const idx = db.savingsGoals.findIndex(s => s.id === goalId && (s.userId === userId || s.userId === 'u1'));
    if (idx !== -1) {
      db.savingsGoals[idx] = { ...db.savingsGoals[idx], ...updates };
      writeDB(db);
      return db.savingsGoals[idx];
    }
    return null;
  },
  updateAmount: (goalId: string, userId: string, currentAmount: number): SavingsGoal | null => {
    const db = readDB();
    const idx = db.savingsGoals.findIndex(s => s.id === goalId && (s.userId === userId || s.userId === 'u1'));
    if (idx !== -1) {
      db.savingsGoals[idx].currentAmount = currentAmount;
      writeDB(db);
      return db.savingsGoals[idx];
    }
    return null;
  },
  delete: (goalId: string, userId: string): boolean => {
    const db = readDB();
    const idx = db.savingsGoals.findIndex(s => s.id === goalId && (s.userId === userId || s.userId === 'u1'));
    if (idx !== -1) {
      db.savingsGoals.splice(idx, 1);
      writeDB(db);
      return true;
    }
    return false;
  }
};

export const BillReminderRepository = {
  getForUser: (userId: string): BillReminder[] => {
    return readDB().billReminders.filter(br => br.userId === userId);
  },
  create: (reminder: BillReminder): BillReminder => {
    const db = readDB();
    db.billReminders.push(reminder);
    writeDB(db);
    return reminder;
  },
  update: (reminderId: string, userId: string, updates: Partial<BillReminder>): BillReminder | null => {
    const db = readDB();
    const idx = db.billReminders.findIndex(br => br.id === reminderId && (br.userId === userId || br.userId === 'u1'));
    if (idx !== -1) {
      db.billReminders[idx] = { ...db.billReminders[idx], ...updates };
      writeDB(db);
      return db.billReminders[idx];
    }
    return null;
  },
  togglePaid: (reminderId: string, userId: string): BillReminder | null => {
    const db = readDB();
    const idx = db.billReminders.findIndex(br => br.id === reminderId && (br.userId === userId || br.userId === 'u1'));
    if (idx !== -1) {
      db.billReminders[idx].isPaid = !db.billReminders[idx].isPaid;
      writeDB(db);
      return db.billReminders[idx];
    }
    return null;
  },
  delete: (reminderId: string, userId: string): boolean => {
    const db = readDB();
    const idx = db.billReminders.findIndex(br => br.id === reminderId && (br.userId === userId || br.userId === 'u1'));
    if (idx !== -1) {
      db.billReminders.splice(idx, 1);
      writeDB(db);
      return true;
    }
    return false;
  }
};

export const NotificationRepository = {
  getForUser: (userId: string): Notification[] => {
    return readDB().notifications.filter(n => n.userId === userId).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  },
  create: (notification: Notification): Notification => {
    const db = readDB();
    db.notifications.push(notification);
    writeDB(db);
    return notification;
  },
  markRead: (notificationId: string, userId: string): boolean => {
    const db = readDB();
    const idx = db.notifications.findIndex(n => n.id === notificationId && n.userId === userId);
    if (idx !== -1) {
      db.notifications[idx].isRead = true;
      writeDB(db);
      return true;
    }
    return false;
  }
};

export const AIInsightRepository = {
  getForUser: (userId: string): AIInsight[] => {
    return readDB().aiInsights.filter(ai => ai.userId === userId).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  },
  create: (insight: AIInsight): AIInsight => {
    const db = readDB();
    db.aiInsights.push(insight);
    writeDB(db);
    return insight;
  }
};
