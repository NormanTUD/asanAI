<?php include_once("functions.php"); ?>

<div class="md">
## Be Specific
Avoid vague descriptors like "fast" or "short." Instead, provide quantitative constraints. For example, if you want a summary, specify a limit of 50 words or three bullet points. This reduces the ambiguity of the output and ensures the model meets your technical requirements.

## Define the Role
Assigning a persona sets the expectations for vocabulary and tone. By instructing the model to "act as a senior software architect," you anchor the response in a professional domain, which influences the level of detail and the perspective provided in the generated text.

## Use Delimiters
Clear separation between instructions, context, and input data prevents "instruction leakage." Use markers like triple backticks, xml tags, or dashes to wrap your data. This allows the model to differentiate between the task description and the content it needs to process.

## Few-Shot Prompting
Providing examples is a highly effective way to align the model with your expected output style. By showing 2-3 pairs of inputs and desired outputs, you create a pattern for the model to follow, which significantly increases the accuracy of complex tasks.

## Chain-of-Thought
Asking the model to "think step-by-step" encourages it to generate intermediate reasoning. This is crucial for tasks involving logic or multi-step problem solving, as it allows the model to verify its own path before reaching a final conclusion.

## Specify Output Format
Explicitly request formats like Markdown, JSON, or CSV. If the output is intended for a programmatic pipeline, specifying the exact keys for a JSON object ensures the response is machine-readable and requires no manual cleaning.

## Positive Constraints
Focus on what the model should include. Instead of saying "don't be wordy," say "be concise and use active voice." Positive instructions are generally followed more reliably by language models than negative prohibitions.

## Assign a Target Audience
Adjust the complexity of the language based on who will read it. Stating the audience is a "layperson" versus a "subject matter expert" tells the model whether to use simple analogies or technical jargon.

## Iterative Refinement
Treat the first response as a draft. Use the initial output to identify where the model missed the mark, then provide follow-up instructions to tweak the tone, structure, or content until it reaches the desired quality.

## Parameter Awareness
While often controlled via API settings like temperature, you can simulate these effects in text. Request "the most standard and factual explanation" for accuracy, or "a diverse range of creative metaphors" to encourage more varied output.

## Use System Instructions
Place the most critical rules at the beginning of the prompt. This leverages the way models process sequences, ensuring that the primary constraints are given sufficient weight throughout the generation process.

## Avoid "Vague-Speak"
Replace subjective terms like "better" or "improved" with objective ones like "more professional," "persuasive," or "formatted as a list." The more descriptive your request, the less the model has to guess your intent.

## Request Citations
To reduce the risk of fabricated information, ask the model to provide evidence or reference specific parts of a provided text. This forces the model to ground its response in facts rather than its internal probability weights.

## Control Verbosity
If you need a specific length, ask for it directly. You can define the depth of the answer by requesting a specific number of paragraphs or a "high-level summary" versus a "deep-dive analysis."

## Negative Prompting
While positive constraints are primary, negative prompts help exclude specific unwanted elements. Use them to list "forbidden" words, topics, or formatting styles to keep the output within a strict boundary.

## Break Down Tasks
For complex projects, use a modular approach. Prompt the model to generate an outline first, then use subsequent prompts to expand on each section. This maintains higher quality and focus across each part of the project.

## Variable Placeholders
Use a consistent syntax for dynamic inputs, such as `[INSERT TEXT HERE]`. This makes your prompts reusable templates and helps the model identify exactly which part of the prompt contains the data to be processed.

## Ask for Critique
Before finalizing a response, ask the AI to "critique your own previous answer for logical flaws or bias." This self-correction step often uncovers errors that the model can then fix in a final version.

## Contextual Headers
Organize your prompt using clear headers like "Task," "Context," and "Constraints." This structured approach helps the model parse the hierarchy of your instructions and understand the relationship between different pieces of information.

## Evaluate and Version
Treat your prompts like code. Keep a record of which phrasings produced the best results. Documenting successful prompts allows you to build a library of reliable "templates" for future tasks.
</div>
