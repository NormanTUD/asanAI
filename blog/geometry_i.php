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

The oldest geometric objects we have are not calculations at all. They are *patterns* — marks made by a hand that was doing something else (shaping a tool, decorating, keeping score), where a deliberate regularity shows up anyway. That regularity is the first thing: the sense that *the same shape* can be repeated, and that repeating it is meaningful. No one sat down to invent geometry; geometry is what a pattern-making mind leaves behind when it is not, strictly, being *about* geometry at all.

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

### Tally bones: Lebombo and Ishango

If the shell and the ochre mark the birth of *form*, the **Ishango bone** and the earlier **Lebombo bone** mark the birth of *counting* as a spatial act: quantities are not held in the mind, they are laid out as marks in a row, and rows as *groupings* in the plane \cite{ishangobone} \cite{lebombobone}. Geometry and arithmetic are born in the same gesture — a number is a *shape* of marks, and a shape is a *count* of something.

<figure>
	<img style="width: 100%" src="ishango.jpg" alt="The Ishango bone" />
	<figcaption class="md">The <cite-alternativetitle>ishango</cite-alternativetitle> is a baboon fibula of the Late Paleolithic (c. 18,000 BCE) with three columns of grouped notches \cite{ishangobone}. \citealternativetitle{ishangobonephoto}. Its groupings have been read as a lunar calendar, a base-10/60 number system, or simply a score-keeping tally — the earliest *external memory* we have.</figcaption>
</figure>

<figure>
	<img style="width: 100%" src="lebombo.jpg" alt="The Lebombo bone, a tally bone from c. 43,000 BCE" />
	<figcaption class="md">The <strong>Lebombo bone</strong> (c. 43,000 BCE, Lesotho), a hyoid bone with 29 notches arranged in groups — a <em>spatial</em> record of quantity, and a strong candidate for the oldest known counting device \cite{lebombobone}.</figcaption>
</figure>

(We return to both artifacts in the [History of AI](history) chapter, where they matter as the first *external memory*; here we only need that the notches are themselves a two-dimensional arrangement — the earliest "database" was a pattern on a bone.)
</div>

<div class="md">
## II. Measuring the land: the surveyor's equations

For most of its early history, geometry was not a body of theorems. It was a *technique of state*: the discipline of measuring fields, dividing inheritances, and erecting temples that had to be square. It appears almost simultaneously in the first great urban cultures — Egypt, Mesopotamia, the Indus Valley, China — each with its own tools and its own number system. The *why* is a single, shared, unglamorous fact: **when the river rose, the boundaries vanished.**

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

