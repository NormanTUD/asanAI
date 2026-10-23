<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: People of AI
description: The recurring cast behind the machine — from McCulloch and Pitts to the builders of the modern LLM stack, with their primary works.
icon: &#128101;
part: 6
order: 16
color: sky
topics: history, society, philosophy, frontier
tags: interested-layman
math: 0
-->

<div class="md" data-lesson-id="people_of_ai">
Artificial intelligence has a surprisingly small cast of recurring characters. The same names appear in the history chapters, the mathematics lessons, the interpretability labs, and the frontier surveys — sometimes as the person who proved the key theorem, sometimes as the person whose failed attempt defined the next decade's problem. This chapter is a **who's who**: what each person contributed, why it still matters, and one or two primary sources you can read for yourself.

It is deliberately not a ranking. Credit in AI is contested, collaborative, and often late. The person whose name is on the paper is not always the person who had the idea first, and the person who had the idea first is not always the person who made it work. Where the record is disputed, the lesson says so.
</div>

<div class="md">
## Before the Machine

The intellectual scaffolding predates electronic computers by a century. These are the people who made “a machine that learns” thinkable before it was buildable.

### Ada Lovelace and Charles Babbage

Babbage designed the **Analytical Engine**, a programmable mechanical computer with a store, a mill, and punched-card input. Lovelace translated Menabrea's account of it and added notes that are longer than the original, including **Note G** — a step-by-step algorithm for computing Bernoulli numbers that is traditionally described as the first published computer program. Her deeper claim was that such a machine could manipulate *symbols*, not merely numbers, and that its operations could be composed to express any rule-governed process. That is the conceptual ancestor of software — and of the idea that a machine's behaviour can be changed without rebuilding it (\cite[Menabrea & Lovelace, 1843]{menabrea_lovelace1843}).

### Alan Turing

Turing gave computation its modern mathematical form. In 1936 he described an abstract machine — a tape, a head, a finite table of states — and proved that some well-defined problems cannot be decided by any such machine. In 1950 he replaced the question “Can machines think?” with an operational one: can a machine's text responses be distinguished from a human's? The **imitation game** did not settle the philosophy, but it turned a metaphysical dispute into an experiment, and it set the agenda for every later benchmark that measures behaviour rather than inner life (\cite[Turing, 1950]{turing1950computing}).

### Claude Shannon

Shannon founded information theory by treating communication as a statistical problem: a message source has an **entropy**, a channel has a capacity, and reliable transmission is possible up to that capacity. His 1951 paper on the entropy of printed English then framed language itself as a prediction problem — guess the next character, and the difficulty of the guess measures the redundancy of the text. Every language model's training loss is a version of that measurement (\cite[Shannon, 1948]{shannon1948communication}; \cite[Shannon, 1951]{shannon1951communication}).

### John von Neumann and Norbert Wiener

Von Neumann's **EDVAC report** described the stored-program computer, in which instructions and data share the same memory — the architecture every digital computer still uses. It also cited McCulloch and Pitts' threshold neuron, making the paper a bridge between neural modelling and computer design (\cite[von Neumann, 1945]{vonneumann}). Wiener's **cybernetics** gave the post-war world a science of feedback and control, and his insistence that organisms and machines could be analysed in the same loop shaped the vocabulary of adaptation that Rosenblatt, Ashby, and the early connectionists inherited (\cite[Wiener, 1948]{wiener1948cybernetics}).
</div>

<div class="md">
## The First Neurons

### Warren McCulloch and Walter Pitts

In 1943 McCulloch, a neurophysiologist, and Pitts, a self-taught logician, published **“A Logical Calculus of the Ideas Immanent in Nervous Activity.”** They modelled the neuron as an all-or-none threshold unit and showed that networks of such units can express any function of propositional logic; with recurrent loops, the model anticipated the computational generality later formalized in automata theory. The paper is the founding document of neural-network theory. It gave Rosenblatt the unit he would teach, gave Hopfield the binary element his energy model would settle, and gave the field the step nonlinearity that later became the obstacle backpropagation had to overcome (\cite[McCulloch & Pitts, 1943]{mccullochpitts1943}).

