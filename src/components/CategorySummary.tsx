/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie,
  AreaChart, Area, CartesianGrid, LineChart, Line
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Calendar, PiggyBank, Target, ArrowUpRight, 
  Sparkles, Filter, ListFilter, ListOrdered, Percent, Info,
  Search, ShieldAlert, CheckCircle, ChevronRight, HelpCircle,
  AlertCircle, BellRing, Brain, CalendarDays, CheckCircle2, Clock, 
  Activity, ArrowRight, Coins, Layers, Zap,
  Flame, Trophy, Shield, Award, Crown, Lock, Unlock, Star
} from 'lucide-react';
import { motion } from 'motion/react';
import { Expense, Budget, Category, SavingsGoal, BillReminder, AIInsight } from '../types';

interface CategorySummaryProps {
  userName?: string;
  user?: any;
  expenses: Expense[];
  budgets: Budget[];
  categories: Category[];
  goals: SavingsGoal[];
  reminders?: BillReminder[];
  token?: string | null;
}

export default function CategorySummary({ userName, user, expenses, budgets, categories, goals, reminders, token }: CategorySummaryProps) {
  const userId = user?.user?.email || user?.email || "anonymous";
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7' | '30' | 'all'>('30');
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [activeAdvisorAgent, setActiveAdvisorAgent] = useState<'analyst_agent' | 'recommendation_agent' | 'smart_alert_agent'>('analyst_agent');

  // Dynamic Gamification calculations inside CategorySummary
  const checkinStreakCount = useMemo(() => {
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

  const budgetStreakCount = useMemo(() => {
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

  const achievementsList = useMemo(() => {
    return [
      {
        id: 'ach_1',
        title: 'Ledger Pioneer',
        desc: 'Log your first manual transaction',
        metric: 'Expenses logged',
        current: expenses.length,
        target: 1,
        unlocked: expenses.length >= 1,
        icon: Coins
      },
      {
        id: 'ach_2',
        title: 'Ceiling Architect',
        desc: 'Configure category spend limit thresholds',
        metric: 'Active budgets',
        current: budgets.length,
        target: 1,
        unlocked: budgets.length >= 1,
        icon: Target
      },
      {
        id: 'ach_3',
        title: 'Compound Dreamer',
        desc: 'Build active milestones inside your Savings Vault',
        metric: 'Vault goals',
        current: goals.length,
        target: 1,
        unlocked: goals.length >= 1,
        icon: PiggyBank
      },
      {
        id: 'ach_4',
        title: 'Smart Planner',
        desc: 'Set up an active bill deadline schedule',
        metric: 'Bill reminders',
        current: reminders ? reminders.length : 0,
        target: 1,
        unlocked: reminders ? reminders.length >= 1 : false,
        icon: CalendarDays
      }
    ];
  }, [expenses, budgets, goals, reminders]);

  // Fetch past insights on mount using the token
  useEffect(() => {
    if (token) {
      setLoadingInsights(true);
      fetch('/api/insights', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setInsights(data);
        }
      })
      .catch(err => console.error("Error fetching insights in summary:", err))
      .finally(() => setLoadingInsights(false));
    }
  }, [token]);

  // Compute total savings across goals
  const totalSavings = useMemo(() => {
    return goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  }, [goals]);

  // Filter expenses by timeframe
  const filteredExpenses = useMemo(() => {
    if (selectedTimeframe === 'all') return expenses;
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - parseInt(selectedTimeframe));
    return expenses.filter(e => new Date(e.date) >= limitDate);
  }, [expenses, selectedTimeframe]);

  // Daily Spend Trend data mapping
  const dailySpendTrendData = useMemo(() => {
    const daysToCover = selectedTimeframe === 'all' ? 30 : parseInt(selectedTimeframe);
    const trendMap: { [key: string]: number } = {};
    
    // Generate dates for the last N days
    for (let i = daysToCover - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      trendMap[dateString] = 0;
    }
    
    // Aggregate expenses
    expenses.forEach(e => {
      const eDate = e.date.split('T')[0];
      if (trendMap[eDate] !== undefined) {
        trendMap[eDate] += e.amount;
      }
    });
    
    return Object.entries(trendMap).map(([dateStr, amount]) => {
      const parts = dateStr.split('-');
      const dObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const formattedDate = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        date: formattedDate,
        amount: parseFloat(amount.toFixed(2)),
        rawDate: dateStr
      };
    }).sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }, [expenses, selectedTimeframe]);

  // Aggregate category metrics
  const categoryMetrics = useMemo(() => {
    const metrics: { [key: string]: {
      name: string;
      color: string;
      totalSpent: number;
      count: number;
      avgSpent: number;
      maxSpent: number;
      budgetAmount: number;
      utilization: number;
    }} = {};

    // Initialize with standard/custom categories
    categories.forEach(cat => {
      metrics[cat.name.toLowerCase()] = {
        name: cat.name,
        color: cat.color || '#6366f1',
        totalSpent: 0,
        count: 0,
        avgSpent: 0,
        maxSpent: 0,
        budgetAmount: 0,
        utilization: 0
      };
    });

    // Populate budgets
    budgets.forEach(b => {
      if (b.category) {
        const catNameLower = b.category.toLowerCase();
        if (metrics[catNameLower]) {
          metrics[catNameLower].budgetAmount += b.amount;
        } else {
          metrics[catNameLower] = {
            name: b.category,
            color: '#6366f1',
            totalSpent: 0,
            count: 0,
            avgSpent: 0,
            maxSpent: 0,
            budgetAmount: b.amount,
            utilization: 0
          };
        }
      }
    });

    // Populate actual spending
    filteredExpenses.forEach(exp => {
      const catNameLower = exp.category.toLowerCase();
      if (!metrics[catNameLower]) {
        metrics[catNameLower] = {
          name: exp.category,
          color: '#6366f1',
          totalSpent: 0,
          count: 0,
          avgSpent: 0,
          maxSpent: 0,
          budgetAmount: 0,
          utilization: 0
        };
      }
      const item = metrics[catNameLower];
      item.totalSpent += exp.amount;
      item.count += 1;
      item.maxSpent = Math.max(item.maxSpent, exp.amount);
    });

    // Calculate averages and utilization
    Object.values(metrics).forEach(item => {
      if (item.count > 0) {
        item.avgSpent = parseFloat((item.totalSpent / item.count).toFixed(2));
      }
      if (item.budgetAmount > 0) {
        item.utilization = parseFloat(((item.totalSpent / item.budgetAmount) * 100).toFixed(1));
      }
    });

    return Object.values(metrics);
  }, [filteredExpenses, budgets, categories]);

  // Search filtered category list
  const searchedCategories = useMemo(() => {
    return categoryMetrics.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [categoryMetrics, searchTerm]);

  // Global KPIs
  const globalKPIs = useMemo(() => {
    const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalBudget = budgets.filter(b => b.category).reduce((sum, b) => sum + b.amount, 0);
    const avgTransaction = filteredExpenses.length > 0 ? totalSpent / filteredExpenses.length : 0;
    
    let maxCategoryName = 'None';
    let maxCategorySpent = 0;
    categoryMetrics.forEach(c => {
      if (c.totalSpent > maxCategorySpent) {
        maxCategorySpent = c.totalSpent;
        maxCategoryName = c.name;
      }
    });

    return {
      totalSpent,
      totalBudget,
      avgTransaction,
      maxCategoryName,
      maxCategorySpent
    };
  }, [filteredExpenses, budgets, categoryMetrics]);

  // Charts Formatters
  const barChartData = useMemo(() => {
    return categoryMetrics
      .filter(c => c.totalSpent > 0 || c.budgetAmount > 0)
      .map(c => ({
        name: c.name,
        Spent: c.totalSpent,
        Budget: c.budgetAmount,
        color: c.color
      }));
  }, [categoryMetrics]);

  const pieChartData = useMemo(() => {
    return categoryMetrics
      .filter(c => c.totalSpent > 0)
      .map(c => ({
        name: c.name,
        value: parseFloat(c.totalSpent.toFixed(2)),
        color: c.color
      }));
  }, [categoryMetrics]);

  // Filter and sort active budgeted categories by utilization rate for color-coded progress indicators
  const budgetedCategories = useMemo(() => {
    return categoryMetrics
      .filter(c => c.budgetAmount > 0)
      .sort((a, b) => b.utilization - a.utilization);
  }, [categoryMetrics]);

  // Process Bill Reminders
  const billStats = useMemo(() => {
    const list = reminders || [];
    const totalCount = list.length;
    const paidCount = list.filter(r => r.isPaid).length;
    const pendingCount = totalCount - paidCount;
    const pendingAmount = list.filter(r => !r.isPaid).reduce((sum, r) => sum + r.amount, 0);
    const totalAmount = list.reduce((sum, r) => sum + r.amount, 0);
    
    // Sort upcoming unpaid bills first, then paid bills
    const sortedBills = [...list].sort((a, b) => {
      if (a.isPaid !== b.isPaid) {
        return a.isPaid ? 1 : -1;
      }
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    
    return {
      totalCount,
      paidCount,
      pendingCount,
      pendingAmount,
      totalAmount,
      sortedBills
    };
  }, [reminders]);

  // Generate combined AI Advisor Insights
  const activeInsightsList = useMemo(() => {
    const combined: AIInsight[] = [];
    const agentIdsSeen = new Set<string>();

    insights.forEach(ins => {
      if (!agentIdsSeen.has(ins.agentId)) {
        combined.push(ins);
        agentIdsSeen.add(ins.agentId);
      }
    });

    return combined;
  }, [insights]);

  const selectedAgentInsight = useMemo(() => {
    return activeInsightsList.find(ins => ins.agentId === activeAdvisorAgent);
  }, [activeInsightsList, activeAdvisorAgent]);

  // Weekend vs Weekday analysis
  const weekendSpendStats = useMemo(() => {
    let weekdaySum = 0;
    let weekendSum = 0;
    filteredExpenses.forEach(e => {
      const day = new Date(e.date).getDay();
      const isWeekend = (day === 6 || day === 0); // Saturday or Sunday
      if (isWeekend) {
        weekendSum += e.amount;
      } else {
        weekdaySum += e.amount;
      }
    });
    const total = weekdaySum + weekendSum;
    return {
      weekdayPct: total > 0 ? Math.round((weekdaySum / total) * 100) : 60,
      weekendPct: total > 0 ? Math.round((weekendSum / total) * 100) : 40,
      weekdaySum,
      weekendSum
    };
  }, [filteredExpenses]);

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Category Spending Summary
          </h1>
          <p className="text-xs text-slate-400">Advanced diagnostic intelligence with daily velocity trends, AI advisory tracking and bill timelines.</p>
        </div>

        {/* Timeframe selector with Last 7 Days */}
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setSelectedTimeframe('7')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                selectedTimeframe === '7' 
                  ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setSelectedTimeframe('30')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                selectedTimeframe === '30' 
                  ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setSelectedTimeframe('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                selectedTimeframe === 'all' 
                  ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* 2. Global KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Filtered Spend</p>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1.5">
                ₹{globalKPIs.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="h-9 w-9 bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center rounded-xl">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 font-medium">
            Across {filteredExpenses.length} transactions
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Active Budget</p>
              <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1.5">
                ₹{globalKPIs.totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="h-9 w-9 bg-purple-50 dark:bg-purple-950/30 text-purple-600 flex items-center justify-center rounded-xl">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 font-medium">
            For defined category limits
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Savings Vault</p>
              <h3 className="text-xl font-bold text-pink-600 dark:text-pink-400 mt-1.5">
                ₹{totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="h-9 w-9 bg-pink-50 dark:bg-pink-950/30 text-pink-500 flex items-center justify-center rounded-xl">
              <PiggyBank className="h-5 w-5" />
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 font-medium">
            Across {goals.length} active milestones
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top Spending Sector</p>
              <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 truncate max-w-[150px] mt-1.5">
                {globalKPIs.maxCategoryName}
              </h3>
            </div>
            <div className="h-9 w-9 bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center rounded-xl">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 font-medium">
            Spent: ₹{globalKPIs.maxCategorySpent.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
        </motion.div>
      </div>

      {/* 3. Daily Spending Trend Line Chart & Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual 1: Daily Spending Trend Area/Line Chart */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-500" /> Spending Trend & Velocity
                </h3>
                <p className="text-[11px] text-slate-400">Daily velocity curves mapping dynamic wallet outfluxes.</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <Clock className="h-3 w-3" /> {selectedTimeframe === '7' ? '7 Days' : selectedTimeframe === '30' ? '30 Days' : 'Past Month'}
              </span>
            </div>

            <div className="h-64 w-full mt-3">
              {dailySpendTrendData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No expenditure records. Log transactions to formulate trends.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySpendTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="opacity-30" />
                    <XAxis 
                      dataKey="date" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fontSize: 10, fill: '#94A3B8' }} 
                      dy={5}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fontSize: 10, fill: '#94A3B8' }} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.98)', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: 11, color: '#1E293B' }} 
                      formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Amount Spent']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#a855f7" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#spendGrad)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600">
                <Coins className="h-4 w-4" />
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">Weekday Total</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">₹{weekendSpendStats.weekdaySum.toLocaleString()} ({weekendSpendStats.weekdayPct}%)</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-950/20 text-pink-600">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">Weekend Outflow</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">₹{weekendSpendStats.weekendSum.toLocaleString()} ({weekendSpendStats.weekendPct}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual 2: Category Spending Distribution */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-500" /> Sector Allocation
              </h3>
              <p className="text-[11px] text-slate-400">Proportional category percentages across active cashflows.</p>
            </div>
          </div>
          <div className="h-72 w-full flex flex-col md:flex-row items-center justify-center">
            {pieChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No categorical distributions. Add expenses.
              </div>
            ) : (
              <>
                <div className="w-1/2 h-full min-h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0' }}
                        itemStyle={{ fontSize: 11 }}
                        formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Total Spent']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 max-h-[240px] overflow-y-auto space-y-2.5 px-2">
                  {pieChartData.map((item, index) => {
                    const pct = ((item.value / globalKPIs.totalSpent) * 100).toFixed(1);
                    return (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                          <span className="text-slate-600 dark:text-slate-300 font-semibold truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3 font-medium">
                          <span className="text-slate-400">{pct}%</span>
                          <span className="text-slate-800 dark:text-slate-200 font-bold">₹{item.value.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4. AI Advisor Suite Insights & Bill Schedules Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Visual Block A: AI Advisor Suite Center */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-xl flex items-center justify-center">
                  <Brain className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">AI Advisor Diagnostics</h3>
                  <p className="text-[10px] text-slate-400">Autonomous risk audits and wealth growth directives.</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-100 dark:border-emerald-900/40">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Advisor Online
              </div>
            </div>

            {/* Agent tabs switcher */}
            <div className="flex gap-1.5 mb-4 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl">
              <button
                onClick={() => setActiveAdvisorAgent('analyst_agent')}
                className={`flex-1 py-1 px-2 text-[10px] font-bold rounded-lg transition-all ${
                  activeAdvisorAgent === 'analyst_agent'
                    ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Analyst
              </button>
              <button
                onClick={() => setActiveAdvisorAgent('recommendation_agent')}
                className={`flex-1 py-1 px-2 text-[10px] font-bold rounded-lg transition-all ${
                  activeAdvisorAgent === 'recommendation_agent'
                    ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Recommender
              </button>
              <button
                onClick={() => setActiveAdvisorAgent('smart_alert_agent')}
                className={`flex-1 py-1 px-2 text-[10px] font-bold rounded-lg transition-all ${
                  activeAdvisorAgent === 'smart_alert_agent'
                    ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Alerts
              </button>
            </div>

            {/* Selected Insight Display */}
            {selectedAgentInsight ? (
              <div className="space-y-3.5 min-h-[140px]">
                <div className="bg-purple-50/40 dark:bg-slate-900/40 p-3.5 rounded-xl border border-purple-100/30 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                    {selectedAgentInsight.title}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    Hey {userName || 'User'}, {selectedAgentInsight.insight}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block">Strategic Directives</span>
                  <div className="space-y-1">
                    {selectedAgentInsight.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <ArrowRight className="h-3 w-3 mt-1 text-purple-500 flex-shrink-0" />
                        <span className="font-semibold leading-tight">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-center text-xs text-slate-400 font-medium px-4">
                <Brain className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p>No diagnostics generated yet.</p>
                <p className="text-[10px] text-slate-400 mt-1">Deploy advisors from the Advisor Agents tab to populate analyses.</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-semibold">Advisor state synced successfully</span>
            <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
              Real-time calculations enabled <Zap className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* Visual Block B: Upcoming Bill Schedules & Ledger Obligations */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-sky-50 dark:bg-sky-950/40 text-sky-600 rounded-xl flex items-center justify-center">
                  <BellRing className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Bill Schedules</h3>
                  <p className="text-[10px] text-slate-400">Scheduled reminders and mandatory monthly obligations.</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-500">
                Pending: {billStats.pendingCount} Bills
              </span>
            </div>

            {/* Bill obligations list */}
            {billStats.sortedBills.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-xs text-slate-400">
                <Calendar className="h-8 w-8 text-slate-300 mb-2" />
                No scheduled bills configured.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                {billStats.sortedBills.slice(0, 3).map((bill, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {bill.isPaid ? (
                        <div className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="h-7 w-7 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 flex items-center justify-center flex-shrink-0 animate-pulse">
                          <Clock className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate capitalize">
                          {bill.title}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium block">
                          Due: {new Date(bill.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {bill.frequency}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                        ₹{bill.amount.toLocaleString()}
                      </span>
                      <span className={`text-[9px] font-bold ${bill.isPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {bill.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl flex justify-between items-center text-xs">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Pending Outflow
            </span>
            <span className="font-extrabold text-slate-800 dark:text-slate-100">
              ₹{billStats.pendingAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Budget Performance & Utilization Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Bar Chart Comparison */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-500" /> Budget vs. Actual Expenditure
              </h3>
              <p className="text-[11px] text-slate-400">Comparing active category targets against calculated spending records.</p>
            </div>
          </div>
          <div className="h-64 w-full">
            {barChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Log expenses or assign budgets to build comparison.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="opacity-40" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: 12 }} 
                    formatter={(val: number) => [`₹${val.toLocaleString()}`]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }} />
                  <Bar dataKey="Spent" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Budget" fill="#ffdb00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Color-Coded Budget Utilization Tracker */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-xl flex items-center justify-center">
                  <Percent className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Budget Utilization</h3>
                  <p className="text-[10px] text-slate-400">Real-time depletion speed of category limits.</p>
                </div>
              </div>
            </div>

            {/* List of active budgeted categories */}
            {budgetedCategories.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center text-xs text-slate-400 px-4">
                <Target className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="font-semibold">No active budgets found.</p>
                <p className="text-[10px] text-slate-400 mt-1">Configure limits in the Budgets tab to track real-time utilization.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                {budgetedCategories.map((cat, index) => {
                  const percent = cat.utilization;
                  const isOver = percent > 100;
                  const isWarning = !isOver && percent > 80;
                  
                  // Color codes for progress bars
                  let barColorClass = "bg-emerald-500";
                  let textColorClass = "text-emerald-600 dark:text-emerald-400";
                  let bgIndicatorClass = "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40";
                  let AlertIcon = CheckCircle;

                  if (isOver) {
                    barColorClass = "bg-rose-500";
                    textColorClass = "text-rose-600 dark:text-rose-400";
                    bgIndicatorClass = "bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40";
                    AlertIcon = ShieldAlert;
                  } else if (isWarning) {
                    barColorClass = "bg-amber-500";
                    textColorClass = "text-amber-600 dark:text-amber-400";
                    bgIndicatorClass = "bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40";
                    AlertIcon = AlertCircle;
                  }

                  return (
                    <div key={index} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }}></span>
                          <span className="font-bold text-slate-700 dark:text-slate-200 capitalize truncate">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${bgIndicatorClass} flex items-center gap-1`}>
                            <AlertIcon className="h-2.5 w-2.5" />
                            {percent}%
                          </span>
                        </div>
                      </div>

                      {/* Custom Color-Coded Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${barColorClass}`}
                          style={{ 
                            width: `${Math.min(100, percent)}%`,
                            opacity: percent > 0 ? 1 : 0
                          }}
                        ></div>
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                        <span>Spent: ₹{cat.totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        <span>Limit: ₹{cat.budgetAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-semibold">Calculated on active budgets</span>
            {budgetedCategories.length > 0 && (
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {budgetedCategories.filter(c => c.utilization > 100).length} over limit
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 6. Bento Categories Detailed Visual Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Visual Categorical Breakdowns</h3>
            <p className="text-xs text-slate-400">Comprehensive parameters, averages, maximums, and active alerts for every category.</p>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {searchedCategories.map((cat, idx) => {
            const hasBudget = cat.budgetAmount > 0;
            const isExceeded = hasBudget && cat.totalSpent > cat.budgetAmount;
            const isWarning = hasBudget && !isExceeded && cat.utilization > 80;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: cat.color }}></div>

                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm capitalize">{cat.name}</h4>
                  </div>
                  
                  {hasBudget ? (
                    isExceeded ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" /> Exceeded
                      </span>
                    ) : isWarning ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 flex items-center gap-1">
                        Over 80%
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Stable
                      </span>
                    )
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                      Uncapped
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-400">Total Spent</span>
                    <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                      ₹{cat.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {hasBudget && (
                    <div className="space-y-1">
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ 
                            width: `${Math.min(100, cat.utilization)}%`,
                            opacity: cat.utilization > 0 ? 1 : 0
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                        <span>{cat.utilization}% Utilized</span>
                        <span>Limit: ₹{cat.budgetAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-[11px]">
                    <div className="space-y-0.5">
                      <span className="text-slate-400 block font-medium">Count</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 block">{cat.count} times</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-slate-400 block font-medium">Highest Spend</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 block">₹{cat.maxSpent.toLocaleString()}</span>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <span className="text-slate-400 block font-medium">Remaining</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 block">
                        {hasBudget ? `₹${Math.max(0, cat.budgetAmount - cat.totalSpent).toLocaleString()}` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 4. Gamified Milestones, Achievements and Active Streaks */}
      <div className="space-y-4 pt-6 border-t border-slate-200/50 dark:border-slate-800/60 font-sans">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Missions and Achievements
          </h3>
          <p className="text-xs text-slate-400">Your live system achievements unlocked by active personal tracking.</p>
        </div>

        {/* Streaks mini indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2">
          {/* Streak 1 */}
          <div className="bg-gradient-to-br from-rose-500/5 to-orange-500/5 border border-rose-200/30 dark:border-rose-900/10 rounded-2xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Flame className="h-5 w-5 fill-rose-500/20" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-widest">Active Logging Streak</span>
              <span className="text-base font-black text-rose-600 dark:text-rose-400 font-mono">{checkinStreakCount} Days Running</span>
            </div>
          </div>

          {/* Streak 2 */}
          <div className="bg-gradient-to-br from-amber-500/5 to-yellow-500/5 border border-amber-200/30 dark:border-amber-900/10 rounded-2xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-widest">Safe Budget Streak</span>
              <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">{budgetStreakCount} Weeks Secure</span>
            </div>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {achievementsList.map((ach) => {
            const AchIcon = ach.icon;
            return (
              <div 
                key={ach.id} 
                className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                  ach.unlocked 
                    ? 'bg-purple-50/40 dark:bg-purple-950/10 border-purple-200/40 dark:border-purple-900/20 shadow-xs' 
                    : 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-200/30 dark:border-slate-850 opacity-60'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      ach.unlocked 
                        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }`}>
                      <AchIcon className="h-4.5 w-4.5" />
                    </div>
                    {ach.unlocked ? (
                      <span className="text-[9px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Unlocked
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="h-2.5 w-2.5" /> Locked
                      </span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">{ach.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">{ach.desc}</p>
                </div>

                <div className="space-y-1 pt-3.5 mt-4 border-t border-slate-100 dark:border-slate-800/40">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                    <span>{ach.metric}</span>
                    <span>{ach.unlocked ? '100%' : `${ach.current} / ${ach.target}`}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${ach.unlocked ? 'bg-purple-500' : 'bg-slate-300'}`}
                      style={{ 
                        width: `${ach.unlocked ? 100 : Math.min(100, (ach.current / ach.target) * 100)}%`,
                        opacity: (ach.unlocked || ach.current > 0) ? 1 : 0
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
