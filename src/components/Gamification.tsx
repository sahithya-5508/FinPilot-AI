/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Trophy, Award, Flame, Zap, Shield, Sparkles, Target, PiggyBank, 
  CalendarDays, ChevronRight, CheckCircle2, Lock, Unlock, Compass, 
  Wallet, Crown, Star, Gift, Check, ArrowRight, Lightbulb, Volume2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Expense, Budget, SavingsGoal, BillReminder } from '../types';

interface GamificationProps {
  userName: string;
  user?: any;
  expenses: Expense[];
  budgets: Budget[];
  goals: SavingsGoal[];
  reminders?: BillReminder[];
}

// Beautiful Web Audio Synthesizer for Victory Chimes
const playVictoryChime = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Play a delightful synthesized C major arpeggio: C4 -> E4 -> G4 -> C5
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05 + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2 + index * 0.08);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + index * 0.08);
      osc.stop(ctx.currentTime + 1.5 + index * 0.08);
    });
  } catch (e) {
    console.error('Audio chime context blocked or failed:', e);
  }
};

export default function Gamification({ userName, user, expenses, budgets, goals, reminders = [] }: GamificationProps) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'missions' | 'badges'>('overview');
  
  // Scoped User ID Key Suffix to prevent session leakage
  const userId = user?.user?.email || user?.email || "anonymous";

  // 1. Claim logs & Reward Tracker
  const [claimLogs, setClaimLogs] = useState<string[]>(() => {
    const saved = localStorage.getItem(`finpilot_claimed_rewards_${userId}`);
    return saved ? JSON.parse(saved) : [];
  });

  // 2. Day-Wise Calendar Streak Calculation
  const [dailyCheckInClaimed, setDailyCheckInClaimed] = useState<string>(() => {
    return localStorage.getItem(`finpilot_last_checkin_${userId}`) || '';
  });

  const [streakCount, setStreakCount] = useState<number>(() => {
    const saved = localStorage.getItem(`finpilot_checkin_streak_${userId}`);
    const lastCheckin = localStorage.getItem(`finpilot_last_checkin_${userId}`);
    
    if (!lastCheckin) return 0; // Strictly zero for brand new users

    const todayStr = new Date().toLocaleDateString('en-CA');
    const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');

    // Check if the streak is still valid (either checked in today or yesterday)
    if (lastCheckin === todayStr || lastCheckin === yesterdayStr) {
      return saved ? parseInt(saved) : 0;
    }
    
    return 0; // Streak has broken, reset to zero
  });

  // Verify streak status on component mount
  useEffect(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
    const lastCheckin = localStorage.getItem(`finpilot_last_checkin_${userId}`) || '';
    const saved = localStorage.getItem(`finpilot_checkin_streak_${userId}`);

    if (!lastCheckin) {
      setStreakCount(0);
    } else if (lastCheckin !== todayStr && lastCheckin !== yesterdayStr) {
      setStreakCount(0);
      localStorage.setItem(`finpilot_checkin_streak_${userId}`, '0');
    } else if (saved) {
      setStreakCount(parseInt(saved));
    }
  }, [dailyCheckInClaimed, userId]);

  const isCheckedInToday = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    return dailyCheckInClaimed === todayStr;
  }, [dailyCheckInClaimed]);

  // Claim check-in handler
  const handleCheckIn = () => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
    
    if (dailyCheckInClaimed === todayStr) return;

    let nextStreak = 1;
    if (dailyCheckInClaimed === yesterdayStr) {
      nextStreak = streakCount + 1;
    }

    setStreakCount(nextStreak);
    setDailyCheckInClaimed(todayStr);
    localStorage.setItem(`finpilot_checkin_streak_${userId}`, nextStreak.toString());
    localStorage.setItem(`finpilot_last_checkin_${userId}`, todayStr);
    
    // Also claim reward log
    claimReward(`check_in_${todayStr}`);
    playVictoryChime();
  };

  const claimReward = (rewardId: string) => {
    if (claimLogs.includes(rewardId)) return;
    const nextClaims = [...claimLogs, rewardId];
    setClaimLogs(nextClaims);
    localStorage.setItem(`finpilot_claimed_rewards_${userId}`, JSON.stringify(nextClaims));
  };

  // 3. Dynamic XP Calculations (Starting strictly from ZERO)
  const baseXP = useMemo(() => {
    const expXP = expenses.length * 50;
    const budXP = budgets.length * 100;
    const goalXP = goals.length * 150;
    const remXP = reminders.length * 100;

    const savedAmount = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
    const savingWeightXP = Math.floor(savedAmount / 10); // 10 XP per ₹100 saved

    return expXP + budXP + goalXP + remXP + savingWeightXP;
  }, [expenses, budgets, goals, reminders]);

  const totalXP = useMemo(() => {
    let bonusXP = 0;
    claimLogs.forEach(id => {
      if (id.startsWith('mission_')) bonusXP += 200;
      if (id.startsWith('challenge_')) bonusXP += 300;
      if (id.startsWith('check_in_')) bonusXP += 50;
    });
    return baseXP + bonusXP;
  }, [baseXP, claimLogs]);

  // 4. Level calculation (every 1000 XP = 1 Level)
  const currentLevel = useMemo(() => {
    return Math.floor(totalXP / 1000) + 1;
  }, [totalXP]);

  const xpProgressToNextLevel = useMemo(() => {
    const currentLevelBase = (currentLevel - 1) * 1000;
    const relativeXP = totalXP - currentLevelBase;
    return Math.min(100, Math.floor((relativeXP / 1000) * 100));
  }, [totalXP, currentLevel]);

  // Level Up Celebrations popup tracker
  const [acknowledgedLevel, setAcknowledgedLevel] = useState<number>(() => {
    const saved = localStorage.getItem(`finpilot_acknowledged_level_${userId}`);
    return saved ? parseInt(saved) : 1;
  });
  const [showLevelUpModal, setShowLevelUpModal] = useState<boolean>(false);

  useEffect(() => {
    if (currentLevel > acknowledgedLevel) {
      setShowLevelUpModal(true);
      playVictoryChime();
    }
  }, [currentLevel, acknowledgedLevel]);

  const closeLevelUpModal = () => {
    setAcknowledgedLevel(currentLevel);
    localStorage.setItem(`finpilot_acknowledged_level_${userId}`, currentLevel.toString());
    setShowLevelUpModal(false);
  };

  const levelTitle = useMemo(() => {
    if (currentLevel === 1) return 'Budget Apprentice';
    if (currentLevel === 2) return 'Savings Pathfinder';
    if (currentLevel === 3) return 'Frugal Architect';
    if (currentLevel === 4) return 'Wealth Sovereign';
    if (currentLevel === 5) return 'Compound Tycoon';
    return 'Financial Zenith Sage';
  }, [currentLevel]);

  // Budget defense status
  const safeBudgetsCount = useMemo(() => {
    if (budgets.length === 0) return 0;
    return budgets.filter(b => {
      const spent = expenses.filter(e => e.category === b.category).reduce((sum, e) => sum + e.amount, 0);
      return spent <= b.amount;
    }).length;
  }, [budgets, expenses]);

  // Savings progress total
  const savingsTotal = useMemo(() => {
    return goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  }, [goals]);

  // 5. Tiered Missions System (Set 1 and Set 2)
  const set1Missions = useMemo(() => {
    return [
      {
        id: 'mission_ledger_1',
        title: 'Grand Historian',
        desc: 'Log at least 15 manual transactions in the Expenses panel to establish a robust dataset.',
        metric: 'Manual transactions logged',
        current: expenses.length,
        target: 15,
        rewardXP: 200,
        unlocked: expenses.length >= 15
      },
      {
        id: 'mission_budget_1',
        title: 'Strategic Allocator',
        desc: 'Establish at least 5 distinct monthly category budget ceilings.',
        metric: 'Budgets established',
        current: budgets.length,
        target: 5,
        rewardXP: 200,
        unlocked: budgets.length >= 5
      },
      {
        id: 'mission_savings_1',
        title: 'Ironclad Reserve',
        desc: 'Create 4 distinct savings goals with customized targets.',
        metric: 'Savings goals created',
        current: goals.length,
        target: 4,
        rewardXP: 200,
        unlocked: goals.length >= 4
      },
      {
        id: 'mission_reminder_1',
        title: 'Financial Sentry',
        desc: 'Configure at least 5 recurring bill reminders to secure your schedule.',
        metric: 'Reminders added',
        current: reminders.length,
        target: 5,
        rewardXP: 200,
        unlocked: reminders.length >= 5
      },
      {
        id: 'mission_checkin_1',
        title: 'Devoted Ritual',
        desc: 'Establish a consecutive calendar day check-in streak of 5 days.',
        metric: 'Streak count',
        current: streakCount,
        target: 5,
        rewardXP: 200,
        unlocked: streakCount >= 5
      }
    ];
  }, [expenses, budgets, goals, reminders, streakCount]);

  const isSet1FullyCompleted = useMemo(() => {
    return set1Missions.every(m => m.unlocked);
  }, [set1Missions]);

  const set2Missions = useMemo(() => {
    return [
      {
        id: 'mission_ledger_2',
        title: 'Financial Archivist',
        desc: 'Log 40 manual transactions inside your ledger to map long-term spending patterns.',
        metric: 'Manual entries',
        current: expenses.length,
        target: 40,
        rewardXP: 200,
        unlocked: expenses.length >= 40
      },
      {
        id: 'mission_budget_2',
        title: 'Fiscal Commander',
        desc: 'Maintain 8 distinct category budget ceilings to master allocation.',
        metric: 'Distinct budgets',
        current: budgets.length,
        target: 8,
        rewardXP: 200,
        unlocked: budgets.length >= 8
      },
      {
        id: 'mission_savings_2',
        title: 'Treasury Overlord',
        desc: 'Accumulate a total of ₹25,000 or more in your savings goals.',
        metric: 'Saved amount (INR)',
        current: savingsTotal,
        target: 25000,
        rewardXP: 200,
        unlocked: savingsTotal >= 25000
      },
      {
        id: 'mission_reminder_2',
        title: 'Chrono Warden',
        desc: 'Schedule 8 active recurring bill reminders concurrently.',
        metric: 'Active schedules',
        current: reminders.length,
        target: 8,
        rewardXP: 200,
        unlocked: reminders.length >= 8
      },
      {
        id: 'mission_streak_2',
        title: 'Unyielding Sentinel',
        desc: 'Maintain an active day check-in streak of 15 days.',
        metric: 'Day logging streak',
        current: streakCount,
        target: 15,
        rewardXP: 200,
        unlocked: streakCount >= 15
      }
    ];
  }, [expenses, budgets, savingsTotal, reminders, streakCount]);

  const activeMissions = useMemo(() => {
    return isSet1FullyCompleted ? set2Missions : set1Missions;
  }, [isSet1FullyCompleted, set1Missions, set2Missions]);

  // 6. Tiered Badges Shelf (10 Tier 1 Badges + 10 Tier 2 Badges added only after Tier 1 is completed)
  const tier1Badges = useMemo(() => {
    return [
      {
        id: 'badge_1',
        name: 'Wealth Scribe',
        desc: 'Log 10 manual transactions inside your ledger to establish historical integrity.',
        howTo: 'Record 10 or more expenditures.',
        icon: Wallet,
        color: 'from-amber-400 to-amber-600',
        bg: 'bg-amber-50 dark:bg-amber-950/25 border-amber-200/50 dark:border-amber-900/30',
        unlocked: expenses.length >= 10
      },
      {
        id: 'badge_2',
        name: 'Fortress Warden',
        desc: 'Construct 4 distinct customized category budget boundaries.',
        howTo: 'Establish 4 or more budget categories.',
        icon: Target,
        color: 'from-purple-400 to-purple-600',
        bg: 'bg-purple-50 dark:bg-purple-950/25 border-purple-200/50 dark:border-purple-900/30',
        unlocked: budgets.length >= 4
      },
      {
        id: 'badge_3',
        name: 'Iron Banker',
        desc: 'Configure 3 active savings goals with customized targets.',
        howTo: 'Establish 3 target goals in the Savings Vault.',
        icon: PiggyBank,
        color: 'from-emerald-400 to-emerald-600',
        bg: 'bg-emerald-50 dark:bg-emerald-950/25 border-emerald-200/50 dark:border-emerald-900/30',
        unlocked: goals.length >= 3
      },
      {
        id: 'badge_4',
        name: 'Habit Titan',
        desc: 'Cultivate strong tracking habits with an active 7-day calendar check-in streak.',
        howTo: 'Reach a 7-day calendar check-in streak.',
        icon: CalendarDays,
        color: 'from-rose-400 to-rose-600',
        bg: 'bg-rose-50 dark:bg-rose-950/25 border-rose-200/50 dark:border-rose-900/30',
        unlocked: streakCount >= 7
      },
      {
        id: 'badge_5',
        name: 'Fire Marshal',
        desc: 'Log in and claim at least 10 cumulative daily check-ins over your lifetime.',
        howTo: 'Perform 10 check-ins over your lifetime.',
        icon: Flame,
        color: 'from-orange-400 to-orange-600',
        bg: 'bg-orange-50 dark:bg-orange-950/25 border-orange-200/50 dark:border-orange-900/30',
        unlocked: claimLogs.filter(id => id.startsWith('check_in_')).length >= 10
      },
      {
        id: 'badge_6',
        name: 'Sentry Supreme',
        desc: 'Schedule and manage at least 4 active bill reminders concurrently.',
        howTo: 'Maintain 4 or more reminders on your timeline.',
        icon: Shield,
        color: 'from-blue-400 to-blue-600',
        bg: 'bg-blue-50 dark:bg-blue-950/25 border-blue-200/50 dark:border-blue-900/30',
        unlocked: reminders.length >= 4
      },
      {
        id: 'badge_7',
        name: 'Absolute Miser',
        desc: 'Record at least 15 manual entries while keeping total expenditures strictly below ₹15,000.',
        howTo: 'Record 15+ entries and stay under ₹15,000 total spend.',
        icon: Award,
        color: 'from-sky-400 to-indigo-600',
        bg: 'bg-sky-50 dark:bg-indigo-950/25 border-sky-200/50 dark:border-sky-900/30',
        unlocked: expenses.length >= 15 && expenses.reduce((sum, e) => sum + e.amount, 0) < 15000
      },
      {
        id: 'badge_8',
        name: 'AI Symbiosis Master',
        desc: 'Establish 10+ manual logged expenses to enable rich analytical depth with the Advisor.',
        howTo: 'Keep 10+ expenses logged in your database.',
        icon: Compass,
        color: 'from-pink-400 to-pink-600',
        bg: 'bg-pink-50 dark:bg-pink-950/25 border-pink-200/50 dark:border-pink-900/30',
        unlocked: expenses.length >= 10
      },
      {
        id: 'badge_9',
        name: 'XP Colossus',
        desc: 'Amass a massive total of 2,500 experience points inside your account.',
        howTo: 'Achieve 2,500 XP via logging, check-ins, and missions.',
        icon: Star,
        color: 'from-yellow-400 to-yellow-600',
        bg: 'bg-yellow-50 dark:bg-yellow-950/25 border-yellow-200/50 dark:border-yellow-900/30',
        unlocked: totalXP >= 2500
      },
      {
        id: 'badge_10',
        name: 'Master of Ascent',
        desc: 'Climb deep into financial maturity by reaching Mastery Level 4.',
        howTo: 'Unlock Level 4 by earning over 3,000 cumulative XP.',
        icon: Crown,
        color: 'from-cyan-400 to-cyan-600',
        bg: 'bg-cyan-50 dark:bg-cyan-950/25 border-cyan-200/50 dark:border-cyan-900/30',
        unlocked: currentLevel >= 4
      }
    ];
  }, [expenses, budgets, goals, reminders, claimLogs, streakCount, totalXP, currentLevel]);

  const areAllTier1BadgesUnlocked = useMemo(() => {
    return tier1Badges.every(b => b.unlocked);
  }, [tier1Badges]);

  const tier2Badges = useMemo(() => {
    return [
      {
        id: 'badge_11',
        name: 'Imperial Chronicler',
        desc: 'Unlocked by comprehensive financial logging of 50 manual expense transactions.',
        howTo: 'Record 50 or more expenses inside your ledger.',
        icon: Wallet,
        color: 'from-amber-500 to-yellow-700',
        bg: 'bg-amber-100/50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/50',
        unlocked: expenses.length >= 50
      },
      {
        id: 'badge_12',
        name: 'Grand Fiscal Archon',
        desc: 'Design and manage 8 distinct category budget boundaries.',
        howTo: 'Maintain 8 or more custom budget categories.',
        icon: Target,
        color: 'from-purple-500 to-indigo-700',
        bg: 'bg-purple-100/50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800/50',
        unlocked: budgets.length >= 8
      },
      {
        id: 'badge_13',
        name: 'Emperor of Vaults',
        desc: 'Store a monumental ₹50,000 cumulative savings inside active vault goals.',
        howTo: 'Deposit a cumulative total of ₹50,000 or more in Savings.',
        icon: PiggyBank,
        color: 'from-emerald-500 to-teal-700',
        bg: 'bg-emerald-100/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/50',
        unlocked: savingsTotal >= 50000
      },
      {
        id: 'badge_14',
        name: 'Chrono Sovereign',
        desc: 'Show eternal consistency by logging in and claiming daily check-ins 30 times.',
        howTo: 'Claim 30 cumulative daily check-ins.',
        icon: CalendarDays,
        color: 'from-rose-500 to-rose-700',
        bg: 'bg-rose-100/50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/50',
        unlocked: claimLogs.filter(id => id.startsWith('check_in_')).length >= 30
      },
      {
        id: 'badge_15',
        name: 'Undying Flame Lord',
        desc: 'Unlock a legendary consecutive daily check-in streak of 15 days.',
        howTo: 'Achieve a check-in streak of 15 days or higher.',
        icon: Flame,
        color: 'from-orange-500 to-red-600',
        bg: 'bg-orange-100/50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800/50',
        unlocked: streakCount >= 15
      },
      {
        id: 'badge_16',
        name: 'Sentry Overlord',
        desc: 'Coordinate and manage 8 active bill reminder schedules concurrently.',
        howTo: 'Schedule 8 or more recurring bill reminders.',
        icon: Shield,
        color: 'from-blue-500 to-sky-700',
        bg: 'bg-blue-100/50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800/50',
        unlocked: reminders.length >= 8
      },
      {
        id: 'badge_17',
        name: 'Frugal Demigod',
        desc: 'Maintain at least 5 active category budgets with strictly defensive utilization ratios under 50%.',
        howTo: 'Maintain 5+ budgets, each under 50% utilized.',
        icon: Award,
        color: 'from-sky-500 to-indigo-800',
        bg: 'bg-sky-100/50 dark:bg-indigo-950/30 border-sky-300 dark:border-indigo-800/50',
        unlocked: budgets.length >= 5 && budgets.every(b => {
          const spent = expenses.filter(e => e.category === b.category).reduce((sum, e) => sum + e.amount, 0);
          return spent < b.amount * 0.5;
        })
      },
      {
        id: 'badge_18',
        name: 'Sovereign Architect',
        desc: 'Coordinate a massive financial system of 5 active budgets alongside 5 active savings goals.',
        howTo: 'Possess 5+ active budgets and 5+ active savings goals.',
        icon: Compass,
        color: 'from-pink-500 to-pink-700',
        bg: 'bg-pink-100/50 dark:bg-pink-950/30 border-pink-300 dark:border-pink-800/50',
        unlocked: goals.length >= 5 && budgets.length >= 5
      },
      {
        id: 'badge_19',
        name: 'Legend of Eldoria',
        desc: 'Unlock over 8,000 cumulative experience points in your account.',
        howTo: 'Reach 8,000 or more cumulative XP points.',
        icon: Star,
        color: 'from-yellow-500 to-yellow-700',
        bg: 'bg-yellow-100/50 dark:bg-yellow-950/30 border-yellow-300 dark:border-yellow-800/50',
        unlocked: totalXP >= 8000
      },
      {
        id: 'badge_20',
        name: 'Ascended Avatar of Wealth',
        desc: 'Unlock deep financial maturity Mastery Level 9 to reach the peak ranking of our system.',
        howTo: 'Unlock Mastery Level 9 (8,000+ XP).',
        icon: Crown,
        color: 'from-cyan-500 to-cyan-700',
        bg: 'bg-cyan-100/50 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-800/50',
        unlocked: currentLevel >= 9
      }
    ];
  }, [expenses, budgets, savingsTotal, streakCount, reminders, claimLogs, totalXP, currentLevel]);

  // Combined badges depending on progression (Tier 2 is appended but Tier 1 never vanishes!)
  const displayBadges = useMemo(() => {
    if (areAllTier1BadgesUnlocked) {
      return [...tier1Badges, ...tier2Badges];
    }
    return tier1Badges;
  }, [areAllTier1BadgesUnlocked, tier1Badges, tier2Badges]);

  // Acknowledged Unlocked Badges shelf
  const [acknowledgedBadges, setAcknowledgedBadges] = useState<string[]>(() => {
    const saved = localStorage.getItem(`finpilot_acknowledged_badges_${userId}`);
    return saved ? JSON.parse(saved) : [];
  });

  // State to hold the badge currently being celebrated in the "completed tab/modal overlay"
  const [celebratedBadge, setCelebratedBadge] = useState<any | null>(null);

  // Effect to listen for badge completion and trigger the celebrated tab immediately
  useEffect(() => {
    // Check if there's any badge that is unlocked but has not yet been acknowledged/celebrated
    const newlyUnlocked = displayBadges.find(b => b.unlocked && !acknowledgedBadges.includes(b.id));
    if (newlyUnlocked) {
      setCelebratedBadge(newlyUnlocked);
      playVictoryChime();
      
      const nextAck = [...acknowledgedBadges, newlyUnlocked.id];
      setAcknowledgedBadges(nextAck);
      localStorage.setItem(`finpilot_acknowledged_badges_${userId}`, JSON.stringify(nextAck));
    }
  }, [displayBadges, acknowledgedBadges, userId]);

  // Detail panel dialog tracker (when user clicks an unlocked badge manually)
  const [selectedBadge, setSelectedBadge] = useState<any>(null);

  // Quick challenge items
  const weekendSpent = useMemo(() => {
    return expenses.filter(e => {
      const day = new Date(e.date).getDay();
      return day === 0 || day === 6; // Sun or Sat
    }).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const challengesList = useMemo(() => {
    return [
      {
        id: 'challenge_zen_weekend',
        title: 'Zen Weekend Challenge',
        desc: 'Keep total weekend expenditures under ₹1,500. Perfect for building caution.',
        metric: 'Weekend spent',
        current: Math.round(weekendSpent),
        target: 1500,
        isUnder: true,
        unlocked: expenses.length > 0 && weekendSpent < 1500,
        rewardXP: 300
      },
      {
        id: 'challenge_vault_run',
        title: 'Vault Stacker Scribe',
        desc: 'Accumulate over ₹5,000 inside active savings goals.',
        metric: 'Total saved in Vault',
        current: Math.round(savingsTotal),
        target: 5000,
        isUnder: false,
        unlocked: savingsTotal >= 5000,
        rewardXP: 300
      }
    ];
  }, [weekendSpent, savingsTotal, expenses]);

  return (
    <div className="space-y-6 font-sans">
      {/* Confetti and glow animations injection */}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
        }
        .confetti-dot {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: confetti-fall 4.5s linear infinite;
        }
        .glow-pulse {
          animation: glow-pulse-anim 2s infinite alternate;
        }
        @keyframes glow-pulse-anim {
          0% { box-shadow: 0 0 5px rgba(168, 85, 247, 0.4); }
          100% { box-shadow: 0 0 25px rgba(168, 85, 247, 0.9); }
        }
      `}</style>

      {/* A. Header Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-purple-950 to-slate-950 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl border border-purple-500/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/25 border border-purple-400/20 text-purple-200">
              <Crown className="h-3 w-3 text-yellow-400 animate-bounce" />
              Missions and Achievements Shelf
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-none">
              Missions and Achievements
            </h1>
            <p className="text-xs text-indigo-200 max-w-xl leading-relaxed">
              Hey {userName}, turn your savings and budgeting habits into rewarding milestones! Unlock badges, complete tactical missions, and stack multipliers.
            </p>
          </div>

          {/* User Level Circle Card */}
          <div className="bg-white/10 dark:bg-slate-900/40 backdrop-blur-md border border-white/10 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 flex-shrink-0">
            <div className="relative flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="28" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="4" fill="transparent" />
                <circle cx="32" cy="32" r="28" stroke="#8200db" strokeWidth="4" fill="transparent" 
                        strokeDasharray={175} strokeDashoffset={175 - (175 * xpProgressToNextLevel) / 100} />
              </svg>
              <div className="absolute font-black text-xl text-white">
                {currentLevel}
              </div>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Mastery Level</span>
              <span className="block text-sm font-extrabold text-white truncate max-w-[150px]">{levelTitle}</span>
              <span className="block text-[11px] text-indigo-200 font-mono">{totalXP} / {currentLevel * 1000} XP ({xpProgressToNextLevel}% To Level {currentLevel + 1})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gamification Sub Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200/60 dark:border-slate-800/80 pb-3 gap-3">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'overview' 
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="h-4 w-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveSubTab('missions')}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'missions' 
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Target className="h-4 w-4" />
            Missions ({isSet1FullyCompleted ? 'Tier 2' : 'Tier 1'})
          </button>
          <button
            onClick={() => setActiveSubTab('badges')}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'badges' 
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Award className="h-4 w-4" />
            Badges Shelf ({displayBadges.filter(b => b.unlocked).length}/{displayBadges.length})
          </button>
        </div>

        <button 
          onClick={handleCheckIn}
          disabled={isCheckedInToday}
          className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
            isCheckedInToday
              ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500 hover:shadow-md hover:shadow-purple-500/10'
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          {isCheckedInToday ? 'Checked-In Today' : 'Claim Daily Check-In (+50 XP)'}
        </button>
      </div>

      {/* Sub Views Content */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Streaks mini-row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Daily Streak Card */}
            <div className="bg-gradient-to-br from-rose-500/10 to-orange-500/10 dark:from-rose-500/5 dark:to-orange-500/5 border border-rose-200/50 dark:border-rose-900/30 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-2 right-2 opacity-10">
                <Flame className="h-28 w-28 text-rose-500" />
              </div>
              <div className="space-y-2">
                <div className="h-9 w-9 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Flame className="h-5 w-5 fill-rose-500/30" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Daily Logging Streak</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Consistently log entries day-by-day. Skipped days reset streak parameters to zero.
                </p>
              </div>
              <div className="mt-5 flex items-baseline justify-between pt-4 border-t border-rose-100/60 dark:border-rose-900/20">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-rose-500/80 tracking-wider">Current Streak</span>
                  <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{streakCount} Days</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/25 text-rose-600 dark:text-rose-400">
                  {streakCount > 0 ? 'Active Boost' : 'Break Sentry'}
                </span>
              </div>
            </div>

            {/* Budget Defense */}
            <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 dark:from-amber-500/5 dark:to-yellow-500/5 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-2 right-2 opacity-10">
                <Shield className="h-28 w-28 text-amber-500" />
              </div>
              <div className="space-y-2">
                <div className="h-9 w-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Budget Shield Status</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Keep active category spending below monthly boundaries to safeguard multipliers.
                </p>
              </div>
              <div className="mt-5 flex items-baseline justify-between pt-4 border-t border-amber-100/60 dark:border-amber-900/20">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-amber-600/80 tracking-wider">Defended Categories</span>
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{safeBudgetsCount} Safe</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/25 text-amber-600 dark:text-amber-400">
                  No Over-spending
                </span>
              </div>
            </div>

            {/* Savings Goal Status */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5 border border-emerald-200/50 dark:border-emerald-900/30 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-2 right-2 opacity-10">
                <PiggyBank className="h-28 w-28 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <PiggyBank className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Savings Cumulative Vault</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Active savings contributions yield continuous interest. Grow your capital vault.
                </p>
              </div>
              <div className="mt-5 flex items-baseline justify-between pt-4 border-t border-emerald-100/60 dark:border-emerald-900/20">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-emerald-600/80 tracking-wider">Total Stored</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">₹{savingsTotal}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/25 text-emerald-600 dark:text-emerald-400">
                  Growing Gold
                </span>
              </div>
            </div>
          </div>

          {/* Rhythm Guidelines and Wisdom Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rhythm guidelines */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Rhythm Guidelines
              </h3>
              
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Lightbulb className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Daily Calendar Streak</h4>
                    <p className="text-[11px] text-slate-400 leading-normal mt-0.5">
                      Check-in once per day. To prevent breaking, do not let 48 hours lapse between actions.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-slate-100 dark:border-slate-800/40 pt-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Target className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Set Progression</h4>
                    <p className="text-[11px] text-slate-400 leading-normal mt-0.5">
                      Completing Set 1 automatically triggers Set 2 missions with massive XP.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Wisdom block */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Smart Habit
              </h3>
              <div className="purple-grad rounded-2xl p-6 text-white space-y-3 shadow-md relative overflow-hidden min-h-[155px] flex flex-col justify-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl -mr-8 -mt-8 pointer-events-none"></div>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-purple-100 tracking-wider">
                  <Sparkles className="h-3.5 w-3.5 text-yellow-300 fill-yellow-300 animate-pulse" />
                  Smart Habit
                </span>
                <p className="text-xs leading-relaxed font-semibold">
                  "Sustained success is built from compound interest. Tracking manual spending takes under 10 seconds but aligns your brain for compound growth."
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* B. Missions Tab */}
      {activeSubTab === 'missions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Missions Set: {isSet1FullyCompleted ? 'Tier 2 (Advanced Masters)' : 'Tier 1 (Foundation Apprentice)'}
              </h3>
              <p className="text-xs text-slate-400">
                {isSet1FullyCompleted 
                  ? 'Incredible! You completed all Tier 1 goals. Tackle Tier 2 advanced missions now.'
                  : 'Fulfill these 5 core foundational objectives to unlock Tier 2.'}
              </p>
            </div>
            <div className="text-xs font-bold text-purple-600 dark:text-purple-400">
              Completed: {activeMissions.filter(m => m.unlocked).length} / 5
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeMissions.map((m) => {
              const isClaimed = claimLogs.includes(m.id);
              const progressPercentage = Math.min(100, Math.round((m.current / m.target) * 100));

              return (
                <div key={m.id} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        {m.unlocked ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0"></span>
                        )}
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">{m.title}</h4>
                      </div>

                      {m.unlocked ? (
                        isClaimed ? (
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-200/40 dark:border-slate-700/40">
                            Claimed
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              claimReward(m.id);
                              playVictoryChime();
                            }}
                            className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-600 hover:bg-purple-700 text-white cursor-pointer shadow-sm animate-pulse transition"
                          >
                            Claim +200 XP
                          </button>
                        )
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-400">
                          In Progress
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{m.desc}</p>
                  </div>

                  <div className="space-y-1.5 pt-3 border-t border-slate-50 dark:border-slate-800/50">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                      <span>{m.metric}: {m.current} / {m.target}</span>
                      <span>{progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full bg-purple-500 transition-all duration-300`}
                        style={{ 
                          width: `${progressPercentage}%`,
                          opacity: progressPercentage > 0 ? 1 : 0
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* C. Badges Shelf */}
      {activeSubTab === 'badges' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Achievements Badges Display Shelf
              </h3>
              <p className="text-xs text-slate-400">
                Unlock all 10 Tier 1 badges to reveal the advanced Tier 2 Gold Badges. Unlocked badges will stay preserved.
              </p>
            </div>
            <div className="text-xs font-bold text-purple-600 dark:text-purple-400">
              Unlocks: {displayBadges.filter(b => b.unlocked).length} / {displayBadges.length}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 pt-2">
            {displayBadges.map((badge) => {
              const BadgeIcon = badge.icon;
              return (
                <motion.div
                  key={badge.id}
                  whileHover={{ y: -5 }}
                  onClick={() => setSelectedBadge(badge)}
                  className={`relative flex flex-col items-center text-center p-4 rounded-2xl border transition-all cursor-pointer ${
                    badge.unlocked 
                      ? `${badge.bg} shadow-md border-purple-200/50 dark:border-purple-800/50` 
                      : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/40 dark:border-slate-850 opacity-45 hover:opacity-75'
                  }`}
                >
                  {/* Unlock indicator overlay */}
                  <div className="absolute top-2 right-2">
                    {badge.unlocked ? (
                      <Unlock className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Lock className="h-3 w-3 text-slate-400" />
                    )}
                  </div>

                  {/* Badge Medallion Globe */}
                  <div className={`h-14 w-14 rounded-full flex items-center justify-center relative ${
                    badge.unlocked 
                      ? `bg-gradient-to-tr ${badge.color} text-white shadow-lg` 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  } mb-3`}>
                    <BadgeIcon className="h-7 w-7" />
                  </div>

                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 leading-tight truncate w-full">
                    {badge.name}
                  </h4>
                  <span className="block text-[9px] text-slate-400 font-bold mt-1 leading-relaxed">
                    {badge.unlocked ? 'Unlocked!' : 'Locked'}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* D. Level Up Congratulations Dialog Modal with CSS Confetti */}
      <AnimatePresence>
        {showLevelUpModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[99] flex items-center justify-center p-4 overflow-hidden">
            {/* CSS confetti nodes */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 45 }).map((_, i) => {
                const colors = ['#a855f7', '#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#06b6d4'];
                const randomColor = colors[i % colors.length];
                const randomLeft = Math.random() * 100;
                const randomDelay = Math.random() * 3.5;
                const randomDuration = 2.5 + Math.random() * 2;
                return (
                  <div 
                    key={i} 
                    className="confetti-dot" 
                    style={{
                      left: `${randomLeft}%`,
                      backgroundColor: randomColor,
                      animationDelay: `${randomDelay}s`,
                      animationDuration: `${randomDuration}s`,
                    }}
                  />
                );
              })}
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border-2 border-purple-500/30 p-8 text-center relative z-10 space-y-6"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-yellow-400 via-amber-500 to-purple-600 text-white flex items-center justify-center shadow-xl relative animate-bounce">
                  <Crown className="h-10 w-10 text-white" />
                </div>

                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-400">
                    Grand Rank Promotion
                  </span>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white mt-3">
                    Congratulations, {userName}!
                  </h2>
                  <p className="text-sm font-extrabold text-purple-600 dark:text-purple-400 mt-1">
                    You advanced to Level {currentLevel}!
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2.5 px-4">
                    Your continuous diligence in logging and budgeting has qualified you for a higher tier of financial responsibility. Keep it up!
                  </p>
                </div>
              </div>

              <button
                onClick={closeLevelUpModal}
                className="w-full py-3 rounded-2xl font-bold text-xs cursor-pointer bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/25 transition duration-200"
              >
                Acknowledge Promotion
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* E. NEWLY COMPLETED BADGE CELEBRATION TAB / OVERLAY VIEW WITH CONFETTI & AUDIO */}
      <AnimatePresence>
        {celebratedBadge && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-hidden">
            {/* Immersive Confetti shower */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 60 }).map((_, i) => {
                const colors = ['#f43f5e', '#a855f7', '#10b981', '#3b82f6', '#fbbf24', '#ec4899'];
                return (
                  <div 
                    key={i} 
                    className="confetti-dot" 
                    style={{
                      left: `${Math.random() * 100}%`,
                      backgroundColor: colors[i % colors.length],
                      animationDelay: `${Math.random() * 4}s`,
                      animationDuration: `${2.2 + Math.random() * 2}s`,
                    }}
                  />
                );
              })}
            </div>

            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border-4 border-purple-500 p-8 text-center relative z-10 space-y-6 glow-pulse"
            >
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setCelebratedBadge(null)}
                  className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Visual Audio Wave indicator */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                  <Volume2 className="h-3 w-3 animate-pulse" />
                  Chime Synthesis Playing
                </span>

                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Achievement Unlocked!
                </h2>

                {/* Highlighted Badge Medallion */}
                <div className="relative py-6 flex justify-center">
                  <div className="absolute inset-0 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-2xl transform scale-75 animate-pulse"></div>
                  <motion.div 
                    initial={{ rotate: -10, scale: 0.9 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', damping: 10 }}
                    className={`h-28 w-28 rounded-full bg-gradient-to-tr ${celebratedBadge.color} text-white flex items-center justify-center shadow-2xl border-4 border-white dark:border-slate-800 relative z-10 mx-auto`}
                  >
                    {React.createElement(celebratedBadge.icon, { className: "h-14 w-14" })}
                  </motion.div>
                </div>

                {/* Badge Details */}
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
                    {celebratedBadge.name}
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-200 font-semibold px-4 leading-relaxed">
                    {celebratedBadge.desc}
                  </p>
                  <div className="inline-block mt-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
                    Reward: +250 XP Credited
                  </div>
                </div>

                {/* Celebration Close button */}
                <button
                  onClick={() => setCelebratedBadge(null)}
                  className="w-full mt-4 py-3.5 rounded-2xl font-bold text-sm cursor-pointer bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/25 transition duration-200"
                >
                  Awesome, Claim Reward!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* F. Manual Badge Info Modal Dialog */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Badge Blueprint info</span>
                <button 
                  onClick={() => setSelectedBadge(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="text-center space-y-4">
                <div className={`h-16 w-16 rounded-full bg-gradient-to-tr ${selectedBadge.unlocked ? selectedBadge.color : 'from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800'} text-white flex items-center justify-center shadow-lg mx-auto`}>
                  {React.createElement(selectedBadge.icon, { className: "h-8 w-8" })}
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">{selectedBadge.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal mt-1">{selectedBadge.desc}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 text-left border border-slate-100 dark:border-slate-850">
                  <span className="block text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">Unlock Criterion</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed mt-0.5">{selectedBadge.howTo}</p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2 text-xs font-bold">
                  {selectedBadge.unlocked ? (
                    <span className="text-emerald-500 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200/40 dark:border-emerald-900/30">
                      <Unlock className="h-3.5 w-3.5" />
                      Unlocked & Preserved
                    </span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                      <Lock className="h-3.5 w-3.5" />
                      Locked
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
