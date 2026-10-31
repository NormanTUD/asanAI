<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: People of AI
description: The recurring cast behind the machine — from McCulloch and Pitts to the builders of the modern LLM stack, with their primary works.
icon: &#128101;
part: 6
order: 19
color: sky
topics: history, society, philosophy, frontier
tags: interested-layman
math: 0
-->


<div class="md" data-lesson-id="people_of_ai">
Artificial intelligence has a surprisingly small cast of recurring characters. The same names appear in the history chapters, the mathematics lessons, the interpretability labs, and the frontier surveys — sometimes as the person who proved the key theorem, sometimes as the person whose failed attempt defined the next decade's problem. This chapter is a **who's who**: what each person contributed, why it still matters, and one or two primary sources you can read for yourself. Every entry answers the same question in miniature — *what did this person do to AI research?* — and then points to the work where the answer is worked out.

It is deliberately not a ranking. Credit in AI is contested, collaborative, and often late. The person whose name is on the paper is not always the person who had the idea first, and the person who had the idea first is not always the person who made it work. Where the record is disputed, the lesson says so.
</div>

<div class="md">
## Before the Machine

The intellectual scaffolding predates electronic computers by a century. These are the people who made “a machine that learns” thinkable before it was buildable.

### Ada Lovelace and Charles Babbage

\marginfig{ada_lovelace_portrait.jpg}{Ada Lovelace, painted by Alfred Edward Chalon. \cite{img_ada_lovelace}. Public domain.}

Babbage was a mathematician and inventor who hated the errors in printed mathematical tables; that frustration drove his Difference Engine and then the Analytical Engine, a programmable machine with a store, a mill, and punched-card input. He never saw it completed, and spent much of his fortune and the government's patience on the design. \marginfig{charles_babbage_portrait.jpg}{Charles Babbage, 1860. \cite{img_charles_babbage}. Public domain.} Lovelace, the daughter of Lord Byron, was taught mathematics by Augustus De Morgan and translated Menabrea's account of the engine; her notes are longer than the original. Note G is a step-by-step algorithm for Bernoulli numbers, traditionally described as the first published computer program. She called her approach “poetical science” and insisted that the machine could manipulate symbols — even compose music — not merely crunch numbers. She died at 36, and the Analytical Engine was never built (\cite[Menabrea & Lovelace, 1843]{menabrea_lovelace1843}; \cite[McCorduck, 1979]{mccorduck1979machines}).

### Alan Turing

\marginfig{alan_turing_1951.jpg}{Alan Turing, 1951. \cite{img_alan_turing}. Public domain.}

Turing was a Cambridge mathematician who, at 24, imagined a machine with an infinite tape and a finite table of states, and used it to prove that some well-defined problems have no mechanical solution. During the Second World War he worked at Bletchley Park on breaking the Enigma cipher, an episode that stayed secret for decades. In 1950 he replaced “Can machines think?” with an operational question: can a machine's text responses be distinguished from a human's? The imitation game did not settle the philosophy, but it turned a metaphysical dispute into an experiment. He was prosecuted in 1952 for homosexuality, then a crime in Britain, and died in 1954 at 41. His question — whether thought can be mechanized — is still the field's north star (\cite[Turing, 1936]{turing1936}; \cite[Turing, 1950]{turing1950computing}; \cite[Hodges, 1983]{hodges1983enigma}).

### Claude Shannon

\marginfig{claude_shannon_portrait.jpg}{Claude Shannon. \cite{img_claude_shannon}. [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).}

Shannon was a Michigan-born mathematician and engineer whose master's thesis applied Boolean algebra to electrical relays — the idea that made digital circuit design a branch of logic. At Bell Labs he asked what the fundamental limits of communication are, and answered with entropy and channel capacity. He was also a playful inventor: his maze-solving mouse Theseus, his juggling, and his unicycle rides through the Bell Labs corridors were famous. His 1951 paper framed language as a prediction problem — guess the next character, and the difficulty of the guess measures the redundancy of the text. Every language model's training loss is a version of that measurement (\cite[Shannon, 1948]{shannon1948communication}; \cite[Shannon, 1951]{shannon1951communication}; \cite[McCorduck, 1979]{mccorduck1979machines}).

### John von Neumann and Norbert Wiener

\marginfig{john_von_neumann_portrait.jpg}{John von Neumann. \cite{img_john_von_neumann}. [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).}

Von Neumann was a Hungarian-born prodigy who worked on game theory, quantum mechanics, and the Manhattan Project before turning to computers. His EDVAC report described the stored-program computer, in which instructions and data share the same memory — the architecture every digital computer still uses — and it cited McCulloch and Pitts' threshold neuron, making the paper a bridge between neural modelling and computer design. Wiener, a child prodigy taught intensively by his father, founded cybernetics: the science of feedback and control. His insistence that organisms and machines could be analysed in the same loop shaped the vocabulary of adaptation that Rosenblatt, Ashby, and the early connectionists inherited (\cite[von Neumann, 1945]{vonneumann}; \cite[Wiener, 1948]{wiener1948cybernetics}; \cite[McCorduck, 1979]{mccorduck1979machines}).

</div>
<div class="md">
## The First Neurons

### Warren McCulloch and Walter Pitts

\marginfig{walter_pitts_1954.jpg}{Walter Pitts in 1954. \cite{img_walter_pitts}. Public domain.}

In 1943 McCulloch, a neurophysiologist, and Pitts, a self-taught logician, published **“A Logical Calculus of the Ideas Immanent in Nervous Activity.”** They modelled the neuron as an all-or-none threshold unit and showed that networks of such units can express any function of propositional logic; with recurrent loops, the model anticipated the computational generality later formalized in automata theory. The paper is the founding document of neural-network theory. It gave Rosenblatt the unit he would teach, gave Hopfield the binary element his energy model would settle, and gave the field the step nonlinearity that later became the obstacle backpropagation had to overcome (\cite[McCulloch & Pitts, 1943]{mccullochpitts1943}). Their 1947 follow-up, **“How We Know Universals,”** extended the model to the perception of auditory and visual form and anticipated the idea that nervous systems compute invariant representations (\cite[Pitts & McCulloch, 1947]{pitts1947universals}). McCulloch collected the programme in \citetitle{mcculloch1965embodiments} (\citeyear{mcculloch1965embodiments}).

McCulloch was the group's impresario as much as its theorist. He came to the work from philosophy, medicine and neurophysiology, moved through a series of disciplinary identities — student, poet, experimental neurologist, psychiatry resident, neurophysiologist, neuropsychiatrist, administrator, cybernetician, engineer, mentor — and treated the mind–body problem as a physiological question he called “experimental epistemology”. His homes in Hinsdale, Old Lyme and Cambridge ran an open-door policy; students and collaborators lived there, and his mentoring was deliberately egalitarian rather than authoritarian. The roster that passed through his circle reads like a roll-call of postwar brain science: Lettvin, Maturana, Pitts, Manuel Blum, Jack Cowan, Leo Verbeek, Bill Kilmer and Roberto Moreno-Diaz (\cite[Abraham, 2016, pp. 75–100, 153–157, 186]{abraham2016rebelgenius}).