The Babylonian tradition is even richer, and even stranger, because the Babylonians thought in a **base-60 (sexagesimal)** positional system — the ancestor of our 60-second minute — and because they had no letters for "side" or "diagonal" in the way we do. Their "algebra" was, in the words of \citeauthor{hoyrup2021algebra}, a *geometric* technique: equations were solved by literally **cutting and pasting squares and rectangles** on a diagram (or in the scribe's head) \cite{hoyrup2021algebra} \cite{hoyruplengths}. The reason a base-60 system survived into our clocks is that 60 is *geometrically* convenient: it is divisible by 2, 3, 4, 5, 6 and 10, so the fractions that keep appearing when you halve a field or cut a corner come out exact.

<figure>
	<img style="width: 100%" src="si_427.jpg" alt="The Si.427 field plan, an Old Babylonian surveyor's tablet" />
	<figcaption class="md">\citealternativetitle{si427_image}, a hand-tablet from the Old Babylonian period (c. 1900–1600 BCE): a field being subdivided, its boundary lines set out with right angles made exact by Pythagorean triples.</figcaption>
</figure>

**Si.427 — the oldest applied geometry.** The clearest physical proof that this was a *surveying* discipline, not just classroom arithmetic, is the tablet **Si.427**, a field plan made by an Old Babylonian surveyor. \citeauthor{si427} traced the tablet from a 19th-century excavation record to the Archaeological Museum in Istanbul and showed that the surveyor used **Pythagorean triples** to make the boundary lines *truly perpendicular* \cite{si427} \cite{si427_baublatt}. The point is not only that it is ancient; it is that it is *before Pythagoras by more than a thousand years*. The famous 3-4-5 right triangle was a working tool of Mesopotamian land-surveyors long before it became a Greek theorem:

$$3^{2} + 4^{2} = 5^{2} \qquad (9 + 16 = 25)$$

A rectangle with sides in the ratio 3 : 4 and diagonal 5 is, by construction, a rectangle with exact right angles. The surveyor could lay it out on the ground with ropes of the right lengths and be certain the corners were square — no protractor required.

**Plimpton 322 — a table of right triangles.** The related tablet **Plimpton 322** (c. 1800 BCE) is a list of about fifteen rows of sexagesimal numbers. For a century it was dismissed as a multiplication table; \citeauthorlastnameand{plimpton322} argued that it is a systematic table of exact right-triangle ratios — a *proto-trigonometric* catalogue of the special triples a surveyor could actually use, sorted so a scribe could look up the right one for a given field \cite{plimpton322}. In both tablets the motivation is the same and the same practical one that \citeauthor{si427_baublatt} highlights: land was becoming private property, and neighbours needed *disputable, exact* boundaries \cite{si427_baublatt}.

**BM 85200 + VAT 6599 and Db2-146 — geometry in its purest form.** Two more tablets, analysed in detail by \citeauthor{hoyrup2021algebra}, show how far the "cut-and-paste" technique went \cite{hoyrup2021algebra}.

* **The excavation problem (BM 85200 + VAT 6599, problem 23).** A square pit is to be dug so that its depth exceeds its side by one *kùš*, and the volume is fixed. The scribe solves it with a table of numbers of the form $n^{2}(n+1)$ — the "equal, one added" table — that is, by working with a *cube* as the "comparison body". The modern algebraic reading is $x^{2}(x+1) = V$; the Babylonian procedure is to look up, in a memorised table, the $x$ whose cube-plus-face matches the given volume.
* **The diagonal problem (Db2-146).** Given the *diagonal* of a rectangle, $1^{\circ}15'$, and its *area*, $45'$, find the length and the breadth. The scribe "completes the square" in the standard way and arrives at length $1$ and breadth $45'$. The final lines are a *check*, and they carry, in abstract form, a clear trace of what we would now call the Pythagorean rule: the length and breadth are "raised" (squared) and their sum is checked against the diagonal, without ever naming a triangle \cite{hoyrup2021algebra}.

The engine behind both is **completing the square**, the single most important move in all of pre-modern algebra. To solve $x^{2} + bx = A$, the Babylonian (and later the Greek, the Arabic, and the European) adds the square of half the coefficient to both sides so that the left side *becomes* a square:

$$x^{2} + bx = A \quad\Longrightarrow\quad \left(x + \tfrac{b}{2}\right)^{2} = A + \left(\tfrac{b}{2}\right)^{2}$$

The right side is now a perfect square, so the scribe takes its (sexagesimal) square root and has the answer. This is *literal* square-completion: you add a little square of side $b/2$ to the L-shape (gnomon) that $x^{2}+bx$ forms, and the whole becomes one big square. Geometry *is* the algebra.

<figure>
	<img style="width: 100%" src="cuneiform.jpg" alt="Babylonian cuneiform on a clay tablet" />
	<figcaption class="md">Babylonian cuneiform — the medium of Si.427, Plimpton 322 and the BM/VAT tablets. A single clay tablet could carry a field plan, a table of right-triangle ratios, and a worked solution of a "complete the square" problem, all in the same wedge-script \cite{neugebauerexactsciences}.</figcaption>
</figure>

\citeauthor{hoyrup2021algebra} notes a remarkable after-life of the diagonal problem: the very same "given the diagonal and the area, find the sides" puzzle, with the very same solution procedure, reappears **1,900 years later** in a Hebrew mathematical handbook dated 1116 CE — a tradition that ran from Old Babylonian field-measurers, through the scribal schools, and into the medieval world \cite{hoyrup2021algebra}.

<div class="optional md" data-headline="What algebra really was">
This is the insight that separates modern scholarship from older accounts. For most of the 20th century these texts were read as *numeric* algebra: the scribe was "solving $x^{2}+x=a$". \citeauthor{hoyrup2021algebra} showed that reading is impossible to sustain, because the terminology only makes sense against a *geometric* background — the operations are additions, subtractions and multiplications of *measurable* lengths and areas, and the "quadratic completion" is a literal rearrangement of square and rectangle pieces \cite{hoyrup2021algebra} \cite{hoyruplengths}. The Babylonians did not have "algebra" and "geometry" as two subjects; they had one geometry that *happened* to compute. Euclid, a millennium later, would re-cast much of this into the axiomatic *Elements* — which is why the story now turns to Greece.
</div>

### India: the Śulba Sūtras and $\sqrt{2}$

In the Vedic tradition of India, the driving force was not the field but the **fire altar**. The altar had to be a rectangle of exactly a prescribed area, and it had to be *converted into a square* (and then into other shapes) without changing that area — a ritual requirement, because the offering had to be "of the same measure". The **\citealternativetitle{sulbasutras}** — construction manuals, the earliest of them (attributed to *Baudhāyana*) dating to roughly 800 BCE — are full of exactly this geometry \cite{sulbasutras}.

The most celebrated result is a recipe for $\sqrt{2}$. Starting from a rectangle of area 1, one "cuts off" a corner and folds in a smaller triangle (the *diagonal* operation), producing a square of the same area. The diagonal of the unit square is $\sqrt{2}$, and the *Baudhāyana Śulba Sūtra* gives it to the fifth decimal place:

$$\sqrt{2} \approx 1 + \tfrac{1}{2} + \tfrac{1}{2\cdot 3} - \tfrac{1}{2\cdot 3\cdot 5} + \tfrac{1}{2\cdot 3\cdot 5\cdot 7} \approx 1.41421569$$

The famous line, roughly, is that *"the length obtained along the diagonal makes an area equal to that made by length and width together"* — a geometric statement of $d^{2} = a^{2} + b^{2}$ made, once again, *independently* of Greece and *before* the theorem bore Pythagoras's name \cite{sulbasutras}. Here the *why* is ritual precision: an altar whose corner is off by a hair is, in the logic of the text, a failed offering.

### China: the Jiuzhang Suanshu

The Chinese tradition is anchored in the **\citealternativetitle{jiuzhangsuanshu}** (*The Nine Chapters on the Mathematical Art*), a practical compendium whose problems — land area, grain, fair distribution, earthworks — were assembled by Han-dynasty scholars (compiled c. 1st century BCE, with material older still) \cite{jiuzhangsuanshu}. Its geometry is metric and algorithmic: areas of fields of every shape, volumes of dikes and granaries, and, in the chapter on the *gougu* (the "right-angle"), the same $a^{2}+b^{2}=c^{2}$ relation, used to *find* the diagonal of a rectangle from its two sides \cite{jiuzhangsuanshu}. The *Jiuzhang* gives the trapezoidal field area $A=\tfrac{1}{2}(a+b)h$ as a standing rule, and it is also where one of the earliest clear uses of **negative numbers** appears (as book-keeping entries in a system of simultaneous linear equations), so it is a reminder that these "geometric" treatises were, in practice, the whole of a culture's applied mathematics. The *why* is the state: the *Jiuzhang* is a manual for the bureaucracy that taxed fields, paid soldiers in grain, and moved earth for canals and tombs.

A fair summary of this whole section: by the first millennium BCE, three unrelated civilisations — Mesopotamia, the Indus and China — had each invented, for the *practical* purpose of measuring the earth, the right-triangle relation, the area rules, and (in India and China) a working $\sqrt{2}$. Geometry had already travelled the world once, on the business of land, before anyone wrote a proof.
</div>

<div class="md">
## III. The Greek turn: from measuring to proving

The Greeks did not invent geometry. They did something more radical: they made it *demonstrative*. A Babylonian scribe could give you the right answer and trust the recipe. A Greek wanted to know **why it must be so, and why it cannot fail**. That single demand — for *apodeixis*, proof — is what separates the *Elements* from everything before it, and it is the habit of mind that all of modern mathematics (and, in the end, all of the formal reasoning a computer performs) inherits. The *why* is cultural: the Greeks, and the Pythagoreans in particular, believed *number* was the substance of reality ("all is number"), so a fact about number could not merely be *useful*; it had to be *necessary* — true in every possible world, not just in the field you are surveying today.

### Thales, Pythagoras and the theorem

<figure>
	<img style="width: 400px; max-width: 100%;" src="pythagoras.jpg" alt="Pythagoras of Samos" />
	<figcaption class="md">Pythagoras of Samos (c. 570–495 BCE), founder of the school that gave its name to the most famous theorem in the world.</figcaption>
</figure>

The tradition places the first proofs with **Thales of Miletus** (c. 624–546 BCE) — for example, that a circle is bisected by its diameter (Thales' theorem, *Elements* I.31) and that the angles of a triangle sum to two right angles (I.32) \cite{heathgreekmath}. Thales' theorem, in modern symbols: if $AC$ is a diameter of a circle and $B$ is any other point on it, then $\angle ABC = 90^{\circ}$. The Pythagoreans, the circle around **Pythagoras** (c. 570–495 BCE), are credited with the first *proof* of what is now named after them: in any right triangle the square on the hypotenuse equals the sum of the squares on the two legs,

$$a^{2} + b^{2} = c^{2}$$

and, more, they (allegedly) proved the converse — that a triangle with $a^{2}+b^{2}=c^{2}$ *must* be right-angled. The Babylonians and the Indians had *used* the relation for a thousand years; the Greeks *understood* it, and — for them, this was the dangerous part — the understanding led to a crisis, because they found figures (the diagonal of a square) whose side ratio could not be written as a ratio of whole numbers at all. The discovery of the incommensurable, $\sqrt{2} \notin \mathbb{Q}$, is arguably the first genuine "mathematical" result: a statement about what *cannot* be done \cite{heathgreekmath}.

### Hippocrates and Eudoxus: the method of exhaustion

**Hippocrates of Chios** (c. 470–410 BCE) is said to have been the first to "square the lunes" — to cut a crescent-shaped figure bounded by two circular arcs and show it has an area exactly equal to a plain rectilinear one \cite{heathgreekmath}. It is the first *quadrature of a curved figure*, and it points the way to the circle itself. A century later **Eudoxus of Cnidus** (c. 408–355 BCE) supplied the rigorous engine that had been missing: the **method of exhaustion**, the idea that a curved area can be pinned down by inscribing and circumscribing polygons and showing the "remainder" can be made smaller than *any* given piece. This is the ancient ancestor of the integral. Applied to the circle, it proves

$$A_{\text{circle}} = \pi r^{2}, \qquad C_{\text{circle}} = 2\pi r$$

and Euclid's *Elements* XII is built on it \cite{heathgreekmath}.

### Archimedes: exhaustion perfected

<figure>
	<img style="width: 400px; max-width: 100%;" src="archimedes.jpg" alt="Archimedes of Syracuse" />
	<figcaption class="md">Archimedes of Syracuse (c. 287–212 BCE), who perfected the method of exhaustion and computed the sphere's volume and surface with proofs that survive today.</figcaption>
</figure>

If Eudoxus gave the *method*, **Archimedes of Syracuse** (c. 287–212 BCE) gave it its masterpieces \cite{heathgreekmath}. Working with the same exhaustion engine, he computed, with proofs that survive today, the area and circumference of the circle, and then the *volumes* that were the great open problem: the sphere, the cone, the cylinder, the paraboloid and the spheroid. His results, in modern symbols,

$$V_{\text{sphere}} = \tfrac{4}{3}\pi r^{3}, \qquad S_{\text{sphere}} = 4\pi r^{2}, \qquad V_{\text{cone}} = \tfrac{1}{3}\,(\text{cylinder of same base and height})$$

The cone result is the $V=\tfrac{1}{3}Bh$ we saw in the Rhind Papyrus, now *proved*; Archimedes showed the sphere is exactly two-thirds of the cylinder that circumscribes it, a ratio he considered his finest discovery and asked to be carved on his tomb. The *why* here is not taxation but intellectual pride: Archimedes was answering the Pythagorean demand for proof at the hardest scale — three-dimensional curved bodies.

### Plato: geometry as the road to the Forms

For **Plato** (c. 428–348 BCE), geometry was not a trade; it was the *entrance examination* to philosophy. In the *Republic* the philosopher is told that "if he has not a great natural gift for geometry he will get very little from the study of it", because geometry "draws the soul towards truth" (*Republic* 527a) \cite{platorepublic}. In the *Meno* there is the famous scene in which Socrates leads an uneducated slave boy, by questions alone, to *discover* that doubling a square requires a side of $\sqrt{2}$ times the original \cite{platomeno}. The point Plato wants is the philosophical one: the boy was not *taught* the fact from outside; the shape was already, in a sense, *known* to him, and proof merely *reminded* him of it. Geometry, on this picture, is the study of what the mind already contains — the bridge between the changing world of things and the unchanging world of Forms.

The tradition also preserves the legend that Plato had written above the door of his Academy: *"Let no one ignorant of geometry enter"* — a slogan for the idea that the discipline was a *way of thinking* before it was a body of results.

### Aristotle: place, continuity and the "three principles"

\citeauthor{aristotlephysics}'s (*ca. 350* BCE) \citetitle{aristotlephysics} (Book IV) is less a geometry than a *metaphysics of space* \cite{aristotlephysics}. His question is not "how big" but "what is *where*?": he defines **place** (the *topos*) as "the innermost motionless boundary of what contains", argues that the void is impossible, and — in the *Physics* and the *Metaphysics* — lays down what he calls the three principles on which mathematics stands: the **axiom** (a self-evident proposition), the **postulate/hypothesis** (a request to suppose something), and the **definition** (a name for a thing). This threefold taxonomy is exactly the scaffold Euclid's *Elements* will use a generation later, and it is the seed of the whole modern notion of an *axiomatic theory*.

### Euclid's Elements: the machine of proof

<figure>
	<img style="width: 400px; max-width: 100%;" src="euclid.jpg" alt="Euclid demonstrating a proposition to a student" />
	<figcaption class="md">Euclid of Alexandria (c. 300 BCE) demonstrating a proposition to a student — the standard image of the man who set the template for every proof that followed.</figcaption>
</figure>

Everything before Euclid was a collection of results; the **\citealternativetitle{euclidelements}** (composed c. 300 BCE in Alexandria, the standard edition edited and translated by \citeauthor{euclidelements_heath}) is the first *system* \cite{euclidelements} \cite{euclidelements_heath}. The *why* is institutional: Alexandria was the library of the ancient world, and Euclid's book was a textbook for the students who flocked there — a way to organise *all* the known geometry into one sequence in which each result depends only on the ones before it. Its structure is as famous as its content: a short list of definitions, **five postulates** (the working rules of compass and straightedge) and **five common notions** (self-evident truths about magnitudes) from which **465 propositions** follow, each ending with the little square — the *hysteron* — that marks "it has been proved". That architecture is the template for every proof-based subject that followed:

* **Definitions** (point, line, circle, angle, …) — what the objects *are*.
* **Postulates** (five) — what you are *allowed to do* with them. The first four are self-evident constructions; the **fifth** is the **parallel postulate**: through a point not on a line there passes *at most one* line that never meets the given line. For over two thousand years this fifth postulate was treated as slightly less obvious than the others, and every attempt to "fix" it is, in retrospect, the road to non-Euclidean geometry (Section VI).
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

$$A = \sqrt{s(s-a)(s-b)(s-c)}, \qquad s = \tfrac{a+b+c}{2}$$

\cite{heronmetrica}. This is the tool a surveyor actually needed — you can measure the three sides of an irregular field on the ground, but dropping a perpendicular to get a height is often impossible. It also generalises naturally, with two sides and the included angle $C$, to $A = \tfrac{1}{2}ab\sin C$, and, replacing the sine term, to the **law of cosines**, $c^{2} = a^{2} + b^{2} - 2ab\cos C$, which is the Pythagorean theorem for *every* triangle (and reduces to it when $C = 90^{\circ}$) \cite{heronmetrica} \cite{heathgreekmath}.

**Apollonius of Perga** (c. 262–190 BCE) wrote the eight-book **\citealternativetitle{apolloniusconics}**, in which he names and classifies the **conic sections** — the ellipse, the parabola and the hyperbola — as the curves a plane cuts from a cone, and develops their full metric theory \cite{apolloniusconics}. Written in the language of coordinates that Descartes would later supply, the three conics are simply

$$\text{ellipse: } \frac{x^{2}}{a^{2}} + \frac{y^{2}}{b^{2}} = 1 \qquad \text{parabola: } y^{2} = 4ax \qquad \text{hyperbola: } \frac{x^{2}}{a^{2}} - \frac{y^{2}}{b^{2}} = 1$$

<figure>
	<img style="width: 100%" src="conic_sections.png" alt="The three conic sections: ellipse, parabola and hyperbola" />
	<figcaption class="md">The three <strong>conic sections</strong>: tilt a cutting plane against a cone and it carves out an ellipse (a shallow cut), a parabola (a plane parallel to a side), or a hyperbola (a steep cut through both nappes). All three are degree-two curves — the geometry that Descartes would turn into the $B^{2}-4AC$ sign test \cite{apolloniusconics}.</figcaption>
</figure>

The *why* is partly optical and partly astronomical. The parabola is the only conic that **focuses**: a ray sent in parallel to its axis reflects through a single point (the focus), which is why parabolic mirrors and dishes concentrate light and sound — the old legend that Archimedes burned Roman ships with a focusing mirror is a story about this. And the ellipse is the shape of an orbit: it will take **Kepler** (1609) to read the conics back into the sky and discover that planets move on ellipses with the Sun at one focus \cite{keplerastronomianova}, and **Newton** (1687) to prove that an inverse-square force *must* produce conic orbits \cite{newtonprincipia}. The conics sit, in other words, exactly at the hinge between pure geometry and the physics of the heavens.

<figure>
	<img style="width: 100%" src="antikythera.jpg" alt="The Antikythera mechanism" />
	<figcaption class="md">The Antikythera mechanism (c. 2nd c. BCE), a geared astronomical computer — the geometry of the heavens reduced to bronze gears and epicycles.</figcaption>
</figure>

**Menelaus of Alexandria** (c. 70–140 CE) wrote the **\citealternativetitle{menelaussphaerica}**, the first systematic treatise on **spherical geometry** — the geometry of the *surface* of a sphere, where the straight line is replaced by a great circle and the angles of a triangle sum to *more* than two right angles \cite{menelaussphaerica}. Menelaus' theorem is the spherical tool for astronomy (locating the stars), and it quietly plants the second seed of Section VI: *curved* space has its own, genuinely different, geometry.
</div>

<div class="md">
## IV. Transmission: the Islamic Golden Age

When the Greek world passed its knowledge eastward, it was not lost but *worked on*. In the great translation and research centres of the Islamic world — above all the **House of Wisdom** in Baghdad (8th–13th c.) — the *Elements*, the *Conics* and the astronomical treatises were rendered into Arabic, corrected, and extended. The *why* was both intellectual and legal: the new science of **algebra** was driven in part by Islamic inheritance law, which required estates to be divided into fractional shares, and by the *kharaj*, a land tax that required surveying. Figures such as **al-Khwārizmī** (c. 780–850) re-founded algebra (the very word is his, from *al-jabr*, "the restoring/completing") and did so in the *geometric* spirit inherited from Babylon and Greece, solving equations by the same cutting-and-completing-of-the-square operations \cite{hoyrup2021algebra}.

<figure>
	<img style="width: 400px; max-width: 100%;" src="alkhwarizmi.jpg" alt="Al-Khwarizmi" />
	<figcaption class="md">Muḥammad ibn Mūsā al-Khwārizmī (c. 780–850), whose treatise on <em>al-jabr</em> gave algebra its name — and whose surname gave us the word <em>algorithm</em>.</figcaption>
</figure>

Al-Khwārizmī's canonical example, in modern dress, is the problem "a square and ten times its side make thirty-nine" — $x^{2} + 10x = 39$. He completes the square: halve the ten to get $5$, square it to get $25$, add to $39$ to get $64$, take the root $8$, subtract the $5$, and obtain $x = 3$. In symbols, the move that is his legacy is exactly the Babylonian one, now general:

$$x^{2} + bx = A \quad\Longrightarrow\quad x = -\tfrac{b}{2} + \sqrt{A + \left(\tfrac{b}{2}\right)^{2}}$$

The single most important geometric achievement of the period, however, is the work of **Ibn al-Haytham** (Latinised **Alhazen**, c. 965–1040).

<figure>
	<img style="width: 400px; max-width: 100%;" src="alhazen.jpg" alt="Ibn al-Haytham (Alhazen)" />
	<figcaption class="md">Ibn al-Haytham (Alhazen), c. 965–1040, whose <em>Book of Optics</em> made geometry the mathematics of how the world projects itself onto the eye.</figcaption>
</figure>

His **\citealternativetitle{alhazenoetic}** (completed c. 1021) is a *geometry of seeing*: it treats the eye, the mirror, and the path of light as objects of rigorous geometric analysis, and famously inverts the old "emission" theory of vision by arguing that we see by light *entering* the eye along straight rays \cite{alhazenoetic}. The law he formalises is the **law of reflection**, $\theta_{\text{incident}} = \theta_{\text{reflected}}$ (measured from the normal to the surface), and the **Alhazen problem** — finding the point on a mirror where a ray from an object reflects to the eye — is a genuinely hard geometric problem that he reduces to an algebraic (in fact quartic) equation. His treatment of the **camera obscura** is the direct ancestor of both the scientific camera and the mathematics of *perspective* \cite{alhazenoetic}. It is a pivot: geometry becomes the mathematics of *projection* — of how a three-dimensional world is faithfully laid down on a two-dimensional surface.
</div>

<div class="md">
## V. Space made visible: perspective, coordinates and projection

The mathematics of projection that Alhazen opened is taken up, on the *artistic* side, by the Renaissance, and on the *mathematical* side, by the 17th century. These two streams meet in a single, decisive idea: **space can be turned into numbers**.

### Alberti and linear perspective (1435)

**Leon Battista Alberti**, in his **\citealternativetitle{albertidepictura}** (1435), gives the first *mathematical* account of **linear perspective** \cite{albertidepictura}: the picture plane, the vanishing point, and the rule that all parallel lines receding into depth appear to meet at a single point on the horizon. The *why* is the painter's: Brunelleschi and the Florentine workshops had found, by experiment, how to make a flat panel look "deep", and Alberti was the first to write down the *rule* behind the trick. In modern language that rule is a **central projection** of 3-D space onto a 2-D plane. A point $(x, y, z)$ in front of a pinhole at focal length $f$ lands on the picture plane at

$$x' = f\,\frac{x}{z}, \qquad y' = f\,\frac{y}{z}$$

a *projective* transformation. The Renaissance discovery of perspective is thus, in modern language, the birth of **projective geometry**, the geometry of what survives projection.

### Descartes and analytic geometry (1637)

<figure>
	<img style="width: 400px; max-width: 100%;" src="descartes.jpg" alt="René Descartes, by Frans Hals" />
	<figcaption class="md">René Descartes (1596–1650), painted by Frans Hals. His <em>Géométrie</em> fused algebra and geometry into a single subject.</figcaption>
</figure>

\citeauthor{descartesgeometrie}'s **\citealternativetitle{descartesgeometrie}** (1637), the final part of his *Discourse on the Method*, is the hinge on which all of later mathematics turns \cite{descartesgeometrie}. His move is the simplest and most powerful in the book of mathematics: put a **grid of coordinates** on the plane, so that every point is a *pair of numbers* and every curve is an *equation*. A line is $y = mx + c$; a circle is $x^{2} + y^{2} = r^{2}$; the conics are the degree-two equations. Geometry and algebra, which had walked in parallel for two thousand years, are now *the same subject written in two languages*. (It was **Fermat**, working independently, who developed the same idea in the same decade.)

Descartes' coordinates also give a clean *algebraic* re-statement of Apollonius' conics. Every curve of degree two in the plane satisfies

$$Ax^{2} + Bxy + Cy^{2} + Dx + Ey + F = 0$$

and the single number $B^{2} - 4AC$ — the **discriminant** — tells you which conic it is: $<0$ an ellipse (or a point, or nothing), $=0$ a parabola, $>0$ a hyperbola. Two thousand years of "cutting a cone" have become a sign test on a coefficient. From this point on, "the geometry of a thing" can be *computed* by solving "the equation of a thing" — which is, one small step removed, exactly what a neural network does when it treats a geometric object as a set of numbers and a rule as a function.

### Desargues and projective geometry (1639)

Almost simultaneously, the French engineer **Gérard Desargues**, in his **\citealternativetitle{desarguesbrouillon}** (1639), asked a different question: *which* facts about a figure are preserved when it is projected onto another plane — facts that stay true no matter how the picture is distorted \cite{desarguesbrouillon}. His **Desargues' theorem** (two triangles are in perspective from a point iff their corresponding sides meet on a line) is one of the first clean statements of **projective geometry**, the geometry that later (with Pappus, Pascal, and then Möbius, Plücker and Klein) would be recast as the geometry of *lines, points and incidence* alone, with no length or angle at all. Perspective, algebra and projection — the three threads of the 17th century — were, in retrospect, all one subject: the geometry of *how space looks*.

### Mercator: flattening the sphere (1569)

Projection was not only an art and a philosophy; it was a navigational *necessity*. In 1569 **Gerardus Mercator** published the world map that bears his name \cite{mercatoratlas}, solving a problem that had defeated cartographers: how to draw a flat chart on which a straight line is a *constant compass bearing* (a *rhumb line*), so a sailor could steer by a straight edge. His answer is a genuine piece of differential geometry, the **Mercator projection**, which stretches a latitude $\varphi$ to a vertical coordinate

$$y = \ln\!\left(\tan\!\left(\tfrac{\pi}{4} + \tfrac{\varphi}{2}\right)\right) = \operatorname{artanh}(\sin\varphi)$$

The map is **conformal** — it preserves *angles* (so compass bearings are right) at the price of wildly distorting *areas* (Greenland looks as big as Africa). It is the earliest example, in a working tool, of a deep fact we will meet in full in Section VI: that a curved surface (the sphere) can be flattened only by *distorting* it, and that the choice of *what to preserve* (angle? area? distance?) is a mathematical choice with no perfect answer.

<figure>
	<img style="width: 100%" src="mercator_1569.png" alt="Mercator's 1569 world map" />
	<figcaption class="md">\citealternativetitle{mercatoratlas}. Note how the map stretches toward the poles — Greenland and Antarctica balloon to fill the top and bottom, a visible record of the $\ln(\tan(\tfrac{\pi}{4}+\tfrac{\varphi}{2}))$ formula doing its conformal work \cite{mercatoratlas}.</figcaption>
</figure>
</div>

<div class="md">
## VI. When space bends: topology and non-Euclidean geometry

For two thousand years, "the" geometry was Euclid's, and everyone assumed that space *must* be flat — that the parallel postulate is a fact about the universe, not just a convenient assumption. The 18th and 19th centuries shattered that in two different directions at once: they found geometry *without metric* (topology), and geometry *without parallelism* (non-Euclidean space).

### Euler: the geometry of connectivity

\citeauthor{eulerbridges} (1707–1783) was the first to notice that some questions about space do not care about *distance* at all. The *why* was a parlor puzzle: the city of Königsberg (now Kaliningrad) sits on a river with an island and two branches, joined by **seven bridges**, and the local question was whether one could take a walk that crossed each bridge exactly once and returned to the start. Euler's solution (1736, published \citeyear{eulerbridges} \cite{eulerbridges}) ignored the distances entirely and counted only *which banks are connected to which*. The walk is possible only if the number of points (banks/island) with an *odd* number of bridges attached is $0$ or $2$; Königsberg had **four** such points, so no such walk exists.

<figure>
	<img style="width: 100%" src="konigsberg_bridges.png" alt="The seven bridges of Königsberg" />
	<figcaption class="md">The seven bridges of Königsberg. Euler replaced the river and the banks with four dots and seven lines, and the question became a statement about <em>degrees</em>: the sum of the degrees is always $2E$ (each edge touches two points), so the number of odd-degree vertices is even — here four, which is neither $0$ nor $2$, so the walk is impossible \cite{eulerbridges}.</figcaption>
</figure>

The problem "*ad geometriam situs*" ("regarding position") is the birth of **graph theory** and, more broadly, of the study of properties that survive stretching and tearing: **topology**.

Euler also found the first genuine topological *invariant*. For any convex solid built from flat faces (a polyhedron), the number of vertices $V$, edges $E$ and faces $F$ always satisfies

$$V - E + F = 2$$

(\citeyear{eulersolids}; the general statement in \citetitle{eulersolids}) \cite{eulersolids}. A cube ($8 - 12 + 6$), a pyramid ($5 - 9 + 5$) and an arbitrarily twisted dodecahedron all give $2$. The number $2$ is the **Euler characteristic** $\chi$ of the sphere; it is *the same for every shape that can be deformed into a sphere* and *different* for anything that cannot. Generalised, a closed surface of genus $g$ (a sphere with $g$ handles) has

$$\chi = 2 - 2g \qquad \text{(sphere: } g=0, \chi=2;\ \text{ torus: } g=1, \chi=0)$$

That a shape's identity is captured by a single *integer* — not by its angles, not by its side lengths, but by something that cannot change under continuous deformation — is the founding intuition of topology \cite{eulersolids}.

### Gauss: curvature is intrinsic

<figure>
	<img style="width: 400px; max-width: 100%;" src="gauss.jpg" alt="Carl Friedrich Gauss" />
	<figcaption class="md">Carl Friedrich Gauss (1777–1855), who while surveying Hanover found that a surface can read its own curvature from the inside.</figcaption>
</figure>

**\citeauthor{gaussdisquisitiones}** (1777–1855), while surveying the state of Hanover for a living, was led to a question that looks innocent and is profound \cite{gaussdisquisitiones}. Surveying means measuring the angles of a *triangle* of survey markers on the ground. If the Earth's surface is truly flat, the three angles always sum to $180^{\circ}$; if it is curved, the sum is *more* (the more, the larger and curvier the triangle). So a sufficiently careful survey of a sufficiently large triangle could, in principle, tell us whether *space itself* is Euclidean. That made the *parallel postulate* — the axiom that guarantees the flat angle-sum — into an **empirical** question about the physical world, which was a scandal for a subject that was supposed to be true by pure reason alone.

In the course of working out exactly how a surface curves, Gauss proved in his **\citetitle{gaussdisquisitiones}** (1827) what he called the **Theorema Egregium**, the "remarkable theorem" \cite{gaussdisquisitiones}. The Gaussian curvature

$$K = \frac{1}{R_{1} R_{2}}$$

at a point (where $R_{1}, R_{2}$ are the two principal radii of curvature — the radii of the steepest and shallowest normal sections) is *intrinsic*: it can be read off **entirely from the distances and angles measured on the surface itself**, and cannot be changed by bending the surface without stretching it. A sheet of paper bent into a cylinder has $K = 0$ everywhere (you could have rolled it from flat, so it is "still flat"); a sphere has $K > 0$; a saddle has $K < 0$. In terms of the metric coefficients $E, F, G$ of the first fundamental form,

$$K = \frac{LN - M^{2}}{EG - F^{2}}$$

so $K$ depends only on the surface's *own* measuring-stick, not on how it sits in a surrounding 3-D space \cite{gaussdisquisitiones} \cite{docarmo}.

<figure>
	<img style="width: 100%" src="theorema_egregium.png" alt="Gauss's original statement of the Theorema Egregium" />
	<figcaption class="md">Gauss's original statement of the Theorema Egregium. The message, in a phrase, is that <em>curvature is not a property of the shape embedded in a higher space, but a property of the space itself</em>, readable from within — the theorem that makes general relativity possible \cite{gaussdisquisitiones}.</figcaption>
</figure>

The Theorema Egregium has a grand descendant, the **Gauss–Bonnet theorem**, which turns curvature into *topology*. For a region $D$ of a surface with boundary, the total curvature inside plus the twist of the boundary equals a purely topological number:

$$\iint_{D} K\, dA \;+\; \oint_{\partial D} k_{g}\, ds \;=\; 2\pi\,\chi(D)$$

and for a *closed* surface the boundary term vanishes, leaving

$$\iint_{S} K\, dA \;=\; 2\pi\,\chi(S)$$

\cite{docarmo}. In words: **no matter how you bend a surface, the total curvature you can accumulate on it is fixed by how many "holes" it has.** A sphere can hold exactly $4\pi$ of curvature, a torus exactly $0$. This single formula is the master key that ties the two halves of Section VI together — curvature (Gauss) and connectivity (Euler) are the same coin \cite{docarmo}.

### Lobachevsky and Bolyai: the parallel postulate is a choice

The parallel postulate had resisted proof for 2,000 years. The breakthrough was to stop trying to prove it and to *negate* it. **\citeauthor{lobachevskygeometry}** (1792–1856) and, independently, **\citeauthor{bolyaiappendix}** (1802–1860), each discovered that if you *replace* Euclid's fifth postulate with "through a point not on a line there pass *infinitely many* lines that never meet it", a perfectly consistent geometry results — **hyperbolic (or "non-Euclidean") geometry** \cite{lobachevskygeometry} \cite{bolyaiappendix}.

<figure>
	<img style="width: 400px; max-width: 100%;" src="lobachevsky.jpg" alt="Nikolai Lobachevsky" />
	<figcaption class="md">Nikolai Lobachevsky (1792–1856), who published the first non-Euclidean geometry in 1829.</figcaption>
</figure>

The *why* is the 2,000-year hang-up on the fifth postulate itself: it had always looked less self-evident than the other four, and for two centuries mathematicians (Saccheri, Legendre, and others) had tried and failed to prove it from the rest. The daring move was to ask what happens if you *assume the opposite* — and to find not a contradiction but a *world*. In the hyperbolic plane, the angles of a triangle sum to *less* than two right angles, and the shortfall is not a bug but the *area*: for a triangle on a surface of curvature $K=-1$,

$$A + B + C \;<\; \pi, \qquad \text{Area} \;=\; \pi - (A+B+C)$$

So a triangle's area is read directly from its *angular defect*, and there is no largest triangle — the total area of the whole hyperbolic plane is finite in angular terms yet infinite in extent. (In the opposite, spherical geometry, the sum is *more* than $\pi$ and the excess is the area.) The result was shocking, because it was not a contradiction: it was a *different, equally valid, geometry of space*. The father **Farkas Bolyai** and **Gauss** (who had found the same geometry independently but never published) both recognised that the *truth* of Euclidean versus hyperbolic geometry is no longer a question of pure reason — it is, as Gauss put it, an **empirical** question, to be settled by measuring the angle-sum of a *very large* triangle in the real world. Geometry had become a question about *physical space*, not just a set of theorems.

<figure>
	<img style="width: 400px; max-width: 100%;" src="bolyai.jpg" alt="János Bolyai" />
	<figcaption class="md">János Bolyai (1802–1860), son of Farkas, who worked out the same geometry in a 1832 appendix to his father's book.</figcaption>
</figure>

### Riemann: the general idea of "space"

<figure>
	<img style="width: 400px; max-width: 100%;" src="riemann.jpeg" alt="Bernhard Riemann" />
	<figcaption class="md">\citeauthor{hypothesengeometrie} (1826–1866), whose 1854 habilitation lecture generalised the very idea of a "space".</figcaption>
</figure>

<div class="smart-quote" data-cite="hypothesengeometrieenglish">
I consider it necessary to examine in general the hypotheses on which geometry is based, and to inquire whether we cannot give a more general meaning to the proposition about the measure of extension.
</div>

\citeauthor{hypothesengeometrie}, in his 1854 habilitation lecture \citetitle{hypothesengeometrie} \cite{hypothesengeometrie}, took one final, enormous step. The *why* was to give the new geometries — Euclidean, spherical, hyperbolic — a single frame that explained *why* they all worked, and to ask what "space" even means when it is not 3-D and not flat. His answer is the **manifold** (German *Mannigfaltigkeit*, literally "many-folds") — an $n$-dimensional surface that, *locally*, looks like ordinary flat $\mathbb{R}^{n}$, but may be curved in a way that can vary from point to point, and whose "metric" (the rule for measuring distances) is given by a tensor field $g_{\mu\nu}$:

$$ds^{2} = g_{\mu\nu}\, dx^{\mu} dx^{\nu}$$

Every geometry you have met so far is a *special case*: Euclidean space has $g_{\mu\nu}$ constant; hyperbolic space has a specific negative-curvature $g_{\mu\nu}$; a curved surface is a two-dimensional example. The curvature of such a space is encoded in the **Riemann curvature tensor** $R^{\rho}{}_{\sigma\mu\nu}$, built from derivatives of $g_{\mu\nu}$; in two dimensions it collapses to the single Gaussian number $K$, so Riemann's tensor is the $n$-dimensional generalisation of Gauss's $K$. Riemann's framework is the mathematics that **Einstein** would use in 1915 to describe gravity not as a force but as the curvature of four-dimensional spacetime,

$$G_{\mu\nu} = \frac{8\pi G}{c^{4}}\, T_{\mu\nu}$$

the Einstein field equation: *the curvature of spacetime on the left equals the matter-and-energy on the right*. The *theorema egregium* of Gauss, generalised by Riemann, finally applied to the universe itself \cite{hypothesengeometrie} \cite{newtonprincipia}.

### Möbius and Listing: the word "topology"

In the same decade the *metric-free* side was named. **\citeauthor{mobiusband}** (1790–1868) discovered the one-sided band that bears his name (1858) \cite{mobiusband}, and **\citeauthor{listingtopologie}** (1808–1882) coined the very word **"topology"** (from *topos*, "place") in his *Vorstudien zur Topologie* (1847) \cite{listingtopologie}.

<figure>
	<img style="width: 400px; max-width: 100%;" src="mobius.jpg" alt="August Ferdinand Möbius" />
	<figcaption class="md">August Ferdinand Möbius (1790–1868), who, with Listing, named the study of shape up to continuous deformation.</figcaption>
</figure>

<figure>
	<img style="width: 100%" src="mobius_strip.jpg" alt="The Möbius strip" />
	<figcaption class="md">The <strong>Möbius strip</strong>: a band with a single half-twist. It has only <em>one</em> surface and <em>one</em> boundary, so an ant walking along it returns to its starting point having traversed "both sides" without crossing an edge. Its Euler characteristic is $\chi = 0$ and it is <em>non-orientable</em> — you cannot consistently mark a "left" and a "right" on it. It is the simplest possible object that is genuinely non-flat in the topological sense \cite{mobiusband}.</figcaption>
</figure>

The message of Möbius and Listing is the message of Euler's bridges: some of the deepest facts about a space are not about how far apart things are, but about *how it is connected* — and those facts (the number of "holes", orientability, the Euler characteristic) are the *real* invariants of shape. A later, complete result — the **classification of surfaces** — says every closed surface is, up to deformation, a sphere with a certain number of handles and cross-caps attached, so the integers $g$ (handles) and $k$ (cross-caps) are the *entire* topological identity of a surface \cite{hatcher}.
</div>

<div class="md">
## VII. The modern shape of space — and why it matters for AI

The last great reorganisation of the 19th century was **\citeauthor{poincareanalysissitus}**'s **\citetitle{poincareanalysissitus}** (1895), which turned topology from a collection of curiosities into a full theory \cite{poincareanalysissitus}.

The *why* was to extend Euler's and Gauss's ideas from 2-D surfaces to *spaces* of any dimension, and to answer the question "what does a space look like, up to deformation?" Poincaré's answers were the **fundamental group** $\pi_{1}$ (the algebraic record of all the ways a loop can be twisted around a space, up to continuous shrinking) and the beginnings of **homology** $H_{n}$ (counting "holes" of each dimension by signed sums of chains and boundaries) \cite{poincareanalysissitus} \cite{hatcher}. And in a stroke he posed the **Poincaré conjecture**: a closed 3-dimensional space in which every loop can be continuously shrunk to a point must be a 3-sphere. That is, *topology (how the loops behave) determines geometry (the space is a sphere)*.

<figure>
	<img style="width: 400px; max-width: 100%;" src="poincare.jpg" alt="Henri Poincaré" />
	<figcaption class="md">Henri Poincaré (1854–1912). His conjecture resisted every tool 20th-century mathematics had. It was finally proved by <strong>Grigori Perelman</strong> in 2002–2003, who used <strong>Richard Hamilton's Ricci flow</strong> — a process that smooths the curvature of a space over "time", like heat diffusing — to show that any such space must flow to a round sphere \cite{perelmanpoincare} \cite{poincareanalysissitus}.</figcaption>
</figure>

So where does this leave us, and why is a history of geometry a chapter in a course about machines? Because the discipline never stopped responding to the needs of its era, exactly as the opening line of \citeauthor{weeksshapespace} (\citeyear{weeksshapespace}) says \cite{weeksshapespace}. Its "needs" have changed, not its method:

* **Prehistoric**, geometry was the *repetition of a shape* — a zig-zag in a shell.
* **In the first cities**, it was the *measurement of the land* — the surveyor's right angle on clay, $A=\tfrac{1}{2}bh$, $V=\tfrac{1}{3}Bh$.
* **In Greece**, it became *proof* — the Euclidean machine, $a^{2}+b^{2}=c^{2}$ with a reason attached.
* **In the Islamic and early-modern periods**, it became *projection and coordinates* — Alhazen, Descartes, Desargues, Mercator.
* **In the 19th century**, it became *curved space and connectivity* — Gauss, Riemann, Poincaré, the Theorema Egregium and Gauss–Bonnet.
* **Today**, the newest need is the geometry of **representation**: a word is no longer a letter but a *point in a high-dimensional space*, and "meaning" is the *distance* and *direction* between those points. The [Embeddings](embeddinglab) chapter is, in a very real sense, the latest chapter of this same story — the point where the two-thousand-year-old question "what is the shape of space?" is asked of the *space of ideas* instead of the space of the field.

The thread that runs from *Homo erectus* to the embedding space is the same thread: the conviction that the world is made of *relations between points in a space*, and that those relations can be written down, proved, and, in the end, *computed*.
</div>

<div class="optional md" data-headline="A compact timeline">
* **c. 500,000 BCE** — Trinil shell: oldest deliberate geometric incision \cite{trinilshell}.
* **c. 43,000 / 18,000 BCE** — Lebombo and Ishango bones: quantity as a spatial pattern \cite{lebombobone} \cite{ishangobone}.
* **c. 75,000 BCE** — Blombos ochre: abstract grid patterning \cite{emergenceofmodernhumanbehaviour}.
* **c. 1650 BCE** — Rhind Papyrus: Egyptian areas, the circle rule $\pi\approx 256/81$, and the frustum volume $V=\tfrac{h}{3}(a^{2}+ab+b^{2})$ \cite{rhindpapyrus}.
* **c. 1900–1600 BCE** — Si.427 and Plimpton 322: Babylonian surveying geometry, Pythagorean triples \cite{si427} \cite{plimpton322}; BM 85200 + VAT 6599, Db2-146 \cite{hoyrup2021algebra}.
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
* **c. 820 CE** — al-Khwārizmī: *al-jabr*, completing the square \cite{hoyrup2021algebra}.
* **c. 1021 CE** — Ibn al-Haytham's optics: the law of reflection and the geometry of projection \cite{alhazenoetic}.
* **1435 / 1569 / 1637 / 1639** — Alberti (perspective), Mercator (conformal map), Descartes (analytic geometry), Desargues (projective geometry) \cite{albertidepictura} \cite{mercatoratlas} \cite{descartesgeometrie} \cite{desarguesbrouillon}.
* **1609 / 1687** — Kepler (planetary ellipses) and Newton (conics as orbits) \cite{keplerastronomianova} \cite{newtonprincipia}.
* **1736 / 1752** — Euler: Königsberg bridges (graph theory) and $V-E+F=2$ \cite{eulerbridges} \cite{eulersolids}.
* **1827** — Gauss's Theorema Egregium (intrinsic curvature) and, via Gauss–Bonnet, $\iint K\,dA = 2\pi\chi$ \cite{gaussdisquisitiones} \cite{docarmo}.
* **1829 / 1837** — Lobachevsky and Bolyai: hyperbolic geometry, triangle area $=\pi-(A+B+C)$ \cite{lobachevskygeometry} \cite{bolyaiappendix}.
* **1854** — Riemann: manifolds and the general metric $ds^{2}=g_{\mu\nu}dx^{\mu}dx^{\nu}$ \cite{hypothesengeometrie}.
* **1858 / 1847** — Möbius's band; Listing's *Vorstudien zur Topologie* \cite{mobiusband} \cite{listingtopologie}.
* **1895** — Poincaré's *Analysis Situs*: fundamental group, homology, the Poincaré conjecture \cite{poincareanalysissitus}.
* **2002–2003** — Perelman proves the Poincaré conjecture via Ricci flow \cite{perelmanpoincare}.
</div>
