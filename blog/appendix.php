<?php include_once("functions.php"); ?>

<div class="md">
## Grokking

**\cite[Grokking]{grokking}** is a phenomenon in deep learning where a model suddenly transitions from **memorization** to **generalization** long after it seems to have plateaued.
Originally identified by **Power et al. (2022)**, this "aha moment" occurs when a model achieves 100% training accuracy but 0% validation accuracy for an extended period,
only to have validation accuracy jump to 100% within a few epochs. This indicates a shift from high-frequency noise-fitting to the discovery of an underlying algorithmic pattern.
Structurally, this is often marked by a transition in **attention matrices** from messy, uniform distributions to clean, highly structured representations.
</div>
