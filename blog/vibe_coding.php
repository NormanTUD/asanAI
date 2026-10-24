<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Vibe Coding: When Software Writes Itself
description: What natural-language programming really changes, what the original studies show, and why free clones of Photoshop and Figma are a stress test for every software moat.
icon: &#128187;
part: 5
order: 20
color: sky
topics: programming, society, agents, law
tags: code-heavy, interested-layman
math: 10
-->

<div class="md" data-lesson-id="vibe_coding">
In February 2025, Andrej Karpathy gave a name to a way of building software that sounded like a joke: describe what you want, let the model write the code, accept the result, and stop pretending you understand the diff. He called it **vibe coding**. Nine months later, Collins Dictionary made it Word of the Year \cite{collins2025woty}.

The sharpest test case arrived in October 2026. A developer named Brandon Thomas used Claude Opus 5.5 to "vibe code replacements to 7 of Adobe's apps in Rust" — a Photoshop-like **PhotoCraft**, a Premiere-like **FilmCraft**, a Lightroom-like **LightCraft**, plus stand-ins for Illustrator, After Effects, InDesign and Acrobat. The project, **ArtCraft**, is free, open source and deliberately familiar: the menus, panels and shortcuts are where a Photoshop user's hands expect them. Within weeks it had grown to thirteen apps, including Figma-, Word-, Excel- and PowerPoint-like tools \cite{getartcraftapps}. "Software is over," Thomas wrote. He had, in his words, "one-shotted Photoshop. The whole thing" \cite{arstechnica2026softwareover}.

This chapter is about what is real in that claim and what is demo. The short answer: the cost of a *credible alternative* has collapsed, but the cost of a *product* has not. That distinction is the whole story.
</div>

<div class="md">
## What vibe coding actually is

Vibe coding is a **relationship to code**, not a particular tool. Karpathy's original description is precise:

<div class="smart-quote" data-cite="karpathy2025vibecoding">
There's a new kind of coding I call "vibe coding", where you fully give in to the vibes, embrace exponentials, and forget that the code even exists.
</div>

In the same post he described the method: talk to the model, accept all, do not read the diffs, paste error messages back without comment, and work around bugs by asking for random changes until they disappear. He was explicit that this is "not too bad for throwaway weekend projects." The broader definition that stuck is simpler: generating software from natural-language prompts, often without fully reviewing the output \cite{vibe_coding_wiki}.

The word covers three different practices, and most public arguments confuse them:

| Mode | What you do | Good for |
|---|---|---|
| **Vibe coding proper** | Describe, accept, run, iterate. You do not read the code. | Prototypes, demos, personal tools, throwaway experiments |
| **AI-assisted engineering** | Use the model, but read diffs, write tests, review design, own the result. | Most professional feature work |
| **Agentic engineering** | Specify goals, constraints and tests; let agents run in a loop with CI and human review. | Repetitive changes, migrations, large codebases |

Simon Willison calls the disciplined middle version **vibe engineering**: use the tools aggressively, but keep the engineering \cite{willison2025vibeengineering}. The distinction is not cosmetic. A demo of mode one is often used to sell the economics of mode three; a failure of mode one is used to dismiss mode two.

The first empirical studies already complicate the caricature: vibe coding does not eliminate expertise; it **redistributes** it toward context management, rapid evaluation and decisions about when to switch between AI and manual editing \cite{sarkar2025vibe}. Trust moves along a continuum from **delegation** to **co-creation** \cite{pimenova2025goodvibrations}, and the developer's intent is mediated by probabilistic inference rather than deterministic instruction \cite{meske2025intent}.

The practical rule is equally simple:

| Use vibe coding when… | Do not use it when… |
|---|---|
| The output is cheap to test and cheap to throw away | A wrong answer costs money, privacy or safety |
| You can specify the goal precisely enough to check it | The requirement is tacit and only lives in an expert's head |
| The code is a prototype, a script or an internal tool | The code will be maintained by someone who cannot read it |
| You are exploring a design space | You are touching auth, payments, regulated data or production credentials |
| A human will review before merge | Nobody owns the diff |

