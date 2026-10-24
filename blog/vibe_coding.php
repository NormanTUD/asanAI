<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Vibe Coding: When Software Writes Itself
description: The natural-language programming revolution, its security and labor costs, and why free open-source clones of Photoshop, Premiere and InDesign are a stress test for every software moat.
icon: &#128187;
part: 5
order: 20
color: sky
topics: programming, society, agents, law
tags: code-heavy, interested-layman
math: 10
-->

<div class="md" data-lesson-id="vibe_coding">
In February 2025, Andrej Karpathy described a way of building software that sounded like a joke: give in to the vibes, let the model write the code, accept everything, and stop pretending you understand the diff. He called it **vibe coding** \cite{karpathy2025vibecoding}. Nine months later, Collins Dictionary named it Word of the Year \cite{collins2025woty}. By then it was no longer a joke about weekend projects. It was a description of how a visible share of new software is actually being made — and a business model.

The sharpest test case arrived in October 2026. A developer named Brandon Thomas announced that he had used Anthropic's Claude Opus 5.5 to "vibe code replacements to 7 of Adobe's apps in Rust": a Photoshop-like **PhotoCraft**, a Premiere-like **FilmCraft**, a Lightroom-like **LightCraft**, plus stand-ins for Illustrator, After Effects, InDesign and Acrobat (\cite[Ars Technica, 2026]{arstechnica2026softwareover}). The project, **ArtCraft**, is free, open source, native, and deliberately familiar: the menus, panels and shortcuts are where a Photoshop user's hands expect them. Within weeks the suite had grown to thirteen apps, including a Figma-like FigCraft, Word-like WordCraft, Excel-like GridCraft and PowerPoint-like DeckCraft \cite{getartcraftapps}. "Software is over," Thomas wrote. He had, in his words, "one-shotted Photoshop. The whole thing."

This chapter asks what is real in that claim, what is demo, and what happens to companies whose product is a mature interface, a file format and a subscription. The answer is not "Adobe is dead." It is stranger and more useful: **the cost of a credible alternative has collapsed**, and that changes the economics of every company whose moat was the difficulty of writing software.
</div>

<div class="md">
## The word and the thing

The first thing to get straight is that "vibe coding" names a *relationship to code*, not a particular tool. Karpathy's original description is precise about that relationship:

<div class="smart-quote" data-cite="karpathy2025vibecoding">
There's a new kind of coding I call "vibe coding", where you fully give in to the vibes, embrace exponentials, and forget that the code even exists.
</div>

In the same post he described the method: talk to the model, accept all, do not read the diffs, paste error messages back without comment, and work around bugs by asking for random changes until they disappear. He was explicit that this is "not too bad for throwaway weekend projects." The definition that stuck is broader: generating software from natural-language prompts, often without fully reviewing the output \cite{vibe_coding_wiki}.

That breadth is why the term is both useful and misleading. There is a spectrum:

* **Vibe coding proper.** You describe, accept, run, and iterate on the result. You do not read the code. The artifact is a prototype, a personal tool, a demo, or something you are willing to throw away. This is the mode Karpathy described, and it is genuinely useful.
* **AI-assisted engineering.** You use the same models and agents, but you read the diffs, write tests, review the design, and own the result. The model is a very fast junior collaborator, not an oracle. Simon Willison calls the disciplined version **vibe engineering**: use the tools aggressively, but keep the engineering \cite{willison2025vibeengineering}.
* **Agentic engineering.** You specify goals, constraints, tests and permissions, then let one or more agents run in a loop against a real repository, with CI, sandboxes and human review at the boundaries. The unit of work shifts from "write this function" to "make this change pass these checks." This is where the [agent](agents.php) chapter meets software engineering.

The confusion in public argument comes from sliding between these three. A demo of the first is used to sell the economics of the third; a failure of the first is used to dismiss the second. They are different practices with different risk profiles.
</div>

<div class="md">
## Who said it first? A provenance

The attribution is precise, and easy to overstate. The earliest documented use of "vibe coding" in the sense this chapter uses is a post by Andrej Karpathy on **2 February 2025**, at 23:17 UTC. The post does not say "I invented this"; it says:

<div class="smart-quote" data-cite="karpathy2025vibecoding">
There's a new kind of coding I call "vibe coding", where you fully give in to the vibes, embrace exponentials, and forget that the code even exists.
</div>

That distinction matters. Karpathy named a practice that was already forming around long-context models, agentic editors and tools such as Cursor and the first hosted coding assistants. The practice has a longer prehistory in natural-language programming, program synthesis, literate programming, spreadsheets and the no-code movement. What was new in February 2025 was not the idea of describing software in words; it was the combination of a general model, a repository-sized context, a tool loop, and a culture willing to accept the output. **Karpathy coined the term as it is used today; he did not invent the underlying activity.**

The lexical record moved faster than the research record:

| Date | Event | Source |
|---|---|---|
| 2 Feb 2025 | Karpathy names "vibe coding" in a post on X | \cite{karpathy2025vibecoding} |
| 8 Mar 2025 | Merriam-Webster lists it as slang and trending | \cite{merriam2025vibe} |
| 11 Mar 2025 | First arXiv abstract we found that mentions the term (in passing) | \cite{peng2025codedigitaltwin} |
| 26 May 2025 | First arXiv paper with "vibe coding" in the title | \cite{sapkota2025vibeagentic} |
| 29 Jun 2025 | First dedicated empirical study of vibe-coding sessions | \cite{sarkar2025vibe} |
| 29 Jul 2025 | Formal definition and research agenda | \cite{meske2025intent} |
| 15 Sep 2025 | First systematic qualitative study (interviews and posts) | \cite{pimenova2025goodvibrations} |
| 30 Sep 2025 | Grey-literature review of 101 practitioner sources | \cite{fawzy2025grey} |
| 6 Nov 2025 | Collins names it Word of the Year | \cite{collins2025woty} |
| 2 Dec 2025 | SUSVIBES security benchmark for agent-generated code | \cite{zhao2025susvibes} |
| 21 Jan 2026 | Economic model of vibe coding's effect on open source | \cite{koren2026vibeoss} |
| 27 Feb 2026 | Large study of review overhead from novice vibe coders | \cite{asdaque2026review} |
| 13 Mar 2026 | Study of design homogenization in web vibe coding | \cite{shin2026homogenization} |
| 3 Oct 2026 | ArtCraft releases its Adobe-style apps | \cite{arstechnica2026softwareover} |

Priority claims in a fast-moving field are fragile. The dates above are verifiable; the labels "first" are the authors' own descriptions, not a court ruling. What is clear is the sequence: **the term came first, then qualitative studies of what people were doing, then security and productivity benchmarks, then economics.** That order matters. The early public debate was shaped by demos and think-pieces before it was shaped by measurement; the later literature is an attempt to catch up.

