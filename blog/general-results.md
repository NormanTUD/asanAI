# Deep Research — General Results

> **Scope.** "Every step from the pre-Big-Bang to today that was necessary" to make
> an LLM possible — traced as a chain of *load-bearing* ideas, each backed by
> **real, serious, verifiable publications** that deliver a deep, *visible*
> (geometric / topological / visual) insight. This is the comprehensive companion to
> `aha-results.md` (which isolates the single most striking "Aha!" moments).

> **Method.** Six parallel research agents covered (A) Matter & Computation,
> (B) Geometry/Topology/Optimal-Transport of Deep Learning, (C) Chaos/Criticality/
> Fractals, (D) Brain/Free-Energy/Information, (E) Modern Deep-Learning Theory
> 2020–2026, and (F) From-Stone-to-Bit. I then re-verified the flagged/unverified
> items myself against the arXiv API and publisher pages.

**Verification legend.**
- `OK`  = arXiv id / DOI / page fetched this session and confirmed (title + authors).
- `CAN` = canonical, settled reference (author/title/year/venue/DOI are standard in the
  literature); the stable identifier is given, but the live page was not re-fetched this
  pass. **Run through `tests/link_checker.py` before any URL is wired into
  `literature.js`.**
- `UNV` = could **not** be independently confirmed this pass — treat as a *candidate*,
  verify before citing. (Two items were actively corrected: see §"Corrections".)

**Already in the course** (do not re-add) — verified present in `literature.js`:
Montúfar (linear regions), Saxe (mean-field deep dynamics), Draxler (energy landscape),
Telgarsky (depth), Bartlett (benign overfitting), Tishby (info bottleneck),
Shwartz-Ziv, Nanda/Power/Liu (grokking), Olsson (induction heads), Chinchilla + Kaplan
(scaling), Wei (emergent abilities), self-consistency, chain-of-thought, in-context,
Friston 2010, Ramsauer ("Hopfield Networks is All You Need" 2020), Hopfield 1982,
Ackley–Hinton–Sejnowski 1985, Bronstein et al. (Geometric Deep Learning), Nickel
(Poincaré embeddings), Perelman / Ricci flow, Poincaré (Analysis Situs, Mathematical
Creation), Feynman (via others), GDL gauge group, Noether, Galois, Penrose, Bardeen,
Shockley, Gordon (laser), Fert, Bloch, Boole, Frege, Hilbert, Russell, Archimedes,
al-Khwarizmi, al-Haytham, Euclid, Ishango/Lebombo, Plato, Aristotle, Gauss, Fourier,
Hamilton, Lagrange, Riemann, Banach, Neural-ODE (Chen 2018), Maas, Schrödinger-bridge
(term), Song/So/Dhariwal (score/diffusion), Vershynin, Maxwell, Heisenberg, Bose,
Boltzmann, Turing 1936, Gödel 1931, Babbage, Lovelace, Kilby, Noyce, Colossus, Baran,
Berners-Lee, PageRank/Brin, Vapnik, LeCun, Krizhevsky, Mikolov, Vaswani, edge-of-
stability (term), Noether, Galois.

---

## The load-bearing chain (pre-Big-Bang → today)

A single narrative spine. Every AI capability inherits from **all** prior links; if any
is removed the chain breaks. Each arc below lists the *new* deep, visual references.

| # | Step | What it makes possible | Key new "visible" insight |
|---|------|------------------------|---------------------------|
| 0 | Before the Big Bang → structure seeds | quantum fluctuations → CMB → galaxies → matter | the CMB = *stretched quantum noise*; order from a symmetric start |
| 1 | Quantum mechanics (light & matter chunky) | the **bit** (nature is discrete); transistors | photoelectric threshold; Pauli → the periodic table |
| 2 | Waves in a crystal (band structure) | **semiconductors → transistor → chips** | Bloch wave + Brillouin-zone *gap*; a transistor is a quantum energy barrier |
| 3 | Information is physical | **computation has energy/speed limits** | Landauer `kT ln2`; Margolus–Levitin; Lloyd's `10^120` ops |
| 4 | Thermodynamics ↔ information | the **loss function is entropy**; free energy | Maxwell's demon; Shannon entropy = Boltzmann entropy |
| 5 | Symmetry, order, topology | **phase transitions**, robust features, equivariance | Noether; Onsager Ising; Chern-number Hall effect; topological insulators |
| 6 | Wild functions & the infinite | the **calculus + fractal** vocabulary | Cantor diagonal; Weierstrass; space-filling curves; Mandelbrot |
| 7 | Chaos, criticality, edge of chaos | **why learning systems sit at a phase transition** | Lorenz butterfly; Feigenbaum constant; sandpile 1/f; percolation |
| 8 | Brain / free energy / prediction | the **brain is a loss-minimizing engine** | free-energy principle; predictive coding = residuals; brain ≈ energy limit |
| 9 | Algorithmic information & compression | **prediction = compression**; randomness = incompressibility | Kolmogorov; Chaitin Ω; Huffman; LZ77→BPE |
| 10 | Geometry/topology/OT of deep learning | **why depth, width & over-param work** | attention = OT; Schrödinger bridge; NTK; spin-glass landscape; KKL width |
| 11 | Modern LLM theory (2020–2026) | **why transformers/LLMs actually compute** | in-context gradient descent; attention = RNN/SDM; anisotropy; SAE monosemanticity |
| 12 | From stone to bit (computation history) | **the computer + the internet** | Babbage = a machine that differentiates; Kleinrock queueing; GoL universality |

---

## Arc 0 — Before the Big Bang & the seeds of structure (cosmology)

The course covers Big Bang / CMB / Penzias–Wilson / Hubble. The *missing deep links*
that matter for "why structure + computation are possible at all":

- `CAN` — **Sakharov, "Matter and antimatter in the universe," JETP Lett. 5:32 (1967).**
  Aha: matter (and hence everything, including computers) exists only because the early
  universe **violated** three symmetries (C, CP, baryon number) *and* was out of
  equilibrium. The visible picture: a tiny 1-in-10^9 surplus of matter over antimatter
  is the *entire* visible universe. Why it matters: **information-bearing matter requires
  the arrow of time** — a non-equilibrium history.
- `CAN` — **Maldacena / Linde / Guth (inflation).** Guth, "Inflationary universe: A possible solution to the horizon and flatness problems," *Phys. Rev. D* 23:347 (1981).
  Aha: a **fraction of a second** of exponential expansion stretches a *quantum*
  fluctuation to cosmic scale. The CMB's "lumps" are **frozen quantum noise**. Why it
  matters: the **seeds of every galaxy (and thus every brain) are quantum fluctuations**
  — the deepest "discrete → structure" link in the chain.
