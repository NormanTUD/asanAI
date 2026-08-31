<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: The Untold History of AI
description: The displaced prerequisites—discoveries from unrelated fields that made AI physically possible.
icon: &#128295;
part: 6
order: 35
color: text-secondary
topics: history, philosophy, society
-->

<div class="md">
The main history of AI traces the intellectual lineage, the ideas, algorithms, and architectures that directly led to modern systems. But those ideas did not emerge in a vacuum. They rest on a vast, invisible scaffolding of discoveries made in fields entirely unrelated to computation: the chemistry that purified silicon, the physics that explained semiconductors, the looms that inspired programmable input, the video game industry that accidentally built the perfect hardware for neural networks. This page collects those **displaced prerequisites**: the contributions so fundamental they vanish into the background, yet without which no language model could exist.
</div>

<div class="md">
## The Development of the Earth and the Universe

According to the prevailing cosmological model, the universe began approximately 13.8 billion years ago in an event commonly known as the Big Bang, expanding from an extremely hot, dense state into the vast cosmos we observe today \cite[as described by Weinberg]{weinberg1977first}. Within the first few minutes, nucleosynthesis produced the lightest elements, primarily hydrogen and helium. Over hundreds of millions of years, gravity drew matter together to form the first stars and galaxies.

Successive generations of stars forged heavier elements in their cores and dispersed them through supernova explosions, seeding the interstellar medium with the raw materials for planets and, eventually, life. The discovery of the cosmic microwave background radiation provided strong empirical support for this model \cite[as reported by Penzias and Wilson]{penzias1965measurement}.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="wmap_cmb.png" alt="Full-sky map of the cosmic microwave background temperature fluctuations measured by NASA's Wilkinson Microwave Anisotropy Probe (WMAP)" />
    <figcaption class="md">The \citealternativetitle{wmap_cmb}: the temperature fluctuations of the cosmic microwave background as measured by NASA's Wilkinson Microwave Anisotropy Probe, the earliest direct image of the infant universe roughly 380,000 years after the Big Bang.</figcaption>
</figure>

Our solar system formed approximately 4.55 billion years ago from a collapsing molecular cloud, and the Earth accreted from the resulting protoplanetary disk roughly 4.5 billion years ago \cite[as reviewed by Allègre et al.]{allegre1995age}.

In its earliest phase, the planet was largely molten, bombarded by debris from the still-forming solar system. A giant impact with a Mars-sized body (Theia) is thought to have formed the Moon \cite[as proposed by Hartmann and Davis]{hartmann1975satellite}. Over hundreds of millions of years, the surface cooled to form a solid crust, oceans condensed from outgassed water vapor and delivered by cometary impacts, and plate tectonics began reshaping the surface in a process that continues to this day. The Late Heavy Bombardment, ending roughly 3.8 billion years ago, marked the transition to a more stable planetary environment in which life could take hold.

### Why Is There Anything at All?

Before tracing the Big Bang or the first cell, a deeper question looms: **Why is there something rather than nothing?**

#### Leibniz: The Principle of Sufficient Reason

The question received its most famous formulation from **Gottfried Wilhelm Leibniz**. Nothing exists without a reason; since the physical world is contingent, its explanation must lie outside itself in a **necessary being** whose non-existence would be logically impossible. This conviction that all reasoning is ultimately a form of calculation also drove his \cite[Generales Inquisitiones]{leibniz1686calculus} (1686), in which he sought to reduce all thought to symbolic computation.

#### Heidegger: The Fundamental Question

\citeauthor{heidegger1935metaphysics} radicalized Leibniz's question, calling *“Why are there beings at all, and not rather nothing?”* the fundamental question of philosophy itself. But where Leibniz sought an answer, Heidegger insisted the question must be *held open*, our absorption in particular things makes us forget the sheer wonder that anything exists at all.

#### Jocaxian: Nothing Has No Rules

A more unconventional argument, associated with the thinker \citeauthor{jocaxiannothing}, inverts the puzzle:

1. Suppose absolutely **nothing** exists, no matter, no laws, no logic.
2. Then there are **no rules preventing** something from arising, because rules are themselves *something*.
3. A state of absolute nothingness is therefore inherently **unstable**: without any prohibition, something can emerge.

Instead of asking “Why something?”, the question becomes: **“What could prevent something from existing?”** And the answer is: *nothing*, because nothingness lacks all causal power. Sustaining a void would itself require a kind of rule, which would already be *something*.

These three perspectives share a recognition that existence is not self-evident. Leibniz answers with a necessary ground; Heidegger preserves the wonder; Jocaxian argues that the very emptiness of nothing guarantees its own dissolution.

### The Development of Life

The origin of life on Earth remains one of the most profound questions in science. The earliest secure evidence for microbial life dates to approximately 3.5–3.8 billion years ago, based on carbon isotope signatures in ancient sedimentary rocks and stromatolite fossils. The emergence of complex multicellular life, however, was a far later development.

Among the earliest known multicellular organisms is *Otavia antiqua*, a sponge-like organism discovered in Namibian rocks dating to approximately 760 million years ago \cite[as described by Brain et al.]{brain2012otavia}. This pushed back the origin of animal life by roughly 100 million years compared to previous estimates. Later, during the Ediacaran period (approximately 571–541 million years ago), larger and more complex soft-bodied organisms appeared, including *Dickinsonia*, a flat, ribbed organism that remained enigmatic for decades until biomarker analysis of cholesteroids preserved in its fossils confirmed it as one of the earliest known animals \cite[as demonstrated by Bobrovskiy et al.]{bobrovskiy2018dickinsonia}. The subsequent Cambrian Explosion (approximately 538 million years ago) saw the rapid diversification of animal body plans, giving rise to most modern phyla within a geologically brief window.

Over the following hundreds of millions of years, life colonized land, developed flight, and eventually produced the lineage leading to primates and humans. The trajectory from simple prokaryotic cells to the extraordinary diversity of modern life represents a process of increasing complexity driven by natural selection, genetic drift, and environmental pressures.

### The Development of Humans

Humans are not descended from monkeys or any other primate living today; rather, humans and modern apes share common ancestors at various points in the deep past. The order Primates diverged from other mammals approximately 65–80 million years ago, and the lineage leading to Old World monkeys (Cercopithecoidea) split from the lineage leading to apes (Hominoidea) roughly 25–30 million years ago \cite[as reviewed by Begun]{begun2003planet}. Within the apes, the human lineage (Hominini) diverged from the lineage leading to chimpanzees and bonobos between approximately 6 and 8 million years ago.

Early hominins such as *Sahelanthropus tchadensis* (approximately 7 million years ago) and *Ardipithecus ramidus* (approximately 4.4 million years ago) show a mosaic of ape-like and human-like features \cite[as described by White et al.]{white2009ardipithecus}. The genus *Australopithecus* (approximately 4–2 million years ago) exhibited habitual bipedalism while retaining relatively small brains. Stone-tool knapping, however, **predates** the genus *Homo*: the \citealternativetitle{lomekwi} from approximately 3.3 million years ago, attributed to late australopithecines, is the oldest known assemblage. The emergence of the genus *Homo* around 2.8 million years ago was associated with increasing brain size and the more systematic **\citealternativetitle{oldowan}** tool industry, the first technology unambiguously tied to *Homo habilis*. *Homo erectus* (approximately 1.9 million years ago) was the first hominin to spread beyond Africa, mastering fire \cite[as demonstrated by Berna et al.]{wonderwerk} and developing more sophisticated tool technologies such as the Acheulean hand-axe.

Archaic humans including Neanderthals and Denisovans diverged from the lineage leading to modern humans roughly 500,000–700,000 years ago. Anatomically modern *Homo sapiens* appeared in Africa approximately 300,000 years ago \cite[as established by Hublin et al.]{hublin2017jebel}, with linguistic capacity likely present by 135,000 years ago \cite[as argued by Miyagawa et al.]{earlylanguage}. The emergence of modern human behavior \cite[as documented by Henshilwood et al.]{emergenceofmodernhumanbehaviour}, including symbolic art and complex tool manufacture, is attested from at least 100,000 years ago. The development of agriculture approximately 10,000–12,000 years ago and the subsequent rise of civilizations in Mesopotamia, Egypt, the Indus Valley, and China set the stage for the accumulation of knowledge across generations that would eventually produce philosophy, mathematics, and science, and, ultimately, the intellectual infrastructure for artificial intelligence.
</div>

<div class="md">
The controlled use of fire was a major \cite[turning point]{wonderwerk}
in human evolution. While extensive deposits of ash and charcoal
from sites dating to the past 400,000 years are well documented, the
evidence for fire from earlier contexts has long been subject to
alternative interpretations.

At \cite[Wonderwerk Cave]{wonderwerk}
in South Africa, micromorphological analysis and Fourier
transform infrared microspectroscopy of intact sediments from the
Early Acheulean Stratum 10, dated to approximately one Million Years Ago, provide
the earliest secure evidence for burning in an archaeological context.

The angularity of bone fragments and the
exceptional preservation of ashed plant material indicate that these
components were combusted and accumulated locally, approximately 30
meters inside the cave, ruling out transport by wind or water as well
as spontaneous guano combustion.

Fire awareness among hominins, however, almost certainly predates such
hearth evidence: as savanna-dwelling primates exposed to frequent
lightning-caused bush fires, early hominins would have engaged with
fire first as foragers, retrieving eggs, small animals, and
invertebrates made visible by burning landscapes, as described by
\citeauthorlastnameand{controlleduseoffire}.

Over time, these simple interactions
were stretched in space and time, pushing toward a division of labor
in which slow-burning materials had to be selected and guarded while
other subsistence activities continued.

The simplest ignition technique, rubbing a stick in a groove in a wooden “hearth”, requires no more
conceptual complexity than hafting, since both involve bringing two
components together via a vital intermediary: tinder in the one,
\cite[fixative in the other]{controlleduseoffire}.

\cite[By 120,000 years ago]{controlleduseoffire}, pierced shell beads indicate knowledge of twine or cord,
which would have been necessary for operating a fire drill.
Fire extended the waking day, enabled
cooking, which, according to \citeauthor{wrangham2009catching}'s cooking hypothesis,
dramatically improved nutrient absorption and supported the increase
in brain size through the Pleistocene, provided protection from predators, and
facilitated social gathering. In this
sense, the controlled use of fire and its associated tools sit at the
very beginning of the history of machines as a history of
**abstraction**, where human effort is progressively “drawn away”
from the direct task.
</div>

<div class="md">
The narrative above traces the *intellectual* lineage of the LLM, from Aristotle's syllogisms to the Transformer. But ideas alone do not compute. Every inference made by a modern language model rests upon a vast, invisible scaffolding of discoveries made by people who never imagined, and could never have imagined, that their work would one day help a machine write poetry. These are the **displaced prerequisites**: contributions so fundamental that they vanish into the background, like the air we breathe but rarely notice.

### From Amber to Amperes: The Discovery and Harnessing of Electricity

No electrical computer can exist without electricity, yet the phenomenon was first observed in a context utterly alien to computation. Around 600 BCE, **Thales of Miletus** noticed that rubbing amber (*ἤλεκτρον*, *elektron* in Greek) against fur caused it to attract lightweight objects like feathers, an observation recorded attributed to Thales, later catalogued by \citeauthor{laertius} in \citetitle{laertius} (Book I, §15). For over two millennia, this remained a philosophical curiosity, a parlor trick of nature.

The transformation of this curiosity into a usable force required a cascade of unrelated breakthroughs:

