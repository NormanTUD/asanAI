<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: AI and Society: The Cultural Impact of Machines That Create
description: A survey of how AI has reshaped art, science, labor, cognition, and truth — from the Dartmouth Conference to the flood of synthetic media. The good, the bad, the terrible, and the great.
icon: &#9883;
part: 6
order: 12
color: sky
topics: society, culture, ethics, history
tags: interested-layman
-->

<div class="md" data-lesson-id="ai_and_society">
## The Question

In 1956, four mathematicians — John McCarthy, Marvin Minsky, Nathaniel Rochester, and Claude Shannon — proposed a two-month summer workshop at Dartmouth College. Their conjecture was deceptively simple: *"every aspect of learning or any other feature of intelligence can in principle be so precisely described that a machine can be made to simulate it"* \cite[McCarthy et al., 1955]{mccarthy1956dartmouth}. They named the field "Artificial Intelligence." They were, by most accounts, both right and catastrophically wrong: right that the question was the right one to ask, wrong about how long the answer would take, and wrong about what the answer would do to the people asking it.

This lesson traces the cultural impact of that question as it has unfolded over seven decades. Not the technical history — other lessons in this course cover the mathematics and the architecture. This is the story of what happens when a technology becomes *cultural*: when it stops being a research program and starts being a mirror, a weapon, a tool, a threat, a companion, and a question about what it means to be human.

The story has no single arc. It is not "progress" or "decline." It is a braided, contradictory, still-unfolding story in which the same technology that predicts the structure of every protein in the human body also generates a photorealistic video of a sitting president saying things they never said. The same tool that lets a blind person read a menu independently also lets a criminal clone a CEO's voice and drain a bank account. The same model that discovers a new class of stable materials also learns to write a convincing fake news article.

This is the story of all of that.
</div>

<div class="md">
## The Arc of Public Perception: Winters and Springs

The public relationship with AI has never been stable. It oscillates.

After Dartmouth, the 1960s were a period of genuine optimism — the field was new, well-funded, and full of promise. Then came the first **AI Winter** (1974–1980). The trigger was the **Lighthill Report** (1973), in which Sir James Lighthill, appointed by the UK Parliament to review the state of British AI, concluded that the field had failed to meet its "grandiose objectives" and that its algorithms were only suitable for "toy" problems \cite[AI Winter, 2026]{ai_winter_wiki}. In the UK, funding was cut almost to zero. In the US, DARPA's Speech Understanding Research program at Carnegie Mellon was cancelled after the system it produced could only recognize words spoken in a particular order.

The second winter (1987–2000) was triggered by the collapse of the **LISP machine market** — a 500-million-dollar hardware industry that disappeared in a single year when general-purpose workstations caught up — and the failure of Japan's **Fifth Generation Computer Project** (¥100 billion, 1982–1992), which had promised machines that could "carry on conversations, translate languages, interpret pictures, and reason like human beings" by 1992 \cite[AI Winter, 2026]{ai_winter_wiki}. By the mid-1990s, some computer scientists avoided the term "artificial intelligence" in grant proposals for fear of being viewed as "wild-eyed dreamers."

Then: **1997**. IBM's **Deep Blue** defeated world chess champion Garry Kasparov in a six-game match (3½–2½), becoming the first computer to win a full match against a reigning world champion under standard tournament conditions \cite[Deep Blue, 2026]{deepblue_wiki}. The cultural moment was enormous: for the first time, a machine had beaten a human at the game that was the canonical test of "intelligence" in the public imagination. Kasparov, who had alleged cheating (a bug in the engine's code caused a bizarre loop at move 44 of Game 2, which he misread as superior play), later called the machine "as intelligent as your alarm clock" — but the public had already seen something shift.

The next perception-shift came in **March 2016**, when DeepMind's **AlphaGo** defeated the South Korean Go master Lee Sedol 4–1 in Seoul. Go had been considered far harder for computers than chess — the branching factor is roughly $2^{170}$ versus $10^{47}$ for chess. The moment that broke through the public consciousness was **Move 37 in Game 2**: a stone placed in a position that AlphaGo's own policy network assigned less than 5% probability to, yet which turned out to be strategically brilliant. It looked like *creativity*. Lee Sedol, after losing, said he was "speechless." The match was watched by tens of millions worldwide. In China, it was described as a "Sputnik moment" that accelerated government AI investment \cite[Silver et al., 2016]{silver2016alphago}.

But it was **November 30, 2022** — the release of **ChatGPT** — that broke the dam. The system reached 100 million monthly active users in approximately two months, making it the fastest-growing consumer application in history at the time \cite[OpenAI, 2022]{openai2022chatgpt}. The cultural response was immediate and total: *Science* banned chatbot-generated text in its journals; *Nature* required full disclosure; Italy's data-protection authority briefly **banned ChatGPT** entirely; 20,000 researchers signed a letter calling for a pause in "giant AI experiments"; musician Nick Cave publicly rejected a ChatGPT song written in his style, calling it "bullshit." The "AI winter" was over. The "AI spring" — or, depending on your vantage point, the "AI storm" — had begun.