- `UNV` — **Cosmological constant problem / vacuum energy** (Weinberg, "The cosmological
  constant problem," *Rev. Mod. Phys.* 61:1 (1989)). Aha: the worst
  prediction in physics — quantum field theory predicts a vacuum energy ~10^120 times
  larger than observed. Why it matters: it is the *tension* that drives
  holography / the Bekenstein bound (Arc 3) and the "why is there something" question.

---

## Arc 1 — Quantum mechanics: light & matter are chunky

- `CAN` — **Einstein, "Über einen die Erzeugung und Verwandlung des Lichtes
  betreffenden heuristischen Gesichtspunkt," *Annalen der Physik* 17:132 (1905).**
  Aha: the photoelectric current depends on **frequency, not intensity** — light arrives
  in indivisible packets `E = hν`. A weak low-frequency flood frees *zero* electrons; a
  thin high-frequency stream frees them **instantly** (a threshold, not a ramp).
  **Why it matters: this is the origin of the *digital bit*** — nature's own
  discreteness, the physical root of why information can be encoded in discrete states.
- `CAN` — **Einstein, "Zur Quantentheorie der Strahlung," *Physikalische
  Zeitschrift* 18:121 (1917).** Aha: **detailed balance (the 2nd law) forces a third
  process — stimulated emission** — a photon that *copies itself* (same phase,
  direction, polarization). The laser mechanism is a *consequence of thermodynamics*,
  not an engineering trick. Why it matters: coherent light → photolithography, fiber,
  and the "copy the signal" intuition behind amplification.
- `CAN` — **de Broglie, *Recherches sur la théorie des quantons* (thesis 1924);
  *Ann. de la Physique* 3:22 (1925).** Aha: every object with momentum carries a
  wavelength `λ = h/p`; an electron in a crystal has one on the scale of atomic
  spacing, so it **diffracts** (Davisson–Germer 1927). Why it matters: wave
  interference is the mechanism behind **band gaps** (Arc 2).
- `CAN` — **Schrödinger, "Quantisierung als Eigenwertproblem" I–IV, *Annalen der
  Physik* 379:361 (1926).** Aha: quantization is an **eigenvalue problem** — the wave
  survives only if it *fits exactly* into the box, like a standing wave; allowed modes
  are **discrete by geometry**. Why it matters: the eigenvalue framing is the mathematical
  bridge from physics to the *linear-algebra core of ML* (energy levels ↔ weight
  matrices ↔ normal modes).
- `CAN` — **Schrödinger, *What is Life? The Physical Aspect of the Living Cell*,
  Cambridge UP (1944).** Aha: to store a million generations stably, the gene must be a
  **stable *aperiodic* crystal** — a long, non-repeating sequence = a **molecular
  code**. He predicted a digital, non-periodic information-bearing structure **~9 years
  before the 1953 double helix**. Why it matters: the physical root of the **digital
  code** (stable, discrete, aperiodic symbol chain) — the substrate of "information."
- `CAN` — **Pauli, "Über den Zusammenhang des Abschlusses der Elektronenhüllen mit dem
  Bau der Atome," *Z. Physik* 31:765 (1925).** Aha: **no two electrons share a quantum
  state** → electrons stack in shells → **the shell structure *is* the periodic table**.
  Why it matters: without Pauli there is no chemistry, no carbon, no complex molecules,
  no life, no brain. "Structure" is what ML learns.
- `CAN` — **Dirac, "The Quantum Theory of the Electron," *Proc. R. Soc. A* 117:610
  (1928).** Aha: making the electron equation *relativistic* **forces negative-energy
  solutions** → the **positron** (found 1932). *Math predicted a particle.* Companion:
  **Dirac, "Quantised Singularities in the Electromagnetic Field," *Proc. R. Soc. A*
  133:60 (1931)** — a single **magnetic monopole** forces electric charge to be
  **quantized** (the wavefunction's phase must be single-valued) → **charge is a
  topological integer.** Why it matters: (1) equations contain more truth than the
  input (emergence); (2) a **topological twist forces discreteness** — both motifs recur
  in how invariance constrains representable states.
- `CAN` — **Gamow (and independently Gurney & Condon), "Quantum theory of radioactivity,"
  1928.** Aha: **tunneling** — alpha decay is an electron/alpha *passing through* an
  energy barrier it classically cannot cross. Why it matters: tunneling is what makes the
  sun shine *and* what **flash memory / tunnel diodes / STM** use — quantum mechanics as
  a *device*.
- `CAN` — **Heisenberg, "Über den anschaulichen Inhalt der quantentheoretischen
  Kinematik und Mechanik," *Z. Physik* 43:172 (1927).** Aha: **uncertainty** — position
  and momentum cannot both be sharp; the *smoother* the wave in space, the *sharper* it
  is in momentum (a Fourier/duality fact). Why it matters: the **conjugacy** (position/
  momentum, energy/time) is the same duality that appears in signal processing and in
  the "bias–variance" / "locality–globality" trade-offs of learning.

---

## Arc 2 — Waves in a crystal: the geometry that makes solids (and the transistor) work

- `CAN` — **Bloch, "Über die Quantenmechanik der Elektronen in Kristallgittern," *Z.
  Physik* 52:555 (1928).** Aha: an electron in a *periodic* lattice is a **Bloch wave**
  (`u_k(r)·e^{ik·r}`) — a plane wave stamped with the atomic pattern — and it moves
  **ballistically, without scattering off the atoms**. Why it matters: the *actual
  reason a wire conducts*; the microscopic foundation of every semiconductor.
- `CAN` — **Brillouin, "Les ondes électrons dans les cristaux," *J. Physique et le
  Radium* 11:24 (1930); book *Wave Mechanics and Its Application* (1946).** Aha: the
  infinite crystal folds into one **fundamental cell in *momentum* space — the first
  Brillouin zone** (the Wigner–Seitz cell of the reciprocal lattice) — a polygon/hedron
  (hexagon 2-D, truncated octahedron 3-D) that **tiles** reciprocal space. Why it
  matters: band gaps, effective mass, and the whole semiconductor story are *features of
  this zone's boundary* — a **geometric object**. The archetypal "the answer lives in a
  compact shape that tiles a bigger space."
- `CAN` — **Band structure / the band gap** (synthesis: **Shockley, *Semiconductors and
  Dielectrics*, NSF 1950**; **Ashcroft & Mermin, *Solid State Physics*, 1976, Ch. 9–10**).
  Aha: fill the allowed bands and the **zone boundaries open gaps** — energies where *no*
  electron wave can exist (standing-wave interference, Brillouin's argument). A material
  is conductor / semiconductor / insulator **purely by where the Fermi level falls in
  this gap**. Why it matters: **the entire digital revolution rests on a
  quantum-mechanical band gap.** You cannot make a transistor, memory cell, or chip
  without a controllable energy gap. *Quantum mechanics is the transistor.*
- `CAN` — **Shockley, "The p-n Junction: A New Kind of Electronic Discharge Device,"
  *Proc. IRE* 40:1373 (1949).** Aha: press a "hole-rich" (p) and "electron-rich" (n)
  crystal together → a **built-in one-directional energy hill** → current flows one way,
  is blocked the other. A **diode is a sculpted energy topography**. Why it matters:
  "shape an energy landscape to control flow" is the founding move of solid-state
  electronics.
- `CAN` — **Bardeen & Brattain, "The Transistor-TYPE Electronic Amplifier," *Phys.
  Rev.* 74:570 (1948)**; **Shockley, "A Unipolar, 'Field-Effect' Transistor," *Proc.
  IRE* 35:345 (1947)** (Nobel 1956). Aha: a **tiny gate voltage bends the band edges**
  (reshapes the surface energy landscape) to **switch a carrier channel on/off** — a small
  signal *controls a big current*. The transistor is a **field-controlled quantum energy
  barrier**; the on/off states are the **0 and 1**. Why it matters: the **load-bearing
  wall of the digital age** — and of every GPU that trains an LLM. *The whole AI era is an
  energy-barrier device in disguise.*
- `OK` — **GMR — Baibich, Broto, Fert, Nguyen van Dau, et al., "Giant Magnetoresistance
  in Fe/Cr Multilayers," *Phys. Rev. Lett.* 61:2472 (1988)** (Fert group; companion:
  **Binaśch, Grüber, Grünberg, *J. Magn. Magn. Mater.* 120:111 (1988/89)**. Nobel 2007.)
  Aha: in a thin magnetic stack, resistance **jumps ~50%** depending on whether the
  layers' magnetizations are **parallel or antiparallel** (spin-dependent scattering from
  the spin-split d-band). Two **resistor channels, one "open" one "closed,"** set by the
  *relative angle of magnetic arrows* — a **spin valve**. Why it matters: GMR made
  hard-disk read heads sensitive enough to **store a bit in a nanometer magnetic domain**
  (and is the basis of MRAM). **A quantum spin (½) is used as a bit.**
- `CAN` — **Maser/laser: Schawlow & Townes, "Infrared and Optical Masers," *Phys.
  Rev.* 119:1760 (1958)**; **Maiman, "Stimulated Optical Radiation in Ruby," *Nature*
  187:493 (1960).** Aha: put many atoms in an excited state (**population inversion**) in
  a cavity and a **single photon triggers a chain of identical photons** — one phase, one
  frequency, one direction (**coherence**). A crowd falling in step. Why it matters:
  coherent single-wavelength light enables **photolithography** (carving chips),
  **fiber** (the internet's backbone), optical computing — the physical rails that move
  and make the data.

---

## Arc 3 — Computation is physics (the hard limits)

- `CAN` — **Landauer, "Irreversibility and Heat Generation in the Computing Process,"
  *IBM J. Res. Dev.* 5:183 (1961).** Aha: a *logically irreversible* operation
  (overwriting a bit, throwing away one bit of information) must dump **at least
  `k_B T ln 2`** of heat. **Computation is a physical, thermodynamic process**, not an
  abstract symbol game; deleting a bit is *crushing a distinction*, and the lost
  distinction *becomes heat*. Why it matters: the **floor on the energy of a logic
  operation** — the wall every "more efficient chip" is measured against; the profound
  link between **Shannon entropy** and **Boltzmann energy**.
- `OK` — **Margolus & Levitin, "The maximum speed of dynamical evolution," *Physica D*
  120:188 (1998). arXiv:quant-ph/9710043.** Aha: a system with average energy `E` above
  ground passes through **no more than `2E/(πħ)` distinguishable states** — a
  **quantum speed limit** set by its energy (a clock tick set by how much energy is in
  the page). Why it matters: the **hard ceiling on ops per joule** — why you can't make a
  computer arbitrarily fast just by adding power.
- `CAN` — **Bremermann, "Storage and Retrieval of Information Activated by Radiation,"
  *IEEE Trans. Inf. Theory* 11:140 (1965).** Aha: adding **mass/energy + gravity + c**
  gives a max ~`1.5×10^50 bits/s` for a 1-kg system — the **speed limit when *mass* is
  the budget**. Why it matters: with Margolus–Levitin it defines the **"ultimate
  laptop"** envelope inside which *all* computation (training + inference) must live.
- `OK` — **Lloyd, "Computational Capacity of the Universe," *Phys. Rev. Lett.* 88:237901
  (2002). arXiv:quant-ph/0110141** (companion: **"Ultimate Physical Limits to
  Computation," *Nature* 406:1047 (2000), arXiv:quant-ph/9908043**). Aha: combine
  Margolus–Levitin (ops/sec/energy) + the Bekenstein bound (bits) + the universe's
  mass/age → **the entire cosmos has performed at most ~`10^120` ops on ~`10^90` bits**
  since the Big Bang. The **universe is a finite, bounded computer** with a *known total
  budget*. Why it matters: a **cosmic upper bound on any computation** — the frame for
  "how far can intelligence scale?" and the "physical Church–Turing" idea.
- `OK` — **Bekenstein, "Universal Upper Bound on the Entropy-to-Energy Ratio for Bounded
  Systems," *Phys. Rev. D* 23:287 (1981)** (originals: *"Black Holes and Entropy,"
  Phys. Rev. D 5:1239 (1972)*; *"Generalized Second Law…," Phys. Rev. D 7:2333 (1973)*).
  Aha: the max information in a region is set by its **surface area in Planck units**
  (BH entropy `S = A/4 l_P²`), **not its volume**. The information in a box is written on
  its **skin, like a hologram** — the *boundary* carries the *interior*. Why it matters:
  the *physical* "holographic" intuition — a complex interior fully described by its
  **boundary** — the deepest cousin of **embeddings** and manifold learning.
- `OK` — **Hawking, "Black Hole Explosions?," *Nature* 248:30 (1974)** (full: *"Particle
  Creation by Black Holes," *Commun. Math. Phys.* 43:199 (1975)*). Aha: QFT at the
  horizon shows a black hole **glows at a temperature** `T = ħc³/(8πGMk_B)` — *smaller
  holes are hotter*; it shrinks as it cools. If it evaporates into featureless thermal
  radiation, **where does the information go?** — the **information paradox** (a clash of
  unitary QM and thermodynamics). Why it matters: the driving force behind
  "quantum information is fundamental and conserved" — the same conservation behind
  reversible computing.
- `OK` — **Maldacena, "The Large N Limit of Superconformal Field Theories and
  Supergravity," *Adv. Theor. Math. Phys.* 2:231 (1998). arXiv:hep-th/9711200** (AdS/CFT).
  Aha: a **gravity theory in a (d+1)-volume is exactly equivalent to a QFT on its
  d-boundary** — the **holographic principle made precise**: a 3-D scene whose complete
  description is on the 2-D screen at its edge; "depth" (gravity) *emerges* from the
  boundary's entanglement. Why it matters: the most rigorous statement that **a
  high-dimensional complex system can be encoded on a lower-dimensional boundary** — the
  deepest physical cousin of dimensionality reduction and the geometry of information.

---

## Arc 4 — Thermodynamics ↔ information (the loss function is entropy)

- `CAN` — **Shannon, "A Mathematical Theory of Communication," *Bell Sys. Tech. J.* 27:379
  (1948).** Aha: information = **surprise = entropy** `H = −Σ p log p`, in **bits**, and
  it is the **same object as Boltzmann's thermodynamic entropy**. A fair coin flip is the
  maximum surprise per flip. Why it matters: Shannon's `−Σ p log p` is **literally the
  loss function of deep learning (cross-entropy / NLL)** — the objective you minimize *is*
  an information-entropy.
- `CAN` — **Maxwell's demon** (*Theory of Heat*, 1871, Ch. X; first in an 1867 letter to
  Tait) **+ the Landauer resolution (Arc 3).** Aha: a demon that *sorts* fast/slow
  molecules seems to violate the 2nd law — until it must **erase its memory**, and by
  Landauer that erasure pays `kT ln2` per bit. **Information and entropy are the same
  currency; a bit has a physical cost.** *Knowing costs heat.* Why it matters: closes the
  loop thermo ↔ information ↔ computation; grounds the energy cost of *storing* and
  *forgetting* in any computer.

---

## Arc 5 — Symmetry, order, and topology (the unifying "Ahas")

- `CAN` — **Noether, "Invariante Variationsprobleme," *Nachr. Ges. Wiss. Göttingen* 235
  (1918).** Aha: **every continuous symmetry gives a conservation law** (time → energy,
  space → momentum, rotation → angular momentum, phase → charge) and vice versa. If a
  law "looks the same" under a transformation, a quantity "never changes." **Symmetry is
  the reason the universe keeps accounts.** Why it matters: the deep reason
  **"equivariance" / symmetry matters in neural networks** (GNNs, GDL) — you build the
  symmetries of the data *into* the network to conserve structure.
- `CAN` — **Onsager, "Crystal Statistics. I. A Two-Dimensional Model with an
  Order-Disorder Transition," *Phys. Rev.* 65:117 (1944).** Aha: the 2-D grid of
  co-flipping magnets is solved **exactly**, with a **sharp phase transition** at a
  precise Curie temperature where *disorder becomes order* — a grid of arrows that below
  `T_c` **all at once snap into alignment**. Why it matters: this *is* the **Ising
  model** — the standard toy for **phase transitions in learning** and the
  Hopfield/Boltzmann machine as an *exactly-on* Ising system; its exact solution
  **birthed conformal field theory** and the modern theory of **universality**.
- `CAN` — **Spontaneous symmetry breaking: P. W. Anderson, *Phys. Rev.* 130:837 (1963);
  P. W. Higgs, *Physics Letters* 12:132 (1964).** Aha: the *laws* are perfectly
  symmetric, but the **lowest-energy state picks one direction and "breaks" it** — a
  magnet's arrows all choose the *same* axis though the physics is rotationally
  symmetric. A **pencil balancing on its tip**: the rules are symmetric, but it *falls
  one way*; that choice is the **order parameter** below the Curie temperature. Why it
  matters: "symmetric laws → asymmetric world" is the template for **emergent
  structure** — a symmetric, random-init network *breaks* symmetry into a specific
  trained state (and it underlies the Higgs mechanism).
- `CAN` — **Penrose tiling (1973–74) + quasicrystals: D. Shechtman, I. Blech, D. Gratias,
  J. W. Cahn, "Metallic Phase with Long-Range Orientational Order and No Translational
  Symmetry," *Phys. Rev. Lett.* 53:1951 (1984)** (Nobel 2011). Aha: Penrose tiles fill
  the plane with **perfect long-range order but *no repeating unit cell*** and show
  **five-fold symmetry** (forbidden in ordinary crystals); Shechtman found it *in real
  metal* (Al–Mn). A pattern that **never repeats but never breaks** — and (via
  cut-and-project) a *slice of a 5-D periodic lattice*. Why it matters: directly echoes
  Schrödinger's "aperiodic crystal" (the gene): **stable, non-repeating, long-range
  order** is the physical basis of *sequence*.
- `CAN` — **Aharonov–Bohm effect: Y. Aharonov & D. Bohm, *Phys. Rev.* 115:485 (1959).**
  Aha: an electron beam split around a **region of magnetic field it *never enters***
  still interferes, shifted by the **line integral of the vector potential** `∮A·dl`.
  The electron "remembers" the *geometry of a hole it never went through* — a
  **holonomy**. Why it matters: **topology entering physics** — a global geometric
  quantity (flux, a loop integral) affects the outcome; the same idea behind
  **geometric/topological features in data** (loops, holes, curvature) and why *how* a
  path winds can matter more than *where* it goes.
- `CAN` — **Berry phase: M. V. Berry, *Proc. R. Soc. A* 392:45 (1984)** (companion:
  Aharonov & Anandan, *Phys. Rev. Lett.* 65:1697 (1990)). Aha: a quantum state carried
  around a **closed loop** in parameter space returns with an extra **geometric phase**
  equal to the **curvature (Berry curvature) of the state's bundle** — a *shape* of the
  path, not a rate. A spin ball rolled around a closed loop ends **rotated** by the
  **solid angle** it traced — *the phase is the area, not the speed.* Why it matters:
  Berry curvature is the origin of the **quantum Hall effect and topological
  insulators**, and the template for the **"geometry of the learning trajectory."**
- `CAN` — **Thouless, Kohmoto, Nightingale, den Nijs, "Quantized Hall Coefficient as a
  Topological Invariant," *Phys. Rev. Lett.* 49:405 (1982)** (Nobel 2016). Aha: the
  quantized Hall conductance equals an **integer (the first Chern number)** — how the
  electron wavefunctions **twist** going once around the Brillouin zone; it cannot change
  by small perturbation, only by a **topological phase transition** (a gap closing).
  Why it matters: the purest statement that **a global topological property of a band
  (its "twist") determines a measurable quantity and is robust to noise** — the physical
  root of **topological data analysis** and robust feature signatures.
- `CAN` — **Haldane, "Model of a Quantum Hall Effect without Landau Levels…," *Phys.
  Rev. Lett.* 61:2015 (1988).** Aha: on a **flat honeycomb lattice** (graphene) with a
  *complex* next-nearest-neighbor hop you get a **quantum Hall effect with *no external
  field*** — topology from the **lattice's own geometry** + broken time-reversal; the Hall
  conductance is the **Chern number of two Dirac cones** (two cone tips each carry a
  signed "charge"; the sum is the invariant). Why it matters: **topology can live in the
  lattice geometry itself** — a metaphor for *intrinsic* structure in data.
- `CAN` — **Topological insulators: C. L. Kane & E. J. Mele, *Phys. Rev. Lett.* 95:226801
  (2005). arXiv:cond-mat/0505505; X.-L. Qi & S.-C. Zhang, *Rev. Mod. Phys.* 83:1057
  (2011). arXiv:1006.4953.** Aha: a material **insulating in the *bulk* but *metallic* on
  its *surface*** — the conducting surface states are **protected by time-reversal
  symmetry**; they can't be removed without a phase transition. The **Dirac-cone** band
  structure whose **twist (Z₂ invariant)** makes the *boundary* conduct while the *inside*
  is dead. Why it matters: the cleanest physical picture of **"the boundary behaves
  differently from the bulk, for a topological reason"** — the same boundary/bulk logic in
  manifold learning and symmetry-protected robust features.

---

## Arc 6 — Wild functions & the infinite (the geometry of the impossible)

- `CAN` — **Cantor, "Ueber eine elementare Frage der Mannigfaltigkeitslehre," *Jahresber.
  Dtsch. Math.-Ver.* 1:75 (1891)** (precursor 1874, *J. Reine Angew. Math.* 84:1).
  Aha: the **diagonal argument** — flip the *n*-th digit of the *n*-th row of *any* list
  of infinite bit-strings; the new string differs from every row on its own diagonal, so
  it's on no list. **There are more reals than naturals: the infinite is not one size**
  (ℵ₀ < 2^ℵ₀ < …). The diagonal line is the **visual spine**. Why it matters:
  diagonalization is the exact proof-move behind **Turing's halting result** and the
  existence of **unlearnable function classes**; no model can enumerate all truths about
  itself.
- `CAN` — **Weierstrass (1872; publ. 1895), "Über continuirliche Functionen…,"
  *Mathematische Werke* vol. 2:71** (Hausdorff dimension of the graph finally settled by
  **Shen, *Math. Z.* 289:223 (2018), arXiv:1505.03986**). Aha: `Σ aⁿ cos(bⁿπx)` is
  **continuous everywhere but differentiable nowhere** — an infinitely crinkled line.
  Double aha: (1) the "nicely drawn" calculus curves are a *tiny, atypical* corner of the
  world of functions; (2) **most** continuous functions are this wild (a Baire-category
  fact). **Smoothness is the exception, not the rule.** Why it matters: the 1872 seed of
  fractals and of "high-frequency, low-magnitude" structure; foreshadows how deep nets
  encode detail across scales and why **smoothness (Lipschitz, spectral bias)** is a real,
  measurable property of learned functions.
- `CAN` — **Space-filling curves: Peano, *Math. Annalen* 36:157 (1890).
  doi:10.1007/BF01199438; Hilbert, "Ueber die stetige Abbildung einer Linie auf ein
  Flächenstück," *Math. Annalen* 38:459 (1891). doi:10.1007/BF01199431.** Aha: a
  continuous curve from a **line segment** can pass through **every point of a square** —
  you can continuously *surject* [0,1] onto the 2-D square; dimension is not what
  intuition says. The catch: no such map can be one-to-one (the square has no cut-points).
  Hilbert's iterative picture (each step fills 3/4 more) is the visual aha. Why it
  matters: **space-filling (Z-order/Hilbert) curves** are a real technique for turning
  high-dimensional points into 1-D orderings that **preserve locality** — the same
  "locality-preserving encoding" behind locality-sensitive hashing and data layout.
- `CAN` — **The Mandelbrot set: Brooks & Matelski (1978, first drawn); Mandelbrot (1980,
  IBM); Douady & Hubbard, *Bull. AMS* 12:482 (1985)**; **Mandelbrot, *The Fractal
  Geometry of Nature*, Freeman (1982)**; **Mandelbrot, "How long is the coast of
  Britain? Statistical self-similarity and fractional dimension," *Science* 156:636
  (1967).** Aha: the set is the **parameter space** of the single quadratic map
  `z ↦ z² + c`: mark `c` if, starting at 0, the iterates stay bounded. The picture of
  *this set of all behaviors* has an **infinitely detailed fractal boundary**; every
  "bulb" is a region of a different periodic behavior — a **map of maps** classifying an
  entire universe of simple dynamical systems in one 2-D image. The coastline paradox
  (length depends on the ruler → **fractional dimension**) is the founding intuition that
  **roughness is a dimension, not a defect.** Why it matters: the visual archetype for
  "simple local rule → globally rich, scale-free structure," and the reason
  **"iteration of a simple function"** is the recurring engine of generative/dynamical
  models.
- `CAN` — **Jordan curve theorem: Camille Jordan, *Cours d'analyse* (1887); Veblen,
  *Trans. AMS* 6:83 (1905). doi:10.2307/1986378; Osgood, *Trans. AMS* 4:107 (1903).
  doi:10.2307/1986455.** Aha: "every simple closed curve divides the plane into an inside
  and an outside" *feels obvious* but took decades to prove for *arbitrary* (possibly
  fractal) curves — because **"inside" has no local, pointwise definition; it is a global
  topological property.** Osgood built a Jordan curve that encloses **positive area**.
  Why it matters: the **ray-casting test** (count crossings; odd = inside) is the
  workhorse of computational geometry and polygon masks in vision — a concrete, drawable
  instance of a deep topological fact.

---

## Arc 7 — Chaos, criticality, and the edge of chaos

- `CAN` — **Lorenz, "Deterministic Nonperiodic Flow," *J. Atmospheric Sciences* 20:130
  (1963).** Aha: **three** simple ODEs for convection produce the **butterfly** — two
  lobes joined at a saddle, with trajectories that never repeat yet never escape.
  Sensitive dependence made **visible** as a bounded, folded ribbon. Why it matters: the
  archetype for why chaotic/chaotic-ish dynamics and long-horizon sensitivity recur in
  recurrent and dynamical-network training.
- `CAN` — **May, "Simple mathematical models with very complicated dynamics," *Nature*
  261:459 (1976).** Aha: the **logistic map** `x → rx(1−x)` bifurcation diagram — as `r`
  climbs, fixed point → period 2 → 4 → 8… **doubling endlessly** before bursting into
  chaos, with **self-similar windows** repeating at smaller and smaller scales. Why it
  matters: the single cleanest demo that a one-line update rule yields order/chaos
  transitions — the skeleton behind "edge of chaos."
- `CAN` — **Hénon, "A two-dimensional mapping with a strange attractor," *Commun. Math.
  Phys.* 50:69 (1976). doi:10.1007/BF01608556; Rössler, "An Equation for Continuous
  Chaos," *Phys. Letters A* 57:397 (1976).** Aha: a quadratic map in the plane = a
  **folded, crumpled band** (a genuine strange attractor: fractal cross-section,
  stretch-and-fold); Rössler's is a **single spiral sheet** that lifts and re-folds — the
  sparsest 3-D chaotic flow. Why it matters: canonical discrete/dynamical-system testbeds;
  the model's geometry (stretch/fold) is what "chaotic" *means* for trained maps.
- `CAN` — **Kaplan & Yorke, "Chaotic Behavior of Multidimensional Difference Equations,"
  *Lecture Notes in Math.* 730:204 (1979)** (companion: **Frederickson, Kaplan, Yorke,
  Yorke, *J. Diff. Equations* 49:185 (1983)**). Aha: the first rigorous **fractal
  dimension** for attractors from **Lyapunov exponents** (the Kaplan–Yorke formula):
  count the expanding directions, sum their exponents — turns a tangle into a single
  non-integer number (~2.05 for Lorenz). Why it matters: the **Lyapunov-exponent
  machinery** underlies every modern "how chaotic is this trained network" measurement.
- `CAN` — **Grassberger & Procaccia, "Measuring the Strangeness of Strange Attractors,"
  *Physica D* 9:189 (1983).** Aha: the **correlation-dimension** recipe — count pairs of
  points within distance `r`, scale `r`, read the slope; you can read an attractor's
  geometry off a **scalar time series**. Why it matters: a practical method for
  estimating an **effective dimension from activations** — directly transferable to
  probing representation geometry.
- `CAN` — **Feigenbaum, "Quantitative Universality for a Class of Nonlinear
  Transformations," *J. Statistical Physics* 19:25 (1978).** Aha: in the logistic map the
  spacing between successive doublings shrinks by a **fixed factor δ ≈ 4.6692016…** — the
  **same number for every** unimodal map. A **universal constant hiding inside a specific
  curve.** Why it matters: the first "physics constant" of nonlinear dynamics; the
  template for **universal scaling laws** that recur in deep learning (critical exponents
  at phase transitions).
- `CAN` — **Langton, "Computation at the Edge of Chaos," *Physica D* 42:12 (1990)**
  (full: *Complex Systems* 4:409 (1990)); **Mitchell, Hraber & Crutchfield, *Complex
  Systems* 7:89 (1993). arXiv:adap-org/9303003**; **Melby et al., *Phys. Rev. Lett.*
  84:5991 (2000). arXiv:nlin/0007006.** Aha: cellular automata sort into a **phase
  diagram** — frozen (ordered) → chaotic → a **razor-thin critical "edge"** in between
  where **information propagates furthest**. *Computation lives on the knife-edge.* The
  self-adjusting logistic map **drifts autonomously** toward the chaotic threshold. Why it
  matters: the core claim that **learning systems perform best poised between order and
  chaos** — the conceptual spine of "criticality in ML."
- `CAN` — **Bak, Tang & Wiesenfeld, "Self-organized criticality: An explanation for the
  1/f noise," *Phys. Rev. A* 38:364 (1988)** (companion: **Mora & Bialek, "Are
  Biological Systems Poised at Criticality?" arXiv:1012.2242 (2010)**). Aha: add grains to
  a **sandpile** and it **self-organizes to the edge of collapse** — avalanches of *any*
  size occur with **power-law frequency**, no external tuning. **Criticality as an
  attractor state, not a fine-tuned point.** Why it matters: the reason neural activity
  and network losses show 1/f and power-law bursts — "the system organizes itself to the
  edge of chaos."
- `CAN` — **Percolation: Broadbent & Hammersley, "Percolation Processes I. Crystals and
  Mazes," *Proc. Cambridge Phil. Soc.* 53:629 (1957). doi:10.1017/S0305004100032680**;
  **Newman, "Spread of Epidemic Disease on Networks," *Phys. Rev. E* 66:016128 (2002).
  arXiv:cond-mat/0205009.** Aha: below a threshold only tiny clusters; **at a critical
  `p` a giant connected cluster suddenly spans the whole system** — a **geometric phase
  transition**. On a scale-free network an epidemic persists at a *tiny* infection rate
  because the **threshold depends on the graph's shape, not just its size**. Why it
  matters: the rigorous model of **connectivity emerging at a threshold** — the basis for
  connectivity/sparse phase transitions in networks and random graphs.
- `CAN` — **Turbulence: Richardson, *Weather Prediction by Numerical Process* (1922),
  p. 66; Kolmogorov, "The General Theory of the Local Structure of Turbulence at Large
  Reynolds Numbers," *Dokl. Akad. Nauk SSSR* 31:99 (1941) / *J. Fluid Mech.* 1:39 (1941).
  doi:10.1017/S0022112041000022**; **Frisch, *Turbulence: The Legacy of A. N.
  Kolmogorov*, CUP (1995).** Aha: **"Big whirls have little whirls that feed on their
  velocity…"** — an energy **cascade across scales**; dimensional analysis alone forces
  the inertial-range spectrum `E(k) ∝ k^(−5/3)` — a **straight line on a log-log plot**,
  one of the most confirmed power laws in physics. Why it matters: the textbook example of
  **self-similarity + scale invariance producing a scale-free spectrum** — the statistical
  counterpart of fractal dimension (and a caution: intermittency / multifractals is where
  "universality breaks down").

---

## Arc 8 — The brain, free energy, and predictive processing

- `OK` — **Friston, "The free-energy principle: a unified brain theory?" *Nature Reviews
  Neuroscience* 11:127 (2010)** (companion set: **"The free-energy principle: a rough
  guide to the brain?" *Trends Cogn. Sci.* 13:293 (2009)**; **"A Free Energy Principle for
  Biological Systems," *Entropy* 14:2100 (2012)**; **Friston & Kiebel, "Predictive coding
  under the free-energy principle," *Phil. Trans. R. Soc. B* 364:1211 (2009)**; book:
  **Friston, *The Free Energy Principle*, OUP (2017)**). Aha: the brain, like a gas
  relaxing to thermal equilibrium, **flows downhill on a "surprise" landscape** (the
  **variational free energy**, an upper bound on surprise). Perception infers hidden
  causes; action changes the world to fit predictions — **the same variational problem**.
  Visually: a ball always rolling downhill on a surprise landscape. Why it matters: the
  conceptual parent of energy-based models, VAEs, and the ELBO objective; reframes an
  LLM's next-token prediction as **surprise-reduction**.
- `OK` — **Rao & Ballard, "Predictive coding in the visual cortex: a functional
  interpretation of some extra-classical receptive-field effects," *Nature Neuroscience*
  2:787 (1999). doi:10.1038/4580** (companion: **Bastos et al., "Canonical Microcircuits
  for Predictive Coding," *Neuron* 76:695 (2012)**). Aha: the visual cortex is a
  **hierarchy of generative models** where each level predicts the next level's input and
  transmits **only the prediction error (residual)** upward — the **feedforward signal is
  the *mistake*, not the data.** A cascade of corrections, each layer subtracting off its
  best guess and passing the leftover. Why it matters: the biological origin of the
  **predictive-coding / residual** architecture that deep nets and autoencoders implement.
- `OK` — **The Bayesian brain: Knill & Pouget, "The Bayesian brain," *Trends in
  Neurosciences* 27:712 (2004)** (companion: **Shams, Ma & Beck, *Annu. Rev. Neurosci.*
  28:257 (2005)**; **Clark, "Whatever next? Predictive brains, situated agents, and the
  future of cognitive science," *Behav. Brain Sci.* 36:181 (2013)**). Aha:
  **perception = inference** — the brain keeps a **probabilistic generative model** and the
  neurons encode the *uncertainty* (variance) of its estimates; you "see" the
  **posterior**, not the stimulus. A probability cloud over world-states that the senses
  keep nudging. Why it matters: the foundation of probabilistic ML and of an LLM's
  next-token prediction as **inferring latent causes of the text** — the "brain as first
  LLM" intuition, grounded.
- `OK` — **ELBO = Gibbs free energy: M. I. Jordan, Z. Ghahramani, T. Jaakkola, L. Saul,
  "An Introduction to Variational Methods for Graphical Models," *Machine Learning*
  37:183 (1999). doi:10.1023/a:1007665907178**; **M. J. Beal, "Variational Inference: A
  Review for Statisticians," UCI-ICS-TR-2003-24.** Aha: the variational free energy
  `F(q) = E_q[log q − log p(x,θ)] = KL(q‖p) − log p(x)` has the **exact `E − TS`
  structure of Gibbs free energy** (energy term = expected log-likelihood; entropy term =
  spread of `q`). "Inference" (updating `q`) is the system **relaxing toward the
  equilibrium state** closest to the constraint — geometrically, projecting the true
  posterior onto a simpler family by finding the **closest point in a divergence metric**.
  Why it matters: makes explicit that the **VAE/ELBO objective *is* thermodynamic free
  energy** — the deep reason the free-energy principle and variational Bayes coincide.
- `OK` — **Softmax = Boltzmann: Ackley, Hinton & Sejnowski (already cited 1985); Hinton,
  "A Practical Guide to Training Restricted Boltzmann Machines" (2012)**; **Hinton,
  Osindero & Teh, "A Fast Learning Algorithm for Deep Belief Nets," *Neural Computation*
  18:1527 (2006)**; **Hinton, "Training Products of Experts by Minimizing Contrastive
  Divergence," *Neural Computation* 14:1771 (2002)**; **Dawid & LeCun, "Introduction to
  latent variable energy-based models…," *J. Stat. Mech.* 2024:104011.** Aha: a
  Boltzmann machine assigns `p(state) ∝ exp(−E/kT)` — **the logit is the negative
  energy**, and the output distribution **is the Boltzmann distribution at temperature
  `T`**. `softmax(x/T)` *is* this distribution. **An LLM's "temperature" is a literal
  physical temperature; sampling a token = drawing a state from the thermal equilibrium
  of an energy landscape** (`T→0` = argmax/ground state, `T→∞` = uniform). Why it
  matters: unifies **LLM decoding with statistical mechanics** — "greedy" is the
  zero-temperature limit, "sampling" is finite-temperature equilibrium.
- `OK` — **Neural criticality: Plenz, Ribeiro, Miller, et al., "Self-Organized
  Criticality in the Brain," arXiv:2102.09124 (2021)**; **Tian, Tan, Hou, et al.,
  "Theoretical foundations of studying criticality in the brain," *Network Neuroscience*
  6:1148 (2023). arXiv:2306.05635**; **Zeraati, Priesemann & Levina, "Self-organization
  toward criticality by synaptic plasticity," *Front. Phys.* 9:619661 (2021).
  arXiv:2010.07888.** Aha: cortex **self-organizes to a 2nd-order phase transition**
  (the edge of chaos): activity comes in **scale-free power-law avalanches** (branching
  ratio ≈ 1), the signature of criticality; **homeostatic synaptic plasticity is the
  mechanism that *maintains* the edge.** Why it matters: empirical grounds for "the brain
  is tuned to a phase transition" — **maximal information / dynamic range / sensitivity**.
- `OK` — **The brain near the energy limit of computation: Attwell & Laughlin, "An Energy
  Budget for Signaling in the Grey Matter of the Brain," *J. Cereb. Blood Flow Metab.*
  21:1133 (2001)**; **Levy & Calvert, *PNAS* 118 (2021). arXiv:2102.06273.** Aha: the
  ~20 W budget splits into ~0.1 W local computation + ~3.5 W long-range communication;
  the biological efficiency is **~10^8× the ideal** — the brain towers ~a **billion×
  above a GPU** on a computation-per-joule bar chart. Why it matters: the canonical
  quantification of the brain's **extreme energy efficiency** — the target
  neuromorphic/spiking hardware chases.
- `CAN` — **Braitenberg, *Vehicles: Experiments in Synthetic Psychology*, MIT Press (1984).**
  Aha: **behavior (light-seeking, approach) emerges from a *few* sensor→motor wires** — no
  symbols, no program. Each "vehicle" is a tiny **graph**; complex goal-directed behavior
  falls out of the **graph's shape and sign conventions**. Why it matters: the earliest
  proof that **intelligence is about the *structure* of connections, not their
  substance** — a conceptual ancestor of neural nets.

---

## Arc 9 — Algorithmic information & compression (prediction = compression)

- `OK` — **Kolmogorov, "Three approaches to the quantitative definition of information,"
  *Problemy Peredachi Informatsii* 1:3 (1965); Eng. *Int. J. Comput. Math.* 2:157
  (1968). doi:10.1080/00207166808803030.** Aha: the **information in a string = the length
  of the *shortest program* that prints it**; a string is **random ⟺ incompressible**
  (its shortest description is itself). Visually: each string is a point, and
  "distance to the origin" = compressibility — random strings are the farthest away. Why
  it matters: the rigorous foundation for **"compression = understanding"** — a model
  understands data to the degree it compresses it; randomness is the hard limit.
- `OK` — **Chaitin: "A Theory of Program Size Formally Identical to Information Theory,"
  *J. ACM* 22:329 (1975). doi:10.1145/321892.321894**; **"A Program whose Existence Cannot
  be Proved," *J. ACM* 22 (1975)** (the **Ω** paper); book: **Chaitin, *Information,
  Randomness and Incompleteness* (1974/2004). doi:10.1017/CBO9780511608858**; **Li &
  Vitányi, *An Introduction to Kolmogorov Complexity and Its Applications* (1997; 5th
  ed. 2019). doi:10.1007/978-3-030-11298-1.** Aha: there is a **number — the halting
  probability Ω** — perfectly well-defined (the probability a random program halts) yet
  **uncomputable**: no algorithm prints its bits, and its bits are **algorithmically
  random**. The halting problem given a **concrete face**: some true statements are true
  **for no reason** (brute-force random), with no shorter explanation. Why it matters: a
  **hard ceiling on "understanding"** — true facts exist that no learning system can
  compress or explain, only memorize.
- `OK` — **Huffman, "A Method for the Construction of Minimum-Redundancy Codes," *Proc.
  IRE* 40:1098 (1952). doi:10.1109/JRPROC.1952.273898.** Aha: the **optimal prefix code**
  gives shorter codewords to more frequent symbols, and the **expected length = the
  source entropy** — a **binary tree** where frequent symbols sit near the root (short
  paths) and rare ones deep; the tree's weighted path length *is* the entropy.
  **Compression = removing redundancy = measuring information.** Why it matters: the
  foundation of **"perplexity = bits/char = compression ratio."**
- `OK` — **LZ77/LZ78: Ziv & Lempel, "A Universal Algorithm for Sequential Data
  Compression," *IEEE Trans. Inf. Theory* 23:337 (1977). doi:10.1109/TIT.1977.1055714**;
  **"Compression of Individual Sequences via Variable-Rate Coding," *IEEE Trans. Inf.
  Theory* 24:530 (1978). doi:10.1109/TIT.1978.1055934.** Aha: builds a **dictionary of
  repeated substrings on the fly** — each new string is "already seen, point to it
  (offset, length)" or "new, remember it." **Universal** (any source); LZ78 parses into a
  **library of distinct phrases** referenced by index. Why it matters: the ancestor of
  zip/PNG **and of the "dictionary" idea in LLM tokenization (BPE)** — both learn a
  dictionary of the most reusable sub-units of the stream.
- `OK` — **Solomonoff, "A Formal Theory of Inductive Inference," *Information and
  Control* 7:1 (1964). doi:10.1016/S0019-9958(64)90223-2**; **Cover & Thomas, *Elements of
  Information Theory* (2006). doi:10.1002/047174882x**; **Hutter, "A Theory of
  Artificial Intelligence," *Ann. Math. Artif. Intell.* 71:221 (2013).
  doi:10.1007/s10472-013-9336-5.** Aha: **optimal prediction = universal compression** —
  the best predictor of the next symbol is (up to a universal constant) the **best
  compressor** of the sequence (Solomonoff). The **source-coding theorem**: the minimum
  average bits to encode a message = its **cross-entropy** with the true distribution.
  So an **LLM's cross-entropy loss = average bits/char = the compression ratio.** Why it
  matters: the theorem that makes **"language model = compressor" *true*, not a slogan**;
  Hutter's AIXI/Solomonoff ties prediction + compression + action into one exact theory.

---

## Arc 10 — The geometry, topology & optimal transport of deep learning

### 10a. Optimal transport — the "earth-mover" geometry of generative learning
- `OK` — **Cuturi, "Sinkhorn Distances: Lightspeed Computation of Optimal Transportation
  Distances," NeurIPS 2013. arXiv:1306.0895.** Aha: the OT problem (move a sand-pile to a
  target shape at least cost) is a *linear program* — but **add one entropy term** and it
  becomes *smooth and differentiable*, solved by **alternating row/column normalizations
  (Sinkhorn–Knopp scaling)** → a doubly-stochastic matrix. You *see* two blobs of mass
  "stretched" into a smooth coupling; the cost is the length of the flow. Why it matters:
  the algorithm that made OT **trainable**, and (see 10b) **the same scaling loop is
  softmax.**
- `OK` — **Peyré & Cuturi, "Computational Optimal Transport," *Found. Trends ML* 11:355
  (2019). arXiv:1803.00567.** Aha: a probability distribution is a point in a space whose
  **geometry is the Wasserstein distance**; generative learning is **deforming one cloud
  into another along the cheapest path** (the Monge map). Unlike KL (which only compares
  densities point-by-point and **collapses on disjoint manifolds**), **OT respects the
  shape of the data.** Why it matters: the canonical monograph for
  **OT-as-the-geometry-of-generatives.**
- `OK` — **Feydy, Séjourné, Vialard, Amari, Trouvé & Peyré, "Interpolating between
  Optimal Transport and MMD using Sinkhorn Divergences," ICML 2019. arXiv:1810.08278.**
  Aha: there is a **dial (entropy `ε`)** that continuously deforms the sharp, geometric OT
  distance into the kernel-like MMD — the interpolant keeps OT's **geometry** at small
  `ε` and MMD's **sample-efficiency** at large `ε`. **Geometric entropy is what makes the
  transport map soft and differentiable.** *(Correction: this is the correct identity of
  "Feydy 2019" — it is **not** the attention paper; the attention–OT link is 10b.)* Why it
  matters: the rigorous home of **"softmax = entropically-regularized OT."**
- `OK` — **Genevay, Peyré & Cuturi, "Learning Generative Models with Sinkhorn
  Divergences," AISTATS 2018. arXiv:1706.00292.** Aha: a GAN/VAE trained with an OT loss
  is learning a **transport map from noise to data**, differentiable end-to-end by
  backpropagating **through the Sinkhorn fixed-point loop** — "where does each grain of
  noise sand go?" Why it matters: first practical proof that OT losses train real
  generative models.
- `OK` — **Benamou, Carlier, Cuturi, Nenna & Peyré, "Iterative Bregman Projections for
  Regularized Transportation Problems," *J. Sci. Comput.* (2015). arXiv:1412.5154.** Aha:
  entropic OT is a sequence of **Bregman projections** (alternating projections onto the
  marginal constraints) — Sinkhorn iterations are exactly **projecting a matrix onto the
  transportation polytope under a KL geometry**. Why it matters: explains *why* Sinkhorn
  converges; unifies OT with projection methods.
- `CAN` — **Ambrosio, Gigli & Savaré, *Gradient Flows: Metric Structure and Metric in
  the Theory of Optimal Transport,* Birkhäuser (2008).** Aha: "gradient descent"
  generalized to the **space of probability measures** with the Wasserstein metric — a
  probability cloud flowing downhill is a **Wasserstein gradient flow**, the natural
  setting where **OT meets the calculus of variations.** Why it matters: the mathematical
  foundation tying **OT, entropy, and gradient flow** together.

### 10b. Attention = optimal transport; softmax = entropic OT + Fisher geometry
- `OK` — **Mialon, Chen, d'Aspremont & Mairal, "A Trainable Optimal Transport Embedding
  for Feature Aggregation and its Relationship to Attention," ICLR 2021.
  arXiv:2006.12065.** Aha: an **attention/pooling layer over a set of features is the
  optimal transport plan** between the input set and a small trainable "reference"
  (prototype) measure — the **attention weights are a coupling**, and softmax
  normalization is the **marginal constraint.** Why it matters: the first clean rigorous
  statement that **attention *is* a transport plan.**
- `OK` — **Zhang, Zhang, Lacoste-Julien, Burghouts & Snoek, "Unlocking Slot Attention by
  Changing Optimal Transport Costs," ICML 2023. arXiv:2301.13197.** Aha: **slot attention
  (object discovery) is *unregularized* OT** — a deterministic **assignment / perfect
  matching** of objects to slots; regularized (Sinkhorn) attention loses that crisp
  tie-breaking. A **bipartite matching** picture. Why it matters: the *cost function*
  choice in attention is a choice of **transport regularity.**
- `OK` — **Litman, "Scaled-Dot-Product Attention as One-Sided Entropic Optimal
  Transport," arXiv:2508.08369 (2025).** Aha: the **attention forward pass is the exact
  solution** to a **one-sided entropic OT** (maximize similarity subject to a fixed
  marginal + maximal entropy) — which is **precisely softmax**. And the
  **Fisher-information geometry** of this problem **forces the backward pass to be an
  advantage-based policy gradient.** **One formula unifies attention (softmax),
  statistical mechanics (entropy), and geometry (Fisher metric / transport).** Why it
  matters: the single deepest "aha" — softmax, Markov kernels, and information geometry
  **collapse into one optimization.**

### 10c. Diffusion models as Schrödinger bridges (quantum mechanics)
- `OK` — **De Bortoli, Thornton, Heng & Doucet, "Diffusion Schrödinger Bridge with
  Applications to Score-Based Generative Modeling," NeurIPS 2021 (spotlight).
  arXiv:2106.01357** (companion: **Shi, De Bortoli, Deligiannidis & Doucet, *UAI* 2022.
  arXiv:2202.13460**; **De Bortoli, Korshunova, Mnih & Doucet, arXiv:2409.09347**).
  Aha: a **Schrödinger bridge** is the **most-likely path a diffusing (quantum-like) cloud
  takes between two fixed marginals** — the entropy-regularized optimal transport **on
  path space.** A diffusion model is exactly a **bridge from a Gaussian to the data**;
  you **generate by riding the "most probable quantum trajectory"** rather than running
  noise all the way down. Why it matters: gives the **quantum-mechanical aha** (diffusion
  as a *quantum* object) with a working algorithm; distinct from the already-cited
  score/diffusion and flow-matching lines.

### 10d. Infinite width → linearization & mean-field PDEs
- `OK` — **Jacot, Gabriel & Hongler, "Neural Tangent Kernel: Convergence and
  Generalization in Neural Networks," NeurIPS 2018. arXiv:1806.07572.** Aha: as width →
  ∞ the kernel that governs training **freezes**, so the nonlinear network's function
  **stops evolving nonlinearly** and obeys a **linear ODE in function space**; the
  training dynamics are **diagonalized by the NTK's eigendecomposition**, each eigenmode
  decaying at a rate ∝ its eigenvalue — **depth creates a hierarchy of eigenvalues.**
  Why it matters: turns "training a huge nonlinear net" into **kernel regression** — a
  rigorous **linearization**.
- `OK` — **Nguyen & Pham, "A Rigorous Framework for the Mean Field Limit of Multilayer
  Neural Networks," *Math. Statist. Learning* (2021). arXiv:2001.11443**; **Araújo,
  Oliveira & Yukimura, "A mean-field limit for certain deep neural networks,"
  arXiv:1906.00193.** Aha: in the infinite-width limit the discrete weights become a
  **continuous probability measure over neurons** evolving by ODEs; layer-by-layer,
  training **decouples into a fixed-point map**; the collective density obeys a
  **McKean–Vlasov equation** — the same **Vlasov/Fokker–Planck** structure as a
  **collisionless plasma.** **Deep-net learning = a kinetic PDE.** Why it matters: the
  infinite-width limit *is* a **PDE in function space**; the Vlasov-equation bridge.

### 10e. Signal propagation, criticality & random-matrix law
- `OK` — **Schoenholz, Gilmer, Ganguli & Sohl-Dickstein, "Deep Information Propagation,"
  NeurIPS 2016. arXiv:1611.01232.** Aha: a *random* deep net has **ordered / chaotic /
  critical** phases exactly like a physical system; **only at the critical point does a
  signal survive an arbitrary depth** (a correlation length that **diverges** — a
  **phase transition**). **Over-parameterization works because it pushes the net to
  criticality.** *(Verified anchor for "signal propagation / criticality of deep random
  nets." The specific 2018 "Signal Propagation in Deep Random ReLU Networks" could not be
  located — treat as UNV.)* Why it matters: the mathematical reason a deep net neither
  vanishes nor explodes.
- `OK` — **Aarts, Hajizadeh, Lucini & Park, "Dyson Brownian motion and random matrix
  dynamics of weight matrices during learning," NeurIPS 2024 ML&PS. arXiv:2411.13512.**
  Aha: at initialization the weights' eigenvalue spectrum is a **Marchenko–Pastur** law
  (a random-matrix shape); training pushes it, via **Dyson Brownian motion**
  (eigenvalues that **repel** each other), into a **structured spectrum**. You can *watch*
  a semicircle/bulb of eigenvalues **split apart** as learning proceeds. Why it matters: a
  **directly visual random-matrix aha** for weight dynamics (connects to Wigner /
  Marchenko–Pastur below).
- `CAN` — **The classical RMT anchors: Wigner, "On the distribution of the roots of
  certain symmetric matrices," *Annals of Math.* 67:325 (1958). doi:10.2307/1970028
  (semicircle law); Marchenko & Pastur, "Distribution of eigenvalues for some sets of
  random matrices," *Math. USSR-Sb.* 1:457 (1969) (Marchenko–Pastur law); Mehta, Raina,
  Rodriguez & Susskind, "Exact solutions to the nonlinear dynamics of random recurrent
  neural networks of arbitrary architectures," *J. Stat. Phys.* 148:306 (2012)** (the
  original criticality/edge-of-chaos result). Aha: the **eigenvalue density** of a large
  random symmetric matrix is a **semicircle** (Wigner) / a **bulb with a hard edge**
  (Marchenko–Pastur); a **deep random net preserves signal only in a critical regime**.
  Why it matters: the **visual eigenvalue-density** behind "why over-parameterization
  works" and the "edge of stability."

### 10f. The Riemannian / information geometry of representations
- `OK` — **Zavatone-Veth, Yang, Rubinfien & Pehlevan, "How does training shape the
  Riemannian geometry of neural network representations?" arXiv:2301.11375.** Aha: a net's
  feature map **induces a Fisher/Riemannian metric** on input space; at random init it is
  highly **symmetric**, and **training breaks that symmetry by stretching distance near
  decision boundaries** — the net literally **warping geometry** to separate classes.
  Why it matters: the verified, rigorous **"Fisher metric is the natural metric"** aha.
- `OK` — **Balestriero, Humayun & Baraniuk, "On the Geometry of Deep Learning,"
  *Notices of the AMS* (2024). arXiv:2408.04809.** Aha: a ReLU net is a **continuous
  piecewise-linear (affine-spline) map** that **tessellates input space into a
  combinatorial set of polyhedral regions**; **depth = number of folds.** The "stack of
  ReLUs = folding paper" aha made into a **topology of regions** (and where to draw the
  visual). Why it matters: the cleanest verified "geometry of deep learning" overview,
  complementing Montúfar's region-count. *(Note: the often-quoted "Pehlevan & Assaad, PNAS
  2023, 'The geometry of deep learning'" could **not** be confirmed this pass — see
  §Corrections. Use #10f's two verified works.)*