The practice spread fast because the loop got better: an autocomplete model suggests the next line, but an agent can read a repository, edit several files, run tests, read the failure and try again. In March 2025, Y Combinator reported that a quarter of its current batch had codebases that were almost entirely AI-generated \cite{techcrunch2025yc}. In the 2025 Stack Overflow survey, 84% used or planned to use AI tools, 51% of professionals used them daily, and 72% said vibe coding was **not** part of their professional work \cite{stackoverflow2025ai}. All three numbers are true: most developers use AI; most do not hand over the craft.
</div>

<div class="optional md" data-headline="Where the term came from">
The earliest documented use of "vibe coding" in this sense is Karpathy's post of **2 February 2025, 23:17 UTC**. He named a practice that was already forming around long-context models; he did not invent natural-language programming. Merriam-Webster listed the term as slang on **8 March 2025** \cite{merriam2025vibe}. In the arXiv record, the first abstract mention is **11 March** (Peng and Wang) \cite{peng2025codedigitaltwin}, the first title is **26 May** (Sapkota et al.) \cite{sapkota2025vibeagentic}, and the first dedicated empirical study is **29 June** (Sarkar and Drosos). Collins made it Word of the Year in November. Priority claims are fragile; the sequence matters more than the labels.
</div>

<div class="md">
## Does it make us faster?

The honest answer is: it depends on the task, the codebase and the experience of the person. The original studies are not contradictory; they are measuring different things.

| Question | Original study | Finding |
|---|---|---|
| A narrow, well-specified task? | Peng et al. 2023, controlled experiment with GitHub Copilot \cite{peng2023copilot} | **55.8% faster** on an HTTP-server task |
| Ordinary work in large firms? | Cui et al. 2026, three field experiments, 4,867 developers \cite{cui2026field} | **+26.08%** completed tasks; juniors adopt more and gain more |
| Experts on their own mature repositories? | METR 2025, randomized trial with 16 experienced open-source developers \cite{becker2025metr} | **19% slower**, while developers believed they were faster |
| Delivery in real organizations? | DORA 2025, survey of ~5,000 professionals \cite{dora2025} | Throughput up, stability down; AI amplifies existing practice |
| Building a whole app from scratch? | Vibe Code Bench 2026, 100 specs, 16 frontier models \cite{tran2026vibecodebench} | Best model **61.8%** on held-out specs; self-testing predicts success |

The pattern is consistent once you stop asking "is AI faster?" and start asking "faster at what?" AI wins when the task is **specifiable, verifiable and greenfield**. It loses when the context is tacit, the code is old, and reviewing a plausible-but-wrong change costs more than writing the change. That is why a developer can feel 20% faster and measure 19% slower. Felt productivity is not the same as throughput.

Two caveats. Many of these papers are preprints, and several studies are small; they describe practice better than they prove causation. And the studies are not directly comparable: an autocomplete assistant in a large firm, an agent in a mature repository and a benchmark of whole apps are different interventions. The safest conclusion is also the most useful: **measure cycle time and review load in your own team, not somebody else's headline.**
</div>

<div class="md">
## What it costs

### The last 20% is the product

ArtCraft publishes its own scorecard, which makes the gap unusually visible. FilmCraft reported roughly **87% feature-checklist coverage**, but only **50–60% readiness for real projects** \cite{digitaltrends2026artcraft}. The missing part is not more code. It is color management that matches, a PSD round-trip that does not corrupt a layer, a brush engine that feels right, an undo stack that survives a crash, a plug-in ABI, support, security response and the thousand small behaviors professionals notice immediately.

### Security is a default, not an edge case

The original security literature is older than the vibe-coding debate and remarkably consistent. Pearce et al. found about **40%** of 1,689 Copilot programs vulnerable. Perry et al. found that users with an AI assistant wrote **less secure** code and were **more confident** it was secure. Tihanyi et al. found at least **62.07%** of 331,000 generated C programs vulnerable. The SUSVIBES benchmark found that the best agent was functionally correct 57% of the time but secure only **11.8%** of the time. Veracode's industry testing found **45%** of AI-generated samples introduced an OWASP Top 10 flaw \cite{pearce2022asleep,perry2023insecure,tihanyi2024secure,zhao2025susvibes,veracode2025genai}.

Three failure modes are now routine:

