<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: AI Law & Regulation
description: EU AI Act, GDPR, copyright, liability, sectoral rules — the legal landscape shaping deployment.
icon: &#9878;
part: 6
order: 10
color: text-secondary
topics: society, ethics, law
tags: interested-layman
-->

<div class="md">
The legal status of AI is now in flux worldwide. The EU AI Act (in force August 2024, with obligations phased through 2028), Chinese algorithmic regulation, US executive orders and the new patchwork of state laws, copyright lawsuits against model trainers, and sectoral rules for healthcare, finance, and defense. A working AI practitioner must understand this landscape.

\marginfig{justitia_statue.jpg}{Justitia — blindfolded, scales in one hand, sword in the other. The legal layer growing up around AI is an attempt to keep these scales reading true when the party being weighed is, in part, a machine. [Photo: statue in the Schwetzinger Schlossgarten, CC BY-SA 4.0, Rigorius](https://commons.wikimedia.org/wiki/File:Schwetzingen_Garten_Hauptachse_Statue-Justitia_20240402_152904.jpg)}

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
* **Systemic risk**: GPAI models trained with >10^25 FLOPs (essentially GPT-4-class and above) face additional obligations, risk evaluation, incident reporting, model evaluation, adversarial testing.

The operative timeline, as tracked in 2026, runs in five steps. Prohibitions and AI literacy apply from 2 February 2025, except the new bans on non-consensual intimate imagery and child sexual abuse material, which start on 2 December 2026. GPAI duties, governance, and most penalties apply from 2 August 2025; the remainder, including transparency, from 2 August 2026; Annex III high-risk duties from 2 December 2027; and Annex I product-safety high-risk systems from 2 August 2028.
</div>

<div class="md">
## GDPR and Data Protection

The EU's General Data Protection Regulation (2018) applies to any processing of EU residents' personal data, regardless of where the processor is located.

Key intersections with LLMs:

* **Lawful basis**: most LLM training relies on **legitimate interest** or **consent**. Separately, the copyright DSM Directive's Article 4(3) TDM opt-out lets rights-holders reserve their works against mining; the AI Act requires GPAI providers to respect it.
* **Right to be forgotten**: training a model on personal data is processing. Can the data subject compel deletion? Unclear in practice, models don't store verbatim data, but memorization is real.
* **Automated decision-making (Article 22)**: individuals have the right not to be subject to decisions based solely on automated processing that significantly affect them. LLM-based hiring, credit, etc. must include human-in-the-loop.
* **Data Protection Impact Assessments (DPIA)**: required for high-risk processing.
* **Cross-border transfers**: US/EU data flows are now governed by the **EU-US Data Privacy Framework** (2023); adequacy decision in place but subject to legal challenge.

### Italian Garante vs OpenAI (2023)

Italy's data protection authority briefly **banned ChatGPT** in March 2023 over lack of legal basis for training data, lack of age verification, and absence of a data-subject rights mechanism. OpenAI restored service after adding age gates, opt-out forms, and a transparency notice.

### Spanish AEPD vs Worldcoin (2024)

Spain's data-protection authority ordered Worldcoin to suspend iris scanning in March 2024 for up to three months over consent and data-protection concerns—a precedent for treating biometric AI as high-risk processing.
</div>

<div class="md">
## Copyright and Training Data

The defining legal question of 2023–2025: **is training an LLM on copyrighted text an infringement?**

### The US Position

* **Authors Guild v. Google** (2015): scanning books to enable search is **fair use**; the Supreme Court declined to review in 2016. Influential but predates LLMs.
* **New York Times v. OpenAI** (filed Dec 2023): NYT alleges OpenAI's models reproduce near-verbatim copyrighted journalism, arguing training is not fair use. **Active litigation.**
* **Getty Images v. Stability AI** (filed Jan 2023): alleges Stable Diffusion was trained on millions of copyrighted photographs without license; model occasionally reproduces Getty watermarks.
* **Kadrey v. Meta** (2023): authors alleged Meta trained Llama on pirated books. In June 2025 the court granted Meta summary judgment on fair use, holding training on the books transformative while cautioning that the ruling did not bless every use.
* **Bartz v. Anthropic** (2024): settled in 2025 for ~$1.5B after the court found training on pirated books downloaded from LibGen was **not fair use**, while training on lawfully purchased and scanned books was.

### The EU Position

* **TDM opt-out**: rights-holders can opt out of text-and-data-mining. The AI Act makes this opt-out explicit for GPAI.
* **TDM opt-out in practice**: the DSM Directive permits commercial text-and-data-mining unless rights-holders reserve their rights; the AI Act turns that reservation into a compliance duty for GPAI providers, and national courts are still testing what counts as a valid opt-out (\cite[EU, 2019]{eu2019dsm}; \cite[EU, 2024]{euaiact2024}).

### The Practical Reality

By 2025, most major AI companies have signed **licensing deals** with major publishers:

* **OpenAI** with News Corp, Axel Springer, Financial Times, Vox Media, The Atlantic.
* **Anthropic, Google, Microsoft** with various publishers.
* **Apple** with Condé Nast, NBC News, IAC.

The “free web scrape” era is ending. The future is **structured licensing**, with revenue-share and per-query royalties.
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

The “Safe and Secure Innovation for Frontier Artificial Intelligence Models Act” would have required safety testing for models trained with >10^26 FLOPs. Governor Newsom vetoed it, citing concerns it would burden open-source development. The debate over frontier-model regulation continues.
</div>

<div class="md">
## Chinese AI Regulation

Distinct philosophy: **state-led, fast-moving, sectoral**.

* **Algorithm Recommendation Provisions** (2022): recommendation algorithms must allow opt-out, not spread misinformation.
* **Deep Synthesis Provisions** (2023): deepfakes must be labeled.
* **Interim Measures for Generative AI Services** (issued July 2023, effective August 2023): training data must be lawful, output must reflect socialist core values, providers are responsible for content, and they must suspend generation when illegal output appears.

Generative AI services with public-opinion or social-mobilisation capacity need a **security assessment** and must file their algorithm with the Cyberspace Administration of China (CAC); this filing is the de facto gatekeeper.
</div>

<div class="md">
The GDPR is enforced by national authorities coordinated through the European Data Protection Board. For AI, a key interpretive question is whether training can rest on **legitimate interest**. In December 2024 the EDPB's Opinion 28/2024 set out the three-step test—a lawful, clearly articulated, real interest; necessity and data minimisation; and a balancing test that weighs reasonable expectations—and warned that models trained on personal data cannot be assumed anonymous (\cite[EDPB, 2024]{edpb2024ai}). Enforcement remains national: Ireland's DPC, France's CNIL, and Italy's Garante have each shaped practice.

The PLD's key innovations are substantive. It treats software—including AI systems—as a product, covers defects that appear after deployment, and gives courts a disclosure power over a manufacturer's technical evidence (\cite[EU, 2024]{pld2024}). Member states must transpose it by 9 December 2026; the separate AI Liability Directive was withdrawn in 2025, leaving the PLD as the main horizontal EU liability instrument.

China's regime is layered rather than a single AI act. The 2023 Interim Measures govern generative services; the 2025 **Measures for the Labelling of AI-Generated Synthetic Content**, effective 1 September 2025, require both explicit labels visible to users and implicit labels embedded in metadata for text, images, audio, and video (\cite[CAC, 2025]{china2025labelling}). The labelling rules sit on top of the existing algorithm-filing and security-assessment regime, so compliance is a stack of registrations rather than a one-off approval.

State legislatures have become the real US laboratories. Colorado's AI Act (SB 24-205, effective 30 June 2026) imposes reasonable-care, impact-assessment, and consumer-notice duties on developers and deployers of high-risk systems (\cite[Colorado AI Act, 2024]{colorado2024ai}). California's SB 53 (2025) requires frontier developers to publish safety frameworks and report critical incidents, while AB 2013 (2024) mandates training-data disclosure from 2026 (\cite[California, 2025]{sb53cal2025}). Texas and Illinois have added their own rules, and New York City's Local Law 144 already requires bias audits of hiring tools.

International coordination remains mostly soft law, with one binding exception. The OECD AI Principles (2019, revised 2024) are the common reference point for the G7 Hiroshima process and for the AI Act's definition of trustworthy AI (\cite[OECD, 2019]{oecd2019ai}). UNESCO's 2021 Recommendation, adopted by 193 states, is the broadest normative text (\cite[UNESCO, 2021]{unesco2021ai}). The Council of Europe's Framework Convention on AI, opened for signature in Vilnius in September 2024, is the first binding treaty in the field, though its obligations are framework-style and depend on ratification (\cite[Council of Europe, 2024]{coe2024ai}).

## Liability: Who Pays When AI Fails?

The revised EU **Product Liability Directive** (2024/2853) brings software and AI systems into product liability. It establishes:

* **Disclosure obligation**: courts can order manufacturers to disclose technical evidence and relevant data when a defect is alleged.
* **Rebuttable presumptions**: non-compliance with a disclosure order can establish defectiveness, and once a defect is shown, causation can be presumed when the damage fits the defect.

Other liability questions:

* **Medical AI**: FDA-approved systems carry product liability; “clinical decision support” tools face less regulation.
* **Autonomous vehicles**: most jurisdictions hold the manufacturer liable when the car is at fault (level 4+).
* **Defamation by LLM**: *Walters v. OpenAI* (2023) tested whether a chatbot's false statements are defamatory; New York Times v. OpenAI is a copyright and DMCA case, not a defamation one.
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
* **AI Safety Summit** (UK, November 2023): the Bletchley Declaration on frontier AI safety, followed by the Seoul Summit in May 2024.
* **AI Action Summit** (Paris, Feb 2025): successor.

None have direct regulatory force; all signal international consensus on principles.
</div>

<div class="mn-quiz" data-quiz="law_regulation"><script type="application/json">{"title": "AI law and regulation", "questions": [{"q": "How does the EU AI Act regulate AI?", "options": ["With a risk-based pyramid: banned uses, strict high-risk duties, lighter rules", "By banning every AI system until regulators certify it as completely and fully safe", "By regulating only chatbots and similar conversational assistants", "By applying only to companies headquartered outside the European Union"], "answer": 0, "explain": "The obligations grow with the risk of the use case."}, {"q": "Which use is in the EU AI Act's banned (unacceptable-risk) tier?", "options": ["Social scoring by governments", "Spam filtering of personal email", "Procedural generation in games", "Machine translation of text"], "answer": 0, "explain": "Other banned uses include harmful subliminal manipulation and emotion recognition at work and in schools."}, {"q": "Why is GDPR relevant to training AI?", "options": ["Training data often holds personal data, needing a legal basis and rights safeguards", "It fixes minimum prices for the high-end GPUs used to train large models", "It defines what counts as an AI system and sets strict mandatory safety standards for it", "It only governs cookies and basic tracking on public marketing websites"], "answer": 0, "explain": "Rights such as access and erasure are hard to honour once data is baked into weights."}, {"q": "What is the central copyright question for generative AI?", "options": ["Whether training on copyrighted works without permission is lawful", "Whether an AI system can own the trademark on its outputs", "Whether software source code can be protected by patent", "Whether every trained model has to be released under an open-source licence"], "answer": 0, "explain": "Courts and lawmakers are still settling this, differently in different jurisdictions."}]}</script></div>