* **Alessandro Volta** (1800) created the first true battery (the *voltaic pile*), proving that electricity could be generated chemically and sustained as a steady current, not just produced as a momentary spark. He announced the device in a letter to Sir Joseph Banks, president of the Royal Society, subsequently published as \citetitle{volta}.

* **Michael Faraday** (1831) discovered **electromagnetic induction**, the dynamo principle, demonstrating that moving a magnet through a coil of wire generates electric current. He described the effect in \citetitle{faraday}. This single insight is the basis of virtually all electrical power generation on Earth, from coal plants to wind turbines. Without it, there is no power grid, no data center, and no GPU cluster.

* **Nikola Tesla** and **George Westinghouse** (1880s–1890s) championed **alternating current (AC)**, which allowed electricity to be transmitted over long distances without catastrophic loss. Tesla's foundational polyphase AC patents (U.S. Patents \cite[381,968]{teslaelectricmotor}–\cite[382,282]{teslacurrent}, filed 1887, granted 1888) and his landmark lecture “A New System of Alternate Current Motors and Transformers” (delivered before the American Institute of Electrical Engineers, May 1888) laid the technical basis. The ability to centralize power generation and distribute it across cities and continents is a silent prerequisite for every server farm that trains an LLM.

<div class="image-row">
    <figure>
        <img src="volta_portrait.jpg" alt="Engraved portrait of Alessandro Volta" />
        <figcaption class="md">\citeauthor{volta_portrait}, inventor of the first true electric battery.</figcaption>
    </figure>
    <figure>
        <img src="voltaic_pile.png" alt="Cross-section illustration of Alessandro Volta's voltaic pile, the first electric battery" />
        <figcaption class="md">\citealternativetitle{voltaic_pile} (1800): stacked disks of copper and zinc separated by brine-soaked cloth, the first electric battery.</figcaption>
    </figure>
</div>

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

### Quantum Mechanics and the Transistor: From Beach Sand to Thinking Silicon

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

### Fiber Optics and Submarine Cables: The Physical Internet

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

### Refrigeration and Cooling: Keeping the Mind from Melting

A modern data center generates enormous quantities of heat. Training a large language model pushes thousands of GPUs to their thermal limits for weeks or months. Without industrial **cooling systems**, the silicon would overheat and fail within minutes.

Long before mechanical refrigeration existed, the cold itself had to be **harvested in winter and stored for summer use**. The oldest strategy was the **[Eisweiher](ice pond)**: a small, shallow, wind-sheltered body of water, often an artificial pond or a specially dammed millpond, chosen so that a few days of sustained frost would freeze it solid. The surface was then cut into rectangular blocks with hand saws, pried loose with pike poles, and hauled by sled, cart, or slide into an insulated **ice cellar** (*Eiskeller*) packed with straw, where it could last through the warm months \cite[as illustrated in]{eisschlagen_traunsee}. The technique was in continuous use across Central Europe from the Middle Ages well into the twentieth century, and the name *Eisweiher* survives on ponds that today serve very different purposes, as fish ponds, fire-water reservoirs, or simply recreational lakes.

Where no suitable pond existed, breweries, hospitals, hotels, and food businesses erected **[Eisgalgen](ice gallows)**: wooden or steel frames fitted with sturdy horizontal crossbeams. At temperatures below about −3 °C, well or spring water was sprayed from nozzles over the rig, freezing into long icicles that could grow several metres down over the course of a cold week. The icicles were then knocked off with mallets, collected, and stored \cite[as documented in]{eisgalgen_mittenwald}. A single large installation, such as the one still occasionally operated at a brewery in Ulm, can “harvest” up to 100 m³ of ice during a sufficiently cold week. Unlike pond ice, gallows ice gave the operator direct control over water quality, and made ice production independent of any nearby natural waterbody, a complete ice-making installation with no moving parts and no machinery at all.

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

Each of these discoveries, and many more like them, from the rubbing of amber to the laying of submarine cables, was made in pursuit of goals entirely unrelated to artificial intelligence. Yet remove any single one, and the entire edifice collapses. They are the silent, displaced prerequisites: the foundations so deep they have become invisible.

### The Jacquard Loom: Weaving the Concept of Programmable Input

In 1804, **Joseph Marie Jacquard** perfected a loom attachment that used **punched cards** to automate the weaving of complex textile patterns. Each card encoded a single row: hole or no hole, thread up or thread down. By chaining cards together, an intricate brocade could be reproduced without a skilled assistant manually selecting each thread, a purely industrial innovation with no computational intent.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="jacquard_loom.jpg" alt="A Jacquard loom at the National Museum of Scotland, showing the chain of punched cards hanging vertically at the right" />
    <figcaption class="md">The \citealternativetitle{jacquard_loom}: a Jacquard loom with its chain of punched cards visible on the right. Each card encodes a single row of the pattern, the first example of a complex, sequential process stored as discrete binary instructions on a physical medium.</figcaption>
</figure>

Yet the conceptual leap was immense: a complex, sequential process had been **encoded as discrete binary instructions on a physical medium**. **Charles Babbage** explicitly borrowed the mechanism for his **Analytical Engine** (c. 1837), and **Ada Lovelace** captured the lineage precisely: the Engine “weaves algebraic patterns just as the Jacquard-loom weaves flowers and leaves” (\citetitle{lovelacequote}). **Herman Hollerith** later adapted punched cards for the **1890 US Census**, founding the company that became **IBM**. Punched cards remained the dominant computer input medium into the 1970s (see \citetitle{taocp3}, p. 383-384).

Without the loom, there is no concept of externally encoded, interchangeable instructions, no punched card, no magnetic tape, no software. A textile artisan solving a manufacturing problem inadvertently created the first programmable input mechanism.

### From Typewriters to Keyboards: The Mechanical Alphabet

Every prompt typed into an LLM passes through a **keyboard** whose layout was dictated not by computation, but by the jamming tendencies of 19th-century typebar mechanisms.

In 1868, **Christopher Latham Sholes**, Carlos Glidden, and Samuel W. Soule patented an early typewriter (\cite[U.S. Patent 79,265]{typewriterpatent}). By 1874, **E. Remington and Sons** began mass-producing the **Sholes & Glidden Type-Writer**, featuring the **QWERTY** layout, an arrangement designed to separate commonly paired letters and prevent adjacent typebars from colliding. This layout, born from a purely mechanical constraint, became the universal standard for text input and has survived virtually unchanged for over 150 years.

<figure>
    <img style="width: 70%; height: auto; display: block; margin: 1em auto;" src="sholes_typewriter.jpg" alt="The original Sholes typewriter prototype with circular key arrangement" />
    <figcaption class="md">\citealternativetitle{sholes_typewriter}: the original Sholes, Glidden and Soule prototype typewriter (1868–1873), manufactured by E. Remington and Sons as the Sholes &amp; Glidden Type-Writer. The QWERTY layout, designed to prevent adjacent typebars from jamming, became the universal input standard that survives into the era of LLM chatbots.</figcaption>
</figure>

**Teletypes** in the early 20th century adapted the typewriter keyboard for electrical communication, encoding keystrokes as signals over telegraph lines. When **video terminals** replaced teletypes in the 1970s, the QWERTY keyboard carried over unchanged. The computer keyboard is, in every functional sense, a typewriter with its mechanical linkage replaced by an electrical switch matrix.

Today, a user's fingers follow a key arrangement dictated by 1870s typebar physics, yet without the typewriter's standardization of rapid text input, the entire paradigm of **conversational AI** would lack its most fundamental interface.

### Cathode Rays and Glowing Phosphors: The Screen That Gave AI a Face

A machine that cannot *show* its output is, for all practical purposes, mute. The visual display has its origins not in computing, but in 19th-century experimental physics.

In 1897, **Karl Ferdinand Braun** invented the **cathode ray tube (CRT)** at the University of Strasbourg, described in \citetitle{braunannalen}. It was a laboratory instrument for visualizing alternating-current waveforms, a tool for physicists, not communicators. By directing an electron beam onto a phosphorescent surface, Braun rendered invisible electrical phenomena as visible, glowing traces.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="crt.jpg" alt="Close-up of a cathode ray tube (CRT) picture tube, showing the phosphor-coated screen" />
    <figcaption class="md">A \citealternativetitle{crt}: the phosphor-coated face of a cathode ray tube. Invented in 1897 as a laboratory instrument for visualising oscillating currents, the CRT evolved through television, radar and computer terminals into the display on which the first chatbots were typed.</figcaption>
</figure>

From this scientific instrument, an extraordinary displacement unfolded: **Philo Farnsworth** demonstrated fully electronic television in 1927, adapting the CRT for broadcast entertainment. During WWII, CRTs were repurposed for **radar displays**, the first use as an interactive, real-time information screen. The transition into computing followed at MIT, where the **Whirlwind** computer (early 1950s) used a CRT for real-time output, and Ivan Sutherland's \cite[Sketchpad]{sketchpad} (1963) proved a screen could be a medium for direct graphical interaction with a computer.

Without the visual display, AI remains a silent, invisible process. The screen is the **output channel** through which a language model becomes conversational and immediate, and its lineage traces directly to a physicist studying oscillating currents with no notion of “computation” whatsoever.
</div>

<div class="md">
### From Niépce's Pewter Plate to Muybridge's Plates: The Birth of Image-Sequence Data

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

Encouraged, the University of Pennsylvania commissioned Muybridge between 1884 and 1887 to extend this approach systematically. The resulting work, ***Animal Locomotion***, comprised **781 collotype plates containing more than 20,000 individual photographs** \cite[as catalogued by Muybridge]{muybridge1887catalogue}. Each plate captured a single motion (a woman opening a parasol, an ostrich running, a child ascending stairs) in 36 successive frames, photographed by 12 to 24 synchronised cameras whose shutters were tripped by electromagnets and time-stamped by a chronographic clock. Crucially, every plate was **annotated**: subject, action, age, build, even clothing and props, in exactly the form of a modern supervised-learning dataset. Plate 626, for instance, is not just a horse running, it is *“Gallop; thoroughbred bay mare, Annie G.”*

Two structural inventions of this project have proved decisive for every vision model trained since:

1. **The labelled image sequence.** Muybridge's plates are rows of equal-time-interval frames of a known subject performing a known action. This is the schema of ImageNet, Kinetics, Something-Something and YouTube-8M, expressed in 1887. The model has not changed; only the volume and the digital substrate have.
2. **Synchronised multi-view capture.** To resolve the foreshortening that confuses single-perspective images, Muybridge placed additional camera banks at the front and rear of his track, and built a six-camera array that fired simultaneously from different angles, the conceptual ancestor of modern **multi-view stereo, photogrammetry, NeRF and 3D Gaussian Splatting**, all of which are trained on Muybridge-style synchronised image-sets of a scene captured from many viewpoints.

Muybridge went further still. He built the **zoöpraxiscope**, a projection device that replayed his sequences as cyclical animations, the technical seed of motion pictures, and through them of Disney, CGI, Pixar and the rendered-image training corpora that today's image-generation models consume by the petabyte. As \citeauthor{solnit2003motion} argues in her study of the project, Muybridge's *“invention was not the photograph, but the sequence”* \cite[as discussed by Solnit]{solnit2003motion}, and the sequence is the data structure of every modern visual network.

\citeauthor{gordon2015indecent} has catalogued how systematic the project was: a hierarchy from nude human males down to chickens, ordered by a 19th-century logic of the *scala naturae*, but presented in the visual grammar of a modern corpus, complete with controlled backgrounds, grid markings for measurement, and rejection of out-of-sequence frames. The aesthetic of an AI training set, in other words, predates the algorithm by half a century.

