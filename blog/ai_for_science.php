<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Closing the Loop — AI for Science
description: AlphaFold, Navier–Stokes, materials, weather and theorem-proving — the models built to predict the world are now discovering it.
icon: &#129514;
part: 6
order: 11
color: emerald
topics: ai, data, vision, society
-->

<div class="md">
This book opened with the universe: stars forging the elements, a handful of laws, and early mathematics learning to count and measure. The arc now closes. The models we built to **predict** the world are being turned on the world to **discover** in it. Science is the ultimate test of whether a model has *learned* the world rather than merely memorized it — the test the <a href="deep_theory">Why Do Networks Generalize?</a> chapter says we still cannot fully explain.
</div>

<div class="md">
## The flagship: AlphaFold

**Protein folding** — predicting a protein's 3D shape from its amino-acid sequence — was a 50-year grand challenge. **AlphaFold** solved it at near-experimental accuracy, winning CASP14 by a wide margin \cite[Jumper et al., 2021]{jumper2021alphafold}; its leaders shared the 2024 **Nobel Prize in Chemistry**. **AlphaFold 3** extended the model to the joint structure of proteins, nucleic acids, ligands, ions, and modified residues \cite[Abramson et al., 2024]{alphafold3}, and **AlphaMissense** scored essentially all ~216 million possible human missense variants \cite[Abramson et al., 2023]{alphamissense}. The AlphaFold Protein Structure Database released ~**200 million** predicted structures, free to use — a new atlas of biology. \cite[EMBL-EBI, 2023]{alphafold_db}
</div>

<div class="image-row md">
<figure style="max-width:760px; margin:1.5em auto; text-align:center;">
	<img src="alphafold_protein.jpg" alt="A predicted protein structure from AlphaFold, with regions coloured by pLDDT confidence — the model's own estimate of how reliable each part is" style="width:100%; height:auto; border-radius:6px;" />
	<figcaption class="md">One predicted structure from the AlphaFold database, coloured by **pLDDT** — the model's own per-residue confidence. Note the reliable coils and the uncertain, disordered tails: the system knows where it is guessing. \cite[Image: AlphaFold predicted structure]{alphafold_protein_img}</figcaption>
</figure>
</div>

<div class="md">
## Mathematics: from competition problems to open problems

This is where the story becomes startling. AI has moved from *solving given problems* to *opening new ones*.

**The headline.** In September 2026, an **OpenAI** system of roughly **10,000 coordinating agents** (88 hours, ~130 billion tokens) produced an **analytic proof — with a machine-checked Lean 4 formalization** — that the 3D incompressible **Navier–Stokes** equations can develop a **finite-time singularity** under a smooth external force, resolving statement (C)/(D) of the **Clay Millennium** formulation. \cite[OpenAI, 2026]{navier_stokes_openai} Two caveats belong in any honest account: it is a *forced* result, and — as of writing — it is **not yet peer-reviewed**, and its priority is **in active dispute** with work by Buckmaster (NYU) and Alpöge (Anthropic). \cite[Wikipedia, 2026]{navier_stokes_priority}

**The pattern behind it.** The proof did not appear from a single forward pass. It came from an **evolutionary LLM search** — propose code/proof, test it, refine — a method first shown to find *new* mathematical results years earlier:

| System | Year | What it found |
|--------|------|---------------|
| **AlphaTensor** \cite[Fawzi et al., 2022]{alphatensor} | 2022 | Faster, provably-correct matrix-multiplication algorithms (first improvement over Strassen's 4×4 two-level scheme in ~50 years) |
| **FunSearch** \cite[Romera-Paredes et al., 2024]{funsearch} | 2024 | New cap-set constructions and a better bin-packing lower bound — the *first* LLM discoveries on open problems |
| **Deletion codes** \cite[Weindel & Heckel, 2025]{deletion_codes} | 2025 | A construction proven to hit the **conjectured-optimal** Varshamov–Tenengolts single-deletion code (a 70-year-open problem) |
| **AlphaEvolve** \cite[Georgiev, Gómez-Serrano, Tao, Wagner, 2025]{alphaevolve} | 2025 | On 67 open problems (with Terence Tao a co-author): matched best-known in most, **improved several** |

The competition-math line ran in parallel: **AlphaProof** + **AlphaGeometry 2** reached the **silver-medal** standard at the 2024 IMO (28/42 points), with AG2 alone now **beating an average gold medalist** on 25 years of Olympiad geometry \cite[Wikipedia, 2024]{imo_wiki} \cite[Chervonyi et al., 2025]{alphageometry2}.
</div>

<div class="md">
## Materials, weather, molecules

* **Materials.** **GNoME**, a graph network over crystal structures, predicted **2.2 million** new stable materials, ~800,000 of them promising ceramics, superhard substances, and superconductors \cite[Merchant et al., 2023]{merchant2023gnome}.
* **Weather.** **FourCastNet** and **Graph Cast** forecast a week of global weather in *seconds*, matching or beating the physics-based ECMWF model while being orders of magnitude faster \cite[Pathak et al., 2022]{pathak2022fourcastnet}.
* **Games → search.** **AlphaGo** beat the Go champion \cite[Silver et al., 2016]{silver2016go}; **AlphaZero** then taught itself Go, chess and shogi by self-play \cite[Silver et al., 2018]{silver2018zero} — the *learned value + search* engine that powered everything above.
* **World models.** **JEPA**-style models predict the *next state* of a system rather than its raw pixels — the idea behind control and robotics \cite[LeCun, 2022]{lecun2022jepa}.
</div>

<div class="md">
## Why this closes the loop

The book's opening claim is that **physics is compression**: find the short law that generates the data. A model that *generalizes* is doing precisely that — compressing a dataset into a law you can **extrapolate**. When that extrapolation yields a *new* protein, a *new* material, a *new* code, or a *new* proof, **prediction and discovery become a single act**. The tally mark, the Pāṇini rule, and the neural net are the same gesture: abstract the pattern into a coherent structure, then trust it to say something about what you have not yet seen (\cite[Coherent Difference]{coherent_difference}).

The honest caveat: these systems are **hypothesis generators**. The human in the loop still verifies, checks the Lean proof, reproduces the crystal, and decides what matters. **AI proposes; science disposes.**
</div>

<script>
async function loadAiForScienceModule() {
	updateLoadingStatus("Loading section about AI for Science...");
	return Promise.resolve();
}
</script>