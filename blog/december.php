<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: The December Calendar
description: Thirty-one days, six questions: a gentle guided path through the ideas that make modern AI and LLMs understandable.
icon: &#127876;
topics: history, language, society, philosophy
tags: interested-layman
-->

<?php
$mn_december_lessons = [];
foreach (parse_course_metadata() as $mn_part => $mn_modules) {
	foreach ($mn_modules as $mn_module) {
		$mn_december_lessons[$mn_module['slug']] = $mn_module;
	}
}

$mn_december_sections = [
	1 => [
		'title' => 'First Questions',
		'question' => 'What is this thing, and where did it come from?',
		'intro' => 'Five gentle days to get your bearings. No prior math or programming is assumed. By the end you will know what a language model is, where the field came from, and which mathematical ideas actually matter.',
		'days' => [1, 2, 3, 4, 5],
	],
	2 => [
		'title' => 'How a Network Learns',
		'question' => 'How does a machine get better at something?',
		'intro' => 'Now the machine starts to learn. These days are the conceptual core: how a network measures its mistakes, how it assigns blame, and why depth and stability matter. The labs are there to play with, not to memorize.',
		'days' => [6, 7, 8, 9, 10, 11],
	],
	3 => [
		'title' => 'Signals, Senses, and Software',
		'question' => 'How does a model handle the real world?',
		'intro' => 'AI is not only text. These days cover how machines see, hear, and generate images, sound, and video -- plus the ordinary software stack that turns a model into a running program.',
		'days' => [12, 13, 14, 15, 16],
	],
	4 => [
		'title' => 'The Transformer and Its Mind',
		'question' => 'How does a transformer turn text into an answer?',
		'intro' => 'This is the heart of the modern LLM: tokens, attention, the transformer block, sampling, and the first attempts to reverse-engineer what happens inside.',
		'days' => [17, 18, 19, 20, 21, 22],
	],
	5 => [
		'title' => 'Using AI Without Being Fooled',
		'question' => 'How do we use it without being fooled?',
		'intro' => 'A model is not an oracle. These days are about the gap between fluent output and reliable output -- hallucination, retrieval, agents, security, reasoning, evaluation, and the cost of a token.',
		'days' => [23, 24, 25, 26],
	],
	6 => [
		'title' => 'The Larger Questions',
		'question' => 'What does all of this mean?',
		'intro' => 'The last five days zoom out: the global ecosystem, the mind-machine comparison, the frontier, the rules, and the people behind the ideas. The final door is a map of the whole course.',
		'days' => [27, 28, 29, 30, 31],
	],
];