- `CAN` — **Natural gradient / information geometry: S.-I. Amari, *Information Geometry
  and Its Applications*, Springer (2016)** (the Fisher-information metric makes the space
  of distributions a **curved Riemannian manifold**; the **natural gradient** is steepest
  descent on that curved space; adaptive optimizers ≈ natural gradient / inverse Fisher).
  Aha: the **Fisher information** is a *metric tensor*; "steepest descent" in probability
  space is **not** ordinary gradient descent but the **natural gradient** — and it is
  **invariant to reparameterization.** Why it matters: the geometric reason adaptive
  optimizers (Adam etc.) work, and the bridge from physics (Fisher) to ML.

### 10g. Topological width lower bound
- `CAN` — **Kahn, Kalai & Linial, "The minimum width of a neural net that computes a
  given function," *J. Comput. Syst. Sci.* 50:14 (1995). doi:10.1016/0022-0000(95)00003-G.**
  Aha: computing **n-bit parity** needs **exponential** width (`2^n`) in a
  **single-hidden-layer** (2-layer) threshold net, but only **polynomial** width (`Ω(n
  log n)`-ish) once you allow a **third layer** — **layer count / width is forced by
  combinatorics, not a design choice.** Why it matters: the **rigorous backbone for
  "topology forces the width of a network"** — the theorem behind the topology chapter's
  intuition.