He also wrote poetry — sonnets, mostly — and published a collection, *The Natural Fit*, in 1959; poetry was one of the identities through which he presented himself, not a hobby kept apart from the science. At the end of his life he left an epitaph warning biographers not to sum him up, because he had always been “on an unknown way / To mine own ends”. He died on 24 September 1969, at 70, and donated his body to Yale; Ralph Gerard's obituary called him a “rebel genius”, the phrase that became the title of Abraham's biography (\cite[Abraham, 2016, pp. 156, 186–189]{abraham2016rebelgenius}).

<figure style="max-width:100%; margin:1em 0;">
	<img src="mcculloch_pitts_neuron.png" alt="Diagram of a McCulloch–Pitts neuron" style="width:100%; border-radius:8px; border:1px solid var(--mn-border, #e2e8f0); display:block;">
	<figcaption class="md" style="font-size:0.76rem; line-height:1.4; color:var(--mn-text-secondary, #64748b); margin-top:6px;">A McCulloch–Pitts cell: inputs are summed, compared with a threshold, and passed through an all-or-none step. \cite{img_mcculloch_pitts_neuron}. [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).</figcaption>
</figure>

Pitts never took a degree. He joined the University of Chicago as a teenager, worked with Norbert Wiener at MIT, and coauthored **“What the Frog's Eye Tells the Frog's Brain”** (1959), which showed that the retina already extracts behaviourally specific features before any central processing — a founding text of computational neuroscience. The experiments themselves were Lettvin's and Maturana's; McCulloch and Pitts joined the byline largely out of respect (\cite[Abraham, 2016, pp. 163–164]{abraham2016rebelgenius}). His later withdrawal from scientific life, after a rupture in the Wiener circle, is one of the field's quiet tragedies (\cite[Lettvin et al., 1959]{lettvin1959frog}).

<div class="optional md" data-headline="Thirteen lives in one">
McCulloch's career reads as a sequence of identities rather than a single profession:

- **Student** — Haverford, Yale and Columbia; mathematics, philosophy, psychology and medicine.
- **Poet** — sonnets collected in *The Natural Fit* (1959).
- **Experimental neurologist** — cats, absinthe, convulsions, head injuries and cortical localisation.
- **Psychiatry assistant** — Rockland State Hospital, 1932–34, where he met Eilhard von Domarus.
- **Neurophysiologist** — Dusser de Barenne's strychnine laboratory at Yale, more than twenty papers.
- **Experimental epistemologist** — Clark Hull's seminars and a physiological theory of knowledge.
- **Theorist** — with Walter Pitts, from their meeting in 1941.
- **Mentor** — more than 120 younger collaborators and an open door.
- **Neuropsychiatrist** — the reticular formation, the chemistry of psychoses, electroconvulsive therapy.
- **Cybernetician** — chair of the Macy conferences.
- **Experimentalist** — strychnine on cortex, absinthe in cats, patients' blood in rabbits.
- **Farmer** — Old Lyme: dams, barns and a dairy herd.
- **Provocateur** — an intellectual showman who treated disciplinary boundaries as arbitrary fences.

Abraham's argument is not that these were masks over a hidden “real” McCulloch, but that the transdisciplinary life was itself the achievement (\cite[Abraham, 2016]{abraham2016rebelgenius}).
</div>

<div class="optional md" data-headline="The open door: mentoring as a scientific method">
The open-door policy was literal. In Hinsdale, Old Lyme and Cambridge, students and collaborators lived in the house; Robert Morison observed in 1947 that the household also contained the children of Stanley Gerr and Norbert Wiener's thirteen-year-old daughter, and concluded that McCulloch chose collaborators largely by how much help they needed. His own children called their parents “Warren” and “Rook”; Jerome Lettvin remembered being listened to “as attentively as a colleague”. Manuel Blum, who would win the Turing Award in 1995, said that McCulloch treated him as an equal when he was not one — “He really listened to what I had to say. And I could actually read his stuff” — and that McCulloch “lifted up quite ordinary people (like me) and made them feel special.” The roster that passed through his orbit includes Lettvin, Pitts, Minsky, Papert, Maturana, Varela, Arbib, Cowan, Blum, Kauffman, Selfridge, MacKay, Kilmer, Wall, Moreno-Díaz and Verbeek. It is the clearest evidence for McCulloch's own claim that his best work was the people he trained (\cite[Abraham, 2016]{abraham2016rebelgenius}).
</div>

<div class="optional md" data-headline="The farm at Old Lyme: dams, barns and symmetry">
Old Lyme was not a retreat from science but another site of it. The farm McCulloch and Rook bought in 1928 became **Camp Aladdin**, a summer camp for children from Brooklyn where the children made the rules; after the Crash it became a working farm. McCulloch calculated the hydraulics of the dam spillways himself, built a large barn in 1938 and a stone mill building in 1940, and kept a dairy herd during the Second World War. His son David remembered that he knew which wood had which properties for which job, and that the architectural drawings always returned to symmetry — the same interest in proportion that had produced the Columbia thesis on dynamic symmetry (\cite[Abraham, 2016]{abraham2016rebelgenius}).
</div>

<div class="optional md" data-headline="The eccentric: whisky, absinthe and a beard">
McCulloch's laboratory life and domestic life were equally unorthodox. He reportedly lived on whisky and ice cream, went to bed around four in the morning, travelled in hobnailed boots, and wore a brown leather jacket under his suit jacket. In early experiments with Elsberg and Pike he injected cats with increasing concentrations of absinthe over two hours and watched the pupils dilate, the muscles twitch, and the eyes dance with nystagmus. With Ladislas Meduna he injected blood from schizophrenic patients into rabbits; in about 60 percent of cases the blood acted as an insulin antagonist, a result that led to the diagnosis of “oneirophrenia” (from Greek *oneiros*, dream). None of this was mere eccentricity: the same willingness to move from poetry to hydraulics to neurochemistry is what made the transdisciplinary programme possible (\cite[Abraham, 2016]{abraham2016rebelgenius}).
</div>

