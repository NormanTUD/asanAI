<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: The Untold History of AI II: The Material Foundations
description: The displaced prerequisites, part II: glass, metals, electricity, wireless, chips and the industrial base of computation.
icon: &#9879;&#65039;
part: 6
order: 3
color: text-secondary
topics: history, philosophy, society
tags: interested-layman
-->

<div class="md" data-depth="60">
## The Material Foundations of Computation

### Materials, Optics, and Metals

#### Glass and Lenses: The Instruments That Expanded Perception

Glass was made in Mesopotamia and Egypt as early as 3500 BCE, but the transparent optical glass needed for precision lenses required centuries of refinement. The Venetian glassmakers of Murano developed *cristallo*, a clear soda-lime glass, in the 15th century, and it was from this material that the first lenses were ground. **\citeauthor{galileosidereus}**'s \citeyear{galileosidereus} \citetitle{galileosidereus} turned such a lens skyward, discovering Jupiter's moons and confirming Copernican astronomy. **\citeauthor{leeuwenhoekletters}**'s single-lens microscopes, reported in his letters to the Royal Society from the 1670s onward, revealed a microbial world invisible to the naked eye and established the empirical foundation for cell theory that would later inform Cajal's neuron doctrine. The same lens-grinding tradition produced the camera obscura, Niépce's photographic plate, and Muybridge's motion sequences, the labelled image datasets of the 19th century. Without optical glass, there are no microscopes (and no neuron doctrine), no telescopes (and no celestial mechanics), and no cameras (and no modern vision datasets).

<figure>
    <img style="width: 60%; height: auto; display: block; margin: 1em auto;" src="huygens_aerial_telescope_1684.jpg" alt="Engraving of the tubeless aerial telescope of Christiaan Huygens, 1684, an early lens-based instrument that extended human perception" />
    <figcaption class="md">The \citealternativetitle{img_huygens_aerial_telescope} (Public Domain): the tubeless aerial telescope of \citeauthor{img_huygens_aerial_telescope}, drawn in \citeyear{img_huygens_aerial_telescope} — a lens-based instrument of the same lineage as Galileo's refractor, extending human perception to the heavens. Source: \citeauthor{img_huygens_aerial_telescope}, \citeyear{img_huygens_aerial_telescope}, \citealternativetitle{img_huygens_aerial_telescope}, Wikimedia Commons.</figcaption>
</figure>
</div>

<div class="md" data-depth="40">
#### From Cork to Circuits: The Microscope That Gave AI Its Model and Its Method

No instrument in this history displaced its original purpose so completely as the microscope. Built to examine the fine detail of lenses, cloth, and surfaces, it ended up supplying both the *model* and the *method* of artificial intelligence: the model, because it revealed the neuron; the method, because it taught science how to zoom in until a new world of units appeared.

**The book that named the cell.** \citeauthor{micrographia}'s \citeyear{micrographia} \citetitle{micrographia} was the first major publication of the Royal Society and its first best-seller; Samuel Pepys called it “the most ingenious book that ever I read in my life”. Hooke used a compound microscope, built for him in London by the optician Christopher Cock, magnifying some fifty times in diameter, to describe a louse, a flea, a gnat, a fly's eye, and the jagged edge of a honed razor — the first book to publish drawings of the world as seen through lenses \cite{micrographia_wiki}. The most consequential observation in the book was made on its least interesting specimen: a thin slice of cork. Hooke saw that it was “all perforated and porous, much like a Honey-comb”, and that “these pores, or cells, … were indeed the first microscopical pores I ever saw, and perhaps, that were ever seen” (\cite[Hooke, 1665]{hookecork}). He named them *cells*, after the small rooms of a monastery, without knowing what they were for: he had seen only the empty walls of dead plant tissue. But the word caught, and within two centuries it came to name the unit of all living things.

<div class="smart-quote" data-cite="hookecork">
I could exceedingly plainly perceive it to be all perforated and porous, much like a Honey-comb, but that the pores of it were not regular … these pores, or cells, … were indeed the first microscopical pores I ever saw, and perhaps, that were ever seen, for I had not met with any Writer or Person, that had made any mention of them before this.
</div>

<figure>
    <img style="width: 100%; height: auto; display: block;" src="micrographia_cork.jpg" alt="Hooke's drawing of the pores (cells) of a thin slice of cork, from Micrographia, 1665" />
    <figcaption class="md">\citealternativetitle{img_micrographia_cork} (Public Domain): the honeycombed pores of a thin slice of cork, no thicker than the 400th part of an inch, as drawn for \citetitle{micrographia}. It was looking at this dead plant tissue that \citeauthor{micrographia} coined the word “cell”. Source: \citeauthor{img_micrographia_cork}, \citeyear{img_micrographia_cork}, \citealternativetitle{img_micrographia_cork}, Wikimedia Commons.</figcaption>
</figure>

<div class="image-row">
    <figure>
        <img src="micrographia_title_page.gif" alt="Title page of Micrographia, 1665" />
        <figcaption class="md">The \citealternativetitle{img_micrographia_titlepage} (Public Domain): the title page of the 1665 folio, the Royal Society's first major publication and the first scientific best-seller.</figcaption>
    </figure>
    <figure>
        <img src="hooke_cock_microscope.jpg" alt="Compound microscope manufactured by Christopher Cock of London for Robert Hooke" />
        <figcaption class="md">The \citealternativetitle{img_hooke_cock_microscope} (Public Domain): the compound microscope manufactured by Christopher Cock of London for \citeauthor{micrographia}, believed to be the instrument with which he made the observations in \citetitle{micrographia}. Source: \citeauthor{img_hooke_cock_microscope}, \citeyear{img_hooke_cock_microscope}, \citealternativetitle{img_hooke_cock_microscope}, Wikimedia Commons.</figcaption>
    </figure>
</div>

**The tenants of the honeycomb.** While Hooke saw the architecture, a draper in Delft named **\citeauthor{leeuwenhoekletters}** saw who lived in it. Grinding his own single-lens microscopes to magnifications well beyond 200×, he reported from the 1670s onward, in letters to the Royal Society, on the “animalcules” swimming in pond water, on red blood cells, on spermatozoa — the first observations of living cells and of microorganisms \cite{leeuwenhoekletters}. Between the two men the microscope completed its first revolution: from an instrument of *description* to an instrument of *discovery*.

**From observation to doctrine.** It took another 170 years for the cell to become a principle. In \citeyear{schleiden1838} \citeauthor{schleiden1838} argued that all plant tissues are built of cells; in \citeyear{schwann1839} \citeauthor{schwann1839} extended the claim to animals, proposing that the tissues of *all* organisms are composed of cells — the birth of **cell theory** \cite{celltheory_wiki}. \citeauthor{virchow1858} later closed the triad with *omnis cellula e cellula*, every cell from a cell, in his \citeyear{virchow1858} cellular pathology. For the first time, a single unit, visible only through a lens, was declared sufficient to explain the structure of every living thing.

**The stubborn exception: the brain.** Cell theory met one recalcitrant tissue. Under the microscopes of the early nineteenth century — limited by chromatic and spherical aberration, by natural light, and by crude dyes and fixatives — brain tissue appeared as a continuous mesh, a net without individual parts, the **reticular theory**. It was the technical limits of microscopy, not any fact about the brain, that kept the neuron hidden \cite{neuron_doctrine_wiki}.

The break came from a histological trick. In \citeyear{golgi1873}, **Camillo Golgi** invented a silver-impregnation method he called *la reazione nera*, the black reaction: it stained a small, random subset of nerve cells entirely black against a pale yellow background, so that for the first time an individual neuron, with its highly branched dendrites and axon, could be seen clearly \cite{golgi1873}. The irony is that Golgi himself read the stain as evidence of continuity, and defended the reticular theory for the rest of his career.

**The neuron doctrine.** It was **\citeauthor{cajal1888}** who read the stain the other way. Starting in 1887, he applied Golgi's method with unmatched skill, and in the May 1888 issue of the *Revista Trimestral de Histología Normal y Patológica* reported that the nerve cells of the bird's brain are **discrete**, not continuous \cite{cajal1888} \cite{neuron_doctrine_wiki}. That report is the founding document of the **neuron doctrine**: the nervous system is not a net but a vast society of individual cells, each a complete cell in its own right, connected to its neighbours by points of contact rather than by cytoplasmic continuity. \citeauthor{waldeyer1891} named the unit *neuron* in \citeyear{waldeyer1891}; Cajal then spent two decades mapping it through every region of the human and animal brain, publishing his drawings in works such as \citetitle{cajaltextura} (\citeyear{cajaltextura}). Golgi and Cajal shared the 1906 Nobel Prize in Physiology or Medicine, their dispute surviving the award and being settled only in the 1950s, when electron microscopy revealed the physical gap at the **synapse** \cite{neuron_doctrine_wiki}.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="cajal_cerebellum.jpg" alt="Santiago Ramón y Cajal's drawing of the cells of the chick cerebellum, 1905" />
    <figcaption class="md">The \citealternativetitle{img_cajal_cerebellum} (Public Domain): the cells of the chick cerebellum as \citeauthor{cajaltextura} drew them. The reticular theory, a single continuous mesh, had been the consensus of his generation; each black-inked cell in this drawing is a separate individual, the unit of the neuron doctrine and the direct ancestor of the “neuron” in a neural network. Source: \citeauthor{img_cajal_cerebellum}, \citeyear{img_cajal_cerebellum}, \citealternativetitle{img_cajal_cerebellum}, Wikimedia Commons.</figcaption>
</figure>

**Why the neuron doctrine is a prerequisite of AI.** The neuron doctrine is a displaced prerequisite in the strongest sense: it is what made the brain a *computable object*. Before Cajal, the brain was a mesh, something like telegraph wiring, with nothing discrete to model. After Cajal, it was a network of individual, excitable units that send all-or-none signals to each other across discrete contacts. That picture — a discrete unit with a threshold, wired into a network — is exactly the picture that \citeauthorlastnameand{mccullochpitts1943} turned in \citeyear{mccullochpitts1943} into a mathematical model, a network of threshold neurons capable of computing any computable function \cite{mccullochpitts1943}. \citeauthor{hebb1949organizationofbehaviour}'s \citeyear{hebb1949organizationofbehaviour} rule that “cells that fire together wire together” \cite{hebb1949organizationofbehaviour}, and \citeauthor{rosenblatt1958perceptron}'s \citeyear{rosenblatt1958perceptron} Perceptron \cite{rosenblatt1958perceptron}, both stand on that histological fact. The word “neuron” in “neural network” is a direct descendant of the unit Cajal drew in 1888. No microscope, no neuron doctrine. No neuron doctrine, no connectionism. No connectionism, no neural networks.

**Why the microscope is still in the causal chain.** The instrument has not retired from the chain either. Its descendant, the **electron microscope**, is indispensable to semiconductor fabrication: at today's feature sizes, below the wavelength of visible light, defects in a chip cannot be found or measured by optical microscopy, and electron microscopes are what inspect, measure, and failure-analyse the silicon on which every inference runs. The same idea of the lens, which in 1665 revealed a honeycomb in a slice of cork, now watches over the making of the dies that train language models.

**The deepest displacement: the method.** The most profound debt is neither model nor instrument but *method*. As \citeauthorlastnameand{olaha2020zoomin} put it in their \citeyear{olaha2020zoomin} essay \citetitle{olaha2020zoomin}, “many important transition points in the history of science have been moments when science ‘zoomed in’”: microscopes let us see cells, leading to cellular biology; x-ray crystallography let us see DNA, leading to the molecular revolution. And now, they argue, deep learning may stand at a similar transition point:

<div class="smart-quote" data-cite="olaha2020zoomin">
Just as the early microscope hinted at a new world of cells and microorganisms, visualizations of artificial neural networks have revealed tantalizing hints and glimpses of a rich inner world within our models.
</div>

Their “circuits” programme treats individual neurons and even individual weights as objects of serious investigation, spending “thousands of hours tracing through every neuron and its connections”. What emerges are **circuits**: meaningful algorithms inside the weights — a circle detector assembled from curves, a dog's head assembled from eyes, snout, fur, and tongue, even circuits implementing AND, OR, and XOR over high-level visual features \cite{olaha2020zoomin}.

And the parallel is deliberately architectural. \citeauthorlastnameand{olaha2020zoomin} model their framework on \citeauthor{schwann1839}'s \citeyear{schwann1839} three claims about the cell — that the cell is the unit of structure, physiology, and organization in living things; that it retains a dual existence as a distinct entity and as a building block in the construction of organisms; that cells form into the organism — and propose three corresponding claims about neural networks: (1) *features* are the fundamental unit of a network, and can be rigorously studied and understood; (2) features are connected by weights into *circuits*, computational subgraphs that can likewise be rigorously studied; (3) analogous features and circuits form *universally* across models and tasks \cite{olaha2020zoomin}. Just as cell theory made the cell the unit on which biology was rebuilt, the circuits programme is trying to make the feature the unit on which the science of AI will be rebuilt.

Strip the microscope from the chain and it breaks in three places at once: the neuron, the unit that became the model of every artificial network, would never have been seen; the electron microscope, its descendant, would no longer watch over the silicon that computes; and the method that the whole science of AI is now applying to its own weights — zoom in, find the units, read the circuits — was first learned from a slice of cork.
</div>

<div class="md" data-depth="60">
#### From Amber to Amperes: The Discovery and Harnessing of Electricity

No electrical computer can exist without electricity, yet the phenomenon was first observed in a context utterly alien to computation. Around 600 BCE, **Thales of Miletus** noticed that rubbing amber (*ἤλεκτρον*, *elektron* in Greek) against fur caused it to attract lightweight objects like feathers, an observation recorded attributed to Thales, later catalogued by \citeauthor{laertius} in \citetitle{laertius} (Book I, §15). For over two millennia, this remained a philosophical curiosity, a parlor trick of nature.

\marginfig{volta_portrait.jpg}{\citeauthor{volta_portrait}, inventor of the first true electric battery.}

The transformation of this curiosity into a usable force required a cascade of unrelated breakthroughs:

* **Alessandro Volta** (1800) created the first true battery (the *voltaic pile*), proving that electricity could be generated chemically and sustained as a steady current, not just produced as a momentary spark. He announced the device in a letter to Sir Joseph Banks, president of the Royal Society, subsequently published as \citetitle{volta}.

\marginfig{voltaic_pile.png}{\citealternativetitle{voltaic_pile} (1800): stacked disks of copper and zinc separated by brine-soaked cloth, the first electric battery.}

* **Michael Faraday** (1831) discovered **electromagnetic induction**, the dynamo principle, demonstrating that moving a magnet through a coil of wire generates electric current. He described the effect in \citetitle{faraday}. This single insight is the basis of virtually all electrical power generation on Earth, from coal plants to wind turbines. Without it, there is no power grid, no data center, and no GPU cluster.

* **Nikola Tesla** and **George Westinghouse** (1880s–1890s) championed **alternating current (AC)**, which allowed electricity to be transmitted over long distances without catastrophic loss. Tesla's foundational polyphase AC patents (U.S. Patents \cite[381,968]{teslaelectricmotor}–\cite[382,282]{teslacurrent}, filed 1887, granted 1888) and his landmark lecture “A New System of Alternate Current Motors and Transformers” (delivered before the American Institute of Electrical Engineers, May 1888) laid the technical basis. The ability to centralize power generation and distribute it across cities and continents is a silent prerequisite for every server farm that trains an LLM.

<div class="image-row">
    <figure>
        <img src="faraday_disk.jpg" alt="Drawing of Faraday's disk, the first electromagnetic generator" />
        <figcaption class="md">\citealternativetitle{faraday_disk}: Faraday's rotating copper disk between the poles of a horseshoe magnet, the first demonstration that mechanical motion can produce a steady electric current.</figcaption>
    </figure>
    <figure>
        <img src="tesla_portrait.jpeg" alt="Photograph of Nikola Tesla around 1890, age 34, by Napoleon Sarony" />
        <figcaption class="md">\citeauthor{tesla_portrait}, whose polyphase alternating-current patents made long-distance electrical power distribution economically viable.</figcaption>
    </figure>
