<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: The Untold History of AI III: The Modern Stack
description: The displaced prerequisites, part III: war research, spaceflight, programming languages, the web, and the human capital behind the machine.
icon: &#128421;&#65039;
part: 6
order: 4
color: text-secondary
topics: history, philosophy, society
tags: interested-layman
-->

<div class="md" data-depth="20">

## 🛰 War, Space, and the Machine

### From the Battlefield to AlphaGo: How War Research Helped to Build Modern AI

#### The First Electronic Computers: Colossus and ENIAC

The **Colossus**, built by Tommy Flowers at the Post Office Research Station for Bletchley Park — the first Mark operational in early 1944, the improved Mark 2 by June 1944 — was the world's first large-scale programmable electronic digital computer. The Mark 2 used some 2,400 vacuum tubes to break the German Lorenz cipher, helping to shorten the Second World War. Its existence was classified until the mid-1970s \cite{copeland2006colossus, flowers1983design}.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="colossus.jpg" alt="The Colossus Mark 2 computer being operated by Dorothy Du Boisson and Elsie Booker at Bletchley Park, 1943" />
    <figcaption class="md">The \citealternativetitle{colossus_image} (UK National Archives, Public Domain). Operated by Wrens of the Women's Royal Naval Service. Eleven machines were eventually built; all but two were destroyed after the war on the orders of the then-Director of GCHQ.</figcaption>
</figure>

**ENIAC** (\citeyear{eniac1946}), built at the University of Pennsylvania, was originally designed to compute artillery firing tables. Its first real “user” was John von Neumann, who reprogrammed it in 1945 for thermonuclear calculations at Los Alamos. Six women, Kay McNulty, Betty Jennings, Betty Snyder, Marlyn Meltzer, Frances Bilas, and Ruth Lichterman, did the actual programming, an invisible prerequisite for the rest of computing history \cite{haigh2006eniac}.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="eniac.jpg" alt="ENIAC, the Electronic Numerical Integrator and Computer, photographed in operation at the Moore School" />
    <figcaption class="md">The \citealternativetitle{eniac1946_image} (U.S. Army, Public Domain). 18,000 vacuum tubes, 30 tons, 1,000 square feet of floor space, and reprogrammable only by re-plugging cables and setting switches.</figcaption>
</figure>

#### Wiener, Cybernetics, and the Anti-Aircraft Problem

Norbert Wiener's *Cybernetics* (1948) grew directly out of his wartime work on **anti-aircraft fire-control**: predicting an aircraft's future position from noisy radar returns in order to aim guns. The book synthesized Wiener's feedback theory with \citeauthor{mccullochpitts1943}'s 1943 logical-neuron paper, written five years earlier, to define the cybernetic paradigm that dominated AI in the 1950s \cite{wiener1948cybernetics}. I. J. Good, a wartime collaborator of Turing's, later developed the Bayesian methods for cryptanalysis that became a foundation of modern statistical AI \cite{good1959statistics}.

The field's very name was a deliberate break with that tradition. When **John McCarthy** chose a title for the 1956 Dartmouth workshop, he settled on "artificial intelligence" partly to distinguish the project from the recent volume *Automata Studies* and, as he put it later, "to escape association with 'cybernetics'" — whose "concentration on analog feedback seemed misguided", so that he would not have to "accept Norbert Wiener as a guru" or "argue with him" (\cite[Nilsson, The Quest for Artificial Intelligence]{nilsson1984qai}).

#### ARPA/DARPA: The Government Patron of AI

Created in February 1958 in response to Sputnik, the **Advanced Research Projects Agency** (renamed DARPA in 1972) became the primary funder of American AI research for two decades. Its **Information Processing Techniques Office** (IPTO) financed, among much else:

- **Shakey the Robot** (SRI, 1969–1972) \cite{nilsson1984shakey}, the first mobile robot to reason about its own actions, introducing the A* algorithm and the Hough transform to robotics
- The **ARPA Speech Understanding Research** program (1971–1976) \cite{klatt1977sur}, which produced CMU's Harpy system and laid groundwork for **Sphinx** \cite{lee1989sphinx}
- **Image Understanding** programs that built the modern computer-vision community
- **ARPANET** (1969), which became the modern Internet

<figure>
    <img style="width: 60%; height: auto; display: block; margin: 1em auto;" src="shakey_robot.jpg" alt="SRI's Shakey the Robot, the first mobile reasoning robot, on display at the Computer History Museum" />
    <figcaption class="md">The \citealternativetitle{shakey_robot_image} (CC-BY-SA 4.0). Shakey used a TV camera, a range finder, and an on-board PDP-10 to plan its movements through a cluttered room, a 1969 proof of concept that perception, planning, and action could be unified in one machine.</figcaption>
</figure>

DARPA later ran the **Grand Challenge** (2004, 2005) and **Urban Challenge** (2007), whose competing teams seeded the technology that became self-driving cars \cite{kurzweil2010darpasingular}.

#### SAGE, GPS, and the Cold War Computing Backbone

**SAGE** (Semi-Automatic Ground Environment), operational from 1958, used 24 AN/FSQ-7 computers to provide continental US air defense \cite{edwards1996closedworld}. It pioneered light-pen interaction, real-time telemetry, and the contractual separation of hardware and software that created the modern computer industry. **GPS**, originally a Navy program for submarine-launched ballistic missiles, became the universal positioning layer for civilian and military use alike \cite{parkinson1996gps}.

#### Statistical Methods Born of War

**Abraham Wald's** *Sequential Analysis* (1947) was developed for wartime quality inspection: when each measurement is expensive, when should you stop testing and accept the batch? It is now foundational to A/B testing, clinical-trial design, and reinforcement-learning stopping rules \cite{wald1947sequential}.

These threads, codebreaking, fire control, government patronage, and statistical inspection, ran in parallel and interwove. None of them set out to build a language model; all of them contributed load-bearing components.

</div>

<div class="md" data-depth="20">

The contribution of nuclear weapons research to AI is less well-known than that of the wartime codebreakers, but quantitatively and qualitatively it is comparable. Three threads deserve attention.

#### Monte Carlo Methods

In 1946, the Polish-American mathematician Stanisław Ulam, convalescing at Los Alamos from an illness and playing Canfield solitaire, realized that the combinatorics of certain solitaire layouts were easier to estimate by repeated trial than by analytical calculation. He proposed the same trick for the **neutron diffusion problem** then blocking the design of thermonuclear weapons: sample random neutron paths, estimate average behaviour \cite{eckhardt1987ulam}. Working with John von Neumann, the method was implemented on the ENIAC in spring 1948 to simulate a fission core. They named it after the Monte Carlo Casino \cite{ulam_vonneumann1949montecarlo}.

<figure>
    <img style="width: 80%; height: auto; display: block; margin: 1em auto;" src="monte_carlo_normal.gif" alt="Animated illustration of Monte Carlo averaging converging to a normal distribution as the number of samples increases" />
    <figcaption class="md">The \citealternativetitle{monte_carlo_animation_image} (CC-BY-SA 3.0): sums of uniform samples converge to a normal distribution. Monte Carlo methods exploit exactly this convergence to estimate integrals and probabilities in high-dimensional problems that no closed-form solution can reach.</figcaption>
</figure>

By 1953, Metropolis and co-workers at Los Alamos had turned the same idea into a general algorithm for sampling from any probability distribution: the **Metropolis algorithm** \cite{metropolis1953equation}. Generalized by Hastings in 1970 \cite{hastings1970mcmc}, **Markov Chain Monte Carlo** (MCMC) is now standard in Bayesian statistics, phylogenetics, computational linguistics, and probabilistic machine learning.

#### Game Theory and the Architecture of Computation

While consulting at Los Alamos, John von Neumann co-authored *Theory of Games and Economic Behavior* (1944) with Oskar Morgenstern \cite{vonneumann_morgenstern1944}. The book's mathematical framework, minimax, Nash equilibrium, repeated games, became the foundation of **multi-agent reinforcement learning**, algorithmic game theory, and modern mechanism design.

