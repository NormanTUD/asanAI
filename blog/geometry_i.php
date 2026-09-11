<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: The Shape of Space — A History of Geometry
description: From a zig-zag etched in a shell to non-Euclidean manifolds: who found each piece of space, when, and why — with the equations as they first appeared.
icon: &#128208;
part: 1
order: 4
color: accent
topics: geometry, math-iii, history
-->

<div class="smart-quote" data-cite="weeksshapespace" data-page="ix">
Students at all levels will see that geometry is a living subject responding to the needs of twenty-first century science, not a dead discipline finalized in ancient times.
</div>

<div class="md">
## Why geometry

The three math chapters before this one gave you the *numbers* a neural network manipulates — sums, products, vectors, gradients. This chapter gives you the *stage* on which those numbers live: **space**, and the history of how we came to understand it.

Geometry is older than almost any other branch of mathematics. Arithmetic needs counting; geometry needs a *landscape* to measure, a field to bound, a temple to square. It is also, arguably, the most visual and the most "alive" of the disciplines — and the quote above, written for a modern textbook on the *shape of space* \citeauthor{weeksshapespace} (\citeyear{weeksshapespace}), makes the point: geometry is not a relic finished off in Alexandria. Every few centuries it has been forced to grow, because the world — or our models of it — stopped fitting inside flat, straight-line space.

This chapter follows that growth step by step. For each turn we ask four questions: **what** was discovered, **who** did it, **when**, and — the question that makes a history interesting — **why**, what need of the age forced the result to exist. We start where the physical evidence actually begins: not with a Greek theorist, but with a hand tool pressing a zig-zag into a river shell. We then cross the first cities, where geometry became a *job* (surveying land after the flood), pass through the Greek invention of *proof*, the medieval and early-modern reformulation of space in terms of projection and coordinates, and finally the 19th-century earthquake that turned out space itself might be *curved* — the idea that later made general relativity possible, and that quietly underlies the high-dimensional "spaces of meaning" you will meet in the [Embeddings](embeddinglab) chapter.
</div>

<div class="md">
## I. Before writing: space etched in shell and bone

**What motivated the earliest geometry?** Not profit and not fear of the gods — a quieter need: to make space *orderly*, to hold a shape in the mind and repeat it, and to recognise *the same shape* in the world again. The oldest geometric objects we have are not calculations at all. The very oldest is not even a mark but a *shape* — a handaxe, a three-dimensional object worked to a mental template of symmetry and proportion a million and a half years before anyone etched a line. After it come the *patterns*: marks made by a hand that was doing something else (shaping a tool, decorating, keeping score), in which a deliberate regularity shows up. That regularity is the first thing geometry notices — the sense that *the same shape* can be repeated, and that repeating it is meaningful. No one sat down to invent geometry; geometry is what a shape-making, pattern-making mind leaves behind when it is not, strictly, being *about* geometry at all.

### The Acheulean handaxe (c. 1.76 million years ago)

Before there were etched shells or tally bones, there was the **handaxe**. The Acheulean industry — the bifacial, almond- or pear-shaped handaxe — begins about **1.76 million years ago** at West Turkana in Kenya, where handaxes from the Kariandusi locality were dated by magnetostratigraphy to that age, pushing the start of the Acheulean back by roughly two hundred thousand years \cite{achleuleankariandusi}. That is about three and a half times older than the Trinil shell below, and the maker, almost certainly *Homo erectus* (or *H. ergaster*), was not scratching a pattern but *shaping a volume*.

<figure>
	<img style="width: 100%" src="acheulean_handaxe.jpg" alt="Acheulean handaxes from the Kariandusi site, West Turkana, Kenya" />
	<figcaption class="md">Acheulean handaxes from the Kariandusi site, West Turkana, Kenya — the region that holds the oldest known examples (\citealternativetitle{achleuleanhandaxe_image}). Each one is a three-dimensional form worked to a template that existed in the maker's mind before the first blow.</figcaption>
</figure>

The geometry here is not trivial. A handaxe has **bilateral (mirror) symmetry**: two working faces flaked toward a shared central ridge, a pointed end and a rounded base, held in controlled proportion. To make one, the knapper must carry a *mental template* — the finished, ideal shape — and work both faces by reference to it over dozens of flake removals \cite{handaxementaltemplate}. The symmetry is not an accident and not merely cosmetic: it is actively maintained as the tool is made, and it is the most consistent feature of the whole industry across Africa, Asia and Europe \cite{handaxesymmetry}. In other words, well before any line was drawn, a hominin was already reasoning about **axial symmetry, proportion and the geometry of a surface in three dimensions** — a spatial understanding no two-dimensional mark can capture. The *why* is a cutting edge that works from either hand; the *capability* — a stable internal model of a 3-D form — is the oldest piece of geometry we have.

### The Trinil shell (c. 500,000 years ago)

<figure>
	<img style="width: 100%" src="trinil_shell.jpg" alt="Homo erectus-engraved shell (Trinil, Java)" />
	<figcaption class="md">\citealternativetitle{trinilshell_image}: a freshwater river-clam shell engraved by <em>Homo erectus</em> at Trinil, Java, c. 500,000 years ago, showing a precise zig-zag of grooves (detail at right).</figcaption>
</figure>

The **Trinil shell** is the oldest known deliberate geometric incision. Working at the Sangiran–Trinil site in Java, an international excavation team — the study reported by Joordens and colleagues in \citeyear{trinilshell} \cite{trinilshell} — documented a series of paired grooves cut into the shell of a river clam, arranged in a regular zig-zag. Crucially, the marks are not a by-product of using the shell as a scraper or a drinking vessel; the groove spacing and the way it runs off the shell indicate a *pattern* was being produced on purpose. Why anyone engraves a shell half a million years ago is, honestly, unclear — decoration, ritual, practice, or a test of the hand are all live hypotheses. But it is a strikingly simple fact — *Homo erectus*, not *Homo sapiens*, was capable of a repeated, symmetric, non-utilitarian shape more than half a million years ago — and it is the true starting line of this story.

### Blombos Cave (c. 75,000 years ago)

<figure>
	<img style="width: 100%" src="blombosochre.jpg" alt="Engraved ochre from Blombos Cave" />
	<figcaption class="md">Engraved ochre from \citealternativetitle{blombosochre}, South Africa. The cross-hatching and rhomboid grids are among the earliest evidence of abstract, non-utilitarian spatial patterning.</figcaption>
</figure>

A second, independent thread runs through the Middle Stone Age of southern Africa. The engraved pieces from **Blombos Cave**, dating to roughly 75,000 years ago, carry cross-hatched grids and rhomboid fields of incisions on red ochre \cite{emergenceofmodernhumanbehaviour} \cite{blombosochre}. Read purely as geometry, they are a study in the *partition of a plane*: a surface divided into a regular network of cells by crossing lines. That is, in miniature, exactly the operation that later surveyors and mapmakers would perform on a much larger scale. The motivation here is again not mathematical but *symbolic* — a decorated surface is a claim about order, and order is the raw material geometry will later formalise.

\marginfig{ishango.jpg}{The **Ishango bone** (\citealternativetitle{ishangobonephoto}) is a baboon fibula of the Late Paleolithic (c. 18,000 BCE) with three columns of grouped notches \cite{ishangobone} — read as a lunar calendar, a base-10/60 number system, or simply a score-keeping tally.}

### Tally bones: Lebombo and Ishango

If the shell and the ochre mark the birth of *form*, the **Ishango bone** and the earlier **Lebombo bone** mark the birth of *counting* as a spatial act: quantities are not held in the mind, they are laid out as marks in a row, and rows as *groupings* in the plane \cite{ishangobone} \cite{lebombobone}. Geometry and arithmetic are born in the same gesture — a number is a *shape* of marks, and a shape is a *count* of something.

<figure>
	<img style="width: 100%" src="lebombo.jpg" alt="The Lebombo bone, a tally bone from c. 43,000 BCE" />
	<figcaption class="md">The <strong>Lebombo bone</strong> (c. 43,000 BCE, Lesotho), a hyoid bone with 29 notches arranged in groups — a <em>spatial</em> record of quantity, and a strong candidate for the oldest known counting device \cite{lebombobone}.</figcaption>
</figure>

(We return to both artifacts in the [History of AI](history) chapter, where they matter as the first *external memory*; here we only need that the notches are themselves a two-dimensional arrangement — the earliest "database" was a pattern on a bone.)
</div>

<div class="md">
## II. Measuring the land: the surveyor's equations

**What motivated geometry's first rise?** A single, shared, unglamorous fact of land: **when the river rose, the boundaries vanished.** For most of its early history geometry was not a body of theorems but a *technique of state*: the discipline of measuring fields, dividing inheritances, and erecting temples that had to be square. It appears almost simultaneously in the first great urban cultures — Egypt, Mesopotamia, the Indus Valley, China — each with its own tools and its own number system.

In Egypt the Nile's annual inundation wiped out every field boundary, and each year the fields had to be *re-measured* — and, crucially, the crown's grain tax was assessed by the *area* of a holding, so a wrong area meant a wrong tax. In Mesopotamia, where there was no single river but a dense mesh of canals and private plots, the need to settle *disputable* boundaries between neighbours was constant. In China the state had to tax land, move armies, and move earth (dikes, canals, granaries), and every one of those is a *geometry* problem. So in all three places the same small kit of formulas was invented, independently, for the same reason: to put an exact number on a piece of land.

The surveyor's core kit, in modern notation:

* **Rectangle / square:** $A = a\,b$ (for a square, $A = a^{2}$)
* **Triangle:** $A = \tfrac{1}{2}\,b\,h$
* **Trapezoid:** $A = \tfrac{1}{2}\,(a+b)\,h$ (the "average of the parallel sides, times the height")
* **Circle (Egyptian rule):** $A = \left(\tfrac{8}{9}d\right)^{2}$
* **Prism / cylinder:** $V = B\,h$ (base area times height)
* **Pyramid / cone:** $V = \tfrac{1}{3}\,B\,h$
* **Frustum of a square pyramid:** $V = \tfrac{h}{3}\left(a^{2} + ab + b^{2}\right)$

That list is the entire practical geometry of the ancient world, and it is more sophisticated than it looks — especially the last two entries. Let us see it culture by culture.

### Egypt: the Rhind Papyrus

<figure>
	<img style="width: 560px; max-width: 100%;" src="rhind_papyrus.png" alt="A page of the Rhind Mathematical Papyrus in hieratic script" />
	<figcaption class="md">A page of the <strong>Rhind Mathematical Papyrus</strong> (Papyrus Ahmes) in hieratic script: a column of word problems, each followed by its worked solution and a check — the recipe-style metric geometry described here \cite{rhindpapyrus}.</figcaption>
</figure>

The best single window into Egyptian practical geometry is the **\citealternativetitle{rhindpapyrus}**, copied by the scribe *Ahmes* around 1650 BCE (from an older source) \cite{rhindpapyrus}. It is a problem book for scribes, and its geometry is entirely *metric* — it asks for areas and volumes, and gives rules that work, without any "why".

Two results are worth knowing, because they show the level of sophistication:

* **Area of a circle.** Ahmes uses the rule "cut off one-ninth of the diameter, and what remains, square it": $A = \left(\tfrac{8}{9}d\right)^{2}$, which is equivalent to $\pi \approx \tfrac{256}{81} \approx 3.1605$ — impressively close to $3.1416$ for a rule that is easy to remember and hard to derive \cite{rhindpapyrus}.
* **Volume of a truncated pyramid.** Problem 58 gives the exact formula for the frustum of a square pyramid, $V = \tfrac{h}{3}\left(a^{2} + ab + b^{2}\right)$ (top side $a$, base side $b$, height $h$). This is a genuinely non-obvious formula — the volume of a frustum is not the average of the top and bottom volumes, and the correct expression involves the *cross-term* $ab$ — and it is stated correctly \cite{rhindpapyrus}. The full pyramid, $V=\tfrac{1}{3}Bh$, is the same rule with the top shrunk to nothing.

Note what is *absent*: there is no proof, no postulate, no general argument. The rules are recipes, validated by the fact that the tax they produced was right. That is the defining feature of applied geometry before the Greeks.

### Babylon: geometry on clay

<figure>
	<img style="width: 100%" src="susa_geometry_tablet.jpg" alt="Geometry problem on a clay tablet from a scribe school in Susa" />
	<figcaption class="md">The \citealternativetitle{susa_geometry_tablet} — object Sb 13088 in the Louvre — a school exercise from the first half of the 2nd millennium BCE. A geometry problem, set out in cuneiform on clay for a student to solve; the "homework" plate of an Old Babylonian mathematics class \cite{susa_geometry_tablet}.</figcaption>
</figure>

