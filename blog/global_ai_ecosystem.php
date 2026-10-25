<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: The Global AI Ecosystem
description: Beyond the Anglosphere — Chinese AI, Indian AI, African AI, and the rest of the world.
icon: &#127760;
part: 6
order: 1
color: text-secondary
topics: society, ethics, history
tags: interested-layman
-->

<div class="md">
The dominant narrative around AI is Silicon Valley-centric: OpenAI, Anthropic, Google DeepMind, Meta. But the global AI ecosystem is far richer. China has produced frontier-class open-source models \cite[e.g. DeepSeek and Qwen]{deepseekv3tech2024,qwen2024}. India has world-class applied AI work and a thriving open-source community (\cite[AI4Bharat, 2024]{ai4bharat2024}). The UAE, France, Korea, Japan, Israel, and Singapore host serious AI efforts. Africa is building AI for low-resource languages and African challenges (\cite[Masakhane, 2024]{masakhane2024}). The Soviet cybernetics and pattern-recognition tradition (Ivakhnenko, etc., covered in the History chapter) developed largely independently of Western deep learning. In Europe, a separate lineage through Schmidhuber's IDSIA group (LSTM, etc.) and its successors has shaped modern deep learning from a different direction.

This chapter is a corrective: a brief tour of AI's worldwide geography.
</div>

<div class="md">
## China

China is the **second pole** of the global AI ecosystem. By 2025, Chinese open-source models have *closed a substantial portion of the gap* to Western closed frontier models on many widely-cited benchmarks (e.g., DeepSeek-V3, Qwen 2.5, Kimi K2), though the *frontier itself remains contested* (see the *Frontier Topics* chapter for an open discussion of whether open models are converging with or lagging behind the closed-source frontier).

### Frontier Model Builders

* **DeepSeek** (Hangzhou): \cite[DeepSeek-V3]{deepseekv3tech2024} (671B MoE), \cite[DeepSeek-R1]{guo2025deepseekr1}. Trained reportedly for \$5–6M on H800s. State-of-the-art math/coding. Open weights.
* **Alibaba / Qwen**: \cite[Qwen 2.5]{qwen2024qwen25} family (0.5B–72B), Qwen2-VL (vision), Qwen2-Audio. **Qwen3** (2025) added hybrid thinking and non-thinking modes across dense and mixture-of-experts variants (\cite[Qwen Team, 2025]{qwen2025qwen3}). Among the most-used open models globally.
* **Zhipu AI / GLM**: \cite[ChatGLM]{glm2024}. Strong bilingual EN/ZH performance.
* **Baidu**: ERNIE 4.0, Ernie Bot. Earlier proprietary; later opened some weights.
* **Moonshot AI / Kimi**: the long-context Kimi assistant, then the open-weight **Kimi K2** — a trillion-parameter mixture-of-experts model trained with the MuonClip optimizer and tuned for agentic tool use (\cite[Kimi Team, 2025]{kimi2025k2}).
* **01.AI (Yi)**: Yi-Lightning (long context), Yi-VL (vision).
* **Tencent**: Hunyuan series.
* **MiniMax**: the MiniMax-01, M1, and M2 lines, built on **lightning attention** — a linear-attention variant used in a hybrid stack with softmax attention (\cite[MiniMax, 2025]{minimax2025lightning}) — plus the Hailuo video models.
* **Meituan / LongCat**: **LongCat-Flash**, a 560B-parameter mixture-of-experts model with roughly 27B active parameters that was reported as trained on Chinese-made accelerators (\cite[LongCat Team, 2025]{longcat2025}).
* **Stepfun**: Step-1V, Step-1.5V (multimodal).

### Strategic Advantages

* **Massive engineering talent**: top Chinese universities (Tsinghua, Peking, Shanghai Jiao Tong) produce ~100,000 CS graduates per year.
* **Aggressive open-source publishing**: Chinese labs release model weights and papers freely. This is partly a competitive strategy (commoditize the closed labs) and partly regulatory pressure to “contribute to the community”.
* **Low inference cost**: aggressive optimization yields APIs at \$0.27/1M tokens (DeepSeek), 10× cheaper than GPT-4o (\cite[DeepSeek, 2024]{deepseek2024v3}).
* **Industry integration**: deep partnerships with Alibaba Cloud, Tencent Cloud, Baidu Cloud for distribution.

### Constraints

