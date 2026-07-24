<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: AI Agents: Autonomous Reasoning and Tool Use
description: History, architecture, and internals of LLM-based agents, from early cognitive architectures to ReAct and beyond.
icon: &#129302;
part: 5
order: 31
color: rose
-->

<div class="md">
## What is an AI Agent?

An **AI Agent** is a system where a Large Language Model acts not merely as a text generator, but as an autonomous **decision-maker** that can observe its environment, reason about goals, select and execute tools, and iterate until a task is complete. The LLM becomes the "brain" of a loop rather than a one-shot oracle.

$$
\begin{gathered}
\text{User Goal} \\
\downarrow \\
\text{Agent (LLM as Controller)} \\
\downarrow \hspace{5pt} \text{\scriptsize reason} \\
\text{Select Action / Tool} \\
\downarrow \hspace{5pt} \text{\scriptsize execute} \\
\text{Observe Result} \\
\downarrow \hspace{5pt} \text{\scriptsize iterate or finish} \\
\text{Final Answer}
\end{gathered}
$$

**Key insight:** A vanilla LLM generates text in a single forward pass. An **agent** wraps that LLM in a loop that gives it memory, tools, and the ability to act on the world, then feeds observations back in for the next reasoning step.

The difference between "using an LLM" and "deploying an agent" is the difference between asking someone a question and hiring them to complete a project.
</div>

<div class="md">
## Historical Roots: Where Did the Idea Come From?

The concept of an autonomous reasoning agent long predates LLMs. Understanding the lineage helps explain why modern agents work the way they do.

### 1. Classical AI: Symbolic Agents (1950s–1990s)

The earliest AI agents were purely symbolic. \cite[McCarthy and Hayes (1969)]{mccarthy1969some} formalized the **frame problem**, how an agent reasons about what changes and what stays the same when it acts. The dominant paradigm was **GOFAI** (Good Old-Fashioned AI): hand-coded rules, planning algorithms, and explicit world models.

| System | Year | Key Idea |
|--------|------|----------|
| GPS (General Problem Solver) | 1957 | Means-ends analysis: reduce difference between current and goal state |
| STRIPS | 1971 | Formal action schemas with preconditions and effects |
| SHRDLU | 1972 | Natural language commands to manipulate a blocks world |
| Soar | 1983 | Universal cognitive architecture with chunking and learning |
| BDI (Belief-Desire-Intention) | 1987 | Agents with explicit beliefs, desires, and committed intentions |

These systems were brittle: they required complete world models and broke on ambiguity. But they established the **observe → reason → act** loop that modern agents inherit.

### 2. Reinforcement Learning Agents (1990s–2010s)

The RL paradigm formalized agents mathematically. An agent interacts with an environment, receiving observations $o_t$ and rewards $r_t$, selecting actions $a_t$ to maximize cumulative reward:

$$\pi^* = \arg\max_\pi \; \mathbb{E}\left[\sum_{t=0}^{\infty} \gamma^t r_t\right]$$

This gave us game-playing agents (TD-Gammon, AlphaGo) but required millions of interactions and hand-designed reward functions. The agent couldn't use natural language or generalize across tasks.

### 3. The LLM Agent Revolution (2022–present)

The breakthrough insight, articulated in \cite[Yao et al., 2023]{yao2023react}, was that LLMs already encode vast world knowledge and can perform multi-step reasoning in natural language. Instead of learning a policy from scratch, you can use the LLM *as* the policy, prompting it to reason, select tools, and iterate.

This collapses the classical agent architecture into a single model that handles perception (reading text), reasoning (chain-of-thought), and action selection (tool calls) simultaneously.
</div>

<div class="md">
## The ReAct Paradigm: Reasoning + Acting

The most influential framework for LLM agents is **ReAct** (\cite[Yao et al., 2023]{yao2023react}), which interleaves **Re**asoning traces and **Act**ions in a single prompt stream:
</div>

<pre class="wslab-code-block"><code>Question: What is the elevation range for the area that the eastern
sector of the Colorado orogeny extends into?

Thought 1: I need to search Colorado orogeny, find the area that the
eastern sector extends into, then find the elevation range of that area.
Action 1: Search["Colorado orogeny"]
Observation 1: The Colorado orogeny was an episode of mountain building
(an orogeny) in Colorado and surrounding areas...

Thought 2: It does not mention the eastern sector. I need to look up
eastern sector.
Action 2: Lookup["eastern sector"]
Observation 2: The eastern sector extends into the High Plains.