$mn_december_days = [
	1 => [
		'title' => 'One Word at a Time',
		'summary' => 'A large language model is a machine that predicts the next word. Everything else -- chat, code, translation -- is that one trick repeated at enormous scale.',
		'blurb' => 'Start with the single idea the whole course rests on. You will follow one word from text to numbers, through the model, and back out as a prediction, and see why "just guessing" can look like understanding.',
		'goal' => 'explain what a next-token predictor is, and why it is not a search engine or a database',
		'time' => '15-20 min',
		'math' => 0,
		'short' => 'intuition',
		'slugs' => ['intuition'],
		'deep' => [],
	],
	2 => [
		'title' => 'Where AI Came From',
		'summary' => 'Modern AI did not appear in 2022. It grew out of counting machines, logic, an early neural network that failed its first big test, two winters, and a lot of contributors who are usually left out of the story.',
		'blurb' => 'A compact history of the currents that converged on today\'s models -- and a second look at the people and places that the standard story forgets. Read this before the technical days; it gives everything else a timeline.',
		'goal' => 'name the main eras of AI, and one important contributor who is often missing from the standard story',
		'time' => '30-40 min',
		'math' => 5,
		'short' => 'history',
		'slugs' => ['history', 'untold_history_i', 'untold_history_ii', 'untold_history_iii'],
		'deep' => [],
	],
	3 => [
		'title' => 'The Math You Actually Need',
		'summary' => 'You do not need calculus to understand the ideas. You need sums, functions, vectors, and matrices -- and a feel for what they do.',
		'blurb' => 'This is the gentle mathematical toolkit: numbers and functions first, then vectors and matrices as ways to organize many numbers at once. Each idea is explained in plain language before the symbols appear.',
		'goal' => 'read a neural-network diagram and say what the numbers and arrows are doing',
		'time' => '35-45 min',
		'math' => 40,
		'short' => 'math_i',
		'slugs' => ['math_i', 'math_ii'],
		'deep' => ['math_iii', 'math_iv'],
	],
	4 => [
		'title' => 'Space, Meaning, and Language',
		'summary' => 'A model treats meaning as a position in a vast space. Language is how humans build that space together -- and why it is so hard to hand to a machine.',
		'blurb' => 'First you will see the working geometry of a model: similarity, projection, symmetry. Then the long human story of language, from writing systems to the statistical regularities an LLM learns.',
		'goal' => 'explain why "meaning as direction" is a useful metaphor, and why language is more than a list of words',
		'time' => '35-45 min',
		'math' => 30,
		'short' => 'geometry_ii',
		'slugs' => ['geometry_ii', 'language'],
		'deep' => ['geometry_i', 'geometry_iii', 'foam_of_meaning'],
	],
	5 => [
		'title' => 'Thinking in Probabilities',
		'summary' => 'An LLM never knows the next word for sure. It assigns probabilities -- and probability is the language AI uses to reason under uncertainty.',
		'blurb' => 'Distributions, Bayes, entropy, and Markov chains sound technical, but the ideas are everyday: how likely is this? How surprised should I be? What should I believe after new evidence? These are the tools behind next-token prediction.',
		'goal' => 'explain why a model outputs a distribution rather than a single answer, and what "surprise" means in information theory',
		'time' => '35-45 min',
		'math' => 40,
		'short' => 'statistics_i',
		'slugs' => ['statistics_i', 'statistics_ii'],
		'deep' => [],
	],
	6 => [
		'title' => 'Learning by Being Wrong',
		'summary' => 'A neural network learns by making a guess, measuring how wrong it is, and nudging its settings. That loop is the whole story.',
		'blurb' => 'Meet the smallest possible network: one weight, one bias, and a line that tries to fit the data. The loss function turns "wrong" into a number the machine can improve.',
		'goal' => 'explain loss, weights, bias, and gradient descent without using a formula',
		'time' => '25-35 min',
		'math' => 25,
		'short' => 'losslab',
		'slugs' => ['losslab', 'minimalneuron'],
		'deep' => ['differentiation'],
	],
	7 => [
		'title' => 'The Chain Rule That Trains Everything',
		'summary' => 'Backpropagation is just the chain rule, applied backward through the network to tell every weight how to change.',
		'blurb' => 'A derivative measures how a small change in one thing changes another. Backpropagation uses that idea to assign credit -- or blame -- to every connection in the network, in one pass.',
		'goal' => 'explain what a derivative is and why backpropagation is called "credit assignment"',
		'time' => '30-40 min',
		'math' => 45,
		'short' => 'derivativelab',
		'slugs' => ['derivativelab', 'backproplab'],
		'deep' => ['differentiation'],
	],
	8 => [
		'title' => 'Gradients on Autopilot',
		'summary' => 'Automatic differentiation computes the gradients; the optimizer decides how far to step. Together they make training a network practical.',
		'blurb' => 'Frameworks like TensorFlow and PyTorch do not ask you to derive anything by hand. This day shows how the machine computes gradients automatically, and how optimizers turn a slope into a path downhill.',
		'goal' => 'explain the difference between a gradient and an optimizer, and why the learning rate matters',
		'time' => '30-40 min',
		'math' => 40,
		'short' => 'autodiff',
		'slugs' => ['autodiff', 'optimizerlab'],
		'deep' => ['loss_landscape', 'hyperparameters'],
	],
	9 => [
		'title' => 'Why Nonlinearity Matters',
		'summary' => 'Stacking linear layers is still just a line. Nonlinear gates give a network the power to bend, and reward learning gives it a goal.',
		'blurb' => 'Activation functions are the small nonlinear decisions inside a network. Reinforcement learning is the other half: learning from reward instead of a labelled answer. Both are behind modern assistants.',
		'goal' => 'explain why a deep network needs nonlinearity, and how reward-based learning differs from supervised learning',
		'time' => '30-40 min',
		'math' => 30,
		'short' => 'activationlab',
		'slugs' => ['activationlab', 'reinforcement_learning'],
		'deep' => ['traininglab', 'trainingdynamics'],
	],
	10 => [
		'title' => 'Depth, Memory, and Overfitting',
		'summary' => 'Deep networks can represent complicated functions, but a model that memorizes the training data has not learned the pattern.',
		'blurb' => 'Depth lets a network build features on top of features. Overfitting is what happens when it learns the noise instead of the signal. This is the practical difference between looking smart and being useful.',
		'goal' => 'explain why depth helps, what overfitting looks like, and how a model can memorize without understanding',
		'time' => '30-40 min',
		'math' => 25,
		'short' => 'deeplearninglab',
		'slugs' => ['deeplearninglab', 'overandunderfittinglab'],
		'deep' => ['hyperparameters'],
	],
	11 => [
		'title' => 'Deep Networks That Stay Trainable',
		'summary' => 'Very deep networks used to fail. Residual connections and layer normalization are the plumbing that made them stable.',
		'blurb' => 'A residual connection lets a layer learn a small change instead of a whole new representation. Layer normalization keeps the numbers in a healthy range. These unglamorous ideas are inside every transformer block.',
		'goal' => 'explain why residual connections help gradients flow, and what normalization stabilizes',
		'time' => '30-40 min',
		'math' => 30,
		'short' => 'resnetlab',
		'slugs' => ['resnetlab', 'normalizationlab'],
		'deep' => ['topology', 'origami'],
	],
	12 => [
		'title' => 'How Machines See',
		'summary' => 'A computer does not see an object; it sees a grid of numbers. Convolution is how it learns to find edges, parts, and then objects.',
		'blurb' => 'Convolutional networks reuse the same small filter across an image, so they can spot a pattern wherever it appears. Inceptionism turns the network around and shows what its features are looking for.',
		'goal' => 'explain what a convolution does, and why a network\'s "seeing" is different from human seeing',
		'time' => '30-40 min',
		'math' => 25,
		'short' => 'computer_vision',
		'slugs' => ['computer_vision', 'inceptionism'],
		'deep' => ['deconvolution'],
	],
	13 => [
		'title' => 'Connecting Images and Words',
		'summary' => 'Multimodal models put images and text in the same space; diffusion models generate images by learning to undo noise.',
		'blurb' => 'How does a model know that a photo of a dog and the word "dog" belong together? And how does it create a new image from a sentence? Two different tricks, one shared idea: learn the structure of the data.',
		'goal' => 'explain image-text alignment and the basic idea of diffusion generation',
		'time' => '30-40 min',
		'math' => 30,
		'short' => 'multimodal',
		'slugs' => ['multimodal', 'diffusion'],
		'deep' => [],
	],
	14 => [
		'title' => 'Sound, Music, and Video',
		'summary' => 'Audio becomes small pieces, video becomes a sequence of frames, and the same prediction trick starts to work for sound and motion.',
		'blurb' => 'Speech models turn waveforms into pieces they can predict. Music and video models extend the recipe to longer, richer signals. This is the generative stack beyond text.',
		'goal' => 'explain how audio and video can be turned into something a transformer can predict',
		'time' => '30-40 min',
		'math' => 20,
		'short' => 'speech_audio',
		'slugs' => ['speech_audio', 'music_video_generation'],
		'deep' => [],
	],
	15 => [
		'title' => 'The Stack Underneath',
		'summary' => 'A model is a file; software is what turns it into something you can run. Operating systems, programming languages, and libraries are the invisible stack.',
		'blurb' => 'Before a model can answer a question, a lot of ordinary software has to work: memory, files, processes, networks, and the abstraction layers that hide the hardware. This is a gentle tour of the machinery under the magic.',
		'goal' => 'explain what an operating system, a programming language, and a library each do -- and where the model sits',
		'time' => '15-20 min',
		'math' => 0,
		'short' => 'software',
		'slugs' => ['software'],
		'deep' => ['training_infrastructure', 'production_serving', 'inference_optimization'],
	],
	16 => [
		'title' => 'Chopping Text into Tokens',
		'summary' => 'A model never sees words. It sees tokens -- chunks of text -- and turns each token into a vector. Meaning becomes geometry.',
		'blurb' => 'Tokenization explains why models can struggle to count letters or spell unusual names. Embeddings explain how those tokens get positions in a space where similar meanings sit close together.',
		'goal' => 'explain why "strawberry" is not one token, and what an embedding is',
		'time' => '30-40 min',
		'math' => 25,
		'short' => 'tokenizerlab',
		'slugs' => ['tokenizerlab', 'embeddinglab'],
		'deep' => ['coherent_difference', 'coherent_world_models'],
	],
	17 => [
		'title' => 'Memory and Attention',
		'summary' => 'Recurrent networks carried memory through a loop; attention let every token look at every other token at once. The second idea changed everything.',
		'blurb' => 'Before transformers, sequence models read text one step at a time. Attention removed the queue: each word can gather information from any other word, which is why long-range context became possible.',
		'goal' => 'explain the difference between recurrence and attention, and why attention is parallel',
		'time' => '30-40 min',
		'math' => 30,
		'short' => 'attentionlab',
		'slugs' => ['recurrent_networks', 'attentionlab'],
		'deep' => [],
	],
	18 => [
		'title' => 'Position and the Transformer',
		'summary' => 'Attention alone has no sense of order. Positional information plus attention plus feed-forward layers gives the transformer block.',
		'blurb' => 'This is the day the pieces snap together. You will see how a transformer knows word order, how its blocks are wired, and why the same architecture works for text, images, and audio.',
		'goal' => 'describe the parts of a transformer block, and explain why position has to be added explicitly',
		'time' => '35-45 min',
		'math' => 35,
		'short' => 'transformer',
		'slugs' => ['positionalembeddingslab', 'transformer'],
		'deep' => ['alternative_architectures', 'mixture_of_experts', 'origami'],
	],
	19 => [
		'title' => 'Choosing the Next Token',
		'summary' => 'The model outputs a probability for every token; sampling turns that distribution into a sentence. Interpretability asks what happened inside.',
		'blurb' => 'Temperature and top-p are the knobs that make an assistant creative or predictable. Mechanistic interpretability is the reverse-engineering project: finding the circuits that produce the behavior. We also look at abilities nobody explicitly trained for.',
		'goal' => 'explain temperature and top-p, and what it means to "look inside" a model',
		'time' => '35-45 min',
		'math' => 30,
		'short' => 'samplinglab',
		'slugs' => ['samplinglab', 'mechanistic_interpretability', 'unexpected_capabilities'],
		'deep' => ['topology'],
	],
	20 => [
		'title' => 'Where Facts Live',
		'summary' => 'A model can recall "Paris is the capital of France" without a database. And it can follow an algorithm that exists only in the prompt.',
		'blurb' => 'Fact lookup asks where a stored fact lives inside the network; the algorithms lesson asks how a transformer executes a procedure it was never trained on. Both are about the strange middle ground between memory and reasoning.',
		'goal' => 'explain the difference between a fact stored in weights and an algorithm run in context',
		'time' => '30-40 min',
		'math' => 25,
		'short' => 'fact_lookup',
		'slugs' => ['fact_lookup', 'algorithms'],
		'deep' => ['symbolic_ai'],
	],
	21 => [
		'title' => 'Context, Memory, and Search',
		'summary' => 'The context window is the model\'s working memory; vector search is how it finds relevant text outside that window.',
		'blurb' => 'A model can only attend to what is in its context. Context windows decide how much that is. Vector databases let a system retrieve the right document before the model ever sees the question.',
		'goal' => 'explain what fits in a context window, and how semantic search finds "similar meaning"',
		'time' => '30-40 min',
		'math' => 25,
		'short' => 'contextwindows',
		'slugs' => ['contextwindows', 'vectorsearch'],
		'deep' => [],
	],
	22 => [
		'title' => 'Turning a Model into an Assistant',
		'summary' => 'A pretrained model is a raw next-word predictor. Post-training teaches it to follow instructions, and the training data decides what it learns.',
		'blurb' => 'Fine-tuning, instruction tuning, and preference learning are the steps that turn a base model into something helpful. Behind them sits a huge, carefully curated dataset -- and a lot of human judgment.',
		'goal' => 'explain the difference between pretraining and post-training, and why data curation matters',
		'time' => '30-40 min',
		'math' => 20,
		'short' => 'finetuninglab',
		'slugs' => ['finetuninglab', 'training_data'],
		'deep' => ['training_infrastructure', 'production_serving'],
	],
	23 => [
		'title' => 'When the Model Does Not Know',
		'summary' => 'A language model is optimized to produce plausible text, not true text. Retrieval gives it documents to ground its answer.',
		'blurb' => 'Hallucinations are not a bug you can patch once; they follow from how the model is trained. RAG and web search are the practical fix: find relevant, fresh text and put it in front of the model before it answers.',
		'goal' => 'explain why models make things up, and how retrieval changes the odds',
		'time' => '35-45 min',
		'math' => 15,
		'short' => 'hallucinations',
		'slugs' => ['hallucinations', 'rag', 'websearch'],
		'deep' => [],
	],
	24 => [
		'title' => 'Agents, Tools, and Risks',
		'summary' => 'An agent wraps a model in a loop with tools, a plan, and a memory. That power also creates new ways to fail.',
		'blurb' => 'Agents can search, write files, run code, and call other services. Running a model locally gives you privacy and control. But prompt injection and jailbreaks show that a model reading untrusted text is a security boundary, not just a chatbot.',
		'goal' => 'explain the agent loop, the appeal of local models, and why prompt injection is hard to fix',
		'time' => '35-45 min',
		'math' => 15,
		'short' => 'agents',
		'slugs' => ['agents', 'security_inference', 'running_locally'],
		'deep' => ['production_serving'],
	],
	25 => [
		'title' => 'Reasoning and Evaluation',
		'summary' => 'Chain-of-thought and test-time compute let a model think longer; benchmarks try to measure whether the thinking is real.',
		'blurb' => 'Reasoning models spend more computation before answering, often by generating intermediate steps. Evaluation asks the uncomfortable question: are we measuring capability, or just performance on the test? Calibration asks whether the model knows when it is unsure.',
		'goal' => 'explain test-time compute and why a benchmark score is not the same as understanding',
		'time' => '35-45 min',
		'math' => 25,
		'short' => 'reasoning',
		'slugs' => ['reasoning', 'evaluation', 'reliability'],
		'deep' => ['trainingdynamics'],
	],
	26 => [
		'title' => 'The Craft and the Cost',
		'summary' => 'Prompting is the practical interface; inference is the economic engine. A token has a price because serving a model is real computation.',
		'blurb' => 'Small changes in a prompt can change a result, but prompting is not magic -- it is clear communication with a statistical model. On the other side, training and inference are different regimes, and the cost of a token shapes what products are possible.',
		'goal' => 'write a clearer prompt, and explain why inference is not the same as training',
		'time' => '35-45 min',
		'math' => 20,
		'short' => 'promptengineering',
		'slugs' => ['promptengineering', 'inference_vs_training', 'ai_economics'],
		'deep' => ['inference_optimization', 'trainingdynamics'],
	],
	27 => [
		'title' => 'The Global Map',
		'summary' => 'AI is not only a Silicon Valley story. Compute, data, talent, and regulation are distributed unevenly around the world.',
		'blurb' => 'Who builds frontier models, who supplies the chips, and who is left out? The global ecosystem is also an information market: models change what is cheap to produce, and that changes what is worth knowing. The last link asks what lies beyond the transformer.',
		'goal' => 'describe the main players in the global AI ecosystem, and one way AI changes the market for information',
		'time' => '35-45 min',
		'math' => 15,
		'short' => 'global_ai_ecosystem',
		'slugs' => ['global_ai_ecosystem', 'information_market', 'beyond_llms'],
		'deep' => [],
	],
	28 => [
		'title' => 'Minds and Mirrors',
		'summary' => 'The brain is not a computer, and a model is not a brain. But the comparison is useful in both directions -- if we are careful about what we mean.',
		'blurb' => 'How did evolution build a mind that could invent computation? What do attention, memory, and prediction look like when we compare brains and machines? And what can we actually say about representation, meaning, and the metaphysics of it all?',
		'goal' => 'compare brains and machines without hype, and name one question the comparison leaves open',
		'time' => '35-45 min',
		'math' => 15,
		'short' => 'human_mind',
		'slugs' => ['human_mind', 'mirror_in_machine', 'metaphysics_of_ai'],
		'deep' => [],
	],
	29 => [
		'title' => 'The Frontier and the Rules',
		'summary' => 'The research frontier is betting on new architectures and new kinds of reasoning. The alignment problem asks how to keep powerful systems pointed at human goals.',
		'blurb' => 'What comes after the current generation of models? And who decides how they are built, deployed, and audited? This day pairs the technical frontier with the alignment question and the legal landscape -- three different ways of asking "what could go wrong?"',
		'goal' => 'explain one frontier bet, the core alignment problem, and one way law is trying to catch up',
		'time' => '35-45 min',
		'math' => 20,
		'short' => 'frontier',
		'slugs' => ['frontier', 'alignment', 'law_regulation'],
		'deep' => [],
	],
	30 => [
		'title' => 'Science, Society, and Risk',
		'summary' => 'AI is changing how science is done, how culture is made, and how risk is discussed. The honest answer is a mix of evidence, uncertainty, and values.',
		'blurb' => 'Protein-folding systems like AlphaFold are turning prediction into discovery. At the same time, AI is changing art, work, education, and truth. The last link separates the existential-risk hypothesis from what remains speculation.',
		'goal' => 'describe one concrete benefit of AI for science, one social tension, and what makes existential risk hard to assess',
		'time' => '35-45 min',
		'math' => 10,
		'short' => 'ai_for_science',
		'slugs' => ['ai_for_science', 'ai_and_society', 'ai_existential_risk'],
		'deep' => [],
	],
	31 => [
		'title' => 'The People and the Map',
		'summary' => 'Ideas do not arrive alone. They arrive through people, arguments, and institutions -- and the whole course can be seen as one connected map.',
		'blurb' => 'Start with the philosophical questions that remain open, then meet the recurring cast behind the machine. End with the Atlas: a globe of every person, place, and idea in the course. Close the year by zooming out.',
		'goal' => 'name a few people behind the ideas you have met, and explain how the Atlas connects them',
		'time' => '35-45 min',
		'math' => 10,
		'short' => 'people_of_ai',
		'slugs' => ['philosophy', 'people_of_ai', 'atlas'],
		'deep' => [],
	],
];

