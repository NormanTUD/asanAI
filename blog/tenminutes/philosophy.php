<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="Turing, grounding, Mary's Room, sentience, and what it would mean for a model to think.">
	<meta name="theme-color" content="#ffffff">
	<title>Minds, Meaning, and Machines | Ten Minutes</title>
	<link rel="stylesheet" href="assets/site.css?v=<?php echo filemtime(__DIR__.'/assets/site.css'); ?>">
</head>
<body data-lesson="philosophy" data-page="lesson" data-tm-reload-lang="1">
	<div class="readbar" aria-hidden="true"><span></span></div>

	<main id="main">
		<div class="shell">
			<section class="hero hero--lesson">
				<div>
					<h1>Can a machine <em>think?</em></h1>
					<p class="hero-deck">The question is easy to ask and hard to make precise. Behaviour, understanding, meaning, and experience are different things, and a model can have some without the others.</p>
				</div>
			</section>

			<div class="lesson-layout">
				<article class="lesson-main">
					<section class="section-block" id="idea">
						<div class="section-kicker"><span class="sk-num">01</span> Behaviour and presence</div>
						<h2 class="section-title">The Turing Test is not a definition.</h2>
						<div class="prose">
							<p>Society asked what the machine does to us. What is the machine? The Turing Test (<a href="https://phil415.pbworks.com/f/TuringComputing.pdf" rel="noopener">Turing, 1950</a>) is a behavioural proposal, if a machine can fool a human in conversation, should we call it intelligent? In its original form it is the <strong>imitation game</strong>: a judge holds a text-only conversation and tries to say which respondent is human and which is machine; Turing first described the game with a man and a woman instead. Turing offered it as a way to sidestep a metaphysical question, not as a definition of mind.</p>
							<p>A model can produce the right answer without the inner life we associate with thinking. The philosophical question is whether that distinction matters, and if so, how we could ever tell. It helps to separate <strong>intelligence</strong> (the capacity to solve problems, adapt, and generalise) from <strong>consciousness</strong>: the fact that there is something it is like to be the system. A thing can be intelligent without being conscious, and the reverse is at least conceivable.</p>
							<p>The <strong>Winograd Schema Challenge</strong> (<a href="https://cdn.aaai.org/ocs/4492/4492-21843-1-PB.pdf" rel="noopener">Levesque, Davis &amp; Morgenstern, 2012</a>) asks a sharper question than the imitation game. Two sentences differ by one word, and a pronoun resolves differently: “The trophy did not fit in the suitcase because it was too large” (it = the trophy) and “The trophy did not fit in the suitcase because it was too small” (it = the suitcase). A human uses a model of the situation. A system that only matches surface statistics can fail. The test is not a test of consciousness; it asks whether the model has a usable world model behind the words.</p>
						</div>
					</section>

					<section class="section-block" id="detail">
						<div class="section-kicker"><span class="sk-num">02</span> Grounding and experience</div>
						<h2 class="section-title">Meaning and the hard problem.</h2>
						<div class="prose">
							<p>Symbols in a computer are not connected to the world in the way human words are. The grounding problem asks how meaning gets attached to tokens. A model learns statistical relationships, but does it refer to anything? Searle's <strong>Chinese Room</strong> (<a href="https://doi.org/10.1017/S0140525X00005756" rel="noopener">Searle, 1980</a>) makes the worry vivid: a person in a room follows rules for manipulating Chinese symbols and produces plausible answers without understanding Chinese. If the room passes the test, has it understood? The argument is contested (the whole room might be the understanding system) but it names the gap precisely. An LLM is in exactly that position: it follows learned statistical rules over tokens, without direct access to the world those tokens refer to. Whether the whole system understands is the same open question.</p>
							<p>Mary's Room (<a href="https://www.sfu.ca/~jillmc/JacksonfromJStore.pdf" rel="noopener">Jackson, 1982</a>) and the hard problem of consciousness push on a different question: could a system know everything about colour and still never experience it? The <strong>hard problem</strong> (<a href="https://consc.net/papers/facing.pdf" rel="noopener">Chalmers, 1995</a>) is why any physical process feels like something at all; the easy problems are about function and behaviour, and the hard one is about experience. We have no accepted test for experience. That uncertainty is part of the answer, and it is also an ethical question: how should we treat systems whose status we cannot determine?</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Turing Test</b><span>A behavioural test, not a definition of mind.</span></div>
							<div class="keypoint"><b>Grounding</b><span>How do symbols connect to the world?</span></div>
							<div class="keypoint"><b>Experience</b><span>Behaviour does not settle the question of consciousness.</span></div>
							<div class="keypoint"><b>Uncertainty</b><span>The philosophical questions are open, not solved by a benchmark.</span></div>
						</div>
					</section>


					<figure>
						<img src="../alan_turing_1951.jpg" alt="Alan Turing, 1951" loading="lazy">
						<figcaption>Alan Turing, 1951. Photo: Elliott &amp; Fry, <a href="https://commons.wikimedia.org/wiki/File:Alan_Turing_(1951).jpg" rel="noopener">public domain</a>.</figcaption>
					</figure>

										<h4 class="layer-subhead">Four questions, not one</h4>
					<div class="prose"><p>Keep the questions separate: what the system does, what its symbols mean, what it is like to be it, and how we should treat it. The timeline maps those questions, not one verdict.</p></div>

