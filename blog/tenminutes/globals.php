<?php
declare(strict_types=1);

/* Central link configuration for the Ten Minutes pages.
   Change TM_BLOG_BASE once and every full-lesson link follows. */
const TM_BLOG_BASE = 'https://asanai.scads.ai/blog';
const TM_BLOG_LESSON_SUFFIX = '.php';

/* Compact slug -> full lessons that the compact page draws from.
   Order controls the order of the links in the end-of-page block. */
const TM_FULL_LESSON_MAP = [
	'intro' => ['intro'],
	'intuition' => ['intuition', 'transformer', 'samplinglab'],
	'history' => ['history', 'untold_history_i', 'untold_history_ii', 'untold_history_iii'],
	'language' => ['language'],
	'tokenizerlab' => ['tokenizerlab'],
	'embeddinglab' => ['embeddinglab'],
	'hallucinations' => ['hallucinations', 'rag', 'evaluation'],
	'minimalneuron' => ['minimalneuron', 'traininglab'],
	'inceptionism' => ['inceptionism', 'diffusion'],
	'overandunderfittinglab' => ['overandunderfittinglab', 'evaluation', 'training_data'],
	'deeplearninglab' => ['deeplearninglab', 'activationlab', 'origami'],
	'activationlab' => ['activationlab', 'deeplearninglab', 'origami'],
	'computer_vision' => ['computer_vision'],
	'speech_audio' => ['speech_audio', 'music_video_generation'],
	'multimodal' => ['multimodal', 'computer_vision'],
	'training_data' => ['training_data', 'evaluation'],
	'evaluation' => ['evaluation', 'reliability'],
	'attentionlab' => ['attentionlab', 'transformer', 'mechanistic_interpretability'],
	'contextwindows' => ['contextwindows', 'attentionlab', 'inference_vs_training'],
	'positionalembeddingslab' => ['positionalembeddingslab', 'attentionlab'],
	'fact_lookup' => ['fact_lookup'],
	'transformer' => ['transformer', 'attentionlab', 'positionalembeddingslab', 'fact_lookup'],
	'promptengineering' => ['promptengineering', 'security_inference'],
	'rag' => ['rag', 'vectorsearch', 'websearch'],
	'agents' => ['agents', 'security_inference', 'promptengineering'],
	'reasoning' => ['reasoning', 'reliability'],
	'finetuninglab' => ['finetuninglab', 'alignment', 'reinforcement_learning'],
	'samplinglab' => ['samplinglab'],
	'running_locally' => ['running_locally', 'inference_optimization'],
	'ai_and_society' => ['ai_and_society', 'ai_economics', 'law_regulation'],
	'philosophy' => ['philosophy', 'metaphysics_of_ai', 'human_mind'],
	'ai_for_science' => ['ai_for_science'],
	'people_of_ai' => ['people_of_ai'],
];