function mn_december_accent(int $part): string {
	$map = [
		1 => 'sky',
		2 => 'emerald',
		3 => 'accent',
		4 => 'coral',
		5 => 'rose',
		6 => 'text-secondary',
	];
	return $map[$part] ?? 'accent';
}

function mn_december_part_label(array $parts): string {
	$parts = array_values(array_unique(array_map('intval', $parts)));
	sort($parts);
	if (!$parts) return '';
	if (count($parts) === 1) return 'Part ' . $parts[0];
	return 'Parts ' . $parts[0] . '-' . end($parts);
}

function mn_december_part_title(array $parts): string {
	$parts = array_values(array_unique(array_map('intval', $parts)));
	sort($parts);
	if (!$parts) return '';
	$titles = course_part_titles();
	$names = [];
	foreach ($parts as $part) {
		$names[] = 'Part ' . $part . (isset($titles[$part]['title']) ? ' · ' . $titles[$part]['title'] : '');
	}
	return implode(' / ', $names);
}

function mn_december_parts_for(array $slugs, array $lessons): array {
	$parts = [];
	foreach ($slugs as $slug) {
		if (isset($lessons[$slug])) $parts[] = (int)$lessons[$slug]['part'];
	}
	return $parts;
}

function mn_december_math_label(int $level): string {
	if ($level <= 10) return 'No math needed';
	if ($level <= 30) return 'Light math';
	if ($level <= 55) return 'Some math';
	return 'Math helps';
}

