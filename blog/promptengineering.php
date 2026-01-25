<?php include_once("functions.php"); ?>

<div class="md">
## Be Specific
**Example:**
* **Poor:** "Write a short story about a cat."
* **Professional:** "Write a 200-word suspenseful story about a cat named Luna who discovers a hidden door in a library. Use a dark, atmospheric tone."

**Why it works:**
Large language models (LLMs) operate on probability. A vague prompt has a massive "probability space," meaning the AI could go in a thousand directions. Specificity narrows this space, forcing the model to select tokens that align with your exact parameters.

## Define the Role
**Example:**
* **Poor:** "How do I fix a leaky pipe?"
* **Professional:** "Act as a master plumber with 30 years of experience. Provide a step-by-step guide for a homeowner to fix a copper pipe pinhole leak using basic tools."

**Why it works:**
Roles act as a "system anchor." By defining a persona, you prime the model to prioritize a specific subset of its training data—in this case, technical plumbing terminology and practical, safety-oriented advice rather than general trivia.

## Use Delimiters
**Example:**
* **Professional:** "Summarize the text delimited by triple quotes below.
    Text: """[Insert long article here]""""

**Why it works:**
Delimiters help the model solve the "word sense" problem. It prevents the AI from getting confused between your instructions and the data you want it to process. It clearly signals where the command ends and the input begins.

## Few-Shot Prompting
**Example:**
* **Professional:** "Extract the city and country from the text.
    Input: 'I love the lights in Paris.' Output: Paris, France.
    Input: 'The sushi in Tokyo is great.' Output: Tokyo, Japan.
    Input: 'The tacos in Mexico City are spicy.' Output:"

**Why it works:**
This relies on "in-context learning." You are providing a pattern for the model's attention mechanism to lock onto. It is significantly more reliable than just describing the task, as it demonstrates the desired output length and formatting.

## Chain-of-Thought
**Example:**
* **Professional:** "Calculate the total cost of 15 apples at $0.45 each, with a 7% tax. Think step-by-step before providing the final answer."

**Why it works:**
LLMs predict the next token. If you ask for the answer immediately, it might "guess" a number. By forcing it to write out the steps, the intermediate tokens (the math) serve as a logical foundation that makes the final token (the answer) more likely to be correct.

## Specify Output Format
**Example:**
* **Professional:** "Analyze these customer reviews and provide the output as a JSON object with keys for 'sentiment' (string) and 'top_complaints' (list)."

**Why it works:**
This reduces "post-processing" work. By defining the schema, you ensure the AI's response is compatible with other software or neatly organized for human reading, preventing the AI from adding unnecessary conversational filler.

## Positive Constraints
**Example:**
* **Poor:** "Don't use complex words."
* **Professional:** "Use simple, everyday language that a 10-year-old would understand. Focus on using active verbs."

**Why it works:**
LLMs sometimes struggle with "negation" because the presence of a word (e.g., "complex") in the prompt increases the probability of related concepts appearing. Telling it what *to* do provides a clearer path for the token generation.

## Assign a Target Audience
**Example:**
* **Professional:** "Explain the concept of 'quantum entanglement' to a group of venture capitalists who are interested in the business applications, not the physics equations."

**Why it works:**
This adjusts the "abstraction level." It tells the model which details to omit and which outcomes to emphasize, ensuring the response is relevant to the reader's specific goals.

## Iterative Refinement
**Example:**
* **User:** "Write a blog post about coffee."
* **Follow-up:** "That was too general. Rewrite it to focus specifically on the health benefits of dark roast coffee and make the tone more scientific."

**Why it works:**
Conversational AI is designed to be guided. Each turn in the conversation provides more "contextual weight." Refinement allows you to steer the model back to center if its first attempt was too broad.

## Parameter Awareness
**Example:**
* **Professional:** "Provide a highly creative and unconventional list of 10 names for a new planet. Be as imaginative as possible." (Simulating high temperature).

**Why it works:**
Even if you can't access the slider, descriptive language influences the "top-p" and "temperature" logic of the model. Asking for "standard" vs "imaginative" changes how much risk the model takes with its word choices.
</div>