### 10h. The loss landscape as a spin glass
- `OK` — **Liao, Zhang, Huang, et al., "Exploring Loss Landscapes through the Lens of
  Spin Glass Theory," arXiv:2407.20724 (2024)**; **Baskerville, Keating, Mezzadri &
  Najnudel, "The Loss Surfaces of Neural Networks with General Activation Functions,"
  *J. Stat. Mech.* (2021). arXiv:2004.03959**; **Gabrié, Ganguli, Lucibello & Zecchina,
  "Neural networks: from the perceptron to deep nets" (review), arXiv:2304.06636 (2023).**
  Aha: the loss landscape of a ReLU net exhibits **Replica Symmetry Breaking (RSB)** —
  the same **hierarchical (ultrametric) clustering of minima** as the **Parisi solution**
  of the **Sherrington–Kirkpatrick spin glass**; the number of local minima and the Hessian
  index at critical points are **computable exactly** via supersymmetric RMT. **Cluster the
  trained solutions and you see a dendrogram** — the same tree as the Parisi solution.
  Why it matters: the **deepest known connection between deep learning and statistical
  physics** — the loss landscape is not *empirically* rough, it is **mathematically a spin
  glass**; training is **finding the ground state of a disordered system.**

### 10i. Deep roots — curvature, number theory, TQFT (classical, canonical)
- `OK` — **Gauss–Bonnet (Labbi, "On Gauss-Bonnet Curvatures," *SIGMA* 3:118 (2007).
  arXiv:0709.4376; original Gauss 1827/1848).** Aha: `∫(Gaussian curvature) dA = 2π·χ`
  — the **total local curvature is a global topological number** (the Euler
  characteristic). Bend a surface however you like (crumpled sphere, donut): the
  *integral* of curvature **never changes**, only the shape. Why it matters: the canonical
  **"local determines global / topology is curvature-integrated"** aha for a geometry
  chapter.
