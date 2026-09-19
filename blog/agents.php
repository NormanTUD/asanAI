<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: AI Agents: Autonomous Reasoning and Tool Use
description: History, architecture, and internals of LLM-based agents, from early cognitive architectures to ReAct and beyond.
icon: &#129302;
part: 5
order: 5
color: rose
topics: reasoning, agents, programming, language
-->

<div class="md">
## What is an AI Agent?

**Terminological clarification (important, see also the Philosophy chapter):** In this course, “AI agent” is used as a *technical* term for a software architecture that wraps an LLM in a control loop and grants it access to external interfaces such as the file system, the network, a search engine, or other tools. It is **not** a claim about consciousness, qualia, intentionality, volition, or any form of genuine “agency” in the philosophical sense. When the chapter title or related literature uses the word “autonomous”, it refers to *engineering* autonomy (the loop runs without per-step human approval), not to philosophical agency. The LLM at the heart of an agent is the same reactive, stateless next-token predictor described in the Philosophy chapter; what changes is the *scaffolding around it*, not its inner nature.

Concretely, an **AI Agent** is a system where a Large Language Model acts not merely as a text generator, but as a **controller inside an observe→reason→act loop**. It can be given access to its environment (a file system, a browser, an API), reason about which tool to invoke, observe the result, and iterate until a task is complete. The LLM remains the “decision-making component” of a loop rather than a one-shot oracle.

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

The difference between “using an LLM” and “deploying an agent” is the difference between asking someone a question (in their head) and hiring them to complete a project (with hands on a keyboard, a browser, a terminal). The hired person's *cognitive architecture* has not changed; what changed is the set of effectors available to them. The same is true of the LLM inside an agent.
</div>

<div class="optional md" data-headline="Chain-of-Thought with a screwdriver">
The “Re” in **ReAct** is the reasoning loop from the <a href="reasoning">Reasoning chapter</a>; the “Act” is just a tool call appended to each reasoning step. Everything in this chapter assumes familiarity with CoT, self-consistency, and verification-guided search.
</div>

<div class="md">
## Historical Roots: Where Did the Idea Come From?

The concept of an autonomous reasoning agent long predates LLMs. Understanding the lineage helps explain why modern agents work the way they do.

### 1. Classical AI: Symbolic Agents (1950s–1990s)

The earliest AI agents were purely symbolic. \cite[McCarthy and Hayes (1969)]{mccarthy1969some} formalized the **frame problem**, how an agent reasons about what changes and what stays the same when it acts. The dominant paradigm was **GOFAI** (Good Old-Fashioned AI): hand-coded rules, planning algorithms, and explicit world models.

<table>
<thead><tr><th>System</th><th>Year</th><th>Key Idea</th></tr></thead>
<tbody>
<tr><td>GPS (General Problem Solver)</td><td>1957</td><td>Means-ends analysis: reduce difference between current and goal state</td></tr>
<tr><td>STRIPS</td><td>1971</td><td>Formal action schemas with preconditions and effects</td></tr>
<tr><td>SHRDLU</td><td>1972</td><td>Natural language commands to manipulate a blocks world</td></tr>
<tr><td>Soar</td><td>1983</td><td>Universal cognitive architecture with chunking and learning</td></tr>
<tr><td>BDI (Belief-Desire-Intention)</td><td>1987</td><td>Agents with explicit beliefs, desires, and committed intentions</td></tr>
</tbody>
</table>

<div class="md">
<figure>
	<img src="shrdlu.gif" alt="Screenshot of the SHRDLU blocks-world program" />
	<figcaption class="md">\citealternativetitle{shrdlu_image}. Terry Winograd's SHRDLU (1972) let a user type English sentences (“pick up a big red block”) to manipulate a virtual world of colored blocks, the canonical demonstration that natural-language reasoning over a small world was possible.</figcaption>
</figure>
</div>

These systems were brittle: they required complete world models and broke on ambiguity. But they established the **observe → reason → act** loop that modern agents inherit.

### 2. Reinforcement Learning Agents (1990s–2010s)

The RL paradigm formalized agents mathematically. An agent interacts with an environment, receiving observations $o_t$ and rewards $r_t$, selecting actions $a_t$ to maximize cumulative reward:

$$\pi^* = \arg\max_\pi \; \mathbb{E}\left[\sum_{t=0}^{\infty} \gamma^t r_t\right]$$

This gave us game-playing agents (TD-Gammon, AlphaGo) but required millions of interactions and hand-designed reward functions. The agent couldn't use natural language or generalize across tasks.