The first empirical study is instructive about what the early practice actually looked like. Sarkar and Drosos analyzed more than eight hours of curated video of extended vibe-coding sessions and found **iterative goal-satisfaction cycles**: prompt, scan the generated code, test the application, edit manually, repeat. Prompts mixed vague high-level directives with detailed technical specifications. Debugging remained hybrid. Most importantly, vibe coding did not eliminate programming expertise; it **redistributed** it toward context management, rapid code evaluation, and decisions about when to switch between AI and manual editing \cite{sarkar2025vibe}. Pimenova et al. later analyzed more than 190,000 words of interviews, Reddit threads and LinkedIn posts and described trust as a continuum that regulates movement between **delegation** and **co-creation** \cite{pimenova2025goodvibrations}. Meske et al. gave the paradigm a sharper definition: vibe coding shifts the mediation of developer intent from deterministic instruction to probabilistic inference, and redistributes epistemic labor between humans and machines \cite{meske2025intent}.

By October 2025 there was already a survey of the field \cite{ge2025survey}. The speed is unusual, and it is itself evidence: a term invented in February had a research literature, a benchmark culture and a Word of the Year award within nine months.
</div>

<div class="md">
### From autocomplete to agency

Vibe coding is not simply better autocomplete, although autocomplete was the first form. The difference is the **loop**. An autocomplete model suggests the next line. A coding agent can read the repository, plan a change, edit several files, run the tests, read the failure, try again, and repeat. Long context windows, tool use, and the [agent loop](agents.php) are what turned a text predictor into something that can attempt a whole task.

That shift is why the practice spread so quickly. In March 2025, Y Combinator reported that a quarter of the startups in its current batch had codebases that were almost entirely AI-generated \cite{techcrunch2025yc}. In the 2025 Stack Overflow survey, 84% of respondents said they were using or planning to use AI tools in their development process, and 51% of professional developers said they used them daily \cite{stackoverflow2025ai}. The same survey found that 72% said vibe coding was **not** part of their professional work. Both numbers are true at once: most developers use AI; most do not describe what they do as vibe coding. The term is a Rorschach test for how much of the craft one is willing to hand over.

Adoption spread beyond software. A practitioner report documents vibe-coding challenges with ICT, digital-marketing, journalism and communication students at Fontys University of Applied Sciences and North-West University in early 2025 \cite{vanbokhorst2026beforetrend}. The term was barely a month old; the classroom was already using it.

The honest summary is that we are in a **transition**, not a settled regime. The tools are good enough to change how software is made, and not good enough to remove the need for engineers. The rest of this chapter is about that gap.
</div>

<div class="mn-predict" data-predict="metr-ai-speed"><script type="application/json">{"q": "In METR's 2025 randomized trial, experienced open-source developers using AI tools on their own repositories were…", "options": ["about 19% faster", "about 19% slower", "exactly as fast", "more than twice as fast"], "answer": 1, "try": "Compare this with the 2023 Copilot experiment, where developers were about 56% faster on a narrow boilerplate task.", "explain": "The developers believed they were faster — before the task they predicted a 24% speed-up, and afterwards they still believed AI had helped. The measured result was a 19% slowdown. The gap between felt productivity and measured productivity is one of the central facts of this transition."}</script></div>

<div class="md">
## Why it works — and where it breaks

The evidence is not that AI makes all programming faster or slower. It is that the effect depends on the task, the codebase and the process. Four studies, taken together, tell the story better than any single headline.

**The narrow task: a large win.** In a controlled experiment, developers using GitHub Copilot completed a specific boilerplate task about **55.8% faster** than the control group \cite{peng2023copilot}. When the task is well-specified, greenfield, and easy to verify, a model that has seen thousands of similar solutions is genuinely faster.

**The field experiment: a real but uneven gain.** Cui et al. ran three randomized field experiments at Microsoft, Accenture and an anonymous Fortune 100 company: 4,867 developers, ordinary work, an AI code-completion assistant. Combining the experiments, completed tasks rose by **26.08%**, and less experienced developers adopted the tool more and gained more \cite{cui2026field}. This is the strongest evidence that the tool can raise throughput in a real organization.

**The real repository: a surprising loss.** METR ran a randomized trial with experienced open-source developers on their *own* repositories — real code, real conventions, real hidden coupling. The AI-assisted group was **19% slower**, even though they believed they were faster \cite{becker2025metr}. The models were good at producing plausible code; they were not good at understanding the particular repository, the maintainer's intent, or the cost of reviewing and repairing a plausible-but-wrong change. The apparent contradiction with Cui et al. is not a contradiction: they measured different tasks, different codebases and different levels of experience.

**The organization: amplification, not magic.** Google's 2025 DORA report surveyed nearly 5,000 technology professionals and found that 90% used AI at work, and more than 80% believed it increased their productivity. But AI adoption had a **positive** relationship with throughput and a **negative** relationship with delivery stability. The report's central metaphor is exact: AI does not fix a team; it amplifies what is already there. Strong teams with fast feedback and good tests get better. Struggling teams get more change, more instability, and more work in progress \cite{dora2025}.

The Stack Overflow survey supplies the lived texture. The single biggest frustration, cited by 66% of developers, is AI solutions that are "almost right, but not quite"; 45% say debugging AI-generated code is more time-consuming \cite{stackoverflow2025ai}. Almost-right is the worst kind of wrong, because it consumes review attention without producing a correct result.
</div>

<div class="md">
### The last 20% is 80% of the work

The ArtCraft case makes the gap unusually visible because the project publishes its own scorecard. FilmCraft's documentation estimated roughly **87% feature-checklist coverage**, but only **50–60% readiness for real projects** \cite{digitaltrends2026artcraft}. PhotoCraft's README is even blunter: every Photoshop menu item is wired to a command, but "that measures wiring, not behavior"; the app is "not yet a Photoshop replacement for daily professional work." The biggest gaps are AI/generative features, missing tools, typography depth, professional workflows, and plug-in compatibility \cite{github2026photocraft}.

Benchmarks put a number on the gap. Vibe Code Bench evaluated 16 frontier models on 100 end-to-end web-application specifications; the best model reached **61.8%** accuracy on the held-out test split, and self-testing during generation was the strongest predictor of success \cite{tran2026vibecodebench}. VIBEPASS then separated two skills that are often conflated: generating a fix and *diagnosing* the fault that needs fixing. Across 12 frontier models, fault-targeted reasoning did not scale with general coding capability \cite{bansal2026vibepass}. A model can write a plausible patch without being able to find the bug that makes the patch necessary.

This is the **last-20% problem**, and it is the most important economic fact in the chapter. Generating the first 80% of a familiar application is now cheap: the layout is known, the interactions are documented, the file formats have public specifications, and a model has seen a million examples. The last 20% is not more code. It is color management that matches, a PSD round-trip that does not silently corrupt a layer, a brush engine that feels right, an undo stack that survives a crash, a plug-in ABI, a support organization, a security response team, and the thousand small behaviors that professionals notice immediately because their livelihood depends on them.