$mn_december_article_count = 0;
$mn_december_parts_seen = [];
$mn_december_deep_seen = [];
foreach ($mn_december_days as $mn_day) {
	foreach ($mn_day['slugs'] as $mn_slug) {
		if (!isset($mn_december_lessons[$mn_slug])) continue;
		$mn_december_article_count++;
		$mn_december_parts_seen[(int)$mn_december_lessons[$mn_slug]['part']] = true;
	}
	foreach ($mn_day['deep'] as $mn_slug) {
		if (!isset($mn_december_lessons[$mn_slug])) continue;
		$mn_december_deep_seen[$mn_slug] = true;
	}
}
$mn_december_today = (int)date('n') === 12 ? (int)date('j') : 0;
?>

<div class="md" data-lesson-id="december">
## Thirty-One Doors into AI

This is a guided path for a curious person, not a course for specialists. You do not need calculus, programming, or a GPU. Each day opens one idea, points you to the clearest lesson that explains it, and tells you what you will be able to explain afterward.

The month has six sections. The first days are the gentlest; the middle is the technical core; the last days zoom out. If a day feels heavy, read the first link and stop there. The calendar is a map, not a test -- and you can start today, not only in December.

**How to use it:** each card gives a short reading path, a rough time, and how much math it uses. A "Short on time?" line points to the one article to read if you only have ten minutes. Optional deep dives are tucked away at the bottom of the card. Read one door a day, or jump to whatever you need. The last sections are a little denser; take two days for a card if you like.