<div class="demo demo--paper timeline-shell" data-demo="timeline" data-arrow-nav>
						<div class="demo-head">
							<div>
								<p class="demo-title">Four questions about minds <span>· demo</span></p>
								<p class="demo-sub">Behaviour, grounding, experience, and sentience are different questions. Select one.</p>
							</div>
						</div>
						<div class="demo-body">
							<div class="timeline-scroller">
								<button class="tl-scroll-btn" type="button" data-timeline-prev data-arrow-prev aria-label="Scroll left">‹</button>
								<div class="timeline-track" data-timeline-track role="group" aria-label="Four questions about minds">
									<button class="tl-node is-active" type="button" data-meta="01 · Behaviour" data-title="The Turing Test" data-body="Turing proposed a behavioural test, not a definition of mind. A good performance is not the same as experience."><span class="tl-dot"></span><span class="tl-date">01</span><span class="tl-name">Behaviour</span></button>
									<button class="tl-node" type="button" data-meta="02 · Grounding" data-title="The grounding problem" data-body="Symbols in a computer are not connected to the world the way human words are. How does meaning get attached?"><span class="tl-dot"></span><span class="tl-date">02</span><span class="tl-name">Grounding</span></button>
									<button class="tl-node" type="button" data-meta="03 · Mary" data-title="Mary's Room" data-body="Could a system know everything about colour and still never experience it? The thought experiment separates knowledge from experience."><span class="tl-dot"></span><span class="tl-date">03</span><span class="tl-name">Mary</span></button>
									<button class="tl-node" type="button" data-meta="04 · Open" data-title="Sentience" data-body="We have no accepted test for experience. That uncertainty is part of the answer."><span class="tl-dot"></span><span class="tl-date">04</span><span class="tl-name">Open</span></button>
								</div>
								<button class="tl-scroll-btn" type="button" data-timeline-next data-arrow-next aria-label="Scroll right">›</button>
							</div>
							<div class="tl-panel no-figure" data-timeline-panel aria-live="polite"></div>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>Behaviour, grounding, and experience are separate questions.</span></div>
					</div>

										<h4 class="layer-subhead">One word, two worlds</h4>
					<div class="prose"><p>A pronoun can resolve in two ways because the situation differs by one word. The demo asks whether the model uses a world model or only a surface pattern.</p></div>

<div class="demo demo--paper demo--interactive wg-demo">
						<div class="demo-head">
							<div>
								<p class="demo-title">Winograd Schema <span>· demo</span></p>
								<p class="demo-sub">One word changes the referent. A human uses a model of the situation; a surface matcher has to guess.</p>
							</div>
							<span class="demo-badge">interactive</span>
						</div>
						<div class="demo-body">
							<div class="wg-cases">
								<button class="wg-case is-on" type="button" data-wg-case="large">
									<span class="wg-sentence">The trophy did not fit in the suitcase because <b>it</b> was too large.</span>
									<span class="wg-answer">it = the trophy</span>
									<span class="wg-why">A trophy can be too large for a suitcase. The suitcase is the container, not the oversized object.</span>
								</button>
								<button class="wg-case" type="button" data-wg-case="small">
									<span class="wg-sentence">The trophy did not fit in the suitcase because <b>it</b> was too small.</span>
									<span class="wg-answer">it = the suitcase</span>
									<span class="wg-why">Now the container is too small. The syntax is almost identical, but the world picks a different referent.</span>
								</button>
							</div>
							<div class="demo-hint">Click a sentence to see what “it” refers to.</div>
						</div>
					</div>

										<h4 class="layer-subhead">Inside the room</h4>
					<div class="prose"><p><?php echo function_exists('tm_lang') && tm_lang() === 'de' ? 'Searles Zimmer prüft den Unterschied zwischen Regeln befolgen und verstehen. Du bist der Regelbefolger; das Regelbuch ist das Programm. Die Schrift ist Inuktitut; <a href="https://de.wikipedia.org/wiki/Inuktitut" rel="noopener">lies über Inuktitut</a>.' : 'Searle’s room tests the difference between following rules and understanding. You are the rule-follower; the rulebook is the program. The script is Inuktitut; <a href="https://en.wikipedia.org/wiki/Inuktitut" rel="noopener">read about Inuktitut</a>.'; ?></p></div>