</div>

A modern LLM training run can consume **gigawatt-hours** of electricity, enough to power a small city for days. This energy flows through infrastructure whose lineage traces directly back to Faraday's hand-cranked copper disk spinning between the poles of a horseshoe magnet, an experiment conducted to satisfy scientific curiosity about the relationship between magnetism and motion, with no notion of “computation” whatsoever.
</div>

<div class="md" data-depth="60">
#### From Bloomery to Boolean: The Metals That Compute

Metallurgy is a silent prerequisite whose absence makes every other layer of this history impossible. The trail begins not in a logic textbook but in a smelter's furnace, with the first systematic reflection on what an ore actually is. **\citeauthor{theophrastusstones}**'s \citeyear{theophrastusstones} treatise \citetitle{theophrastusstones} (Περὶ λίθων) is the earliest surviving attempt to classify rocks and minerals by their behavior under heat, including the iron ores that would, within a few centuries, replace bronze as the skeleton of civilisation. A few generations later, **\citeauthor{plinynaturalhistory}**'s \citeyear{plinynaturalhistory} \citetitle{plinynaturalhistory}, in particular books XXXIII and XXXIV, gathered everything the Roman world knew about copper, iron, gold, silver, lead, tin, and mercury, including the mining and smelting processes that turned ore into the material substrate of roads, aqueducts, weapons, coinage, and (by then) the bronze gears of the Antikythera mechanism.

The leap from art to science came in \citeyear{deremetallica}, when **\citeauthor{deremetallica}** published \citetitle{deremetallica}, the first comprehensive modern treatise on mining and smelting, with 292 woodcuts that turned German mining practice into a book one could study. Agricola's volumes remained the standard for nearly two centuries, and **\citeauthor{vonneumann}**'s later EDVAC design borrowed directly from the engineering vocabulary of mines: a "Store" (memory) and a "Mill" (CPU) are named after the architecture of ore processing. The transformation of iron from a precious craft metal into an industrial commodity was completed in \citeyear{bessemerpatent}, when **\citeauthor{bessemerpatent}** patented the \citealternativetitle{bessemerpatent}, which dropped the price of steel by a factor of ten and made possible every precision instrument, generator, and structural beam that the electric age would demand.

Yet the deepest metallurgical miracle predates Bessemer by more than a millennium and stands in Delhi. The \citealternativetitle{ironpillardelhi}, erected under Chandragupta II (c. 375–415 CE), has resisted corrosion for over 1,600 years in a climate that would eat unprotected iron alive. **\citeauthor{ironpillardelhi}**'s \citeyear{ironpillardelhi} analysis showed that the resistance comes from a thin, self-forming layer of crystalline iron hydrogen phosphate hydrate that grows only one-twentieth of a millimetre per millennium: a passive film that ancient Indian smiths produced not by understanding quantum electrochemistry, but by smelting with high-phosphorus charcoal in a lime-free furnace. The pillar's survival is, like the Jacquard loom or the Antikythera mechanism, a reminder that someone solved a problem no one had formulated, with no intention of contributing to any future science.

<div class="image-row">
    <figure>
        <img src="iron_pillar_delhi.jpg" alt="The Iron Pillar of Delhi, an 1,600-year-old wrought-iron column that has resisted corrosion, standing in the Qutb complex" />
        <figcaption class="md">The \citealternativetitle{img_iron_pillar_delhi} (Public Domain): the \citealternativetitle{ironpillardelhi}, a wrought-iron column that has resisted corrosion for over 1,600 years through a self-forming passive film, a metallurgical result no one set out to engineer. Source: \citeauthor{img_iron_pillar_delhi}, \citeyear{img_iron_pillar_delhi}, \citealternativetitle{img_iron_pillar_delhi}, Wikimedia Commons.</figcaption>
    </figure>
    <figure>
        <img src="bessemer_converter.jpg" alt="A Bessemer converter, the vessel that dropped the price of steel by a factor of ten in the 1850s" />
        <figcaption class="md">The \citealternativetitle{img_bessemer_converter} (Public Domain): the \citealternativetitle{bessemerpatent}, the process that turned steel from a precious craft metal into an industrial commodity. Source: \citeauthor{img_bessemer_converter}, \citeyear{img_bessemer_converter}, \citealternativetitle{img_bessemer_converter}, Wikimedia Commons.</figcaption>
    </figure>
</div>

Strip any single one of these metallurgical achievements from the causal chain and it breaks. Smelted copper, drawn into wire and insulated with gutta-percha, became the telegraphic nervous system that linked continents into a single information space. Brass gears, cast and filed to tolerance, made possible the Antikythera mechanism, Babbage's Analytical Engine, and the differential analyzer. Refined silicon, grown into defect-free single crystals by \citeauthor{czochralski1918}'s \citeyear{czochralski1918} process and zone-purified by the \citealternativetitle{siemensprocess}, became the substrate on which \citeauthorlastnameand{semiconductor} etched the first point-contact transistor in \citeyear{semiconductor}. Gold bonding wires, the width of a human hair, connect every silicon die to the package that sits on every accelerator board. Tungsten filaments lit the vacuum tubes of ENIAC; lithium cobalt oxide cathodes, discovered by \citeauthor{goodenough1980licoo2} in \citeyear{goodenough1980licoo2} and industrialized by \citeauthor{yoshino1985liion} in \citeyear{yoshino1985liion}, now power the edge devices that run local language models. None of these were invented for artificial intelligence. All of them, together, are the silent, displaced prerequisites: remove a single one and the chain of inference breaks.
</div>

<div class="md" data-depth="20">
#### The Periodic Table as Foundation

Ultimately, every element used in computing, silicon (Si, 14) for substrates, copper (Cu, 29) for interconnects, gold (Au, 79) for wire bonds, tantalum (Ta, 73) for capacitors, gallium (Ga, 31) and arsenic (As, 33) for III-V semiconductors in networking lasers, erbium (Er, 68) for fiber optic amplifiers, neodymium (Nd, 60) for magnets, was first isolated, characterized, and understood through chemistry. Dmitri Mendeleev's 1869 periodic table organized the elements by atomic weight and predicted the existence of undiscovered elements; without this organizational framework, the systematic engineering of materials for computation would have been impossible.

<figure>
    <img style="width: 80%; height: auto; display: block; margin: 1em auto;" src="mendeleev_periodic_table.jpg" alt="Mendeleev's periodic table of the elements from 1869, the first published version, showing elements arranged by atomic weight" />
    <figcaption class="md">The \citealternativetitle{mendeleev_periodic_table}: Mendeleev's original 1869 arrangement of the elements by atomic weight, complete with bold predictions for then-undiscovered elements such as gallium, scandium and germanium. Every silicon, copper and neodymium atom in a modern GPU owes its place on this chart.</figcaption>
</figure>
</div>

<div class="md" data-depth="80">
### Writing, Numbers, and Ledgers

#### Tally Bones: Counting Before Writing

External memory did not begin with writing. Long before paper or ink, humans outsourced counting to matter: the **Lebombo bone**, a baboon fibula with 29 notches from Border Cave (Eswatini/South Africa, c. 42,000–43,000 years ago), is the oldest known counting device, probably a lunar or menstrual calendar. The **Dolní Věstonice bone** — a wolf radius found by **\citeauthor{wolfbone}** in 1936 in Moravia, with 55 notches in two groups (30 and 25) on an 18 cm bone, dated to roughly 27,000 years ago — and the **Ishango bone** (c. 18,000 BCE, with columns of marks read as a base-12 counting aid) show that the same impulse to externalise quantity into physical marks arose independently in Africa and Europe. These notches are the first data ever written down: quantities pushed out of memory into the physical world, the direct ancestor of every counter, array, and database. Nothing older with a counting function is known; older notched bones (up to ca. 80,000 years old, e.g., Apollo 11 Rockshelter, Namibia \cite[Vogelsang et al., 2010]{vogelsang2010apollo11}) exist, but their marks are likely decorative, and the oldest abstract pattern of all is a hatched flake from Blombos Cave (ca. 71,000–73,000 years ago \cite[Henshilwood et al., 2018]{henshilwood2018blombos}).

#### The First Written Numbers: Tokens, Tablets, and Base 60

The first numbers ever written down were not drawn — they were *pressed*. In the farming villages of southern Mesopotamia, granary clerks and shepherds kept small clay **tokens**: cones, spheres, and lens-shaped lumps, each encoding a unit of account (a small jar of oil, a large jar, a measure of grain, an animal). The shapes had been in use, by the dating of the earliest deposits, since at least the **9th millennium BCE** (\cite[Ifrah, 2000]{ifrah2000}; \cite[Schmandt-Besserat, 1992]{schmandtbesserat1992}). To make the record tamper-proof, the tokens were sealed inside a hollow clay envelope — a **bulla** — and the shapes were impressed on the outside so the contents could be checked without breaking it: the first external memory of a sealed record, a data structure with a checksum. Around **3300 BCE**, at Uruk, the envelope was dropped and the message was written directly on a flat tablet: the **proto-cuneiform** tablets, the oldest documents in the world, are almost entirely lists of grain, beer, and workers. By c. 2000 BCE the system had abstracted into something recognisably numeric: **two** wedge signs only — the vertical wedge 𒁹 (1) and the corner wedge 𒌋 (10) — combined to form the digits 1–59, then stacked in **base 60** with **position**, the first positional numeral system on record (\cite[Chrisomalis, 2010]{chrisomalis2010}). A gap marked an empty position — a zero *placeholder*, but not a number: it was never written in the final position, and there was no radix point, so where the units place fell had to be inferred from context. The sexagesimal legacy is still running: the 360° of the circle, the 60-minute hour, the 60-second minute.

#### Roman Numerals: The System That Blocked Arithmetic

While Mesopotamia and Egypt built positional systems, Europe inherited its numerals from Rome — and Rome's system was an abacus made of letters. The seven glyphs **I, V, X, L, C, D, M** descend from **Etruscan** numerals: I (1), X (10, a cross of the hands) and the C-shaped arc for 100, later identified with the letter *C* of *centum*; the "half" values were derived by halving — half of X is V, half of the 50-sign is the inverted-T ⊥ that became L — and 500 and 1000 began as boxed or circled 5 and 10 (⊕, a circle around X) that flattened into **D** and, under the influence of the word *mille*, **M** (\cite[Chrisomalis, 2010]{chrisomalis2010}; \cite[Ifrah, 2000]{ifrah2000}). Numbers were written **additively** — the value is the sum of the letters — with the subtractive convention (IV, XL, XC, CD, CM) layered on later; the system has no zero, no place value, and no way to say "this position is empty", so 1,009 is simply MIX and a thousand is a single M. Arithmetic in it is not a matter of carrying digits but of *juggling letters*: multiplying MMCDXLVI by anything was a page-long exercise, which is why medieval European calculation was done on the **abacus** and the lined **counting table** (*Rechentisch*) instead of on the page. The same system kept its fractions in base 12: the *as* was divided into twelve *unciae*, written as dots — the source of the English words "ounce" and "inch". From the 14th century the positional 0–9 system steadily displaced it in accounting and science; the Roman numeral survived exactly where no calculation was needed — clock faces, chapter numbers, and the statue of Liberty.

#### How 0–9 Got Here

The digits in this very sentence are Indian, carried by Arabs, and fixed in form by European type. Their ancestors are the **Brahmi** numerals already visible on the edicts of Ashoka (3rd century BCE) — but Brahmi was still *additive*, with separate signs for each magnitude (1, 10, 100, …) and no zero. Around **600 CE** the writing of numbers in India shifted to *positional* notation: one set of glyphs for 1–9, repeated by position, with a **dot** for the empty place (\cite[Chrisomalis, 2010]{chrisomalis2010}); the **Bakhshali manuscript**, radiocarbon-dated to the 3rd–4th century CE, already shows that placeholder in use. Brahmagupta's 628 CE treatise made zero a *number* with rules for arithmetic, and an inscription at **Gwalior** dated **876 CE** is the oldest dated, undisputed zero symbol. The system crossed into the Islamic world in the 8th–9th centuries, where it was called *al-ḥisāb al-hindī* — "Indian arithmetic" — and treated in dedicated monographs by **al-Khwārizmī** (c. 825) and **al-Kindī** (c. 830); the 10th-century **al-Uqlīḍīsī** was the first to extend it to decimal fractions, which is why the system is properly named "Hindu–**Arabic**" (\cite[Smith and Karpinski, 1911]{smithkarpinski1911}). Christian Europe first met the digits in the Spanish *Codex Vigilanus* of 976; **Fibonacci**'s 1202 *Liber Abaci* made them a tool of commerce; and the familiar shapes of 0–9 as we set them in type are a product of the late 15th and early 16th centuries, when the medieval Indian and Arabic glyph forms (the Ganges numerals and their descendants) settled into their European forms. "Arabic numerals" is thus a misattribution in the name: Indian invention, Arab carrier, Italian populariser. And zero was not invented only once: the **Maya** independently developed a zero (a shell glyph) for their vigesimal positional system in the Classic period (\cite[Ifrah, 2000]{ifrah2000}), and China had already been computing positionally in **base 10 on counting rods** for two millennia before the Indian system arrived, writing the empty rod position as 〇 — the oldest surviving use of that character for zero is in **Qin Jiushao**'s 1247 treatise. Zero as a *placeholder* appears at least three times independently; zero as a *number* appears once.

#### Paper: The Substrate That Made Mass Distribution Possible

External memory long predates paper: Sumerian clay tablets (c. 3400 BCE), Egyptian papyrus scrolls, Chinese oracle bones and bamboo strips, Greek wax tablets, Roman parchment codices, Indian palm-leaf manuscripts — all of these are older, and many are far older. **\citeauthor{cai_lun_paper}**'s contribution, recorded in the *Hou Hanshu* (後漢書, the official history of the Later Han dynasty), was a court memorial of 105 CE describing how to refine a sheet from mulberry bark, hemp, rags, and fishnets, hung on a frame and dried in the sun. The breakthrough was not paper itself but the *process*: cheap raw materials, mechanical pulping, and rapid drying at industrial scale, properties that clay, papyrus, and parchment lacked. The technique spread westward after the Battle of Talas (751 CE), where Chinese papermakers were captured, and reached Europe via Moorish Spain by the 11th century; the first European paper mill was established in Fabriano, Italy, around 1276, using water-powered stamping mills. Paper was the substrate for everything that followed: Hollerith's 1890 census used punched card stock, Gutenberg printed on it, scientific journals disseminated discoveries through it, and the text corpora on which modern language models are trained consist almost entirely of it. Without paper, knowledge remains scarce and local; with paper, a civilisation can accumulate, standardise, and distribute what it knows across centuries and continents.

<figure>
    <img style="width: 40%; height: auto; display: block; margin: 1em auto;" src="cai_lun.jpg" alt="Portrait of Cai Lun, the Han-dynasty official who in 105 CE described a scalable process for making paper from bark, hemp and rags" />
    <figcaption class="md">The \citealternativetitle{img_cai_lun} (Public Domain): \citeauthor{cai_lun_paper}, the Han-dynasty official whose \citeyear{cai_lun_paper} court memorial described a scalable process for making paper from mulberry bark, hemp, rags and fishnets, the breakthrough that turned a precious writing surface into an industrial substrate. Source: \citeauthor{img_cai_lun}, \citeyear{img_cai_lun}, \citealternativetitle{img_cai_lun}, Wikimedia Commons.</figcaption>
</figure>
</div>