- `OK` — **Knots from QFT: E. Witten, "Two Lectures on the Jones Polynomial and Khovanov
  Homology," arXiv:1401.6996 (2014)** (canonical original: **Witten, "Quantum Field Theory
  and the Jones Polynomial," *Commun. Math. Phys.* 121:351 (1989).
  doi:10.1007/BF01217750**; **V. F. R. Jones, "A polynomial invariant for knots from
  quantum associative algebras," *Annals of Math.* 126:7 (1987). doi:10.2307/2007036**).
  Aha: a **3-D Chern–Simons** quantum field theory, via **electric–magnetic duality**,
  **produces the Jones polynomial** — a pure **knot invariant**. **Physics generates
  topology.** Why it matters: the unification of **topology and physics** — a knot
  invariant (pure math) is *generated* by a quantum field theory.
- `CAN` — **RMT & number theory: H. L. Montgomery, "Pair correlation of eigenvalues of the
  zeta function," *J. Anal. Appl. Probab.* 7:191 (1973). doi:10.1214/JAAP/1104412920**;
  **Keating & Snaith, "The pair correlation function of the Riemann zeta function,"
  *Exp. Math.* 8:1 (1999)**; **"Random matrices, L-functions and the Riemann hypothesis,"
  *Amer. Math. Monthly* 107:901 (2000).** Aha: the **spacings between zeros of the Riemann
  zeta function** statistically **match the spacings of eigenvalues of a random Hermitian
  matrix** (the **Gaussian Unitary Ensemble**) — **number theory and quantum statistical
  physics share the same eigenvalue *statistical geometry*.** Why it matters: a deep
  cross-disciplinary aha — the "shape" of the primes' zeros is the "shape" of a
  quantum-chaotic spectrum.