Pitts never took a degree. He joined the University of Chicago as a teenager, worked with Norbert Wiener at MIT, and coauthored **“What the Frog's Eye Tells the Frog's Brain”** (1959), which showed that the retina already extracts behaviourally specific features before any central processing — a founding text of computational neuroscience. His later withdrawal from scientific life, after a rupture in the Wiener circle, is one of the field's quiet tragedies (\cite[Lettvin et al., 1959]{lettvin1959frog}).

### Frank Rosenblatt

Rosenblatt turned the threshold unit into a **learning** machine. The perceptron adjusted its connection strengths by an error-correction rule: when the output was wrong, the active connections moved in the direction of the correct answer. He proved that for any linearly separable classification the rule makes only finitely many mistakes, and he built the **Mark I Perceptron** to run the rule in analogue hardware. His 1962 book **Principles of Neurodynamics** framed the whole programme as a science of brain mechanisms rather than a pattern-recognition gadget, and its chapter 13 already proposed a “back-propagating error-correction procedure” for multi-layer machines — without the gradient that would make it work (\cite[Rosenblatt, 1958]{rosenblatt1958perceptron}; \citetitle{rosenblatt1962neurodynamics}).

### Arthur Samuel

Samuel's checkers player, written at IBM between 1952 and 1967, was the first machine-learning system to attract wide public attention. It learned in two ways: **rote learning** stored analysed positions and their backed-up scores, and **generalization learning** adjusted the coefficients of its evaluation function so that a position's static score tracked the value found by deeper search. His 1959 paper gave the field its name — **machine learning** — and his self-play arrangement is the direct ancestor of temporal-difference learning, TD-Gammon, and AlphaGo (\cite[Samuel, 1959]{samuel1959checkers}).

### Marvin Minsky and Seymour Papert

Minsky and Papert's **Perceptrons** (1969) proved that a single-layer perceptron cannot compute predicates such as parity and connectedness — the exclusive-or function is the standard example — and expressed pessimism that multi-layer extensions could be trained with the tools of the time. The book is often remembered as the cause of the first AI winter. The historical record is messier: Papert later rejected the single-book reading, and later scholarship emphasized institutional competition and the genuine limitations of the machines (\citetitle{minskyperceptrons}; \cite[Papert, 1988]{papert1988oneai}).

### Bernard Widrow

Widrow's **ADALINE** was a single adaptive linear element with weights implemented as switchable resistor circuits; with his student Ted Hoff he built a **memistor** whose resistance could be electroplated and stripped. Their **least-mean-squares** training rule — the Widrow–Hoff rule — is the direct ancestor of the delta rule and of modern gradient descent on a squared error. The hardware was the argument that adaptive control was real, not a simulation (\cite[Widrow & Hoff, 1960]{widrow1960adaline}).
</div>

<div class="md">
## The Connectionist Revival

### John Hopfield

Hopfield's 1982 paper gave recurrent networks a physical metaphor: the network is an **energy landscape**, stored patterns are its minima, and recall is relaxation downhill. The model made associative memory rigorous, connected neural networks to statistical physics, and helped restart a field that had been in retreat since the perceptron critique. Hopfield shared the 2024 Nobel Prize in Physics with Geoffrey Hinton for these foundations (\cite[Hopfield, 1982]{hopfield1982}; \cite[Nobel Prize, 2024]{nobel2024physics}).

### David Rumelhart, Geoffrey Hinton, and Ronald Williams

Their 1986 **Nature** paper, “Learning Representations by Back-Propagating Errors,” made backpropagation famous. It showed that the chain rule could be applied backward through a multi-layer network to compute every parameter's gradient in one pass, and it demonstrated the idea on tasks that had defeated earlier single-layer systems. The algorithm had been derived earlier — by Werbos in 1974, and independently by others — but the 1986 paper gave it a clean statement, a public demonstration, and a generation of readers (\cite[Rumelhart et al., 1986]{rumelhart1986}).

