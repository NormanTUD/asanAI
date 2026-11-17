# Reader roles & visual answers

Roles: **L** interested layperson · **P** programmer · **F** ML practitioner · **E** interpretability researcher · **Prof** teacher · **S** sceptic.
Status: `[vis]` the visual/interaction answers it directly; `[txt]` prose/box answers it; `[gap]` still weak.

## 1. Unembedding — “Ähnliche Worte finden”

1. Are words points or directions? — **L/P/Prof** `[vis]` direction fan, “Wörter sind Richtungen”.
2. Why do far-apart points count as similar? — **L/F/S** `[vis]` scale view: same ray, different length, angle 0°.
3. Where is `W_U`? — **P/F** `[txt]` box + formula `z = W_U h`.
4. How does a vector become a word? — **L/P** `[vis]` unembed mode: rays → probabilities.
5. What is `h`? — **F/E** `[txt]` box; `[vis]` highlighted query ray.
6. Why the smallest angle wins? — **L/P** `[vis]` angle arc + sorted list.
7. What does “cosine” mean here? — **P/F** `[vis]` angle + cos readout.
8. Why not Euclidean distance? — **L/S** `[vis]` scale view + text caveat.
9. Is 100 % a probability? — **L/S** `[txt]` “cosine similarity, not probability”.
10. What if I pick another word? — **L/P** `[vis]` word selector/click ray.
11. Why can opposites be close? — **S** `[txt]` context similarity caveat.
12. Is the 2D fan the real geometry? — **F/E** `[txt]` projection caveat.
13. How many dimensions? — **P/F** `[txt]` “512” / real GPT-2 768.
14. What is the length of a token vector? — **P** `[vis]` scale slider.
15. Does the model use this direction causally? — **E/S** `[txt]` probe vs intervention caveat.
16. Why is the same word far away in the list? — **L** `[vis]` angle list; `[gap]` maybe add a sort explanation.
17. What happens at 0°? — **L/P** `[vis]` scale view.
18. What happens at 180°? — **P/F** `[vis]` angle slider.
19. Can two different words share a direction? — **F/E** `[txt]` superposition caveat.
20. Is the fan trained or hand-made? — **S** `[txt]` directions are learned.

## 2. Sentiment / ITI — “Bedeutung als Richtung”

1. Where is “good” in the model? — **L/Prof** `[vis]` golden sentiment axis.
2. Can I move the activation? — **L/P** `[vis]` direction slider.
3. What does the projection number mean? — **P/F** `[vis]` pill + slider.
4. What happens when I add `w`? — **L/P** `[vis]` steering mode + review card.
5. Why is the continuation negative/positive? — **L** `[vis]` card flips with α.
6. What is α? — **P/F** `[vis]` slider + formula `x' = x + αw`.
7. Is this the same as fine-tuning? — **F/S** `[txt]` no, inference-time state shift.
8. How strong is the effect? — **F/E** `[txt]` 76 % of above-chance SST accuracy.
9. What does ablation do? — **E** `[txt]` readout; `[gap]` no visual ablation bar.
10. What is ITI? — **L/F** `[vis]` head grid + nudge.
11. Which heads are selected? — **P/F** `[vis]` highlighted head cells, K=48.
12. What is `ασw`? — **P/F** `[vis]` formula/caption; `[vis]` nudge.
13. What happens to truthfulness? — **L/F** `[vis]` 32.5 % → 65.1 % bar.
14. Is truthfulness solved? — **S** `[txt]` narrow benchmark + trade-off caveat.
15. Why does helpfulness drop? — **F/S** `[txt]` inverted-U / refusals caveat.
16. Is sentiment one direction or many? — **E/S** `[txt]` approximation caveat.
17. Does the model use the direction causally? — **E** `[txt]` patching/ablation evidence.
18. Why does the sign flip the meaning? — **L** `[vis]` axis + card.
19. What is the difference to a classifier? — **P/F** `[txt]` same linear readout, but used for intervention.
20. Can I see the projection formula? — **P** `[vis]` formula in the canvas / boxes.

## 3. Induction heads — “A B … A → B”

