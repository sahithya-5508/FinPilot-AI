/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { 
  BarChart, Wallet, Target, PiggyBank, Sparkles, MessageSquare, 
  Calendar, ChevronRight, ArrowRight, TrendingUp, Compass, HeartPulse,
  Flame, Trophy, Shield, Award, Crown, Star
} from 'lucide-react';
import { motion } from 'motion/react';
import { Expense, Budget, SavingsGoal, AppMode } from '../types';

interface DashboardProps {
  userName: string;
  user?: any;
  expenses: Expense[];
  budgets: Budget[];
  goals: SavingsGoal[];
  mode: AppMode;
  onNavigate?: (tabId: 'copilot' | 'summary' | 'expenses' | 'budgets' | 'savings' | 'agents' | 'chat' | 'reminders' | 'gamification') => void;
}

const colorThemes: Record<string, {
  bg: string,
  hoverBg: string,
  text: string,
  border: string,
  iconBg: string,
  iconText: string,
  badgeBg: string,
  badgeText: string,
  accentBar: string,
  glow: string
}> = {
  emerald: {
    bg: 'bg-emerald-50/40 dark:bg-emerald-950/10',
    hoverBg: 'hover:bg-emerald-50/80 dark:hover:bg-emerald-950/20',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-200/50 dark:border-emerald-900/30',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-100/60 dark:bg-emerald-900/20',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    accentBar: 'bg-emerald-500',
    glow: 'hover:shadow-emerald-500/5'
  },
  purple: {
    bg: 'bg-purple-50/40 dark:bg-purple-950/10',
    hoverBg: 'hover:bg-purple-50/80 dark:hover:bg-purple-950/20',
    text: 'text-purple-800 dark:text-purple-300',
    border: 'border-purple-200/50 dark:border-purple-900/30',
    iconBg: 'bg-purple-100 dark:bg-purple-900/40',
    iconText: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-100/60 dark:bg-purple-900/20',
    badgeText: 'text-purple-700 dark:text-purple-300',
    accentBar: 'bg-purple-500',
    glow: 'hover:shadow-purple-500/5'
  },
  amber: {
    bg: 'bg-amber-50/40 dark:bg-amber-950/10',
    hoverBg: 'hover:bg-amber-50/80 dark:hover:bg-amber-950/20',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200/50 dark:border-amber-900/30',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconText: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-100/60 dark:bg-amber-900/20',
    badgeText: 'text-amber-700 dark:text-amber-300',
    accentBar: 'bg-amber-500',
    glow: 'hover:shadow-amber-500/5'
  },
  pink: {
    bg: 'bg-pink-50/40 dark:bg-pink-950/10',
    hoverBg: 'hover:bg-pink-50/80 dark:hover:bg-pink-950/20',
    text: 'text-pink-800 dark:text-pink-300',
    border: 'border-pink-200/50 dark:border-pink-900/30',
    iconBg: 'bg-pink-100 dark:bg-pink-900/40',
    iconText: 'text-pink-600 dark:text-pink-400',
    badgeBg: 'bg-pink-100/60 dark:bg-pink-900/20',
    badgeText: 'text-pink-700 dark:text-pink-300',
    accentBar: 'bg-pink-500',
    glow: 'hover:shadow-pink-500/5'
  },
  violet: {
    bg: 'bg-violet-50/40 dark:bg-violet-950/10',
    hoverBg: 'hover:bg-violet-50/80 dark:hover:bg-violet-950/20',
    text: 'text-violet-800 dark:text-violet-300',
    border: 'border-violet-200/50 dark:border-violet-900/30',
    iconBg: 'bg-violet-100 dark:bg-violet-900/40',
    iconText: 'text-violet-600 dark:text-violet-400',
    badgeBg: 'bg-violet-100/60 dark:bg-violet-900/20',
    badgeText: 'text-violet-700 dark:text-violet-300',
    accentBar: 'bg-violet-500',
    glow: 'hover:shadow-violet-500/5'
  },
  sky: {
    bg: 'bg-sky-50/40 dark:bg-sky-950/10',
    hoverBg: 'hover:bg-sky-50/80 dark:hover:bg-sky-950/20',
    text: 'text-sky-800 dark:text-sky-300',
    border: 'border-sky-200/50 dark:border-sky-900/30',
    iconBg: 'bg-sky-100 dark:bg-sky-900/40',
    iconText: 'text-sky-600 dark:text-sky-400',
    badgeBg: 'bg-sky-100/60 dark:bg-sky-900/20',
    badgeText: 'text-sky-700 dark:text-sky-300',
    accentBar: 'bg-sky-500',
    glow: 'hover:shadow-sky-500/5'
  },
  rose: {
    bg: 'bg-rose-50/40 dark:bg-rose-950/10',
    hoverBg: 'hover:bg-rose-50/80 dark:hover:bg-rose-950/20',
    text: 'text-rose-800 dark:text-rose-300',
    border: 'border-rose-200/50 dark:border-rose-900/30',
    iconBg: 'bg-rose-100 dark:bg-rose-900/40',
    iconText: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-100/60 dark:bg-rose-900/20',
    badgeText: 'text-rose-700 dark:text-rose-300',
    accentBar: 'bg-rose-500',
    glow: 'hover:shadow-rose-500/5'
  }
};