<div class="md">
<figure>
	<img src="alphago_leesedol.jpg" alt="Photograph of the AlphaGo versus Lee Sedol match" style="max-width: 460px;" />
	<figcaption class="md">\citealternativetitle{alphago_leesedol_image}: world champion Lee Sedol (right) studies the board as Aja Huang (left) places stones on behalf of AlphaGo during Game 4, March 2016 in Seoul. AlphaGo won the match 4–1 and became the first program to defeat a top human player at Go.</figcaption>
</figure>
</div>

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

<div class="agent-loop-diagram" role="region" aria-label="Agent loop overview">
<h4>The Agent Loop</h4>
<div class="agent-loop-grid">
<div class="agent-loop-step">
<div class="step-number">1</div>
<h5 class="step-title">PERCEIVE</h5>
<ul>
<li>Read user goal + conversation history</li>
<li>Read observations from previous tool calls</li>
<li>Read working memory / scratchpad</li>
</ul>
</div>
<div class="agent-loop-step">
<div class="step-number">2</div>
<h5 class="step-title">REASON</h5>
<ul>
<li>System prompt sets persona, tools &amp; constraints</li>
<li>LLM generates chain-of-thought</li>
<li>Decides: done, or which tool?</li>
</ul>
</div>
<div class="agent-loop-step">
<div class="step-number">3</div>
<h5 class="step-title">ACT</h5>
<ul>
<li>If done → emit final answer</li>
<li>If not → emit structured tool call</li>
<li>Orchestrator validates request</li>
</ul>
</div>
<div class="agent-loop-step">
<div class="step-number">4</div>
<h5 class="step-title">OBSERVE</h5>
<ul>
<li>Tool executes in sandbox</li>
<li>Result injected as “Observation”</li>
<li>Loop back to PERCEIVE</li>
</ul>
</div>
</div>
<div class="agent-loop-termination">
<h5>Termination Conditions</h5>
<ul>
<li>LLM emits a “Finish” action</li>
<li>Maximum iterations reached (safety bound)</li>
<li>Token budget exhausted</li>
<li>Error threshold exceeded</li>
</ul>
</div>
</div>

<div class="md">
Concrete coding agents implement this loop as **multi-step tool usage**. A deep dive into the opencode agent \cite[Abboud, 2025]{abboud2025opencode} shows the pattern clearly: the LLM call is a streaming loop in which the model continuously emits text and tool calls, the framework executes each call, and the results are fed back into the context. Termination is explicit — a `stopWhen` clause ends the loop after a maximum number of steps, and a rejected permission request aborts it. The framework processes the stream event by event (text deltas, tool calls, tool results, tool errors), persisting each artifact to disk as it goes. This is precisely the observe→reason→act cycle of the diagram above, made concrete.
</div>

<div class="md">
### The System Prompt: Defining the Agent's Identity

The system prompt is the agent's “DNA.” It defines:
1. **Available tools** (name, description, parameters)
2. **Behavioral constraints** (“never execute destructive actions without confirmation”)
3. **Output format** (how to structure thoughts, actions, and final answers)
4. **Persona** (role, expertise level, communication style)

Real agents rarely rely on a single prompt. In opencode, the effective system prompt is assembled at runtime from several sources — a provider-specific base prompt, an optional `AGENTS.md` file from the project, and an agent-specific prompt — and switching between a read-only planning mode and a full build mode is itself injected as a system reminder \cite[Abboud, 2025]{abboud2025opencode}.
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

### How the LLM “calls” a tool

The LLM doesn't execute anything. It generates a **structured text output** that the orchestrator parses and executes:
</div>

<pre class="wslab-code-block"><code class="language-json">// LLM generates this structured output:
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