* **Package hallucinations.** Models recommend libraries that do not exist; an attacker registers the invented name and waits. This is **slopsquatting** \cite{spracklen2024slopsquatting}.
* **Exposed data by default.** In May 2025, 170 of 1,645 web apps built with Lovable had a flaw that exposed personal information \cite{semafor2025lovable}.
* **The agent with production credentials.** In July 2025, Replit's agent deleted a company's production database during a code freeze, then misrepresented what happened \cite{register2025replit}.

### Maintenance moves to the reviewer

GitClear's longitudinal data — 211 million changed lines from 2020–2024 — shows refactoring falling from 25% of changed lines to under 10%, while copy-pasted code rose from 8.3% to 12.3% \cite{gitclear2025}. A 2026 study of 22,953 pull requests from 1,719 vibe coders found that lower-experience contributors submitted 2.15 times more commits, received **4.52 times more review comments**, had **31% lower acceptance rates**, and their PRs stayed open **5.16 times longer** \cite{asdaque2026review}. The productivity gain did not disappear; it moved to the reviewer.
</div>

<style>
.mn-calc {
  --vr-color: var(--mn-accent);
  max-width: var(--mn-col-width);
  margin: 1.75em auto;
  padding: 24px;
  border: 1px solid var(--mn-border);
  border-radius: var(--mn-radius-xl);
  background: var(--mn-surface);
  background:
    radial-gradient(120% 120% at 0% 0%, color-mix(in srgb, var(--mn-accent) 14%, transparent), transparent 55%),
    radial-gradient(120% 120% at 100% 100%, color-mix(in srgb, var(--mn-coral) 12%, transparent), transparent 55%),
    var(--mn-surface);
  box-shadow: var(--mn-shadow-md);
}
.mn-calc h3 {
  margin: 0 0 6px;
  font-size: 1.15rem;
  letter-spacing: -0.01em;
}
.mn-calc .mn-calc-sub {
  margin: 0 0 16px;
  color: var(--mn-text-secondary);
  line-height: 1.55;
}
.mn-calc .mn-calc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 12px;
  margin: 14px 0 18px;
}
.mn-calc label {
  color: var(--mn-text-secondary);
  font-size: 0.9rem;
}
.mn-calc select,
.mn-calc input {
  width: 100%;
  margin-top: 4px;
  padding: 8px 10px;
  border: 1px solid var(--mn-border);
  border-radius: var(--mn-radius-sm);
  background: var(--mn-bg-subtle);
  color: var(--mn-text);
  font: inherit;
}
.mn-calc select:focus,
.mn-calc input:focus {
  outline: 2px solid color-mix(in srgb, var(--mn-accent) 55%, transparent);
  outline-offset: 1px;
}
.mn-calc .mn-result {
  padding: 16px;
  border: 1px solid var(--mn-border);
  border-radius: var(--mn-radius-lg);
  background: var(--mn-bg-subtle);
  background: color-mix(in srgb, var(--mn-bg-subtle) 88%, transparent);
}
.mn-calc .mn-result-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.mn-calc .mn-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid var(--mn-border);
  border-color: color-mix(in srgb, var(--vr-color) 40%, transparent);
  background: var(--mn-bg-subtle);
  background: color-mix(in srgb, var(--vr-color) 14%, transparent);
  color: var(--vr-color);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.mn-calc .mn-score {
  color: var(--mn-text-secondary);
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
}
.mn-calc .mn-track {
  height: 10px;
  border-radius: 999px;
  background: var(--mn-border-light);
  overflow: hidden;
}
.mn-calc .mn-fill {
  height: 100%;
  width: 0;
  border-radius: 999px;
  background: var(--vr-color);
  background: linear-gradient(90deg, var(--vr-color), color-mix(in srgb, var(--vr-color) 55%, var(--mn-surface)));
  transition: width 0.35s ease;
}
.mn-calc .mn-advice {
  margin: 12px 0 0;
  color: var(--mn-text);
  line-height: 1.55;
}
.mn-calc.vr-low { --vr-color: var(--mn-emerald); }
.mn-calc.vr-moderate { --vr-color: var(--mn-sky); }
.mn-calc.vr-high { --vr-color: var(--mn-coral); }
.mn-calc.vr-severe { --vr-color: var(--mn-rose); }
@media (max-width: 560px) {
  .mn-calc { padding: 18px; }
}
</style>