The Babylonian tradition is even richer, and even stranger, because the Babylonians thought in a **base-60 (sexagesimal)** positional system — the ancestor of our 60-second minute — and because they had no letters for "side" or "diagonal" in the way we do. Their "algebra" was, in the words of \citeauthor{hoyrup2021algebra}, a *geometric* technique: equations were solved by literally **cutting and pasting squares and rectangles** on a diagram (or in the scribe's head) \cite{hoyrup2021algebra} \cite{hoyruplengths}. The reason a base-60 system survived into our clocks is that 60 is *geometrically* convenient: it is divisible by 2, 3, 4, 5, 6 and 10, so the fractions that keep appearing when you halve a field or cut a corner come out exact.

Where did all these problems come from? The surprising answer is a *social* one: **the scribe school**. The more than 400 clay tablets that carry Babylonian mathematics were all inscribed while the clay was still moist and then baked hard in an oven or by the sun — and, tellingly, *"some of these appear to be graded homework"* \cite{historyofmath_wikipedia}. Geometry, in other words, had already become a **curriculum** a thousand years before Pythagoras: a young scribe did not simply watch a surveyor at work, he sat in a classroom and worked through problem sheets, complete with diagrams his teacher could check. The tablet below is exactly that kind of thing.

<figure>
	<img style="width: 100%" src="si_427.jpg" alt="The Si.427 field plan, an Old Babylonian surveyor's tablet" />
	<figcaption class="md">\citealternativetitle{si427_image}, a hand-tablet from the Old Babylonian period (c. 1900–1600 BCE): a field being subdivided, its boundary lines set out with right angles made exact by Pythagorean triples.</figcaption>
</figure>

**Si.427 — the oldest applied geometry.** The clearest physical proof that this was a *surveying* discipline, not just classroom arithmetic, is the tablet **Si.427**, a field plan made by an Old Babylonian surveyor. \citeauthor{si427} traced the tablet from a 19th-century excavation record to the Archaeological Museum in Istanbul and showed that the surveyor used **Pythagorean triples** to make the boundary lines *truly perpendicular* \cite{si427} \cite{si427_baublatt}. The point is not only that it is ancient; it is that it is *before Pythagoras by more than a thousand years*. The famous 3-4-5 right triangle was a working tool of Mesopotamian land-surveyors long before it became a Greek theorem:

$$\underbrace{3^{2}}_{\text{one side, squared}} + \underbrace{4^{2}}_{\text{the other side, squared}} = \underbrace{5^{2}}_{\text{the diagonal, squared}} \;\;\Longrightarrow\;\; \text{a corner that is exactly square}$$

A rectangle with sides in the ratio 3 : 4 and diagonal 5 is, by construction, a rectangle with exact right angles. The surveyor could lay it out on the ground with ropes of the right lengths and be certain the corners were square — no protractor required.

**Plimpton 322 — a table of right triangles.** The related tablet **Plimpton 322** (c. 1800 BCE) is a list of about fifteen rows of sexagesimal numbers. For a century it was dismissed as a multiplication table; \citeauthorlastnameand{plimpton322} argued that it is a systematic table of exact right-triangle ratios — a *proto-trigonometric* catalogue of the special triples a surveyor could actually use, sorted so a scribe could look up the right one for a given field \cite{plimpton322}. In both tablets the motivation is the same and the same practical one that \citeauthor{si427_baublatt} highlights: land was becoming private property, and neighbours needed *disputable, exact* boundaries \cite{si427_baublatt}.

**BM 85200 + VAT 6599 and Db2-146 — geometry in its purest form.** Two more tablets, analysed in detail by \citeauthor{hoyrup2021algebra}, show how far the "cut-and-paste" technique went \cite{hoyrup2021algebra}.

* **The excavation problem (BM 85200 + VAT 6599, problem 23).** A square pit is to be dug so that its depth exceeds its side by one *kùš*, and the volume is fixed. The scribe solves it with a table of numbers of the form $n^{2}(n+1)$ — the "equal, one added" table — that is, by working with a *cube* as the "comparison body". The modern algebraic reading is $x^{2}(x+1) = V$; the Babylonian procedure is to look up, in a memorised table, the $x$ whose cube-plus-face matches the given volume.
* **The diagonal problem (Db2-146).** Given the *diagonal* of a rectangle, $1^{\circ}15'$, and its *area*, $45'$, find the length and the breadth. The scribe "completes the square" in the standard way and arrives at length $1$ and breadth $45'$. The final lines are a *check*, and they carry, in abstract form, a clear trace of what we would now call the Pythagorean rule: the length and breadth are "raised" (squared) and their sum is checked against the diagonal, without ever naming a triangle \cite{hoyrup2021algebra}.

The engine behind both is **completing the square**, the single most important move in all of pre-modern algebra. To solve $x^{2} + bx = A$, the Babylonian (and later the Greek, the Arabic, and the European) adds the square of half the coefficient to both sides so that the left side *becomes* a square:

$$\underbrace{x^{2} + bx}_{\substack{\text{a square of side }x,\\\text{plus a strip next to it}}} = A \quad\Longrightarrow\quad \underbrace{\left(x + \tfrac{b}{2}\right)^{2}}_{\substack{\text{one complete square}}} = A + \underbrace{\left(\tfrac{b}{2}\right)^{2}}_{\substack{\text{the little square}\\\text{you add to finish it}}}$$

The right side is now a perfect square, so the scribe takes its (sexagesimal) square root and has the answer. This is *literal* square-completion: you add a little square of side $b/2$ to the L-shape (gnomon) that $x^{2}+bx$ forms, and the whole becomes one big square. Geometry *is* the algebra.

<figure>
	<img style="width: 100%" src="cuneiform.jpg" alt="Babylonian cuneiform on a clay tablet" />
	<figcaption class="md">Babylonian cuneiform — the medium of Si.427, Plimpton 322 and the BM/VAT tablets. A single clay tablet could carry a field plan, a table of right-triangle ratios, and a worked solution of a "complete the square" problem, all in the same wedge-script \cite{neugebauerexactsciences}.</figcaption>
</figure>

\citeauthor{hoyrup2021algebra} notes a remarkable after-life of the diagonal problem: the very same "given the diagonal and the area, find the sides" puzzle, with the very same solution procedure, reappears **1,900 years later** in a Hebrew mathematical handbook dated 1116 CE — a tradition that ran from Old Babylonian field-measurers, through the scribal schools, and into the medieval world \cite{hoyrup2021algebra}.

<div class="optional md" data-headline="What algebra really was">
This is the insight that separates modern scholarship from older accounts. For most of the 20th century these texts were read as *numeric* algebra: the scribe was "solving $x^{2}+x=a$". \citeauthor{hoyrup2021algebra} showed that reading is impossible to sustain, because the terminology only makes sense against a *geometric* background — the operations are additions, subtractions and multiplications of *measurable* lengths and areas, and the "quadratic completion" is a literal rearrangement of square and rectangle pieces \cite{hoyrup2021algebra} \cite{hoyruplengths}. The Babylonians did not have "algebra" and "geometry" as two subjects; they had one geometry that *happened* to compute. Euclid, a millennium later, would re-cast much of this into the axiomatic *Elements*.
</div>

### India: the Śulba Sūtras and $\sqrt{2}$

In the Vedic tradition of India, the driving force was not the field but the **fire altar**. The altar had to be a rectangle of exactly a prescribed area, and it had to be *converted into a square* (and then into other shapes) without changing that area — a ritual requirement, because the offering had to be "of the same measure". The **\citealternativetitle{sulbasutras}** — construction manuals, the earliest of them (attributed to *Baudhāyana*) dating to roughly 800 BCE — are full of exactly this geometry \cite{sulbasutras}.

The most celebrated result is a recipe for $\sqrt{2}$. Starting from a rectangle of area 1, one "cuts off" a corner and folds in a smaller triangle (the *diagonal* operation), producing a square of the same area. The diagonal of the unit square is $\sqrt{2}$, and the *Baudhāyana Śulba Sūtra* gives it to the fifth decimal place:

$$\sqrt{2} \;\approx\; \underbrace{1}_{\text{the whole side}} + \underbrace{\tfrac{1}{3}}_{\text{add a third of it}} + \underbrace{\tfrac{1}{3\cdot 4}}_{\text{add a fourth of that}} - \underbrace{\tfrac{1}{3\cdot 4\cdot 34}}_{\text{take back a hair's-breadth}} \;=\; \tfrac{577}{408} \;\approx\; 1.41421\dots$$

The famous line, roughly, is that *"the length obtained along the diagonal makes an area equal to that made by length and width together"* — a geometric statement of $d^{2} = a^{2} + b^{2}$ made, once again, *independently* of Greece and *before* the theorem bore Pythagoras's name \cite{sulbasutras}. Here the *why* is ritual precision: an altar whose corner is off by a hair is, in the logic of the text, a failed offering.

### China: the Jiuzhang Suanshu

The Chinese tradition is anchored in the **\citealternativetitle{jiuzhangsuanshu}** (*The Nine Chapters on the Mathematical Art*), a practical compendium whose problems — land area, grain, fair distribution, earthworks — were assembled by Han-dynasty scholars (compiled c. 1st century BCE, with material older still) \cite{jiuzhangsuanshu}. Its geometry is metric and algorithmic: areas of fields of every shape, volumes of dikes and granaries, and, in the chapter on the *gougu* (the "right-angle"), the same $a^{2}+b^{2}=c^{2}$ relation, used to *find* the diagonal of a rectangle from its two sides \cite{jiuzhangsuanshu}. The *Jiuzhang* gives the trapezoidal field area $A=\tfrac{1}{2}(a+b)h$ as a standing rule, and it is also where one of the earliest clear uses of **negative numbers** appears (as book-keeping entries in a system of simultaneous linear equations), so it is a reminder that these "geometric" treatises were, in practice, the whole of a culture's applied mathematics. The *why* is the state: the *Jiuzhang* is a manual for the bureaucracy that taxed fields, paid soldiers in grain, and moved earth for canals and tombs.

A fair summary of this whole section: by the first millennium BCE, three unrelated civilisations — Mesopotamia, the Indus and China — had each invented, for the *practical* purpose of measuring the earth, the right-triangle relation, the area rules, and (in India and China) a working $\sqrt{2}$. Geometry had already travelled the world once, on the business of land, before anyone wrote a proof.
</div>

<div class="md">
## III. The Greek turn: from measuring to proving

**What motivated proof?** Not doubt — the opposite: belief. The Greeks, and the Pythagoreans in particular, held that *number* was the substance of reality ("all is number"); so a fact about number could not merely be *useful* — it had to be *necessary*, true in every possible world, not just in the field you are surveying today. When the Greeks met geometry they therefore did not simply inherit it: they made it *demonstrative*. A Babylonian scribe could give you the right answer and trust the recipe; a Greek wanted to know **why it must be so, and why it cannot fail**. That single demand — for *apodeixis*, proof — is what separates the *Elements* from everything before it, and it is the habit of mind that all of modern mathematics (and, in the end, all of the formal reasoning a computer performs) inherits.

### Thales, Pythagoras and the theorem

\marginfig{pythagoras.jpg}{Pythagoras of Samos (c. 570–495 BCE), founder of the school that gave its name to the most famous theorem in the world.}

The tradition places the first proofs with **Thales of Miletus** (c. 624–546 BCE) — for example, that a circle is bisected by its diameter (Thales' theorem, *Elements* I.31) and that the angles of a triangle sum to two right angles (I.32) \cite{heathgreekmath}. Thales' theorem, in modern symbols: if $AC$ is a diameter of a circle and $B$ is any other point on it, then $\angle ABC = 90^{\circ}$. The Pythagoreans, the circle around **Pythagoras** (c. 570–495 BCE), are credited with the first *proof* of what is now named after them: in any right triangle the square on the hypotenuse equals the sum of the squares on the two legs,

$$\underbrace{a^{2}}_{\substack{\text{the square on}\\\text{the shorter leg}}} + \underbrace{b^{2}}_{\substack{\text{the square on}\\\text{the longer leg}}} = \underbrace{c^{2}}_{\substack{\text{the square on the}\\\text{hypotenuse}}}$$

and, more, they (allegedly) proved the converse — that a triangle with $a^{2}+b^{2}=c^{2}$ *must* be right-angled. The Babylonians and the Indians had *used* the relation for a thousand years; the Greeks *understood* it, and — for them, this was the dangerous part — the understanding led to a crisis, because they found figures (the diagonal of a square) whose side ratio could not be written as a ratio of whole numbers at all. The discovery of the incommensurable, $\sqrt{2} \notin \mathbb{Q}$, is arguably the first genuine "mathematical" result: a statement about what *cannot* be done \cite{heathgreekmath}.

### Hippocrates and Eudoxus: the method of exhaustion

**Hippocrates of Chios** (c. 470–410 BCE) is said to have been the first to "square the lunes" — to cut a crescent-shaped figure bounded by two circular arcs and show it has an area exactly equal to a plain rectilinear one \cite{heathgreekmath}. It is the first *quadrature of a curved figure*, and it points the way to the circle itself. A century later **Eudoxus of Cnidus** (c. 408–355 BCE) supplied the rigorous engine that had been missing: the **method of exhaustion**, the idea that a curved area can be pinned down by inscribing and circumscribing polygons and showing the "remainder" can be made smaller than *any* given piece. This is the ancient ancestor of the integral. Applied to the circle, it proves

$$\underbrace{A_{\text{circle}}}_{\text{the amount of disk}} = \pi\,\underbrace{r^{2}}_{\text{the radius, squared}}, \qquad \underbrace{C_{\text{circle}}}_{\text{the length of the rim}} = \underbrace{2\pi}_{\approx 6.28}\;\underbrace{r}_{\text{the radius}}$$

and Euclid's *Elements* XII is built on it \cite{heathgreekmath}.

### Archimedes: exhaustion perfected

\marginfig{archimedes.jpg}{Archimedes of Syracuse (c. 287–212 BCE), who perfected the method of exhaustion and computed the sphere's volume and surface with proofs that survive today.}

If Eudoxus gave the *method*, **Archimedes of Syracuse** (c. 287–212 BCE) gave it its masterpieces \cite{heathgreekmath}. Working with the same exhaustion engine, he computed, with proofs that survive today, the area and circumference of the circle, and then the *volumes* that were the great open problem: the sphere, the cone, the cylinder, the paraboloid and the spheroid. His results, in modern symbols,

$$\underbrace{V_{\text{sphere}}}_{\substack{\text{how much solid}\\\text{is inside}}} = \tfrac{4}{3}\pi r^{3}, \qquad \underbrace{S_{\text{sphere}}}_{\substack{\text{how large the}\\\text{skin is}}} = 4\pi r^{2}, \qquad \underbrace{V_{\text{cone}}}_{\text{a third of its cylinder}} = \tfrac{1}{3}\,Bh$$

The cone result is the $V=\tfrac{1}{3}Bh$ we saw in the Rhind Papyrus, now *proved*; Archimedes showed the sphere is exactly two-thirds of the cylinder that circumscribes it, a ratio he considered his finest discovery and asked to be carved on his tomb. The *why* here is not taxation but intellectual pride: Archimedes was answering the Pythagorean demand for proof at the hardest scale — three-dimensional curved bodies.

### Plato: geometry as the road to the Forms

For **Plato** (c. 428–348 BCE), geometry was not a trade; it was the *entrance examination* to philosophy. In the *Republic* the philosopher is told that "if he has not a great natural gift for geometry he will get very little from the study of it", because geometry "draws the soul towards truth" (*Republic* 527a) \cite{platorepublic}. In the *Meno* there is the famous scene in which Socrates leads an uneducated slave boy, by questions alone, to *discover* that doubling a square requires a side of $\sqrt{2}$ times the original \cite{platomeno}. The point Plato wants is the philosophical one: the boy was not *taught* the fact from outside; the shape was already, in a sense, *known* to him, and proof merely *reminded* him of it. Geometry, on this picture, is the study of what the mind already contains — the bridge between the changing world of things and the unchanging world of Forms.

The tradition also preserves the legend that Plato had written above the door of his Academy: *"Let no one ignorant of geometry enter"* — a slogan for the idea that the discipline was a *way of thinking* before it was a body of results.

### Aristotle: place, continuity and the "three principles"

\citeauthor{aristotlephysics}'s (*ca. 350* BCE) \citetitle{aristotlephysics} (Book IV) is less a geometry than a *metaphysics of space* \cite{aristotlephysics}. His question is not "how big" but "what is *where*?": he defines **place** (the *topos*) as "the innermost motionless boundary of what contains", argues that the void is impossible, and — in the *Physics* and the *Metaphysics* — lays down what he calls the three principles on which mathematics stands: the **axiom** (a self-evident proposition), the **postulate/hypothesis** (a request to suppose something), and the **definition** (a name for a thing). This threefold taxonomy is exactly the scaffold Euclid's *Elements* will use a generation later, and it is the seed of the whole modern notion of an *axiomatic theory*.

### Euclid's Elements: the machine of proof

\marginfig{euclid.jpg}{Euclid of Alexandria (c. 300 BCE) demonstrating a proposition to a student — the standard image of the man who set the template for every proof that followed.}

Everything before Euclid was a collection of results; the **\citealternativetitle{euclidelements}** (composed c. 300 BCE in Alexandria, the standard edition edited and translated by \citeauthor{euclidelements_heath}) is the first *system* \cite{euclidelements} \cite{euclidelements_heath}. The *why* is institutional: Alexandria was the library of the ancient world, and Euclid's book was a textbook for the students who flocked there — a way to organise *all* the known geometry into one sequence in which each result depends only on the ones before it. Its structure is as famous as its content: a short list of definitions, **five postulates** (the working rules of compass and straightedge) and **five common notions** (self-evident truths about magnitudes) from which **465 propositions** follow, each ending with the little square — the *hysteron* — that marks "it has been proved". That architecture is the template for every proof-based subject that followed:

* **Definitions** (point, line, circle, angle, …) — what the objects *are*.
* **Postulates** (five) — what you are *allowed to do* with them. The first four are self-evident constructions; the **fifth** is the **parallel postulate**: through a point not on a line there passes *at most one* line that never meets the given line. For over two thousand years this fifth postulate was treated as slightly less obvious than the others, and every attempt to "fix" it is, in retrospect, the road to non-Euclidean geometry (Section VII).
* **Common notions** (five) — the basic, self-evident truths about equality and magnitude ("things equal to the same thing are equal to one another").
* **Propositions** — statements proved *only* from the definitions, postulates and common notions, plus earlier propositions.

<figure>
	<img style="width: 100%" src="euclid_elements.jpg" alt="A page from a manuscript of Euclid's Elements" />
	<figcaption class="md">A page from a medieval manuscript of the \citealternativetitle{euclidelements}: definition, postulate, and proposition, each with its proof, in the unbroken chain Euclid designed. This is what "a proof" looked like for two thousand years.</figcaption>
</figure>

The books are organised by theme: **Book I** is plane geometry (angles, triangles, the Pythagorean theorem as **I.47**, and the *converse* as I.48); **Book VI** develops proportion and **similar triangles**, which is how the Greeks did "algebra with lengths"; **Book XII** applies the method of exhaustion to area and volume (the circle's area is to the square on its diameter as the ratio is; the cone is a third of the cylinder); and **Book XIII** closes the whole edifice by constructing the five **regular solids** — the tetrahedron, cube, octahedron, dodecahedron and icosahedron — tying geometry back to the Platonic idea that the cosmos is built from five shapes.

<figure>
	<img style="width: 100%" src="platonic_solids.jpg" alt="The five Platonic solids" />
	<figcaption class="md">The five <strong>regular solids</strong> of <em>Elements</em> XIII — the only convex polyhedra whose faces are identical regular polygons and whose identical corners fit together. Euclid constructs all five and proves there can be no sixth; the <em>proof</em> of the "exactly five" fact, however, is usually attributed to a later reading of his construction \cite{euclidelements}.</figcaption>
</figure>

The anecdote (told by Proclus) is that when **Ptolemy** complained the *Elements* were too hard for beginners, Euclid replied that **there is no royal road to geometry**. The line captures the whole Greek shift: the *Elements* are not a shortcut to the right answers; they are the *long way around*, and it is precisely that long way — the insistence on proof — that makes the discipline permanent. Every theorem in this book, and every formal proof a machine checks, is a descendant of Euclid's first line: *"Let AB be a given finite straight line."*

### Beyond Euclid: Heron, Apollonius and Menelaus

Two threads push geometry past the plane and past the conic.

**Heron of Alexandria** (1st century CE), in his *Metrica*, collected and proved the practical metric formulas, the most famous of them giving the **area of a triangle from its three sides** — no height required:

$$\underbrace{A}_{\text{the area of the field}} = \sqrt{\;\underbrace{s(s-a)(s-b)(s-c)}_{\substack{\text{built only from the}\\\text{three measured sides}}}\;}, \qquad \underbrace{s}_{\text{half the perimeter}} = \frac{a+b+c}{2}$$

\cite{heronmetrica}. This is the tool a surveyor actually needed — you can measure the three sides of an irregular field on the ground, but dropping a perpendicular to get a height is often impossible. It also generalises naturally, with two sides and the included angle $C$, to $A = \tfrac{1}{2}ab\sin C$, and, replacing the sine term, to the **law of cosines**, $c^{2} = a^{2} + b^{2} - 2ab\cos C$, which is the Pythagorean theorem for *every* triangle (and reduces to it when $C = 90^{\circ}$) \cite{heronmetrica} \cite{heathgreekmath}.

**Apollonius of Perga** (c. 262–190 BCE) wrote the eight-book **\citealternativetitle{apolloniusconics}**, in which he names and classifies the **conic sections** — the ellipse, the parabola and the hyperbola — as the curves a plane cuts from a cone, and develops their full metric theory \cite{apolloniusconics}. Written in the language of coordinates that Descartes would later supply, the three conics are simply

$$\underbrace{\frac{x^{2}}{a^{2}} + \frac{y^{2}}{b^{2}} = 1}_{\text{a closed loop}} \qquad \underbrace{y^{2} = 4ax}_{\text{one open arc (focuses light)}} \qquad \underbrace{\frac{x^{2}}{a^{2}} - \frac{y^{2}}{b^{2}} = 1}_{\text{two open arcs}}$$

<figure>
	<img style="width: 100%" src="conic_sections.png" alt="The three conic sections: ellipse, parabola and hyperbola" />
	<figcaption class="md">The three <strong>conic sections</strong> (\citealternativetitle{conicsections_wiki}): tilt a cutting plane against a cone and it carves out an ellipse (a shallow cut), a parabola (a plane parallel to a side), or a hyperbola (a steep cut through both nappes). All three are degree-two curves — the geometry that Descartes would turn into the $B^{2}-4AC$ sign test \cite{apolloniusconics}.</figcaption>
</figure>

The *why* is partly optical and partly astronomical. The parabola is the only conic that **focuses**: a ray sent in parallel to its axis reflects through a single point (the focus), which is why parabolic mirrors and dishes concentrate light and sound — the old legend that Archimedes burned Roman ships with a focusing mirror is a story about this. And the ellipse is the shape of an orbit: it will take **Kepler** (1609) to read the conics back into the sky and discover that planets move on ellipses with the Sun at one focus \cite{keplerastronomianova}, and **Newton** (1687) to prove that an inverse-square force *must* produce conic orbits \cite{newtonprincipia}. The conics sit, in other words, exactly at the hinge between pure geometry and the physics of the heavens.

<figure>
	<img style="width: 100%" src="antikythera.jpg" alt="The Antikythera mechanism" />
	<figcaption class="md">The Antikythera mechanism (c. 2nd c. BCE), a geared astronomical computer — the geometry of the heavens reduced to bronze gears and epicycles.</figcaption>
</figure>

**Menelaus of Alexandria** (c. 70–140 CE) wrote the **\citealternativetitle{menelaussphaerica}**, the first systematic treatise on **spherical geometry** — the geometry of the *surface* of a sphere, where the straight line is replaced by a great circle and the angles of a triangle sum to *more* than two right angles \cite{menelaussphaerica}. Menelaus' theorem is the spherical tool for astronomy (locating the stars), and it quietly plants the second seed of Section VII: *curved* space has its own, genuinely different, geometry.
</div>

<div class="md">
## IV. Transmission: the Islamic Golden Age

<div style="display:flex; gap:1.5rem; flex-wrap:wrap; justify-content:center; margin:0 0 1.5rem;">
<figure style="margin:0; width:45%; max-width:260px;">
<img style="width:100%; height:auto; border-radius:4px;" src="alkhwarizmi.jpg" alt="Muḥammad ibn Mūsā al-Khwārizmī" />
<figcaption class="md" style="font-size:0.85rem; margin-top:0.4rem;">Muḥammad ibn Mūsā <strong>al-Khwārizmī</strong> (c. 780–850), whose treatise on <em>al-jabr</em> gave algebra its name — and whose surname gave us the word <em>algorithm</em>.</figcaption>
</figure>
<figure style="margin:0; width:45%; max-width:260px;">
<img style="width:100%; height:auto; border-radius:4px;" src="alhazen.jpg" alt="Ibn al-Haytham (Alhazen)" />
<figcaption class="md" style="font-size:0.85rem; margin-top:0.4rem;"><strong>Ibn al-Haytham</strong> (Alhazen), c. 965–1040, whose <em>Book of Optics</em> made geometry the mathematics of how the world projects itself onto the eye.</figcaption>
</figure>
</div>

**What motivated the turn east?** Not scholarship only: Islamic inheritance law required estates to be divided into fractional shares, and the *kharaj* land tax required surveying — the new science of **algebra** served the counting of the estate as directly as it served the counting of the stars. When the Greek world passed its knowledge eastward, it was not lost but *worked on*. In the great translation and research centres of the Islamic world — above all the **House of Wisdom** in Baghdad (8th–13th c.) — the *Elements*, the *Conics* and the astronomical treatises were rendered into Arabic, corrected, and extended. Figures such as **al-Khwārizmī** (c. 780–850) re-founded algebra (the very word is his, from *al-jabr*, "the restoring/completing") and did so in the *geometric* spirit inherited from Babylon and Greece, solving equations by the same cutting-and-completing-of-the-square operations \cite{hoyrup2021algebra}.

Al-Khwārizmī's canonical example, in modern dress, is the problem "a square and ten times its side make thirty-nine" — $x^{2} + 10x = 39$. He completes the square: halve the ten to get $5$, square it to get $25$, add to $39$ to get $64$, take the root $8$, subtract the $5$, and obtain $x = 3$. In symbols, the move that is his legacy is exactly the Babylonian one, now general:

$$\underbrace{x^{2} + bx}_{\text{a square plus a strip, totalling }A} \;\Longrightarrow\; \underbrace{x}_{\text{the side we are after}} = -\underbrace{\tfrac{b}{2}}_{\text{half the strip}} + \sqrt{\;A + \underbrace{\left(\tfrac{b}{2}\right)^{2}}_{\text{the little added square}}\;}$$

The single most important geometric achievement of the period, however, is the work of **Ibn al-Haytham** (Latinised **Alhazen**, c. 965–1040).

His **\citealternativetitle{alhazenoetic}** (completed c. 1021) is a *geometry of seeing*: it treats the eye, the mirror, and the path of light as objects of rigorous geometric analysis, and famously inverts the old "emission" theory of vision by arguing that we see by light *entering* the eye along straight rays \cite{alhazenoetic}. The law he formalises is the **law of reflection**, $\theta_{\text{incident}} = \theta_{\text{reflected}}$ (measured from the normal to the surface), and the **Alhazen problem** — finding the point on a mirror where a ray from an object reflects to the eye — is a genuinely hard geometric problem that he reduces to an algebraic (in fact quartic) equation. His treatment of the **camera obscura** is the direct ancestor of both the scientific camera and the mathematics of *perspective* \cite{alhazenoetic}. It is a pivot: geometry becomes the mathematics of *projection* — of how a three-dimensional world is faithfully laid down on a two-dimensional surface.
</div>

<div class="md">
## V. The geometry of the sky: angles, sines and the functions of a triangle

**What motivated geometry to look up?** The merchant and the sailor who were out of sight of land, and the priest who had to keep the calendar: all three measured the sky by *angles* — the height of a star, the run of the sun, the turning of the year. Up to now geometry has been about the ground — fields to square, altars to convert, temples to raise. But the same right triangle that measured a field can now be turned around and pointed at the sky, and the moment it does, something new is born: a **function of an angle**. This is the load-bearing idea of the second half of the chapter, because it is the bridge from *shapes in the plane* to *a number attached to a direction* — and a direction, in the modern language, is exactly what a vector (and therefore an embedding) is.

### The Greek chord: measuring the heavens

The need that created trigonometry was not the surveyor's but the astronomer's. To predict the positions of the sun, moon and planets — and the eclipses that carried religious weight — you must measure *angles in the sky*, and angles in the sky are read by the lines they cut across the celestial sphere. **Hipparchus of Nicaea** (c. 180–125 BCE), called the "father of trigonometry," was the first to tabulate them: for a series of arcs he listed the length of the **chord**, the straight line joining the two ends of the arc \cite{hipparchuschords}. A chord of an angle subtends that angle, and its perpendicular bisector runs through the centre and halves it, so one half of the bisected chord is $r\sin(\theta/2)$: the **sine is secretly the half-chord**. Hipparchus' table is lost, but **Ptolemy's** *Almagest* (c. 150 CE) rebuilt and extended it, giving the chord of every half-degree up to a semicircle for a circle of diameter $120$, and in doing so fixed the **360° circle** and the **sexagesimal** division — sixty parts to a degree, sixty to a part — inherited from the Babylonian base-60, which is why a minute and a second of *angle* are the same words as a minute and a second of *time* \cite{ptolemyalmagest} \cite{neugebauerexactsciences}.

### The Indian sine: the chord becomes a function

The decisive leap came in India. In the **\citealternativetitle{aryabhatiya}** (composed **499 CE**), the mathematician-astronomer **Aryabhata** (476–550 CE) tabulated not the chord but the *half-chord* — the Sanskrit **jya**, literally "bowstring" — in steps of $3.75^{\circ}$ from $0^{\circ}$ to $90^{\circ}$, to four decimal places \cite{aryabhatiya}. That small change is the whole invention: a chord is a line segment in one particular circle, but the half-chord, measured as a *fraction of the radius*, is a **ratio that depends only on the angle**. The object stops being a bit of a diagram and becomes a *function* — a number you can attach to a direction. This is the sense in which the "Indian guy" invented the sine: not the shape, but the *function*.

The companion function was there too, the **kojya** (the "adjacent" half-chord): what we now call the **cosine** — the sine of the *complementary* angle, $\sin\theta = \cos(90^{\circ} - \theta)$ — and the "co-" prefix has meant exactly that, "the one for the complement," ever since. The word *sine* itself is a happy accident: as the Indian tables were carried into Arabic in the 8th century, *jya* was misread as the Arabic **jayb** ("a fold," or the open bay of a garment), and that became the Latin *sinus*, a bay. A bowstring, through two mistranslations, became a bay of the sea.

<figure>
	<img style="width: 100%" src="trig_functions.svg" alt="Sine, cosine and tangent on the unit circle" />
	<figcaption class="md">Sine, cosine and tangent read off a single right triangle on the unit circle (\citealternativetitle{trigfunctions_image}): $\sin\theta$ is the height, $\cos\theta$ the run, $\tan\theta$ the slope of the terminal side. So what does sine <em>mean</em>, in the end? It is a <strong>ratio</strong> — opposite over hypotenuse — and because it is a ratio, not a length, it generalises from the triangle, to the circle, to a function on the whole real line.</figcaption>
</figure>

### The Islamic formalisation: six functions and a subject of its own

In the medieval Islamic world trigonometry was pulled out of astronomy and made a subject in its own right. **Nasir al-Din al-Tusi** (1201–1274) was the first to treat it independently, and he established all **six** functions — sine, cosine, tangent, cotangent, secant, cosecant — with proofs, together with the plane and spherical **laws of sines** in exactly the form still taught today \cite{altusitrig}. The **tangent** and **secant** take their names straight from the circle: a *tangent* line *touches* it (Latin *tangens*), a *secant* line *cuts* it (*secans*). What drove all of it was the **spherical** version — the geometry of the *celestial sphere*, where the "straight line" is a great circle. Spherical trigonometry is what lets you find the **qibla** (the direction of Mecca) from anywhere on Earth, and it is the same engine that later made navigation possible: a problem on the sphere, not on the plane.

\marginfig{astrolabe.jpg}{A Persian astrolabe (made 1715). A model of the celestial sphere on a metal plate — swing it to a star and it reads the star's altitude, a portable protractor for the sky (\citealternativetitle{astrolabe_image}).}

### Calculating the functions: from tables to infinite series

For centuries the working method was the **trig table**: a list of sines at regular angles, with *interpolation* between the printed entries. **Bhāskara I** (7th c.) did something better — a *formula* for the sine of an acute angle with no table at all, $\sin x \approx \tfrac{16\,x(\pi - x)}{5\pi^{2} - 4x(\pi - x)}$, accurate to under two percent.

Then came the idea that would feed every numerical computation in this book: express the sine as an **infinite series**. Astonishingly, it was done first in the **Kerala school** of India, by **Madhava of Sangamagrama** (c. 1340–1425) — some *three hundred years before Brook Taylor* (1715) lent his name to the construction. The proof is preserved in the *Yuktibhāṣā* \cite{madhava}:

$$\sin x = \underbrace{x}_{\text{first guess}} - \underbrace{\frac{x^{3}}{3!}}_{\text{a correction}} + \underbrace{\frac{x^{5}}{5!}}_{\text{a smaller correction}} - \cdots \qquad \cos x = \underbrace{1}_{\text{first guess}} - \underbrace{\frac{x^{2}}{2!}}_{\text{a correction}} + \underbrace{\frac{x^{4}}{4!}}_{\text{a smaller one}} - \cdots$$

Note the quiet trap in that formula: it is only true when $x$ is measured in **radians**, not degrees. The degree is a human convenience ($360$ to a turn); the radian is the angle's *natural* unit, the one for which the arc-length equals the angle. That the cleanest formula for sine *demands* radians is the first hint that the angle's real home is not the protractor but the circle. **Taylor** (1715) and then **Euler** (1748) carried the idea to its modern form; Euler in particular made the functions functions of the *arc* and welded them to the exponential and the complex number in $e^{i\theta} = \cos\theta + i\sin\theta$, the identity that ties geometry to growth and, downstream, to all of signal processing.

### How do you measure an angle? (the instruments)

An angle is a *rotation*, so you measure it by comparing one direction to another — and, conversely, you can *calculate* an angle from a measured ratio by running the trig tables backwards (the inverse sine, or arctangent), which is the whole art of "solving" a triangle from a couple of given sides. The **protractor** — a straight-edged half-circle ruled in degrees — does the measuring on the page. The **astrolabe** does it in the sky: a portable model of the celestial sphere that you swing to a star and read off its altitude. The **sextant**, invented independently in **1731** by John Hadley in England and Thomas Godfrey in America \cite{sextanthistory}, is the astrolabe's successor at sea: by bouncing the image of a celestial body off a pair of mirrors onto the horizon, it measures the *angle between them* to a fraction of a degree; that angle, combined with a good chronometer, is what fixes your position on the globe. Navigation is, at bottom, applied spherical trigonometry — the same triangle, scaled to the size of the Earth.

\marginfig{sextant.jpg}{A sextant (this one made in London, 1773, and carried by Alexander von Humboldt). It measures the angle between a star and the horizon; that angle plus the time is your position at sea (\citealternativetitle{humboldtsextant}).}

### The payoff: dot product, cosine similarity, and how we measure spaces now

Here the thread comes home. Place two vectors on the circle and the angle between them is read straight off their **dot product**:

$$\underbrace{\mathbf{a} \cdot \mathbf{b}}_{\text{the dot product (one number)}} = \underbrace{\|\mathbf{a}\|\,\|\mathbf{b}\|}_{\text{the two sizes}} \;\underbrace{\cos\theta}_{\text{how aligned they point}} \;\Longrightarrow\; \underbrace{\cos\theta}_{\substack{\text{cosine similarity:}\\\text{1 same, 0 crossed,}\\\text{-1 opposite}}} = \frac{\mathbf{a} \cdot \mathbf{b}}{\|\mathbf{a}\| \|\mathbf{b}\|}$$

That quotient, $\frac{\mathbf{a} \cdot \mathbf{b}}{\|\mathbf{a}\| \|\mathbf{b}\|}$, is the **cosine similarity**. It is a measure of *direction*, not size: it is $1$ when the vectors point the same way, $0$ when they are at right angles, and $-1$ when they point opposite. A century before anyone had a neural network, **Salton's** vector-space model of information retrieval already used this exact quantity to decide how "parallel" two document vectors were — meaning how close in meaning \cite{salton1975vectorspace}. That is the same machinery behind [the embeddings chapter](embeddinglab): a word or a document is a vector in a high-dimensional space, and **cosine similarity** asks how close two of them are *directionally* — which is why "king" lands near "queen" while both stay far from "car." The geometry of a two-thousand-year-old triangle is doing the comparing.

Step back and the pattern is a single idea refined again and again. A **metric** is a rule $d(a, b)$ that says how far two points are, obeying three laws: $d(a, b) \ge 0$ with equality only for identical points, $d(a, b) = d(b, a)$ (symmetry), and the triangle inequality $d(a, c) \le d(a, b) + d(b, c)$. The **Euclidean** distance $\sqrt{\sum_{i} (a_{i} - b_{i})^{2}}$ is the straight-line case; the **cosine distance** $(1 - \cos\theta)$ measures orientation rather than size; Minkowski and Mahalanobis distances generalise it further. And as Section VII will show, the most general "distance" of all is Riemann's **metric tensor** $g_{\mu\nu}$ — the rule that tells a curved space how to measure infinitesimal separation. So the chain runs: the right triangle, then a ratio of a side to the hypotenuse, then an angle, then the dot product, then cosine similarity, and finally the metric on a manifold. Every link is the same question — *how do I measure the relation between two things?* — answered a little more deeply each time.
</div>

<div class="md">
## VI. Space made visible: perspective, coordinates and projection

**What motivated geometry to leave the page?** Two needs that could only be served by *flattening the world honestly*: the painter who had to persuade an eye, and the navigator who had to find a harbour in an ocean without landmarks. The mathematics of projection that Alhazen opened is taken up, on the *artistic* side, by the Renaissance, and on the *mathematical* side, by the 17th century. These two streams meet in a single, decisive idea: **space can be turned into numbers**.

### Alberti and linear perspective (1435)

**Leon Battista Alberti**, in his **\citealternativetitle{albertidepictura}** (1435), gives the first *mathematical* account of **linear perspective** \cite{albertidepictura}: the picture plane, the vanishing point, and the rule that all parallel lines receding into depth appear to meet at a single point on the horizon. The *why* is the painter's: Brunelleschi and the Florentine workshops had found, by experiment, how to make a flat panel look "deep", and Alberti was the first to write down the *rule* behind the trick. In modern language that rule is a **central projection** of 3-D space onto a 2-D plane. A point $(x, y, z)$ in front of a pinhole at focal length $f$ lands on the picture plane at

$$\underbrace{x'}_{\text{where it lands on the picture}} = \underbrace{f}_{\text{the focal length}} \cdot \frac{x}{\underbrace{z}_{\text{how far away it is}}}$$
$$\underbrace{y'}_{\text{where it lands on the picture}} = \underbrace{f}_{\text{the focal length}} \cdot \frac{y}{\underbrace{z}_{\text{how far away it is}}}$$

a *projective* transformation. The Renaissance discovery of perspective is thus, in modern language, the birth of **projective geometry**, the geometry of what survives projection.

### Descartes and analytic geometry (1637)

\marginfig{descartes.jpg}{René Descartes (1596–1650), painted by Frans Hals. His *Géométrie* fused algebra and geometry into a single subject.}

\citeauthor{descartesgeometrie}'s **\citealternativetitle{descartesgeometrie}** (1637), the final part of his *Discourse on the Method*, is the hinge on which all of later mathematics turns \cite{descartesgeometrie}. His move is the simplest and most powerful in the book of mathematics: put a **grid of coordinates** on the plane, so that every point is a *pair of numbers* and every curve is an *equation*. A line is $y = mx + c$; a circle is $x^{2} + y^{2} = r^{2}$; the conics are the degree-two equations. Geometry and algebra, which had walked in parallel for two thousand years, are now *the same subject written in two languages*. (It was **Fermat**, working independently, who developed the same idea in the same decade.)

Descartes' coordinates also give a clean *algebraic* re-statement of Apollonius' conics. Every curve of degree two in the plane satisfies

$$\underbrace{Ax^{2} + Bxy + Cy^{2}}_{\substack{\text{the degree-2 part:}\\\text{it decides the shape}}} + \underbrace{Dx + Ey}_{\text{the straight-line part: shifts it}} + \underbrace{F}_{\text{a constant: scales it}} = 0$$

and the single number $B^{2} - 4AC$ — the **discriminant** — tells you which conic it is: $<0$ an ellipse (or a point, or nothing), $=0$ a parabola, $>0$ a hyperbola. Two thousand years of "cutting a cone" have become a sign test on a coefficient. From this point on, "the geometry of a thing" can be *computed* by solving "the equation of a thing" — which is, one small step removed, exactly what a neural network does when it treats a geometric object as a set of numbers and a rule as a function.

### Desargues and projective geometry (1639)

Almost simultaneously, the French engineer **Gérard Desargues**, in his **\citealternativetitle{desarguesbrouillon}** (1639), asked a different question: *which* facts about a figure are preserved when it is projected onto another plane — facts that stay true no matter how the picture is distorted \cite{desarguesbrouillon}. His **Desargues' theorem** (two triangles are in perspective from a point iff their corresponding sides meet on a line) is one of the first clean statements of **projective geometry**, the geometry that later (with Pappus, Pascal, and then Möbius, Plücker and Klein) would be recast as the geometry of *lines, points and incidence* alone, with no length or angle at all. Perspective, algebra and projection — the three threads of the 17th century — were, in retrospect, all one subject: the geometry of *how space looks*.

### Mercator: flattening the sphere (1569)

Projection was not only an art and a philosophy; it was a navigational *necessity*. In 1569 **Gerardus Mercator** published the world map that bears his name \cite{mercatoratlas}, solving a problem that had defeated cartographers: how to draw a flat chart on which a straight line is a *constant compass bearing* (a *rhumb line*), so a sailor could steer by a straight edge. His answer is a genuine piece of differential geometry, the **Mercator projection**, which stretches a latitude $\varphi$ to a vertical coordinate

$$\underbrace{y}_{\text{its height on the flat map}} = \ln\!\left(\tan\!\left(\tfrac{\pi}{4} + \tfrac{\underbrace{\varphi}_{\text{the true latitude}}}{2}\right)\right) = \operatorname{artanh}(\sin\varphi)$$

The map is **conformal** — it preserves *angles* (so compass bearings are right) at the price of wildly distorting *areas* (Greenland looks as big as Africa). It is the earliest example, in a working tool, of a deep fact we will meet in full in Section VII: that a curved surface (the sphere) can be flattened only by *distorting* it, and that the choice of *what to preserve* (angle? area? distance?) is a mathematical choice with no perfect answer.

<figure>
	<img style="width: 100%" src="mercator_1569.png" alt="Mercator's 1569 world map" />
	<figcaption class="md">\citealternativetitle{mercatoratlas}. Note how the map stretches toward the poles — Greenland and Antarctica balloon to fill the top and bottom, a visible record of the $\ln(\tan(\tfrac{\pi}{4}+\tfrac{\varphi}{2}))$ formula doing its conformal work \cite{mercatoratlas}.</figcaption>
</figure>
</div>

<div class="md">
## VII. When space bends: topology and non-Euclidean geometry

**What motivated doubting the obvious?** A technical embarrassment that outlived two millennia: the parallel postulate refused every attempt to be proved from Euclid's other four axioms — and a proposition that cannot be proved is a question wearing the mask of a fact. For two thousand years "the" geometry was Euclid's, and everyone assumed that space *must* be flat — that the parallel postulate is a fact about the universe, not just a convenient assumption. The 18th and 19th centuries shattered that in two different directions at once: they found geometry *without metric* (topology), and geometry *without parallelism* (non-Euclidean space).

### Euler: the geometry of connectivity

\citeauthor{eulerbridges} (1707–1783) was the first to notice that some questions about space do not care about *distance* at all. The *why* was a parlor puzzle: the city of Königsberg (now Kaliningrad) sits on a river with an island and two branches, joined by **seven bridges**, and the local question was whether one could take a walk that crossed each bridge exactly once and returned to the start. Euler's solution (1736, published \citeyear{eulerbridges} \cite{eulerbridges}) ignored the distances entirely and counted only *which banks are connected to which*. The walk is possible only if the number of points (banks/island) with an *odd* number of bridges attached is $0$ or $2$; Königsberg had **four** such points, so no such walk exists.

<figure>
	<img style="width: 100%" src="konigsberg_bridges.png" alt="The seven bridges of Königsberg" />
	<figcaption class="md">The seven bridges of Königsberg. Euler replaced the river and the banks with four dots and seven lines, and the question became a statement about <em>degrees</em>: the sum of the degrees is always $2E$ (each edge touches two points), so the number of odd-degree vertices is even — here four, which is neither $0$ nor $2$, so the walk is impossible \cite{eulerbridges}.</figcaption>
</figure>

The problem "*ad geometriam situs*" ("regarding position") is the birth of **graph theory** and, more broadly, of the study of properties that survive stretching and tearing: **topology**.

Euler also found the first genuine topological *invariant*. For any convex solid built from flat faces (a polyhedron), the number of vertices $V$, edges $E$ and faces $F$ always satisfies

$$\underbrace{V}_{\substack{\text{corners}\\\text{(vertices)}}} - \underbrace{E}_{\text{edges}} + \underbrace{F}_{\substack{\text{flat}\\\text{faces}}} = \underbrace{2}_{\substack{\text{always, for any}\\\text{ball-shaped solid}}}$$

(\citeyear{eulersolids}; the general statement in \citetitle{eulersolids}) \cite{eulersolids}. A cube ($8 - 12 + 6$), a pyramid ($5 - 9 + 5$) and an arbitrarily twisted dodecahedron all give $2$. The number $2$ is the **Euler characteristic** $\chi$ of the sphere; it is *the same for every shape that can be deformed into a sphere* and *different* for anything that cannot. Generalised, a closed surface of genus $g$ (a sphere with $g$ handles) has

$$\underbrace{\chi}_{\text{the topological identity number}} = 2 - 2\,\underbrace{g}_{\substack{\text{number of}\\\text{handles}}} \qquad \big(g=0:\ \text{sphere} \Rightarrow \chi=2;\ \ g=1:\ \text{donut} \Rightarrow \chi=0\big)$$

That a shape's identity is captured by a single *integer* — not by its angles, not by its side lengths, but by something that cannot change under continuous deformation — is the founding intuition of topology \cite{eulersolids}.

### Gauss: curvature is intrinsic

\marginfig{gauss.jpg}{Carl Friedrich Gauss (1777–1855), who while surveying Hanover found that a surface can read its own curvature from the inside.}

**\citeauthor{gaussdisquisitiones}** (1777–1855), while surveying the state of Hanover for a living, was led to a question that looks innocent and is profound \cite{gaussdisquisitiones}. Surveying means measuring the angles of a *triangle* of survey markers on the ground. If the Earth's surface is truly flat, the three angles always sum to $180^{\circ}$; if it is curved, the sum is *more* (the more, the larger and curvier the triangle). So a sufficiently careful survey of a sufficiently large triangle could, in principle, tell us whether *space itself* is Euclidean. That made the *parallel postulate* — the axiom that guarantees the flat angle-sum — into an **empirical** question about the physical world, which was a scandal for a subject that was supposed to be true by pure reason alone.

In the course of working out exactly how a surface curves, Gauss proved in his **\citetitle{gaussdisquisitiones}** (1827) what he called the **Theorema Egregium**, the "remarkable theorem" \cite{gaussdisquisitiones}. The Gaussian curvature

$$\underbrace{K}_{\substack{\text{Gaussian curvature:}\\\text{how hard it bends}}} = \frac{1}{\underbrace{R_{1}}_{\text{radius of the steepest bend}} \;\cdot\; \underbrace{R_{2}}_{\text{radius of the shallowest bend}}}$$

at a point (where $R_{1}, R_{2}$ are the two principal radii of curvature — the radii of the steepest and shallowest normal sections) is *intrinsic*: it can be read off **entirely from the distances and angles measured on the surface itself**, and cannot be changed by bending the surface without stretching it. A sheet of paper bent into a cylinder has $K = 0$ everywhere (you could have rolled it from flat, so it is "still flat"); a sphere has $K > 0$; a saddle has $K < 0$. In terms of the metric coefficients $E, F, G$ of the first fundamental form,

$$\underbrace{K}_{\text{the curvature}} = \frac{\underbrace{LN - M^{2}}_{\substack{\text{how the surface bends}\\\text{(2nd fundamental form)}}}}{\underbrace{EG - F^{2}}_{\substack{\text{the surface's own measuring-stick}\\\text{(1st fundamental form)}}}}$$

so $K$ depends only on the surface's *own* measuring-stick, not on how it sits in a surrounding 3-D space \cite{gaussdisquisitiones} \cite{docarmo}.

<figure>
	<img style="width: 100%" src="theorema_egregium.png" alt="Gauss's original statement of the Theorema Egregium" />
	<figcaption class="md">Gauss's original statement of the Theorema Egregium. The message, in a phrase, is that <em>curvature is not a property of the shape embedded in a higher space, but a property of the space itself</em>, readable from within — the theorem that makes general relativity possible \cite{gaussdisquisitiones}.</figcaption>
</figure>

The Theorema Egregium has a grand descendant, the **Gauss–Bonnet theorem**, which turns curvature into *topology*. For a region $D$ of a surface with boundary, the total curvature inside plus the twist of the boundary equals a purely topological number:

$$\underbrace{\iint_{D}\; \underbrace{K}_{\substack{\text{the curvature}\\\text{at each point}}}\; dA}_{\substack{\text{add up all the bend}\\\text{inside the region }D}} \;+\; \underbrace{\oint_{\partial D}\; \underbrace{k_{g}}_{\substack{\text{how the boundary}\\\text{edge itself curves}}}\; ds}_{\substack{\text{the twist of}\\\text{the edge}}}\; =\; \underbrace{2\pi\,\chi(D)}_{\substack{\text{a fixed number set by the}\\\text{shape's holes (topology)}}}$$

and for a *closed* surface the boundary term vanishes, leaving

$$\underbrace{\iint_{S} K\, dA}_{\substack{\text{add up ALL the bend}\\\text{on a closed surface}}} \;=\; \underbrace{2\pi\,\chi(S)}_{\substack{\text{always }4\pi\text{ on a sphere,}\\\text{always }0\text{ on a donut}}}$$

\cite{docarmo}. In words: **no matter how you bend a surface, the total curvature you can accumulate on it is fixed by how many "holes" it has.** A sphere can hold exactly $4\pi$ of curvature, a torus exactly $0$. This single formula is the master key that ties the two halves of Section VII together — curvature (Gauss) and connectivity (Euler) are the same coin \cite{docarmo}.

### Lobachevsky and Bolyai: the parallel postulate is a choice

The parallel postulate had resisted proof for 2,000 years. The breakthrough was to stop trying to prove it and to *negate* it. **\citeauthor{lobachevskygeometry}** (1792–1856) and, independently, **\citeauthor{bolyaiappendix}** (1802–1860), each discovered that if you *replace* Euclid's fifth postulate with "through a point not on a line there pass *infinitely many* lines that never meet it", a perfectly consistent geometry results — **hyperbolic (or "non-Euclidean") geometry** \cite{lobachevskygeometry} \cite{bolyaiappendix}.

\marginfig{lobachevsky.jpg}{Nikolai Lobachevsky (1792–1856), who published the first non-Euclidean geometry in 1829.}

The *why* is the 2,000-year hang-up on the fifth postulate itself: it had always looked less self-evident than the other four, and for two centuries mathematicians (Saccheri, Legendre, and others) had tried and failed to prove it from the rest. The daring move was to ask what happens if you *assume the opposite* — and to find not a contradiction but a *world*. In the hyperbolic plane, the angles of a triangle sum to *less* than two right angles, and the shortfall is not a bug but the *area*: for a triangle on a surface of curvature $K=-1$,

$$\underbrace{A + B + C}_{\text{its three angles, added up}} \;<\; \underbrace{\pi}_{\text{a straight angle } (=180^{\circ})} \qquad \text{Area} = \underbrace{\pi - (A+B+C)}_{\substack{\text{the "missing angle" IS}\\\text{the triangle's area}}}$$

So a triangle's area is read directly from its *angular defect*, and there is no largest triangle — the total area of the whole hyperbolic plane is finite in angular terms yet infinite in extent. (In the opposite, spherical geometry, the sum is *more* than $\pi$ and the excess is the area.) The result was shocking, because it was not a contradiction: it was a *different, equally valid, geometry of space*. The father **Farkas Bolyai** and **Gauss** (who had found the same geometry independently but never published) both recognised that the *truth* of Euclidean versus hyperbolic geometry is no longer a question of pure reason — it is, as Gauss put it, an **empirical** question, to be settled by measuring the angle-sum of a *very large* triangle in the real world. Geometry had become a question about *physical space*, not just a set of theorems.

\marginfig{bolyai.jpg}{János Bolyai (1802–1860), son of Farkas, who worked out the same geometry in a 1832 appendix to his father's book.}

### Riemann: the general idea of "space"

<div class="smart-quote" data-cite="hypothesengeometrieenglish" data-after="translated by William Kingdon Clifford">
I consider it necessary to examine in general the hypotheses on which geometry is based, and to inquire whether we cannot give a more general meaning to the proposition about the measure of extension.
</div>

\citeauthor{hypothesengeometrie}, in his 1854 habilitation lecture \citetitle{hypothesengeometrie} \cite{hypothesengeometrie}, took one final, enormous step. The *why* was to give the new geometries — Euclidean, spherical, hyperbolic — a single frame that explained *why* they all worked, and to ask what "space" even means when it is not 3-D and not flat. His answer is the **manifold** (German *Mannigfaltigkeit*, literally "many-folds") — an $n$-dimensional surface that, *locally*, looks like ordinary flat $\mathbb{R}^{n}$, but may be curved in a way that can vary from point to point, and whose "metric" (the rule for measuring distances) is given by a tensor field $g_{\mu\nu}$:

\marginfig{riemann.jpeg}{\citeauthor{hypothesengeometrie} (1826–1866), whose 1854 habilitation lecture generalised the very idea of a "space".}

$$\underbrace{ds^{2}}_{\substack{\text{the tiny distance}\\\text{squared}}} = \underbrace{g_{\mu\nu}}_{\substack{\text{the "measuring rules", which}\\\text{can change from point to point}}} \;\underbrace{dx^{\mu}\, dx^{\nu}}_{\substack{\text{tiny steps in each}\\\text{of the }n\text{ directions}}}$$

Every geometry you have met so far is a *special case*: Euclidean space has $g_{\mu\nu}$ constant; hyperbolic space has a specific negative-curvature $g_{\mu\nu}$; a curved surface is a two-dimensional example. The curvature of such a space is encoded in the **Riemann curvature tensor** $R^{\rho}{}_{\sigma\mu\nu}$, built from derivatives of $g_{\mu\nu}$; in two dimensions it collapses to the single Gaussian number $K$, so Riemann's tensor is the $n$-dimensional generalisation of Gauss's $K$. Riemann's framework is the mathematics that **Einstein** would use in 1915 to describe gravity not as a force but as the curvature of four-dimensional spacetime,

$$\underbrace{G_{\mu\nu}}_{\substack{\text{how spacetime}\\\text{curves}}}\; =\; \frac{8\pi\,\underbrace{G}_{\text{Newton's constant}}}{\underbrace{c^{4}}_{\text{the speed of light, to the 4th}}} \;\cdot\; \underbrace{T_{\mu\nu}}_{\substack{\text{the matter and energy}\\\text{that does the bending}}}$$

the Einstein field equation: *the curvature of spacetime on the left equals the matter-and-energy on the right*. The *theorema egregium* of Gauss, generalised by Riemann, finally applied to the universe itself \cite{hypothesengeometrie} \cite{newtonprincipia}.

### Möbius and Listing: the word "topology"

In the same decade the *metric-free* side was named. **\citeauthor{mobiusband}** (1790–1868) discovered the one-sided band that bears his name (1858) \cite{mobiusband}, and **\citeauthor{listingtopologie}** (1808–1882) coined the very word **"topology"** (from *topos*, "place") in his *Vorstudien zur Topologie* (1847) \cite{listingtopologie}.

\marginfig{mobius.jpg}{August Ferdinand Möbius (1790–1868), who, with Listing, named the study of shape up to continuous deformation.}

<figure>
	<img style="width: 100%" src="mobius_strip.jpg" alt="The Möbius strip" />
	<figcaption class="md">The <strong>Möbius strip</strong>: a band with a single half-twist. It has only <em>one</em> surface and <em>one</em> boundary, so an ant walking along it returns to its starting point having traversed "both sides" without crossing an edge. Its Euler characteristic is $\chi = 0$ and it is <em>non-orientable</em> — you cannot consistently mark a "left" and a "right" on it. It is the simplest possible object that is genuinely non-flat in the topological sense \cite{mobiusband}.</figcaption>
</figure>

The message of Möbius and Listing is the message of Euler's bridges: some of the deepest facts about a space are not about how far apart things are, but about *how it is connected* — and those facts (the number of "holes", orientability, the Euler characteristic) are the *real* invariants of shape. A later, complete result — the **classification of surfaces** — says every closed surface is, up to deformation, a sphere with a certain number of handles and cross-caps attached, so the integers $g$ (handles) and $k$ (cross-caps) are the *entire* topological identity of a surface \cite{hatcher}.
</div>

<div class="md">
## VIII. The modern shape of space — and why it matters for AI

**What motivated the study of shape itself?** The reverse of the coordinate turn: once coordinates had turned all of space into numbers, the question became whether two shapes could be told apart *without* measuring at all — by how they fit together at a boundary, stretch for stretch. The last great reorganisation of the 19th century was **\citeauthor{poincareanalysissitus}**'s **\citetitle{poincareanalysissitus}** (1895), which turned topology from a collection of curiosities into a full theory \cite{poincareanalysissitus}.

The *why* was to extend Euler's and Gauss's ideas from 2-D surfaces to *spaces* of any dimension, and to answer the question "what does a space look like, up to deformation?" Poincaré's answers were the **fundamental group** $\pi_{1}$ (the algebraic record of all the ways a loop can be twisted around a space, up to continuous shrinking) and the beginnings of **homology** $H_{n}$ (counting "holes" of each dimension by signed sums of chains and boundaries) \cite{poincareanalysissitus} \cite{hatcher}. And in a stroke he posed the **Poincaré conjecture**: a closed 3-dimensional space in which every loop can be continuously shrunk to a point must be a 3-sphere. That is, *topology (how the loops behave) determines geometry (the space is a sphere)*.

\marginfig{poincare.jpg}{Henri Poincaré (1854–1912). His conjecture resisted every tool 20th-century mathematics had. It was finally proved by **Grigori Perelman** in 2002–2003, who used **Richard Hamilton's Ricci flow** — a process that smooths the curvature of a space over "time", like heat diffusing — to show that any such space must flow to a round sphere \cite{perelmanpoincare} \cite{poincareanalysissitus}.}

So where does this leave us, and why is a history of geometry a chapter in a course about machines? Because the discipline never stopped responding to the needs of its era, exactly as the opening line of \citeauthor{weeksshapespace} (\citeyear{weeksshapespace}) says \cite{weeksshapespace}. Its "needs" have changed, not its method:

* **Prehistoric**, geometry was the *repetition of a shape* — a zig-zag in a shell.
* **In the first cities**, it was the *measurement of the land* — the surveyor's right angle on clay, $A=\tfrac{1}{2}bh$, $V=\tfrac{1}{3}Bh$.
* **In Greece**, it became *proof* — the Euclidean machine, $a^{2}+b^{2}=c^{2}$ with a reason attached.
* **For the sky**, it turned a *shape into a function* — the Greek chord, the Indian sine, the six functions, Madhava's series, and the sextant that reads a star's height.
* **In the Islamic and early-modern periods**, it became *projection and coordinates* — Alhazen, Descartes, Desargues, Mercator.
* **In the 19th century**, it became *curved space and connectivity* — Gauss, Riemann, Poincaré, the Theorema Egregium and Gauss–Bonnet.
* **Today**, the newest need is the geometry of **representation**: a word is no longer a letter but a *point in a high-dimensional space*, and "meaning" is the *distance* and *direction* between those points. The [Embeddings](embeddinglab) chapter is, in a very real sense, the latest chapter of this same story — the point where the two-thousand-year-old question "what is the shape of space?" is asked of the *space of ideas* instead of the space of the field.

The thread that runs from *Homo erectus* to the embedding space is the same thread: the conviction that the world is made of *relations between points in a space*, and that those relations can be written down, proved, and, in the end, *computed*.
</div>

<div class="md">
## IX. Higher dimensions: the space the machine lives in

**What motivated going beyond three dimensions?** Geometry was forced up, dimension by dimension, by counting itself: a question with *n* quantities is a point in an *n*-dimensional space, so the number of dimensions a problem needs is exactly the number of things it is keeping track of — baskets of goods, a year of weather, the state of a machine. If the 19th century discovered that space can *bend*, the 20th discovered that it can have *any number of dimensions* — including infinitely many — and that geometry survives the trip. This is not an academic curiosity: the machine in this course computes *inside* that geometry. An embedding vector is a point in $\mathbb{R}^{d}$, with $d$ in the hundreds or thousands; a training set is a cloud of such points; a neural network is a rule for moving those points around. Every tool built in this chapter — the dot product of Section V, the curvature of Section VII, the topology of Section VIII — is now applied to that high-dimensional space, and each of the modern insights below is a 20th- or 21st-century answer to the chapter's oldest question: *what space, and how do you measure distance in it?*

### Hilbert: geometry with infinitely many dimensions

At the turn of the 20th century, \citeauthor{hilbert1903grundlagen} performed a double service. In his **\citetitle{hilbert1903grundlagen}** (1899) he re-axiomatised Euclid — the first complete, rigorous rebuild of the *Elements* in 2,200 years — and in doing so made "geometry" mean *any* formal system that satisfies the axioms: "point", "line" and "plane" need no longer be Greek diagrams, they can stand for anything that obeys the rules \cite{hilbert1903grundlagen}. That is the modern meaning of a *space*: not a fixed stage, but any domain in which the axioms hold. And in the same era, in his work on integral equations (with *Erhard Schmidt*), Hilbert exhibited the space that matters most to machines: a **Hilbert space** — a vector space of *functions* or feature vectors, equipped with a dot product and a length, in infinitely many dimensions. The dot product and the cosine of Section V survive unchanged; only the list of coordinates runs longer than $x, y, z$. The plane geometry of Euclid became, from then on, one special case among uncountably many.

### The kernel trick: climb a dimension to draw a line

The first *practical* payoff of higher-dimensional geometry came inside machine learning itself. Some data simply cannot be separated by a straight line in the plane. But lift the points by a map $\phi$ into a higher-dimensional space, and a *hyperplane* up there separates them cleanly. **Support-vector machines** (\citeauthorlastnameand{boser1992svm}, \citeyear{boser1992svm}) made this precise in the most economical way possible \cite{boser1992svm} \cite{vapnik1995book}: the learned classifier is defined entirely by dot products $\langle \phi(\mathbf{x}), \phi(\mathbf{y}) \rangle$, so instead of ever writing the high-dimensional coordinates — which may even be infinite — one supplies a **kernel** that returns that dot product directly,
$$\underbrace{k(\mathbf{x},\mathbf{y})}_{\substack{\text{the kernel: a single number}\\\text{we are allowed to compute}}} \;=\; \underbrace{\big\langle \phi(\mathbf{x}),\, \phi(\mathbf{y}) \big\rangle}_{\substack{\text{the dot product of the two}\\\text{points after lifting them}\\\text{into the high-dimensional space}}}$$
so the high-dimensional coordinates never have to be written down at all. The **Gaussian (RBF)** kernel, in particular, corresponds to a Hilbert space of *infinite* dimension, in which any data set free of exact-duplicate contradictions is separable. The intuition of \citeauthorlastnameand{vapnik1963pattern} in the 1960s, made computable by the 1990s "kernel trick", is thus an engineering use of Riemann's and Hilbert's century: *if the flat space is too small to draw the line, climb to a roomier one — without ever paying to write the extra coordinates.*

### Concentration of measure: high dimensions are not the plane writ large

Here is where 20th-century insight overturns a two-thousand-year-old intuition. The Greeks reasoned in two and three dimensions, where "distance" behaves as it appears to. In high dimension it does not — and the failure is at once the **curse** and the **opportunity** of machine learning:

* **The shell effect.** In $\mathbb{R}^{d}$, essentially all of the volume of a sphere or cube lies within an $\epsilon$-thin shell of its surface: the fraction of the cube within distance $\epsilon$ of its surface is
$$\underbrace{1}_{\substack{\text{the whole volume}\\\text{(all of it, = 100\%)}}} - \big(1 - 2\epsilon\big)^{d} \;\approx\; \underbrace{1}_{\substack{\text{indistinguishable from}\\\text{all of it, once }d\text{ is large}}} \qquad \text{with } \epsilon \text{ the shell thickness and } d \text{ the dimension}$$
A "random point" drawn from a high-dimensional cloud is therefore almost surely *on its boundary*, not in its interior.
* **Near-orthogonality.** The dot product of two independent random unit vectors has mean $0$ and standard deviation
$$\underbrace{\frac{1}{\sqrt{d}}}_{\substack{\text{the typical spread:}\\\text{tiny once the dimension}\\\text{grows large}}}$$
In an embedding space with $d \approx 2000$, that spread is about $0.02$: two random directions are *almost exactly perpendicular*, in every practical sense.
* **Distance concentration.** The *relative* gap between the nearest and the farthest neighbours shrinks: the standard deviation of pairwise distances of a random sample becomes comparable to (or smaller than) the mean, so a cloud of random points "becomes equidistant" in relative terms.

Part of this is the famous **"curse of dimensionality"** of \citeauthor{bellman1957dynamic}, the price of living in more and more coordinates: raw Euclidean distance among random points stops carrying information \cite{bellman1957dynamic}. But the *near-orthogonality* half of the curse is also the opportunity. If thousands of directions are all mutually near-perpendicular, there is *room* for thousands of mutually distinct notions — which is precisely why a semantic space can park thousands of words in nearly separate directions, and why "meaning" must be read by **direction** (cosine similarity, Section V) rather than by raw distance. High dimensions do not ruin distance; they *retire it* in favour of angle.

### The manifold hypothesis: data does not fill space

The resolution of the curse is the most consequential bet in modern geometry-for-AI: **data does not fill the space it is written in.** A natural image is a vector in a pixel space of dimension
$$\underbrace{3}_{\substack{\text{colour channels}\\\text{(red, green, blue)}}} \times \underbrace{256}_{\substack{\text{pixels along}\\\text{one side}}} \times \underbrace{256}_{\substack{\text{pixels along}\\\text{the other side}}} \;\approx\; \underbrace{200{,}000}_{\substack{\text{a 200-thousand-}\\\text{dimensional point}}};$$
but a random vector in that space is grey noise, not a face. Real images, speech, and indeed the semantic embeddings of [the Embeddings](embeddinglab) chapter are confined to a **low-dimensional manifold** — a curved sheet — embedded in the huge ambient space \cite{manifold_wiki}. The **manifold hypothesis** claims that the datasets that matter lie on or near such a manifold, and that its *intrinsic dimension* is far below the ambient one. The scaffolding is classical: \citeauthorlastnameand{whitney1936manifolds}'s theorem (1936) that any smooth $d$-dimensional manifold can be embedded in $\mathbb{R}^{2d+1}$,
$$\underbrace{M}_{\substack{\text{the manifold: a curved}\\\text{sheet of dimension }d}} \;\hookrightarrow\; \underbrace{\mathbb{R}^{2d+1}}_{\substack{\text{the ambient space: about}\\\text{twice the dimension is}\\\text{always enough}}}$$
\cite{whitney1936manifolds} — which quietly guarantees that the "embed" in *embeddings* is not a metaphor but a proven fact.

The hypothesis is what a dozen standard tools *assume*, and it explains why they work:

* **Autoencoders** bottle every sample through a few dozen numbers and rebuild it; the encoder is literally *computing coordinates on the manifold*, the decoder *evaluates the sheet at those coordinates* \cite{hinton1989autoencoder}.
* **Dimensionality-reduction visualisations** — t-SNE (\citeauthorlastnameand{van2009dimensionality}, \citeyear{van2009dimensionality}) \cite{van2009dimensionality} and UMAP (\citeauthorlastnameand{mcinnes2018umap}, \citeyear{mcinnes2018umap}) — flatten the high-dimensional cloud onto the page while preserving neighbourhoods \cite{mcinnes2018umap}, the computational heir of Mercator's flattening of the sphere (Section VI), now for a surface whose dimension we must first *infer*.
* **Interpolation and vector arithmetic work.** On the (locally near-flat) sheet, a weighted average of two points remains on the sheet — which is why "king − man + woman ≈ queen" and why morphing two images through the manifold yields meaningful intermediates. If data filled its ambient space, every averaged point would be noise; that it does not is the entire reason "vector semantics" has a geometric meaning.
* **Only the intrinsic dimension matters.** A million-pixel image is, for geometry, a point on a sheet of perhaps a few dozen intrinsic dimensions; all the "wasted" coordinates are directions *off the data*, which is why the models can confidently ignore the noise directions that dominate the ambient space.

### Geometric deep learning: the shape of the input dictates the machine (2021)

The newest chapter folds the old question back onto the machine itself. **Geometric deep learning**, as systematised by \citeauthorlastnameand{bronstein2021geometric} (2021), observes that the *architecture* of every successful neural network is a footprint of the *symmetries of the space its data lives on* \cite{bronstein2021geometric}:

* **CNNs** live on a *regular grid*, and they are translation-equivariant by construction: the same filter slides to every cell of the grid, because on a grid every cell is geometrically the same as every other.
* **Graph networks** live on a *set with edges* (molecules, social networks), and their aggregations are permutation-equivariant, because the ordering of nodes is a convention of the file format, not a fact about the data.
* **Transformers** live on a *complete set of tokens*: attention weighs every token against every other regardless of position — which is exactly why they needed the hand-added *positional encodings* you read about in the [History of AI](history) chapter. Ordered or not, the data's geometry is a design choice the architect must either respect or repair.

The three architectures of modern AI are therefore not arbitrary inventions: they are three answers to "in what space does this data live?", answered with the same 2,400-year-old strategy — *match the structure of the stage*. This is the computing-age fulfilment of the chapter's opening line: geometry is a living subject, and now it literally determines the shape of the computer that learns.

And one recent, mildly startling data point closes the loop with Section III. \citeauthorlastnameand{huh2024platonic} (2024) found empirically that very different models, trained on different tasks, converge to **approximately the same internal representation** of the visual world \cite{huh2024platonic} — a shared latent "geometry of reality" that seems to be learned, not invented, by whichever learner is pressed against the same visual data. Whether that shared space is *the* true one is an open question — but it is hard to read the **Platonic representation hypothesis** as anything but the *Meno* argument, stated in 2024 computer science: there is a single latent geometry behind appearances, and "learning" is the process of *recovering* it.
</div>

<div class="md">
## X. A century that erased the points

**What motivated erasing the points themselves?** The strangest productive unease in the history of mathematics: coordinates had turned space into bookkeeping without saying anything about what a space *means* — and the 20th century found that the meaning only survives once the points themselves are allowed to go. Section VIII ended with a proof of Poincaré's conjecture; the century between Poincaré's question (1895) and Perelman's answer (2003) is itself a history of geometry, and it is the shortest way to see what "space" came to mean. In the 20th century topology stopped being the study of rubber surfaces and became the mathematics of *relations*; and in the hands of **\citeauthorlastnameand{grothedieck_res}** (1928–2014) the very notion of a space was rebuilt as the mathematics of *what a space can mean* \cite{grothedieck_res}. This history never appears in a forward pass of a machine, and that is precisely the point: it is where "space" stopped meaning "the room you live in" and came to mean "any world of points whose relationships can be written down" — which is exactly what an embedding space is.

### Brouwer and Noether: numbers become groups

Poincaré's *Analysis Situs* counted holes as *numbers*, the Betti numbers $b_{k}$ \cite{poincareanalysissitus}. Two people turned counting into structure. **\citeauthorlastnameand{brouwer1911fixed}** (1881–1966) found the first genuinely *algebraic* invariants of continuous maps — the **degree** of a map (how many sheets it lays over its image, with sign) and his celebrated **fixed-point theorem** of 1911: every continuous map of a closed ball to itself leaves some point alone:
$$\underbrace{f}_{\substack{\text{any continuous map:}\\\text{you may fold or stretch it}}} \big( \underbrace{x}_{\substack{\text{some point}\\\text{of the ball}}} \big) \;=\; \underbrace{x}_{\substack{\text{the same point,}\\\text{left unmoved}}} \qquad \text{(i.e.\ the equation } f(x)=x \text{ has a solution)}$$
The weirdly strong content is all on the left: the map on the whole ball could send the centre anywhere, yet *some* point must land exactly on itself \cite{brouwer1911fixed}. The strange power of the theorem is that it is *topological*: the map may be folded or stretched any way you like, yet it cannot push every point away from itself. It also carried a quiet philosophy that runs through the whole century: to distinguish maps from one another, attach to each an *algebraic* number and compare equations, not diagrams.

The decisive step came when **Emmy Noether** — visiting Brouwer's home in Blaricum in December 1925 — pointed out that the Betti numbers were not numbers at all but the *ranks of groups*. A "hole of dimension $k$" is not a count; it is the group $H_{k}$, and two spaces differ when their hole-groups differ \cite{mclarty2006noether}. This one remark ("Betti numbers are the ranks of homology groups") turned topology into **algebraic topology**: shape, from then on, was to be studied by the algebra that summarises it — the same move the [Embeddings](embeddinglab) chapter makes when it replaces a word by a vector and studies the *numbers attached to it*.

### Morse: one function carries the whole shape (1929)

Poincaré had counted the holes of a space; \citeauthorlastnameand{morse1929foundations} (1892–1977) turned the question inside out and gave geometry one of its most used tools. Instead of asking "what holes does this space have?", Morse asked the question this course keeps asking of every landscape, physical or learned: *if you may only watch a single function $f$ moving over an unfamiliar space — a height, an energy, a cost — what does that one function reveal about the whole shape?* His answer, the **calculus of variations in the large**, is that for any ordinary smooth function the **critical points** decide everything \cite{morse1929foundations}: the peaks, pits and saddles of $f$ (the places where its slope vanishes) are the only places where anything happens. Between two of them the level set $\{f = c\}$ drifts without changing its shape, and the moment the level crosses a critical point, exactly one **handle** is glued onto the space — a $k$-dimensional handle for a critical point with exactly $k$ independent downhill directions. The whole space is assembled, one handle per critical point:
$$\underbrace{M}_{\substack{\text{the whole space:}\\\text{the mountain you walk on}}} = \bigcup_{\substack{\text{critical}\\\text{points}}} \underbrace{\text{one }k\text{-dimensional handle}}_{k\ \text{independent downhill directions}}$$
The pay-off is the **Morse inequalities**, one line that couples what you can measure with what you want to know:
$$\underbrace{\#\{\text{critical points of index } k\}}_{\substack{\text{peaks, passes and pits}\\\text{counted by severity}}} \;\ge\; \underbrace{b_{k}}_{\substack{\text{the }k\text{-th Betti number:}\\\text{how many }k\text{-holes}}}$$
\cite{morse1929foundations}. The shape of the landscape is forced by the function that crosses it, never the other way around: the function is free, and the *topology* is its consequence.

And this is where Morse's abstract century rejoins the machine \cite{morse1929foundations}. A network never "sees" its embedding space; it moves downhill on **one** function — the **loss** — defined on a manifold of millions of dimensions, and gradient descent is gradient *flow* on that function, directed toward its critical points. Every minimum a training run settles into, every saddle it has to escape, is a critical point of an enormous loss landscape. Morse's theorems are the guarantee that such a thin source — a single scalar field over a space of millions of dimensions — still carries the whole geometry: study the critical points of the loss, and you are studying the shape of every space a model can reach.

### Hopf and de Rham: two grammars for the hole (1931)

The two theorems of 1931 teach how topology and analysis became one language. **\citeauthorlastnameand{hopf1931fibration}** discovered the **Hopf fibration** $S^{3}\to S^{2}$ — a continuous map from the 3-sphere onto the ordinary sphere that is *essential*: it cannot be deformed to a constant map, even though every loop in $S^{3}$ contracts:
$$\underbrace{\pi_{1}(S^{3})}_{\substack{\text{loops on the 3-sphere:}\\\text{all of them shrink to a point}}} = 0 \qquad \text{yet} \qquad \underbrace{\pi_{3}(S^{2})}_{\substack{\text{ways to wrap the 3-sphere}\\\text{around the 2-sphere}}} \cong \underbrace{\mathbb{Z}}_{\substack{\text{a whole number:}\\\text{one distinguishing integer}}}$$
\cite{hopf1931fibration}. Its construction is pure algebra: write a point of $S^{3}$ as a pair of complex numbers $(z_{1}, z_{2})$ lying on the unit sphere in $\mathbb{C}^{2}$,
$$\underbrace{\lvert z_{1}\rvert^{2}}_{\substack{\text{squared size of}\\\text{the first coordinate}}} + \underbrace{\lvert z_{2}\rvert^{2}}_{\substack{\text{squared size of}\\\text{the second coordinate}}} = \underbrace{1}_{\substack{\text{fixes the radius:}\\\text{the unit 3-sphere}}}$$
and send it to the ratio $z_{1}/z_{2}$ on the Riemann sphere; the fibre over each ratio is a full circle, and the whole ball collapses to those interlocking circles. Hopf discovered it in 1931 while asking, in effect, a question that would have seemed mad to the 19th century — "can a higher-dimensional ball be wound around a lower-dimensional one in a way that is impossible to undo?" — and its message, that attached to every continuous map is a *counting number* that can be nonzero, is the seed of the homotopy groups that structure the modern theory of data.

That same year **\citeauthorlastnameand{derham1931}** proved the complementary statement, which reads like a dictionary between two dialects: the topology of *chains* (Section VIII's way of counting holes) and the analysis of *differential forms* declare the same answer,
$$\underbrace{H_{\mathrm{dR}}^{k}(M)}_{\substack{\text{holes detected by calculus:}\\\text{closed differential forms}}} \;\cong\; \underbrace{H^{k}(M)}_{\substack{\text{holes detected by counting}\\\text{loops and chains (topology)}}}$$
\cite{derham1931}. What de Rham showed is that a hole can be detected either by drawing loops or by checking whether certain integrals vanish on every closed form — calculus and topology measure the same shape.

### Chern and Whitney: measuring the twist (mid-century)

One more kind of invariant completed the picture. Curvature measures how a surface bends; **characteristic classes** measure how a *family of spaces attached along a base* — a fibre bundle — is twisted. **\citeauthorlastnameand{chern1946}** defined the **Chern classes** $c_{1}, c_{2}, \ldots$ of a complex vector bundle, with
$$\underbrace{c_{k}}_{\substack{\text{the }k\text{-th Chern class:}\\\text{a hole that records the twist}}} \in \underbrace{H^{2k}(M)}_{\substack{\text{holes of dimension }2k\\\text{in the base space }M}}$$
whose nonzero components record the genuine obstructions to straightening the family \cite{chern1946}. The lineage runs straight from Gauss: the classical **Gauss–Bonnet theorem**,
$$\underbrace{\iint_{M}\;\underbrace{K}_{\substack{\text{Gaussian curvature}\\\text{at each point}}} \; dA}_{\substack{\text{sum up the bend}\\\text{over the whole surface}}} \;=\; \underbrace{2\pi}_{\substack{\text{a universal constant}\\\text{(merely a scale)}}} \; \underbrace{\chi}_{\substack{\text{the Euler characteristic:}\\\text{a whole number fixed}\\\text{by the topology}}}$$
the integral of curvature of Section VII is a whole number fixed by the topology — is itself the statement that "the top characteristic class evaluates to the Euler characteristic" \cite{docarmo} \cite{chern1946}. Chern's 1944 paper gave an intrinsic proof of the general Gauss–Bonnet theorem (found independently by Allendoerfer and Weil in 1943) so natural that it became the standard; it is one of the few times the "why does this integer exist?" question has a genuinely topological answer.

### Milnor, Smale, and the shape of the penalty (1956–1963)

Then came the shock that the 20th-century "counting of shapes" could not be an infinite ladder, and that the objects in it could be *more* numerous than the dimensions suggest. **\citeauthorlastnameand{milnor1956exotic}** exhibited a manifold homeomorphic to the 7-sphere but *not* diffeomorphic to it: topologically a sphere, differentiably *another object* — there are 28 such **exotic spheres** in dimension 7, and, farther out, thousands \cite{milnor1956exotic}. The consequence is central: "continuous" and "smooth" are not the same relation, and the difference is measured in whole numbers — the same counting that, in a high-dimensional embedding space, decides how many genuinely distinct directions the geometry has.

**\citeauthorlastnameand{smale1961hccobordism}** then proved, in 1961, the **h-cobordism theorem** in dimensions $\ge 5$: two simply-connected and sufficiently *flat-between* manifolds are diffeomorphic, and — as a corollary — the Poincaré conjecture holds in all dimensions $n\ge 5$ \cite{smale1961hccobordism}. In 1963 **\citeauthorlastnameand{atiyahsinger1963}** proved the **index theorem**: for an elliptic operator $D$ the difference between the dimension of its kernel and of its cokernel — an analytic quantity — equals a purely topological one:
$$\underbrace{\mathrm{ind}(D)}_{\substack{\text{the analytic index:}\\\text{solutions minus constraints}}} \;=\; \underbrace{\mathrm{ch}(\sigma_{D})\,\mathrm{Td}(M)[M]}_{\substack{\text{the topological index:}\\\text{characteristic classes of }M\\\text{(Chern character and Todd class)}}}$$
\cite{atiyahsinger1963}. This is the theorem that makes "number of solutions minus number of constraints" computable from the shape of the space — the same pattern the kernel trick of Section IX exploits in reverse, when it computes with a function without ever writing its high-dimensional coordinates.

### Thurston, Freedman, Donaldson: dimension three and four (1982–1983)

If the Poincaré conjecture is the mountain, the surrounding terrain is the **geometrisation program** of **\citeauthorlastnameand{thurston1982geometrization}** (1978–1982): every closed 3-manifold should be cut along spheres and tori into pieces, each carrying one of *exactly eight* homogeneous geometries readable from the shape of the space — the round $S^{3}$, flat $\mathbb{R}^{3}$, hyperbolic $\mathbb{H}^{3}$, and five more (the fibred geometries $S^{2}\times\mathbb{R}$, $\mathbb{H}^{2}\times\mathbb{R}$, $\mathrm{Nil}$, $\mathrm{Sol}$, and $\widetilde{\mathrm{SL}}(2,\mathbb{R})$) \cite{thurston1982geometrization}. Thurston's extraordinary claim was that "almost all" 3-manifolds are hyperbolic — a prediction later given substance by the fact that most knot complements carry that geometry. Perelman's Ricci-flow proof of the whole programme (2002–2003) is the cleanest modern statement: given the geometry, the topology is forced \cite{perelmanpoincare} \cite{weeksshapespace}.

Dimension four went differently, and here the (later) help of physics is real. **\citeauthorlastnameand{freedman1982topology}** (1982) classified *topological* closed simply-connected 4-manifolds: after Freedman they are completely determined by their intersection form (a symmetric unimodular integral form) together with the Kirby–Siebenmann invariant, and *every* such even form is realised — so there is exactly one topological manifold for each, an enormous list \cite{freedman1982topology}. But **\citeauthorlastnameand{donaldson1983gauge}**, a 26-year-old at the time, proved in 1983 that among *smooth* 4-manifolds only the diagonal forms occur — using the solutions of the Yang–Mills equations (gauge theory), i.e. *partial differential equations constraining smooth topology* \cite{donaldson1983gauge}. Together the two theorems leave the scandal of their subject: $\mathbb{R}^{4}$ itself admits *uncountably many* exotic smooth structures (Taubes, 1987; the first came from Freedman's own ideas), even though in every other dimension there is only one. Dimension 4 is where "space" and its smooth model permanently diverge — a reminder that in high dimensions the answer "the geometry exists" and "the geometry is computed" can genuinely differ.

### Grothendieck: the space revealed by its functions

\marginfig{grothendieck.jpg}{Alexander Grothendieck (1928–2014). Photograph courtesy of the \citeauthor{grothendieck_image}.}

No-one bent the word "geometry" further and to greater effect than **\citeauthor{grothedieck_res}** (1928–2014), and a short personal history is worth it: born in Berlin to a Russian anarchist father (Sascha Schapiro) and a German journalist mother, he grew up as a refugee: internment camps in southern France, then, self-taught, he walked into French mathematics as an adult and within two decades rebuilt most of its foundations \cite{grothedieck_res}. His ruling idea: a space is not its points, but the *functions* admitted to live on it. A **scheme** is a space whose "points" are not locations but *solutions of polynomial equations*; a **topos** is a space so general that it may have no points at all — it is recorded by the sheaves of functions that can be planted in it, and the space itself is defined *by those functions* \cite{grothedieck_ega1960}.

The consequences sound like pure philosophy and are pure mathematics. The prime numbers become the points of a *line*: the scheme $\mathrm{Spec}\,\mathbb{Z}$ records exactly one closed point for each prime, and number theory becomes the geometry of a curve — the dream, first voiced by Jacques Tits, of treating $\mathrm{Spec}\,\mathbb{Z}$ as a curve over the "field with one element", whose Riemann hypothesis would then be a theorem of geometry \cite{grothedieck_ega1960} \cite{deligne1974weil}. This is the same prioritisation the manifold hypothesis of Section IX makes: the *functions* (the measurable, computable quantities) come first, and the "space" is the shadow they cast. Grothendieck's organisational genius was of the same kind: at the IHÉS (1959–1970), where he directed the famous Séminaire, he wrote (with Dieudonné) the monumental *Éléments de géométrie algébrique*, which rewrote algebraic geometry as the study of objects — then left in 1970 in protest over the institute's military funding, refusing in 1988 the prestigious Crafoord Prize, and spending his last decades in retreat in the Pyrenean village of Lasserre, invisible to the discipline he had rebuilt \cite{grothedieck_res}. "The introduction of the digit 0 and the decimal mark", he once wrote, "were also essential steps" — a remark that ties the whole [History of AI](history) chapter's story of numerals to this one's story of spaces, and to *this* section's claim that geometry's history is the history of what *can* be written down.\sidenote{Grothendieck's retreat was a disappearance, not a retirement. By around 1990 he had cut almost every tie to the mathematical world — refusing to answer letters, destroying or scattering portions of his unpublished writings, and turning away from mathematics itself. In Lasserre he lived close to a hermit: a vegetable garden, long walks, and a serious study of wild mushrooms, on a life he had deliberately shrunk to village scale (he had long given large sums of his own money to the ecology movement *Les Amis de la Terre*, "Friends of the Earth"). When he died in 2014, in the hospital at Saint-Girons, the mathematical world learned of it like everyone else: the greatest artist of geometric space had spent his final quarter-century refusing geometry entirely.}

His own description of that method — and the honest one, since he later names it in the same pages (*l'approche de la mer*, "the approach of the sea", by submersion and dissolution rather than by force) — defines the work the way this chapter has tried to measure it: a theorem is not conquered, it is slowly dissolved \cite{grothedieck_res}:

<div class="smart-quote" data-cite="grothedieck_res" data-after="ch. 18 (La Cérémonie Funèbre), pp. 552–553">

<div class="full-quote">
Je pourrais illustrer la deuxième approche, en gardant l'image de la noix qu'il s'agit d'ouvrir. La première parabole qui m'est venue à l'esprit tantôt, c'est qu'on plonge la noix dans un liquide émollient, de l'eau simplement pourquoi pas, de temps en temps on frotte pour qu'elle pénètre mieux, pour le reste on laisse faire le temps. La coque s'assouplit au fil des semaines et des mois — quand le temps est mûr, une pression de la main suffit, la coque s'ouvre comme celle d'un avocat mûr à point ! Ou encore, on laisse mûrir la noix sous le soleil et sous la pluie et peut-être aussi sous les gelées de l'hiver. Quand le temps est mûr, c'est une pousse délicate sortie de la substantifique chair qui aura percé la coque, comme en se jouant — ou pour mieux dire, la coque se sera ouverte d'elle-même, pour lui laisser passage.
</div>

<div class="short-quote">
Don't hammer the shell. Soak the nut — the "approach of the sea", by submersion and dissolution and time — and when the time is ripe, a pressure of the hand suffices: the shell opens of its own accord, to let the kernel through.
</div>

</div>

### Deligne: the Riemann hypothesis over finite fields (1974)

The proof that this "space without points" was not an indulgence came in 1974, when **\citeauthorlastnameand{deligne1974weil}** proved the last and deepest of the **Weil conjectures** \cite{weil1949numbers}. Counting the solutions of polynomial equations over finite fields defines, for a variety $X$, the zeta function $\zeta_{X}(s)$; Weil (1949) predicted that it satisfies — like Riemann's $\zeta(s)$ — a rationality, a functional equation, and a "Riemann hypothesis": the zeros lie on a symmetry line, equivalently the eigenvalues satisfy
$$\lvert \underbrace{\alpha_{i}}_{\substack{\text{the eigenvalues of the}\\\text{counting operation, at}\\\text{level }i}} \rvert \;=\; \underbrace{q^{i/2}}_{\substack{\text{square root of the fields'}\\\text{size, to the }i\text{-th power}}}$$
\cite{deligne1974weil}. Grothendieck had restructured the very counting as cohomology (the famous $l$-adic sheaves), and Deligne's proof — completed in the pages of one IHÉS volume — settled it. Where Gauss, Riemann and Weil climbed, the Grothendieck school built a *language* in which the climb was guaranteed \cite{deligne1974weil} \cite{grothedieck_ega1960}. That is, in miniature, the whole lesson of this chapter for the machine: by the 1970s, "geometry" meant "the language in which the world's relations could be written", and every later application — embeddings, manifolds, kernels, geometric deep learning — is the same language put to work on the space of ideas.
</div>

<div class="optional md" data-headline="A compact timeline">
* **c. 1.76 Ma** — Acheulean handaxe: the first 3-D form, bilateral symmetry held in a mental template \cite{achleuleankariandusi}.
* **c. 500,000 BCE** — Trinil shell: oldest deliberate geometric incision \cite{trinilshell}.
* **c. 43,000 / 18,000 BCE** — Lebombo and Ishango bones: quantity as a spatial pattern \cite{lebombobone} \cite{ishangobone}.
* **c. 75,000 BCE** — Blombos ochre: abstract grid patterning \cite{emergenceofmodernhumanbehaviour}.
* **c. 1650 BCE** — Rhind Papyrus: Egyptian areas, the circle rule $\pi\approx 256/81$, and the frustum volume $V=\tfrac{h}{3}(a^{2}+ab+b^{2})$ \cite{rhindpapyrus}.
* **c. 1900–1600 BCE** — Si.427 and Plimpton 322: Babylonian surveying geometry, Pythagorean triples \cite{si427} \cite{plimpton322}; BM 85200 + VAT 6599, Db2-146 \cite{hoyrup2021algebra}; scribe-school geometry exercises \cite{historyofmath_wikipedia} \cite{susa_geometry_tablet}.
* **c. 800 BCE** — Śulba Sūtras: the fire-altar geometry and a five-decimal $\sqrt{2}$ \cite{sulbasutras}.
* **c. 1st c. BCE** — Jiuzhang Suanshu: Chinese metric geometry, the trapezoid area, and negative numbers \cite{jiuzhangsuanshu}.
* **c. 600–500 BCE** — Thales (angle in a semicircle) and the Pythagoreans (first proof of $a^{2}+b^{2}=c^{2}$; discovery of $\sqrt{2}\notin\mathbb{Q}$) \cite{heathgreekmath}.
* **c. 400 / 370 BCE** — Hippocrates' lunes; Eudoxus's method of exhaustion \cite{heathgreekmath}.
* **c. 250 BCE** — Archimedes: $V_{\text{sphere}}=\tfrac{4}{3}\pi r^{3}$, $S=4\pi r^{2}$ \cite{heathgreekmath}.
* **c. 380 / 375 BCE** — Plato's *Meno* and *Republic*: geometry as a path to the Forms \cite{platomeno} \cite{platorepublic}.
* **c. 350 BCE** — Aristotle's *Physics*: place, continuity, the three principles \cite{aristotlephysics}.
* **c. 300 BCE** — Euclid's *Elements*: the axiomatic system, I.47 the Pythagorean theorem \cite{euclidelements}.
* **1st c. CE** — Heron's formula $A=\sqrt{s(s-a)(s-b)(s-c)}$; Menelaus's *Sphaerica* (spherical geometry) \cite{heronmetrica} \cite{menelaussphaerica}.
* **c. 215 BCE** — Apollonius's *Conics*: the ellipse, parabola and hyperbola \cite{apolloniusconics}.
* **c. 140 BCE** — Hipparchus' table of chords; the 360° circle and the sexagesimal division of angles \cite{hipparchuschords} \cite{ptolemyalmagest}.
* **499 CE** — Aryabhata's *Aryabhatiya*: the sine (*jya*) becomes a function of the angle \cite{aryabhatiya}.
* **c. 820 CE** — al-Khwārizmī: *al-jabr*, completing the square \cite{hoyrup2021algebra}.
* **c. 1021 CE** — Ibn al-Haytham's optics: the law of reflection and the geometry of projection \cite{alhazenoetic}.
* **c. 1265 CE** — al-Tusi: the six trigonometric functions and the (spherical) law of sines, trigonometry as its own subject \cite{altusitrig}.
* **c. 1400** — Madhava of Sangamagrama (Kerala): the power series for sine, cosine and tangent, $\sin x = x - x^{3}/3! + \cdots$ \cite{madhava}.
* **1435 / 1569 / 1637 / 1639** — Alberti (perspective), Mercator (conformal map), Descartes (analytic geometry), Desargues (projective geometry) \cite{albertidepictura} \cite{mercatoratlas} \cite{descartesgeometrie} \cite{desarguesbrouillon}.
* **1609 / 1687** — Kepler (planetary ellipses) and Newton (conics as orbits) \cite{keplerastronomianova} \cite{newtonprincipia}.
* **1731** — the sextant (Hadley and Godfrey): a star's angle, plus the time, fixes a position at sea \cite{sextanthistory}.
* **1736 / 1752** — Euler: Königsberg bridges (graph theory) and $V-E+F=2$ \cite{eulerbridges} \cite{eulersolids}.
* **1827** — Gauss's Theorema Egregium (intrinsic curvature) and, via Gauss–Bonnet, $\iint K\,dA = 2\pi\chi$ \cite{gaussdisquisitiones} \cite{docarmo}.
* **1829 / 1837** — Lobachevsky and Bolyai: hyperbolic geometry, triangle area $=\pi-(A+B+C)$ \cite{lobachevskygeometry} \cite{bolyaiappendix}.
* **1854** — Riemann: manifolds and the general metric $ds^{2}=g_{\mu\nu}dx^{\mu}dx^{\nu}$ \cite{hypothesengeometrie}.
* **1858 / 1847** — Möbius's band; Listing's *Vorstudien zur Topologie* \cite{mobiusband} \cite{listingtopologie}.
* **1895** — Poincaré's *Analysis Situs*: fundamental group, homology, the Poincaré conjecture \cite{poincareanalysissitus}.
* **2002–2003** — Perelman proves the Poincaré conjecture via Ricci flow \cite{perelmanpoincare}.
* **1899 / 1903** — Hilbert: *Grundlagen der Geometrie* — geometry as a formal axiomatic system, "points" need no longer be diagrams \cite{hilbert1903grundlagen}.
* **1936** — Whitney: any smooth $d$-dimensional manifold embeds in $\mathbb{R}^{2d+1}$ — the theorem behind "embeddings" \cite{whitney1936manifolds}.
* **1911 / 1925** — Brouwer's fixed-point theorem (algebraic topology's first tool); Noether at Blaricum turns Betti numbers into *groups* \cite{brouwer1911fixed} \cite{mclarty2006noether}.
* **1929 / 1930 / 1934** — Morse: the topology of a space read from the critical points of one function — the ancestor of reading a machine's loss landscape \cite{morse1929foundations}.
* **1931** — Hopf's fibration $S^{3}\to S^{2}$ ($\pi_{3}(S^{2})\cong\mathbb{Z}$); de Rham's theorem, calculus and chains counting the same holes \cite{hopf1931fibration} \cite{derham1931}.
* **1944 / 1946** — Chern: characteristic classes, the Gauss–Bonnet theorem made intrinsic \cite{chern1946}.
* **1956** — Milnor's exotic 7-spheres: homeomorphic but not diffeomorphic \cite{milnor1956exotic}.
* **1961** — Smale's h-cobordism theorem, the Poincaré conjecture in dimensions $\ge 5$ \cite{smale1961hccobordism}.
* **1963** — Atiyah–Singer index theorem: analysis measured by topology \cite{atiyahsinger1963}.
* **1970 / 1974** — Grothendieck leaves the IHÉS over military funding; Deligne proves the Weil conjectures (the "Riemann hypothesis over finite fields") \cite{grothedieck_res} \cite{deligne1974weil}.
* **1982 / 1983** — Thurston's geometrisation programme; Freedman's classification of topological 4-manifolds; Donaldson's gauge-theoretic theorem — and exotic $\mathbb{R}^{4}$s by the uncountably many \cite{thurston1982geometrization} \cite{freedman1982topology} \cite{donaldson1983gauge}.
* **1957** — Bellman coins the "curse of dimensionality" \cite{bellman1957dynamic}.
* **1963 / 1992 / 1995** — Vapnik–Chervonenkis, Boser–Guyon–Vapnik, Cortes–Vapnik: the kernel trick and support-vector machines — nonlinearity by climbing dimensions \cite{vapnik1963pattern} \cite{boser1992svm} \cite{vapnik1995book}.
* **2006 / 2009 / 2018** — bottleneck autoencoders, t-SNE, UMAP: the manifold hypothesis turned into working tools \cite{hinton2006} \cite{van2009dimensionality} \cite{mcinnes2018umap}.
* **2021** — Geometric Deep Learning: the data's symmetry space dictates the network architecture \cite{bronstein2021geometric}.
* **2024** — Platonic Representation Hypothesis: unrelated models converge on a shared internal geometry of reality \cite{huh2024platonic}.
</div>
