<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: The Shape of Space — A History of Geometry
description: From a zig-zag etched in a shell to non-Euclidean manifolds: how humanity learned to measure, prove and imagine space.
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

This chapter follows that growth. We start where the physical evidence actually begins: not with a Greek theorist, but with a hand tool pressing a zig-zag into a river shell. We then cross the first cities, where geometry became a *job* (surveying land), pass through the Greek invention of *proof*, the medieval and early-modern reformulation of space in terms of projection and coordinates, and finally the 19th-century earthquake that turned out space itself might be *curved* — the idea that later made general relativity possible, and that quietly underlies the high-dimensional "spaces of meaning" you will meet in the [Embeddings](embeddinglab) chapter.
</div>

<div class="md">
## I. Before writing: space etched in shell and bone

The oldest geometric objects we have are not calculations at all. They are *patterns* — marks made by a hand that was doing something else (shaping a tool, decorating, keeping score), where a deliberate regularity shows up anyway. That regularity is the first thing: the sense that *the same shape* can be repeated, and that repeating it is meaningful.

### The Trinil shell (c. 500,000 years ago)

<figure>
	<img style="width: 100%" src="trinil_shell.jpg" alt="Homo erectus-engraved shell (Trinil, Java)" />
	<figcaption class="md">\citealternativetitle{trinilshell_image}: a freshwater river-clam shell engraved by *Homo erectus* at Trinil, Java, c. 500,000 years ago, showing a precise zig-zag of grooves (detail at right).</figcaption>
</figure>

The **Trinil shell** is the oldest known deliberate geometric incision. Working at the Sangiran–Trinil site in Java, an international excavation team — the study reported by Joordens and colleagues in \citeyear{trinilshell} \cite{trinilshell} — documented a series of paired grooves cut into the shell of a river clam, arranged in a regular zig-zag. Crucially, the marks are not a by-product of using the shell as a scraper or a drinking vessel; the groove spacing and the way it runs off the shell indicate a *pattern* was being produced on purpose. It is a strikingly simple fact — *Homo erectus*, not *Homo sapiens*, was capable of a repeated, symmetric, non-utilitarian shape more than half a million years ago — but it is the true starting line of this story.

### Blombos Cave (c. 75,000 years ago)

<figure>
	<img style="width: 100%" src="blombosochre.jpg" alt="Engraved ochre from Blombos Cave" />
	<figcaption class="md">Engraved ochre from \citealternativetitle{blombosochre}, South Africa. The cross-hatching and rhomboid grids are among the earliest evidence of abstract, non-utilitarian spatial patterning.</figcaption>
</figure>

A second, independent thread runs through the Middle Stone Age of southern Africa. The engraved pieces from **Blombos Cave**, dating to roughly 75,000 years ago, carry cross-hatched grids and rhomboid fields of incisions on red ochre \cite{emergenceofmodernhumanbehaviour} \cite{blombosochre}. Read purely as geometry, they are a study in the *partition of a plane*: a surface divided into a regular network of cells by crossing lines. That is, in miniature, exactly the operation that later surveyors and mapmakers would perform on a much larger scale.

### Tally bones: Lebombo and Ishango

\marginfig{ishango.jpg}{The \citealternativetitle{ishangobonephoto}, a baboon fibula of the Late Paleolithic (c. 18,000 BCE) with three columns of grouped notches — one interpretation of the earliest externalization of *quantity*.}

If the shell and the ochre mark the birth of *form*, the **Ishango bone** and the earlier **Lebombo bone** mark the birth of *counting* as a spatial act: quantities are not held in the mind, they are laid out as marks in a row, and rows as *groupings* in the plane \cite{ishangobone} \cite{lebombobone}. Geometry and arithmetic are born in the same gesture. (We return to both artifacts in the [History of AI](history) chapter, where they matter as the first *external memory*; here we only need that the notches are themselves a two-dimensional arrangement.)
</div>

<div class="md">
## II. Measuring the land: applied geometry in the first cities

For most of its early history, geometry was not a body of theorems. It was a *technique of state*: the discipline of measuring fields, dividing inheritances, and erecting temples that had to be square. It appears almost simultaneously in the first great urban cultures — Egypt, Mesopotamia, the Indus Valley, China — each with its own tools and its own number system.

### Egypt: the Rhind Papyrus

The best single window into Egyptian practical geometry is the **\citealternativetitle{rhindpapyrus}**, copied by the scribe *Ahmes* around 1650 BCE (from an older source) \cite{rhindpapyrus}. It is a problem book for scribes, and its geometry is entirely *metric* — it asks for areas and volumes, and gives rules that work, without any "why".