1. What does the head look at? — **L/Prof** `[vis]` attention arc.
2. Why the earlier B and not the current A? — **L/P** `[vis]` clickable tokens, note line.
3. What if there is no earlier A? — **L/S** `[vis]` click A0: uniform, “keine Induktion”.
4. What if I click B? — **L/P** `[vis]` click B: predicts C.
5. Is this a lookup table? — **F/E** `[txt]` rule, not table; click other tokens.
6. Why two layers? — **F/E** `[vis]` circuit diagram.
7. What is the previous-token head? — **P/F** `[vis]` layer-1 node/label.
8. What is K-composition? — **E** `[vis]` key-shift label; `[txt]` box.
9. What is the OV copy? — **P/F** `[vis]` copy arrow.
10. How does the next-token bar change? — **L** `[vis]` click tokens changes bars.
11. When do induction heads appear? — **L/F** `[vis]` phase-change plot.
12. What is the phase change? — **L/F** `[vis]` shaded window + curves.
13. Why does loss bump? — **F/E** `[vis]` small bump in emergence plot.
14. Does this explain all in-context learning? — **S/E** `[txt]` small models strongest, large models circumstantial.
15. Are the numbers exact? — **S** `[vis]` “schematisch”; text caveat.
16. What is the ICL score? — **F** `[txt]` 50th/500th-token heuristic.
17. Why is the head in the last layer? — **E** `[txt]` small attention-only models; architecture-dependent.
18. Can I see the two heads? — **L/P** `[vis]` circuit view.
19. Does the head copy meaning? — **S** `[txt]` copies tokens/patterns, not semantics.
20. What is the evidence? — **E** `[txt]` co-occurrence, ablation, architecture intervention.

## 4. Grokking — “Warum plötzlich generalisieren?”

1. When does test loss drop? — **L/Prof** `[vis]` loss curve + scrubber.
2. What happens before the drop? — **L/F** `[vis]` scrub through phases.
3. What are the three phases? — **L/F** `[vis]` shaded bands + scrub label.
4. What is memorization? — **L** `[vis]` early phase band.
5. What is circuit formation? — **F** `[vis]` middle band + measures.
6. What is cleanup? — **F** `[vis]` late band + Gini.
7. Why does the model suddenly generalize? — **L/F** `[vis]` circuit formed before test drop.
8. What is learned? — **L/F** `[vis]` Fourier spectrum + angle circle.
9. Why those five frequencies? — **E** `[txt]` learned with weight decay; not hand-coded.
10. What is restricted loss? — **F/E** `[vis]` falls early; label.
11. What is excluded loss? — **F/E** `[vis]` rises during circuit formation; label.
12. Why does excluded loss rise? — **E** `[txt]` memorizing solution spreads across Fourier space.
13. What does Gini show? — **F/E** `[vis]` shifts late.
14. What does the scrubber show? — **L** `[vis]` epoch + phase label + vertical line.
15. Is the curve exact? — **S** `[vis]` “schematisch · Hauptlauf P=113”.
16. What is P? — **P/F** `[txt]` modulus 113.
17. How much data? — **F** `[txt]` 30 % of pairs.
18. Is grokking universal? — **S/E** `[txt]` one task/circuit; task-specific measures.
19. Why does weight decay matter? — **E** `[txt]` no grokking without regularization.
20. Can I see the Fourier identity? — **P/F** `[vis]` angle circle + box formula.

## 5. Space & Time — “Wo liegt Paris?”

1. Where is Paris? — **L/Prof** `[vis]` world map + click Paris.
2. How accurate is the probe? — **F/S** `[vis]` R² card + true/probe readout.
3. Why is the prediction not exact? — **L/S** `[vis]` two coordinate lines.
4. What is the probe reading? — **P/F** `[vis]` `w · x → lat/lon`; formula box.
5. What is the activation? — **F** `[txt]` layer-50 residual stream; box.
6. Can I click another city? — **L/P** `[vis]` clickable cities.
7. What about time? — **L/Prof** `[vis]` time mode + click person.
8. How accurate is time? — **F/S** `[vis]` R² = 0.835 + Δ.
9. What is a space neuron? — **L/F** `[vis]` neuron heatmap + click row.
10. What is a time neuron? — **L/F** `[vis]` gold rows.
11. Are neurons causal? — **E/S** `[txt]` lower bound; decodable ≠ causal.
12. Is the map absolute? — **S/E** `[txt]` relative geometry; probe supplies absolute mapping.
13. What is the original paper figure? — **L/Prof** `[vis]` credited paper inset.
14. Can I enlarge the paper figure? — **L/P** `[vis]` click inset.
15. Is the map a real atlas? — **S** `[txt]` projection of learned directions.
16. Why R² and not accuracy? — **F** `[txt]` continuous coordinates.
17. What are the axes? — **P** `[vis]` lat/lon grid + year diagonal.
18. Why is NYC weaker? — **E** `[txt]` dataset; not visual.
19. Does prompting change it? — **F/E** `[txt]` prompt sensitivity caveat.
20. Can I see the probe direction? — **P/F** `[vis]` `w` arrow in neurons view.

## High-value interactions now in place

- Unembedding: word select + angle/scale/unembed tabs.
- Sentiment: projection slider, steering slider, ITI nudge.
- Induction: click any token; arc/prediction/note update.
- Grokking: drag the epoch scrubber; phase label and measures update.
- Space/time: click cities, historical figures, or neuron rows; paper figure inset.