<div id="vibe-risk" class="mn-calc vr-low">
	<h3>How risky is your vibe-coded project?</h3>
	<p class="mn-calc-sub">The same tool can be a sketchpad or a liability. Pick the context and watch the risk move.</p>
	<div class="mn-calc-grid">
		<label>What are you building?
			<select id="vr-kind">
				<option value="1">Weekend prototype</option>
				<option value="2">Internal tool</option>
				<option value="3">Customer-facing app</option>
				<option value="4">Safety- or money-critical system</option>
			</select>
		</label>
		<label>How will you verify it?
			<select id="vr-check">
				<option value="4">I will just run it</option>
				<option value="2">Tests and CI</option>
				<option value="1">Human code review</option>
				<option value="0">Review plus security audit</option>
			</select>
		</label>
		<label>What data does it touch?
			<select id="vr-data">
				<option value="0">Public data only</option>
				<option value="1">Internal business data</option>
				<option value="2">Personal data</option>
				<option value="3">Regulated or financial data</option>
			</select>
		</label>
	</div>
	<div class="mn-result">
		<div class="mn-result-top">
			<span id="vr-badge" class="mn-badge">LOW</span>
			<span id="vr-score" class="mn-score">3 / 11</span>
		</div>
		<div class="mn-track"><div id="vr-fill" class="mn-fill"></div></div>
		<p id="vr-out" class="mn-advice"></p>
	</div>
</div>

<script>
(function () {
	function computeRisk() {
		var kind = parseInt(document.getElementById("vr-kind").value, 10) || 1;
		var check = parseInt(document.getElementById("vr-check").value, 10) || 0;
		var data = parseInt(document.getElementById("vr-data").value, 10) || 0;
		var total = kind + check + data;
		var label, advice, level;
		if (total <= 3) {
			label = "LOW"; level = "low";
			advice = "This is the zone vibe coding was invented for: cheap to try, cheap to throw away.";
		} else if (total <= 6) {
			label = "MODERATE"; level = "moderate";
			advice = "Treat the generated code as a draft. Add tests, review the diff, and budget for maintenance.";
		} else if (total <= 8) {
			label = "HIGH"; level = "high";
			advice = "Do not ship without a human owner, a threat model, and a rollback plan. The demo is not the product.";
		} else {
			label = "SEVERE"; level = "severe";
			advice = "This is not a vibe-coding project. Use an engineering process with accountability, audits and a security budget.";
		}
		var wrap = document.getElementById("vibe-risk");
		wrap.className = "mn-calc vr-" + level;
		document.getElementById("vr-badge").textContent = label;
		document.getElementById("vr-score").textContent = total + " / 11";
		document.getElementById("vr-fill").style.width = Math.round((total / 11) * 100) + "%";
		document.getElementById("vr-out").textContent = advice;
	}
	["vr-kind", "vr-check", "vr-data"].forEach(function (id) {
		var el = document.getElementById(id);
		if (el) el.addEventListener("change", computeRisk);
	});
	computeRisk();
})();
</script>

<div class="md">
## The ArtCraft stress test

ArtCraft is worth studying because it is not a generic "AI writes code" story. It is a deliberate attack on a mature software category, built with the exact tools this course describes.

The technical claims are real and checkable. The apps are pure Rust, native on macOS, Windows and Linux, and compile to WebAssembly. They are dual-licensed MIT/Apache. PhotoCraft's README lists 67 tools, 16 adjustment layers, 27 Photoshop blend modes, real PSD read/write, more than 1,700 tests and 500+ commands exposed through a CLI, a JSON channel and an MCP server. It also says the app is in **early alpha** and "not yet a Photoshop replacement for daily professional work" \cite{github2026photocraft}.

What makes the clone credible is not the feature list. It is the **combination**:

