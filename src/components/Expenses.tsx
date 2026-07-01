/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, Filter, Trash2, Edit2, Calendar, FileText, 
  Sparkles, Camera, Mic, Volume2, UploadCloud, Check, ChevronDown, RefreshCw, X, AlertTriangle 
} from 'lucide-react';
import { motion } from 'motion/react';
import { Expense, Category, AppMode, Group } from '../types';
import VoiceFileAssistant from './VoiceFileAssistant';

interface ExpensesProps {
  userName?: string;
  expenses: Expense[];
  categories: Category[];
  token: string;
  onRefresh: () => void;
}

export default function Expenses({ userName, expenses, categories, token, onRefresh }: ExpensesProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [expenseSource, setExpenseSource] = useState<'manual' | 'text'>('manual');

  const handleParsedExpense = (data: any) => {
    if (data.amount) setAmount(data.amount.toString());
    if (data.category) {
      const match = categories.find(c => c.name.toLowerCase() === data.category.toLowerCase());
      if (match) {
        setCategory(match.name);
      } else {
        // Find if we have miscellaneous or just keep current
        setCategory('Food');
      }
    }
    if (data.description) setDescription(data.description);
    if (data.date) setDate(data.date);
    setExpenseSource('text');
  };

  // Edit State
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const startEditing = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setEditAmount(expense.amount.toString());
    setEditCategory(expense.category);
    setEditDate(expense.date);
    setEditDescription(expense.description);
  };

  const handleUpdateExpense = async (id: string) => {
    if (!editAmount || !editCategory || !editDate || !editDescription) return;
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(editAmount),
          category: editCategory,
          date: editDate,
          description: editDescription
        })
      });

      if (response.ok) {
        onRefresh();
        setEditingExpenseId(null);
      }
    } catch (err) {
      console.error('Failed to update expense:', err);
    }
  };
  
  // Category Creation state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3B82F6');

  // 1. Filtered Expenses list
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase()) || 
                            e.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, search, selectedCategory]);

  // 2. Add Expense Submit Handler
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !date || !description) return;

    try {
      const body: any = {
        amount,
        category,
        date,
        description,
        source: expenseSource
      };

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        onRefresh();
        // Reset state
        setAmount('');
        setDescription('');
        setExpenseSource('manual');
        setShowAddForm(false);
      }
    } catch (err) {
      console.error('Failed to log expense:', err);
    }
  };

  // 5. Custom Category Creation Handler
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCatName,
          color: newCatColor,
          icon: 'Sparkles'
        })
      });

      if (response.ok) {
        onRefresh();
        setNewCatName('');
        setShowCategoryForm(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 6. Delete Expense Log
  const handleDeleteExpense = async (id: string) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Expense Ledger</h1>
          <p className="text-xs text-slate-500">Log new transactions and organize with smart AI agents.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <button
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm"
          >
            <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
            Custom Category
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-xs font-semibold text-white cursor-pointer shadow-sm transition"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Custom category form modal dialog */}
      {showCategoryForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm max-w-sm">
          <form onSubmit={handleCreateCategory} className="space-y-3">
            <h3 className="font-bold text-slate-800 text-sm">Add Custom Category</h3>
            <div>
              <label className="text-xs text-slate-500 font-medium">Category Name</label>
              <input 
                type="text" 
                required 
                value={newCatName} 
                onChange={e => setNewCatName(e.target.value)}
                placeholder="e.g. Subscriptions" 
                className="mt-1 block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500" 
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Color Accent</label>
              <div className="flex gap-2 mt-1">
                {['#4F46E5', '#10B981', '#EC4899', '#F59E0B', '#8B5CF6', '#EF4444'].map(color => (
                  <button 
                    key={color} 
                    type="button" 
                    onClick={() => setNewCatColor(color)}
                    className="h-6 w-6 rounded-full border border-slate-100 flex items-center justify-center cursor-pointer"
                    style={{ backgroundColor: color }}
                  >
                    {newCatColor === color && <Check className="h-3.5 w-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowCategoryForm(false)} className="px-3 py-1 bg-slate-50 rounded-lg text-[11px] text-slate-600 font-semibold">Cancel</button>
              <button type="submit" className="px-3 py-1 bg-purple-600 text-white rounded-lg text-[11px] text-gray-50 font-semibold shadow-sm hover:bg-purple-700">Create</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* 2. Add Expense Form Panel */}
      {showAddForm && (
        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-lg mx-auto space-y-4"
        >
          <VoiceFileAssistant type="expense" token={token} onParsed={handleParsedExpense} />

          <div>
            <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wider mb-3">Or log details manually</h3>
            <form onSubmit={handleAddExpense} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-medium">Amount (₹)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)}
                    placeholder="1500" 
                    className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500" 
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium">Category</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-medium">Description</label>
                <input 
                  type="text" 
                  required 
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Grocery trip or Uber ride" 
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-medium">Date</label>
                  <input 
                    type="date" 
                    required 
                    value={date} 
                    onChange={e => setDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500" 
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)} 
                  className="w-1/2 px-4 py-2 bg-slate-50 rounded-xl text-xs text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer transition"
                >
                  File Expense
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {/* 3. Filter and Table Ledger */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search descriptions, amounts..."
              className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="All">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Expense Ledger Table */}
        <div className="overflow-x-auto">
          {filteredExpenses.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs">No expense transactions registered.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50/50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Details</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Source</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                  <th className="px-6 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {filteredExpenses.map((expense) => {
                  const cat = categories.find(c => c.name.toLowerCase() === expense.category.toLowerCase());
                  const dotColor = cat?.color || '#6B7280';
                  const isEditing = editingExpenseId === expense.id;
                  
                  return (
                    <tr key={expense.id} className="hover:bg-slate-50/40 transition">
                      {isEditing ? (
                        <>
                          <td className="px-6 py-3">
                            <input 
                              type="text" 
                              required 
                              value={editDescription} 
                              onChange={e => setEditDescription(e.target.value)}
                              className="w-full px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                            />
                          </td>
                          <td className="px-6 py-3">
                            <select 
                              value={editCategory} 
                              onChange={e => setEditCategory(e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                            >
                              {categories.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-3">
                            <input 
                              type="date" 
                              required 
                              value={editDate} 
                              onChange={e => setEditDate(e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </td>
                          <td className="px-6 py-3 text-slate-400">
                            -
                          </td>
                          <td className="px-6 py-3 text-right">
                            <input 
                              type="number" 
                              step="0.01" 
                              required 
                              value={editAmount} 
                              onChange={e => setEditAmount(e.target.value)}
                              className="w-24 text-right px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                            />
                          </td>
                          <td className="px-6 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleUpdateExpense(expense.id)}
                                className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition cursor-pointer"
                                title="Save changes"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditingExpenseId(null)}
                                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-slate-800">{expense.description}</p>
                              {expense.splitWithIds && (
                                <span className="inline-flex items-center text-[9px] font-bold text-purple-600 bg-purple-50/50 px-1.5 py-0.5 rounded mt-1">
                                  Splitting with {expense.splitWithIds.length} members
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: dotColor }}></span>
                              <span className="font-medium text-slate-800">{expense.category}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-500">
                            {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              expense.source === 'ocr' ? 'bg-purple-50 text-purple-600' :
                              expense.source === 'voice' ? 'bg-emerald-50 text-emerald-600' :
                              expense.source === 'text' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {expense.source}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-800">
                            ₹{expense.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => startEditing(expense)}
                                className="p-1.5 hover:bg-purple-50 text-slate-400 hover:text-purple-600 rounded-lg transition cursor-pointer"
                                title="Edit Expense"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(expense.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-lg transition cursor-pointer"
                                title="Delete Expense"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

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
                <h3 className="text-lg font-extrabold text-slate-800">Delete Transaction, {userName || 'User'}?</h3>
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
                  handleDeleteExpense(deleteConfirmId);
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
