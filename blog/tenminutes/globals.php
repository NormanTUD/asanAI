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

function tm_blog_lesson_url(string $slug): string
{
	return rtrim(TM_BLOG_BASE, '/') . '/' . $slug . TM_BLOG_LESSON_SUFFIX;
}