* **Interface fidelity.** The menus, shortcuts and panels are copied, so the biggest switching cost — relearning — disappears.
* **File-format compatibility.** A clone that reads and writes PSD files is a credible exit from the file lock-in.
* **Local, native, no subscription.** For photographers, studios and privacy-sensitive users, that is a feature.
* **Agent-readiness.** Every action is a command, so the app can be driven by a script or an agent, not only a human hand — the same shift the [agent](agents.php) chapter describes \cite{anthropic2024mcp}.
* **A business model.** The apps are free; ArtCraft sells access to its paid AI image and video model. The free suite is customer acquisition, not charity. Canva's free Affinity plus paid AI is the same shape \cite{canva2025affinityfree,canva2025affinityofficial}.

The legal question is narrower than the rhetoric. "Clean room" traditionally means one team studies the original and another writes the replacement, so no protected expression crosses the wall. ArtCraft says it worked from public specs and observed behavior. A true clean room traditionally requires separate teams, and that separation is hard to verify from the outside. Reverse engineering for interoperability is often fair use, but copying protected expression, violating an enforceable license or copying distinctive trade dress can still be illegal \cite{eff_reverse_engineering,apple_v_microsoft_wiki}. The model does not launder provenance.

There is also a cultural cost. Shin et al. show that web vibe coding tends to reproduce dominant design conventions and narrow diversity; their remedy is **productive friction**, making the model's defaults visible and contestable \cite{shin2026homogenization}. A clone that copies the dominant interface is the aesthetic version of the same phenomenon: it lowers switching costs by making everything look like the thing it replaces.
</div>

<div class="md">
## Adobe under the microscope

Adobe is the ideal stress test because it is both a spectacular business and a spectacular target. In fiscal 2025 it reported **USD 23.77 billion** in revenue, **USD 25.2 billion** in ARR and more than **USD 10 billion** in operating cash flow; AI-influenced ARR was above **USD 5 billion**, AI-first ARR above **USD 250 million** \cite{adobe2025q4,adobe2025aiarr}. This is not a company that forgot to innovate. Firefly is embedded across its tools and marketed as "commercially safe," though reporting has questioned how complete its training-data provenance is \cite{firefly_wiki}.

So why does a free Photoshop clone matter? Because Adobe's revenue is not primarily a technology rent. It is a **workflow rent**. Photoshop is valuable because the PSD file is the lingua franca of a studio, the plug-in ecosystem is enormous, the color pipeline is trusted, the fonts are licensed, the collaboration tools sit next to the canvas, the enterprise contract includes support and indemnity, and a generation of professionals has Photoshop in their fingers. The moat is the system around the pixels.

That system has soft spots. Creative Cloud moved to subscription-only pricing in 2013; the FTC and DOJ sued Adobe in 2024 over hidden cancellation fees and a difficult cancellation flow, and the case settled in 2026 \cite{adobe_wiki}. Most users need a small fraction of the suite. A free clone that covers that fraction does not have to be as good as Photoshop; it has to be good enough for *their* work. And AI changes the job: if a model can remove a background or generate a layout, the value of manual editing falls — and a clone can call the same model through an API.

| Moat | What it protects | Does a clone attack it? |
|---|---|---|
| Interface and muscle memory | Cost of relearning | **Yes, directly** |
| File formats | Cost of leaving | **Partly** — PSD support helps |
| Plug-ins and assets | Long-tail professional workflows | **Not yet** — the biggest gap |
| Color, fonts, output fidelity | Trust in professional results | **Slowly** |
| Collaboration and cloud | Team workflow | **Not really** — a different product |
| Enterprise trust and indemnity | Procurement, legal, security | **No** — favors the incumbent |
| Price | Willingness to pay | **Yes** — free is a feature |