Hinton went on to co-invent the Boltzmann machine, lead the deep-belief-network revival of 2006, and coauthor AlexNet in 2012. He shared the 2024 Nobel Prize in Physics with Hopfield, and later became one of the most prominent voices warning about the risks of the technology he helped create (\cite[Hinton et al., 2006]{hinton2006}; \cite[Krizhevsky et al., 2012]{krizhevsky2012imagenet}; \cite[Nobel Prize, 2024]{nobel2024physics}).

### Paul Werbos

Werbos published the first derivation of backpropagation for neural networks in his 1974 Harvard dissertation, **Beyond Regression**, more than a decade before the 1986 paper made it famous. He also developed **backpropagation through time** for recurrent networks and the **adaptive critic** family of designs — a learned value model guiding a learned policy — which he later called approximate dynamic programming. His experience is the field's standard cautionary tale about how long a good idea can sit unread (\cite[Werbos, 1974]{werbos1974}).

### Yann LeCun

LeCun combined convolutional weight-sharing with backpropagation to recognize handwritten ZIP codes for the U.S. Postal Service in 1989; the later **LeNet-5** was deployed in bank check-reading systems. Convolutional networks became the dominant vision architecture for the next quarter-century, and LeCun's work on energy-based models and self-supervised learning kept pushing against the limits of supervised classification. He shared the 2018 Turing Award with Hinton and Bengio (\cite[LeCun et al., 1989]{lecun1989backpropagation}).

### Yoshua Bengio

Bengio's 2003 **neural probabilistic language model** replaced sparse n-gram tables with dense, learned word embeddings and a neural network over the context — the direct ancestor of the input layer of every modern language model. His group's work on attention-based translation, representation learning, and generative models helped build the bridge from word embeddings to seq2seq and then to the Transformer. He shared the 2018 Turing Award with Hinton and LeCun (\cite[Bengio et al., 2003]{neuralprobabilistic}).

### Sepp Hochreiter and Jürgen Schmidhuber

Their 1997 **Long Short-Term Memory** introduced the cell state and the gating mechanism that let recurrent networks carry information across many steps without the vanishing gradient destroying it. LSTM dominated sequence modelling for two decades — speech, translation, handwriting, time series — and its gated-residual idea is still visible in modern architectures. The Transformer replaced the recurrence, not the lesson: a network needs a protected path for information to survive depth and time (\cite[Hochreiter & Schmidhuber, 1997]{lstm}).
</div>

<div class="md">
## Deep Learning

### Alex Krizhevsky, Ilya Sutskever, and Geoffrey Hinton

**AlexNet** won the 2012 ImageNet challenge by a margin of more than ten percentage points. It was a deep convolutional network trained on two consumer GPUs, with ReLU activations and dropout — not a new idea in any single component, but the first demonstration that scale, data, and GPU compute could leave hand-engineered vision features behind. The result launched the deep-learning era and made “GPU + big data + a big network” the default recipe (\cite[Krizhevsky et al., 2012]{krizhevsky2012imagenet}).

Sutskever went on to co-invent sequence-to-sequence learning, co-found OpenAI, and serve as its chief scientist through the GPT era. His recurring thesis is that prediction at sufficient scale forces a model to internalize the structure of the data (\cite[Sutskever et al., 2014]{sutskever2014seq2seq}).

### Fei-Fei Li

Li's **ImageNet** gave vision a benchmark of realistic difficulty: 14 million images organized by WordNet, with a 1,000-class challenge that ran from 2010 to 2017. The dataset was the other half of the AlexNet story — without it, the GPU revolution would have had nothing to train on. ImageNet also established the modern pattern of a large, shared, human-labelled benchmark driving an entire subfield (\cite[Deng et al., 2009]{deng2009imagenet}).

