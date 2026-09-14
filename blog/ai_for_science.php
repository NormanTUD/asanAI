<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Closing the Loop — AI for Science
description: AlphaFold, materials, weather and math — the models built to predict the world are now discovering it.
icon: &#129514;
part: 6
order: 11
color: emerald
topics: ai, data, vision, society
-->

<div class="md">
This book opened with the universe: stars forging the elements, a handful of laws, and early mathematics learning to count and measure. The arc now closes. The models we built to **predict** the world are being turned on the world to **discover** in it. Science is the ultimate test of whether a model has learned the world, rather than merely memorized it — the test the <a href="deep_theory">Why Do Networks Generalize?</a> chapter says we still cannot fully explain.
</div>

<div class="md">
## The flagship: AlphaFold

**Protein folding** — predicting a protein's 3D shape from its amino-acid sequence — was a 50-year grand challenge. **AlphaFold** solved it at near-experimental accuracy, winning the CASP14 competition by a wide margin \cite[Jumper et al., 2021]{jumper2021alphafold}. In 2024 its leaders shared the **Nobel Prize in Chemistry**.

The result became a public instrument. The **AlphaFold Protein Structure Database** released roughly **200 million** predicted structures, free to use — effectively a new atlas of biology. \cite[EMBL-EBI, 2023]{alphafold_db}
</div>

<div class="image-row md">
<figure style="max-width:760px; margin:1.5em auto; text-align:center;">
	<img src="alphafold_protein.jpg" alt="A predicted protein structure from AlphaFold, with regions coloured by pLDDT confidence — the model's own estimate of how reliable each part is" style="width:100%; height:auto; border-radius:6px;" />
	<figcaption class="md">One predicted structure from the AlphaFold database, coloured by **pLDDT** — the model's own per-residue confidence. Note the reliable coils and the uncertain, disordered tails: the system knows where it is guessing. \cite[Image: AlphaFold predicted structure]{alphafold_protein_img}</figcaption>
</figure>
</div>

<div class="md">
## From games to proofs

**AlphaGo** beat the world Go champion \cite[Silver et al., 2016]{silver2016go}; **AlphaZero** then discarded human data and taught itself Go, chess and shogi by self-play, finding moves and openings humans had missed \cite[Silver et al., 2018]{silver2018zero}. The engine — **learned value + search** — reached straight into mathematics. In 2024, **AlphaProof**, an LLM paired with a search over formal proofs, earned a **silver-medal** result at the International Mathematical Olympiad. \cite[Wikipedia, 2024]{imo_wiki}
</div>

<div class="md">
## Materials, weather, molecules

* **Materials.** **GNoME**, a graph neural network over crystal structures, predicted **2.2 million** new stable materials, of which ~800,000 are promising ceramics, superhard substances, and superconductors \cite[Merchant et al., 2023]{merchant2023gnome}.
* **Weather.** **FourCastNet** and **Graph Cast** are neural models that forecast a week of global weather in *seconds*, matching or beating the physics-based ECMWF model while being orders of magnitude faster \cite[Pathak et al., 2022]{pathak2022fourcastnet}.
* **World models.** **JEPA**-style models predict the *next state* of a system rather than its raw pixels — the same idea that underlies control and robotics \cite[LeCun, 2022]{lecun2022jepa}.
</div>

<div class="md">
## Why this closes the loop

The book's opening claim is that **physics is compression**: find the short law that generates the data. A model that *generalizes* is doing precisely that — compressing a dataset into a law you can **extrapolate**. When that extrapolation yields a *new* protein, a *new* material, or a *new* theorem, **prediction and discovery become a single act**. The tally mark, the Pāṇini rule, and the neural net are the same gesture: abstract the pattern, then trust it to say something about what you have not yet seen.

The honest caveat: these systems are **hypothesis generators**. The human in the loop still verifies, interprets, and decides what matters. **AI proposes; science disposes.**
</div>

<script>
async function loadAiForScienceModule() {
	updateLoadingStatus("Loading section about AI for Science...");
	return Promise.resolve();
}
</script>
