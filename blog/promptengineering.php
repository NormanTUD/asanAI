<?php include_once("functions.php"); ?>

<div class="md">
## Foundational Structure
*Use these to set the "environment" and prepare the input data.*

### Define the Role
* **How it works:** Assigning a persona acts as a "system anchor" or semantic wedge. It primes the model to prioritize specific subsets of training data (e.g., technical documentation vs. creative fiction) and adopt the associated vocabulary, biases, and reasoning patterns of that persona.
* **When to use:** Use at the very start to set expertise and context. It is particularly effective when you need the model to simulate a specific worldview or professional standard.
* **Example:** "Act as a master plumber with 30 years of experience. You focus on code compliance and practical, durable repairs rather than quick fixes."

### Be Specific
* **How it works:** Vague prompts have a massive "probability space," leading to generic outputs. Specificity narrows this cone of possibilities, forcing the model to select tokens that align with exact parameters regarding length, tone, format, and content. The less you leave to interpretation, the higher the quality.
* **When to use:** Use when you have a rigid vision of the outcome or need to integrate the output into a specific workflow.
* **Example:** Instead of "Write a story," use "Write a 200-word suspenseful story about a cat named Slimer who discovers a portal in a kitchen cabinet."

### Use Delimiters
* **How it works:** Delimiters (like triple quotes, XML tags, or dashed lines) create distinct boundaries in the prompt. This prevents the AI from confusing your instructions (the "system" message) with the data it needs to process (the "user" content), reducing prompt injection risks and confusion.
* **When to use:** Essential when pasting long text, code blocks, or articles that need analysis or summarization.
* **Example:** "Summarize the text delimited by triple quotes below. Do not include any outside information. Text: '''[Insert text here]'''"

### Input Canonicalization
* **How it works:** Instruct the model to rewrite, normalize, or clean noisy input into a standard, structured form before attempting to process or analyze it. This turns unstructured chaos into predictable data.
* **When to use:** Use for noisy, user-generated, or multilingual data handling, or when inputs have inconsistent formatting (e.g., different date formats).
* **Example:** "Before analyzing the data, convert all dates to ISO 8601 format and remove all non-alphanumeric characters from the subject lines."

### Don't say "please" and "thank you", be as short and precise as possible
* **Why does it work?** LLMs are not human; they process tokens. Politeness adds "noise" to the context window and consumes token limits without adding semantic value. Concise instructions increase the "signal-to-noise" ratio, making it less likely the model will drift from the core command.
* **When to use:** Always, but especially in system prompts or when using models with smaller context windows/higher costs.

## Text Generation & Creative Work
*Use these to control tone, style, and structure.*

### Assign a Target Audience
* **How it works:** Adjusts the "abstraction level" and vocabulary complexity. By specifying the reader, you implicitly tell the model which details to omit (assumed knowledge) and which to explain deeply.
* **When to use:** Use to tailor explanations for specific impact (e.g., "Explain quantum computing to a Venture Capitalist" vs. "Explain it to a Physics PhD student").

### Positive Constraints
* **How it works:** Telling the model what *to* do (affirmative constraints) is cognitively easier for the model than processing what *not* to do (negative constraints). Negative constraints often lead to the "don't think of a white bear" phenomenon, where the model accidentally generates the forbidden content.
* **When to use:** Use to fix style issues. Instead of "Don't use complex words," say "Use simple, everyday language at a 5th-grade reading level."

### Parameter Awareness
* **How it works:** Using descriptive adjectives (e.g., "highly creative," "surreal," "precise," "standard," "deterministic") helps mimic the effect of changing technical parameters like Temperature or Top-P. It guides the model on how "risky" its token selection should be.
* **When to use:** Use to control the hallucination risk vs. creativity of the output. Use "factual and dry" for reports, and "imaginative and whimsical" for brainstorming.

### Inverse Prompting
* **How it works:** Ask the model to generate the "rubric" or criteria for a perfect answer *before* it generates the answer itself. This primes the model with high-quality structure and sets a standard for it to follow.
* **When to use:** Use when you are unsure exactly what you want but know the "vibe" or quality standard required, or when you are stuck on how to articulate a complex request.

### Compression-Then-Expansion
* **How it works:** First, require an ultra-dense summary or bulleted outline of the topic. Then, instruct the model to expand each point into full paragraphs. This ensures the final long-form content has a strong narrative backbone and prevents the model from rambling or losing the plot halfway through.
* **When to use:** Use for generating long-form content like essays, books, or comprehensive documentation to ensure consistency.

## Logic, Reasoning & Analysis
*Use these for accuracy, fact-checking, and complex problem solving.*

