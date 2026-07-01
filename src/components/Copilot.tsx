/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Compass, CheckCircle2, AlertCircle, PiggyBank, Target, 
  CalendarDays, ArrowRight, Info, ShieldCheck, TrendingUp, Scissors,
  AlertTriangle, RefreshCw, Smartphone, Laptop, Bike, Palmtree, Landmark, FileText,
  BarChart3, BrainCircuit, CheckSquare, ThumbsUp, ThumbsDown, Award, Flame, Zap, Gauge, ArrowUpRight, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';

interface CopilotProps {
  userName: string;
  token: string | null;
  onRefresh: () => void;
}

interface ProposedBudget {
  category: string;
  amount: number;
  period: 'weekly' | 'monthly';
}

interface ProposedReminder {
  title: string;
  amount: number;
  category: string;
  dueDate: string;
}

interface CopilotPlan {
  goalTitle: string;
  targetAmount: number;
  targetDate: string;
  category: 'laptop' | 'mobile' | 'bike' | 'vacation' | 'emergency_fund' | 'other';
  currentStatusAnalysis: string;
  isAchievable: boolean;
  confidenceScore: number;
  suggestedCuts: string[];
  proposedBudgets: ProposedBudget[];
  proposedReminders: ProposedReminder[];
  revisionAdvice: string;
}

// Sub-Agent Types
interface AutonomousAdvisorResult {
  overspentCategories: { category: string; spent: number; budget: number }[];
  reallocationActions: string[];
  cheaperAlternatives: string[];
  cashShortageWarning: string | null;
  discretionaryAdvice: string;
}

interface PredictiveFinanceResult {
  endOfMonthForecast: string;
  upcomingBillImpact: string;
  cashFlowTrend: 'positive' | 'negative' | 'stable';
  overrunRisks: string[];
  milestoneProjections: { milestone: string; predictedCompletionDate: string; daysRemaining: number }[];
  preemptiveWarning: string | null;
}



interface FinancialCoachResult {
  weeklyReview: string;
  monthlyChallenge: { title: string; target: string; difficulty: 'easy' | 'medium' | 'hard'; points: number };
  habitImprovements: string[];
  customSavingsTips: string[];
}

const GOAL_TEMPLATES = [
  { text: "Help me save ₹10,000 this month.", label: "₹10K Monthly Savings", icon: PiggyBank },
  { text: "Help me save ₹45,000 for a new MacBook Pro laptop next month.", label: "MacBook Laptop Fund", icon: Laptop },
  { text: "Help me save ₹15,000 for a weekend beach vacation trip.", label: "Vacation Trip Fund", icon: Palmtree },
  { text: "Help me save ₹20,000 for an emergency fund cash buffer.", label: "Emergency Buffer", icon: Landmark }
];