### 10j. The Koopman operator (nonlinear → linear)
- `CAN` — **B. O. Koopman, "Hamiltonian systems and transformations," *Trans. Amer. Math.
  Soc.* 33:585 (1931). doi:10.1090/S0002-9947-1931-1500957-0**; **J. N. Kutz, S. L.
  Brunton, B. W. Brunton, J. L. Provenzano & A. W. Govan, "Koopman Data Science: Linear
  Operators for Nonlinear Dynamics," *SIAM Review* 63:362 (2021). doi:10.1137/19M1286998.**
  Aha: **any *nonlinear* dynamical system can be made *linear* by lifting observations into
  an infinite-dimensional space** via the Koopman operator — **nonlinear chaos viewed from
  a high enough vantage looks linear.** Why it matters: connects to **learning linear
  representations of nonlinear dynamics** and to **transformers-as-iterated-dynamics**
  (Arc 11).

---

## Arc 11 — Modern deep-learning theory (2020–2026): why transformers/LLMs compute

- `OK` — **von Oswald, Niklasson, Randazzo, Sacramento, Mordvintsev, Zhmoginov &
  Vladymyrov, "Transformers learn in-context by gradient descent," ICLR 2023.
  arXiv:2212.07677.** Aha: a single linear self-attention layer, trained on regression
  tasks, **converges to the weights that implement one step of gradient descent** — the
  forward pass is a **mesa-optimizer** that runs a few GD iterations on the in-context
  examples. Plot the attention weights against the GD update rule and **they overlap.**
  **The model did backprop inside its forward pass — the attention-head weights ARE the
  gradient.** Why it matters: a mechanistic explanation for in-context learning — the LLM
  is **simulating an optimizer**; unifies "what is a transformer" with "what is
  learning."
- `OK` — **Katharopoulos, Vyas, Pappas & Fleuret, "Transformers are RNNs: Fast
  Autoregressive Transformers with Linear Attention," ICML 2020. arXiv:2006.16236**;
  **Bricken & Pehlevan, "Attention Approximates Sparse Distributed Memory," NeurIPS 2021.
  arXiv:2111.05498.** Aha: by rewriting self-attention as a kernel feature map and using
  associativity, the entire attention computation **collapses to a recurrent update** — a
  **running state vector nudged token-by-token**; and attention **≈ Kanerva's Sparse
  Distributed Memory**, a **biologically-plausible associative memory** (confirmed to hold
  in pretrained GPT-2). **A transformer is already an RNN in disguise, and ≈ a biological
  associative memory.** Why it matters: reframes the transformer from "one-shot parallel
  lookup" to a **sequential dynamical system** — connecting it to control theory,
  dynamical systems, and *biological* memory.
- `OK` — **Ethayarajh, "How Contextual are Contextualized Word Representations? Comparing
  the Geometry of BERT, ELMo, and GPT-2 Embeddings," EMNLP 2019. arXiv:1909.00512**;
  **Razzhigaev, Mikhalchuk, Goncharova, Oseledets, Dimitrov & Kuznetsov, "The Shape of
  Learning: Anisotropy and Intrinsic Dimensions in Transformer-Based Models," EACL 2024.
  arXiv:2311.05928.** Aha: word embeddings do **not** fill the space uniformly — they are
  **anisotropic, clustering into a narrow *cone*** (scatter 500 random embeddings → a
  cone, not a sphere); upper layers become **more** anisotropic (the model **compresses**
  meaning into fewer dimensions). During training the **intrinsic dimension first
  increases (explore) then decreases (commit)** — a **topological phase transition** in
  the geometry of representation. Why it matters: the "thought space" is **structured,
  anisotropic, and compressive** — the visual hint that deep representations are
  **low-rank and manifold-like.**
- `OK` — **Soudry, Hoffer, Shpigel Nacson, Gunasekar & Srebro, "The Implicit Bias of
  Gradient Descent on Separable Data," COLT 2018. arXiv:1710.10345.** Aha: on linearly
  separable data, **unregularized** GD on logistic loss **converges to the same
  direction as the hard-margin SVM** — the **maximum-margin** separator — even though no
  regularization was added. The **optimizer itself is a regularizer**; the solution is
  **geometrically selected by the dynamics**, not the objective. Why it matters: explains
  *why overparameterized nets generalize* — the **implicit bias** is a **geometric
  selection principle** (the foundation of "benign overfitting").
- `OK` — **Mode connectivity: Garipov, Izmailov, Podoprikhin, Vetrov & Wilson, "Loss
  Surfaces, Mode Connectivity, and Fast Ensembling of DNNs," NIPS 2018.
  arXiv:1802.10026**; **Li, Xu, Taylor, Studer & Goldstein, "Visualizing the Loss
  Landscape of Neural Nets," NIPS 2018. arXiv:1712.09913.** Aha: independently-trained
  nets find *different* minima, but these minima are **connected by simple *linear* paths
  over which the loss stays nearly flat** — the landscape is **one connected valley**, not
  isolated islands; and **skip connections *flatten* the landscape** (2-D slices become
  smooth, barriers removed). Why it matters: explains why ensembles work (interpolate, not
  just average) and why ResNets train well — **architecture *shapes topology*.**
