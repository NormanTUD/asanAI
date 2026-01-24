<?php include_once("functions.php"); ?>

<div class="md">
The neural network first reads the raw web (left) to gain general intelligence. We then feed it curated "Instruction & Answer" pairs (right) so it learns to speak to users effectively.
</div>

<div class="panel" style="margin-bottom: 25px; background: #f8fafc; border: 1px solid #cbd5e1;">
    <label style="font-weight: bold; color: #334155;">Select a Training Scenario:</label>
    <select id="scenario-select" class="bw-cell" style="width: 100%; padding: 12px; margin-top: 8px;" onchange="TrainingLab.update()">
        <option value="paris">1. Fact Retrieval (Wikipedia Source vs. Direct Answer)</option>
        <option value="sorting">2. Algorithm Design (Polyglot Mess vs. Clean Solution)</option>
        <option value="reasoning">3. Reasoning (Math Forum Debate vs. Logical Proof)</option>
    </select>
</div>

<div class="training-grid" style="display: flex; gap: 2%; width: 100%; align-items: stretch;">
    
    <div class="panel stage-card" style="width: 49%; border-top: 8px solid #64748b;">
        <div class="badge-label" style="background: #64748b;">STAGE 1: RAW WEB DATA</div>
        <div class="subtitle">The model learns grammar, facts, and "Internet Noise"</div>
        
        <div class="output-container" id="base-output"></div>
        <div class="stage-footer">Training set includes: Wikipedia, CommonCrawl, GitHub</div>
    </div>

    <div class="panel stage-card" style="width: 49%; border-top: 8px solid #10b981;">
        <div class="badge-label" style="background: #10b981;">STAGE 2: ASSISTANT DATA</div>
        <div class="subtitle">The model learns to follow user instructions</div>

        <div class="output-container" id="fine-output"></div>
        <div class="stage-footer">Training set includes: Human-written Q&A pairs</div>
    </div>
</div>