\marginfig{deep_blue_kasparov.jpg}{IBM's Deep Blue, built to play chess, defeated Garry Kasparov in 1997 — the first machine to win a full match against a reigning world champion. The cultural impact was enormous: the "can machines think?" question moved from philosophy seminars to dinner tables. [Photo: IBM/CC BY 2.0]}
</div>

<div class="md">
## The Lie: Deception at Scale

The most immediate and visceral cultural impact of generative AI has been its capacity to **lie convincingly**. Not to lie in the way a person lies — with intent, with a face, with a voice you can look at — but to lie in the way a *photocopy* lies: a perfect surface reproduction of the truth that contains no truth.

### Voice Cloning and Wire Fraud

The technical capability arrived before the public was ready. In **March 2020**, a MIT researcher demonstrated **15.ai**, a web application capable of generating high-quality speech from just **15 seconds** of training audio — compared to the tens of hours previously required \cite[Audio deepfake, 2026]{audio_deepfake_wiki}. By 2024, OpenAI had corroborated the same order of data efficiency in its own voice-cloning systems.

The first widely reported incident of AI voice fraud came in **2019**: scammers cloned the voice of the **CEO of a German energy company** and called the UK subsidiary's finance director, instructing him to transfer **€220,000** to a Hungarian bank account. The employee recognized his boss's voice. He made the transfer before being alerted \cite[Audio deepfake, 2026]{audio_deepfake_wiki}. In early **2020**, the same technique was used in an attempted **35-million-dollar** fraud on a branch manager.

A **2023 McAfee global survey** found that **1 in 10** people reported being targeted by an AI voice-cloning scam, and **77%** of those targeted lost money. In **March 2023**, the US Federal Trade Commission issued a consumer warning specifically about AI-faked family member voices requesting money — the "your child has been in an accident, send money now" scam, upgraded from a human impersonator to a synthetic one that is, acoustically, indistinguishable from the real thing.

### The New Hampshire Robocall (2024)

The political use of AI voice cloning arrived with the **2024 New Hampshire Democratic primary**. In January 2024, over **20,000 voters** received robocalls from an AI-impersonated **President Joe Biden** urging them not to vote. Political consultant **Steve Kramer** admitted commissioning the calls for **500 dollars**. The FCC proposed a **6-million-dollar** fine. Four New Hampshire counties indicted Kramer on felony counts of voter suppression. In **February 2024**, the FCC voted to **ban the use of AI to fake voices in robocalls** \cite[Audio deepfake, 2026]{audio_deepfake_wiki}.

The number that should stay with you: **500 dollars**. For five hundred dollars, a single individual can generate a political interference campaign that reaches 20,000 people with the voice of a sitting president. The cost of deception has collapsed to near zero.

### Deepfakes in Elections

The **2024 election cycle** was the first in which AI-generated content was a significant factor across multiple countries simultaneously. The US Office of the Director of National Intelligence and the FBI stated that **Russia, Iran, and China** all used generative AI to create fake political content, with Russia "most prolific" \cite[AI and elections, 2026]{ai_and_elections_wiki}.

Documented incidents include:

* **France (2024)**: Deepfake videos of a fake France 24 broadcast claiming Ukraine tried to lure Macron into an assassination plot. Deepfakes of non-existent "nieces" of Marine Le Pen. Over **2 million views**.
* **UK (2024)**: A deepfake of **Rishi Sunak** claiming 18-year-olds would be sent to war zones in Gaza and Ukraine (40,000+ views). A deepfake of **Keir Starmer** "swearing at a staffer," released during Labour Party conference.
* **South Africa (2024)**: Deepfakes of **Biden** threatening sanctions, **Trump** endorsing the wrong party (158,000+ views), and **Eminem** endorsing the EFF (173,000+ views).
* **Moldova (2024)**: A deepfake of President **Maia Sandu** "throwing support behind a pro-Russian party." Moldovan officials believe Russia is behind it.

The **Center for Countering Digital Hate** tested major image generators (Midjourney, ChatGPT Plus, DreamStudio, Microsoft Image Creator) with election-related text prompts and found that **41% of the generated images constituted disinformation** \cite[AI and elections, 2026]{ai_and_elections_wiki}. The generators were not being prompted to lie. They were prompted to *illustrate*, and they produced false content nearly half the time.

### The Pornography Industrial Complex

The darkest application of the technology is the one that has driven the most legislation. A **2023 Sensity report** found that **96%** of deepfakes are sexually explicit and feature women who did not consent. An **Euronews analysis** (October 2023) found **98%** of deepfake videos found online were pornographic, and **99%** of victims were women \cite[Deepfake, 2026]{deepfake_wiki}.

In **South Korea**, police reported over **800 deepfake sex-crime cases** by the end of September 2024 (versus 156 in 2021). One Telegram group had **220,000 members**. "Nudify" bots were estimated at **4 million monthly users** by October 2024. The **Grok/X scandal** of late 2025/early 2026 saw users generating **6,700 sexually suggestive or nudified images per hour** over a 24-hour period, with an analysis of 20,000 images showing 2% depicted people appearing 18 or younger.

This is not a "side effect." This is the largest single category of AI-generated content on the internet, and it is an act of violence at industrial scale.

### Scams: The 650-Million-Dollar Year

The **FBI's Internet Crime Complaint Center** recorded **over 650 million dollars** in losses from romance/relationship scams in 2023 — roughly 7× phishing losses and 100× ransomware losses \cite[Romance scam, 2026]{romance_scam_wiki}. AI has not created romance scams (they date to at least the 1990s "romance fraud" of chat rooms), but it has *industrialized* them:

* **AI-generated profile pictures** of attractive, non-existent people (catfishing at scale)
* **AI-powered conversation** that maintains the illusion of a real person 24/7, across time zones, without the human operator
* **"Pig butchering" scams**: a combination of romance and fake cryptocurrency investment platforms, often operated by human-trafficked workers forced to commit fraud. The MIT Technology Review documented the human-trafficking dimension in August 2023.
* **Voice cloning** for the "emergency" calls described above.

The UK's **romance scam losses** rose by one-third from 2022 to **£93 million** in 2023, making it the fastest-growing category of cybercrime \cite[Romance scam, 2026]{romance_scam_wiki}.

The pattern is clear: AI has not created new *kinds* of crime. It has collapsed the **cost** and **effort** of the old kinds. A fraud that previously required a team, a script, and a voice actor now requires a laptop, a subscription, and 15 seconds of the victim's voice from a social media post.
</div>

<div class="md">
## The Theft: Art, Data, and Consent

The second great cultural shock of the generative AI era was the discovery that the models were **trained on the work of living artists — without their consent, without compensation, and in many cases without their knowledge.**

### The Training Data Problem

In **March 2022**, the German non-profit **LAION** released **LAION-5B**: a dataset of **5.85 billion image-text pairs** scraped from the web using Common Crawl, filtered by CLIP similarity scores \cite[LAION, 2022]{laion2022blog}. The dataset was funded by **Doodlebot, Hugging Face, and Stability AI**. It did not contain the images themselves — only URLs. But those URLs pointed to the work of millions of artists, photographers, and designers who had posted their work on the internet. No one asked them. No one told them. No one paid them.

Stable Diffusion, released by Stability AI in **August 2022**, was trained on subsets of LAION-5B (specifically `laion2B-en`, `laion-high-resolution`, and `laion-aesthetics v2 5+`, the last a ca. 600 million image "aesthetic ≥ 5/10" subset). The training cost approximately **600,000 dollars** in GPU compute (256 Nvidia A100s on AWS, 150,000 GPU-hours). A third-party analysis of a 12 million image subset found that **ca. 47%** of images came from just **100 domains**, with **Pinterest** alone contributing 8.5%.

The question this raised was not "can AI learn from data?" — of course it can. The question was: **whose data, and by what right?**

### The Cultural Flashpoints

**October 25, 2018**: A GAN-generated portrait, *Edmond de Belamy*, by the Paris collective **Obvious**, sold at Christie's for **432,500 dollars** — against an estimate of 7,000–10,000 dollars. It was the first AI artwork to sell at a major auction house. The piece was from a series of 20 portraits trained on ca. 15,000 14th–19th century paintings from WikiArt. The artist **Robbie Barrat**, whose open-source GAN code Obvious used "with little modification" (by their own admission), publicly called out the uncredited use of his work. The Guardian's art critic Jonathan Jones refused to call it art \cite[Edmond de Belamy, 2026]{edmond_belamy_wiki}.

**August 29, 2022**: **Jason M. Allen**'s Midjourney image, *Théâtre D'opéra Spatial*, won first place in the "Digital Arts/Digitally-Manipulated Photography" category at the **Colorado State Fair** fine-arts competition. The prize was 300 dollars. Allen had used at least 624 prompts and then post-processed in Photoshop. The backlash went viral within hours. Two judges said they would have awarded it regardless of the AI involvement. The Colorado Department of Agriculture compared it to Maurizio Cattelan's banana. Starting in 2023, the Fair required AI disclosure. In **September 2023**, the US Copyright Office Review Board **denied** registration of the image, finding that the human input was *de minimis* and the AI content dominant \cite[Théâtre D'opéra Spatial, 2026]{theatre_dopera_wiki}.

**April 2023**: A TikTok user posting as **Ghostwriter977** released "Heart on My Sleeve," an AI-generated song using **vocal clones of Drake and The Weeknd** (plus an unauthorized Metro Boomin producer tag). It reached approximately **600,000 Spotify streams** and **15 million TikTok views** before Universal Music Group filed a takedown on April 17, 2023. Days earlier, UMG had asked Spotify and Apple to **block AI companies from accessing its catalog**. Drake called the AI covers "the final straw." Ghostwriter977 subsequently sought a Grammy nomination for the track and released a follow-up with AI **Travis Scott / 21 Savage** vocals \cite[Heart on My Sleeve, 2026]{heart_on_my_sleeve_wiki}.

**May–September 2023**: The **Writers Guild of America** went on strike (May 2 – September 23). AI was one of three top issues alongside streaming residuals and "functional writers." The final contract (September 2023) included the first major labor-code protections for AI: AI **cannot be credited as a writer**; AI **cannot be used as a substitute** for a writer; writers' **source material cannot be used to train AI**; but writers **may use AI as a tool** \cite[2023 WGA Strike, 2026]{wga2023strike_wiki}.