**Prefer ten-minute lessons?** The [31-door calendar](tenminutes/advent.html) opens the compact lessons in the ScaDS.AI visual style, with interactive demos and saved progress. Doors that are not distilled yet link to the full chapter.
</div>

<div class="mn-december-meta">
	<span><strong>31</strong> days</span>
	<span><strong><?php echo $mn_december_article_count; ?></strong> main articles</span>
	<span><strong><?php echo count($mn_december_deep_seen); ?></strong> optional deep dives</span>
	<span><strong><?php echo count($mn_december_sections); ?></strong> sections</span>
	<span>Made for a general reader</span>
</div>

<div class="mn-december-route-wrap">
	<p class="mn-december-route-label">The shape of the month</p>
	<ol class="mn-december-route" aria-label="The six sections of the calendar">
<?php foreach ($mn_december_sections as $mn_section_num => $mn_section): ?>
		<li>
			<a href="#week-<?php echo (int)$mn_section_num; ?>">
				<span class="mn-december-route-num"><?php echo (int)$mn_section_num; ?></span>
				<span class="mn-december-route-body">
					<strong><?php echo htmlspecialchars($mn_section['title']); ?></strong>
					<em>Days <?php echo (int)min($mn_section['days']); ?>-<?php echo (int)max($mn_section['days']); ?></em>
				</span>
			</a>
		</li>