<div class="md" data-mathlevel="35" data-depth="60">
The numeral zero, along with the positional decimal system, was \cite[introduced to Western Europe]{kleinetymology} through the work of **Leonardo of Pisa** (Fibonacci). In his 1202 work *Liber Abaci*, Fibonacci \cite[popularized the Indo-Arabic numeral system]{fibonacciliber} in the Western world, using digits $0$ through $9$ with place-value notation. Unlike the cumbersome Roman numerals used in Europe at the time, this system offered revolutionary simplicity and computational power. Fibonacci is \cite[responsible for popularising the Arabic numerals (0, 1, 2, 3, 4, …) in Europe]{fibonaccimathigon}, which was still using Roman numerals (I, V, X, D, …) in the 12th century CE.

Fibonacci \cite[studied with Arab mathematicians]{fibonaccihistory} in North Africa, where his father held a diplomatic post. The system originated in India, **Brahmagupta** (c. 628 CE) formalized arithmetic with zero in his \cite[*Brāhmasphuṭasiddhānta*]{brahmagupta628}. It reached the Islamic world through \cite[Al-Khwarizmi]{alkwarizma}, whose 9th-century *al-Kitāb al-mukhtaṣar fī ḥisāb al-jabr wa-l-muqābala* served as the conduit to North Africa and, eventually, to Fibonacci.

*Liber Abaci* also \cite[introduced Europe to the Fibonacci sequence]{fibonacciseq}:

$$F_0 = 0,\quad F_1 = 1,\quad F_n = F_{n-1} + F_{n-2}$$
</div>

<div class="md" data-depth="60">
#### The Printing Press: Mass-Producing Knowledge

<figure>
    <img style="width: 100%; height: auto; display: block;" src="gutenberg_press.jpg" alt="Engraving of William Caxton showing specimens of his printing to King Edward IV and his Queen, published in The Graphic, 30 January 1877" />
    <figcaption class="md">The Caxton Celebration (1877): William Caxton showing specimens of his printing to King Edward IV and his Queen. The Gutenberg press, developed around 1440, combined movable metal type, oil-based ink, and a modified wine press. Source: \citeauthor{img_caxton_celebration}, \citeyear{img_caxton_celebration}, \citealternativetitle{img_caxton_celebration}, Wikimedia Commons.</figcaption>
</figure>

**\citeauthor{gutenbergpress}**'s printing press, developed around 1440 in Mainz, combined movable metal type, oil-based ink, and a modified wine press into the first technology for mass-producing identical copies of text. Before Gutenberg, a single book took a scribe months to copy; after him, a press could produce thousands of pages per day. The press made the scientific revolution possible: ideas could be published, circulated, criticised, and improved across distances that a single scholar could never reach. It standardised mathematical notation (making algebra, calculus, and eventually algorithms transmissible across linguistic boundaries), enabled the *Encyclopédie*, and created the mass literacy that the World Wide Web would eventually exploit as its training corpus. Without the printing press, there is no standardisation of knowledge, no scientific community, and no web-scale text corpus on which a language model can be trained.
</div>

<div class="md" data-depth="60">
#### Double-Entry Bookkeeping: The First Error-Detecting Code

<figure>
    <img style="width: 60%; height: auto; display: block; margin: 1em auto;" src="pacioli_portrait.jpg" alt="Portrait of Luca Pacioli, c. 1495, attributed to Jacopo de' Barbari" />
    <figcaption class="md">Portrait of Luca Pacioli (c. 1495), attributed to Jacomo de' Barbari. Pacioli's Summa de Arithmetica (1494) was the first printed systematic exposition of double-entry bookkeeping — the first widely used error-detecting code. Source: \citeauthor{img_pacioli_portrait}, \citeyear{img_pacioli_portrait}, \citealternativetitle{img_pacioli_portrait}, Wikimedia Commons.</figcaption>
</figure>

**\citeauthor{paciolisumma}**'s \citeyear{paciolisumma} \citetitle{paciolisumma} did not invent double-entry bookkeeping, which had been practised in Italian merchant cities for at least two centuries, but it was the first printed, systematic exposition of the method. The principle is simple: every transaction is recorded twice, once as a debit and once as a credit, and the two sides must always balance. If they do not, an error has occurred somewhere in the ledger. This made double-entry the first widely used error-detecting code, a mechanical guarantee of numerical consistency that prefigured checksums, parity bits, and the cyclic redundancy checks that validate every packet on the modern internet. The method also enabled the joint-stock company: by providing an auditable record of assets and liabilities, it allowed strangers to pool capital, trust each other's accounting, and finance ventures from the Dutch East India Company to the semiconductor foundries of Taiwan that no individual could fund alone.
</div>

<div class="md" data-depth="40">
## The Paperwork Revolution

### The Card Catalog and the Filing Cabinet

The database has a paper ancestor. By the 1880s the card catalog was being described as the greatest library invention because it could be kept up to date: a new card could be inserted anywhere at any time, a single reference replaced a search through pages, and a card could be removed by lifting it out, while guides and locks kept the order stable (\cite[Library Bureau, 1890]{librarybureau1890catalog}). The same catalog sold the physical furniture of retrieval, including files, index cabinets, card cases, trays and fittings (\cite[Library Bureau, 1890]{librarybureau1890catalog}). Dewey's 1890 card-catalog rules then standardised the card itself: author and classed catalogs, sample cards, and rules for subject cards, coloured cards and filing (\cite[Dewey, 1890]{cardcatalogrules1890}). A record that can be inserted, removed, cross-referenced and kept in order is already a database in paper form.

### Metadata Before Databases

The other half of the paperwork revolution was classification. Dewey's 1876 *A Classification and Subject Index* was devised for cataloguing and indexing, divided the library into nine numbered classes, and was found on trial to be equally useful for numbering and arranging books on shelves; Dewey explicitly lists catalogues, shelf lists, indexes and cross-references as the things the system makes cheaper to produce (\cite[Dewey, 1876]{dewey1876classification}). Metadata, in other words, is older than the computer: a book's class number is a key, a shelf list is an index, and a cross-reference is a join.

### Insurance and the Actuary: Risk as Data

The insurance industry was one of the first institutions to turn population records into a calculable risk. Halley's 1693 paper used the bills of mortality from Breslaw to construct a table of ages and deaths, and then used that table to value annuities on lives (\cite[Halley, 1693]{halley1693mortality}). A life table is a statistical model fitted to administrative data, and its purpose is a price. Actuarial science is therefore an early example of the full pipeline that later becomes machine learning: collect records, estimate a distribution, and use it to make decisions under uncertainty.

</div>

<div class="md" data-depth="40">
### Precision Engineering and Power

#### Navigation and the Longitude Problem

<figure>
    <img style="width: 100%; height: auto; display: block;" src="mercator_1569.png" alt="Gerardus Mercator's 1569 world map, the first to use the Mercator projection" />
    <figcaption class="md">Gerardus Mercator's 1569 world map: the first cartographic projection that allowed rhumb-line courses to be plotted as straight lines on a flat sheet. The longitude problem — determining east-west position at sea — drove decades of research in precision engineering and horology. Source: \citeauthor{img_mercator_1569}, \citeyear{img_mercator_1569}, \citealternativetitle{img_mercator_1569}, Wikimedia Commons.</figcaption>
</figure>

The "longitude problem", determining one's east-west position at sea, was the great scientific challenge of the 18th century. Latitude could be found from the sun's altitude, but longitude required comparing local time (from a sextant observation) with the time at a reference meridian, which meant carrying a clock accurate to within a few seconds over months of ocean travel. **\citeauthor{mercator1569}**'s \citeyear{mercator1569} map projection had already solved the cartographic problem, allowing rhumb-line courses to be plotted as straight lines on a flat sheet. The British Board of Longitude, established in 1714 with a prize of £20,000, funded decades of research in astronomy, horology, and precision engineering. **\citeauthor{harrisonh4}**'s \citeyear{harrisonh4} chronometer finally solved the timekeeping problem, losing only five seconds over 81 days at sea. The longitude prize seeded the precision engineering tradition that would later produce chronometers, sextants, and eventually the machine tools that make interchangeable parts, the foundation of all modern hardware manufacturing.
</div>

<div class="md" data-depth="40">
#### Vacuum Technique: Emptying Space to Fill It with Electrons

<figure>
    <img style="width: 100%; height: auto; display: block;" src="magdeburg_hemispheres.jpg" alt="Reconstruction of Otto von Guericke's Magdeburg hemispheres experiment, demonstrating the vacuum" />
    <figcaption class="md">The Magdeburg hemispheres (Otto von Guericke, 1654): two copper bowls evacuated of air, held together so firmly by atmospheric pressure that teams of horses could not pull them apart. The vacuum technique pioneered here would, three centuries later, make the vacuum tube possible. Source: \citeauthor{img_magdeburg_hemispheres}, \citeyear{img_magdeburg_hemispheres}, \citealternativetitle{img_magdeburg_hemispheres}, Wikimedia Commons.</figcaption>
</figure>

**\citeauthor{torricellibarometer}**'s \citeyear{torricellibarometer} barometer demonstrated that the atmosphere has weight and, by implication, that the space above the mercury in a sealed tube is empty, a vacuum. **\citeauthor{vonguericke}**'s \citeyear{vonguericke} \citealternativetitle{vonguericke} (1654) made the point dramatically: two teams of horses could not pull apart a sphere evacuated of air. But the decisive step for computation was the development of glassblowing techniques that could seal metal electrodes inside a glass envelope from which the air had been removed. **\citeauthor{geisslertube}**'s \citeyear{geisslertube} \citealternativetitle{geisslertube} (1857) showed that electric current through low-pressure gas produces coloured light. Thomas Edison observed in 1883 that electrons flow from a heated filament to a metal plate inside a vacuum, the "Edison effect." **\citeauthor{flemingdiode}**'s \citeyear{flemingdiode} \citealternativetitle{flemingdiode} used this effect to build the first electronic rectifier; **\citeauthor{deforestaudion}**'s \citeyear{deforestaudion} \citealternativetitle{deforestaudion} (1906) added a third electrode to create the first electronic amplifier. The ENIAC (1946) used 18,000 vacuum tubes; every electronic computer until the transistor era was a room full of glowing glass bulbs, each one dependent on the vacuum techniques pioneered by Torricelli and von Guericke three centuries earlier.
</div>

<div class="md" data-depth="40">
#### Precision Clocks: The Metronome of Computation

**\citeauthor{huygenspendulum}**'s \citeyear{huygenspendulum} \citetitle{huygenspendulum} built the first pendulum clock in 1656, improving daily accuracy from roughly 15 minutes to about 15 seconds. The key innovation was the escapement mechanism, a device that converts the continuous swing of a pendulum into discrete, uniform ticks. This is the mechanical ancestor of every digital clock: the escapement does for mechanical time what the quartz crystal oscillator (first used in a clock by Warren Marrison at Bell Labs in 1927) does for electronic time, and what the clock signal in a CPU does for computation, namely it breaks continuous flow into countable, synchronous steps. Without precision clocks, there is no synchronous digital logic, no time-division multiplexing in telecommunications, no coordinated distributed systems, and no GPS timestamps. Every modern computer is, at its core, a clock-driven machine.

<figure>
    <img style="width: 45%; height: auto; display: block; margin: 1em auto;" src="huygens_horologium_1673.jpeg" alt="Title page or plate from Christiaan Huygens' Horologium Oscillatorium (1673), the foundational treatise on the pendulum clock" />
    <figcaption class="md">The \citealternativetitle{img_huygens_horologium} (Public Domain): \citeauthor{huygenspendulum}'s \citetitle{huygenspendulum} (\citeyear{img_huygens_horologium}), the treatise that gave the pendulum clock its geometric and mathematical foundations, the instrument whose escapement broke continuous time into countable, synchronous steps. Source: \citeauthor{img_huygens_horologium}, \citeyear{img_huygens_horologium}, \citealternativetitle{img_huygens_horologium}, Wikimedia Commons.</figcaption>
</figure>
</div>

<div class="md" data-depth="20">
## The Standardized World

### Standard Time and Time Zones

A network of machines needs a shared clock. The 1884 International Meridian Conference proposed a single prime meridian for all nations, adopted the meridian of Greenwich as the initial meridian for longitude, and proposed a universal day counted from zero to twenty-four hours from mean midnight at that meridian (\cite[International Meridian Conference, 1884]{meridian1884proceedings}). The resolutions were not self-executing, but they gave railways, telegraphs and later computer networks a common temporal coordinate. The Network Time Protocol then did for computer clocks what the conference did for civil time: RFC 5905 describes a protocol that synchronises computer clocks across the Internet, with accuracy extending to tens of microseconds on modern workstations and fast local networks (\cite[Mills et al., 2010]{rfc5905}). Distributed training, logging and transaction ordering all assume that the clocks agree.

### The Barcode and the QR Code

The barcode gave the physical world a machine-readable identifier. Woodland and Silver's 1952 patent, "Classifying apparatus and method," describes identifying patterns that are read by photo-sensitive apparatus, so that things can be classified without relying on their own characteristics, and explicitly proposes the apparatus as a sensory and classifying organ for tabulating, computing and sorting machines (\cite[Woodland and Silver, 1952]{woodland1952barcode}). The QR code extended the idea to two dimensions: DENSO WAVE released it in 1994 with high data capacity, Kanji and Kana support, error correction and 360-degree reading, and it became an AIM standard in 1997, a Japanese industrial standard in 1999 and an ISO standard in 2000 (\cite[DENSO WAVE, 2026]{denso_qr_history}). A barcode is a join key between a physical object and a database row; a QR code is the same idea with more bits.

</div>

<div class="md" data-depth="40">
#### The Steam Engine: Powering Precision Manufacturing

**\citeauthor{newcomenengine}**'s \citeyear{newcomenengine} atmospheric steam engine was the first practical device for converting thermal energy into mechanical work. Built to pump water from flooded coal mines, it consumed enormous quantities of coal and did so inefficiently. **\citeauthor{wattpatent}**'s \citeyear{wattpatent} separate-condenser patent improved efficiency roughly fourfold, making steam power economical for factories, mills, and eventually railways and ships. The steam engine's significance for computation is indirect but essential: it powered the machine tools (lathes, milling machines, grinders) that produced the precision-machined interchangeable parts on which all subsequent engineering, from Babbage's difference engine to the wave-soldered PCBs of modern data centers, would depend. It also drove the Industrial Revolution's demand for standardised measurement, interchangeable components, and systematic quality control, the same practices, at nanometre scale, that govern semiconductor fabrication today.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="watt_steam_engine_lauder.jpg" alt="James Eckford Lauder's painting of James Watt and the steam engine, showing the engineer at his separate-condenser engine" />
    <figcaption class="md">The \citealternativetitle{img_watt_steam_engine} (Public Domain): \citeauthor{wattpatent} and his separate-condenser engine, the device that made steam power economical enough to drive the machine tools of precision manufacturing. Source: \citeauthor{img_watt_steam_engine}, \citeyear{img_watt_steam_engine}, \citealternativetitle{img_watt_steam_engine}, Wikimedia Commons.</figcaption>
</figure>
</div>

<div class="md" data-depth="60">
#### Refrigeration and Cooling: Keeping the Mind from Melting

A modern data center generates enormous quantities of heat. Training a large language model pushes thousands of GPUs to their thermal limits for weeks or months. Without industrial **cooling systems**, the silicon would overheat and fail within minutes.

Long before mechanical refrigeration existed, the cold itself had to be **harvested in winter and stored for summer use**. The oldest strategy was the **[Eisweiher](ice pond)**: a small, shallow, wind-sheltered body of water, often an artificial pond or a specially dammed millpond, chosen so that a few days of sustained frost would freeze it solid. The surface was then cut into rectangular blocks with hand saws, pried loose with pike poles, and hauled by sled, cart, or slide into an insulated **ice cellar** (*Eiskeller*) packed with straw, where it could last through the warm months (\cite[Ice-cutting on Lake Traunsee, 1899]{eisschlagen_traunsee}). The technique was in continuous use across Central Europe from the Middle Ages well into the twentieth century, and the name *Eisweiher* survives on ponds that today serve very different purposes, as fish ponds, fire-water reservoirs, or simply recreational lakes.