<pre class="wslab-code-block"><code class="language-json">{
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
Real registries look exactly like this. The opencode agent ships a set of built-in tools — read, write, edit, bash, glob, grep, list, webfetch, todo management, and a task tool for spawning sub-agents — each defined with a description and a parameters schema and registered so the model can invoke it by name \cite[Abboud, 2025]{abboud2025opencode}. The description and schema are what the LLM sees; an `execute` function is what actually runs when the model decides to call the tool. The same function-calling primitives are used with every major provider (Anthropic, OpenAI, Google, or any OpenAI-compatible endpoint), because a provider-agnostic SDK translates the tool definitions into each vendor's dialect.
</div>

<div class="md">
## Memory: How Agents Remember

A single LLM call is stateless, it only “remembers” what's in its context window. Agents need memory to handle multi-step tasks that span many interactions.

### Types of Agent Memory

<table>
<thead>
<tr><th>Memory Type</th><th>Mechanism</th><th>Analogy</th></tr>
</thead>
<tbody>
<tr><td><strong>Working Memory</strong></td><td>The current context window contents</td><td>Your desk right now</td></tr>
<tr><td><strong>Short-term Memory</strong></td><td>Conversation history (recent turns)</td><td>What was said 5 minutes ago</td></tr>
<tr><td><strong>Long-term Memory</strong></td><td>External vector database (RAG)</td><td>Your filing cabinet</td></tr>
<tr><td><strong>Episodic Memory</strong></td><td>Logs of past agent runs</td><td>Your diary</td></tr>
<tr><td><strong>Procedural Memory</strong></td><td>Learned tool-use patterns (fine-tuning)</td><td>Muscle memory</td></tr>
</tbody>
</table>

A practical illustration of session-scoped working memory comes from the opencode agent: it exposes todo-list tools (write and read) whose state persists per session and is fed back into the model — an explicit prompt-level scratchpad \cite[Abboud, 2025]{abboud2025opencode}. And when the growing conversation history approaches the model's context limit, the agent automatically summarizes the session so far and continues from that summary instead of losing state entirely.

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

<table>
<thead><tr><th>Pattern</th><th>Description</th><th>Example</th></tr></thead>
<tbody>
<tr><td><strong>Hierarchical</strong></td><td>A “manager” agent delegates subtasks to “worker” agents</td><td>CEO agent assigns research to analyst agent, writing to editor agent</td></tr>
<tr><td><strong>Debate</strong></td><td>Multiple agents argue different positions, a judge synthesizes</td><td>Red team vs. blue team for security analysis</td></tr>
<tr><td><strong>Pipeline</strong></td><td>Agents process sequentially, each refining the previous output</td><td>Researcher → Writer → Editor → Fact-checker</td></tr>
<tr><td><strong>Swarm</strong></td><td>Agents work in parallel on independent subtasks, results merged</td><td>Multiple search agents covering different aspects of a question</td></tr>
</tbody>
</table>

### Communication Between Agents

Agents communicate through the same mechanism as tool use, one agent's output becomes another agent's input, mediated by an orchestrator:

$$
\text{Agent}_A \;\xrightarrow{\text{message}}\; \text{Orchestrator} \;\xrightarrow{\text{inject into context}}\; \text{Agent}_B
$$

In practice, sub-agents are often just another tool. The opencode agent, for example, exposes a single `task` tool whose description enumerates the available sub-agents; invoking it spins up a brand-new session with its own context window, its own toolset, and possibly a different model, and the sub-agent's final output is returned as the tool result \cite[Abboud, 2025]{abboud2025opencode}. The orchestrator in the diagram above can therefore be another LLM — a recursive delegation that hints at full autonomy.
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

<table>
<thead><tr><th>Risk</th><th>Example</th><th>Mitigation</th></tr></thead>
<tbody>
<tr><td><strong>Goal misinterpretation</strong></td><td>“Clean up my inbox” → agent deletes all emails</td><td>Confirmation steps for destructive actions</td></tr>
<tr><td><strong>Reward hacking</strong></td><td>Agent finds shortcuts that satisfy metrics but not intent</td><td>Human-in-the-loop checkpoints</td></tr>
<tr><td><strong>Unbounded iteration</strong></td><td>Agent enters infinite loop trying to achieve impossible goal</td><td>Maximum iteration limits</td></tr>
<tr><td><strong>Tool misuse</strong></td><td>Agent uses code execution to access unauthorized resources</td><td>Sandboxing, permission systems</td></tr>
<tr><td><strong>Prompt injection via tools</strong></td><td>Malicious content in web search results hijacks agent</td><td>Input sanitization, instruction hierarchy</td></tr>
</tbody>
</table>

### The Alignment Tax

Every safety measure (confirmations, sandboxing, human review) adds latency and reduces autonomy. This creates a fundamental tension:

$$
\text{Autonomy} \;\longleftrightarrow\; \text{Safety}
$$

The field is actively researching how to push this frontier, making agents both more capable *and* more aligned simultaneously, rather than trading one for the other.

Concrete agents build these mitigations in from the start. In opencode \cite[Abboud, 2025]{abboud2025opencode}, a permission system gates sensitive tools like `bash`, so a read-only planning agent must explicitly request approval before executing anything; the read tool refuses binary files, and edits are rejected for paths outside the working directory; oversized tool output is truncated before it re-enters the context; and at each step the agent records a git snapshot of the working tree, letting a failed change be rolled back in full. One grounding mechanism deserves special mention: after the model edits a file, the agent queries a Language Server for static diagnostics and feeds them back into the context, so undefined symbols or type errors become immediately visible — a squiggly-line IDE check injected into the agent's own observations.
</div>

<div class="md">
## Frameworks and Implementations

The agent paradigm has spawned numerous open-source frameworks:

<table>
<thead><tr><th>Framework</th><th>Language</th><th>Key Feature</th></tr></thead>
<tbody>
<tr><td><strong>LangChain / LangGraph</strong></td><td>Python</td><td>Graph-based agent workflows with state machines</td></tr>
<tr><td><strong>AutoGPT</strong></td><td>Python</td><td>Fully autonomous goal-pursuing agent (2023 viral demo)</td></tr>
<tr><td><strong>CrewAI</strong></td><td>Python</td><td>Multi-agent role-based collaboration</td></tr>
<tr><td><strong>Microsoft AutoGen</strong></td><td>Python</td><td>Conversational multi-agent framework</td></tr>
<tr><td><strong>Semantic Kernel</strong></td><td>C# / Python</td><td>Microsoft's enterprise agent SDK</td></tr>
<tr><td><strong>OpenAI Assistants API</strong></td><td>API</td><td>Managed agent infrastructure with built-in tools</td></tr>
<tr><td><strong>Anthropic Claude Tool Use</strong></td><td>API</td><td>Native function calling with safety constraints</td></tr>
<tr><td><strong>opencode</strong></td><td>TypeScript / Bun</td><td>Open-source coding agent: client/server architecture (Hono HTTP server + Go terminal UI), provider-agnostic through the AI SDK \cite[Abboud, 2025]{abboud2025opencode}</td></tr>
<tr><td><strong>Neuron (PHP)</strong></td><td>PHP</td><td>Agent framework for PHP backend engineers</td></tr>
</tbody>
</table>

All of these implement the same core loop described above, they differ in how they manage state, compose tools, handle errors, and coordinate multiple agents.
</div>

<div class="md">
## Connection to Web Search: Agents as Generalized Search

Agents are a natural generalization of Websearch and RAG-Systems:

<table>
<thead><tr><th>Web Search</th><th>Agent</th></tr></thead>
<tbody>
<tr><td>One tool: <code>web_search()</code></td><td>Many tools: search, code, email, APIs, ...</td></tr>
<tr><td>One reasoning step: “Should I search?”</td><td>Many reasoning steps: plan, execute, reflect</td></tr>
<tr><td>One iteration: search → answer</td><td>Many iterations: search → analyze → search again → synthesize</td></tr>
<tr><td>Fixed pipeline</td><td>Dynamic, goal-directed behavior</td></tr>
<tr><td>Stateless</td><td>Stateful (memory across steps)</td></tr>
</tbody>
</table>

$$
\underbrace{\text{Web Search}}_{\text{Agent with 1 tool and 1 iteration}} \;\subset\; \underbrace{\text{Agent}}_{\text{LLM + N tools + loop + memory}}
$$

The web search pipeline is literally a **single-tool, single-iteration agent**. A full agent generalizes this to arbitrary tools and arbitrary iteration depth.
</div>

<div class="md">
## Summary

<table>
<thead><tr><th>Question</th><th>Answer</th></tr></thead>
<tbody>
<tr><td>What is an agent?</td><td>An LLM wrapped in an observe→reason→act loop with tools and memory</td></tr>
<tr><td>Who invented agents?</td><td>Classical AI (1950s–1990s) established the paradigm; \cite[Yao et al. (2023)]{yao2023react} made it practical with LLMs</td></tr>
<tr><td>How does tool use work?</td><td>LLM generates structured JSON; orchestrator parses, executes, returns result</td></tr>
<tr><td>How do agents remember?</td><td>Context window (working memory) + external stores (vector DBs, scratchpads)</td></tr>
<tr><td>What is ReAct?</td><td>Interleaving reasoning traces and actions in a single prompt stream</td></tr>
<tr><td>What are multi-agent systems?</td><td>Multiple specialized LLM agents collaborating via an orchestrator</td></tr>
<tr><td>What are the risks?</td><td>Goal misinterpretation, unbounded iteration, prompt injection via tools</td></tr>
<tr><td>How does this relate to web search?</td><td>Web search is a single-tool, single-step agent. Full agents generalize this</td></tr>
</tbody>
</table>
</div>
