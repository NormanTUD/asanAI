<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: From Model to Product
description: An LLM product is a pipeline around a stochastic component: routing, guardrails, tool-calling, retry and fallback, observability, and cost tracking.
icon: &#9881;
part: 5
order: 23
color: rose
topics: architecture, inference, safety
tags: code-heavy
math: 20
-->

<div class="md" data-lesson-id="from_model_to_product">
Everything up to this point has treated "the model" as the thing you build: a network, trained, that maps a prompt to a completion. A deployed LLM product is a different animal, and the difference is structural, not incidental. **The model is a component, not the system.** It is a *stochastic* component — it can produce a different answer to the same prompt twice, it can be slow, it can exceed its budget, and it can, occasionally, fail outright — wrapped in a *deterministic* system that decides which model to call, what it is allowed to say, what it is allowed to do, what to do when it fails, and what it all cost. [Agents](agents.php) and [Production serving](production_serving.php) show pieces of this; this chapter is the whole shape, because a "model" and a "product made with a model" are two different architectures, and most LLM engineering is the second one.
</div>

<div class="md">
## The reframe: services around a thing that sometimes fails

Start from the property that drives everything: the model is **non-deterministic** (temperature > 0) and **reliably wrong sometimes**. A traditional service is deterministic and either works or returns an error; you design for the error. An LLM service is *probabilistic*: it returns *an* answer, most of the time *a good one*, occasionally *a bad one you cannot distinguish from a good one by its shape*. So the system around it is not a wrapper that calls it; it is a set of **services that manage a stochastic component's failures** — the same way a system around a flaky network manages packet loss, except here the "loss" is a confident, plausible, wrong answer.

The product, then, is a pipeline, and each stage is a service with its own job:

<figure>
	<svg viewBox="0 0 560 120" role="img" aria-label="The LLM product pipeline: query to router to guardrails to model to validation to retry or fallback to cost ledger" style="width:100%; height:auto; max-width:560px; display:block; margin:0 auto;">
		<defs><marker id="pparrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--mn-text-secondary)"/></marker></defs>
		<rect x="8" y="44" width="66" height="32" rx="7" fill="var(--mn-bg-subtle)" stroke="var(--mn-border)"/>
		<text x="41" y="64" text-anchor="middle" font-size="11" fill="var(--mn-text)">query</text>
		<rect x="90" y="44" width="70" height="32" rx="7" fill="var(--mn-bg-subtle)" stroke="var(--mn-accent)"/>
		<text x="125" y="64" text-anchor="middle" font-size="11" fill="var(--mn-text)">router</text>
		<rect x="176" y="44" width="70" height="32" rx="7" fill="var(--mn-bg-subtle)" stroke="var(--mn-accent)"/>
		<text x="211" y="64" text-anchor="middle" font-size="11" fill="var(--mn-text)">guard-rails</text>
		<rect x="262" y="44" width="60" height="32" rx="7" fill="var(--mn-bg-subtle)" stroke="var(--mn-border)"/>
		<text x="292" y="64" text-anchor="middle" font-size="11" fill="var(--mn-text)">model</text>
		<rect x="338" y="44" width="70" height="32" rx="7" fill="var(--mn-bg-subtle)" stroke="var(--mn-accent)"/>
		<text x="373" y="64" text-anchor="middle" font-size="11" fill="var(--mn-text)">validate</text>
		<rect x="424" y="44" width="70" height="32" rx="7" fill="var(--mn-bg-subtle)" stroke="var(--mn-accent)"/>
		<text x="459" y="60" text-anchor="middle" font-size="10" fill="var(--mn-text)">retry /</text>
		<text x="459" y="72" text-anchor="middle" font-size="10" fill="var(--mn-text)">fallback</text>
		<rect x="508" y="44" width="46" height="32" rx="7" fill="var(--mn-bg-subtle)" stroke="var(--mn-border)"/>
		<text x="531" y="64" text-anchor="middle" font-size="10" fill="var(--mn-text)">cost</text>
		<line x1="74" y1="60" x2="88" y2="60" stroke="var(--mn-text-secondary)" stroke-width="1.5" marker-end="url(#pparrow)"/>
		<line x1="160" y1="60" x2="174" y2="60" stroke="var(--mn-text-secondary)" stroke-width="1.5" marker-end="url(#pparrow)"/>
		<line x1="246" y1="60" x2="260" y2="60" stroke="var(--mn-text-secondary)" stroke-width="1.5" marker-end="url(#pparrow)"/>
		<line x1="322" y1="60" x2="336" y2="60" stroke="var(--mn-text-secondary)" stroke-width="1.5" marker-end="url(#pparrow)"/>
		<line x1="408" y1="60" x2="422" y2="60" stroke="var(--mn-text-secondary)" stroke-width="1.5" marker-end="url(#pparrow)"/>
		<line x1="494" y1="60" x2="506" y2="60" stroke="var(--mn-text-secondary)" stroke-width="1.5" marker-end="url(#pparrow)"/>
		<line x1="459" y1="76" x2="292" y2="76" stroke="var(--mn-border)" stroke-width="1" stroke-dasharray="3 3" marker-end="url(#pparrow)"/>
	</svg>
	<figcaption class="md">The pipeline. A query is routed to the right model, filtered in, answered, filtered out, and checked; if it fails, the retry/fallback loop re-enters the model (dashed) with a different choice; every call is metered. Each box is a service with its own failure mode.</figcaption>
</figure>
</div>

<div class="md">
## The router: pick the model per query