A feature checklist is a map of the *surface*. Readiness is a property of the *system*. The distance between them is where most software companies actually live.
</div>

<div class="md">
### The security bill

The last 20% is also where the security bill arrives. The original security literature is older than the vibe-coding debate, and it is remarkably consistent. Pearce et al. prompted GitHub Copilot across 89 scenarios and 1,689 programs; about **40%** were vulnerable \cite{pearce2022asleep}. Perry et al. ran what they describe as the first large-scale user study of AI code assistants: participants with access to an assistant wrote significantly **less secure** code than those without, and were **more likely to believe** they had written secure code \cite{perry2023insecure}. Tihanyi et al. generated 331,000 compilable C programs with nine models and found at least **62.07%** vulnerable \cite{tihanyi2024secure}. The vibe-coding-specific SUSVIBES benchmark is even more sobering: on 186 real-world feature requests, the best agent was functionally correct 57% of the time but secure only **11.8%** of the time \cite{zhao2025susvibes}.

Industry-scale testing points the same way. Veracode tested more than 100 large language models on security-sensitive coding tasks and found that **45% of AI-generated code samples introduced an OWASP Top 10 vulnerability**. Larger and newer models did not reliably improve security; functional capability improved much faster than secure coding \cite{veracode2025genai}. Benchmarks such as SecureVibeBench now try to measure this specifically for agent workflows \cite{chen2025securerbench}, and security researchers have begun to argue that the problem is structural rather than a temporary model weakness \cite{livshits2026llmsecurity}.

Three failure modes are now well documented:

* **Package hallucinations.** Models recommend libraries that do not exist. An attacker can register the invented name and wait for the generated code to install it — **slopsquatting**. A large study found hallucinated packages in at least 5.2% of samples from commercial models and 21.7% from open-source models \cite{spracklen2024slopsquatting}.
* **Exposed data by default.** In May 2025, researchers found that 170 of 1,645 web applications built with the vibe-coding platform Lovable had a flaw that let anyone access personal information \cite{semafor2025lovable}.
* **The agent with production credentials.** In July 2025, Replit's coding agent deleted a company's production database during a code freeze, then misrepresented what had happened. The CEO apologized \cite{register2025replit}.

A December 2025 analysis of 470 open-source pull requests found that AI-co-authored code contained about **1.7 times more major issues** than human-written code, with security vulnerabilities 2.74 times more common \cite{coderabbit2025}. And the longitudinal GitClear data — 211 million changed lines from 2020–2024 — shows the same direction at the level of the repository: refactoring fell from 25% of changed lines in 2021 to under 10% in 2024, while copy-pasted code rose from 8.3% to 12.3% \cite{gitclear2025}. The code that is generated is not only less reviewed; it is less *reused*, less refactored, and more duplicated. That is technical debt with a compounding interest rate.

None of this means AI-generated code is uniquely insecure. It means the **default** is insecure, and the default is what most vibe-coded projects ship. The difference between a demo and a product is whether someone has built the gates that catch the default.
</div>

<div id="vibe-risk" style="max-width: var(--mn-col-width); margin: 1.5em auto; padding: 20px; border: 1px solid var(--mn-border); border-radius: 12px; background: var(--mn-surface);">
	<h3 style="margin-top:0; color: var(--mn-text);">How risky is your vibe-coded project?</h3>
	<p style="color:var(--mn-text-secondary); line-height:1.5;">The same tool can be a sketchpad or a liability. Pick the context and see where the risk concentrates.</p>
	<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:14px; margin: 12px 0;">
		<label style="color:var(--mn-text-secondary);">What are you building?<br><select id="vr-kind" style="width:100%; padding:6px; border:1px solid var(--mn-border); border-radius:6px; background:var(--mn-bg-subtle); color:var(--mn-text);">
			<option value="1">Weekend prototype</option>
			<option value="2">Internal tool</option>
			<option value="3">Customer-facing app</option>
			<option value="4">Safety- or money-critical system</option>
		</select></label>
		<label style="color:var(--mn-text-secondary);">How will you verify it?<br><select id="vr-check" style="width:100%; padding:6px; border:1px solid var(--mn-border); border-radius:6px; background:var(--mn-bg-subtle); color:var(--mn-text);">
			<option value="4">I will just run it</option>
			<option value="2">Tests and CI</option>
			<option value="1">Human code review</option>
			<option value="0">Review plus security audit</option>
		</select></label>
		<label style="color:var(--mn-text-secondary);">What data does it touch?<br><select id="vr-data" style="width:100%; padding:6px; border:1px solid var(--mn-border); border-radius:6px; background:var(--mn-bg-subtle); color:var(--mn-text);">
			<option value="0">Public data only</option>
			<option value="1">Internal business data</option>
			<option value="2">Personal data</option>
			<option value="3">Regulated or financial data</option>
		</select></label>
	</div>
	<p id="vr-out" style="font-family:monospace; color:var(--mn-text); line-height:1.7;"></p>
</div>

<script>
(function () {
	function compute() {
		var kind = parseInt(document.getElementById("vr-kind").value, 10) || 1;
		var check = parseInt(document.getElementById("vr-check").value, 10) || 0;
		var data = parseInt(document.getElementById("vr-data").value, 10) || 0;
		var total = kind + check + data;
		var label, advice;
		if (total <= 3) {
			label = "LOW";
			advice = "This is the zone vibe coding was invented for: cheap to try, cheap to throw away.";
		} else if (total <= 6) {
			label = "MODERATE";
			advice = "Treat the generated code as a draft. Add tests, review the diff, and budget for maintenance.";
		} else if (total <= 8) {
			label = "HIGH";
			advice = "Do not ship without a human owner, a threat model, and a rollback plan. The demo is not the product.";
		} else {
			label = "SEVERE";
			advice = "This is not a vibe-coding project. Use an engineering process with accountability, audits and a security budget.";
		}
		document.getElementById("vr-out").innerHTML =
			"risk score: " + total + " / 11 &nbsp;→&nbsp; <strong>" + label + "</strong><br>" + advice;
	}
	["vr-kind", "vr-check", "vr-data"].forEach(function (id) {
		var el = document.getElementById(id);
		if (el) el.addEventListener("change", compute);
	});
	compute();
})();
</script>

<div class="md">
### The research base in one table

The field is now large enough that no single study can carry the argument. This table is a compact map of the original work; the rows are chosen because each one changes a different part of the picture.