const TM_FULL_LESSON_TITLES_DE = [
	'activationlab' => 'Aktivierungsfunktionen: Die Entscheider der neuronalen Netze',
	'agents' => 'KI-Agenten: Autonomes Denken und Werkzeugnutzung',
	'ai_and_society' => 'KI und Gesellschaft: Die kulturelle Wirkung schaffender Maschinen',
	'ai_economics' => 'Die wirtschaftliche Ebene',
	'ai_for_science' => 'Den Kreis schließen — KI für die Wissenschaft',
	'alignment' => 'Alignment — Ziele mit Absicht in Einklang bringen',
	'attentionlab' => 'Das semantische Tauziehen: Wie Transformer „denken“',
	'computer_vision' => 'Was Maschinen sehen',
	'contextwindows' => 'Kontextfenster & Gedächtnis: Was LLMs im Kopf behalten können',
	'deeplearninglab' => 'Deep Learning',
	'diffusion' => 'Diffusionsmodelle',
	'embeddinglab' => 'Embeddings: Die Geometrie der Bedeutung',
	'evaluation' => 'Evaluation & Benchmarks',
	'fact_lookup' => 'Wo „Paris“ lebt — Wie ein LLM einen Fakt abruft',
	'finetuninglab' => 'Fine-Tuning & Post-Training',
	'hallucinations' => 'Halluzinationen und Gefahren der KI und wie man KI sicher nutzt',
	'history' => 'Kurze Geschichte der KI',
	'human_mind' => 'Der Geist, der Maschinen baute',
	'inceptionism' => 'Inceptionism: Was das Netz sieht',
	'inference_optimization' => 'Inferenz-Optimierung',
	'inference_vs_training' => 'Inferenz vs. Training — der KV-Cache und die zwei Regime',
	'intro' => 'From Nothing to Large Language Models: Ein Blick in die Black Box',
	'intuition' => 'Eine Intuition, wie Large Language Models (LLMs) funktionieren',
	'language' => 'Die Geschichte der Sprache: Von Sanskrit zu LLMs',
	'law_regulation' => 'KI-Recht & Regulierung',
	'mechanistic_interpretability' => 'Mechanistische Interpretierbarkeit',
	'metaphysics_of_ai' => 'Die Metaphysik der künstlichen Intelligenz',
	'minimalneuron' => 'Kleinstmögliches neuronales Netz',
	'multimodal' => 'Multimodale & Vision-Language-Modelle',
	'music_video_generation' => 'KI-Musik- & Videogenerierung',
	'origami' => 'Origami in N Dimensionen',
	'overandunderfittinglab' => 'Over- und Underfitting',
	'people_of_ai' => 'Menschen der KI',
	'philosophy' => 'Philosophische und gesellschaftliche Implikationen, ethische Nutzung von KI',
	'positionalembeddingslab' => 'Positions-Embeddings',
	'promptengineering' => 'Prompt Engineering: Wie man mit LLMs spricht',
	'rag' => 'Retrieval-Augmented Generation: LLMs eine Suchmaschine geben',
	'reasoning' => 'Reasoning & Test-Time-Compute',
	'reinforcement_learning' => 'Reinforcement Learning',
	'reliability' => 'Zuverlässigkeit — Kalibrierung & Wissen, wann man stoppt',
	'running_locally' => 'Modelle lokal betreiben',
	'samplinglab' => 'Temperatur & Sampling',
	'security_inference' => 'Sicherheit & adversarische Angriffe',
	'speech_audio' => 'Sprach- & Audiomodelle',
	'tokenizerlab' => 'Tokenisierung: Wie Wörter zu Zahlen werden',
	'training_data' => 'Trainingsdaten kuratieren',
	'traininglab' => 'Live-Training eines neuronalen Netzes',
	'transformer' => 'Die Architektur der Bedeutung: Ein tiefer Einblick in Transformer',
	'untold_history_i' => 'Die unerzählte Geschichte der KI I: Vom Urknall zur Zivilisation',
	'untold_history_ii' => 'Die unerzählte Geschichte der KI II: Die materiellen Grundlagen',
	'untold_history_iii' => 'Die unerzählte Geschichte der KI III: Der moderne Stack',
	'vectorsearch' => 'Semantische Suche & Vektordatenbanken: Nadeln im Heuhaufen finden',
	'websearch' => 'Wie LLMs das Web durchsuchen',
];

function tm_blog_lesson_url(string $slug): string
{
	return rtrim(TM_BLOG_BASE, '/') . '/' . $slug . TM_BLOG_LESSON_SUFFIX;
}

/* Each map entry is either a full-lesson slug or an array:
   ['slug' => 'history'] or
   ['page' => 'https://example.org/custom', 'title' => 'Custom', 'title_de' => 'Benutzerdefiniert'].
   A page key overrides the generated TM_BLOG_BASE URL. */
function tm_full_lesson_entry(string|array $entry): array
{
	if (is_string($entry)) {
		return ['slug' => $entry, 'page' => tm_blog_lesson_url($entry)];
	}
	$slug = (string) ($entry['slug'] ?? '');
	$page = (string) ($entry['page'] ?? ($slug !== '' ? tm_blog_lesson_url($slug) : ''));
	return [
		'slug' => $slug,
		'page' => $page,
		'title' => $entry['title'] ?? null,
		'title_de' => $entry['title_de'] ?? null,
	];
}
