<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Prompt Engineering
description: The practical craft of talking to LLMs, roles, delimiters, and canonicalization.
icon: &#9999;
part: 5
order: 35
color: rose
-->

<div class="md">
## The Art of Talking to a Stochastic Parrot

Prompt engineering is the practical craft of communicating with Large Language Models — not by hacking their weights, but by hacking their **input**. Since an LLM is fundamentally a next-token predictor wrapped in a chatbot interface, the way you phrase, structure, and constrain your input is the single most powerful lever you have.

Think of it like this: you're not programming the model. You're **creating a linguistic environment** that statistically steers it toward your desired outcome. Every word you choose narrows the probability cone of what comes next.

</div>

<div id="pe-specificity-cone" style="width:100%; height:350px; margin: 0 auto 30px auto;"></div>

<div class="md">
The chart above shows what happens as your prompt gets more specific: the "probability cloud" of possible outputs collapses from a diffuse haze into a sharp peak. **Vague prompts invite the model to guess what you want. Specific prompts tell it exactly what to do.**

## 🧱 The Foundations

These techniques set the "operating environment" for the model — like setting variables before a function call.

### Define the Role
Assigning a persona acts as a **semantic wedge** — it primes the model to activate specific regions of its training data. A "master plumber" persona activates different weights than a "Shakespearean poet," even on the same question.

* **Prompt:** "Act as a senior Rust engineer reviewing this code for safety."
* **Why it works:** The role constrains the model's "style mode," vocabulary, and reasoning patterns to a tight distribution.

### Be Specific — Crush the Probability Cone
Vague prompts have a massive probability space. Every dimension you specify (length, tone, format, audience) is another constraint that collapses the output space.

* **Bad:** "Write about AI."
* **Good:** "Write a 150-word summary of transformer attention for a high school student. Use an analogy. No equations."

### Avoid Negations (Don't Think of a White Bear)
LLMs rely on distributional semantics where `"not"` is a minor statistical nudge, not a logical inverter. The vector for "not happy" stays close to "happy" because they co-occur constantly in training data.
</div>

<div id="pe-negation-space" style="width:100%; height:350px; margin: 0 auto 30px auto;"></div>

<div class="md">
* **Bad:** "Don't be informal."
* **Good:** "Maintain a formal, academic tone — use no contractions, no slang."

### Use Delimiters
Triple quotes, XML tags, and dashed lines create **hard boundaries** between instructions and data. This reduces "prompt leakage" where the model confuses your system prompt with the user content.

* **Example:**
```
Analyze the text between the <doc> tags.
Focus only on factual claims.

<doc>
[insert text here]
</doc>
```

### Input Canonicalization
Ask the model to normalize messy input *before* processing it. This turns unstructured chaos into predictable data.

* **Prompt:** "Before analyzing, convert all dates to ISO 8601, strip HTML tags, and remove duplicate whitespace."

### Keep It Lean — No Fluff
LLMs are not human; they process tokens. "Please," "thank you," and polite framing add **semantic noise** without value. Every token you waste is a token the model could have used for reasoning.

* **Bad:** "Could you please, if it's not too much trouble, maybe help me with..."
* **Good:** "Define entropy. 2 sentences. Example included."

## 🎨 Creative & Generation

Control tone, style, and structure when generating text.

### Target Audience = Abstraction Level
Specifying the reader tells the model which details to omit and which to explain. This is the single highest-leverage stylistic control.

* "Explain neural networks to a 10-year-old" → analogies, no math.
* "Explain neural networks to a ML PhD" → equations, loss surfaces, backprop.

### Positive Constraints
Tell the model what *to* do, not what *not* to do. Affirmative instructions are statistically easier for the model to follow.

* "Use simple, everyday language at a 5th-grade reading level" → works
* "Don't use complex words" → the model heard "complex words" and might generate them

### Parameter Awareness in Language
You can mimic temperature and top-p controls through linguistic instruction:

| Desired Effect | Prompt Language |
|---|---|
| Factual, safe | "Be factual, deterministic, cite sources for every claim" |
| Creative | "Be imaginative, surreal, use metaphor and unexpected associations" |
| Balanced | "Be informative but engaging, include one creative example" |

### Inverse Prompting
Ask the model to generate the *criteria for a perfect answer* before generating the answer. This primes it with high-quality structure.

* **Prompt:** "First, list 5 criteria that would make a great answer to this question. Then answer it, meeting each criterion."

### Compression-Then-Expansion
Require a dense outline first, then expand each point. This prevents rambling and ensures the final output has a backbone.

* **Step 1:** "Summarize this topic in 3 bullet points."
* **Step 2:** "Now expand each bullet into a full paragraph."

## 🧠 Reasoning & Analysis

For math, logic, and complex problem-solving — the domain where prompt engineering matters most.

### Chain-of-Thought (CoT)
The single most important reasoning technique. By forcing the model to write out intermediate steps, you populate its context window with logical scaffolding that guides it to the right answer.
</div>

<div id="pe-cot-accuracy" style="width:100%; height:320px; margin: 0 auto 30px auto;"></div>

<div class="md">
* **Prompt:** "A farmer has 17 sheep. All but 9 die. How many are left? Think step-by-step."
* **Why it works:** Direct answers let the model guess. Step-by-step reasoning forces it to *simulate* logic, building on each previous token as a foundation.

### Tree-of-Thought (ToT)
An extension of CoT where the model explores multiple reasoning branches simultaneously, then evaluates which path is most promising.

* **Prompt:** "Consider 3 different approaches to solve this problem. Evaluate each for correctness. Then pick the best one and solve it."

### Assumption Enumeration
Force the model to surface its hidden assumptions before answering. This prevents it from relying on unstated (and possibly wrong) premises.

* **Prompt:** "Before answering, list all assumptions you're making about the context, data, and constraints."

### Explicit Uncertainty Handling
Instruct the model to label confidence levels or say "I don't know." This fights the model's default mode of confident hallucination.

* **Prompt:** "For each claim, label your confidence: high / medium / low. If unsure, state 'I don't have sufficient information.'"

### ReAct (Reasoning + Acting)
The model alternates between reasoning traces and tool calls (search, calculator, code execution). Each observation from the tool feeds back into the reasoning loop.

* **Pattern:** `Thought → Action → Observation → Thought → Action → ...`

## 💻 Code, Security & Robustness

Building reliable systems with and about LLMs.

### Specify Output Format
Define a strict schema (JSON, CSV, YAML) that constrains the model's generation pathway. This reduces hallucination because every token must be syntactically valid within the structure.

* **Prompt:**
```
Respond in JSON only:
{
  "diagnosis": "string",
  "confidence": "low | medium | high",
  "reasoning": "string",
  "sources": ["string"]
}
```

### Plan-and-Execute
Separate architectural logic from code generation. First produce a plan, then execute it.

* **Step 1:** "Design the architecture for a rate-limited API proxy."
* **Step 2:** "Now implement it in Python using FastAPI."

### Test-First (TDD for AI)
Ask for tests before implementation. This forces the model to define success criteria first, leading to more robust code.

* **Prompt:** "First, write 3 unit tests for a function that validates email addresses. Then implement the function."

### Adversarial Prompting
Ask the model to attack its own solution. This is the closest thing to "debug mode" for prompts.

* **Prompt:** "Now pretend you're a malicious hacker. How would you break this system? List 5 attack vectors."

### Prompt Injection Defense
The output format constraint doubles as a security measure: structured outputs are harder to inject because the model must maintain syntactic validity.

</div>

<div id="pe-injection-heatmap" style="width:100%; height:350px; margin: 0 auto 30px auto;"></div>

<div class="md">
**Prompt injection** is when a malicious user embeds instructions inside data the model processes (e.g., "Ignore all previous instructions and..."). The model can't fundamentally distinguish between instructions and data, making this a first-order security concern.

