# Was inhaltlich falsch oder zu stark war, und was ich korrigiert habe

Diese Notiz gehört zur Lektion `transformer.php`. Geprüft wurde die interaktive Demo gegen den Quellcode von DeepSeek-V3/V2, Qwen2.5/Qwen3, Llama 3, Mistral, Gemma, GPT-2 und nanoGPT. Der Quellcode lag während der Prüfung unter `/tmp/opencode/llm_sources/`; die Datei hier hält die Ergebnisse fest.

## Geprüfte Quellen

- DeepSeek-V3: `inference/model.py` (RMSNorm, MLA, SwiGLU, MoE, RoPE, Block, finale Norm, separater Head)
- DeepSeek-V2
- Qwen2/Qwen2.5: `modeling_qwen2.py` (GQA, SwiGLU, RMSNorm, RoPE, QKV-Bias)
- Qwen3: `modeling_qwen3.py` (GQA, QK-RMSNorm, SwiGLU, RMSNorm, RoPE)
- Llama 3: `models/llama3/model.py` und HF `modeling_llama.py` (GQA, SwiGLU, RMSNorm, RoPE)
- Mistral: `transformer_layers.py`, `transformer.py`
- Gemma
- GPT-2: `src/model.py` (gelernte absolute Positionen, LayerNorm, GELU, MHA, Biases, geteilter Head)
- nanoGPT: `model.py`

## Korrekturen an der Lektion

1. **Hyperparameter-Anzahl:** „This demo exposes four of them“ war falsch, weil zusätzlich `d_ff` einstellbar ist. Jetzt: vier Kern-Hyperparameter plus FFN-Breite.
2. **Tokenizer:** „The tokenizer is a separate program trained before the model“ war für die Demo falsch. Jetzt: echte LLMs trainieren einen separaten Tokenizer; die Demo nutzt einen einfachen Wort-Splitter.
3. **Positional Encoding:** Die Demo nutzt sinusoidale absolute PE, GPT-2 gelernte Positionsvektoren, moderne Modelle RoPE. Das steht jetzt ausdrücklich dabei. Die relative-Positions-Aussage ist entschärft: Sinus/Cosinus allein garantiert keine positionsinvariante Attention; das hängt von den gelernten `W_Q`, `W_K` ab.
4. **Embedding-/Positions-Skala:** Die Behauptung, das Modell lerne automatisch, Embeddings viel größer als Positionen zu skalieren, war zu stark. Pre-LN normalisiert ohnehin; die Aussage ist jetzt differenziert.
5. **Residual Stream / Information Bottleneck:** Die Formulierung klang wie ein bewiesener IB-Mechanismus. Jetzt ausdrücklich: Analogie, kein Theorem; die IB ist ein separates informationstheoretisches Framework.
6. **Mesa-Optimizer:** „A trained Transformer runs gradient descent inside its forward pass“ war zu allgemein. Jetzt: Der von-Oswald-Befund gilt für lineare Self-Attention in einem vereinfachten Setting; das ist eine Linse auf In-Context Learning, keine wörtliche Aussage über jedes LLM.
7. **Geschlossene Modelle:** „same structural family as GPT, Claude, Gemini“ war zu freizügig. Jetzt: GPT-Stil-Familie; die genauen Blöcke von GPT-4, Claude und Gemini sind nicht öffentlich.
8. **Unembedding:** „every vocabulary embedding“ war generisch falsch, wenn der Output-Head nicht geteilt ist. Jetzt: „jede Zeile der Unembedding-Matrix“. Zusätzlich steht dabei, dass GPT-2 und die Demo den Head teilen, Qwen2.5/Qwen3, Llama und DeepSeek dagegen einen separaten Head haben.
9. **Finale Normalisierung:** Die Demo nutzt `h_last` direkt. Produktionsmodelle setzen davor eine finale Norm; GPT-2 LayerNorm, Llama/Qwen/DeepSeek RMSNorm. Das steht jetzt an der Unembedding-Stelle und im Modern-Block.
10. **Top-p:** Die Demo hat Top-k, nicht Top-p. Die Tabelle sagt jetzt Top-k; Top-p ist nur als verbreitete Alternative genannt.
11. **Llama-Angaben:** „LLaMA uses d_model=4096, d_ff=11008“ ist speziell Llama 2 7B. Jetzt so benannt; Qwen/DeepSeek weichen bei den Breiten ab.
12. **Bias/QK-Norm:** Ergänzt: GPT-2 und Qwen2 haben Q/K/V-Biases; Llama, Qwen3 und DeepSeek nicht; Qwen3 normiert Q und K zusätzlich pro Head; moderne SwiGLU-FFNs sind bias-frei.
13. **Code-Tabs:** „that exact structure“ war falsch. Die Tabs folgen nanoGPT: gelernte Positionstabelle, finale LayerNorm, separater `lm_head`; die reine Python-Version nutzt nur einen Head. Die Demo nutzt dagegen sinusoidale PE, keine finale Norm und einen getiedeten Output. Das steht jetzt klar in der Einleitung und in den Docstrings.
14. **Gradienten-/Residual-Überclaim:** „residual connections prevent explosion regardless of depth“ ist zu stark. Jetzt: Identitätspfad hilft, aber `I + J_F` kann weiterhin verstärken.
15. **Induction Heads:** „primary mechanism behind instruction following“ war überzogen. Jetzt: ein wichtiger Mechanismus für In-Context-Pattern-Completion, nicht die ganze Erklärung.
16. **Veralteter 0.1-Skalierungstext:** entfernt; die Demo nutzt 1.0.
17. **Metrik-Erklärung:** „final LayerNorm“ bzw. „LayerNorm normalizes“ ist jetzt „finale Normalisierung (LayerNorm oder RMSNorm)“ bzw. „hier LayerNorm, in vielen modernen Modellen RMSNorm“.