* **US export controls** on advanced GPUs (H100, B200) limit training at the frontier. DeepSeek trained on H800s (slower interconnects); next-gen training is constrained.
* **Regulatory environment**: every public model requires CAC approval \cite[China2023Algorithmic]{china2023algorithmic}.
* **Data**: training data is largely Chinese-language; English coverage lags.
</div>

<div class="md">
## India

India is **the world's largest AI talent producer** but a relatively small frontier-model builder. The focus is on applied AI, particularly for India's 1.4 billion population.

### Research Labs

* **AI4Bharat** (IIT Madras): \cite[open-source models]{ai4bharat2024} for 22 Indic languages. **Airavata**, **Navarasa-2.0** (15 Indic languages), **IndicTrans2** (translation).
* **Krishna et al.** (IIT Bombay): efficient Transformers, KV-cache compression.
* **Microsoft Research India**: pioneering work on multilingual AI, code-mixing, low-resource NLP.
* **Google Research India**: focused on agriculture, healthcare, education.
* **IBM Research India**: enterprise AI.

### Industry Applications

* **Agriculture**: crop disease detection, weather prediction for 100M+ smallholder farmers (e.g., **Plantix**, **Intello Labs**).
* **Healthcare**: AI-driven radiology (Qure.ai, SigTuple), diagnostic assistants for rural clinics.
* **Education**: personalized tutors for 250M+ students (Embibe, BYJU's, Vedantu).
* **Finance**: UPI fraud detection processes 10B+ transactions/month.
* **Languages**: voice-first AI for 22 official languages.

### Open Source

* **BharatGPT** (cooperative): Indic language LLMs.
* **OpenHathi** (Krutrim): Hindi-first models.
* **Airavata, Navarasa**: AI4Bharat releases.

### Strategic Position

India is positioning as the **“AI for the global south”** hub, building affordable, multilingual AI for emerging markets.
</div>

<div class="md">
## Africa

African AI is **early but rapidly growing**, focused on problems specific to the continent.

### Research Centers

* **African Institute for Mathematical Sciences (AIMS)**: pan-African AI research.
* **Data Science Africa**: annual conference and network.
* **Deep Learning Indaba**: pan-African ML community, hosts the **IndabaX** conference series across 30+ countries.
* **Google AI Research Accra** (Ghana): agriculture and healthcare ML.
* **Meta AI Nairobi**: multilingual NLP.
* **Zindi** (South Africa): data science competition platform with 50,000+ African practitioners.

### Notable Projects

* **Lesan AI** (Ethiopia): Tigrinya, Amharic machine translation.
* **Sunbird AI** (Uganda): multilingual speech recognition for 40+ African languages.
* **Awarri** (Nigeria): Yoruba, Igbo, Hausa NLP.
* **Lelapa AI** (South Africa): “Vula Vulapha”, African language LLM.
* **InstaDeep** (Tunisia): \cite[acquired by BioNTech for \$680M]{insta2023}. AI for genomic surveillance, including early detection of COVID variants in Africa.

### Challenges

* **Compute access**: limited GPU availability outside South Africa, Kenya, Nigeria, Egypt.
* **Language data**: most African languages have < 1 MB of digital text. Building foundational corpora is itself a major effort.
* **Funding**: most grants are from Western foundations with priorities that don't always align with African needs.
* **Talent retention**: many top researchers leave for North American/European industry.

The African AI ecosystem is **small but scrappy**, with strong community support (\cite[Masakhane, 2024]{masakhane2024}) and a focus on local problems.
</div>

<div class="md">
## Other Major Players

### United States: the new labs

Beyond the incumbents, the 2024–2026 wave produced a cluster of well-funded startups with sharply different theses:

* **Safe Superintelligence Inc.** (\cite[SSI, 2024]{ssi2024}), founded in 2024 by Ilya Sutskever, Daniel Gross, and Daniel Levy, has a single product as its stated goal: a safe superintelligence. It raised a reported \$2 billion at a roughly \$32 billion valuation in 2025 while still shipping nothing.
* **Thinking Machines Lab** (\cite[Thinking Machines Lab, 2025]{tml2025}), founded in 2025 by former OpenAI CTO Mira Murati, raised a record seed round and builds **Tinker**, a fine-tuning API around the thesis that most users want to customize models rather than train one from scratch.
* **Ndea** (\cite[Ndea, 2025]{ndea2025}), founded by Keras creator François Chollet and Zapier co-founder Mike Knoop, pursues **deep-learning-guided program synthesis** — combining neural networks with search over programs — as its path to general intelligence. It is the institutional continuation of the ARC-AGI benchmark program.
* **Arcee AI** (\cite[Arcee AI, 2025]{arcee2025}) grew from model merging and distillation into from-scratch pretraining; its **Trinity** line spans 6B, 26B, and 400B sparse mixture-of-experts models released as open weights.

The pattern is a broadening of *what counts as a frontier lab*: not only companies training the largest dense model, but companies betting on customization, program synthesis, or open-weight sparsity.

### United Arab Emirates

* **G42** (Abu Dhabi): backed by the ruling family, partnered with OpenAI, Cerebras, and others. Building Arabic-first LLMs.
* **Falcon** (\cite[Technology Innovation Institute]{technologyinnovation2024}, Abu Dhabi): open-source LLMs (Falcon 3, 7B–180B). Arabic language model leader.
* **MBZUAI** (Mohamed bin Zayed University of AI): graduate AI program, attracting faculty worldwide.

### France

* **Mistral AI** (Paris): European champion. Mixtral, Mistral Large. Strong open-source offering.
* **Kyutai** (Paris, Moshi): real-time multimodal speech model. Open-source.
* **Hugging Face** (Paris/NYC): the open-source hub for ML models and datasets. Central infrastructure for the entire field.
* **LightOn**: enterprise LLM deployments.

### South Korea

* **LG, Samsung, SK Telecom**: integrating LLMs into consumer electronics.
* **NAVER HyperCLOVA X**: Korean-specialized LLM.
* **Kakao, NCSoft**: conversational AI.

### Japan

* **Sakana AI** (Tokyo): evolutionary model merging, Japanese-specialized LLMs.
* **NTT, SoftBank**: enterprise AI, infrastructure.
* **Preferred Networks**: autonomous driving, materials science.

### Singapore

* **AI Singapore**: government-funded research consortium.
* **Sea Group, Grab**: applied AI in Southeast Asian markets.
* **Salesforce AI Research Asia**: multilingual enterprise AI.

### Israel

* **AI21 Labs**: Jurassic-2, Jamba (hybrid SSM-Transformer) (\cite[Lieber et al., 2024]{lieber2024jamba}).
* **Mobileye**: autonomous driving.
* **Unit 8200 alumni**: many AI startups trace their founders to Israeli military intelligence.

### Russia

* **Yandex**: YaLM, Alice AI (YandexGPT family). Strong in code (YandexGPT).
* **Sberbank** (SberDevices): GigaChat, Kandinsky (image generation).
* **T-Bank (Tinkoff)**: T-Pro LLM.
* Despite sanctions, the Russian AI ecosystem continues to publish, primarily for Russian-language use.

### Canada

* **Mila** (Montreal, Bengio's institute): foundational research.
* **Cohere** (Toronto): enterprise LLMs, Aya multilingual models.
* **Element AI → ServiceNow**: enterprise AI.
* **DeepMind Canada (Montreal)**: reinforcement-learning research (Doina Precup et al.); not the AlphaFold team.

### UK

* **DeepMind** (London): AlphaFold, Gemini co-development, AlphaProof.
* **Anthropic London office**: Claude team expansion.
* **Stability AI** (London): Stable Diffusion.
* **Wayve** (Cambridge): end-to-end driving AI.

### EU Generally

The EU's AI strategy emphasizes **regulation + research**:

* **European AI Office**: coordinates the \cite[AI Act]{euaiact2024}.
* **AI Factories** (2024–): subsidized supercomputers for SMEs and researchers.
* **Horizon Europe**: €1B/year for AI research.
* **EuroLLM, Project OpenGPT-X**: European open-source multilingual models.

The European research tradition, led by Bengio (Mila), Schmidhuber (IDSIA), Hinton's students, has shaped deep learning from its inception.
</div>

<div class="md">
## Open Source: The Global Equalizer

Open-source models have **dramatically changed the geography of AI**:

* A researcher in Nairobi can fine-tune Llama 3.1 70B on consumer hardware (with quantization).
* A startup in Bangalore can serve a fine-tuned Qwen on Together.ai for \$50/month.
* A student in São Paulo can read the \cite[DeepSeek-V3]{deepseekv3tech2024} technical report and reproduce the results.

The **Hugging Face Hub** hosts 1M+ models from every country. The model release pattern in 2025: most frontier-capable models are published as open weights within months of their closed-source competition. Even OpenAI returned to open weights — its first since GPT-2 — with the **gpt-oss** pair (120B and 20B mixture-of-experts models under Apache 2.0), which also shipped learned per-head attention-sink logits (\cite[OpenAI, 2025]{gptoss2025}).

The open-weight lineage has its own history. EleutherAI's **GPT-Neo** and **GPT-J** were early public replications of the GPT-3 design; **GPT-NeoX-20B** was, at release, the largest dense model with fully open weights (\cite[Black et al., 2022]{black2022gptneox}). Meta's **OPT** released weights together with a candid training logbook (\cite[Zhang et al., 2022]{zhang2022opt}), BigScience's **BLOOM** was a 176B multilingual collaboration (\cite[Le Scao et al., 2022]{scao2022bloom}), and EleutherAI's **Pythia** suite released 16 models *with* their intermediate training checkpoints, turning training dynamics into something outside researchers could study (\cite[Biderman et al., 2023]{biderman2023pythia}). These projects established the norm that a serious open release includes weights, data documentation, and often code — the norm that Llama, Qwen, DeepSeek, and OLMo later inherited.

The asymmetry that remains:

* **Frontier training compute** is still concentrated: ~5 companies worldwide can train GPT-4-class models.
* **Data acquisition** is increasingly centralized: licensing deals favor large incumbents.
* **Distribution** (API customers, enterprise relationships) requires sales infrastructure.

But the **“good enough” tier** is now globally accessible. Most enterprise AI applications don't need frontier; they need a 7B–70B open model fine-tuned on local data. This is the playing field where most innovation now happens.
</div>

<div class="md">
## Geopolitics and the Future

Three trends to watch:

1. **Bifurcation**: US-China compute decoupling may produce two parallel AI ecosystems, Western and Chinese, with limited cross-pollination.
2. **Multipolarity**: India, UAE, France, Korea, and others are building independent AI capabilities, especially for their languages and cultures.
3. **Open-source as soft power**: Chinese open-source releases (Qwen, DeepSeek) and Western ones (Llama, Mistral) compete for global developer mindshare. Adoption is a form of influence.

The student of AI in 2025 should not assume that the latest OpenAI or Anthropic model represents the state of the art for *their* problem. **Look globally.** The best model for Yoruba is not the best model for English. The best model for code in Rust might be a 7B Chinese release. The best model for math might be \cite[DeepSeek-R1]{guo2025deepseekr1}, not o1.

The global AI ecosystem in 2025 is the most dynamic and polycentric in computing history.
</div>

<script>
async function loadGlobalAiEcosystemModule() {
	updateLoadingStatus("Loading section about the Global AI Ecosystem...");
	return Promise.resolve();
}
</script>

<div class="mn-quiz" data-quiz="global_ai_ecosystem"><script type="application/json">{"title": "The global AI ecosystem", "questions": [{"q": "Which of these is a Chinese developer of open-weight frontier-class models?", "options": ["DeepSeek", "Mistral", "Anthropic", "Cohere"], "answer": 0, "explain": "DeepSeek (and Alibaba's Qwen family) made Chinese open-weight models widely used worldwide."}, {"q": "What is Masakhane?", "options": ["A grassroots research community building NLP for African languages", "A Chinese manufacturer of AI accelerator chips and servers", "An EU regulation on releasing open-weight models to the general public", "A benchmark for evaluating code generation in Python"], "answer": 0, "explain": "Small but scrappy, it focuses on low-resource languages and local problems."}, {"q": "Why does the chapter call open source a “global equaliser”?", "options": ["Open weights let anyone build on frontier models without training one", "Open source is always better than closed models for every kind of task", "It removes the need for expensive GPUs when running large models", "It is required by law in most countries around the world"], "answer": 0, "explain": "Access to strong base models lowers the entry barrier for countries and labs with fewer resources."}, {"q": "Why do languages with little online text get worse AI support?", "options": ["Models learn from text, and these languages have far less of it", "They are grammatically much harder for models trained on English", "Tokenizers refuse to process these languages at all", "They are not written down at all and exist only as speech"], "answer": 0, "explain": "Less data means weaker models — and token inflation makes them more expensive too."}]}</script></div>