Without chronophotography there are no video frames. Without labelled image-sequences there are no video-classification, action-recognition or world-model datasets. Without synchronised multi-view capture there are no neural radiance fields. Without Muybridge's pewter and silver plates, the contemporary vision stack has nothing to look at. The trained image lives because a horse galloped past a row of tripwires in Palo Alto, and a stubborn photographer was willing to spend three years at the University of Pennsylvania counting its hoofbeats.
</div>

<div class="md">

### ARPANET: Connecting the First Nodes

In 1969, the **Advanced Research Projects Agency Network (ARPANET)** transmitted its first message between UCLA and the Stanford Research Institute, the machine crashed after sending the letters “LO” (of an intended “LOGIN”). The network's purpose was military resilience and academic resource-sharing, documented in \citetitle{rfc1} by **Steve Crocker**. By 1971, ARPANET connected 15 nodes. By 1973, it had crossed the Atlantic. The foundational idea, that heterogeneous computers could exchange data through a shared, decentralized protocol, was radical, but it was *not* about making information public. ARPANET was a closed network for researchers and defense contractors.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="arpanet_map.png" alt="ARPANET logical map, March 1977, showing the network's topology with dozens of nodes and links across the United States" />
    <figcaption class="md">The \citealternativetitle{arpanet_map}: the logical topology of the ARPANET in March 1977. What began as a four-node experimental network in 1969 would, a generation later, become the technical substrate of the modern Internet, and thus of every web-scale corpus on which an LLM is trained.</figcaption>
</figure>

### TCP/IP: A Universal Language for Machines

ARPANET's original protocols were rigid and network-specific. In \citeyear{cerfkahn}, **Vint Cerf** and **Bob Kahn** proposed the **Transmission Control Protocol / Internet Protocol (TCP/IP)** in \citetitle{cerfkahn}, a universal standard that allowed *any* network to interconnect with *any* other. When ARPANET adopted TCP/IP on January 1, 1983, the so-called “flag day”, the *internet* as a network of networks was born. This was the critical infrastructural layer: a single, open protocol suite that allowed global-scale data exchange, independent of any particular hardware vendor or government.

### Tim Berners-Lee and the World Wide Web

The internet connected machines. The **World Wide Web** connected *documents*. In March 1989, **Tim Berners-Lee**, a software engineer at CERN, circulated \citetitle{bernerslee1989}, a memo proposing a system of interlinked hypertext documents accessible over the internet. By December 1990, he had built the first web server, the first web browser, and the first web page. The three pillars he created, **HTML** (a markup language for documents), **HTTP** (a protocol for transferring them), and **URLs** (a system for addressing them), transformed the internet from a communication tool for specialists into a **public, self-publishing platform for all of humanity**.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="first_web_browser.png" alt="Screenshot of the WorldWideWeb browser running on a NeXT computer, showing an early web page with hyperlinked text" />
    <figcaption class="md">The \citealternativetitle{first_web_browser}: a screenshot of the WorldWideWeb browser running on a NeXT workstation in December 1990. Built by Tim Berners-Lee at CERN, it was simultaneously editor and viewer for the world's first hypertext web pages.</figcaption>
</figure>

The consequences were staggering. Within a decade, millions of people were voluntarily uploading text: personal websites, forums, blogs, news articles, encyclopedias, academic papers, product reviews, fan fiction, legal opinions, recipes, poetry, code repositories, and every other form of human expression. By the 2010s, organizations like **\citetitle[Common Crawl]{commoncrawl}** were archiving billions of web pages, creating open datasets of hundreds of terabytes of raw text.

### The Web as Training Corpus

This is the direct, causal link to modern AI. A large language model learns by ingesting text, as much text as possible, in as many domains, registers, and languages as possible. The datasets that power models like GPT-3 and its successors (such as \citetitle[Common Crawl]{commoncrawl}, and \cite[Wikipedia dumps]{wikimediadumps}) are direct products of the Web's open, self-publishing architecture. Without Berners-Lee's decision to make the Web royalty-free and without the open protocols of TCP/IP, the digital text generated by humanity would have remained fragmented across proprietary, incompatible, and inaccessible systems, bulletin boards, corporate intranets, and gated databases. There would be no single, crawlable, interlinked ocean of human language.

As noted elsewhere in this history, the \cite[Bitter Lesson]{sutton2019bitter} teaches that scale and data ultimately outperform hand-crafted rules. But scale requires *something to scale on*. The World Wide Web provided exactly that: a self-assembling, ever-growing corpus of human thought, freely accessible and machine-readable. ARPANET gave machines the ability to talk to each other. TCP/IP gave them a common language. The World Wide Web gave humanity a reason to pour its collective knowledge into the network. And that collective knowledge became the raw material from which a language model learns to speak.
</div>

<div class="md">
The entire trajectory from stone tools to silicon chips presupposes a
transformation so fundamental that it is easily overlooked: the
**Neolithic Revolution**, the transition from nomadic
hunter-gatherer societies to settled agricultural communities,
beginning roughly 10,000–12,000 years ago in the Fertile Crescent.

Without **sedentarization** (*Sesshaftwerdung*), none of the
intellectual and material prerequisites described in this history
could have emerged. Permanent settlements enabled:

* **Surplus and Specialization:** Agriculture produced food surpluses
  that freed individuals from constant subsistence labor. For the
  first time, a society could sustain specialists: potters,
  metalworkers, scribes, priests, and, eventually, mathematicians and
  philosophers. Without surplus, there is no leisure for abstract
  thought; without abstract thought, there is no Aristotle, no
  Leibniz, no Turing.

* **Writing and Record-Keeping:** The earliest writing systems,
  Sumerian cuneiform and Egyptian hieroglyphs, emerged not from
  literary ambition but from the bureaucratic need to track grain
  stores, land ownership, and trade debts in settled communities. The
  very act of *encoding information on a physical medium*, the
  conceptual ancestor of every punch card, magnetic tape, and SSD,
  was born from agricultural bookkeeping.

* **Accumulation of Knowledge Across Generations:** Nomadic groups
  carry only what they can remember or transport. Settled societies
  accumulate **libraries**, observational records spanning centuries
  (essential for astronomy and mathematics), and physical
  infrastructure like workshops and forges. The Antikythera Mechanism
  could not have been conceived, let alone built, by a society without
  permanent workshops, multi-generational craft traditions, and
  written astronomical tables accumulated over hundreds of years.

* **Dense Social Networks:** Permanent settlements concentrated
  populations, enabling the rapid exchange of ideas, the division of
  intellectual labor, and the institutional structures (academies,
  universities, guilds) that preserved and transmitted knowledge.

This list is far from exhaustive. Countless other “invisible
prerequisites“ underpin the history of computation and AI that remain
unmentioned here: the domestication of animals (enabling transport
and communication networks), the invention of metallurgy (without
which no gear, no wire, no chip), the development of glass-making
(without which no lenses, no microscopes, no fiber optics), the
social invention of currency and markets (which drove the need for
arithmetic and accounting), and the political emergence of
institutions capable of funding long-term research with no immediate
practical return. Each of these, like sedentarization itself,
represents a **displaced prerequisite**: a transformation made for
reasons entirely unrelated to computation, yet without which the
entire edifice of artificial intelligence would be inconceivable.

### From Bloomery to Boolean: The Metals That Compute

Metallurgy is a silent prerequisite whose absence makes every other layer of this history impossible. The trail begins not in a logic textbook but in a smelter's furnace, with the first systematic reflection on what an ore actually is. **\citeauthor{theophrastusstones}**'s \citeyear{theophrastusstones} treatise \citetitle{theophrastusstones} (Περὶ λίθων) is the earliest surviving attempt to classify rocks and minerals by their behavior under heat, including the iron ores that would, within a few centuries, replace bronze as the skeleton of civilisation. A few generations later, **\citeauthor{plinynaturalhistory}**'s \citeyear{plinynaturalhistory} \citetitle{plinynaturalhistory}, in particular books XXXIII and XXXIV, gathered everything the Roman world knew about copper, iron, gold, silver, lead, tin, and mercury, including the mining and smelting processes that turned ore into the material substrate of roads, aqueducts, weapons, coinage, and (by then) the bronze gears of the Antikythera mechanism.

The leap from art to science came in \citeyear{deremetallica}, when **\citeauthor{deremetallica}** published \citetitle{deremetallica}, the first comprehensive modern treatise on mining and smelting, with 292 woodcuts that turned German mining practice into a book one could study. Agricola's volumes remained the standard for nearly two centuries, and **\citeauthor{vonneumann}**'s later EDVAC design borrowed directly from the engineering vocabulary of mines: a "Store" (memory) and a "Mill" (CPU) are named after the architecture of ore processing. The transformation of iron from a precious craft metal into an industrial commodity was completed in \citeyear{bessemerpatent}, when **\citeauthor{bessemerpatent}** patented the \citealternativetitle{bessemerpatent}, which dropped the price of steel by a factor of ten and made possible every precision instrument, generator, and structural beam that the electric age would demand.

Yet the deepest metallurgical miracle predates Bessemer by more than a millennium and stands in Delhi. The \citealternativetitle{ironpillardelhi}, erected under Chandragupta II (c. 375–415 CE), has resisted corrosion for over 1,600 years in a climate that would eat unprotected iron alive. **\citeauthor{ironpillardelhi}**'s \citeyear{ironpillardelhi} analysis showed that the resistance comes from a thin, self-forming layer of crystalline iron hydrogen phosphate hydrate that grows only one-twentieth of a millimetre per millennium: a passive film that ancient Indian smiths produced not by understanding quantum electrochemistry, but by smelting with high-phosphorus charcoal in a lime-free furnace. The pillar's survival is, like the Jacquard loom or the Antikythera mechanism, a reminder that someone solved a problem no one had formulated, with no intention of contributing to any future science.

Strip any single one of these metallurgical achievements from the causal chain and it breaks. Smelted copper, drawn into wire and insulated with gutta-percha, became the telegraphic nervous system that linked continents into a single information space. Brass gears, cast and filed to tolerance, made possible the Antikythera mechanism, Babbage's Analytical Engine, and the differential analyzer. Refined silicon, grown into defect-free single crystals by \citeauthor{czochralski1918}'s \citeyear{czochralski1918} process and zone-purified by the \citealternativetitle{siemensprocess}, became the substrate on which \citeauthorlastnameand{semiconductor} etched the first point-contact transistor in \citeyear{semiconductor}. Gold bonding wires, the width of a human hair, connect every silicon die to the package that sits on every accelerator board. Tungsten filaments lit the vacuum tubes of ENIAC; lithium cobalt oxide cathodes, discovered by \citeauthor{goodenough1980licoo2} in \citeyear{goodenough1980licoo2} and industrialized by \citeauthor{yoshino1985liion} in \citeyear{yoshino1985liion}, now power the edge devices that run local language models. None of these were invented for artificial intelligence. All of them, together, are the silent, displaced prerequisites: remove a single one and the chain of inference breaks.

### The Silent Other Half: Insulating Electricity from Itself