Two rules are worth knowing, because they show the level of sophistication:

* **Area of a circle.** Ahmes uses the rule "cut off one-ninth of the diameter, and what remains, square it": $A = \left(\tfrac{8}{9}d\right)^{2}$, which is equivalent to $\pi \approx \tfrac{256}{81} \approx 3.1605$ — impressively close to $3.1416$ for a rule that is easy to remember and hard to derive \cite{rhindpapyrus}.
* **Volume of a truncated pyramid.** Problem 58 gives the exact formula for the frustum of a square pyramid, $V = \tfrac{h}{3}\left(a^{2} + ab + b^{2}\right)$ (top side $a$, base side $b$, height $h$). This is a genuinely non-obvious formula, and it is stated correctly \cite{rhindpapyrus}.

Note what is *absent*: there is no proof, no postulate, no general argument. The rules are recipes. That is the defining feature of applied geometry before the Greeks.

### Babylon: geometry on clay

The Babylonian tradition is even richer, and even stranger, because the Babylonians thought in a **base-60 (sexagesimal)** positional system — the ancestor of our 60-second minute — and because they had no letters for "side" or "diagonal" in the way we do. Their "algebra" was, in the words of \citeauthor{hoyrup2021algebra}, a *geometric* technique: equations were solved by literally **cutting and pasting squares and rectangles** on a diagram (or in the scribe's head) \cite{hoyrup2021algebra} \cite{hoyruplengths}.

\marginfig{si_427.jpg}{\citealternativetitle{si427_image}, a hand-tablet from the Old Babylonian period (c. 1900–1600 BCE): a field being subdivided, its boundary lines set out with right angles made exact by Pythagorean triples.}

**Si.427 — the oldest applied geometry.** The clearest physical proof that this was a *surveying* discipline, not just classroom arithmetic, is the tablet **Si.427**, a field plan made by an Old Babylonian surveyor. \citeauthor{si427} traced the tablet from a 19th-century excavation record to the Archaeological Museum in Istanbul and showed that the surveyor used **Pythagorean triples** to make the boundary lines *truly perpendicular* \cite{si427} \cite{si427_baublatt}. The point is not only that it is ancient; it is that it is *before Pythagoras by more than a thousand years*. The famous 3-4-5 right triangle was a working tool of Mesopotamian land-surveyors long before it became a Greek theorem:

$$3^{2} + 4^{2} = 5^{2} \qquad (9 + 16 = 25)$$

A rectangle with sides in the ratio 3 : 4 and diagonal 5 is, by construction, a rectangle with exact right angles. The surveyor could lay it out on the ground with ropes of the right lengths and be certain the corners were square — no protractor required.

**Plimpton 322 — a table of right triangles.** The related tablet **Plimpton 322** (c. 1800 BCE) is a list of about fifteen rows of sexagesimal numbers. For a century it was dismissed as a multiplication table; \citeauthorlastnameand{plimpton322} argued that it is a systematic table of exact right-triangle ratios — a *proto-trigonometric* catalogue of the special triples a surveyor could actually use \cite{plimpton322}. In both tablets the motivation is the same and the same practical one that \citeauthor{si427_baublatt} highlights: land was becoming private property, and neighbours needed *disputable, exact* boundaries \cite{si427_baublatt}.

**BM 85200 + VAT 6599 and Db2-146 — geometry in its purest form.** Two more tablets, analysed in detail by \citeauthor{hoyrup2021algebra}, show how far the "cut-and-paste" technique went \cite{hoyrup2021algebra}.

* **The excavation problem (BM 85200 + VAT 6599, problem 23).** A square pit is to be dug so that its depth exceeds its side by one *kùš*, and the volume is fixed. The scribe solves it with a table of numbers of the form $n^{2}(n+1)$ — the "equal, one added" table — that is, by working with a *cube* as the "comparison body". The modern algebraic reading is $x^{2}(x+1) = V$; the Babylonian procedure is to look up, in a memorised table, the $x$ whose cube-plus-face matches the given volume.
* **The diagonal problem (Db2-146).** Given the *diagonal* of a rectangle, $1^{\circ}15'$, and its *area*, $45'$, find the length and the breadth. The scribe "completes the square" in the standard way and arrives at length $1$ and breadth $45'$. The final lines are a *check*, and they carry, in abstract form, a clear trace of what we would now call the Pythagorean rule: the length and breadth are "raised" (squared) and their sum is checked against the diagonal, without ever naming a triangle \cite{hoyrup2021algebra}.

\citeauthor{hoyrup2021algebra} notes a remarkable after-life of this second problem: the very same "given the diagonal and the area, find the sides" puzzle, with the very same solution procedure, reappears **1,900 years later** in a Hebrew mathematical handbook dated 1116 CE — a tradition that ran from Old Babylonian field-measurers, through the scribal schools, and into the medieval world \cite{hoyrup2021algebra}.

<div class="optional md" data-headline="What "algebra" really was">
This is the insight that separates modern scholarship from older accounts. For most of the 20th century these texts were read as *numeric* algebra: the scribe was "solving $x^{2}+x=a$". \citeauthor{hoyrup2021algebra} showed that reading is impossible to sustain, because the terminology only makes sense against a *geometric* background — the operations are additions, subtractions and multiplications of *measurable* lengths and areas, and the "quadratic completion" is a literal rearrangement of square and rectangle pieces \cite{hoyrup2021algebra} \cite{hoyruplengths}. The Babylonians did not have "algebra" and "geometry" as two subjects; they had one geometry that *happened* to compute. Euclid, a millennium later, would re-cast much of this into the axiomatic *Elements* — which is why the story now turns to Greece.
</div>

### India: the Śulba Sūtras and $\sqrt{2}$

In the Vedic tradition of India, the driving force was not the field but the **fire altar**. The altar had to be a rectangle of exactly a prescribed area, and it had to be *converted into a square* (and then into other shapes) without changing that area. The **\citealternativetitle{sulbasutras}** — construction manuals, the earliest of them (attributed to *Baudhāyana*) dating to roughly 800 BCE — are full of exactly this geometry \cite{sulbasutras}.

The most celebrated result is a recipe for $\sqrt{2}$. Starting from a rectangle of area 1, one "cuts off" a corner and folds in a smaller triangle (the *diagonal* operation), producing a square of the same area. The diagonal of the unit square is $\sqrt{2}$, and the *Baudhāyana Śulba Sūtra* gives it to the fifth decimal place:

$$\sqrt{2} \approx 1 + \tfrac{1}{2} + \tfrac{1}{2\cdot 3} - \tfrac{1}{2\cdot 3\cdot 5} + \tfrac{1}{2\cdot 3\cdot 5\cdot 7} \approx 1.41421569$$

The famous line, roughly, is that *"the length obtained along the diagonal makes an area equal to that made by length and width together"* — a geometric statement of $d^{2} = a^{2} + b^{2}$ made, once again, *independently* of Greece and *before* the theorem bore Pythagoras's name \cite{sulbasutras}.

### China: the Jiuzhang Suanshu

The Chinese tradition is anchored in the **\citealternativetitle{jiuzhangsuanshu}** (*The Nine Chapters on the Mathematical Art*), a practical compendium whose problems — land area, grain, fair distribution, earthworks — were assembled by Han-dynasty scholars (compiled c. 1st century BCE, with material older still) \cite{jiuzhangsuanshu}. Its geometry is metric and algorithmic: areas of fields of every shape, volumes of dikes and granaries, and, in the chapter on the *gougu* (the "right-angle"), the same $a^{2}+b^{2}=c^{2}$ relation, used to *find* the diagonal of a rectangle from its two sides \cite{jiuzhangsuanshu}. The *Jiuzhang* is also where one of the earliest clear uses of **negative numbers** appears (as book-keeping entries in a system of simultaneous linear equations), so it is a reminder that these "geometric" treatises were, in practice, the whole of a culture's applied mathematics.

A fair summary of this whole section: by the first millennium BCE, three unrelated civilisations — Mesopotamia, the Indus and China — had each invented, for the *practical* purpose of measuring the earth, the right-triangle relation, the area rules, and (in India and China) a working $\sqrt{2}$. Geometry had already travelled the world once, on the business of land, before anyone wrote a proof.
</div>

<div class="md">
## III. The Greek turn: from measuring to proving

The Greeks did not invent geometry. They did something more radical: they made it *demonstrative*. A Babylonian scribe could give you the right answer and trust the recipe. A Greek wanted to know **why it must be so, and why it cannot fail**. That single demand — for *apodeixis*, proof — is what separates the *Elements* from everything before it, and it is the habit of mind that all of modern mathematics (and, in the end, all of the formal reasoning a computer performs) inherits.

### Thales, Pythagoras and the theorem

The tradition places the first proofs with **Thales of Miletus** (c. 624–546 BCE) — for example, that a circle is bisected by its diameter (Thales' theorem, *Elements* I.31) and that the angles of a triangle sum to two right angles (I.32) — and with the **Pythagoreans**, the circle around **Pythagoras** (c. 570–495 BCE) \cite{heathgreekmath}. The Pythagoreans are credited with the first *proof* of what is now named after them: in any right triangle the square on the hypotenuse equals the sum of the squares on the two legs,

$$a^{2} + b^{2} = c^{2}$$

and more, they (allegedly) proved the converse. The Babylonians and the Indians had *used* the relation for a thousand years; the Greeks *understood* it, and — for them, this was the dangerous part — the understanding led to a crisis, because they found figures (the diagonal of a square) whose side ratio could not be written as a ratio of whole numbers at all. The discovery of the incommensurable, $\sqrt{2} \notin \mathbb{Q}$, is arguably the first genuine "mathematical" result: a statement about what *cannot* be done \cite{heathgreekmath}.

### Hippocrates and Eudoxus: the method of exhaustion

**Hippocrates of Chios** (c. 470–410 BCE) is said to have been the first to "squaring the lune" — cutting a crescent-shaped figure bounded by two circular arcs and showing it has an area equal to a plain rectilinear one \cite{heathgreekmath}. A century later **Eudoxus of Cnidus** (c. 408–355 BCE) supplied the rigorous engine that had been missing: the **method of exhaustion**, the idea that a curved area (a circle, a parabolic segment) can be pinned down by inscribing and circumscribing polygons and showing the "remainder" can be made smaller than *any* given piece. This is the ancient ancestor of the integral, and Euclid's *Elements* XII is built on it.

### Plato: geometry as the road to the Forms

For **Plato** (c. 428–348 BCE), geometry was not a trade; it was the *entrance examination* to philosophy. In the *Republic* the philosopher is told that "if he has not a great natural gift for geometry he will get very little from the study of it", because geometry "draws the soul towards truth" (*Republic* 527a) \cite{platorepublic}. In the *Meno* there is the famous scene in which Socrates leads an uneducated slave boy, by questions alone, to *discover* that doubling a square requires a side of $\sqrt{2}$ times the original \cite{platomeno}. The point Plato wants is the philosophical one: the boy was not *taught* the fact from outside; the shape was already, in a sense, *known* to him, and proof merely *reminded* him of it. Geometry, on this picture, is the study of what the mind already contains — the bridge between the changing world of things and the unchanging world of Forms.

The tradition also preserves the legend that Plato had written above the door of his Academy: *"Let no one ignorant of geometry enter"* — a slogan for the idea that the discipline was a *way of thinking* before it was a body of results.

### Aristotle: place, continuity and the "three principles"

\citeauthor{aristotlephysics}'s (*ca. 350* BCE) \citetitle{aristotlephysics} (Book IV) is less a geometry than a *metaphysics of space* \cite{aristotlephysics}. His question is not "how big" but "what is *where*?": he defines **place** (the *topos*) as "the innermost motionless boundary of what contains", argues that the void is impossible, and — in the *Physics* and the *Metaphysics* — lays down what he calls the three principles on which mathematics stands: the **axiom** (a self-evident proposition), the **postulate/hypothesis** (a request to suppose something), and the **definition** (a name for a thing). This threefold taxonomy is exactly the scaffold Euclid's *Elements* will use a generation later, and it is the seed of the whole modern notion of an *axiomatic theory*.

### Euclid's Elements: the machine of proof

Everything before Euclid was a collection of results; the **\citealternativetitle{euclidelements}** (composed c. 300 BCE in Alexandria, the standard edition edited and translated by \citeauthor{euclidelements_heath}) is the first *system* \cite{euclidelements} \cite{euclidelements_heath}. Its structure is as famous as its content: a short list of definitions, **five postulates** (the working rules of compass and straightedge) and **five common notions** (self-evident truths about magnitudes) from which **465 propositions** follow, each ending with the little square — the *hysteron* — that marks "it has been proved". That architecture is the template for every proof-based subject that followed:

* **Definitions** (point, line, circle, angle, …) — what the objects *are*.
* **Postulates** (five) — what you are *allowed to do* with them. The first four are self-evident constructions; the **fifth** is the **parallel postulate**: through a point not on a line there passes *at most one* line that never meets the given line. For over two thousand years this fifth postulate was treated as slightly less obvious than the others, and every attempt to "fix" it is, in retrospect, the road to non-Euclidean geometry (Section VI).
* **Common notions** (five) — the basic, self-evident truths about equality and magnitude ("things equal to the same thing are equal to one another").
* **Propositions** — statements proved *only* from the definitions, postulates and common notions, plus earlier propositions.

The books are organised by theme: **Book I** is plane geometry (angles, triangles, the Pythagorean theorem as **I.47**, and the *converse* as I.48); **Book VI** develops proportion and **similar triangles**, which is how the Greeks did "algebra with lengths"; **Book XII** applies the method of exhaustion to area and volume (the circle's area is to the square on its diameter as the ratio is; the cone is a third of the cylinder); and **Book XIII** closes the whole edifice by constructing the five **regular solids** — the tetrahedron, cube, octahedron, dodecahedron and icosahedron — tying geometry back to the Platonic idea that the cosmos is built from five shapes.

The anecdote (told by Proclus) is that when **Ptolemy** complained the *Elements* were too hard for beginners, Euclid replied that **there is no royal road to geometry**. The line captures the whole Greek shift: the *Elements* are not a shortcut to the right answers; they are the *long way around*, and it is precisely that long way — the insistence on proof — that makes the discipline permanent. Every theorem in this book, and every formal proof a machine checks, is a descendant of Euclid's first line: *"Let AB be a given finite straight line."*

### Beyond Euclid: Apollonius and Menelaus

Two later works push geometry past the plane and past the conic. **Apollonius of Perga** (c. 262–190 BCE) wrote the eight-book **\citealternativetitle{apolloniusconics}**, in which he names and classifies the **conic sections** — the ellipse, the parabola and the hyperbola — as the curves a plane cuts from a cone, and develops their full metric theory \cite{apolloniusconics}. (It is, in effect, the "geometry of the second degree" that Descartes's coordinates will later make algebraic, and that the orbital mechanics of Kepler and Newton will later make physical.) **Menelaus of Alexandria** (c. 70–140 CE) wrote the **\citealternativetitle{menelaussphaerica}**, the first systematic treatise on **spherical geometry** — the geometry of the *surface* of a sphere, where the straight line is replaced by a great circle and the angles of a triangle sum to *more* than two right angles \cite{menelaussphaerica}. Menelaus' theorem is the spherical tool for astronomy (locating the stars), and it quietly plants the second seed of Section VI: *curved* space has its own, genuinely different, geometry.
</div>

<div class="md">
## IV. Transmission: the Islamic Golden Age

When the Greek world passed its knowledge eastward, it was not lost but *worked on*. In the great translation and research centres of the Islamic world — above all the **House of Wisdom** in Baghdad (8th–13th c.) — the *Elements*, the *Conics* and the astronomical treatises were rendered into Arabic, corrected, and extended. Figures such as **al-Khwārizmī** (c. 780–850) re-founded algebra (the very word is his) but did so in the *geometric* spirit inherited from Babylon and Greece, solving equations by the same cutting-and-completing-of-the-square operations \cite{hoyrup2021algebra}. The point for this chapter is that the Greek "proof" tradition was *preserved and deepened* across a millennium, and carried, with the rest, into medieval Europe.

The single most important geometric achievement of the period, however, is the work of **Ibn al-Haytham** (Latinised **Alhazen**, c. 965–1040). His **\citealternativetitle{alhazenoetic}** (completed c. 1021) is a *geometry of seeing*: it treats the eye, the mirror, and the path of light as objects of rigorous geometric analysis, and famously inverts the old "emission" theory of vision by arguing that we see by light *entering* the eye along straight rays \cite{alhazenoetic}. The **Alhazen problem** — finding the point on a mirror where a ray from an object reflects to the eye — is a genuinely hard geometric problem that he reduces to an algebraic (in fact quartic) equation, and his treatment of the **camera obscura** is the direct ancestor of both the scientific camera and the mathematics of *perspective* \cite{alhazenoetic}. It is a pivot: geometry becomes the mathematics of *projection* — of how a three-dimensional world is faithfully laid down on a two-dimensional surface.
</div>

<div class="md">
## V. Space made visible: perspective, coordinates and projection

The mathematics of projection that Alhazen opened is taken up, on the *artistic* side, by the Renaissance, and on the *mathematical* side, by the 17th century. These two streams meet in a single, decisive idea: **space can be turned into numbers**.

### Alberti and linear perspective (1435)

**Leon Battista Alberti**, in his **\citealternativetitle{albertidepictura}** (1435), gives the first *mathematical* account of **linear perspective** \cite{albertidepictura}: the picture plane, the vanishing point, and the rule that all parallel lines receding into depth appear to meet at a single point on the horizon. What the painters used to make a painting look "deep" was, in fact, a **central projection** of 3-D space onto a 2-D plane — a *projective* transformation. The Renaissance discovery of perspective is thus, in modern language, the birth of **projective geometry**, the geometry of what survives projection.

### Descartes and analytic geometry (1637)

\citeauthor{descartesgeometrie}'s **\citealternativetitle{descartesgeometrie}** (1637), the final part of his *Discourse on the Method*, is the hinge on which all of later mathematics turns \cite{descartesgeometrie}. His move is the simplest and most powerful in the book of mathematics: put a **grid of coordinates** on the plane, so that every point is a *pair of numbers* and every curve is an *equation*. A line is $y = mx + c$; a circle is $x^{2} + y^{2} = r^{2}$; the conics are the degree-two equations. Geometry and algebra, which had walked in parallel for two thousand years, are now *the same subject written in two languages*. (It was **Fermat**, working independently, who developed the same idea in the same decade.) From this point on, "the geometry of a thing" can be *computed* by solving "the equation of a thing" — which is, one small step removed, exactly what a neural network does when it treats a geometric object as a set of numbers and a rule as a function.

### Desargues and projective geometry (1639)

Almost simultaneously, the French engineer **Gérard Desargues**, in his **\citealternativetitle{desarguesbrouillon}** (1639), asked a different question: *which* facts about a figure are preserved when it is projected onto another plane — facts that stay true no matter how the picture is distorted \cite{desarguesbrouillon}. His **Desargues' theorem** (two triangles are in perspective from a point iff their corresponding sides meet on a line) is one of the first clean statements of **projective geometry**, the geometry that later (with Pappus, Pascal, and then Möbius, Plücker and Klein) would be recast as the geometry of *lines, points and incidence* alone, with no length or angle at all. Perspective, algebra and projection — the three threads of the 17th century — were, in retrospect, all one subject: the geometry of *how space looks*.
</div>

<div class="md">
## VI. When space bends: topology and non-Euclidean geometry

For two thousand years, "the" geometry was Euclid's, and everyone assumed that space *must* be flat — that the parallel postulate is a fact about the universe, not just a convenient assumption. The 18th and 19th centuries shattered that in two different directions at once: they found geometry *without metric* (topology), and geometry *without parallelism* (non-Euclidean space).

### Euler: the geometry of connectivity

\citeauthor{eulerbridges} (1707–1783) was the first to notice that some questions about space do not care about *distance* at all. His solution of the **Königsberg bridges** problem (1736, published \citeyear{eulerbridges} \cite{eulerbridges}) asked whether one could walk through the city crossing each of its seven bridges exactly once — and answered *no*, by showing it depends only on *which banks are connected to which*, not on how far apart the bridges are. The problem "ad *geometriam situs*" ("regarding position") is the birth of **graph theory** and, more broadly, of the study of properties that survive stretching and tearing: **topology**.

Euler also found the first genuine topological *invariant*. For any convex solid built from flat faces (a polyhedron), the number of vertices $V$, edges $E$ and faces $F$ always satisfies

$$V - E + F = 2$$

(\citeyear{eulersolids}; the general statement in \citetitle{eulersolids}) \cite{eulersolids}. A cube (8 − 12 + 6), a pyramid (5 − 9 + 5) and an arbitrarily twisted dodecahedron all give $2$. The number $2$ is the **Euler characteristic** $\chi$ of the sphere; it is *the same for every shape that can be deformed into a sphere* and *different* for anything that cannot (a torus has $\chi = 0$). That a shape's identity is captured by a single *integer* — not by its angles, not by its side lengths, but by something that cannot change under continuous deformation — is the founding intuition of topology.

### Gauss: curvature is intrinsic

**\citeauthor{gaussdisquisitiones}** (1777–1855), while surveying the state of Hanover, was led to a question that looks innocent and is profound: *can a two-dimensional creature living on a surface measure its own curvature, using only rulers and protractors on the surface — without being able to "step outside" and look at it?* His **\citetitle{gaussdisquisitiones}** (1827) answers *yes*, and the result is the **Theorema Egregium** ("remarkable theorem") \cite{gaussdisquisitiones}: the **Gaussian curvature**

$$K = \frac{1}{R_{1} R_{2}}$$

at a point (where $R_{1}, R_{2}$ are the two principal radii of curvature) is *intrinsic* — it is determined entirely by the angles and distances measured *on* the surface, and cannot be changed by bending the surface without stretching it. A sheet of paper bent into a cylinder has $K = 0$ everywhere (you could roll it, so it is "still flat"); a sphere has $K > 0$; a saddle has $K < 0$. This is the theorem that makes general relativity possible: it says that *curvature is not a property of the shape embedded in a higher space, but a property of the space itself*, readable from within.

### Lobachevsky and Bolyai: the parallel postulate is a choice

The parallel postulate had resisted proof for 2,000 years. The breakthrough was to stop trying to prove it and to *negate* it. **\citeauthor{lobachevskygeometry}** (1792–1856) and, independently, **\citeauthor{bolyaiappendix}** (1802–1860), each discovered that if you *replace* Euclid's fifth postulate with "through a point not on a line there pass *infinitely many* lines that never meet it", a perfectly consistent geometry results — **hyperbolic (or "non-Euclidean") geometry** \cite{lobachevskygeometry} \cite{bolyaiappendix}. In it, the angles of a triangle sum to *less* than two right angles, and similar triangles need not be congruent. The result was shocking, because it was not a contradiction: it was a *different, equally valid, geometry of space*. The father **Farkas Bolyai** and **Gauss** (who had found the same geometry independently but never published) both recognised that the *truth* of Euclidean versus hyperbolic geometry is no longer a question of pure reason — it is, as Gauss put it, an **empirical** question, to be settled by measuring the angle-sum of a *very large* triangle in the real world. Geometry had become a question about *physical space*, not just a set of theorems.

### Riemann: the general idea of "space"

<figure>
	<img style="width: 100%" src="riemann.jpeg" alt="Bernhard Riemann" />
	<figcaption class="md">\citeauthor{hypothesengeometrie} (1826–1866), whose 1854 habilitation lecture generalised the very idea of a "space".</figcaption>
</figure>

<div class="smart-quote" data-cite="hypothesengeometrieenglish">
I consider it necessary to examine in general the hypotheses on which geometry is based, and to inquire whether we cannot give a more general meaning to the proposition about the measure of extension.
</div>

\citeauthor{hypothesengeometrie}, in his 1854 habilitation lecture \citetitle{hypothesengeometrie} \cite{hypothesengeometrie}, took one final, enormous step. He asked: what is a "space" in the first place? His answer is the **manifold** (German *Mannigfaltigkeit*, literally "many-folds") — an $n$-dimensional surface that, *locally*, looks like ordinary flat $\mathbb{R}^{n}$, but may be curved in a way that can vary from point to point, and whose "metric" (the rule for measuring distances) is given by a tensor field $g_{\mu\nu}$:

$$ds^{2} = g_{\mu\nu}\, dx^{\mu} dx^{\nu}$$

Every geometry you have met so far is a *special case*: Euclidean space has $g_{\mu\nu}$ constant; hyperbolic space has a specific negative-curvature $g_{\mu\nu}$; and any curved surface is a two-dimensional example. Riemann's framework is the mathematics that **Einstein** would use in 1915 to describe gravity not as a force but as the curvature of four-dimensional spacetime — the *theorema egregium* of Gauss, finally applied to the universe itself.

### Möbius and Listing: the word "topology"

In the same decade the *metric-free* side was named. **\citeauthor{mobiusband}** (1790–1868) discovered the one-sided band that bears his name (a strip with a single half-twice — 1858) \cite{mobiusband}, and **\citeauthor{listingtopologie}** (1808–1882) coined the very word **"topology"** (from *topos*, "place") in his *Vorstudien zur Topologie* (1847) \cite{listingtopologie}. The message of Möbius and Listing is the message of Euler's bridges: some of the deepest facts about a space are not about how far apart things are, but about *how it is connected* — and those facts (the number of "holes", orientability, the Euler characteristic) are the *real* invariants of shape.
</div>

<div class="md">
## VII. The modern shape of space — and why it matters for AI

The last great reorganisation of the 19th century was **\citeauthor{poincareanalysissitus}**'s **\citetitle{poincareanalysissitus}** (1895), which turned topology from a collection of curiosities into a full theory \cite{poincareanalysissitus}. He introduced the **fundamental group** (the algebraic record of all the ways a loop can be twisted around a space), the beginnings of **homology** (counting "holes" of each dimension by signed sums of chains and boundaries), and — in a stroke — the **Poincaré conjecture**, the question of whether a space whose *only* hole-free loop property is "every loop can be shrunk to a point" must be a sphere. That conjecture resisted all of 20th-century mathematics until **Grigori Perelman** announced its proof in 2002–2003, settling the problem that had, in one form, been open since Riemann \cite{poincareanalysissitus}.

So where does this leave us, and why is a history of geometry a chapter in a course about machines? Because the discipline never stopped responding to the needs of its era, exactly as the opening line of \citeauthor{weeksshapespace} (\citeyear{weeksshapespace}) says \cite{weeksshapespace}. Its "needs" have changed, not its method:

* **Prehistoric**, geometry was the *repetition of a shape* — a zig-zag in a shell.
* **In the first cities**, it was the *measurement of the land* — the surveyor's right angle on clay.
* **In Greece**, it became *proof* — the Euclidean machine.
* **In the early modern period**, it became *coordinates and projection* — Descartes, Desargues, perspective.
* **In the 19th century**, it became *curved space and connectivity* — Gauss, Riemann, Poincaré.
* **Today**, the newest need is the geometry of **representation**: a word is no longer a letter but a *point in a high-dimensional space*, and "meaning" is the *distance* and *direction* between those points. The [Embeddings](embeddinglab) chapter is, in a very real sense, the latest chapter of this same story — the point where the two-thousand-year-old question "what is the shape of space?" is asked of the *space of ideas* instead of the space of the field.

The thread that runs from *Homo erectus* to the embedding space is the same thread: the conviction that the world is made of *relations between points in a space*, and that those relations can be written down, proved, and, in the end, *computed*.
</div>

<div class="optional md" data-headline="A compact timeline">
* **c. 500,000 BCE** — Trinil shell: oldest deliberate geometric incision \cite{trinilshell}.
* **c. 75,000 BCE** — Blombos ochre: abstract grid patterning \cite{emergenceofmodernhumanbehaviour}.
* **c. 1650 BCE** — Rhind Papyrus: Egyptian areas and the frustum volume \cite{rhindpapyrus}.
* **c. 1900–1600 BCE** — Si.427 and Plimpton 322: Babylonian surveying geometry, Pythagorean triples \cite{si427} \cite{plimpton322}; BM 85200 + VAT 6599, Db2-146 \cite{hoyrup2021algebra}.
* **c. 800 BCE** — Śulba Sūtras: the fire-altar geometry and $\sqrt{2}$ \cite{sulbasutras}.
* **c. 1st c. BCE** — Jiuzhang Suanshu: Chinese metric geometry and negative numbers \cite{jiuzhangsuanshu}.
* **c. 600–500 BCE** — Thales and the Pythagoreans: first proofs \cite{heathgreekmath}.
* **c. 400 BCE** — Hippocrates' lunes; **c. 370 BCE** — Eudoxus's method of exhaustion \cite{heathgreekmath}.
* **c. 380 / 375 BCE** — Plato's *Meno* and *Republic*: geometry as a path to the Forms \cite{platomeno} \cite{platorepublic}.
* **c. 350 BCE** — Aristotle's *Physics*: place, continuity, the three principles \cite{aristotlephysics}.
* **c. 300 BCE** — Euclid's *Elements*: the axiomatic system \cite{euclidelements}.
* **c. 215 BCE** — Apollonius's *Conics*; **c. 100 CE** — Menelaus's *Sphaerica* \cite{apolloniusconics} \cite{menelaussphaerica}.
* **c. 1021 CE** — Ibn al-Haytham's optics: geometry of projection \cite{alhazenoetic}.
* **1435 / 1637 / 1639** — Alberti (perspective), Descartes (analytic geometry), Desargues (projective geometry) \cite{albertidepictura} \cite{descartesgeometrie} \cite{desarguesbrouillon}.
* **1736 / 1752** — Euler: Königsberg bridges (graph theory) and the polyhedron formula \cite{eulerbridges} \cite{eulersolids}.
* **1827** — Gauss's Theorema Egregium: intrinsic curvature \cite{gaussdisquisitiones}.
* **1829 / 1837** — Lobachevsky and Bolyai: hyperbolic geometry \cite{lobachevskygeometry} \cite{bolyaiappendix}.
* **1854** — Riemann: manifolds and the general metric \cite{hypothesengeometrie}.
* **1858 / 1847** — Möbius's band; Listing's *Vorstudien zur Topologie* \cite{mobiusband} \cite{listingtopologie}.
* **1895** — Poincaré's *Analysis Situs*: fundamental group, homology, the Poincaré conjecture \cite{poincareanalysissitus}.
</div>
