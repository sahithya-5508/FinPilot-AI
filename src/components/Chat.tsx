/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Send, Sparkles, RefreshCw, User, HelpCircle, Mic, MicOff, 
  Brain, PiggyBank, ArrowRight, MessageSquare, AlertCircle, Sparkle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, Expense, Budget, SavingsGoal, BillReminder, Category } from '../types';

interface ChatProps {
  userName: string;
  token: string;
  expenses?: Expense[];
  budgets?: Budget[];
  goals?: SavingsGoal[];
  reminders?: BillReminder[];
  categories?: Category[];
}

export default function Chat({ userName, token, expenses = [], budgets = [], goals = [], reminders = [], categories = [] }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello ${userName}! I am FinPilot, your autonomous agentic personal finance advisor. I can analyze your financial trends, track budgets, optimize savings, and guide your strategy.\n\nAsk me questions like:\n- **"Analyze my expenses"**\n- **"Where am I overspending?"**\n- **"Am I on track for my savings targets?"**`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Speech Recognition States
  const [isListening, setIsListening] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setRecognitionError(null);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(prev => prev + (prev ? ' ' : '') + transcript);
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event);
        const errType = event.error;
        
        if (errType === 'no-speech') {
          // Silent or friendly notice, not a loud error banner
          console.log('Speech recognition: no speech detected.');
          setIsListening(false);
          return;
        }
        
        if (errType === 'aborted') {
          // Expected when stopping manually
          setIsListening(false);
          return;
        }

        if (errType === 'not-allowed') {
          setRecognitionError('Microphone permission blocked. Please allow mic access in your browser or try opening the app in a New Tab.');
        } else if (errType === 'network') {
          setRecognitionError('Network error occurred during voice recognition.');
        } else {
          setRecognitionError(`Voice input issue: ${errType || 'unknown error'}. Please try again.`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setRecognitionError('Speech recognition is not supported in this browser. Please use Chrome/Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setRecognitionError(null);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Generate dynamic contextual suggestions based purely on the user's actual inputted data
  const dynamicSuggestions = useMemo(() => {
    const list: string[] = [];

    // 1. Context from expenses
    if (expenses && expenses.length > 0) {
      const sorted = [...expenses].sort((a, b) => b.amount - a.amount);
      const highest = sorted[0];
      const latest = expenses[expenses.length - 1];

      list.push(`How much did I spend on ${latest.category} lately?`);
      list.push(`Analyze my transaction of ₹${highest.amount} for ${highest.description || highest.category}`);
    }

    // 2. Context from budgets
    if (budgets && budgets.length > 0) {
      const latestBudget = budgets[budgets.length - 1];
      list.push(`Am I overspending on my ${latestBudget.category} budget?`);
    }

    // 3. Context from savings goals
    if (goals && goals.length > 0) {
      const latestGoal = goals[goals.length - 1];
      list.push(`Calculate progress for my ${latestGoal.name} goal`);
    }

    // 4. Context from reminders
    if (reminders && reminders.length > 0) {
      const latestReminder = reminders[reminders.length - 1];
      list.push(`Do I have upcoming bills for ${latestReminder.title}?`);
    }

    // Custom fallbacks to ensure we always have 3 suggestions
    if (list.length < 3) {
      list.push("What is my total monthly expense summary?");
    }
    if (list.length < 3) {
      list.push("Suggest a personalized budget strategy.");
    }
    if (list.length < 3) {
      list.push("How can I boost my Savings Vault balances?");
    }

    // Deduplicate and get exactly 3 items
    return Array.from(new Set(list)).slice(0, 3);
  }, [expenses, budgets, goals, reminders]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Stop listening if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Map previous messages for the chat history
      const history = messages.slice(1).map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: textToSend,
          history
        })
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setMessages(prev => [...prev, {
          id: `ast_${Date.now()}`,
          sender: 'assistant',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        throw new Error(data.error || 'Failed to generate chat response.');
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: `Error: ${err.message || 'I am having trouble connecting to my cognitive models right now.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  // High-fidelity rich text formatting with markdown support for bolding and bullets
  const renderMessageText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const isBullet = line.trim().startsWith('-') || line.trim().startsWith('*');
      let content = line;
      if (isBullet) {
        content = line.trim().substring(1).trim();
      }

      // Regex parser for bold tokens (**text**)
      const parts = [];
      const boldRegex = /\*\*([^*]+)\*\*/g;
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(content.substring(lastIndex, match.index));
        }
        parts.push(
          <strong 
            key={match.index} 
            className="font-extrabold text-slate-900 bg-purple-50/70 border border-purple-100/30 px-1 py-0.5 rounded text-[11px]"
          >
            {match[1]}
          </strong>
        );
        lastIndex = boldRegex.lastIndex;
      }

      if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
      }

      const renderContent = parts.length > 0 ? parts : content;

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1.5 pl-1">
            <span className="text-purple-500 font-extrabold mt-1 text-[11px]">•</span>
            <span className="flex-1 text-slate-700 leading-relaxed">{renderContent}</span>
          </div>
        );
      }

      return (
        <p key={idx} className={line.trim() === '' ? 'h-2' : 'my-1 text-slate-700 leading-relaxed'}>
          {renderContent}
        </p>
      );
    });
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-purple-100/30 dark:border-purple-900/20 rounded-3xl shadow-xl overflow-hidden h-[630px] flex flex-col justify-between transition-all duration-300">
      
      {/* Premium Glassmorphism Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-slate-50/80 via-white to-purple-50/10 dark:from-slate-900/80 dark:to-purple-950/10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-tr from-purple-600 via-purple-500 to-violet-600 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-md shadow-purple-600/10">
            <Brain className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
              FinPilot AI Co-Pilot
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">Gemini Autonomous Model</p>
          </div>
        </div>

        {/* Quick status counters */}
        <div className="hidden sm:flex items-center gap-3 text-[10px] text-slate-400 font-bold">
          <div className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-lg flex items-center gap-1">
            <Sparkle className="h-3 w-3 text-purple-500" />
            <span>{expenses.length} Inputs Loaded</span>
          </div>
        </div>
      </div>

      {/* Message Ledger Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gradient-to-b from-slate-50/30 to-white">
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <motion.div 
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25 }}
                key={m.id} 
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Styled Avatar */}
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 shadow-xs border ${
                    isUser 
                      ? 'bg-gradient-to-tr from-purple-600 to-purple-700 text-white border-purple-500' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-350 border-slate-100 dark:border-slate-850'
                  }`}>
                    {isUser ? <User className="h-4.5 w-4.5" /> : 'FP'}
                  </div>

                  {/* Bubble Container */}
                  <div className="space-y-1">
                    <div className={`p-4 rounded-2xl text-xs shadow-xs relative ${
                      isUser 
                        ? 'bg-purple-600 text-white font-medium rounded-tr-none border border-purple-600' 
                        : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 text-slate-800 dark:text-slate-200 rounded-tl-none'
                    }`}>
                      {isUser ? (
                        <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                      ) : (
                        <div className="space-y-1">
                          {renderMessageText(m.text)}
                        </div>
                      )}
                    </div>
                    {/* Timestamp & User label */}
                    <div className={`text-[9px] font-bold tracking-tight text-slate-400 flex items-center gap-1 px-1 ${
                      isUser ? 'justify-end' : 'justify-start'
                    }`}>
                      <span>{isUser ? 'You' : 'FinPilot Advisor'}</span>
                      <span>•</span>
                      <span>{m.timestamp}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex gap-3 items-center">
              <div className="h-8 w-8 rounded-xl bg-white text-slate-700 border border-slate-100 flex items-center justify-center font-black text-xs shadow-xs">
                FP
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 px-4 py-3 rounded-2xl rounded-tl-none text-xs text-slate-400 flex items-center gap-2.5 shadow-xs">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="font-bold text-[10px] text-purple-600 tracking-wider uppercase">Co-pilot analyzing ledger...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested InputPrompts & Speech Recognition error panel */}
      <div className="p-4 border-t border-slate-100 space-y-4 bg-slate-50/50">
        
        {/* Error notification */}
        {recognitionError && (
          <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-2 text-[10px] font-bold">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="flex-1">{recognitionError}</span>
            <button onClick={() => setRecognitionError(null)} className="text-rose-400 hover:text-rose-600 text-xs px-1 cursor-pointer">×</button>
          </div>
        )}

        {/* Dynamic Contextual Prompts Panel */}
        {messages.length === 1 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-1">
              <Sparkles className="h-3.5 w-3.5 text-purple-500 animate-pulse" />
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Suggested prompts based on your entries</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {dynamicSuggestions.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="p-3 bg-white dark:bg-slate-900 hover:bg-purple-50/40 hover:border-purple-200 border border-slate-100 dark:border-slate-850 text-slate-600 dark:text-slate-350 text-left font-semibold rounded-2xl text-[11px] shadow-xs hover:shadow-md transition duration-200 cursor-pointer flex items-center justify-between group"
                >
                  <span className="line-clamp-2 pr-1">{prompt}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-purple-500 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Controls Bar */}
        <div className="flex items-center gap-2">
          {/* Form & Input Field */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} 
            className="flex-1 flex gap-2"
          >
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={isListening ? "Listening... Speak into your microphone." : "Type your command or query here..."}
                className={`w-full px-4.5 py-3 bg-white dark:bg-slate-900 border rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-500/40 transition-all duration-200 pr-12 ${
                  isListening ? 'border-rose-400 ring-2 ring-rose-500/10 placeholder-rose-400' : 'border-slate-200 dark:border-slate-850'
                }`}
              />
              
              {/* Voice Listening indicator */}
              {isListening && (
                <div className="absolute right-3 flex items-center gap-1">
                  <span className="w-1.5 h-3.5 bg-rose-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-4.5 bg-rose-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-2.5 bg-rose-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>

            {/* Voice Mic Facility Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-2xl border transition-all duration-300 flex-shrink-0 cursor-pointer flex items-center justify-center ${
                isListening 
                  ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20 animate-bounce' 
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 hover:text-slate-700 border-slate-200 dark:border-slate-850'
              }`}
              title={isListening ? "Stop listening" : "Start Voice Input"}
            >
              {isListening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-2xl shadow-md hover:shadow-lg disabled:shadow-none transition-all duration-200 flex-shrink-0 cursor-pointer"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