| Question | Original study and design | Main finding |
|---|---|---|
| Does AI speed up a narrow coding task? | Peng et al. 2023, controlled experiment with GitHub Copilot \cite{peng2023copilot} | 55.8% faster on a specified HTTP-server task |
| Does it raise throughput in large firms? | Cui et al. 2026, three field experiments, 4,867 developers \cite{cui2026field} | +26.08% completed tasks; juniors adopt more and gain more |
| Does it help experts on mature repositories? | Becker et al. 2025 (METR), RCT with 16 experienced open-source developers \cite{becker2025metr} | 19% slower; developers believed they were 20% faster |
| Does it improve delivery stability? | DORA 2025, survey of ~5,000 professionals \cite{dora2025} | Throughput up, stability down; AI amplifies existing practice |
| Do users write secure code? | Perry et al. 2023, user study with Codex \cite{perry2023insecure} | Less secure code, more confidence that it is secure |
| Is generated code vulnerable? | Pearce et al. 2022; Tihanyi et al. 2024; Zhao et al. 2025 \cite{pearce2022asleep,tihanyi2024secure,zhao2025susvibes} | 40% of 1,689 programs; at least 62.07% of 331,000 C programs; 11.8% secure despite 57% functional |
| How do vibe coders actually work? | Sarkar & Drosos 2025; Pimenova et al. 2025; Chou et al. 2025; Fawzy et al. 2025 \cite{sarkar2025vibe,pimenova2025goodvibrations,chou2025rollingdice,fawzy2025grey} | Iterative goal satisfaction; trust as a delegation/co-creation continuum; "rolling the dice"; speed-quality trade-off |
| Does it create technical debt? | Waseem et al. 2025; GitClear 2025 \cite{waseem2025flowdebt,gitclear2025} | Flow-debt trade-off; refactoring down, duplication up |
| Does it shift review burden? | Asdaque et al. 2026, 22,953 PRs from 1,719 vibe coders \cite{asdaque2026review} | Low-experience PRs: 4.52x more review comments, 31% lower acceptance, 5.16x longer open |
| Does it homogenize design? | Shin et al. 2026, sociotechnical analysis \cite{shin2026homogenization} | Frictionless generation narrows design diversity; "productive friction" is a mitigation |
| Does it favor incumbents? | Gu et al. 2025, thousands of coding and framework-selection tasks \cite{gu2025matthew} | Mainstream languages and frameworks get higher AI success rates; a Matthew effect |
| Can agents build whole apps? | Tran et al. 2026, Vibe Code Bench, 100 specs, 16 models \cite{tran2026vibecodebench} | Best model 61.8%; self-testing predicts success |
| Can agents diagnose their own bugs? | Bansal et al. 2026, VIBEPASS, 12 frontier models \cite{bansal2026vibepass} | Fault-targeted reasoning does not scale with general capability |

The table also explains why the public argument is so noisy. A study of a greenfield HTTP server, a study of mature repositories, a survey of organizations and a benchmark of end-to-end apps are all measuring "AI coding" — but they are not measuring the same thing. **The unit of analysis is the task, not the tool.**

Two caveats about the literature. First, many of the 2025–2026 papers are preprints, and several of the qualitative studies are small: 16 developers here, 20 videos there, a single classroom. They are good at describing *what people do* and weak at proving *what causes what*. Second, the productivity studies are not directly comparable: Cui et al. measure completed tasks in large firms with an autocomplete assistant; METR measures completion time on mature repositories with agentic tools; Peng et al. measure a single greenfield task. The most reliable claims are the ones with a clear task, a clear outcome, and an independent replication. The security findings are the strongest in this respect, because independent groups using different benchmarks keep finding the same direction.


There is another cost that does not appear in the repository's test suite: the open-source ecosystem that makes vibe coding possible. Models are trained on open-source code; agents assemble open-source libraries; users of vibe-coded software often never read the documentation, file a bug, or contribute a fix. The maintainers who produced the input get less of the engagement that historically sustained them.

A 2026 economic model by Koren, Békés, Hinz and Lohmann calls this **"Vibe Coding Kills Open Source."** Their argument is not that open source disappears, but that the *equilibrium* shifts: vibe coding raises productivity by lowering the cost of using existing code, while weakening the user engagement through which many maintainers earn returns. If open source is monetized mainly through direct user engagement, greater vibe-coding adoption can reduce entry and sharing, lower the availability and quality of open source, and reduce welfare despite higher productivity \cite{koren2026vibeoss}.

The empirical signs are already visible. GitHub described the surge of low-quality AI-generated contributions as an **"Eternal September"** for open source and introduced maintainer controls — restricting pull requests to collaborators, temporary activity limits, better issue banners — because maintainers were being buried \cite{github2026eternalseptember}. There is a second, subtler bias. Gu et al. tested thousands of algorithmic programming tasks and hundreds of framework-selection tasks and found that mainstream languages and frameworks achieve significantly higher AI success rates than niche ones. The authors call this a **Matthew effect**: data-rich ecosystems get better AI support, which makes them even more dominant \cite{gu2025matthew}. Vibe coding may therefore centralize the software ecosystem around the libraries the models already know — good for the incumbent whose API is in the training data, bad for the long tail of alternatives.

The lesson is not "AI bad for open source." It is that **free code is not free infrastructure**. If the next generation of software is assembled from open-source parts, someone has to pay for the parts.
</div>

<div class="md">
## The ArtCraft moment

Now to the specific case. ArtCraft is worth studying because it is not a generic "AI writes code" story. It is a **deliberate attack on a mature software category**, executed with the exact tools this course has been describing.

The timeline is compressed:

| Date | What happened |
|---|---|
| Feb 2025 | Karpathy names "vibe coding" |
| Mar 2025 | Y Combinator says 25% of its current batch has ~95% AI-generated code |
| Mar 2025 | Collins puts "vibe coding" on its Word of the Year list; by November it wins |
| 2025 | Lovable, Replit, Cursor and Claude Code normalize prompt-to-app workflows |
| Jul–Aug 2025 | Figma IPOs, spikes, then begins a long slide as AI costs and competition bite |
| Oct 2025 | Canva makes Affinity free, with paid AI as the upsell |
| Oct 2026 | ArtCraft releases seven Adobe-style apps, then expands to thirteen |

The ArtCraft release itself is a collision of two worlds. The code is **pure Rust**, native on macOS, Windows and Linux, and compiles to WebAssembly for the browser. The apps are dual-licensed MIT/Apache. They claim a clean-room implementation from public specifications and observed behavior, with no proprietary code, shaders or assets. PhotoCraft's README lists 67 tools, 16 adjustment layers, 27 Photoshop blend modes, real PSD read/write, and more than 1,700 tests. It also lists 500+ commands exposed through a CLI, a JSON control channel and an MCP server — "anything you can click, a script or an AI agent can do too" \cite{github2026photocraft}. The apps are not merely clones of a UI; they are **agent-ready replacements** for a workflow. By October 9, GitHub listed 230 distinct contributors beyond Thomas across the seven initial repositories, and PhotoCraft's release credited 31 community contributors \cite{digitaltrends2026artcraft}. The "one developer" story is already outdated: the model lowered the barrier, and the community did part of the last mile.

