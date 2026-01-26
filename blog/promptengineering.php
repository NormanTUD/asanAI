<?php include_once("functions.php"); ?>

<div class="md">
## Foundational Structure
*Use these to set the "environment" and prepare the input data.*

### Define the Role
* **How it works:** Assigning a persona acts as a "system anchor," priming the model to prioritize specific subsets of training data (e.g., technical vs. general).
* **When to use:** Use at the very start to set expertise.
* **Example:** "Act as a master plumber with 30 years of experience."

### Be Specific
* **How it works:** Vague prompts have a large "probability space." Specificity narrows this, forcing the model to select tokens that align with exact parameters.
* **When to use:** Use when you have a rigid vision of the outcome.
* **Example:** Instead of "Write a story," use "Write a 200-word suspenseful story about a cat named Slimer."

### Use Delimiters
* **How it works:** Delimiters (like triple quotes) prevent the AI from confusing your instructions with the data it needs to process.
* **When to use:** Essential when pasting long text, code, or articles.
* **Example:** "Summarize the text delimited by triple quotes below."

### Input Canonicalization
* **How it works:** Instruct the model to rewrite or normalize noisy input into a standard form before processing it.
* **When to use:** Use for noisy, user-generated, or multilingual data handling.

### Don't say "please" and "thank you", be as short and precise as possible
* **Why does it work?** Every single word makes the context longer, even if it doesn't add anything thematically. You cannot hurt the LLMs feelings. Just be short and precise.

## Text Generation & Creative Work
*Use these to control tone, style, and structure.*

### Assign a Target Audience
* **How it works:** Adjusts the "abstraction level" by telling the model which details to omit and which to emphasize for a specific reader.
* **When to use:** Use to tailor explanations (e.g., for VCs vs. Scientists).

### Positive Constraints
* **How it works:** Telling the model what *to* do (rather than what *not* to do) provides a clearer path for token generation.
* **When to use:** Use to fix style issues, e.g., "Use simple, everyday language."

### Parameter Awareness
* **How it works:** Using descriptive language (e.g., "highly creative" vs. "standard") mimics the effect of changing the temperature/top-p sliders.
* **When to use:** Use to control the risk/creativity of the output.

### Inverse Prompting
* **How it works:** Ask the model to describe *how* an ideal answer would look (structure, tone, criteria) before it actually produces the answer.
* **When to use:** Use when you are unsure exactly what you want but know the "vibe" or quality standard required.

### Compression-Then-Expansion
* **How it works:** First require an ultra-dense summary, then expand each point back out. This improves structure and reduces rambling.
* **When to use:** Use for long-form content generation to ensure a strong narrative backbone.

## Logic, Reasoning & Analysis
*Use these for accuracy, fact-checking, and complex problem solving.*

### Chain-of-Thought
* **How it works:** Forcing the model to write out steps creates a logical foundation of intermediate tokens, making the final answer more likely to be correct.
* **When to use:** Essential for math and logic problems.
* **Example:** "Think step-by-step before providing the final answer."

### Assumption Enumeration
* **How it works:** Force the model to list all assumptions it is making before answering. This reduces hidden premises.
* **When to use:** Use for analytical rigor in business or science tasks.

### Explicit Uncertainty Handling
* **How it works:** Instruct the model to label confidence levels or uncertainty ranges to prevent overconfident hallucinations.
* **When to use:** Use when asking for facts that might be obscure or ambiguous.

### Output Justification Requirement
* **How it works:** Require every claim or decision to include a justification or source type. This increases factual discipline.
* **When to use:** Use for research, fact-checking, or making claims that require evidence.

## Code, Security & Robustness
*Use these for building tools, scripts, and rigorous testing.*

### Specify Output Format
* **How it works:** Defining a schema (like JSON) reduces post-processing work and ensures compatibility with other software.
* **When to use:** Use for data extraction or code generation.

### Plan-and-Execute Prompting
* **How it works:** Force the model to produce a structured plan first, then execute each step explicitly.
* **When to use:** Common in agent systems and complex coding tasks.

### Boundary Testing Prompts
* **How it works:** Ask for minimal, maximal, or extreme cases to test logic.
* **When to use:** Use for validating algorithms, specs, and logic rules.

### Ask for tests first, then code
* **How it works:** This forces the model to think about how the program should behave first, and write a framework that can tell the model exactly what doesn't work as it expects it, so you can give it more specific functions to let it fix them later on, and it provides you with automated tests.
* **When to use:** Every time you want to use it in production level software.

### Adversarial Prompting
* **How it works:** Ask the model to actively try to break, exploit, or invalidate its own solution.
* **When to use:** Widely used in robustness testing and security reviews.

## Refinement, Review & Quality Control
*Use these to polish outputs and catch errors.*

### Few-Shot Prompting
* **How it works:** "In-context learning" where you provide examples (pattern inputs/outputs) for the model to mimic.
* **When to use:** Every time you want the model to retain some information, like formatting information, or information about the project.

### Tell the model to repeat clear instructions at the end
* **How it works:** Tell the model to provide clear and concise instructions of what you want it to do at the end of each reply, so that it doesn't forget them over longer chats, and is re-aligned for each following prompt.
* **When to use:** For more complex projects that span several chats.

### Iterative Refinement
* **How it works:** Using follow-up prompts to add "contextual weight" and steer the model if the first attempt was too broad.
* **When to use:** Use to guide the AI back to the center of your requirements.

### Reflection / Self-Critique
* **How it works:** After generating an answer, instruct the model to critique, verify, or improve its own output.
* **When to use:** Use to catch logical gaps, hallucinations, and edge cases.

### Negative Example Injection
* **How it works:** Provide examples of *bad* or unacceptable outputs alongside good ones. This sharpens boundary awareness better than rules alone.
* **When to use:** Use when the model persists in making a specific type of mistake.

### Perspective Switching
* **How it works:** Ask the model to solve the same problem from multiple viewpoints (e.g., user, adversary, maintainer).
* **When to use:** Common in security reviews and UX analysis.
</div>