### Ian Goodfellow

Goodfellow's **generative adversarial network** (2014) paired a generator with a discriminator in a zero-sum game: the generator learns to produce samples that fool the discriminator, and the discriminator learns to tell real from fake. GANs produced the first sharp, high-resolution synthetic images and made “generative model” a mainstream idea before diffusion models displaced them for most image work (\cite[Goodfellow et al., 2014]{goodfellow2014gan}).

### Andrej Karpathy

Karpathy is the field's most influential teacher. His blog posts and courses — **The Unreasonable Effectiveness of Recurrent Neural Networks**, CS231n, “Neural Networks: Zero to Hero,” nanoGPT — made the internals of deep learning legible to a generation of practitioners. He co-founded OpenAI, led AI at Tesla, and has repeatedly argued that the best way to understand a model is to build a small one yourself (\cite[Karpathy, 2015]{karpathy2015rnn}; \cite[Karpathy, 2023]{karpathy2023zerotohero}).

### Andrew Ng

Ng co-founded Google Brain and Coursera, and his machine-learning courses introduced millions of students to the subject. His research on large-scale distributed training — including the DistBelief system — helped establish that neural networks could be trained across many machines, a precondition for the scale era (\cite[Dean et al., 2012]{dean2012large}).
</div>

<div class="md">
## Games and Science

### David Silver and Demis Hassabis

Silver led the AlphaGo project, which combined deep policy and value networks with Monte Carlo tree search to beat Lee Sedol in 2016, and then AlphaZero, which learned chess, shogi, and Go from the rules alone by self-play. Hassabis co-founded DeepMind and built the organization that made both projects possible; he shared the 2024 Nobel Prize in Chemistry with John Jumper for AlphaFold (\cite[Silver et al., 2016]{silver2016alphago}; \cite[Silver et al., 2018]{silver2018zero}; \cite[Nobel Prize, 2024]{nobel2024chemistry}).

### John Jumper

Jumper led the AlphaFold project that effectively solved single-chain protein structure prediction at CASP14 in 2020. AlphaFold 2's accuracy turned a decades-old grand challenge into a practical tool, and AlphaFold 3 extended the approach to biomolecular complexes. Jumper shared the 2024 Nobel Prize in Chemistry with Hassabis (\cite[Jumper et al., 2021]{jumper2021alphafold}; \cite[Nobel Prize, 2024]{nobel2024chemistry}).

### Richard Sutton and Andrew Barto

Sutton and Barto built the conceptual and algorithmic foundations of reinforcement learning: temporal-difference learning, the value-function view, and the textbook that trained the field. Sutton's **“The Bitter Lesson”** is the clearest statement of the scaling worldview — general methods that exploit computation beat methods with built-in human knowledge — and it remains the most cited argument for the approach that produced modern LLMs. Sutton and Barto shared the 2024 ACM Turing Award (\cite[Sutton, 1988]{sutton1988td}; \citetitle{sutton2018rlbook}; \cite[Sutton, 2019]{sutton2019bitter}).
</div>

<div class="md">
## The LLM Era

### Ashish Vaswani and Noam Shazeer

The 2017 paper **“Attention Is All You Need”** replaced recurrence with self-attention, made sequence models parallelizable across positions, and became the architecture of essentially every modern language model. Vaswani was the lead author; Shazeer coauthored the paper and went on to invent multi-query attention and the gated linear-unit variants (SwiGLU) that are standard in open-weight models (\cite[Vaswani et al., 2017]{vaswani2017attention}; \cite[Shazeer, 2019]{shazeer2019mqa}; \cite[Shazeer, 2020]{shazeer2020glu}).

### Tom Brown and Long Ouyang

Brown led the GPT-3 paper, which showed that a 175-billion-parameter decoder trained on next-token prediction could perform new tasks from a handful of examples in the prompt — **in-context learning** at scale. Ouyang led InstructGPT, which added supervised fine-tuning and RLHF and showed that a 1.3B aligned model could be preferred by human raters over the 175B base model. Together they mark the transition from “language model” to “assistant” (\cite[Brown et al., 2020]{brown2020gpt3}; \cite[Ouyang et al., 2022]{ouyang2022instructgpt}).

