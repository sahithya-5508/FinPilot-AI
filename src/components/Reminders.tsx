/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, BellRing, Calendar, DollarSign, CheckCircle2, 
  Trash2, Sparkles, Clock, CalendarDays, RefreshCw, AlertCircle, Edit2, AlertTriangle 
} from 'lucide-react';
import { motion } from 'motion/react';
import { BillReminder } from '../types';
import VoiceFileAssistant from './VoiceFileAssistant';

interface RemindersProps {
  userName?: string;
  reminders: BillReminder[];
  token: string;
  onRefresh: () => void;
}

export default function Reminders({ userName, reminders, token, onRefresh }: RemindersProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [frequency, setFrequency] = useState<'once' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [category, setCategory] = useState('Bills');
  const [googleCalendarSync, setGoogleCalendarSync] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleParsedReminder = (data: any) => {
    if (data.title) setTitle(data.title);
    if (data.amount) setAmount(data.amount.toString());
    if (data.dueDate) setDueDate(data.dueDate);
    if (data.frequency) {
      const f = data.frequency.toLowerCase();
      if (['once', 'weekly', 'monthly', 'yearly'].includes(f)) {
        setFrequency(f as any);
      }
    }
    if (data.category) setCategory(data.category);
  };

  // Edit States
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editFrequency, setEditFrequency] = useState<'once' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [editCategory, setEditCategory] = useState('Bills');
  const [editGoogleCalendarSync, setEditGoogleCalendarSync] = useState(true);

  const startEditing = (rem: BillReminder) => {
    setEditingReminderId(rem.id);
    setEditTitle(rem.title);
    setEditAmount(rem.amount.toString());
    setEditDueDate(rem.dueDate);
    setEditFrequency(rem.frequency);
    setEditCategory(rem.category);
    setEditGoogleCalendarSync(!!rem.googleCalendarEventId);
  };

  const handleUpdateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle || !editAmount || !editDueDate) return;

    try {
      const response = await fetch(`/api/reminders/${editingReminderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editTitle,
          amount: editAmount,
          dueDate: editDueDate,
          frequency: editFrequency,
          category: editCategory,
          googleCalendarSync: editGoogleCalendarSync
        })
      });

      if (response.ok) {
        onRefresh();
        setEditingReminderId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const downloadCalendarInvite = (rem: BillReminder) => {
    try {
      const titleFormatted = rem.title.replace(/[,;]/g, '\\$&');
      const dateStr = rem.dueDate.replace(/-/g, ''); // YYYYMMDD
      
      const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//AI Finance Assistant//NONSGML v1.0//EN',
        'BEGIN:VEVENT',
        `UID:uid-${rem.id}@financeassistant.com`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART;VALUE=DATE:${dateStr}`,
        `DTEND;VALUE=DATE:${dateStr}`,
        `SUMMARY:Bill Due: ${titleFormatted}`,
        `DESCRIPTION:Reminder to pay ₹${rem.amount.toFixed(2)} for ${titleFormatted}. Billing Frequency: ${rem.frequency}.`,
        'END:VEVENT',
        'END:VCALENDAR'
      ];
      
      const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${rem.title.toLowerCase().replace(/\s+/g, '_')}_due.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to generate calendar invite:', err);
    }
  };

  // Submit Reminder
  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !dueDate) return;

    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          amount,
          dueDate,
          frequency,
          category,
          googleCalendarSync
        })
      });

      if (response.ok) {
        onRefresh();
        setTitle('');
        setAmount('');
        setDueDate('');
        setShowForm(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle paid state
  const handleTogglePaid = async (id: string) => {
    try {
      const response = await fetch(`/api/reminders/${id}/pay`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete reminder
  const handleDeleteReminder = async (id: string) => {
    try {
      const response = await fetch(`/api/reminders/${id}`, {
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
      {/* 1. Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Bill Schedules</h1>
          <p className="text-xs text-slate-500">Track recurring obligations and automatically sync alerts to Google Calendar.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-xs font-semibold text-white shadow-sm cursor-pointer transition"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Schedule Bill
        </button>
      </div>

      {/* 2. Schedule Bill Expandable form */}
      {showForm && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm max-w-lg space-y-4"
        >
          <VoiceFileAssistant type="bill" allowFile={false} token={token} onParsed={handleParsedReminder} />

          <div>
            <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wider mb-3">Or schedule reminder details manually</h3>
            <form onSubmit={handleAddReminder} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 font-medium">Bill Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Adobe Subscription"
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Bill/Rem Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="500"
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-500 font-medium">Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="mt-1 block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Frequency</label>
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value as any)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="once">Once</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="Bills">Bills & Utilities</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Food">Food / Groceries</option>
                  <option value="Miscellaneous">Other</option>
                </select>
              </div>
            </div>

            {/* Google Calendar Sync Selector */}
            <div className="flex items-center bg-purple-50/50 p-3 rounded-xl border border-purple-100">
              <input
                type="checkbox"
                id="gCalSync"
                checked={googleCalendarSync}
                onChange={e => setGoogleCalendarSync(e.target.checked)}
                className="h-4 w-4 text-purple-600 border-slate-300 rounded cursor-pointer"
              />
              <div className="ml-3">
                <label htmlFor="gCalSync" className="text-[11px] font-bold text-purple-800 flex items-center gap-1 cursor-pointer">
                  <CalendarDays className="h-4 w-4 text-purple-600" />
                  Auto-Sync to Google Calendar
                </label>
                <span className="text-[9px] text-purple-500 block font-medium">Enables auto-sync, alerts, and calendar logs.</span>
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
                Schedule reminder
              </button>
            </div>
          </form>
          </div>
        </motion.div>
      )}

      {/* 3. Schedules Listing */}
      {reminders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-sm">
          <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs">No bill schedules currently planned.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reminders.map((rem) => {
            const dateObj = new Date(rem.dueDate);
            const daysLeft = Math.ceil((dateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const isEditing = editingReminderId === rem.id;
            
            return (
              <motion.div
                whileHover={isEditing ? {} : { y: -2 }}
                key={rem.id}
                className={`p-4 rounded-2xl border transition shadow-sm flex flex-col justify-between ${
                  rem.isPaid 
                    ? 'bg-slate-50 border-slate-200 opacity-70' 
                    : 'bg-white border-slate-200'
                }`}
              >
                {isEditing ? (
                  <form onSubmit={handleUpdateReminder} className="space-y-3 w-full">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-purple-600 uppercase">Update Reminder</span>
                      <button 
                        type="button" 
                        onClick={() => setEditingReminderId(null)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block">Bill/Reminder Title</label>
                      <input
                        type="text"
                        required
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="mt-1 block w-full px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block">Amount (₹)</label>
                        <input
                          type="number"
                          required
                          value={editAmount}
                          onChange={e => setEditAmount(e.target.value)}
                          className="mt-1 block w-full px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block">Due Date</label>
                        <input
                          type="date"
                          required
                          value={editDueDate}
                          onChange={e => setEditDueDate(e.target.value)}
                          className="mt-1 block w-full px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block">Frequency</label>
                        <select
                          value={editFrequency}
                          onChange={e => setEditFrequency(e.target.value as any)}
                          className="mt-1 block w-full px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                          <option value="once">One-time</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block">Category</label>
                        <select
                          value={editCategory}
                          onChange={e => setEditCategory(e.target.value)}
                          className="mt-1 block w-full px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                          <option value="Bills">Bills & Utilities</option>
                          <option value="Entertainment">Entertainment</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Food">Food / Groceries</option>
                          <option value="Miscellaneous">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id={`editGCalSync-${rem.id}`}
                        checked={editGoogleCalendarSync}
                        onChange={e => setEditGoogleCalendarSync(e.target.checked)}
                        className="h-3.5 w-3.5 text-purple-600 border-slate-300 rounded cursor-pointer"
                      />
                      <label htmlFor={`editGCalSync-${rem.id}`} className="text-[10px] text-slate-500 cursor-pointer">
                        Sync with Calendar
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="w-full mt-2 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition"
                    >
                      Save Changes
                    </button>
                  </form>
                ) : (
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-3.5">
                      <span className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                        rem.isPaid 
                          ? 'bg-slate-100 text-slate-400 border-slate-200' 
                          : 'bg-purple-50 text-purple-600 border-purple-100'
                      }`}>
                        <Clock className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className={`font-bold text-slate-800 text-xs ${rem.isPaid ? 'line-through text-slate-400 font-medium' : ''}`}>
                          {rem.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400 font-bold capitalize">{rem.frequency}</span>
                          <span className="text-[10px] text-slate-300">•</span>
                          <span className={`text-[10px] font-bold ${
                            rem.isPaid ? 'text-slate-400' :
                            daysLeft <= 3 ? 'text-rose-500 font-semibold' : 'text-amber-600'
                          }`}>
                            {rem.isPaid ? 'Settled' : daysLeft <= 0 ? 'Overdue' : `${daysLeft} days left`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-800 block">₹{rem.amount.toFixed(2)}</span>
                        <span className="text-[9px] text-slate-400 block">{rem.dueDate}</span>
                        {rem.googleCalendarEventId && (
                          <button
                            onClick={() => downloadCalendarInvite(rem)}
                            className="inline-flex items-center text-[8px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-1 py-0.5 rounded mt-1 border border-purple-100 cursor-pointer"
                            title="Download .ics event to sync to Google Calendar"
                          >
                            Sync Cal 📥
                          </button>
                        )}
                      </div>
                      <div className="flex gap-1 border-l border-slate-200 pl-4">
                        <button
                          onClick={() => handleTogglePaid(rem.id)}
                          className={`p-1 rounded-lg border transition cursor-pointer ${
                            rem.isPaid 
                              ? 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100' 
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                          }`}
                          title={rem.isPaid ? 'Mark as Unpaid' : 'Mark as Settled'}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => startEditing(rem)}
                          className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg border border-transparent hover:border-slate-100 transition cursor-pointer"
                          title="Edit Reminder"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(rem.id)}
                          className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-100 transition cursor-pointer"
                          title="Delete Reminder"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
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
                <h3 className="text-lg font-extrabold text-slate-800">Delete Bill Schedule, {userName || 'User'}?</h3>
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
                  handleDeleteReminder(deleteConfirmId);
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