<?php endforeach; ?>
	</ol>
</div>

<div class="mn-december-legend-wrap">
	<p class="mn-december-legend-label">Colors show which part of the course a lesson comes from</p>
	<div class="mn-december-legend" aria-label="Color key for course parts">
<?php
$mn_december_part_titles = course_part_titles();
foreach ($mn_december_part_titles as $mn_part_num => $mn_part_info):
	$mn_part_color = mn_december_accent((int)$mn_part_num);
?>
		<span><i style="--legend-color: var(--mn-<?php echo htmlspecialchars($mn_part_color); ?>)"></i>Part <?php echo (int)$mn_part_num; ?> · <?php echo htmlspecialchars($mn_part_info['title']); ?></span>
<?php endforeach; ?>
	</div>
</div>

<?php if ($mn_december_today > 0): ?>
<p class="mn-december-jump"><a href="#day-<?php echo $mn_december_today; ?>">Open today's door</a></p>
<?php else: ?>
<p class="mn-december-jump"><a href="#day-1">Start with Day 1</a></p>
<?php endif; ?>

<?php foreach ($mn_december_sections as $mn_section_num => $mn_section): ?>
<div class="md mn-december-week-intro" id="week-<?php echo (int)$mn_section_num; ?>">
## Section <?php echo (int)$mn_section_num; ?> · <?php echo htmlspecialchars($mn_section['title']); ?>

**<?php echo htmlspecialchars($mn_section['question']); ?>** <?php echo htmlspecialchars($mn_section['intro']); ?>
</div>

<div class="mn-december-grid">
<?php foreach ($mn_section['days'] as $mn_day_num): ?>
<?php
	if (!isset($mn_december_days[$mn_day_num])) continue;
	$mn_day = $mn_december_days[$mn_day_num];
	$mn_day_parts = mn_december_parts_for($mn_day['slugs'], $mn_december_lessons);
	if (!$mn_day_parts) continue;
	$mn_day_part_label = mn_december_part_label($mn_day_parts);
	$mn_day_part_title = mn_december_part_title($mn_day_parts);
	$mn_day_accent = mn_december_accent(min($mn_day_parts));
	$mn_is_today = ($mn_december_today === (int)$mn_day_num);
	$mn_short_lesson = $mn_december_lessons[$mn_day['short']] ?? null;
	$mn_deep_lessons = [];
	foreach ($mn_day['deep'] as $mn_slug) {
		if (isset($mn_december_lessons[$mn_slug])) $mn_deep_lessons[] = $mn_december_lessons[$mn_slug];
	}
?>
	<article class="mn-december-day<?php echo $mn_is_today ? ' is-today' : ''; ?>" id="day-<?php echo (int)$mn_day_num; ?>" style="--day-accent: var(--mn-<?php echo htmlspecialchars($mn_day_accent); ?>)" aria-labelledby="day-<?php echo (int)$mn_day_num; ?>-title">
		<div class="mn-december-day-top">
			<span class="mn-december-day-num" aria-hidden="true"><?php echo str_pad((string)$mn_day_num, 2, '0', STR_PAD_LEFT); ?></span>
			<span class="mn-december-day-part" title="<?php echo htmlspecialchars($mn_day_part_title); ?>"><?php echo htmlspecialchars($mn_day_part_label); ?></span>
			<?php if ($mn_is_today): ?><span class="mn-december-today">Today</span><?php endif; ?>
		</div>
		<h3 id="day-<?php echo (int)$mn_day_num; ?>-title"><?php echo htmlspecialchars($mn_day['title']); ?></h3>
		<p class="mn-december-summary"><span class="mn-december-label">In one sentence</span><?php echo htmlspecialchars($mn_day['summary']); ?></p>
		<p class="mn-december-blurb"><?php echo htmlspecialchars($mn_day['blurb']); ?></p>
		<p class="mn-december-goal"><span class="mn-december-label">After today</span>you can <?php echo htmlspecialchars($mn_day['goal']); ?>.</p>
		<div class="mn-december-badges">
			<span class="mn-december-badge"><?php echo htmlspecialchars($mn_day['time']); ?></span>
			<span class="mn-december-badge"><?php echo htmlspecialchars(mn_december_math_label((int)$mn_day['math'])); ?></span>
		</div>
<?php if (count($mn_day['slugs']) > 1 && $mn_short_lesson): ?>
		<p class="mn-december-short">Short on time? Start with <a href="<?php echo htmlspecialchars($mn_short_lesson['url']); ?>"><?php echo htmlspecialchars($mn_short_lesson['title']); ?></a>.</p>
<?php endif; ?>
		<ol class="mn-december-articles">
<?php foreach ($mn_day['slugs'] as $mn_slug): ?>
<?php
			if (!isset($mn_december_lessons[$mn_slug])) continue;
			$mn_lesson = $mn_december_lessons[$mn_slug];
?>
			<li><a href="<?php echo htmlspecialchars($mn_lesson['url']); ?>" title="<?php echo htmlspecialchars($mn_lesson['description'] ?? ''); ?>"><?php echo htmlspecialchars($mn_lesson['title']); ?></a></li>