Where no suitable pond existed, breweries, hospitals, hotels, and food businesses erected **[Eisgalgen](ice gallows)**: wooden or steel frames fitted with sturdy horizontal crossbeams. At temperatures below about −3 °C, well or spring water was sprayed from nozzles over the rig, freezing into long icicles that could grow several metres down over the course of a cold week. The icicles were then knocked off with mallets, collected, and stored (\cite[Ice gallows (Eisgalgen) at Mittenwald, 2015]{eisgalgen_mittenwald}). A single large installation, such as the one still occasionally operated at a brewery in Ulm, can “harvest” up to 100 m³ of ice during a sufficiently cold week. Unlike pond ice, gallows ice gave the operator direct control over water quality, and made ice production independent of any nearby natural waterbody, a complete ice-making installation with no moving parts and no machinery at all.

<div class="image-row">
    <figure>
        <img src="eisschlagen_traunsee.jpg" alt="Black-and-white photograph of men cutting and transporting ice on a frozen Austrian lake, December 1899" />
        <figcaption class="md">\citealternativetitle{eisschlagen_traunsee}: ice-cutting (*Eisschlagen*) on an Austrian lake, December 1899. The frozen surface is being sawn into rectangular blocks, pried loose with pike poles, and carted off to a nearby ice cellar for summer use, the basic workflow of every *Eisweiher* from the Middle Ages to the early 20th century.</figcaption>
    </figure>
    <figure>
        <img src="eisgalgen_mittenwald.jpg" alt="A wooden ice gallows in Mittenwald, Bavaria, photographed in January 2015" />
        <figcaption class="md">\citealternativetitle{eisgalgen_mittenwald}: a wooden ice gallows (*Eisgalgen*) at the Dekan-Karl-Platz in Mittenwald, Bavaria, January 2015. Water sprayed over the frame freezes into icicles several metres long, a fully mechanical ice factory that requires nothing but gravity and sub-zero air.</figcaption>
    </figure>
</div>

The history of **artificial** cooling traces back to **William Cullen**, who demonstrated artificial refrigeration by evaporating ethyl ether in a partial vacuum at the University of Glasgow, described in \citetitle{cullencold}. The technology was later industrialized through the work of **Carl von Linde**, whose ammonia-compression refrigerator (\cite[German Patent DE 1250]{patent1250}, 1877) made large-scale cooling commercially viable, and **Willis Carrier** (1902), who designed the first modern air-conditioning system for the Sackett-Wilhelms Lithographing & Publishing Company in Brooklyn, later formalized in his paper \citetitle{psychrometric} (presented to the American Society of Mechanical Engineers, 1911).

Today, hyperscale data centers use elaborate cooling systems, from chilled water loops to, increasingly, liquid immersion cooling, consuming megawatts of power just to prevent the hardware from destroying itself. The quiet hum of air conditioning in a server room is as essential to the existence of ChatGPT as the Transformer architecture itself.
</div>

<div class="md" data-depth="20">
### Programmable Media and the Image

#### The Jacquard Loom: Weaving the Concept of Programmable Input

In 1804, **Joseph Marie Jacquard** perfected a loom attachment that used **punched cards** to automate the weaving of complex textile patterns. Each card encoded a single row: hole or no hole, thread up or thread down. By chaining cards together, an intricate brocade could be reproduced without a skilled assistant manually selecting each thread, a purely industrial innovation with no computational intent.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="jacquard_loom.jpg" alt="A Jacquard loom at the National Museum of Scotland, showing the chain of punched cards hanging vertically at the right" />
    <figcaption class="md">The \citealternativetitle{jacquard_loom}: a Jacquard loom with its chain of punched cards visible on the right. Each card encodes a single row of the pattern, the first example of a complex, sequential process stored as discrete binary instructions on a physical medium.</figcaption>
</figure>

Yet the conceptual leap was immense: a complex, sequential process had been **encoded as discrete binary instructions on a physical medium**. **Charles Babbage** explicitly borrowed the mechanism for his **Analytical Engine** (c. 1837), and **Ada Lovelace** captured the lineage precisely: the Engine “weaves algebraic patterns just as the Jacquard-loom weaves flowers and leaves” (\citetitle{lovelacequote}). **Herman Hollerith** later adapted punched cards for the **1890 US Census**, founding the company that became **IBM**. Punched cards remained the dominant computer input medium into the 1970s (see \citetitle{taocp3}, p. 383-384).

Programmability itself is older than the loom. In ninth-century Baghdad the Banū Mūsā brothers described an **automatic flute player** whose pinned barrel let a single instrument perform different tunes, a "program" in the most literal sense, now read as the first programmable machine (\cite[Koetsier, 2001]{koetsier2001programmable}). Four centuries later the engineer **al-Jazari** (1206) built automata, including a programmable drum machine, whose behaviour was set by interchangeable mechanical parts (\cite[Sharkey]{sharkey2007jazari}). What the loom added was not the idea of a program but its *industrial practicality*: punched cards that anyone could reorder to change the output.

Without the loom, there is no concept of externally encoded, interchangeable instructions, no punched card, no magnetic tape, no software. A textile artisan solving a manufacturing problem inadvertently created the first programmable input mechanism.
</div>

<div class="md" data-depth="40">
While Leibniz's Stepped Reckoner proved that mechanical calculation was possible, it remained a fragile prototype, prone to jamming and never reliable enough for daily use. The gap between theoretical proof-of-concept and practical tool was bridged over a century later by **Charles Xavier Thomas de Colmar**, a French inventor and entrepreneur.

In \citeyear{thomasdcolmar1820}, Thomas de Colmar patented the **Arithmometer**, a calculating machine based on Leibniz's stepped drum mechanism. What distinguished it from all prior devices was not mathematical novelty but *engineering reliability and commercial viability*. After decades of refinement, the Arithmometer entered mass production in the 1850s, becoming the **first commercially successful mechanical calculator** and the first to be produced in industrial quantities.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="arithmometer_thomas.jpg" alt="A brass Arithmometer by Thomas de Colmar, c. 1850, displayed at the Musée des Arts et Métiers in Paris, with its sliding carriage and result register visible" />
    <figcaption class="md">\citealternativetitle{arithmometer_thomas}: the Arithmometer of Thomas de Colmar, c. 1850, at the Musée des Arts et Métiers in Paris. Based on Leibniz's stepped drum, this brass device was the first calculator reliable enough to be mass-produced and sold to banks, insurers and governments.</figcaption>
</figure>

The machine could perform addition, subtraction, multiplication, and division, and was sold to banks, insurance companies, and government offices across Europe. It remained in production for over 90 years, with various manufacturers producing improved models well into the 20th century.

The Arithmometer's significance lies not in a conceptual breakthrough but in a practical one: it proved that Leibniz's dream of mechanized calculation could be made robust, reproducible, and useful to non-specialists. It represents the moment when the “calculator” ceased to be a philosopher's curiosity and became a **commercial product**, an essential step in the trajectory from abstract logic to the industrial-scale computation that would eventually power AI systems.
</div>

<div class="md" data-depth="20">
#### From Niépce's Pewter Plate to Muybridge's Plates: The Birth of Image-Sequence Data

A modern vision model is, at the level of bytes, a pile of images together with labels. That shape, a labelled image-sequence dataset, has a remarkably concrete origin in 19th-century France and Philadelphia.

The very first surviving camera photograph was made by **Joseph Nicéphore Niépce** around 1826–1827 at his estate in Saint-Loup-de-Varennes. His *Point de vue du Gras*, a view from a window onto the courtyard below, was fixed onto a pewter plate coated with bitumen of Judea. Because the light-sensitive asphalt needed roughly **eight hours of exposure**, the sun appears to illuminate the buildings from both sides at once, an artefact no human eye could ever have witnessed. The plate itself survived, and is held today at the \cite[Harry Ransom Center]{niepce_le_gras} at the University of Texas at Austin.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="niepce_le_gras.jpg" alt="Niépce's 1826/27 heliograph \"View from the Window at Le Gras\" — the oldest surviving camera photograph" />
    <figcaption class="md">The \citealternativetitle{niepce_le_gras}: the oldest surviving camera photograph, captured on a bitumen-coated pewter plate over the course of an entire day. The 8-hour exposure causes sunlight to fall on the buildings from both sides simultaneously, a property of no real scene, only of the extremely long time-integral Niépce's chemistry required.</figcaption>
</figure>

Photography matured rapidly over the following decades. Louis Daguerre's *daguerreotype* (publicly announced in 1839) brought exposure times down from hours to minutes, and William Henry Fox Talbot's *calotype* introduced the paper negative, the basis of modern film. By the 1870s, instantaneous photography was possible, and the question of whether a galloping horse was ever fully airborne, an argument that had defeated painters for centuries, was finally within reach of an answer.

In 1878, the industrialist **Leland Stanford** commissioned **Eadweard Muybridge** to settle the question. Muybridge rigged a row of twelve tripwire-triggered cameras along Stanford's Palo Alto racecourse. On June 19 of that year, the horse *Occident* galloped past and the shutters fired in sequence. The result, ***The Horse in Motion***, is the founding image of **chronophotography**: a time-series of photographs in which each frame is a discrete, time-stamped sample of a continuous motion.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="muybridge_horse_gallop.jpg" alt="Muybridge's sequence of a galloping horse from 1878 — the founding image of chronophotography" />
    <figcaption class="md">Muybridge's 1878 sequence of the horse *Occident* galloping past a battery of tripwire cameras: the founding image of \citealternativetitle{muybridge1887catalogue}, and arguably the first instance in history of a *labelled image-sequence dataset*: a continuous motion, sampled in equal time-intervals, with the subject, action and breed known in advance.</figcaption>
</figure>

Encouraged, the University of Pennsylvania commissioned Muybridge between 1884 and 1887 to extend this approach systematically. The resulting work, ***Animal Locomotion***, comprised **781 collotype plates containing more than 20,000 individual photographs** (\cite[Muybridge, 1887]{muybridge1887catalogue}). Each plate captured a single motion (a woman opening a parasol, an ostrich running, a child ascending stairs) in 36 successive frames, photographed by 12 to 24 synchronised cameras whose shutters were tripped by electromagnets and time-stamped by a chronographic clock. Crucially, every plate was **annotated**: subject, action, age, build, even clothing and props, in exactly the form of a modern supervised-learning dataset. Plate 626, for instance, is not just a horse running, it is *“Gallop; thoroughbred bay mare, Annie G.”*

Two structural inventions of this project have proved decisive for every vision model trained since:

1. **The labelled image sequence.** Muybridge's plates are rows of equal-time-interval frames of a known subject performing a known action. This is the schema of ImageNet, Kinetics, Something-Something and YouTube-8M, expressed in 1887. The model has not changed; only the volume and the digital substrate have.
2. **Synchronised multi-view capture.** To resolve the foreshortening that confuses single-perspective images, Muybridge placed additional camera banks at the front and rear of his track, and built a six-camera array that fired simultaneously from different angles, the conceptual ancestor of modern **multi-view stereo, photogrammetry, NeRF and 3D Gaussian Splatting**, all of which are trained on Muybridge-style synchronised image-sets of a scene captured from many viewpoints.

Muybridge went further still. He built the **zoöpraxiscope**, a projection device that replayed his sequences as cyclical animations, the technical seed of motion pictures, and through them of Disney, CGI, Pixar and the rendered-image training corpora that today's image-generation models consume by the petabyte. As \citeauthor{solnit2003motion} argues in her study of the project, Muybridge's *“invention was not the photograph, but the sequence”*, and the sequence is the data structure of every modern visual network.

\citeauthor{gordon2015indecent} has catalogued how systematic the project was: a hierarchy from nude human males down to chickens, ordered by a 19th-century logic of the *scala naturae*, but presented in the visual grammar of a modern corpus, complete with controlled backgrounds, grid markings for measurement, and rejection of out-of-sequence frames. The aesthetic of an AI training set, in other words, predates the algorithm by half a century.

Without chronophotography there are no video frames. Without labelled image-sequences there are no video-classification, action-recognition or world-model datasets. Without synchronised multi-view capture there are no neural radiance fields. Without Muybridge's pewter and silver plates, the contemporary vision stack has nothing to look at. The trained image lives because a horse galloped past a row of tripwires in Palo Alto, and a stubborn photographer was willing to spend three years at the University of Pennsylvania counting its hoofbeats.
</div>

<div class="md" data-depth="20">
#### From a Baby's Face to the GPU: Space Image Processing

Muybridge's labelled images stayed, for half a century, a pile of glass plates. The first photograph a computer ever processed was not a picture of the Moon. In 1957, at the National Bureau of Standards, **Russell Kirsch** built a **drum scanner** and scanned a photograph of his three-month-old son, **Walden**, into a 176×176 array of numbers processed on the bureau's SEAC computer (\cite[Nilsson, The Quest for Artificial Intelligence]{nilsson1984qai}).

<figure>
    <img style="width: 55%; height: auto; display: block; margin: 1em auto;" src="kirsch_baby_1957.jpg" alt="The first digital image: a 1957 scan of Russell Kirsch's son Walden, 176 by 176 pixels" />
    <figcaption class="md">The \citealternativetitle{img_kirsch_baby} (Public Domain, \citeauthor{img_kirsch_baby}): the first image a computer ever processed — not the Moon, but a baby. A 176×176 scan of Kirsch's three-month-old son, 1957.</figcaption>
</figure>

The first large-scale *space* image processing came seven years later, at NASA's Jet Propulsion Laboratory, cleaning up grainy pictures of the Moon and the planets arriving over a slow radio link.

\citeauthor{tomayko1988spaceflight} records that **Robert Nathan** at JPL pioneered **digital image processing** to enhance the images from the Ranger, Surveyor and Mariner probes \cite{tomayko1988spaceflight}: stretching their contrast, normalising their uneven illumination with high-pass filtering, correcting their geometric distortion, and eliminating their noise. Because the images were far too big and slow for an astronomer to fix by eye, Nathan's team wrote **VICAR** (Video Information Communication and Retrieval), a language that let a user *chain* image-processing operations together, the conceptual ancestor of the modern computer-vision pipeline, where one feeds an image through a stack of transforms \cite{tomayko1988spaceflight}. Those techniques spread, almost immediately, into astronomy and into medical imaging (the enhancement of x-ray scans), and became the quiet foundation on which modern computer vision, and the neural networks trained on image data, were later built \cite{tomayko1988spaceflight}.

The hardware half of the story is the more direct foreshadow of the GPU. To make these operations fast enough, Nathan went on to pioneer **VLSI chips that implemented image-processing algorithms in hardware**, wiring up a 35×35 array of parallel multipliers to accelerate a computation by a factor of **1,225** \cite{tomayko1988spaceflight}. A grid of parallel multipliers doing a two-dimensional array operation in one shot is, at the level of the idea, exactly what a modern GPU or TPU is. The machine that made the Moon pictures clearer is a direct, if unacknowledged, ancestor of the accelerator that trains a language model.

<figure>
    <img style="width: 70%; height: auto; display: block; margin: 1em auto;" src="ranger7_moon.jpg" alt="A lunar surface image from NASA's Ranger 7 probe, 1964, the kind of grainy image Robert Nathan's team enhanced with the first space image-processing pipelines" />
    <figcaption class="md">The \citealternativetitle{img_ranger7_moon} (Public Domain): a lunar image from NASA's \citealternativetitle{img_ranger7_moon} probe, the kind of grainy, unevenly-lit picture that Robert Nathan's JPL team enhanced with the first *space* image-processing pipelines, the quiet ancestor of the modern computer-vision stack (\cite[Tomayko, 1988]{tomayko1988spaceflight}). Source: \citeauthor{img_ranger7_moon}, \citeyear{img_ranger7_moon}, \citealternativetitle{img_ranger7_moon}, Wikimedia Commons.</figcaption>
