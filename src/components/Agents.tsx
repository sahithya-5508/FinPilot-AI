/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ShieldCheck, Activity, BarChart, BellRing, Target, 
  Brain, FileText, Volume2, RefreshCw, ChevronRight, Award, Flame, AlertCircle, HeartPulse 
} from 'lucide-react';
import { motion } from 'motion/react';

interface AgentsProps {
  userName?: string;
  token: string;
  onRefresh: () => void;
}

export default function Agents({ userName, token, onRefresh }: AgentsProps) {
  const [activeAgentId, setActiveAgentId] = useState('health_score_agent');
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<any>(null);

  // Agent descriptions & visual styling definitions
  const agents = [
    { id: 'health_score_agent', name: 'Financial Health Score Agent', icon: HeartPulse, color: 'text-rose-500 bg-rose-50', desc: 'Analyzes savings rates and budget adherence to formulate a personal health index index (0-100).' },
    { id: 'analyst_agent', name: 'Financial Analyst Agent', icon: BarChart, color: 'text-blue-500 bg-blue-50', desc: 'Performs full cashflow diagnostics, outlining overspending categories and core financial anomalies.' },
    { id: 'behaviour_agent', name: 'Spending Behaviour Agent', icon: Flame, color: 'text-orange-500 bg-orange-50', desc: 'Unlocks purchase behavior trends, identifying Thursday spikes or high-amount weekend bursts.' },
    { id: 'recommendation_agent', name: 'Recommendation Agent', icon: Brain, color: 'text-purple-500 bg-purple-50', desc: 'Formulates personalized, high-value capital allocation and savings advice to maximize investment velocity.' },
    { id: 'smart_alert_agent', name: 'Smart Alert Agent', icon: AlertCircle, color: 'text-amber-500 bg-amber-50', desc: 'Monitors ongoing category budgets, highlighting overruns, critical thresholds, and runaway trends.' },
    { id: 'goal_agent', name: 'Goal Tracking Agent', icon: Target, color: 'text-emerald-500 bg-emerald-50', desc: 'Calculates compound interest goals and predicts exact date timelines based on average monthly savings rates.' },
    { id: 'bill_agent', name: 'Bill Reminder Agent', icon: BellRing, color: 'text-purple-500 bg-purple-50', desc: 'Tracks recurring bill payments and schedules lead times for upcoming utilities.' }
  ];

  // Fetch past insights on mount
  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const res = await fetch('/api/insights', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setInsights(data);
        // Set the active analysis if it exists
        const latest = data.find((ins: any) => ins.agentId === activeAgentId);
        if (latest) {
          setActiveAnalysis(latest);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Run Agent
  const handleRunAgent = async (id: string) => {
    setLoading(true);
    setActiveAnalysis(null);

    // Standard parameters depending on agent type
    let parameters: any = {};

    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          agentId: id,
          parameters
        })
      });

      const data = await res.json();
      if (res.ok && data.insight) {
        setActiveAnalysis(data.insight);
        fetchInsights();
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Change active agent tab
  const handleSelectAgent = (agentId: string) => {
    setActiveAgentId(agentId);
    const cached = insights.find(ins => ins.agentId === agentId);
    setActiveAnalysis(cached || null);
  };

  const activeAgent = agents.find(a => a.id === activeAgentId)!;

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Advisor Agents</h1>
        <p className="text-xs text-slate-500">Deploy FinPilot's 7 dedicated autonomous agents to unlock deep wealth intelligence.</p>
      </div>

      {/* 2. Grid UI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Selector Column */}
        <div className="space-y-3 lg:col-span-1">
          <h3 className="font-bold text-slate-800 text-sm">FinPilot Advisor Suite</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {agents.map((agent) => {
              const Icon = agent.icon;
              const isActive = activeAgentId === agent.id;
              return (
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectAgent(agent.id)}
                  key={agent.id}
                  className={`p-3 border rounded-2xl cursor-pointer shadow-sm transition flex items-center gap-3.5 ${
                    isActive 
                      ? 'bg-purple-50/50 border-purple-200' 
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${agent.color}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-xs truncate">{agent.name}</h4>
                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{agent.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Diagnostic Workspace */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 h-full flex flex-col justify-between min-h-[450px]">
            {/* Workspace Header */}
            <div>
              <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                <span className={`h-11 w-11 rounded-2xl flex items-center justify-center ${activeAgent.color}`}>
                  <activeAgent.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{activeAgent.name}</h3>
                  <span className="text-[10px] text-slate-400 font-medium capitalize">Advisor State: Autonomous & Online</span>
                </div>
              </div>

              {/* Workspace Content */}
              <div className="py-5 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 rounded-xl p-3 border border-slate-200/50">
                  {activeAgent.desc}
                </p>

                {loading ? (
                  <div className="space-y-3 py-4">
                    <div className="h-4 bg-slate-100 rounded-full w-2/3 animate-pulse"></div>
                    <div className="h-4 bg-slate-100 rounded-full animate-pulse"></div>
                    <div className="h-4 bg-slate-100 rounded-full w-4/5 animate-pulse"></div>
                  </div>
                ) : activeAnalysis ? (
                  <div className="space-y-4">
                    <div className="bg-purple-50/30 border border-purple-100/50 rounded-2xl p-4 space-y-3">
                      <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        {activeAnalysis.title}
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {activeAnalysis.insight}
                      </p>
                      
                      {activeAnalysis.score !== undefined && (
                        <div className="pt-2 flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Performance Rating Index:</span>
                          <span className="text-sm font-black text-rose-500 bg-rose-50/50 px-2 py-0.5 rounded-md">
                            {activeAnalysis.score} / 100
                          </span>
                        </div>
                      )}
                    </div>

                    {activeAnalysis.recommendations?.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actionable Projections</h5>
                        <div className="space-y-2">
                          {activeAnalysis.recommendations.map((rec: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50/50 py-2.5 px-3 rounded-xl border border-slate-200/50">
                              <span className="h-5 w-5 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <p className="flex-1 font-medium">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    <Brain className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs">Hey {userName || 'User'}, no active advisor diagnostic logged for today. Deploy the agent below.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Trigger */}
            <div className="pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleRunAgent(activeAgentId)}
                disabled={loading}
                className="w-full inline-flex items-center justify-center px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm transition"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2 text-purple-200" />
                )}
                {loading ? 'Analyzing...' : `Hey ${userName || 'User'}, trigger advisor diagnostic analysis`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
