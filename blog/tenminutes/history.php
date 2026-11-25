<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<meta name="description" content="A very brief history of AI: a ten-minute timeline from tally bones and logic to cybernetics, the perceptron, and the transformer.">
	<meta name="theme-color" content="#ffffff">
	<title>A Very Brief History of AI | Ten Minutes</title>
	<link rel="stylesheet" href="../Temml-Local.min.css">
	<link rel="stylesheet" href="assets/site.css?v=<?php echo filemtime(__DIR__.'/assets/site.css'); ?>">
</head>
<body data-lesson="history" data-page="lesson">
	<div class="readbar" aria-hidden="true"><span></span></div>

	<main id="main">
		<div class="shell">
			<section class="hero hero--lesson">
				<div>
					<h1>A <span class="very">very</span> brief history of AI.</h1>
					<p class="hero-deck">
						Modern AI grew out of counting bones, models of the sky, formal logic,
						cybernetic feedback, a machine that learned from its mistakes, two winters, and
						a crowd of contributors who are usually left out of the story.
						How did a tally bone become a machine that predicts the next token?
					</p>
				</div>
			</section>

			<div class="lesson-layout">
				<article class="lesson-main">
					<section class="section-block" id="fuse">
						<div class="section-kicker"><span class="sk-num">01</span> The long background</div>
						<h2 class="section-title">Many currents met here.</h2>
						<div class="split-figure">
							<figure>
								<img src="../ceres.jpg" alt="The dwarf planet Ceres photographed by the Dawn probe" loading="lazy">
								<figcaption>Ceres, photographed by the Dawn probe in 2015. Image: NASA / JPL-Caltech / UCLA / MPS / DLR / IDA / Justin Cowart, <a href="https://commons.wikimedia.org/wiki/File:Ceres_-_RC3_-_Haulani_Crater_(22381131691)_(cropped).jpg" rel="noopener">public domain</a>.</figcaption>
							</figure>
							<figure>
								<img src="../flammarion.jpg" alt="The Flammarion engraving: a traveller lifts the edge of the sky" loading="lazy">
								<figcaption>The Flammarion engraving (1888): a traveller looks beyond the horizon. Image: Unknown Artist, <a href="https://commons.wikimedia.org/wiki/File:Flammarion_Woodcut_1888_Color_2.jpg" rel="noopener">public domain</a>.</figcaption>
							</figure>
						</div>
						<div class="prose">
							<p>
								In 1801 Giuseppe Piazzi spotted Ceres, the first asteroid, and then
								lost it behind the Sun after 41 days of observation. Carl
								Friedrich Gauß treated the noisy positions as <em>one</em> whole and
								assumed the true orbit lay in the middle of the errors. His method of
								least squares minimised the squared distance between the observations
								and the orbit, and it predicted where Ceres would reappear (<a href="https://doi.org/10.1214/aos/1176345451" rel="noopener">Stigler, 1981</a>). The move is
								the one a model repeats when it fits weights to noisy data: no single
								measurement is trusted, and the fit is chosen to be closest to all
								of them at once.
							</p>
						</div>
						<div class="demo demo--paper demo--plot" id="ceres-demo">
							<div class="demo-head">
								<div>
									<p class="demo-title">Ceres: truth vs. noisy observations</p>
									<p class="demo-sub">A true orbit, a cloud of noisy measurements, and the bell curve of their errors. Move the slider to see how a better telescope narrows the spread.</p>
								</div>
								<span class="demo-badge">interactive</span>
							</div>
							<div class="demo-body">
								<div id="ceres-plot" class="ceres-plot" role="img" aria-label="A true orbit with noisy observations and the distribution of their errors"></div>
								<div class="demo-controls ceres-controls">
									<label class="ceres-slider" for="ceres-sigma">
										<span>Better telescopes</span>
										<input type="range" id="ceres-sigma" min="0.1" max="2" step="0.1" value="2">
										<span>Worse telescopes</span>
									</label>
									<button class="btn-demo btn-demo--green" type="button" id="ceres-resample">New sample</button>
								</div>
								<p class="demo-hint"><em>Synthetic data, not Piazzi's measurements. The plot is here to show the idea.</em></p>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>Least squares does not trust a single measurement. It picks the curve that stays closest to all of them at once, and that same rule still trains modern models.</span></div>
						</div>
						<div class="prose">
							<p>
								The same arithmetic reappears in every trained network. A model is a
								curve, and the data are noisy points; training chooses the weights whose
								predictions are, on average, closest to the observations. Nobody planned
								this reuse. Least squares came from astronomy, and it entered machine
								learning only because the same problem, fitting a simple curve through
								imperfect measurements, kept returning. A path that looks obvious in
								retrospect was not visible from the telescope.
							</p>
							<p>
								The way to modern <strong>LLM</strong> was not a straight line, but a sum of
								developments that were never meant to meet: <strong>least squares</strong>,
								invented by astronomers to fit noisy observations of the sky, now helps decide
								which word comes next; <strong>formal logic</strong>, built to settle arguments,
								became a notation a machine can execute; <strong>feedback control</strong>,
								developed for guns and thermostats, became the loop that adapts;
								<strong>statistical learning</strong>, biology, linguistics, and the parallel
								matrix hardware of video games each added a piece. None of these fields was
								working toward a chatbot. They <strong>converged</strong>, and the same
								convergence also produced things that are not language models.
							</p>
							<p>
								The deeper history is a history of <strong>abstraction</strong>: human effort
								drawn away from the direct task and handed to a mechanism. It begins roughly
								3.3 million years ago with the first <strong>stone tools</strong>, continues
								through the <strong>wheel</strong> and <strong>Heron of Alexandria's
								programmable cart</strong>, and crosses from the physical to the cognitive
								when thought itself becomes a formal calculus a machine can run.
							</p>
							<p>
								The claim is not that all these steps had to lead to the AI we have today.
								It is that modern AI is a node in a densely woven network of events that met
								here and in many other places, and that each of those events was itself a
								starting point for further nodes. The network is not a ladder. It is a
								process in which the many become one, and the one becomes part of a new many.
								Alfred North Whitehead described reality this way in <em>Process and Reality</em>
								(1929): “The many become one, and are increased by one.” Everything is a
								process, and everything is connected to everything else.
							</p>
							<p>
								What we look at here is an abstraction of the capabilities of the mind, not
								the physical performance of the machine. Modern computers have an enormous
								amount of computing power. AI gives us a way to address that power that feels
								natural to us, because it lines up with how we think.
							</p>
							<p>
								The old joke about computing says it exactly. Each layer hands the work to
								something else, and the layer beneath becomes the new primitive. The history
								below follows those layers, and the demos show what one of them looks like
								when you take it apart.
							</p>
						</div>
						<div class="pullquote">
							We can solve any problem by introducing an extra level of indirection
							[abstraction].
							<cite>David Wheeler</cite>
						</div>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">Each abstraction moves the task further from the person.</p>
							<p class="aha-sub">The wheel abstracts movement; the computer abstracts thought. Every layer removes another implementation detail, so the person has less of the direct task to handle by hand. Where it lives today: the wheel becomes the tensor operation, the stored count becomes memory, and abstraction becomes the layer.</p>
						</div>
					</section>

					<section class="section-block" id="timeline">
						<div class="section-kicker"><span class="sk-num">02</span> Sixteen turning points</div>
						<h2 class="section-title">Follow the thread.</h2>
						<div class="prose">
							<p>
								Pick a point on the line and pull that thread. The dates are approximations
								where the evidence allows.
							</p>
						</div>

						<div class="demo demo--paper demo--timeline timeline-shell" id="timeline-demo" data-arrow-nav>
							<div class="demo-head">
								<div>
									<p class="demo-title">Sixteen turning points <span>· demo 01</span></p>
									<p class="demo-sub">Drag the line or scroll sideways. Select a node to read its story.</p>
								</div>
								<span class="demo-badge">43,000 BCE → today</span>
							</div>
							<div class="demo-body">
								<div class="timeline-hint" aria-hidden="true"><span><b>↔</b> drag</span><span><b>↕</b> scroll</span><span><b>← →</b> keys</span></div>
								<div class="timeline-scroller">
									<button class="tl-scroll-btn" type="button" id="tl-prev" data-arrow-prev aria-label="Scroll the timeline left">‹</button>
									<div class="timeline-track" id="timeline-track" role="group" aria-label="Timeline of turning points" tabindex="0"></div>
									<button class="tl-scroll-btn" type="button" id="tl-next" data-arrow-next aria-label="Scroll the timeline right">›</button>
								</div>
								<div class="tl-panel" id="timeline-panel" aria-live="polite"></div>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>No single cause produced the LLM. Many independent developments became useful together.</span></div>
						</div>
						<div class="prose">
							<p>
								Long before counting, there is technique. At
								<a href="https://www.nature.com/articles/nature14464" rel="noopener">Lomekwi 3</a>
								in West Turkana, Kenya, hominins were knapping stone by about
								<strong>3.3 million years ago</strong>, before the genus <em>Homo</em>. The
								tools are coarse and simple, yet deliberate: someone chose a stone and
								struck flakes from it. They are the oldest known <strong>stone tools</strong>. The date
								comes from the stratigraphy and radiometric dating of the surrounding layers;
								the interpretation of the flakes as deliberately made, rather than naturally
								broken, is argued from the pattern of strikes. A later Acheulean handaxe,
								shaped on both faces to a mental template, shows how far the same habit
								travelled.
							</p>
						</div>
						<figure>
							<img src="../acheulean_handaxe.jpg" alt="Acheulean handaxes from the Kariandusi site in Kenya" loading="lazy">
							<figcaption>Acheulean handaxes from the Kariandusi site in Kenya, a later stone-tool tradition than Lomekwi. Image: Xmd5a, <a href="https://commons.wikimedia.org/wiki/File:Kariandusi_Acheulean_Tools.jpg" rel="noopener">CC BY-SA 4.0</a>.</figcaption>
						</figure>
						<div class="prose">
							<p>
								Geometric marks come later. A <strong>zig-zag incised into a river shell at
								<a href="https://www.nature.com/articles/nature13962" rel="noopener">Trinil</a></strong>,
								Java, is about <strong>500,000 years old</strong>: the oldest known
								deliberate geometric incision. It is a pattern; it does not yet record a
								count, and whether it carried symbolic meaning is debated. What is clear is
								that the mark was made on purpose.
							</p>
						</div>
						<figure>
							<img src="../image.php?f=trinil_shell.jpg&amp;w=900&amp;q=82" alt="A river shell from Trinil, Java, with a deliberate zig-zag incision" loading="lazy">
							<figcaption>The Trinil shell, c. 500,000 years ago, with a zig-zag of grooves cut by <em>Homo erectus</em>. Image: Naturalis Biodiversity Center, <a href="https://commons.wikimedia.org/wiki/File:Homo_Erectus_shell_with_geometric_incisions_circa_500,000_BP,_Naturalis_Biodiversity_Center,_Netherlands_(with_detail).jpg" rel="noopener">CC BY-SA 3.0</a>.</figcaption>
						</figure>
						<div class="prose">
							<p>
								At <strong>Blombos Cave</strong> in South Africa, pieces of ochre carry
								cross-hatched grids and rhomboid fields from roughly
								<strong>75,000 years ago</strong>
								(<a href="https://pubmed.ncbi.nlm.nih.gov/11786608/" rel="noopener">Henshilwood
								et al.</a>). The surface is divided into a regular network of cells: order
								made visible. Whether this stone had any meaning is unknown.
							</p>
						</div>
						<figure>
							<img src="../blombosochre.jpg" alt="Engraved ochre from Blombos Cave with cross-hatched geometric patterns" loading="lazy">
							<figcaption>Engraved ochre from Blombos Cave, c. 75,000 years ago. Image: Chris Henshilwood, <a href="https://www.donsmaps.com/blombos.html" rel="noopener">CC BY 2.5</a>.</figcaption>
						</figure>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">Memory can live outside the mind.</p>
							<p class="aha-sub">A notch in a bone keeps a count beyond the moment of counting. Ledgers, catalogues and databases repeat the same thought: they put the number somewhere you can come back to. Where it lives today: the notch is a log, the ledger is a database, and the catalogue is an index.</p>
						</div>
					</section>

					<section class="section-block" id="logic">
						<div class="section-kicker"><span class="sk-num">03</span> The rules of thought</div>
						<h2 class="section-title">Reason and speech become calculi.</h2>
						<div class="prose">
							<p>
								The number systems on which modern machines are built grew out of several
								separate inventions: <strong>place value</strong> (Babylonian, c. 2000 BCE),
								<strong>zero as a number with arithmetic rules</strong> (Brahmagupta, 628 CE),
								<strong>negative quantities</strong> (Han-dynasty Chinese linear-equation
								texts), and <strong>decimal fractions</strong> (<a href="https://mathshistory.st-andrews.ac.uk/Biographies/Stevin/" rel="noopener">Stevin, 1585</a>, building on
								earlier Arabic work). Babylonian place value was base 60, which is why an
								hour still has sixty minutes and a circle 360 degrees. Pingala’s
								<strong>Sanskrit prosody</strong> (c. 3rd-1st century BCE) uses a
								binary-like scheme for metres (the mapping to 0 and 1 is a later reading)
								and Leibniz later formalised binary notation. <strong>Zero</strong> reached
								Europe through Fibonacci’s <strong>Liber Abaci</strong> (1202), which
								popularised the Indian-Arabic numerals.
							</p>
							<p>
								Modern hardware inherits the positional idea, then makes its own
								engineering choices. A binary integer has a fixed width and a finite range. A
								floating-point number stores a sign, an exponent, and a significand, so it
								approximates real numbers with limited precision. The usual <code>float</code>
								value for 0.1 is not exactly one tenth: in binary, 0.1 is a repeating
								fraction, so the nearest 64-bit value is 0.10000000000000000555…, and the tiny
								error can accumulate over many operations. Most processors follow the
								<strong>IEEE 754</strong> conventions for these formats.
							</p>
							<p>
								Text has its own encoding layer. Telegraph codes such as Baudot (1870s)
								packed characters into five bits. ASCII (1963) standardised 7-bit codes
								for 128 characters. Unicode (1991) gave the world one code-point space, and
								UTF-8 (1993) encodes each code point in one to four bytes (<a href="https://www.unicode.org/versions/Unicode15.0.0/" rel="noopener">The Unicode Standard</a>). A single visible
								character can therefore span several bytes, and the same character can be a
								base letter plus a combining mark. Every later step that handles text
								depends on that layer.
							</p>
							<p>
								In the same long arc, reasoning becomes a formal system. Aristotle’s
								<strong>syllogism</strong> separates the structure of an argument from its
								content. Pāṇini’s <em>Aṣṭādhyāyī</em> gives Sanskrit a fully generative grammar
								of metarules, transformations, and recursion: a compiler-like contract
								centuries before the computer. Ramon Llull’s <em>Ars Magna</em> (1305)
								turns concentric wheels of concepts to generate every logically possible
								combination: the first documented attempt to mechanise thought. George Boole’s
								algebra (1854) then makes logic calculable, and Frege and Russell spend the
								next decades trying to ground mathematics in it.
							</p>
						</div>
						<div class="split-figure">
							<figure>
								<img src="../Sanzio_01_Plato_Aristotle.jpg" alt="Plato and Aristotle in Raphael's School of Athens" loading="lazy">
								<figcaption>Plato and Aristotle in Raphael’s <em>School of Athens</em>. Image: <a href="https://commons.wikimedia.org/wiki/File:Sanzio_01_Plato_Aristotle.jpg" rel="noopener">public domain</a>.</figcaption>
							</figure>
							<figure>
								<img src="../FigurScheiben.jpg" alt="A Llull volvelle with rotating concentric discs" loading="lazy">
								<figcaption>A Llull volvelle from the <em>Ars Magna</em> tradition. Image: Ramon Llull, <a href="https://blog.hnf.de/das-universum-des-ramon-llull/" rel="noopener">public domain</a>.</figcaption>
							</figure>
						</div>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">Thinking becomes something you can mechanically do.</p>
							<p class="aha-sub">A syllogism, a grammar, and a wheel of concepts are all attempts to make valid reasoning mechanical, long before there is a machine to run it. Where it lives today: the syllogism becomes a program, grammar becomes a parser, and the wheel of concepts becomes an ontology.</p>
						</div>
					</section>

					<section class="section-block" id="leibniz">
						<div class="section-kicker"><span class="sk-num">04</span> Calculemus</div>
						<h2 class="section-title">Reason becomes arithmetic.</h2>
						<div class="prose">
							<p>
								Leibniz built a calculating machine, the <strong>stepped reckoner</strong>,
								begun in 1673 and completed in 1694; it was the first calculator able to
								perform all four arithmetic operations. Behind the brass was a larger
								programme: a <em>mathesis universalis</em>, a notation in which every concept
								has a number and every argument becomes a calculation. He also formalised
								binary notation, reducing logic to 0 and 1. The machine itself was not
								reliable in practice (the carry mechanism gave trouble) but the design and
								the programme outlived the brass.
							</p>
							<p>
								His hope was that disagreement could be settled by arithmetic rather than
								rhetoric. The invitation usually quoted is to sit down at the slate and
								calculate.
							</p>
						</div>
						<div class="pullquote">
							If controversies were to arise, there would be no more need of disputation
							between two philosophers than between two accountants. For it would suffice
							to take their pencils in their hands, to sit down at their slates, and to say
							to each other: Let us calculate. (Calculemus!)
							<cite>Gottfried Wilhelm Leibniz</cite>
						</div>
						<figure>
							<img src="../Leibnizrechenmaschine.jpg" alt="Leibniz's stepped reckoner" loading="lazy">
							<figcaption>Leibniz’s stepped reckoner (reconstruction). Image: Eremeev, <a href="https://de.wikipedia.org/wiki/Datei:Rechenmaschine_von_Leibniz_(Nachbau)_06.jpg" rel="noopener">CC BY-SA 4.0</a>.</figcaption>
						</figure>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">A notation can turn an argument into arithmetic.</p>
							<p class="aha-sub">Leibniz did not build the thinking machine. He bet that a universal notation would make disagreement a calculation, and that bet is the ancestor of every formal language since. Where it lives today: his notation becomes the loss function and the formal language of optimisation.</p>
						</div>
					</section>

					<section class="section-block" id="engines">
						<div class="section-kicker"><span class="sk-num">05</span> Engines and programs</div>
						<h2 class="section-title">The machine learns to follow a stored plan.</h2>
						<div class="prose">
							<p>
								Babbage designs the <strong>Analytical Engine</strong>, with a store, a mill
								(his name for the arithmetic unit, the ancestor of the CPU), and punched-card
								input. It was never completed in his lifetime; the design, not a
								working machine, is what survived. Ada Lovelace sees further than the machine’s
								builder: the Engine can manipulate <em>symbols</em>, not only numbers, and she
								writes the first published algorithm intended for it.
							</p>
						</div>
						<div class="split-figure">
							<figure>
								<img src="../babbage.jpg" alt="Babbage's Analytical Engine" loading="lazy">
								<figcaption>Babbage’s Analytical Engine. Image: John Cummings, <a href="https://commons.wikimedia.org/wiki/File:Babbages_Analytical_Engine,_1834-1871._(9660574685).jpg" rel="noopener">CC BY-SA 2.0</a>.</figcaption>
							</figure>
							<figure>
								<img src="../ada_lovelace_portrait.jpg" alt="Portrait of Ada Lovelace" loading="lazy">
								<figcaption>Ada Lovelace. Image: Alfred Edward Chalon, <a href="https://commons.wikimedia.org/wiki/File:Ada_Lovelace_Chalon_portrait.jpg" rel="noopener">public domain</a>.</figcaption>
							</figure>
						</div>
						<div class="prose">
							<p>
								The 20th century turns the plan into hardware. Konrad Zuse’s <strong>Z3</strong>
								(1941) is the first functional, programmable, fully automatic digital computer,
								built from 2,000 telephone relays (<a href="https://doi.org/10.1109/85.586068" rel="noopener">Rojas, 1997</a>); he also designs <em>Plankalkül</em>, an early
								high-level language. “First” depends on the definition: the Z3 was
								electromechanical, not electronic. Programmability itself reaches further
								back: <strong>Ismail al-Jazari</strong> described programmable automata in
								the twelfth century, and <strong>Heron of Alexandria's</strong> pinned cart
								is older still. The Z3 was the first fully automatic digital computer, not
								the first programmable machine.
							</p>
							<figure style="max-width: 560px; margin: 20px auto;">
								<img src="assets/img/konrad-zuse-1992.jpg" alt="Portrait of Konrad Zuse, 1992" loading="lazy">
								<figcaption>Konrad Zuse, 1992. Image: Wolfgang Hunscher, <a href="https://commons.wikimedia.org/wiki/File:Konrad_Zuse_(1992).jpg" rel="noopener">CC BY-SA 3.0</a>.</figcaption>
							</figure>
							<p>
								Howard Aiken’s <strong>Harvard Mark I</strong> (1944) is a
								50-foot decimal relay machine. Turing’s 1936 universal machine supplies the
								theory (<a href="https://www.cs.virginia.edu/~robins/Turing_Paper_1936.pdf" rel="noopener">Turing, 1936</a>); his ACE and Bletchley work supply the practice. Shannon’s 1937 master’s
								thesis (<a href="https://dspace.mit.edu/handle/1721.1/11173" rel="noopener">Shannon, 1937</a>) shows that Boolean algebra can be realised in relay circuits: the
								bridge from logic to electronics. Von Neumann’s stored-program design (1945)
								makes “reprogramming” a matter of software rather than rewiring. It also
								treats the program itself as data, so one program can read or change another.
								That is the seed of operating systems, compilers, and the rest of the software
								stack.
							</p>
						</div>
						<div class="image-trio">
							<figure>
								<img src="../alan_turing_1951.jpg" alt="Portrait of Alan Turing" loading="lazy">
								<figcaption>Alan Turing, 1951. Image: Elliott &amp; Fry, <a href="https://commons.wikimedia.org/wiki/File:Alan_Turing_(1951).jpg" rel="noopener">public domain</a>.</figcaption>
							</figure>
							<figure>
								<img src="../claude_shannon_portrait.jpg" alt="Portrait of Claude Shannon" loading="lazy">
								<figcaption>Claude Shannon. Image: Tekniska Museet, <a href="https://commons.wikimedia.org/wiki/File:C.E._Shannon._Tekniska_museet_43069_(cropped).jpg" rel="noopener">CC BY 2.0</a>.</figcaption>
							</figure>
							<figure>
								<img src="../aiken_portrait.jpeg" alt="Portrait of Howard Aiken" loading="lazy">
								<figcaption>Howard Aiken. Image: MacTutor History of Mathematics, <a href="https://commons.wikimedia.org/wiki/File:Aiken.jpeg" rel="noopener">public domain</a>.</figcaption>
							</figure>
						</div>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">The stored program separates the machine from its behaviour.</p>
							<p class="aha-sub">Once instructions live in the same memory as data, a computer can be changed by writing rather than by rebuilding. Where it lives today: the stored program is still the model of the GPU and the training loop.</p>
						</div>
					</section>

					<section class="section-block" id="neuron">
						<div class="section-kicker"><span class="sk-num">06</span> The neuron and the perceptron</div>
						<h2 class="section-title">A machine that learns from its mistakes.</h2>
						<div class="prose">
							<p>
								The first <em>logical</em> neuron came from an unlikely pair. <strong>Warren
								McCulloch</strong> was a neuropsychiatrist, philosopher, and poet. He ran a
								lab under the sign “Experimental Epistemology” and asked, “What is a number,
								that a man may know it, and a man, that he may know a number?”
								<strong>Walter Pitts</strong> was a self-taught logician who had read
								<em>Principia Mathematica</em> at twelve, written to Bertrand Russell, and
								run away from home at fifteen to hear Russell lecture in Chicago. They met
								there, found a shared hero in Leibniz, and began to model the brain as a
								logical calculus.
							</p>
							<figure style="max-width:320px;margin:20px auto">
								<img src="../walter_pitts_1954.jpg" alt="Walter Pitts in 1954" loading="lazy">
								<figcaption>Walter Pitts in 1954. Image: Francis Bello, <a href="https://commons.wikimedia.org/wiki/File:1954_Walter_Pitts_and_a_blackboard.jpg" rel="noopener">public domain</a>.</figcaption>
							</figure>
							<p>
								Strictly speaking, the first formal neuron model was Louis
								Lapicque’s integrate-and-fire cell, published in the <em>Journal de Physiologie
								et de Pathologie Générale</em> in 1907 (<a href="https://archive.org/details/journaldephysiol0000vari_l4e0/page/n639/mode/2up" rel="noopener">Lapicque, 1907, p. 620</a>).
								Lapicque treated the nerve membrane as a capacitor: input current charges it,
								the voltage leaks away, and when it crosses a threshold the cell fires and
								resets. It is a phenomenological model, not a detailed biophysical one, but it
								is the ancestor of the point-neuron models used in computational neuroscience
								(<a href="https://web.archive.org/web/20070613230629/http://neurotheory.columbia.edu/~larry/AbbottBrResBul99.pdf" rel="noopener">Abbott, 1999</a>).
								McCulloch and Pitts built the first <em>logical</em> neuron, which is what most
								histories mean by “the first artificial neuron.”
							</p>
							<p>
								Their 1943 paper, “<a href="https://www.cs.cmu.edu/~epxing/Class/10715/reading/McCulloch.and.Pitts.pdf" rel="noopener">A Logical Calculus of the Ideas Immanent in Nervous
								Activity</a>,” appeared in the <em>Bulletin of Mathematical Biophysics</em>, not
								in a physiology journal. It made five assumptions: a neuron fires all-or-none;
								a fixed number of excitatory synapses must be active within the period of
								latent addition; the only significant delay is synaptic; an inhibitory synapse
								absolutely prevents firing; and the structure of the net does not change with
								time. The neuron fires when the excitatory input reaches its threshold and no
								inhibition is present. The model counts synapses. The familiar
								<span data-tex="y = \sigma\left(\sum_i w_i x_i - \theta\right)" data-tex-display="false"></span> belongs to the later perceptron. McCulloch and
								Pitts used fixed thresholds; they had no learned weights.
							</p>
							<p>
								The paper works in both directions. Given a network, you can read off the
								propositions its activity realizes; given a logical expression, you can build
								a network that realizes it. Networks without loops compute Boolean functions.
								Networks with loops can hold a state, and McCulloch and Pitts argued that such
								a net, with a tape and scanners, can compute what a Turing machine computes.
								The loop was the hard part: a signal that circles back seems to make time run
								backwards. Pitts’s way out was clock arithmetic. Inside a loop, “before” and
								“after” lose their meaning; the signal records that an event happened, not
								when. McCulloch called the result “an idea wrenched out of time”: a memory.
							</p>
							<p>
								The paper reached the hardware of the next decade. Von Neumann’s 1945 EDVAC
								report, the first published description of the stored-program computer, cited
								exactly one paper (this one) and proposed building the machine from
								McCulloch-Pitts-style logic gates (<a href="https://doi.org/10.1007/BF02478259" rel="noopener">McCulloch &amp; Pitts, 1943</a>), with Pitts’s loops as memory. At the 1948
								Hixon Symposium, von Neumann gave the nets a wide audience and called their
								theorems “probably the most significant result obtained with the axiomatic
								method up to now.” Pitts, the runaway logician, became the hinge between
								McCulloch’s physiology and von Neumann’s computer.
							</p>
							<p>
								The collaboration was also a friendship. McCulloch invited the homeless Pitts
								to live with his family; Pitts called the house home for the rest of his life.
								McCulloch called him his “bootlegged collaborator.” Both wrote poetry. Pitts
								struggled with depression and died in 1969 at
								forty-six; McCulloch died a few months later. The 1943 neuron outlived them
								both.
							</p>
							<div class="big-quote">
								<p>When an axon of cell A is near enough to excite a cell B and repeatedly or persistently takes part in firing it [...] some growth process or metabolic change takes place in one or both cells such that A’s efficiency, as one of the cells firing B, is increased.</p>
								<cite>Donald O. Hebb, <em>The Organization of Behavior</em> (1949), p. 62</cite>
							</div>
							<p>
								The slogan is <strong>“neurons that fire together, wire together.”</strong>
								The <strong>SNARC</strong> (1951) was one of the first hardware attempts at a
								learning network: randomly wired tubes whose paths were reinforced by reward.
								Whether it is a neural network in today's sense depends on the definition. Then,
								in 1958, Frank Rosenblatt introduced the <em>perceptron</em> (<a href="https://psycnet.apa.org/record/1959-09865-001" rel="noopener">Rosenblatt, 1958</a>): a system
								that adjusted its weights in response to errors. The Mark I Perceptron was
								constructed between 1958 and 1960 and publicly demonstrated in 1960: a 20×20
								grid of 400 photocells formed its retina, and electric motors turned the
								potentiometers that held the weights. Its follow-on, <em>Tobermory</em>, was
								designed for speech recognition.</p>
							<h3>The perceptron</h3>
							<p>
								Frank Rosenblatt was a psychologist at Cornell. He built the perceptron
								as a machine that learns from examples rather than from explicit rules.
								His work is the hinge between “a program does what it is told” and “a model
								learns from what it sees.” He died in a sailing accident in 1971, two years
								after the critique that helped push the field into the first AI winter.
							</p>
							<figure style="max-width: 360px; margin: 20px auto;">
								<img src="../frank_rosenblatt_portrait.jpg" alt="Portrait of Frank Rosenblatt" loading="lazy">
								<figcaption>Frank Rosenblatt. Anonymous / Heinz Nixdorf MuseumsForum, <a href="https://commons.wikimedia.org/wiki/File:Frank_Rosenblatt.jpg" rel="noopener">CC BY-SA 4.0</a>.</figcaption>
							</figure>
							<p>
								The perceptron updated its weights directly from the error, one layer at a
								time, which is why it could not learn the internal representations a deep
								network needs. Its descendants are in every transformer today. The
								perceptron ran into the limits of one layer, limited data, and limited
								compute. Learning from data survived the disappointment.
							</p>
							<p>
								The press heard “a machine that will walk, talk, see, write, reproduce itself
								and be conscious of its existence.” The science heard a learning rule,
								<span data-tex="\Delta w = \eta \cdot (\text{target} - \text{output}) \cdot \text{input}" data-tex-display="false"></span>, that turns error into a weight
								change. Minsky and Papert’s <em>Perceptrons</em> (1969) then showed the limits
								of a single-layer network (famously, XOR) (<a href="https://www.deeplearningbook.org/" rel="noopener">Goodfellow et al., 2016</a>) and the first winter began. The
								critique was about one layer; a multilayer network can represent XOR, and
								backpropagation later supplied a way to train one. The idea survived in the
								margins.
							</p>
						</div>
						<div class="demo demo--paper demo--canvas" id="gate-demo">
							<div class="demo-head">
								<div>
									<p class="demo-title">Why XOR broke the single layer <span>· demo 03</span></p>
									<p class="demo-sub">A single layer draws one straight line. OR and AND can be separated; XOR cannot.</p>
								</div>
								<span class="demo-badge">logic gates</span>
							</div>
							<div class="demo-body">
								<div class="chip-row" id="gate-modes">
									<button class="chip is-on" type="button" data-gate="or">OR</button>
									<button class="chip" type="button" data-gate="and">AND</button>
									<button class="chip" type="button" data-gate="xor">XOR</button>
								</div>
								<div class="gate-layout">
									<svg class="gate-plot" id="gate-plot" viewBox="0 0 360 330" role="img" aria-label="A two-dimensional plot of the four input combinations for a logic gate"></svg>
									<div class="gate-side">
										<p class="gate-readout" id="gate-readout"></p>
									</div>
								</div>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>A single layer is one straight cut. XOR needs two cuts, and that is why a hidden layer helps.</span></div>
						</div>
						<div class="split-figure">
							<figure>
								<img src="../perceptron2.jpg" alt="The Mark I Perceptron" loading="lazy">
								<figcaption>The Mark I Perceptron, announced by the U.S. Navy in 1958. Image: U.S. Navy, <a href="https://commons.wikimedia.org/wiki/File:330-PSA-80-60_(USN_710739)_(20897323365).jpg" rel="noopener">public domain</a>.</figcaption>
							</figure>
							<figure>
								<img src="../mark_i_perceptron_manual.png" alt="Diagram of the Mark I Perceptron from its operator's manual" loading="lazy">
								<figcaption>Figure 2 from the Mark I Perceptron operator’s manual. Image: John C. Hay &amp; Albert E. Murray, 1958, <a href="https://commons.wikimedia.org/wiki/File:Mark_I_Perceptron,_Figure_2_of_operator%27s_manual.png" rel="noopener">public domain</a>.</figcaption>
							</figure>
						</div>
						<div class="aside-figure">
							<div class="prose">
								<p>
									<strong>Norbert Wiener</strong> came to the loop through war work
									at MIT, where he designed predictors for anti-aircraft fire. A gun
									cannot aim at where a plane is; it has to estimate where the plane
									will be. In <em>Cybernetics</em> (1948) Wiener turned that practical
									problem into a general language of feedback, control and
									communication, and argued that a thermostat, a nervous system and a
									computer could be described with the same vocabulary.
								</p>
							</div>
							<figure>
								<img src="../wiener.jpg" alt="Portrait of Norbert Wiener" loading="lazy">
								<figcaption>Norbert Wiener. Image: Konrad Jacobs, Oberwolfach Photo Collection, <a href="https://commons.wikimedia.org/wiki/File:Norbert_wiener.jpg" rel="noopener">CC BY-SA 2.0 DE</a>.</figcaption>
							</figure>
						</div>
						<div class="aside-figure aside-figure--pair">
							<div class="prose">
								<p>
									<strong>W. Ross Ashby</strong> built the loop as a machine. His
									<strong>Homeostat</strong> (1948) is a box of four magnetized units
									wired so that a disturbance changes their connections. The machine hunts
									through configurations until its output settles; it has no model of the
									world and no named goal. It simply restores its own equilibrium, an
									early physical model of adaptation and homeostasis.
								</p>
							</div>
							<div class="aside-figure-media">
								<figure>
									<img src="../ashby.jpg" alt="Portrait of W. Ross Ashby" loading="lazy">
									<figcaption>W. Ross Ashby. Image: W. Ross Ashby Digital Archive, <a href="https://commons.wikimedia.org/wiki/File:W._Ross_Ashby_(1948).jpg" rel="noopener">public domain</a>.</figcaption>
								</figure>
								<figure>
									<img src="../homeostat.jpg" alt="W. Ross Ashby's Homeostat" loading="lazy">
									<figcaption>Ashby’s Homeostat, 1948. Image: Mick Ashby / Estate of W. Ross Ashby, <a href="https://commons.wikimedia.org/wiki/File:W._Ross_Ashby%27s_1948_Homeostat.jpg" rel="noopener">CC BY-SA 4.0</a>.</figcaption>
								</figure>
							</div>
						</div>
						<div class="aside-figure">
							<div class="prose">
								<p>
									<strong>Grey Walter</strong> built the loop as an animal. His tortoises,
									Elmer and Elsie, were small autonomous robots with a light sensor and a
									contact switch; they crawled toward light, backed away from obstacles, and
									recharged themselves. A handful of valves produced behaviour that looked
									purposeful.
								</p>
								<p>
									<strong>Gregory Bateson</strong>, an anthropologist in the same
									conversations, gave the loop its most portable definition:
									information is “a difference that makes a difference.” The vocabulary
									of modern AI (feedback, adaptation, signal, noise) is largely this
									group’s inheritance.
								</p>
							</div>
							<figure>
								<img src="../grey_walter_tortoise.jpg" alt="Grey Walter's cybernetic tortoise" loading="lazy">
								<figcaption>Grey Walter’s cybernetic tortoise, c. 1950. Image: Ank Kumar, <a href="https://commons.wikimedia.org/wiki/File:Cybernetic_Tortoise_by_William_Grey_Walter_c_1950_(Ank_Kumar).jpg" rel="noopener">CC BY-SA 4.0</a>.</figcaption>
							</figure>
						</div>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">Learning is error correction.</p>
							<p class="aha-sub">The perceptron does not need a rule for every case. It needs an error signal and a way to change its weights. That is the seed of every trained model. Where it lives today: the error signal is the gradient, and the weight change is the optimizer step.</p>
						</div>
					</section>

					<section class="section-block" id="winters">
						<div class="section-kicker"><span class="sk-num">07</span> Winters and the return</div>
						<h2 class="section-title">Promise, winter, quiet accumulation.</h2>
						<div class="prose">
							<p>
								The <strong>Dartmouth</strong> proposal of 1955, by McCarthy, Minsky, Rochester,
								and Shannon, named the field for a 1956 summer project. About ten people came,
								including Newell, Simon, Samuel, and Solomonoff; no consensus emerged, but
								the name stuck. Symbolic AI built the <strong>Logic Theorist</strong> (1956),
								then <strong>GPS</strong> (1957-59), expert systems, planners, and microworlds
								such as SHRDLU. Its <strong>frame problem</strong> is the difficulty of
								representing what does <em>not</em> change when an action is taken: a
								hand-coded system has to be told that moving a cup does not move the table,
								the room, or the weather, and the list of things that stay the same is endless.
								Funding froze in the first AI winter; connectionism returned in the 1980s; a
								second winter followed. Deep Blue beat Garry Kasparov in 1997, a triumph of
								search and evaluation in a narrow, hand-tuned domain.
							</p>
							<p>
								The winters were not one event. The first was driven by the 1969 <em>Perceptrons</em>
								critique, the failure of ambitious machine-translation projects, and the
								Lighthill report in Britain (1973), which questioned whether the field had
								delivered on its promises. The second followed the brittleness of expert
								systems and the collapse of the specialised Lisp-machine market. Different
								countries cut funding at different times; the pattern was a cycle, not a single
								verdict.
							</p>
						</div>
						<div class="prose">
							<p>
								The return of neural networks came as a stack of changes. <strong>Backpropagation</strong>
								was discovered several times, by Linnainmaa (1970), Werbos (1974), and the
								Rumelhart-Hinton-Williams paper (1986) that made it the standard way to train
								deep networks. Larger labelled datasets gave the models more to learn from;
								<strong>GPUs</strong> supplied the parallel matrix arithmetic that graphics had
								already paid for. In 2012 <strong>AlexNet</strong>, a deep convolutional network
								with ReLU and dropout, trained on two consumer GPUs on 1.2 million ImageNet
								images, cut the top-5 error to 15.3% and beat the runner-up by more than ten
								points (<a href="https://proceedings.neurips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf" rel="noopener">Krizhevsky et al., 2012</a>).
								AlphaGo defeated Lee Sedol in 2016. In 2017, “<a href="https://arxiv.org/abs/1706.03762" rel="noopener">Attention Is All You Need</a>”
								replaced recurrence with <strong>self-attention</strong>, making the path between
								distant tokens one step and the computation parallel. ChatGPT (2022) turned the
								next-token loop into a public interface. The ideas are old; the scale, the
								data, and the engineering are new.
							</p>
						</div>
						<figure style="max-width: 500px; margin: 20px auto;">
							<img src="../alphago_leesedol.jpg" alt="Lee Sedol playing AlphaGo" loading="lazy">
							<figcaption>Lee Sedol vs AlphaGo, Game 4, 2016. Image: Korea Baduk Association, <a href="https://commons.wikimedia.org/wiki/File:Lee_Sedol_(B)_vs_AlphaGo_(W)_-_Game_4.jpg" rel="noopener">CC BY-SA 4.0</a>.</figcaption>
						</figure>
						<div class="prose">
							<p>
								<strong>Geoffrey Hinton</strong> kept the connectionist bet alive through
								the winters and, with Alex Krizhevsky and Ilya Sutskever, built
								<strong>AlexNet</strong>: the 2012 network that made deep learning hard
								to ignore. The architecture mattered, but so did the engineering: training it
								on two consumer GPUs made a network that was previously impractical finish in
								days. He later shared the 2024 Nobel Prize in Physics with John Hopfield.
							</p>
							<p>
								<strong>Yann LeCun</strong> made convolutions work. <strong>LeNet</strong>
								read handwritten digits, first on ZIP codes for the U.S. Postal Service
								and later on bank checks.
							</p>
						<div class="demo demo--paper demo--canvas" id="conv-demo">
							<div class="demo-head">
								<div>
									<p class="demo-title">A convolution is a sliding weighted sum <span>· demo 04</span></p>
									<p class="demo-sub">A small kernel slides over an image. At each position it multiplies its nine numbers by the nine pixels underneath, then adds them up.</p>
								</div>
								<span class="demo-badge">3×3 kernel</span>
							</div>
						<div class="demo-body">
							<div class="conv-layout">
								<div class="conv-panel">
									<div class="conv-label">Image</div>
									<div class="conv-grid conv-grid--image" id="conv-image"></div>
								</div>
								<div class="conv-panel">
									<div class="conv-label">Kernel</div>
									<div class="conv-grid conv-grid--kernel" id="conv-kernel"></div>
								</div>
								<div class="conv-panel">
									<div class="conv-label">Feature map</div>
									<div class="conv-grid conv-grid--output" id="conv-output"></div>
								</div>
							</div>
							<div class="demo-controls">
								<button class="btn-demo btn-demo--green" type="button" id="conv-step">Next position →</button>
								<button class="btn-demo" type="button" id="conv-auto" aria-pressed="false">Auto run ▶</button>
								<button class="chip is-on" type="button" data-kernel="edges">Vertical edges</button>
								<button class="chip" type="button" data-kernel="blur">Blur</button>
							</div>
							<p class="conv-readout" id="conv-readout"></p>
							<div class="conv-formula" id="conv-formula"></div>
						</div>
						<div class="demo-insight"><b>Takeaway</b><span>The same nine numbers are reused at every position. A learned network changes those numbers until the feature map highlights what the task needs.</span></div>
					</div>
							<p>
								<strong>Yoshua Bengio</strong> brought neural networks back to language
								with a 2003 neural probabilistic language model, replacing sparse
								n-gram tables with learned word vectors.
							</p>
							<p>
								The three shared the 2018 Turing Award for deep learning. Their work (backpropagation, convolutional networks, neural language models) is
								the bridge between the perceptron’s promise and the transformer’s
								scale. The line from Rosenblatt to GPT bends through two winters, and
								it stays continuous: the same bet on learning from data, carried
								through both.
							</p>
						</div>
						<div class="image-trio">
							<figure>
								<img src="../geoffrey_hinton_portrait.jpg" alt="Portrait of Geoffrey Hinton" loading="lazy">
								<figcaption>Geoffrey Hinton. Image: Arthur Petron, <a href="https://commons.wikimedia.org/wiki/File:Geoffrey_E._Hinton,_2024_Nobel_Prize_Laureate_in_Physics_(cropped1).jpg" rel="noopener">CC BY-SA 4.0</a>.</figcaption>
							</figure>
							<figure>
								<img src="../yann_lecun_portrait.jpg" alt="Portrait of Yann LeCun" loading="lazy">
								<figcaption>Yann LeCun. Image: Jérémy Barande, <a href="https://commons.wikimedia.org/wiki/File:Yann_LeCun_-_2018_(cropped).jpg" rel="noopener">CC BY-SA 2.0</a>.</figcaption>
							</figure>
							<figure>
								<img src="../yoshua_bengio_portrait.jpg" alt="Portrait of Yoshua Bengio" loading="lazy">
								<figcaption>Yoshua Bengio. Image: Maryse Boyce, <a href="https://commons.wikimedia.org/wiki/File:Yoshua_Bengio_2019_cropped.jpg" rel="noopener">CC BY 4.0</a>.</figcaption>
							</figure>
						</div>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">The return was scale plus a better learning method.</p>
							<p class="aha-sub">Backpropagation, data, GPUs, and architectural luck compounded. The winters belonged to the story too. Where it lives today: backpropagation is still the gradient, data is still the corpus, and the GPU is still the accelerator.</p>
						</div>
					</section>

					<section class="section-block" id="llms">
						<div class="section-kicker"><span class="sk-num">08</span> The LLM line</div>
						<h2 class="section-title">Attention, then pretraining, then scale.</h2>
						<div class="prose">
							<p>
								The 2017 paper “Attention Is All You Need” was written to improve machine
								translation. Vaswani and his coauthors replaced the step-by-step recurrence
								of earlier sequence models with <strong>self-attention</strong>: in one
								layer, every token can look at every other token, and the computation for all
								positions runs in parallel. The path between two distant tokens becomes a
								single hop. Earlier sequence models read one token at a time, so by the time
								they reached the tenth word the first was already fading from the state they
								carried. A word at the beginning of a text can change the meaning of the last
								word, and that is what a long-range dependency is. Attention lets every token
								see every other token at once, so the first word is still there when the last
								one is processed. It also fills a GPU far better than a loop over the
								sequence.
							</p>
							<p>
								The mechanism is a learned routing operation. Each token is projected into a
								<strong>query</strong>, a <strong>key</strong>, and a <strong>value</strong>.
								The query of one token is compared with the keys of the others; the scores
								are scaled, passed through a softmax, and used as weights to mix the values.
								The original transformer had two halves: an <strong>encoder</strong>, which
								reads the whole input with both directions visible, and a
								<strong>decoder</strong>, which generates the output one token at a time. A
								causal mask in the decoder hides future tokens, so the model cannot see the
								answer it is supposed to predict. With the mask on, each token may attend only
								to itself and the past, which is exactly the signal used to train a model to
								complete a sentence. Several heads run in parallel, each in its own subspace,
								and their outputs are combined. Each head looks at its own material, and what
								it looks at is learned by the model itself to keep the error small.
							</p>
							<p>
								Attention is one half of the block. Each sublayer is wrapped in a
								<strong>residual connection</strong> and a <strong>normalization</strong>
								step: the branch computes an update, and the update is added back to a shared
								running vector. The <strong>feed-forward network</strong> then transforms
								each position on its own, expanding the vector, applying a nonlinearity, and
								contracting it again. Attention moves information between positions; the
								feed-forward network computes with it.
							</p>
							<p>
								Two branches grew from the same architecture. <strong>BERT</strong> (Devlin
								et al., 2019) kept the encoder, removed the causal mask, and trained with
								<strong>masked language modeling</strong>: hide a random selection of tokens
								and predict them from both sides. That gives deeply bidirectional
								representations. After pretraining on a large corpus, BERT could be fine-tuned
								with a small labelled dataset and set new records on many language tasks. It
								made the recipe <strong>pretrain, then fine-tune</strong> the default.
							</p>
							<p>
								<strong>GPT</strong> took the other branch: it kept the decoder half, dropped
								the encoder, and trained autoregressively on the next token. GPT-2 (2019)
								showed that a large model
								could perform some tasks zero-shot, from a prompt alone. GPT-3 (Brown et al.,
								2020), with 175 billion parameters, showed that scale could produce a
								flexible few-shot learner. The same block, two contracts with the data: BERT
								sees both sides and fills blanks; GPT sees only the past and predicts the next
								token.
							</p>
							<p>
								The recipe then became an engineering programme.
								<strong><a href="https://arxiv.org/abs/1801.06146" rel="noopener">ULMFiT</a></strong>
								supplied the three-step template: pretrain on general text, fine-tune on the
								target domain, fine-tune on the task.
								<strong><a href="https://arxiv.org/abs/1907.11692" rel="noopener">RoBERTa</a></strong>
								showed that BERT had been undertrained, and that more data with dynamic
								masking improved it.
								<strong><a href="https://arxiv.org/abs/2003.10555" rel="noopener">ELECTRA</a></strong>
								changed the objective from filling blanks to detecting replaced tokens,
								which gives a training signal at every position.
								<strong><a href="https://arxiv.org/abs/1910.10683" rel="noopener">T5</a></strong>
								turned every task into text-to-text.
							</p>
							<p>
								The <strong>Chinchilla experiments</strong>
								(<a href="https://arxiv.org/abs/2203.15556" rel="noopener">Hoffmann et al., 2022</a>)
								tested how to spend a fixed compute budget. They found that many models were
								too large for the amount of data they saw; a smaller model trained on more
								tokens can do better. The rough rule of thumb from that work is about twenty
								training tokens per parameter, though later models often go further.
								<strong>LLaMA</strong> applied that lesson and released models that could run
								on ordinary hardware, which helped the open-weight ecosystem grow.
							</p>
							<p>
								The final layer is <strong>post-training</strong>. A raw next-token predictor
								is not yet a helpful assistant. <strong>RLHF</strong> (reinforcement learning
								from human feedback) trains a reward model on human preferences and then
								optimizes the language model against it. <strong>InstructGPT</strong>
								(Ouyang et al., 2022) described the recipe, and <strong>ChatGPT</strong>
								turned it into a public interface. The model still predicts tokens; the
								difference is that the distribution has been shaped toward answers people find
								useful, honest, and harmless.
							</p>
							<p>
								Three different kinds of contribution: <strong>attention</strong> is a
								mechanism inside the block; <strong>pretraining</strong> is a training
								objective; <strong>scale</strong> is how much compute and data the run uses.
							</p>
						</div>

						<div class="demo demo--paper demo--interactive llm-demo" id="llm-demo">
							<div class="demo-head">
								<div>
									<p class="demo-title">Attention <span>· demo 02</span></p>
									<p class="demo-sub">Attention is a mechanism, pretraining is an objective, scale is how much compute and data the run uses.</p>
								</div>
								<span class="demo-badge">attention</span>
							</div>
							<div class="demo-body">
								<div class="llm-pane is-on" data-llm-pane="attention">
									<h4 class="llm-pane-title">Mechanism · Attention</h4>
									<div class="llm-attn-head">
										<p class="llm-note">Attention is a mechanism inside the block: it routes information between positions. Click a token. Each arc is one attention weight, and the matrix below shows the whole routing table.</p>
										<label class="llm-switch"><input type="checkbox" id="llm-causal" checked> causal mask <span>· each word sees only its past</span></label>
									</div>
									<div class="llm-sentence" id="llm-sentence">
										<svg class="llm-arcs" id="llm-arcs" aria-hidden="true">
											<defs>
												<linearGradient id="llm-arc-grad" x1="0" y1="0" x2="1" y2="0">
													<stop offset="0%" style="stop-color:var(--tm-green)"></stop>
													<stop offset="100%" style="stop-color:var(--tm-sky)"></stop>
												</linearGradient>
											</defs>
										</svg>
									</div>
									<div class="llm-mask-status" id="llm-mask-status" aria-live="polite"></div>
									<div class="llm-bars" id="llm-bars"></div>
									<div class="llm-matrix-wrap">
										<div class="llm-matrix-head">
											<b>Attention matrix</b>
											<span>each row is a word looking back · columns are the words it can see · every row sums to <b>1.00</b> · selected: <b id="llm-matrix-selected">sat</b></span>
										</div>
										<div class="llm-matrix" id="llm-matrix" role="img" aria-label="Attention matrix. Each row is a query and sums to one.">
											<div class="llm-matrix-row llm-matrix-row--head"><span></span><span>the</span><span>cat</span><span>sat</span><span>on</span><span>the</span><span>mat</span><span>Σ</span></div>
											<div class="llm-matrix-row"><span class="llm-matrix-label">the</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-green) 36%, var(--tm-sky));color:#071a22">0.30</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 92%, var(--tm-card));color:#071a22">0.22</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 70%, var(--tm-card));color:#071a22">0.18</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 28%, var(--tm-card));color:var(--tm-ink)">0.10</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 28%, var(--tm-card));color:var(--tm-ink)">0.10</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 28%, var(--tm-card));color:var(--tm-ink)">0.10</span><span class="llm-matrix-sum">1.00</span></div>
											<div class="llm-matrix-row"><span class="llm-matrix-label">cat</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 48%, var(--tm-card));color:var(--tm-ink)">0.14</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-green) 36%, var(--tm-sky));color:#071a22">0.30</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-green) 14%, var(--tm-sky));color:#071a22">0.26</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 28%, var(--tm-card));color:var(--tm-ink)">0.10</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 28%, var(--tm-card));color:var(--tm-ink)">0.10</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 28%, var(--tm-card));color:var(--tm-ink)">0.10</span><span class="llm-matrix-sum">1.00</span></div>
											<div class="llm-matrix-row is-selected"><span class="llm-matrix-label">sat</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 38%, var(--tm-card));color:var(--tm-ink)">0.12</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-green) 100%, var(--tm-sky));color:#071a22">0.42</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 82%, var(--tm-card));color:#071a22">0.20</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 28%, var(--tm-card));color:var(--tm-ink)">0.10</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 16%, var(--tm-card));color:var(--tm-ink)">0.08</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 16%, var(--tm-card));color:var(--tm-ink)">0.08</span><span class="llm-matrix-sum">1.00</span></div>
											<div class="llm-matrix-row"><span class="llm-matrix-label">on</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 16%, var(--tm-card));color:var(--tm-ink)">0.08</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 60%, var(--tm-card));color:var(--tm-ink)">0.16</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-green) 36%, var(--tm-sky));color:#071a22">0.30</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 70%, var(--tm-card));color:#071a22">0.18</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 60%, var(--tm-card));color:var(--tm-ink)">0.16</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 38%, var(--tm-card));color:var(--tm-ink)">0.12</span><span class="llm-matrix-sum">1.00</span></div>
											<div class="llm-matrix-row"><span class="llm-matrix-label">the</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 6%, var(--tm-card));color:var(--tm-ink)">0.06</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 38%, var(--tm-card));color:var(--tm-ink)">0.12</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 70%, var(--tm-card));color:#071a22">0.18</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 60%, var(--tm-card));color:var(--tm-ink)">0.16</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-green) 14%, var(--tm-sky));color:#071a22">0.26</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 92%, var(--tm-card));color:#071a22">0.22</span><span class="llm-matrix-sum">1.00</span></div>
											<div class="llm-matrix-row"><span class="llm-matrix-label">mat</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 0%, var(--tm-card));color:var(--tm-ink)">0.05</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 28%, var(--tm-card));color:var(--tm-ink)">0.10</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 38%, var(--tm-card));color:var(--tm-ink)">0.12</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-sky) 48%, var(--tm-card));color:var(--tm-ink)">0.14</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-green) 2%, var(--tm-sky));color:#071a22">0.24</span><span class="llm-matrix-cell" style="background:color-mix(in srgb, var(--tm-green) 62%, var(--tm-sky));color:#071a22">0.35</span><span class="llm-matrix-sum">1.00</span></div>
										</div>
										<p class="llm-note llm-matrix-note">Softmax gives each query exactly <b>1.00</b> of attention mass. The row is a probability distribution, if one key gets more, every other key gets less. The last column shows the sum.</p>
										<p class="llm-note llm-mask-note"><b>Causal mask</b> (also called an autoregressive mask): a word may only see itself and the words before it. Future cells are set to zero before the softmax and the row is renormalised, so it still sums to <b>1.00</b>. That is what stops the model from reading the answer it is about to write.</p>
									</div>
									<div class="llm-qkv">
										<span class="is-q">query</span><span class="llm-arrow">×</span><span class="is-k" data-no-i18n>keys</span><span class="llm-arrow">→</span><span class="is-s">softmax</span><span class="llm-arrow">→</span><span class="is-v">mix values</span>
									</div>
									<div class="llm-attn-math">
										<div class="llm-math-label">One head, one token</div>
										<div class="llm-math-eq" id="llm-attn-eq"></div>
										<p class="llm-note" id="llm-attn-math-note"></p>
									</div>
								</div>

								<div class="llm-pane is-on" data-llm-pane="pretraining">
									<h4 class="llm-pane-title">Objective · Pretraining</h4>
									<div class="llm-obj-switch">
										<button class="chip is-on" type="button" aria-pressed="true" data-llm-objective="bert">BERT · fill the blank</button>
										<button class="chip" type="button" aria-pressed="false" data-llm-objective="gpt">GPT · predict the next</button>
										<button class="chip" type="button" data-llm-next>move the blank →</button>
									</div>
									<div class="llm-sentence llm-pretrain-sentence" id="llm-pretrain-sentence"></div>
									<div class="llm-predict" id="llm-predict"></div>
									<div class="llm-pipeline" aria-label="Pretraining pipeline">
										<span class="llm-step">general text</span><span class="llm-arrow">→</span>
										<span class="llm-step is-glow">pretrain</span><span class="llm-arrow">→</span>
										<span class="llm-step">small labelled set</span><span class="llm-arrow">→</span>
										<span class="llm-step">fine-tune</span>
									</div>
									<p class="llm-note">Pretraining is an objective, not an architecture: the label is the text itself. BERT hides a token and reads both sides; GPT hides the future and reads only the past. Click any token to move the blank.</p>
								</div>

								<div class="llm-pane is-on" data-llm-pane="scale">
									<h4 class="llm-pane-title">Strategy · Scale</h4>
									<p class="llm-note">For a fixed compute budget, the best model size changes: a large model with too few tokens loses to a smaller, better-trained one. The Chinchilla experiments made this trade-off explicit, and later models often spend more tokens per parameter.</p>
								</div>
							</div>
							<div class="demo-insight"><b>Takeaway</b><span>Attention is the mechanism, pretraining is the objective, scale is how much compute and data the run uses.</span></div>
							<div class="demo-foot">
								Toy sentence and toy attention weights. The point is the mechanism, not the exact numbers.
							</div>
						</div>

						<div class="keypoints">
							<div class="keypoint"><b>Self-attention</b><span>Every position can gather information from every other position in one layer.</span></div>
							<div class="keypoint"><b>Pretraining</b><span>A general model learns language from a large corpus before it is adapted to a task.</span></div>
							<div class="keypoint"><b>BERT</b><span>Encoder plus masked tokens: bidirectional context, then fine-tuning.</span></div>
							<div class="keypoint"><b>GPT</b><span>Decoder plus next token: autoregressive generation, then scale and post-training.</span></div>
						</div>
						<div class="aha">
							<span class="aha-kicker">The aha</span>
							<p class="aha-big">The transformer made context parallel.</p>
							<p class="aha-sub">Recurrence forced the model to carry the past through a chain. Self-attention lets every token ask every other token what it needs, and that one change made both long-range context and large-scale training practical.</p>
						</div>
						<div class="prose">
							<p>
								There is a second, smaller alphabet underneath all of this: the
								<strong>tokenizer</strong>. A model does not read words or letters; it reads a
								fixed table of fragments, usually built with byte-pair encoding. Common words
								become one token; rare words split into pieces. The table is fixed before
								training, so it quietly decides what is cheap, what is expensive, and what
								the model can represent at all. Where it lives today: attention is the
								block, pretraining is next-token prediction, scale is parameters and
								tokens, and the tokenizer is the fixed table under all of it.
							</p>
						</div>
					</section>

					<section class="section-block" id="lessons">
						<div class="section-kicker"><span class="sk-num">09</span> What the history teaches</div>
						<h2 class="section-title">A collective, uneven climb.</h2>
						<div class="prose">
							<p>
								The usual story strings famous names and sudden breakthroughs together.
								The actual history is slower and more collective. Counting devices appear
								independently in southern Africa, central Europe, and central Africa. The first
								neural network paper lands in a biophysics journal. The perceptron is announced
								by the U.S. Navy, criticised, and survives in the margins until the hardware
								and the data catch up.
							</p>
							<p>
								There were winters: periods when the promises outran the results and funding was
								cut. There were also quiet accumulations (the stored-program idea, the
								transistor, the GPU, the dataset, the optimizer) without which the same
								algorithm would be a curiosity. The transformer bundled a very long prehistory.
							</p>
						</div>
						<div class="keypoints">
							<div class="keypoint"><b>External memory</b><span>Notches, tablets, punched cards, caches: a count kept where you can return to it.</span></div>
							<div class="keypoint"><b>Convergence</b><span>Ideas from astronomy, logic, biology, and games met by accident and circumstance.</span></div>
							<div class="keypoint"><b>The missing names</b><span>The wider history follows the materials, labour, and contributors the parade forgets.</span></div>
						</div>
						<div class="myth-grid">
							<div class="myth">
								<b>Common misreading</b>
								<span>“AI was invented in 2022.” The interface was new; the lineage begins with deliberately made stone tools about 3.3 million years ago.</span>
							</div>
							<div class="myth myth--ok">
								<b>Better frame</b>
								<span>“The transformer bundled a long prehistory.” Counting, logic, feedback, learning, and hardware all had to be in place.</span>
							</div>
							<div class="myth myth--ok">
								<b>Better frame</b>
								<span>“The winters were part of the learning curve.” Promise, disappointment, and quiet accumulation are how the field actually moves.</span>
							</div>
					</div>
					</section>

				</article>
			</div>
		</div>
	</main>


	<script src="../temml.min.js"></script>
	<script src="assets/site.js?v=<?php echo filemtime(__DIR__.'/assets/site.js'); ?>"></script>
	<script src="plotly-2.24.1.min.js"></script>
	<script>
	(function () {
		"use strict";

		var ceresRoot = document.getElementById("ceres-plot");
		if (ceresRoot && window.Plotly) {
			var CERES_DE = TM.lang() === "de";
			var ceresSigma = document.getElementById("ceres-sigma");
			var ceresResample = document.getElementById("ceres-resample");
			var ceresData = { path: [], obs: [], err: [] };

			function ceresRgba(hex, alpha) {
				hex = String(hex || "").replace("#", "");
				if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
				var n = parseInt(hex, 16);
				if (isNaN(n)) return "rgba(18,117,172," + alpha + ")";
				return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + alpha + ")";
			}

			function ceresSample() {
				var sigma = parseFloat(ceresSigma.value);
				var path = [];
				for (var i = 0; i <= 10; i += 0.2) {
					path.push({ x: i, y: Math.sin(i / 2) * 3 + 5 });
				}
				var obs = [];
				var err = [];
				for (var j = 0; j < 150; j++) {
					var x = Math.random() * 10;
					var trueY = Math.sin(x / 2) * 3 + 5;
					var u = 0, v = 0;
					while (u === 0) u = Math.random();
					while (v === 0) v = Math.random();
					var noise = sigma * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
					obs.push({ x: x, y: trueY + noise });
					err.push(noise);
				}
				ceresData = { path: path, obs: obs, err: err };
			}

			function ceresDraw() {
				var c = TM.colors();
				var sigma = parseFloat(ceresSigma.value);
				var xBell = [];
				var yBell = [];
				for (var i = -4; i <= 4; i += 0.1) {
					xBell.push(i);
					yBell.push((1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow(i / sigma, 2)));
				}
				var traces = [
					{
						x: ceresData.path.map(function (p) { return p.x; }),
						y: ceresData.path.map(function (p) { return p.y; }),
						mode: "lines", name: CERES_DE ? "Wahre Bahn" : "True orbit",
						line: { color: c.green, width: 3, shape: "spline" }
					},
					{
						x: ceresData.obs.map(function (p) { return p.x; }),
						y: ceresData.obs.map(function (p) { return p.y; }),
						mode: "markers", name: CERES_DE ? "Beobachtungen" : "Observations",
						marker: {
							color: c.blue,
							size: 5,
							opacity: 0.55,
							line: { color: ceresRgba(c.blue, 0.3), width: 1 }
						}
					},
					{
						x: ceresData.err,
						type: "histogram",
						name: CERES_DE ? "Fehlerverteilung" : "Error distribution",
						histnorm: "probability density",
						marker: { color: ceresRgba(c.blue, 0.35), line: { color: ceresRgba(c.blue, 0.6), width: 1 } },
						xaxis: "x2", yaxis: "y2",
						nbinsx: 20
					},
					{
						x: xBell, y: yBell, mode: "lines", name: CERES_DE ? "Theorie" : "Theoretical curve",
						line: { color: c.coral, width: 2.5 },
						xaxis: "x2", yaxis: "y2"
					}
				];
				var layout = {
					grid: { rows: 1, columns: 2, pattern: "independent" },
					paper_bgcolor: "rgba(0,0,0,0)",
					plot_bgcolor: "rgba(0,0,0,0)",
					font: { color: c.ink, family: "Open Sans, sans-serif", size: 12 },
					title: { text: CERES_DE ? "Ceres: Wahrheit gegen verrauschte Beobachtungen" : "Ceres: truth vs. noisy observations", font: { color: c.ink } },
					xaxis: {
						title: { text: CERES_DE ? "Zeit / Bogen" : "Time / arc" },
						domain: [0, 0.58],
						gridcolor: c.line,
						zerolinecolor: c.lineStrong
					},
					yaxis: {
						title: { text: CERES_DE ? "Himmelsposition" : "Celestial position" },
						anchor: "x1",
						gridcolor: c.line,
						zerolinecolor: c.lineStrong
					},
					xaxis2: {
						title: { text: CERES_DE ? "Residuum (Δ)" : "Residual error (Δ)" },
						domain: [0.68, 1],
						range: [-4, 4],
						gridcolor: c.line,
						zerolinecolor: c.lineStrong
					},
					yaxis2: {
						title: { text: CERES_DE ? "Wahrscheinlichkeitsdichte" : "Probability density" },
						anchor: "x2",
						gridcolor: c.line,
						zerolinecolor: c.lineStrong
					},
					showlegend: false,
					height: 500,
					margin: { t: 52, b: 50, l: 50, r: 20 }
				};
				Plotly.react(ceresRoot, traces, layout, { displayModeBar: false, responsive: true });
			}

			ceresSigma.addEventListener("input", function () {
				ceresSample();
				ceresDraw();
			});
			if (ceresResample) {
				ceresResample.addEventListener("click", function () {
					ceresSample();
					ceresDraw();
				});
			}
			window.addEventListener("tm:theme", ceresDraw);
			ceresSample();
			ceresDraw();
		}

		var gateRoot = document.getElementById("gate-plot");
		if (gateRoot) {
			var GATE_DE = TM.lang() === "de";
			var GATE_DATA = {
				or: [[0, 0, false], [0, 1, true], [1, 0, true], [1, 1, true]],
				and: [[0, 0, false], [0, 1, false], [1, 0, false], [1, 1, true]],
				xor: [[0, 0, false], [0, 1, true], [1, 0, true], [1, 1, false]]
			};
			var gateMode = "or";
			var gateReadout = document.getElementById("gate-readout");
			function drawGate() {
				var padL = 58, padR = 24, padT = 24, padB = 48;
				var W = 360, H = 330;
				var plotW = W - padL - padR, plotH = H - padT - padB;
				function gx(v) { return padL + v * plotW; }
				function gy(v) { return padT + (1 - v) * plotH; }
				var out = "";
				for (var g = 0; g <= 1; g += 1) {
					out += '<line x1="' + gx(g) + '" y1="' + padT + '" x2="' + gx(g) + '" y2="' + (padT + plotH) + '" stroke="var(--tm-line)" stroke-width="1"></line>';
					out += '<line x1="' + padL + '" y1="' + gy(g) + '" x2="' + (padL + plotW) + '" y2="' + gy(g) + '" stroke="var(--tm-line)" stroke-width="1"></line>';
				}
				out += '<line x1="' + padL + '" y1="' + (padT + plotH) + '" x2="' + (padL + plotW) + '" y2="' + (padT + plotH) + '" stroke="var(--tm-ink-soft)" stroke-width="1.5"></line>';
				out += '<line x1="' + padL + '" y1="' + padT + '" x2="' + padL + '" y2="' + (padT + plotH) + '" stroke="var(--tm-ink-soft)" stroke-width="1.5"></line>';
				out += '<text x="' + (padL + plotW / 2) + '" y="' + (H - 12) + '" text-anchor="middle" fill="var(--tm-muted)" font-size="11">' + (GATE_DE ? "Eingang A" : "Input A") + '</text>';
				out += '<text x="14" y="' + (padT + plotH / 2) + '" text-anchor="middle" fill="var(--tm-muted)" font-size="11" transform="rotate(-90 14 ' + (padT + plotH / 2) + ')">' + (GATE_DE ? "Eingang B" : "Input B") + '</text>';
				[0, 1].forEach(function (v) {
					var tick = v ? (GATE_DE ? "wahr" : "true") : (GATE_DE ? "falsch" : "false");
					out += '<text x="' + gx(v) + '" y="' + (padT + plotH + 18) + '" text-anchor="middle" fill="var(--tm-muted)" font-size="10">' + tick + '</text>';
					out += '<text x="' + (padL - 12) + '" y="' + (gy(v) + 3) + '" text-anchor="end" fill="var(--tm-muted)" font-size="10">' + tick + '</text>';
				});
				out += '<circle cx="' + (W - 132) + '" cy="14" r="5" fill="var(--tm-green)"></circle>';
				out += '<text x="' + (W - 123) + '" y="18" fill="var(--tm-muted)" font-size="10">' + (GATE_DE ? "wahr" : "true") + '</text>';
				out += '<circle cx="' + (W - 62) + '" cy="14" r="5" fill="var(--tm-coral)"></circle>';
				out += '<text x="' + (W - 53) + '" y="18" fill="var(--tm-muted)" font-size="10">' + (GATE_DE ? "falsch" : "false") + '</text>';
				if (gateMode !== "xor") {
					var a, b;
					if (gateMode === "or") { a = [0.58, -0.08]; b = [-0.08, 0.58]; }
					else { a = [0.42, 1.08]; b = [1.08, 0.42]; }
					out += '<line x1="' + gx(a[0]) + '" y1="' + gy(a[1]) + '" x2="' + gx(b[0]) + '" y2="' + gy(b[1]) + '" stroke="var(--tm-blue)" stroke-width="1" stroke-dasharray="6 5"></line>';
				}
				GATE_DATA[gateMode].forEach(function (p) {
					var px = gx(p[0]);
					var py = gy(p[1]);
					var anchor = p[0] === 1 ? "end" : "start";
					out += '<circle cx="' + px + '" cy="' + py + '" r="10" fill="' + (p[2] ? "var(--tm-green)" : "var(--tm-coral)") + '" stroke="var(--tm-card)" stroke-width="2"></circle>';
					out += '<text x="' + (px + (p[0] === 1 ? -16 : 16)) + '" y="' + (py + 4) + '" text-anchor="' + anchor + '" fill="var(--tm-ink)" font-size="11">' + p[0] + "," + p[1] + '</text>';
				});
				gateRoot.innerHTML = out;
				if (gateReadout) {
					if (gateMode === "xor") {
						gateReadout.textContent = GATE_DE
							? "XOR: Keine einzelne gerade Linie trennt die Klassen. Eine versteckte Schicht kann den Raum verbiegen, bis zwei Schnitte reichen."
							: "XOR: no single straight line separates the classes. A hidden layer can bend the space until two cuts are enough.";
					} else {
						gateReadout.textContent = GATE_DE
							? (gateMode === "or" ? "OR: Eine gerade Linie trennt die Klassen." : "AND: Eine gerade Linie trennt die Klassen.")
							: (gateMode === "or" ? "OR: a straight line separates the classes." : "AND: a straight line separates the classes.");
					}
				}
			}
			document.querySelectorAll("[data-gate]").forEach(function (btn) {
				btn.addEventListener("click", function () {
					gateMode = btn.getAttribute("data-gate");
					document.querySelectorAll("[data-gate]").forEach(function (b) { b.classList.toggle("is-on", b === btn); });
					drawGate();
				});
			});
			drawGate();
		}

		var points = [
			{
				date: "c. 43,000 BCE",
				name: "Tally bones",
				era: "Prehistory · external memory",
				title: "Counting becomes an object",
				text: "The Lebombo bone (c. 43,000-42,000 years ago) carries 29 notches; the Dolní Věstonice wolf bone (c. 27,000) carries 55 in two groups; the Ishango bone (c. 18,000 BCE) carries grouped notches. One column groups 11, 13, 17, and 19, the primes between 10 and 20; some read that as a prime-number list, while others read the marks as a tally or a lunar record. The grouping is suggestive, not a decoded message. The same idea (outsource counting to a physical object) appears independently in Africa and Europe. It is the earliest surviving external mathematical memory.",
				img: "../ishango.jpg",
				alt: "The Ishango bone, a baboon fibula with grouped notches",
				cap: "The Ishango bone. Image: Ben2, <a href='https://commons.wikimedia.org/wiki/File:Os_d%27Ishango_IRSNB.JPG' rel='noopener'>CC BY-SA 3.0</a>."
			},
			{
				date: "c. 300 BCE",
				name: "Counting boards",
				era: "Antiquity · spatial abstraction",
				title: "Calculating becomes a machine",
				text: "The Salamis Tablet (c. 300 BCE) is the oldest surviving counting board: a marble slab with etched lines and pebbles (calculi). It maps numbers to grid coordinates, uses a rule-based physical system for arithmetic, and stores intermediate sums outside the head. The word calculus comes from the pebbles.",
				img: "../salamic_table.jpg",
				alt: "The Salamis Tablet counting board",
				cap: "The Salamis Tablet (c. 300 BCE). Image: Wilhelm Kubitschek, <a href='https://de.wikipedia.org/wiki/Datei:Salaminische_Tafel_Salamis_Tablet_nach_Wilhelm_Kubitschek_Numismatische_Zeitschrift_Bd_31_Wien_1899_p._394_ff.jpg' rel='noopener'>public domain</a>."
			},
			{
				date: "c. 350 BCE-600 CE",
				name: "Logic & grammar",
				era: "Antiquity · formal rules",
				title: "Reason and speech become calculi",
				text: "Aristotle’s syllogism separates the structure of an argument from its content: all M are P; S is M; therefore S is P. In India, Pāṇini’s Aṣṭādhyāyī gives Sanskrit a fully generative grammar of metarules, transformations, and recursion: a compiler-like contract long before the European grammatical tradition. Reasoning and speech both become formal systems that can, in principle, be executed.",
				img: "../Sanzio_01_Plato_Aristotle.jpg",
				alt: "Plato and Aristotle in Raphael's School of Athens",
				cap: "Plato and Aristotle in Raphael’s <em>School of Athens</em>. Image: Raphael, <a href='https://commons.wikimedia.org/wiki/File:Sanzio_01_Plato_Aristotle.jpg' rel='noopener'>public domain</a>."
			},
			{
				date: "c. 200-60 BCE",
				name: "Antikythera",
				era: "Antiquity · analog computation",
				title: "Gears that model the sky",
				text: "Recovered in 1901 from a shipwreck, the Antikythera mechanism is a hand-powered model of the sky with at least 30 meshing bronze gears. It predicted astronomical positions and eclipses decades in advance, and tracked the four-year cycle of the Olympic Games. For over a millennium, no equally complex geared technology is known in the West. Computation also has roots in mechanical simulation.",
				img: "../antikythera.jpg",
				alt: "Fragments of the Antikythera mechanism",
				cap: "Fragments of the Antikythera mechanism. Image: Therese Clutario, <a href='https://commons.wikimedia.org/wiki/File:Fragments_of_the_Antikythera_Mechanism.jpg' rel='noopener'>CC BY 2.0</a>."
			},
			{
				date: "1305",
				name: "Llull’s wheels",
				era: "Medieval · mechanical combination",
				title: "Thought on rotating discs",
				text: "Ramon Llull’s Ars Magna uses concentric paper discs inscribed with letters for fundamental concepts. Turn the wheels and every logically possible combination is generated. It looks like mysticism and combinatorics, but it is the first documented attempt to create a universal logical language that produces new knowledge through mechanical operations: a direct ancestor of the symbol-manipulation view of intelligence.",
				img: "../FigurScheiben.jpg",
				alt: "A Llull volvelle with rotating concentric discs",
				cap: "A Llull volvelle from the Ars Magna tradition. Image: Ramon Llull, <a href='https://blog.hnf.de/das-universum-des-ramon-llull/' rel='noopener'>public domain</a>."
			},
			{
				date: "1673-1694",
				name: "Leibniz’s reckoner",
				era: "Enlightenment · calculation",
				title: "Reason becomes arithmetic",
				text: "Leibniz’s stepped reckoner was the first calculator able to perform all four arithmetic operations; the carry mechanism was unreliable, but the design and his programme for a mathesis universalis outlived the brass. He also formalised binary notation, reducing logic to 0 and 1.",
				img: "../Leibnizrechenmaschine.jpg",
				alt: "Leibniz's stepped reckoner (reconstruction)",
				cap: "Leibniz’s stepped reckoner (reconstruction). Image: Eremeev, <a href='https://de.wikipedia.org/wiki/Datei:Rechenmaschine_von_Leibniz_(Nachbau)_06.jpg' rel='noopener'>CC BY-SA 4.0</a>."
			},
			{
				date: "1833-1843",
				name: "Babbage & Ada",
				era: "Industrial · programmability",
				title: "From calculation to a program",
				text: "Babbage designed the Analytical Engine, with a store, a mill, and punched-card input. Ada Lovelace saw further than the machine’s builder: the Engine could manipulate symbols, not only numbers, and she wrote the first published algorithm intended for it. The separation of hardware from a stored program is the hinge on which the rest turns.",
				img: "../babbage.jpg",
				alt: "Babbage's Analytical Engine",
				cap: "Babbage’s Analytical Engine. Image: John Cummings, <a href='https://commons.wikimedia.org/wiki/File:Babbages_Analytical_Engine,_1834-1871._(9660574685).jpg' rel='noopener'>CC BY-SA 2.0</a>."
			},
			{
				date: "1943",
				name: "Neurons",
				era: "Cybernetics · logical neurons",
				title: "The first logical neurons",
				text: "McCulloch and Pitts (1943) model a neuron as a logical threshold unit. Their networks without loops compute Boolean functions; networks with loops can hold a state, and von Neumann used those loops as memory in the stored-program computer. Wiener’s cybernetics, Ashby’s homeostat, and Grey Walter’s tortoise explore feedback and adaptation. The idea that a machine could compute with neurons enters the room.",
				img: "../walter_pitts_1954.jpg",
				alt: "Walter Pitts in 1954",
				cap: "Walter Pitts in 1954. Image: Francis Bello, <a href='https://commons.wikimedia.org/wiki/File:1954_Walter_Pitts_and_a_blackboard.jpg' rel='noopener'>public domain</a>."
			},
			{
				date: "1951",
				name: "SNARC",
				era: "Cybernetics · learning hardware",
				title: "An early learning machine",
				text: "Marvin Minsky and Dean Edmonds build the SNARC, a randomly connected network of 40 vacuum-tube neurons that learns by reinforcement. It is one of the first hardware attempts at a learning network: no program, just knobs and clutches that change with success. Whether it counts as a neural network in today's sense depends on the definition. The machine is a rat in a maze made of hardware.",
				img: "../marvin_minsky_portrait.jpg",
				alt: "Marvin Minsky",
				cap: "Marvin Minsky, who built the SNARC with Dean Edmonds. Image: Steamtalks (Flickr), <a href='https://commons.wikimedia.org/wiki/File:Marvin_Minsky.jpg' rel='noopener'>CC BY-SA 2.0</a>."
			},
			{
				date: "1950-1952",
				name: "Shannon & Theseus",
				era: "Cybernetics · learning by maze",
				title: "A mouse that learns the maze",
				text: "Claude Shannon builds Theseus, a relay-powered mouse that learns a 25-square maze by trial and error. It is not a neural network; it is an electromechanical machine that finds the route through its relays. The lesson is the one the field keeps relearning: a machine can adapt its behaviour from feedback without being told the route.",
				img: "assets/img/theseus-shannon.jpg",
				alt: "Theseus, the maze-solving mouse, at the MIT Museum",
				cap: "Theseus, the maze-solving mouse built by Claude and Betty Shannon (1950), MIT Museum. Image: Nickknack00, <a href='https://commons.wikimedia.org/wiki/File:Theseus_(1950),_Betty_and_Claude_Shannon,_MIT_Museum.jpg' rel='noopener'>CC BY 4.0</a>."
			},
			{
				date: "1958-1960",
				name: "Perceptron",
				era: "Learning machines · weights from error",
				title: "A machine that learns from its mistakes",
				text: "Frank Rosenblatt’s perceptron learns weights from examples and is announced by the U.S. Navy. The Mark I Perceptron uses 400 photocells and motor-driven potentiometers; its learning rule updates weights directly from error. The press hears a machine that will walk, talk, and see; the science hears a learning rule.",
				img: "../perceptron2.jpg",
				alt: "The Mark I Perceptron",
				cap: "The Mark I Perceptron, announced by the U.S. Navy in 1958. Image: U.S. Navy, <a href='https://commons.wikimedia.org/wiki/File:330-PSA-80-60_(USN_710739)_(20897323365).jpg' rel='noopener'>public domain</a>."
			},
			{
				date: "1959-2011",
				name: "Winters & narrow AI",
				era: "Cold War · promises and detours",
				title: "The name, the winters, the slow climb",
				text: "At the 1956 Dartmouth summer project, McCarthy, Minsky, Rochester, and Shannon named the field; about ten people came, and no consensus emerged. Symbolic AI built the Logic Theorist, then GPS (1957-59), expert systems, planners, and microworlds such as SHRDLU. It hit the frame problem, representing what does not change, and the limits of hand-coded rules. Minsky and Papert’s 1969 Perceptrons exposed the limits of a single layer; funding froze in the first AI winter. Connectionism returned in the 1980s; a second winter followed. Deep Blue beat Kasparov in 1997, but it remained a narrow, hand-tuned system.",
				img: "../shrdlu.gif",
				alt: "Screenshot of the SHRDLU blocks-world natural-language interface",
				cap: "SHRDLU (1972), Terry Winograd's blocks-world program. Image: ai.lect, <a href='https://commons.wikimedia.org/wiki/File:Ailect15shrdlu1.gif' rel='noopener'>CC BY-SA 4.0</a>."
			},
			{
				date: "2012-2016",
				name: "Deep learning",
				era: "GPU era · scale",
				title: "The convergence becomes visible",
				text: "AlexNet (2012) wins ImageNet with a deep convolutional network trained on GPUs, hardware built for games. ReLU activations and dropout let it train more layers end-to-end on raw pixels. AlphaGo defeats Lee Sedol in 2016. The ingredients are now in place: bigger models, more data, and parallel hardware.",
				img: "../alphago_leesedol.jpg",
				alt: "The AlphaGo versus Lee Sedol match in Seoul, 2016",
				cap: "Lee Sedol and AlphaGo, Game 4, 2016. Image: Korea Baduk Association, <a href='https://commons.wikimedia.org/wiki/File:Lee_Sedol_(B)_vs_AlphaGo_(W)_-_Game_4.jpg' rel='noopener'>CC BY-SA 4.0</a>."
			},
			{
				date: "2017-2018",
				name: "Transformer & BERT",
				era: "Attention · pretraining",
				title: "Context becomes parallel",
				text: "“Attention Is All You Need” (Vaswani et al., 2017) replaces recurrence with self-attention: every token can look at every other token in one layer, and the whole sequence is processed in parallel. Positional encodings keep order. BERT (Devlin et al., 2019) keeps the encoder, masks random tokens, and trains bidirectionally; after pretraining, a small fine-tuning set sets new records. The recipe becomes pretrain, then fine-tune.",
				img: "../transformer_attention_heads.png",
				alt: "Attention heads from the original Transformer paper",
				cap: "Two attention heads from layer 5 of 6 in the original Transformer. Image: Google, <a href='https://commons.wikimedia.org/wiki/File:Attention_Is_All_You_Need_-_Full_attentions_for_head_5.png' rel='noopener'>CC BY-SA 4.0</a>."
			},
			{
				date: "2020-2022",
				name: "Scale & alignment",
				era: "LLMs · post-training",
				title: "Scale, then steer",
				text: "GPT-3 (Brown et al., 2020) shows that a 175-billion-parameter language model can learn from a handful of examples in the prompt. The Chinchilla experiments (Hoffmann et al., 2022) show that many models were too large for their training data: for the same compute, a smaller model on more tokens does better. LLaMA brings that lesson to open weights. RLHF and InstructGPT shape the next-token distribution toward answers people find helpful.",
				img: "../data_center.jpg",
				alt: "A data center aisle of server racks",
				cap: "A data center aisle: the compute behind the scale era. Image: Christopher Bowns, <a href='https://commons.wikimedia.org/wiki/File:Virginia_Tech_-_data_center.jpg' rel='noopener'>CC BY-SA 2.0</a>."
			},
			{
				date: "2022-today",
				name: "The LLM era",
				era: "Scaling · assistants",
				title: "A loop that got good enough to talk",
				text: "ChatGPT makes the next-token loop a public interface. The ingredients were already in place: tokens, vectors, attention, gradient descent, more data, and post-training. The history is still being written, and the same convergence that produced the model also produced its limitations, its costs, and the arguments about what it means.",
				img: "assets/img/chatgpt.png",
				alt: "A ChatGPT conversation window",
				cap: "ChatGPT turns the next-token loop into a public interface. Image: Lugab89, <a href='https://commons.wikimedia.org/wiki/File:ChatGPT.png' rel='noopener'>CC BY 3.0</a>."
			}
		];

		var track = document.getElementById("timeline-track");
		var panel = document.getElementById("timeline-panel");
		var prevBtn = document.getElementById("tl-prev");
		var nextBtn = document.getElementById("tl-next");
		if (track && panel) {
			points.forEach(function (p, i) {
				var b = document.createElement("button");
				b.type = "button";
				b.className = "tl-node" + (i === 0 ? " is-active" : "");
				b.setAttribute("data-i", i);
				b.innerHTML = '<span class="tl-dot"></span><span class="tl-date">' + p.date + '</span><span class="tl-name">' + p.name + "</span>";
				b.addEventListener("click", function () { select(i); });
				track.appendChild(b);
			});
			function updateArrows() {
				var max = track.scrollWidth - track.clientWidth - 1;
				if (prevBtn) prevBtn.disabled = track.scrollLeft <= 1;
				if (nextBtn) nextBtn.disabled = track.scrollLeft >= max;
			}
			function scrollByStep(dir) {
				track.scrollBy({
					left: dir * Math.max(180, track.clientWidth * 0.55),
					behavior: "smooth"
				});
			}
			function panelHtml(p) {
				var html = '<div><span class="tl-era">' + p.era + '</span><h3>' + p.title + "</h3><p>" + p.text + "</p></div>";
				if (p.img) {
					html += '<figure><img src="' + TM.asset(p.img) + '" alt="' + p.alt + '" loading="lazy"><figcaption>' + p.cap + "</figcaption></figure>";
				}
				return html;
			}
			function select(i) {
				var p = points[i];
				track.querySelectorAll(".tl-node").forEach(function (n) { n.classList.remove("is-active"); });
				var node = track.querySelector('[data-i="' + i + '"]');
				if (node) node.classList.add("is-active");
				panel.className = "tl-panel" + (p.img ? "" : " no-figure");
				panel.innerHTML = panelHtml(p);
				updateArrows();
			}

			var probe = document.createElement("div");
			probe.setAttribute("aria-hidden", "true");
			probe.style.cssText = "position:absolute;left:-99999px;top:0;visibility:hidden;pointer-events:none;";
			document.body.appendChild(probe);
			var measureToken = 0;
			function measurePanelHeight() {
				var token = ++measureToken;
				var width = panel.getBoundingClientRect().width;
				if (!width) return;
				probe.style.width = width + "px";
				probe.innerHTML = "";
				var slides = points.map(function (p) {
					var slide = document.createElement("div");
					slide.className = "tl-panel" + (p.img ? "" : " no-figure");
					slide.style.cssText = "height:auto;min-height:0;overflow:visible;";
					slide.innerHTML = panelHtml(p);
					probe.appendChild(slide);
					var loads = Array.prototype.map.call(slide.querySelectorAll("img"), function (img) {
						img.loading = "eager";
						return new Promise(function (resolve) {
							if (img.complete) { resolve(); return; }
							img.addEventListener("load", resolve, { once: true });
							img.addEventListener("error", resolve, { once: true });
						});
					});
					return Promise.all(loads).then(function () { return slide.offsetHeight; });
				});
				Promise.all(slides).then(function (heights) {
					if (token !== measureToken) return;
					probe.innerHTML = "";
					var max = heights.reduce(function (a, b) { return Math.max(a, b); }, 0);
					if (!max) return;
					panel.style.height = "auto";
					panel.style.minHeight = Math.ceil(max) + "px";
				});
			}
			var panelResizeTimer = null;
			function scheduleMeasure() {
				clearTimeout(panelResizeTimer);
				panelResizeTimer = setTimeout(measurePanelHeight, 150);
			}
			window.addEventListener("resize", scheduleMeasure);
			if (document.fonts && document.fonts.ready) document.fonts.ready.then(measurePanelHeight);
			if (prevBtn) prevBtn.addEventListener("click", function () { scrollByStep(-1); });
			if (nextBtn) nextBtn.addEventListener("click", function () { scrollByStep(1); });
			track.addEventListener("scroll", updateArrows, { passive: true });
			window.addEventListener("resize", updateArrows);
			var timelineDemo = document.getElementById("timeline-demo");
			if (timelineDemo) {
				timelineDemo.addEventListener("click", function (e) {
					if (e.target.closest("button, a, input, select, textarea")) return;
					try { track.focus({ preventScroll: true }); } catch (err) { track.focus(); }
				});
			}
			var down = false, startX = 0, startScroll = 0, moved = false, suppressClick = false;
			track.addEventListener("pointerdown", function (e) {
				if (e.target.closest(".tl-node")) return;
				down = true;
				moved = false;
				startX = e.clientX;
				startScroll = track.scrollLeft;
				track.classList.add("is-dragging");
			});
			track.addEventListener("pointermove", function (e) {
				if (!down) return;
				var dx = e.clientX - startX;
				if (Math.abs(dx) > 3) {
					moved = true;
					if (track.setPointerCapture) track.setPointerCapture(e.pointerId);
				}
				if (moved) track.scrollLeft = startScroll - dx;
			});
			function endDrag(e) {
				if (!down) return;
				down = false;
				track.classList.remove("is-dragging");
				if (moved) {
					suppressClick = true;
					setTimeout(function () { suppressClick = false; }, 80);
				}
				if (track.releasePointerCapture && e && e.pointerId != null) {
					try { track.releasePointerCapture(e.pointerId); } catch (err) {}
				}
			}
			track.addEventListener("pointerup", endDrag);
			track.addEventListener("pointercancel", endDrag);
			track.addEventListener("pointerleave", endDrag);
			track.addEventListener("click", function (e) {
				if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; }
			}, true);
			select(0);
			updateArrows();
			measurePanelHeight();
			setTimeout(updateArrows, 200);
		}
	})();
	</script>

	<script>
	(function () {
		"use strict";

		var convImage = document.getElementById("conv-image");
		if (convImage) {
			var CONV_DE = TM.lang() === "de";
			var CONV_IMG = [
				[0, 0, 0, 1, 1],
				[0, 0, 0, 1, 1],
				[0, 0, 0, 1, 1],
				[0, 0, 0, 1, 1],
				[0, 0, 0, 1, 1]
			];
			var CONV_KERNELS = {
				edges: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]],
				blur: [[1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9]]
			};
			var convKernel = document.getElementById("conv-kernel");
			var convOutput = document.getElementById("conv-output");
			var convReadout = document.getElementById("conv-readout");
			var convFormula = document.getElementById("conv-formula");
			var convMode = "edges";
			var convPos = -1;
			var convVisited = {};
			var convTimer = null;
			var convAuto = document.getElementById("conv-auto");
			function convCell(value, cls) {
				var el = document.createElement("div");
				el.className = "conv-cell" + (cls ? " " + cls : "");
				el.textContent = value;
				return el;
			}
			function convTexProduct(p, k) {
				var ks = Math.abs(k - Math.round(k)) < 0.001 ? String(k) : "\\tfrac{1}{9}";
				if (k < 0) ks = "(" + ks + ")";
				return String(p) + "\\cdot " + ks;
			}
			function convFormulaTex(k, row, col, total) {
				var rows = [];
				for (var i = 0; i < 3; i++) {
					var terms = [];
					for (var j = 0; j < 3; j++) terms.push(convTexProduct(CONV_IMG[row + i][col + j], k[i][j]));
					rows.push("\\underbrace{" + terms.join("+") + "}_{\\text{" + (CONV_DE ? "Zeile " : "row ") + (i + 1) + "}}");
				}
				var sum = total.toFixed(2);
				if (CONV_DE) sum = sum.replace(".", "{,}");
				return "\\underbrace{" + rows.join("+") + "=" + sum + "}_{\\text{" + (CONV_DE ? "Summe der neun Produkte für Position " : "sum of the nine products for position ") + "(" + row + "," + col + ")}}";
			}
			function convRender() {
				var k = CONV_KERNELS[convMode];
				var hasPos = convPos >= 0;
				var row = hasPos ? Math.floor(convPos / 3) : -1;
				var col = hasPos ? convPos % 3 : -1;
				convImage.innerHTML = "";
				for (var r = 0; r < 5; r++) {
					for (var c = 0; c < 5; c++) {
						var inPatch = hasPos && r >= row && r < row + 3 && c >= col && c < col + 3;
						var cell = convCell(CONV_IMG[r][c], (CONV_IMG[r][c] ? "is-one" : "") + (inPatch ? " is-patch" : ""));
						convImage.appendChild(cell);
					}
				}
				convKernel.innerHTML = "";
				k.forEach(function (kr) {
					kr.forEach(function (v) {
						convKernel.appendChild(convCell(Math.abs(v - Math.round(v)) < 0.001 ? String(v) : v.toFixed(2), v < 0 ? "is-negative" : ""));
					});
				});
				convOutput.innerHTML = "";
				if (hasPos) convVisited[convPos] = true;
				var values = [];
				for (var orow = 0; orow < 3; orow++) {
					for (var ocol = 0; ocol < 3; ocol++) {
						var sum = 0;
						for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) sum += CONV_IMG[orow + i][ocol + j] * k[i][j];
						values.push(sum);
						var idx = orow * 3 + ocol;
						var seen = !!convVisited[idx];
						var isCurrent = hasPos && orow === row && ocol === col;
						var out = convCell(seen ? sum.toFixed(2) : "?", (isCurrent ? "is-current" : "") + (seen ? "" : " is-unvisited"));
						if (seen) {
							var heat = Math.min(1, Math.abs(sum) / 3);
							out.style.background = "color-mix(in srgb, var(--tm-green) " + (heat * 72) + "%, var(--tm-paper-2))";
						}
						convOutput.appendChild(out);
					}
				}
				if (convReadout) {
					if (!hasPos) {
						convReadout.textContent = CONV_DE
							? "Noch keine Position berechnet. Klicke auf „Nächste Position“, um den Kernel auf (0, 0) anzuwenden."
							: "No position computed yet. Press Next position to apply the kernel at (0, 0).";
					} else {
						var total = values[convPos];
						convReadout.textContent = CONV_DE
							? "Position (" + row + ", " + col + "): Die neun Produkte aus Bildausschnitt und Kernel ergeben " + total.toFixed(2) + ". Die Zellen der Feature Map füllen sich Schritt für Schritt."
							: "Position (" + row + ", " + col + "): the nine products of patch and kernel add up to " + total.toFixed(2) + ". The feature-map cells fill in step by step.";
					}
				}
				if (convFormula) {
					if (hasPos) {
						convFormula.setAttribute("data-tex", convFormulaTex(k, row, col, values[convPos]));
						convFormula.removeAttribute("data-tex-rendered");
						if (TM.typesetMath) TM.typesetMath(convFormula.parentNode);
					} else {
						convFormula.removeAttribute("data-tex");
						convFormula.innerHTML = "";
					}
				}
			}
			function convStopAuto() {
				if (convTimer) {
					clearInterval(convTimer);
					convTimer = null;
				}
				if (convAuto) {
					convAuto.classList.remove("is-on");
					convAuto.setAttribute("aria-pressed", "false");
					convAuto.textContent = CONV_DE ? "Automatisch ▶" : "Auto run ▶";
				}
			}
			function convAdvance() {
				if (convPos >= 8) {
					convPos = -1;
					convVisited = {};
				}
				convPos += 1;
				convRender();
				if (convPos >= 8) convStopAuto();
			}
			document.querySelectorAll("[data-kernel]").forEach(function (btn) {
				btn.addEventListener("click", function () {
					convStopAuto();
					convMode = btn.getAttribute("data-kernel");
					convPos = -1;
					convVisited = {};
					document.querySelectorAll("[data-kernel]").forEach(function (b) { b.classList.toggle("is-on", b === btn); });
					convRender();
				});
			});
			var convStep = document.getElementById("conv-step");
			if (convStep) convStep.addEventListener("click", function () {
				convStopAuto();
				convAdvance();
			});
			if (convAuto) convAuto.addEventListener("click", function () {
				if (convTimer) {
					convStopAuto();
					return;
				}
				convAuto.classList.add("is-on");
				convAuto.setAttribute("aria-pressed", "true");
				convAuto.textContent = CONV_DE ? "Pause ❚❚" : "Pause ❚❚";
				if (convPos >= 8) {
					convPos = -1;
					convVisited = {};
					convRender();
				}
				convAdvance();
				if (convPos < 8) convTimer = setInterval(convAdvance, 750);
			});
			convRender();
		}

		var root = document.getElementById("llm-demo");
		if (!root) return;
		var LLM_DE = TM.lang() === "de";

		/* ── attention ────────────────────────────────────────── */
		var WORDS = ["the", "cat", "sat", "on", "the", "mat"];
		var WORD_LABELS = LLM_DE ? ["die", "Katze", "saß", "auf", "der", "Matte"] : WORDS.slice();
		function wordLabel(i) { return WORD_LABELS[i] || WORDS[i]; }
		var WEIGHTS = [
			[0.30, 0.22, 0.18, 0.10, 0.10, 0.10],
			[0.14, 0.30, 0.26, 0.10, 0.10, 0.10],
			[0.12, 0.42, 0.20, 0.10, 0.08, 0.08],
			[0.08, 0.16, 0.30, 0.18, 0.16, 0.12],
			[0.06, 0.12, 0.18, 0.16, 0.26, 0.22],
			[0.05, 0.10, 0.12, 0.14, 0.24, 0.35]
		];
		var attnSentence = document.getElementById("llm-sentence");
		var arcs = document.getElementById("llm-arcs");
		var bars = document.getElementById("llm-bars");
		var matrix = document.getElementById("llm-matrix");
		var matrixSelected = document.getElementById("llm-matrix-selected");
		var causal = document.getElementById("llm-causal");
		var maskStatus = document.getElementById("llm-mask-status");
		var selected = 2;
		var attnTokens = [];
		var barEls = [];

		function hexToRgb(hex) {
			hex = String(hex || "").replace("#", "");
			if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
			return [
				parseInt(hex.slice(0, 2), 16) || 0,
				parseInt(hex.slice(2, 4), 16) || 0,
				parseInt(hex.slice(4, 6), 16) || 0
			];
		}
		function mixRgb(a, b, t) {
			return [
				Math.round(a[0] + (b[0] - a[0]) * t),
				Math.round(a[1] + (b[1] - a[1]) * t),
				Math.round(a[2] + (b[2] - a[2]) * t)
			];
		}
		function rgbCss(c) { return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")"; }
		function relativeLum(c) {
			function f(v) {
				v /= 255;
				return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
			}
			return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
		}

		WORDS.forEach(function (word, i) {
			var b = document.createElement("button");
			b.type = "button";
			b.className = "llm-token";
			b.textContent = wordLabel(i);
			b.setAttribute("data-i", i);
			b.addEventListener("click", function () { selected = i; renderAttention(); });
			attnSentence.appendChild(b);
			attnTokens.push(b);

			var row = document.createElement("div");
			row.className = "llm-bar";
			var label = document.createElement("span");
			label.textContent = wordLabel(i);
			var track = document.createElement("span");
			track.className = "llm-bar-track";
			var fill = document.createElement("span");
			fill.className = "llm-bar-fill";
			track.appendChild(fill);
			var num = document.createElement("b");
			num.textContent = "0.00";
			row.appendChild(label);
			row.appendChild(track);
			row.appendChild(num);
			bars.appendChild(row);
			barEls.push({ row: row, fill: fill, num: num });
		});

		function rowWeights(row, maskOn) {
			var w = WEIGHTS[row].slice();
			if (maskOn) {
				for (var i = 0; i < w.length; i++) if (i > row) w[i] = 0;
				var sum = w.reduce(function (a, b) { return a + b; }, 0) || 1;
				w = w.map(function (x) { return x / sum; });
			}
			return w;
		}
		function activeWeights() {
			return rowWeights(selected, !!(causal && causal.checked));
		}

		function renderMaskStatus(maskOn) {
			if (!maskStatus) return;
			var visible = WORDS.slice(0, selected + 1);
			var blocked = WORDS.slice(selected + 1);
			var seen = visible.map(function (word, i) {
				return '<span class="llm-ms-chip is-seen">' + wordLabel(i) + "</span>";
			}).join("");
			var hidden = blocked.map(function (word, i) {
				return '<span class="llm-ms-chip is-blocked">' + wordLabel(i + visible.length) + "</span>";
			}).join("");
			if (!maskOn) {
				maskStatus.innerHTML = '<span class="llm-ms-lead"><b>' + wordLabel(selected) +
					"</b> " + (LLM_DE ? "kann den ganzen Satz sehen" : "can see the whole sentence") + "</span>" +
					'<span class="llm-ms-chips">' + WORDS.map(function (word, i) {
						return '<span class="llm-ms-chip is-seen">' + wordLabel(i) + "</span>";
					}).join("") + "</span>";
				return;
			}
			maskStatus.innerHTML = '<span class="llm-ms-lead"><b>' + wordLabel(selected) +
				"</b> " + (LLM_DE ? "kann sehen" : "can see") + "</span>" +
				'<span class="llm-ms-chips">' + seen +
				(blocked.length ? '<span class="llm-ms-arrow">' + (LLM_DE ? "aber nicht" : "but not") + "</span>" + hidden : "") +
				"</span>" +
				'<span class="llm-ms-count">' + visible.length + (LLM_DE ? " von " : " of ") + WORDS.length +
				(LLM_DE ? " Wörtern sichtbar" : " words visible") + "</span>";
		}

		function renderMatrix() {
			if (!matrix) return;
			var maskOn = !!(causal && causal.checked);
			var palette = (window.TM && TM.colors) ? TM.colors() : {};
			var low = hexToRgb(palette.card || "#ffffff");
			var mid = hexToRgb(palette.sky || "#5c9baf");
			var high = hexToRgb(palette.green || "#63a44b");
			var rows = [];
			var min = Infinity;
			var max = -Infinity;
			for (var i = 0; i < WORDS.length; i++) {
				var row = rowWeights(i, maskOn);
				rows.push(row);
				for (var j = 0; j < WORDS.length; j++) {
					if (maskOn && j > i) continue;
					if (row[j] < min) min = row[j];
					if (row[j] > max) max = row[j];
				}
			}
			var span = max - min;
			var html = '<div class="llm-matrix-row llm-matrix-row--head"><span></span>' +
				WORDS.map(function (word, i) { return "<span>" + wordLabel(i) + "</span>"; }).join("") +
				"<span>Σ</span></div>";
			for (i = 0; i < WORDS.length; i++) {
				html += '<div class="llm-matrix-row' + (i === selected ? " is-selected" : "") + '">';
				html += '<span class="llm-matrix-label">' + wordLabel(i) + "</span>";
				for (j = 0; j < WORDS.length; j++) {
					var future = maskOn && j > i;
					var v = rows[i][j];
					var pct = future ? 0 : (span > 0 ? Math.round((v - min) / span * 100) : 100);
					var t = pct / 100;
					var rgb = t < 0.5 ? mixRgb(low, mid, t * 2) : mixRgb(mid, high, (t - 0.5) * 2);
					var textColor = future ? "var(--tm-faint)" :
						(relativeLum(rgb) > 0.2 ? "#071a22" : "#ffffff");
					html += '<span class="llm-matrix-cell' + (future ? " is-future" : "") +
						'" style="background:' + rgbCss(rgb) + ";color:" + textColor + '"' +
						' title="' + wordLabel(i) + " → " + wordLabel(j) + ": " + v.toFixed(3) + '">' +
						(future ? "·" : v.toFixed(2)) + "</span>";
				}
				html += '<span class="llm-matrix-sum">1.00</span></div>';
			}
			matrix.innerHTML = html;
			if (matrixSelected) matrixSelected.textContent = wordLabel(selected);
		}

		function renderAttention() {
			var w = activeWeights();
			var maskOn = !!(causal && causal.checked);
			attnTokens.forEach(function (b, i) {
				b.classList.toggle("is-on", i === selected);
				b.classList.toggle("is-future", maskOn && i > selected);
			});
			barEls.forEach(function (bar, i) {
				bar.fill.style.width = (w[i] * 100).toFixed(1) + "%";
				bar.num.textContent = w[i].toFixed(2);
				bar.row.classList.toggle("is-future", maskOn && i > selected);
			});
			renderMaskStatus(maskOn);
			renderMatrix();
			drawArcs(w);
		}

		function drawArcs(w) {
			if (!arcs || !attnSentence || !attnSentence.offsetParent) return;
			var box = attnSentence.getBoundingClientRect();
			arcs.setAttribute("viewBox", "0 0 " + box.width + " " + box.height);
			arcs.querySelectorAll("path").forEach(function (p) { p.remove(); });
			if (!attnTokens[selected]) return;
			var source = attnTokens[selected].getBoundingClientRect();
			var x1 = source.left - box.left + source.width / 2;
			var y1 = source.top - box.top;
			w = w || activeWeights();
			for (var i = 0; i < attnTokens.length; i++) {
				if (i === selected || w[i] <= 0.005) continue;
				var target = attnTokens[i].getBoundingClientRect();
				var x2 = target.left - box.left + target.width / 2;
				var y2 = target.top - box.top;
				var cx = (x1 + x2) / 2;
				var cy = Math.min(y1, y2) - 16 - Math.abs(x2 - x1) * 0.06;
				var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
				path.setAttribute("d", "M" + x1 + " " + y1 + " Q" + cx + " " + cy + " " + x2 + " " + y2);
				path.setAttribute("stroke-width", (1 + w[i] * 7).toFixed(2));
				path.setAttribute("opacity", (0.18 + w[i] * 0.72).toFixed(2));
				arcs.appendChild(path);
			}
		}

		if (causal) causal.addEventListener("change", renderAttention);
		renderAttention();
		var attnEq = document.getElementById("llm-attn-eq");
		var attnMathNote = document.getElementById("llm-attn-math-note");
		if (attnEq) {
			attnEq.setAttribute("data-tex", LLM_DE
				? "\\operatorname{out}_i = \\underbrace{\\sum_j \\underbrace{\\alpha_{ij}}_{\\text{Gewicht}}\\,\\underbrace{v_j}_{\\text{Value}}}_{\\text{neuer Vektor für Token } i}"
				: "\\operatorname{out}_i = \\underbrace{\\sum_j \\underbrace{\\alpha_{ij}}_{\\text{weight}}\\,\\underbrace{v_j}_{\\text{value}}}_{\\text{new vector for token } i}");
			if (TM.typesetMath) TM.typesetMath(attnEq);
		}
		if (attnMathNote) {
			attnMathNote.textContent = LLM_DE
				? "Die Zeile der Attention-Gewichte ist nicht die Ausgabe. Mit ihr werden die Value-Vektoren gemischt: Wenn „saß“ 0,42 auf „Katze“ und 0,20 auf sich selbst legt, ist sein neuer Vektor 0,42·v_Katze + 0,20·v_saß + … . Das Ergebnis ist ein neuer Vektor für diese Position."
				: "The row of attention weights is not the output. It is used to mix the value vectors: if “sat” puts 0.42 on “cat” and 0.20 on itself, its new vector is 0.42·v_cat + 0.20·v_sat + … . The result is a new vector for that position.";
		}
		var attnTimer = null;
		window.addEventListener("resize", function () {
			clearTimeout(attnTimer);
			attnTimer = setTimeout(drawArcs, 120);
		});
		if (document.fonts && document.fonts.ready) {
			document.fonts.ready.then(function () { drawArcs(); });
		}

		/* ── pretraining ──────────────────────────────────────── */
		var PRE = LLM_DE ? ["die", "Katze", "saß", "auf", "der", "Matte"] : ["the", "cat", "sat", "on", "the", "mat"];
		var PRED = LLM_DE ? {
			bert: {
				0: [["die", 0.36], ["eine", 0.28], ["diese", 0.15]],
				1: [["Katze", 0.41], ["Hund", 0.22], ["Junge", 0.13]],
				2: [["saß", 0.38], ["lag", 0.24], ["lief", 0.17]],
				3: [["auf", 0.52], ["unter", 0.19], ["neben", 0.12]],
				4: [["der", 0.33], ["einer", 0.27], ["dieser", 0.16]],
				5: [["Matte", 0.44], ["Boden", 0.23], ["Bett", 0.14]]
			},
			gpt: {
				1: [["Katze", 0.58], ["Hund", 0.16], ["Vogel", 0.09]],
				2: [["saß", 0.47], ["schlief", 0.21], ["lief", 0.14]],
				3: [["auf", 0.55], ["unter", 0.16], ["neben", 0.11]],
				4: [["der", 0.61], ["einer", 0.17], ["ihrer", 0.09]],
				5: [["Matte", 0.49], ["Boden", 0.22], ["Bett", 0.13]]
			}
		} : {
			bert: {
				0: [["the", 0.36], ["a", 0.28], ["this", 0.15]],
				1: [["cat", 0.41], ["dog", 0.22], ["boy", 0.13]],
				2: [["sat", 0.38], ["lay", 0.24], ["ran", 0.17]],
				3: [["on", 0.52], ["under", 0.19], ["near", 0.12]],
				4: [["the", 0.33], ["a", 0.27], ["that", 0.16]],
				5: [["mat", 0.44], ["floor", 0.23], ["bed", 0.14]]
			},
			gpt: {
				1: [["cat", 0.58], ["dog", 0.16], ["bird", 0.09]],
				2: [["sat", 0.47], ["slept", 0.21], ["ran", 0.14]],
				3: [["on", 0.55], ["under", 0.16], ["near", 0.11]],
				4: [["the", 0.61], ["a", 0.17], ["its", 0.09]],
				5: [["mat", 0.49], ["floor", 0.22], ["bed", 0.13]]
			}
		};
		var preSentence = document.getElementById("llm-pretrain-sentence");
		var predict = document.getElementById("llm-predict");
		var objective = "bert";
		var maskIndex = 2;

		function renderPretrain() {
			if (!preSentence || !predict) return;
			preSentence.innerHTML = "";
			PRE.forEach(function (word, i) {
				var b = document.createElement("button");
				b.type = "button";
				b.className = "llm-token";
				var masked = i === maskIndex;
				var hidden = objective === "gpt" && i > maskIndex;
				if (masked) {
					b.classList.add("is-mask");
					b.textContent = objective === "bert" ? "[MASK]" : "?";
				} else {
					b.textContent = word;
				}
				if (hidden) b.classList.add("is-hidden");
				b.title = LLM_DE
					? "Klicke, um die " + (objective === "bert" ? "Maske" : "Vorhersage") + " hierhin zu verschieben"
					: "Click to move the " + (objective === "bert" ? "mask" : "prediction") + " here";
				b.addEventListener("click", function () {
					maskIndex = (objective === "gpt" && i === 0) ? 1 : i;
					renderPretrain();
				});
				preSentence.appendChild(b);
			});
			var list = (PRED[objective] && PRED[objective][maskIndex]) || PRED[objective][2];
			predict.innerHTML = "";
			list.forEach(function (p, idx) {
				var row = document.createElement("div");
				row.className = "llm-predict-row" + (idx === 0 ? " is-top" : "");
				var word = document.createElement("span");
				word.textContent = p[0];
				var track = document.createElement("span");
				track.className = "llm-predict-track";
				var fill = document.createElement("span");
				fill.className = "llm-predict-fill";
				fill.style.width = (p[1] * 100).toFixed(0) + "%";
				track.appendChild(fill);
				var num = document.createElement("b");
				num.textContent = p[1].toFixed(2);
				row.appendChild(word);
				row.appendChild(track);
				row.appendChild(num);
				predict.appendChild(row);
			});
		}

		root.querySelectorAll("[data-llm-objective]").forEach(function (btn) {
			btn.addEventListener("click", function () {
				objective = btn.getAttribute("data-llm-objective");
				root.querySelectorAll("[data-llm-objective]").forEach(function (x) {
					var on = x === btn;
					x.classList.toggle("is-on", on);
					x.setAttribute("aria-pressed", on ? "true" : "false");
				});
				if (objective === "gpt" && maskIndex === 0) maskIndex = 1;
				renderPretrain();
			});
		});
		var nextBtn = root.querySelector("[data-llm-next]");
		if (nextBtn) {
			nextBtn.addEventListener("click", function () {
				maskIndex = maskIndex >= PRE.length - 1 ? 1 : maskIndex + 1;
				renderPretrain();
			});
		}
		renderPretrain();

	})();
	</script>
</body>
</html>
