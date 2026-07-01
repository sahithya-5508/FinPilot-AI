/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sparkles, Compass, CheckCircle2, AlertCircle, PiggyBank, Target, 
  CalendarDays, ArrowRight, ShieldCheck, HeartPulse, Landmark, 
  DollarSign, Percent, Zap, Wifi, Shield, RefreshCw, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OnboardingProps {
  token: string | null;
  defaultName?: string;
  onOnboardComplete: () => void;
}

export default function Onboarding({ token, defaultName = '', onOnboardComplete }: OnboardingProps) {
  const [screen, setScreen] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string | null>(null);

  // Profile data state
  const [userName, setUserName] = useState<string>(defaultName);
  const [salary, setSalary] = useState<string>('');
  const [otherIncome, setOtherIncome] = useState<string>('');
  const [budgetLimit, setBudgetLimit] = useState<string>('');
  const [currency, setCurrency] = useState<string>('INR');
  const [savingsGoal, setSavingsGoal] = useState<string>('');
  
  // Fixed expenses
  const [rent, setRent] = useState<string>('');
  const [rentDueDay, setRentDueDay] = useState<string>('5');
  const [emi, setEmi] = useState<string>('');
  const [emiDueDay, setEmiDueDay] = useState<string>('10');
  const [utilities, setUtilities] = useState<string>('');
  const [utilitiesDueDay, setUtilitiesDueDay] = useState<string>('15');
  const [internet, setInternet] = useState<string>('');
  const [internetDueDay, setInternetDueDay] = useState<string>('18');
  const [insurance, setInsurance] = useState<string>('');
  const [insuranceDueDay, setInsuranceDueDay] = useState<string>('25');

  // Spending Style
  const [spendingStyle, setSpendingStyle] = useState<'conservative' | 'moderate' | 'flexible'>('moderate');

  // AI Loading Steps state
  const [activeStep, setActiveStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const getCurrencySymbol = () => {
    switch (currency) {
      case 'INR': return '₹';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return '₹';
    }
  };

  const startOnboardingSetup = async () => {
    if (!userName.trim()) {
      setError('Your Full Name is required.');
      return;
    }
    if (!salary || Number(salary) <= 0) {
      setError('Monthly Salary is required and must be greater than 0.');
      return;
    }

    setScreen(3);
    setError(null);
    setActiveStep(1);

    // Prepare steps timing animation sequence
    const stepTimes = [1000, 2000, 3000, 4000];
    stepTimes.forEach((time, index) => {
      setTimeout(() => {
        setCompletedSteps(prev => [...prev, index + 1]);
        setActiveStep(index + 2);
      }, time);
    });

    try {
      const response = await fetch('/api/onboarding/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: userName.trim(),
          salary: Number(salary),
          otherIncome: Number(otherIncome || 0),
          budgetLimit: Number(budgetLimit || 0),
          currency,
          savingsGoal: Number(savingsGoal || 0),
          fixedExpenses: {
            rent: Number(rent || 0),
            rentDueDay: Number(rentDueDay || 5),
            emi: Number(emi || 0),
            emiDueDay: Number(emiDueDay || 10),
            utilities: Number(utilities || 0),
            utilitiesDueDay: Number(utilitiesDueDay || 15),
            internet: Number(internet || 0),
            internetDueDay: Number(internetDueDay || 18),
            insurance: Number(insurance || 0),
            insuranceDueDay: Number(insuranceDueDay || 25)
          },
          spendingStyle
        })
      });

      if (!response.ok) {
        throw new Error('Onboarding data synchronization failed.');
      }

      // Once all animation steps and API call are complete
      setTimeout(() => {
        onOnboardComplete();
      }, 4800);

    } catch (err: any) {
      console.error(err);
      setTimeout(() => {
        setError(err.message || 'An error occurred during onboarding setup.');
        setScreen(2);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden transition-colors duration-300" id="onboarding-container">
      {/* Decorative Blur Blobs to enhance glassmorphism */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-300/20 dark:bg-purple-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-fuchsia-300/20 dark:bg-fuchsia-900/10 blur-[120px] pointer-events-none" />

      <div className="absolute top-6 left-6 flex items-center gap-2 z-10">
        <div className="h-8 w-8 purple-grad text-white flex items-center justify-center rounded-xl font-bold text-sm shadow-md shadow-purple-500/20">
          FP
        </div>
        <span className="text-md font-bold tracking-tight text-slate-800 dark:text-slate-100">
          FinPilot <span className="text-gradient font-extrabold">AI</span>
        </span>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <AnimatePresence mode="wait">
          
          {/* SCREEN 1: Welcome Screen */}
          {screen === 1 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass-card rounded-3xl p-8 sm:p-12 shadow-xl border border-purple-100/40 dark:border-purple-900/20 text-center space-y-8 relative overflow-hidden"
            >
              <div className="absolute -top-12 -right-12 h-40 w-40 bg-purple-50/50 dark:bg-purple-950/20 rounded-full blur-2xl pointer-events-none" />
              
              <div className="mx-auto h-20 w-20 bg-purple-50/50 border border-purple-100 rounded-3xl flex items-center justify-center shadow-xs">
                <Sparkles className="h-10 w-10 text-purple-600 animate-pulse" />
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none sm:text-4xl">
                  Let's personalize your financial journey
                </h1>
                <p className="text-slate-500 text-sm max-w-lg mx-auto leading-relaxed">
                  This will take less than a minute and helps our AI provide accurate budgeting and financial recommendations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto pt-4">
                <div className="p-4 bg-slate-50/55 dark:bg-slate-900/35 rounded-2xl border border-slate-150/50 text-center">
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center mx-auto mb-2 text-purple-600">
                    <Target className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Budget Caps</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Custom category spending limits.</p>
                </div>

                <div className="p-4 bg-slate-50/55 dark:bg-slate-900/35 rounded-2xl border border-slate-150/50 text-center">
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center mx-auto mb-2 text-purple-600">
                    <PiggyBank className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Savings Target</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Automated savings objectives.</p>
                </div>

                <div className="p-4 bg-slate-50/55 dark:bg-slate-900/35 rounded-2xl border border-slate-150/50 text-center">
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center mx-auto mb-2 text-purple-600">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Bill Schedules</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Auto-detected utility tracking.</p>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => setScreen(2)}
                  className="w-full sm:w-auto px-8 py-4 purple-grad purple-grad-hover text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-purple-600/10 hover:shadow-purple-600/25 transition flex items-center justify-center gap-2 mx-auto cursor-pointer"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* SCREEN 2: Financial Profile Setup */}
          {screen === 2 && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass-card rounded-3xl p-6 sm:p-10 shadow-xl border border-purple-100/40 dark:border-purple-900/20 space-y-8"
            >
              <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Financial Profile Setup</h2>
                <p className="text-xs text-slate-400 mt-0.5">Provide basic metrics to seed your ledger and activate AI advisory logic.</p>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3 text-rose-700">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span className="text-xs leading-relaxed font-semibold">{error}</span>
                </div>
              )}

              <div className="space-y-6">
                
                {/* 0. PERSONAL DETAILS SECTION */}
                <div className="bg-purple-50/20 border border-purple-100/30 dark:border-purple-900/15 rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    Personal Profile Details
                  </h3>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. Alex Mercer"
                      className="block w-full px-4 py-3 text-xs text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* 1. INCOME SECTION */}
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="h-4 w-4" />
                    Income & Currency Preferences
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Monthly Salary (Required) *</label>
                      <div className="relative rounded-xl shadow-xs">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-xs font-bold text-slate-400">{getCurrencySymbol()}</span>
                        </div>
                        <input
                          type="number"
                          required
                          value={salary}
                          onChange={(e) => setSalary(e.target.value)}
                          placeholder="e.g. 75000"
                          className="block w-full pl-8 pr-3 py-3 text-xs text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Other Monthly Income (Optional)</label>
                      <div className="relative rounded-xl shadow-xs">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-xs font-bold text-slate-400">{getCurrencySymbol()}</span>
                        </div>
                        <input
                          type="number"
                          value={otherIncome}
                          onChange={(e) => setOtherIncome(e.target.value)}
                          placeholder="e.g. 5000"
                          className="block w-full pl-8 pr-3 py-3 text-xs text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Monthly Budget Target</label>
                      <div className="relative rounded-xl shadow-xs">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-xs font-bold text-slate-400">{getCurrencySymbol()}</span>
                        </div>
                        <input
                          type="number"
                          value={budgetLimit}
                          onChange={(e) => setBudgetLimit(e.target.value)}
                          placeholder="e.g. 35000"
                          className="block w-full pl-8 pr-3 py-3 text-xs text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Platform Currency</label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="block w-full px-3 py-3 text-xs text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      >
                        <option value="INR">INR (₹) Rupees</option>
                        <option value="USD">USD ($) Dollars</option>
                        <option value="EUR">EUR (€) Euros</option>
                        <option value="GBP">GBP (£) Pounds</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. SAVINGS */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <h3 className="text-xs font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <PiggyBank className="h-4 w-4" />
                    Savings Strategy
                  </h3>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Monthly Savings Goal</label>
                    <div className="relative rounded-xl shadow-xs max-w-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-xs font-bold text-slate-400">{getCurrencySymbol()}</span>
                      </div>
                      <input
                        type="number"
                        value={savingsGoal}
                        onChange={(e) => setSavingsGoal(e.target.value)}
                        placeholder="e.g. 15000"
                        className="block w-full pl-8 pr-3 py-3 text-xs text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>



                {/* 4. SPENDING STYLE */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <h3 className="text-xs font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <HeartPulse className="h-4 w-4" />
                    Spending Persona & AI Style
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setSpendingStyle('conservative')}
                      className={`text-left p-4 rounded-2xl border transition cursor-pointer ${
                        spendingStyle === 'conservative'
                          ? 'border-purple-600 dark:border-purple-400 bg-purple-50/20 text-purple-950 dark:text-purple-200 shadow-sm'
                          : 'border-slate-150 dark:border-slate-800 hover:border-slate-250 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-extrabold">Conservative</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Aggressive savings priority. AI limits variable limits strictly.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSpendingStyle('moderate')}
                      className={`text-left p-4 rounded-2xl border transition cursor-pointer ${
                        spendingStyle === 'moderate'
                          ? 'border-purple-600 dark:border-purple-400 bg-purple-50/20 text-purple-950 dark:text-purple-200 shadow-sm'
                          : 'border-slate-150 dark:border-slate-800 hover:border-slate-250 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-extrabold">Moderate</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Standard balanced growth. Proportional, stable category constraints.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSpendingStyle('flexible')}
                      className={`text-left p-4 rounded-2xl border transition cursor-pointer ${
                        spendingStyle === 'flexible'
                          ? 'border-purple-600 dark:border-purple-400 bg-purple-50/20 text-purple-950 dark:text-purple-200 shadow-sm'
                          : 'border-slate-150 dark:border-slate-800 hover:border-slate-250 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Percent className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-extrabold">Flexible</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Dynamic shifting limits. AI adapts limits loosely across segments.
                      </p>
                    </button>
                  </div>
                </div>

              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
                <button
                  onClick={startOnboardingSetup}
                  className="w-full sm:w-auto px-8 py-4 purple-grad purple-grad-hover text-white font-extrabold text-xs rounded-2xl shadow-lg hover:shadow-purple-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  Compile AI Plan
                  <Sparkles className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* SCREEN 3: AI Analysis (Loading screen) */}
          {screen === 3 && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card rounded-3xl p-8 sm:p-12 shadow-xl border border-purple-100/40 dark:border-purple-900/20 text-center space-y-8"
            >
              <div className="mx-auto h-20 w-20 bg-purple-50 dark:bg-purple-950/40 border border-purple-100/30 rounded-3xl flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-purple-600 animate-spin" style={{ animationDuration: '3s' }} />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">FinPilot AI Initializing...</h2>
                <p className="text-xs text-slate-400 dark:text-slate-350 max-w-sm mx-auto leading-relaxed">
                  Analyzing salary inflow ratios, mapping bill payment calendars, and drafting personalized limits.
                </p>
              </div>

              {/* Onboarding steps checklist */}
              <div className="max-w-md mx-auto bg-slate-50/50 dark:bg-slate-900/40 border border-slate-150/60 rounded-2xl p-5 text-left space-y-4">
                
                {/* Step 1 */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${completedSteps.includes(1) ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-slate-500'}`}>
                    Creating your financial profile
                  </span>
                  {completedSteps.includes(1) ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : activeStep === 1 ? (
                    <RefreshCw className="h-4 w-4 text-purple-600 dark:text-purple-400 animate-spin" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-slate-200" />
                  )}
                </div>

                {/* Step 2 */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${completedSteps.includes(2) ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-slate-500'}`}>
                    Setting your monthly budget
                  </span>
                  {completedSteps.includes(2) ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : activeStep === 2 ? (
                    <RefreshCw className="h-4 w-4 text-purple-600 dark:text-purple-400 animate-spin" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-slate-200" />
                  )}
                </div>

                {/* Step 3 */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${completedSteps.includes(3) ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-slate-500'}`}>
                    Learning your financial goals
                  </span>
                  {completedSteps.includes(3) ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : activeStep === 3 ? (
                    <RefreshCw className="h-4 w-4 text-purple-600 dark:text-purple-400 animate-spin" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-slate-200" />
                  )}
                </div>

                {/* Step 4 */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${completedSteps.includes(4) ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-slate-500'}`}>
                    Preparing personalized insights
                  </span>
                  {completedSteps.includes(4) ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : activeStep === 4 ? (
                    <RefreshCw className="h-4 w-4 text-purple-600 dark:text-purple-400 animate-spin" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-slate-200" />
                  )}
                </div>

              </div>

              {completedSteps.length === 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 border border-emerald-150 rounded-2xl p-4 text-center max-w-md mx-auto"
                >
                  <span className="text-xs font-extrabold text-emerald-800 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Setup complete! Redirecting to dashboard...
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