<?php endforeach; ?>
		</ol>
<?php if ($mn_deep_lessons): ?>
		<details class="mn-december-deep">
			<summary>Go deeper (optional)</summary>
			<ul>
<?php foreach ($mn_deep_lessons as $mn_lesson): ?>
				<li><a href="<?php echo htmlspecialchars($mn_lesson['url']); ?>" title="<?php echo htmlspecialchars($mn_lesson['description'] ?? ''); ?>"><?php echo htmlspecialchars($mn_lesson['title']); ?></a></li>
<?php endforeach; ?>
			</ul>
		</details>
<?php endif; ?>
	</article>
<?php endforeach; ?>
</div>
<?php endforeach; ?>

<div class="md">
## After December

You have not learned to train a frontier model, and that was never the point. You have learned the vocabulary, the shape of the pipeline, and the questions worth asking. If you want to keep going, the [course overview](index.php) has the full shelf, and the [Atlas](atlas.php) gives you the same material as a map.

A few specialist doors sit outside the main path: distributed training, serving stacks, inference kernels, and the deepest excursions into topology and category theory. They are all still in the course.
</div>

<div class="md">
## Further Doors

Use the calendar as a route, not a fence. If a side question grabbed you, follow it: [Training Infrastructure](training_infrastructure.php), [Production Serving](production_serving.php), [Inference Optimization](inference_optimization.php), [Topology](topology.php), [The Shape of Holes](geometry_iii.php), and [The Foam of Meaning](foam_of_meaning.php) are all one click away. The [Atlas](atlas.php) is the best place to see how the people, places, and ideas in these pages connect.
</div>