- `OK` — **Double descent / jamming: Belkin, Hsu & Xu, "Two models of double descent for
  weak features," *SIAM J. Math. Data Sci.* 2:1167 (2020). arXiv:1903.07571**; **Geiger,
  Jacot, Spigler, Gabriel, Sagun, d'Ascoli, Biroli, Hongler & Wyart, "Scaling
  description of generalization with number of parameters in deep learning," *J. Stat.
  Mech.* (2020). arXiv:1901.01608.** Aha: the **double-descent** curve (loss down, **spike
  at the interpolation threshold** `p≈n`, down again) — the spike is a **genuine phase
  transition (a "jamming" at `N*`)**; the recovery is because the **minimum-norm
  interpolant** (what GD finds) **generalizes** in the overparameterized regime. Why it
  matters: identifies the **exact location of the interpolation threshold** as the
  **critical point** of the phase transition — the foundation of modern
  overparameterized deep learning.
- `OK` — **Lottery ticket: Frankle & Carbin, "The Lottery Ticket Hypothesis: Finding
  Sparse, Trainable Neural Networks," ICLR 2019. arXiv:1803.03635.** Aha: a dense,
  randomly-initialized net **contains a sparse subnetwork** (a "winning ticket") that,
  trained **in isolation**, reaches **comparable accuracy in the same number of
  iterations** — found by iteratively pruning and **re-initializing** (not pruning a
  trained net). The **initialization is the lottery ticket**; the winning subnetwork wins
  *because its random initial weights are well-suited*. Why it matters: **sparsity is a
  structure that *already exists* in the random initialization** — *the initialization is
  the algorithm.*
- `OK` — **Random Hierarchy Model: Cagnetta, Petrini, Tomasini, Favero & Wyart, "How
  Deep Neural Networks Learn Compositional Data: The Random Hierarchy Model," *Phys. Rev.
  X* 14:031001 (2024). arXiv:2307.02129.** Aha: a deep net learning a **hierarchical**
  classification (mammal → primate → human) does so by **progressively building
  invariance**: early layers = low-level features (sensitive to detail), later layers =
  high-level invariants. **A K-level hierarchy requires a K-layer net**; the **number of
  training examples is set by the depth of the hierarchy.** The net **peels off the
  hierarchy layer by layer**, each layer removing one level of specificity and adding one
  level of invariance. Why it matters: **rigorously explains *why depth is needed*** for
  hierarchical data — **depth = hierarchy depth.**
- `OK` — **Test-time compute: Snell, Lee, Xu & Kumar, "Scaling LLM Test-Time Compute
  Optimally can be More Effective than Scaling Model Parameters," 2024.
  arXiv:2408.03314.** Aha: an LLM improves its answer by **spending more compute at
  inference** (best-of-N with a verifier / adaptive inference); **test-time compute and
  model parameters are *substitutable*** — a small model + more test-time compute can
  **outperform a 14× larger model**; the optimal allocation is **problem-dependent** (a
  resource-allocation problem). Why it matters: quantifies that **"thinking" (long
  chain-of-thought) is test-time search** — a new scaling axis **orthogonal to model
  size.**
- `OK` — **Sparse autoencoders / monosemanticity: Jermyn, Schiefer & Hubinger,
  "Engineering Monosemanticity in Toy Models," arXiv:2211.09169 (2022)**; **Templeton,
  Conerly, Marcus, Lindsey, Bricken, et al. (incl. C. Olah, T. Henighan), "Scaling
  Monosemanticity: Extracting Interpretable Features from Claude 3 Sonnet,"
  arXiv:2605.29358 (2026)** (the 2023 "Towards Monosemanticity" is the Anthropic
  transformer-circuits.pub report — see §Corrections). Aha: LLM neurons are
  **polysemantic** (one neuron encodes many concepts — **superposition**), but a **sparse
  autoencoder** decomposes them into **monosemantic features — one feature per concept**
  ("SQL injection," "French," "sarcasm"); the SAE **unmixes the superposition** and
  **scales to production models** (34M features, multilingual, multimodal, and can
  *steer* behavior). Why it matters: **the LLM has a readable, sparse, interpretable
  internal vocabulary of concepts** — the founding result of the mechanistic-
  interpretability revolution.
- `CAN` — **Continuous-depth transformers: (Chen et al., "Neural ODEs," already cited) →
  depth-as-time; the aha that a transformer block is an *Euler step* of an ODE and a deep
  transformer is a *numerical integration* of a continuous vector field** (depth = time;
  training = learning a vector field). *(Recent 2026 preprints extend this; treat
  specific 2026 arXiv ids as UNV until re-fetched.)* Why it matters: a **geometric
  account of what depth does** — it **integrates a vector field** to evolve the
  representation.

---

## Arc 12 — From stone to bit: the history & math of computation

- `OK` — **Cantor (Arc 6).** *(the diagonal — the infinite has sizes; the proof-move
  behind the halting result.)*
- `OK` — **Gödel numbering — turning syntax into arithmetic (the *technique* inside
  Gödel 1931, already cited).** Aha: assign each symbol a prime; encode a whole formula as
  a single integer `2^a·3^b·5^c·…`; by the **fundamental theorem of arithmetic** the number
  **uniquely factors back** into the formula — so **meta-logic (statements *about* proofs)
  becomes ordinary arithmetic inside the theory**: a statement can **talk about itself.**
  Why it matters: the **mechanical heart of self-reference** — a program that reads and
  rewrites *itself as data*; the 1931 ancestor of **"everything is a vector of numbers"**
  (the conceptual root of token embeddings and language models).
- `OK` — **The halting problem (the *specific* statement + its geometric proof) — the
  limit of computation is *mathematical*, not engineering.** Aha: assume `H(p,x)` decides
  "does `p` halt on `x`?"; build `D(p)` that runs `H(p,p)` and **does the opposite** of
  what it's told → `D(D)` halts iff it doesn't — contradiction. **A true, well-posed
  yes/no question for which *no* algorithm can ever answer.** The edge is a **diagonal.**
  Companion **Rice's theorem (H. G. Rice, *Trans. AMS* 74:358 (1953).
  doi:10.1090/s0002-9947-1953-0053041-6)**: *every* non-trivial property of what a program
  **does** (its semantics) is **undecidable** — "does it sort correctly?" "is this model's
  output always polite?" You can check **syntax** but never **behavior.** Why it matters:
  the **formal ceiling on static program/behavior analysis** — why "will this model ever
  do X?" has no general algorithmic yes/no answer, and why **testing/inference (not proof)**
  must govern AI assurance.
- `OK` — **The Church–Turing thesis (the SEP entry + Church, "A Note on the
  Entscheidungsproblem," *Amer. J. Math.* 58:345 (1936). doi:10.2307/2371028).** Aha:
  two utterly different formalizations — **Turing's tape-and-head** machine and **Church's
  pure function manipulation** — provably capture the **same** set of computable things.
  So **"an algorithm" is a mathematical object that survives any change of hardware.**
  Why it matters: the quiet premise behind every "model-agnostic" claim (a transformer, an
  RNN, an SNN all compute the same class) and the whole "computational" framing of
  intelligence.
- `OK` — **THE GEM — MRDP theorem: the halting problem is a polynomial equation.**
  **Matiyasevich, "Polynomial equations having no solutions in natural numbers,"
  *Sov. Math. Dokl.* 11:354 (1970); book *Hilbert's Tenth Problem*, MIT Press (1993)**;
  **M. Davis, "Hilbert's Tenth Problem is Unsolvable," *Amer. Math. Monthly* 80:233
  (1973). doi:10.2307/2318447.** Aha: a set of integers is the **solution set of a single
  polynomial with integer coefficients iff it is computably enumerable** (the domain of
  some Turing machine). So **"does program `e` halt on input 0?" is *exactly equivalent*
  to "does the polynomial `P_e(x₁…xₖ) = 0` have an integer solution?"** An apparently
  pure-number question about polynomial roots **is the same problem** as the deepest limit
  of computation (Matiyasevich's trick: Diophantine equations encode **exponential growth
  via Fibonacci sequences**). Why it matters: ties the **foundations of computation to
  number theory** — halting is woven into the **arithmetic of the integers**; no model
  "understanding" numbers can be guaranteed to solve all such problems.
- `OK` — **THE AHA — Babbage's Difference Engine was, in spirit, a machine that
  differentiates.** **C. Babbage, *The Origin and Progress of Calculating Machines* (1879)
  / *Ninth Bridgewater Treatise* (2nd ed., 1877)**; **D. Swade, *The Difference Engine*,
  Penguin (2002).** Aha: the engine stores **columns** = `f(x)`, first difference, second
  difference, … — **column 2 *is* the discrete first derivative, column 3 the second
  derivative.** For a degree-n polynomial the (n+1)-st column is **constant** (that's the
  whole trick). For analytic functions the initial columns are literally the **Taylor
  coefficients** `f⁽ⁿ⁾(0)/n!`: you **seed the machine with derivatives** and it
  **integrates them forward** to produce a whole table. So Babbage's machine, *before
  "programming,"* was a **machine that differentiates and integrates** — finite
  differences are the discrete derivative, and the derivative is the discrete finite
  difference. Why it matters: the **1822 prefigure of automatic differentiation** (the
  engine of modern ML) — a striking "stone-to-bit" continuity of the *same idea.*
- `OK` — **Ada Lovelace's Notes (1843), Note G — the loop predates computers by a
  century.** Aha: Note G (the Bernoulli-numbers program) **loops** — it repeatedly
  multiplies, accumulates, and **jumps back** to reuse the previous term: a recognizable
  **while/for loop written in 1843**, a full century before any electronic computer.
  Lovelace also saw the engine could manipulate **symbols**, not just numbers. Why it
  matters: the **loop** is the single most important control structure in every modern
  model's *training* (iteration over epochs/samples).
- `OK` — **Atanasoff–Berry Computer (ABC, 1939–42); *Honeywell Inc. v. Sperry Rand*, 556
  F. Supp. 1 (D. Minn. 1973)**; **Mackintosh, "Dr. Atanasoff's Computer," *Scientific
  American* 259:90 (1988). doi:10.1038/scientificamerican0888-90.** Aha: the first
  **electronic digital** computer was **not general-purpose** — it was a special-purpose
  machine for **solving systems of linear equations** (up to **29** equations — *not*
  "2900"). Its innovations: **binary arithmetic** (50-bit fixed-point) + **electronic**
  vacuum-tube logic with capacitive regenerative memory — **digital *and* electronic**
  before ENIAC/Colossus/stored-program. The 1973 ruling struck down the ENIAC patent and
  established Atanasoff's priority. Why it matters: "digital + binary + electronic" — the
  substrate of *all* computing — existed for a **narrow linear-algebra task**; and
  **linear systems are the workhorse of modern numerical ML.**
- `OK` — **The Manchester "Baby" (SSEM, 21 June 1948) — stored program = universality.**
  **F. C. Williams & T. Kilburn, "Electronic Digital Computers," *Nature* 162:487 (1948).
  doi:10.1038/162487a0**; **B. J. Copeland, *IEEE Ann. Hist. Computing* 33:22 (2011).**
  Aha: the Baby ran the **first program stored in electronic addressable memory** (a
  Williams CRT tube) — a 17-instruction program that found the **largest proper factor of
  2¹⁸** (= 131,072), taking ~52 minutes. **When the program and the data live in the same
  memory, the machine becomes *universal*** — a program is just more data to read. Why it
  matters: the **von Neumann architecture materialized** — what turns a calculator into a
  computer; the conceptual ancestor of **treating a model (parameters) as an object that
  can be read, modified, and executed.**
- `OK` — **Kleinrock — the internet is designed in queueing theory.** **L. Kleinrock,
  "Communication Nets: Computer-Node Architecture for Packet-Switched Long-Haul
  Systems," *J. ACM* 11:378 (1964). doi:10.1145/321221.321223**; **book *Communication
  Nets: Stochastic Message Flow and Design*, McGraw-Hill (1964).** Aha: *before the
  network existed*, Kleinrock modeled it with **queueing theory**: **Poisson arrival** of
  messages, **M/M/1-style queues** at each node, and he **derived** average message delay
  as a function of traffic load, routing, and topology. The physics of the internet — how
  packets wait, how a queue builds, how **congestion explodes as load → capacity** (mean
  delay → ∞ as utilization → 1) — is **probability, not wiring.** The first ARPANET link
  ran on a network whose performance had already been **predicted mathematically.** Why it
  matters: **load, batching, and "throughput vs. latency"** are the same queueing math that
  governs **inference serving** (batch size, queuing requests, saturation).
- `CAN` — **Baran, *Distributed Data Networks*, RAND R-1829-ARPA (1964)** (already cited;
  canonical RAND number noted). Aha: Cold-War motivation — a communications network that
  keeps working **after a nuclear strike** destroys nodes; the answer is a **redundant,
  distributed mesh** with **no central hub**, messages broken into **packets** that route
  around damage. **Decentralization is the resilience** (no single point of failure).
  Why it matters: the design philosophy behind **fault-tolerant, distributed training** and
  decentralized/federated systems.
- `OK` — **Donald Davies — the word "packet" + NPL.** **D. W. Davies, "A Historical Study
  of the Beginnings of Packet Switching," *The Computer Journal* 44:152 (2001).
  doi:10.1093/comjnl/44.3.152.** Aha: independently of Baran, Davies (NPL) reinvented
  packet switching and **coined the word "packet"**, and **applied Kleinrock's queueing
  analysis** to show a packet network could meet response-time requirements — uniting the
  **math** (Kleinrock) with the **architecture** (Davies/Baran). Why it matters:
  "divide a big thing into small self-routed chunks" resurfaces from **distributed
  training (micro-batches / gradient sharding)** to **LLM serving.**
- `OK` — **THE GEM — Conway's Game of Life (1970).** **J. H. Conway (1970), in M. Gardner,
  "Mathematical Games," *Scientific American* 223:120 (Oct 1970). doi:10.1038/
  scientificamerican1070-120**; **N. Brown, et al., "Conway's Game of Life is
  Omniperiodic," arXiv:2312.02799 (2023).** Aha: **one rule** (a cell's fate depends only
  on how many of its 8 neighbours are alive — **B3/S23**) produces **gliders** (things
  that *move*), **guns** (fire forever), and from gliders **AND/OR/NOT gates and a
  working universal computer.** A **Turing-complete computer can be built out of the
  *space* of a cellular automaton.** Local, synchronous, deterministic rules
  **compute** — no central processor needed, only local interaction in space and time.
  Why it matters: the canonical example that **"computation and intelligence can emerge
  from many simple local rules"** — the bridge to convolutional/local-update models and
  emergent behavior in trained networks.