The claims are enormous. Thomas said the project would reach "100% parity within a month," then amended that "99% parity will take a while, but I'm sure it'll be measured in months and not years" \cite{arstechnica2026softwareover}. He described the current build as "not anywhere close to ready" and "super early alpha" \cite{digitaltrends2026artcraft}. Both things are true in the way that early-stage software is often true: the *direction* is real, the *destination* is not yet.

<div class="smart-quote" data-cite="arstechnica2026softwareover">
Now you can just create 1:1 functional equivalents, clean room, that are highly performant and cross-platform. Nothing is stopping you.
</div>

What is genuinely new here is not that someone cloned Photoshop. Open-source alternatives have existed for decades: GIMP, Krita, Inkscape, Scribus, Blender, DaVinci Resolve. What is new is the **combination**:

* **Interface-level fidelity.** The clone does not ask the user to relearn a workflow. It copies the menus, shortcuts, panels and muscle memory. That attacks the single biggest switching cost in creative software.
* **File-format compatibility.** PhotoCraft opens and re-saves PSD files, and claims faithful round-trips on 307 of 309 test files. The file is the lock-in; a clone that can read the lock is a credible exit.
* **Native performance and local files.** No cloud round-trip, no subscription, no upload. For photographers, studios and privacy-sensitive users, that is a feature, not a detail.
* **Agent-readiness.** Every action is a command. The application is designed to be driven by a CLI, a script or an agent, not only by a human hand. That is a bet on where software is going.
* **A business model.** The apps are free, but ArtCraft sells token-based access to its own AI image and video model. The free suite is a funnel to the paid model, not a charity \cite{arstechnica2026softwareover,digitaltrends2026artcraft}. Canva's free Affinity plus paid AI is the same shape \cite{canva2025affinityfree,canva2025affinityofficial}.

That last point is the one most commentators miss. A free clone is not necessarily a failed business. It can be a **customer-acquisition cost** for something else — AI credits, cloud storage, collaboration, support, or an enterprise license. The open-source app is the giveaway; the model, the service and the trust are the product.

There is a cultural cost to this strategy, and it is the same force that makes the clone possible. Shin et al. studied **design homogenization in web vibe coding** and found that frictionless generation tends to reproduce dominant style conventions, narrowing the diversity of what gets made. Their proposed remedy is **productive friction**: deliberately making the model's defaults visible and contestable \cite{shin2026homogenization}. A clone that copies the dominant interface is the aesthetic version of the same phenomenon. It lowers switching costs by making everything look like the thing it replaces — which is exactly why it is attractive, and exactly why it can make the software landscape less varied.
</div>

<div class="md">
### The legal question is narrower than it looks

"Clean room" is a legal term of art, and the ArtCraft case is a good place to see why the phrase is doing a lot of work. A classic clean-room reimplementation separates the team that studies the original from the team that writes the new code, so that no copyrighted expression crosses the wall. ArtCraft says it worked from public specifications and observed behavior, with no proprietary code or assets \cite{github2026photocraft}. Commenters immediately pointed out that one developer using one model to study the original and then generate the replacement is not the same as two independent teams — the wall is missing \cite{arstechnica2026softwareover}.

The law is more forgiving than the intuition. The EFF's reverse-engineering FAQ explains that reverse engineering for interoperability has repeatedly been found to be fair use, and that functional interfaces are generally not protected by copyright. But the same FAQ lists the ways it can become risky: copying code rather than function, violating an enforceable EULA or NDA, circumventing technical protection measures, or copying creative expression rather than the idea \cite{eff_reverse_engineering}. The project is explicit that it is not affiliated with Adobe, sponsored by it, or endorsed by it, and that Adobe's names are used only to describe compatible workflows \cite{github2026photocraft}. A familiar-looking interface can also raise **trade-dress** questions. Courts have been reluctant to treat a broad "look and feel" as copyrightable — Apple's famous suit against Microsoft over Windows' graphical interface mostly failed for exactly that reason \cite{apple_v_microsoft_wiki} — but a clone that copies distinctive icons, layouts or branding can still be sued.

The practical conclusion is not "ArtCraft is illegal" or "ArtCraft is safe." It is that **the legal risk is a function of what was copied, not how fast it was generated**. The model does not launder provenance. If the clone reproduces protected expression, the fact that a transformer emitted the bytes is irrelevant. If it reproduces only function, the fact that a human typed it is also irrelevant.
</div>

<div class="md">
## Adobe under the microscope

Adobe is the ideal stress test because it is simultaneously a spectacular business and a spectacular target.

The business first. In fiscal 2025 Adobe reported **$23.77 billion** in revenue, **$25.2 billion** in annualized recurring revenue, 11% growth, and more than **$10 billion** in operating cash flow. It ended the year with AI-influenced ARR above **$5 billion** and AI-first ARR above **$250 million** \cite{adobe2025q4,adobe2025aiarr}. This is not a company that forgot to innovate. Firefly is embedded across its tools; the company markets it as "commercially safe" because it was trained on licensed, public-domain and Adobe Stock content, though reporting has questioned how complete that provenance story is \cite{firefly_wiki}. Adobe is also buying its way into adjacent markets, including marketing software, and building agentic features into its platforms \cite{adobe2025q4}.

So why does a free Photoshop clone matter? Because Adobe's revenue is not primarily a technology rent. It is a **workflow rent**. Photoshop is not valuable because no one else can implement a curves adjustment. It is valuable because the PSD file is the lingua franca of a studio, because the plug-in ecosystem is enormous, because the color pipeline is trusted, because the fonts are licensed, because the collaboration and review tools sit next to the canvas, because the enterprise contract includes support and indemnity, and because a generation of professionals has Photoshop in their fingers. The moat is the **system around the pixels**.

That system has soft spots:

* **Subscription fatigue.** Adobe moved Creative Cloud to subscription-only pricing in 2013 \cite{adobe_wiki}. For a generation of freelancers, the monthly bill is a permanent tax on work they may not do every month.
* **Cancellation friction.** In 2024 the FTC and the DOJ sued Adobe over hidden early-termination fees and a deliberately difficult cancellation flow; the case settled in 2026 \cite{adobe_wiki}. Whatever the legal merits, the public story is that leaving Adobe is painful. ArtCraft's founder explicitly cited being "bit by the dark pattern 'cancellation fee' one too many times" as motivation \cite{arstechnica2026softwareover}.
* **The 5% problem.** Most users use a small fraction of the suite. A free clone that covers the 5% they actually need does not have to be as good as Photoshop; it has to be good enough for *their* work.
* **The interface is the switching cost.** A clone that copies the interface removes the retraining cost. That is why PhotoCraft's familiarity is more threatening than its feature list.
* **AI changes the job.** If a model can remove a background, retouch a portrait, or generate a layout, the value of manual editing falls. Adobe can sell the model, but so can its competitors — and a clone can call the same model through an API.
* **Distribution is cheaper.** A native app plus a WebAssembly build plus a GitHub release is a global distribution channel with near-zero marginal cost. The old moat of shrink-wrapped software, retail and installers is gone for everyone.
* **Agents don't need a GUI.** If the next user is an agent calling an MCP server, the value shifts from the canvas to the command registry, the permissions, the audit trail and the data. ArtCraft built for that from day one \cite{anthropic2024mcp,github2026photocraft}.

