<?php include_once("functions.php"); ?>

<div class="md">
## An Intuition of how Large Language Models (LLMs) work

Ignoring all the details at first, we can think of LLM as machines that predict the next, most likely word, given a context. What word is most likely is determined by the data it has been trained on.
It predicts only one word. Then, this word is appended to the original input, and fed into the LLM again to predict the next word, until a special `|endoftext|` token is sent by the LLM that signifies the end of the sentence.

**Step 1: The First Guess**
The LLM reads the start of the sentence and predicts the most likely next word.
$$\text{Next Word} = \text{LLM}(\text{"Once upon a"})$$
*The LLM predicts: **"time"***

**Step 2: The Glue**
That word gets appended to the end of the input.
$$\text{New Input} = \text{"Once upon a"} + \text{" time"}$$
*Now we have: **"Once upon a time"***

**Step 3: The Repeat**
The longer input is fed back into the LLM to get the next word.
$$\text{Next Word} = \text{LLM}(\text{"Once upon a time"})$$
*The LLM predicts: **"there"***

**The Final Result (so far):**
$$\text{"Once upon a time"} + \text{" there"} = \text{"Once upon a time there"}$$
...and this process keeps repeating, one word at a time, until the full story is told.
</div>
