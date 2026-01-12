<?php include_once("functions.php"); ?>

<div class="md">
    <h2>Training Data: From Internet Scrape to Human Alignment</h2>
    <p>The neural network first reads the raw web (left) to gain general intelligence. We then feed it curated "Instruction & Answer" pairs (right) so it learns to speak to users effectively.</p>
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

<style>
    .stage-card { position: relative; padding-top: 45px; min-height: 550px; display: flex; flex-direction: column; box-sizing: border-box; background: #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    
    .badge-label { position: absolute; top: 0; left: 20px; color: white; padding: 6px 15px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; font-weight: bold; font-size: 0.7rem; letter-spacing: 0.8px; }
    
    .subtitle { font-size: 0.75rem; color: #64748b; margin-bottom: 12px; font-weight: bold; text-transform: uppercase; padding: 0 10px; line-height: 1.3; }
    
    .output-container { flex-grow: 1; border: 1px solid #e2e8f0; border-radius: 8px; overflow-y: auto; background: #fdfdfd; margin: 0 10px 10px 10px; }

    /* Fix word wrap for messy Stage 1 data */
    #base-output pre { 
        margin: 0 !important; 
        white-space: pre-wrap !important; 
        word-wrap: break-word !important; 
        word-break: break-all !important; 
        font-size: 0.8rem !important;
        background: #f1f5f9 !important;
        border: none;
    }

    .assistant-frame { padding: 20px; font-family: 'Inter', sans-serif; line-height: 1.6; font-size: 0.95rem; color: #1e293b; }
    .assistant-frame pre { margin-top: 15px !important; }
    .stage-footer { margin-bottom: 15px; font-size: 0.7rem; color: #94a3b8; font-style: italic; text-align: center; }
</style>