For every copper wire that carried the first telegraph signal, some unknown insulator had to wrap around it and refuse to carry it themselves. Without insulation, electricity simply arcs to the nearest ground and dissipates as heat; the entire discipline of electrical engineering exists only because someone, somewhere, found a material whose electrons refused to move. The displaced prerequisite, in other words, is not the conductor but the **resistor of motion around it**. The \citealternativetitle{guttapercha} tree, a *Palaquium* of the Malay archipelago, was tapped for centuries by local craftsmen before the British surgeon \textbf{William Montgomerie} identified in \citeyear{guttapercha} its unusual dielectric strength and thermoplastic behaviour. \textbf{\citeauthor{faraday}} recognised its insulating value at its introduction, and by 1845 it was being extruded around copper wire to form the first insulated telegraph conductors. \textbf{\citeauthor{atlantictelegraph}}'s \citeyear{atlantictelegraph} book \citetitle{atlantictelegraph} documents the central role the material played in the 1857–1858 transatlantic cable attempts: 2,600 nautical miles of copper conductor had to be wrapped in gutta-percha to survive a mile-deep ocean without short-circuiting to seawater. Without gutta-percha, no submarine cable, no global telegraph, no instant transatlantic news, no cable-stitched internet, no undersea fibre backbone.

The second wave of insulation was synthetic. \textbf{\citeauthor{goodyearvulcanization}}'s \citeyear{goodyearvulcanization} patent (U.S. Patent 3,633) hardened natural rubber with sulfur and heat, transforming a sticky tropical sap into a tough, elastic, electrically insulating material that could wrap the dynamos, switches, and wires of the new electric power industry. \textbf{\citeauthor{baekelandpatent}}'s \citeyear{baekelandpatent} patent (U.S. Patent 942,699) for "hard, insoluble and infusible condensation products of phenols and formaldehyde" gave the world **Bakelite**, the first fully synthetic plastic and the dominant electrical insulator of the early twentieth century: coil bobbins, switch bases, radio housings, distributor caps, and the brown telephone cases that populated every office in the Western world. By 1940, however, a different polymer had quietly displaced both rubber and gutta-percha in most cable applications. The ICI team of Eric Fawcett and Reginald Gibson, working in 1933 at several hundred atmospheres pressure in Northwich, England, accidentally produced a white waxy substance they called polyethylene, and \textbf{\citeauthor{polyethylenehistory}}'s \citeyear{polyethylenehistory} article on polyethylene documents how commercial production by ICI from 1939 onward was immediately classified by the British government because the material's extremely low loss at UHF and SHF frequencies made it the perfect insulator for the coaxial cables of radar sets — a fact that would only be declassified after the war.

Strip any single one of these insulating materials from the causal chain and the chain breaks. Bakelite bobbins let Tesla and Westinghouse's AC motors run unattended for decades; polyethylene's controlled dielectric constant makes the twisted-pair cable in every Ethernet port possible, and its low-loss profile at microwave frequencies is what lets the radar, the cell tower, and the satellite downlink carry data across a continent or an ocean. The enamel coating on a single copper magnet wire is, today, a thin shell of polyimide or polyurethane whose molecular structure was engineered for a thermal class invented for the 1960s space program. Without insulation, the conductor alone cannot even *be* a conductor — a wire shorted to ground is not a wire but a fuse. The displaced prerequisite here is not the metal, not the signal, but the stubbornness of the material wrapped around the metal that lets the signal *stay* a signal.

Modern AI rests on a cumulative infrastructure that includes
metallurgy, electrical insulation, semiconductor fabrication,
refrigeration, and dozens of other domains developed for reasons
unrelated to computation. Most of these contributions were made by
people who could not have foreseen their eventual use in artificial
intelligence systems.
</div>

<div class="md">

Every weight update in a modern neural network is an electrical signal propagating through silicon, coordinated by a clock, stored in volatile memory, and communicated across copper traces on a printed circuit board. None of these components was invented for artificial intelligence. The CPU descends from wartime code-breaking. RAM evolved from radar. The GPU was forged by video games. Networking grew from military resilience planning. Storage was driven by census-taking. Yet together, they form the physical body in which neural networks are incarnated.

### The Central Processing Unit (CPU)

The CPU's modern history begins with relay-based processors like Zuse's Z3 (1941) and the vacuum-tube ENIAC (1946), which used thousands of tubes to achieve speeds thousands of times faster than relays \cite[see ENIAC description]{eniac1946}. The transistor (1947) made miniaturization possible \cite[Bardeen et al., 1948]{semiconductor}, and the **integrated circuit**, independently conceived by **Jack Kilby** (1958) \cite[Kilby, 1958]{kilbyic} and **Robert Noyce** (1959) \cite[Noyce, 1959]{noyceic}, placed multiple transistors on a single die.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="eniac.jpg" alt="The ENIAC at the Moore School of Electrical Engineering, with Cpl. Irwin Goldstein setting switches on one of its function tables" />
    <figcaption class="md">\citealternativetitle{eniac_image}: the U.S. Army's 1946 photograph of the ENIAC in operation at the Moore School. The machine spans an entire room and fills it wall-to-wall with cables, vacuum tubes and function-table panels.</figcaption>
</figure>

The leap to the **microprocessor** arrived in 1971 with the \cite[Intel 4004]{intel4004}, containing 2,300 transistors at 740 kHz. The relentless growth described by \citealternativetitle{mooreslaw} drove counts from thousands to billions. Key architectural innovations included **pipelining** (IBM System/360, 1964), **out-of-order execution** \cite[first in the IBM System/360 Model 91]{tomasulo1967}, **superscalar architectures** (1990s), and **multi-core processors** (IBM POWER4, 2001), acknowledging that frequency scaling had hit thermal limits. For AI, the CPU served as the sole training platform until the mid-2000s, but its sequential MIMD architecture proved poorly suited to the massively parallel matrix operations of deep learning.

### Random Access Memory (RAM)

The earliest electronic computers used **delay-line memory**, first implemented in the \cite[EDSAC]{edsac1949} (1949). An alternative approach, the **Williams tube** (1947), developed by \cite[Freddie Williams and Tom Kilburn]{williamstube} at the University of Manchester, stored bits as charged dots on the face of a cathode ray tube, making it the first form of truly random-access electronic memory. It was used in the Manchester Baby (1948), the world's first stored-program computer to run a program, and later in machines like the IBM 701. However, it was unreliable and required constant refreshing of the display. The breakthrough in reliability came with **magnetic-core memory**, developed by \cite[An Wang]{wangcore} (1949) and Jay Forrester at MIT, which dominated from the 1950s through the early 1970s.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="williams_tube.jpg" alt="A Williams-Kilburn tube on display: a small cathode ray tube with its deflection circuitry visible behind it" />
    <figcaption class="md">The \citealternativetitle{williams_tube}: a Williams-Kilburn cathode-ray tube with its associated read/write electronics. Each bit was stored as a tiny patch of charge on the phosphor screen, the first truly random-access electronic memory.</figcaption>
</figure>

The modern era began when \cite[Robert Dennard]{dennard1968} at IBM invented **DRAM** (1966), storing each bit as a charge in a capacitor. The \cite[Intel 1103]{intel1103} (1970), holding 1 kilobit, rapidly displaced core memory. DRAM capacity has followed its own exponential trajectory: 1 Kb (1970), 1 Mb (1986), 1 Gb (early 2000s), to modern DDR5 modules offering 64 GB per DIMM at bandwidths exceeding 50 GB/s. For AI workloads, memory bandwidth is often the binding constraint: **High Bandwidth Memory (HBM)**, developed by \cite[AMD and SK Hynix]{hbm2013}, provides the necessary throughput for GPU-based training.

### The Motherboard

The motherboard physically and electrically connects all components. The modern form traces to the **IBM PC** (1981), which established standardized expansion slots. The evolution of bus architectures, from ISA (1981) to PCI (1992) to \cite[PCI Express]{pciespec} (2003), reflects ever-increasing bandwidth demands. For AI training, motherboard design determines how many GPUs can communicate and at what speed; proprietary interconnects like \cite[NVLink]{nvlink} provide up to 900 GB/s between GPUs, far exceeding PCIe alone.

### Networking

The digital networking revolution began with **packet switching**, independently conceived by \cite[Paul Baran]{baran1964} (1964) and Donald Davies (1965). This was realized in \cite[ARPANET]{rfc1} (1969) and universalized through \cite[TCP/IP]{cerfkahn} (1974). Key milestones for AI include:

* **Ethernet** (1973, \cite[Robert Metcalfe]{metcalfe1976}): now operating at 800 Gbps in data centers.
* **InfiniBand** (\cite[first specified in 2000]{infiniband2000}): the backbone of most GPU training clusters, offering latencies under 1 μs and bandwidths exceeding 400 Gbps.
* **RDMA (Remote Direct Memory Access)**, formalized in the \cite[Virtual Interface Architecture]{via1998} and built natively into InfiniBand: allowing one machine to read another's memory without involving either CPU, critical for gradient synchronization in distributed training frameworks like \cite[Horovod]{horovod2018}.

Training a frontier LLM may involve thousands of GPUs synchronizing gradients every few hundred milliseconds. The collective communication patterns (all-reduce, ring-allreduce) are as much “hardware” as the chips themselves.

### Storage

* **Punched Cards** (\cite[Jacquard, 1804]{jacquard1804}; \cite[Hollerith, 1890]{hollerith1890}): the first machine-readable medium.
* **Magnetic Tape** (1951, \cite[UNIVAC I]{univac1951}): sequential-access, still used for archival.
* **Hard Disk Drives** (1956, \cite[IBM 305 RAMAC]{ibmramac}): the first random-access magnetic storage, originally 5 MB across fifty 24-inch platters; by 2025, individual HDDs exceed 30 TB.
* **Solid-State Drives** (commercially viable ~2008, based on \cite[NAND flash memory]{masuoka1987}): NVMe PCIe 5.0 SSDs offer 14+ GB/s reads, enabling the rapid random access needed to feed GPU pipelines.

For large-scale training, data is stored in distributed file systems (Lustre, GPFS) or object storage (S3), striping petabytes across thousands of drives at aggregate bandwidths of hundreds of GB/s.

### The Graphics Processing Unit (GPU)

The first dedicated graphics chips (e.g., the \cite[IBM Professional Graphics Controller]{ibmpgc}, 1984) were fixed-function pipelines. Programmable shaders (NVIDIA GeForce 3, 2001) made GPUs flexible, and \cite[CUDA]{cuda} (2006) provided the software bridge. Key milestones for AI:

* **NVIDIA Tesla (2007)**: first GPU marketed for general-purpose computing.
* **NVIDIA Volta / V100 (2017)**: introduced **Tensor Cores** for mixed-precision matrix operations.
* **NVIDIA A100 (2020)**: third-generation Tensor Cores, sparsity-aware computation, Multi-Instance GPU.
* **NVIDIA H100 (2022)** and **B200 (2024)**: Transformer Engine, FP8 support, NVLink 4.0.

Google's **TPUs**, custom ASICs for neural network workloads \cite[first deployed in 2015]{jouppi2017tpu}, offer an alternative architecture, and the competition between general-purpose GPUs and specialized accelerators continues to shape AI hardware.

### The Power Supply

Modern GPUs alone draw over 700 W; a full training node may consume 5–10 kW. The evolution from linear regulators to high-efficiency **switched-mode power supplies** (1960s–70s) made dense computing viable. The 80 PLUS certification program (2004) drove PSU efficiency above 90%, a seemingly mundane achievement that determines the economic viability of large-scale training.

### The Clock

Every digital computer operates to the rhythm of a **crystal oscillator**. The quartz crystal oscillator, developed by \cite[Walter Cady]{cady1922} in 1921 for radio, was adopted for computing to ensure billions of transistors switch in lockstep. Modern CPUs tick at 3–6 GHz. Without this temporal coordination, the parallel operations within a CPU or GPU would dissolve into chaos.

### Convergence

