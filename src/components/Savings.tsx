/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, PiggyBank, Target, Calendar, Sparkles, ChevronRight, 
  Trash2, PlusCircle, CheckCircle2, Award, ShieldCheck, TrendingUp, Edit2, AlertTriangle 
} from 'lucide-react';
import { motion } from 'motion/react';
import { SavingsGoal, AppMode } from '../types';
import VoiceFileAssistant from './VoiceFileAssistant';

interface SavingsProps {
  userName?: string;
  goals: SavingsGoal[];
  mode: AppMode;
  token: string;
  onRefresh: () => void;
}

export default function Savings({ userName, goals, mode, token, onRefresh }: SavingsProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState<'laptop' | 'mobile' | 'bike' | 'vacation' | 'emergency_fund' | 'other'>('laptop');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleParsedSavings = (data: any) => {
    if (data.name) setName(data.name);
    if (data.targetAmount) setTargetAmount(data.targetAmount.toString());
    if (data.currentAmount !== undefined) setCurrentAmount(data.currentAmount.toString());
    if (data.targetDate) setTargetDate(data.targetDate);
    if (data.category) {
      const c = data.category.toLowerCase();
      if (['laptop', 'mobile', 'bike', 'vacation', 'emergency_fund', 'other'].includes(c)) {
        setCategory(c as any);
      } else {
        setCategory('other');
      }
    }
  };

  // Edit States
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTargetAmount, setEditTargetAmount] = useState('');
  const [editCurrentAmount, setEditCurrentAmount] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');
  const [editCategory, setEditCategory] = useState<'laptop' | 'mobile' | 'bike' | 'vacation' | 'emergency_fund' | 'other'>('laptop');

  const startEditing = (g: SavingsGoal) => {
    setEditingGoalId(g.id);
    setEditName(g.name);
    setEditTargetAmount(g.targetAmount.toString());
    setEditCurrentAmount(g.currentAmount.toString());
    setEditTargetDate(g.targetDate);
    setEditCategory(g.category);
  };

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName || !editTargetAmount || !editTargetDate) return;

    try {
      const response = await fetch(`/api/savings/${editingGoalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          targetAmount: editTargetAmount,
          currentAmount: editCurrentAmount || 0,
          targetDate: editTargetDate,
          category: editCategory
        })
      });

      if (response.ok) {
        onRefresh();
        setEditingGoalId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Increment savings increment states
  const [activeDepositGoalId, setActiveDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  // Submit Goal
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || !targetDate) return;

    try {
      const response = await fetch('/api/savings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          targetAmount,
          currentAmount: currentAmount || 0,
          targetDate,
          category
        })
      });

      if (response.ok) {
        onRefresh();
        setName('');
        setTargetAmount('');
        setCurrentAmount('');
        setTargetDate('');
        setShowForm(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Deposit savings money
  const handleDepositSavings = async (goalId: string, currentVal: number) => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;

    try {
      const response = await fetch(`/api/savings/${goalId}/amount`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentAmount: currentVal + parseFloat(depositAmount)
        })
      });

      if (response.ok) {
        onRefresh();
        setDepositAmount('');
        setActiveDepositGoalId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete goal
  const handleDeleteGoal = async (id: string) => {
    try {
      const response = await fetch(`/api/savings/${id}`, {
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
          <h1 className="text-xl font-bold text-slate-800">Savings Vault</h1>
          <p className="text-xs text-slate-500">Track and target goals for laptops, vacation triggers, and emergency funds.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-xs font-semibold text-white shadow-sm cursor-pointer transition"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Target
        </button>
      </div>

      {/* 2. Create target goal panel */}
      {showForm && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm max-w-lg space-y-4"
        >
          <VoiceFileAssistant type="savings" token={token} onParsed={handleParsedSavings} />

          <div>
            <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wider mb-3">Or plan goal details manually</h3>
            <form onSubmit={handleAddGoal} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 font-medium">Goal Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Summer Vacation"
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Goal Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="laptop">Laptop / Tech Gear</option>
                  <option value="vacation">Vacation / Travel</option>
                  <option value="emergency_fund">Emergency Safety Net</option>
                  <option value="mobile">Mobile Devices</option>
                  <option value="bike">Bike / Vehicle</option>
                  <option value="other">Other Goal</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-500 font-medium">Target (₹)</label>
                <input
                  type="number"
                  required
                  value={targetAmount}
                  onChange={e => setTargetAmount(e.target.value)}
                  placeholder="2000"
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Initial Seed (₹)</label>
                <input
                  type="number"
                  value={currentAmount}
                  onChange={e => setCurrentAmount(e.target.value)}
                  placeholder="500"
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Target Date</label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
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
                Create Goal
              </button>
            </div>
          </form>
          </div>
        </motion.div>
      )}

      {/* 3. Goals list visualizer */}
      {goals.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-sm">
          <PiggyBank className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs">No active saving targets configured yet. Let's seed your first goal!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const percent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            const isCompleted = goal.currentAmount >= goal.targetAmount;
            const isEditing = editingGoalId === goal.id;

            const categoryIcons: Record<string, string> = {
              laptop: '💻',
              vacation: '✈️',
              emergency_fund: '🛡️',
              mobile: '📱',
              bike: '🚲',
              other: '🎯'
            };

            return (
              <motion.div
                whileHover={isEditing ? {} : { y: -2 }}
                key={goal.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4"
              >
                {isEditing ? (
                  <form onSubmit={handleUpdateGoal} className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-purple-600 uppercase">Update Goal</span>
                      <button 
                        type="button" 
                        onClick={() => setEditingGoalId(null)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block">Goal Name</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="mt-1 block w-full px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block">Target (₹)</label>
                        <input
                          type="number"
                          required
                          value={editTargetAmount}
                          onChange={e => setEditTargetAmount(e.target.value)}
                          className="mt-1 block w-full px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block">Saved (₹)</label>
                        <input
                          type="number"
                          required
                          value={editCurrentAmount}
                          onChange={e => setEditCurrentAmount(e.target.value)}
                          className="mt-1 block w-full px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block">Target Date</label>
                        <input
                          type="date"
                          required
                          value={editTargetDate}
                          onChange={e => setEditTargetDate(e.target.value)}
                          className="mt-1 block w-full px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block">Category</label>
                        <select
                          value={editCategory}
                          onChange={e => setEditCategory(e.target.value as any)}
                          className="mt-1 block w-full px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                          <option value="laptop">Laptop 💻</option>
                          <option value="vacation">Vacation ✈️</option>
                          <option value="emergency_fund">Emergency Fund 🛡️</option>
                          <option value="mobile">Mobile 📱</option>
                          <option value="bike">Bike 🚲</option>
                          <option value="other">Other 🎯</option>
                        </select>
                      </div>
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
                      <div className="flex items-center gap-3">
                        <span className="text-2xl h-10 w-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
                          {categoryIcons[goal.category] || '🎯'}
                        </span>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm truncate max-w-[120px]">{goal.name}</h3>
                          <span className="text-[10px] text-slate-400 font-medium block">Due: {goal.targetDate}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => startEditing(goal)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                          title="Edit Savings Goal"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(goal.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-lg transition cursor-pointer"
                          title="Delete Savings Goal"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Visual */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-800">₹{goal.currentAmount.toLocaleString()} saved</span>
                        <span className="text-slate-400">of ₹{goal.targetAmount.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-purple-600'}`}
                          style={{ 
                            width: `${Math.min(100, percent)}%`,
                            opacity: percent > 0 ? 1 : 0
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className={isCompleted ? 'text-emerald-600' : 'text-purple-600'}>
                          {percent.toFixed(0)}% Complete
                        </span>
                        <span className="text-slate-400">₹{remaining.toLocaleString()} remaining</span>
                      </div>
                    </div>

                    {/* Deposit trigger */}
                    <div className="pt-2 border-t border-slate-200">
                      {isCompleted ? (
                        <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl py-2 px-3 flex items-center justify-center gap-2">
                          <Award className="h-4.5 w-4.5 text-emerald-500" />
                          Goal Target Achieved!
                        </div>
                      ) : activeDepositGoalId === goal.id ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            required
                            value={depositAmount}
                            onChange={e => setDepositAmount(e.target.value)}
                            placeholder="Amount (₹)"
                            className="w-1/2 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                          <button
                            onClick={() => handleDepositSavings(goal.id, goal.currentAmount)}
                            className="w-1/4 bg-purple-600 text-white font-semibold text-xs rounded-lg py-1 hover:bg-purple-700 cursor-pointer transition shadow-sm"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => { setActiveDepositGoalId(null); setDepositAmount(''); }}
                            className="w-1/4 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg py-1 hover:bg-slate-100 cursor-pointer"
                          >
                            Close
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveDepositGoalId(goal.id)}
                          className="w-full text-center py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-purple-600 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Inject Savings Capital
                        </button>
                      )}
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
                <h3 className="text-lg font-extrabold text-slate-800">Delete Savings Goal, {userName || 'User'}?</h3>
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
                  handleDeleteGoal(deleteConfirmId);
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