<div class="demo demo--paper demo--interactive cr-sim" id="cr-sim">
						<div class="demo-head">
							<div>
								<p class="demo-title">The Chinese Room <span>· demo</span></p>
								<p class="demo-sub">You are locked inside the room. You do not speak Inuktitut. You have a rulebook. Follow it for six rounds.</p>
							</div>
							<span class="demo-badge">interactive</span>
						</div>
						<div class="demo-body">
							<div class="cr-room" id="cr-room">
								<div class="cr-status">
									<div class="cr-round">Round <span id="cr-round-num">1</span> of <span id="cr-total-rounds">6</span></div>
									<div class="cr-timer">⏱ <span id="cr-timer-val">0.0</span>s</div>
								</div>
								<div class="cr-label">A note slides under the door:</div>
								<div class="cr-incoming" id="cr-incoming-msg"></div>
								<div class="cr-rulebook">
									<div class="cr-label">Your rulebook says:</div>
									<table class="cr-table">
										<thead><tr><th>If you see…</th><th>Write back…</th></tr></thead>
										<tbody id="cr-rulebook-body"></tbody>
									</table>
								</div>
								<div class="cr-label">Choose your response:</div>
								<div class="cr-options" id="cr-options"></div>
								<div class="cr-feedback" id="cr-feedback" aria-live="polite"></div>
							</div>
							<div class="cr-reveal" id="cr-reveal" hidden>
								<div class="cr-outside">“Incredible! You speak perfect Inuktitut!”</div>
								<div class="cr-bars">
									<div class="cr-bar-row"><b>Accuracy</b><span class="cr-bar"><i id="cr-accuracy-bar"></i></span><span id="cr-accuracy">0%</span></div>
									<div class="cr-bar-row"><b>Understanding</b><span class="cr-bar"><i style="width:0%"></i></span><span>0%</span></div>
								</div>
								<div class="cr-lesson"><b>The lesson:</b> You never understood a single syllable. You matched shapes and followed rules. That is the gap Searle named: syntax is not semantics.</div>
								<button type="button" class="btn-demo" id="cr-reveal-translations">What did I actually say?</button>
								<div class="cr-translations" id="cr-translations" hidden>
									<table class="cr-table">
										<thead><tr><th>They asked</th><th>You replied</th><th>Actual conversation</th></tr></thead>
										<tbody id="cr-translation-body"></tbody>
									</table>
								</div>
								<button type="button" class="btn-demo" id="cr-restart">Try again</button>
							</div>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>The experiment does not prove machines cannot understand. It forces you to say where understanding would have to live.</span></div>
					</div>

					<section class="section-block" id="inside">
						<div class="section-kicker"><span class="sk-num">03</span> The view from inside</div>
						<h2 class="section-title">What would evidence of experience look like?</h2>
						<div class="prose">
							<p>A language model can produce the sentence “I am conscious” for the same reason it can produce any other sentence: the words are in its training distribution. The report tells you what the model can say; it does not show what, if anything, the model feels. The reverse inference fails too. A system that never reports experience might still have it. Behaviour is evidence about behaviour.</p>
							<p>The hard problem separates functional access from phenomenal experience. A system can use information, report it, and control attention without there being something it is like to be that system. Global-workspace theories describe consciousness as the broadcast of information to many processes at once. A transformer's residual stream is a functional cousin: a shared vector that every layer reads and writes. The analogy helps ask where integration happens; it is not evidence that experience happens there.</p>
							<p>Embodiment adds another gap. 4E accounts treat cognition as enacted by a body that maintains itself and has stakes in its environment. A model has no metabolism, no continuous life, and no consequences it must survive. Its cognition is a different kind from an animal's. That difference does not settle whether anything is happening inside; it only removes the easy analogy.</p>
							<p>This uncertainty is practical. If the status of a system is genuinely unknown, confident dismissal and confident anthropomorphism are both unjustified. The question is not only metaphysical: it decides what we test, how we deploy, and what moral weight we give to the next generation of systems.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Report is not proof</b><span>Fluency about consciousness is still generated text.</span></div>
							<div class="keypoint"><b>Access is not experience</b><span>A system can use information without there being something it is like to be it.</span></div>
							<div class="keypoint"><b>Architecture is not a verdict</b><span>No current test decides whether a model is conscious.</span></div>
							<div class="keypoint"><b>Uncertainty has moral weight</b><span>Unknown status is a reason for caution, not for confidence in either direction.</span></div>
						</div>
					</section>

					<section class="section-block" id="theories">
						<div class="section-kicker"><span class="sk-num">04</span> Consciousness and the map</div>
						<h2 class="section-title">Many theories, one open question.</h2>
						<div class="prose">
							<p>Theories of consciousness disagree about what consciousness is. Global workspace theory says a state becomes conscious when it is broadcast to many processes; integrated information theory assigns a number, Phi, to how unified a system’s causal structure is; higher-order theories say a state is conscious when a higher-level representation points at it; predictive processing treats perception as controlled prediction; the attention schema theory says the brain models its own attention; illusionism says phenomenal consciousness is an introspective illusion; panpsychism treats experience as fundamental. They do not agree on what would count as evidence.</p>
							<p>Two distinctions keep the discussion honest. Access consciousness is information being available to report and control; phenomenal consciousness is there being something it is like (Block, 1995; Nagel, 1974). A model can have access and report without phenomenal experience. Anthropic’s 2026 J-space work found a small internal workspace in Claude whose contents a J-lens can read; it looks like an access workspace, not proof of felt experience. The residual stream is a functional cousin of a global workspace: a shared vector every layer reads and writes.</p>
							<p>Qualia are the felt properties of experience: the redness of red, the pain of pain. Representationalism says qualia represent properties; relationalism says they depend on an organism’s relation to the world; illusionism says the concept is confused; panpsychism says experience is intrinsic. Artificial qualia would be engineered representations with the right functional role. If qualia are functional, that might be enough; if they need a biological substrate or intrinsic properties, it is not. No accepted test decides the question.</p>
							<p>Ask where AI comes from and the answer spreads. The course’s knowledge map makes that literal: every lesson is a node, shared citations and concepts are edges, and the map is never finished because each new lesson adds nodes and edges. The long history is the untold history; the whole course is the blog. At the end, the honest position is a map with open edges: we can trace how we got here, and we cannot yet say why there is a here at all.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Global workspace</b><span>Conscious access is information broadcast to many processes.</span></div>
							<div class="keypoint"><b>IIT</b><span>Consciousness is a unified cause-effect structure, measured as Phi.</span></div>
							<div class="keypoint"><b>J-space</b><span>A readable internal workspace in Claude looks like access, not proof of experience.</span></div>
							<div class="keypoint"><b>Qualia</b><span>The felt properties of experience; no test decides whether a machine has them.</span></div>
						</div>
					</section>

					<section class="section-block" id="origin">
						<div class="section-kicker"><span class="sk-num">05</span> The long chain</div>
						<h2 class="section-title">Why is there anything at all?</h2>
						<div class="prose">
							<p>You start with a simple question: where does AI come from? The answer leads to computers, then to mathematics and writing, then to life and the universe. If you keep asking, you end at the Big Bang and before it: why is there something rather than nothing? That is not a detour; it is the bottom of the dependency chain.</p>
							<p>If you really want to understand AI, you have to start at the Big Bang and even before: matter, energy, chemistry, life, brains, writing, mathematics, machines. Each step is a precondition for the next. The history is not decoration; it is the stack on which the model rests.</p>
							<p>The chain begins with a planet. A fragment of a molecular cloud collapsed about 4.57 billion years ago, dust stuck together into planetesimals, and Earth grew from collisions. A Mars-sized body struck it and the Moon formed from the debris. The Moon stabilizes the tilt, the magnetic field shields the atmosphere, and plate tectonics and the carbon cycle keep the climate habitable for billions of years. None of this was designed; each is a precondition for a long-lived civilization that could build a lab.</p>
							<p>Then life. Photosynthesis split water, released oxygen, and built the atmosphere we breathe; the first cells, the first nervous systems, and the first brains followed. Ancient photosynthesis also stored sunlight as coal and oil, the energy that later powered the industrial revolution and the grid that runs data centers. Without early life there is no oxygen, no fossil fuel, and no brain.</p>
							<p>Buildings look even less relevant, but they are part of the chain. A wall, a granary, a shared ditch made permanent settlement possible; Göbekli Tepe, Stonehenge, the pyramids, the Pantheon, and the steel-frame skyscraper each required new organization, materials, and geometry. The newest building type is the data center: a hall organized around power, cooling, and racks, a building whose main product is computation. A windbreak and a hearth became a machine for keeping other machines alive.</p>
							<p>The chain is contingent, not directed. Sixty-six million years ago an asteroid ended the age of dinosaurs; the small mammals that survived radiated into the empty niches, and one branch led to primates and humans. The impact did not aim at us. No asteroid, no mammals; no mammals, no primates; no primates, no brain; no brain, no silicon; no silicon, no LLM. The endpoint is one outcome among many.</p>
							<p>Metals, writing, and war add more links. Bronze required long-distance trade in copper and tin; iron democratized tools; silicon purification and rare-earth magnets depend on mining and chemistry. Writing and printing turned memory into a copyable external store; states and armies funded ENIAC, ARPA, and the space program, which in turn pushed miniaturization and image processing. None of these was “AI research”; all of them are in the stack.</p>
							<p>The untold history linked below traces exactly this chain: what had to be possible, what had to happen, for us to have AI systems today? It runs from the first particles and planets through life, brains, cities, metals, writing, war, and the web. The knowledge map is the same idea as a graph: every lesson is a node, shared citations and concepts are edges, and the map is never finished because each new lesson adds nodes and edges. The whole blog is the long version.</p>
							<p>At the end of the chain stands the last question: why is there anything at all? Science can describe how the universe evolved, not why there is something rather than nothing. A proposal by João Carlos Holland de Barcellos (“Jocax”) imagines a “Jocaxian nothingness”: not an empty space governed by rules, but the absence of all rules. If no rule forbids something, something can appear. Nobody knows whether that is true; it is a possible answer, not an established result. Its value is that it makes the question thinkable without pretending it is solved.</p>
						</div>
						<div class="map-links">
							<a href="../untold_history.php">The untold history</a>
							<a href="../knowledge_map.php">The unfinishable map</a>
							<a href="../index.php">The whole blog</a>
						</div>
						<p class="source-note">Further reading: <a href="https://doi.org/10.2307/2183914" rel="noopener">Nagel (1974)</a>; <a href="https://doi.org/10.1017/S0140525X00038129" rel="noopener">Block (1995)</a>; <a href="https://plato.stanford.edu/entries/consciousness/" rel="noopener">SEP, Consciousness</a>; <a href="https://plato.stanford.edu/entries/qualia/" rel="noopener">SEP, Qualia</a>; <a href="https://www.anthropic.com/research/global-workspace" rel="noopener">Anthropic, J-space (2026)</a>; <a href="https://archive.org/details/universe-jocax-eng" rel="noopener">Jocax, The Universe According to Jocax</a>; <a href="https://doi.org/10.1016/j.neuron.2020.01.026" rel="noopener">Mashour et al. (2020), global workspace</a>; <a href="https://doi.org/10.1038/nrn.2016.44" rel="noopener">Tononi et al. (2016), IIT</a>; <a href="https://doi.org/10.1016/j.tics.2011.05.009" rel="noopener">Lau &amp; Rosenthal (2011), higher-order</a>; <a href="https://doi.org/10.1017/S0140525X12000477" rel="noopener">Clark (2013), predictive processing</a>; <a href="https://doi.org/10.3389/fpsyg.2015.00500" rel="noopener">Graziano &amp; Webb (2015), attention schema</a>; <a href="https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html" rel="noopener">NASA, Earth Fact Sheet</a>; <a href="https://pubmed.ncbi.nlm.nih.gov/17779955/" rel="noopener">Alvarez et al. (1980), impact</a>.</p>
					</section>

					<section class="section-block" id="takeaway">
						<div class="section-kicker"><span class="sk-num">06</span> Takeaway</div>
						<h2 class="section-title">The short version.</h2>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">The chain reaches back to the Big Bang; experience is still the open question.</p>
							<p class="aha-sub">We can describe the preconditions and measure behaviour. We cannot yet explain why anything exists or what, if anything, is happening inside.</p>
						</div>
					</section>
				</article>
			</div>
		</div>
	</main>

	<script>
	(function () {
		"use strict";
		document.querySelectorAll("[data-wg-case]").forEach(function (btn) {
			btn.addEventListener("click", function () {
				document.querySelectorAll("[data-wg-case]").forEach(function (b) {
					b.classList.toggle("is-on", b === btn);
				});
			});
		});
	})();
	</script>
	<script src="assets/site.js?v=<?php echo filemtime(__DIR__.'/assets/site.js'); ?>"></script>
	<script src="assets/demos.js?v=<?php echo filemtime(__DIR__.'/assets/demos.js'); ?>"></script>
	<script src="assets/chinese-room.js"></script>
</body>
</html>