Thought 3: The eastern sector extends into the High Plains. I need to
search High Plains and find its elevation range.
Action 3: Search["High Plains elevation range"]
Observation 3: The High Plains rise in elevation from around 460 m near
the eastern border to over 1,800 m at the foot of the Rocky Mountains.

Thought 4: High Plains rise from around 460 m to over 1,800 m, so the
elevation range is approximately 1,340 m.
Action 4: Finish["approximately 1,340 m"]</code></pre>

<div class="md">
The key innovation is that **Thought** and **Action** alternate in the same token stream. The LLM generates both its internal reasoning *and* its tool calls as text. The orchestrator parses the actions, executes them, and injects the observations back into the context.

$$
\underbrace{\text{Thought}_t}_{\text{LLM generates reasoning}} \;\rightarrow\; \underbrace{\text{Action}_t}_{\text{LLM emits tool call}} \;\rightarrow\; \underbrace{\text{Observation}_t}_{\text{Environment returns result}} \;\rightarrow\; \text{Thought}_{t+1} \;\rightarrow\; \cdots
$$

### Why interleaving matters

\cite[Yao et al. (2023)]{yao2023react} showed that:
- **Reasoning without acting** (chain-of-thought alone) hallucinates facts it cannot verify.
- **Acting without reasoning** (tool use without explicit thought) makes incoherent tool choices.
- **ReAct** (both together) achieves the best of both worlds: grounded, interpretable, multi-step problem solving.
</div>

<div class="md">
## The Agent Loop: Internal Architecture

Every LLM agent, regardless of framework, implements a variant of this loop:
</div>

<pre class="wslab-code-block"><code>┌─────────────────────────────────────────────────────────────────┐
│                        AGENT LOOP                               │
│                                                                 │
│  1. PERCEIVE                                                    │
│     • Read user goal + conversation history                     │
│     • Read observations from previous tool calls                │
│     • Read contents of working memory / scratchpad              │
│                                                                 │
│  2. REASON (LLM Forward Pass)                                   │
│     • System prompt defines persona, tools, constraints         │
│     • LLM generates chain-of-thought reasoning                  │
│     • LLM decides: "Am I done?" or "What tool do I need?"      │
│                                                                 │
│  3. ACT                                                         │
│     • If done → emit final answer, exit loop                    │
│     • If not → emit structured tool call (function calling)     │
│                                                                 │
│  4. OBSERVE                                                     │
│     • Orchestrator executes the tool call                       │
│     • Result is injected into context as "Observation"          │
│     • Loop back to step 1                                       │
│                                                                 │
│  TERMINATION CONDITIONS:                                        │
│     • LLM emits "Finish" action                                 │
│     • Maximum iterations reached (safety bound)                 │
│     • Token budget exhausted                                    │
│     • Error threshold exceeded                                  │
└─────────────────────────────────────────────────────────────────┘</code></pre>

<div class="md">
### The System Prompt: Defining the Agent's Identity

The system prompt is the agent's "DNA." It defines:
1. **Available tools** (name, description, parameters)
2. **Behavioral constraints** ("never execute destructive actions without confirmation")
3. **Output format** (how to structure thoughts, actions, and final answers)
4. **Persona** (role, expertise level, communication style)
</div>

<pre class="wslab-code-block"><code>You are a research assistant agent. You have access to the following tools:

1. web_search(query: str) → Search the web for current information
2. read_url(url: str) → Fetch and read the contents of a webpage
3. calculator(expression: str) → Evaluate a mathematical expression
4. python_exec(code: str) → Execute Python code in a sandbox

For each step, output your reasoning as "Thought: ..." then your action
as "Action: tool_name(arguments)". When you have enough information to
answer the user's question, use "Action: finish(answer)".

Rules:
- Always verify claims with web_search before stating them as fact
- Never execute code that modifies the filesystem
- If uncertain after 5 attempts, say so honestly
- Cite sources for factual claims</code></pre>

<div class="md">
## Tool Use: The Mechanism in Detail

Tool use (also called **function calling**) is the bridge between the LLM's text world and the real world. The mechanism works identically to what was described in the web search chapter, but generalized to arbitrary tools.

### How the LLM "calls" a tool

The LLM doesn't execute anything. It generates a **structured text output** that the orchestrator parses and executes:
</div>

<pre class="wslab-code-block"><code>// LLM generates this structured output:
{
  "thought": "I need to find the current population of Tokyo to answer this.",
  "action": {
    "tool": "web_search",
    "arguments": {
      "query": "Tokyo population 2026"
    }
  }
}