### Chain-of-Thought
* **How it works:** LLMs don't "think"; they predict the next word. By forcing the model to write out its reasoning steps explicitly, you generate a sequence of logical tokens that guide the model toward the correct final answer, rather than letting it guess the answer immediately.
* **When to use:** Essential for math, logic puzzles, coding, and complex reasoning tasks where the path to the answer is as important as the answer itself.
* **Example:** "Think step-by-step. First, calculate the total revenue. Second, subtract the fixed costs. Finally, provide the net profit."

### Assumption Enumeration
* **How it works:** Force the model to list all premises and assumptions it is relying on before it attempts to answer the core question. This brings hidden biases or logical leaps to the surface where they can be verified.
* **When to use:** Use for analytical rigor in business strategy, scientific hypothesis generation, or political analysis to ensure objectivity.

### Explicit Uncertainty Handling
* **How it works:** Instruct the model to label its confidence levels for different claims or to explicitly state "I don't know" if the information is missing. This fights the model's tendency to confidently hallucinate answers to fill gaps.
* **When to use:** Use when asking for facts that might be obscure, ambiguous, or recent (post-training cutoff).

### Output Justification Requirement
* **How it works:** Require every claim, decision, or recommendation to be immediately followed by a citation, a logical justification, or a reference to the source text. This increases factual discipline and makes the output easier to audit.
* **When to use:** Use for research, legal analysis, fact-checking, or making claims that require evidentiary support.

## Code, Security & Robustness
*Use these for building tools, scripts, and rigorous testing.*

### Specify Output Format
* **How it works:** Defining a strict schema (like JSON, CSV, or XML) forces the model to structure its "thinking" into a machine-readable format. This reduces post-processing work and ensures compatibility with downstream applications.
* **When to use:** Use for data extraction, API integration, or code generation where the output must be parsed by a script.

### Plan-and-Execute Prompting
* **How it works:** Force the model to produce a structured, high-level plan or pseudocode first. Then, in a second step, have it execute that plan. This separates the architectural logic from the syntax generation, reducing bugs.
* **When to use:** Common in agentic systems, complex coding tasks, and multi-step workflow automation.

### Boundary Testing Prompts
* **How it works:** Ask the model to consider minimal, maximal, empty, or extreme cases (edge cases) when writing code or logic. This ensures the solution handles outliers, not just the "happy path."
* **When to use:** Use for validating algorithms, writing unit tests, and checking logic rules for robustness.

### Ask for tests first, then code
* **How it works:** This is Test-Driven Development (TDD) for AI. It forces the model to define the "success criteria" logically before it writes the implementation. If the model writes a test that fails against its own code, it can self-correct.
* **When to use:** Every time you want to use generated code in production-level software to ensure reliability and coverage.

### Adversarial Prompting
* **How it works:** Ask the model to assume the role of a hacker, a critic, or a confused user to actively try to break, exploit, or invalidate its own solution. This helps identify vulnerabilities prompt injection risks.
* **When to use:** Widely used in robustness testing, security reviews, and ensuring content filters are working correctly.

## Refinement, Review & Quality Control
*Use these to polish outputs and catch errors.*

### Few-Shot Prompting
* **How it works:** "In-context learning" where you provide examples (pattern inputs matched with desired outputs) for the model to mimic. The model learns the pattern (format, tone, logic) from the examples without needing fine-tuning.
* **When to use:** Every time you want the model to retain specific formatting, follow a complex rule set, or understand a unique task not present in its general training data.

### Tell the model to repeat clear instructions at the end
* **How it works:** In long conversations, the "system prompt" moves further up the context window and can get "diluted." Telling the model to summarize its instructions at the end of a reply acts as a "re-attention" mechanism, keeping the constraints fresh for the next turn.
* **When to use:** For complex projects that span several chats, RPGs, or long coding sessions to prevent "context drift."

### Iterative Refinement
* **How it works:** Using follow-up prompts to add "contextual weight" and steer the model. If the first output is too generic, you don't start over; you refine it by adding constraints to the existing context.
* **When to use:** Use to guide the AI back to the center of your requirements when it drifts or to drill down into specific details.

### Reflection / Self-Critique
* **How it works:** After generating an answer, instruct the model to switch modes and critique its own work for accuracy, bias, or logical gaps. Then, ask it to rewrite the answer based on that critique.
* **When to use:** Use to catch logical gaps, hallucinations, and edge cases in high-stakes outputs (like medical or legal summaries).

### Negative Example Injection
* **How it works:** Provide examples of *bad* or unacceptable outputs alongside good ones. Showing the model what "failure" looks like helps it define the boundaries of "success" more sharply than rules alone.
* **When to use:** Use when the model persists in making a specific type of mistake or uses a tone you dislike.

### Perspective Switching
* **How it works:** Ask the model to solve the same problem from multiple viewpoints (e.g., "Analyze this UI from the perspective of a senior engineer, a first-time user, and a malicious attacker"). This provides a holistic view.
* **When to use:** Common in security reviews, UX analysis, negotiation simulation, and creative writing.
</div>