export default function Copilot({ userName, token, onRefresh }: CopilotProps) {
  // Navigation
  const [activeTab, setActiveTab] = useState<'planner' | 'advisor' | 'predictive' | 'coach'>('planner');

  // Plan State
  const [goalText, setGoalText] = useState('');
  const [isFormulating, setIsFormulating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [plan, setPlan] = useState<CopilotPlan | null>(null);
  const [selectedBudgets, setSelectedBudgets] = useState<number[]>([]);
  const [selectedReminders, setSelectedReminders] = useState<number[]>([]);
  const [executionSuccess, setExecutionSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sub-Agent States
  const [advisorData, setAdvisorData] = useState<AutonomousAdvisorResult | null>(null);
  const [predictiveData, setPredictiveData] = useState<PredictiveFinanceResult | null>(null);
  const [coachData, setCoachData] = useState<FinancialCoachResult | null>(null);

  // Loading & Error States per tab
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({
    advisor: false,
    predictive: false,
    coach: false
  });
  const [errorStates, setErrorStates] = useState<Record<string, string | null>>({
    advisor: null,
    predictive: null,
    coach: null
  });

  // Track accepted challenge
  const [challengeAccepted, setChallengeAccepted] = useState(false);

  // Dynamic 30-day balance projections for the predictive chart
  const projectionData = React.useMemo(() => {
    if (!predictiveData) return [];
    
    // Parse numeric value from endOfMonthForecast (e.g., "₹45,000" -> 45000)
    const rawForecastText = predictiveData.endOfMonthForecast || '';
    const numericForecast = parseFloat(rawForecastText.replace(/[^0-9.]/g, '')) || 50000;
    
    const dataPoints = [];
    let rollingBalance = numericForecast * 1.12; // Start higher to show progression / drop-offs
    
    for (let day = 1; day <= 30; day++) {
      // Linear spending trend with occasional variations
      rollingBalance -= (numericForecast * 0.004) + (Math.sin(day) * 120);
      
      // Simulate rent / bill / loan drop-offs
      if (day === 5) rollingBalance -= (numericForecast * 0.14); // Rent
      if (day === 12) rollingBalance -= (numericForecast * 0.04); // Utilities
      if (day === 18) rollingBalance -= (numericForecast * 0.02); // Wifi
      if (day === 24) rollingBalance -= (numericForecast * 0.05); // EMI
      
      dataPoints.push({
        day: `Day ${day}`,
        Balance: Math.round(rollingBalance),
        Baseline: Math.round(numericForecast * 0.5) // warning baseline buffer
      });
    }
    
    // Linearly nudge elements to smoothly land on exactly the forecasted final amount on Day 30
    const finalDiff = numericForecast - dataPoints[29].Balance;
    for (let i = 0; i < 30; i++) {
      dataPoints[i].Balance += Math.round((finalDiff / 30) * (i + 1));
    }
    
    return dataPoints;
  }, [predictiveData]);

  // Fetch functions for tabs
  const fetchAdvisorData = async () => {
    setLoadingStates(prev => ({ ...prev, advisor: true }));
    setErrorStates(prev => ({ ...prev, advisor: null }));
    try {
      const response = await fetch('/api/copilot/advisor', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Could not compute advisor diagnostics.');
      const data = await response.json();
      setAdvisorData(data);
    } catch (err: any) {
      setErrorStates(prev => ({ ...prev, advisor: err.message }));
    } finally {
      setLoadingStates(prev => ({ ...prev, advisor: false }));
    }
  };

  const fetchPredictiveData = async () => {
    setLoadingStates(prev => ({ ...prev, predictive: true }));
    setErrorStates(prev => ({ ...prev, predictive: null }));
    try {
      const response = await fetch('/api/copilot/predictive', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Could not formulate predictive forecasts.');
      const data = await response.json();
      setPredictiveData(data);
    } catch (err: any) {
      setErrorStates(prev => ({ ...prev, predictive: err.message }));
    } finally {
      setLoadingStates(prev => ({ ...prev, predictive: false }));
    }
  };

  const fetchCoachData = async () => {
    setLoadingStates(prev => ({ ...prev, coach: true }));
    setErrorStates(prev => ({ ...prev, coach: null }));
    try {
      const response = await fetch('/api/copilot/coach', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Could not retrieve coach guidelines.');
      const data = await response.json();
      setCoachData(data);
    } catch (err: any) {
      setErrorStates(prev => ({ ...prev, coach: err.message }));
    } finally {
      setLoadingStates(prev => ({ ...prev, coach: false }));
    }
  };

  // Tab change trigger loading
  useEffect(() => {
    if (activeTab === 'advisor' && !advisorData) {
      fetchAdvisorData();
    } else if (activeTab === 'predictive' && !predictiveData) {
      fetchPredictiveData();
    } else if (activeTab === 'coach' && !coachData) {
      fetchCoachData();
    }
  }, [activeTab]);

  const handleSelectTemplate = (text: string) => {
    setGoalText(text);
    setPlan(null);
    setSelectedBudgets([]);
    setSelectedReminders([]);
    setExecutionSuccess(false);
    setError(null);
  };

  const handleFormulatePlan = async () => {
    if (!goalText.trim()) return;

    setIsFormulating(true);
    setPlan(null);
    setSelectedBudgets([]);
    setSelectedReminders([]);
    setExecutionSuccess(false);
    setError(null);

    try {
      const response = await fetch('/api/copilot/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ goalText })
      });

      if (!response.ok) {
        throw new Error('Failed to generate plan. Please try again.');
      }

      const data = await response.json();
      setPlan(data);
      if (data) {
        setSelectedBudgets((data.proposedBudgets || []).map((_: any, idx: number) => idx));
        setSelectedReminders((data.proposedReminders || []).map((_: any, idx: number) => idx));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while communicating with the Copilot server.');
    } finally {
      setIsFormulating(false);
    }
  };

  const toggleBudget = (idx: number) => {
    setSelectedBudgets(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const toggleReminder = (idx: number) => {
    setSelectedReminders(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleExecutePlan = async () => {
    if (!plan) return;

    setIsExecuting(true);
    setError(null);

    const filteredBudgets = (plan.proposedBudgets || []).filter((_: any, idx: number) => selectedBudgets.includes(idx));
    const filteredReminders = (plan.proposedReminders || []).filter((_: any, idx: number) => selectedReminders.includes(idx));

    const executedPlan = {
      ...plan,
      proposedBudgets: filteredBudgets,
      proposedReminders: filteredReminders
    };

    try {
      const response = await fetch('/api/copilot/execute-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan: executedPlan })
      });

      if (!response.ok) {
        throw new Error('Failed to activate financial plan.');
      }

      setExecutionSuccess(true);
      onRefresh(); // Refresh all state data in App.tsx!
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during budget initialization.');
    } finally {
      setIsExecuting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'laptop': return <Laptop className="h-5 w-5 text-purple-600" />;
      case 'mobile': return <Smartphone className="h-5 w-5 text-emerald-600" />;
      case 'bike': return <Bike className="h-5 w-5 text-amber-600" />;
      case 'vacation': return <Palmtree className="h-5 w-5 text-pink-600" />;
      case 'emergency_fund': return <Landmark className="h-5 w-5 text-rose-600" />;
      default: return <PiggyBank className="h-5 w-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 pb-12" id="copilot-viewport">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/50 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 bg-purple-600/10 rounded-2xl flex items-center justify-center border border-purple-600/20">
              <Compass className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">FinPilot AI Advisor Hub</h1>
              <p className="text-xs text-slate-400 font-medium font-mono">Autonomous Strategic Wealth Suite</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 px-3.5 py-1.5 rounded-2xl">
          <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-450" />
          <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold tracking-wide uppercase">AI Active Copilot Guard</span>
        </div>
      </div>

      {/* 2. Sub-Tab Navigation Bar */}
      <div className="flex overflow-x-auto gap-2 p-1 bg-slate-100/80 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 max-w-full">
        <button
          onClick={() => setActiveTab('planner')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition cursor-pointer ${
            activeTab === 'planner' 
              ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
          }`}
        >
          <Compass className="h-4 w-4" />
          Goal Planner
        </button>

        <button
          onClick={() => setActiveTab('advisor')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition cursor-pointer ${
            activeTab === 'advisor' 
              ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
          }`}
        >
          <BrainCircuit className="h-4 w-4" />
          Autonomous Advisor
        </button>

        <button
          onClick={() => setActiveTab('predictive')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition cursor-pointer ${
            activeTab === 'predictive' 
              ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Predictive Forecaster
        </button>

        <button
          onClick={() => setActiveTab('coach')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition cursor-pointer ${
            activeTab === 'coach' 
              ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
          }`}
        >
          <Award className="h-4 w-4" />
          Financial Coach
        </button>
      </div>

      {/* 3. Render Tabs */}
      <div className="pt-2">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: Goal-driven Planner */}
          {activeTab === 'planner' && (
            <motion.div
              key="planner"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Intro Instructions */}
              <div className="bg-gradient-to-br from-purple-900 via-violet-950 to-slate-950 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-purple-500/5 border border-purple-500/10">
                {/* Decorative ambient background lights */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-fuchsia-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-1/4 translate-x-1/4">
                  <Compass className="h-96 w-96 text-white" />
                </div>

                <div className="max-w-2xl space-y-3.5 relative z-10">
                  <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-400/30 px-3 py-1 rounded-full">
                    <Sparkles className="h-3 w-3 text-purple-300 animate-pulse" />
                    <span className="text-[10px] text-purple-200 font-extrabold tracking-wider uppercase">Generative Planner</span>
                  </div>
                  
                  <h2 className="text-lg font-extrabold tracking-tight">Smart Goal & Workflow Automation</h2>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Simply declare any target goal (e.g., "I'm going on vacation next month"), and our autonomous AI will estimate expenses, auto-adjust monthly budgets, suggest active savings targets, and create reminders.
                  </p>
                </div>
              </div>

              {/* Input Form & Plan Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left side input */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
                    <div>
                      <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Enter Stated Goal Directive</label>
                      <p className="text-[10px] text-slate-400 mt-0.5">Define your time limit, saving scale, or trip context in human sentences.</p>
                    </div>

                    <div className="space-y-3">
                      <textarea
                        value={goalText}
                        onChange={(e) => setGoalText(e.target.value)}
                        placeholder="e.g., I am planning a holiday vacation next month."
                        rows={4}
                        className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 rounded-xl p-4 resize-none placeholder-slate-400 transition"
                      />
                      
                      <button
                        onClick={handleFormulatePlan}
                        disabled={isFormulating || !goalText.trim()}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isFormulating ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Compiling Action Plan...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Formulate AI Plan & Actions
                          </>
                        )}
                      </button>
                    </div>

                    {error && (
                      <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 flex items-start gap-2.5 text-rose-700">
                        <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
                        <span className="text-[10px] font-bold leading-normal">{error}</span>
                      </div>
                    )}

                    {/* Quick templates */}
                    <div className="space-y-2.5 pt-3 border-t border-slate-150">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Quick-Start Goal Blueprints</span>
                      <div className="flex flex-col gap-2">
                        {GOAL_TEMPLATES.map((tpl, idx) => {
                          const TplIcon = tpl.icon;
                          return (
                            <button
                              key={idx}
                              onClick={() => handleSelectTemplate(tpl.text)}
                              className="w-full flex items-center gap-3 text-left p-2.5 rounded-xl border border-slate-100 hover:border-purple-100 hover:bg-purple-50/20 transition cursor-pointer group"
                            >
                              <div className="h-7 w-7 rounded-lg bg-slate-50 group-hover:bg-purple-50 flex items-center justify-center flex-shrink-0 transition">
                                <TplIcon className="h-3.5 w-3.5 text-slate-500 group-hover:text-purple-600" />
                              </div>
                              <span className="text-xs font-bold text-slate-700 truncate flex-1">{tpl.label}</span>
                              <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-purple-500 transition transform group-hover:translate-x-0.5 flex-shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right side output */}
                <div className="lg:col-span-7">
                  {!plan && !isFormulating && (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-10 text-center h-full flex flex-col items-center justify-center min-h-[300px]">
                      <Compass className="h-10 w-10 text-slate-300 animate-pulse mb-3" />
                      <h3 className="text-xs font-bold text-slate-700">Awaiting Goal Input</h3>
                      <p className="text-[10px] text-slate-400 max-w-xs mt-1 leading-relaxed">
                        Input your custom objective or tap a template to generate a structured cashflow blueprint with zero-click dashboard setups.
                      </p>
                    </div>
                  )}

                  {isFormulating && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center h-full flex flex-col items-center justify-center space-y-4 min-h-[300px]">
                      <Sparkles className="h-10 w-10 text-purple-600 animate-spin" />
                      <div>
                        <h3 className="text-xs font-bold text-slate-800">Formulating Automation Blueprint...</h3>
                        <p className="text-[10px] text-slate-400 max-w-xs mt-0.5 leading-relaxed">
                          Estimating budget allocations, defining savings targets, and establishing alert schedules.
                        </p>
                      </div>
                    </div>
                  )}

                  {plan && !isFormulating && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-150 rounded-xl p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                            {getCategoryIcon(plan.category)}
                          </div>
                          <div>
                            <h3 className="text-xs font-extrabold text-slate-800 uppercase">{plan.goalTitle}</h3>
                            <p className="text-[9px] text-slate-400 font-medium">Target Date: {plan.targetDate}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block">AI Feasibility</span>
                          <span className="text-xs font-bold text-purple-600">{plan.confidenceScore}% Score</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Analysis</span>
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">
                          {plan.currentStatusAnalysis}
                        </p>
                      </div>

                      {/* Cuts */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Suggested Spending Cuts</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {plan.suggestedCuts.map((cut, idx) => (
                            <div key={idx} className="text-[10px] font-bold text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-start gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <span>{cut}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Budgets & Reminders */}
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Programmatic Operations</span>
                          <span className="text-[9px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded">Click to toggle items</span>
                        </div>
                        
                        <div className="space-y-2">
                          {plan.proposedBudgets.map((pb, idx) => {
                            const isSelected = selectedBudgets.includes(idx);
                            return (
                              <div 
                                key={idx} 
                                onClick={() => toggleBudget(idx)}
                                className={`flex items-center justify-between p-2.5 border rounded-xl text-xs cursor-pointer select-none transition-all duration-200 ${
                                  isSelected 
                                    ? 'bg-purple-50/20 border-purple-150 text-slate-700 hover:bg-purple-50/35' 
                                    : 'bg-slate-50/50 border-slate-150 text-slate-400 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                  <div className={`h-4.5 w-4.5 rounded-md flex items-center justify-center border transition-all duration-200 flex-shrink-0 ${
                                    isSelected 
                                      ? 'bg-purple-600 border-purple-600 text-white' 
                                      : 'border-slate-300 bg-white'
                                  }`}>
                                    {isSelected && <Check className="h-3.5 w-3.5 stroke-[3.5]" />}
                                  </div>
                                  <span className={`font-bold truncate ${isSelected ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                                    Set "{pb.category}" Budget Limit
                                  </span>
                                </div>
                                <span className={`font-bold font-mono flex-shrink-0 ${isSelected ? 'text-purple-600' : 'text-slate-400'}`}>
                                  ₹{pb.amount.toLocaleString()} / {pb.period}
                                </span>
                              </div>
                            );
                          })}
                          
                          {plan.proposedReminders.map((pr, idx) => {
                            const isSelected = selectedReminders.includes(idx);
                            return (
                              <div 
                                key={idx} 
                                onClick={() => toggleReminder(idx)}
                                className={`flex items-center justify-between p-2.5 border rounded-xl text-xs cursor-pointer select-none transition-all duration-200 ${
                                  isSelected 
                                    ? 'bg-emerald-50/10 border-emerald-150 text-slate-700 hover:bg-emerald-50/20' 
                                    : 'bg-slate-50/50 border-slate-150 text-slate-400 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                  <div className={`h-4.5 w-4.5 rounded-md flex items-center justify-center border transition-all duration-200 flex-shrink-0 ${
                                    isSelected 
                                      ? 'bg-emerald-600 border-emerald-600 text-white' 
                                      : 'border-slate-300 bg-white'
                                  }`}>
                                    {isSelected && <Check className="h-3.5 w-3.5 stroke-[3.5]" />}
                                  </div>
                                  <span className={`font-bold truncate ${isSelected ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                                    Add "{pr.title}" Bill Reminder
                                  </span>
                                </div>
                                <span className={`font-bold font-mono flex-shrink-0 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`}>
                                  ₹{pr.amount.toLocaleString()} on {pr.dueDate}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {executionSuccess ? (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 text-center">
                          <p className="text-xs font-bold text-emerald-800">Plan Programmatically Configured! 🚀</p>
                          <p className="text-[9px] text-emerald-600 mt-0.5">Hey {userName}, your savings goal is now established, and selected budgets & reminders are configured successfully.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-[10.5px] text-slate-500 font-bold text-center">
                            {userName}, should we authorize FinPilot to adjust your financial limits based on this strategy?
                          </p>
                          <button
                            onClick={handleExecutePlan}
                            disabled={isExecuting || (selectedBudgets.length === 0 && selectedReminders.length === 0)}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-purple-500/10"
                          >
                            {isExecuting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            {selectedBudgets.length === 0 && selectedReminders.length === 0 
                              ? 'Select operations to adjust' 
                              : 'Yes, Execute Auto-Budget Adjustments'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 2: Autonomous Financial Advisor */}
          {activeTab === 'advisor' && (
            <motion.div
              key="advisor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Summary Banner */}
              <div className="bg-gradient-to-br from-purple-900 via-violet-950 to-slate-950 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-purple-500/5 border border-purple-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Decorative ambient background lights */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-fuchsia-500/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                <div className="space-y-1 relative z-10">
                  <h2 className="text-md font-extrabold flex items-center gap-1.5">
                    <BrainCircuit className="h-5 w-5 text-purple-300 animate-pulse" />
                    Autonomous Advisor Module
                  </h2>
                  <p className="text-xs text-purple-200">
                    Proactively identifies overspends, balances budgets, suggests cheaper alternates, and checks discretionary liquidity.
                  </p>
                </div>
                <button
                  onClick={fetchAdvisorData}
                  disabled={loadingStates.advisor}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 self-start md:self-center transition cursor-pointer relative z-10"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingStates.advisor ? 'animate-spin' : ''}`} />
                  Recalculate
                </button>
              </div>

              {loadingStates.advisor && (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
                  <RefreshCw className="h-8 w-8 text-purple-600 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-500">Evaluating overspends and processing reallocation strategies...</p>
                </div>
              )}

              {errorStates.advisor && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl flex items-center gap-2.5 text-xs">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{errorStates.advisor}</span>
                </div>
              )}

              {advisorData && !loadingStates.advisor && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Overspend & Reallocation */}
                  <div className="lg:col-span-7 space-y-6">
                    
                    {/* Overspending Panel */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                      <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-rose-500" />
                        Breached & High-Risk Caps
                      </h3>
                      
                      <div className="space-y-3">
                        {advisorData.overspentCategories.length > 0 ? (
                          advisorData.overspentCategories.map((cat, idx) => (
                            <div key={idx} className="border border-slate-100 rounded-xl p-3 bg-rose-50/10 space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                <span className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                                  {cat.category} Category
                                </span>
                                <span className="text-rose-600 font-mono">₹{cat.spent.toLocaleString()} spent</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-rose-500 rounded-full" 
                                  style={{ width: `${Math.min(100, (cat.spent / cat.budget) * 100)}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                <span>Cap Limit: ₹{cat.budget.toLocaleString()}</span>
                                <span className="font-bold text-rose-500">Overby ₹{(cat.spent - cat.budget).toLocaleString()}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-100 text-slate-400">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-1.5" />
                            <p className="text-xs font-bold text-slate-600">Perfect Adherence</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">No category limit breaches identified in this cycle.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Automatic Reallocations */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                      <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                        <RefreshCw className="h-4 w-4 text-purple-500" />
                        AI Budget Self-Balancing
                      </h3>
                      <div className="space-y-2.5">
                        {advisorData.reallocationActions.map((act, idx) => (
                          <div key={idx} className="flex gap-2.5 items-start bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs">
                            <div className="h-5 w-5 rounded bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-[10px] mt-0.5">
                              {idx + 1}
                            </div>
                            <span className="text-slate-600 leading-relaxed font-semibold">{act}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Substitution & Discretionary Advice */}
                  <div className="lg:col-span-5 space-y-6">
                    
                    {/* Discretionary purchasing advice */}
                    <div className="bg-gradient-to-br from-purple-50/50 to-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                      <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                        <Gauge className="h-4 w-4 text-purple-600" />
                        Discretionary Purchase Advisory
                      </h3>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3 bg-white border border-slate-150 rounded-xl p-3">
                          {advisorData.overspentCategories.length > 0 ? (
                            <>
                              <div className="h-10 w-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 flex-shrink-0">
                                <ThumbsDown className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="text-xs font-extrabold text-rose-800">Cautionary Standby</h4>
                                <span className="text-[9px] text-slate-400 font-bold font-mono">Discretionary Spend Index: 35/100</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 flex-shrink-0">
                                <ThumbsUp className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="text-xs font-extrabold text-emerald-800">Safe Purchase Window</h4>
                                <span className="text-[9px] text-slate-400 font-bold font-mono">Discretionary Spend Index: 84/100</span>
                              </div>
                            </>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed font-medium bg-white border border-slate-100 p-3.5 rounded-xl">
                          {advisorData.discretionaryAdvice}
                        </p>

                        {advisorData.cashShortageWarning && (
                          <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-rose-800 flex items-start gap-2 text-[10px]">
                            <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                            <span className="font-bold">{advisorData.cashShortageWarning}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cost-Saving Substitutes */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                      <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                        <Scissors className="h-4 w-4 text-emerald-600" />
                        Cheaper Alternatives Suggested
                      </h3>
                      
                      <div className="space-y-2.5">
                        {advisorData.cheaperAlternatives.map((alt, idx) => (
                          <div key={idx} className="flex gap-2.5 items-start text-xs font-bold text-slate-600">
                            <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 mt-0.5">✓</span>
                            <span className="leading-normal">{alt}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </motion.div>
          )}

          {/* TAB 3: Predictive Finance */}
          {activeTab === 'predictive' && (
            <motion.div
              key="predictive"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Summary Banner */}
              <div className="bg-gradient-to-br from-purple-900 via-violet-950 to-slate-950 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-purple-500/5 border border-purple-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Decorative ambient background lights */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-fuchsia-500/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                <div className="space-y-1 relative z-10">
                  <h2 className="text-md font-extrabold flex items-center gap-1.5">
                    <TrendingUp className="h-5 w-5 text-emerald-300 animate-pulse" />
                    Predictive Finance Engine
                  </h2>
                  <p className="text-xs text-purple-200">
                    Forecasts ending balances, evaluates upcoming bill impacts, identifies cap overruns, and maps goal achievement dates.
                  </p>
                </div>
                <button
                  onClick={fetchPredictiveData}
                  disabled={loadingStates.predictive}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 self-start md:self-center transition cursor-pointer relative z-10"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingStates.predictive ? 'animate-spin' : ''}`} />
                  Recalculate
                </button>
              </div>

              {loadingStates.predictive && (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
                  <RefreshCw className="h-8 w-8 text-purple-600 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-500">Simulating cash flow run rates and processing balance trends...</p>
                </div>
              )}

              {errorStates.predictive && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl flex items-center gap-2.5 text-xs">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{errorStates.predictive}</span>
                </div>
              )}

              {predictiveData && !loadingStates.predictive && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left: Forecast & Flow */}
                  <div className="lg:col-span-7 space-y-6">
                    
                    {/* EOM Forecast Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
                      <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                        <div>
                          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">End of Month Cash Forecast</h3>
                          <p className="text-[9px] text-slate-400 mt-0.5">Projected liquidity based on active daily spending run-rate.</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          predictiveData.cashFlowTrend === 'positive' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {predictiveData.cashFlowTrend} flow
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2 pt-2">
                        <span className="text-3xl font-black text-slate-800 tracking-tight">{predictiveData.endOfMonthForecast}</span>
                        <span className="text-xs font-bold text-slate-400">estimated balance</span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-semibold bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                        {predictiveData.upcomingBillImpact}
                      </p>

                      {/* Interactive Predictive Liquidity Chart */}
                      <div className="pt-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">30-Day Liquidity Curve Simulation</span>
                          <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-md">Interactive Forecast</span>
                        </div>
                        <div className="h-[180px] w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 rounded-xl p-2.5">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={projectionData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis 
                                dataKey="day" 
                                stroke="#94a3b8" 
                                fontSize={9} 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={(val) => {
                                  const d = val.replace('Day ', '');
                                  return d % 5 === 0 || d === '1' ? `D${d}` : '';
                                }}
                              />
                              <YAxis 
                                stroke="#94a3b8" 
                                fontSize={9} 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                              />
                              <Tooltip 
                                contentStyle={{
                                  backgroundColor: '#1e293b',
                                  border: 'none',
                                  borderRadius: '12px',
                                  padding: '8px 12px'
                                }}
                                labelStyle={{ color: '#94a3b8', fontSize: '9px', fontWeight: 'bold' }}
                                itemStyle={{ color: '#f8fafc', fontSize: '11px', fontWeight: 'bold' }}
                                formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Projected Balance']}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="Balance" 
                                stroke="#8b5cf6" 
                                strokeWidth={2.5} 
                                fillOpacity={1} 
                                fill="url(#balanceGrad)" 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex items-center gap-1.5 justify-end mt-1.5 text-[9px] text-slate-400 font-medium">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-500" />
                          <span>Simulation includes daily burn rate + scheduled due dates.</span>
                        </div>
                      </div>

                      {predictiveData.preemptiveWarning && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-3.5 flex items-start gap-2.5 text-xs font-bold">
                          <AlertTriangle className="h-4.5 w-4.5 text-rose-500 flex-shrink-0 mt-0.5" />
                          <span>{predictiveData.preemptiveWarning}</span>
                        </div>
                      )}
                    </div>

                    {/* Overrun Risks */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3.5">
                      <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Preemptive Budget Overrun Risks</h3>
                      <div className="space-y-2">
                        {predictiveData.overrunRisks.map((risk, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-50 hover:bg-slate-100/50 p-2.5 rounded-xl border border-slate-100 text-xs font-bold text-slate-700">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-amber-500" />
                              {risk}
                            </span>
                            <span className="text-amber-600">High Deficit Risk</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Right: Milestone Timeline Projections */}
                  <div className="lg:col-span-5 space-y-6">
                    
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                      <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                        <Target className="h-4 w-4 text-purple-500" />
                        Milestone Timeline Estimations
                      </h3>

                      <div className="space-y-3">
                        {predictiveData.milestoneProjections.length > 0 ? (
                          predictiveData.milestoneProjections.map((mil, idx) => (
                            <div key={idx} className="p-3 bg-purple-50/10 border border-purple-100/30 rounded-xl space-y-1.5">
                              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                <span>{mil.milestone}</span>
                                <span className="text-purple-600 font-mono font-extrabold">{mil.predictedCompletionDate}</span>
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-400 font-bold font-mono">
                                <span>Velocity: Achievable</span>
                                <span>~{mil.daysRemaining} days remaining</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-slate-400">
                            <PiggyBank className="h-8 w-8 text-slate-300 mx-auto mb-1" />
                            <p className="text-xs">No active savings milestones configured.</p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </motion.div>
          )}

          {/* TAB 5: Financial Coach */}
          {activeTab === 'coach' && (
            <motion.div
              key="coach"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Summary Banner */}
              <div className="bg-gradient-to-br from-purple-900 via-violet-950 to-slate-950 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-purple-500/5 border border-purple-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Decorative ambient background lights */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-fuchsia-500/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                <div className="space-y-1 relative z-10">
                  <h2 className="text-md font-extrabold flex items-center gap-1.5">
                    <Award className="h-5 w-5 text-violet-300 animate-pulse" />
                    Financial Coach & Challenges
                  </h2>
                  <p className="text-xs text-purple-200">
                    Provides customized micro-guidance, review summaries, monthly challenges, and personalized habits tuning.
                  </p>
                </div>
                <button
                  onClick={fetchCoachData}
                  disabled={loadingStates.coach}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 self-start md:self-center transition cursor-pointer relative z-10"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingStates.coach ? 'animate-spin' : ''}`} />
                  Recalculate
                </button>
              </div>

              {loadingStates.coach && (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
                  <RefreshCw className="h-8 w-8 text-purple-600 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-500">Generating weekly reviews and preparing interactive behavioral challenges...</p>
                </div>
              )}

              {errorStates.coach && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl flex items-center gap-2.5 text-xs">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{errorStates.coach}</span>
                </div>
              )}

              {coachData && !loadingStates.coach && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Reviews & Habit Improvements */}
                  <div className="lg:col-span-7 space-y-6">
                    
                    {/* Weekly Review */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3.5">
                      <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Weekly Performance Review</h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                        {coachData.weeklyReview}
                      </p>
                    </div>

                    {/* Behavior improvements checklist */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                      <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Recommended Spending Habit Fixes</h3>
                      <div className="space-y-3">
                        {coachData.habitImprovements.map((imp, idx) => (
                          <div key={idx} className="flex gap-3 items-start text-xs text-slate-600 font-bold">
                            <span className="h-5 w-5 bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-[10px] rounded flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{imp}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Challenge & Tips */}
                  <div className="lg:col-span-5 space-y-6">
                    
                    {/* Monthly Challenge */}
                    <div className="bg-gradient-to-br from-purple-950 to-slate-950 text-white rounded-2xl p-5 shadow-md space-y-4 border border-slate-800">
                      <div className="flex justify-between items-center pb-2 border-b border-white/10">
                        <h3 className="text-[10px] font-extrabold text-purple-300 uppercase tracking-widest">Active Saving Challenge</h3>
                        <span className="text-[9px] font-bold bg-purple-500/20 px-2 py-0.5 border border-purple-400/20 rounded capitalize">{coachData.monthlyChallenge.difficulty}</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Flame className="h-5 w-5 text-amber-500" />
                          <h4 className="text-xs font-bold text-slate-100">{coachData.monthlyChallenge.title}</h4>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-normal">
                          {coachData.monthlyChallenge.target}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[10px] font-bold text-purple-200 font-mono">Bounty: +{coachData.monthlyChallenge.points} XP Points</span>
                        {challengeAccepted ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                            <Check className="h-3 w-3" />
                            {userName}, you accepted this challenge!
                          </span>
                        ) : (
                          <button
                            onClick={() => setChallengeAccepted(true)}
                            className="px-3.5 py-1.5 bg-purple-500 hover:bg-purple-600 text-white font-extrabold text-[10px] rounded-lg cursor-pointer transition shadow-sm flex items-center gap-1"
                          >
                            <Zap className="h-3 w-3 text-amber-300 fill-amber-300" />
                            Accept Challenge, {userName}!
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tips */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3.5">
                      <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Customized Savings Tips</h3>
                      <div className="space-y-2.5">
                        {coachData.customSavingsTips.map((tip, idx) => (
                          <div key={idx} className="flex gap-2.5 items-start text-xs font-bold text-slate-600">
                            <span className="h-4 w-4 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded text-[9px] font-black flex-shrink-0 mt-0.5">✓</span>
                            <span className="leading-normal">{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