// Orchestrator:
// 1. Parses the JSON
// 2. Validates the tool name exists
// 3. Validates the arguments match the schema
// 4. Executes: web_search("Tokyo population 2026")
// 5. Gets result: "Tokyo's population in 2026 is approximately 13.96 million..."
// 6. Injects into context:
//    Observation: "Tokyo's population in 2026 is approximately 13.96 million..."
// 7. Calls LLM again with updated context</code></pre>

<div class="md">
### The Tool Registry

Tools are defined as JSON schemas that the LLM sees in its system prompt:
</div>

<pre class="wslab-code-block"><code>{
  "tools": [
    {
      "name": "web_search",
      "description": "Search the internet for current information",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "The search query"
          }
        },
        "required": ["query"]
      }
    },
    {
      "name": "python_exec",
      "description": "Execute Python code in a sandboxed environment",
      "parameters": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "description": "Python code to execute"
          }
        },
        "required": ["code"]
      }
    },
    {
      "name": "send_email",
      "description": "Send an email to a specified recipient",
      "parameters": {
        "type": "object",
        "properties": {
          "to": { "type": "string" },
          "subject": { "type": "string" },
          "body": { "type": "string" }
        },
        "required": ["to", "subject", "body"]
      }
    }
  ]
}</code></pre>

<div class="md">
## Memory: How Agents Remember

A single LLM call is stateless, it only "remembers" what's in its context window. Agents need memory to handle multi-step tasks that span many interactions.

### Types of Agent Memory

| Memory Type | Mechanism | Analogy |
|-------------|-----------|---------|
| **Working Memory** | The current context window contents | Your desk right now |
| **Short-term Memory** | Conversation history (recent turns) | What was said 5 minutes ago |
| **Long-term Memory** | External vector database (RAG) | Your filing cabinet |
| **Episodic Memory** | Logs of past agent runs | Your diary |
| **Procedural Memory** | Learned tool-use patterns (fine-tuning) | Muscle memory |

### The Scratchpad Pattern

Many agent frameworks give the LLM a **scratchpad**, a section of the prompt where it can write intermediate results that persist across iterations:
</div>

<pre class="wslab-code-block"><code>=== SCRATCHPAD (persists across steps) ===
- User wants: comparison of React vs Vue for a new project
- Found React info: 18.2M weekly npm downloads, component-based, JSX
- Found Vue info: 4.1M weekly npm downloads, template-based, SFC
- Still need: performance benchmarks, learning curve comparison
=== END SCRATCHPAD ===</code></pre>

<div class="md">
## Multi-Agent Systems

A single agent has limits: context window size, expertise breadth, and the tendency to lose focus on long tasks. **Multi-agent systems** address this by having multiple specialized agents collaborate.

### Architectures

| Pattern | Description | Example |
|---------|-------------|---------|
| **Hierarchical** | A "manager" agent delegates subtasks to "worker" agents | CEO agent assigns research to analyst agent, writing to editor agent |
| **Debate** | Multiple agents argue different positions, a judge synthesizes | Red team vs. blue team for security analysis |
| **Pipeline** | Agents process sequentially, each refining the previous output | Researcher → Writer → Editor → Fact-checker |
| **Swarm** | Agents work in parallel on independent subtasks, results merged | Multiple search agents covering different aspects of a question |

### Communication Between Agents

Agents communicate through the same mechanism as tool use, one agent's output becomes another agent's input, mediated by an orchestrator:

$$
\text{Agent}_A \;\xrightarrow{\text{message}}\; \text{Orchestrator} \;\xrightarrow{\text{inject into context}}\; \text{Agent}_B
$$
</div>

<div class="md">
## Planning: How Agents Decompose Complex Tasks

Naive agents attempt tasks step-by-step without foresight. More sophisticated agents **plan** before acting, decomposing complex goals into subtasks.

### Plan-and-Execute (\cite[Wang et al., 2023]{wang2023planandexecute})

The agent first generates a complete plan, then executes each step:
</div>

<pre class="wslab-code-block"><code>User: Write a blog post comparing the environmental impact of
electric vs. hydrogen vehicles, with citations.

Plan:
1. Search for lifecycle emissions data for electric vehicles
2. Search for lifecycle emissions data for hydrogen vehicles
3. Search for manufacturing impact comparison
4. Search for infrastructure requirements
5. Synthesize findings into a structured blog post
6. Add inline citations from the sources found
7. Review for accuracy and coherence

Executing Step 1...
Executing Step 2...
[Re-planning: Step 2 revealed that hydrogen production method matters
significantly. Adding sub-step: research green vs. grey hydrogen.]
...</code></pre>