</figure>

<div class="image-row">
    <figure>
        <img src="ranger7_guericke.jpg" alt="Ranger 7 B-camera image of Guericke crater in Mare Nubium, taken 8.5 minutes before the spacecraft struck the Moon" />
        <figcaption class="md">The \citealternativetitle{img_ranger7_guericke} (Public Domain): Ranger 7's B-camera photograph of <em>Guericke</em> crater in Mare Nubium, taken 8.5 minutes before impact — a grainy, unevenly-lit frame exactly like the ones Nathan's new pipelines had to stretch, flatten and de-noise. Source: \citeauthor{img_ranger7_guericke}, \citeyear{img_ranger7_guericke}, \citealternativetitle{img_ranger7_guericke}, Wikimedia Commons.</figcaption>
    </figure>
    <figure>
        <img src="ranger7_impact.jpg" alt="Ranger 7's final, highest-resolution photograph of the Moon, taken moments before the spacecraft struck the lunar surface" />
        <figcaption class="md">The \citealternativetitle{img_ranger7_impact} (Public Domain): Ranger 7's final photograph, the highest-resolution picture of the Moon taken up to that date, moments before the spacecraft struck the surface. Source: \citeauthor{img_ranger7_impact}, \citeyear{img_ranger7_impact}, \citealternativetitle{img_ranger7_impact}, Wikimedia Commons.</figcaption>
    </figure>
</div>

While NASA cleaned up the Moon, the first large-scale *commercial* image processing was reading bank checks. SRI International's **MICR** (magnetic ink character recognition) system read the stylized digits at the bottom of a check as part of the **ERMA** (Electronic Recording Method of Accounting) system: in 1956 the Bank of America announced General Electric as its production builder, the first 32 ERMA machines arrived in 1959, and ERMA read the bank's checks until 1970 (\cite[Nilsson, The Quest for Artificial Intelligence]{nilsson1984qai}). By the time a symposium on optical character recognition met in Washington, DC, in January 1962, the state of the art was summed up best by J. Rabinow of Rabinow Engineering: "We think, in our company, that we can read anything that is printed, and we can even read some things that are written. The only catch is, 'how many bucks do you have to spend?'" (\cite[Nilsson, The Quest for Artificial Intelligence]{nilsson1984qai}).

In a later interview, Kirsch said that by 1957 he was "intrigued by what the linguists were able to do with grammar on computers" and asked, in his words, "what seemed to me to be sort of an obvious question: Could you do the same thing with pictures?" With his wife Joan he developed a grammar for analyzing (and producing) pictures, and used it in a program that could "create lines and patterns in the style of" the Bay Area artist **Richard Diebenkorn**; shown the output, Diebenkorn agreed it "looked strikingly similar to something he would be likely to paint" — the computer's image was "almost identical to one that Diebenkorn had already painted" (\cite[Nilsson, The Quest for Artificial Intelligence]{nilsson1984qai}). The idea reappears in modern vision in Song-Chun Zhu's "stochastic grammars of images", which decompose an image into its component parts, parse-tree style (\cite[Nilsson, The Quest for Artificial Intelligence]{nilsson1984qai}).
</div>

<div class="md" data-depth="20">
## The Analog World Becomes Data

### The ADC: Where the World Becomes Numbers

A microphone, a radio antenna and a temperature sensor all produce continuous voltages. The first step into the digital world is sampling and quantisation. Shannon proved that a function limited to a band of W cycles per second is completely determined by its ordinates at discrete points spaced 1/(2W) seconds apart (\cite[Shannon, 1948]{shannon1948communication}). The analog-to-digital converter is the device that performs this reduction. Walden's survey calls ADCs ubiquitous, critical components of software radio and other signal-processing systems, and maps the trade-off between resolution and sampling rate: below about two million samples per second resolution is limited by thermal noise, and at higher rates it falls by about one bit for every doubling of the sampling rate because of aperture jitter (\cite[Walden, 1999]{walden1999adc}). Every image, every sound recording and every sensor reading in a training set passed through such a device.

### The Digital Eye: CCD and CMOS

The image sensor is a silicon chip that converts photons into charge and then into numbers. Boyle and Smith's charge-coupled device stores charge in potential wells at the surface of a semiconductor and moves it from one capacitor to the next by manipulating electrode potentials; they explicitly listed imaging as one of its applications (\cite[Boyle and Smith, 1970]{boyle1970ccd}). CMOS active-pixel sensors later made the camera small, cheap and low-power enough to sit in every phone: Fossum describes them as competitive with CCD technology while offering on-chip functionality, lower system power, lower cost and miniaturisation, including on-chip analog-to-digital conversion (\cite[Fossum, 1997]{fossum1997cmos}). Machine vision is downstream of that device.

### The FFT: Making Waves Computable

The discrete Fourier transform turns a signal into its frequency components, but the naive sum is expensive. The Cooley-Tukey algorithm computes the same transform with a recursive factorisation that made Fourier analysis practical on a machine (\cite[Cooley and Tukey, 1965]{cooley1965fft}). The consequences are everywhere: spectral analysis, filtering, radar and audio processing, image compression, and the convolution kernels inside neural networks all depend on fast transforms. The algorithm is a pure mathematical displacement: invented for numerical analysis, it became a load-bearing part of the signal-processing stack that feeds AI.

### The Laser: Coherent Light as a Tool

The laser is a device for generating or amplifying coherent light. Maiman's patent describes a ruby laser system and the principle of pumping a solid medium to produce coherent emission, following the maser idea proposed by Schawlow and Townes (\cite[Maiman, 1967]{maiman1967laserpatent}). Coherent light then became a tool: it carries signals through glass fibre, reads barcodes, measures distance in LIDAR and exposes patterns in lithography. None of these uses was the point of the original device. The laser is the archetype of a displaced prerequisite: a solution in search of problems, which eventually supplied several of the problems' solutions.

</div>

<div class="md" data-depth="20">
### Networks and Interfaces

#### Land Telegraphy: The First Digital Network

<figure>
    <img style="width: 100%; height: auto; display: block;" src="morse_telegraph.jpg" alt="A Morse telegraph key, the first device for digital electronic communication" />
    <figcaption class="md">A Morse telegraph key: the first practical interface for digital electronic communication. Morse code, a variable-length binary encoding using dots and dashes, was the first digital communication protocol. Source: \citeauthor{img_morse_telegraph}, \citeyear{img_morse_telegraph}, \citealternativetitle{img_morse_telegraph}, Wikimedia Commons.</figcaption>
</figure>

**\citeauthor{morsetelegraph}**'s \citeyear{morsetelegraph} electromagnetic telegraph and the competing **\citeauthor{cookewheatstone}** \citeyear{cookewheatstone} were the first practical technologies for transmitting information faster than a horse could ride. Morse code, a variable-length binary encoding using short signals (dots) and long signals (dashes), was the first digital communication protocol. By 1866, a transatlantic cable linked Europe and North America; by 1900, over two million miles of telegraph wire encircled the globe. The telegraph introduced concepts that would later become foundational to computer networking: message routing through relay stations (the direct ancestor of packet-switched routers), standardised protocols for interoperation between different manufacturers' equipment, and the idea that a "network" could span continents. The store-and-forward relay stations of the telegraph era were the architectural template for ARPANET's packet-switched routers a century later. Without the telegraph, there is no instant communication, no coordinated railroad scheduling, and no concept of a network of machines forwarding messages, and therefore no internet.
</div>

<div class="md" data-depth="20">
#### Fiber Optics and Submarine Cables: The Physical Internet

The “digital ocean” of training data does not exist in an abstract cloud; it flows through **physical infrastructure** that has its own displaced history:

* **Total Internal Reflection** (1842): **Jean-Daniel Colladon** demonstrated that light could be guided along curved paths through a jet of water in \citetitle{colladon}. **John Tyndall** independently popularized the same principle through his Royal Institution lectures in London during the 1850s and 1870s, later described in \citetitle{notesonlight} (1870). At the time, these seemed little more than elegant scientific demonstrations.

<figure>
    <img style="width: 60%; height: auto; display: block; margin: 1em auto;" src="colladon_lightpipe.jpg" alt="Historical engraving of Jean-Daniel Colladon's 'lightfountain' experiment, demonstrating total internal reflection in a jet of water" />
    <figcaption class="md">The \citealternativetitle{colladon_lightpipe}: light entering one end of a curved jet of water re-emerges from the other, trapped by total internal reflection. A purely optical phenomenon that, 130 years later, became the physical basis of long-distance data transmission.</figcaption>
</figure>

* **Fiber Optic Communication** (1966): **Charles K. Kao** and **George A. Hockham** theorized that glass fibers could transmit data over long distances if impurities were reduced below a critical threshold, publishing \citetitle{fibreoptics}. This earned Kao the Nobel Prize in Physics in 2009. The subsequent development of ultra-pure glass fibers by researchers at Corning Glass Works (\citetitle{radiationlosses}) enabled the modern internet's backbone.
* **Submarine Cables**: Over 95% of intercontinental data traffic travels through undersea fiber optic cables, a lineage traceable to the first **transatlantic telegraph cable** completed in August 1858, a project led by **Cyrus West Field** and chronicled in William Thomson's (Lord Kelvin's) reports to the Royal Society. The physical network that connects data centers, users, and the servers hosting LLMs is a material infrastructure as essential as the algorithms themselves.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="submarine_cable.png" alt="Cross-section illustration of a modern submarine fiber-optic communications cable, showing the optical fibers, copper power conductor, polyethylene insulation and steel armor" />
    <figcaption class="md">\citealternativetitle{submarine_cable}: an annotated cross-section of a modern submarine communications cable. Hair-thin glass fibers at the center, surrounded by copper, steel and polyethylene, carry intercontinental data traffic at terabits per second.</figcaption>
</figure>

Without these cables, the internet is a collection of isolated local networks. Without the internet, there is no web-scale training corpus. Without the training corpus, there is no LLM.
</div>

<div class="md" data-depth="20">
#### The Silent Other Half: Insulating Electricity from Itself

For every copper wire that carried the first telegraph signal, some unknown insulator had to wrap around it and refuse to carry it themselves. Without insulation, electricity simply arcs to the nearest ground and dissipates as heat; the entire discipline of electrical engineering exists only because someone, somewhere, found a material whose electrons refused to move. The displaced prerequisite, in other words, is not the conductor but the **resistor of motion around it**. The \citealternativetitle{guttapercha} tree, a *Palaquium* of the Malay archipelago, was tapped for centuries by local craftsmen before the British surgeon **William Montgomerie** identified in 1843 its unusual dielectric strength and thermoplastic behaviour. **\citeauthor{faraday}** recognised its insulating value at its introduction, and by 1845 it was being extruded around copper wire to form the first insulated telegraph conductors. **\citeauthor{atlantictelegraph}**'s \citeyear{atlantictelegraph} book \citetitle{atlantictelegraph} documents the central role the material played in the 1857–1858 transatlantic cable attempts: 2,600 nautical miles of copper conductor had to be wrapped in gutta-percha to survive a mile-deep ocean without short-circuiting to seawater. Without gutta-percha, no submarine cable, no global telegraph, no instant transatlantic news, no cable-stitched internet, no undersea fibre backbone.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="gutta_percha_cable.png" alt="Engraving of the apparatus used to wrap the copper wires of the transatlantic cable in gutta-percha insulation, after Louis Figuier" />
    <figcaption class="md">The \citealternativetitle{img_gutta_percha_cable} (Public Domain): the apparatus for wrapping the copper conductors of the \citealternativetitle{atlantictelegraph} in \citealternativetitle{guttapercha}, the silent other half of the telegraph, the insulator whose stubbornness let the signal *stay* a signal across a mile-deep ocean. Source: \citeauthor{img_gutta_percha_cable}, \citeyear{img_gutta_percha_cable}, \citealternativetitle{img_gutta_percha_cable}, Wikimedia Commons.</figcaption>
</figure>

The second wave of insulation was synthetic. **\citeauthor{goodyearvulcanization}**'s \citeyear{goodyearvulcanization} patent (U.S. Patent 3,633) hardened natural rubber with sulfur and heat, transforming a sticky tropical sap into a tough, elastic, electrically insulating material that could wrap the dynamos, switches, and wires of the new electric power industry. **\citeauthor{baekelandpatent}**'s \citeyear{baekelandpatent} patent (U.S. Patent 942,699) for "hard, insoluble and infusible condensation products of phenols and formaldehyde" gave the world **Bakelite**, the first fully synthetic plastic and the dominant electrical insulator of the early twentieth century: coil bobbins, switch bases, radio housings, distributor caps, and the brown telephone cases that populated every office in the Western world. By 1940, however, a different polymer had quietly displaced both rubber and gutta-percha in most cable applications. The ICI team of Eric Fawcett and Reginald Gibson, working in 1933 at several hundred atmospheres pressure in Northwich, England, accidentally produced a white waxy substance they called polyethylene, and **\citeauthor{polyethylenehistory}**'s article on the polymer documents how commercial production by ICI from 1939 onward was immediately classified by the British government because the material's extremely low loss at UHF and SHF frequencies made it the perfect insulator for the coaxial cables of radar sets — a fact that would only be declassified after the war.

Strip any single one of these insulating materials from the causal chain and the chain breaks. Bakelite bobbins let Tesla and Westinghouse's AC motors run unattended for decades; polyethylene's controlled dielectric constant makes the twisted-pair cable in every Ethernet port possible, and its low-loss profile at microwave frequencies is what lets the radar, the cell tower, and the satellite downlink carry data across a continent or an ocean. The enamel coating on a single copper magnet wire is, today, a thin shell of polyimide or polyurethane whose molecular structure was engineered for a thermal class invented for the 1960s space program. Without insulation, the conductor alone cannot even *be* a conductor — a wire shorted to ground is not a wire but a fuse. The displaced prerequisite here is not the metal, not the signal, but the stubbornness of the material wrapped around the metal that lets the signal *stay* a signal.
</div>

<div class="md" data-depth="20">
#### From Typewriters to Keyboards: The Mechanical Alphabet

Every prompt typed into an LLM passes through a **keyboard** whose layout was dictated not by computation, but by the jamming tendencies of 19th-century typebar mechanisms.

In 1868, **Christopher Latham Sholes**, Carlos Glidden, and Samuel W. Soule patented an early typewriter (\cite[U.S. Patent 79,265]{typewriterpatent}). By 1874, **E. Remington and Sons** began mass-producing the **Sholes & Glidden Type-Writer**, featuring the **QWERTY** layout, an arrangement designed to separate commonly paired letters and prevent adjacent typebars from colliding. This layout, born from a purely mechanical constraint, became the universal standard for text input and has survived virtually unchanged for over 150 years.

<figure>
    <img style="width: 70%; height: auto; display: block; margin: 1em auto;" src="sholes_typewriter.jpg" alt="The original Sholes typewriter prototype with circular key arrangement" />
    <figcaption class="md">\citealternativetitle{sholes_typewriter}: the original Sholes, Glidden and Soule prototype typewriter (1868–1873), manufactured by E. Remington and Sons as the Sholes &amp; Glidden Type-Writer. The QWERTY layout, designed to prevent adjacent typebars from jamming, became the universal input standard that survives into the era of LLM chatbots.</figcaption>
</figure>

**Teletypes** in the early 20th century adapted the typewriter keyboard for electrical communication, encoding keystrokes as signals over telegraph lines. When **video terminals** replaced teletypes in the 1970s, the QWERTY keyboard carried over unchanged. The computer keyboard is, in every functional sense, a typewriter with its mechanical linkage replaced by an electrical switch matrix.

