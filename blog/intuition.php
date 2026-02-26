<?php include_once("functions.php"); ?>

<div class="md">
## An Intuition of how Large Language Models (LLMs) work

We can think of LLMs as machines that predict the next most likely word, given a context. Only one word at a time. That word is appended to the input and fed back in, repeating until a special `|endoftext|` token signals the end. In this example, the user enters the text "Once upon a" and lets the LLM continue.

**Step 1: The First Guess**
$$\text{Next Word} = \text{LLM}(\underbrace{\text{"Once upon a"}}_{\text{User Input}}) \rightarrow \text{"time"}$$

**Step 2: The Glue**
$$\text{New Input} = \underbrace{\text{"Once upon a"}}_{\text{User Input}} + \text{"time"} = \text{"Once upon a time"}$$

**Step 3: The Repeat**
$$\text{Next Word} = \text{LLM}(\text{"Once upon a time"}) \rightarrow \text{"there"}$$

$$\text{Next Word} = \text{LLM}(\text{"Once upon a time there"}) \rightarrow \text{"was"}$$

$$\text{Next Word} = \text{LLM}(\text{"Once upon a time there was"}) \rightarrow \text{"a"}$$

$$\text{Next Word} = \text{LLM}(\text{"Once upon a time there was a"}) \rightarrow \text{"dragon."}$$

$$\text{Next Word} = \text{LLM}(\text{"Once upon a time there was a dragon."}) \rightarrow \texttt{|endoftext|}$$

**Final output: "Once upon a time there was a dragon."**
</div>