None of these components was invented for AI. Yet remove any single element and the entire edifice collapses. The history of AI hardware is the ultimate illustration of the “displaced prerequisite”: a convergence of solutions to unrelated problems that proved inseparable once they met.
</div>

<div class="md">

The numeral zero, along with the positional decimal system, was \cite[introduced to Western Europe]{kleinetymology} through the work of **Leonardo of Pisa** (Fibonacci). In his 1202 work *Liber Abaci*, Fibonacci \cite[popularized the Indo-Arabic numeral system]{fibonacciliber} in the Western world, using digits $0$ through $9$ with place-value notation. Unlike the cumbersome Roman numerals used in Europe at the time, this system offered revolutionary simplicity and computational power. Fibonacci is \cite[responsible for popularising the Arabic numerals (0, 1, 2, 3, 4, …) in Europe]{fibonaccimathigon}, which was still using Roman numerals (I, V, X, D, …) in the 12th century CE.

Fibonacci \cite[studied with Arab mathematicians]{fibonaccihistory} in North Africa, where his father held a diplomatic post. The system originated in India, **Brahmagupta** (c. 628 CE) formalized arithmetic with zero in his \cite[*Brāhmasphuṭasiddhānta*]{brahmagupta628}. It reached the Islamic world through \cite[Al-Khwarizmi]{alkwarizma}, whose 9th-century *al-Kitāb al-mukhtaṣar fī ḥisāb al-jabr wa-l-muqābala* served as the conduit to North Africa and, eventually, to Fibonacci.

*Liber Abaci* also \cite[introduced Europe to the Fibonacci sequence]{fibonacciseq}:

$$F_0 = 0,\quad F_1 = 1,\quad F_n = F_{n-1} + F_{n-2}$$

</div>

<div class="md">

A **data type** classifies a value's representation and permitted operations. The core primitive types in most modern languages:

| Type | Example | Bits (typical) |
|------|---------|----------------|
| `int` | `42` | 32 or 64 |
| `float` | `3.14` | 32 (IEEE 754) |
| `double` | `3.14159265` | 64 (IEEE 754) |
| `str` | `"hello"` | variable |
| `bool` | `true` / `false` | 1 (logical) |

### The Prehistory: Machines Without Types