Today, a user's fingers follow a key arrangement dictated by 1870s typebar physics, yet without the typewriter's standardization of rapid text input, the entire paradigm of **conversational AI** would lack its most fundamental interface.
</div>

<div class="md" data-depth="20">
#### Cathode Rays and Glowing Phosphors: The Screen That Gave AI a Face

A machine that cannot *show* its output is, for all practical purposes, mute. The visual display has its origins not in computing, but in 19th-century experimental physics.

In 1897, **Karl Ferdinand Braun** invented the **cathode ray tube (CRT)** at the University of Strasbourg, described in \citetitle{braunannalen}. It was a laboratory instrument for visualizing alternating-current waveforms, a tool for physicists, not communicators. By directing an electron beam onto a phosphorescent surface, Braun rendered invisible electrical phenomena as visible, glowing traces.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="crt.jpg" alt="Close-up of a cathode ray tube (CRT) picture tube, showing the phosphor-coated screen" />
    <figcaption class="md">A \citealternativetitle{crt}: the phosphor-coated face of a cathode ray tube. Invented in 1897 as a laboratory instrument for visualising oscillating currents, the CRT evolved through television, radar and computer terminals into the display on which the first chatbots were typed.</figcaption>
</figure>

From this scientific instrument, an extraordinary displacement unfolded: **Philo Farnsworth** demonstrated fully electronic television in 1927, adapting the CRT for broadcast entertainment. During WWII, CRTs were repurposed for **radar displays**, the first use as an interactive, real-time information screen. The transition into computing followed at MIT, where the **Whirlwind** computer (early 1950s) used a CRT for real-time output, and Ivan Sutherland's \cite[Sketchpad]{sketchpad} (1963) proved a screen could be a medium for direct graphical interaction with a computer.

Without the visual display, AI remains a silent, invisible process. The screen is the **output channel** through which a language model becomes conversational and immediate, and its lineage traces directly to a physicist studying oscillating currents with no notion of “computation” whatsoever.
</div>

<div class="md" data-depth="20">
## The Wireless Century

### Radio: The Invisible Network

Radio begins with a laboratory demonstration that electromagnetic action propagates with finite velocity. Hertz's *Electric Waves* collects the researches in which he generated rapid electric oscillations with sparks and Leyden jars and detected their propagation through space (\cite[Hertz, 1893]{hertz1893electricwaves}). Marconi's 1897 patent, "Transmitting electrical signals," turned the laboratory effect into a signalling system (\cite[Marconi, 1897]{marconi1897patent}). Radio then became the first network without wires: broadcast, radar, navigation and, eventually, mobile data. The air itself became a medium for machine-readable signals.

### Cellular and Wi-Fi: The Network Without Wires

A radio network that serves many moving users needs a way to reuse spectrum. The cellular concept does exactly that: MacDonald's 1979 paper shows how a cellular system within a limited block of frequency spectrum can serve large-scale mobile telephony by frequency reuse and cell splitting, with hexagonal geometry and the AMPS system as the practical realisation (\cite[MacDonald, 1979]{macdonald1979cellular}). Local wireless networks followed a different path: the IEEE 802.11 standard of 1997 specified a wireless LAN medium-access control and physical layer, creating the technical basis for Wi-Fi (\cite[IEEE, 1997]{ieee80211_1997}). Together, cellular and Wi-Fi made network access ambient rather than a place you went to.

### The Smartphone: A Supercomputer in Every Pocket

The smartphone is the point where radio, low-power computing, a camera and a touchscreen became one device. Apple's 2007 launch described the iPhone as three products in one, a mobile phone, a widescreen iPod and an Internet communications device, with a large multi-touch display, a two-megapixel camera, desktop-class email, web browsing, searching and maps (\cite[Apple, 2007]{apple2007iphone}). The processor lineage behind such devices descends from the low-power RISC idea: the Acorn RISC Machine was designed as a complete system architecture for optimal implementation on silicon, aimed at the low-cost personal-computer market (\cite[Furber and Wilson, 1987]{furber1987arm}). The cellular standards that carry the data are specified by 3GPP (\cite[3GPP, 2026]{threegpp_specs}). The result is a sensor platform in every pocket, generating the images, text, locations and behaviour that later become training data.

</div>

<div class="md">
Each of these discoveries was made for a goal unrelated to artificial intelligence. Remove any one and the edifice collapses; together they are the silent infrastructure on which every inference runs.
</div>

<div class="md" data-depth="20">
### The Physics of Computation

#### Quantum Mechanics and the Transistor: From Beach Sand to Thinking Silicon

The entire digital age rests upon the **transistor**, a device whose invention required understanding a branch of physics that did not exist until the 20th century. The story begins, improbably, with sand.

Silicon dioxide (common sand) is one of the most abundant compounds on Earth. But transforming it into a substrate for computation required:

1. **Quantum Mechanics** (1920s–1930s): **Max Planck** introduced the quantum of energy in \citetitle{planck}. **Niels Bohr** proposed the quantized atom in \citetitle{bohr}. **Werner Heisenberg** formulated matrix mechanics in \citetitle{quanten}, and **Erwin Schrödinger** developed wave mechanics in \citetitle{schroedinger}. Together, they revealed that matter at the atomic scale behaves according to probabilistic wave functions, not classical Newtonian mechanics. This theory explained why certain materials (semiconductors) conduct electricity only under specific conditions, a phenomenon that classical physics could not account for.
2. **Band Theory of Solids** (1929–1931): **Felix Bloch** applied quantum mechanics to electrons in crystal lattices in \citetitle{bloch}. **Alan Herries Wilson** then used Bloch's framework to explain semiconductors specifically in \citetitle{wilsonsemiconductors}, describing how energy bands and “gaps” determine whether a material conducts, insulates, or semi-conducts. This theoretical framework made it possible to *predict* and *engineer* the electrical properties of materials like silicon and germanium.
3. **The Transistor** (1947): **John Bardeen** and **Walter Brattain** at Bell Labs built the first point-contact transistor in December 1947, a solid-state device that could amplify and switch electrical signals. They published \citetitle{semiconductor}. **William Shockley** followed with the superior junction transistor, described in \citetitle{shockley}. The transistor replaced the vacuum tube, which was bulky, hot, fragile, and power-hungry. Without the transistor, Moore's Law is inconceivable, and without Moore's Law, LLMs are computationally impossible.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="first_transistor.jpg" alt="A replica of the first working point-contact transistor, built by John Bardeen and Walter Brattain at Bell Labs in December 1947" />
    <figcaption class="md">The \citealternativetitle{first_transistor}: a plastic wedge pressing two fine gold wires against a slab of germanium. This unassuming device replaced the vacuum tube and inaugurated the age of solid-state electronics.</figcaption>
</figure>

The path from a grain of beach sand to a chip containing billions of transistors passes through some of the most abstract physics ever conceived. A researcher debugging attention heads in a Transformer model is, at the deepest physical layer, relying on quantum tunneling effects in doped silicon crystals, a connection so remote that it borders on the absurd, yet it is absolute.
</div>

<div class="md">
The large language model is, at bottom, applied physics: inference is an electrical signal in doped silicon governed by quantum mechanics, and training consumes energy generated by electromagnetic induction. Physics also supplied the mathematics — the Boltzmann distribution behind Boltzmann machines, the Ising model behind early recurrent architectures, energy minimisation behind energy-based learning, and the free-energy principle as a proposed unifying account of biological and artificial intelligence.
</div>

<div class="md" data-depth="60">
### The Chemistry of Computation

If physics provided the theoretical understanding of matter, chemistry provided the practical ability to *transform* it. Every component of an LLM's physical substrate, from the ultra-pure silicon wafers to the rare-earth magnets in hard drives, from the lithium-ion batteries in mobile devices to the specialized cooling fluids in data centers, is a product of chemical engineering. Chemistry gave AI its body.

#### Alchemy: The Displaced Root of Chemistry

<figure>
    <img style="width: 38%; height: auto; display: block; margin: 1em auto;" src="merlin_enchanteur.jpg" alt="Thirteenth-century French miniature of Merlin the Enchanter dictating his prophecies to his scribe" />
    <figcaption class="md">The \citealternativetitle{img_merlin_enchanteur} (Public Domain): Merlin the Enchanter dictating his prophecies to his scribe, from a thirteenth-century French miniature of Robert de Boron's *Merlin en prose* — the magician whose art promised to command the world and could not, emblem of the failed magic from which chemistry was born. Source: \citeauthor{img_merlin_enchanteur}, \citeyear{img_merlin_enchanteur}, \citealternativetitle{img_merlin_enchanteur}, Wikimedia Commons.</figcaption>
</figure>

Before chemistry could purify silicon, it had to exist — and it was born inside failed magic. *Chemistry* descends from *alchemy*: the Arabic *al-kīmiyā* Europe borrowed was a loan from Late Greek *khēmeía* (*Khemeu* in the third-century papyri), traced in turn to the Egyptian *khem*, the "black earth" of the Nile \cite[the etymology]{alchemy_wiki}. Alchemy was the art of transmuting base metals into gold, distilling an *elixir of life*, and perfecting matter through a staged *Great Work* (*opus magnum*). Its *goal* was impossible — no chemistry turns lead into gold, no powder grants immortality — yet the craft behind it, transforming one substance into another by fire, reaches back to the first metalsmiths, five thousand years ago, and ran in parallel across Roman Egypt, the Islamic world, medieval Europe, China, and India \cite[overview]{alchemy_wiki}. The impossible aim is what made the *instrument* possible: chasing it, the alchemists built the laboratory.

**Before the word: metal and idea.** Before the name, people were smelting copper (c. 5500 BCE), casting bronze by 3500 BCE, and — in the late Bronze Age — working iron, a metal so hard to extract that its secret was guarded for centuries \cite[overview]{alchemy_wiki}. To make metal is already to *transform matter by fire according to a method*, the seed of the enterprise. The Greeks gave the craft its first theory: **Empedocles** (c. 490–430 BCE) held all matter to be a mixture of four elements — earth, water, air, fire — combined and separated by Love and Strife \cite[on the four elements]{empedocles}; **Democritus** (c. 460–370 BCE) went further, making matter of indivisible *atoms* in the void, the first claim that the world is built from a finite set of discrete parts \cite[on Democritus]{democritus} \cite[on atomism]{atomism}. The four elements would govern chemical thinking for two thousand years; the atom would resurface as the foundation of the periodic table and of a chip's crystal lattice.

**The first recipes.** The earliest alchemical *documents* to survive are not treatises but craft recipes. The **Stockholm Papyrus** and **Leyden Papyrus X** (both copied c. 300 CE) list instructions for dyeing cloth, making artificial gemstones, and — tellingly — *imitating* gold and silver, plating base metal to pass as the precious kind \cite[on the Stockholm Papyrus]{stockholm_papyrus} \cite[on the Leyden Papyrus X]{leyden_papyrus_x}. Attributed to the mythical **Pseudo-Democritus** and the craftsman **Bolus of Mendes** \cite[on Pseudo-Democritus]{pseudo_democritus} \cite[on Bolus of Mendes]{bolus_of_mendes}, they mark the moment the potter's, dyer's, and gold-beater's trades became written secret knowledge — the moment craft becomes *alchemy*. **Diocletian** is said to have ordered the alchemical books burned in AD 292; the need for such an order measures how much had accumulated \cite[overview]{alchemy_wiki}.

**The roots: the Emerald Tablet and the sealed world.** The oldest substantial alchemical texts come from third-century Roman Egypt, above all **Zosimos of Panopolis** \cite[on Zosimos]{zosimos_panopolis}, framed by a mythical sage, **Hermes Trismegistus**, the "Thrice-Great", said to have authored the **Emerald Tablet** (*Tabula Smaragdina*) \cite[on Hermes]{hermes_trismegistus} \cite[on the Tablet]{tabula_smaragdina}. The Tablet is a dozen lines long; its governing line — *that which is below is like that which is above* — claims the sealed vessel on the bench enacts the transformations of the cosmos. That a small closed system can re-run the whole of nature in miniature is the original statement of *scaling the universe down into a test tube* — the same logic that lets a neuron model a synapse, a transistor a switch, and a trained network a corpus.

**The Islamic Golden Age: alchemy becomes method.** Translated into Arabic, alchemy was recast as a natural philosophy of *process*. At its centre stands **Jabir ibn Hayyan** (the Latin *Geber*), to whom a large corpus of eighth- and ninth-century treatises is attributed; he is often called the father of early chemistry \cite[on Jabir]{jabir_ibn_hayyan}. That corpus made the art procedural — *calcination, sublimation, crystallization, distillation, filtration* as repeatable operations — and gave the first clear accounts of the mineral acids, **nitric, sulfuric, hydrochloric**, and of **aqua regia**, the one mixture that dissolves even gold \cite[on aqua regia]{aqua_regia}. It also built a theory of matter on two deeper principles, *sulfur* (the combustible) and *mercury* (the volatile), that would shape European alchemy for centuries \cite[on alchemy in the Islamic world]{alchemy_islam}. Nor was the goal accepted: the physicians **al-Razi** (Rhazes) and **Avicenna** (Ibn Sina) subjected transmutation to the sceptical scrutiny they brought to medicine, and al-Razi's *Book of Secrets* models the new empirical temper \cite[on al-Razi]{al_razi} \cite[on Avicenna]{avicenna}.

<figure>
    <img style="width: 40%; height: auto; display: block; margin: 1em auto;" src="jabir_alembic.jpg" alt="Drawing and description of an alembic attributed to Jabir ibn Hayyan, 8th century" />
    <figcaption class="md">The \citealternativetitle{img_jabir_alembic} (Public Domain): an alembic as \citeauthor{img_jabir_alembic} drew and described in the eighth century, one of the earliest recorded distillation apparatuses. Source: \citeauthor{img_jabir_alembic}, \citeyear{img_jabir_alembic}, \citealternativetitle{img_jabir_alembic}, Wikimedia Commons.</figcaption>
</figure>

That shift — from a *ritual* to a *reproducible sequence of operations* yielding a *reproducible result* — is the method of science and of the semiconductor fab: a written procedure, followed step by step, reliably gives the same outcome.

**The glass of the laboratory.** The alchemists' second great invention was physical: the glassware.

<figure>
    <img style="width: 62%; height: auto; display: block; margin: 1em auto;" src="alchemist_in_his_studio.jpg" alt="A 17th-century painting of an alchemist in his studio, surrounded by furnaces, stills, and vessels" />
    <figcaption class="md">The \citealternativetitle{img_alchemist_studio} (Public Domain): an alchemist in his studio, as \citeauthor{img_alchemist_studio} painted him, the bench crowded with the furnaces, stills, and vessels that were his true instrument. Source: \citeauthor{img_alchemist_studio}, \citeyear{img_alchemist_studio}, \citealternativetitle{img_alchemist_studio}, Wikimedia Commons.</figcaption>
</figure>

**Maria the Jewess**, working in Alexandria in the early centuries CE, is credited with the *bain-marie* (gentle, indirect heating) and the distillation vessels *tribikos* and *kerotakis* \cite[on Maria]{maria_jewess}. Centuries later, **Andreas Libavius** catalogued the whole apparatus in his *Alchymia* (1597) \cite[on Libavius]{libavius}.

\marginfig{libavius_alembics.png}{The \citealternativetitle{img_libavius_alembics} (Public Domain): the alembics and distillation vessels as \citeauthor{img_libavius_alembics} drew them in *Alchymia* (\citeyear{img_libavius_alembics}), a catalogue of the laboratory glassware that chemistry would inherit.}

Every one of these vessels — the retort, the alembic, the slow **athanor** furnace \cite[on the athanor]{athanor} — is the direct ancestor of the modern laboratory's glassware, and of the sealed, temperature-controlled chambers in which silicon wafers are doped, etched, and grown.

