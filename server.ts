/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// Load environment variables
import dotenvConfig from "dotenv";
dotenvConfig.config();

// Extend request type to include user session context at the top level
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

import { 
  initDB, UserRepository, GroupRepository, ExpenseRepository, 
  CategoryRepository, BudgetRepository, SavingsRepository, 
  BillReminderRepository, NotificationRepository, AIInsightRepository 
} from "./server/db";

import { SavingsGoal, Budget, BillReminder, AIInsight } from "./src/types";

import { 
  runFinancialAnalystAgent, runRecommendationAgent,
  runSpendingBehaviourAgent, runFinancialHealthScoreAgent, runSmartAlertAgent,
  runGoalTrackingAgent, runBillReminderAgent, runInteractiveAssistant, runUniversalNlpParser,
  runFinancialCopilotPlanner, runOnboardingAnalyst,
  runAutonomousAdvisorAgent, runPredictiveFinanceAgent,
  runFinancialHealthMonitorAgent, runFinancialCoachAgent
} from "./server/gemini";
import { runLangGraphDecisionEngine } from "./server/graph";

// Initialize database
initDB();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for JSON parsing and large assets (voice transcripts, receipt screenshots)
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Helper middleware to verify simple JWT-like Bearer authorization
  const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized credentials' });
      return;
    }
    const token = authHeader.split(' ')[1];
    const user = UserRepository.getById(token);
    if (!user) {
      res.status(401).json({ error: 'User session expired or invalid' });
      return;
    }
    req.user = user;
    next();
  };

  // ==========================================
  // AUTHENTICATION API ENDPOINTS
  // ==========================================

  app.post('/api/auth/register', (req, res) => {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      res.status(400).json({ error: 'Email, name, and password are required' });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();

    const existingUser = UserRepository.getByEmail(trimmedEmail);
    if (existingUser) {
      res.status(400).json({ error: 'User with this email is already registered' });
      return;
    }

    const userId = `u_usr_${Date.now()}`;
    const newUser = {
      id: userId,
      email: trimmedEmail,
      name: trimmedName,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmedName)}`,
      joinedAt: new Date().toISOString().split('T')[0]
    };

    UserRepository.create(newUser, trimmedPassword);
    res.status(201).json({ token: userId, user: newUser });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    const user = UserRepository.getByEmail(trimmedEmail);
    if (!user || !UserRepository.checkPassword(user.id, trimmedPassword)) {
      res.status(400).json({ error: 'Invalid email or password credentials' });
      return;
    }

    res.status(200).json({ token: user.id, user });
  });

  app.get('/api/auth/me', authMiddleware, (req, res) => {
    const prefs = UserRepository.getPreferences(req.user.id);
    res.json({ user: req.user, preferences: prefs });
  });

  app.post('/api/onboarding/setup', authMiddleware, async (req, res) => {
    const { 
      name,
      salary, 
      otherIncome, 
      budgetLimit, 
      currency, 
      savingsGoal, 
      fixedExpenses, 
      spendingStyle 
    } = req.body;

    if (!salary) {
      res.status(400).json({ error: 'Monthly salary is required' });
      return;
    }

    try {
      if (name && name.trim()) {
        UserRepository.updateUser(req.user.id, name);
      }
      const parsedSalary = Number(salary);
      const parsedOtherIncome = Number(otherIncome || 0);
      const parsedBudgetLimit = Number(budgetLimit || 0);
      const parsedSavingsGoal = Number(savingsGoal || 0);
      const activeCurrency = currency || 'INR';
      const activeStyle = spendingStyle || 'moderate';

      const rentVal = Number(fixedExpenses?.rent || 0);
      const rentDueDay = Number(fixedExpenses?.rentDueDay || 5);
      const emiVal = Number(fixedExpenses?.emi || 0);
      const emiDueDay = Number(fixedExpenses?.emiDueDay || 10);
      const utilitiesVal = Number(fixedExpenses?.utilities || 0);
      const utilitiesDueDay = Number(fixedExpenses?.utilitiesDueDay || 15);
      const internetVal = Number(fixedExpenses?.internet || 0);
      const internetDueDay = Number(fixedExpenses?.internetDueDay || 18);
      const insuranceVal = Number(fixedExpenses?.insurance || 0);
      const insuranceDueDay = Number(fixedExpenses?.insuranceDueDay || 25);

      // 1. Update User Preferences
      UserRepository.updatePreferences(req.user.id, {
        isOnboarded: true,
        monthlySalary: parsedSalary,
        otherIncome: parsedOtherIncome,
        monthlyBudgetLimit: parsedBudgetLimit,
        savingsGoal: parsedSavingsGoal,
        rentExpense: rentVal,
        emiExpense: emiVal,
        utilitiesExpense: utilitiesVal,
        internetExpense: internetVal,
        insuranceExpense: insuranceVal,
        spendingStyle: activeStyle,
        currency: activeCurrency
      });

      // 2. Set Monthly Budget
      if (parsedBudgetLimit > 0) {
        const budgetId = `b_onb_${Date.now()}`;
        const newBudget: Budget = {
          id: budgetId,
          userId: req.user.id,
          period: 'monthly',
          amount: parsedBudgetLimit,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        };
        BudgetRepository.create(newBudget);
      }

      // 3. Set Monthly Savings Goal
      if (parsedSavingsGoal > 0) {
        const savingsId = `sg_onb_${Date.now()}`;
        const newGoal: SavingsGoal = {
          id: savingsId,
          userId: req.user.id,
          name: 'Monthly Savings Target',
          targetAmount: parsedSavingsGoal,
          currentAmount: 0,
          targetDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          category: 'other'
        };
        SavingsRepository.create(newGoal);
      }

      // Helper to build a proper ISO date based on the chosen due day of the month
      const getDueDateForDay = (dayInput: number) => {
        const d = new Date();
        const year = d.getFullYear();
        const month = d.getMonth() + 1; // 1-indexed month
        const day = Math.min(Math.max(1, dayInput), 28); // Clamp to safe range
        
        // Return YYYY-MM-DD
        const monthStr = month < 10 ? `0${month}` : `${month}`;
        const dayStr = day < 10 ? `0${day}` : `${day}`;
        return `${year}-${monthStr}-${dayStr}`;
      };

      // 4. Set Fixed Expenses as Bill Reminders
      const expensesToCreate = [
        { title: 'Monthly Rent Payment', amount: rentVal, category: 'Rent', dueDay: rentDueDay },
        { title: 'Monthly EMI Loan', amount: emiVal, category: 'EMI', dueDay: emiDueDay },
        { title: 'Electricity & Utility Bills', amount: utilitiesVal, category: 'Bills', dueDay: utilitiesDueDay },
        { title: 'Internet & WiFi Subscription', amount: internetVal, category: 'Bills', dueDay: internetDueDay },
        { title: 'Insurance Premium Sync', amount: insuranceVal, category: 'Insurance', dueDay: insuranceDueDay }
      ];

      expensesToCreate.forEach((exp, index) => {
        if (exp.amount && exp.amount > 0) {
          const reminderId = `br_onb_${Date.now()}_${index}`;
          const newReminder: BillReminder = {
            id: reminderId,
            userId: req.user.id,
            title: exp.title,
            amount: exp.amount,
            category: exp.category,
            dueDate: getDueDateForDay(exp.dueDay),
            frequency: 'monthly',
            isPaid: false,
            createdAt: new Date().toISOString()
          };
          BillReminderRepository.create(newReminder);
        }
      });

      // 5. Run AI Onboarding Analyst Agent to yield customized insight report
      const insightData = await runOnboardingAnalyst(
        parsedSalary,
        parsedOtherIncome,
        parsedBudgetLimit,
        parsedSavingsGoal,
        {
          rent: rentVal,
          emi: emiVal,
          utilities: utilitiesVal,
          internet: internetVal,
          insurance: insuranceVal
        },
        activeStyle,
        activeCurrency
      );

      const insightId = `ins_onb_${Date.now()}`;
      const newInsight: AIInsight = {
        id: insightId,
        userId: req.user.id,
        agentId: 'onboarding_analyst',
        agentName: 'FINPILOT WELCOME AGENT',
        title: insightData.title || 'Profile Onboarded Successfully!',
        insight: insightData.insight || 'Your smart financial profile has been compiled and is active.',
        recommendations: insightData.recommendations || [],
        createdAt: new Date().toISOString()
      };
      AIInsightRepository.create(newInsight);

      // 6. Trigger introductory Notification
      const notification = {
        id: `notif_onb_${Date.now()}`,
        userId: req.user.id,
        title: 'Welcome to FinPilot AI! 🚀',
        message: 'Your customized profile is fully compiled. Check your Dashboard to view monthly budgets, savings trackers, and automatic bill payments.',
        type: 'success' as const,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      NotificationRepository.create(notification);

      res.status(200).json({ success: true, message: 'Onboarding synchronized successfully!' });
    } catch (error: any) {
      console.error('Onboarding flow setup failure:', error);
      res.status(500).json({ error: error.message || 'Onboarding compilation failed' });
    }
  });

  app.delete('/api/auth/delete-account', authMiddleware, (req, res) => {
    UserRepository.deleteAccount(req.user.id);
    res.json({ message: 'Account cleared and reset successfully' });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    const user = UserRepository.getByEmail(email);
    if (!user) {
      res.status(404).json({ error: 'No account registered with this email address' });
      return;
    }
    // Simulation: in production send reset email
    res.json({ message: 'A password reset token was dispatched to your email address' });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const { email, newPassword } = req.body;
    const user = UserRepository.getByEmail(email);
    if (!user) {
      res.status(404).json({ error: 'User registration not found' });
      return;
    }
    UserRepository.updatePassword(user.id, newPassword);
    res.json({ message: 'Password has been successfully updated' });
  });

  // ==========================================
  // USER PREFERENCES API
  // ==========================================

  app.get('/api/preferences', authMiddleware, (req, res) => {
    res.json(UserRepository.getPreferences(req.user.id));
  });

  app.post('/api/preferences', authMiddleware, (req, res) => {
    const { activeMode, currency, theme } = req.body;
    const updated = UserRepository.updatePreferences(req.user.id, { activeMode, currency, theme });
    res.json(updated);
  });

  // ==========================================
  // EXPENSES API
  // ==========================================

  app.get('/api/expenses', authMiddleware, (req, res) => {
    const { mode, groupId } = req.query;
    if (mode === 'group' && groupId) {
      res.json(ExpenseRepository.getGroup(groupId as string));
    } else {
      res.json(ExpenseRepository.getPersonal(req.user.id));
    }
  });

  app.post('/api/expenses', authMiddleware, (req, res) => {
    const { amount, category, date, description, source, groupId, splitWithIds, receiptUrl } = req.body;
    if (!amount || !category || !date || !description) {
      res.status(400).json({ error: 'Amount, category, date, and description are required' });
      return;
    }

    const newExpense = {
      id: `exp_${Date.now()}`,
      userId: req.user.id,
      amount: parseFloat(amount),
      category,
      date,
      description,
      source: source || 'manual',
      groupId: groupId || undefined,
      splitWithIds: splitWithIds || undefined,
      receiptUrl: receiptUrl || undefined,
      createdAt: new Date().toISOString()
    };

    ExpenseRepository.create(newExpense);

    // Dynamic warning alert simulation
    if (newExpense.amount > 300) {
      NotificationRepository.create({
        id: `notif_${Date.now()}`,
        userId: req.user.id,
        title: 'Large Expense Detected',
        message: `An expense of $${newExpense.amount} was logged. Category: ${category}.`,
        type: 'warning',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }

    res.status(201).json(newExpense);
  });

  app.put('/api/expenses/:id', authMiddleware, (req, res) => {
    const updated = ExpenseRepository.update(req.params.id, req.user.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Expense log not found or unauthorized' });
      return;
    }
    res.json(updated);
  });

  app.delete('/api/expenses/:id', authMiddleware, (req, res) => {
    const deleted = ExpenseRepository.delete(req.params.id, req.user.id);
    if (!deleted) {
      res.status(404).json({ error: 'Expense record not found or unauthorized' });
      return;
    }
    res.json({ message: 'Expense record removed successfully' });
  });

  // ==========================================
  // CATEGORIES API
  // ==========================================

  app.get('/api/categories', authMiddleware, (req, res) => {
    res.json(CategoryRepository.getForUser(req.user.id));
  });

  app.post('/api/categories', authMiddleware, (req, res) => {
    const { name, color, icon } = req.body;
    if (!name || !color) {
      res.status(400).json({ error: 'Category name and color are required' });
      return;
    }

    const newCategory = {
      id: `cat_${Date.now()}`,
      userId: req.user.id,
      name,
      color,
      icon: icon || 'HelpCircle',
      isCustom: true
    };

    CategoryRepository.create(newCategory);
    res.status(201).json(newCategory);
  });

  // ==========================================
  // BUDGETS API
  // ==========================================

  app.get('/api/budgets', authMiddleware, (req, res) => {
    const { mode, groupId } = req.query;
    if (mode === 'group' && groupId) {
      res.json(BudgetRepository.getForGroup(groupId as string));
    } else {
      res.json(BudgetRepository.getForUser(req.user.id));
    }
  });

  app.post('/api/budgets', authMiddleware, (req, res) => {
    const { amount, period, category, groupId } = req.body;
    if (!amount || !period) {
      res.status(400).json({ error: 'Budget amount and period are required' });
      return;
    }

    const newBudget = {
      id: `bud_${Date.now()}`,
      userId: req.user.id,
      groupId: groupId || undefined,
      period,
      category: category || undefined,
      amount: parseFloat(amount),
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    BudgetRepository.create(newBudget);
    res.status(201).json(newBudget);
  });

  app.delete('/api/budgets/:id', authMiddleware, (req, res) => {
    const deleted = BudgetRepository.delete(req.params.id, req.user.id);
    if (!deleted) {
      res.status(404).json({ error: 'Budget not found or unauthorized' });
      return;
    }
    res.json({ message: 'Budget target deleted' });
  });

  app.put('/api/budgets/:id', authMiddleware, (req, res) => {
    const updated = BudgetRepository.update(req.params.id, req.user.id, {
      amount: req.body.amount ? parseFloat(req.body.amount) : undefined,
      period: req.body.period,
      category: req.body.category === 'All' ? undefined : req.body.category,
    });
    if (!updated) {
      res.status(404).json({ error: 'Budget not found or unauthorized' });
      return;
    }
    res.json(updated);
  });

  // ==========================================
  // SAVINGS GOALS API
  // ==========================================

  app.get('/api/savings', authMiddleware, (req, res) => {
    res.json(SavingsRepository.getForUser(req.user.id));
  });

  app.post('/api/savings', authMiddleware, (req, res) => {
    const { name, targetAmount, currentAmount, targetDate, category, groupId } = req.body;
    if (!name || !targetAmount || !targetDate || !category) {
      res.status(400).json({ error: 'Goal name, target amount, target date, and category are required' });
      return;
    }

    const newGoal = {
      id: `svg_${Date.now()}`,
      userId: req.user.id,
      groupId: groupId || undefined,
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount || 0),
      targetDate,
      category,
      createdAt: new Date().toISOString()
    };

    SavingsRepository.create(newGoal);
    res.status(201).json(newGoal);
  });

  app.put('/api/savings/:id/amount', authMiddleware, (req, res) => {
    const { currentAmount } = req.body;
    const updated = SavingsRepository.updateAmount(req.params.id, req.user.id, parseFloat(currentAmount));
    if (!updated) {
      res.status(404).json({ error: 'Savings goal not found' });
      return;
    }
    res.json(updated);
  });

  app.delete('/api/savings/:id', authMiddleware, (req, res) => {
    const deleted = SavingsRepository.delete(req.params.id, req.user.id);
    if (!deleted) {
      res.status(404).json({ error: 'Savings goal not found or unauthorized' });
      return;
    }
    res.json({ message: 'Savings target removed' });
  });

  app.put('/api/savings/:id', authMiddleware, (req, res) => {
    const updated = SavingsRepository.update(req.params.id, req.user.id, {
      name: req.body.name,
      targetAmount: req.body.targetAmount ? parseFloat(req.body.targetAmount) : undefined,
      currentAmount: req.body.currentAmount !== undefined ? parseFloat(req.body.currentAmount) : undefined,
      targetDate: req.body.targetDate,
      category: req.body.category,
    });
    if (!updated) {
      res.status(404).json({ error: 'Savings goal not found or unauthorized' });
      return;
    }
    res.json(updated);
  });

  // ==========================================
  // BILL REMINDERS & CALENDAR INTEGRATION API
  // ==========================================

  app.get('/api/reminders', authMiddleware, (req, res) => {
    res.json(BillReminderRepository.getForUser(req.user.id));
  });

  app.post('/api/reminders', authMiddleware, (req, res) => {
    const { title, amount, category, dueDate, frequency, googleCalendarSync } = req.body;
    if (!title || !amount || !dueDate) {
      res.status(400).json({ error: 'Reminder title, amount, and due date are required' });
      return;
    }

    const newReminder = {
      id: `rem_${Date.now()}`,
      userId: req.user.id,
      title,
      amount: parseFloat(amount),
      category: category || 'Bills',
      dueDate,
      frequency: frequency || 'monthly',
      isPaid: false,
      googleCalendarEventId: googleCalendarSync ? `g_cal_ev_${Date.now()}` : undefined,
      createdAt: new Date().toISOString()
    };

    BillReminderRepository.create(newReminder);
    res.status(201).json(newReminder);
  });

  app.put('/api/reminders/:id/pay', authMiddleware, (req, res) => {
    const updated = BillReminderRepository.togglePaid(req.params.id, req.user.id);
    if (!updated) {
      res.status(404).json({ error: 'Reminder target not found' });
      return;
    }
    res.json(updated);
  });

  app.delete('/api/reminders/:id', authMiddleware, (req, res) => {
    const deleted = BillReminderRepository.delete(req.params.id, req.user.id);
    if (!deleted) {
      res.status(404).json({ error: 'Reminder not found or unauthorized' });
      return;
    }
    res.json({ message: 'Bill reminder cleared' });
  });

  app.put('/api/reminders/:id', authMiddleware, (req, res) => {
    const updated = BillReminderRepository.update(req.params.id, req.user.id, {
      title: req.body.title,
      amount: req.body.amount ? parseFloat(req.body.amount) : undefined,
      category: req.body.category,
      dueDate: req.body.dueDate,
      frequency: req.body.frequency,
      isPaid: req.body.isPaid,
    });
    if (!updated) {
      res.status(404).json({ error: 'Reminder not found or unauthorized' });
      return;
    }
    res.json(updated);
  });

  // ==========================================
  // NOTIFICATIONS API
  // ==========================================

  app.get('/api/notifications', authMiddleware, (req, res) => {
    res.json(NotificationRepository.getForUser(req.user.id));
  });

  app.put('/api/notifications/:id/read', authMiddleware, (req, res) => {
    const success = NotificationRepository.markRead(req.params.id, req.user.id);
    res.json({ success });
  });

  // ==========================================
  // UNIVERSAL NLP & IMAGE PARSER ENDPOINT
  // ==========================================
  app.post('/api/parse-nlp', authMiddleware, async (req, res) => {
    const { type, text, image } = req.body;
    if (!type) {
      res.status(400).json({ error: 'Parsing target type is required' });
      return;
    }
    try {
      const parsedData = await runUniversalNlpParser(type, text, image);
      res.json(parsedData);
    } catch (err: any) {
      console.error('NLP Parse Endpoint Error:', err);
      res.status(500).json({ error: err.message || 'Error occurred while analyzing entries.' });
    }
  });

  // ==========================================
  // INTEGRATED AGENT TRIGGER SYSTEM (10 AGENTS)
  // ==========================================

  app.post('/api/agents/run', authMiddleware, async (req, res) => {
    const { agentId, parameters } = req.body;
    if (!agentId) {
      res.status(400).json({ error: 'Agent ID is required' });
      return;
    }

    const expenses = ExpenseRepository.getPersonal(req.user.id);
    const budgets = BudgetRepository.getForUser(req.user.id);
    const goals = SavingsRepository.getForUser(req.user.id);
    const reminders = BillReminderRepository.getForUser(req.user.id);

    try {
      let result: any = {};
      
      switch (agentId) {
        case 'analyst_agent':
          result = await runFinancialAnalystAgent(expenses, budgets);
          break;
          
        case 'recommendation_agent':
          result = await runRecommendationAgent(expenses, goals);
          break;
          
        case 'behaviour_agent':
          result = await runSpendingBehaviourAgent(expenses);
          break;
          
        case 'health_score_agent':
          result = await runFinancialHealthScoreAgent(expenses, budgets, goals);
          break;
          
        case 'smart_alert_agent':
          result = await runSmartAlertAgent(expenses, budgets);
          break;
          
        case 'goal_agent':
          result = await runGoalTrackingAgent(goals, expenses);
          break;
          
        case 'bill_agent':
          result = await runBillReminderAgent(reminders);
          break;
          
        default:
          res.status(404).json({ error: 'Unknown Advisor Agent specified' });
          return;
      }

      // Save insight to the database for historical lookup
      const newInsight = {
        id: `ins_${Date.now()}`,
        userId: req.user.id,
        agentId,
        agentName: agentId.replace('_', ' ').toUpperCase(),
        title: result.title || 'Advisor Diagnostic',
        insight: result.insight || JSON.stringify(result),
        recommendations: result.recommendations || [],
        score: result.score || undefined,
        createdAt: new Date().toISOString()
      };
      
      AIInsightRepository.create(newInsight);

      res.json({ status: 'completed', result, insight: newInsight });
    } catch (err: any) {
      console.error(`Agent ${agentId} run error:`, err);
      res.status(500).json({ error: err.message || 'Agent logic failed to run' });
    }
  });

  // Fetch cached insights
  app.get('/api/insights', authMiddleware, (req, res) => {
    res.json(AIInsightRepository.getForUser(req.user.id));
  });

  // ==========================================
  // GENERAL ASSISTANT CHAT INTERFACE
  // ==========================================

  app.post('/api/chat', authMiddleware, async (req, res) => {
    const { prompt, history } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const pExpenses = ExpenseRepository.getPersonal(req.user.id);
    const pBudgets = BudgetRepository.getForUser(req.user.id);
    const pGoals = SavingsRepository.getForUser(req.user.id);
    const pReminders = BillReminderRepository.getForUser(req.user.id);

    try {
      const responseText = await runLangGraphDecisionEngine({
        userId: req.user.id,
        expenses: pExpenses,
        budgets: pBudgets,
        goals: pGoals,
        reminders: pReminders,
        query: prompt,
        history: history || [],
        selectedAgent: "assistant"
      });
      res.json({ text: responseText });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Assistant failed to generate response' });
    }
  });

  // ==========================================
  // GOAL-DRIVEN FINANCIAL COPILOT ENDPOINTS
  // ==========================================

  app.post('/api/copilot/generate-plan', authMiddleware, async (req, res) => {
    const { goalText } = req.body;
    if (!goalText) {
      res.status(400).json({ error: 'Goal text description is required' });
      return;
    }

    try {
      const expenses = ExpenseRepository.getPersonal(req.user.id);
      const budgets = BudgetRepository.getForUser(req.user.id);
      const goals = SavingsRepository.getForUser(req.user.id);
      const reminders = BillReminderRepository.getForUser(req.user.id);

      const plan = await runLangGraphDecisionEngine({
        userId: req.user.id,
        expenses,
        budgets,
        goals,
        reminders,
        goalText,
        selectedAgent: "planner"
      });
      res.json(plan);
    } catch (error: any) {
      console.error('Failed to generate Copilot financial plan:', error);
      res.status(500).json({ error: error.message || 'Copilot failed to generate a financial strategy' });
    }
  });

  app.post('/api/copilot/execute-plan', authMiddleware, async (req, res) => {
    const { plan } = req.body;
    if (!plan) {
      res.status(400).json({ error: 'Plan details are required for execution' });
      return;
    }

    try {
      // 1. Create Savings Goal
      const goalId = `sg_copilot_${Date.now()}`;
      const newGoal: SavingsGoal = {
        id: goalId,
        userId: req.user.id,
        name: plan.goalTitle || `Savings: ${plan.category}`,
        targetAmount: Number(plan.targetAmount) || 10000,
        currentAmount: 0,
        targetDate: plan.targetDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        category: plan.category || 'other'
      };
      SavingsRepository.create(newGoal);

      // 2. Create Category Budgets
      if (plan.proposedBudgets && Array.isArray(plan.proposedBudgets)) {
        plan.proposedBudgets.forEach((pb: any, index: number) => {
          const newBudget: Budget = {
            id: `b_copilot_${Date.now()}_${index}`,
            userId: req.user.id,
            period: pb.period || 'monthly',
            category: pb.category,
            amount: Number(pb.amount),
            startDate: new Date().toISOString().split('T')[0],
            endDate: plan.targetDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
            createdAt: new Date().toISOString()
          };
          BudgetRepository.create(newBudget);
        });
      }

      // 3. Create Bill Reminders (deduplicating common recurring bills)
      if (plan.proposedReminders && Array.isArray(plan.proposedReminders)) {
        const existingReminders = BillReminderRepository.getForUser(req.user.id);
        plan.proposedReminders.forEach((pr: any, index: number) => {
          const prTitleNorm = (pr.title || '').toLowerCase();
          
          const isDuplicate = existingReminders.some(er => {
            const erTitleNorm = (er.title || '').toLowerCase();
            
            // Match common fixed expenses categories or close keywords
            const matchesRent = prTitleNorm.includes('rent') && erTitleNorm.includes('rent');
            const matchesElectricity = (prTitleNorm.includes('electricity') || prTitleNorm.includes('utility')) && (erTitleNorm.includes('electricity') || erTitleNorm.includes('utility') || erTitleNorm.includes('power') || erTitleNorm.includes('bill'));
            const matchesInternet = (prTitleNorm.includes('internet') || prTitleNorm.includes('wifi') || prTitleNorm.includes('broadband')) && (erTitleNorm.includes('internet') || erTitleNorm.includes('wifi'));
            const matchesEmi = (prTitleNorm.includes('emi') || prTitleNorm.includes('loan')) && (erTitleNorm.includes('emi') || erTitleNorm.includes('loan'));
            const matchesInsurance = prTitleNorm.includes('insurance') && erTitleNorm.includes('insurance');
            
            return matchesRent || matchesElectricity || matchesInternet || matchesEmi || matchesInsurance || 
                   (prTitleNorm === erTitleNorm && Math.abs(Number(pr.amount) - er.amount) < 5);
          });

          if (!isDuplicate) {
            const newReminder: BillReminder = {
              id: `br_copilot_${Date.now()}_${index}`,
              userId: req.user.id,
              title: pr.title,
              amount: Number(pr.amount),
              category: pr.category || 'Bills',
              dueDate: pr.dueDate || new Date().toISOString().split('T')[0],
              frequency: 'once',
              isPaid: false,
              createdAt: new Date().toISOString()
            };
            BillReminderRepository.create(newReminder);
          } else {
            console.log(`Bypassed duplicate schedule in copilot execution: ${pr.title}`);
          }
        });
      }

      // 4. Create AI Insight record for history logs
      const newInsight: AIInsight = {
        id: `ins_copilot_${Date.now()}`,
        userId: req.user.id,
        agentId: 'copilot_agent',
        agentName: 'FINANCIAL COPILOT',
        title: `Copilot Activated: ${plan.goalTitle}`,
        insight: `Copilot successfully executed financial modeling! We structured ${plan.proposedBudgets?.length || 0} budgets and scheduled ${plan.proposedReminders?.length || 0} reminders to support your target of ₹${plan.targetAmount?.toLocaleString()}. Feasibility rating: ${plan.confidenceScore}%. ${plan.currentStatusAnalysis}`,
        recommendations: plan.suggestedCuts || [],
        createdAt: new Date().toISOString()
      };
      AIInsightRepository.create(newInsight);

      // 5. Trigger System Notification
      const notification = {
        id: `notif_copilot_${Date.now()}`,
        userId: req.user.id,
        title: 'Copilot Plan Successfully Activated! 🚀',
        message: `Your savings target for "${plan.goalTitle}" has been automated. Check your Budgets and Savings Vault to track real-time progress.`,
        type: 'success' as const,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      NotificationRepository.create(notification);

      res.json({ success: true, message: 'Copilot strategy successfully executed!', goal: newGoal });
    } catch (error: any) {
      console.error('Failed to execute Copilot plan:', error);
      res.status(500).json({ error: error.message || 'Failed to programmatically apply copilot configuration' });
    }
  });

  // Autonomous Advisor endpoint
  app.get('/api/copilot/advisor', authMiddleware, async (req, res) => {
    try {
      const expenses = ExpenseRepository.getPersonal(req.user.id);
      const budgets = BudgetRepository.getForUser(req.user.id);
      const preferences = UserRepository.getPreferences(req.user.id);
      const user = UserRepository.getById(req.user.id) as any;
      const userPrefs = {
        currency: preferences.currency,
        monthlySalary: user?.salary || 50000,
        otherIncome: user?.otherIncome || 0
      };

      const result = await runLangGraphDecisionEngine({
        userId: req.user.id,
        expenses,
        budgets,
        userPrefs,
        selectedAgent: "advisor"
      });
      res.json(result);
    } catch (err: any) {
      console.error('Advisor endpoint error:', err);
      res.status(500).json({ error: err.message || 'Advisor agent failed' });
    }
  });

  // Predictive Finance endpoint
  app.get('/api/copilot/predictive', authMiddleware, async (req, res) => {
    try {
      const expenses = ExpenseRepository.getPersonal(req.user.id);
      const budgets = BudgetRepository.getForUser(req.user.id);
      const goals = SavingsRepository.getForUser(req.user.id);
      const reminders = BillReminderRepository.getForUser(req.user.id);
      const preferences = UserRepository.getPreferences(req.user.id);
      const user = UserRepository.getById(req.user.id) as any;
      const userPrefs = {
        currency: preferences.currency,
        monthlySalary: user?.salary || 50000,
        otherIncome: user?.otherIncome || 0,
        savingsGoal: user?.savingsGoal || 10000
      };

      const result = await runLangGraphDecisionEngine({
        userId: req.user.id,
        expenses,
        budgets,
        goals,
        reminders,
        userPrefs,
        selectedAgent: "predictive"
      });
      res.json(result);
    } catch (err: any) {
      console.error('Predictive endpoint error:', err);
      res.status(500).json({ error: err.message || 'Predictive agent failed' });
    }
  });

  // Financial Health Monitor endpoint
  app.get('/api/copilot/health', authMiddleware, async (req, res) => {
    try {
      const expenses = ExpenseRepository.getPersonal(req.user.id);
      const budgets = BudgetRepository.getForUser(req.user.id);
      const goals = SavingsRepository.getForUser(req.user.id);
      const reminders = BillReminderRepository.getForUser(req.user.id);
      const preferences = UserRepository.getPreferences(req.user.id);
      const user = UserRepository.getById(req.user.id) as any;
      const userPrefs = {
        currency: preferences.currency,
        monthlySalary: user?.salary || 50000,
        otherIncome: user?.otherIncome || 0,
        savingsGoal: user?.savingsGoal || 10000
      };

      const result = await runLangGraphDecisionEngine({
        userId: req.user.id,
        expenses,
        budgets,
        goals,
        reminders,
        userPrefs,
        selectedAgent: "health"
      });
      res.json(result);
    } catch (err: any) {
      console.error('Health monitor endpoint error:', err);
      res.status(500).json({ error: err.message || 'Health monitor agent failed' });
    }
  });

  // Financial Coach endpoint
  app.get('/api/copilot/coach', authMiddleware, async (req, res) => {
    try {
      const expenses = ExpenseRepository.getPersonal(req.user.id);
      const budgets = BudgetRepository.getForUser(req.user.id);
      const preferences = UserRepository.getPreferences(req.user.id);
      const user = UserRepository.getById(req.user.id) as any;
      const userPrefs = {
        currency: preferences.currency,
        monthlySalary: user?.salary || 50000,
        otherIncome: user?.otherIncome || 0,
        savingsGoal: user?.savingsGoal || 10000
      };

      const result = await runLangGraphDecisionEngine({
        userId: req.user.id,
        expenses,
        budgets,
        userPrefs,
        selectedAgent: "coach"
      });
      res.json(result);
    } catch (err: any) {
      console.error('Coach endpoint error:', err);
      res.status(500).json({ error: err.message || 'Coach agent failed' });
    }
  });

  // ==========================================
  // REPORTING & POWER BI API FEED
  // ==========================================

  app.post('/api/reports/export', authMiddleware, (req, res) => {
    const { type, format } = req.body;
    const expenses = ExpenseRepository.getPersonal(req.user.id);
    const filename = `finpilot_${type || 'monthly'}_report_${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    const url = `data:text/plain;charset=utf-8,${encodeURIComponent(`FinPilot AI Compiled Compiled Report (${format?.toUpperCase()})\nPeriod: ${type || 'monthly'}\nGenerated at: ${new Date().toISOString()}\nTotal Transactions: ${expenses.length}\nTotal Spent: ₹${expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)}`)}`;
    res.json({ url, filename });
  });

  app.get('/api/reports/export', authMiddleware, (req, res) => {
    const { format, period } = req.query;
    const expenses = ExpenseRepository.getPersonal(req.user.id);
    const budgets = BudgetRepository.getForUser(req.user.id);
    const goals = SavingsRepository.getForUser(req.user.id);

    const data = {
      user: req.user.name,
      period: period || 'monthly',
      generatedAt: new Date().toISOString(),
      summary: {
        totalSpent: expenses.reduce((sum, e) => sum + e.amount, 0),
        budgetAdherence: '89%',
        savingsVelocity: '$450/month',
      },
      expenses: expenses.map(e => ({ date: e.date, description: e.description, category: e.category, amount: e.amount })),
      budgets: budgets.map(b => ({ category: b.category || 'All', amount: b.amount })),
      goals: goals.map(g => ({ name: g.name, target: g.targetAmount, current: g.currentAmount }))
    };

    // Return mock binary payload or direct clean export formats
    if (format === 'csv') {
      let csv = 'Date,Description,Category,Amount\n';
      data.expenses.forEach(e => {
        csv += `"${e.date}","${e.description}","${e.category}",${e.amount}\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=financial-report.csv');
      res.send(csv);
    } else {
      res.json({ format: format || 'json', data });
    }
  });

  app.get('/api/powerbi/feed', authMiddleware, (req, res) => {
    const expenses = ExpenseRepository.getPersonal(req.user.id);
    const budgets = BudgetRepository.getForUser(req.user.id);
    const goals = SavingsRepository.getForUser(req.user.id);
    const groups = GroupRepository.getGroupsForUser(req.user.id);

    // OData / Tabular format optimized for direct Power BI Desktop query import
    res.json({
      '@odata.context': `${process.env.APP_URL || 'http://localhost:3000'}/api/powerbi/$metadata`,
      value: {
        dimensions: {
          userEmail: req.user.email,
          userName: req.user.name,
          currency: 'USD'
        },
        expenses: expenses.map(e => ({
          id: e.id,
          amount: e.amount,
          category: e.category,
          date: e.date,
          description: e.description,
          source: e.source
        })),
        budgets: budgets.map(b => ({
          id: b.id,
          period: b.period,
          category: b.category || 'Overall',
          amount: b.amount
        })),
        savings: goals.map(g => ({
          id: g.id,
          name: g.name,
          targetAmount: g.targetAmount,
          currentAmount: g.currentAmount,
          percent: (g.currentAmount / g.targetAmount) * 100
        })),
        groups: groups.map(g => ({
          id: g.id,
          name: g.name,
          createdAt: g.createdAt
        }))
      }
    });
  });


  // ==========================================
  // VITE DEV SERVER MIDDLEWARE & STATIC ASSETS
  // ==========================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FinPilot AI Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Critical server boot error:", err);
});