<style>
.mn-december-meta {
	display: flex;
	flex-wrap: wrap;
	gap: 0.35rem 1.1rem;
	margin: 0.2rem 0 1rem;
	padding: 0.7rem 0.95rem;
	background: var(--mn-bg-subtle);
	border-left: 3px solid var(--mn-accent);
	border-radius: 0 var(--mn-radius-sm) var(--mn-radius-sm) 0;
	font-size: 0.8rem;
	color: var(--mn-text-secondary);
}
.mn-december-meta strong {
	color: var(--mn-heading);
	font-weight: 600;
}
.mn-december-route-wrap {
	margin: 0 0 1.2rem;
}
.mn-december-route-label,
.mn-december-legend-label {
	margin: 0 0 0.4rem;
	font-family: var(--mn-font-mono);
	font-size: 0.62rem;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	color: var(--mn-text-muted);
}
.mn-december-route {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
	gap: 0.5rem;
	margin: 0;
	padding: 0;
	list-style: none;
}
.mn-december-route a {
	display: flex;
	gap: 0.55rem;
	align-items: flex-start;
	height: 100%;
	padding: 0.55rem 0.65rem;
	background: var(--mn-surface);
	border: 1px solid var(--mn-border);
	border-radius: var(--mn-radius-sm);
	color: var(--mn-text);
	text-decoration: none;
	transition: border-color 0.2s, transform 0.15s;
}
.mn-december-route a:hover,
.mn-december-route a:focus-visible {
	border-color: var(--mn-accent);
	transform: translateY(-1px);
}
.mn-december-route-num {
	flex: 0 0 auto;
	font-family: var(--mn-font-mono);
	font-size: 0.66rem;
	line-height: 1.35;
	color: var(--mn-accent);
}
.mn-december-route-body strong {
	display: block;
	font-size: 0.8rem;
	line-height: 1.25;
	color: var(--mn-heading);
}
.mn-december-route-body em {
	display: block;
	margin-top: 0.15rem;
	font-family: var(--mn-font-mono);
	font-size: 0.6rem;
	font-style: normal;
	color: var(--mn-text-muted);
}
.mn-december-legend {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
	gap: 0.4rem 0.9rem;
	margin: 0 0 1.2rem;
	font-family: var(--mn-font-mono);
	font-size: 0.64rem;
	letter-spacing: 0.03em;
	color: var(--mn-text-muted);
}
.mn-december-legend span {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
}
.mn-december-legend i {
	display: inline-block;
	width: 0.5rem;
	height: 0.5rem;
	border-radius: 999px;
	background: var(--legend-color, var(--mn-accent));
}
.mn-december-jump {
	margin: 0 0 1.3rem;
	font-family: var(--mn-font-mono);
	font-size: 0.75rem;
}
.mn-december-jump a {
	display: inline-block;
	padding: 0.3rem 0.65rem;
	border: 1px solid var(--mn-accent);
	border-radius: 999px;
	color: var(--mn-accent);
	text-decoration: none;
}
.mn-december-jump a:hover,
.mn-december-jump a:focus-visible {
	background: var(--mn-accent);
	color: var(--mn-bg);
}
.mn-december-week-intro {
	margin-top: 1.8rem;
	padding-top: 1rem;
	border-top: 1px solid var(--mn-border);
	scroll-margin-top: 90px;
}
.mn-december-week-intro h2 {
	margin-bottom: 0.35rem;
}
.mn-december-week-intro p {
	margin-top: 0;
	color: var(--mn-text-secondary);
}
.mn-december-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
	gap: 0.9rem;
	margin: 0 0 1.4rem;
	align-items: stretch;
}
.mn-december-day {
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
	min-width: 0;
	padding: 0.95rem 1rem 1rem;
	background: var(--mn-surface);
	border: 1px solid var(--mn-border);
	border-top: 3px solid var(--day-accent, var(--mn-accent));
	border-radius: var(--mn-radius-md);
	scroll-margin-top: 90px;
	transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
}
.mn-december-day:hover {
	border-color: var(--day-accent, var(--mn-accent));
	box-shadow: 0 8px 22px -12px var(--mn-border);
	transform: translateY(-1px);
}
.mn-december-day.is-today {
	background: var(--mn-bg-warm);
	box-shadow: 0 0 0 2px var(--day-accent, var(--mn-accent));
}
.mn-december-day-top {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 0.5rem;
}
.mn-december-day-num {
	font-family: var(--mn-font-heading);
	font-size: 1.85rem;
	font-weight: 700;
	line-height: 0.9;
	color: var(--day-accent, var(--mn-accent));
	font-variant-numeric: tabular-nums;
}
.mn-december-day-part {
	font-family: var(--mn-font-mono);
	font-size: 0.61rem;
	line-height: 1.25;
	letter-spacing: 0.05em;
	text-transform: uppercase;
	color: var(--mn-text-muted);
}
.mn-december-today {
	margin-left: auto;
	padding: 0.08rem 0.4rem;
	border: 1px solid currentColor;
	border-radius: 999px;
	font-family: var(--mn-font-mono);
	font-size: 0.58rem;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: var(--day-accent, var(--mn-accent));
}
.mn-december-day h3 {
	margin: 0.1rem 0 0;
	font-size: 1.05rem;
	line-height: 1.28;
	color: var(--mn-heading);
}
.mn-december-label {
	display: block;
	margin-bottom: 0.12rem;
	font-family: var(--mn-font-mono);
	font-size: 0.56rem;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: var(--mn-text-muted);
}
.mn-december-summary {
	margin: 0;
	font-size: 0.88rem;
	line-height: 1.45;
	color: var(--mn-text);
}
.mn-december-blurb {
	margin: 0;
	font-size: 0.8rem;
	line-height: 1.45;
	color: var(--mn-text-secondary);
}
.mn-december-goal {
	margin: 0;
	padding: 0.45rem 0.55rem;
	background: var(--mn-bg-subtle);
	border-left: 2px solid var(--day-accent, var(--mn-accent));
	border-radius: 0 var(--mn-radius-sm) var(--mn-radius-sm) 0;
	font-size: 0.78rem;
	line-height: 1.4;
	color: var(--mn-text-secondary);
}
.mn-december-goal .mn-december-label {
	color: var(--day-accent, var(--mn-accent));
}
.mn-december-badges {
	display: flex;
	flex-wrap: wrap;
	gap: 0.3rem;
}
.mn-december-badge {
	padding: 0.12rem 0.4rem;
	border: 1px solid var(--mn-border);
	border-radius: 999px;
	font-family: var(--mn-font-mono);
	font-size: 0.6rem;
	letter-spacing: 0.03em;
	color: var(--mn-text-muted);
}
.mn-december-short {
	margin: 0;
	font-size: 0.75rem;
	line-height: 1.4;
	color: var(--mn-text-muted);
}
.mn-december-short a {
	color: var(--day-accent, var(--mn-accent));
	text-decoration: none;
	border-bottom: 1px solid currentColor;
}
.mn-december-articles {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	margin: 0.3rem 0 0;
	padding: 0.55rem 0 0;
	border-top: 1px solid var(--mn-border-light);
	list-style: none;
	font-size: 0.84rem;
	line-height: 1.35;
}
.mn-december-articles li {
	position: relative;
	padding-left: 0.9rem;
}
.mn-december-articles li::before {
	content: "→";
	position: absolute;
	left: 0;
	top: 0.08em;
	font-family: var(--mn-font-mono);
	font-size: 0.68rem;
	color: var(--day-accent, var(--mn-accent));
}
.mn-december-articles a {
	color: var(--mn-text);
	text-decoration: none;
	border-bottom: 1px solid transparent;
}
.mn-december-articles a:hover,
.mn-december-articles a:focus-visible {
	color: var(--day-accent, var(--mn-accent));
	border-bottom-color: currentColor;
	text-decoration: none;
}
.mn-december-deep {
	margin-top: 0.15rem;
	padding-top: 0.4rem;
	border-top: 1px dashed var(--mn-border-light);
}
.mn-december-deep summary {
	cursor: pointer;
	font-family: var(--mn-font-mono);
	font-size: 0.64rem;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: var(--mn-text-muted);
}
.mn-december-deep summary:hover,
.mn-december-deep summary:focus-visible {
	color: var(--day-accent, var(--mn-accent));
}
.mn-december-deep ul {
	margin: 0.35rem 0 0;
	padding-left: 1rem;
	font-size: 0.78rem;
	line-height: 1.4;
}
.mn-december-deep a {
	color: var(--mn-text-secondary);
	text-decoration: none;
	border-bottom: 1px solid transparent;
}
.mn-december-deep a:hover,
.mn-december-deep a:focus-visible {
	color: var(--day-accent, var(--mn-accent));
	border-bottom-color: currentColor;
}
@media (max-width: 600px) {
	.mn-december-grid {
		grid-template-columns: 1fr;
	}
}
@media (prefers-reduced-motion: reduce) {
	.mn-december-day,
	.mn-december-route a {
		transition: none;
	}
	.mn-december-day:hover,
	.mn-december-route a:hover {
		transform: none;
	}
}
</style>
