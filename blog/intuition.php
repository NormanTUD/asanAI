<?php include_once("functions.php"); ?>

<div class="md">
## An Intuition of how Large Language Models (LLMs) work

We can think of LLMs as machines that predict the next most likely word, given a context. Only one word at a time. That word is appended to the input and fed back in, repeating until a special `|endoftext|` token signals the end. In this example, the user enters the text "Once upon a" and lets the LLM continue.

**Step 1: The First Guess**
$$\text{Next Word} = \text{LLM}(\underbrace{\text{"Once upon a"}}_{\text{User Input}}) \rightarrow \text{"time"}$$

**Step 2: The Glue**
$$\text{New Input} = \underbrace{\text{"Once upon a"}}_{\text{User Input}} + \underbrace{\text{"time"}}_{\text{Word 1}} = \text{"Once upon a time"}$$

**Step 3: The Repeat**
$$\text{LLM}(\underbrace{\text{"Once upon a"}}_{\text{User Input}} \ \underbrace{\text{"time"}}_{\text{Word 1}}) \rightarrow \underbrace{\text{"there"}}_{\text{Word 2}}$$

$$\text{LLM}(\underbrace{\text{"Once upon a"}}_{\text{User Input}} \ \underbrace{\text{"time there"}}_{\text{Words 1–2}}) \rightarrow \underbrace{\text{"was"}}_{\text{Word 3}}$$

$$\text{LLM}(\underbrace{\text{"Once upon a"}}_{\text{User Input}} \ \underbrace{\text{"time there was"}}_{\text{Words 1–3}}) \rightarrow \underbrace{\text{"a"}}_{\text{Word 4}}$$

$$\text{LLM}(\underbrace{\text{"Once upon a"}}_{\text{User Input}} \ \underbrace{\text{"time there was a"}}_{\text{Words 1–4}}) \rightarrow \underbrace{\text{"dragon."}}_{\text{Word 5}}$$

$$\text{LLM}(\underbrace{\text{"Once upon a"}}_{\text{User Input}} \ \underbrace{\text{"time there was a dragon."}}_{\text{Words 1–5}}) \rightarrow \underbrace{\texttt{|endoftext|}}_{\text{Stop}}$$

**Final output: "Once upon a time there was a dragon."**
</div>