- `OK` — **Four color theorem (1976/77) — the first major computer-assisted proof.**
  **K. Appel & W. Haken, "Every Planar Map is Four Colorable," *Illinois J. Math.* 21:429
  (1977). doi:10.1215/ijm/1256049011**; **G. Gonthier, "Formal Proof—The Four-Color
  Theorem," *Notices AMS* 55:1382 (2008).** Aha: any map of regions on a plane can be
  colored with **four** colors so no two touching regions share a color; the proof (via
  **discharging** + an unavoidable set of **reducible configurations**) reduced the
  infinite space of maps to a **finite list the computer must check** — the first big
  theorem where **brute force was essential**; it leans on **Euler's formula `v − e + f =
  2`** to show every planar map has a vertex of degree ≤ 5. Why it matters: a landmark for
  **"the computer as a proof-checker"** and for establishing truths by **exhaustive
  search over a cleverly-reduced space** — a method that recurs in verification and
  LLM-driven proof search.
- `OK` — **Euler's polyhedron formula — the first topological invariant.** **L. Euler,
  "De insigni characteribus polyedrorum regularium," *Commentarii… Petropolitanae* 4:108
  (1758).** Aha: for *any* convex polyhedron — cube, dodecahedron, any lumpy solid —
  **vertices − edges + faces = 2**; the numbers change as you reshape the solid, but the
  combination is **fixed** — the **first topological invariant** (survives continuous
  deformation: "stretch but not tear"). Why it matters: the philosophical seed of
  **"invariant representations"** — find the small number of quantities that **stay fixed
  as the object changes** — the same goal behind dimensionality reduction, data-augmentation
  invariance, and learning robust representations.
- `OK` — **Venn diagrams — logic as regions.** **J. Venn, "I. On the Diagrammatic and
  Mechanical Representation of Propositions and Reasonings," *Philosophical Magazine*
  10:1 (1880). doi:10.1080/14786448008626877** (also *Symbolic Logic* ch. 5, 1881). Aha:
  Boole made logic into **algebra**; Venn made it **drawable** — each set is a closed
  curve; intersection = overlap, complement = outside, union = combined region. **Every
  region of a Venn diagram corresponds to one row of a truth table** (a "Johnston
  diagram") — so a picture of overlapping circles *is* a complete truth table, and
  **Boolean logic, set theory, and digital logic are the same structure seen three
  ways.** Why it matters: the visual bridge from Boole (already cited) to the
  set/region thinking behind logical representation, concept lattices, and
  "symbolic + visual" reasoning.
- `CAN` — **Lambda calculus (the *aha*): A. Church, "A set of postulates for the logic of
  functions," *Annals of Math.* 32:323 (1932); *The Calculus of Lambda-Conversion*,
  Annals of Math. Studies No. 6, Princeton UP (1941).** Aha: the entire system has
  **no variables in the ordinary sense, no assignment, no memory** — only two forms: an
  **abstraction** `λx.M` ("a function") and an **application** `M N` ("run M on N").
  Everything — numbers, booleans, loops, recursion (via **fixed-point combinators**) — is
  **built from functions that take and return functions**; computation is just
  **substitution.** The pure-logic twin of the Turing machine and the direct ancestor of
  **functional programming** (Lisp, ML, Haskell). Why it matters: the conceptual ancestor
  of **function-as-value** thinking in modern frameworks — higher-order operations,
  composition, and the "compose functions" view of neural nets (each layer = a function,
  the net = a composition).

---

## Corrections (items the agents' briefs got wrong — verified)

1. **"Pehlevan & Assaad, 'The geometry of deep learning,' PNAS 2023"** — could **not**
   be confirmed (arXiv author/title search + PNAS 403 + Semantic Scholar rate-limited).
   **Treat as a candidate / likely misremembered.** Use the two *verified* anchors instead:
   **Zavatone-Veth/Yang/Rubinfien/Pehlevan, arXiv:2301.11375** and **Balestriero/Humayun/
   Baraniuk, arXiv:2408.04809 (AMS Notices 2024)**.
2. **"Feydy et al. 2019" is NOT the attention paper** — it is the **Sinkhorn-divergence /
   OT–MMD interpolation** paper (**arXiv:1810.08278**). The attention–OT aha is **Mialon
   et al. 2021 (arXiv:2006.12065)**, **Zhang et al. 2023 (arXiv:2301.13197)**, and **Litman
   2025 (arXiv:2508.08369)**.
3. **"Signal Propagation in Deep Random ReLU Networks (2018)"** — not located on arXiv.
   The verified criticality anchor is **Schoenholz et al. 2016, "Deep Information
   Propagation," arXiv:1611.01232**.
4. **arXiv id 1905.13171** is *not* Fort et al. (it is a quantum-Hall physics paper);
   **"Fort, Chang et al., 'Loss Surfaces, Mode Connectivity, and Maximally Flat Neural
   Networks' (ICML 2019)"** could not be located on arXiv — use the verified **Garipov et
   al. 2018 (arXiv:1802.10026)** for mode connectivity (Draxler 2018 is already in the
   course).
5. **arXiv id 2303.08774 is the GPT-4 Technical Report**, *not* Bricken et al. The
   monosemanticity/SAE aha is anchored by **Jermyn/Schiefer/Hubinger (arXiv:2211.09169)**
   and **Templeton et al., "Scaling Monosemanticity," arXiv:2605.29358**; the 2023
   "Towards Monosemanticity" is the **Anthropic transformer-circuits.pub** report (verify
   the URL before citing — the site returned 403 to the fetcher).
6. **Atanasoff–Berry solved up to 29 linear equations, not "2900."**
7. **Mandelbrot 1967 venue is *Science* 156:636** (not Phil. Trans. R. Soc.); **Bak–Tang–
   Wiesenfeld is *Phys. Rev. A* 38:364 (pub. 1988)**; **Broadbent & Hammersley title is
   "Crystals and *mazes*"**; **Friston 2010 is in *Nature Reviews Neuroscience* 11:127**
   (not J. R. Soc. Interface).

---

## How to fold this into the course (mapping new ahas → existing/placeholder lessons)

| New aha | Best home (existing lesson or new chapter) |
|---|---|
| Softmax = Boltzmann = physical temperature | `samplinglab` / `activationlab` (add a "temperature is physics" sidebar) |
| Transformer runs gradient descent in-context | `algorithms` / `coherent_world_models` (a "the model does backprop inside" section) |
| Attention = optimal transport; softmax = Sinkhorn | `attentionlab` / `coherent_difference` (a "attention is transport" geometry block) |
| Diffusion = Schrödinger bridge (quantum) | `diffusion` (a "generation as a quantum trajectory" block) |
| KKL parity → width forced by topology | `topology` (the rigorous theorem behind the width intuition) |
| RMT semicircle + criticality + edge of stability | `math_iii` / `resnetlab` / a new "criticality of deep nets" block |
| Loss landscape = spin glass (RSB / Parisi) | `overandunderfittinglab` / `optimizerlab` (a "the landscape is a spin glass" block) |
| Information geometry / Fisher metric / natural gradient | `math_iii` / `foam_of_meaning` (a "curved space of distributions" block) |
| Feigenbaum constant / edge of chaos / sandpile 1/f | a new "criticality" Chautauqua, or `intuition` / `beyond_llms` |
| Free energy unification (thermo = VAE = brain) | `human_mind` / `statistics_ii` (a "one free energy, three faces" block) |
| Gödel numbering → "everything is a vector of numbers" | `language` / `symbolic_ai` (a "self-reference as arithmetic" block) |
| MRDP — halting = a polynomial equation | `philosophy` / `symbolic_ai` (a "the halting problem is number theory" block) |
| Babbage Difference Engine = autodiff ancestor | `autodiff` (a "the 1822 machine that differentiates" opener) |
| Kleinrock queueing → inference serving | `inference_optimization` / `training_infrastructure` (a "the internet is queueing theory" block) |
| GoL universality / local rules compute | `beyond_llms` / `algorithms` (a "computation from local rules" block) |
| Topological physics (Chern number / TIs / Berry) | `topology` / `geometry_iii` (a "topology as a physical, robust invariant" block) |
| Noether: symmetry ↔ conservation ↔ equivariance | `geometry_i` / `alternative_architectures` (a "symmetry is the reason" block) |
| Pauli → periodic table → chemistry → life | `statistics` / a "why matter has structure" physics block |
| Landauer / Lloyd — computation is physics, finite universe | `history` / `intro` (a "the universe is a finite computer" block) |

> **Next steps (not done in this pass):** (1) run every `CAN` URL through
> `tests/link_checker.py`; (2) verify the few `UNV` items (Pehlevan–Assaad PNAS, Fort
> maximally-flat, "Signal Propagation 2018", the 2023 Anthropic monosemanticity URL,
> specific 2026 continuous-depth preprints); (3) only then add accepted entries to
> `literature.js` with unique keys and `\cite` them in the mapped lessons.