**Two other lineages: China and India.** In **China**, alchemy grew up inside **Taoism** in two forms: *waidan*, the "external" alchemy of elixirs, and *neidan*, the "internal" alchemy of cultivating the body's own substances \cite[on Chinese alchemy]{chinese_alchemy}. The external elixir was typically based on **cinnabar** (mercury sulfide), reduced to mercury and mixed with other metals in the search for immortality — a search so persistent that the mercury is thought to have poisoned several emperors who took it \cite[on Chinese alchemy]{chinese_alchemy}. The fourth-century Taoist **Ge Hong** systematised it in his *Baopuzi*, the classic of the Chinese tradition \cite[on Ge Hong]{ge_hong}. In **India**, a parallel tradition, **rasayana** (later *rasashastra*, "the knowledge of mercury"), treated mercury and its compounds as the active principle of transformation and the path to an imperishable body, codified by the alchemist-philosopher **Nagarjuna** in his *Rasendramangalam* and by **Nityanatha** in the *Rasaratnakara* \cite[on rasayana]{rasayana} \cite[on Nagarjuna the metallurgist]{nagarjuna_metallurgist}. In both, as in the West, the same structure recurs: an impossible goal (immortality, a perfected body), a search for a single potent substance (mercury, the elixir), and, as by-product, a growing, written, reproducible technology of transforming matter.

**Medieval Europe: the art goes to school.** The Arabic corpus came back into Latin in the twelfth and thirteenth centuries. The first major translation, **Robert of Chester's** *Liber de compositione alchemiae* (1144), opened the Western tradition \cite[on Robert of Chester]{robert_of_chester} \cite[on the Liber de compositione]{liber_de_compositione}; the *Turba Philosophorum*, a dramatized debate among the "philosophers", became one of the most widely copied alchemical texts \cite[on the Turba]{turba_philosophorum}. The thirteenth-century natural philosophers **Albertus Magnus** and **Roger Bacon** took the experimental program seriously even as they remained bound to the older elemental theory \cite[on Albertus Magnus]{albertus_magnus} \cite[on Roger Bacon]{roger_bacon}.

**Paracelsus: alchemy learns to be useful.** The last great alchemist was the first great chemist of medicine. **Paracelsus** (Theophrastus von Hohenheim, 1493–1541) broke with the Galenic tradition, insisted that a substance's *dose* and *preparation* mattered more than its occult properties, and founded **iatrochemistry**, the chemical treatment of the body \cite[on Paracelsus]{paracelsus} \cite[on iatrochemistry]{iatrochemistry}. He recast the theory of matter: in place of the four classical elements, three "first principles", the *tria prima* — **sulfur** (flammability), **mercury** (volatility), **salt** (solidity) — out of which all bodies were compounded, to be separated, purified, and recombined by the alchemist's art.

<figure>
    <img style="width: 34%; height: auto; display: block; margin: 1em auto;" src="paracelsus_portrait.jpg" alt="Portrait of Paracelsus (Theophrastus von Hohenheim)" />
    <figcaption class="md">The \citealternativetitle{img_paracelsus_portrait} (Public Domain): \citeauthor{img_paracelsus_portrait} (Paracelsus, 1493–1541), who turned the alchemists' dream of a universal *elixir* into the systematic preparation of medicines, the founding move of pharmacology. Source: \citeauthor{img_paracelsus_portrait}, \citeyear{img_paracelsus_portrait}, \citealternativetitle{img_paracelsus_portrait}, Wikimedia Commons.</figcaption>
</figure>

Alchemy's dream of a perfecting *elixir* became, in his hands, *pharmacology*: the deliberate, repeatable preparation of active substances. The quest for a "universal medicine" that alchemists chased for a millennium still runs in the background of every drug-discovery pipeline.

**The long sixteenth century.** **Michael Sendivogius** (1566–1636), a Polish alchemist, is credited with distilling and recognising, around 1600, a gas that supports both flame and breath — what we now call **oxygen** — two and a half centuries before Lavoisier named it \cite[on Sendivogius]{sendivogius}. The English mathematician **John Dee** built an entire symbolic system, the *Monas Hieroglyphica* (1564), on the conviction that nature's processes follow lawful, decodable patterns — the conviction, stripped of its occult dress, that later underwrites every formal model of a physical system \cite[overview]{alchemy_wiki}.

**Newton, the alchemist.** The displacement was complete by the time of **Isaac Newton**, who wrote more on alchemy than on physics or mathematics and spent his later years in a private, coded investigation of transmutation \cite[on Newton's alchemy]{newton_alchemy}. The man who wrote the laws of motion was, in private, still trying to make gold. Alchemy had by then become "normal" science in the sense that matters: its *aims* were abandoned, but its *tools* — furnace, alembic, acid, sealed vessel, notebook of reproducible procedures — passed intact to the new chemistry.

**Boyle, and the first doubt.** The first great crack in the alchemical edifice came from within, from **Robert Boyle** (1627–1691). In *The Sceptical Chymist* (1661) — a dialogue between a chymist and his sceptical interlocutor — Boyle attacked the *tria prima* and the Aristotelian four elements as explanations of matter's properties, and proposed a *corpuscular* account in which an *element* is simply a body not shown to be composed of simpler bodies \cite[on the Sceptical Chymist]{sceptical_chymist} \cite[Boyle's text]{sceptical_chymist_text}. He did not abolish the laboratory or the search for transmutation (he kept a private alchemical program); he changed the *standard of proof*. A theory now had to account for observable change, and an "element" was defined by what it could not be reduced to, not by what it was mystically believed to be. That is the method of science, arriving in the chemistry of the body.

**Failure as the engine of rigor.** The decisive turn came when alchemy's central claim — transmutation — was finally *falsified*. **Antoine Lavoisier**'s careful weighing in the 1770s and 1780s showed that combustion was not the release of a mysterious *phlogiston* \cite[on phlogiston]{phlogiston} but a combination with **oxygen**, and that in a closed reaction the total mass of matter is neither created nor destroyed \cite[on Lavoisier]{lavoisier}. With the balance as its central instrument, chemistry became quantitative, predictive, and — above all — *falsifiable*. The **philosopher's stone**, that legendary agent that would transmute any base matter into gold \cite[on the stone]{philosophers_stone}, was revealed to be a fiction. But the *idea* it encoded — a substance that drives a transformation while remaining unchanged — is the definition of a **catalyst**, and catalysts run every modern chemical plant, including the ones that make silicon. And the alchemists' *Great Work*, a long iterative cycle of transformations (blackening, whitening, yellowing, reddening), is at the level of structure the same loop a process engineer runs: apply, observe, adjust, repeat.

<figure>
    <img style="width: 42%; height: auto; display: block; margin: 1em auto;" src="flaming_heart_alchemical.jpg" alt="Plate from an alchemical and rosicrucian compendium (c. 1760) showing the flaming heart, a symbol of the Great Work" />
    <figcaption class="md">The \citealternativetitle{img_flaming_heart} (Public Domain): the "flaming heart" from an alchemical and rosicrucian compendium of about \citeyear{img_flaming_heart}, an emblem of the *Great Work*, the long staged process whose goal was never achieved and whose method was. Source: \citeauthor{img_flaming_heart}, \citeyear{img_flaming_heart}, \citealternativetitle{img_flaming_heart}, Wikimedia Commons.</figcaption>
</figure>

**Why alchemy is a prerequisite of AI.** Strip the alchemical layer and the chain breaks, as it does without the microscope or the neuron doctrine. No alchemy, no laboratory; no laboratory, no reproducible procedure; no reproducible procedure, no systematic discovery of the acids and techniques chemistry needed; no chemistry, no silicon purification, no doping, no photolithography, no transistor. The discipline that gave the machine its *body* began as a dream that could not be realized, and became indispensable only by failing. The gold the alchemists never made is the gold of the wire bonds in every accelerator; the elixir they never found is the pure silicon on which every inference runs.

**The dream returns: AI and chemistry.** The arc closes almost too neatly. The alchemists' dream was to *understand matter well enough to command it* — to predict which combinations of substances yield which results, and to design new substances with the properties they wanted. For four centuries it was a fantasy, because no one had the computational power to hold the space of all possible substances in their head. Now we do. In 2021, DeepMind's **AlphaFold2** predicted the three-dimensional structure of essentially every known protein — around two hundred million of them — and released them to the public, a single model redrawing the map of biochemistry overnight \cite[on AlphaFold]{jumper2021alphafold} \cite[the database]{alphafold_db} \cite[overview]{alphafold_wiki}; the work shared the 2024 Nobel Prize in Chemistry \cite[on the Nobel Prize]{nobel2024chemistry}. In 2023, **GNoME** used a neural network to predict the stability of crystalline materials at scale, generating **2.2 million** previously unknown stable structures — 381,000 on the thermodynamic convex hull, the most stable configurations — of which 736 have since been synthesised and confirmed \cite[on GNoME]{merchant2023gnome}. The *philosopher's stone* — the hypothetical substance that drives a transformation — has reappeared as a *model* that finds, in the space of all possible matter, the configurations that will actually hold. The dream alchemy could not realise, for want of the tool, now runs in a data centre: the body of the machine is being designed by the machine's own descendant.

#### Silicon Purification: From Sand to Semiconductor

The journey from common beach sand (silicon dioxide, SiO₂) to a functioning microprocessor requires chemical transformations of extraordinary precision. The Siemens process, developed in the 1950s, reduces silicon dioxide with carbon at high temperatures, then purifies it through reaction with hydrogen chloride to form trichlorosilane (SiHCl₃), which is subsequently decomposed to yield polycrystalline silicon of 99.9999999% purity (nine nines). This “electronic grade” silicon is then grown into single crystals via the Czochralski process \cite{semiconductor}. Without these chemical purification methods, transistors cannot function, impurity concentrations of even a few parts per billion alter semiconductor behavior catastrophically. The entire digital age rests upon chemistry's ability to produce materials of unprecedented purity.

#### Doping: The Chemistry of Controlled Impurity

A pure silicon crystal is a poor conductor. What makes it useful is the deliberate introduction of specific impurities, a process called **doping**. Adding phosphorus atoms (Group V) creates n-type silicon with excess electrons; adding boron atoms (Group III) creates p-type silicon with electron “holes.” The p-n junction formed at their interface is the basis of every diode and transistor \cite{shockley}. This is fundamentally a chemical process: selecting specific elements from the periodic table and introducing them into a crystal lattice at precisely controlled concentrations (typically one dopant atom per million silicon atoms). Without the chemist's understanding of how atomic species interact within crystal structures, there is no transistor and no computation.

#### Photolithography: Chemistry as Nanoscale Sculpture

Modern chips contain billions of transistors, each smaller than a virus. They are manufactured through **photolithography**, a process that is essentially chemistry performed with light. A silicon wafer is coated with a light-sensitive chemical called a **photoresist**. Ultraviolet light is projected through a mask, causing chemical reactions that either harden or dissolve the exposed resist (depending on whether it is “positive” or “negative” resist). The unexposed (or exposed) resist is washed away with chemical solvents, revealing the silicon beneath for etching or ion implantation. This cycle is repeated dozens of times to build up the three-dimensional structure of a modern processor. Each step is a chemical reaction, polymerization, dissolution, oxidation, deposition, performed at nanometer precision.

#### Electrochemistry and Energy Storage

The lithium-ion battery, which powers every laptop, smartphone, and increasingly the backup systems of data centers, is a product of electrochemistry. John B. Goodenough's identification of lithium cobalt oxide (LiCoO₂) as a cathode material (1980) and Akira Yoshino's development of the first commercially viable lithium-ion cell (1985) enabled portable computing. Without electrochemistry, there are no mobile devices generating the user data that feeds LLM training corpora, and no uninterruptible power supplies protecting data centers from outages.

#### Rare Earth Chemistry and Permanent Magnets

The hard disk drives that store training datasets rely on **neodymium-iron-boron (Nd₂Fe₁₄B) permanent magnets** and **cobalt-platinum alloy** recording media, materials whose magnetic properties were characterized through decades of solid-state chemistry research. The voice coil actuators that position read/write heads with nanometer precision depend on rare-earth magnets whose synthesis requires specialized chemical extraction from ore (typically through solvent extraction and ion exchange chromatography).

#### Cooling Fluids and Thermal Management

