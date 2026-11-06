<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="From the human vocal tract to writing, grammar, and Shannon's information theory: the long prehistory of text that a language model learns from.">
	<meta name="theme-color" content="#ffffff">
	<title>Language as a Very Old Technology | Ten Minutes</title>
	<link rel="stylesheet" href="assets/site.css?v=20261104f">
</head>
<body data-lesson="language" data-page="lesson">
	<div class="readbar" aria-hidden="true"><span></span></div>

	<main id="main">
		<div class="shell">
			<section class="hero hero--lesson">
				<div>
					<h1>Language is a <em>very old technology.</em></h1>
					<p class="hero-deck">Before text could become training data, a speech apparatus, symbols, writing, and a way to measure information had to come into being. This is the long prehistory behind every token.</p>
				</div>
			</section>

			<div class="lesson-layout">
				<article class="lesson-main">
					<section class="section-block" id="idea">
						<div class="section-kicker"><span class="sk-num">01</span> The idea</div>
						<h2 class="section-title">Listening came first.</h2>
						<div class="prose">
							<p>The history of computing traces the ideas that made computation possible. The medium those ideas needed is language. But language did not start with a word. It started with an ear.</p>
							<p>Hearing is far older than speech. The ear is built from ancient hair cells, a cochlea, and a middle ear assembled from jaw bones; it is far older than humans. A fetus begins to hear before birth, and newborns prefer the voice they heard in the womb (<a href="https://pubmed.ncbi.nlm.nih.gov/7979483/" rel="noopener">Hepper and Shahidullah, 1994</a>; <a href="https://pubmed.ncbi.nlm.nih.gov/7375928/" rel="noopener">DeCasper and Fifer, 1980</a>). The channel that lets a child learn language was in place long before the first word was spoken.</p>
						</div>
						<figure>
							<img src="assets/img/ear-anatomy.svg" alt="Diagram of the human ear showing the outer, middle, and inner ear" loading="lazy">
							<figcaption>Anatomy of the human ear: outer ear (green), middle ear (red), inner ear (purple). Image: Lars Chittka; Axel Brockmann, <a href="https://commons.wikimedia.org/wiki/File:Anatomy_of_the_Human_Ear.svg" rel="noopener">CC BY 2.5</a>, via Wikimedia Commons.</figcaption>
						</figure>
						<div class="prose">
							<p>The human vocal tract can make a much wider range of sounds than those of other primates: the descended larynx, the vocal folds that sit in it, and fine motor control are part of the story, though the exact biological package is still debated. Genomic evidence suggests the human capacity for language was present at least 135,000 years ago, and in widespread social use by 100,000 years ago. That date comes from genetic and archaeological inference, not from a preserved organ of language; it is a range, not a timestamp.</p>
							<p>Languages themselves are diverse, and none is a simpler version of another. Pirahã, a small language of the Amazon, has about a dozen phonemes and marks tone and evidentiality; Everett (2005) argued that it lacks syntactic recursion, a claim other linguists dispute. Whether or not that claim holds, Pirahã shows that a fully grammatical language does not need a large sound inventory, writing, or a large speaker community. Early languages were not primitive; they were spoken, and speech leaves no direct fossil.</p>
							<p>Pāṇini's <a href="https://ia801807.us.archive.org/1/items/AshtadhyayiBhashyaCollection/019%20Ashtadhyayi%20Bhashyam-1-Dayananda_text.pdf" rel="noopener"><em>Aṣṭādhyāyī</em></a> (c. 4th century BCE) is the most complete surviving formal grammar, but it was not the first. Vedic phonetic and grammatical analysis, the Prātiśākhyas, and Yāška's <em>Nirukta</em> precede it. Pāṇini matters here because he described a language as a finite rule system that generates an unbounded set of sentences: the ambition that later formal grammars inherit.</p>
							<p>Speech is fleeting. Writing began with accounting: clay tokens for goods appeared around 8000 BCE, and by 3200 BCE marks pressed into tablets in Mesopotamia had become cuneiform. It did not begin as literature; it grew out of administration.</p>
						</div>
						<figure>
							<img src="../cuneiform.jpg" alt="An early cuneiform clay tablet" loading="lazy">
							<figcaption>Early cuneiform tablet, c. 2470 BCE. Image: Osama Shukir Muhammed Amin, <a href="https://commons.wikimedia.org/wiki/File:Clay_tablet_mentioning_the_name_of_Eannatum,_prince_of_Lagash._From_Iraq,_c._2470_BCE._Iraq_Museum.jpg" rel="noopener">CC BY-SA 4.0</a>, via Wikimedia Commons.</figcaption>
						</figure>
						<div class="prose">
							<p>The earliest alphabetic writing is much later. The Wadi el-Hol inscriptions in Upper Egypt, from about 1850 BCE, are among the oldest surviving alphabetic texts; whether they already carried a full script or only a few signs is not settled. Proto-Sinaitic writers in contact with Egyptian scribes borrowed a handful of hieroglyphs and used their first sounds: the sign for water became /m/, the sign for house became /b/. Scribes used pictures for their sounds rather than their meanings. That use was not a plan; it was a practice, and from it single letters eventually developed. A script of a few dozen signs replaced hundreds of pictures and made writing portable.</p>
							<p>Writing stored language outside the speaker, so a message could travel, survive, and be inspected long after the conversation ended. The principle is older than writing: the Lebombo bone and the other tally bones stored a count outside the mind in the same way.</p>
						</div>
						<figure>
							<img src="../wadielhol_inscription_i.jpg" alt="Wadi el-Hol inscription no. I, drawing" loading="lazy">
							<figcaption>Wadi el-Hol inscription no. I, drawing. Image: Marilyn Lundberg, West Semitic Research, <a href="https://commons.wikimedia.org/wiki/File:Wadi_el-Hol_inscriptions_I_drawing.jpg" rel="noopener">public domain</a>, via Wikimedia Commons.</figcaption>
						</figure>
					</section>

					<section class="section-block" id="detail">
						<div class="section-kicker"><span class="sk-num">02</span> The long background</div>
						<h2 class="section-title">From print to vectors.</h2>
						<div class="prose">
							<p>Printing was a scaling step. Around 1440, Gutenberg combined movable metal type, oil-based ink, and a modified wine press in Mainz. A scribe copied a book in months; a press could produce hundreds of identical pages in a day. Cheap, standard text made dictionaries, standard spelling, and a shared scientific record possible. That abundance is the corpus a language model later learns from.</p>
						</div>
						<figure>
							<img src="../gutenberg_press.jpg" alt="The Caxton Celebration: William Caxton showing specimens of printing to King Edward IV and his Queen" loading="lazy">
							<figcaption>The Caxton Celebration (1877): William Caxton showing specimens of his printing to King Edward IV and his Queen. Image: William Small, <em>The Graphic</em>, 1877, <a href="https://commons.wikimedia.org/wiki/File:The_Caxton_Celebration_-_William_Caxton_showing_specimens_of_his_printing_to_King_Edward_IV_and_his_Queen.jpg" rel="noopener">public domain</a>, via Wikimedia Commons.</figcaption>
						</figure>
						<div class="prose">
							<p>In 1948, Claude Shannon separated the message from its meaning and measured information in bits (<a href="https://archive.org/details/bstj27-3-379" rel="noopener">Shannon, 1948</a>). A bit is one yes/no answer, and the information in a message is the uncertainty it removes. That measure is also the training signal of a language model: the model does not need to understand a sentence to predict the next token; it needs a representation of the text and a way to score its guess against what actually comes next. The score is a form of Shannon's information, because a good guess removes surprise. The deflationary reading is that prediction needs no understanding. Experiments with Othello-GPT suggest that a model trained only to predict the next move can still build an internal representation of the board (<a href="https://arxiv.org/abs/2210.13382" rel="noopener">Li et al., 2022</a>); how far that generalises to natural language is still an open question.</p>
						</div>
						<figure>
							<img src="../shannon.png" alt="Claude Shannon" loading="lazy">
							<figcaption>Claude Shannon, c. 1930. Image: UM Bentley Historical Library, <a href="https://commons.wikimedia.org/wiki/File:Claude_Shannon_c1930.png" rel="noopener">public domain</a>, via Wikimedia Commons.</figcaption>
						</figure>
						<div class="prose">
							<p>Firth's old slogan, “You shall know a word by the company it keeps” (<a href="https://archive.org/details/papersinlinguist0000firt" rel="noopener">Firth, 1957</a>), is the distributional idea: a word's meaning is the company it keeps. It is a claim about language, not about computers, and it was made decades before a machine could test it at scale.</p>
							<p><strong>Word2vec</strong> (<a href="https://arxiv.org/abs/1301.3781" rel="noopener">Mikolov et al., 2013</a>) made Firth's idea computable. It learned a vector by predicting a word from its neighbours or its neighbours from the word; subword tokenizers and modern embeddings followed. Tokens become vectors, and meaning becomes a pattern of distances and directions. The model inherits the whole stack (body, symbol, writing, information) and compresses it into weights.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Vocal tract</b><span>Genomic evidence points to at least 135,000 years ago; the descended larynx and pharynx made a wide range of sounds possible.</span></div>
							<div class="keypoint"><b>External memory</b><span>Writing (c. 3200 BCE) and oral tradition store language outside the speaker.</span></div>
							<div class="keypoint"><b>Grammar</b><span>Pāṇini treated language as a rule system in the 4th century BCE.</span></div>
							<div class="keypoint"><b>Information</b><span>Shannon made messages measurable in 1948; that made them computable.</span></div>
							<div class="keypoint"><b>Geometry</b><span>Word2vec and modern embeddings turn meaning into distances and directions.</span></div>
						</div>
					</section>

					<section class="section-block" id="machine">
						<div class="section-kicker"><span class="sk-num">03</span> The machine learns to speak</div>
						<h2 class="section-title">From bellows to text-to-speech.</h2>
						<div class="prose">
							<p>Wolfgang von Kempelen's speaking machine (1791) was the first serious attempt to build human speech from parts: a bellows for the lungs, reeds for the larynx, and a leather mouth shaped by the operator's hand. It could say words and short phrases, and it made the point that speech is a physical process that can be engineered.</p>
							<p>Kempelen's machine was mechanical, not digital, but it belongs to the same lineage as modern text-to-speech. The problem he posed, namely how to turn a stream of symbols into audible language, is still the problem a speech synthesizer solves.</p>
						</div>
						<figure>
							<img src="assets/img/kempelen-speaking-machine.jpg" alt="A replica of Wolfgang von Kempelen's speaking machine" loading="lazy">
							<figcaption>Replica of Kempelen's speaking machine. Image: Fabian Brackhane, <a href="https://commons.wikimedia.org/wiki/File:KEMPELEN_Speaking_Machine_Replica_2017.png" rel="noopener">Wikimedia Commons</a>, CC BY-SA 4.0.</figcaption>
						</figure>
						<div class="video-embed">
							<button type="button" class="video-play" data-youtube="k_YUB_S6Gpo">Play a reconstruction of Kempelen's speaking machine</button>
							<p class="video-note">Video: Fabian Brackhane, <a href="https://www.youtube.com/watch?v=k_YUB_S6Gpo" rel="noopener">YouTube</a>.</p>
						</div>
					</section>

					<section class="section-block" id="extra">
						<div class="section-kicker"><span class="sk-num">04</span> What the model inherits</div>
						<h2 class="section-title">From text to vectors.</h2>
						<div class="prose">
							<p>Text reaches a model as tokens. A tokenizer cuts the string into pieces from a fixed vocabulary: whole words, word fragments, punctuation, and bytes. The token ID is the only thing the model sees; the original characters are gone. That is why a model can be bad at spelling: it may never see the letters that make up a word, only the pieces the tokenizer chose. Byte-pair encoding learns those pieces from frequency, so common strings become single tokens and rare ones split.</p>
							<p>Each token ID indexes a row in an embedding table and becomes a vector. The table has one row per vocabulary item; a 100,000-token vocabulary with 4,000 dimensions is already 400 million numbers, before any transformer layer. The distributional idea is old: “You shall know a word by the company it keeps” (<a href="https://archive.org/details/papersinlinguist0000firt" rel="noopener">Firth, 1957</a>). Words used in similar contexts end up with similar vectors. Word2vec (<a href="https://arxiv.org/abs/1301.3781" rel="noopener">Mikolov et al., 2013</a>) made that idea computable at scale by learning vectors that predict a word from its neighbours, or its neighbours from the word.</p>
							<p>A direction in that space can carry a relationship, such as the direction from “man” to “woman”, but the famous king − man + woman ≈ queen analogy is an illustration, not a law. It works on some embeddings and some pairs, and fails on others. The geometry is shaped by the training signal, and that signal is prediction: the model is rewarded for making the next token more likely, not for matching definitions.</p>
							<p>That is the inheritance. Writing made text durable, Shannon made it measurable (<a href="https://archive.org/details/bstj27-3-379" rel="noopener">Shannon, 1948</a>), and word2vec made it geometric (<a href="https://arxiv.org/abs/1301.3781" rel="noopener">Mikolov et al., 2013</a>), building on Firth's distributional idea (<a href="https://archive.org/details/papersinlinguist0000firt" rel="noopener">Firth, 1957</a>).</p>
						</div>
					</section>

					<div class="demo demo--paper timeline-shell" data-demo="timeline" data-arrow-nav>
						<div class="demo-head">
							<div>
								<p class="demo-title">The long prehistory of language technology <span>· demo</span></p>
								<p class="demo-sub">Follow the path from listening and speech to writing, grammar, printing, information, and tokens. Each step made text more durable, more comparable, or more computable.</p>
							</div>
						</div>
						<div class="demo-body">
							<div class="timeline-scroller">
								<button class="tl-scroll-btn" type="button" data-timeline-prev data-arrow-prev aria-label="Scroll left">‹</button>
								<div class="timeline-track" data-timeline-track role="group" aria-label="Steps in the history of language technology">
									<button class="tl-node is-active" type="button" data-meta="Before speech · Listening" data-title="Listening" data-body="Hearing is far older than speech. Hair cells, the cochlea, and the middle ear evolved long before humans existed, and a fetus hears the melody of its mother's voice before birth. The ear is the channel through which the structure of language enters the brain." data-image="assets/img/ear-anatomy.svg" data-image-link="https://commons.wikimedia.org/wiki/File:Anatomy_of_the_Human_Ear.svg" data-image-alt="Diagram of the human ear showing the outer, middle, and inner ear" data-image-caption="Anatomy of the human ear: outer ear (green), middle ear (red), inner ear (purple). Image: Lars Chittka; Axel Brockmann, CC BY 2.5, via Wikimedia Commons."><span class="tl-dot"></span><span class="tl-date">Before speech</span><span class="tl-name">Listening</span></button>
									<button class="tl-node" type="button" data-meta="c. 135,000 BCE · Speech" data-title="Speech" data-body="Genomic evidence suggests the capacity for language was present at least 135,000 years ago. A descended larynx and a longer pharynx gave the tongue room to shape a wide range of sounds; spoken language made culture cumulative." data-image="../blombosochre.jpg" data-image-link="https://www.donsmaps.com/blombos.html" data-image-alt="Engraved ochre from Blombos Cave with a cross-hatched pattern" data-image-caption="Blombos Cave ochre, c. 73,000 BCE: symbolic marking, not speech itself. Image: Chris Henshilwood, CC BY 2.5."><span class="tl-dot"></span><span class="tl-date">c. 135,000 BCE</span><span class="tl-name">Speech</span></button>
									<button class="tl-node" type="button" data-meta="c. 3200 BCE · Writing" data-title="Writing" data-body="Clay tokens appear around 8000 BCE; by c. 3200 BCE cuneiform tablets in Mesopotamia carried full writing systems. Writing stored language outside the speaker: it could travel, survive, and be inspected long after the conversation ended." data-image="../cuneiform.jpg" data-image-link="https://commons.wikimedia.org/wiki/File:Clay_tablet_mentioning_the_name_of_Eannatum,_prince_of_Lagash._From_Iraq,_c._2470_BCE._Iraq_Museum.jpg" data-image-alt="An early cuneiform clay tablet" data-image-caption="Early cuneiform tablet, c. 2470 BCE. Image: Osama Shukir Muhammed Amin, CC BY-SA 4.0, via Wikimedia Commons."><span class="tl-dot"></span><span class="tl-date">c. 3200 BCE</span><span class="tl-name">Writing</span></button>
									<button class="tl-node" type="button" data-meta="c. 1850 BCE · Early alphabetic script" data-title="Early alphabetic script" data-body="The Wadi el-Hol inscriptions in Upper Egypt, from about 1850 BCE, are among the oldest surviving alphabetic texts. Proto-Sinaitic writers borrowed a handful of Egyptian signs and used their first sounds; whether Wadi el-Hol already carried a full script or only a few signs is not settled." data-image="../wadielhol_inscription_i.jpg" data-image-link="https://commons.wikimedia.org/wiki/File:Wadi_el-Hol_inscriptions_I_drawing.jpg" data-image-alt="Wadi el-Hol inscription no. I, drawing" data-image-caption="Wadi el-Hol inscription no. I, drawing. Image: Marilyn Lundberg, West Semitic Research, public domain, via Wikimedia Commons."><span class="tl-dot"></span><span class="tl-date">c. 1850 BCE</span><span class="tl-name">Early alphabetic script</span></button>
									<button class="tl-node" type="button" data-meta="c. 1050 BCE · Alphabet" data-title="Alphabet" data-body="Proto-Sinaitic writers repurposed Egyptian signs acrophonically; by c. 1050 BCE the Phoenician abjad had 22 letters. The Greek addition of vowels around 800 BCE made the first true alphabet." data-image="../history_of_a.png" data-image-link="https://en.wikipedia.org/wiki/A" data-image-alt="The history of the letter A, from an ox pictogram to the modern letter" data-image-caption="History of the letter A, from ox pictogram to alphabet. Image: Wikipedia contributors, CC BY-SA 4.0."><span class="tl-dot"></span><span class="tl-date">c. 1050 BCE</span><span class="tl-name">Alphabet</span></button>
									<button class="tl-node" type="button" data-meta="Before Pāṇini · Grammar" data-title="Grammar" data-body="Vedic phonetic and grammatical analysis, the Prātiśākhyas, and Yāska's Nirukta precede Pāṇini. His Aṣṭādhyāyī, around the 4th century BCE, is the most complete surviving formal grammar: a finite rule system that generates an unbounded set of sentences." data-image="../chomsky_hierarchy.svg" data-image-link="https://commons.wikimedia.org/wiki/File:Chomsky-hierarchy.svg" data-image-alt="Venn diagram of the Chomsky hierarchy of formal grammars" data-image-caption="The Chomsky hierarchy (1956) is a modern descendant of the rule-based view. Diagram: J. Finkelstein, CC BY-SA 3.0, via Wikimedia Commons."><span class="tl-dot"></span><span class="tl-date">Before Pāṇini</span><span class="tl-name">Grammar</span></button>
									<button class="tl-node" type="button" data-meta="c. 1440 · Printing" data-title="Printing" data-body="Gutenberg combined movable metal type, oil-based ink, and a modified wine press in Mainz. A scribe copied a book in months; a press could produce hundreds of identical pages in a day. Cheap, standard text made dictionaries, standard spelling, and a shared scientific record possible." data-image="../gutenberg_press.jpg" data-image-link="https://commons.wikimedia.org/wiki/File:The_Caxton_Celebration_-_William_Caxton_showing_specimens_of_his_printing_to_King_Edward_IV_and_his_Queen.jpg" data-image-alt="The Caxton Celebration: William Caxton showing specimens of printing to King Edward IV and his Queen" data-image-caption="The Caxton Celebration (1877): William Caxton showing specimens of his printing to King Edward IV and his Queen. Image: William Small, The Graphic, 1877, public domain, via Wikimedia Commons."><span class="tl-dot"></span><span class="tl-date">c. 1440</span><span class="tl-name">Printing</span></button>
									<button class="tl-node" type="button" data-meta="1791 · Talking machine" data-title="Talking machine" data-body="Wolfgang von Kempelen built a speaking machine from bellows, reeds, and a hand-shaped mouth. It could say words and short phrases: the first mechanical speech synthesizer, and an ancestor of text-to-speech." data-image="assets/img/kempelen-speaking-machine.jpg" data-image-link="https://commons.wikimedia.org/wiki/File:KEMPELEN_Speaking_Machine_Replica_2017.png" data-image-alt="A replica of Wolfgang von Kempelen's speaking machine" data-image-caption="Replica of Kempelen's speaking machine. Image: Fabian Brackhane, CC BY-SA 4.0, via Wikimedia Commons."><span class="tl-dot"></span><span class="tl-date">1791</span><span class="tl-name">Talking machine</span></button>
									<button class="tl-node" type="button" data-meta="1948 · Information" data-title="Information" data-body="Claude Shannon separated the message from its meaning and measured information in bits in 1948. A bit is one yes/no answer, and the information in a message is the uncertainty it removes. That made language measurable and, in principle, computable." data-image="../shannon.png" data-image-link="https://commons.wikimedia.org/wiki/File:Claude_Shannon_c1930.png" data-image-alt="Claude Shannon" data-image-caption="Claude Shannon, c. 1930. Image: UM Bentley Historical Library, public domain, via Wikimedia Commons."><span class="tl-dot"></span><span class="tl-date">1948</span><span class="tl-name">Information</span></button>
									<button class="tl-node" type="button" data-meta="1957 · Distributional meaning" data-title="Distributional meaning" data-body="Firth's slogan “You shall know a word by the company it keeps” is a claim about language: a word's meaning is the company it keeps. It was made decades before a machine could test it at scale, and it became the bridge from linguistics to embeddings."><span class="tl-dot"></span><span class="tl-date">1957</span><span class="tl-name">Distributional meaning</span></button>
									<button class="tl-node" type="button" data-meta="2013 · Embeddings" data-title="Embeddings" data-body="Word2vec learned a vector by predicting a word from its neighbours, or its neighbours from the word. Firth's slogan “You shall know a word by the company it keeps” became computable: similar contexts produce similar vectors, and directions carry relationships."><span class="tl-dot"></span><span class="tl-date">2013</span><span class="tl-name">Embeddings</span></button>
									<button class="tl-node" type="button" data-meta="2015–present · Tokens" data-title="Tokens" data-body="Subword tokenizers such as byte-pair encoding split text into reusable pieces; transformers then turn those token vectors into context-sensitive representations. Text became tokens, tokens became vectors, and meaning became geometry." data-image="assets/img/tokenization.svg" data-image-link="assets/img/tokenization.svg" data-image-alt="Diagram: the word unbelievable split into un, believ and able" data-image-caption="Original diagram: Ten Minutes, CC0 1.0 (public domain dedication)."><span class="tl-dot"></span><span class="tl-date">2015–present</span><span class="tl-name">Tokens</span></button>
								</div>
								<button class="tl-scroll-btn" type="button" data-timeline-next data-arrow-next aria-label="Scroll right">›</button>
							</div>
							<div class="tl-panel no-figure" data-timeline-panel aria-live="polite"></div>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>Listening came first, speech made culture cumulative, writing made it durable, computation made it measurable, and embeddings made it geometric.</span></div>
					</div>

					<div class="demo demo--paper" data-demo="ambiguity">
						<div class="demo-head">
							<div>
								<p class="demo-title">One sentence, two worlds <span>· demo</span></p>
								<p class="demo-sub">The syntax is fixed; the meaning is not. Click the highlighted phrase to switch readings. Context resolves the ambiguity.</p>
							</div>
							<span class="demo-badge">interactive</span>
						</div>
						<div class="demo-body">
							<div class="chip-row" data-ambiguity-chips></div>
							<div class="amb-sentence" style="margin-top:12px" data-ambiguity-sentence></div>
							<div class="amb-readings" data-ambiguity-readings></div>
							<p class="demo-hint" data-ambiguity-note></p>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>Language underdetermines meaning. A model is not choosing between dictionary entries; it is choosing the world in which the sentence makes sense.</span></div>
					</div>





					<section class="section-block" id="takeaway">
						<div class="section-kicker"><span class="sk-num">05</span> Takeaway</div>
						<h2 class="section-title">The short version.</h2>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">An LLM is the newest layer in a very old stack.</p>
							<p class="aha-sub">Body, symbol, writing, grammar, and information theory all had to be in place before text could become training data.</p>
						</div>
					</section>
				</article>
			</div>
		</div>
	</main>

	<script>
	(function () {
		"use strict";
		document.querySelectorAll("[data-youtube]").forEach(function (btn) {
			btn.addEventListener("click", function () {
				var id = btn.getAttribute("data-youtube");
				if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return;
				btn.outerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1" title="Kempelen speaking machine replica" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>';
			});
		});
	})();
	</script>
	<script src="assets/site.js"></script>
	<script src="assets/demos.js?v=20261104c"></script>
</body>
</html>