export default function Dashboard({ userName, user, expenses, budgets, goals, mode, onNavigate }: DashboardProps) {
  const userId = user?.user?.email || user?.email || "anonymous";
  
  // Dynamic parameters computed based on active application states
  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const checkinStreak = useMemo(() => {
    const saved = localStorage.getItem(`finpilot_checkin_streak_${userId}`);
    const lastCheckin = localStorage.getItem(`finpilot_last_checkin_${userId}`);
    if (!lastCheckin) return 0;

    const todayStr = new Date().toLocaleDateString('en-CA');
    const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');

    if (lastCheckin === todayStr || lastCheckin === yesterdayStr) {
      return saved ? parseInt(saved) : 0;
    }
    return 0;
  }, [userId]);

  const totalXP = useMemo(() => {
    const expXP = expenses.length * 50;
    const budXP = budgets.length * 100;
    const goalXP = goals.length * 150;
    const savedAmount = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
    const savingWeightXP = Math.floor(savedAmount / 10);

    let bonusXP = 0;
    const savedClaims = localStorage.getItem(`finpilot_claimed_rewards_${userId}`);
    if (savedClaims) {
      try {
        const claims = JSON.parse(savedClaims);
        if (Array.isArray(claims)) {
          claims.forEach((id: string) => {
            if (id.startsWith('mission_')) bonusXP += 200;
            if (id.startsWith('challenge_')) bonusXP += 300;
            if (id.startsWith('check_in_')) bonusXP += 50;
          });
        }
      } catch (e) {
        // ignore
      }
    }
    return expXP + budXP + goalXP + savingWeightXP + bonusXP;
  }, [expenses, budgets, goals, userId]);

  const level = useMemo(() => {
    return Math.floor(totalXP / 1000) + 1;
  }, [totalXP]);

  const budgetStreak = useMemo(() => {
    if (budgets.length === 0) return 0;
    let exceededCount = 0;
    budgets.forEach(b => {
      if (b.category) {
        const spent = expenses
          .filter(e => e.category === b.category)
          .reduce((sum, e) => sum + e.amount, 0);
        if (spent > b.amount) exceededCount++;
      }
    });
    return exceededCount === 0 ? 1 : 0;
  }, [budgets, expenses]);

  const modules = useMemo(() => {
    return [
      {
        id: 'copilot' as const,
        name: 'Financial Copilot',
        description: 'Automated goal setting, custom budget optimization strategies, and interactive plan execution.',
        icon: Compass,
        color: 'violet',
        metric: 'AI-Powered Modeler',
        badge: 'Strategic Pilot'
      },
      {
        id: 'summary' as const,
        name: 'Category Summary',
        description: 'Deep dive visual analytics, spending benchmarks, and category allocations.',
        icon: BarChart,
        color: 'emerald',
        metric: `₹${totalSpent.toLocaleString('en-US', { maximumFractionDigits: 0 })} spent`,
        badge: 'Visual Insights'
      },
      {
        id: 'expenses' as const,
        name: 'Expenses Ledger',
        description: 'Track your transaction history, input items, and filter ledger records.',
        icon: Wallet,
        color: 'purple',
        metric: `${expenses.length} transaction entries`,
        badge: 'Ledger'
      },
      {
        id: 'budgets' as const,
        name: 'Budgets Monitor',
        description: 'Establish custom category limits and monitor threshold allocations.',
        icon: Target,
        color: 'amber',
        metric: `${budgets.length} active budgets`,
        badge: 'Spend Thresholds'
      },
      {
        id: 'savings' as const,
        name: 'Savings Vault',
        description: 'Establish financial savings goals, track milestones, and forecast targets.',
        icon: PiggyBank,
        color: 'pink',
        metric: `${goals.length} active milestones`,
        badge: 'Compound Wealth'
      },
      {
        id: 'agents' as const,
        name: 'AI Advisor Suite',
        description: 'Engage autonomous AI agents for personalized wealth guidance.',
        icon: Sparkles,
        color: 'violet',
        metric: '8 Intelligent Advisors',
        badge: 'Smart Agents'
      },
      {
        id: 'chat' as const,
        name: 'Conversational Chat',
        description: 'Chat with FinPilot to log expenses, request advice, and run reports.',
        icon: MessageSquare,
        color: 'sky',
        metric: 'Natural AI helper',
        badge: 'NLP Chat'
      },
      {
        id: 'reminders' as const,
        name: 'Bill Schedules',
        description: 'Track recurring bill payments and upcoming utilities schedules.',
        icon: Calendar,
        color: 'rose',
        metric: 'Schedules & Reminders',
        badge: 'Calendar Deadlines'
      }
    ];
  }, [totalSpent, expenses.length, budgets.length, goals.length]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-purple-900 via-violet-950 to-slate-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-purple-500/5 border border-purple-500/10">
        {/* Decorative ambient background lights */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-fuchsia-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

        <div className="relative z-10 space-y-3">
          <h1 className="text-[35px] leading-[40px] text-left font-extrabold tracking-tight text-slate-50 text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-purple-200">
            FinPilot AI, Your Personal Finance Assistant
          </h1>
          <p className="text-sm md:text-base text-purple-200/90 max-w-2xl leading-relaxed">
            Hey {userName}, here is your unified workspace. Choose where we should make decisions together: manage your ledger, balance budgets, check AI advice, or forecast savings.
          </p>
        </div>
      </div>

      {/* Academy & Habit Streaks Dashboard Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => onNavigate && onNavigate('gamification')}
        className="bg-white dark:bg-slate-900 border border-purple-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-900/60 transition-all duration-300 cursor-pointer flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Missions & Achievements</span>
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">Level {level}</span>
            </div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm mt-0.5">Your Habit-Building & Savings Streaks</h3>
            <p className="text-xs text-slate-400">Unlock custom badges and complete active missions to earn massive XP rewards.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 flex-wrap md:flex-nowrap w-full md:w-auto border-t md:border-t-0 border-slate-100 dark:border-slate-800/80 pt-4 md:pt-0">
          {/* Daily Logging Streak */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/20 rounded-xl flex-1 md:flex-initial">
            <Flame className="h-5 w-5 text-rose-500 fill-rose-500/10" />
            <div>
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Logging Streak</span>
              <span className="text-xs font-black text-rose-600 dark:text-rose-400 font-mono">{checkinStreak} Days</span>
            </div>
          </div>

          {/* Budget ceiling streak */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/20 rounded-xl flex-1 md:flex-initial">
            <Shield className="h-5 w-5 text-amber-500" />
            <div>
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Budget Safe</span>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono">{budgetStreak} Weeks</span>
            </div>
          </div>

          {/* Action icon */}
          <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-purple-600 hover:text-white transition-all hidden md:flex">
            <ChevronRight className="h-5 w-5" />
          </div>
        </div>
      </motion.div>

      {/* Grid UI layout containing beautifully clickable components */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod, index) => {
          const theme = colorThemes[mod.color] || colorThemes.violet;
          const IconComponent = mod.icon;

          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => onNavigate && onNavigate(mod.id)}
              className={`glass-card rounded-2xl p-6 shadow-sm hover:shadow-lg ${theme.glow} transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden group border border-purple-100/30 dark:border-purple-950/20`}
            >
              {/* Colored top accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${theme.accentBar}`}></div>

              <div>
                {/* Header info */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`h-11 w-11 ${theme.iconBg} ${theme.iconText} flex items-center justify-center rounded-2xl shadow-inner transition-transform duration-300 group-hover:scale-110`}>
                    <IconComponent className="h-6.5 w-6.5" />
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${theme.badgeBg} ${theme.badgeText}`}>
                    {mod.badge}
                  </span>
                </div>

                {/* Body info */}
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
                  {mod.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {mod.description}
                </p>
              </div>

              {/* Footer displaying current metric count & action click */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Current Status</span>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5 truncate">{mod.metric}</p>
                </div>
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-700 text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300`}>
                  <ChevronRight className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