\marginfig{warrenmcculloch_afflictor.jpg}{The 22 September 1948 *Brooklyn Daily Eagle* report of McCulloch's Caltech talk. Scan: \citealternativetitle{afflictor2014mcculloch}. License not stated by the source.}

At the September 1948 Caltech symposium on cerebral mechanisms, McCulloch gave a United Press reporter a blunter forecast than the one in his papers. The *Brooklyn Daily Eagle* ran it under the headline “Warns Machines May Some Day Take Over the World”: machines with “complex mechanical minds” might explore the planets independently of human direction, and a sufficiently complex machine “may also become neurotic if badgered by frustration in solving problems.” The clipping is a useful corrective to the founder story. The mechanist was not promising a tidy calculator; he was already imagining autonomous, frustrated, potentially dangerous minds — and saying so in the popular press \cite{afflictor2014mcculloch}.

<div class="optional md" data-headline="Watch: McCulloch on film, and the tragedy of Walter Pitts">
Several uploads preserve the same 1969 Channel 6 Toronto interview with McCulloch; the full programme is embedded first, followed by the long excerpt and the shorter clips. The last video is a short documentary on Walter Pitts.

[youtube]8Wdz1Tj5084[/youtube]

[youtube]ZGxfQN_3BT0[/youtube]

The sad story of the father of AI — Walter Pitts:

[youtube]sCjU0ZoLoGM[/youtube]
</div>

<div class="optional md" data-headline="Further reading: McCulloch, Pitts, and the first mechanistic theory of the mind">
Two online sources pair well with the primary literature above: the 1948 *Brooklyn Daily Eagle* clipping is reproduced with a link to the original page image \cite{afflictor2014mcculloch}, and Amanda Gefter's *Nautilus* portrait of McCulloch and Pitts is excerpted here \cite{afflictor2015mechanistic, gefter2015pitts}. Afflictor's McCulloch tag archive collects both pieces in one place \cite{afflictor_mcculloch_tag}.
</div>

### Frank Rosenblatt

\marginfig{frank_rosenblatt_commons.jpg}{Frank Rosenblatt. \cite{img_frank_rosenblatt}. [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).}

Rosenblatt was born in New Rochelle in 1928, graduated from the Bronx High School of Science, and earned a PhD in psychology at Cornell. He built the perceptron as a brain model, not a pattern-recognition gadget: when the output was wrong, the active connections moved in the direction of the correct answer, and he proved that for any linearly separable classification the rule makes only finitely many mistakes. The 1958 Navy press conference turned the machine into a sensation, with the New York Times predicting it might “walk, talk, see, write, reproduce itself and be conscious of its existence.” He built the Mark I Perceptron to run the rule in analogue hardware, and his 1962 book framed the programme as a science of brain mechanisms. He died in 1971, on his 43rd birthday, while sailing his sloop Shearwater on Chesapeake Bay (\cite[Rosenblatt, 1958]{rosenblatt1958perceptron}; \citetitle{rosenblatt1962neurodynamics}; \cite[Lefkowitz, 2019]{lefkowitz2019perceptron}; \cite[Dobson & Mosteirin, 2025]{dobson2025perceptron}).

### Arthur Samuel

<figure style="max-width:100%; margin:1em 0;">
	<img src="ibm_704.jpg" alt="IBM 704 electronic data processing machine" style="width:100%; border-radius:8px; border:1px solid var(--mn-border, #e2e8f0); display:block;">
	<figcaption class="md" style="font-size:0.76rem; line-height:1.4; color:var(--mn-text-secondary, #64748b); margin-top:6px;">An IBM 704 at NASA Langley, 1957 — the machine on which Samuel's later checkers program ran. \cite{img_ibm_704}. Public domain (NASA).</figcaption>
</figure>

Samuel's checkers player, written at IBM between 1952 and 1967, was the first machine-learning system to attract wide public attention. It learned in two ways: **rote learning** stored analysed positions and their backed-up scores, and **generalization learning** adjusted the coefficients of its evaluation function so that a position's static score tracked the value found by deeper search. His 1959 paper gave the field its name — **machine learning** — and his self-play arrangement is the direct ancestor of temporal-difference learning, TD-Gammon, and AlphaGo (\cite[Samuel, 1959]{samuel1959checkers}). An eleven-page follow-up in 1967 reported the later, stronger version and documented how the program's evaluation function had improved through play (\cite[Samuel, 1967]{samuel1967checkers}).

### Marvin Minsky and Seymour Papert

\marginfig{marvin_minsky_portrait.jpg}{Marvin Minsky. \cite{img_marvin_minsky}. [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/).}

Minsky grew up in New York, built the SNARC from vacuum tubes and salvaged B-24 gyropilots, co-founded MIT's AI Laboratory, and wrote \citetitle{minsky1986society}. \marginfig{seymour_papert_portrait.jpg}{Seymour Papert. \cite{img_seymour_papert}. [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).} Papert grew up in Pretoria, opposed apartheid as a student, worked with Piaget in Geneva, and came to MIT to build LOGO and the idea of constructionism — children learning mathematics by programming turtles. Their 1969 \citetitle{minskyperceptrons} proved that a single-layer perceptron cannot compute predicates such as parity and connectedness, and expressed pessimism that multi-layer extensions could be trained. The book is often remembered as the cause of the first AI winter, but the record is messier: Papert later rejected the single-book reading, and later scholarship emphasized institutional competition and the genuine limitations of the machines (\cite[Papert, 1988]{papert1988oneai}; \cite[McCorduck, 1979]{mccorduck1979machines}).

### Bernard Widrow

\marginfig{widrow_adaline.jpg}{Bernard Widrow with the ADALINE. \cite{img_widrow_adaline}. Public domain.}

Widrow's **ADALINE** was a single adaptive linear element with weights implemented as switchable resistor circuits; with his student Ted Hoff he built a **memistor** whose resistance could be electroplated and stripped. Their **least-mean-squares** training rule — the Widrow–Hoff rule — is the direct ancestor of the delta rule and of modern gradient descent on a squared error. The hardware was the argument that adaptive control was real, not a simulation (\cite[Widrow & Hoff, 1960]{widrow1960adaline}).
</div>

<div class="md">
## The Knowledge Engineers

The connectionist line was not the only one to leave the laboratory. In the 1970s a second group decided that the bottleneck was not the learning rule but **knowledge** itself, and built systems that encoded a specialist's rules explicitly.

**Edward Feigenbaum** and **Bruce Buchanan** at Stanford turned that conviction into DENDRAL, which inferred molecular structures from mass spectra, and then MYCIN, which diagnosed blood infections from a few hundred IF–THEN rules. MYCIN separated its rule base from its inference engine, so the engine could be reused as the first expert-system shell, EMYCIN, and in a blind clinical test it prescribed antibiotics as well as, or better than, nine human clinicians \cite{crevier1993ai}. Feigenbaum called the activity **knowledge engineering**, and it became the commercial face of AI in the 1980s (\cite[Feigenbaum, 1984]{feigenbaum1984expert}; \cite[Shortliffe & Buchanan, 1976]{shortliffe1976mycin}).

**John McDermott**'s XCON (originally R1) took the recipe to the Digital Equipment Corporation, where it configured VAX machines and grew from about three hundred rules in 1979 to more than three thousand by 1984 \cite{crevier1993ai}. **Douglas Lenat** pushed the same bet further: his AM and Eurisko programs tried to discover mathematical concepts and new heuristics, and when that programme stalled he began **Cyc**, a hand-built common-sense ontology measured in person-centuries of knowledge engineering (\cite[Cyc]{cyc_wiki}; \cite{crevier1993ai}). The lesson of this generation is the one the neural revival would later overturn: intelligence was supposed to live in the rules, and the rules had to be written by hand.
</div>

<div class="md">
## The Connectionist Revival

### John Hopfield

\marginfig{john_hopfield_portrait.jpg}{John Hopfield. \cite{img_john_hopfield}. [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).}

Hopfield trained as a physicist, worked at Bell Labs and Princeton, and came to neural networks from the physics of collective behaviour. His 1982 paper treated the network as an energy landscape: stored patterns are minima, and recall is relaxation downhill. The model made associative memory rigorous, connected neural networks to statistical physics, and helped restart a field that had been in retreat since the perceptron critique. He shared the 2024 Nobel Prize in Physics with Geoffrey Hinton for these foundations (\cite[Hopfield, 1982]{hopfield1982}; \cite[Nobel Prize, 2024]{nobel2024physics}).

### David Rumelhart, Geoffrey Hinton, and Ronald Williams

\marginfig{david_rumelhart_portrait.jpg}{David Rumelhart at IJCNN Seattle, 1991. \cite{img_david_rumelhart}. [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).}

Rumelhart was a psychologist who led the PDP group at UC San Diego; Hinton was a British-Canadian psychologist who had been arguing for connectionism since the 1970s; Williams was the mathematician who helped make the gradient computation precise. Their 1986 Nature paper showed that the chain rule could be applied backward through a multi-layer network to compute every parameter's gradient in one pass, and demonstrated the idea on tasks that had defeated earlier single-layer systems. The algorithm had been derived earlier — by Werbos in 1974, and independently by others — but the 1986 paper gave it a clean statement, a public demonstration, and a generation of readers. The same PDP volumes collected the wider programme, including Rumelhart and McClelland's past-tense model, which became the standard test case in the rules-versus-associations debate (\cite[Rumelhart & McClelland, 1986]{rumelhart1986pasttense}). Hinton later co-invented the Boltzmann machine, led the deep-belief-network revival, coauthored AlexNet, left Google in 2023 to warn about risk, and shared the 2024 Nobel Prize in Physics (\cite[Rumelhart et al., 1986]{rumelhart1986}; \cite[Ackley et al., 1985]{ackley1985boltzmann}; \cite[Hinton et al., 2006]{hinton2006}; \cite[Nobel Prize, 2024]{nobel2024physics}).

\marginfig{geoffrey_hinton_portrait.jpg}{Geoffrey Hinton. \cite{img_geoffrey_hinton}. [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).} Hinton went on to co-invent the Boltzmann machine, lead the deep-belief-network revival of 2006, and coauthor AlexNet in 2012. He shared the 2024 Nobel Prize in Physics with Hopfield, and later became one of the most prominent voices warning about the risks of the technology he helped create (\cite[Hinton et al., 2006]{hinton2006}; \cite[Krizhevsky et al., 2012]{krizhevsky2012imagenet}; \cite[Nobel Prize, 2024]{nobel2024physics}).

### Paul Werbos

\marginfig{paul_werbos_portrait.jpg}{Paul Werbos at IJCNN Seattle, 1991. \cite{img_paul_werbos}. [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).}

Werbos published the first derivation of backpropagation for neural networks in his 1974 Harvard dissertation, **Beyond Regression**, more than a decade before the 1986 paper made it famous. He also developed **backpropagation through time** for recurrent networks and the **adaptive critic** family of designs — a learned value model guiding a learned policy — which he later called approximate dynamic programming. His experience is the field's standard cautionary tale about how long a good idea can sit unread (\cite[Werbos, 1974]{werbos1974}; \cite[Werbos, 1990]{werbos1990bptt}).

### Yann LeCun

\marginfig{yann_lecun_portrait.jpg}{Yann LeCun. \cite{img_yann_lecun}. [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/).}

LeCun grew up in France, studied in Paris, and joined Bell Labs, where he combined convolutional weight-sharing with backpropagation to recognize handwritten ZIP codes for the U.S. Postal Service in 1989; the later LeNet-5 was deployed in bank check-reading systems. He later founded NYU's CILVR lab and Meta's FAIR, and has spent the last decade arguing that self-supervised world models, not next-token prediction alone, are the path to general intelligence. He shared the 2018 Turing Award with Hinton and Bengio (\cite[LeCun et al., 1989]{lecun1989backpropagation}; \cite[LeCun, 2022]{lecun2022path}).

### Yoshua Bengio

\marginfig{yoshua_bengio_portrait.jpg}{Yoshua Bengio. \cite{img_yoshua_bengio}. [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).}

Bengio grew up in France and Canada, trained as a computer scientist, and built Mila in Montreal into one of the world's leading academic deep-learning labs. His 2003 neural probabilistic language model replaced sparse n-gram tables with dense, learned word embeddings — the direct ancestor of the input layer of every modern language model. He shared the 2018 Turing Award with Hinton and LeCun, and has become one of the most prominent scientific voices on AI safety, arguing that the field needs international coordination and a precautionary approach (\cite[Bengio et al., 2003]{neuralprobabilistic}; \cite[Bengio et al., 2023]{bengio2023managing}).

### Sepp Hochreiter and Jürgen Schmidhuber

\marginfig{sepp_hochreiter_portrait.jpg}{Sepp Hochreiter at his institute, 2015. \cite{img_sepp_hochreiter}. [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).}

Their 1997 **Long Short-Term Memory** introduced the cell state and the gating mechanism that let recurrent networks carry information across many steps without the vanishing gradient destroying it. LSTM dominated sequence modelling for two decades — speech, translation, handwriting, time series — and its gated-residual idea is still visible in modern architectures. \marginfig{juergen_schmidhuber_portrait.jpg}{Jürgen Schmidhuber at the AI for Good summit, 2017. \cite{img_juergen_schmidhuber}. [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).} The Transformer replaced the recurrence, not the lesson: a network needs a protected path for information to survive depth and time (\cite[Hochreiter & Schmidhuber, 1997]{lstm}).
</div>

<div class="md">
## Deep Learning

### Alex Krizhevsky, Ilya Sutskever, and Geoffrey Hinton

<figure style="max-width:100%; margin:1em 0;">
	<img src="alexnet_architecture.png" alt="Diagram of the AlexNet architecture" style="width:100%; border-radius:8px; border:1px solid var(--mn-border, #e2e8f0); display:block;">
	<figcaption class="md" style="font-size:0.76rem; line-height:1.4; color:var(--mn-text-secondary, #64748b); margin-top:6px;">AlexNet, split across two GPUs: five convolutional layers, three fully connected layers, and a 1000-way softmax. \cite{img_alexnet_architecture}. [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).</figcaption>
</figure>

**AlexNet** won the 2012 ImageNet challenge by a margin of more than ten percentage points. It was a deep convolutional network trained on two consumer GPUs, with ReLU activations and dropout — not a new idea in any single component, but the first demonstration that scale, data, and GPU compute could leave hand-engineered vision features behind. The result launched the deep-learning era and made “GPU + big data + a big network” the default recipe (\cite[Krizhevsky et al., 2012]{krizhevsky2012imagenet}). Krizhevsky also built **CIFAR-10** and **CIFAR-100**, the small-image datasets that became standard benchmarks for testing a new architecture cheaply (\cite[Krizhevsky, 2009]{krizhevsky2009cifar}).

\marginfig{ilya_sutskever_altman_2023.jpg}{Ilya Sutskever with Sam Altman in Tel Aviv, 2023. \cite{img_ilya_sutskever_altman}. [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).}

Sutskever went on to co-invent sequence-to-sequence learning, co-found OpenAI, and serve as its chief scientist through the GPT era. His recurring thesis is that prediction at sufficient scale forces a model to internalize the structure of the data (\cite[Sutskever et al., 2014]{sutskever2014seq2seq}). His 2013 thesis on training recurrent networks remains one of the clearest early statements of that programme (\cite[Sutskever, 2013]{sutskever2013thesis}).

### Fei-Fei Li

\marginfig{fei_fei_li_portrait.jpg}{Fei-Fei Li at AI for Good, 2017. \cite{img_fei_fei_li}. [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).}

Li's **ImageNet** gave vision a benchmark of realistic difficulty: 14 million images organized by WordNet, with a 1,000-class challenge that ran from 2010 to 2017. The dataset was the other half of the AlexNet story — without it, the GPU revolution would have had nothing to train on. ImageNet also established the modern pattern of a large, shared, human-labelled benchmark driving an entire subfield (\cite[Deng et al., 2009]{deng2009imagenet}).

### Ian Goodfellow

\marginfig{ian_goodfellow_portrait.jpg}{Ian Goodfellow. \cite{img_ian_goodfellow}. [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).}

Goodfellow's **generative adversarial network** (2014) paired a generator with a discriminator in a zero-sum game: the generator learns to produce samples that fool the discriminator, and the discriminator learns to tell real from fake. GANs produced the first sharp, high-resolution synthetic images and made “generative model” a mainstream idea before diffusion models displaced them for most image work (\cite[Goodfellow et al., 2014]{goodfellow2014gan}). A year later he gave **adversarial examples** their standard explanation: tiny, deliberately chosen input perturbations can move a confident classifier across its decision boundary, because the loss is locally almost linear (\cite[Goodfellow et al., 2015]{goodfellow2015adversarial}). With Yoshua Bengio and Aaron Courville he also wrote the standard graduate textbook that made the whole stack — from linear algebra to generative models — teachable in one place (\cite[Goodfellow et al., 2016]{goodfellow2016deep}).

### Andrej Karpathy

\marginfig{andrej_karpathy_portrait.png}{Andrej Karpathy. \cite{img_andrej_karpathy}. [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).}

Karpathy was born in Slovakia and moved to Canada as a child; he studied at Toronto and Stanford, co-founded OpenAI, and led AI at Tesla. His blog posts and courses — The Unreasonable Effectiveness of Recurrent Neural Networks, CS231n, “Neural Networks: Zero to Hero,” nanoGPT — made the internals of deep learning legible to a generation of practitioners. He has a gift for making the difficult feel obvious, and he argues that the best way to understand a model is to build a small one yourself (\cite[Karpathy, 2015]{karpathy2015rnn}; \cite[Karpathy, 2023]{karpathy2023zerotohero}; \cite[Karpathy, 2024]{karpathy_ai}).

### Andrew Ng

\marginfig{andrew_ng_portrait.jpg}{Andrew Ng at TechCrunch Disrupt, 2017. \cite{img_andrew_ng}. [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).}

Ng co-founded Google Brain and Coursera, and his machine-learning courses introduced millions of students to the subject. His research on large-scale distributed training — including the DistBelief system — helped establish that neural networks could be trained across many machines, a precondition for the scale era (\cite[Dean et al., 2012]{dean2012large}). The breadth of that work runs from latent Dirichlet allocation, a topic model still used across text analysis (\cite[Blei et al., 2003]{blei2003lda}), to the 2012 Google Brain “cat paper,” which showed that a large unsupervised network could learn a face detector from unlabelled YouTube frames (\cite[Le et al., 2012]{le2012cat}).
</div>

<div class="md">
## Games and Science

### David Silver and Demis Hassabis

\marginfig{david_silver_portrait.jpg}{David Silver. \cite{img_david_silver}. [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/).}

Silver studied at Cambridge and UCL, joined DeepMind in 2010, and led the AlphaGo team that combined deep policy and value networks with Monte Carlo tree search to beat Lee Sedol in 2016. He then led AlphaZero, which learned chess, shogi, and Go from the rules alone by self-play (\cite[Silver et al., 2016]{silver2016alphago}; \cite[Silver et al., 2018]{silver2018zero}). MuZero carried the idea further, learning a model of the environment's dynamics and planning inside it without being given the rules (\cite[Schrittwieser et al., 2020]{schrittwieser2020muzero}). \marginfig{demis_hassabis_portrait.jpg}{Demis Hassabis. \cite{img_demis_hassabis}. [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).} Hassabis co-founded DeepMind after a career that included neuroscience research at UCL — including work on how patients with hippocampal amnesia imagine new experiences (\cite[Hassabis et al., 2007]{hassabis2007patients}) — and built the organization that made both projects possible; he shared one half of the 2024 Nobel Prize in Chemistry with John Jumper for AlphaFold, while David Baker received the other half for computational protein design (\cite[Jumper et al., 2021]{jumper2021alphafold}; \cite[Nobel Prize, 2024]{nobel2024chemistry}; \cite[DeepMind, 2024]{deepmind_about}). Silver and Sutton's later essay argues that reward maximization is sufficient for intelligence in general, not just for games (\cite[Silver et al., 2021]{silver2021reward}).

### John Jumper

\marginfig{john_jumper_portrait.jpg}{John Jumper. \cite{img_john_jumper}. [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).}

Jumper is a computational chemist who joined DeepMind in 2017 and led the AlphaFold team. He had worked on protein folding as a student and knew the problem's reputation: a protein's function is determined by its three-dimensional shape, but the space of possible folds is astronomical. AlphaFold 2's accuracy at CASP14 in 2020 turned a decades-old grand challenge into a practical tool, and AlphaFold 3 extended the approach to biomolecular complexes (\cite[Jumper et al., 2021]{jumper2021alphafold}; \cite[Abramson et al., 2024]{alphafold3}). He shared one half of the 2024 Nobel Prize in Chemistry with Hassabis; David Baker received the other half (\cite[Nobel Prize, 2024]{nobel2024chemistry}; \cite[DeepMind, 2024]{deepmind_about}).

### Richard Sutton and Andrew Barto

\marginfig{richard_sutton_portrait.jpg}{Richard Sutton. \cite{img_richard_sutton}. [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).}

Sutton grew up in Canada, did a PhD at UMass Amherst, and worked at AT&T Bell Labs before returning to Alberta; Barto was his UMass colleague and coauthor. Together they built temporal-difference learning, the value-function view, and the textbook that trained the field. Sutton's “The Bitter Lesson” is the clearest statement of the scaling worldview — general methods that exploit computation beat methods with built-in human knowledge — and it remains the most cited argument for the approach that produced modern LLMs. In 2024 they shared the ACM Turing Award (\cite[Sutton, 1988]{sutton1988td}; \citetitle{sutton2018rlbook}; \cite[Sutton, 2019]{sutton2019bitter}; \cite[ACM, 2024]{acm2024turing}).

</div>
<div class="md">
## The LLM Era

### Ashish Vaswani and Noam Shazeer

<figure style="max-width:100%; margin:1em 0;">
	<img src="transformer_attention_heads.png" alt="Two attention heads from the Transformer paper" style="width:100%; border-radius:8px; border:1px solid var(--mn-border, #e2e8f0); display:block;">
	<figcaption class="md" style="font-size:0.76rem; line-height:1.4; color:var(--mn-text-secondary, #64748b); margin-top:6px;">Two attention heads from layer 5 of 6 in the original Transformer, tracking how the word “its” resolves to different antecedents in different contexts. \cite{img_transformer_attention_heads}. [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).</figcaption>
</figure>

The 2017 paper **“Attention Is All You Need”** replaced recurrence with self-attention, made sequence models parallelizable across positions, and became the architecture of essentially every modern language model. Vaswani was the lead author; Shazeer coauthored the paper and went on to invent multi-query attention and the gated linear-unit variants (SwiGLU) that are standard in open-weight models (\cite[Vaswani et al., 2017]{vaswani2017attention}; \cite[Shazeer, 2019]{shazeer2019mqa}; \cite[Shazeer, 2020]{shazeer2020glu}).

### Tom Brown and Long Ouyang

Brown led the GPT-3 paper, which showed that a 175-billion-parameter decoder trained on next-token prediction could perform new tasks from a handful of examples in the prompt — **in-context learning** at scale. Ouyang led InstructGPT, which added supervised fine-tuning and RLHF and showed that a 1.3B aligned model could be preferred by human raters over the 175B base model. Together they mark the transition from “language model” to “assistant” (\cite[Brown et al., 2020]{brown2020gpt3}; \cite[Ouyang et al., 2022]{ouyang2022instructgpt}).

### Paul Christiano, Yuntao Bai, and Rafael Rafailov

\marginfig{paul_christiano_portrait.jpg}{Paul Christiano. \cite{img_paul_christiano}. [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).}

Christiano's 2017 work introduced preference-based reinforcement learning, the core of RLHF: humans compare behaviours, a reward model learns the comparison, and a policy is optimized against it. Bai led **Constitutional AI**, which replaced most human harmlessness labels with AI self-critique against written principles. Rafailov's **Direct Preference Optimization** showed that the RLHF objective could be optimized directly on preference pairs without a separate reward model or RL loop (\cite[Christiano et al., 2017]{christiano2017rlhf}; \cite[Bai et al., 2022]{bai2022constitutional}; \cite[Rafailov et al., 2023]{rafailov2023dpo}).

### Jordan Hoffmann and Jared Kaplan

\marginfig{jared_kaplan_portrait.jpg}{Jared Kaplan. \cite{img_jared_kaplan}. [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).}

Kaplan's scaling laws showed that loss falls as a power law in model size, data, and compute — the planning instrument that made frontier training a capital-allocation problem. Hoffmann's Chinchilla analysis corrected the recipe: for a fixed compute budget, most models of the GPT-3 generation were far too large for their data, and roughly twenty tokens per parameter was a better target. The correction reset industry training budgets and made data curation a first-class capability problem (\cite[Kaplan et al., 2020]{kaplan2020scaling}; \cite[Hoffmann et al., 2022]{hoffmann2022chinchilla}).

### Catherine Olsson, Adly Templeton, and Jack Lindsey

Olsson led the **induction-heads** work, which identified a two-head circuit that implements in-context pattern completion and showed that it emerges at the same training step as a jump in in-context learning. Templeton led **Scaling Monosemanticity**, which extracted millions of interpretable features from a production Claude model and produced the “Golden Gate Claude” demonstration. Lindsey led the **attribution-graph** analyses that trace causal paths through a model's features and exposed genuine multi-step reasoning, planning, and a hidden goal in a finetuned model (\cite[Olsson et al., 2022]{olsson2022induction}; \cite[Templeton et al., 2024]{anthropic2024goldengate}; \cite[Lindsey et al., 2025]{anthropic2025biology}).

### François Chollet

\marginfig{francois_chollet_portrait.jpg}{François Chollet. \cite{img_francois_chollet}. [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).}

Chollet is a French engineer and researcher who created Keras as an independent open-source project before joining Google. His **Xception** architecture replaced the Inception module with depthwise separable convolutions and made that decomposition a standard building block (\cite[Chollet, 2017]{chollet2016xception}). He wrote “On the Measure of Intelligence,” which argued that intelligence should be measured as the efficiency of skill acquisition on novel tasks rather than as performance on familiar ones, and then built ARC-AGI to measure exactly that kind of generalization. He left Google in 2024 to co-found Ndea, a lab pursuing deep-learning-guided program synthesis as a path beyond pattern matching (\cite[Chollet, 2019]{chollet2019measure}; \cite[Chollet et al., 2024]{chollet2024arcagi}; \cite[Chollet, 2024]{fchollet_site}).

</div>
<div class="md">
## The Mathematicians and Computer Pioneers

The people below built the formal and institutional foundations on which everything else rests. Their work is older than the label “AI,” but the field's central questions — what can be computed, what can be represented, and what can be learned — are theirs.

### George Boole and Gottlob Frege

\marginfig{george_boole_portrait.jpg}{George Boole. \cite{img_george_boole}. Public domain.}
\marginfig{gottlob_frege_portrait.jpg}{Gottlob Frege. \cite{img_gottlob_frege}. Public domain.}

Boole's **Laws of Thought** (1854) turned Aristotle's syllogisms into algebra: propositions become variables, “and” and “or” become operations, and logical inference becomes calculation. Every digital circuit and every symbolic AI system is downstream of that move (\citetitle{boole1854}). Frege's **Begriffsschrift** (1879) went further, inventing predicate logic and the quantifier notation that made it possible to express statements about *all* or *some* objects — the logical grammar that Russell and Whitehead later built into *Principia Mathematica* (\citetitle{frege1879}).

### Alonzo Church and Alan Turing

Church's lambda calculus gave computation a second formal language, and his 1936 proof that the Entscheidungsproblem is unsolvable established that not every well-defined mathematical question has a mechanical answer (\cite[Church, 1936]{church1936}). Turing's contemporaneous paper on computable numbers introduced the abstract machine that now bears his name, proved the same negative result by a different route, and gave the field its standard model of what a computer *is* (\citetitle{turing1936}). The Church–Turing thesis — that every effectively calculable function is computable by a Turing machine — is the unspoken premise of every neural network.

### John McCarthy, Marvin Minsky, Nathaniel Rochester, and Claude Shannon

\marginfig{john_mccarthy_portrait.jpg}{John McCarthy. \cite{img_john_mccarthy}. [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/).}

The 1955 **Dartmouth proposal** named the field and set its first research agenda: language, neurons, abstraction, and creativity, all to be studied by building machines that could exhibit them (\cite[McCarthy et al., 1955]{mccarthy1955dartmouth}). McCarthy went on to invent LISP and to argue that common-sense knowledge could be represented as explicit logical statements — the symbolic programme that dominated AI's first decades. Minsky co-founded MIT's AI laboratory and later wrote *The Society of Mind*, a book-length argument that intelligence is a society of simpler agents rather than a single monolithic algorithm.

### Herbert Simon and Allen Newell

\marginfig{simon_newell.jpg}{Herbert A. Simon and Allen Newell. \cite{simonnewell_image}. Public domain.}

Simon and Newell built the **Logic Theory Machine**, one of the first programs to prove theorems, and used it to argue that human problem solving is symbol manipulation. The program proved 38 of the first 52 theorems in *Principia Mathematica* and found a shorter proof of theorem 2.85 than Russell and Whitehead's; when the authors submitted that proof to the *Journal of Symbolic Logic* with the program listed as a co-author, the editor rejected it because proving a theorem in the outmoded system of *Principia* was no accomplishment \cite{crevier1993ai}. Their **physical symbol system hypothesis** — that a physical symbol system has the necessary and sufficient means for general intelligent action — became the philosophical core of classical AI. Simon also won the Nobel Prize in Economics for his work on bounded rationality, a reminder that the study of intelligence has always crossed disciplinary lines (\cite[Newell & Simon, 1956]{newell1956logic}).

### W. Ross Ashby and Donald Hebb

\marginfig{ashby.jpg}{W. Ross Ashby. \cite{ashbyphoto}. Public domain.}

Ashby's **Design for a Brain** defined adaptation as the maintenance of essential variables within viable limits and built the **Homeostat**, a machine that reorganized its own connections until it recovered stability. His “law of requisite variety” — only variety can absorb variety — is still the best one-line statement of why control requires internal complexity (\citetitle{ashbydesigndbrain1952}). Hebb's **The Organization of Behavior** proposed that repeated co-activation strengthens synapses, the rule that Rosenblatt turned into the perceptron's error-correction mechanism (\citetitle{hebb1949organizationofbehaviour}).
</div>

<div class="md">
## Vision and Generative Models

### Kaiming He and Alexey Dosovitskiy

He's **ResNet** introduced the residual connection — learn a *delta* rather than a full transformation — and made networks with hundreds of layers trainable. The idea is so basic that it now appears in almost every deep architecture, including the Transformer's own residual stream (\cite[He et al., 2016]{he2016resnet}). Dosovitskiy's **Vision Transformer** treated an image as a sequence of patches and showed that a plain Transformer, with enough data, could match or beat convolutional networks. That result opened the path to the unified multimodal models of the 2020s (\cite[Dosovitskiy et al., 2020]{dosovitskiy2020vit}).

### Olaf Ronneberger and Phillip Isola

The **U-Net** paired a contracting encoder with an expanding decoder and skip connections, giving image generation and segmentation a precise spatial backbone; it is still the default architecture inside diffusion models (\cite[Ronneberger et al., 2015]{ronneberger2015unet}). **pix2pix** showed that a conditional GAN could learn image-to-image translation from paired examples — edges to photographs, maps to aerial views, day to night — and made “image translation” a standard task (\cite[Isola et al., 2017]{isola2017pix2pix}).

### Jonathan Ho, Yang Song, and Robin Rombach

Ho's **DDPM** made diffusion models practical by learning to reverse a fixed noising process one small step at a time (\cite[Ho et al., 2020]{ho2020ddpm}). Song's score-based formulation provided the continuous-time view — learn the gradient of the log density, then follow it back to data — that unified diffusion with earlier energy-based methods (\cite[Song & Ermon, 2019]{song2019score}). Rombach's **latent diffusion** moved the whole process into a compressed image space, cutting the compute enough to put Stable Diffusion on a consumer GPU (\cite[Rombach et al., 2022]{rombach2022ldm}).

### Aditya Ramesh, Alec Radford, and William Peebles

Ramesh's **DALL·E** was an autoregressive Transformer over discrete image tokens — a direct application of the language-model recipe to pixels (\cite[Ramesh et al., 2021]{ramesh2021dalle}). Radford's **CLIP** learned a shared image-text space from hundreds of millions of pairs by contrastive training, giving text-to-image systems a semantic steering wheel (\cite[Radford et al., 2021]{radford2021clip}); his GPT-2 and Whisper work did the same for open-ended text and speech (\cite[Radford et al., 2019]{radford2019language}; \cite[Radford et al., 2022]{radford2022whisper}). Peebles' **Diffusion Transformer** replaced the U-Net with a plain Transformer over latent patches and became the backbone of Sora, FLUX, and Stable Diffusion 3 (\cite[Peebles & Xie, 2023]{peebles2023dit}).
</div>

<div class="md">
## The NLP Lineage

The language-model stack was assembled from many small inventions. These are the people whose papers supply the pieces.

### Tomas Mikolov and Jeffrey Pennington

\marginfig{tomas_mikolov_portrait.jpg}{Tomáš Mikolov. \cite{img_tomas_mikolov}. [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).}

Mikolov's **word2vec** trained dense word vectors on local context windows and showed that their differences encode analogies — “king − man + woman ≈ queen” (\cite[Mikolov et al., 2013]{mikolov2013word2vec}). Pennington's **GloVe** reached the same geometry from the opposite direction, factorizing the global co-occurrence matrix so that dot products approximate log counts (\cite[Pennington et al., 2014]{pennington2014glove}). Together they made the embedding layer a standard component of neural language models.

### Rico Sennrich and Taku Kudo

Sennrich's **subword BPE** solved the out-of-vocabulary problem by learning a vocabulary of frequent character fragments, so any word can be reconstructed from pieces (\cite[Sennrich et al., 2016]{sennrich2016subword}). Kudo's **SentencePiece** made the same idea language-independent by treating whitespace as a normal symbol, which is why multilingual models can tokenize Chinese, English, and code with one vocabulary (\cite[Kudo & Richardson, 2018]{kudo2018sentencepiece}).

### Jacob Devlin, Yinhan Liu, and Colin Raffel

Devlin's **BERT** trained a bidirectional encoder with masked language modelling and established the pretrain-then-fine-tune paradigm for understanding tasks (\cite[Devlin et al., 2019]{devlin2019bert}). Liu's **RoBERTa** showed that BERT was undertrained: remove next-sentence prediction, resample masks dynamically, train longer on more data, and the same architecture sets new records (\cite[Liu et al., 2019]{liu2019roberta}). Raffel's **T5** unified translation, summarization, classification, and question answering into one text-to-text format with span-corruption pretraining (\cite[Raffel et al., 2020]{raffel2020t5}).
</div>

<div class="md">
## Systems and Efficiency

A frontier model is not just an algorithm; it is a distributed system. These people made the difference between a paper and a training run.

### Jeff Dean, Samyam Rajbhandari, and Dmitry Lepikhin

\marginfig{jeff_dean_portrait.jpg}{Jeff Dean. \cite{img_jeff_dean}. [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).}

Dean's **DistBelief** showed that neural networks could be trained across thousands of machines, and his later work on TensorFlow and TPUs made that infrastructure usable (\cite[Dean et al., 2012]{dean2012large}). Rajbhandari's **ZeRO** partitioned optimizer states, gradients, and parameters across data-parallel workers, removing the memory duplication that had blocked trillion-parameter training (\cite[Rajbhandari et al., 2020]{rajbhandari2020zero}). Lepikhin's **GShard** combined mixture-of-experts routing with automatic sharding, making sparse models practical at scale (\cite[Lepikhin et al., 2021]{lepikhin2021gshard}).

### William Fedus, Tri Dao, and Woosuk Kwon

Fedus's **Switch Transformer** simplified MoE routing to one expert per token and scaled it to trillion-parameter models (\cite[Fedus et al., 2022]{fedus2022switch}). Dao's **FlashAttention** made exact attention IO-aware: it tiles the computation to fit in GPU on-chip memory instead of materializing the full attention matrix (\cite[Dao et al., 2022]{dao2022flashattention}). Kwon's **vLLM** introduced PagedAttention, managing the KV cache in fixed-size blocks like an operating system's virtual memory; it turned serving from a memory-fragmentation problem into a throughput problem (\cite[Kwon et al., 2023]{kwon2023vllm}).
</div>

<div class="md">
## Interpretability and Safety

### Chris Olah, Nelson Elhage, and Trenton Bricken

Olah's **circuits thread** reframed neural networks as objects to be reverse-engineered: features are directions, circuits are subgraphs, and the goal is a mechanistic explanation of behavior (\cite[Olah et al., 2020]{olaha2020zoomin}). Elhage's **Mathematical Framework for Transformer Circuits** formalized the residual stream and the QK/OV circuits, and his **Toy Models of Superposition** explained why neurons are polysemantic: networks pack more features than dimensions by using nearly orthogonal directions (\cite[Elhage et al., 2021]{elhage2021mathematical}; \cite[Elhage et al., 2022]{elhage2022superposition}). Bricken's **Towards Monosemanticity** showed that sparse autoencoders could recover interpretable features from superposition, the technique later scaled to production models (\cite[Bricken et al., 2023]{bricken2023monosemanticity}).

### Andy Zou and Alexander Matt Turner

Zou's **representation engineering** turned interpretability into a top-down toolkit for reading and controlling high-level properties such as honesty and power-seeking (\cite[Zou et al., 2023]{zou2023repeng}). Turner's **activation addition** showed that a single contrastive direction — “Love” minus “Hate” — could steer a model's sentiment at inference time without any training (\cite[Turner et al., 2023]{turner2023actadd}).

### Collin Burns, Dario Amodei, and Geoffrey Irving

\marginfig{dario_amodei_portrait.jpg}{Dario Amodei. \cite{img_dario_amodei}. [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).}

Burns' **weak-to-strong generalization** fine-tuned strong models on labels from weak supervisors to measure how much latent capability could be elicited — a present-day proxy for the alignment problem (\cite[Burns et al., 2023]{burns2023weakstrong}). Amodei's **Concrete Problems in AI Safety** named the failure modes that the field still uses as its taxonomy: reward hacking, side effects, scalable oversight, safe exploration, and distributional shift (\cite[Amodei et al., 2016]{amodei2016concrete}). Irving's **AI safety via debate** proposed training two models to argue opposite sides of a question in front of a human judge, so that the judge can supervise answers too complex to verify directly (\cite[Irving et al., 2018]{irving2018debate}).

### Stuart Russell, Nick Bostrom, Eliezer Yudkowsky, and Toby Ord

\marginfig{stuart_russell_portrait.jpg}{Stuart Russell. \cite{img_stuart_russell}. [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).}
\marginfig{nick_bostrom_portrait.jpg}{Nick Bostrom. \cite{img_nick_bostrom}. [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).}
\marginfig{eliezer_yudkowsky_portrait.jpg}{Eliezer Yudkowsky. \cite{img_eliezer_yudkowsky}. [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/).}
\marginfig{toby_ord_portrait.jpg}{Toby Ord. \cite{img_toby_ord}. [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).}

Russell's **Human Compatible** argues that the standard objective-based model of AI is the problem: a machine optimizing a fixed objective will resist correction, so the design goal should be uncertainty about human preferences and a willingness to be switched off (\citetitle{russell2019human}). Bostrom's **Superintelligence** framed the control problem and the orthogonality thesis — intelligence and final goals are independent — for a broad audience (\citetitle{bostrom2014superintelligence}). Yudkowsky's earlier essay on AI as a global risk factor made the case that a sufficiently capable optimizer need not be malevolent to be dangerous (\cite[Yudkowsky, 2008]{yudkowsky2008ai}). Ord's **The Precipice** places AI risk alongside pandemics and nuclear war in a broader ethics of existential risk (\citetitle{ord2020precipice}).
</div>

<div class="md">
## Reinforcement Learning and Games

### Gerald Tesauro, Volodymyr Mnih, and John Schulman

Tesauro's **TD-Gammon** combined self-play with temporal-difference learning and a neural network, reaching master-level backgammon and demonstrating that value learning from self-generated experience could work at scale (\cite[Tesauro, 1995]{tesauro1995tdgammon}). Mnih's **DQN** learned Atari games directly from pixels with a convolutional network and experience replay, the result that launched deep reinforcement learning (\cite[Mnih et al., 2015]{mnih2015dqn}). Schulman's **PPO** made policy-gradient training stable enough to become the default algorithm for RLHF and for many game-playing systems (\cite[Schulman et al., 2017]{schulman2017ppo}).

### Zhihong Shao

Shao's **DeepSeekMath** introduced **GRPO**, the group-relative policy optimization that removes the critic by normalizing rewards across sampled answers to the same prompt. GRPO made verifiable-reward RL cheap enough to run at scale and became the optimization engine behind DeepSeek-R1 and many open reasoning models (\cite[Shao et al., 2024]{shao2024grpo}).
</div>

<div class="md">
## The Recurring Cast

These are the names that appear most often across the course, counted approximately by citation keys plus full-name mentions in the top-level lesson files. The right-hand column points to the lessons where their work does the most work.

| Person | Recurring in |
|---|---|
| **Geoffrey Hinton** | [History](history.php), [Backpropagation](backproplab.php), [Optimizers](optimizerlab.php), [Deep Learning](deeplearninglab.php) |
| **Alan Turing** | [History](history.php), [Algorithms](algorithms.php), [Philosophy](philosophy.php), [Myths](myths.php) |
| **Norbert Wiener** | [History](history.php), [Untold History](untold_history_iii.php) |
| **John von Neumann** | [History](history.php), [Software](software.php), [Untold History](untold_history_iii.php) |
| **Ada Lovelace** | [History](history.php), [Software](software.php), [Untold History](untold_history_iii.php) |
| **Charles Babbage** | [History](history.php), [Software](software.php), [Untold History](untold_history_iii.php) |
| **Marvin Minsky** | [History](history.php), [AI and Society](ai_and_society.php) |
| **Seymour Papert** | [History](history.php), [Philosophy](philosophy.php) |
| **John Hopfield** | [History](history.php), [The Mirror in the Machine](mirror_in_machine.php) |
| **Paul Werbos** | [History](history.php), [Backpropagation](backproplab.php) |
| **Demis Hassabis** | [AI and Society](ai_and_society.php), [AI for Science](ai_for_science.php) |
| **David Silver** | [Reinforcement Learning](reinforcement_learning.php), [AI for Science](ai_for_science.php) |
| **John Jumper** | [AI for Science](ai_for_science.php) |
| **Andrew Ng** | [History](history.php), [Software](software.php) |
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

<div class="mn-quiz" data-quiz="people_of_ai"><script type="application/json">{"title": "People of AI", "questions": [{"q": "Who published the first derivation of backpropagation for neural networks?", "options": ["Paul Werbos, in his 1974 dissertation", "Rumelhart, Hinton, and Williams, 1986", "Frank Rosenblatt in 1958, with his perceptron", "Yann LeCun in 1989, with convolutional networks"], "answer": 0, "explain": "Werbos derived it in 1974; the 1986 Nature paper made it famous."}, {"q": "What did McCulloch and Pitts contribute in 1943?", "options": ["A mathematical model of the neuron as a threshold logic unit", "The first trained perceptron, learning from labelled examples", "The Transformer architecture, based entirely on attention", "The backpropagation algorithm, trained by gradient descent"], "answer": 0, "explain": "Their logical calculus founded neural-network theory; Rosenblatt later added learning."}, {"q": "Why is Arthur Samuel important?", "options": ["He built an early self-learning checkers program and coined machine learning in 1959", "He invented the GPU, and that hardware later made very large-scale deep learning practical", "He wrote the first Transformer, which replaced recurrence with attention", "He co-founded OpenAI, which later scaled up many large language models"], "answer": 0, "explain": "Samuel's rote and generalization learning anticipated temporal-difference methods."}, {"q": "What did the Chinchilla analysis change?", "options": ["It showed most large models were undertrained and reset the data-per-parameter target", "It proved that neural scaling laws do not exist in practice for very large language models", "It replaced attention with recurrence in all the transformer encoder layers", "It introduced RLHF as the main training method for most modern chatbots"], "answer": 0, "explain": "Hoffmann et al. found roughly twenty tokens per parameter was a better compute-optimal ratio."}, {"q": "What is AlphaFold known for?", "options": ["Highly accurate protein structure prediction", "Playing the board game Go at a superhuman level", "Generating realistic images from noise", "Training large language models on text"], "answer": 0, "explain": "Jumper, Hassabis, and colleagues effectively solved single-chain structure prediction at CASP14."}]}</script></div>
