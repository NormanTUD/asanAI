# Tensions & inconsistencies in the polyhedral / space-folding literature

A working research note — **not** a lesson. It records points of tension, apparent
contradiction, or open question that surfaced while surveying the polyhedral-theory and
ReLU "space folding" literature cited in the book. Each item names the papers involved,
the tension, and whether/how it reconciles.

Keys refer to entries in `literature.js`; lessons are linked by slug.

## Sources in scope

| key | paper | id |
|---|---|---|
| `groetschel2005polyhedral` | Grötschel, *Basics of Polyhedral Theory* (block course, 2005) | TU Berlin notes |
| `huchette2026polyhedral` | Huchette, Muñoz, Serra, Tsay, *When Deep Learning Meets Polyhedral Theory: A Survey* | arXiv:2305.00241 / IJOC 2026 |
| `lewandowski2025spacefolds` | Lewandowski et al., *On Space Folds of ReLU Neural Networks* | arXiv:2502.09954 |
| `lewandowski2025spacebetween` | Lewandowski et al., *The Space Between: On Folding, Symmetries and Sampling* | arXiv:2503.08502 |
| `amrami2021depth` | Amrami & Goldberg, *A simple geometric proof for the benefit of depth in ReLU networks* | arXiv:2101.07126 |
| `black2022polytopelens` | Black et al., *Interpreting Neural Networks through the Polytope Lens* | arXiv:2211.12312 |
| `wakhloo2024population` | Wakhloo, Slatton & Chung, *Neural Population Geometry ...* | arXiv:2402.16770 |
| `morales2021reservoir` | Morales, Mirasso & Soriano, *Unveiling the role of plasticity rules in reservoir computing* | arXiv:2101.05848 |
| `keup2022origami` | Keup & Helias, *Origami in N dimensions ...* | arXiv:2203.11355 |
| `montufar2014regions` | Montúfar et al., *On the Number of Linear Regions of Deep Neural Networks* | arXiv:1402.1869 |

Discussed in: [origami](origami.php) (The polyhedral backbone), [mechanistic_interpretability](mechanistic_interpretability.php) (The Polytope Lens), [deep_theory](deep_theory.php) (Why simple and *spatial* solutions win).

---

## 1. Exponential worst-case regions vs. sparse realized geometry

- **Upper bound.** `montufar2014regions`: the number of linear regions a deep ReLU net *can*
  carve grows **exponentially** in depth (and in width at fixed depth).
- **Realized count.** Trained nets realize far **fewer** regions than the bound; the
  space-fold work (`lewandowski2025spacefolds`) shows wider nets fold *more paths* but each
  path folds about as much — the per-path fold **saturates** with width.
- **Why both are true.** One is a worst-case capacity bound, the other a typical-case
  measurement. The exponentiality lives in the **H-representation ↔ V-representation**
  conversion (Fourier–Motzkin; `groetschel2005polyhedral`) — the $n$-cube and $n$-cross-polytope
  are each trivial in one form and exponential in the other.
- **Consequence.** Because enumeration is hopeless, you **optimize over** the net instead —
  MILP/LP formulations (`huchette2026polyhedral`). The bound motivates the method.
- **Status:** reconciled (not a contradiction), but the gap between bound and realized
  geometry is the central empirical fact.

## 2. Features-as-directions vs. the polytope lens

- **Directions.** The linear-representation / features-as-directions view
  (Elhage 2022; `park2024linear`; `marks2023geometry`) treats a concept as a linear
  direction in the residual stream.
- **Polytopes.** `black2022polytopelens` argues directions are a **leaky abstraction**: a
  scaled direction crosses polytope boundaries and its meaning changes, so the invariant
  unit is the **polytope** (tagged by its binary spline code), not the direction.
- **The friction.** NMF/PCA directions measured in the polytope-lens experiments came out
  **largely monosemantic**, so the direction view is not wrong — it is *coarse*: directions
  are averages over clusters of nearby polytopes that implement similar affine maps.
- **Status:** open / complementary. The book uses directions as the working unit and the
  polytope as the refinement.

## 3. "Disentangle is optimal" vs. "exploit non-orthogonality + fold"

- **Disentangle.** `wakhloo2024population`: for a **linear readout** of a shared latent
  structure, the optimal code is **disentangled** (each latent factor on its own orthogonal
  direction); the alignment error is *irreducible* (does not decay with samples).
- **Non-orthogonal + fold.** `keup2022origami`, Elhage's superposition, and
  `black2022polytopelens` say nets **deliberately use non-orthogonal representations** and
  ReLU **folding** to suppress interference and manufacture separability.
- **Reconciliation.** Different **readout** assumptions: Wakhloo's optimum is for a *linear
  probe*; the origami/superposition/polytope results assume a *full nonlinear readout*.
  "Separate the factors" and "pack them and fold" are both true under their own readout.
- **Status:** reconciled by the readout assumption, but a real conceptual tension to keep
  visible — do not read Wakhloo's "orthogonal is best" as a universal statement.

## 4. Fold is direction-sensitive, but flatness is not; and the "constant" claim

- `lewandowski2025spacebetween`: the fold measure is **direction-sensitive**
  ($\chi(\Gamma)\neq\chi(-\Gamma)$ in general), yet **flatness** ($\chi=0$) **is**
  direction-invariant — an asymmetry worth stating explicitly rather than glossing over.
- The stronger claim that the **global folding** $\Phi_\mathcal{N}$ is an **architecture
  constant** (invariant to network size at low error) is a **hypothesis** supported by a
  limited empirical scope, not a theorem.
- **Status:** subtle; the constant-$\Phi$ claim should be presented as conjectural.

## 5. Polytope-lens Prediction 3 only partially held

- `black2022polytopelens` predicted that **dense polytope boundaries mark where a feature
  direction goes off-distribution**. Empirically, the dense-boundary "shell" appeared when
  scaling activations **down** toward the origin, **not up**; class changes still occur at
  high magnitude in regions of *low* boundary density.
- **Status:** an internal caveat, flagged by the authors themselves — the polytope demarcates
  the *inner* bound of a direction's validity, not the outer one.

## 6. The same geometric signature in opposite regimes (feedforward vs. reservoir)

- `wakhloo2024population`: **optimized feedforward** nets benefit from disentangled,
  low-correlation, high-separation population codes.
- `morales2021reservoir`: **untrained recurrent** reservoirs improve prediction when
  plasticity **lowers pair-wise correlation** and **raises input-separation** in activity
  space (optimal near the edge of instability).
- **The observation.** The *same* signature — "decorrelate the neurons, separate the
  inputs" — appears in an optimized feedforward net **and** in a recurrent reservoir with no
  supervised weight optimization at all.
- **Status:** cross-architecture consistency, not a contradiction — but notable that the
  signature emerges without explicit optimization, hinting it is a robust geometric property
  of well-behaved dynamics.

---

## Minor: counting vs. parameter-efficiency

`amrami2021depth` "exploits" the fold for a **depth-separation** result: a constant-width
(≤ 4), linear-depth net solves a task family that needs **exponentially many parameters** at
any fixed depth. This is not in tension with `montufar2014regions` — the latter counts the
*capacity* (region budget) a net *has*; Amrami–Goldberg measures the *parameter
efficiency* for a *specific* task family. Depth trades a huge region budget for a compact
folding circuit.