## Was die Demo bewusst anders macht

- Wort-/Zeichen-Splitter statt byte-level BPE.
- Sinusoidale absolute PE statt RoPE (DeepSeek/Qwen/Llama/Mistral/Gemma) oder gelernten absoluten Positionen (GPT-2/nanoGPT).
- LayerNorm mit Mittelwert/Gamma/Beta statt RMSNorm.
- MHA mit eigenen K/V-Heads statt GQA (Qwen/Llama/Mistral) oder MLA (DeepSeek).
- Dichtes GELU-FFN mit Biases statt SwiGLU ohne Biases und ohne MoE.
- Keine finale Norm, getiedeter Output-Head statt finaler RMSNorm/LayerNorm und separatem Head.
- Winzige Einzelsequenz, kein AdamW/Schedule/Weight Decay/Mixed Precision/verteiltes Training.
- Die Code-Tabs folgen nanoGPT und sind nicht byte-identisch mit der interaktiven Demo.

## Was die Demo trotzdem ernst nimmt

Die Rechenreihenfolge ist korrekt: Token-Embedding, Positionssignal, Pre-LN, kausale Multi-Head-Attention mit `1/sqrt(d_k)`, Residual, Pre-LN, FFN mit Nichtlinearität, Residual, Unembedding, Softmax und Next-Token-Cross-Entropy. Die Vereinfachungen ändern die Größe und einige moderne Bausteine, nicht die grundlegende Rechenkette. Deshalb ist die Seite als didaktischer Simulator ernst zu nehmen, aber nicht als Beweis über das Innere eines Frontier-LLMs.

## Validierung

- `transformer_ui2_regression_test.py`: 57/57
- `transformer_fix_regression_test.py`: 36/36
- `python3 blog/tools/check_all.py`: alle Stages PASS
- `php_render_validator.py` für `transformer.php` und `tenminutes/transformer.php`: PASS, 0 JS-Fehler, 0 unrendered LaTeX, 0 Breiten-Overflow
- Fact-/Statement-Ledger: PASS

Die optionalen Interpretability-Absätze (Safety Heads, TDA, Length Planning usw.) wurden auf offensichtliche Overclaims geprüft, aber nicht jede dort zitierte Paper-Passage neu gelesen. Die Architektur- und Rechenbehauptungen der Implementierung wurden gegen den oben genannten Modellcode geprüft.