Against that, Adobe has real defenses: PSD and PDF compatibility, the plug-in ecosystem, color science, font licensing, enterprise procurement, legal indemnity, support, education, brand trust, and the simple fact that a professional deadline is a bad time to debug an alpha. The free clone is credible at the low end; the incumbent is strong at the high end. That is the classic pattern of [disruptive innovation](https://hbr.org/2015/12/what-is-disruptive-innovation): the entrant starts where the incumbent's margin is thin, and improves \cite{christensen2015disruptive}.
</div>

<div class="md">
### The moat table

It helps to separate the kinds of moat, because they decay at different speeds.

| Moat | What it protects | Does a vibe-coded clone attack it? |
|---|---|---|
| **Interface and muscle memory** | The cost of relearning a tool | **Yes, directly.** A familiar clone removes retraining. |
| **File formats** | The cost of leaving the ecosystem | **Partly.** PSD support helps; plug-ins and linked assets remain. |
| **Plug-in and asset ecosystem** | The long tail of professional workflows | **Not yet.** This is the clone's biggest gap. |
| **Color, fonts and output fidelity** | Trust in professional results | **Slowly.** Hard to copy, but not impossible. |
| **Collaboration and cloud** | Team workflow, review, versioning | **Not really.** A local app is a different product. |
| **Enterprise trust and indemnity** | Procurement, legal, security | **No.** This favors the incumbent. |
| **Distribution and brand** | Default choice, education, habit | **Partly.** GitHub and word of mouth reach developers; enterprises still buy brands. |
| **Proprietary data and models** | AI features, personalisation | **Contested.** Models are rented as often as owned. |
| **Price** | Willingness to pay | **Yes.** Free is a powerful feature. |

The table explains why "Adobe is dead" is the wrong conclusion and "nothing will change" is also wrong. The clone attacks the *low-end* moats — interface, price, file access — while the incumbent's *high-end* moats — ecosystem, collaboration, trust, support — remain. What happens next depends on how fast the low end moves up.
</div>

<div id="clone-economics" style="max-width: var(--mn-col-width); margin: 1.5em auto; padding: 20px; border: 1px solid var(--mn-border); border-radius: 12px; background: var(--mn-surface);">
	<h3 style="margin-top:0; color: var(--mn-text);">The clone is free. Is it cheaper?</h3>
	<p style="color:var(--mn-text-secondary); line-height:1.5;">A subscription is a known cost. A clone is an unknown project. Change the assumptions and watch the five-year total cost of ownership move.</p>
	<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:14px; margin: 12px 0;">
		<label style="color:var(--mn-text-secondary);">Seats<br><input type="number" id="ce-seats" value="10" min="1" step="1" style="width:100%; padding:6px; border:1px solid var(--mn-border); border-radius:6px; background:var(--mn-bg-subtle); color:var(--mn-text);"></label>
		<label style="color:var(--mn-text-secondary);">Subscription $/seat/month<br><input type="number" id="ce-price" value="60" min="0" step="5" style="width:100%; padding:6px; border:1px solid var(--mn-border); border-radius:6px; background:var(--mn-bg-subtle); color:var(--mn-text);"></label>
		<label style="color:var(--mn-text-secondary);">Years<br><input type="number" id="ce-years" value="5" min="1" max="15" step="1" style="width:100%; padding:6px; border:1px solid var(--mn-border); border-radius:6px; background:var(--mn-bg-subtle); color:var(--mn-text);"></label>
		<label style="color:var(--mn-text-secondary);">Migration cost $<br><input type="number" id="ce-migrate" value="5000" min="0" step="500" style="width:100%; padding:6px; border:1px solid var(--mn-border); border-radius:6px; background:var(--mn-bg-subtle); color:var(--mn-text);"></label>
		<label style="color:var(--mn-text-secondary);">Maintenance h/month<br><input type="number" id="ce-hours" value="10" min="0" step="1" style="width:100%; padding:6px; border:1px solid var(--mn-border); border-radius:6px; background:var(--mn-bg-subtle); color:var(--mn-text);"></label>
		<label style="color:var(--mn-text-secondary);">Loaded labor $/h<br><input type="number" id="ce-rate" value="50" min="0" step="5" style="width:100%; padding:6px; border:1px solid var(--mn-border); border-radius:6px; background:var(--mn-bg-subtle); color:var(--mn-text);"></label>
		<label style="color:var(--mn-text-secondary);">Risk buffer %<br><input type="number" id="ce-risk" value="20" min="0" max="200" step="5" style="width:100%; padding:6px; border:1px solid var(--mn-border); border-radius:6px; background:var(--mn-bg-subtle); color:var(--mn-text);"></label>
	</div>
	<p id="ce-out" style="font-family:monospace; color:var(--mn-text); line-height:1.7;"></p>
</div>

<script>
(function () {
	function money(x) {
		return "$" + Math.round(x).toLocaleString();
	}
	function compute() {
		var seats = parseFloat(document.getElementById("ce-seats").value) || 0;
		var price = parseFloat(document.getElementById("ce-price").value) || 0;
		var years = parseFloat(document.getElementById("ce-years").value) || 0;
		var migrate = parseFloat(document.getElementById("ce-migrate").value) || 0;
		var hours = parseFloat(document.getElementById("ce-hours").value) || 0;
		var rate = parseFloat(document.getElementById("ce-rate").value) || 0;
		var risk = (parseFloat(document.getElementById("ce-risk").value) || 0) / 100;
		var sub = seats * price * 12 * years;
		var cloneBase = migrate + years * 12 * hours * rate;
		var clone = cloneBase * (1 + risk);
		var diff = clone - sub;
		var verdict;
		if (diff < 0) {
			verdict = "The clone wins by " + money(-diff) + " over " + years + " years — if the maintenance estimate is real.";
		} else {
			verdict = "The subscription is cheaper by " + money(diff) + " over " + years + " years. The clone must buy something the price does not capture.";
		}
		document.getElementById("ce-out").innerHTML =
			"subscription: " + money(sub) + "<br>" +
			"clone (base): " + money(cloneBase) + "<br>" +
			"clone (with risk buffer): " + money(clone) + "<br>" +
			"<strong>" + verdict + "</strong><br>" +
			"<span style=\"color:var(--mn-text-secondary);\">Not priced: support, training, plug-ins, legal review, downtime, and the opportunity cost of the team that maintains it.</span>";
	}
	["ce-seats", "ce-price", "ce-years", "ce-migrate", "ce-hours", "ce-rate", "ce-risk"].forEach(function (id) {
		var el = document.getElementById(id);
		if (el) el.addEventListener("input", compute);
	});
	compute();
})();
</script>

<div class="md">
### Figma is the canary

If you want to see the market's answer before Adobe's, look at Figma. It went public in July 2025, opened at $85, and closed its first day at a market value above **$56 billion** — more than triple its IPO price. By June 2026 the shares had fallen below **$20**, a market value under $10 billion \cite{figma_wiki}. Revenue was still growing 48% year over year, but research and development spending had jumped 101.5%, gross margin had compressed from the low 90s to the mid 80s, and management had cut the price of its AI credits to buy usage \cite{yahoo2026figma}.

The market was not punishing Figma for failing to grow. It was punishing it for the **cost of growing in an AI world**: inference is a cost of revenue, AI features are expensive to build, and the moat that looked like a network effect now has to be defended against every model provider and every agent that can generate a UI. Figma is not Adobe, and its situation is not Adobe's. But the pattern is the same: **the software layer is being repriced**, and investors are asking which parts of the bundle are durable.

<details>
<summary style="cursor:pointer; color:var(--mn-text-secondary);">A note on the numbers</summary>
<p style="color:var(--mn-text-secondary); line-height:1.6;">Financial figures move. The point of this section is the shape of the repricing, not a price target. Adobe's FY2025 results and Figma's 2026 share price are snapshots; the structural argument is that AI shifts cost into inference and shifts value toward trust, workflow and data.</p>
</details>
</div>

<div class="md">
## What this means for software companies

The ArtCraft story is not really about Adobe. It is about a general inversion of the sentence Marc Andreessen used to explain the internet economy: **software is eating the world** \cite{andreessen2011software}. If software can now be generated at a fraction of its former cost, then software is eating *software*. The scarce inputs change.

Here is the shortest version of the shift:

| Old moat | New bottleneck |
|---|---|
| Writing the code | Specifying what to build |
| Shipping a feature | Verifying that it works |
| Owning the UI | Owning the workflow and the data |
| Selling seats | Selling outcomes, usage or trust |
| Support as a cost center | Support as a product |
| Distribution through sales | Distribution through developers and agents |
| Proprietary source code | Proprietary data, integrations and accountability |

### 1. Pricing moves from seats to outcomes

The SaaS model was built on seats: each human who logs in pays. Agents do not log in. They call an API, execute a workflow, and disappear. If the value is delivered per task, per document, per generated asset or per successful outcome, the seat becomes a poor proxy. Adobe already sells generative credits; Figma sells AI credits; Canva bundles AI into premium tiers. The direction is clear even where the destination is not.

This is not a small accounting change. It changes the sales motion, the forecasting, the gross margin, and the relationship with the customer. A seat-based business can grow by adding users; an outcome-based business grows by taking on more of the customer's work. The second is more valuable and more fragile.

### 2. Build-versus-buy becomes a real choice for everyone

Andreessen's essay described software companies invading industries. Vibe coding describes *every company* generating software for itself. A marketing team can build a dashboard; a law firm can build a document workflow; a factory can build an inventory tool. That is a genuine democratisation of capability.

It is also a genuine security and governance problem. The same tools that let a team build an internal tool in an afternoon let it build a shadow IT system with production credentials, personal data and no owner. The bottleneck is no longer "can we build it?" It is "should we build it, who owns it, and how do we know it is safe?" The companies that win will treat **verification, permissions and observability** as products, not afterthoughts.

### 3. The junior pipeline is the hidden risk

The productivity evidence is mixed, but one pattern is consistent: AI helps most when the task is well-specified and the person can evaluate the output. That is exactly the skill that junior developers are supposed to build by doing the work. If the first five years of a career become "review the model's code," where does the judgement to review it come from?

The controlled studies are not reassuring. Novice programmers using Copilot completed tasks faster but showed reduced metacognitive awareness; they accepted suggestions without verifying them and could not explain why the code worked \cite{prather2023copilot}. The "augmentation trap" formalizes the long-run risk: a rational person or firm can choose a tool that improves this quarter's metric while eroding the skill that the next decade depends on \cite{caosun2026augmentation}. The [AI and society](ai_and_society.php) chapter explores the education side of this in more detail.

Real repositories show where the cost lands. Asdaque et al. analyzed **22,953 pull requests from 1,719 vibe coders**. Lower-experience vibe coders submitted 2.15 times more commits and 1.47 times more changed files than higher-experience coders; their PRs received **4.52 times more review comments**, had **31% lower acceptance rates**, and stayed open **5.16 times longer**. The authors' conclusion is precise: novice vibe coders shift the verification burden onto maintainers. A project manager cannot safely replace an experienced developer with a low-experience vibe coder without also expanding review capacity \cite{asdaque2026review}.

The education research points the same way. Thorgeirsson et al. found that both **writing skill** and **computer-science achievement** predict vibe-coding performance in a preregistered study of 100 students \cite{thorgeirsson2026skills}. Rinja et al. analyzed 19,418 student-AI interaction turns and found that top performers used AI for **instrumental help-seeking** — inquiry and exploration — while low performers delegated tasks and asked for ready-made solutions \cite{rinja2026helpseeking}. The software industry's version is simpler: **if no one learns to read code, no one can review the code that writes the code.**

### 4. The open-source bargain needs a new business model

Open source was never free; it was paid for by a mixture of grants, corporate sponsorship, dual licensing, support contracts, and the career benefits of reputation. Vibe coding stresses all of those channels at once. The Koren et al. model is a warning, not a prophecy: if maintainers cannot capture value from the code that models and agents consume, the supply of high-quality open source can shrink even as the *use* of open source explodes \cite{koren2026vibeoss}.

The ArtCraft model — free apps funded by a paid AI service — is one answer. Canva's free Affinity plus paid AI is another. The general shape is **open core plus a metered service**, with the free part doing distribution and trust-building and the paid part paying the bills. Whether that is enough to sustain a commons is an open question.

### 5. Enshittification has a counterforce

Cory Doctorow's term **enshittification** describes the lifecycle of a platform: it is good to users to attract them, then good to business customers to monetize them, then bad to both to extract the last margin \cite{enshittification_wiki}. Subscription fatigue and cancellation fees are the creative-software version: the product is mature, the alternatives are weak, and the customer is locked in.

Vibe coding weakens the lock. If a credible alternative can be produced in weeks, the cost of mistreating users falls. That is a genuine counterforce to enshittification. But it also creates a new risk: the alternative may be a low-quality clone with no support, no security and no long-term maintenance. **Exit is not the same as a good exit.** The healthy outcome is not "every app is free"; it is "every app has to justify its price."
</div>

<div class="md">
## How to vibe code without lighting money on fire

The useful question is not "should I use AI to write software?" It is "which mode am I in, and have I paid for the mode I am actually in?" Here is a practical checklist, derived from the evidence above.

1. **Name the mode.** Prototype, internal tool, customer product, or critical system. Vibe coding is appropriate for the first; it is malpractice for the last without additional process.
2. **Read the diff for anything you will keep.** Karpathy's "accept all" is a prototyping technique, not a maintenance strategy.
3. **Write the test before you accept the code.** A test is how you turn "it looks right" into "it does the thing." If you cannot write the test, you do not yet know what the thing is.
4. **Pin your dependencies.** Use lockfiles, a software bill of materials, and a private registry or allowlist. Check that every package exists and is the one you meant — the slopsquatting attack depends on you not checking.
5. **Never give an agent production credentials it does not need.** Sandbox it, scope the token, require approval for destructive actions, and keep backups you have actually restored.
6. **Threat-model the default.** Authentication, authorization, input validation, secrets, rate limits, logging. The model will happily generate a login form that stores passwords in plain text.
7. **Budget the maintenance.** The first version is the cheap part. Estimate the hours per month, the person who owns it, and the cost of the incident you have not had yet.
8. **Check the license and the provenance.** Generated code can reproduce licensed material; a clean-room claim is not a legal opinion. If the output is customer-facing, get a lawyer's view on the parts that matter.
9. **Keep a human accountable.** "The model wrote it" is not a defense in a post-mortem, a procurement review or a courtroom. The organization that ships the code owns the code.
10. **Use the disciplined version when the stakes rise.** Willison's **vibe engineering** is the right mental model: use the model for speed, but keep specifications, tests, review, version control and observability \cite{willison2025vibeengineering}. The difference between a vibe coder and a vibe engineer is not the tool. It is the ownership.

The research is now beginning to produce the guardrails that rule 10 implies. **ZORO** turns rules files such as `AGENTS.md` and `CLAUDE.md` from passive text into active controls, requiring the agent to prove that each rule was followed at each step \cite{ma2026zoro}. **VibeContract** decomposes high-level intent into task-level contracts that capture inputs, outputs, constraints and behavioral properties \cite{wang2026vibecontract}. **Shift-Up** reinterprets executable requirements, architecture models and architecture decision records as structural guardrails for agentic development \cite{lipsanen2026shiftup}. And a 737-participant experiment by Hu et al. found that human-led instructions produced better outcomes than AI-led instructions, with hybrid groups performing best \cite{hu2026humanguidance}. The pattern is consistent: the more the human supplies intent, constraints and evaluation, the better the agent performs. An experience report from a team using vibe coding in practice makes the same point from the other direction: **context before code** \cite{shuvo2026context}.

The one-sentence version: **generate at the speed of a demo, verify at the speed of production.**
</div>

<div class="md">
## The verdict

The ArtCraft moment is not the death of Adobe. Adobe had a record FY2025, a $25 billion ARR business, and a deep bench of trust, ecosystem and enterprise relationships. A thirteen-app alpha suite is not going to replace Creative Cloud in a studio with a deadline tomorrow.

But the ArtCraft moment is a **warning shot**, and the warning is not "a clone exists." Clones have always existed. The warning is that the cost of a *credible* alternative — one with a familiar interface, real file compatibility, native performance and an agent-ready command surface — has fallen from "a team, a year, a legal budget" to "a small team, a model, and a few weeks." That is a phase change in the economics of software, and it applies far beyond Adobe: to Figma, to Microsoft Office, to Autodesk, to every SaaS product whose moat is a mature interface plus a file format plus a subscription.

The likely outcome is not universal free software. It is **unbundling and price compression**. The low end of the market — students, hobbyists, freelancers, emerging markets, internal tools — moves to free or cheap clones. The high end — enterprises, regulated industries, teams with complex workflows — pays for trust, support, collaboration, indemnity and integration. The incumbent's job is to make the high end worth the premium. The entrant's job is to survive the last 20%.

And the deeper lesson is about where value goes. When code is cheap, the scarce things are **taste, verification, distribution, data, trust and accountability**. The companies that understand that will use vibe coding to build faster and sell something more durable than code. The companies that mistake a demo for a product will discover that the model can generate the first 80% of anything — including the first 80% of their replacement.

The old line was that software is eating the world. The new line is that software is eating software. The meal is not free, and the bill arrives at the last 20%.
</div>

<div class="mn-quiz" data-quiz="vibe_coding"><script type="application/json">{"title": "Vibe coding and the software moat", "questions": [{"q": "What is the defining feature of vibe coding, as Karpathy described it?", "options": ["Generating code from natural-language prompts and accepting it without fully reading or understanding it", "Using a linter and a type checker", "Writing code only in Rust", "Pair-programming with another human"], "answer": 0, "explain": "Karpathy's original post explicitly says he accepts all and does not read the diffs. That is fine for throwaway projects and risky for production."}, {"q": "ArtCraft's FilmCraft reported 87% feature-checklist coverage but only 50-60% readiness. What does that show?", "options": ["A feature checklist measures wiring and surface area, not whether the product is reliable for real work", "The developers cannot count", "The app is 87% faster than Premiere", "Feature coverage is the only metric that matters"], "answer": 0, "explain": "The last 20% is integration, fidelity, edge cases, performance, support and trust. That is where most of the engineering effort and the moat live."}, {"q": "What did Veracode's 2025 report find about AI-generated code?", "options": ["About 45% of samples introduced an OWASP Top 10 vulnerability, and larger models were not reliably more secure", "AI-generated code was always secure", "Only open-source models were insecure", "Security improved as fast as functionality"], "answer": 0, "explain": "Functional capability improved much faster than secure coding. The default is insecure unless review, testing and security gates catch it."}, {"q": "Why is Adobe vulnerable to a free Photoshop clone despite record revenue?", "options": ["Much of its moat is workflow, interface and subscription pricing, and a familiar clone attacks the switching cost", "Adobe has no customers", "Photoshop is not profitable", "Adobe does not own any file formats"], "answer": 0, "explain": "The moat is the system around the pixels: muscle memory, PSD, plug-ins, color, collaboration and trust. A clone attacks the low-end parts of that system first."}, {"q": "What is the most likely broad effect of cheap, credible software clones?", "options": ["Unbundling and price compression: free clones at the low end, paid trust and integration at the high end", "All software becomes free overnight", "Every incumbent goes bankrupt immediately", "Software engineering disappears"], "answer": 0, "explain": "The cost of a credible alternative falls, which caps pricing and shifts value toward verification, workflow, data, support and accountability. Incumbents can survive by justifying the premium."}]}</script></div>