As GPU clusters push thermal limits, data centers increasingly turn to **liquid immersion cooling** using engineered dielectric fluids, synthetic fluorocarbon compounds (such as 3M's Fluorinert and Novec series) designed through organic chemistry to be thermally conductive, electrically insulating, chemically inert, and non-flammable. The development of these specialized coolants is pure applied chemistry, formulated specifically to remove heat from electronics without damaging them.

Chemistry did not intend to create artificial intelligence. It intended to understand and transform matter. But in doing so, from purifying silicon to synthesizing photoresists to engineering cooling fluids, it provided every material prerequisite without which no language model could ever be physically instantiated.
</div>

<div class="md" data-depth="20">
### The Hardware of AI


Every weight update in a modern neural network is an electrical signal propagating through silicon, coordinated by a clock, stored in volatile memory, and communicated across copper traces on a printed circuit board. None of these components was invented for artificial intelligence. The CPU descends from wartime code-breaking. RAM evolved from radar. The GPU was forged by video games. Networking grew from military resilience planning. Storage was driven by census-taking. Yet together, they form the physical body in which neural networks are incarnated.

#### The Space Program That Nudged the State of the Art

Of all the displaced prerequisites, one is not a material or a device but a *demand*: a computer that could not crash, could not be switched off, and could not afford to be wrong. NASA never pushed the state of the art, as \citeauthor{tomayko1988spaceflight} puts it, but nudged it often enough to matter \cite{tomayko1988spaceflight}. Real-time scheduling, redundant voting sets, distributed flight computers and software-first design all migrated from orbit into the terrestrial stack; the dedicated section on spaceflight below follows those threads in detail.

#### The Polar Program That Nudged the State of the Art

The poles gave AI three things it could not get anywhere else: the oldest data on Earth, the first reason to aim a giant computer at the whole sky, and a benchmark of cold the next computer had to beat.

**The data is ice.** An ice core is a column of fallen snow compressed to ice, each year's air sealed in its bubbles. Polar drilling, begun in the 1957–58 International Geophysical Year — the Soviet Vostok core, nearly 3,700 m deep and holding 420,000 years, the EPICA Dome C core with 800,000 years of CO₂ and temperature, and Greenland's GRIP/NEEM — turned the ice sheets into a deep-time archive \cite[ice cores]{icecorewiki} \cite[Vostok Station]{vostokstation}. No ice core, no 800,000-year climate record, and no dataset long enough to anchor a climate model.

\marginfig{vostok_ice_core.jpg}{Vostok Station, Antarctica, and the caves cut into the ice sheet to store drill cores at −55 °C year-round. [Photo: Todd Sowers, Lamont–Doherty / NOAA, public domain](https://commons.wikimedia.org/wiki/File:Wostok-Station_core32.jpg)}

**The demand was the atmosphere.** Forecasting the weather was the first problem worth a digital computer. Jule Charney, at the Institute for Advanced Study with von Neumann, worked out the theory of upper-air "long waves" (\cite[Charney, 1947]{charney1947longwaves}), and in 1950 his team ran the **first numerical weather forecast on the ENIAC** (\cite[Charney, Fjørtoft & von Neumann, 1950]{charney1950nwp}). Weather and climate models remain among the largest supercomputing workloads, run at gold-standard centres such as ECMWF \cite{ecmwf}.

\marginfig{eniac_1946.jpg}{Two of the ENIAC's programmers, Jean "Betty" Jennings and Frances Bilas, setting up the machine in 1946 — the computer that, with Charney's team, produced the first numerical weather forecast. [Photo: U.S. Army, public domain](https://commons.wikimedia.org/wiki/File:Two_women_operating_ENIAC_%28full_resolution%29.jpg)}

**The cold had to be beaten.** Vostok has recorded −89 °C, the coldest reliably measured on Earth \cite{vostokstation}. Beating that cold is the hidden prerequisite of the next compute substrate: Kamerlingh Onnes liquefied helium and found superconductivity (1911; Nobel 1913) \cite{onnes1913nobel}, the dilution refrigerator (1964) pushed to 2 mK \cite{dilutionfridge}, and **superconducting qubits now run below 15 mK** in IBM and Google processors \cite{superconductingqubit}.

\marginfig{qubit_cryostat.jpg}{The FMN Laboratory team (Bauman University, Moscow) assembling the cryogenic stage of a superconducting quantum computer, cooled to near absolute zero. [Photo: Sergey Kushlevich, CC BY 4.0](https://commons.wikimedia.org/wiki/File:Measuring_a_qubit_leaves_no_room_for_error.jpg)}

**The full circle.** In 2023 DeepMind's **GraphCast**, a graph network trained on four decades of global reanalysis, forecast ten days of weather in under a minute on one TPU, beating ECMWF's model on over 90% of measured variables (\cite[Lam et al., 2023]{lam2023graphcast} \cite[GraphCast, open source]{graphcast_github}). The ice and the atmosphere that forged the machines are now read by them.

#### The Central Processing Unit (CPU)

The CPU's modern history begins with relay-based processors like Zuse's Z3 (1941) and the vacuum-tube ENIAC (1946), which used thousands of tubes to achieve speeds thousands of times faster than relays \cite[see ENIAC description]{eniac1946}. The transistor (1947) made miniaturization possible (\cite[Bardeen et al., 1948]{semiconductor}), and the **integrated circuit**, independently conceived by **Jack Kilby** (1958) (\cite[Kilby, 1958]{kilbyic}) and **Robert Noyce** (1959) (\cite[Noyce, 1959]{noyceic}), placed multiple transistors on a single die.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="eniac.jpg" alt="The ENIAC at the Moore School of Electrical Engineering, with Cpl. Irwin Goldstein setting switches on one of its function tables" />
    <figcaption class="md">\citealternativetitle{eniac_image}: the U.S. Army's 1946 photograph of the ENIAC in operation at the Moore School. The machine spans an entire room and fills it wall-to-wall with cables, vacuum tubes and function-table panels.</figcaption>
</figure>

The leap to the **microprocessor** arrived in 1971 with the \cite[Intel 4004]{intel4004}, containing 2,300 transistors at 740 kHz. The relentless growth described by \citealternativetitle{mooreslaw} drove counts from thousands to billions. Key architectural innovations included **pipelining** (IBM System/360, 1964), **out-of-order execution** \cite[first in the IBM System/360 Model 91]{tomasulo1967}, **superscalar architectures** (1990s), and **multi-core processors** (IBM POWER4, 2001), acknowledging that frequency scaling had hit thermal limits. For AI, the CPU served as the sole training platform until the mid-2000s, but its sequential MIMD architecture proved poorly suited to the massively parallel matrix operations of deep learning.

#### Random Access Memory (RAM)

The earliest electronic computers used **delay-line memory**, first implemented in the \cite[EDSAC]{edsac1949} (1949). An alternative approach, the **Williams tube** (1947), developed by \cite[Freddie Williams and Tom Kilburn]{williamstube} at the University of Manchester, stored bits as charged dots on the face of a cathode ray tube, making it the first form of truly random-access electronic memory. It was used in the Manchester Baby (1948), the world's first stored-program computer to run a program, and later in machines like the IBM 701. However, it was unreliable and required constant refreshing of the display. The breakthrough in reliability came with **magnetic-core memory**, developed by \cite[An Wang]{wangcore} (1949) and Jay Forrester at MIT, which dominated from the 1950s through the early 1970s.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="williams_tube.jpg" alt="A Williams-Kilburn tube on display: a small cathode ray tube with its deflection circuitry visible behind it" />
    <figcaption class="md">The \citealternativetitle{williams_tube}: a Williams-Kilburn cathode-ray tube with its associated read/write electronics. Each bit was stored as a tiny patch of charge on the phosphor screen, the first truly random-access electronic memory.</figcaption>
</figure>

The modern era began when \cite[Robert Dennard]{dennard1968} at IBM invented **DRAM** (1966), storing each bit as a charge in a capacitor. The \cite[Intel 1103]{intel1103} (1970), holding 1 kilobit, rapidly displaced core memory. DRAM capacity has followed its own exponential trajectory: 1 Kb (1970), 1 Mb (1986), 1 Gb (early 2000s), to modern DDR5 modules offering 64 GB per DIMM at bandwidths exceeding 50 GB/s. For AI workloads, memory bandwidth is often the binding constraint: **High Bandwidth Memory (HBM)**, developed by \cite[AMD and SK Hynix]{hbm2013}, provides the necessary throughput for GPU-based training.

#### The Motherboard

The motherboard physically and electrically connects all components. The modern form traces to the **IBM PC** (1981), which established standardized expansion slots. The evolution of bus architectures, from ISA (1981) to PCI (1992) to \cite[PCI Express]{pciespec} (2003), reflects ever-increasing bandwidth demands. For AI training, motherboard design determines how many GPUs can communicate and at what speed; proprietary interconnects like \cite[NVLink]{nvlink} provide up to 900 GB/s between GPUs, far exceeding PCIe alone.

#### Networking

The digital networking revolution began with **packet switching**, independently conceived by \cite[Paul Baran]{baran1964} (1964) and Donald Davies (1965). This was realized in \cite[ARPANET]{rfc1} (1969) and universalized through \cite[TCP/IP]{cerfkahn} (1974). Key milestones for AI include:

* **Ethernet** (1973, \cite[Robert Metcalfe]{metcalfe1976}): now operating at 800 Gbps in data centers.
* **InfiniBand** (\cite[first specified in 2000]{infiniband2000}): the backbone of most GPU training clusters, offering latencies under 1 μs and bandwidths exceeding 400 Gbps.
* **RDMA (Remote Direct Memory Access)**, formalized in the \cite[Virtual Interface Architecture]{via1998} and built natively into InfiniBand: allowing one machine to read another's memory without involving either CPU, critical for gradient synchronization in distributed training frameworks like \cite[Horovod]{horovod2018}.

Training a frontier LLM may involve thousands of GPUs synchronizing gradients every few hundred milliseconds. The collective communication patterns (all-reduce, ring-allreduce) are as much “hardware” as the chips themselves.

#### Storage

* **Punched Cards** (\cite[Jacquard, 1804]{jacquard1804}; \cite[Hollerith, 1890]{hollerith1890}): the first machine-readable medium.
* **Magnetic Tape** (1951, \cite[UNIVAC I]{univac1951}): sequential-access, still used for archival.
* **Hard Disk Drives** (1956, \cite[IBM 305 RAMAC]{ibmramac}): the first random-access magnetic storage, originally 5 MB across fifty 24-inch platters; by 2025, individual HDDs exceed 30 TB.
* **Solid-State Drives** (commercially viable about 2008, based on \cite[NAND flash memory]{masuoka1987}): NVMe PCIe 5.0 SSDs offer 14+ GB/s reads, enabling the rapid random access needed to feed GPU pipelines.

For large-scale training, data is stored in distributed file systems (Lustre, GPFS) or object storage (S3), striping petabytes across thousands of drives at aggregate bandwidths of hundreds of GB/s.

#### The Graphics Processing Unit (GPU)

The first dedicated graphics chips (e.g., the \cite[IBM Professional Graphics Controller]{ibmpgc}, 1984) were fixed-function pipelines. Programmable shaders (NVIDIA GeForce 3, 2001) made GPUs flexible, and \cite[CUDA]{cuda} (2006) provided the software bridge. Key milestones for AI:

* **NVIDIA Tesla (2007)**: first GPU marketed for general-purpose computing.
* **NVIDIA Volta / V100 (2017)**: introduced **Tensor Cores** for mixed-precision matrix operations.
* **NVIDIA A100 (2020)**: third-generation Tensor Cores, sparsity-aware computation, Multi-Instance GPU.
* **NVIDIA H100 (2022)** and **B200 (2024)**: Transformer Engine, FP8 support, NVLink 4.0.

Google's **TPUs**, custom ASICs for neural network workloads \cite[first deployed in 2015]{jouppi2017tpu}, offer an alternative architecture, and the competition between general-purpose GPUs and specialized accelerators continues to shape AI hardware.

#### The Power Supply

Modern GPUs alone draw over 700 W; a full training node may consume 5–10 kW. The evolution from linear regulators to high-efficiency **switched-mode power supplies** (1960s–70s) made dense computing viable. The 80 PLUS certification program (2004) drove PSU efficiency above 90%, a seemingly mundane achievement that determines the economic viability of large-scale training.

#### The Clock

Every digital computer operates to the rhythm of a **crystal oscillator**. The quartz crystal oscillator, developed by \cite[Walter Cady]{cady1922} in 1921 for radio, was adopted for computing to ensure billions of transistors switch in lockstep. Modern CPUs tick at 3–6 GHz. Without this temporal coordination, the parallel operations within a CPU or GPU would dissolve into chaos.

#### Convergence

None of these components was invented for AI. Yet remove any single element and the entire edifice collapses. The history of AI hardware is the ultimate illustration of the “displaced prerequisite”: a convergence of solutions to unrelated problems that proved inseparable once they met.
</div>

<div class="mn-quiz mn-quiz--checkpoint" data-quiz="untold_history_ii-cp2" data-depth="40"><script type="application/json">{"title": "Checkpoint: the material foundations", "questions": [{"q": "What did cell theory, established in the 19th century, propose?", "options": ["That the tissues of all organisms are built from cells", "That cells are made of silicon", "That only plants have cells", "That nerves are one continuous net"], "answer": 0, "explain": "From Hooke's “honeycomb” in cork and Leeuwenhoek's living cells to a principle for all life — the road that later led to the neuron."}]}</script></div>

<div class="md" data-depth="20">
## The Fab: How Sand Becomes an Accelerator

The previous sections treated the chip as a component. This section treats it as a manufactured object, because a modern accelerator is not designed in a vacuum: it is the output of an industrial system that turns purified sand into patterned silicon, and then packages that silicon with memory, power delivery and cooling. Remove the fab and the design is only a file.

### The Foundry: Designing Without a Factory

The pure-play foundry is a relatively recent institutional invention. TSMC was founded in 1987 as a joint venture and incorporated as a dedicated foundry: it manufactures semiconductors using its customers' proprietary integrated-circuit designs rather than selling chips under its own brand (\cite[TSMC, 2026]{tsmc2025annualreport}). That separation let companies design chips without owning a fabrication plant, while the foundry amortized the enormous fixed cost of the plant across many customers. TSMC's own filing describes fabs as "largely fixed cost assets" whose economics improve as utilization rises (\cite[TSMC, 2026]{tsmc2025annualreport}). The fabless model is therefore not a detail of business history: it is why a startup can specify an AI accelerator and have it manufactured at the leading edge.

### EUV: Light at 13.5 Nanometres

The most difficult step is printing the pattern. ASML describes extreme ultraviolet (EUV) lithography as using light with a wavelength of 13.5 nm, the cutting edge of lithography and the highest resolution available, and states that it is currently the world's only manufacturer of EUV systems (\cite[ASML, 2026]{asml2025annualreport}). EUV simplifies manufacturing relative to multiple-patterning with deep-ultraviolet immersion: one exposure per critical layer instead of several, fewer masks and process steps, and better yield and scalability for advanced logic and memory (\cite[ASML, 2026]{asml2025annualreport}). The underlying idea is older. Soft X-ray reduction lithography with multilayer mirrors was demonstrated in the late 1980s, with experiments on a synchrotron beamline and demagnified patterns below 0.5 micrometres (\cite[Kinoshita et al., 1989]{kinoshita1989euv}). The industrial machine took another two decades; the physics was already in place.

### The Cleanroom and the Ultrapure Drop

A fab is a contamination-control problem before it is a computer. VLSI yields require control of particulate contamination during manufacture, and the ambient air of the production facility is one source; measuring ultrafine particles of 0.1 micrometres or less in real time requires instruments such as the differential mobility analyzer and the diffusion battery (\cite[Donovan et al., 1985]{donovan1985cleanroom}). Water is the other carrier: ultrafiltration removes particles, colloids and large macromolecules from ultrapure water, and leak detection in membrane modules is a prerequisite for defect-free manufacturing (\cite[Ruth and Berndt, 2016]{ruth2016ultrapure}). The cleanroom is not a metaphor for precision; it is the physical condition under which a wafer can be patterned at all.

### Advanced Packaging: Where Memory Meets Logic

A modern accelerator is not one die but a stack. High Bandwidth Memory (HBM) stacks DRAM dies on a base logic die using through-silicon vias and die stacking, reaching more than 256 GB/s while reducing power, and its packaging must solve reliability, thermal dissipation, package size and high-throughput stacking (\cite[Jun et al., 2017]{jun2017hbm}). CoWoS-R uses an organic interposer to integrate heterogeneous and chiplet components, with low-RC interconnect, signal isolation and design scalability; integrated decoupling capacitors suppress power-domain noise and improve HBM3 signal integrity at high data rates (\cite[Jeng and Liu, 2022]{jeng2022cowos}). The logic die and the memory are only useful together, and the package is where their electrical and thermal limits meet.

## The Grid and the Cloud: Powering and Renting Computation

### The Grid: Electricity as a Utility

The electric grid is a machine for moving power, not just generating it. Tesla's polyphase AC patents of the 1880s made long-distance distribution practical by supplying alternating current and a method of converting and distributing it (\cite[Tesla, 1887]{teslaelectricmotor}; \cite[Tesla, 1888]{teslacurrent}). A century later the grid has become a binding constraint on AI. The International Energy Agency's central projection has data-centre electricity consumption roughly doubling from 485 TWh in 2025 to 950 TWh in 2030, about 3% of global electricity demand, while consumption from AI-focused data centres grew by 50% in 2025 (\cite[IEA, 2026]{iea2026energyai}). The same report describes grids being stretched by the wave of project applications for data centres (\cite[IEA, 2026]{iea2026energyai}). A training cluster is therefore not only a collection of GPUs; it is a customer with a power contract, a connection queue and a cooling load.

### The Cloud: Computation as a Utility

The cloud turned computing into something that could be rented by the hour. Amazon S3, launched on 14 March 2006, offered an application programming interface for highly scalable, reliable, low-latency storage at very low cost (\cite[Amazon Web Services, 2006]{amazons3_2006}). Amazon EC2 entered limited beta on 25 August 2006: a virtual CPU equivalent to a 1.7 GHz Xeon, 1.75 GB of RAM, 160 GB of local disk and 250 Mb/s of network bandwidth, at ten cents per clock hour, built on the Xen virtual machine monitor and booting from Amazon Machine Images stored as S3 objects (\cite[Barr, 2006]{amazonec2_2006}). Kubernetes, open-sourced by Google in 2014, added a portable, extensible, open-source platform for managing containerized workloads, with scaling and failover handled by the platform rather than by hand (\cite[Kubernetes Authors, 2014]{kubernetes_overview}). The result is elastic compute: capacity that can be acquired for a training run and released when the run ends.

### The Warehouse-Scale Computer

At scale, the unit of design is no longer the server but the building. Barroso, Clidaras and Hoelzle describe the modern data center as one massive warehouse-scale computer: a warehouse full of machines whose hardware and software resources must work in concert to deliver Internet-service performance, with a design, operation and cost structure of its own (\cite[Barroso et al., 2013]{barroso2013datacenter}). The IEA notes that AI is pushing data-center power density to the limits of today's technologies (\cite[IEA, 2026]{iea2026energyai}). The cloud is therefore not weightless. It is a warehouse, a power contract and a thermal engineering problem, and the abstraction of "renting a GPU" rests on all three.

</div>