\marginfig{von_neumann_lanl.gif}{The \citealternativetitle{vonneumann_lanl_image} (LANL, Public Domain). Von Neumann spent 1943–1955 commuting between Los Alamos, Princeton's IAS, and various weapons-related advisory committees. Almost every foundational structure of modern computing, the stored-program architecture, cellular automata, game theory, Monte Carlo methods, was touched by his work.}

Von Neumann also sketched the **stored-program architecture** (\citeyear{vonneumann}) during his weapons work, and later designed self-reproducing **cellular automata** with Ulam at Los Alamos, the conceptual ancestor of agent-based simulation.

#### Metropolis–Hastings in Modern ML

The single most influential MCMC algorithm in machine learning is the **Metropolis–Hastings** sampler \cite{hastings1970mcmc}, whose flowchart is shown below. It is the engine of Bayesian neural networks, Gaussian processes, and most modern probabilistic programming languages.

<figure>
    <img style="width: 90%; height: auto; display: block; margin: 1em auto;" src="metropolis_hastings.png" alt="Flowchart of the Metropolis-Hastings Markov Chain Monte Carlo algorithm" />
    <figcaption class="md">The \citealternativetitle{metropolis_hastings_image} (CC-BY 4.0). The accept/reject step in the centre is the entire intellectual contribution of the original Metropolis paper, scaled up to billions of dimensions.</figcaption>
</figure>

#### From Metropolis to AlphaGo

The same Monte Carlo idea, applied to game-tree search, gave rise to **Monte Carlo Tree Search** (MCTS), the central algorithmic innovation of **AlphaGo** \cite{silver2016alphago}. AlphaGo combines MCTS with deep neural networks: the network guides random rollouts toward promising branches, and the rollouts produce training data for the network. Without the 1946 neutron-diffusion calculation, the 2016 Go match would not have happened.

#### Programming Languages and Numerical Computing

The numerical demands of weapons hydrodynamics drove the development of **FORTRAN** \cite{backusfortran} at IBM (1957) and the early culture of high-performance scientific computing at Los Alamos. The same culture produced the **MANIAC** computer, one of the first machines to play a credible game of chess, and the early Monte Carlo simulation community whose work is the literal ancestor of every probabilistic ML method today.

#### From Weapons Code to Civilian Tool

The methods above moved quickly into civilian use. Monte Carlo radiative-transfer codes became the backbone of climate and weather modelling. Bayesian statistics, with I. J. Good as one of its main postwar advocates, became standard in medicine, social science, and industry. Game-theoretic mechanism design runs modern spectrum auctions. MCMC underpins essentially every modern probabilistic programming language.

The history of AI is not only the history of algorithms. It is also the history of numerical methods, statistical techniques, and computing infrastructure that were developed for wartime and weapons-research needs and were later redirected toward the civilian world.

</div>

<div class="mn-quiz mn-quiz--checkpoint" data-quiz="untold_history_iii-cp3" data-depth="20"><script type="application/json">{"title": "Checkpoint: war research", "questions": [{"q": "What was ENIAC originally designed to compute?", "options": ["Artillery firing tables", "Census statistics", "Weather forecasts", "Bank balances"], "answer": 0, "explain": "Built at the University of Pennsylvania, it was a wartime machine — like much of early computing and cybernetics."}]}</script></div>

<div class="md" data-depth="20">

### To the Moon and Beyond: How Spaceflight Helped to Build the Invisible Scaffolding for Modern AI

#### The German Lineage: From Peenemünde to the Instrument Unit

The first computer ever built into a flying machine was German. In 1941, engineer **Helmut Hölzer** at Peenemünde designed the *Mischgerät*, a fully electronic analog computer that stabilized the V-2 rocket during its roughly sixty seconds of powered flight \cite{tomayko1985hoelzer}. Gyroscope signals were integrated and differentiated by resistor–capacitor networks to derive the rocket's attitude *and* its rate of divergence, the damping signal no purely mechanical controller could supply fast enough \cite{ulmann2019analogcomputer}. Hölzer then built the first electronic general-purpose analog computer, on which the complete rocket steering loop was simulated in real time before it ever flew. Hardware-in-the-loop simulation, the standard way control policies are tested in every modern robotics and driving lab, began in that one room.

The Peenemünde heritage split after the war, and both branches reached high ground. Under Wernher von Braun at Huntsville, the **Saturn V**'s Instrument Unit carried the **Launch Vehicle Digital Computer**, built by IBM, the first stored-program autopilot trusted with a launch vehicle \cite{dickinson1964lvdc}. It ran a two-second navigation-and-guidance loop and a 25-hertz attitude-control loop, voted its outputs across three redundant processors, and flew on every Saturn mission \cite{burkey_lvdc}. In the Soviet Union, roughly 170 German rocket engineers under Helmut Gröttrup were moved to Gorodomlya Island in 1946 to continue the V-2 lineage inside the R-1 programme \cite{zak_gorodomlya}, the technical bridge from Peenemünde to the Soviet guidance industry that would one day build the machines in the sections below.

#### The Apollo Guidance Computer

The **Apollo Guidance Computer**, developed at the MIT Instrumentation Laboratory from 1961, was one of the first computers built from silicon integrated circuits. Designed under Charles Stark Draper and Eldon C. Hall, the Block II version flown to the Moon contained roughly 2,800 dual 3-input NOR gates and 36,864 words of read-only **core rope memory**, woven by hand at a Raytheon factory \cite{mindell2008digitalapollo}.

What matters for AI history is not the hardware but the **software**. J. Halcombe Laning designed a preemptive priority scheduler, the “Exec” and the “Waitlist”, that has no direct equivalent in the early ARPA machines of the same era \cite{hoag1976apollohistory}. When the rendezvous radar on \citealternativetitle{eyles2004lmcomputer} (\citeyear{eyles2004lmcomputer}) began flooding Apollo 11's computer with cycle steals five minutes before touchdown, the scheduler automatically shed low-priority tasks. Without it, the landing would have been aborted. Margaret Hamilton, who directed the software team, later received the Presidential Medal of Freedom for work that effectively founded **software engineering** as a discipline.

<div class="image-row">
    <figure>
        <img src="apollo_agc_modules.jpg" alt="Solid-state modules and backplane of the Apollo Guidance Computer" />
        <figcaption class="md">The \citealternativetitle{agc_module_image} (CC-BY-SA 3.0). One of the first computers to use silicon ICs, and a demonstration that software-driven priority scheduling could safely run a vehicle carrying human lives.</figcaption>
    </figure>
    <figure>
        <img src="margaret_hamilton.jpg" alt="Margaret Hamilton in 1969 standing next to stacks of the Apollo Guidance Computer source-code listings" />
        <figcaption class="md">The \citealternativetitle{hamilton1969_image} (Public Domain, PD US no notice). Margaret Hamilton beside the printouts of the AGC software her MIT team produced for the Apollo Command and Lunar Modules, the “stacks” she is standing next to are taller than she is.</figcaption>
    </figure>
</div>

#### The Soviet Counterpart: Argon, Soyuz, and Buran

The Soviet Union developed its own flight computers in almost complete isolation, on a radically different schedule. When Korolev's bureau began designing Soyuz in the early 1960s, no Soviet computer maker could meet its specifications, and the spacecraft was initially designed with no onboard computer at all \cite{gerovitch_argon}. The Apollo program changed that: the **Argon-11S**, finished in 1968 for the abandoned lunar project, was the first Soviet spacecraft computer, and its successor the **Argon-16** became one of the longest-lived flight computers in history \cite{argon16_museum}. Triply redundant with hardware majority voting, it flew from the Soyuz T-2 in 1980 through Soyuz, Progress, Salyut, and Mir missions for more than thirty years, without a reported in-service failure \cite{ieee_digital_soyuz}.

The **Buran** orbiter pushed that philosophy to its extreme. On its single orbital flight, 15 November 1988, Buran performed re-entry, approach, and landing entirely automatically, without a pilot \cite{buran_autoland}. Its central computer complex ran four **BISER-4** machines on a hardware-synchronized 3-of-5 clock vote, a design specified to tolerate any two simultaneous component failures \cite{burancomputer_guide}. When gusting wind changed the approach conditions seconds before touchdown, the onboard complex computed a new trajectory and landed into the wind on its own. Let that land: a multi-ton vehicle flew itself home before most of today's autonomy researchers were born, with zero human intervention, using hardware voting and hand-written control laws. The Argon and BISER lines are the direct ancestors of the fault-tolerant autopilots, fly-by-wire laws, and redundant vehicle stacks that autonomous platforms rely on today.

#### From Fly-by-Wire to Fly-Yourself

NASA's F-8 Digital Fly-by-Wire program (1972) used an AGC derivative to demonstrate that computers could replace mechanical linkages in aircraft control surfaces \cite{tomayko2000flybywire}. The Space Shuttle (1981–2011) carried four redundant IBM AP-101 computers running identical software with majority voting, the first operational fly-by-wire on a crewed spacecraft. Every modern airliner and military fighter inherits this lineage.

#### Robotic Autonomy on Mars

Since Spirit and Opportunity landed in 2004, NASA/JPL rovers have carried **Visual Odometry** algorithms that estimate rover motion by tracking features between stereo image pairs \cite{maimone2007vo}. From Curiosity onward, the **AEGIS** system (Autonomous Exploration for Gathering Increased Science) selects science targets on the rover itself, without waiting for the months-long Earth round-trip \cite{estlin2009aegis} \cite{francis2017aegis}: it scores each candidate rock it can image, and when a freshly spotted target looks scientifically better than the one on the plan, it re-prioritises to chase it. Perseverance (\citeyear{nasa2021perseverance}) pushes the autonomy into the driving itself. Its **AutoNav** / **Enhanced Navigation (ENav)** algorithm \cite{toupet2025enav} \cite{verma2023autonomy} \cite{jpl2023mobility} runs on a dedicated Vision Compute Element co-processor and uses a "thinking-while-driving" design, so that stereo ranging, visual odometry, and an orientation-sensitive hazard assessment all keep running *while the wheels are still turning*; the rover detects the rocks and slopes ahead of it and re-plans its own path in real time. It is precisely this pair, autonomous target selection (AEGIS) plus autonomous hazard-avoidant path planning (AutoNav/ENav), that lets it choose which rocks to stop for and steer itself clear of the boulders that would otherwise trap it. In its first Martian year the self-driving algorithm covered 88 per cent of the 17.7 kilometres the rover travelled, and it has since set the records for the longest drive without human review and the longest single-day traverse \cite{verma2023autonomy}. The combination of SLAM, visual odometry, autonomous science selection, and autonomous path planning developed for Mars is a direct ancestor of every modern autonomous-driving stack.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="perseverance_selfie.gif" alt="NASA Perseverance rover self-portrait at the Rochette abrasion patch on Mars" />
    <figcaption class="md">The \citealternativetitle{perseverance_selfie_image} (NASA / JPL-Caltech, Public Domain). The same rover whose AEGIS lets it pick, on its own, which rock is worth stopping for is the one whose ENav lets it steer itself around the boulders that would otherwise trap it \cite{verma2023autonomy}.</figcaption>
</figure>

<div class="smart-quote" data-cite="newyorktimesperceptron">
        Dr. Rosenblatt, a research psychologist at the Cornell Aeronautical Laboratory, Buffalo, said Perceptrons might be fired to the planets as mechanical space explorers.
</div>

That was the \citeyear{newyorktimesperceptron} prediction, made as the Perceptron first learned to tell shapes apart at Cornell. Six decades later the "mechanical space explorer" is a car-sized rover that, with no operator in the loop, decides for itself which rocks to drill and how to keep from getting stuck.

#### LUNAR: Asking the Moon Rocks Questions in English (early 1970s)

After Apollo 11, the several pounds of lunar rock the crew brought home were described in databases that geologists could only query in arcane code. NASA asked **William A. Woods**, a young computer scientist at BBN, whether the databases could be queried in *English*; with Ron Kaplan and Bonnie Webber he built **LUNAR**, a system that turned English questions about the moon rocks into database queries \cite[Nilsson, The Quest for Artificial Intelligence]{nilsson1984qai}. "What is the average concentration of aluminum in high alkali rocks?" or "How many breccias contain olivine?" were parsed by **augmented transition networks** (ATNs), Woods' own invention from his Harvard dissertation, and mapped into a "meaning representation language" (MRL), a logic extended with executable procedures. LUNAR also tracked discourse: asked "What are they?", it knew *they* were the breccias from the previous answer. LUNAR was the first question-answering system to publish performance data: at the Second Annual Lunar Science Conference in Houston in January 1971, it answered 78% of the questions put to it by geologists, with another about 12% answerable, it was reported, with minor fixes to the system (\cite[Nilsson, The Quest for Artificial Intelligence]{nilsson1984qai}).

#### Coding Theory for Noisy Channels

Deep-space communication links are extraordinarily bandwidth-limited and noise-prone. **Reed–Solomon** codes \cite{reed1960polynomial} (now in every CD, DVD, QR code and SSD), the **Viterbi** decoder \cite{viterbi1967error} (now in every 3G/4G/5G baseband), and **turbo codes** \cite{berrou1993turbo} (now in 3G and deep-space probes) were developed or matured for space telemetry. Without them, downloading a 70-billion-parameter LLM over a noisy channel would take orders of magnitude longer.

#### Navigation: Kalman and GPS

Rudolf Kálmán's recursive filter \cite{kalman1960filter} was developed at the Research Institute for Advanced Study in Baltimore with explicit guidance applications in mind. Every modern SLAM system, every inertial measurement unit on a smartphone, and every GPS receiver is a descendant. The Global Positioning System itself began as a Navy/Air Force program for submarine and missile navigation \cite{parkinson1996gps}, and is now the silent prerequisite for every mapped application on Earth.

#### When Space Software Fails: The Ariane 5 Lesson

Spaceflight's gift to computing is not only success. On 4 June 1996 the maiden flight of the European **Ariane 5** launcher broke apart 39 seconds after lift-off. The cause, established beyond doubt by the inquiry board \cite{ariane501_report}, was an unremarkable line of code: a 64-bit floating-point value, the horizontal-bias estimate of an inertial reference unit, was converted to a 16-bit signed integer and overflowed. The exception disabled the active unit; the backup unit, running identical software, failed moments later for the same reason; the resulting attitude data steered the booster into aerodynamic loads that destroyed it. The alignment routine that caused the crash had already served its purpose on Ariane 4, whose trajectory it was written to handle, and simply did nothing useful on Ariane 5. For AI, the lesson is that numerical robustness is a systems property, not a library feature: silent overflows, unvalidated conversions, and trusted inherited defaults are not theoretical concerns. A single such bug destroyed a launch vehicle worth several hundred million dollars and redefined the modern discipline of software verification.

#### The Space Program's Unexpected Payload: What the Void Left in the Code

The machines above are the visible lineage: the guidance computer, the fly-by-wire law, the autonomous rover. But the space program's deeper legacy is a set of ideas that migrated into AI *sideways*, through problems no one was trying to solve for computation. The vacuum, the light-delay, the radiation, and the sheer size of a sky survey each forced an invention that, decades later, turned out to be load-bearing for a model.

##### Space Radiation: The Bit Flip That Now Haunts the Data Center

A single high-energy particle, a fragment of a cosmic ray that no atmosphere is left to stop, can strike a memory cell and flip one stored bit. This **single-event upset** (SEU) is a constant, unavoidable background in orbit, so a spacecraft's electronics have to be built to *expect* its own memory to lie \cite[Single-event effect]{wiki_single_event_effect}.

<figure>
    <img style="width: 100%; height: auto; display: block; margin: 1em auto;" src="data_center.jpg" alt="A data center aisle of server racks" />
    <figcaption class="md">The \citealternativetitle{img_data_center} (CC BY-SA 2.0): a data-center aisle, the ground-based home of the same bit-flip threat that radiation poses in orbit — where a single silent flip in a GPU's memory can quietly corrupt a training run. Source: [Christopher Bowns, CC BY-SA 2.0](https://commons.wikimedia.org/wiki/File:Virginia_Tech_-_data_center.jpg).</figcaption>
</figure>

The toolkit is old and blunt: **error-correcting codes** detect and repair single-bit errors; **scrubbing** periodically re-reads memory and fixes what it finds; and the heaviest hammer, **triple modular redundancy**, runs the same computation three times on separate hardware and lets the majority vote, so that one flipped bit loses \cite[Triple modular redundancy]{wiki_tmr}. A spacecraft computer is, in effect, a machine that does not trust its own memory.

The displacement is startling. The same bit-flip problem now lives not in the void but in the data center. A single corrupted word in a GPU's high-bandwidth memory, or a **silent data corruption** — the hardware returning a wrong result *without* raising a single error flag — can quietly poison a training run that has already consumed weeks of compute and millions of dollars, and the corruption is often invisible until a loss curve suddenly goes wrong (\cite[Ma et al., 2025]{arxiv_sdc_llm}). The discipline "the machine may lie to you without telling you, so run it three times and cross-check" was invented for a computer hanging in space, and it is the same discipline — ECC, redundancy, checkpointing, and replication — that keeps a ten-thousand-GPU cluster from training on garbage. The radiation belt above a low orbit is the reason a data center on the ground is taught to doubt its own silicon.

##### The Corner Cubes on the Moon: How a Range Finder Became the Car's Eyes

When Apollo 11, 14, and 15 landed, the astronauts left behind small arrays of **corner-cube retroreflectors**, mirrors that reflect a beam of light straight back to whoever aimed it, regardless of the angle. Since 1969, observatories have fired a laser at those cubes and *timed the round trip of the pulse* to measure the Earth–Moon distance to the millimetre \cite[Lunar laser ranging]{wiki_lunar_laser_ranging}. The whole trick is one line of arithmetic: distance is the speed of light times the round-trip time, divided by two.

<figure>
    <img style="width: 55%; height: auto; display: block; margin: 1em auto;" src="apollo_alrr.jpg" alt="A corner-cube retroreflector array of the kind Apollo left on the Moon" />
    <figcaption class="md">The \citealternativetitle{img_apollo_alrr} (CC0): a corner-cube retroreflector array of the kind the Apollo crews set down on the Moon. Aim a laser at it and the light comes straight back to you no matter the angle — the trick that lets a ground telescope measure the Earth–Moon distance to the millimetre, and the same trick at the heart of LIDAR. Source: [Mark Avino, CC0](https://commons.wikimedia.org/wiki/File:Laser_Ranging_Retro-Reflector,_Apollo_(NASM2020-00366).jpg).</figcaption>
</figure>

That single idea — send out light, time the echo, and the range is known — is the entire operating principle of **LIDAR**, the laser-radar that now lets a self-driving car paint a millimetre-precise three-dimensional map of the street around it in real time \cite[Lidar]{wiki_lidar}. And the corner cube itself, the device that bounces light faithfully home, is the same class of hardware now bolted onto survey targets, road signs, and drones as a LIDAR registration reference. A piece of hardware engineered to measure the Moon is the conceptual ancestor of the sensor that lets a car decide, in a fraction of a second, how far away a pedestrian is.

##### Forty Minutes of Silence: The Light-Delay That Invented "Autonomy" and a New Kind of Network

Talk to a rover on Mars and the reply takes three to twenty-two minutes one way, depending on where the two planets are in their orbits; at the outer planets it is hours. You cannot run a mission on a request–reply loop when a single "ping" is an hour of silence. That constraint forced two of the most consequential ideas in modern autonomy and networking.

* **Autonomy, literally.** When you cannot wait for a reply, the machine has to notice a problem and fix it before an engineer can even hear about it. *Deep Space 1* (1998) flew **Remote Agent**, the first artificial-intelligence system to plan, execute, and repair a spacecraft *on its own*: presented with three simulated hardware failures, it diagnosed each and worked around it, no human in the loop \cite[Deep Space 1]{wiki_deep_space_1}. Its **Autonav** was fully autonomous navigation — the craft worked out its own position by watching known asteroids drift against the fixed star background, an inverse GPS performed in deep space, freeing it from depending on a ground station for every fix. "Act without waiting for a reply" is the literal origin of the word *autonomous* in AI; its descendants are the self-driving stack and the on-device models that must reason on a laptop or a phone with no round trip to a server.

* **Delay-tolerant networking.** A space link is slow, lossy, and periodically *simply disconnected* (a spacecraft slides behind the Sun and loses contact). The NASA/JPL **DTN** working group answered with the **Bundle Protocol**: cut the data into self-contained "bundles," store them, and forward them opportunistically, passing custody from node to node, with no end-to-end connection assumed at all \cite[Delay-tolerant networking]{wiki_delay_tolerant_networking}. Standardized by the IETF, that "store, carry, forward" logic now underpins the Internet of Things, disaster-recovery communications, and military networks — precisely the places where the old "always connected, end-to-end" assumption breaks down. A network was designed around the silence between worlds, and the same design is now what keeps data moving where any link can vanish.

<figure>
    <img style="width: 30%; height: auto; display: block; margin: 1em auto;" src="deep_space_1_spacecraft.jpg" alt="The Deep Space 1 spacecraft" />
    <figcaption class="md">The \citealternativetitle{img_deep_space_1} (Public Domain): *Deep Space 1* (1998), the first spacecraft to carry an AI that planned its own actions and diagnosed and worked around its own faults — the flight proof that a machine could get work done without waiting for a reply from Earth. Source: [NASA/JPL, public domain](https://commons.wikimedia.org/wiki/File:Deep-Space-1-ds1craft2.jpg).</figcaption>
</figure>

##### Fitting a Mountain in a Matchbox: The Compression Standard Chosen for a Mars Radio Link

A rover's camera can produce megabytes a picture, but the radio link home carries kilobits a second. To get a scene across that pipe, the space-agency standards body (CCSDS) chose **JPEG 2000** for planetary imaging. Its core is not a discrete cosine transform but a **discrete wavelet transform**: decompose the image into a set of frequency sub-bands, discard the fine detail the eye and the science can least afford, and entropy-code what remains. Crucially it *degrades gracefully* — lose a chunk of the bitstream and you get a blurry image, not a broken one, which a lossy radio link prizes above everything \cite[JPEG 2000]{wiki_jpeg2000}.

<figure>
    <img style="width: 100%; height: auto; display: block; margin: 1em auto;" src="curiosity_panorama.jpg" alt="A panoramic view of the Martian surface from the Curiosity rover" />
    <figcaption class="md">The \citealternativetitle{img_curiosity_panorama} (Public Domain): a panorama from the Curiosity rover — the kind of scene a spacecraft camera has to compress hard enough to squeeze across a radio link carrying kilobits a second. The wavelet decomposition that JPEG 2000 uses for exactly this job is the fixed, hand-designed ancestor of the learned basis a neural autoencoder finds. Source: [NASA/JPL-Caltech/MSSS, public domain](https://commons.wikimedia.org/wiki/File:PIA16453-MarsCuriosityRover-RocknestPanorama-20121126.jpg).</figcaption>
</figure>

The displacement is mathematical. That three-step recipe — *transform into a compact basis, keep only the coefficients that matter, re-encode the rest* — is exactly what a neural **autoencoder** does, except it *learns* the transform instead of fixing it in advance. The "latent code" that you can later decode back into a full image is the direct successor of the wavelet sub-bands an engineer squeezed into a packet so a picture of Mars would arrive before the spacecraft rounded the planet. The question "how do I fit the whole scene into a handful of numbers and get it back?" was tuned on a radio link, and it is the same question behind every representation a model learns: how many numbers do I actually need to hold a face, a word, a protein?

##### A Deluge of Galaxies: When the Data Was Bigger Than the Algorithm

By 2007 the Sloan Digital Sky Survey had imaged roughly nine hundred thousand galaxies, and the honest state of the art was that the automated image-analysis programs of the day **could not** classify them reliably — in the words of one of the founders, "the human brain is actually much better than a computer at these pattern-recognition tasks." So a group of astrophysicists did something that had never been done at that scale: they put the galaxies on the public web and let people click. **Galaxy Zoo**, launched on 11 July 2007, drew in more than one hundred thousand volunteers who produced over forty million classifications in their first six months — one hundred and twenty-five million in all, feeding more than sixty peer-reviewed papers and eventually the Zooniverse \cite[Galaxy Zoo]{wiki_galaxy_zoo}.

<figure>
    <img style="width: 72%; height: auto; display: block; margin: 1em auto;" src="mice_galaxies.jpg" alt="NGC 4676, two galaxies colliding and winding each other's stars into tails" />
    <figcaption class="md">The \citealternativetitle{img_mice_galaxies} (Public Domain): NGC 4676, "The Mice" — two galaxies colliding and flinging stars into long tails, exactly the sort of interacting oddity that Galaxy Zoo's volunteers flagged by the million and that the automated classifiers of the day kept getting wrong. Source: [NASA/ESA, public domain](https://commons.wikimedia.org/wiki/File:The_Mice_(NGC_4676)-_Colliding_Galaxies_With_Tails_of_Stars_and_Gas_(2002-11-1191).jpg).</figcaption>
</figure>

The loop is the point, and it is the origin story of a whole subfield. The *data deluge* that machine learning could not solve was solved by crowd-sourcing; and those millions of human labels became precisely the training data that let deep learning finally learn to classify galaxies better than the crowd ever could. The space survey created the dataset, the crowd made it *labelled*, and the labelled set became the thing that taught the model. "AI for science" began, in one of its first great successes, not with a clever algorithm but with a pile of images no algorithm could handle and a forum full of volunteers — the same data-beats-hands rule that the \cite[Bitter Lesson]{sutton2019bitter} would later name.

##### Unblurring the Sky: The Inverse Problem That Became the Denoising Step

A telescope image is never the object. It is the object smeared by the optics and the atmosphere (a "point-spread function"), plus noise, on top. Recovering the sharp image is an **inverse problem**. The canonical tool, **Richardson–Lucy** deconvolution (Richardson 1972, Lucy 1974), is an iterative maximum-likelihood loop: guess the sharp image, smear it the way the optics would, compare the smear to the measurement you actually made, nudge the guess, and repeat until the smear matches the sky \cite[Richardson–Lucy deconvolution]{wiki_richardson_lucy}. At its heart is one repeated gesture: *given a corrupted measurement, work backward toward the clean signal.*

<figure>
    <img style="width: 58%; height: auto; display: block; margin: 1em auto;" src="hubble_ultra_deep_field.jpg" alt="The Hubble Ultra Deep Field, thousands of galaxies in a tiny patch of sky" />
    <figcaption class="md">The \citealternativetitle{img_hubble_udf} (Public Domain): the Hubble Ultra Deep Field, thousands of galaxies in a grain-of-rice patch of sky — a picture recovered from smear and noise by exactly the iterative "clean the corrupted measurement" reflex that Richardson–Lucy deconvolution made standard, and that denoising diffusion models now learn to perform on their own. Source: [NASA/ESA, public domain](https://commons.wikimedia.org/wiki/File:Hubble_ultra_deep_field.jpg).</figcaption>
</figure>

That gesture is the single most important idea in modern generative AI. A **denoising diffusion model** (Ho et al., 2020) is built on exactly this move, only *learned*: a forward process gradually adds noise to real data until it is pure static, and a network is trained to reverse one tiny bit of that noise at a time \cite[Diffusion model]{wiki_diffusion_model}. Sampling begins from pure static and *denoises* it, step by step, until a face, a molecule, or a protein emerges. The iterative un-blurring of a fuzzy astronomical plate and the iterative un-noising of a diffusion sample are the same reflex in two centuries — and the score-based view that ties them together makes the resemblance exact, not just poetic.

None of these systems was built for AI. Yet between the corner cubes on the Moon and the forty-minute radio link to Mars, the space program quietly supplied the bit-flip discipline that guards a GPU cluster, the ranging idea that became the self-driving car's eyes, the first machine that repaired itself, the compression mathematics behind the latent space, the labelled data that taught the first "AI for science" models, and the denoising loop at the heart of generative AI. Together with the hardware, the coding theory, and the fly-by-wire laws, they form much of the invisible scaffolding on which every mobile robot — and every model that learns to see, plan, and speak — now depends.

</div>

<div class="mn-quiz mn-quiz--checkpoint" data-quiz="untold_history_iii-cp4" data-depth="20"><script type="application/json">{"title": "Checkpoint: spaceflight", "questions": [{"q": "The Apollo Guidance Computer was one of the first computers built from…", "options": ["silicon integrated circuits", "vacuum tubes", "mechanical relays", "optical fibres"], "answer": 0, "explain": "Developed at the MIT Instrumentation Laboratory from 1961, it made spaceflight an early, demanding customer of the integrated circuit."}]}</script></div>

<div class="md" data-depth="20">
## 🗂 Representing the World as Data

### The Abstraction of Data: From Types to Tensors


A **data type** classifies a value's representation and permitted operations. The core primitive types in most modern languages:

| Type | Example | Bits (typical) |
|------|---------|----------------|
| `int` | `42` | 32 or 64 |
| `float` | `3.14` | 32 (IEEE 754) |
| `double` | `3.14159265` | 64 (IEEE 754) |
| `str` | `"hello"` | variable |
| `bool` | `true` / `false` | 1 (logical) |

#### A Short History of Data Types

##### The Prehistory: Machines Without Types

The earliest computers, such as \cite[Zuse's Z3]{zusebook} (1941) and the \cite[ENIAC]{eniac1946} (1946), operated on raw binary patterns. The machine made no distinction between an integer, a floating-point number, or an instruction, interpretation was entirely in the mind of the programmer.

##### FORTRAN and the Birth of Explicit Types (1957)

The first major formalization came with **FORTRAN**, designed by \cite[John Backus]{backusfortran} and his team at IBM. FORTRAN introduced the distinction between `INTEGER` and `REAL` (floating-point) variables, determined implicitly by naming convention: variables beginning with I-N were integers, all others were real. This was the first time a compiler enforced a distinction between numeric types.

##### ALGOL 60 and Explicit Type Declarations (1960)

The \cite[ALGOL 60 report]{algol60report}, edited by **Peter Naur**, introduced *explicit type declarations*. Programmers now wrote `integer x` or `real y`. ALGOL 60 also introduced the `Boolean` type, named after \cite[George Boole]{bool1854}, whose 1854 *An Investigation of the Laws of Thought* reduced logic to binary algebra. This was the first language to include `Boolean` as a named, first-class data type.
</div>

<div class="md" data-mathlevel="55" data-depth="20">
##### Floating-Point Standardization: IEEE 754 (1985)

While floating-point arithmetic existed from the earliest computers, every manufacturer implemented it differently. The chaos was resolved by \cite[IEEE 754]{ieee754_1985}, primarily the work of **William Kahan** (UC Berkeley, Turing Award 1989). It defined:

$$\text{float (32-bit):}\quad (-1)^s \times 1.m \times 2^{e-127}$$

where $s$ = 1 sign bit, $e$ = 8 exponent bits, $m$ = 23 mantissa bits. The standard was revised in (\cite[IEEE, 2008]{ieee754_2008}) and (\cite[IEEE, 2019]{ieee754_2019}).
</div>

<div class="md" data-depth="20">
##### The Boolean in Programming

- **ALGOL 60** (1960): first language with `Boolean` as a named type.
- **C** (1972): notoriously lacked a dedicated Boolean type, using `int` with the convention $0 = \text{false}$. A `_Bool` type was only added in \cite[C99]{c99standard} (ISO/IEC 9899:1999).
- **Python**: `bool` added as a subclass of `int` in version 2.3 (2003), formalized by \cite[PEP 285]{pep285} (Guido van Rossum, 2002).

##### Type Theory: The Mathematical Foundations

The theoretical underpinning traces to \cite[*Principia Mathematica*]{russell1910principia} (Russell & Whitehead, 1910), developed computationally by \cite[Alonzo Church]{churchsimplytyped} (simply typed lambda calculus, 1940), \cite[Roger Hindley]{hindleytypes} (1969) and \cite[Robin Milner]{milnertypeinference} (1978) with type inference, and \cite[Per Martin-Löf]{martinloeftypetheory} (dependent types, 1971).
</div>

<div class="md" data-depth="20">

#### Arrays: A History of Structured Data

##### Conceptual Roots in Mathematics

The concept of arrays has deep roots in mathematics, particularly in **matrices** and **vectors** from linear algebra. Mathematicians like **Arthur Cayley** (\citeyear{cayleymemoirmatrices}) formalized matrix algebra, providing the theoretical underpinning for what would later become the array data structure in computing.

At its core, an array is an ordered, indexed collection of elements stored in contiguous memory. The concept mirrors ancient tools for structured counting, from notched tally bones — the Lebombo bone (about 43,000 years ago), the wolf bone of Dolní Věstonice (about 27,000) and the Ishango bone (about 20,000) — to the Salamis Tablet (c. 300 BC), which mapped abstract numbers to physical grid coordinates, essentially functioning as a two-dimensional array.

##### Arrays in Early Computing

The earliest computers (Zuse's Z3, ENIAC) operated on raw binary patterns with no formal distinction between data types. The formalization of arrays as a programming construct emerged with high-level languages:

- **FORTRAN (1957)**, Designed by John Backus at IBM, FORTRAN was the first widely-used high-level language and introduced explicit multi-dimensional arrays for scientific computing. A declaration like `DIMENSION A(10,10)` allocated a $10 \times 10$ matrix in memory.
- **ALGOL 60 (1960)**, Introduced explicit type declarations and dynamic array bounds.
- **C (1972)**, Dennis Ritchie's C language exposed arrays as contiguous blocks of memory with pointer arithmetic, giving programmers direct control over memory layout.
</div>

<div class="md" data-mathlevel="45">
##### Why Arrays Matter

Arrays map directly to how computer memory works, sequential, indexed storage. Accessing element $i$ of an array takes constant time $O(1)$ because the memory address can be computed directly:

$$\text{address}(A[i]) = \text{base\_address} + i \times \text{element\_size}$$

This efficiency made arrays the foundation for virtually all higher-level data structures (linked lists, hash tables, heaps, etc.) and algorithms (sorting, searching, matrix operations).
</div>

<div class="md">
#### NumPy: Efficient Arrays for Python

##### The Problem

Python, created by Guido van Rossum in 1991, is an interpreted, dynamically-typed language. Its built-in `list` type is flexible but extremely slow for numerical computation because each element is a full Python object with type information, reference counts, and heap allocation.

##### The Solution

**NumPy** (Numerical Python) was created by **Travis Oliphant** in 2005 by unifying two earlier projects: `Numeric` (1995, Jim Hugunin) and `Numarray` (2001, Space Telescope Science Institute). NumPy introduced the `ndarray`, a homogeneous, fixed-type, n-dimensional array stored in contiguous memory, with operations implemented in C and Fortran.


##### Key Capabilities

- **The `ndarray`**, A homogeneous, fixed-type, n-dimensional array in contiguous memory
- **Vectorised operations**, Elementwise arithmetic in compiled C/Fortran instead of Python loops
- **Broadcasting**, Rules that let arrays of different shapes combine without copying data
- **Linear algebra**, Matrix products, solves, eigenvalues and SVD via BLAS/LAPACK
- **Reductions and indexing**, Fast `sum`/`mean`/`std` over axes, slicing and fancy indexing
- **Random numbers and I/O**, Vectorised RNGs, plus `.npy`/`.npz` and text/binary file I/O

##### Impact

NumPy became the de facto standard array library in Python, underpinning the entire data-science and machine-learning stack:

$$\text{Raw Data} \xrightarrow{\text{Pandas}} \text{Clean Data} \xrightarrow{\text{Scikit-learn / PyTorch}} \text{Model}$$

#### The Broader Ecosystem: Related Libraries

##### SciPy (2001)

Built on NumPy, **SciPy** (by Travis Oliphant, Pearu Peterson, and Eric Jones) provides algorithms for optimization, integration, interpolation, signal processing, linear algebra, and statistics.

##### Matplotlib (2003)

Created by **John D. Hunter**, Matplotlib provides MATLAB-style plotting for Python, enabling visualization of array and DataFrame data.

##### Scikit-learn (2007)

Created by **David Cournapeau** and later developed by INRIA researchers, Scikit-learn provides machine learning algorithms (classification, regression, clustering) that operate on NumPy arrays and Pandas DataFrames.

##### TensorFlow (2015) and PyTorch (2016)

These deep learning frameworks extend the concept of arrays into **tensors**, multi-dimensional arrays that support automatic differentiation and GPU acceleration. A tensor is simply a generalization of arrays to arbitrary dimensions:

$$\text{Scalar} \subset \text{Vector} \subset \text{Matrix} \subset \text{Tensor}$$

- Scalar: rank-0 tensor (single number)
- Vector: rank-1 tensor (1D array)
- Matrix: rank-2 tensor (2D array)
- Tensor: rank-$n$ (general $n$-dimensional array)

#### The Trajectory of Abstraction

| Era | Tool | Abstraction Level |
|-----|------|-------------------|
| 1940s–50s | Raw binary / machine code | Programmer manages every bit |
| 1957 | FORTRAN arrays | Named, typed, indexed collections |
| 1972 | C arrays | Contiguous memory with pointer arithmetic |
| 1995–2005 | NumPy `ndarray` | Vectorized, n-dimensional, C-speed in Python |
| 2008 | Pandas `DataFrame` | Labeled, heterogeneous, SQL-like operations |
| 2015–16 | TensorFlow / PyTorch tensors | Auto-differentiable, GPU-accelerated arrays |

#### Summary

The invention of arrays was not a single event but an evolutionary process, from mathematical matrices, through FORTRAN's first formal array declarations, to the rich ecosystem of NumPy, Pandas, and tensor libraries we use today. Each step removed a layer of manual effort, allowing practitioners to focus on *what* to compute rather than *how* to compute it, ultimately enabling the data science and AI revolution of the 2020s.
</div>

<div class="md" data-depth="20">
### From Text to Tokens

#### Unicode: One Character Set for All Languages

A language model cannot learn from text that a computer cannot represent. The Unicode Standard defines a universal character set and a character-encoding model with three encoding forms, UTF-8, UTF-16 and UTF-32; it also defines equivalent sequences and normalisation, so that the same text can be compared and searched consistently (\cite[Unicode Consortium, 2022]{unicode2022standard}). UTF-8, specified in RFC 3629, preserves the full US-ASCII range while representing the Universal Character Set, which encompasses most of the world's writing systems, and remains compatible with file systems and parsers that expect ASCII (\cite[Yergeau, 2003]{rfc3629}). Without that common representation, a multilingual corpus would be a patchwork of incompatible encodings.

#### Tokenization: From Characters to Subwords

A neural language model does not read characters or words directly; it reads a fixed vocabulary of tokens. Sennrich, Haddow and Birch framed the problem as open-vocabulary translation: a fixed word vocabulary cannot cover rare words, compounds, names and morphology, so they encoded rare and unknown words as sequences of subword units using byte-pair encoding (\cite[Sennrich et al., 2016]{sennrich2016bpe}). SentencePiece extended the idea into a language-independent tokenizer and detokenizer that trains directly from raw sentences, supporting both byte-pair encoding and a unigram language model, and removes the need for language-specific pre-tokenisation (\cite[Kudo and Richardson, 2018]{kudo2018sentencepiece}). Tokenisation is the unnoticed interface between human text and the matrix of integers a model actually sees.

#### Mass Digitization and OCR

The web is not the only corpus. Books had to be converted from ink to bytes, and that required optical character recognition at scale. Tesseract, developed at HP between 1984 and 1994 and released as open source in 2005, is an OCR engine built around line finding, feature classification and an adaptive classifier; its own history describes it as an attempt to read print that earlier commercial engines handled poorly except on the best quality pages (\cite[Smith, 2007]{smith2007tesseract}). Google Books later made more than 40 million books discoverable in more than 400 languages, while explicitly framing the project around respecting publishers, copyright and libraries (\cite[Google, 2026]{googlebooks_history}). The training corpus of a large model is therefore a layered artefact: print, scan, OCR, correction, and only then text.

</div>

<div class="md" data-depth="20">

### The Languages That Carry the Machine: A History of Programming Languages

Every line of code that trains, serves, or evaluates a language model is written in a language invented for an unrelated problem. The transformer, the GPU kernel, the data loader, the evaluation harness and the chat interface are all artefacts of an eighty-year chain that grew out of weapons calculations, business data processing, telephone switching, time-sharing and personal computing.

</div>

<div class="md" data-depth="20">

#### Pre-history: the loom, the engine, and the first algorithm

The **Jacquard loom** of 1804 used punched cards to encode a pattern as a chain of binary instructions; **Charles Babbage** borrowed the mechanism explicitly for his unfinished **Analytical Engine** (c. 1833–1871). What the engine lacked was a working *programmer*.

</div>

<div class="md" data-depth="20">

The person who supplied it was **Augusta Ada King, Countess of Lovelace**, whose notes on Luigi Menabrea's 1842 French memoir of a Turin seminar at which Babbage presented his design were published in 1843 in *Taylor's Scientific Memoirs* (\cite[Menabrea & Lovelace 1843]{menabrea_lovelace1843}). Lovelace's *Note A* is the founding charter of computing.

</div>

<div class="md" data-depth="20">

She defines her subject: "by the word *operation*, we mean any process which alters the mutual relation of two or more things, be this relation of what kind it may"; she claims the Analytical Engine is "the material expression of any indefinite function of any degree of generality and complexity, such as for instance, $F(x, y, z, \log x, \sin y, x^p, \text{etc.})$"; and she gives the metaphor every textbook echoes — the Analytical Engine "weaves algebraical patterns just as the Jacquard-loom weaves flowers and leaves" (\cite[Menabrea & Lovelace 1843, Note A]{menabrea_lovelace1843}).

</div>

<div class="md" data-depth="20">

*Note G* contained a detailed table of operations for the computation of the **Bernoulli numbers**, which most historians of computing regard as the world's *first published computer program* (\cite[Menabrea & Lovelace 1843, Note G]{menabrea_lovelace1843}).

</div>

<div class="md" data-depth="20">

#### The first electronic era, 1942–1957

The earliest *implemented* programming language designed for an electronic computer was **Plankalkül**, written by **Konrad Zuse** between 1942 and 1945 for the Z-series of computers he was building in his parents' apartment in Berlin.

</div>

<div class="md" data-depth="20">

Zuse did not get a working compiler for it during the war — the first compiler was not written until Joachim Hohmann's 1975 dissertation — but its design anticipated typed data structures, assignment, subroutines, conditional branches, loops, and even a notation for *list comprehensions*. The first language to be *compiled* into machine code and run on an electronic computer was **Short Code**, designed by John Mauchly in 1949 for the BINAC and UNIVAC. The first *commercial* language with a working compiler was **FORTRAN** (\cite[Backus et al. 1957]{backus1957fortran}).

</div>

<div class="md" data-depth="20">

#### FORTRAN, LISP, and the first two paradigms (1957–1958)

The team's own October 1957 *Programmer's Reference Manual* states the design goal in its opening sentence: "The IBM Mathematical Formula Translating System FORTRAN is an automatic coding system for the IBM 704 EDPM. More precisely, it is a 704 program which accepts a source program written in a language — the FORTRAN language — closely resembling the ordinary language of mathematics, and which produces an object program in 704 machine language, ready to be run on a 704" (\cite[Backus et al. 1957, abstract]{backus1957fortran}).

</div>

<div class="md" data-depth="20">

The same manual stakes the claim that, until then, had been thought impossible: "Object programs produced by FORTRAN will be nearly as efficient as those written by good programmers" (\cite[Backus et al. 1957, abstract]{backus1957fortran}). The result was the first commercially successful high-level language, still in use in modernised form on most of the TOP500 supercomputers.

</div>

<div class="md" data-depth="20">

A very different idea arrived a year later. **John McCarthy** at MIT, looking for a notation that would let a program manipulate *other programs as data*, designed **LISP** (\cite[McCarthy 1960]{mccarthy1960lisp}; \cite[McCarthy 1978]{mccarthy1978history}) in 1958.

</div>

<div class="md" data-depth="20">

McCarthy's 1960 paper opens: "A programming system called LISP (for LISt Processor) has been developed for the IBM 704 computer by the Artificial Intelligence group at M.I.T. The system was designed to facilitate experiments with a proposed system called the Advice Taker, whereby a machine could be instructed to handle declarative as well as imperative sentences and could exhibit 'common sense' in carrying out its instructions" (\cite[McCarthy 1960, introduction]{mccarthy1960lisp}).

</div>

<div class="md" data-depth="20">

In his 1978 *History of LISP*, McCarthy names the twelve features that made LISP a language rather than a notation: "computing with symbolic expressions rather than numbers, … list structure in the memory of a computer, … selector and constructor operations expressed as functions, composition of functions as a tool for forming more complex functions, the use of conditional expressions for getting branching into function definitions, the recursive use of conditional expressions as a sufficient tool for building computable functions, the use of λ-expressions for naming functions, the representation of LISP programs as LISP data, the conditional expression interpretation of Boolean connectives, the LISP function eval that serves both as a formal definition of the language and as an interpreter, and garbage collection as a means of handling the erasure problem" (\cite[McCarthy 1978, introduction]{mccarthy1978history}).

</div>

<div class="md" data-depth="20">

#### ALGOL 60, BNF, and the two democratisations (1960–1964)

In January 1960, an international committee of American and European computer scientists met in Paris to design a single, language-independent notation for algorithms. The *Revised Report on the Algorithmic Language ALGOL 60* (\cite[Naur (ed.) 1963]{naur1963algol}) introduced three ideas that have outlived every later change in the language itself: *nested block structure*, *lexical scoping*, and a mathematically precise notation for describing the syntax of a language — the **Backus–Naur form**.

</div>

<div class="md" data-depth="20">

ALGOL itself never became commercial, but its descendants — Pascal, C, Java, Python, and almost every modern imperative language — are recognisably ALGOL 60 with different punctuation.

</div>

<div class="md" data-depth="20">

**COBOL**, developed under **Grace Hopper** from FLOW-MATIC at Remington Rand, was the first language for *business data processing*; its verbose English-like syntax was a political decision — business managers would not accept a language that looked like mathematics. COBOL dominated commercial data processing for forty years and is still running on the mainframes of the world's banks and airlines.

</div>

<div class="md" data-depth="20">

**BASIC**, designed by **John Kemeny** and **Thomas Kurtz** at Dartmouth in 1964, was the first language aimed at *students who were not mathematics majors*; almost every personal computer of the late 1970s and 1980s — the Apple II, the Commodore PET, the IBM PC, the BBC Micro — booted into a BASIC interpreter. Jean Sammet's 1969 *Programming Languages: History and Fundamentals*, commissioned by IBM to document the field (\cite[Sammet 1969]{sammet1969programming}), is the standard reference for this cohort.

</div>

<div class="md" data-depth="20">

#### Simula, C, Smalltalk, and the paradigms crystallise (1967–1972)

The late 1960s and the early 1970s are when the major paradigms still in use today were first put into working languages. **Simula 67** (\cite[Dahl & Nygaard 1966]{dahl1966simula}), designed by **Ole-Johan Dahl** and **Kristen Nygaard** at the Norwegian Computing Centre in Oslo, was the first language to support *classes* and *objects*.

</div>

<div class="md" data-depth="20">

Simula was originally a simulation language; the object paradigm was an answer to the question of how to model thousands of interacting entities in a single program without drowning the code in nested state. The deeper idea — that a *class* is a type that bundles data with the procedures that operate on it, and that instances of a class can be sent messages to which they respond by executing their own code — was so general that it has since been re-implemented, in slightly different forms, in almost every modern language.

</div>

<div class="md" data-depth="20">

**C** (\cite[Ritchie 1993]{ritchie1993c}), developed by **Dennis Ritchie** at Bell Labs between 1969 and 1973, was a very different kind of project. Ritchie himself: "The C programming language was devised in the early 1970s as a system implementation language for the nascent Unix operating system" (\cite[Ritchie 1993, abstract]{ritchie1993c}).

</div>

<div class="md" data-depth="20">

In the body of the paper he pins the timeline more precisely: "C came into being in the years 1969–1973, in parallel with the early development of the Unix operating system; the most creative period occurred during 1972." The chain runs from Martin Richards's **BCPL** through Ken Thompson's **B** ("BCPL squeezed into 8K bytes of memory and filtered through Thompson's brain") to **NB** ("new B") to **C** (\cite[Ritchie 1993]{ritchie1993c}).

</div>

<div class="md" data-depth="20">

Thompson had written the original Unix in PDP-7 assembler in 1968–69; by the summer of 1973, Ritchie and his team had rewritten the Unix kernel for the PDP-11 in C (\cite[Ritchie 1993]{ritchie1993c}). The result is the language in which Unix, then Linux, then the entire open-source stack of the 1990s and 2000s, were written, and the language in which most of the GPU drivers, BLAS implementations, and numerical kernels that an LLM depends on are still written.

</div>

<div class="md" data-depth="20">

**C++** (\cite[Stroustrup 1993]{stroustrup1993cpp}) began life as **"C with Classes"** in 1979, when **Bjarne Stroustrup** started adding Simula-style classes to C at Bell Labs. Stroustrup's own first sentence: "C++ was designed to provide Simula's facilities for program organization together with C's efficiency and flexibility for systems programming. It was intended to deliver that to real projects within half a year of the idea. It succeeded" (\cite[Stroustrup 1993, abstract]{stroustrup1993cpp}).

</div>

<div class="md" data-depth="20">

The design rules he crystallised explain almost everything about C++'s subsequent trajectory: that "user-defined and built-in types should behave the same relative to the language rules and receive the same degree of support from the language and its associated tools"; that a feature "must be provided in an affordable form," where affordable meant affordable on hardware common among developers rather than on a researcher's machine; and that "C++ is just one language in a system and not a complete system," which is why it had to interoperate cleanly with C, Fortran, and assembler (\cite[Stroustrup 1993, §2.4]{stroustrup1993cpp}).

</div>

<div class="md" data-depth="20">

The timeline: the first C with Classes technical report was published in April 1980; virtual functions were added in 1983; the name **C++** was coined by Rick Mascitti in December 1983; the *C++ Programming Language* book was published in October 1985, which Stroustrup takes as the birth of the commercial language. Release 2.0 followed in 1989 with multiple inheritance and abstract classes; the **Standard Template Library** was added by Alexander Stepanov and merged into the draft standard in 1994, reaching the ISO standard as C++98; the ANSI/ISO standardisation Stroustrup calls "the explosion in interest and use" began in 1989 and produced the **C++98** standard (\cite[Stroustrup 1993, §6]{stroustrup1993cpp}).

</div>

<div class="md" data-depth="20">

C++ has grown, layer by layer, into the language in which most performance-critical modern software (browsers, databases, games, parts of PyTorch and TensorFlow) is still written.

</div>

<div class="md" data-depth="20">

**Smalltalk** (\cite[Goldberg & Robson 1983]{goldberg1983smalltalk}), developed by Alan Kay, Dan Ingalls, and Adele Goldberg at Xerox PARC from the early 1970s, is the purest form of the object-oriented idea: *everything* is an object, even integers, even classes.

</div>

<div class="md" data-depth="20">

Smalltalk came with a complete graphical programming environment, an integrated window system, and a mouse-driven interface — almost the entire personal-computer experience of the 1980s was a Xerox PARC demo, several years late, that Kay and his team had already shipped.

</div>

<div class="md" data-depth="20">

Smalltalk never became mainstream, but the *object model* it codified is the ancestor of Objective-C, Ruby, Python, Java, C#, and every modern language in which a programmer passes an *object* to a function and trusts the function to do the right thing with it.

</div>

<div class="md" data-depth="20">

A second paradigm appeared in 1972, in Marseille. **Prolog**, designed by Alain Colmerauer and Philippe Roussel, was the first *logic programming language*; a program is a set of logical clauses, and *computation* is the process of finding values that satisfy them. Prolog was the language behind much of the European AI research of the 1980s — Japan's Fifth Generation project, much of the expert-systems industry — and it is the conceptual ancestor of every modern system that uses *constraint satisfaction*, *SAT solvers*, or *Datalog* as part of its inference stack.

</div>

<div class="md" data-depth="20">

The same year, 1972, **Niklaus Wirth** at ETH Zürich completed **Pascal** (\cite[Wirth 1974]{wirth1974design}), a small, deliberately clean ALGOL descendant designed to teach structured programming. Two years earlier, Wirth had published "Program Development by Stepwise Refinement," the canonical statement of the discipline (\cite[Wirth 1971]{wirth1971stepwise}).

</div>

<div class="md" data-depth="20">

Pascal's design discipline — *one obvious way to do each thing*, a small number of orthogonal features, a compiler that catches the most common errors — became the template for every modern teaching language, including Python.

</div>

<div class="md" data-depth="20">

The intellectual companion to Pascal was **Edsger Dijkstra**'s "Go To Statement Considered Harmful," published as EWD215 in March 1968 (\cite[Dijkstra 1968]{dijkstra1968goto}). Dijkstra states the problem in the second sentence of the note: "the quality of programmers is a decreasing function of the density of go to statements in the programs they produce."

</div>

<div class="md" data-depth="20">

His explanation is the more lasting contribution: "our intellectual powers are rather geared to master static relations and that our powers to visualize processes evolving in time are relatively poorly developed. For that reason we should do (as wise programmers aware of our limitations) our utmost best to shorten the conceptual gap between the static program and the dynamic process, to make the correspondence between the program (spread out in text space) and the process (spread out in time) as trivial as possible" (\cite[Dijkstra 1968, EWD215]{dijkstra1968goto}).

</div>

<div class="md" data-depth="20">

#### The 1980s and the Internet age (1985–2000)

The 1980s were consolidation rather than invention. C++ added classes, then templates, then exceptions, then the Standard Template Library to C without losing the underlying systems-programming power (\cite[Stroustrup 1993]{stroustrup1993cpp}).

</div>

<div class="md" data-depth="20">

**Ada**, designed under US Department of Defense contract in the early 1980s, was supposed to be a single language in which the entire US military software base could be written; the mandate was withdrawn, but the language survived in avionics, railways, and aerospace.

</div>

<div class="md" data-depth="20">

**MATLAB**, first released by the University of New Mexico and Stanford in 1984, became the lingua franca of numerical linear algebra and signal processing; almost every modern deep-learning framework borrows its notation for matrices and tensors.

</div>

<div class="md" data-depth="20">

**Perl**, released by Larry Wall in 1987, was the first language built around *regular expressions* and *text processing*, and became the default language of the early Web.

</div>

<div class="md" data-depth="20">

The 1990s were the decade in which the World Wide Web rearranged the priorities of every language designer. **Python** (\cite[van Rossum's original tutorial]{vanrossum2009tutorial}), designed by **Guido van Rossum** at CWI in the Netherlands and first released in 1991, was conceived as a teaching language with a clean syntax, dynamic typing, a batteries-included standard library, and an interpreter that could be embedded in almost anything.

</div>

<div class="md" data-depth="20">

Python's role in modern AI is the unintended consequence of two design choices: a syntax so readable that a non-programmer can follow the algorithm, and a C-extension interface so clean that any performance-critical operation can be moved into a compiled library without rewriting the calling code.

</div>

<div class="md" data-depth="20">

NumPy (2005, Travis Oliphant) and its descendants SciPy, pandas, scikit-learn, Matplotlib, Jupyter, PyTorch, and TensorFlow turned Python into the language of data science and machine learning, almost entirely by piggybacking on C, C++, and Fortran underneath.

</div>

<div class="md" data-depth="20">

**Java**, designed by James Gosling and Mike Sheridan at Sun Microsystems and released in 1995, was originally aimed at interactive television and embedded devices. The insight that gave Java its lasting shape — *compile once, run anywhere* by compiling to an intermediate *bytecode* that a virtual machine interprets — turned out to be the right model for the Web browser and for the modern cloud.

</div>

<div class="md" data-depth="20">

**JavaScript**, designed by Brendan Eich at Netscape in 1995 in ten days, was originally a scripting language for animating web pages; after the standardisation of ECMAScript and the rise of Node.js, it became the language of the modern Web frontend and a major backend language, and is now the language in which most of the *interactive* parts of LLM-based products are written.

</div>

<div class="md" data-depth="20">

**PHP**, created by Rasmus Lerdorf in 1995, became the default server-side language of the early Web; by 2010, *Wordpress*, *Drupal*, *MediaWiki*, and most of the other content-management systems in the world were written in PHP, and a substantial fraction of the web's training corpus is PHP source.

</div>

<div class="md" data-depth="20">

**Ruby**, released by Yukihiro Matsumoto in 1995, became the language of the *Ruby on Rails* web framework that powered a generation of startups between 2005 and 2015.

</div>

<div class="md" data-depth="20">

**Haskell**, whose first standard was published in 1990, never went mainstream but its *pure functional* model is the conceptual ancestor of the immutable data structures and pure-function transformations that show up in every modern TensorFlow and PyTorch pipeline.

</div>

<div class="md" data-depth="20">

#### The 2000s and 2010s: parallelism, safety, and the ML era

The languages of the 2000s and 2010s were designed for a world in which almost every program had to be either *parallel* (to use the many cores of a modern CPU) or *safe* (because a single security bug could compromise millions of users).

</div>

<div class="md" data-depth="20">

**C#**, released by Microsoft in 2000 as the successor to Java for the .NET platform, brought object-oriented programming into the Windows ecosystem and is now the language of Unity (the dominant game engine), Xamarin (cross-platform mobile), and a substantial fraction of enterprise backends.

</div>

<div class="md" data-depth="20">

**Go**, designed at Google by Robert Griesemer, Rob Pike, and Ken Thompson and released in 2009, made *concurrency* a first-class feature and made *compilation* fast enough to preserve the edit-build-run loop.

</div>

<div class="md" data-depth="20">

**Rust**, designed by Graydon Hoare at Mozilla and first released in 2010, was the first mainstream language to give the programmer the same low-level control over memory as C and C++ while making the safety properties (no use-after-free, no data race, no null pointer dereference) *enforced by the compiler*.

</div>

<div class="md" data-depth="20">

**Swift**, released by Apple in 2014 to replace Objective-C, brought modern type inference, generics, and functional programming features to iOS and macOS development.

</div>

<div class="md" data-depth="20">

**Julia**, first released in 2012 by Jeff Bezanson, Stefan Karpinski, Viral Shah, and Alan Edelman, was designed to solve the *two-language problem* — the fact that scientists had to prototype in a slow, dynamic language (Python, R, MATLAB) and then rewrite the code in a fast, static language (C, C++, Fortran) before it could be deployed at scale.

</div>

<div class="md" data-depth="20">

Julia is dynamically typed, has an interactive REPL, and dispatches through a JIT compiler whose performance rivals C on numerical workloads.

</div>

<div class="md" data-depth="20">

The most recent entrant, **Mojo**, first released in 2023 by Modular (founded by Chris Lattner, who also designed Swift and the LLVM compiler infrastructure), is a Python-superset language designed explicitly for AI infrastructure — kernel code that can be compiled to run on CPUs, GPUs, and accelerators, with a syntax that a Python programmer can read.

</div>

<div class="md" data-depth="20">

The fact that a major AI-infrastructure company in 2023 felt the need to design an entirely new language for the workload is itself a sign of how far the field has come from FORTRAN and LISP.

</div>

<div class="md" data-depth="20">

#### Why this matters for AI

The numerical kernels of PyTorch and TensorFlow are written in C, C++, and CUDA. The JIT compilers that make Python fast are written in C.

</div>

<div class="md" data-depth="20">

The Python ecosystem is built on a stack whose lowest layers are descended from FORTRAN (via BLAS and LAPACK), C (via CPython, NumPy, and Linux), and C++ (via PyTorch and TensorFlow).

</div>

<div class="md" data-depth="20">

A modern LLM's training set includes enormous quantities of code in Python, JavaScript, Java, C++, C, HTML, CSS, SQL, PHP, TypeScript, Ruby, Go, Rust, and a long tail of less common languages — the model has learned to *generate* code in all of them, because the languages existed.

</div>

<div class="md" data-depth="20">

Strip FORTRAN, and the numerical libraries on which NumPy depends vanish; strip C, and Python, PyTorch, Linux, and CUDA all vanish with it (\cite[Ritchie 1993]{ritchie1993c}); strip ALGOL, and the syntactic conventions of nearly every modern language, the idea of block structure, and the discipline of the compiler as a piece of mathematics vanish (\cite[Naur 1963]{naur1963algol}); strip LISP, and the entire symbolic-reasoning tradition in AI vanishes (\cite[McCarthy 1960]{mccarthy1960lisp}); strip the Jacquard loom and Babbage's borrowed cards, and the very idea of *programming* has no clear ancestor (\cite[Menabrea & Lovelace 1843]{menabrea_lovelace1843}).

</div>

<div class="md" data-depth="20">

Every language was invented to solve a problem that had nothing to do with AI — and every one of them is now load-bearing for the model that wrote this sentence.

</div>

<div class="mn-quiz mn-quiz--checkpoint" data-quiz="untold_history_iii-cp5" data-depth="40"><script type="application/json">{"title": "Checkpoint: programming languages", "questions": [{"q": "What do most historians of computing regard as the first published computer program?", "options": ["Ada Lovelace's Note G, computing the Bernoulli numbers on the Analytical Engine", "Zuse's Plankalkül", "The first FORTRAN compiler", "The Jacquard loom's punched cards"], "answer": 0, "explain": "Lovelace's 1843 notes contained a step-by-step table of operations — a program for a machine that was never finished."}]}</script></div>

<div class="md" data-depth="60">
### The Spreadsheet and the Evolution of Data Usability


#### Prelude: The Paper Ledger Era

Long before computers existed, humanity organized data in **tabular form**. Double-entry bookkeeping, formalized by **Luca Pacioli** in his 1494 work \citetitle{summaarithmetica}, established the grid of rows and columns as the universal language of business data. For nearly 500 years, every accountant, scientist, and clerk worked with ruled paper, pencils, and erasers, manually computing totals, cross-referencing entries, and propagating changes by hand.

The fundamental problem was simple but devastating:

**If one number changes, every dependent calculation must be redone manually.**

A single error in a ledger could cascade through hundreds of cells, requiring hours of recalculation. This was the pain point that electronic spreadsheets would eventually solve.

#### The Mainframe Era: Batch Processing and Punched Cards (1950s–1960s)

##### Data Processing Before Interactivity

The earliest computers (ENIAC, UNIVAC, IBM 701) were not interactive. Users submitted jobs on **punched cards** or magnetic tape, waited hours or days, and received printed output. “Working with data” meant:

1. Encoding data onto cards (one row per card)
2. Writing a FORTRAN or COBOL program to process it
3. Submitting the job to an operator
4. Waiting for batch processing
5. Reading the printed results
6. Finding errors, correcting cards, resubmitting

This workflow was accessible only to trained programmers and operators. The concept of a non-technical person directly manipulating data on a screen did not yet exist.

##### IBM and the Rise of Business Computing

**IBM's System/360** (1964) standardized business computing and introduced the concept of a general-purpose machine that could handle both scientific and commercial workloads. Programs like **RPG** (Report Program Generator, 1959) allowed businesses to produce tabular reports from data files, but the process remained entirely batch-oriented and code-driven.

#### The Time-Sharing Revolution (1960s–1970s)

##### Interactive Computing Arrives

The invention of **time-sharing systems**, where multiple users could interact with a single computer simultaneously via terminals, was the first step toward making computers usable for data work by non-programmers.

Key milestones:

- **CTSS** (Compatible Time-Sharing System, MIT, 1961), first demonstration of interactive multi-user computing
- **Multics** (1964–1969), ambitious time-sharing OS that influenced Unix
- **UNIX** (1969, Ken Thompson & Dennis Ritchie at Bell Labs), made interactive computing practical and portable

##### LANPAR: The Invisible Ancestor (1969)

In 1969, **Rene Pardo** and **Remy Landau** invented **LANPAR** (LANguage for Programming Arrays at Random), a system used internally at Bell Labs and AT&T for budgeting. LANPAR introduced a revolutionary concept:

- Cells in a grid could contain **formulas referencing other cells**
- When one cell changed, all dependent cells **automatically recalculated**
- Users could enter data in **any order** (hence “at random”), the system resolved dependencies automatically

LANPAR was granted U.S. Patent 4,398,249 in 1983 (filed 1970). It is arguably the first true electronic spreadsheet, but it ran on mainframes, had no visual grid interface, and remained unknown outside AT&T. Its inventors spent decades in patent litigation, largely forgotten by history.

##### Autoplan/Autotab (1968)

Around the same time, **General Electric** developed **Autotab**, a mainframe-based system that allowed users to define tables with formulas. It was used for financial planning but, like LANPAR, lacked the interactive visual interface that would later define the spreadsheet.

#### VisiCalc: The Spreadsheet That Sold the Personal Computer (1979)

##### The Origin Story

In the spring of 1978, **Dan Bricklin**, a Harvard Business School student and former programmer at DEC, sat in an accounting class watching his professor erase and recalculate an entire blackboard of numbers after changing a single assumption. Bricklin envisioned an “electronic blackboard”, a visual grid where changing one number would instantly ripple through all dependent calculations.

He partnered with **Bob Frankston**, a skilled MIT programmer, and together they created **VisiCalc** (Visible Calculator), released in October 1979 for the **Apple II**.

<figure>
    <img style="width: 80%; height: auto; display: block; margin: 1em auto;" src="visicalc_screenshot.png" alt="VisiCalc running on an Apple II computer, showing the grid of cells" />
    <figcaption class="md">VisiCalc on an Apple II: the original killer application. Released in 1979, it was the first electronic spreadsheet and convinced a generation of business managers to buy a personal computer (\cite[VisiCalc screenshot]{visicalc_image}).</figcaption>
</figure>

##### Why VisiCalc Was Revolutionary

| Feature | Significance |
|---------|-------------|
| Visual grid of rows and columns | Users could *see* their data as a table, not as code |
| Cell references in formulas | `A1 + B1`, intuitive spatial addressing |
| Automatic recalculation | Change one cell → all dependents update instantly |
| Immediate feedback | Type a number, see the result, no batch submission |
| No programming required | Accountants and managers could use it directly |

##### The “Killer App”

VisiCalc became the first **“killer application”**, software so compelling that people bought hardware specifically to run it. The Apple II's sales exploded. For the first time, businesses purchased personal computers not as curiosities but as essential tools. As Bricklin later reflected:

“VisiCalc took 20 hours of recalculation work and turned it into 15 minutes and a few keystrokes.”

The spreadsheet metaphor, a grid of cells, each containing either a value or a formula, proved so intuitive that it has survived essentially unchanged for over 45 years.
</div>

<div class="md" data-mathlevel="55">
##### The Mathematical Model

A spreadsheet can be formalized as a **directed acyclic graph (DAG)** of cell dependencies. Each cell $C_{i,j}$ contains either a constant $v$ or a function $f$ of other cells:

$$C_{i,j} = f(C_{a,b}, C_{c,d}, \ldots)$$

When any cell's value changes, the system performs a **topological sort** of the dependency graph and recalculates all downstream cells in order:

$$\text{If } C_{1,1} \text{ changes} \implies \text{recalculate all } C_{i,j} \text{ where } C_{1,1} \in \text{deps}(C_{i,j})$$

This automatic propagation of changes through a dependency graph is the core innovation that separates a spreadsheet from a static table.
</div>

<div class="md" data-depth="20">
#### Lotus 1-2-3: The IBM PC Era (1983)

##### The Shift to IBM

When IBM released the **IBM PC** in 1981, VisiCalc was slow to port. **Mitch Kapor**, a former VisiCalc product manager, seized the opportunity and founded **Lotus Development Corporation**. In January 1983, he released **Lotus 1-2-3**.

##### Why “1-2-3”?

The name reflected three integrated capabilities:

1. **Spreadsheet**, the core grid calculation engine
2. **Charting**, built-in graphing of data (bar charts, line graphs, pie charts)
3. **Database**, basic sorting, filtering, and querying of tabular data

##### Technical Advantages

Lotus 1-2-3 was written in **x86 assembly language**, making it dramatically faster than VisiCalc on IBM PC hardware. It also introduced:

- **Named ranges**, referring to cell groups by name rather than coordinates
- **Macros**, sequences of keystrokes that could be recorded and replayed, enabling automation
- **Larger grid sizes**, 2,048 rows × 256 columns (vs. VisiCalc's 254 × 63)

##### Market Dominance

Lotus 1-2-3 became the best-selling software in the world and the primary reason businesses bought IBM PCs. It dominated the market from 1983 to approximately 1995, establishing the spreadsheet as the universal tool of business analysis.

#### Microsoft Excel: The Graphical Revolution (1985–Present)

##### Origins

**Microsoft Excel** was first released in 1985, for the **Apple Macintosh**, not for DOS. Microsoft recognized that the Mac's graphical user interface (GUI) offered a fundamentally better experience for spreadsheet work: direct manipulation with a mouse, WYSIWYG formatting, and visual selection of cell ranges.

The Windows version followed in 1987 (Excel 2.0), and by the early 1990s, as Windows overtook DOS, Excel began its ascent over Lotus 1-2-3.

##### Key Innovations Over Time

| Year | Feature | Impact |
|------|---------|--------|
| 1985 | GUI-based interaction | Mouse-driven cell selection, visual formatting |
| 1993 | Visual Basic for Applications (VBA) | Full programming language embedded in spreadsheet |
| 1997 | Pivot Tables (refined) | One-click data summarization and cross-tabulation |
| 2007 | .xlsx format (Office Open XML) | Expanded limits: 1,048,576 rows × 16,384 columns |
| 2010 | PowerPivot / DAX | In-memory columnar engine for millions of rows |
| 2013 | Power Query (Get & Transform) | ETL (Extract, Transform, Load) without code |
| 2016 | Integration with Power BI | Bridge from spreadsheet to enterprise analytics |
| 2023 | Copilot (AI integration) | Natural language formulas, automated analysis |

##### Excel as a Programming Language

Excel and it's competitor's (like LibreOffice's Calc) formula system is, in computer science terms, a **purely functional, lazy-evaluated, reactive programming language** operating over a two-dimensional namespace. Modern Excel (with LAMBDA, LET, MAP, REDUCE, and dynamic arrays) is **Turing-complete**, capable, in theory, of computing anything any programming language can compute.

The cell formula:

```
=LAMBDA(x, x^2 + 2*x + 1)(5)
```

is functionally equivalent to:

$$f(x) = x^2 + 2x + 1, \quad f(5) = 36$$

#### Beyond Spreadsheets: The Evolution of Data Usability
</div>

<div class="md" data-mathlevel="50" data-depth="20">
##### The Database Revolution: From Filing Cabinets to SQL

While spreadsheets handle ad-hoc analysis, **databases** manage structured storage at scale.

- **IMS** (IBM, 1966), hierarchical database for the Apollo program
- **CODASYL** (1969), network model databases
- **Edgar F. Codd's Relational Model** (1970), the paper *“A Relational Model of Data for Large Shared Data Banks”* proposed organizing data into **tables** (relations) with rows (tuples) and columns (attributes), queried through a declarative language
- **SQL** (Structured Query Language, 1974), developed by Donald Chamberlin and Raymond Boyce at IBM, based on Codd's relational algebra:

$$\sigma_{\text{age} > 30}(\text{Employees}) \equiv \texttt{SELECT * FROM Employees WHERE age > 30}$$

- **Oracle** (1979), **IBM DB2** (1983), **Microsoft SQL Server** (1989), commercial implementations
- **MySQL** (1995), **PostgreSQL** (1996), open-source alternatives that democratized database access
- **SQLite** (2000), embedded database requiring no server, now deployed on billions of devices
</div>

<div class="md" data-depth="20">
##### Statistical Software: Purpose-Built Data Tools

For researchers who needed more than spreadsheets could offer:

| Software | Year | Purpose |
|----------|------|---------|
| **SPSS** | 1968 | Social science statistics (point-and-click interface) |
| **SAS** | 1976 | Enterprise analytics, clinical trials |
| **S** (Bell Labs) | 1976 | Statistical computing language |
| **R** (open-source S) | 1993 | Academic statistics and visualization |
| **Stata** | 1985 | Econometrics and biostatistics |
| **MATLAB** | 1984 | Matrix computation, engineering simulation |

Each represented a different trade-off between usability and power. SPSS offered menus and dialogs for non-programmers; R and MATLAB offered programming languages for those willing to learn code.

##### Python


The Python stack (Pandas + Matplotlib + Scikit-learn + Jupyter Notebooks) represents the modern equivalent of what VisiCalc did in 1979: making data work accessible to people who think in terms of *problems*, not *implementations*.

##### Jupyter Notebooks (2014)

**Project Jupyter** (evolved from IPython, created by Fernando Pérez in 2001) introduced the **computational notebook**, a document combining:

- Executable code cells
- Rich text (Markdown, LaTeX)
- Inline visualizations
- Interactive widgets

This format mirrors the spreadsheet's core insight (immediate feedback, visible results) while extending it to arbitrary programming. A Jupyter notebook is, conceptually, a spreadsheet where each “cell” can contain any computation, not just a formula over a grid.

#### Business Intelligence and the “No-Code” Movement

##### The BI Stack (2000s–2020s)

As data volumes exceeded what spreadsheets could handle, **Business Intelligence (BI)** tools emerged:

| Tool | Year | Innovation |
|------|------|------------|
| **Tableau** | 2003 | Drag-and-drop visual analytics |
| **QlikView** | 1993 | Associative in-memory data model |
| **Power BI** | 2015 | Microsoft's cloud BI, integrated with Excel |
| **Looker** | 2012 | SQL-based semantic modeling |
| **Metabase** | 2015 | Open-source, question-based interface |

These tools continued the trajectory of abstraction:

$$\text{Punched cards} \to \text{SQL} \to \text{Spreadsheets} \to \text{Drag-and-drop BI} \to \text{Natural language queries}$$

##### The AI-Powered Future (2023–Present)

The latest evolution integrates **large language models** directly into data tools:

- **Excel Copilot**: “Create a pivot table showing quarterly revenue by region”
- **ChatGPT Code Interpreter**: upload a CSV, ask questions in natural language
- **Pandas AI**: natural language queries over DataFrames
- **Databricks Assistant**: AI-generated SQL and Python for data engineering

This represents the logical endpoint of the abstraction trajectory: the user describes *what* they want in human language, and the system generates the *how* (formulas, code, queries) automatically.

#### The Trajectory of Data Usability

| Era | Tool | Who Could Use It | Barrier to Entry |
|-----|------|------------------|------------------|
| Pre-1800s | Paper ledgers | Trained clerks | Literacy, arithmetic |
| 1890s | Hollerith machines | Trained operators | Physical card encoding |
| 1950s–60s | Mainframe batch | Programmers only | FORTRAN/COBOL expertise |
| 1970s | Time-sharing terminals | Technical staff | Command-line fluency |
| 1979 | VisiCalc | Business professionals | Minimal, visual grid |
| 1983 | Lotus 1-2-3 | Office workers | Basic computer literacy |
| 1985–present | Microsoft Excel | Nearly everyone | Almost none |
| 2006 | Google Sheets | Anyone with internet | None (free, browser-based) |
| 2010s | BI tools (Tableau, Power BI) | Analysts | Drag-and-drop familiarity |
| 2020s | AI-powered tools | Anyone who can speak | Natural language |

Each generation reduced the barrier between a human with a question and the data that holds the answer. The progression follows a clear pattern:

$$\text{Abstraction} \uparrow \implies \text{Barrier to entry} \downarrow \implies \text{Number of users} \uparrow$$

#### Summary

The history of “Excel-like things” is fundamentally a history of **making data manipulation accessible to non-programmers**. From Pacioli's ruled ledgers through LANPAR's automatic recalculation, VisiCalc's visual grid, Lotus's integrated charting, Excel's GUI and VBA, Google Sheets' collaboration, to today's AI-powered natural language interfaces, each step removed a layer of technical friction between humans and their data.

The spreadsheet's enduring genius lies not in computational power (Python and SQL are vastly more capable) but in its **cognitive fit**: the two-dimensional grid mirrors how humans naturally think about structured information. Rows are records. Columns are attributes. Cells are facts. Formulas are relationships. This mental model, unchanged since 1979, has proven more durable than any specific technology, and every successor, from Pandas DataFrames to BI dashboards, ultimately pays homage to it.

All these developments, even though they were focussed for the normal user, are now used by data scientists creating systems like LLM as well, as well as the algorithms developed for those tools.
</div>

<div class="md" data-depth="20">
## 📡 Networks, Corpora, and Permission

### The Industrial Stack

#### Logistics: The Container and the Supply Chain

Before a GPU can be trained, it has to be moved. Containerisation turned freight into a standard unit that could pass from ship to truck to rail without unloading its contents. Malcolm McLean's 1958 patent for an "Apparatus for shipping freight" describes containers carried on a ship's deck and handled as units, with the cargo protected inside the container (\cite[McLean, 1958]{mclean1958container}). The patent is not a theory of logistics; it is the physical interface that made global supply chains possible. The same logic governs the AI stack: silicon wafers, memory stacks, server racks and cooling equipment are moved through a small number of ports, fabs and assembly sites, and a disruption at one node propagates through the whole system.

#### Operations Research: The Simplex and the Schedule

Linear programming is the mathematics of doing the best you can under constraints. Dantzig's *Linear Programming and Extensions* presents the concepts, origins and formulations of linear programs and the simplex method, applied to prices, matrix games and transportation problems, together with the convex-set and linear-space background needed for duality and network problems (\cite[Dantzig, 1963]{dantzig1963linear}). The simplex method is a procedure for solving systems of linear inequalities by moving from one feasible vertex to a better one. The same shape of problem, an objective plus constraints, appears in scheduling, supply chains, portfolio choice and, in a different mathematical form, in the training of neural networks.

#### Banking, SABRE, and OLTP

A reservation system is a database that many people update at once, and it must never sell the same seat twice. SABRE was a completely automatic, centralized electronic airline reservations system developed by IBM for American Airlines after six years of joint research (\cite[IBM, 1960]{sabre1960reservation}). Making such a system reliable required a theory of transactions. Harder and Reuter provided a terminological framework for transaction-oriented recovery, introducing the materialized database, propagation strategy and checkpoint, and classifying logging techniques by the speed and scope of recovery and the amount of redundant information required (\cite[Härder and Reuter, 1983]{harder1983transactions}). Banks, airlines and reservation desks were the first customers for systems that had to stay correct while failing and recovering.

#### Weather, Seismic Imaging, and HPC

Two geophysical problems helped build the market for large-scale numerical computation. Richardson's 1922 *Weather Prediction by Numerical Process* reduced forecasting to a set of computing forms and imagined a "forecast-factory" in which thousands of human computers worked in parallel; he called the hope of computing faster than the weather advances "a dream" (\cite[Richardson, 1922]{richardson1922weather}). Exploration seismology posed the inverse problem in a different form: Claerbout's *Earth Soundings Analysis* treats seismic processing as adjoint modelling and inversion, using conjugate-gradient methods for problems with dimensions from one to many millions because matrix inversion and singular-value decomposition are limited to matrices of about a thousand (\cite[Claerbout, 1992]{claerbout1992earth}). Weather and oil exploration were early, demanding customers for parallel computers, fast transforms and numerical linear algebra, long before those techniques were called machine learning.

</div>

<div class="md" data-depth="20">
### The Internet and the Web: The Training Corpus

#### The pre-history: the Memex and hypertext (1945–1968)

Before there was an *internet*, there was a **vision** of what a linked, machine-augmented information system should be — drawn, not built, for two decades. It is the direct prehistory of the web, and of the training corpus the web made.

**Vannevar Bush — "As We May Think" (1945).** In July 1945 the American engineer and science administrator Vannevar Bush published \cite[As We May Think (1945)]{aswemaythink} in *The Atlantic Monthly*. Its central image was the **\cite[Memex]{memex}**: a desk-sized device holding the *entire record* of a person's books, letters, and notes as microfilm — plus, the crucial part, a way to **link** any one item to any other by laying down a "trail" through them. You did not merely find a document; you could follow the associative trail you had previously laid, exactly the way you follow a hyperlink today. The Memex was not a search engine; it was a *library that remembered your paths through it* \cite[As We May Think (1945)]{aswemaythink}.

<figure>
	<img style="width: 100%; height: auto; display: block;" src="memex_diagram.jpg" alt="The Memex: microfilm banks holding a person's complete record, with a desk and a way to lay down 'trails' linking items" />
	<figcaption class="md">The Memex, as illustrated in *Life* magazine (September 10, 1945): microfilm banks holding a person's complete record, with a desk and a mechanism for laying down "trails" that link one item to another. Public domain (Life / Time Inc. illustration).</figcaption>
</figure>

\marginfig{vannevar_bush_portrait.jpg}{Vannevar Bush (1890–1974). Public domain (U.S. Treasury / Library of Congress).}

**Douglas Engelbart — "Augmenting Human Intellect" (1962), and the "Mother of All Demos" (1968).** Bush wrote a vision; Engelbart proposed a *science* of it. In \cite[Augmenting Human Intellect (1962)]{augmentinghumanintellect} he argued the computer's purpose was to **augment** human problem-solving — to extend the mind, not replace it — and sketched the tools (hypertext, shared displays, collaborative editing) to do it. On **December 9, 1968**, his team's ninety-minute demonstration, now called the \cite["Mother of All Demos" (1968)]{motherofalldemos}, showed most of it *working*: the computer **mouse**, **hypertext** documents, a **shared screen**, a **real-time collaborative text editor**, and videoconferencing — two decades before any of it was ordinary.

\marginfig{sri_computer_mouse_1968.jpg}{The computer mouse, demonstrated at the "Mother of All Demos" (December 9, 1968). CC BY-SA 3.0, SRI International.}

**Ted Nelson — the word "hypertext" (1965).** The name came from **\cite[Ted Nelson]{tednelson}**, who coined the word **"hypertext"** in his 1965 paper *Complex Information Processing* and spent the next decades chasing the vision he called **Xanadu**: information you can **access randomly** (not just in reading order), **link** in both directions, and **version** over time \cite[hypertext, coined by Nelson (1965)]{tednelsonhypertext}.

\marginfig{ted_nelson.jpg}{Ted Nelson (b. 1937), who coined the word "hypertext" (1965). CC BY-SA 3.0, Dgies.}

**The thread.** Read in order, the three are a single idea: **information as a linked, traversable space that augments the mind** — Bush's *Memex* (the vision), Engelbart's *demo* (the working proof), Nelson's *hypertext* (the name and the ambition). It is the same idea \cite[Licklider's man–computer symbiosis (1960)]{licklider} gave a phrase to — *extend the mind, don't replace it* — which this course returns to in [Software](software.php). The web is what this thread eventually became: the next step is where the chain stops being a drawing and becomes a machine.

#### ARPANET: Connecting the First Nodes


In 1969, the **Advanced Research Projects Agency Network (ARPANET)** transmitted its first message between UCLA and the Stanford Research Institute, the machine crashed after sending the letters “LO” (of an intended “LOGIN”). The network's purpose was military resilience and academic resource-sharing, documented in \citetitle{rfc1} by **Steve Crocker**. By 1971, ARPANET connected 15 nodes. By 1973, it had crossed the Atlantic. The foundational idea, that heterogeneous computers could exchange data through a shared, decentralized protocol, was radical, but it was *not* about making information public. ARPANET was a closed network for researchers and defense contractors.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="arpanet_map.png" alt="ARPANET logical map, March 1977, showing the network's topology with dozens of nodes and links across the United States" />
    <figcaption class="md">The \citealternativetitle{arpanet_map}: the logical topology of the ARPANET in March 1977. What began as a four-node experimental network in 1969 would, a generation later, become the technical substrate of the modern Internet, and thus of every web-scale corpus on which an LLM is trained.</figcaption>
</figure>

#### TCP/IP: A Universal Language for Machines

ARPANET's original protocols were rigid and network-specific. In \citeyear{cerfkahn}, **Vint Cerf** and **Bob Kahn** proposed the **Transmission Control Protocol / Internet Protocol (TCP/IP)** in \citetitle{cerfkahn}, a universal standard that allowed *any* network to interconnect with *any* other. When ARPANET adopted TCP/IP on January 1, 1983, the so-called “flag day”, the *internet* as a network of networks was born. This was the critical infrastructural layer: a single, open protocol suite that allowed global-scale data exchange, independent of any particular hardware vendor or government.

#### Tim Berners-Lee and the World Wide Web

The internet connected machines. The **World Wide Web** connected *documents*. In March 1989, **Tim Berners-Lee**, a software engineer at CERN, circulated \citetitle{bernerslee1989}, a memo proposing a system of interlinked hypertext documents accessible over the internet. By December 1990, he had built the first web server, the first web browser, and the first web page. The three pillars he created, **HTML** (a markup language for documents), **HTTP** (a protocol for transferring them), and **URLs** (a system for addressing them), transformed the internet from a communication tool for specialists into a **public, self-publishing platform for all of humanity**.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="first_web_browser.png" alt="Screenshot of the WorldWideWeb browser running on a NeXT computer, showing an early web page with hyperlinked text" />
    <figcaption class="md">The \citealternativetitle{first_web_browser}: a screenshot of the WorldWideWeb browser running on a NeXT workstation in December 1990. Built by Tim Berners-Lee at CERN, it was simultaneously editor and viewer for the world's first hypertext web pages.</figcaption>
</figure>

The consequences were staggering. Within a decade, millions of people were voluntarily uploading text: personal websites, forums, blogs, news articles, encyclopedias, academic papers, product reviews, fan fiction, legal opinions, recipes, poetry, code repositories, and every other form of human expression. By the 2010s, organizations like **\citetitle[Common Crawl]{commoncrawl}** were archiving billions of web pages, creating open datasets of hundreds of terabytes of raw text.

#### The Web as Training Corpus

This is the direct, causal link to modern AI. A large language model learns by ingesting text, as much text as possible, in as many domains, registers, and languages as possible. The datasets that power models like GPT-3 and its successors (such as \citetitle[Common Crawl]{commoncrawl}, and \cite[Wikipedia dumps]{wikimediadumps}) are direct products of the Web's open, self-publishing architecture. Without Berners-Lee's decision to make the Web royalty-free and without the open protocols of TCP/IP, the digital text generated by humanity would have remained fragmented across proprietary, incompatible, and inaccessible systems, bulletin boards, corporate intranets, and gated databases. There would be no single, crawlable, interlinked ocean of human language.

As noted elsewhere in this history, the \cite[Bitter Lesson]{sutton2019bitter} teaches that scale and data ultimately outperform hand-crafted rules. But scale requires *something to scale on*. The World Wide Web provided exactly that: a self-assembling, ever-growing corpus of human thought, freely accessible and machine-readable. ARPANET gave machines the ability to talk to each other. TCP/IP gave them a common language. The World Wide Web gave humanity a reason to pour its collective knowledge into the network. And that collective knowledge became the raw material from which a language model learns to speak.

</div>

<div class="md" data-depth="20">
### The Human Corpus

#### Labeling: The Invisible Workforce

A dataset is not found; it is made. ImageNet reports 12 subtrees with 5,247 synsets and 3.2 million images, each concept quality-controlled and human-annotated, and its construction explicitly relied on Amazon Mechanical Turk (\cite[Deng et al., 2009]{deng2009imagenet}). The same pattern recurs at the frontier: InstructGPT began with labeler-written prompts and prompts submitted through the OpenAI API, collected labeler demonstrations of desired behaviour, and used human feedback to fine-tune the model (\cite[Ouyang et al., 2022]{ouyang2022instructgpt}). The "human in the loop" is not a metaphor. It is a workforce, often invisible in the final paper, whose judgements become the labels and preferences that shape the model.

#### Benchmarks: How Progress Became Measurable

Shared benchmarks turned machine learning from a collection of demonstrations into a scoreboard. GLUE offered nine diverse natural-language-understanding tasks, a diagnostic dataset and an online evaluation platform (\cite[Wang et al., 2018]{wang2018glue}). SQuAD contributed more than 100,000 questions posed by crowdworkers on Wikipedia articles, with the answer required to be a segment of the passage; human performance was 86.8 F1 against a logistic-regression baseline of 51.0 (\cite[Rajpurkar et al., 2016]{rajpurkar2016squad}). MMLU then measured 57 tasks across elementary mathematics, US history, computer science, law and more (\cite[Hendrycks et al., 2021]{hendrycks2021mmlu}). HELM added a multi-metric evaluation of 30 models on 16 core scenarios, measuring accuracy, calibration, robustness, fairness, bias, toxicity and efficiency (\cite[Liang et al., 2022]{liang2022helm}), while Chatbot Arena evaluated models by pairwise human preference and had amassed more than 240,000 votes (\cite[Chiang et al., 2024]{chiang2024arena}). Benchmarks make progress comparable, but they also decide which progress counts.

#### The Data Pipeline: Crawl, Clean, Deduplicate

The web is raw material, not a dataset. C4, the Colossal Clean Crawled Corpus, was built for a systematic study of transfer learning and text-to-text unification (\cite[Raffel et al., 2020]{raffel2020c4}). The Pile assembled an 825 GiB English corpus from 22 diverse, high-quality subsets, many from academic or professional sources, on the argument that dataset diversity improves cross-domain generalisation (\cite[Gao et al., 2020]{gao2020pile}). Deduplication then turns a pile into a training set: Lee et al. found duplicates in all four common NLP datasets they studied, proposed exact substring matching and approximate document matching, and showed that deduplication reduces verbatim memorisation and train-test overlap (\cite[Lee et al., 2022]{lee2022dedup}). Crawl, filter, deduplicate, document: the corpus is an engineered object at every stage.

</div>

<div class="md" data-depth="20">
### The Permission Layer

#### Copyright and Text Mining

Training data is also a legal object. The EU Directive 2019/790 created a mandatory exception for text and data mining for research organisations (Article 3) and a broader exception for reproductions and extractions of lawfully accessible works for text and data mining, unless the rightholders have expressly reserved the use in an appropriate machine-readable manner (Article 4) (\cite[European Union, 2019]{eu2019dsm}). In the United States, the Second Circuit held in *Authors Guild v. Google* that Google's unauthorised digitisation of copyright-protected books, its search functionality and its snippet display were non-infringing fair uses, because the purpose was highly transformative, the display was limited and the result was not a significant market substitute (\cite[Second Circuit, 2015]{authorsguild2015google}). The permission layer does not determine what is technically possible; it determines what may be kept long enough to train on.

#### Privacy and Data Protection

The GDPR governs personal data. It requires processing to be lawful, fair and transparent, collected for specified purposes, adequate and limited to what is necessary, accurate and kept no longer than necessary (Article 5), and it permits processing only on a lawful basis such as consent, contract, legal obligation or legitimate interests (Article 6) (\cite[European Union, 2016]{eu2016gdpr}). It also grants a right to erasure, the "right to be forgotten" (Article 17) (\cite[European Union, 2016]{eu2016gdpr}). A web-scale corpus inevitably contains personal data, so the legal question is not whether privacy applies but how the training pipeline handles it.

#### Export Controls and the Geopolitics of Compute

At the hardware layer, permission is geopolitical. The U.S. Bureau of Industry and Security states that a licence is required to export advanced computing items to entities headquartered in Country Group D:5 or Macau, or with an ultimate parent company headquartered there, even if the entities themselves are located outside those regions; it also describes rules for authorised integrated-circuit designers (\cite[BIS, 2026]{bis2026advancedcomputing}). Compute is therefore not a neutral commodity. The fastest chips are subject to export controls, and the map of who can train what is drawn partly by trade law.

</div>

<div class="md" data-depth="40">
## 🏛 Institutions and Budgets

### The School: Mass Literacy and the Human-Capital Budget

A model is trained on text, but the text was written by people who had learned to read and write. The school system is therefore a prerequisite of the corpus, and the university is a prerequisite of the research community. This section traces the institutional machinery that produces literate, numerate, specialised people.

#### The School Before the State

Luther's 1524 letter to the councillors of all German cities is an early call for public schooling: its title asks the city fathers to establish and maintain Christian schools (\cite[Luther, 1524]{luther1524schools}). A century later, the Massachusetts Bay Colony ordered every township of fifty households to appoint a teacher of reading and writing, and every township of one hundred households to set up a grammar school able to prepare youth for the university, with a fine for towns that neglected the order (\cite[Massachusetts Bay Colony, 1647]{mass1647deluder}). These schools were religious and civic in purpose, not economic; but they created a reading population, and a reading population is the raw material of a text corpus.

#### The Common School and Compulsory Education

The modern school system is a creation of the nineteenth century. The Elementary Education Act 1870 was "an Act to provide for public Elementary Education in England and Wales"; it created school boards, tied school provision to the local rate, and made the state responsible for elementary education (\cite[Parliament of the United Kingdom, 1870]{uk1870education}). Mass schooling standardised literacy and numeracy, created a common curriculum, and produced the clerks, teachers, technicians and readers on whom industry and administration depend. The school is the institution that turns a population into a workforce and an audience.

#### The Public Library

Schooling is the floor, not the ceiling. The Public Libraries Act 1850 enabled town councils to establish public libraries and museums, and it made admission to them free (\cite[Parliament of the United Kingdom, 1850]{uk1850libraries}). The public library extended reading beyond the years of formal schooling and beyond the ability to buy books; it was a self-education institution. For a technical civilisation, the library is a distributed memory.

#### The Immigration Valve

A school system produces human capital nationally, but AI research is international. The Immigration and Nationality Act of 1965 removed national-origin, race and sex discrimination from visa issuance and created preferences for members of the professions and for people of exceptional ability in the sciences or arts (\cite[U.S. Congress, 1965]{us1965immigration}). The Immigration Act of 1990 created the H-1B category for temporary workers in a "specialty occupation" requiring specialised knowledge and at least a bachelor's degree, with an annual cap (\cite[U.S. Congress, 1990]{us1990h1b}). The result is a global labour market for scientists and engineers: the school systems of many countries feed the research labs of a few.

> **Open questions.** Who gets educated, and who is excluded? What curriculum produces a person who can read a paper, write code, and label data? How much of AI's human capital is imported? What happens to the pipeline when borders close?

</div>

<div class="md" data-depth="40">
### The Republic of Science

#### The University and the Grant

Modern AI is a scientific community before it is a product. The U.S. National Science Foundation was established in 1950, after Vannevar Bush's 1945 report *Science: The Endless Frontier* envisioned a federal agency that would promote the progress of science by supporting basic research at colleges and universities (\cite[NSF, 2026]{nsf_history}). Before the Second World War the federal government played a minor role in supporting research at American universities; the postwar arrangement made curiosity-driven research a permanent, publicly funded institution (\cite[NSF, 2026]{nsf_history}). The grant, the peer-review panel and the university laboratory are therefore part of the technical stack, even though they produce no electrons.

#### The Preprint

The preprint server shortened the feedback loop. arXiv was founded by Paul Ginsparg in 1991 and now hosts more than three million scholarly articles in eight subject areas; it is a curated research-sharing platform, not a peer-reviewed journal, and its submissions are checked for topicality and scholarly value but not for correctness (\cite[arXiv, 2026]{arxiv_about}). That distinction matters: the preprint made results visible before review, and the machine-learning community built its rapid iteration on that visibility. The conference paper and the arXiv posting, not the journal article, became the working memory of the field.

#### Open Source: The Commons That Runs the Stack

The software stack is a commons. Git began in 2005, when the Linux kernel community's free use of the proprietary BitKeeper was revoked and Linus Torvalds built a replacement with speed, simple design, strong support for non-linear development, full distribution and efficient handling of large projects as goals (\cite[Chacon and Straub, 2014]{git_history}). The Linux kernel itself had been maintained through patches and archived files since 1991, and Git made the distributed collaboration that followed practical (\cite[Chacon and Straub, 2014]{git_history}). The GNU General Public License supplied the legal machinery: it grants the freedoms to use, study, modify and share the software, provided the same freedoms are preserved downstream (\cite[Free Software Foundation, 1991]{spdx_gpl2}). PyTorch, TensorFlow, NumPy and Linux are not incidental tools; they are the shared infrastructure on which reproducible AI depends.

#### Standards Bodies

The final layer is the committee. RFC 2026 documents the Internet standards process: it defines the stages by which a specification moves from proposed standard to draft standard to Internet standard, the types of documents used, and the intellectual-property and copyright rules that accompany the process (\cite[Bradner, 1996]{rfc2026}). The Unicode Consortium performs the same function for text, maintaining a single character set and encoding model so that a document written on one system can be read on another (\cite[Unicode Consortium, 2022]{unicode2022standard}). Standards are slow, boring and indispensable: they are how a heterogeneous world agrees on the shape of the bits.

</div>

<div class="md" data-depth="40">
### The Body, the City, and the State: The Human and Political Budgets

The previous part followed the budgets of matter and energy. This part follows the budgets of people, places and permission: the health that lets children survive to become workers and readers, the city that concentrates them, the census that makes them legible, the trial that turns experience into evidence, the spectrum that carries signals, and the thermodynamic bill that every computation must pay.

#### The Clinic: Public Health and the Demographic Budget

Before a society can have schools, laboratories or data centers, its children have to survive. Snow's 1855 investigation of cholera in Broad Street traced the outbreak to a single water pump and used a map of deaths to show that the cases clustered around it; the lesson was that epidemic disease is a problem of infrastructure, not fate (\cite[Snow, 1855]{snow1855cholera}). The demographic result is stark: the UN's 2024 World Population Prospects puts the global population at 8.2 billion in 2024 and projects about 10.3 billion in the mid-2080s, with global life expectancy at birth at 73.3 years in 2024, 8.4 years more than in 1995 (\cite[UN DESA, 2024]{un2024wpp}). Public health and sanitation, together with later vaccines and antibiotics, were part of the mortality decline that produced the population which staffs the schools and laboratories. The clinic is therefore a prerequisite of the human-capital budget, not a separate story.

> **Open questions.** How much of the AI workforce exists because of the mortality decline? Which public-health failures still constrain the talent pool? What is the demographic bill of an ageing research population?

#### The City: Density, Sanitation, and the Urban Stack

Public health became an urban problem because the city concentrates people and waste. The Public Health Act 1848 was "An Act for promoting the Public Health" and placed the supply of water, sewerage, drainage, cleansing and paving under a local board of health (\cite[Parliament of the United Kingdom, 1848]{uk1848publichealth}). The city also had to regulate vertical space: New York's 1916 Building Zone Resolution regulated the height and bulk of buildings, the area of yards and courts, and the location of trades and industries, creating the modern zoning map (\cite[New York City, 1916]{nyc1916zoning}). Density is what makes networks, markets, universities and data centers possible; it is also what makes them vulnerable. The city is a machine for concentrating people, and computation inherits its concentration.

> **Open questions.** Why do data centers cluster where they do? What is the urban footprint of a cloud region? Can the city be made resilient without making it exclusionary?

#### The Census: The State as a Data Machine

A state that cannot count its people cannot tax, conscript, educate or plan for them. The United States has collected population data since 1790 and every ten years since (\cite[U.S. Census Bureau, 2026]{uscensus1790}). The 1890 census was the occasion for Hollerith's punched-card tabulator, which turned a constitutional headcount into a data-processing problem (\cite[Hollerith, 1890]{hollerith1890}). The census is the state's data machine: it standardises categories, defines populations, and produces the statistical substrate on which policy, markets and research depend. The data center is, in part, the descendant of the census office.

> **Open questions.** Who is counted, and who is missed? How do categories shape policy? What would a census of machine-generated text look like?

#### The Trial: Randomization and Causal Inference

Medicine had to learn how to compare. Fisher's *The Design of Experiments* (1935) formalised randomisation, replication and the analysis of variance as the basis for causal inference (\cite[Fisher, 1935]{fisher1935design}). The 1948 Medical Research Council trial of streptomycin in pulmonary tuberculosis is the canonical early randomised controlled trial: it allocated patients to treatment and control groups and compared outcomes (\cite[Medical Research Council, 1948]{mrc1948streptomycin}). The randomised trial turned medicine from anecdote into evidence and gave the world a template for testing interventions under uncertainty. The same logic underlies A/B testing, benchmark evaluation and the controlled experiments of machine learning.

> **Open questions.** When is a benchmark a controlled experiment? What does randomisation buy, and what does it hide? Can alignment be tested like a drug?

#### The Spectrum: Maxwell, Hertz, and the Allocation of the Air

Computation is not only silicon; it is also the electromagnetic spectrum. Maxwell's 1865 paper unified electricity, magnetism and light in a single field theory and predicted electromagnetic waves (\cite[Maxwell, 1865]{maxwell1865}). Hertz's experiments confirmed the prediction, and Marconi turned it into signalling. Because the spectrum is finite and shared, it had to be allocated: the ITU Radio Regulations contain the complete texts adopted by the World Radiocommunication Conference and define how frequencies are used internationally (\cite[ITU, 2024]{itu_radio_regulations}). Wi-Fi, cellular, radar, satellite and radio astronomy are all users of a governed resource. The air is a commons with a rulebook.

> **Open questions.** Which bands are still available? How does spectrum policy shape the cost of connectivity? Who gets to use the air?

#### The Thermodynamic Bill: Carnot, Landauer, and the Cost of a Bit

Every computation is a physical process, and physics sends a bill. Carnot's 1824 reflections on the motive power of fire founded the theory of heat engines and the limit on how much work can be extracted from a temperature difference (\cite[Carnot, 1824]{carnot1824}). Clausius formulated the second law and introduced entropy (\cite[Clausius, 1865]{clausius1865}). Landauer applied the lesson to computing: logical irreversibility is associated with physical irreversibility and requires a minimal heat generation of order kT per irreversible operation (\cite[Landauer, 1961]{landauer1961}). The IEA's projection of data-centre electricity demand doubling to 950 TWh by 2030 is the macroscopic version of Landauer's bill (\cite[IEA, 2026]{iea2026energyai}). The thermodynamic bill cannot be negotiated away; it can only be paid with better materials, better cooling, or reversible computing.

> **Open questions.** What is the minimum energy per useful floating-point operation? How close is a GPU to the Landauer limit? Could reversible computing change the energy budget of AI?

</div>

<div class="md" data-depth="40">
### The Instruments of Power and Production: Fiscal, Imperial, Metric, Industrial

The previous part followed the budgets of body, city and state. This part follows the instruments that turn those budgets into capacity: the fiscal-military state that can tax, borrow and conscript; the empire that takes territory, classifies people and extracts resources; the metrological system that makes units mean the same thing everywhere; the assembly line and the control chart; the telephone switch; the map; the sound record; and the render farm.

#### The Fiscal-Military State: Taxation, Debt, and Conscription

War is expensive, and the modern state was built to pay for it. The Bank of England Act 1694 granted duties on tonnage, beer and ale to secure £1,500,000 towards "the carrying on the Warr against France" and to induce persons to advance that sum (\cite[Parliament of England, 1694]{boe1694}). The Income Tax Act 1842 gave the British state a direct tax on income (\cite[Parliament of the United Kingdom, 1842]{incometax1842}). The Selective Service Act of 1917 authorised the President to raise troops temporarily for the emergency (\cite[U.S. Congress, 1917]{selectiveservice1917}). Taxation, public debt, conscription and logistics are the four fiscal-military instruments; the military-industrial-academic complex that later funded computing is their descendant.

> **Open questions.** Who pays for the next war? What is the fiscal capacity of a digital state? How does public debt shape which research agendas survive?

#### The Empire: Occupation, Census, and Extraction

Empire was a machine for taking territory, classifying people and extracting resources. The General Act of the Berlin Conference (1885) laid down "rules for future occupation on the coast of the African continent": any power taking possession had to notify the others, and was obliged to establish authority sufficient to protect existing rights and freedom of trade (\cite[Berlin Conference, 1885]{berlinact1885}). The Census of British India of 1871-72 classified the population by religion, nationality, language, caste, occupation and infirmities (\cite[Waterfield, 1875]{indiancensus1871}). Mapping, counting and classifying are data practices; empire was one of their largest and most violent applications. The global networks of telegraph, shipping and botanical exchange that carried resources and information were built inside that system.

> **Open questions.** Who owns the data extracted from the periphery? What does decolonising the stack mean? Which maps and categories still carry imperial assumptions?

#### The Measure: The Metre Convention and the SI

Interchangeable parts, global science and semiconductor manufacturing all depend on units that mean the same thing everywhere. The Metre Convention (1875) created the BIPM and the machinery of international metrology (\cite[BIPM, 1875]{metre_convention1875}). The SI Brochure defines the International System of Units in terms of seven defining constants and describes the CGPM, CIPM and consultative committees that maintain it (\cite[BIPM, 2019]{si_brochure2019}). A nanometre is a useful unit only because the world has agreed on the metre and can realise it. Metrology is the invisible standard underneath the fab.

> **Open questions.** Who calibrates the calibrators? What happens when a base unit is redefined? How does metrology set the limits of manufacturing?

#### The Assembly Line: Ford, Shewhart, and Quality Control

Mass production is a system, not a machine. Ford's *My Life and Work* describes the moving assembly line: drawing the chassis with a rope and windlass reduced assembly time from twelve hours and twenty-eight minutes to five hours fifty minutes; the elevated line and further subdivision cut it to one hour thirty-three minutes; the line ran at forty-four inches per minute and had forty-five stations (\cite[Ford and Crowther, 1922]{ford1922mylife}). Shewhart's 1930 paper on economic quality control gave the statistical basis for deciding when a process is in control and how much variation to leave to chance (\cite[Shewhart, 1930]{shewhart1930quality}). The assembly line and the control chart are the ancestors of the modern production line, the supply chain and the benchmark.

> **Open questions.** What is the human cost of the line? Can quality control be automated? What does "in control" mean for a model?

#### The Switch: Bell, Strowger, and the Telephone Network

The telephone network was the first real-time switched network. Bell's 1876 patent, "Improvement in Telegraphy," described the transmission of vocal sounds by undulating currents (\cite[Bell, 1876]{bell1876telephone}). Strowger's 1891 "Automatic Telephone-Exchange" replaced the human operator with an electromechanical switch (\cite[Strowger, 1891]{strowger1891exchange}). Erlang's 1922 paper applied probability to telephone trunking problems, creating the traffic engineering that dimensioned the network (\cite[Erlang, 1922]{erlang1922trunking}). The switch, the trunk and the Erlang are the ancestors of the router, the packet switch and the capacity planner.

> **Open questions.** Who controls the switch? How does network architecture shape power? What is the Erlang of an LLM serving system?

#### The Map: The Ordnance Survey and the Coordinate Grid

A map is a data structure with a coordinate system. The Ordnance Survey Act 1841 provided for a trigonometrical survey of Great Britain (\cite[Parliament of the United Kingdom, 1841]{os1841}). The 1884 International Meridian Conference adopted Greenwich as the initial meridian and proposed a universal day (\cite[International Meridian Conference, 1884]{meridian1884proceedings}). Geodesy turns territory into coordinates; coordinates turn territory into a database. Navigation, logistics, GPS and the spatial joins of a modern map all rest on that conversion.

> **Open questions.** Who is on the map, and who is off it? How does the coordinate system shape what can be seen? What is the map of the training corpus?

#### The Record: The Phonograph, the Gramophone, and MPEG Audio

Sound became a medium for machines when it became a physical record. Edison's 1877 phonograph patent described recording the human voice and other sounds in permanent characters from which they could be reproduced (\cite[Edison, 1877]{edison1877phonograph}). Berliner's 1887 gramophone patent introduced the disc and stylus (\cite[Berliner, 1887]{berliner1887gramophone}). A century later, MPEG audio standardised high-quality digital audio coding at low bit rates (\cite[Brandenburg, 1993]{mpeg_audio1993}). Recording created the sound corpus; compression made it transportable; streaming made it a training stream.

> **Open questions.** Who owns the sound? What is lost in compression? What does a model hear?

#### The Render Farm: Catmull, RenderMan, and the Industrialization of Pixels

Computer graphics became an industry when a single image required more computation than one machine could deliver. Catmull's 1974 work on computer display of curved surfaces introduced the subdivision methods that made smooth surfaces tractable (\cite[Catmull, 1974]{catmull1974}). Hanrahan and Lawson's 1990 shading language let artists and programmers describe light and surface reflectance in a portable language (\cite[Hanrahan and Lawson, 1990]{hanrahan1990shading}). Pixar's *Toy Story* (1995) was the first computer-animated feature film, and its production pipeline turned rendering into an industrial parallel workload (\cite[Pixar, 2026]{pixar_ourstory}). The render farm is the ancestor of the GPU cluster: many machines, one frame, a deadline.

> **Open questions.** How much energy does a frame cost? What is the boundary between simulation and synthesis? What would a render farm for world models look like?

</div>

<div class="md" data-depth="40">
### The Deep Stack: The Budgets Behind the Machine

Every prerequisite described so far is paid for out of a budget. This closing part zooms out from the individual invention to the planetary and civilizational accounts that make the whole chain possible: the solar energy stored by plants, the nitrogen that grows the population, the fresh water that cools and cleans, the minerals concentrated by geology, the capital that finances the fab, and the attention that pays for the free web. None of these budgets was created for AI. All of them are drawn down by it.

#### The Solar Budget: From Photosynthesis to the Coal Seam

Photosynthesis is the original energy-storage technology. Priestley's experiments on air and Ingenhousz's demonstration that plants purify the common air in sunlight established that the atmosphere is not a fixed medium but a cycle maintained by living things (\cite[Priestley, 1772]{priestley1772air}; \cite[Ingenhousz, 1779]{ingenhousz1779vegetables}). Calvin and Benson then traced the path of carbon in photosynthesis, showing how light-driven chemistry fixes carbon into organic molecules (\cite[Calvin and Benson, 1948]{calvin1948photosynthesis}). Coal is the geological savings account of that process: the EIA describes coal as containing the energy stored by plants that lived hundreds of millions of years ago, compressed and heated under layers of rock (\cite[EIA, 2026]{eia_coal}). The Industrial Revolution was, in energy terms, a withdrawal from that account. The grid, the fab and the data center are later withdrawals from the same account; the IEA's projection of data-centre demand doubling from 485 TWh in 2025 to 950 TWh in 2030 is a statement about how much of the planetary energy budget is being redirected into computation (\cite[IEA, 2026]{iea2026energyai}).

> **Open questions.** How many years of ancient sunlight are stored in a barrel of oil? What would a fab powered only by current sunlight require? Can the grid decarbonise at the speed at which AI demand is growing?

#### The Nitrogen Budget: From Malthus to Haber-Bosch

Plants cannot use the nitrogen that makes up most of the atmosphere; they need it fixed as nitrate or ammonia. Haber's Nobel lecture explains the problem: industrial societies move food far from where it is grown, so the bound nitrogen is not returned to the soil, creating a worldwide economic necessity for synthetic fixed nitrogen (\cite[Haber, 1920]{haber1920ammonia}). Haber-Bosch synthesised ammonia from nitrogen and hydrogen, and Borlaug's Green Revolution relied on that fertiliser: the new high-yielding varieties responded to much heavier nitrogen doses, producing twenty to twenty-five kilos of additional grain per kilo of nitrogen instead of ten (\cite[Borlaug, 1970]{borlaug1970green}). Malthus had argued that population grows geometrically while subsistence grows arithmetically, imposing a check (\cite[Malthus, 1798]{malthus1798population}). Synthetic nitrogen postponed that check; it also fed the population that staffs the laboratories, factories and data centers. The nitrogen budget is therefore a hidden input to the human-capital budget.

> **Open questions.** How many people does synthetic nitrogen feed? What is the energy cost of a kilogram of ammonia? What happens to the nitrogen cycle if fertiliser is diverted to fuel crops?

#### The Water Budget: From the Aqueduct to the Cooling Tower

Water is a managed resource before it is a natural one. Frontinus, appointed water commissioner of Rome, wrote a treatise on the aqueducts because the supply concerned the convenience, health and safety of the city; he measured what each aqueduct delivered and how it was distributed (\cite[Frontinus, 97]{frontinus97aqueducts}). Modern water use is measured at the same planetary scale: the USGS estimates total withdrawals of about 322 billion gallons per day in 2015, with thermoelectric power and irrigation the two largest uses, and freshwater making up 281 billion gallons per day (\cite[Dieter et al., 2018]{usgs2015wateruse}). Computation adds a demand for water that is easy to overlook: ultrapure water is used in semiconductor manufacturing, where ultrafiltration and leak detection are prerequisites for defect-free production (\cite[Ruth and Berndt, 2016]{ruth2016ultrapure}). A data center is a water consumer twice over: directly for cooling and indirectly through the electricity system.

> **Open questions.** How much water does a data center consume per megawatt-hour? Can cooling be closed-loop? Who has priority in a drought: a city, a farm, or a fab?

#### The Mineral Budget: From the Ore to the Wafer

Mining is one of the oldest knowledge systems. Agricola's *De Re Metallica* (1556) described mining methods, metallurgical processes, geology and mining law, and remained the standard text for 180 years (\cite[Agricola, 1556]{agricola1556demetallica}). The geological distribution of the elements is not uniform: the USGS notes that rare earths are relatively abundant in the Earth's crust but minable concentrations are less common than for most other commodities, and that the United States relies on imports for more than one-half of its lithium and more than two-thirds of its rare-earth compounds and metals (\cite[USGS, 2026]{usgs2026mcs}). Copper, cobalt, gallium and germanium have their own bottlenecks. A fab is therefore downstream of a mine and a refinery; the periodic table is not a catalogue of equally available materials but a map of geological scarcity and political geography.

> **Open questions.** Which elements have no substitute? What is the lead time from discovery to production? How much of the periodic table does a single accelerator require?

#### The Capital Budget: From the Ledger to the Venture Fund

Computation is capital-intensive. The institutions that make large capital possible are therefore part of the stack. Double-entry bookkeeping made a business auditable (\cite[Pacioli, 1494]{paciolisumma}). The joint-stock company pooled capital from strangers; the Companies Act 1856 gave investors limited liability, separating the risk of the enterprise from the personal fortune of the investor (\cite[Parliament of the United Kingdom, 1856]{companiesact1856}). In the twentieth century, the Small Business Investment Act of 1958 made equity capital and long-term credit more readily available for small-business concerns and created small business investment companies, a public-policy ancestor of the venture fund (\cite[U.S. Congress, 1958]{sbic1958}). A leading-edge fab costs billions and a frontier training run costs millions; the capital budget decides which of them gets built. The venture fund and the limited-liability company are as much prerequisites of the GPU cluster as the transistor.

> **Open questions.** Who owns the model? What is the cost of capital for a ten-year fab versus a six-month training run? How does the venture model shape which research gets funded?

#### The Attention Budget: From the Ad to the Corpus

The free web was not free; it was paid for by advertising. Google's 2004 registration statement says that most services are provided for free and that advertising is the company's principal source of revenue (\cite[Google, 2004]{google2004s1}). The technical counterpart was targeted advertising: Google's patent on increasing the number of relevant advertisements describes matching ads to search queries and scoring them by relevance and performance (\cite[Bem, 2007]{adwords2003patent}). The result was a self-reinforcing loop: free services attracted users, users produced attention and data, advertising converted attention into revenue, and the resulting pages became the corpus. The training text of a large model is therefore a by-product of an attention economy, not a neutral sample of human writing.

> **Open questions.** What would the web look like with subscriptions instead of ads? How does advertising shape what gets written and indexed? Who owns the attention that trains the model?

## ❓ Open Questions

The chain is not finished. These are the questions this page cannot answer, and the ones a reader should carry forward:

- What is the minimum energy per useful floating-point operation, and what does thermodynamics forbid?
- Which parts of the stack are irreplaceable, and which are historical accidents?
- How much of AI's cost is energy, water, land, materials, labour, capital, and attention?
- What would a post-silicon substrate require?
- Which institutions are load-bearing, and which are contingent?
- What would a civilisation without cheap fossil fuel have computed?
- How would the chain change if copyright law had been different?
- What is the role of war and state capacity?
- What is the role of open source and standards?
- What would a non-human intelligence's prerequisites look like?
- Which displaced prerequisites are still invisible today?
- What is the next displaced prerequisite being created now?

</div>

<div class="mn-quiz" data-quiz="untold_history_iii"><script type="application/json">{"title": "The untold history", "questions": [{"q": "What does the chapter mean by “displaced prerequisites”?", "options": ["Discoveries from unrelated fields that AI could not exist without", "Lessons you can skip", "Failed AI projects", "Prerequisites removed from the curriculum"], "answer": 0, "explain": "Materials science, spaceflight, programming languages and the web are not “AI”, but AI rests on them."}, {"q": "How did spaceflight help build the computer industry?", "options": ["Programs like Apollo were early, demanding buyers of integrated circuits", "Astronauts wrote the first programs", "Rockets carried the first servers", "It did not"], "answer": 0, "explain": "Guaranteed demand for tiny, reliable electronics helped make integrated circuits cheap."}, {"q": "Why is VisiCalc (1979) in a history of AI?", "options": ["The spreadsheet made data manipulation usable for ordinary people — a step towards data as an everyday object", "It was the first neural network", "It invented the GPU", "It was a chatbot"], "answer": 0, "explain": "Usability of data mattered as much as raw computing power."}, {"q": "What did the World Wide Web eventually provide for modern AI?", "options": ["The training corpus: an enormous body of human-written text", "Faster processors", "The transformer architecture", "Electricity"], "answer": 0, "explain": "Tim Berners-Lee's web is where most LLM training text comes from."}]}</script></div>
