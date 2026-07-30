<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: AI Law & Regulation
description: EU AI Act, GDPR, copyright, liability, sectoral rules — the legal landscape shaping deployment.
icon: &#9878;
part: 6
order: 43
color: text-secondary
-->

<div class="md">
The legal status of AI is now in flux worldwide. The EU AI Act (in force August 2024, with provisions phased through 2027), Chinese algorithmic regulation, US executive orders and the new patchwork of state laws, copyright lawsuits against model trainers, and sectoral rules for healthcare, finance, and defense. A working AI practitioner must understand this landscape.

This chapter provides a practitioner's map: not legal advice, but enough to ask the right questions.
</div>

<div class="md">
## The EU AI Act (2024)

The world's first comprehensive AI regulation. A **risk-based pyramid**:

### Unacceptable Risk (Banned)

* **Social scoring** by governments (cf. China's social credit)
* **Subliminal manipulation** causing harm
* **Exploiting vulnerabilities** of children, disabled persons
* **Real-time remote biometric identification** in public spaces (with narrow exceptions for serious crime)
* **Emotion recognition** in workplaces and schools

### High Risk

Includes AI used in:

* **Critical infrastructure** (transport, water, energy)
* **Education** (admissions, scoring, evaluation)
* **Employment** (recruitment, promotion, performance monitoring)
* **Essential services** (credit scoring, insurance, emergency services)
* **Law enforcement** (predictive policing, evidence evaluation)
* **Migration and border control**
* **Justice and democratic processes**

High-risk systems require: **risk assessment, data quality, documentation, human oversight, accuracy/robustness, transparency, registration in EU database**. Penalties: up to **€15M or 3% of global turnover**.

### Limited Risk (Transparency Obligations)

* **Chatbots / conversational AI**: must disclose that users are talking to an AI.
* **Deepfakes**: must be labeled as artificially generated.
* **Synthetic media**: AI-generated content must be machine-readable as such (watermarking).
* **Emotion recognition systems** (outside the banned contexts): must inform users.

### General Purpose AI (GPAI)

A new category added in late negotiations. Covers foundation models. Obligations:

* **Transparency**: technical documentation, training data summaries.
* **Copyright compliance**: policy to comply with EU copyright law, opt-out mechanism for rights-holders (text-and-data-mining rights).
* **Systemic risk**: GPAI models trained with >10^25 FLOPs (essentially GPT-4-class and above) face additional obligations — risk evaluation, incident reporting, model evaluation, adversarial testing.

The EU AI Act's phased timeline: Feb 2025 (banned practices), Aug 2025 (GPAI rules, governance), Aug 2026 (most high-risk), Aug 2027 (embedded high-risk systems).
</div>

<div class="md">
## GDPR and Data Protection

The EU's General Data Protection Regulation (2018) applies to any processing of EU residents' personal data, regardless of where the processor is located.

Key intersections with LLMs:

* **Lawful basis**: most LLM training relies on **legitimate interest** or **consent**. The EU's TDM opt-out (Article 4(3)) lets rights-holders forbid text-and-data-mining of their works; the AI Act makes compliance explicit.
* **Right to be forgotten**: training a model on personal data is processing. Can the data subject compel deletion? Unclear in practice — models don't store verbatim data, but memorization is real.
* **Automated decision-making (Article 22)**: individuals have the right not to be subject to decisions based solely on automated processing that significantly affect them. LLM-based hiring, credit, etc. must include human-in-the-loop.
* **Data Protection Impact Assessments (DPIA)**: required for high-risk processing.
* **Cross-border transfers**: US/EU data flows are now governed by the **EU-US Data Privacy Framework** (2023); adequacy decision in place but subject to legal challenge.

### Italian Garante vs OpenAI (2023)

Italy's data protection authority briefly **banned ChatGPT** in March 2023 over lack of legal basis for training data, lack of age verification, and absence of a data-subject rights mechanism. OpenAI restored service after adding age gates, opt-out forms, and a transparency notice.

### Spanish AEPD vs Worldcoin (2024)

Spain banned the Worldcoin iris-scanning project. Sets precedent for biometric AI requiring explicit consent.
</div>

<div class="md">
## Copyright and Training Data

The defining legal question of 2023–2025: **is training an LLM on copyrighted text an infringement?**

### The US Position

* **Authors Guild v. Google** (2016): scanning books to enable search is **fair use**. Influential but predates LLMs.
* **New York Times v. OpenAI** (filed Dec 2023): NYT alleges OpenAI's models reproduce near-verbatim copyrighted journalism, arguing training is not fair use. **Active litigation.**
* **Getty Images v. Stability AI** (filed Jan 2023): alleges Stable Diffusion was trained on millions of copyrighted photographs without license; model occasionally reproduces Getty watermarks.
* **Kadrey v. Meta** (2023): authors allege Meta's Llama trained on pirated books (from LibGen, etc.). Court in 2024 expressed skepticism toward the authors' damages theory but did not dismiss.
* **Bartz v. Anthropic** (2024): settled in 2025 for ~$1.5B after court found Anthropic's purchase and use of pirated books for training was **not fair use** but its use of lawfully acquired books likely was.

### The EU Position

* **TDM opt-out**: rights-holders can opt out of text-and-data-mining. The AI Act makes this opt-out explicit for GPAI.
* **France / Germany / Italy** issued statements in 2024 that training on web-scraped text is acceptable if TDM opt-outs are respected; commercial outputs that substitute for the source require licence.

### The Practical Reality

By 2025, most major AI companies have signed **licensing deals** with major publishers:

* **OpenAI** with News Corp, Axel Springer, Financial Times, Vox Media, The Atlantic.
* **Anthropic, Google, Microsoft** with various publishers.
* **Apple** with Condé Nast, NBC News, IAC.

The "free web scrape" era is ending. The future is **structured licensing**, with revenue-share and per-query royalties.
</div>

<div class="md">
## US Law: A Patchwork

There is **no federal AI law** in the US (as of mid-2025). Instead:

* **Executive Orders**: Biden's 2023 EO on Safe AI (revoked by Trump in Jan 2025); Trump's subsequent orders prioritize AI dominance.
* **NIST AI Risk Management Framework**: voluntary guidance.
* **State laws**: California (SB 1047 vetoed, AB 2013 training-data transparency), Colorado AI Act, New York, Illinois BIPA.
* **Sectoral regulators**: FDA (medical AI), SEC (finance), FTC (consumer protection), EEOC (employment), NHTSA (autonomous vehicles), DOT/FAA (aviation).

The FTC has brought actions against AI companies for deceptive practices (Workado AI Content Detector, RiteLyfe Blood Sugar). The trend: **enforcement-led regulation** when legislation lags.

### California SB 1047 Veto (Sept 2024)

The "Safe and Secure Innovation for Frontier Artificial Intelligence Models Act" would have required safety testing for models trained with >10^26 FLOPs. Governor Newsom vetoed it, citing concerns it would burden open-source development. The \cite[Du et al., 2023]{du2023multiagent} continues.
</div>

<div class="md">
## Chinese AI Regulation

Distinct philosophy: **state-led, fast-moving, sectoral**.

* **Algorithm Recommendation Provisions** (2022): recommendation algorithms must allow opt-out, not spread misinformation.
* **Deep Synthesis Provisions** (2023): deepfakes must be labeled.
* **Generative AI Services Measures** (Aug 2023): training data must be lawful, content must align with socialist values, security assessments required before public release.
* **Interim Measures for Generative AI Services** (July 2023): service providers responsible for content, must suspend generation if illegal output discovered.

Every public-facing generative AI service in China requires a **security assessment** and an **algorithm filing** with the Cyberspace Administration of China (CAC). This is the de facto gatekeeper.
</div>

<div class="md">
## Liability: Who Pays When AI Fails?

A 2024 EU directive on **AI liability** (revised Product Liability Directive) establishes:

* **Disclosure obligation**: courts can order AI providers to disclose training data and model details when harm is alleged.
* **Rebuttable presumption of causation**: if the plaintiff shows the AI system was likely at fault and the provider failed to disclose, causation is presumed.

Other liability questions:

* **Medical AI**: FDA-approved systems carry product liability; "clinical decision support" tools face less regulation.
* **Autonomous vehicles**: most jurisdictions hold the manufacturer liable when the car is at fault (level 4+).
* **Defamation by LLM**: emerging case law; New York Times v. OpenAI includes claims of defamation-style output.
* **Workplace AI**: EEOC guidance treats AI hiring tools as subject to civil rights law.

The legal framework is **fragmented and evolving**. Practitioners building AI products in 2025 should:

1. **Maintain a model card and system card** documenting intended use, training data, limitations, and evaluation results.
2. **Build logging and observability** to reconstruct any incident.
3. **Implement human-in-the-loop** for high-stakes decisions.
4. **Document training data sources** to respond to disclosure requests.
5. **Maintain content moderation** for user-facing deployments.
6. **Consult legal counsel** before launching in regulated sectors or jurisdictions.
</div>

<div class="md">
## Sectoral Rules

### Healthcare

* **FDA** (US) regulates AI/ML-enabled medical devices. Predetermined Change Control Plans (PCCP) allow iterative model updates.
* **EU MDR** (Medical Device Regulation) covers AI-based medical software.
* **HIPAA** (US): training LLMs on protected health information requires Business Associate Agreements; deployment of LLMs in clinical settings requires careful compliance.

### Finance

* **SR 11-7** (Fed, US): model risk management guidance applies to AI.
* **EU AI Act**: credit scoring is high-risk.
* **SEC** (US): AI used in investment advice must be disclosed; robo-advisors face fiduciary obligations.

### Employment

* **NYC Local Law 144** (2023): requires annual bias audits for AI hiring tools.
* **Illinois AI Video Interview Act**: consent required for AI-analyzed video interviews.
* **EEOC**: AI hiring tools must comply with Title VII (anti-discrimination).

### Education

* **EU AI Act**: AI in education is high-risk.
* Many US school districts have banned or restricted ChatGPT; state-level policies emerging.

### Defense

* **ITAR** (US): AI trained on classified data may be export-controlled.
* **DoD AI Ethical Principles** (2020): responsible, equitable, traceable, reliable, governable.

### Children

* **COPPA** (US): under-13 data requires parental consent.
* **EU AI Act**: emotion recognition in schools banned.
* **Age-appropriate design code** (UK): special protections for minors.
</div>

<div class="md">
## International Coordination

Efforts to harmonize:

* **G7 Hiroshima AI Process** (2023): voluntary code of conduct for advanced AI.
* **OECD AI Principles** (2019, updated 2024): human-centered values, transparency, robustness, accountability.
* **UNESCO Recommendation on AI Ethics** (2021): global framework, 193 countries adopted.
* **UN AI Advisory Body** (2024): report calling for international governance.
* **AI Safety Summit** (UK, May 2024): Bletchley Declaration on frontier AI safety.
* **AI Action Summit** (Paris, Feb 2025): successor.

None have direct regulatory force; all signal international consensus on principles.
</div>

<div class="md">
## Practical Compliance Checklist

For a team deploying an LLM-based product in 2025:

**Training phase:**

* [ ] Document training data sources
* [ ] Verify copyright compliance (license or TDM opt-out respected)
* [ ] Filter personal data unless you have lawful basis
* [ ] Maintain a model card
* [ ] Conduct bias and safety evaluations

**Deployment phase:**

* [ ] Disclose AI nature to users
* [ ] Implement content moderation
* [ ] Human-in-the-loop for high-stakes decisions
* [ ] Logging and incident response capability
* [ ] Age verification where required (EU AI Act, COPPA)
* [ ] EU representative appointed (if serving EU users)
* [ ] DPIA filed (if applicable)

**Operations:**

* [ ] Monitor for drift, bias, jailbreaks
* [ ] Periodic red-teaming and evaluation
* [ ] Incident reporting procedures
* [ ] Vendor management (sub-processors)

The legal landscape is the most rapidly changing part of the AI stack. Practitioners who treat legal review as a **first-class engineering concern** — not an afterthought — will be the ones who ship.
</div>

<script>
async function loadLawRegulationModule() {
	updateLoadingStatus("Loading section about AI Law & Regulation...");
	return Promise.resolve();
}
</script>