The cheapest and highest-leverage service is the **router**. Not every query needs the biggest, most expensive model. A simple "what's the weather?" needs a small, fast model; a multi-step reasoning task needs a large one; a domain question needs a specialized or fine-tuned one. A router inspects the query and dispatches it — for **cost, quality, and latency** at once — and the common pattern is **cheap-then-escalate**: answer with a small model, and only if it signals low confidence (or the query classifies as hard) do you *escalate* to the big one. \cite[Ong et al., RouteLLM (2024)]{routellm2024} make this concrete: a lightweight learner, trained on preference data, predicts which model a query needs, and routes the easy ones to the small model — saving the large model's cost on the queries it was never going to beat anyway.

Routing is the first place the "the model is a component" reframe pays off: you are not *using* a model, you are *scheduling work across models*, exactly as a system schedules work across machines.
</div>

<div class="md">
## Guardrails: enforced layers, not prompts

A guardrail is a check that runs **outside** the model, on its input or its output, that the model itself does not enforce. Input guardrails screen the query (is it in scope? does it contain PII you are not allowed to process? is it a prompt-injection attempt?). Output guardrails screen the answer (does it actually answer the question? does it contain a prohibited claim or a leaked secret? does it match the required format?). The key word is **enforced**: a guardrail is a *layer* the answer must pass, not a line in the system prompt asking the model to "please be careful." A prompt is a *request* to a stochastic component; a guardrail is a *gate* in the deterministic system. \cite[Rebedea et al., NeMo Guardrails (2023)]{nemocguardrails} is the canonical framing of guardrails as programmable, checkable "rails" the model's output must follow — safety, factuality, format, and scope as *checks*, not *advice*.

This is the same move as the entire course: you do not *trust* the stochastic part to do the thing you need; you *check* it. Guardrails are the deterministic system's way of holding the model to a contract the model alone would not keep.
</div>

<div class="md">
## The tool-calling schema: a specification the model fills

When the model can act — read a file, call an API, run a function — the interface is a **schema**: a JSON description of the available tools, their arguments, and their types. The model does not "use the tool"; it *fills in the schema* — it emits a structured call (function name + arguments) that the *system* validates and executes. This is the [tool use](agents.php) half, but the architectural point is that the schema is a **specification**: a typed contract between a stochastic emitter (the model) and a deterministic executor (your code). The executor does not trust the emitted arguments; it *validates* them against the schema, and if the arguments are malformed or out of range, it rejects them and re-prompts. The model proposes; the schema disposes. The [ReAct](react2022) pattern \cite[Yao et al., 2022]{react2022} — reason, act, observe, repeat — is the loop this runs in, but the *contract* is the schema, and a schema is exactly the kind of written, checkable standard the [evaluation](evaluation.php) chapter keeps coming back to.
</div>

<div class="md">
## Retry, fallback, and degradation: determinism is built, not had

Because the component is non-deterministic, the system must handle its failures *explicitly*, the way a distributed system handles a flaky dependency:

* **Retry with backoff.** A malformed call, a truncated output, a rate-limit error — retry, with a backoff, before giving up. Some failures are transient (a hiccup in the API); some are structural (the model keeps producing an out-of-schema answer), and those are not fixed by retrying — they are the guardrail's job to catch.
* **Fallback.** If the primary model fails or is too slow, fall back to a secondary model (a different provider, or a smaller/cheaper model of the same capability class). The product defines what "fallback" *means* — a degraded answer is acceptable, a wrong answer is not — and that definition is a product decision, not a model property.
* **Degradation and the all-down case.** What does the product do when *every* model is unavailable? A cached answer, a canned response, an honest "I can't do that right now" — one of these, *decided in advance*. A system with no defined behavior for total failure is not a system; it is a model with a network cable.

The through-line: **determinism is a property you build, not one the model has.** The model gives you a distribution; the pipeline collapses it to a single, checkable, recoverable outcome. The reliability the user experiences is engineered around the model, not supplied by it.
</div>

<div class="md">
## Observability and cost: the two things you cannot do without

Two services are not optional; without them the pipeline is blind.

**Observability** is the record of *every call*: the prompt, the completion, the tokens in and out, the latency, which model it was routed to, which guardrail fired, whether it retried. \cite[OpenTelemetry GenAI (CNCF)]{otelgenai} standardizes exactly this — the GenAI semantic conventions for tracing LLM calls — so that an LLM product has logs, metrics, and *traces* the way any other service does. The reason it matters is the shape of the failures: an LLM product fails **one in two hundred** requests, not one in a thousand. You cannot debug a failure you cannot *reproduce by name* — and the only way to find the 1-in-200 is to have logged the exact prompt that produced the bad answer. Observability is what makes a probabilistic system *debuggable* at all.

**Cost tracking** is the per-request and per-user accounting of tokens (which is where the money is — see [The economic layer](ai_economics)). It is a first-class feature, not an afterthought, because the pipeline *creates* the cost: routing decides which model's price applies, retries multiply the cost of a call, and fallbacks change the cost profile. Without per-user accounting you cannot answer the only question a business asks — *"what did this customer's usage actually cost us?"* — and a product that cannot answer it is a liability, not a product.

> A model is a component. A product is a deterministic system that *schedules* a stochastic component (routing), *checks* it (guardrails), *contracts* with it (schemas), *recovers* from its failures (retry, fallback, degradation), and *sees* and *prices* everything it does (observability, cost). The model is the only box in the diagram you did not design; every other box you did. That is the whole discipline, and it is why "it works in the notebook" and "it works in production" are two different sentences.
</div>