### Paul Christiano, Yuntao Bai, and Rafael Rafailov

Christiano's 2017 work introduced preference-based reinforcement learning, the core of RLHF: humans compare behaviours, a reward model learns the comparison, and a policy is optimized against it. Bai led **Constitutional AI**, which replaced most human harmlessness labels with AI self-critique against written principles. Rafailov's **Direct Preference Optimization** showed that the RLHF objective could be optimized directly on preference pairs without a separate reward model or RL loop (\cite[Christiano et al., 2017]{christiano2017rlhf}; \cite[Bai et al., 2022]{bai2022constitutional}; \cite[Rafailov et al., 2023]{rafailov2023dpo}).

### Jordan Hoffmann and Jared Kaplan

Kaplan's scaling laws showed that loss falls as a power law in model size, data, and compute — the planning instrument that made frontier training a capital-allocation problem. Hoffmann's Chinchilla analysis corrected the recipe: for a fixed compute budget, most models of the GPT-3 generation were far too large for their data, and roughly twenty tokens per parameter was a better target. The correction reset industry training budgets and made data curation a first-class capability problem (\cite[Kaplan et al., 2020]{kaplan2020scaling}; \cite[Hoffmann et al., 2022]{hoffmann2022chinchilla}).

### Catherine Olsson, Adly Templeton, and Jack Lindsey

Olsson led the **induction-heads** work, which identified a two-head circuit that implements in-context pattern completion and showed that it emerges at the same training step as a jump in in-context learning. Templeton led **Scaling Monosemanticity**, which extracted millions of interpretable features from a production Claude model and produced the “Golden Gate Claude” demonstration. Lindsey led the **attribution-graph** analyses that trace causal paths through a model's features and exposed genuine multi-step reasoning, planning, and a hidden goal in a finetuned model (\cite[Olsson et al., 2022]{olsson2022induction}; \cite[Templeton et al., 2024]{anthropic2024goldengate}; \cite[Lindsey et al., 2025]{anthropic2025biology}).

### François Chollet

Chollet created Keras, the deep-learning API that made neural networks accessible to non-specialists, and wrote **“On the Measure of Intelligence,”** which argued that intelligence should be measured as the efficiency of skill acquisition on novel tasks rather than as performance on familiar ones. He then built **ARC-AGI**, a benchmark designed to resist memorization and measure exactly that kind of generalization. His current lab, Ndea, pursues deep-learning-guided program synthesis as a path beyond pattern matching (\cite[Chollet, 2019]{chollet2019measure}; \cite[Chollet, 2024]{chollet2024arcagi}).
</div>

<div class="md">
## The Recurring Cast

These are the names that appear most often across the course, counted by citations and full-name mentions. The right-hand column points to the lessons where their work does the most work.

