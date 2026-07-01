/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, AlertCircle, TrendingUp, DollarSign, Calendar, Sparkles, 
  Trash2, BellRing, Target, ArrowRightCircle, AlertTriangle, Edit2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Budget, Expense, Category, AppMode, Group } from '../types';
import VoiceFileAssistant from './VoiceFileAssistant';

interface BudgetsProps {
  userName?: string;
  budgets: Budget[];
  expenses: Expense[];
  categories: Category[];
  mode: AppMode;
  activeGroup?: Group;
  token: string;
  onRefresh: () => void;
}

export default function Budgets({ userName, budgets, expenses, categories, mode, activeGroup, token, onRefresh }: BudgetsProps) {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('monthly');
  const [category, setCategory] = useState('All');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleParsedBudget = (data: any) => {
    if (data.amount) setAmount(data.amount.toString());
    if (data.period) {
      const p = data.period.toLowerCase();
      if (p === 'weekly' || p === 'monthly') {
        setPeriod(p);
      }
    }
    if (data.category) {
      const matched = categories.find(c => c.name.toLowerCase() === data.category.toLowerCase());
      if (matched) {
        setCategory(matched.name);
      } else {
        setCategory('All');
      }
    }
  };

  // Edit State
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editPeriod, setEditPeriod] = useState<'weekly' | 'monthly'>('monthly');
  const [editCategory, setEditCategory] = useState('All');

  const startEditing = (b: Budget) => {
    setEditingBudgetId(b.id);
    setEditAmount(b.amount.toString());
    setEditPeriod(b.period);
    setEditCategory(b.category || 'All');
  };

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAmount) return;

    try {
      const response = await fetch(`/api/budgets/${editingBudgetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: editAmount,
          period: editPeriod,
          category: editCategory === 'All' ? undefined : editCategory
        })
      });

      if (response.ok) {
        onRefresh();
        setEditingBudgetId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Map expenses to budget limits
  const budgetStatus = useMemo(() => {
    return budgets.map(b => {
      // Find expenses matching this budget
      let matchingExpenses = expenses;
      if (b.category) {
        matchingExpenses = expenses.filter(e => e.category.toLowerCase() === b.category?.toLowerCase());
      }
      
      const spent = matchingExpenses.reduce((sum, e) => sum + e.amount, 0);
      const percent = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      const isOverspent = spent > b.amount;
      const isNearLimit = !isOverspent && percent >= 85;

      return {
        ...b,
        spent,
        percent,
        isOverspent,
        isNearLimit
      };
    });
  }, [budgets, expenses]);

  // 2. Submit new budget target
  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    try {
      const body: any = {
        amount,
        period,
        category: category === 'All' ? undefined : category
      };

      if (mode === 'group' && activeGroup) {
        body.groupId = activeGroup.id;
      }

      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        onRefresh();
        setAmount('');
        setShowForm(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Delete budget target
  const handleDeleteBudget = async (id: string) => {
    try {
      const response = await fetch(`/api/budgets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Budget Limits</h1>
          <p className="text-xs text-slate-500">Plan monthly caps and monitor category utilization levels.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-xs font-semibold text-white shadow-sm cursor-pointer transition"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Create Budget
        </button>
      </div>

      {/* 2. Create Budget Target Expandable Panel */}
      {showForm && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm max-w-lg space-y-4"
        >
          <VoiceFileAssistant type="budget" token={token} onParsed={handleParsedBudget} />

          <div>
            <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wider mb-3">Or set details manually</h3>
            <form onSubmit={handleAddBudget} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 font-medium">Budget Period</label>
                <select
                  value={period}
                  onChange={e => setPeriod(e.target.value as any)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="monthly">Monthly Budget</option>
                  <option value="weekly">Weekly Budget</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Budget Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="All">All Transactions (Overall Limit)</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 font-medium">Budget Cap Amount (₹)</label>
              <input
                type="number"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-50 rounded-xl text-xs text-slate-700 hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-sm"
              >
                Create Target
              </button>
            </div>
          </form>
          </div>
        </motion.div>
      )}

      {/* 3. Warning Banners */}
      {budgetStatus.some(b => b.isOverspent || b.isNearLimit) && (
        <div className="space-y-2">
          {budgetStatus.filter(b => b.isOverspent).map(b => (
            <div key={b.id} className="bg-rose-50 border-l-4 border-rose-400 p-3.5 rounded-xl flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-800">Budget Overspent Warning</h4>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  You have exceeded your {b.period} {b.category || 'overall'} budget of ₹{b.amount}. Active spending stands at ₹{b.spent.toFixed(2)}.
                </p>
              </div>
            </div>
          ))}
          {budgetStatus.filter(b => b.isNearLimit).map(b => (
            <div key={b.id} className="bg-amber-50 border-l-4 border-amber-400 p-3.5 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-800">Budget Limit Near Capacity</h4>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Your {b.period} {b.category || 'overall'} budget has reached {b.percent.toFixed(0)}% utilization. Remaining threshold: ₹{(b.amount - b.spent).toFixed(2)}.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Active Budgets Grid */}
      {budgetStatus.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-sm">
          <Target className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs">No active budget thresholds set. Click "Create Budget" above to configure.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {budgetStatus.map((budget) => {
            const isCategorySpecific = !!budget.category;
            const remaining = Math.max(0, budget.amount - budget.spent);
            const isEditing = editingBudgetId === budget.id;

            return (
              <motion.div
                whileHover={isEditing ? {} : { y: -2 }}
                key={budget.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4"
              >
                {isEditing ? (
                  <form onSubmit={handleUpdateBudget} className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-purple-600 uppercase">Update Budget</span>
                      <button 
                        type="button" 
                        onClick={() => setEditingBudgetId(null)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block">Period</label>
                        <select
                          value={editPeriod}
                          onChange={e => setEditPeriod(e.target.value as any)}
                          className="mt-1 block w-full px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block">Category</label>
                        <select
                          value={editCategory}
                          onChange={e => setEditCategory(e.target.value)}
                          className="mt-1 block w-full px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                          <option value="All">All Transactions</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block">Cap Amount (₹)</label>
                      <input
                        type="number"
                        required
                        value={editAmount}
                        onChange={e => setEditAmount(e.target.value)}
                        className="mt-1 block w-full px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full mt-2 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition"
                    >
                      Save Changes
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-semibold text-purple-600 bg-purple-50/50 px-2 py-0.5 rounded-full capitalize">
                          {budget.period} limit
                        </span>
                        <h3 className="font-bold text-slate-800 text-sm mt-2">
                          {isCategorySpecific ? `${budget.category} Category Budget` : 'Overall Spending Cap'}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditing(budget)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                          title="Edit Budget"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(budget.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-lg transition cursor-pointer"
                          title="Delete Budget"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Balance display */}
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="text-2xl font-bold text-slate-800">₹{budget.spent.toFixed(2)}</span>
                        <span className="text-xs text-slate-400 ml-1">spent of ₹{budget.amount}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-500 block">Remaining</span>
                        <span className={`text-sm font-bold block ${budget.isOverspent ? 'text-rose-500' : 'text-emerald-600'}`}>
                          ₹{remaining.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            budget.isOverspent ? 'bg-rose-500' :
                            budget.isNearLimit ? 'bg-amber-500' : 'bg-purple-600'
                          }`}
                          style={{ 
                            width: `${Math.min(100, budget.percent)}%`,
                            opacity: budget.percent > 0 ? 1 : 0
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] font-semibold text-slate-400 mt-1.5">
                        <span>{budget.percent.toFixed(0)}% Used</span>
                        <span>Starts: {budget.startDate}</span>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-4 text-rose-600">
              <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center flex-shrink-0 border border-rose-100">
                <AlertTriangle className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-800">Delete Budget Limit, {userName || 'User'}?</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{userName || 'User'}, this action is permanent and cannot be undone.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteBudget(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-sm shadow-rose-600/10"
              >
                Yes, {userName || 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
