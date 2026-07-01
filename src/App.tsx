/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, Wallet, ShieldCheck, Users, PiggyBank, Target, Sparkles, 
  LogOut, Menu, X, ArrowLeftRight, HeartPulse, BarChart, Settings, 
  MessageSquare, Bell, CalendarDays, FileText, ChevronDown, Sun, Moon, User, UserX,
  Compass, Trophy
} from 'lucide-react';
import { motion } from 'motion/react';

import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Expenses from './components/Expenses';
import Budgets from './components/Budgets';
import Savings from './components/Savings';
import Agents from './components/Agents';
import Chat from './components/Chat';
import Reminders from './components/Reminders';
import CategorySummary from './components/CategorySummary';
import Copilot from './components/Copilot';
import Onboarding from './components/Onboarding';
import Gamification from './components/Gamification';
import { Expense, Budget, SavingsGoal, Group, Category, BillReminder } from './types';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('finpilot_token'));
  const [user, setUser] = useState<any>(null);
  
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('finpilot_theme');
    if (stored === 'dark') return 'dark';
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('finpilot_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('finpilot_theme', 'light');
    }
  }, [theme]);
  
  // Navigation & Sizing states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'copilot' | 'summary' | 'expenses' | 'budgets' | 'savings' | 'agents' | 'chat' | 'reminders' | 'gamification'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Data Collections state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reminders, setReminders] = useState<BillReminder[]>([]);

  // Auth Success helper
  const handleAuthSuccess = (newToken: string, loggedUser: any) => {
    localStorage.setItem('finpilot_token', newToken);
    setToken(newToken);
    setUser(loggedUser);
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('finpilot_token');
    setToken(null);
    setUser(null);
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!token) return;
    setIsDeleting(true);
    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setExpenses([]);
        setBudgets([]);
        setGoals([]);
        setCategories([]);
        setReminders([]);
        
        // Clean up user specific gamification & other storage
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('finpilot_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        setShowDeleteModal(false);
        handleLogout();
      } else {
        const data = await response.json();
        console.error('Failed to delete account:', data.error);
      }
    } catch (err) {
      console.error('Failed to delete account:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Fetch all operational data
  const refreshAllData = useCallback(async () => {
    if (!token) return;

    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Query core profile
      const userRes = await fetch('/api/auth/me', { headers });
      if (userRes.ok) {
        const u = await userRes.json();
        setUser(u);
      } else {
        // Only log out if it is explicitly an authorization/authentication failure (401/403).
        // For server errors (500, 502, 503, etc.) or transient network issues, keep the token and let it retry.
        if (userRes.status === 401 || userRes.status === 403) {
          handleLogout();
        } else {
          console.error(`Transient profile sync failure: Status ${userRes.status}`);
        }
        return;
      }

      // Query expenses
      const expRes = await fetch('/api/expenses?mode=personal', { headers });
      if (expRes.ok) setExpenses(await expRes.json());

      // Query categories
      const catRes = await fetch('/api/categories', { headers });
      if (catRes.ok) setCategories(await catRes.json());

      // Query budgets
      const budRes = await fetch('/api/budgets', { headers });
      if (budRes.ok) setBudgets(await budRes.json());

      // Query Savings Goals
      const savRes = await fetch('/api/savings', { headers });
      if (savRes.ok) setGoals(await savRes.json());

      // Query bill reminders
      const remRes = await fetch('/api/reminders', { headers });
      if (remRes.ok) setReminders(await remRes.json());

    } catch (err) {
      console.error('Error refreshing platform data:', err);
    }
  }, [token]);

  // Hook to fetch initially and on state toggle
  useEffect(() => {
    if (token) {
      refreshAllData();
    }
  }, [token, refreshAllData]);

  if (!token) {
    return <Auth onSuccess={handleAuthSuccess} />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center font-sans relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-300/20 dark:bg-purple-900/10 blur-[120px]" />
        <div className="text-center space-y-4 relative z-10">
          <div className="h-10 w-10 purple-grad text-white flex items-center justify-center rounded-xl font-bold text-sm shadow-lg shadow-purple-500/20 animate-bounce mx-auto">
            FP
          </div>
          <p className="text-xs text-purple-600 dark:text-purple-400 font-bold animate-pulse">Initializing FinPilot AI Workspace...</p>
        </div>
      </div>
    );
  }

  if (!user.preferences?.isOnboarded) {
    return <Onboarding token={token} defaultName={user.user?.name || user.name || ''} onOnboardComplete={refreshAllData} />;
  }

  // Sidebar item list
  const sidebarItems = [
    { id: 'dashboard', name: 'Dashboard', icon: HeartPulse },
    { id: 'copilot', name: 'Financial Copilot', icon: Compass },
    { id: 'gamification', name: 'Missions & Achievements', icon: Trophy },
    { id: 'summary', name: 'Category Summary', icon: BarChart },
    { id: 'expenses', name: 'Expenses', icon: Wallet },
    { id: 'budgets', name: 'Budgets', icon: Target },
    { id: 'savings', name: 'Savings Vault', icon: PiggyBank },
    { id: 'agents', name: 'AI Advisor Suite', icon: Sparkles },
    { id: 'chat', name: 'Conversational Chat', icon: MessageSquare },
    { id: 'reminders', name: 'Bill Schedules', icon: CalendarDays }
  ];

  const userName = user?.user?.name || user?.name || "User";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      
      {/* 1. Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col ${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-r border-slate-200/50 dark:border-slate-800/50 flex-shrink-0 transition-all duration-300 overflow-hidden`}>
        <div className={`h-16 flex items-center border-b border-slate-200/50 dark:border-slate-800/50 ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4 gap-2'}`}>
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 purple-grad text-white flex items-center justify-center rounded-lg font-bold text-sm shadow-md shadow-purple-500/10 flex-shrink-0">
                FP
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100 truncate">
                FinPilot <span className="text-gradient font-extrabold">AI</span>
              </span>
            </div>
          ) : null}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer flex-shrink-0"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>


        {/* Main navigation menu */}
        <nav className="flex-1 px-2 space-y-1 py-2 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center p-2.5' : 'justify-start px-3 py-2.5'} rounded-xl text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-100/60 dark:border-purple-900/40 font-bold shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-purple-50/30 dark:hover:bg-purple-950/20 border border-transparent'
                }`}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon className={`h-4.5 w-4.5 flex-shrink-0 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'}`} />
                {!sidebarCollapsed && <span className="truncate ml-3 text-left">{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Pro Tip & Logout */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 space-y-3 mt-auto overflow-hidden">
          {!sidebarCollapsed && (
            <div className="purple-grad p-4 rounded-xl text-white shadow-md shadow-purple-500/10">
              <p className="text-[10px] opacity-85 uppercase font-extrabold tracking-wider">Pro Tip</p>
              <p className="text-[11px] mt-1 leading-relaxed opacity-90">
                Ask the AI Advisor in the chat to automatically budget your savings.
              </p>
            </div>
          )}
          
          {/* Theme Toggle in Settings Area */}
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200/50 dark:border-slate-800/50 rounded-xl`}>
            {!sidebarCollapsed ? (
              <>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  {theme === 'dark' ? <Moon className="h-4 w-4 text-purple-400" /> : <Sun className="h-4 w-4 text-amber-500" />}
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </span>
                <button
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-slate-200 dark:bg-purple-600"
                  aria-label="Toggle Theme"
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      theme === 'dark' ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </>
            ) : (
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {theme === 'dark' ? <Moon className="h-5 w-5 text-purple-400" /> : <Sun className="h-5 w-5 text-amber-500" />}
              </button>
            )}
          </div>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 transition cursor-pointer`}
            title={sidebarCollapsed ? "Logout Account" : undefined}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>Logout Account</span>}
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-600 hover:bg-rose-50/50 transition cursor-pointer`}
            title={sidebarCollapsed ? "Delete Account" : undefined}
          >
            <UserX className="h-4 w-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>Delete Account</span>}
          </button>
        </div>
      </aside>

      {/* 2. Mobile Header */}
      <header className="md:hidden h-16 bg-white dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-800/50 px-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 purple-grad text-white flex items-center justify-center rounded-lg font-bold text-xs shadow-md shadow-purple-500/10">
            FP
          </div>
          <span className="text-sm font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            FinPilot <span className="text-gradient font-extrabold">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50 py-3 px-4 space-y-1 absolute top-16 left-0 right-0 z-10 shadow-lg"
        >
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold border border-purple-100/30' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                {item.name}
              </button>
            );
          })}
          
          {/* Mobile Theme Toggle */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-slate-100 dark:border-slate-800/80 mt-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-4 w-4 text-purple-400" /> : <Sun className="h-4 w-4 text-amber-500" />}
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </span>
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-slate-200 dark:bg-purple-600"
              aria-label="Toggle Theme Mobile"
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  theme === 'dark' ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-4.5 w-4.5" />
            Logout Account
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setShowDeleteModal(true);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50/50 cursor-pointer"
          >
            <UserX className="h-4.5 w-4.5" />
            Delete Account
          </button>
        </motion.div>
      )}

      {/* 3. Main Workspace Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar Workspace Controller */}
        <div className="h-16 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 px-6 hidden md:flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-[#8200db]">{userName}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Sync feedback */}
            <span className="text-[10px] text-gray-400 font-medium">Auto-Saving Enabled</span>
          </div>
        </div>

        {/* Tab-driven visual viewport workspace */}
        <div className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard 
              userName={userName}
              user={user}
              expenses={expenses} 
              budgets={budgets} 
              goals={goals} 
              mode="personal" 
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'copilot' && (
            <Copilot 
              userName={userName}
              token={token}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'gamification' && (
            <Gamification 
              userName={userName}
              user={user}
              expenses={expenses}
              budgets={budgets}
              goals={goals}
              reminders={reminders}
            />
          )}

          {activeTab === 'summary' && (
            <CategorySummary 
              userName={userName}
              user={user}
              expenses={expenses}
              budgets={budgets}
              categories={categories}
              goals={goals}
              reminders={reminders}
              token={token}
            />
          )}

          {activeTab === 'expenses' && (
            <Expenses 
              userName={userName}
              expenses={expenses} 
              categories={categories} 
              token={token}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'budgets' && (
            <Budgets 
              userName={userName}
              budgets={budgets} 
              expenses={expenses} 
              categories={categories}
              mode="personal"
              activeGroup={undefined}
              token={token}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'savings' && (
            <Savings 
              userName={userName}
              goals={goals} 
              mode="personal"
              token={token}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'agents' && (
            <Agents 
              userName={userName}
              token={token}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'chat' && (
            <Chat 
              userName={userName}
              token={token}
              expenses={expenses}
              budgets={budgets}
              goals={goals}
              reminders={reminders}
              categories={categories}
            />
          )}

          {activeTab === 'reminders' && (
            <Reminders 
              userName={userName}
              reminders={reminders}
              token={token}
              onRefresh={refreshAllData}
            />
          )}
        </div>
      </main>

      {/* 4. Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 p-6 space-y-6"
          >
            <div className="flex items-center gap-4 text-rose-600">
              <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center flex-shrink-0 border border-rose-100">
                <UserX className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-800">Delete & Reset Account?</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-slate-600 text-xs leading-relaxed space-y-2">
              <p>
                <strong>Warning:</strong> Resetting your account will permanently wipe out all your personal transactions, budgets, active savings goals, scheduled reminders, and agent history.
              </p>
              <p>
                You will be signed out immediately. You can sign in or register again with this same email, starting with everything at zero.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-rose-600/10 disabled:bg-rose-400"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete & Reset'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
