import { StateGraph, Annotation } from "@langchain/langgraph";
import { 
  runAutonomousAdvisorAgent, runPredictiveFinanceAgent,
  runFinancialHealthMonitorAgent, runFinancialCoachAgent,
  runInteractiveAssistant, runFinancialCopilotPlanner
} from "./gemini";
import { Expense, Budget, SavingsGoal, BillReminder } from "../src/types";

// Define the comprehensive state model for the financial Graph
export const FinancialGraphState = Annotation.Root({
  userId: Annotation<string>(),
  expenses: Annotation<Expense[]>(),
  budgets: Annotation<Budget[]>(),
  goals: Annotation<SavingsGoal[]>(),
  reminders: Annotation<BillReminder[]>(),
  userPrefs: Annotation<any>(),
  
  // Specific query inputs
  query: Annotation<string>(),
  history: Annotation<{ sender: 'user' | 'assistant'; text: string }[]>(),
  goalText: Annotation<string>(),
  
  // Routing instructions
  selectedAgent: Annotation<string>(), // e.g. "advisor" | "predictive" | "planner" | "health" | "coach" | "assistant"
  
  // Intermediary / result nodes
  advisorResult: Annotation<any>(),
  predictiveResult: Annotation<any>(),
  plannerResult: Annotation<any>(),
  healthResult: Annotation<any>(),
  coachResult: Annotation<any>(),
  assistantResult: Annotation<any>(),
  
  // Final consolidated outcome
  finalOutput: Annotation<any>()
});

// Implement Agent Nodes
async function routerNode(state: typeof FinancialGraphState.State) {
  const selected = state.selectedAgent || "advisor";
  console.log(`[LangGraph Router] Routing request to node: ${selected} for user: ${state.userId}`);
  return { selectedAgent: selected };
}

async function advisorNode(state: typeof FinancialGraphState.State) {
  console.log(`[LangGraph Node] Executing Autonomous Advisor for user ${state.userId}`);
  try {
    const result = await runAutonomousAdvisorAgent(
      state.expenses || [],
      state.budgets || [],
      state.userPrefs || {}
    );
    return { advisorResult: result };
  } catch (err: any) {
    console.error("[LangGraph Node] Error in advisorNode:", err);
    return { advisorResult: { error: err.message || "Advisor failed" } };
  }
}

async function predictiveNode(state: typeof FinancialGraphState.State) {
  console.log(`[LangGraph Node] Executing Predictive Finance forecaster for user ${state.userId}`);
  try {
    const result = await runPredictiveFinanceAgent(
      state.expenses || [],
      state.budgets || [],
      state.goals || [],
      state.reminders || [],
      state.userPrefs || {}
    );
    return { predictiveResult: result };
  } catch (err: any) {
    console.error("[LangGraph Node] Error in predictiveNode:", err);
    return { predictiveResult: { error: err.message || "Predictive failed" } };
  }
}

async function plannerNode(state: typeof FinancialGraphState.State) {
  console.log(`[LangGraph Node] Executing Copilot Planner for user ${state.userId} with goal: ${state.goalText}`);
  try {
    const result = await runFinancialCopilotPlanner(
      state.goalText || "Save Money",
      state.expenses || [],
      state.budgets || [],
      state.goals || [],
      state.reminders || []
    );
    return { plannerResult: result };
  } catch (err: any) {
    console.error("[LangGraph Node] Error in plannerNode:", err);
    return { plannerResult: { error: err.message || "Planner failed" } };
  }
}

async function healthNode(state: typeof FinancialGraphState.State) {
  console.log(`[LangGraph Node] Executing Financial Health Monitor for user ${state.userId}`);
  try {
    const result = await runFinancialHealthMonitorAgent(
      state.expenses || [],
      state.budgets || [],
      state.goals || [],
      state.reminders || [],
      state.userPrefs || {}
    );
    return { healthResult: result };
  } catch (err: any) {
    console.error("[LangGraph Node] Error in healthNode:", err);
    return { healthResult: { error: err.message || "Health monitor failed" } };
  }
}

async function coachNode(state: typeof FinancialGraphState.State) {
  console.log(`[LangGraph Node] Executing Financial Coach for user ${state.userId}`);
  try {
    const result = await runFinancialCoachAgent(
      state.expenses || [],
      state.budgets || [],
      state.userPrefs || {}
    );
    return { coachResult: result };
  } catch (err: any) {
    console.error("[LangGraph Node] Error in coachNode:", err);
    return { coachResult: { error: err.message || "Coach failed" } };
  }
}

async function assistantNode(state: typeof FinancialGraphState.State) {
  console.log(`[LangGraph Node] Executing Interactive Assistant chat for user ${state.userId}`);
  try {
    const financialContext = {
      expensesCount: (state.expenses || []).length,
      recentExpenses: (state.expenses || []).slice(-5),
      activeBudgets: state.budgets || [],
      activeGoals: state.goals || [],
      activeReminders: state.reminders || []
    };
    const result = await runInteractiveAssistant(
      state.query || "Hello FinPilot",
      state.history || [],
      financialContext
    );
    return { assistantResult: result };
  } catch (err: any) {
    console.error("[LangGraph Node] Error in assistantNode:", err);
    return { assistantResult: `Chat model encountered an error: ${err.message}` };
  }
}

async function consolidateNode(state: typeof FinancialGraphState.State) {
  console.log(`[LangGraph Node] Consolidating multi-agent state results for user ${state.userId}`);
  let finalResult = null;
  switch (state.selectedAgent) {
    case "advisor":
      finalResult = state.advisorResult;
      break;
    case "predictive":
      finalResult = state.predictiveResult;
      break;
    case "planner":
      finalResult = state.plannerResult;
      break;
    case "health":
      finalResult = state.healthResult;
      break;
    case "coach":
      finalResult = state.coachResult;
      break;
    case "assistant":
      finalResult = state.assistantResult;
      break;
    default:
      finalResult = { status: "success", msg: "No active agent output collected." };
  }
  return { finalOutput: finalResult };
}

// Assemble the graph with defined edges & state routes
const workflow = new StateGraph(FinancialGraphState)
  .addNode("router", routerNode)
  .addNode("advisor", advisorNode)
  .addNode("predictive", predictiveNode)
  .addNode("planner", plannerNode)
  .addNode("health", healthNode)
  .addNode("coach", coachNode)
  .addNode("assistant", assistantNode)
  .addNode("consolidate", consolidateNode)
  
  .addEdge("__start__", "router")
  
  .addConditionalEdges("router", (state) => {
    return state.selectedAgent || "advisor";
  })
  
  .addEdge("advisor", "consolidate")
  .addEdge("predictive", "consolidate")
  .addEdge("planner", "consolidate")
  .addEdge("health", "consolidate")
  .addEdge("coach", "consolidate")
  .addEdge("assistant", "consolidate")
  
  .addEdge("consolidate", "__end__");

export const financialGraph = workflow.compile();

// Export unified high-level invoker for route hand-offs
export async function runLangGraphDecisionEngine(input: Partial<typeof FinancialGraphState.State>) {
  console.log(`[LangGraph Execution] Starting financial Graph for agent: ${input.selectedAgent}`);
  const finalState = await financialGraph.invoke({
    userId: input.userId || "anonymous",
    expenses: input.expenses || [],
    budgets: input.budgets || [],
    goals: input.goals || [],
    reminders: input.reminders || [],
    userPrefs: input.userPrefs || {},
    query: input.query || "",
    history: input.history || [],
    goalText: input.goalText || "",
    selectedAgent: input.selectedAgent || "advisor"
  });
  return finalState.finalOutput;
}