The earliest computers, such as \cite[Zuse's Z3]{zusebook} (1941) and the \cite[ENIAC]{eniac1946} (1946), operated on raw binary patterns. The machine made no distinction between an integer, a floating-point number, or an instruction, interpretation was entirely in the mind of the programmer.

### FORTRAN and the Birth of Explicit Types (1957)

The first major formalization came with **FORTRAN**, designed by \cite[John Backus]{backusfortran} and his team at IBM. FORTRAN introduced the distinction between `INTEGER` and `REAL` (floating-point) variables, determined implicitly by naming convention: variables beginning with I-N were integers, all others were real. This was the first time a compiler enforced a distinction between numeric types.

### ALGOL 60 and Explicit Type Declarations (1960)

The \cite[ALGOL 60 report]{algol60report}, edited by **Peter Naur**, introduced *explicit type declarations*. Programmers now wrote `integer x` or `real y`. ALGOL 60 also introduced the `Boolean` type, named after \cite[George Boole]{bool1854}, whose 1854 *An Investigation of the Laws of Thought* reduced logic to binary algebra. This was the first language to include `Boolean` as a named, first-class data type.

### Floating-Point Standardization: IEEE 754 (1985)

While floating-point arithmetic existed from the earliest computers, every manufacturer implemented it differently. The chaos was resolved by \cite[IEEE 754]{ieee754_1985}, primarily the work of **William Kahan** (UC Berkeley, Turing Award 1989). It defined:

$$\text{float (32-bit):}\quad (-1)^s \times 1.m \times 2^{e-127}$$

where $s$ = 1 sign bit, $e$ = 8 exponent bits, $m$ = 23 mantissa bits. The standard was revised in \cite[IEEE, 2008]{ieee754_2008} and \cite[IEEE, 2019]{ieee754_2019}.

### The Boolean in Programming

- **ALGOL 60** (1960): first language with `Boolean` as a named type.
- **C** (1972): notoriously lacked a dedicated Boolean type, using `int` with the convention $0 = \text{false}$. A `_Bool` type was only added in \cite[C99]{c99standard} (ISO/IEC 9899:1999).
- **Python**: `bool` added as a subclass of `int` in version 2.3 (2003), formalized by \cite[PEP 285]{pep285} (Guido van Rossum, 2002).

### Type Theory: The Mathematical Foundations

The theoretical underpinning traces to \cite[*Principia Mathematica*]{russell1910principia} (Russell & Whitehead, 1910), developed computationally by \cite[Alonzo Church]{churchsimplytyped} (simply typed lambda calculus, 1940), \cite[Roger Hindley]{hindleytypes} (1969) and \cite[Robin Milner]{milnertypeinference} (1978) with type inference, and \cite[Per Martin-Löf]{martinloeftypetheory} (dependent types, 1971).
</div>

<div class="md">

## Arrays: A History of Structured Data

### Conceptual Roots in Mathematics

The concept of arrays has deep roots in mathematics, particularly in **matrices** and **vectors** from linear algebra. Mathematicians like **Arthur Cayley** (\citeyear{cayleymemoirmatrices}) formalized matrix algebra, providing the theoretical underpinning for what would later become the array data structure in computing.

At its core, an array is an ordered, indexed collection of elements stored in contiguous memory. The concept mirrors ancient tools for structured counting, from tally bones with sequential notches (~41,000 BCE) to the Salamis Tablet (c. 300 BC), which mapped abstract numbers to physical grid coordinates, essentially functioning as a two-dimensional array.

### Arrays in Early Computing

The earliest computers (Zuse's Z3, ENIAC) operated on raw binary patterns with no formal distinction between data types. The formalization of arrays as a programming construct emerged with high-level languages:

- **FORTRAN (1957)**, Designed by John Backus at IBM, FORTRAN was the first widely-used high-level language and introduced explicit multi-dimensional arrays for scientific computing. A declaration like `DIMENSION A(10,10)` allocated a $10 \times 10$ matrix in memory.
- **ALGOL 60 (1960)**, Introduced explicit type declarations and dynamic array bounds.
- **C (1972)**, Dennis Ritchie's C language exposed arrays as contiguous blocks of memory with pointer arithmetic, giving programmers direct control over memory layout.

### Why Arrays Matter

Arrays map directly to how computer memory works, sequential, indexed storage. Accessing element $i$ of an array takes constant time $O(1)$ because the memory address can be computed directly:

$$\text{address}(A[i]) = \text{base\_address} + i \times \text{element\_size}$$

This efficiency made arrays the foundation for virtually all higher-level data structures (linked lists, hash tables, heaps, etc.) and algorithms (sorting, searching, matrix operations).


## NumPy: Efficient Arrays for Python

### The Problem

Python, created by Guido van Rossum in 1991, is an interpreted, dynamically-typed language. Its built-in `list` type is flexible but extremely slow for numerical computation because each element is a full Python object with type information, reference counts, and heap allocation.

### The Solution

**NumPy** (Numerical Python) was created by **Travis Oliphant** in 2005 by unifying two earlier projects: `Numeric` (1995, Jim Hugunin) and `Numarray` (2001, Space Telescope Science Institute). NumPy introduced the `ndarray`, a homogeneous, fixed-type, n-dimensional array stored in contiguous memory, with operations implemented in C and Fortran.


### Key Capabilities

- **Labeled axes**, Rows and columns have names, not just integer indices
- **Missing data handling**, Built-in `NaN` propagation and fill methods
- **GroupBy operations**, Split-apply-combine pattern for aggregation
- **Time series support**, Date ranges, frequency conversion, rolling windows
- **I/O tools**, Read/write CSV, Excel, SQL, Parquet, JSON, HDF5
- **Alignment**, Automatic data alignment on labels during operations

### Impact

Pandas became the de facto standard for data manipulation in Python, enabling the entire data science workflow:

$$\text{Raw Data} \xrightarrow{\text{Pandas}} \text{Clean Data} \xrightarrow{\text{Scikit-learn / PyTorch}} \text{Model}$$

## The Broader Ecosystem: Related Libraries

### SciPy (2001)

Built on NumPy, **SciPy** (by Travis Oliphant, Pearu Peterson, and Eric Jones) provides algorithms for optimization, integration, interpolation, signal processing, linear algebra, and statistics.

### Matplotlib (2003)

Created by **John D. Hunter**, Matplotlib provides MATLAB-style plotting for Python, enabling visualization of array and DataFrame data.

### Scikit-learn (2007)

Created by **David Cournapeau** and later developed by INRIA researchers, Scikit-learn provides machine learning algorithms (classification, regression, clustering) that operate on NumPy arrays and Pandas DataFrames.

### TensorFlow (2015) and PyTorch (2016)

These deep learning frameworks extend the concept of arrays into **tensors**, multi-dimensional arrays that support automatic differentiation and GPU acceleration. A tensor is simply a generalization of arrays to arbitrary dimensions:

$$\text{Scalar} \subset \text{Vector} \subset \text{Matrix} \subset \text{Tensor}$$

- Scalar: rank-0 tensor (single number)
- Vector: rank-1 tensor (1D array)
- Matrix: rank-2 tensor (2D array)
- Tensor: rank-$n$ (general $n$-dimensional array)

## The Trajectory of Abstraction

| Era | Tool | Abstraction Level |
|-----|------|-------------------|
| 1940s–50s | Raw binary / machine code | Programmer manages every bit |
| 1957 | FORTRAN arrays | Named, typed, indexed collections |
| 1972 | C arrays | Contiguous memory with pointer arithmetic |
| 1995–2005 | NumPy `ndarray` | Vectorized, n-dimensional, C-speed in Python |
| 2008 | Pandas `DataFrame` | Labeled, heterogeneous, SQL-like operations |
| 2015–16 | TensorFlow / PyTorch tensors | Auto-differentiable, GPU-accelerated arrays |

## Summary

The invention of arrays was not a single event but an evolutionary process, from mathematical matrices, through FORTRAN's first formal array declarations, to the rich ecosystem of NumPy, Pandas, and tensor libraries we use today. Each step removed a layer of manual effort, allowing practitioners to focus on *what* to compute rather than *how* to compute it, ultimately enabling the data science and AI revolution of the 2020s.
</div>

<div class="md">

## Prelude: The Paper Ledger Era

Long before computers existed, humanity organized data in **tabular form**. Double-entry bookkeeping, formalized by **Luca Pacioli** in his 1494 work \citetitle{summaarithmetica}, established the grid of rows and columns as the universal language of business data. For nearly 500 years, every accountant, scientist, and clerk worked with ruled paper, pencils, and erasers, manually computing totals, cross-referencing entries, and propagating changes by hand.

The fundamental problem was simple but devastating:

**If one number changes, every dependent calculation must be redone manually.**

A single error in a ledger could cascade through hundreds of cells, requiring hours of recalculation. This was the pain point that electronic spreadsheets would eventually solve.

## The Mainframe Era: Batch Processing and Punched Cards (1950s–1960s)

### Data Processing Before Interactivity

The earliest computers (ENIAC, UNIVAC, IBM 701) were not interactive. Users submitted jobs on **punched cards** or magnetic tape, waited hours or days, and received printed output. “Working with data” meant:

1. Encoding data onto cards (one row per card)
2. Writing a FORTRAN or COBOL program to process it
3. Submitting the job to an operator
4. Waiting for batch processing
5. Reading the printed results
6. Finding errors, correcting cards, resubmitting

This workflow was accessible only to trained programmers and operators. The concept of a non-technical person directly manipulating data on a screen did not yet exist.

### IBM and the Rise of Business Computing

**IBM's System/360** (1964) standardized business computing and introduced the concept of a general-purpose machine that could handle both scientific and commercial workloads. Programs like **RPG** (Report Program Generator, 1959) allowed businesses to produce tabular reports from data files, but the process remained entirely batch-oriented and code-driven.

## The Time-Sharing Revolution (1960s–1970s)

### Interactive Computing Arrives

The invention of **time-sharing systems**, where multiple users could interact with a single computer simultaneously via terminals, was the first step toward making computers usable for data work by non-programmers.

Key milestones:

- **CTSS** (Compatible Time-Sharing System, MIT, 1961), first demonstration of interactive multi-user computing
- **Multics** (1964–1969), ambitious time-sharing OS that influenced Unix
- **UNIX** (1969, Ken Thompson & Dennis Ritchie at Bell Labs), made interactive computing practical and portable

### LANPAR: The Invisible Ancestor (1969)

In 1969, **Rene Pardo** and **Remy Landau** invented **LANPAR** (LANguage for Programming Arrays at Random), a system used internally at Bell Labs and AT&T for budgeting. LANPAR introduced a revolutionary concept:

- Cells in a grid could contain **formulas referencing other cells**
- When one cell changed, all dependent cells **automatically recalculated**
- Users could enter data in **any order** (hence “at random”), the system resolved dependencies automatically

LANPAR was granted U.S. Patent 4,398,249 in 1983 (filed 1970). It is arguably the first true electronic spreadsheet, but it ran on mainframes, had no visual grid interface, and remained unknown outside AT&T. Its inventors spent decades in patent litigation, largely forgotten by history.

### Autoplan/Autotab (1968)

Around the same time, **General Electric** developed **Autotab**, a mainframe-based system that allowed users to define tables with formulas. It was used for financial planning but, like LANPAR, lacked the interactive visual interface that would later define the spreadsheet.

## VisiCalc: The Spreadsheet That Sold the Personal Computer (1979)

### The Origin Story

In the spring of 1978, **Dan Bricklin**, a Harvard Business School student and former programmer at DEC, sat in an accounting class watching his professor erase and recalculate an entire blackboard of numbers after changing a single assumption. Bricklin envisioned an “electronic blackboard”, a visual grid where changing one number would instantly ripple through all dependent calculations.

He partnered with **Bob Frankston**, a skilled MIT programmer, and together they created **VisiCalc** (Visible Calculator), released in October 1979 for the **Apple II**.

<figure>
    <img style="width: 80%; height: auto; display: block; margin: 1em auto;" src="visicalc.jpg" alt="VisiCalc running on an Apple II computer, showing the grid of cells" />
    <figcaption class="md">\citealternativetitle{visicalc}: the original killer application. Released in 1979 for the Apple II, it was the first electronic spreadsheet and convinced a generation of business managers to buy a personal computer.</figcaption>
</figure>

### Why VisiCalc Was Revolutionary

| Feature | Significance |
|---------|-------------|
| Visual grid of rows and columns | Users could *see* their data as a table, not as code |
| Cell references in formulas | `A1 + B1`, intuitive spatial addressing |
| Automatic recalculation | Change one cell → all dependents update instantly |
| Immediate feedback | Type a number, see the result, no batch submission |
| No programming required | Accountants and managers could use it directly |

### The “Killer App”

VisiCalc became the first **“killer application”**, software so compelling that people bought hardware specifically to run it. The Apple II's sales exploded. For the first time, businesses purchased personal computers not as curiosities but as essential tools. As Bricklin later reflected:

“VisiCalc took 20 hours of recalculation work and turned it into 15 minutes and a few keystrokes.”

The spreadsheet metaphor, a grid of cells, each containing either a value or a formula, proved so intuitive that it has survived essentially unchanged for over 45 years.

### The Mathematical Model

A spreadsheet can be formalized as a **directed acyclic graph (DAG)** of cell dependencies. Each cell $C_{i,j}$ contains either a constant $v$ or a function $f$ of other cells:

$$C_{i,j} = f(C_{a,b}, C_{c,d}, \ldots)$$

When any cell's value changes, the system performs a **topological sort** of the dependency graph and recalculates all downstream cells in order:

$$\text{If } C_{1,1} \text{ changes} \implies \text{recalculate all } C_{i,j} \text{ where } C_{1,1} \in \text{deps}(C_{i,j})$$

This automatic propagation of changes through a dependency graph is the core innovation that separates a spreadsheet from a static table.

## Lotus 1-2-3: The IBM PC Era (1983)

### The Shift to IBM

When IBM released the **IBM PC** in 1981, VisiCalc was slow to port. **Mitch Kapor**, a former VisiCalc product manager, seized the opportunity and founded **Lotus Development Corporation**. In January 1983, he released **Lotus 1-2-3**.

### Why “1-2-3”?

The name reflected three integrated capabilities:

1. **Spreadsheet**, the core grid calculation engine
2. **Charting**, built-in graphing of data (bar charts, line graphs, pie charts)
3. **Database**, basic sorting, filtering, and querying of tabular data

### Technical Advantages

Lotus 1-2-3 was written in **x86 assembly language**, making it dramatically faster than VisiCalc on IBM PC hardware. It also introduced:

- **Named ranges**, referring to cell groups by name rather than coordinates
- **Macros**, sequences of keystrokes that could be recorded and replayed, enabling automation
- **Larger grid sizes**, 2,048 rows × 256 columns (vs. VisiCalc's 254 × 63)

### Market Dominance

Lotus 1-2-3 became the best-selling software in the world and the primary reason businesses bought IBM PCs. It dominated the market from 1983 to approximately 1995, establishing the spreadsheet as the universal tool of business analysis.

## Microsoft Excel: The Graphical Revolution (1985–Present)

### Origins

**Microsoft Excel** was first released in 1985, for the **Apple Macintosh**, not for DOS. Microsoft recognized that the Mac's graphical user interface (GUI) offered a fundamentally better experience for spreadsheet work: direct manipulation with a mouse, WYSIWYG formatting, and visual selection of cell ranges.

The Windows version followed in 1987 (Excel 2.0), and by the early 1990s, as Windows overtook DOS, Excel began its ascent over Lotus 1-2-3.

### Key Innovations Over Time

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

### Excel as a Programming Language

Excel and it's competitor's (like LibreOffice's Calc) formula system is, in computer science terms, a **purely functional, lazy-evaluated, reactive programming language** operating over a two-dimensional namespace. Modern Excel (with LAMBDA, LET, MAP, REDUCE, and dynamic arrays) is **Turing-complete**, capable, in theory, of computing anything any programming language can compute.

The cell formula:

```
=LAMBDA(x, x^2 + 2*x + 1)(5)
```

is functionally equivalent to:

$$f(x) = x^2 + 2x + 1, \quad f(5) = 36$$

## Beyond Spreadsheets: The Evolution of Data Usability

### The Database Revolution: From Filing Cabinets to SQL

While spreadsheets handle ad-hoc analysis, **databases** manage structured storage at scale.

- **IMS** (IBM, 1966), hierarchical database for the Apollo program
- **CODASYL** (1969), network model databases
- **Edgar F. Codd's Relational Model** (1970), the paper *“A Relational Model of Data for Large Shared Data Banks”* proposed organizing data into **tables** (relations) with rows (tuples) and columns (attributes), queried through a declarative language
- **SQL** (Structured Query Language, 1974), developed by Donald Chamberlin and Raymond Boyce at IBM, based on Codd's relational algebra:

$$\sigma_{\text{age} > 30}(\text{Employees}) \equiv \texttt{SELECT * FROM Employees WHERE age > 30}$$

- **Oracle** (1979), **IBM DB2** (1983), **Microsoft SQL Server** (1989), commercial implementations
- **MySQL** (1995), **PostgreSQL** (1996), open-source alternatives that democratized database access
- **SQLite** (2000), embedded database requiring no server, now deployed on billions of devices

### Statistical Software: Purpose-Built Data Tools

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

### Python


The Python stack (Pandas + Matplotlib + Scikit-learn + Jupyter Notebooks) represents the modern equivalent of what VisiCalc did in 1979: making data work accessible to people who think in terms of *problems*, not *implementations*.

### Jupyter Notebooks (2014)

**Project Jupyter** (evolved from IPython, created by Fernando Pérez in 2001) introduced the **computational notebook**, a document combining:

- Executable code cells
- Rich text (Markdown, LaTeX)
- Inline visualizations
- Interactive widgets

This format mirrors the spreadsheet's core insight (immediate feedback, visible results) while extending it to arbitrary programming. A Jupyter notebook is, conceptually, a spreadsheet where each “cell” can contain any computation, not just a formula over a grid.

## Business Intelligence and the “No-Code” Movement

### The BI Stack (2000s–2020s)

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

### The AI-Powered Future (2023–Present)

The latest evolution integrates **large language models** directly into data tools:

- **Excel Copilot**: “Create a pivot table showing quarterly revenue by region”
- **ChatGPT Code Interpreter**: upload a CSV, ask questions in natural language
- **Pandas AI**: natural language queries over DataFrames
- **Databricks Assistant**: AI-generated SQL and Python for data engineering

This represents the logical endpoint of the abstraction trajectory: the user describes *what* they want in human language, and the system generates the *how* (formulas, code, queries) automatically.

## The Trajectory of Data Usability

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

## Summary

The history of “Excel-like things” is fundamentally a history of **making data manipulation accessible to non-programmers**. From Pacioli's ruled ledgers through LANPAR's automatic recalculation, VisiCalc's visual grid, Lotus's integrated charting, Excel's GUI and VBA, Google Sheets' collaboration, to today's AI-powered natural language interfaces, each step removed a layer of technical friction between humans and their data.

The spreadsheet's enduring genius lies not in computational power (Python and SQL are vastly more capable) but in its **cognitive fit**: the two-dimensional grid mirrors how humans naturally think about structured information. Rows are records. Columns are attributes. Cells are facts. Formulas are relationships. This mental model, unchanged since 1979, has proven more durable than any specific technology, and every successor, from Pandas DataFrames to BI dashboards, ultimately pays homage to it.

All these developments, even though they were focussed for the normal user, are now used by data scientists creating systems like LLM as well, as well as the algorithms developed for those tools.
</div>

<div class="md">
While Leibniz's Stepped Reckoner proved that mechanical calculation was possible, it remained a fragile prototype, prone to jamming and never reliable enough for daily use. The gap between theoretical proof-of-concept and practical tool was bridged over a century later by **Charles Xavier Thomas de Colmar**, a French inventor and entrepreneur.

In \citeyear{thomasdcolmar1820}, Thomas de Colmar patented the **Arithmometer**, a calculating machine based on Leibniz's stepped drum mechanism. What distinguished it from all prior devices was not mathematical novelty but *engineering reliability and commercial viability*. After decades of refinement, the Arithmometer entered mass production in the 1850s, becoming the **first commercially successful mechanical calculator** and the first to be produced in industrial quantities.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="arithmometer_thomas.jpg" alt="A brass Arithmometer by Thomas de Colmar, c. 1850, displayed at the Musée des Arts et Métiers in Paris, with its sliding carriage and result register visible" />
    <figcaption class="md">\citealternativetitle{arithmometer_thomas}: the Arithmometer of Thomas de Colmar, c. 1850, at the Musée des Arts et Métiers in Paris. Based on Leibniz's stepped drum, this brass device was the first calculator reliable enough to be mass-produced and sold to banks, insurers and governments.</figcaption>
</figure>

The machine could perform addition, subtraction, multiplication, and division, and was sold to banks, insurance companies, and government offices across Europe. It remained in production for over 90 years, with various manufacturers producing improved models well into the 20th century.

The Arithmometer's significance lies not in a conceptual breakthrough but in a practical one: it proved that Leibniz's dream of mechanized calculation could be made robust, reproducible, and useful to non-specialists. It represents the moment when the “calculator” ceased to be a philosopher's curiosity and became a **commercial product**, an essential step in the trajectory from abstract logic to the industrial-scale computation that would eventually power AI systems.
</div>

<div class="md">
The large language model is, at its deepest physical layer, a phenomenon of applied physics. Every inference is an electrical signal propagating through doped silicon crystals whose behavior is governed by quantum mechanics; every training run consumes gigawatt-hours of energy whose generation traces back to Faraday's electromagnetic induction; every bit of data travels through fiber optic cables exploiting total internal reflection. Without the discoveries of physics, there is no substrate on which an LLM can exist.

### Quantum Mechanics and the Transistor

The entire digital age rests upon the transistor, a device whose invention required understanding quantum mechanics, a branch of physics that did not exist until the 20th century. Max Planck introduced the quantum of energy in 1900 \cite{planck}. Niels Bohr proposed the quantized atom in 1913 \cite{bohr}. Werner Heisenberg formulated matrix mechanics in 1925 \cite{quanten}, and Erwin Schrödinger developed wave mechanics in 1926 \cite{schroedinger}.

Felix Bloch applied quantum mechanics to electrons in crystal lattices \cite{bloch}, and Alan Herries Wilson used this framework to explain semiconductors \cite{wilsonsemiconductors}. Without band theory, there is no understanding of why silicon can be made to switch between conducting and insulating states, and without that understanding, there is no transistor \cite{semiconductor}, no integrated circuit \cite{kilbyic} \cite{noyceic}, no microprocessor \cite{intel4004}, no GPU, and no LLM.

### Electromagnetism and Power Generation

Michael Faraday's 1831 discovery of electromagnetic induction \cite{faraday} is the basis of virtually all electrical power generation on Earth. A modern LLM training run on thousands of GPUs may consume enough electricity to power a small city for weeks. That energy flows through infrastructure whose lineage traces directly to Faraday's copper disk spinning between the poles of a horseshoe magnet. Nikola Tesla's alternating current system \cite{teslaelectricmotor} \cite{teslacurrent} enabled long-distance power transmission, making centralized data centers economically viable.

### Thermodynamics and Cooling

Ludwig Boltzmann's statistical mechanics \cite{boltzmann_thermo} provided the theoretical framework for understanding heat dissipation. Modern GPU clusters generate enormous thermal loads; without industrial cooling systems descended from William Cullen's 1756 artificial refrigeration experiments \cite{cullencold} and Carl von Linde's ammonia-compression refrigerator \cite{patent1250}, silicon would overheat within minutes. The quiet hum of a data center's cooling system is as essential to the existence of an LLM as the Transformer architecture itself.

### Optics and Data Transmission

The fiber optic cables that carry over 95% of intercontinental internet traffic, and thus the training data for every LLM, exploit total internal reflection, first demonstrated by Daniel Colladon in 1842 \cite{colladon} and theoretically enabled for long-distance communication by Charles Kao and George Hockham in 1966 \cite{fibreoptics}. Without fiber optics, there is no global internet, no web-scale corpus, and no training data.

### Statistical Mechanics and Machine Learning

Beyond hardware, physics contributed directly to the mathematical foundations of machine learning. The Boltzmann distribution from statistical mechanics inspired Boltzmann Machines \cite{boltzmannlearning}, one of the earliest generative models. The Ising model of ferromagnetism \cite{lenz1920} \cite{ising1925}, describing interacting spins on a lattice, is now recognized as the first recurrent neural network architecture. The concept of energy minimization in physical systems directly influenced energy-based learning frameworks \cite{lecun2006}. The free energy principle from thermodynamics \cite{friston2010freeenergy} has been proposed as a unifying framework for understanding both biological and artificial intelligence.

Physics did not set out to create artificial intelligence. It set out to understand the universe. But in doing so, it created every physical prerequisite, from the quantum tunneling effects in transistors to the electromagnetic waves in fiber optic cables, without which no language model could ever exist.
</div>

<div class="md">
If physics provided the theoretical understanding of matter, chemistry provided the practical ability to *transform* it. Every component of an LLM's physical substrate, from the ultra-pure silicon wafers to the rare-earth magnets in hard drives, from the lithium-ion batteries in mobile devices to the specialized cooling fluids in data centers, is a product of chemical engineering. Chemistry gave AI its body.

### Silicon Purification: From Sand to Semiconductor

The journey from common beach sand (silicon dioxide, SiO₂) to a functioning microprocessor requires chemical transformations of extraordinary precision. The Siemens process, developed in the 1950s, reduces silicon dioxide with carbon at high temperatures, then purifies it through reaction with hydrogen chloride to form trichlorosilane (SiHCl₃), which is subsequently decomposed to yield polycrystalline silicon of 99.9999999% purity (nine nines). This “electronic grade” silicon is then grown into single crystals via the Czochralski process \cite{semiconductor}. Without these chemical purification methods, transistors cannot function, impurity concentrations of even a few parts per billion alter semiconductor behavior catastrophically. The entire digital age rests upon chemistry's ability to produce materials of unprecedented purity.

### Doping: The Chemistry of Controlled Impurity

A pure silicon crystal is a poor conductor. What makes it useful is the deliberate introduction of specific impurities, a process called **doping**. Adding phosphorus atoms (Group V) creates n-type silicon with excess electrons; adding boron atoms (Group III) creates p-type silicon with electron “holes.” The p-n junction formed at their interface is the basis of every diode and transistor \cite{shockley}. This is fundamentally a chemical process: selecting specific elements from the periodic table and introducing them into a crystal lattice at precisely controlled concentrations (typically one dopant atom per million silicon atoms). Without the chemist's understanding of how atomic species interact within crystal structures, there is no transistor and no computation.

### Photolithography: Chemistry as Nanoscale Sculpture

Modern chips contain billions of transistors, each smaller than a virus. They are manufactured through **photolithography**, a process that is essentially chemistry performed with light. A silicon wafer is coated with a light-sensitive chemical called a **photoresist**. Ultraviolet light is projected through a mask, causing chemical reactions that either harden or dissolve the exposed resist (depending on whether it is “positive” or “negative” resist). The unexposed (or exposed) resist is washed away with chemical solvents, revealing the silicon beneath for etching or ion implantation. This cycle is repeated dozens of times to build up the three-dimensional structure of a modern processor. Each step is a chemical reaction, polymerization, dissolution, oxidation, deposition, performed at nanometer precision.

### Electrochemistry and Energy Storage

The lithium-ion battery, which powers every laptop, smartphone, and increasingly the backup systems of data centers, is a product of electrochemistry. John B. Goodenough's identification of lithium cobalt oxide (LiCoO₂) as a cathode material (1980) and Akira Yoshino's development of the first commercially viable lithium-ion cell (1985) enabled portable computing. Without electrochemistry, there are no mobile devices generating the user data that feeds LLM training corpora, and no uninterruptible power supplies protecting data centers from outages.

### Rare Earth Chemistry and Permanent Magnets

The hard disk drives that store training datasets rely on **neodymium-iron-boron (Nd₂Fe₁₄B) permanent magnets** and **cobalt-platinum alloy** recording media, materials whose magnetic properties were characterized through decades of solid-state chemistry research. The voice coil actuators that position read/write heads with nanometer precision depend on rare-earth magnets whose synthesis requires specialized chemical extraction from ore (typically through solvent extraction and ion exchange chromatography).

### Cooling Fluids and Thermal Management

As GPU clusters push thermal limits, data centers increasingly turn to **liquid immersion cooling** using engineered dielectric fluids, synthetic fluorocarbon compounds (such as 3M's Fluorinert and Novec series) designed through organic chemistry to be thermally conductive, electrically insulating, chemically inert, and non-flammable. The development of these specialized coolants is pure applied chemistry, formulated specifically to remove heat from electronics without damaging them.

### The Periodic Table as Foundation

Ultimately, every element used in computing, silicon (Si, 14) for substrates, copper (Cu, 29) for interconnects, gold (Au, 79) for wire bonds, tantalum (Ta, 73) for capacitors, gallium (Ga, 31) and arsenic (As, 33) for III-V semiconductors in networking lasers, erbium (Er, 68) for fiber optic amplifiers, neodymium (Nd, 60) for magnets, was first isolated, characterized, and understood through chemistry. Dmitri Mendeleev's 1869 periodic table organized the elements by atomic weight and predicted the existence of undiscovered elements; without this organizational framework, the systematic engineering of materials for computation would have been impossible.

<figure>
    <img style="width: 80%; height: auto; display: block; margin: 1em auto;" src="mendeleev_periodic_table.jpg" alt="Mendeleev's periodic table of the elements from 1869, the first published version, showing elements arranged by atomic weight" />
    <figcaption class="md">The \citealternativetitle{mendeleev_periodic_table}: Mendeleev's original 1869 arrangement of the elements by atomic weight, complete with bold predictions for then-undiscovered elements such as gallium, scandium and germanium. Every silicon, copper and neodymium atom in a modern GPU owes its place on this chart.</figcaption>
</figure>

Chemistry did not intend to create artificial intelligence. It intended to understand and transform matter. But in doing so, from purifying silicon to synthesizing photoresists to engineering cooling fluids, it provided every material prerequisite without which no language model could ever be physically instantiated.
</div>

<div class="md">

## To the Moon and Beyond: How Spaceflight Built the Invisible Scaffolding for Modern AI

### The Apollo Guidance Computer

The \citealternativetitle{agc_module_image} (\citeyear{agc_module_image}) at the MIT Instrumentation Laboratory was the first computer built from silicon integrated circuits. Designed under Charles Stark Draper and Eldon C. Hall, the Block II version flown to the Moon contained roughly 2,800 dual 3-input NOR gates and 36,864 words of read-only **core rope memory**, woven by hand at a Raytheon factory \cite{mindell2008digitalapollo}.

What matters for AI history is not the hardware but the **software**. J. Halcombe Laning designed a preemptive priority scheduler, the “Exec” and the “Waitlist”, that has no direct equivalent in the early ARPA machines of the same era \cite{hoag1976apollohistory}. When the rendezvous radar on \citealternativetitle{eyles2004lmcomputer} (\citeyear{eyles2004lmcomputer}) began flooding Apollo 11's computer with cycle steals five minutes before touchdown, the scheduler automatically shed low-priority tasks. Without it, the landing would have been aborted. Margaret Hamilton, who directed the software team, later received the Presidential Medal of Freedom for work that effectively founded **software engineering** as a discipline.

<div class="image-row">
    <figure>
        <img src="apollo_agc_modules.jpg" alt="Solid-state modules and backplane of the Apollo Guidance Computer" />
        <figcaption class="md">The \citealternativetitle{agc_module_image} (CC-BY-SA 3.0). The first computer to use silicon ICs, and the first to demonstrate that software-driven priority scheduling could safely run a vehicle carrying human lives.</figcaption>
    </figure>
    <figure>
        <img src="margaret_hamilton.jpg" alt="Margaret Hamilton in 1969 standing next to stacks of the Apollo Guidance Computer source-code listings" />
        <figcaption class="md">The \citealternativetitle{hamilton1969_image} (Public Domain, PD US no notice). Margaret Hamilton beside the printouts of the AGC software her MIT team produced for the Apollo Command and Lunar Modules, the “stacks” she is standing next to are taller than she is.</figcaption>
    </figure>
</div>

### From Fly-by-Wire to Fly-Yourself

NASA's F-8 Digital Fly-by-Wire program (1972) used an AGC derivative to demonstrate that computers could replace mechanical linkages in aircraft control surfaces \cite{tomayko2000flybywire}. The Space Shuttle (1981–2011) carried four redundant IBM AP-101 computers running identical software with majority voting, the first operational fly-by-wire on a crewed spacecraft. Every modern airliner and military fighter inherits this lineage.

### Robotic Autonomy on Mars

Since Spirit and Opportunity landed in 2004, NASA/JPL rovers have carried **Visual Odometry** algorithms that estimate rover motion by tracking features between stereo image pairs \cite{maimone2007vo}. From Curiosity onward, the AEGIS system autonomously selects science targets on board, without waiting for Earth round-trip \cite{estlin2009aegis}. Perseverance (\citeyear{nasa2021perseverance}) extends this to onboard path planning. The combination of SLAM, visual odometry, and on-board science selection developed for Mars is a direct ancestor of every autonomous-driving stack.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="perseverance_selfie.gif" alt="NASA Perseverance rover self-portrait at the Rochette abrasion patch on Mars" />
    <figcaption class="md">The \citealternativetitle{perseverance_selfie_image} (NASA / JPL-Caltech, Public Domain). The same rover that decides for itself which rocks to drill also decides for itself how to avoid getting stuck.</figcaption>
</figure>

### Coding Theory for Noisy Channels

Deep-space communication links are extraordinarily bandwidth-limited and noise-prone. **Reed–Solomon** codes \cite{reed1960polynomial} (now in every CD, DVD, QR code and SSD), the **Viterbi** decoder \cite{viterbi1967error} (now in every 3G/4G/5G baseband), and **turbo codes** \cite{berrou1993turbo} (now in 3G and deep-space probes) were developed or matured for space telemetry. Without them, downloading a 70-billion-parameter LLM over a noisy channel would take orders of magnitude longer.

### Navigation: Kalman and GPS

Rudolf Kálmán's recursive filter \cite{kalman1960filter} was developed at the Research Institute for Advanced Study in Baltimore with explicit guidance applications in mind. Every modern SLAM system, every inertial measurement unit on a smartphone, and every GPS receiver is a descendant. The Global Positioning System itself began as a Navy/Air Force program for submarine and missile navigation \cite{parkinson1996gps}, and is now the silent prerequisite for every mapped application on Earth.

None of these systems was built for AI. Together they form much of the navigational and operational backbone on which every mobile robot, including the autonomous vehicles studied by every modern ML lab, now depends.

</div>

<div class="md">

## From the Battlefield to the Blackboard: How Weapons Research Built Modern AI

### The First Electronic Computers: Colossus and ENIAC

The **Colossus** Mark 2 (\citeyear{flowers1983design}), built by Tommy Flowers at the Post Office Research Station for Bletchley Park, was the world's first programmable electronic digital computer. It used 2,400 vacuum tubes to break the German Lorenz cipher, helping to shorten the Second World War. Its existence was classified until the mid-1970s \cite{copeland2006colossus}.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="colossus.jpg" alt="The Colossus Mark 2 computer being operated by Dorothy Du Boisson and Elsie Booker at Bletchley Park, 1943" />
    <figcaption class="md">The \citealternativetitle{colossus_image} (UK National Archives, Public Domain). Operated by Wrens of the Women's Royal Naval Service. Eleven machines were eventually built; all but two were destroyed after the war on the orders of the then-Director of GCHQ.</figcaption>
</figure>

**ENIAC** (\citeyear{eniac1946}), built at the University of Pennsylvania, was originally designed to compute artillery firing tables. Its first real “user” was John von Neumann, who reprogrammed it in 1945 for thermonuclear calculations at Los Alamos. Six women, Kay McNulty, Betty Jennings, Betty Snyder, Marlyn Meltzer, Frances Bilas, and Ruth Lichterman, did the actual programming, an invisible prerequisite for the rest of computing history \cite{haigh2006eniac}.

<figure>
    <img style="width: 100%; height: auto; display: block;" src="eniac.jpg" alt="ENIAC, the Electronic Numerical Integrator and Computer, photographed in operation at the Moore School" />
    <figcaption class="md">The \citealternativetitle{eniac1946_image} (U.S. Army, Public Domain). 18,000 vacuum tubes, 30 tons, 1,000 square feet of floor space, and reprogrammable only by re-plugging cables and setting switches.</figcaption>
</figure>

### Wiener, Cybernetics, and the Anti-Aircraft Problem

Norbert Wiener's *Cybernetics* (1948) grew directly out of his wartime work on **anti-aircraft fire-control**: predicting an aircraft's future position from noisy radar returns in order to aim guns. The book synthesized Wiener's feedback theory with \citeauthor{mccullochpitts1943}'s 1943 logical-neuron paper, written five years earlier, to define the cybernetic paradigm that dominated AI in the 1950s \cite{wiener1948cybernetics}. I. J. Good, a wartime collaborator of Turing's, later developed the Bayesian methods for cryptanalysis that became a foundation of modern statistical AI \cite{good1959statistics}.

### ARPA/DARPA: The Government Patron of AI

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

### SAGE, GPS, and the Cold War Computing Backbone

**SAGE** (Semi-Automatic Ground Environment), operational from 1958, used 24 AN/FSQ-7 computers to provide continental US air defense \cite{edwards1996closedworld}. It pioneered light-pen interaction, real-time telemetry, and the contractual separation of hardware and software that created the modern computer industry. **GPS**, originally a Navy program for submarine-launched ballistic missiles, became the universal positioning layer for civilian and military use alike \cite{parkinson1996gps}.

### Statistical Methods Born of War

**Abraham Wald's** *Sequential Analysis* (1947) was developed for wartime quality inspection: when each measurement is expensive, when should you stop testing and accept the batch? It is now foundational to A/B testing, clinical-trial design, and reinforcement-learning stopping rules \cite{wald1947sequential}.

These threads, codebreaking, fire control, government patronage, and statistical inspection, ran in parallel and interwove. None of them set out to build a language model; all of them contributed load-bearing components.

</div>

<div class="md">

## From Los Alamos to AlphaGo: How Nuclear Weapons Research Built Modern AI

The contribution of nuclear weapons research to AI is less well-known than that of the wartime codebreakers, but quantitatively and qualitatively it is comparable. Three threads deserve attention.

### Monte Carlo Methods

In 1946, the Polish-American mathematician Stanisław Ulam, convalescing at Los Alamos from an illness and playing Canfield solitaire, realized that the combinatorics of certain solitaire layouts were easier to estimate by repeated trial than by analytical calculation. He proposed the same trick for the **neutron diffusion problem** then blocking the design of thermonuclear weapons: sample random neutron paths, estimate average behaviour \cite{eckhardt1987ulam}. Working with John von Neumann, the method was implemented on the ENIAC in spring 1948 to simulate a fission core. They named it after the Monte Carlo Casino \cite{ulam_vonneumann1949montecarlo}.

<figure>
    <img style="width: 80%; height: auto; display: block; margin: 1em auto;" src="monte_carlo_normal.gif" alt="Animated illustration of Monte Carlo averaging converging to a normal distribution as the number of samples increases" />
    <figcaption class="md">The \citealternativetitle{monte_carlo_animation_image} (CC-BY-SA 3.0): sums of uniform samples converge to a normal distribution. Monte Carlo methods exploit exactly this convergence to estimate integrals and probabilities in high-dimensional problems that no closed-form solution can reach.</figcaption>
</figure>

By 1953, Metropolis and co-workers at Los Alamos had turned the same idea into a general algorithm for sampling from any probability distribution: the **Metropolis algorithm** \cite{metropolis1953equation}. Generalized by Hastings in 1970 \cite{hastings1970mcmc}, **Markov Chain Monte Carlo** (MCMC) is now standard in Bayesian statistics, phylogenetics, computational linguistics, and probabilistic machine learning.

### Game Theory and the Architecture of Computation

While consulting at Los Alamos, John von Neumann co-authored *Theory of Games and Economic Behavior* (1944) with Oskar Morgenstern \cite{vonneumann_morgenstern1944}. The book's mathematical framework, minimax, Nash equilibrium, repeated games, became the foundation of **multi-agent reinforcement learning**, algorithmic game theory, and modern mechanism design.

<figure>
    <img style="width: 80%; height: auto; display: block; margin: 1em auto;" src="von_neumann_lanl.gif" alt="Photograph of John von Neumann at Los Alamos, in the late 1940s" />
    <figcaption class="md">The \citealternativetitle{vonneumann_lanl_image} (LANL, Public Domain). Von Neumann spent 1943–1955 commuting between Los Alamos, Princeton's IAS, and various weapons-related advisory committees. Almost every foundational structure of modern computing, the stored-program architecture, cellular automata, game theory, Monte Carlo methods, was touched by his work.</figcaption>
</figure>

Von Neumann also sketched the **stored-program architecture** (\citeyear{vonneumann}) during his weapons work, and later designed self-reproducing **cellular automata** with Ulam at Los Alamos, the conceptual ancestor of agent-based simulation.

### Metropolis–Hastings in Modern ML

The single most influential MCMC algorithm in machine learning is the **Metropolis–Hastings** sampler \cite{hastings1970mcmc}, whose flowchart is shown below. It is the engine of Bayesian neural networks, Gaussian processes, and most modern probabilistic programming languages.

<figure>
    <img style="width: 90%; height: auto; display: block; margin: 1em auto;" src="metropolis_hastings.png" alt="Flowchart of the Metropolis-Hastings Markov Chain Monte Carlo algorithm" />
    <figcaption class="md">The \citealternativetitle{metropolis_hastings_image} (CC-BY 4.0). The accept/reject step in the centre is the entire intellectual contribution of the original Metropolis paper, scaled up to billions of dimensions.</figcaption>
</figure>

### From Metropolis to AlphaGo

The same Monte Carlo idea, applied to game-tree search, gave rise to **Monte Carlo Tree Search** (MCTS), the central algorithmic innovation of **AlphaGo** \cite{silver2016alphago}. AlphaGo combines MCTS with deep neural networks: the network guides random rollouts toward promising branches, and the rollouts produce training data for the network. Without the 1946 neutron-diffusion calculation, the 2016 Go match would not have happened.

### Programming Languages and Numerical Computing

The numerical demands of weapons hydrodynamics drove the development of **FORTRAN** \cite{backusfortran} at IBM (1957) and the early culture of high-performance scientific computing at Los Alamos. The same culture produced the **MANIAC** computer, one of the first machines to play a credible game of chess, and the early Monte Carlo simulation community whose work is the literal ancestor of every probabilistic ML method today.

### From Weapons Code to Civilian Tool

The methods above moved quickly into civilian use. Monte Carlo radiative-transfer codes became the backbone of climate and weather modelling. Bayesian statistics, with I. J. Good as one of its main postwar advocates, became standard in medicine, social science, and industry. Game-theoretic mechanism design runs modern spectrum auctions. MCMC underpins essentially every modern probabilistic programming language.

The history of AI is not only the history of algorithms. It is also the history of numerical methods, statistical techniques, and computing infrastructure that were developed for wartime and weapons-research needs and were later redirected toward the civilian world.

</div>