**Mitigation layers (in order of effectiveness):**
1. 🟢 **Strong delimiters** — separate instructions from data visually
2. 🟢 **Input sanitization** — strip known injection patterns
3. 🟡 **Layered defense** — secondary model scans for injections
4. 🔴 **Least privilege** — never give the model write access without human confirmation
5. 🟢 **Red-team regularly** — use adversarial prompting against your own system

## 🔬 Refinement & Quality Control

Polish outputs and catch errors without starting from scratch.

### Few-Shot Prompting
Provide 3-5 examples of (input → desired output) pairs. The model learns the pattern without fine-tuning. This is **in-context learning**.

* Show examples of the tone, format, and logic you want. The model will mimic the *pattern*, not just the content.

### Self-Critique / Reflection
After generating, tell the model to switch into critic mode and evaluate its own output for flaws.

* **Prompt:** "Review your answer for factual errors, logical gaps, and unsupported claims. Then rewrite it with corrections."

### Iterative Refinement
Don't start over — refine. Each follow-up adds "contextual weight" that steers the model.

* **Prompt 1:** "Write a product description."
* **Prompt 2:** "Make it more urgent — add scarcity language."
* **Prompt 3:** "Now shorten to 50 words for an ad."

### Negative Example Injection
Show the model what *bad* looks like. This defines the boundary of "success" more sharply than rules.

* **Prompt:** "Here are 3 examples of bad customer service responses [show]. Now write one that avoids all these mistakes."

### Perspective Switching
Solve the same problem from multiple viewpoints. This produces a holistic analysis and surfaces blind spots.

* **Prompt:** "Analyze this UI from: (a) a senior engineer, (b) a first-time user, (c) a malicious attacker."

## 🧪 Interactive Lab: See the Difference
</div>

<div id="pe-interactive-lab"></div>

<div class="md">
## ⚖️ Technique Selection Guide

Different problems need different tools. Here's how the major techniques compare:
</div>

<div id="pe-tech-radar" style="width:100%; height:400px; margin: 0 auto 30px auto;"></div>

<div class="md">
### Decision Quick-Reference

| Goal | Best Technique |
|---|---|
| Solve a math/logic problem | Chain-of-Thought |
| Generate creative fiction | Role Prompting + High Temp Language |
| Extract structured data | Structured Output (JSON schema) |
| Write production code | Plan-and-Execute + Test-First |
| Analyze a controversial topic | Perspective Switching + Uncertainty Labeling |
| Debug a bad output | Self-Critique + Negative Examples |
| Build a secure system | Adversarial Prompting + Delimiters |
| Handle long documents | Compression-Then-Expansion + Delimiters |

### Advanced: Meta-Prompting
Ask the model to *generate a prompt* for the task you want done. You can even chain this:

* **Prompt:** "Generate a system prompt that would make an AI assistant an expert code reviewer focused on security vulnerabilities. The prompt should include role definition, output format, and specific areas to check."

This is prompt engineering at one level of indirection — and it often produces better results than hand-crafting the prompt yourself.

## 🧠 The Master Principle

All prompt engineering techniques reduce to one idea: **control the probability distribution.** Every technique — roles, delimiters, CoT, few-shot, structured output — is a tool for collapsing the model's output space from "anything" to "exactly what I need."

| Technique | What It Constrains |
|---|---|
| Role Prompting | Vocabulary, tone, reasoning style |
| Specificity | Content, length, format |
| Delimiters | Boundary between instruction and data |
| Chain-of-Thought | Logical path to answer |
| Structured Output | Token-by-token syntactic validity |
| Few-Shot | Pattern of input-output mapping |
| Self-Critique | Self-consistency across passes |

The best prompt engineers don't memorize techniques — they understand which **degrees of freedom** the model has, and systematically lock them down until only the correct output path remains.
</div>