The likely outcome is not "Adobe is dead." It is **unbundling and price compression**. The low end — students, hobbyists, freelancers, emerging markets, internal tools — moves to free or cheap clones. The high end — enterprises, regulated industries, complex workflows — pays for trust, support, collaboration, indemnity and integration. This is the classic pattern of [disruptive innovation](https://hbr.org/2015/12/what-is-disruptive-innovation): the entrant starts where the incumbent's margin is thin, then improves \cite{christensen2015disruptive}.

Figma is the canary. It went public in July 2025 at a valuation above **USD 56 billion**, then fell below **USD 20** a share by June 2026 as AI research costs rose and gross margin compressed \cite{figma_wiki,yahoo2026figma}. The market was not punishing growth; it was repricing the cost of growing in an AI world. Adobe's question is the same one, with a bigger installed base and a stronger trust moat.
</div>

<div class="md">
## What changes for software companies

**Pricing.** SaaS was built on seats: each human who logs in pays. Agents do not log in; they call an API, execute a workflow and disappear. If value is delivered per task, per document or per successful outcome, the seat is a poor proxy. Adobe sells generative credits, Figma sells AI credits, Canva bundles AI into premium tiers. The direction is clear even where the destination is not.

**Build versus buy.** Every company can now generate software for itself: a dashboard, a document workflow, an inventory tool. That is a real democratization of capability, and a real governance problem. The bottleneck is no longer "can we build it?" but "should we, who owns it, and how do we know it is safe?" Verification, permissions and observability become products.

**Labor.** The review-overhead study above is the clearest warning: low-experience vibe coders shift verification work to maintainers. The education evidence points the same way. Thorgeirsson et al. found that both writing skill and computer-science achievement predict vibe-coding performance \cite{thorgeirsson2026skills}; Rinja et al. found that top students used AI for inquiry and exploration, while low performers delegated tasks and asked for ready-made solutions \cite{rinja2026helpseeking}. The junior pipeline is the hidden risk: if no one learns to read code, no one can review the code that writes the code.

**Open source.** Vibe coding raises productivity by lowering the cost of using existing code, but it weakens the user engagement through which maintainers earn returns. Koren et al. model this as a potential decline in the availability and quality of open source despite higher productivity \cite{koren2026vibeoss}. Gu et al. add a second bias: mainstream languages and frameworks get higher AI success rates than niche ones, a **Matthew effect** that centralizes the ecosystem around what the models already know \cite{gu2025matthew}. Free code is not free infrastructure.

**Incumbents.** The practical response is not to pretend the clone does not exist. It is to make the premium worth paying: clear pricing and easy cancellation; open or well-documented file formats; a strong plug-in and asset ecosystem; enterprise trust, support and indemnity; agent-ready APIs; and a free tier that does not feel like a trap. The lesson of enshittification is that users leave when switching costs fall \cite{enshittification_wiki}. The lesson of Andreessen's "software is eating the world" is that software now eats software: the scarce inputs are distribution, trust, data, workflow and accountability \cite{andreessen2011software}.

**If you are the buyer.** Keep your originals in open or well-documented formats. Pilot the clone on one real deadline, not a demo. Price migration, training and support, not just the license. And keep an exit plan: the point of leaving a lock-in is not to enter a new one.
</div>

<div class="md">
## The practical playbook

The best short manual for this is Kim and Yegge's *Vibe Coding* \cite{kim2025vibecoding}. Their central metaphor is worth keeping: you are the **chef, not the sous-chef**. The model can chop, sear and plate; you own the menu, the taste and every plate that leaves the kitchen.

Their operating model is three loops:

| Loop | Time scale | What to do |
|---|---|---|
| **Inner** | seconds to minutes | Small tasks; spec and tests first; commit every few minutes; verify the output; keep the agent on the path |
| **Middle** | hours to days | Short `AGENTS.md` golden rules; Memento handover; parallel agents in separate workspaces |
| **Outer** | weeks to months | Protect APIs and module boundaries; modularize; audit by risk and familiarity |

Then the rules that matter most in practice:

1. **You are the chef.** Delegating implementation is not delegating responsibility. "The AI wrote it" is not a defense in a post-mortem, a procurement review or a courtroom.
2. **FAAFO, not just speed.** The book optimizes for **F**ast, **A**mbitious, **A**utonomous, **F**un and **O**ptionality. There is no **B** for Better: quality is your job. The book's warning is concrete: set a timer and ask every hour whether you are still on the right path.
3. **Spec before code.** Ask for acceptance criteria, edge cases, a test plan and open questions before the model writes a line. Then make it write the tests.
4. **Keep `AGENTS.md` short, and use the Memento handover.** Around ten golden rules — what must always happen and what must never happen; long lists get ignored. At 20–50% remaining context, stop and write `HANDOVER.md`: what worked, what failed, next steps, temporary branches, pitfalls.
5. **Count the babies and reject cardboard muffins.** Verify every requirement individually and look for deleted lines in the diff. Green tests are not enough: read the implementation and check that the test actually tests something. Models quietly decide what is "optional," and hardcoded values can make a test suite look complete when it is a film set.
6. **Don't break bridges.** Existing module interfaces and APIs are sacrosanct unless you explicitly approve a change. Add, don't delete; ask before changing a contract.
7. **Audit by risk.** Full depth for high-risk or unfamiliar code; lightweight for low-risk internal tools; black-box only for throwaway work.
8. **Threat-model the default.** Auth, authorization, input validation, secrets, rate limits, logging. The model will happily generate a login form that stores passwords in plain text.

The research is beginning to formalize these rules. ZORO turns `AGENTS.md` into active controls; VibeContract turns intent into task contracts; Shift-Up embeds executable requirements and architecture records into the loop; and a 737-participant experiment found human-led instructions beat AI-led instructions \cite{ma2026zoro,wang2026vibecontract,lipsanen2026shiftup,hu2026humanguidance}.

The one-sentence version: **generate at the speed of a demo, verify at the speed of production.**
</div>

<div class="md">
## The verdict

The ArtCraft moment is not the death of Adobe. Adobe has a record revenue base, a deep ecosystem and a trust moat that an alpha suite does not replace. But the warning is real: the entry price of a *credible alternative* has collapsed from "a team, a year, a legal budget" to "a small team, a model and a few weeks." That is a phase change in the economics of software, and it applies to Figma, Microsoft Office, Autodesk and every SaaS product whose moat is a mature interface plus a file format plus a subscription.

The likely outcome is not universal free software. It is **unbundling and price compression**: free clones at the low end, paid trust and integration at the high end. The incumbent's job is to make the high end worth the premium. The entrant's job is to survive the last 20%.

When code is cheap, the scarce things are taste, verification, distribution, data, trust and accountability. The old line was that software is eating the world. The new line is that software is eating software. The meal is not free, and the bill arrives at the part nobody demoed.
</div>

<div class="mn-quiz" data-quiz="vibe_coding"><script type="application/json">{"title": "Vibe coding and the software moat", "questions": [{"q": "What is the defining feature of vibe coding, as Karpathy described it?", "options": ["Generating code from natural-language prompts and accepting it without fully reading or understanding it", "Using a linter and a type checker", "Writing code only in Rust", "Pair-programming with another human"], "answer": 0, "explain": "Karpathy's original post explicitly says he accepts all and does not read the diffs. That is fine for throwaway projects and risky for production."}, {"q": "ArtCraft's FilmCraft reported 87% feature-checklist coverage but only 50-60% readiness. What does that show?", "options": ["A feature checklist measures wiring and surface area, not whether the product is reliable for real work", "The developers cannot count", "The app is 87% faster than Premiere", "Feature coverage is the only metric that matters"], "answer": 0, "explain": "The last 20% is integration, fidelity, edge cases, performance, support and trust. That is where most of the engineering effort and the moat live."}, {"q": "What did the original security studies find about AI-generated code?", "options": ["A substantial share is vulnerable, and users are often more confident than they should be", "AI-generated code was always secure", "Only open-source models were insecure", "Security improved as fast as functionality"], "answer": 0, "explain": "Independent studies found 40% of Copilot programs, at least 62% of generated C programs, and only 11.8% of agent solutions secure in one benchmark."}, {"q": "Why is Adobe vulnerable to a free Photoshop clone despite record revenue?", "options": ["Much of its moat is workflow, interface and subscription pricing, and a familiar clone attacks the switching cost", "Adobe has no customers", "Photoshop is not profitable", "Adobe does not own any file formats"], "answer": 0, "explain": "The moat is the system around the pixels: muscle memory, PSD, plug-ins, color, collaboration and trust. A clone attacks the low-end parts of that system first."}, {"q": "What is the most likely broad effect of cheap, credible software clones?", "options": ["Unbundling and price compression: free clones at the low end, paid trust and integration at the high end", "All software becomes free overnight", "Every incumbent goes bankrupt immediately", "Software engineering disappears"], "answer": 0, "explain": "The cost of a credible alternative falls, which caps pricing and shifts value toward verification, workflow, data, support and accountability. Incumbents can survive by justifying the premium."}]}</script></div>