\marginfig{alphago_leesedol.jpg}{Lee Sedol (right) plays AlphaGo in Seoul, March 2016. The match was watched by tens of millions and shifted public perception from "AI is a tool" to "AI is a creative agent." Move 37 in Game 2 — a move AlphaGo's own network gave less than 5% probability to — became the defining image of machine "creativity." [Photo: Google/DeepMind, CC BY 2.0]}
</div>

<div class="md">
## The Lawsuits: What the Courts Have Decided

The legal fight over AI training data has produced some of the most consequential copyright rulings of the 2020s:

| Case | Filed | Core issue | Status / Outcome |
|------|-------|-----------|-----------------|
| **Andersen, McKernan, Ortiz v. Stability AI, Midjourney, DeviantArt** | Jan 2023, N.D. Cal. | Training on 5B images without consent; right of publicity | Most claims dismissed; one copyright claim survived against Stability AI; additional claims allowed back in Aug 2024 |
| **Getty Images v. Stability AI** (UK) | Jan 2023 | Copyright + trademark for scraping | Training/jurisdiction claims to be tried; Getty "largely lost" as of Nov 2025 |
| **New York Times v. Microsoft & OpenAI** | Dec 2023, S.D.N.Y. | Verbatim reproduction in outputs; fair use invalid because it competes | Ongoing; fair-use question still before the court |
| **Kadrey v. Meta** | Dec 2023 | Training on 50,000+ of the author's works | All but one claim thrown out (Feb 2024); fair-use summary judgment for Meta (June 2025) on output-harm grounds |
| **Bartz v. Anthropic** | Aug 2024, N.D. Cal. | Training on **pirated books** (Project Panama, 7M+ copies) | **June 2025**: training on *purchased* books = fair use; *pirated* copies = not fair use. **Sept 2025**: **1.5-billion-dollar settlement** (ca. 3,000 dollars per book, ca. 500,000 authors) — the largest US copyright settlement in history \cite[Bartz v. Anthropic, 2025]{bartz2025anthropic} |
| **RIAA (UMG, Sony, Warner) v. Suno & Udio** | June 2024 | Models trained on label catalogs without consent | **Settled Nov 2025**: UMG–Udio (19 Nov), UMG–Suno (25 Nov) — first major label to settle; AI firms agreed to launch **licensed/opt-in** training platforms |

The emerging legal picture is **nuanced, not absolute**:

* Training on *lawfully acquired* content appears to be **fair use** (at least in the US, per *Bartz*).
* Training on *pirated* content is **not** fair use.
* **Outputs** that reproduce copyrighted material verbatim are infringement regardless of how training was done.
* The "style" question remains open: pure artistic style is generally not copyrightable, but a model that can output "in the style of [named living artist]" at scale may have a **market-substitution** effect that weakens the fair-use defense.
* In the EU, the **TDM opt-out** (Article 4(3) of the Copyright Directive) allows rights-holders to forbid text-and-data-mining. The **Kneschke v. LAION** ruling (Hamburg Regional Court, Sept 2024) was a "landmark" application of the TDM exception, but it is on appeal.

The practical reality by 2025: the "free web scrape" era is ending. Major AI companies have signed **licensing deals** with publishers (OpenAI with News Corp, Axel Springer, Financial Times, Vox Media, The Atlantic; Anthropic, Google, Microsoft with various). The future is **structured licensing with revenue-share**, not scraping.

The artists' data was taken. The question of whether it will ever be *returned* — in the form of compensation, attribution, or control — is still being litigated.
</div>

<div class="md">
## The Discovery: AI as Scientific Instrument

If the "bad" side of AI's cultural impact is the collapse of truth and the theft of creative labor, the "good" side is the **acceleration of discovery at a scale no human team could achieve alone.**

### AlphaFold: Solving a 50-Year Problem

The single most consequential scientific application of AI to date is **AlphaFold**. In November 2020, AlphaFold 2 won the **CASP14** (Critical Assessment of Protein Structure Prediction) competition with a median Global Distance Test score of **92.4** (out of 100) — near-experimental accuracy — on **88 of 97** targets. The protein-folding problem had been a central challenge in structural biology since the 1970s \cite[Jumper et al., 2021]{jumper2021alphafold}.

In July 2021, DeepMind and EMBL-EBI released the **AlphaFold Protein Structure Database**: over **200 million predicted structures** covering essentially all cataloged proteins in UniProt — **free to every researcher on Earth**. A structure that previously cost 10,000–100,000 dollars and took months to years to determine via X-ray crystallography or cryo-EM was now available in seconds, at no cost, from a web browser.

In **October 2024**, the Nobel Prize in Chemistry was awarded half to **David Baker** "for computational protein design" and half jointly to **Demis Hassabis** and **John Jumper** "for protein structure prediction" \cite[Nobel Prize, 2024]{nobel2024chemistry}. The AF2 paper has been cited approximately **48,000 times**; over **40%** of protein-structure papers in *Cell*, *Nature*, and *Science* in 2023 cited AlphaFold.

Concrete downstream discoveries include:
* **AlphaMissense** (2023): predicted pathogenicity for all **211 million** human missense variants — a direct tool for diagnosing genetic disease.
* **Nuclear pore complex structure** (2022): integrative model using AlphaFold as a scaffold.
* **DONSON's role in DNA replication initiation** (2023): discovered via in-silico AlphaFold-based interaction screening.

**AlphaFold 3** (May 2024) extended prediction to joint structures of proteins with DNA, RNA, ligands, ions, and modified residues — essentially the full molecular interactome.

### GNoME: 2.2 Million New Materials

In **November 2023**, Google's **GNoME** (Graph Networks for Materials Exploration) published a paper reporting **2.2 million new crystal structures** predicted to be stable, of which **381,000** were on the updated convex hull — a roughly **10× expansion** of the known stable materials landscape. **736** were independently confirmed experimentally, with a hit-rate exceeding 80% when structure was provided \cite[Merchant et al., 2023]{merchant2023gnome}. The paper noted that many of these materials "escaped previous human chemical intuition" — they existed in 5+ element composition spaces that no human researcher had systematically explored.

### FunSearch: AI Discovers New Mathematics

In **December 2023**, DeepMind's **FunSearch** (Romera-Paredes et al., *Nature*) used a large language model to evolve mathematical programs and discovered:
* A **512-cap** in dimension 8 — a larger construction than previously known.
* An improved **asymptotic cap-set lower bound from 2.2180 to 2.2202** — described as "the largest improvement in 20 years" for that problem \cite[Romera-Paredes et al., 2023]{romera2023funsearch}.

In **October 2025**, a team used ChatGPT to "vibe-code" a **Lean 4 formal proof** of a counterexample ({1, 2, 4, 8, 13}) to a **1,000-dollar Erdős problem** about Sidon sets — a 50-year-old open question. The proof was machine-verified.

In **July 2024**, DeepMind's **AlphaProof** combined with **AlphaGeometry 2** solved **4 of 6** problems at the International Mathematical Olympiad, earning a silver-medal-equivalent score (28/42 points) \cite[AlphaGeometry, 2026]{alpha_geometry_wiki}.

### Pangu-Weather: AI Beats the Weather Forecast

In **July 2023**, Huawei's **Pangu-Weather** — a 3D neural network trained on 40 years of ERA5 reanalysis data — published results in *Nature* showing it **outperformed the ECMWF IFS** (the best operational numerical weather prediction model in the world) on deterministic medium-range forecasts, while running **>10,000× faster** \cite[Bi et al., 2023]{bi2023pangu}. Google's **GraphCast** (*Science*, 2023) achieved similar results. The implication: global weather forecasting, a 10-billion-dollar industry with direct impacts on agriculture, aviation, and disaster response, can be done in minutes rather than hours, at a fraction of the compute cost.

### The First AI-Designed Drug

In **June 2023**, **Insilico Medicine** announced that **ISM001-055** (now named **rentosertib**) — a TNIK inhibitor for idiopathic pulmonary fibrosis whose target and molecule were generated by its Pharma.AI platform — had received **FDA Orphan Drug Designation** and entered Phase 1/2 trials. It was described as the "first fully AI-generated drug" to reach the clinic. By **March 2025**, it had received its USAN name and entered **Phase 3** (GENESIS-IPF-3, NCT07687459) \cite[Rentosertib, 2026]{rentosertib_wiki}.

The timeline: from target discovery through Phase 0/1 in **under 30 months**, at a reported cost of **ca. 2.6 million dollars** — versus the industry average of ca. 4.5 years and ca. 2.6 billion dollars to reach the same stage. No AI-designed drug has yet received full regulatory approval, but the pipeline is real and moving.

### The Pattern

What unites these results is not that AI is "smarter" than scientists. It is that AI is **faster, cheaper, and tireless** at the *search* step of science — the brute-force exploration of a vast space (protein conformations, crystal structures, mathematical constructions, molecular candidates) where the human contribution is *recognition*: knowing what a good result looks like, and knowing which one to pursue. The AI does the searching. The human does the judging. The division of labor is new, but it is a division of labor — not a replacement.
</div>

<div class="md">
## The Productivity Paradox: What the Data Actually Says

Everyone claims AI makes them more productive. The controlled experiments tell a more complicated story.

### The METR Study (2025): Experts Get Slower

In the most rigorous controlled experiment to date, **Becker, Rush, Barnes, and Rein** (METR, July 2025) ran a randomized controlled trial with **16 experienced open-source developers** (average 5 years on the codebases) completing **246 tasks** in mature projects, randomly assigned to allow or disallow AI tools (Cursor Pro + Claude 3.5/3.7 Sonnet) \cite[Becker et al., 2025]{becker2025metr}.

The results:

| Metric | Value |
|--------|-------|
| Developers' **forecast** (before the study) | AI would make them **24% faster** |
| Developers' **belief** (after the study) | AI made them **20% faster** |
| **Actual** result | AI made them **19% slower** |
| Economists' prediction | 39% faster |
| ML experts' prediction | 38% faster |

A **39-percentage-point gap** between belief and reality, in the *wrong direction*. The developers thought AI was helping them. It was not.

### The Copilot Study (2023): Beginners Get Faster

In a controlled experiment with **GitHub Copilot**, recruited developers were asked to implement an HTTP server in JavaScript as quickly as possible. The treatment group (with Copilot) completed the task **55.8% faster** than the control group. Notably, the heterogeneous effects suggested that **novices and beginners benefited most** \cite[Peng et al., 2023]{peng2023copilot}.

### The Customer Support Study (2023/2025): Novices Get a Big Boost

**Brynjolfsson, Li, and Raymond** (NBER 2023, published in *Quarterly Journal of Economics* 2025) studied a staggered rollout of a generative AI tool to **5,179 customer-support agents** at a large firm:

* Average productivity increase: **+14%** (issues resolved per hour)
* For **novice / low-skilled workers**: **+34%**
* For **experienced agents**: approximately **zero**
* Customer sentiment and employee retention also improved \cite[Brynjolfsson et al., 2023]{brynjolfsson2023genai}

### The "Jagged Frontier" (2023)

A field experiment with ca. 250 **BCG consultants** doing a business case with GPT-4 (Dell'Acqua et al., Stanford/Wharton/BCG) found that AI helped on *some* tasks (consultants completed ca. 12% more work, ca. 25% faster) but **quality dropped on the hardest, most creative tasks**. On the most difficult problems, GPT-4 was *worse* than the human working alone. The authors called this the **"jagged frontier"**: AI is a good tool for some tasks and a bad tool for others, and you cannot easily predict which in advance.

### The Speedup Illusion (2026)

A preregistered study with **N = 1,237** found that on simple cognitive tasks, **actual completion times did NOT differ** between doing a task alone vs. AI-assisted — but participants **predicted** AI would be significantly faster. The bias did **not** appear when they imagined a *human* helper. AI specifically triggers a "speedup illusion": people report lower subjective effort despite identical completion times. "Feels faster" ≠ "is faster" \cite[Yu et al., 2025]{speedup_illusion2025}.

### The Synthesis

The evidence is not "AI makes you faster." It is:

1. **AI is a skill-dependent, task-dependent tool.** It helps novices on well-specified tasks enormously (+34%, +55.8%). It can *hurt* experts on complex, open-ended work (−19%).
2. **Perception is systematically over-optimistic.** The gap between what people believe and what the data shows is large and consistent across studies.
3. **The "jagged frontier" means you cannot simply "adopt AI" and expect uniform gains.** The gain or loss depends on the specific task, the specific worker's skill level, and the specific tool's capability boundary.

The **Stack Overflow Developer Survey 2024** (N ≈ 60,000+) captures the mood: **76%** of developers use or plan to use AI tools (up from 70%), but favorability *fell* from 77% to 72% year-over-year. Only **2.7%** "highly trust" AI accuracy. **45%** of professional developers say AI is bad/very bad at complex tasks. Yet **70%** do *not* see AI as a threat to their job \cite[Stack Overflow, 2024]{stackoverflow2024ai}.
</div>

<div class="md">
## The Cognitive Shift: How AI Changes Thinking

The most subtle and potentially most consequential impact of AI is not on *output* but on *cognition* — on the way humans think, trust, and learn.

### Cognitive Offloading: The Google Effect, Upgraded

In **2014**, Ward, Benoit, and Gould published "The Google Effect": when people expected information to be stored on a computer, they **remembered the information worse** but remembered *where to find it* \cite[Ward et al., 2014]{ward2014googleeffect}. The brain treats the computer as an external memory drive. The effect was small, measured on trivia, and reversible.

Generative AI makes this effect **structural, not situational**. When an AI assistant can answer any question in any domain, on demand, in natural language, the incentive to *retain* information drops to near zero. You do not need to memorize the capital of France when ChatGPT will tell you in 200 milliseconds. You do not need to learn the syntax of a programming language when Copilot will autocomplete it. The "offloading" is no longer about a single fact — it is about **entire skill domains**.

A 2026 theoretical model formalizes the risk: AI lifts short-run productivity, but **sustained offloading erodes the worker's own skill** — which is the very skill the AI depends on for direction and verification. The result is an **"augmentation trap"**: even a rational, fully-anticipating employer can end up *lowering* long-run productivity. Low-skill workers can **permanently deskill** while high-skill workers pull away \cite[Caosun & Aral, 2026]{caosun2026augmentation}.

### Automation Bias: Trusting the Machine

The **automation bias** literature (Parasuraman & Riley, 1997, and successors) documents a consistent human tendency to **favor an automated system's suggestion and ignore contradictory human information**, even when the human is right \cite[Parasuraman & Riley, 1997]{parasuraman1997automation}. Key findings:

* In healthcare, clinical decision support improved correct answers from **29% to 50%** (a 21-point gain) but **flipped 7% of originally-correct answers to wrong** when the AI was wrong.
* In breast-cancer screening, cancers were caught in **46% of cases with no aid** but only **21% with a (failing) automated aid** — the radiologist *agreed with the machine* and missed the cancer.
* The more reliable an aid *appears*, the less people monitor it ("learned carelessness").

With LLMs, the "aid" is *always* confident, *always* fluent, and *always* available. The automation bias is not a bug to be patched; it is a feature of the human cognitive architecture meeting a new kind of tool.

### The Persistence Effect

A 2025 University of Chicago working paper (Kaplan, "Can AI Make You Dumber?") found that AI access **raised task performance but reduced persistence**: people gave up faster on problems they might otherwise have solved. The AI provided a "comfort" — a quick answer that foreclosed the struggle that is itself the learning mechanism. This is the **"crutch" effect**: the tool that solves the problem also eliminates the productive difficulty that builds the skill.

### What This Means for Education

The evidence from the 2023–2025 period is consistent:

* **AI tutoring can be effective**, particularly for students who lack access to human tutors. Khan Academy's **Khanmigo** (GPT-4-based, launched March 2023) reached ca. 65,000 students across 53 school districts by March 2024. A 2026 PNAS study found computer-assisted learning via Khan Academy associated with improved student math performance.
* **But**: AI-written admissions essays are **detectable and scored lower**. LLM-assisted writing in scholarly publications is rising, with studies showing a "publish and perish" dynamic where AI-accelerated writing without proportional verification degrades the knowledge base.
* The **complementarity finding**: gains depend on baseline skill. Students who already understand the material benefit from AI tutoring; those who do not risk **cognitive passivity** — accepting the AI's answer without the struggle that builds understanding \cite[Idan & Anand, 2026]{idan2026complementarity}.

The honest summary: AI is a **magnifier**. It magnifies the existing skill gap. The student who already understands the material gets a powerful study partner. The student who does not yet understand gets a confident, fluent, wrong answer that *feels* like understanding.
</div>

<div class="md">
## The Learning Paradox: AI as Tutor and as Crutch

The cognitive effects described above have a direct consequence in the classroom: AI is simultaneously the most powerful personal tutor ever built and the most effective tool for *avoiding* the struggle that produces learning.

### The Evidence That AI Helps

The positive case is real and not trivial. In **December 2025**, Google and Eedi published a randomized controlled trial of **LearnLM**, an AI tutoring system deployed in 5 UK secondary schools (N = 165). Tutors in the AI-assisted group approved **76.4%** of AI-drafted feedback messages with zero or minimal edits, and students in the AI group were **5.5 percentage points more likely** to solve novel problems correctly (66.2% vs. 60.7%) \cite[LearnLM, 2025]{learnlm2025rct}. The mechanism: the AI handles the low-level feedback loop (checking arithmetic, restating the question, hinting at the next step) so the human tutor can focus on conceptual understanding.

**Khanmigo** (Khan Academy, GPT-4-based, launched March 2023) is the largest deployment: ca. 65,000 students across 53 US school districts by early 2024, at 4 dollars per month. A **2026 PNAS study** found that computer-assisted learning via Khan Academy was associated with improved student math performance \cite[Khan Academy, 2026]{khanacademy_wiki}. The critical detail: the gains are concentrated in students who *lack access to human tutors* — the tool democratizes what was previously a privilege of the well-funded.

In **coding education**, the picture is more nuanced. The first controlled study of introductory CS students using **GitHub Copilot** (Prather et al., 2023, published in *ACM TOCHI*) found that students completed the assignment faster but showed **reduced metacognitive awareness**: they accepted autocomplete suggestions without verifying them, and could not explain *why* the suggested code worked \cite[Prather et al., 2023]{prather2023copilot}. The tool that writes the code also removes the struggle of writing it — and the struggle is where the learning lives.

### The Evidence That AI Hurts

In **June 2025**, Georgiou published a randomized experiment measuring **cognitive engagement** — mental effort, sustained attention, deep processing, strategic thinking — while participants solved reasoning problems with and without ChatGPT access. The ChatGPT group scored **significantly lower** on every cognitive-engagement measure. The paper's title is blunt: *"ChatGPT produces more 'lazy' thinkers"* \cite[Georgiou, 2025]{georgiou2025lazy}.

In **February 2026**, Guti et al. analyzed 701 classroom questions from primary schools in Zambia and India and found a **"jagged frontier" for education**: large language models excel at static, procedural skills (counting, scaling, arithmetic) but hit a hard **"spatial ceiling"** on dynamic operations requiring physical intuition (folding paper, reflecting shapes, rotating objects in 3D) \cite[Guti et al., 2026]{huti2026jagged}. The implication: AI tutoring is genuinely helpful for some mathematical domains and actively misleading in others, and the boundary between the two is not obvious to the student.

The **augmentation trap** (Caosun & Aral, 2026) formalizes the worst case: a rational, fully-informed decision-maker will *choose* to adopt an AI assistant even when it erodes their long-run skill, because the front-loaded productivity gain outweighs the deferred cost of skill atrophy. The employer who knows the team will deskill still deploys the tool, because the quarterly metric improves. The student who knows they will not retain the material still uses the tool, because the grade improves this semester. The trap is not irrationality. It is rationality applied to the wrong time horizon \cite[Caosun & Aral, 2026]{caosun2026augmentation}.

### The Coding Paradox

The most acute case is programming. A 2025 METR study found that AI's ability to complete long-horizon software tasks **doubles every 7 months** \cite[Becker et al., 2025]{becker2025metr}. The tool is improving faster than the skill it replaces. The paradox: the more capable the coding assistant becomes, the less reason the junior developer has to write code by hand, and the less they learn the craft. The "vibe coding" phenomenon — generating software by describing what you want in natural language, without reading or understanding the output — is the educational endpoint of this trajectory \cite[Vibe coding, 2026]{vibe_coding_wiki}.

This is not a new structural problem. In the **1980s**, the introduction of affordable pocket calculators into classrooms produced the identical anxiety: "if children can compute, they will never learn arithmetic." The resolution that emerged over the following decades was a shift in educational goals: from *performing* calculations to *reasoning about* them. The calculator did not make arithmetic irrelevant; it made *fluency in manual computation* irrelevant, and made *numerical reasoning and problem formulation* more important \cite[Calculator, 2026]{calculator_wiki}.

The AI-coding parallel is suggestive but not identical. Arithmetic has a finite, well-understood structure. Software design does not. The "reasoning about code" that replaces "writing code" is itself a skill that must be learned — and it is unclear whether it can be learned *from* an AI that writes the code for you, any more than a student learns to drive by riding in the back seat of an autonomous car.

### The Language Learning Case

Language learning is the domain where the evidence is most clearly positive. **Duolingo** (130 million monthly active users) launched **Duolingo Max** in **March 2023**, adding AI-powered conversation practice (Roleplay, Video Call with an AI character) and in **April 2025** launched **148 new language courses** generated with AI — including endangered and indigenous languages (Hawaiian, Māori, Navajo) that would have been uneconomical to produce with human writers alone \cite[Duolingo, 2026]{duolingo_wiki}. The CUBBITT study (Popel et al., 2020, *Nature Communications*) demonstrated that machine translation outperformed professional human translators in adequacy for news translation, with 9 of 15 participants in a Turing test unable to distinguish machine from human output \cite[Popel et al., 2020]{popel2020cubitt}.

The cultural impact: the **language barrier**, one of the oldest and most persistent obstacles to human communication, is being lowered at a rate with no historical precedent. A researcher in Lagos can read a paper in German. A developer in São Paulo can debug code documented in Japanese. The "lingua franca" problem that shaped human history for millennia is being solved, incrementally but irrevocably, by a neural network.

### The Academic Integrity Crisis

The "publish and perish" problem is the dark side of AI in learning. In **August 2026**, Kokkas et al. showed that GPT-5 could extract evidence from research papers **indistinguishably from human domain experts** (24 papers, 77 evaluation items), with hallucinations rare but methodological appraisal remaining a weakness \cite[Kokkas et al., 2026]{kokkas2026evidence}. The implication: the peer-review process, already stretched thin, now faces a workforce in which a meaningful fraction of submissions may be AI-drafted without disclosure.

A **February 2026** study (Kubota et al.) demonstrated that LLM systems can **replicate quantitative social-science analyses** and flag statistical problems, positioning AI as "assistive infrastructure" for the replication crisis \cite[Kubota et al., 2026]{kubota2026replication}. The same capability that verifies results can also generate them — and the line between "AI-assisted analysis" and "AI-fabricated result" is not yet policed by any institution.

The honest state of play in 2026: AI in education is a **genuine good for access** (the student in rural Guatemala, the blind student, the self-taught programmer) and a **genuine risk for depth** (the student who never struggles, the researcher who never reads the primary source, the reviewer who never checks the derivation). The tool does not know which student it is serving. The teacher does. The question is whether the teacher's judgment can scale to meet the tool's reach.
</div>

<div class="md">
## The Flood: AI Slop and the Verification Crisis

By 2024–2025, the volume of AI-generated content on the internet had reached a scale that broke existing verification infrastructure. The term **"AI slop"** — low-value, AI-generated content (text, image, video) flooding social feeds — entered common usage.

The **Pew Research Center** published a data essay in **August 2026** — \citetitle{pew2026ai} — the first authoritative, large-scale measurement of the share of new web text that is AI-generated \cite[Pew Research, 2026]{pew2026ai}. The precise percentage is contested and methodology-dependent, but the trend is unambiguous: the share is rising rapidly, and the *economic incentive* to produce AI-generated content (near-zero marginal cost, SEO value, ad revenue) ensures it will continue to rise.

The cultural effects are cumulative:

* **Erosion of the "evidence" concept.** When any image, video, or audio clip can be synthesized, the epistemic weight of "seeing is believing" collapses. The 2024 election cycle was the first in which major news organizations had to *pre-emptively debunk* AI-generated content before it went viral.
* **The "liar's dividend."** The existence of deepfakes gives *actual* politicians a new defense: "that video is fake." Even true incriminating evidence can be dismissed as "probably AI."
* **The attention economy, weaponized.** AI slop is not trying to inform you. It is trying to *capture your attention* and route it to an ad. The content is a loss leader. The product is your attention. At the scale of millions of AI-generated YouTube videos and TikTok posts per day, the signal-to-noise ratio of the internet is degrading.
* **The "trust deficit" as a systemic condition.** When you cannot tell if a photo is real, a review is human-written, or a news article is original reporting, the rational response is *suspended disbelief* — a low-trust equilibrium in which no content is fully believed and nothing is fully verified.

This is not a problem that will be solved by "better detection." It is a structural change in the information environment, comparable to the transition from oral to written culture (the loss of the "witness" as the unit of truth) or from print to broadcast (the loss of the "author" as the unit of authority). We are in the transition from *authored* to *synthesized* culture, and the norms, institutions, and cognitive habits that governed the previous regime are not yet adapted.
</div>

<div class="md">
## The Propaganda Machine: AI as a Tool of Power

The verification crisis described above is not merely an epistemic inconvenience. It is a **strategic asset** for actors who want to manipulate populations at scale. AI has transformed propaganda from a *broadcast* activity (one message, many receivers) into an **industrial, personalized, and effectively un-debunkable** one.

### The Firehose, Upgraded

In **2016**, the RAND Corporation documented Russia's propaganda strategy and named it the **"Firehose of Falsehood"**: a model with four distinguishing features — high-volume and multichannel, rapid and continuous, no commitment to objective reality, and no commitment to consistency \cite[RAND, 2016]{rand2016firehose}. The goal is not to convince anyone of a specific claim. The goal is to **flood the information environment with so many contradictory narratives that the audience gives up on distinguishing truth from fabrication entirely.** RAND's warning was explicit: "Don't expect to counter the firehose of falsehood with the squirt gun of truth."

The operational arm was the **Internet Research Agency** (IRA), founded in **2013** by Yevgeny Prigozhin in Saint Petersburg. By 2015 it employed over 1,000 people. A 2024 investigation revealed internal documents from its successor, the "Agency of Social Design," showing nearly **40,000 content units** (memes, images, comments) produced over a single 4-month period, targeted at the governments of France, Poland, Germany, and Ukraine \cite[IRA, 2026]{ira_wiki}. The IRA was formally shut down in **July 2023** following the Wagner Group rebellion, but the operational model persisted.

AI has not replaced the firehose. It has **removed the production bottleneck.** Where the IRA required 1,000 human operators to generate 40,000 content units in 4 months, a single operator with access to generative AI can produce the same volume in a weekend — in any language, in any visual style, with no need for stock photography or human illustration. The marginal cost of a propaganda unit has dropped to near zero, while the marginal cost of *debunking* it has increased (because the fake is now indistinguishable from the real thing).

### The India-Pakistan Case (May 2025)

A concrete demonstration of the new dynamics came during the **May 7–8, 2025** India-Pakistan military standoff. A deepfake video of Pakistani General Ahmed Sharif Chaudhry claiming Pakistan had lost two fighter jets was **shared nearly 700,000 times on X** before being debunked. Multiple major Indian news outlets (NDTV, The Free Press Journal, The Statesman, Firstpost) ran the story based on the fake. Bellingcat's debunking relied on finding a 2024 Facebook clip of the same press conference — identical microphone positions, identical body language, different audio \cite[Bellingcat, 2025]{bellingcat2025india}.

The structural problem: the debunking took **hours**. The fake was already mainstream. As Rachel Moran (University of Washington) noted: "In crisis periods, the information environment is already muddied as we try to distinguish rumours from facts at speed. The fact that we now have high-quality fake videos in the mix only makes this process more taxing, less certain and can distract us from important true information."

### Personalized Propaganda at Scale

The **Cambridge Analytica** scandal (2018) demonstrated the *targeting* half of the equation: psychological profiling at scale, using 87 million Facebook users' data, to deliver tailored political messages. CEO Alexander Nix claimed the firm modeled "the personality of every adult across the United States, some 230 million people" \cite[Cambridge Analytica, 2026]{cambridge_analytica_wiki}. But Cambridge Analytica was limited by a **production bottleneck**: it could only select from a finite set of pre-made ad variants.

Generative AI removes that bottleneck. The system can now generate *unlimited* content variants, each tailored to a specific psychological profile, in the local dialect, referencing local events, in the visual style the target demographic finds most credible. The targeting and the production are no longer separate steps. They are the same step.

In **March 2026**, Bellingcat documented the **BJP's** use of AI-generated imagery in anti-Muslim and anti-Bangladeshi hate speech ahead of elections in Assam and West Bengal. Of 499 social media posts analyzed, 194 met the UN definition of hate speech, and **31 (about 1 in 6)** contained obvious AI-generated imagery — including a video of a state chief minister "shooting" an AI-generated image of an opposition leader in a skull cap, captioned "Foreigner-free Assam" \cite[Bellingcat, 2026]{bellingcat2026bjp}. The same pattern appeared in **October 2025** (an AI-generated video shared from Andrew Cuomo's official X account depicting the NYC mayoral candidate Zohran Mamdani eating rice with his hands) and in **April 2025** (Italy's League party publishing AI-generated images depicting men of colour attacking women).

As Joyojeet Pal (University of Michigan) summarized: "AI is helping cement polarised opinions by giving you the kind of content you have already decided you want to engage with."

### The Liar's Dividend, Institutionalized

The **"liar's dividend"** — the phenomenon by which *real* incriminating footage can be dismissed as "probably AI" — has moved from theoretical concern to documented reality \cite[Deepfake, 2026]{deepfake_wiki}:

* **February 2025, US**: A fabricated video of an ICE raid went viral on TikTok. The subsequent flood of AI-generated ICE raid videos created a dynamic in which *real* ICE raid footage could be dismissed as synthetic.
* **March 2026**: AI-generated war videos and fake satellite imagery about the US-Israel-Iran conflict went viral, making genuine conflict footage harder to authenticate \cite[Synthetic media, 2026]{synthetic_media_wiki}.
* **Legal proceedings**: The epistemic shift is structural. Previously, the question in court was "did this happen?" Now the threshold question is "is this video *real*?" — and the burden of proof has shifted to the party offering the evidence.

### The Historical Pattern

Each media revolution has changed the economics of propaganda:

| Era | Medium | Propaganda capability |
|-----|--------|----------------------|
| ca. 1500 | Printing press | First ruler to use print for propaganda: Maximilian I. One-sided battle reports for the mass. |
| 1914 | Radio + mass print | WWI: first large-scale organized state propaganda (US Creel Committee, UK Ministry of Information). |
| 1933 | Radio + film | WWII "Golden Age": Goebbels' ministry, *Triumph of the Will*, Soviet agitprop cinema. |
| 1947 | TV + radio | Cold War: CIA's Bedford Publishing disseminated 1 million+ books to Soviet readers. |
| 2013 | Social media + algorithms | Computational propaganda: bots, fake accounts, the IRA, Cambridge Analytica. |
| 2022+ | Generative AI | Synthetic media: unlimited, personalized, indistinguishable from reality. |

The structural break with AI is this: **every previous medium reduced the cost of *both* production and verification** (print made books cheaper to produce *and* to copy; TV made broadcasts cheaper *and* to record). AI has broken the symmetry: the cost of producing a convincing fake has dropped to near zero, while the cost of verification has *increased* because the fake is now indistinguishable from the real thing by human perception.

### Institutional Responses (and Their Limits)

* **C2PA / Content Credentials**: A coalition including Adobe, Amazon, BBC, Google, Meta, Microsoft, OpenAI, Sony, and TikTok maintains an open standard for content provenance metadata — a "nutrition label" for digital content. Led by 500+ companies. The limitation: it is **opt-in**. A bad actor simply does not embed the metadata, or strips it \cite[C2PA, 2026]{c2pa_wiki}.
* **EU AI Act, Article 50** (in force **August 2, 2026**): Mandates that AI-generated synthetic content be marked in **machine-readable format** and made **detectable as AI-generated**. Deepfakes and AI-generated public-interest text require **disclosure** to the audience. A standardized EU "AI" label (localized: "KI" in German, "IA" in French) is in final development. The limitation: enforcement jurisdiction, and the act applies to the *deployer*, not the generator — a deepfake produced outside the EU and shared on a global platform is in a legal gray zone \cite[EU AI Act, 2026]{eu_ai_act_wiki}.
* **Platform labeling**: Meta announced "AI info" labels in **April 2024**. In practice, Bellingcat's analysis of the BJP posts found that **only 5 of hundreds** of AI-generated visuals carried any AI disclaimer — and none from the BJP itself. Voluntary platform enforcement is insufficient against state-adjacent actors \cite[Bellingcat, 2026]{bellingcat2026bjp}.

The honest assessment: the institutional response is a **cat's game** in which the defenders are always reacting to the last generation of the technology, while the attackers have already moved to the next one. The firehose model's core insight remains true and has only been strengthened: **the goal was never to convince. The goal is to make the concept of "fact" inoperative.** AI has made that goal achievable at a scale and speed that no fact-checking organization can match.
</div>

<div class="md">
## The Labor Question: Jobs at Risk, Jobs Created

### The "300 Million" Headline

In **March 2023**, **Goldman Sachs Research** published "The Potentially Large Effects of Artificial Intelligence on the Global Economy," estimating that **ca. 300 million full-time jobs globally** are *exposed* to automation from LLMs — approximately **25% of current US employment** and **ca. 40%** in developed Europe and India.

The critical nuance: "exposed to automation" ≠ "jobs lost." It is a **task-exposure model**, not a forecast of 300 million layoffs. It means 300 million jobs contain tasks that *could* be automated. Whether they *will* be — and how fast — depends on economic, institutional, and political factors.

### What Has Actually Happened (2024–2025)

* **Aggregate US unemployment** stayed near ca. 4% through 2024–2025. No mass AI-driven job loss is visible in headline BLS numbers.
* **Composition shift**: the clearest early signal is **entry-level softness** in AI-exposed roles (customer service, entry-level coding, writing/translation), while **AI-related job postings grew**. The pattern is **reallocation**, not net destruction.
* **The WGA strike** (2023) was, in part, a preemptive labor action: writers codified AI protections *before* displacement occurred. The strategy: accept AI as a tool, reject it as a substitute, and protect the training-data pipeline.
* **Stack Overflow 2024**: **70%** of professional developers do *not* see AI as a threat to their job. Only **11.7%** said "yes." The majority see it as a productivity aid that creates more work, not less.

The honest picture through 2025: **exposure is high; net displacement has been modest and concentrated in entry-level/white-collar roles.** The long-run effects are uncertain and depend on whether the productivity gains are captured by workers (wage growth) or by capital (profit concentration).

### The "Jagged" Labor Market

The same "jagged frontier" that applies to tasks applies to jobs. AI is not a uniform displacement force. It is a **task-level** force that reshapes job *contents* even when it does not eliminate jobs. A lawyer who uses AI for research can handle more cases, but the firm does not necessarily fire lawyers — it takes on more clients. A designer who uses Midjourney for concept art spends more time on client communication and revision. The job changes. The headcount may not.

This is the "augmentation vs. automation" question, and the evidence so far leans toward **augmentation** for skilled workers and **automation** for routine, entry-level, task-narrow roles.
</div>

<div class="md">
## The Good: Accessibility, Translation, Democratization

It would be a distortion to present only the dangers. AI has also produced **genuine, measurable improvements in human capability and access** that would have been science fiction a decade ago.

### Accessibility: Seeing Without Eyes

**Be My Eyes**, an app that connects blind and visually impaired users to sighted volunteers via live video, launched **Be My AI** in **March 2023** — a GPT-4-powered visual assistant that lets a blind user photograph an object and get an interactive, conversational description with follow-up questions \cite[Be My Eyes, 2023]{beemyeyes2023} \cite[Be My Eyes]{beemyeyes_site}. It hit **1 million sessions within two weeks** of its open beta release. It was named among **Time's Best Inventions of 2023**.

By 2024, Be My Eyes had integrated with **Ray-Ban Meta smart glasses** (hands-free, real-time visual descriptions via voice commands) and partnered with **Hilton** (live video assistance for blind hotel guests) and, in October 2025, with **Tesco** (in-store visual assistance in UK supermarkets, launched on World Sight Day). A blind person can now independently read a menu, identify a face, navigate a hotel room, or shop for groceries — tasks that previously required a human helper.

**OpenAI Whisper** (September 2022), released under an **MIT open-source license**, provides speech recognition in **96 languages** with **55.2% fewer errors** than prior models, trained on **680,000 hours** of audio \cite[Radford et al., 2022]{whisper2022}. It is used in research for Alzheimer's disease detection via speech, in library transcription (Emory University Libraries reported 30–35% reduction in transcription labor), and in accessibility applications for deaf and hard-of-hearing users.

### Translation: The "Good Enough" Moment

In **September 2020**, the **CUBBITT** study (Popel et al., *Nature Communications*) demonstrated that a deep-learning translation system **outperformed professional human translators in adequacy** for English→Czech news translation (P = 4.6×10⁻⁸). In a "Translation Turing test," **9 of 15 participants could not distinguish** CUBBITT translations from human translations \cite[Popel et al., 2020]{popel2020cubitt}.

**Google Translate** now supports **249 languages**, with **500 million+ daily users** and **100 billion+ words translated daily**. In 2024, **110 new languages** were added via generative AI, including Cantonese, Tok Pisin, and regional languages like Bashkir, Chechen, and Ossetian. **DeepL** (launched 2017) reached a **2-billion-dollar valuation** in 2024 and serves **200,000+ business customers**, including a large proportion of the Fortune 500.

The cultural impact: the **language barrier**, one of the oldest and most persistent obstacles to human communication, is being lowered at a rate that has no historical precedent. A researcher in Lagos can read a paper in German. A developer in São Paulo can debug code documented in Japanese. A tourist in Kyoto can order food in Japanese. The "lingua franca" problem that shaped human history for millennia is being solved, incrementally but irrevocably, by a neural network.

### Education: The 4-Dollar Tutor

**Khan Academy** (a 501(c)(3) nonprofit) offers **Khanmigo**, a GPT-4-based AI tutor for math, science, humanities, and coding, at **4 dollars/month** for users 18+. By March 2024, it had reached ca. 65,000 students across 53 school districts. The content is **free** worldwide, available in 14 fully-supported languages, with offline versions distributed to rural areas in Asia, Latin America, and Africa. A 2026 PNAS study found that computer-assisted learning via Khan Academy was associated with improved student math performance \cite[Khan Academy, 2026]{khanacademy_wiki}.

**Duolingo**, founded in 2011 by Luis von Ahn (motivated by seeing how expensive English learning was in his community in Guatemala), now has **130 million monthly active users**, **10.9 million paying subscribers**, and offers **42 languages** including endangered and indigenous languages (Hawaiian, Māori, Navajo). In **April 2025**, it launched **148 new language courses** developed using generative AI — a scale of content creation that would have been impossible with human writers alone \cite[Duolingo, 2026]{duolingo_wiki}.

### Science, Free

The **AlphaFold database** is the clearest example of AI as a public good: 200 million+ protein structures, **free to every researcher on Earth**, regardless of institution or country. A structural biologist in a low-income country who could never afford a cryo-EM facility now has access to a predicted structure for any protein of interest, in seconds.

**Whisper** is open-source (MIT license). Any organization, including in developing countries, can deploy speech recognition in 96 languages without licensing costs.

The pattern: the most transformative AI applications in science and accessibility are **free, open, and universal**. The most destructive ones (deepfake pornography, voice-cloning scams) are **cheap, easy, and unregulated**. The same technology, pointed in different directions, produces opposite outcomes.
</div>

<div class="md">
## The Human Element: AI Companions and Parasocial Bonds

One of the most culturally novel and least understood impacts of generative AI is the **parasocial relationship** — the one-sided emotional bond between a human and a system that simulates a relationship.

**Replika**, launched in **June 2017** by Luka Inc., reached **10 million+ users** at its peak. It is an AI "companion" that maintains a persistent, personalized conversation with the user, remembers details, and simulates emotional responsiveness. In **February–March 2023**, Italy's data-protection authority (Garante) **temporarily banned** Replika over improper collection of minors' data and unlawful psychological profiling \cite[Replika, 2026]{replika_wiki}.

**Character.AI**, founded in **November 2021** by Noam Shazeer and Daniel de Freitas (ex-Google LaMDA team), reached **1.7 million app downloads in its first week** (May 2023) and ca. **3.5 million daily visitors** by January 2024, the majority aged **16–30**. The platform lets users create and interact with AI characters — fictional, historical, or celebrity-based \cite[Character.AI, 2026]{characterai_wiki}.

The **Sewell Setzer case** (2024) was the first high-profile legal challenge: a **14-year-old** Florida boy died by suicide in February 2024 after a months-long relationship with a **Daenerys Targaryn** character on Character.AI. His mother filed suit in **October 2024**, alleging the platform was "addictive and manipulative" by design \cite[CBS News, 2024]{cbs2024characterai}. Related cases followed: a 13-year-old in Colorado (November 2023), and two Texas families (December 2024). In **October 2025**, Character.AI began **barring under-18s** from creating or talking to chatbots.

The Pew Research Center found that just over **half of US teens** have used chatbots for schoolwork, and **12%** have used them for **emotional support** \cite[Pew Research, 2026]{pew2026ai}. The "AI boyfriend/girlfriend" app category grew explosively through 2024–2025.

The cultural question this raises is not "is it wrong to talk to an AI?" — it is: **what happens to the human capacity for relationship when a perfectly available, perfectly responsive, perfectly non-judgmental, never-bored, never-angry "other" is always there?** The AI companion does not demand anything. It does not leave. It does not die. It does not have a life you cannot see. It is, in a very specific sense, *easier* than a human relationship — and the question is whether "easier" is the same as "good."

This is not a problem with a technical fix. It is a question about human need, loneliness, and the role of friction in building the kind of bonds that make a life worth living.
</div>

<div class="md">
## The Equilibrium We Are Forming

What, then, is the cultural impact of AI? There is no single answer. There are, at minimum, **seven simultaneous cultural processes** underway:

1. **The collapse of the cost of deception.** A 500-dollar robocall can reach 20,000 voters with the voice of a president. A 30-dollar/month subscription can generate 6,700 non-consensual images per hour. The "liar's dividend" is a permanent feature of the information environment.

2. **The theft-and-licensing transition.** The "free web scrape" era is ending. The work of millions of artists, writers, and musicians was taken without consent. The legal system is, slowly and unevenly, building a licensing regime. The artists who were taken from have not yet been compensated. The question of whether they will be — and whether the models trained on their work will be modified or destroyed — is still open.

3. **The acceleration of science.** AlphaFold, GNoME, FunSearch, Pangu-Weather, rentosertib — the rate of discovery in structural biology, materials science, mathematics, meteorology, and drug design has increased by an order of magnitude. This is, on net, an enormous good.

4. **The productivity paradox.** AI helps novices enormously and can hurt experts. The perception gap (people believe AI helps them more than it does) is large and consistent. The "jagged frontier" means uniform adoption is not a strategy; task-level analysis is.

5. **The cognitive offloading risk.** The Google Effect, upgraded. The augmentation trap. The persistence loss. These are slow, subtle, and hard to measure — but they are real, and they are compounding.

6. **The democratization of capability.** A blind person can read a menu. A researcher in Lagos can access 200 million protein structures. A student in Guatemala can learn 42 languages for free. A weather forecast that used to cost a supercomputer now costs a GPU. These are genuine, measurable, life-improving goods.

7. **The parasocial shift.** AI companions are not a fad. They are a new category of human experience — a one-sided relationship with a system that simulates the other side. The legal, ethical, and psychological frameworks for this are being built in real time, in courtrooms and in the bedrooms of teenagers.

The cultural equilibrium we are forming is not "AI is good" or "AI is bad." It is: **AI is a powerful, asymmetric, double-edged technology that amplifies whatever human intention is directed at it.** It amplifies the scientist's curiosity and the criminal's greed. It amplifies the teacher's patience and the scammer's persistence. It amplifies the artist's vision and the predator's reach.

The question that remains — the question that Dartmouth could not have answered, and that we are still asking — is not "can machines think?" It is: **what do we *do* with machines that can?**

And the answer to that question is not a technical answer. It is a cultural one. It is written in the contracts we negotiate (the WGA, the licensing deals), the laws we pass (the EU AI Act, the FCC robocall ban, the deepfake labeling requirements), the defaults we choose (opt-in vs. opt-out, consent vs. scraping), and the stories we tell ourselves about what we are, in relation to the machines we have made.

The story is not over. It is, in every meaningful sense, just beginning.
</div>