| Person | Recurring in |
|---|---|
| **Geoffrey Hinton** | [History](history.php), [Backpropagation](backproplab.php), [Optimizers](optimizerlab.php), [Deep Learning](deeplearninglab.php) |
| **Yann LeCun** | [Computer Vision](computer_vision.php), [History](history.php), [AI Existential Risk](ai_existential_risk.php) |
| **Yoshua Bengio** | [Language](language.php), [History](history.php), [AI Existential Risk](ai_existential_risk.php) |
| **Frank Rosenblatt** | [History](history.php), [Smallest Neural Network](minimalneuron.php), [Activation Functions](activationlab.php) |
| **Warren McCulloch & Walter Pitts** | [History](history.php), [The Mirror in the Machine](mirror_in_machine.php), [Philosophy](philosophy.php) |
| **Claude Shannon** | [History](history.php), [Language](language.php), [Statistics I](statistics_i.php), [Tokenization](tokenizerlab.php) |
| **Ashish Vaswani** | [Transformer](transformer.php), [Attention](attentionlab.php), [Context Windows](contextwindows.php) |
| **Richard Sutton** | [Reinforcement Learning](reinforcement_learning.php), [AI Existential Risk](ai_existential_risk.php), [Myths](myths.php) |
| **Sepp Hochreiter** | [Recurrent Networks](recurrent_networks.php), [Attention](attentionlab.php), [Automatic Differentiation](autodiff.php) |
| **Fei-Fei Li** | [Computer Vision](computer_vision.php), [Multimodal](multimodal.php), [Evaluation](evaluation.php) |
| **David Rumelhart** | [Backpropagation](backproplab.php), [Automatic Differentiation](autodiff.php), [Loss Landscape](loss_landscape.php) |
| **Noam Shazeer** | [Transformer](transformer.php), [Mixture of Experts](mixture_of_experts.php), [Inference Optimization](inference_optimization.php) |
| **Catherine Olsson** | [In-Context Learning](unexpected_capabilities.php), [Mechanistic Interpretability](mechanistic_interpretability.php) |
| **François Chollet** | [Unexpected Capabilities](unexpected_capabilities.php), [Global AI Ecosystem](global_ai_ecosystem.php) |
</div>

<div class="md">
## A Note on Credit

The history of AI is not a list of lone geniuses. Ideas arrive in clusters, are independently discovered, and are often named after the person who made them famous rather than the person who had them first. Backpropagation is the canonical example: Werbos derived it in 1974, Rumelhart, Hinton, and Williams made it famous in 1986, and Linnainmaa had described the reverse-mode chain rule earlier still. The perceptron has its own priority dispute: Farley and Clark built a perceptron-like device before Rosenblatt, but did not build the theory around it. The Transformer had eight authors, and its key ideas drew on attention mechanisms developed for translation.

This chapter names people because names are how the course's citations, biographies, and Atlas entries are organized — not because the field's progress can be reduced to a list of individuals. The primary sources are the point. Read them.
</div>

<script>
async function loadPeopleOfAiModule() {
	updateLoadingStatus("Loading section about the people of AI...");
	return Promise.resolve();
}
</script>

<div class="mn-quiz" data-quiz="people_of_ai"><script type="application/json">{"title": "People of AI", "questions": [{"q": "Who published the first derivation of backpropagation for neural networks?", "options": ["Paul Werbos, in his 1974 dissertation", "Rumelhart, Hinton, and Williams in 1986", "Frank Rosenblatt in 1958", "Yann LeCun in 1989"], "answer": 0, "explain": "Werbos derived it in 1974; the 1986 Nature paper made it famous."}, {"q": "What did McCulloch and Pitts contribute in 1943?", "options": ["A mathematical model of the neuron as a threshold logic unit", "The first trained perceptron", "The Transformer", "The backpropagation algorithm"], "answer": 0, "explain": "Their logical calculus founded neural-network theory; Rosenblatt later added learning."}, {"q": "Why is Arthur Samuel important?", "options": ["His checkers program was an early self-learning system, and his 1959 paper coined “machine learning”", "He invented the GPU", "He wrote the first Transformer", "He founded OpenAI"], "answer": 0, "explain": "Samuel's rote and generalization learning anticipated temporal-difference methods."}, {"q": "What did the Chinchilla analysis change?", "options": ["It showed most large models were undertrained and reset the data-per-parameter target", "It proved scaling laws do not exist", "It replaced attention with recurrence", "It introduced RLHF"], "answer": 0, "explain": "Hoffmann et al. found roughly twenty tokens per parameter was a better compute-optimal ratio."}, {"q": "What is AlphaFold known for?", "options": ["Highly accurate protein structure prediction", "Playing Go", "Generating images", "Training language models"], "answer": 0, "explain": "Jumper, Hassabis, and colleagues effectively solved single-chain structure prediction at CASP14."}]}</script></div>
