<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="From Dartmouth optimism to synthetic media: how AI is reshaping art, work, truth, and trust.">
	<meta name="theme-color" content="#ffffff">
	<title>What AI Is Doing to Us | Ten Minutes</title>
	<link rel="stylesheet" href="assets/site.css">
</head>
<body data-lesson="ai_and_society" data-page="lesson">
	<div class="readbar" aria-hidden="true"><span></span></div>

	<main id="main">
		<div class="shell">
			<section class="hero hero--lesson">
				<div>
					<h1>The social effects are <em>already here.</em></h1>
					<p class="hero-deck">AI is a technical project and a social one. It changes how images are made, how work is organised, how news is trusted, and how people imagine the future.</p>
				</div>
			</section>

			<div class="lesson-layout">
				<article class="lesson-main">
					<section class="section-block" id="idea">
						<div class="section-kicker"><span class="sk-num">01</span> A short history of expectations</div>
						<h2 class="section-title">Hope, winter, spring.</h2>
						<div class="prose">
							<p>The technical stack built the machine. The field began with enormous optimism at the Dartmouth workshop in 1956, announced in the 1955 proposal (<a href="https://web.archive.org/web/2023/https://www-formal.stanford.edu/jmc/history/dartmouth/dartmouth.html" rel="noopener">McCarthy et al., 1955</a>), followed by winters when the promises outran the results. The public relationship has oscillated ever since: hope, disappointment, and another spring.</p>
							<p>What is different now is scale. Synthetic images, voices, and text are cheap and abundant. That changes the economics of creation and the cost of deception.</p>
						</div>
					</section>

					<section class="section-block" id="detail">
						<div class="section-kicker"><span class="sk-num">02</span> Creation, work, and truth</div>
						<h2 class="section-title">The effects are uneven.</h2>
						<div class="prose">
							<p>Generative models expand what can be made, but they also flood the world with synthetic media. Voice cloning and deepfakes make fraud and political deception easier (<a href="https://www.jstor.org/stable/26798018" rel="noopener">Chesney &amp; Citron, 2019</a>). The same tools can help artists, scientists, and students. The verification problem from hallucination returns here at scale: making a convincing fake is now cheap, while verifying that something is real is still expensive.</p>
							<p>There is a second-order effect that is easy to miss: the <strong>liar's dividend</strong> (<a href="https://www.jstor.org/stable/26798018" rel="noopener">Chesney &amp; Citron, 2019</a>). Once people know that fakes exist, genuine evidence can be dismissed as fabricated. A politician caught on tape can claim the tape is AI-generated; a real photograph can be waved away as a deepfake. The cost of deception rises, and so does the cost of believing anything.</p>
							<p>The effects on work are uneven. Some tasks are automated; others are augmented; new tasks appear. A job is a bundle of tasks, and a model rarely replaces the whole bundle at once. The distribution of gains and losses matters as much as the average: the same tool can make one role more productive and another redundant, and bargaining power decides who captures the gain.</p>
							<p>Bias belongs here too. A model trained on historical data can reproduce historical patterns in hiring, lending, policing, and healthcare, and it can do so at scale while sounding neutral. The technical question is whether the disparity comes from the data, the label, the objective, or the deployment; the political question is which disparities a society is willing to accept.</p>
							<p>The governance question is one of accountability. Who is responsible when a model causes harm? What should be disclosed? Provenance standards such as <a href="https://c2pa.org/" rel="noopener">C2PA</a> attach a signed history to a file, but they only help if the file carries the signature and the viewer checks it. Watermarks can be removed or laundered; detection is an arms race, and a detector that is right most of the time is not a foundation for evidence.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Expectation cycles</b><span>AI has oscillated between optimism and disappointment.</span></div>
							<div class="keypoint"><b>Synthetic media</b><span>Cheap generation changes creation and deception.</span></div>
							<div class="keypoint"><b>Labour</b><span>Automation and augmentation hit different tasks differently.</span></div>
							<div class="keypoint"><b>Trust</b><span>Verification becomes more important as synthetic content grows.</span></div>
						</div>
					</section>


					<figure>
						<img src="../alphago_leesedol.jpg" alt="Lee Sedol playing AlphaGo in Seoul, 2016" loading="lazy">
						<figcaption>Lee Sedol plays AlphaGo, Seoul, March 2016. Photo: Korea Baduk Association, <a href="https://commons.wikimedia.org/wiki/File:Lee_Sedol_(B)_vs_AlphaGo_(W)_-_Game_4.jpg" rel="noopener">CC BY-SA 4.0</a>.</figcaption>
					</figure>

					<div class="demo demo--paper timeline-shell" data-demo="timeline" data-arrow-nav>
						<div class="demo-head">
							<div>
								<p class="demo-title">Expectation cycles and consequences <span>· demo</span></p>
								<p class="demo-sub">The public relationship with AI has never been stable. Select an era to see what changed.</p>
							</div>
							<span class="demo-badge">step through</span>
						</div>
						<div class="demo-body">
							<div class="timeline-scroller">
								<button class="tl-scroll-btn" type="button" data-timeline-prev data-arrow-prev aria-label="Scroll left">‹</button>
								<div class="timeline-track" data-timeline-track role="group" aria-label="Expectation cycles and consequences">
									<button class="tl-node is-active" type="button" data-meta="1956 · Dartmouth" data-title="Dartmouth" data-body="A small summer workshop named the field and made a bold conjecture: every aspect of intelligence might be simulated." data-image="../john_mccarthy_portrait.jpg" data-image-alt="Portrait of John McCarthy" data-image-link="https://commons.wikimedia.org/wiki/File:John_McCarthy_Stanford.jpg" data-image-caption="John McCarthy, co-author of the 1955 Dartmouth proposal. Photo: null0, CC BY-SA 2.0."><span class="tl-dot"></span><span class="tl-date">1956</span><span class="tl-name">Dartmouth</span></button>
									<button class="tl-node" type="button" data-meta="1970s · First winter" data-title="The first winter" data-body="The promises outran the results. Funding left, and the field learned that progress is uneven." data-image="../perceptron2.jpg" data-image-alt="The Mark I Perceptron" data-image-link="https://commons.wikimedia.org/wiki/File:330-PSA-80-60_(USN_710739)_(20897323365).jpg" data-image-caption="The Mark I Perceptron, 1958. Photo: U.S. Navy, public domain."><span class="tl-dot"></span><span class="tl-date">1970s</span><span class="tl-name">First winter</span></button>
									<button class="tl-node" type="button" data-meta="2012 · Deep learning" data-title="Deep learning" data-body="Big data, GPUs, and deep networks produced a step change in vision and speech. The spring returned." data-image="../alexnet_architecture.png" data-image-alt="The AlexNet architecture" data-image-link="https://commons.wikimedia.org/wiki/File:AlexNet_architecture.png" data-image-caption="AlexNet, 2012. Image: Daniel Voigt Godoy, CC BY 4.0."><span class="tl-dot"></span><span class="tl-date">2012</span><span class="tl-name">Deep learning</span></button>
									<button class="tl-node" type="button" data-meta="2022 · LLM era" data-title="The LLM era" data-body="Chat interfaces made language models a mass medium. The technology moved from labs into everyday work." data-image="assets/img/chatgpt.png" data-image-alt="The ChatGPT interface" data-image-link="https://commons.wikimedia.org/wiki/File:ChatGPT.png" data-image-caption="ChatGPT interface. Image: Lugab89, CC BY 3.0."><span class="tl-dot"></span><span class="tl-date">2022</span><span class="tl-name">LLM era</span></button>
									<button class="tl-node" type="button" data-meta="now · Synthetic media" data-title="Synthetic media" data-body="Cheap generation changes creation and deception at the same time. Trust becomes a design problem." data-image="../diffusion_astronaut.webp" data-image-alt="An AI-generated astronaut riding a horse" data-image-link="https://commons.wikimedia.org/wiki/File:Astronaut_Riding_a_Horse_(SD3.5).webp" data-image-caption="An AI-generated image: astronaut riding a horse, Stable Diffusion 3.5. Image: VulcanSphere, public domain."><span class="tl-dot"></span><span class="tl-date">now</span><span class="tl-name">Synthetic media</span></button>
								</div>
								<button class="tl-scroll-btn" type="button" data-timeline-next data-arrow-next aria-label="Scroll right">›</button>
							</div>
							<div class="tl-panel no-figure" data-timeline-panel aria-live="polite"></div>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>The public relationship oscillates, but the consequences accumulate.</span></div>
					</div>

					<div class="demo demo--paper" data-demo="verify">
						<div class="demo-head">
							<div>
								<p class="demo-title">How sure can you be? <span>· demo</span></p>
								<p class="demo-sub">A synthetic video arrives. Toggle the evidence you actually have. The strength of the claim is the chain, not the fluency.</p>
							</div>
							<span class="demo-badge">interactive</span>
						</div>
						<div class="demo-body">
							<div class="chip-row">
								<button class="chip is-on" type="button" data-verify-check="provenance">Camera signature</button>
								<button class="chip is-on" type="button" data-verify-check="watermark">Visible watermark</button>
								<button class="chip" type="button" data-verify-check="reverse">Reverse-image match</button>
								<button class="chip" type="button" data-verify-check="corroboration">Second witness</button>
							</div>
							<div class="vf-score">
								<span>Evidence strength</span>
								<div class="meter"><span data-verify-meter style="width:0%"></span></div>
								<b data-verify-score>...</b>
							</div>
							<p class="vf-verdict" data-verify-verdict></p>
							<div class="vf-grid" style="margin-top:12px">
								<div class="vf-card"><h4>Camera signature</h4><p>A signed C2PA-style manifest says where the file came from. Strong, if the viewer checks it.</p></div>
								<div class="vf-card"><h4>Visible watermark</h4><p>Cheap to add, easier to remove. A signal, not a proof.</p></div>
								<div class="vf-card"><h4>Reverse-image match</h4><p>The same frame appears in an older, independent source. Useful, but the source can be wrong too.</p></div>
								<div class="vf-card"><h4>Second witness</h4><p>A human or sensor that was there. Often the strongest evidence, and the hardest to scale.</p></div>
							</div>
							<p class="demo-hint" data-verify-note></p>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>Verification is a chain of independent signals. A confident voice, a clean frame, or a single watermark is not the same as provenance.</span></div>
					</div>





					<section class="section-block" id="problems">
						<div class="section-kicker"><span class="sk-num">03</span> The hard problems</div>
						<h2 class="section-title">What we have to decide.</h2>
						<div class="prose">
							<p><strong>Power and compute.</strong> The frontier is expensive. Training runs need specialised chips, energy, data, and capital, and those advantages compound. A handful of firms can shape the default model that everyone else fine-tunes or rents. Public compute, transparency about training data and evaluation, competition policy, and a healthy open-weight ecosystem are the counterweights (<a href="https://ainowinstitute.org/publication/policy/compute-and-ai" rel="noopener">AI Now Institute, 2023</a>).</p>
							<p><strong>Environment and labour.</strong> Inference and training consume electricity and water, and the supply chain includes hidden human labour: data annotation, content moderation, and the mining and manufacturing behind the hardware (<a href="https://arxiv.org/abs/1906.02243" rel="noopener">Strubell et al., 2019</a>). Efficiency helps, but it can also increase total use. The labour question is task-level: automation changes a bundle of tasks, and the gains go to whoever owns the tool and the data.</p>
							<p><strong>Truth and accountability.</strong> Synthetic media makes deception cheap and denial cheaper. Provenance standards, signed capture, and independent fact-checking help, but they are only as strong as the chain of custody. The deeper question is liability: when a model causes harm, the developer, the deployer, and the platform should not all be able to point at one another.</p>
							<p><strong>Governance.</strong> The EU AI Act sorts systems by risk and imposes documentation, evaluation, and post-market monitoring on the higher-risk tiers (<a href="https://eur-lex.europa.eu/eli/reg/2024/1689/oj" rel="noopener">Regulation (EU) 2024/1689</a>). The NIST AI Risk Management Framework offers a voluntary process for mapping, measuring, and managing risk (<a href="https://www.nist.gov/itl/ai-risk-management-framework" rel="noopener">NIST, 2023</a>). Neither is a solution by itself. They are ways to make the trade-offs explicit and reversible.</p>
							<p><strong>Data and consent.</strong> The models were trained on a web-scale corpus, and much of it was collected without consent or payment. LAION-5B, the dataset behind early Stable Diffusion, contained 5.85 billion image-text pairs scraped from the web (<a href="https://arxiv.org/abs/2210.08402" rel="noopener">Schuhmann et al., 2022</a>). Artists, authors, and publishers sued. US courts have drawn a narrow line: training on lawfully acquired books can be fair use, while training on pirated copies is not, and reproducing protected text in outputs is infringement. The <a href="https://www.courtlistener.com/docket/69061557/bartz-v-anthropic-ai-pbc/" rel="noopener">Bartz v. Anthropic</a> settlement in 2025 put a price on the pirated-book case, and licensing deals are replacing the free scrape. The legal question is not settled, but the era of taking first and asking later is ending.</p>
							<p><strong>The productivity paradox.</strong> The productivity claims are uneven. In a randomized controlled trial with experienced open-source developers, AI tools made them about 19% slower, even though they believed they were 20% faster (<a href="https://arxiv.org/abs/2507.09089" rel="noopener">Becker et al., 2025</a>). In a controlled Copilot task, developers finished 55.8% faster (<a href="https://arxiv.org/abs/2302.06590" rel="noopener">Peng et al., 2023</a>), and customer-support agents gained 14% on average, with novices gaining 34% and experienced agents near zero (<a href="https://www.nber.org/papers/w31161" rel="noopener">Brynjolfsson et al., 2023</a>). The pattern is a jagged frontier: AI helps most on well-specified tasks and least on complex, open-ended work. A tool can be useful and still make an expert slower.</p>
							<p><strong>The good.</strong> The effects are not only negative. Be My AI gives blind users a conversational description of a photo and reached a million sessions within two weeks of its 2023 beta. Whisper transcribes 96 languages and is open source; the AlphaFold database offers predicted structures for over 200 million proteins for free. Machine translation has become good enough for many everyday uses, and cheap AI tutoring reaches students who could not afford a human tutor. The same technology that makes fraud cheap makes access cheaper too.</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>Concentration</b><span>Compute and data advantages can become political advantages.</span></div>
							<div class="keypoint"><b>Environment</b><span>Training and serving have a material footprint; efficiency is not automatically savings.</span></div>
							<div class="keypoint"><b>Accountability</b><span>Provenance and liability need a chain, not a single detector.</span></div>
							<div class="keypoint"><b>Governance</b><span>Risk tiers, documentation, audits, and independent evaluation make choices visible.</span></div>
						</div>
					</section>

					<section class="section-block" id="takeaway">
						<div class="section-kicker"><span class="sk-num">04</span> Takeaway</div>
						<h2 class="section-title">The short version.</h2>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">The technology is new; the social questions are old.</p>
							<p class="aha-sub">Who benefits, who is accountable, and what counts as truth are political questions, not only technical ones.</p>
						</div>
					</section>
				</article>
			</div>
		</div>
	</main>

	<script src="assets/site.js"></script>
	<script src="assets/demos.js"></script>
</body>
</html>