<div class="md">
### Reflexion: Learning from Mistakes (\cite[Shinn et al., 2023]{shinn2023reflexion})

\cite[Reflexion]{shinn2023reflexion} adds a self-evaluation step: after completing a task, the agent reflects on what went wrong and stores that reflection in memory for future attempts.

$$
\text{Attempt}_1 \;\rightarrow\; \text{Evaluate (fail)} \;\rightarrow\; \text{Reflect} \;\rightarrow\; \text{Store reflection} \;\rightarrow\; \text{Attempt}_2 \text{ (with reflection in context)}
$$
</div>

<div class="md">
## Grounding and Safety: The Hard Problems

### The Grounding Problem

An agent that can act on the world (send emails, execute code, make purchases) must be **grounded**, its actions must correspond to the user's actual intent. Misalignment between the user's goal and the agent's interpretation can cause real harm.

| Risk | Example | Mitigation |
|------|---------|------------|
| **Goal misinterpretation** | "Clean up my inbox" → agent deletes all emails | Confirmation steps for destructive actions |
| **Reward hacking** | Agent finds shortcuts that satisfy metrics but not intent | Human-in-the-loop checkpoints |
| **Unbounded iteration** | Agent enters infinite loop trying to achieve impossible goal | Maximum iteration limits |
| **Tool misuse** | Agent uses code execution to access unauthorized resources | Sandboxing, permission systems |
| **Prompt injection via tools** | Malicious content in web search results hijacks agent | Input sanitization, instruction hierarchy |

### The Alignment Tax

Every safety measure (confirmations, sandboxing, human review) adds latency and reduces autonomy. This creates a fundamental tension:

$$
\text{Autonomy} \;\longleftrightarrow\; \text{Safety}
$$

The field is actively researching how to push this frontier, making agents both more capable *and* more aligned simultaneously, rather than trading one for the other.
</div>

<div class="md">
## Frameworks and Implementations

The agent paradigm has spawned numerous open-source frameworks:

| Framework | Language | Key Feature |
|-----------|----------|-------------|
| **LangChain / LangGraph** | Python | Graph-based agent workflows with state machines |
| **AutoGPT** | Python | Fully autonomous goal-pursuing agent (2023 viral demo) |
| **CrewAI** | Python | Multi-agent role-based collaboration |
| **Microsoft AutoGen** | Python | Conversational multi-agent framework |
| **Semantic Kernel** | C# / Python | Microsoft's enterprise agent SDK |
| **OpenAI Assistants API** | API | Managed agent infrastructure with built-in tools |
| **Anthropic Claude Tool Use** | API | Native function calling with safety constraints |
| **Neuron (PHP)** | PHP | Agent framework for PHP backend engineers |

All of these implement the same core loop described above, they differ in how they manage state, compose tools, handle errors, and coordinate multiple agents.
</div>

<div class="md">
## Connection to Web Search: Agents as Generalized Search

If you understood the \cite[web search chapter]{websearch}, agents are a natural generalization:

| Web Search | Agent |
|------------|-------|
| One tool: `web_search()` | Many tools: search, code, email, APIs, ... |
| One reasoning step: "Should I search?" | Many reasoning steps: plan, execute, reflect |
| One iteration: search → answer | Many iterations: search → analyze → search again → synthesize |
| Fixed pipeline | Dynamic, goal-directed behavior |
| Stateless | Stateful (memory across steps) |

$$
\underbrace{\text{Web Search}}_{\text{Agent with 1 tool and 1 iteration}} \;\subset\; \underbrace{\text{Agent}}_{\text{LLM + N tools + loop + memory}}
$$

The web search pipeline from the previous chapter is literally a **single-tool, single-iteration agent**. A full agent generalizes this to arbitrary tools and arbitrary iteration depth.
</div>

<div class="md">
## Summary

| Question | Answer |
|----------|--------|
| What is an agent? | An LLM wrapped in an observe→reason→act loop with tools and memory |
| Who invented agents? | Classical AI (1950s–1980s) established the paradigm; \cite[Yao et al. (2023)]{yao2023react} made it practical with LLMs |
| How does tool use work? | LLM generates structured JSON; orchestrator parses, executes, returns result |
| How do agents remember? | Context window (working memory) + external stores (vector DBs, scratchpads) |
| What is ReAct? | Interleaving reasoning traces and actions in a single prompt stream |
| What are multi-agent systems? | Multiple specialized LLM agents collaborating via an orchestrator |
| What are the risks? | Goal misinterpretation, unbounded iteration, prompt injection via tools |
| How does this relate to web search? | Web search is a single-tool, single-step agent. Full agents generalize this |
</div>
