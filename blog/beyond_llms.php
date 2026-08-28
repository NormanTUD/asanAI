<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: Beyond LLMs — The Wider World of Algorithms & Models
description: The Wake-Sleep algorithm, clustering, classical ML, Bayesian methods, evolutionary search, symbolic reasoning, and dozens of other model families that LLM-centric writing tends to forget.
icon: &#127757;
part: 6
order: 40
color: accent
topics: architecture, training, programming, math-i, math-ii, math-iii, statistics-i, statistics-ii, history, philosophy
-->

<div class="md">
This course is centred on large language models. The Transformer chapter is its gravitational core, and the chapters on attention, embeddings, fine-tuning, agents, and reasoning all radiate outwards from it. That is a useful vantage point — but it is also a dangerously narrow one. The implicit message of an LLM-centric curriculum is that *the* interesting question in machine learning is "how does a Transformer get better at next-token prediction?" and that every other model in the history of the field is either a primitive ancestor of the LLM or an irrelevant sideshow.

Nothing could be further from the truth. Machine learning in 2026 is a thick rainforest of ideas, most of which never touch a Transformer. Some are older than the field itself (linear regression is from the nineteenth century). Some are younger than the Transformer (Gaussian-process methods, normalizing flows, equivariant networks, diffusion models). Most are *neighbours* of the LLM rather than ancestors: they live next door, share hallways with the Transformer, and were developed by overlapping research communities. The LLM is the loudest voice in the room, not the only voice.

This chapter is a tour of the other voices. The tour starts with one algorithm that is, in spirit, the LLM's mirror image: the **Wake-Sleep Algorithm** of Hinton, Dayan, Frey and Neal — a deep generative model that is trained *without ever passing an error signal through the data likelihood*, the structural opposite of what an LLM does. From there the tour broadens into clustering, classical supervised learning, Bayesian inference, evolutionary search, symbolic reasoning, recommender systems, time-series models, anomaly detection, graph methods, dimensionality reduction, spiking networks, topological methods, causal inference, and a few smaller corners. Almost every section is the birthplace of at least one of the algorithms you have heard of, and most contain families of methods that are still the state of the art on problems where LLMs are *not* the right tool.
</div>

<div class="md">
## The bias to fix

Before we begin, a confession. This chapter is unusual for the course in that it has *no central equation to derive*. The reason is that the algorithms here are not a single technique with variations; they are a *family of techniques* drawn from a dozen fields, and the only thing that unites them is that they all learn something from data without being an autoregressive language model. The deep takeaway is therefore structural, not technical: the space of learnable models is enormous, every corner of it has working algorithms, and the right choice of algorithm depends almost entirely on what kind of data you have, what kind of answer you want, and what kind of error you can tolerate.

The second takeaway is that **clustering alone** — just the part of this chapter devoted to unsupervised grouping — has more high-quality algorithms than the entire literature on autoregressive language modelling before 2017. That is not a put-down of LLMs. It is a calibration.
</div>

<div class="md">
## The Wake-Sleep Algorithm and the other way to learn a generative model

The chapters on this course describe, in detail, how a Transformer is trained. The story is: define a likelihood (next-token prediction), compute a gradient through the network (backpropagation), and update the weights. The model is a *discriminative* mapping from input to output, and the training signal is supervised: every token has a ground-truth label.

Long before that recipe was popular, \citeauthor{hinton1995wakesleep} asked a more ambitious question. Suppose you have a complex high-dimensional signal (an image, a speech waveform, a sentence), and you would like to build a model that can *generate* new samples from the same distribution. You do not have labels for "this is image number 7". You only have the raw data, and a wish. What learning signal could possibly let you train a deep generative model to do this?

The answer they gave in \citeyear{hinton1995wakesleep}, in \citetitle{hinton1995wakesleep}, has the elegance of an old joke. There are two networks: a **recognition** network that maps data to latent variables (a bottom-up encoder), and a **generative** network that maps latent variables to data (a top-down decoder). At night, when the brain is "sleeping", you train the recognition network by sampling latent variables from the generative network and asking the recognition network to recover them. In the morning, when the brain is "awake", you train the generative network by sampling latent variables from the recognition network running on real data and asking the generative network to reconstruct the data. Then you go back to sleep, and the cycle repeats. Hence the name.
</div>

<div class="md">
### The Helmholtz machine

The Wake-Sleep algorithm trains a **Helmholtz machine** \cite{hinton1995wakesleep}, a stochastic neural network with two complementary halves:

* The **generative model** $p(\mathbf{x}, \mathbf{h}) = p(\mathbf{h})\, p(\mathbf{x} \mid \mathbf{h})$ factorises top-down. A latent code $\mathbf{h}$ is sampled from a prior, and the data $\mathbf{x}$ is generated from the conditional.
* The **recognition model** $q(\mathbf{h} \mid \mathbf{x})$ is a bottom-up stochastic mapping that proposes a latent code for any input.

Both networks are deep and stochastic — typically sigmoid belief units whose outputs are binary masks sampled from Bernoulli distributions parameterised by the network's activations.

The architecture looks, at first glance, like a variational autoencoder \cite{kingma2014vae}. It is not: variational autoencoders train both networks by maximising a single variational lower bound, and they require a Gaussian latent space with a tractable KL-divergence term. Helmholtz machines are wilder: the latent variables are binary, the prior can be anything, and the two networks are trained by *two different objectives that don't share a likelihood at all*.
</div>

<div class="md">
### The two phases

**Wake phase.** Real data $x$ is clamped at the bottom. The recognition network samples a latent code $h_w$ from the bottom-up posterior

$$
\underbrace{h_w}_{\text{latent during wake}} \;\sim\; \underbrace{q(h \mid x)}_{\text{recognition network's belief about } h \text{ given } x}.
$$

The generative network is then trained, by maximum likelihood, to reconstruct $x$ from $h_w$:

$$
\underbrace{\Delta \theta_{\text{gen}}}_{\text{update to generative weights}} \;=\; \underbrace{\eta}_{\text{learning rate}} \cdot \underbrace{\nabla_{\theta_{\text{gen}}} \log p_{\theta_{\text{gen}}}(x \mid h_w)}_{\text{gradient of reconstruction likelihood}}.
$$

Intuitively: *"I see this thing. Here is the latent code I would assign to it. Now teach the bottom-up world to produce it from that code."* This is the easy direction. The gradient is a clean maximum-likelihood update on the generative weights.

**Sleep phase.** Latent variables are sampled from the generative model's prior

$$
\underbrace{h_s}_{\text{latent during sleep}} \;\sim\; \underbrace{p(h)}_{\text{the generative network's prior on latents}}.
$$

The generative network then synthesises a *fake* data vector

$$
\underbrace{\tilde{x}}_{\text{a dreamt image / sound / sentence}} \;\sim\; \underbrace{p(x \mid h_s)}_{\text{generative network imagining } x \text{ from } h_s}.
$$

The recognition network is then trained, again by maximum likelihood, to recover $h_s$ from $\tilde{x}$:

$$
\underbrace{\Delta \theta_{\text{rec}}}_{\text{update to recognition weights}} \;=\; \eta \cdot \underbrace{\nabla_{\theta_{\text{rec}}} \log q_{\theta_{\text{rec}}}(h_s \mid \tilde{x})}_{\text{gradient that pushes } q(\cdot \mid \tilde{x}) \text{ to put mass on } h_s}.
$$

Intuitively: *"Imagine something. Now teach the bottom-up world to recognise it when it sees it again."* This is the unsupervised direction. The gradient is again a clean maximum-likelihood update, this time on the recognition weights.

The algorithm is the literal definition of a *self-supervised* learning loop, half a decade before the term was coined. The data and the labels come from the same model, in alternation. Each iteration touches every weight in the system; neither phase ever needs a human label.
</div>

<div class="md">
### Why it is fascinating and why it fell out of fashion

The Wake-Sleep algorithm is fascinating because it shows that **backpropagation is not the only learning signal**. Both phases use local gradient updates. Neither phase requires a labelled dataset. Neither phase needs the joint distribution to be tractable. The whole procedure is a *bootstrap*: the recognition model learns to invert the generative model, and the generative model learns to be invertible by the recognition model.

It fell out of fashion for three reasons:

1. **The modes problem.** The wake-phase update is biased: it trains the generative network to reconstruct data given a *recognition* sample of the latent, but the recognition distribution $q$ is not the true posterior $p(\mathbf{h} \mid \mathbf{x})$. When $q$ and $p$ disagree, the generative network is trained on the wrong targets. With deep stochastic networks, this bias can collapse entire modes of the data distribution. Hinton's student Radford Neal analysed the bias formally \cite{neal1998wake}, and later work showed it can be reduced by reweighted wake-sleep updates \cite{bornschein2014reweighted}.
2. **Variational autoencoders.** \citeauthor{kingma2014vae}'s VAE \cite{kingma2014vae} replaced the wake-sleep objective with a clean variational bound. The VAE is biased too, but in a much more controllable way: the bias is one KL-divergence, and you can shrink it by making the recognition model more flexible. Wake-Sleep never had an analogue of that knob.
3. **Normalising flows, GANs, diffusion.** The next decade brought wave after wave of new generative-model families — normalising flows \cite{dinh2017realnvp}, GANs \cite{goodfellow2014gan}, diffusion models \cite{ho2020ddpm} — each with its own training signal, each cleaner than Wake-Sleep's alternating phase.

But Wake-Sleep's spirit is everywhere. Self-supervised pretraining \cite{devlin2019bert}, contrastive learning \cite{chen2020simclr}, denoising autoencoders \cite{vincent2008dae}, and the masked-token prediction that trains GPT \cite{radford2019language} are all, in different costumes, "generate one half of the data from the other half and train the inverse mapping". The recipe outlived its first incarnation.
</div>

<div class="md">
### A worked picture

$$
\underbrace{
\begin{array}{|l|c|c|}
\hline
\textbf{Phase} & \textbf{Clamped input} & \textbf{Optimised network} \\
\hline
\text{Wake} & x \sim p_{\text{data}} & \text{Generative } p(x \mid h) \text{ from } h_w \sim q(h \mid x) \\
\hline
\text{Sleep} & h_s \sim p(h) & \text{Recognition } q(h \mid x) \text{ from } \tilde{x} \sim p(x \mid h_s) \\
\hline
\end{array}
}_{\text{two maximum-likelihood updates, one per network, no global likelihood}}
$$

That is the entire algorithm. And it is worth lingering on the fact that this was the state of the art in deep generative modelling roughly a quarter-century before the Transformer paper.
</div>

<div class="optional md" data-headline="The Hel(m)holtz in the name">
The "Helmholtz machine" is named after \citeauthor{helmholtz1867handbook}'s \citetitle{helmholtz1867handbook}, which argued that perception is *unconscious inference* — the brain, given a retinal image, must somehow invert the physical process that produced the image to recover the world that caused it. Helmholtz had no formal model, but the philosophical claim — that perception is the inversion of generation — is exactly what a generative-recognition pair attempts to formalise. The Wake-Sleep algorithm is, in a sense, the only consistent machine-learning formulation of Helmholtz's century-old intuition that does not require you to compute the inverse in closed form.
</div>

<div class="md">
## Clustering — the other unsupervised learning

The previous chapters treat unsupervised learning as the poor cousin of language modelling. In fact, **clustering** is one of the oldest, most-used, and most theoretically interesting problems in machine learning. Every year, every scientific field, every business produces datasets whose first exploratory step is: *how do these points group together?* The answer is never "with a Transformer". It is always one of the classical algorithms in this section.
</div>

<div class="md">
### $k$-means: the workhorse

The $k$-means algorithm partitions $n$ points into $k$ clusters by minimising the within-cluster sum of squared distances to the centroid:

$$
\boxed{
\min_{\{S_i\}_{i=1}^{k}} \;\; \sum_{i=1}^{k} \sum_{\mathbf{x} \in S_i} \bigl\| \mathbf{x} - \boldsymbol{\mu}_i \bigr\|^2, \qquad \boldsymbol{\mu}_i = \tfrac{1}{|S_i|} \sum_{\mathbf{x} \in S_i} \mathbf{x}.
}
$$

The standard algorithm is **Lloyd's algorithm** \cite{lloyd1982kmeans}, first written down at Bell Labs for pulse-code modulation in 1957 and published as a journal article only in 1982. The two steps are:

1. **Assignment.** Put each point into the cluster whose centroid is closest.
2. **Update.** Recompute each centroid as the mean of its assigned points.

The two steps alternate until convergence. Lloyd's algorithm is essentially an **Expectation–Maximisation** procedure for a Gaussian mixture model in which all cluster covariances are tied to the identity and all mixing weights are equal — a relationship made explicit in \citeauthor{lloyd1982kmeans}'s analysis and in many textbooks since.

The history of the idea is older than Lloyd. \citeauthor{steinhaus1957division} (\citeyear{steinhaus1957division}) described an equivalent partition in a Polish mathematical journal; the term "$k$-means" itself comes from \citeauthor{macqueen1967kmeans} (\citeyear{macqueen1967kmeans}), who also gave the first formal convergence proof. \citeauthor{forgy1965kmeans} published an essentially identical method in 1965, which is why some references call the algorithm Lloyd–Forgy. A more recent improvement, **$k$-means++** \cite{arthur2007kmeanspp}, gives a probabilistic seeding rule that yields an $O(\log k)$ approximation guarantee on the WCSS, and is the default in scikit-learn and most modern libraries.

$k$-means is NP-hard in general \cite{aloise2009np}, but converges in expected polynomial time under mild distributional assumptions \cite{arthur2011smoothed}, and in practice terminates in a handful of iterations on real data. Its weakness is that it only finds *convex, equal-volume* clusters. Two interleaving crescents will defeat it; a thin arc inside a fat disc will defeat it; any cluster whose centroid is not representative of its members will defeat it. The algorithms below were invented precisely to fix these failures.
</div>

<div class="md">
### Hierarchical clustering: the dendrogram

#### Why it was invented

In the 1960s, taxonomists, ecologists, and psychologists needed to build *nested* classifications of things. A non-hierarchical $k$-means partition says "these are the $k$ groups", but the taxonomists also wanted to know *which groups are similar to which other groups*. They needed a tree of similarities, not a flat list. \citeauthor{johnson1967hierarchical} (\citeyear{johnson1967hierarchical}), a psychometrician at Bell Labs, gave the first general algorithm; the modern bottom-up form was independently developed by \citeauthor{sibson1973slink} (\citeyear{sibson1973slink}) in the UK as **SLINK**, and the top-down form by \citeauthor{chavent1974divisive} (\citeyear{chavent1974divisive}) and others. The visualisation of the result — the **dendrogram** (Greek for "tree drawing") — is the central object of the field.

The classical uses were biological taxonomy ("which species are closely related?"), numerical ecology ("which plant communities co-occur in similar habitats?"), and document clustering in library science ("which books share subject headings?"). Every one of these problems came with a metric the user cared about, a budget on the number of clusters the user did *not* know in advance, and a need to inspect the *structure* of similarity, not just the flat partition.

#### The dendrogram

The output of agglomerative hierarchical clustering is a binary tree in which the leaves are the original data points and the internal nodes are merges. The height of an internal node is the dissimilarity at which the two children were merged:

$$
\underbrace{
\begin{array}{c}
\text{height}(u \vee v) \;=\; \underbrace{L(A_u, A_v)}_{\text{the chosen linkage applied to the two child clusters}}
\end{array}
}_{\text{dendrogram node height = dissimilarity at which the merge happened}}
$$

A *cut* at any horizontal height $h$ gives the flat partition in which every leaf-to-leaf path stays below $h$ entirely inside one cluster, and every merge above $h$ is between two different clusters. Different linkage criteria define $L(\cdot, \cdot)$ differently and therefore produce different dendrograms from the same data.

#### The four classical linkage rules

$$
\underbrace{
L(A, B) \;=\;
\begin{cases}
\displaystyle\min_{a \in A,\, b \in B} d(a, b) & \text{(single linkage)} \\[1.2em]
\displaystyle\max_{a \in A,\, b \in B} d(a, b) & \text{(complete linkage)} \\[1.2em]
\displaystyle\frac{1}{|A|\,|B|} \sum_{a \in A,\, b \in B} d(a, b) & \text{(average / UPGMA)} \\[1.6em]
\displaystyle\frac{|A|\,|B|}{|A \cup B|} \;\|\mu_A - \mu_B\|_2^2 & \text{(Ward's)}
\end{cases}
}_{\text{four ways of deciding "how far apart are two clusters?"}}
$$

* **Single linkage** uses the closest pair. Tends to produce long, stringy "chaining" clusters: if two clusters touch at a single pair of points, they get merged. Cheap to compute; great for detecting elongated filaments in images; bad for spherical clusters.
* **Complete linkage** uses the farthest pair. Tends to produce tight, equal-radius clusters; breaks long chains. Robust to noise but biased towards equal-sized clusters.
* **Average linkage (UPGMA)** averages over all pairs. A robust compromise that is the default in most libraries.
* **Ward's linkage** \cite{ward1963hierarchical} picks the merge that increases within-cluster variance the least, which is equivalent to merging the two centroids that are closest in squared-Euclidean distance. The most interpretable for tabular data; minimises the same loss as $k$-means at every merge.

#### Algorithm and complexity

The naive algorithm is $\mathcal{O}(n^3)$; with a heap it drops to $\mathcal{O}(n^2 \log n)$. **SLINK** \cite{sibson1973slink} and **CLINK** \cite{defays1977clink} achieve the optimal $\mathcal{O}(n^2)$ for single- and complete-linkage respectively. For the more interesting linkages (Ward's, average), the $\mathcal{O}(n^2 \log n)$ heap implementation is the production choice.

$$
\underbrace{
T(n) \;=\;
\begin{cases}
\mathcal{O}(n^2) & \text{(SLINK, CLINK)} \\
\mathcal{O}(n^2 \log n) & \text{(Ward's, UPGMA, with heap)} \\
\mathcal{O}(n^3) & \text{(naive, three nested loops)}
\end{cases}
}_{\text{hierarchical clustering complexity by linkage}}
$$

#### Where it lives now

Hierarchical clustering is the workhorse of **single-cell transcriptomics** — modern pipelines such as *Scanpy* cluster millions of cells into putative cell types by first reducing the dimensionality and then running Leiden or Louvain community detection \cite{traag2019louvain} on a $k$-nearest-neighbour graph, an idea that descends directly from the hierarchical clustering literature. It is also the default in **phylogenetics** (UPGMA trees are the literal output of the algorithm), in **cheminformatics** (hierarchical clustering of molecules by fingerprint similarity), and in **operational taxonomy** (clustering failures by root cause).

The divisive direction (top-down, starting from one cluster and recursively splitting) is much rarer in practice because the splitting criterion is hard to define; the divisive analogue of Ward's linkage has been studied by \citeauthor{chavent1974divisive} (\citeyear{chavent1974divisive}) and others.
</div>

<div class="md">
### DBSCAN: density-based, parameter-light

The **Density-Based Spatial Clustering of Applications with Noise** algorithm \cite{ester1996dbscan} takes a different angle: a cluster is a region of high point density, separated from other such regions by regions of low density, and points in low-density regions are noise. The user supplies two parameters, a radius $\varepsilon$ and a minimum neighbour count $\mathrm{minPts}$, and the algorithm classifies each point as:

* **Core:** has at least $\mathrm{minPts}$ points (including itself) within radius $\varepsilon$.
* **Border:** is reachable from a core point but does not itself have enough neighbours.
* **Noise:** neither.

Two core points within distance $\varepsilon$ of each other belong to the same cluster. The full algorithm expands clusters by following the density-reachable relation, which is transitive for core points but not for borders. Worst-case complexity $\mathcal{O}(n^2)$; with a spatial index, $\mathcal{O}(n \log n)$.

DBSCAN was awarded the **SIGKDD Test of Time Award in 2014** for being the most-cited data-mining algorithm in the world. Its virtues: it finds arbitrarily-shaped clusters (including crescents and rings that $k$-means cannot), it does not need the number of clusters as input, and it explicitly labels noise. Its limitations: it struggles when clusters have very different densities, and the $\varepsilon$ parameter has to be chosen carefully — typically by inspecting the "$k$-distance plot" for an elbow.

A revision, **HDBSCAN** \cite{campello2013hdbscan, campello2015hdbscan}, removes the $\varepsilon$ parameter entirely by computing a hierarchy of density estimates and extracting the most stable clusters. A further refinement, **DBSCAN Revisited, Revisited** \cite{schubert2017dbscan}, fixes a long-standing non-determinism in DBSCAN's handling of border points. These algorithms are the production choice for anomaly detection, geospatial clustering, and anywhere the number of clusters is genuinely unknown.
</div>

<div class="md">
### Expectation–Maximisation and Gaussian Mixture Models

The **EM algorithm** of \citeauthor{dempster1977em} (\citeyear{dempster1977em}) is one of the foundational tools of modern statistics. Given a probabilistic model with latent variables, EM alternates:

* **E-step:** compute the posterior distribution of the latent variables given the current parameters and the data.
* **M-step:** maximise the expected log-likelihood with respect to the parameters.

When applied to a mixture of Gaussians, EM becomes **Gaussian Mixture Modelling (GMM)**: each cluster is a full Gaussian with its own mean and covariance, and EM learns all of them jointly. GMM is the probabilistic parent of $k$-means: in the limit where all covariances are tied to a small multiple of the identity and all mixing weights are equal, GMM clustering reduces to $k$-means \cite{bishop2006prml}.

Dempster, Laird, and Rubin's 1977 paper was the consolidation, not the invention. The earliest version is the gene-counting algorithm of \citeauthor{smith1957counting} (\citeyear{smith1957counting}) for estimating allele frequencies; Hartley's 1958 H.O.M. algorithm generalised it; Sundberg and others developed the closed-form Sundberg formula for exponential families. \citeauthor{wu1983em} (\citeyear{wu1983em}) supplied the correct convergence proof that Dempster–Laird–Rubin had skipped. EM is one of the few statistical algorithms that is *the* canonical solution to a problem that almost every other statistical procedure is a special case of.
</div>

<div class="md">
### Spectral clustering, mean-shift, and the long tail

A handful of further clustering algorithms deserve a one-line each:

* **Mean-shift** \cite{fukunaga1975mean, comaniciu2002mean}: each point iteratively moves towards the local mode of a kernel density estimate; the basins of attraction of the modes are the clusters. Non-parametric; no $k$ needed; finds arbitrarily-shaped clusters; the kernel bandwidth is the only parameter.
* **Affinity Propagation** \cite{frey2007affprop}: each point is both an exemplar candidate and votes for good exemplars; the result is a small set of high-quality clusters. Useful when you don't know $k$ but have a similarity matrix.
* **Spectral clustering** \cite{vonluxburg2007tutorial}: build a similarity graph, take the eigenvectors of its Laplacian, and run $k$-means on the embedding. Equivalent, on normalised cuts, to a relaxation of the graph-partitioning problem \cite{shi2000normalized}.
* **OPTICS** \cite{ankerst1999optics}: a generalisation of DBSCAN that produces a reachability plot, from which clusters at any density level can be extracted. The right tool when DBSCAN's $\varepsilon$ is hard to set.
* **BIRCH** \cite{zhang1996birch}: a streaming algorithm that builds a CF-tree incrementally; designed for very large datasets that don't fit in memory.
* **Fuzzy $c$-means** \cite{dunn1973fuzzy, bezdek1981fcm}: each point has soft membership in every cluster. Useful when cluster boundaries are genuinely uncertain, e.g. in medical imaging.

Each of these has been the right tool for some important problem — spectral clustering on normalised cuts \cite{shi2000normalized} in image segmentation, affinity propagation for gene-expression data \cite{frey2007affprop}, OPTICS for astronomy \cite{ester1996dbscan}. Together they form a clustering *ecosystem* that no LLM can replace, because clustering is fundamentally about geometry, and geometry is not language.
</div>

<div class="md">
## Classical supervised learning — the algorithms that still win most tabular Kaggle competitions

The course has spent many chapters describing the Transformer. On real-world *tabular* data — the bread and butter of medical, financial, scientific, and industrial machine learning — Transformers are routinely beaten by algorithms that predate the field of deep learning. The state of the art on a representative Kaggle tabular benchmark in 2025 is a **gradient-boosted decision tree**, frequently LightGBM or XGBoost. The paper that introduced the technique is from 2001. The data structure it exploits — a feature matrix $\mathbf{X} \in \mathbb{R}^{n \times p}$ and a label vector $\mathbf{y}$ — predates machine learning itself.
</div>

<div class="md">
### Decision trees: $O(\log n)$ decisions per row

A **decision tree** partitions the feature space by axis-aligned splits and assigns a constant prediction to each cell of the resulting partition \cite{breiman1984cart,quinlan1986id3,quinlan1993c45}. The splits are chosen greedily to maximise some impurity reduction — information gain \cite{quinlan1986id3}, Gini impurity \cite{breiman1984cart}, or variance reduction \cite{breiman1984cart}.

The earliest learning-tree algorithms are from the statistics literature of the 1960s — the **AID** program of \citeauthor{morgan1963aid} (\citeyear{morgan1963aid}) and the **THAID** program of \citeauthor{ messenger1972thaid} (\citeyear{messenger1972thaid}). The two algorithm families that survived are **ID3/C4.5/C5.0** of \citeauthor{quinlan1986id3,quinlan1993c45} and **CART** of \citeauthor{breiman1984cart} (\citeyear{breiman1984cart}). They differ in the impurity criterion, in whether they support regression (CART does, ID3 originally didn't), and in the pruning strategy.

Decision trees are interpretable (you can print the tree), fast ($O(\log n)$ inference on a balanced tree), and natively handle mixed feature types without preprocessing. They overfit terribly without regularisation; the classical answer is *cost-complexity pruning* \cite{breiman1984cart} or *reduced-error pruning* \cite{quinlan1987pruning}.

Almost every classical supervised algorithm below is, in some sense, an attempt to combine multiple decision trees in a way that cancels out their individual overfitting while keeping their strengths.
</div>

<div class="md">
### Random forests

A **random forest** \cite{breiman2001rf} is an ensemble of decision trees, each trained on a bootstrap sample of the data with a random subset of features considered at each split. The predictions of the individual trees are averaged (regression) or voted (classification). The original idea of *bagging* — bootstrap aggregation — is due to \citeauthor{breiman1996bagging} (\citeyear{breiman1996bagging}); the specific addition of random feature subsets is \citeauthor{ho1995rf} (\citeyear{ho1995rf}) and \citeauthor{amit1997rf} (\citeyear{amit1997rf}).

Random forests achieve strong generalisation by averaging uncorrelated weak learners. The variance of a single tree is large; the variance of $B$ independent trees, each with variance $\sigma^2$, drops to $\sigma^2/B$. The trees are not independent (they share the same training distribution), but the feature randomness decorrelates them enough that the variance reduction is close to the theoretical ideal. The bias is the same as that of a single tree. Random forests were state-of-the-art on tabular data for a decade, until gradient boosting overtook them.
</div>

<div class="md">
### Gradient boosting: trees that correct each other

**Gradient boosting** \cite{friedman2001gbm, friedman2002stochastic} builds an ensemble of weak learners (almost always shallow decision trees) sequentially. Each new tree is fit to the *gradient* of the loss with respect to the current ensemble's predictions. With a squared-error loss, this reduces to "fit the next tree to the residuals". With a logistic loss, the gradient is the working response. The whole algorithm is a numerical optimisation method in the function space of the ensemble, in the same spirit as gradient descent in weight space.

Two implementations dominate modern practice. **XGBoost** \cite{chen2016xgboost} introduced second-order Taylor approximations, regularised objective, sparsity-aware split finding, and parallelisation — features that made it the standard in Kaggle competitions from 2014 onward. **LightGBM** \cite{ke2017lightgbm} added histogram-based split finding and gradient-based one-side sampling for much faster training on large datasets. **CatBoost** \cite{prokhorenkova2018catboost} added native handling of categorical features. As of 2025, a single LightGBM model trained with five-fold cross-validation still beats most deep-learning approaches on the canonical tabular benchmarks \cite{grinsztajn2022why}.

The deeper lesson: the LLM's claim to be a "universal function approximator" does not mean it is the best function approximator for *every* problem. On tabular data, the right inductive bias is "axis-aligned splits" and the right loss is a small ensemble of greedy steps in function space. Gradient-boosted trees embody both biases and continue to dominate.
</div>

<div class="md">
### Support Vector Machines

A **Support Vector Machine** finds the maximum-margin hyperplane separating two classes \cite{vapnik1963pattern, vapnik1995book}. For linearly inseparable data, the data is mapped into a higher-dimensional space via a **kernel** $K(\mathbf{x}, \mathbf{x}')$, and the separating hyperplane is found in that space. The most-used kernels are linear, polynomial, and the radial-basis-function (Gaussian) kernel. The kernel trick — computing inner products in the implicit feature space without ever constructing the space — is due to \citeauthor{aitchison1972kernel} (\citeyear{aitchison1972kernel}) and was popularised by \citeauthor{boser1992svm} (\citeyear{boser1992svm}) and \citeauthor{cortes1995svm} (\citeyear{cortes1995svm}).

SVMs held the state of the art on many classification tasks through the 1990s and 2000s, and remain the right tool when the dataset is small, the features are high-dimensional, and a sparse, kernel-based decision boundary is appropriate. The **kernel machines** viewpoint — that any algorithm expressible in inner products can be "kernelised" by replacing those inner products with a positive-definite kernel — extends to principal component analysis, ridge regression, canonical correlation analysis, and many more \cite{scholkopf2002learning}. A modern revival has come from the **neural tangent kernel** \cite{jacot2018ntk}, which shows that infinitely-wide neural networks are mathematically equivalent to kernel machines with a specific kernel, partially vindicating the 1990s intuition.
</div>

<div class="md">
### $k$-nearest neighbours

The simplest non-trivial classifier: predict the label of $\mathbf{x}$ as the majority vote of its $k$ nearest training examples \cite{cover1967knn}. Complexity $O(nd)$ at inference time per query, or $O(\log n)$ with a kd-tree. **No training step at all** — the model *is* the dataset. This is sometimes called *instance-based learning* or *lazy learning* \cite{aha1991lazy}.

$k$-NN is universally beaten in accuracy by every other algorithm on every benchmark — and yet it is still in production at every large internet company. The reason: its *inference-time compute* scales trivially with the dataset, it requires no training pipeline, it generalises gracefully to new classes without retraining, and its predictions have a natural "uncertainty" — the vote distribution. For retrieval, recommendation, and any task where you want a non-parametric baseline, $k$-NN is unbeatable.
</div>

<div class="md">
### Naive Bayes

A **Naive Bayes** classifier assumes that the features are conditionally independent given the class, and uses Bayes' theorem with the resulting joint distribution. The independence assumption is almost always false; the algorithm is almost always competitive; and the gap between the two is one of the deepest observations in classical machine learning. The independence assumption drastically reduces the number of parameters (from joint to per-feature), which reduces variance enough that the bias it introduces barely matters \cite{domingos1997nb, hand2001nb}.

Naive Bayes has a long pedigree: \citeauthor{maron1961nb} (\citeyear{maron1961nb}) is usually credited with the first automatic text classifier and uses the independence assumption; \citeauthor{lewis1998nb} (\citeyear{lewis1998nb}) popularised the *multinomial* version that is standard for spam filtering. A modern variant, the **Bayesian Network** \cite{pearl1985bn, pearl1988book}, replaces the independence assumption with a directed acyclic graph of conditional dependencies and is the parent of the entire field of probabilistic graphical models.
</div>

<div class="md">
### Linear and logistic regression

The simplest models are sometimes the best. **Linear regression** \cite{gauss1809theory, legendre1805methodes} fits $y \approx \mathbf{w}^\top \mathbf{x} + b$ by least squares. **Logistic regression** \cite{cox1958logistic, berkson1944logistic} fits $P(y = 1 \mid \mathbf{x}) = \sigma(\mathbf{w}^\top \mathbf{x} + b)$ by maximum likelihood. Both are convex, both are interpretable, both produce calibrated probabilities, both can be regularised in well-understood ways ($L_1$ for sparsity, $L_2$ for stability, elastic net for both), and both ship with confidence intervals.

For most problems in industry, "what does the linear regression predict?" is the right first answer. The course's earlier \href{statistics_ii.php}{statistics chapters} explain why: $L_2$ regularisation is the posterior mean under a Gaussian prior; $L_1$ is the posterior mode under a Laplace prior; and the entire Bayesian treatment of linear regression is a closed-form posterior that fits on a napkin. The chapter on \href{embeddinglab.php}{embeddings} is, in fact, a chapter about linear regression in disguise — a linear map between one vector space and another.
</div>

<div class="md">
## Bayesian methods: the third paradigm

The course has so far treated probability as a tool. There is another way to use it. In the **Bayesian** view, probability is *degree of belief*, the model parameters themselves are random variables, and learning means updating a prior distribution over parameters to a posterior distribution given the data. The mathematical engine is Bayes' theorem; the practical algorithms are Markov Chain Monte Carlo (MCMC), variational inference, and the Kalman filter. Every Bayesian method is, at heart, a way to compute (or approximate) a posterior.
</div>

<div class="md">
### MCMC: drawing from the posterior

When the posterior is intractable — which is most of the time — we draw samples from it by constructing a Markov chain whose stationary distribution *is* the posterior. The classic recipe is **Metropolis–Hastings** \cite{metropolis1953mh, hastings1970mh}: at each step, propose a move from the current state, accept it with probability $\min(1, \frac{p(\mathbf{x}') q(\mathbf{x} \mid \mathbf{x}')}{p(\mathbf{x}) q(\mathbf{x}' \mid \mathbf{x})})$, and repeat. **Gibbs sampling** \cite{geman1984gibbs} is a special case where the proposal is the conditional distribution of one coordinate given all the others; it is embarrassingly easy to implement but mixes poorly when coordinates are correlated. **Hamiltonian Monte Carlo** \cite{duane1987hmc, neal2011hmc} uses gradient information to propose distant moves without losing acceptance rate; **No-U-Turn-Sampling (NUTS)** \cite{hoffman2014nuts} is the adaptive variant of HMC that almost all modern probabilistic programming systems default to.

Two families of probabilistic programming system emerged to make MCMC routine: **Stan** \cite{carpenter2017stan} (with NUTS as its workhorse) and **PyMC** \cite{salvatier2016pymc}. They let the user write a model in a few lines and get full posterior inference — including uncertainty quantification — for free. These systems are what a Bayesian data analyst actually uses; "running Metropolis–Hastings by hand" is an exercise for a textbook, not a workflow.
</div>

<div class="md">
### Variational inference: turning inference into optimisation

When MCMC is too slow, the other approach is **variational inference** \cite{jordan1999vi, blei2017vi}: instead of sampling, approximate the posterior with a simpler distribution by optimising a divergence. The most common choice is the **KL-divergence** to a factorised distribution, which gives the **mean-field variational Bayes** algorithm and the celebrated **variational autoencoder** \cite{kingma2014vae} as the deep-learning specialisation.

The trade-off is precise: MCMC is asymptotically exact but slow; VI is fast and biased, but the bias is the one knob you can turn (the expressiveness of the variational family). Modern systems — **PyMC**, **NumPyro** \cite{phan2019numpyro}, **TensorFlow Probability** \cite{dillon2017tfp} — offer both, and choosing between them is an everyday decision for the practitioner.
</div>

<div class="md">
### Hidden Markov Models and the Kalman filter

A **Hidden Markov Model** \cite{baum1966hmm, rabiner1989tutorial} is a sequence model in which the observed sequence is generated by a Markov chain over unobserved discrete states. The forward–backward algorithm \cite{baum1966hmm} computes the posterior over states in $O(T \cdot N^2)$ time for $T$ observations and $N$ states; the Viterbi algorithm finds the most-likely state sequence in the same time. Before deep learning, HMMs were the state-of-the-art for speech recognition \cite{jelinek1976speech}, part-of-speech tagging, gene-finding, and any other sequential-labelling problem. They are still the right choice for problems with small alphabets and strong independence assumptions, and the **profile HMMs** of \citeauthor{eddy1998hmmer} (\citeyear{eddy1998hmmer}) are still used for biological sequence alignment.

The continuous-state analogue is the **Kalman filter** \cite{kalman1960kf}: a linear dynamical system with Gaussian noise, in which the posterior over the hidden state is exactly a Gaussian computable in closed form. The Kalman filter is the workhorse of control theory, navigation (GPS and the Apollo Guidance Computer both used variants), robotics, time-series econometrics, and signal processing. The **extended Kalman filter** and **unscented Kalman filter** extend it to nonlinear systems; the **particle filter** \cite{doucet2000pf} uses importance sampling to handle general non-Gaussian posteriors. The whole field of probabilistic time-series modelling descends from these two algorithms.
</div>

<div class="md">
### Gaussian Processes

A **Gaussian Process** \cite{rasmussen2006gpbook} defines a distribution over functions: any finite collection of function values is jointly Gaussian, parameterised by a mean function (usually zero) and a kernel (covariance function). Inference is exact — conditioning a Gaussian on observations gives another Gaussian — and the kernel encodes prior knowledge (smoothness, periodicity, additive structure). The catch is computational: storing the kernel matrix requires $O(n^2)$ memory and inverting it requires $O(n^3)$ time. The literature on sparse approximations — inducing-point methods \cite{quinonero2005unifying}, variational GPs \cite{hensman2013svgp}, structured approximations — has reduced this to roughly $O(n m^2)$ for $m \ll n$ inducing points, making GPs practical for millions of data points.

GPs give *calibrated uncertainty* for free, work well on small datasets, and are the right tool when you have a smooth function on a low-dimensional input. They lost to neural networks on large datasets because of the $O(n^3)$ cost; they never lost on small datasets where the uncertainty matters. The deep learning revival of GPs — **deep GPs** \cite{damianou2013deepgp}, **neural processes** \cite{garnelo2018np}, **Bayesian neural networks** with GP-like priors — is one of the active research frontiers.
</div>

<div class="md">
## Evolutionary algorithms: optimisation without gradients

Not every objective is differentiable. Some problems have discrete structure (the parameters of a neural architecture, the topology of a graph, the amino-acid sequence of a protein); some have noisy or non-smooth evaluations; some have constraints that are easier to satisfy than to encode as a penalty. For these, **evolutionary algorithms** — population-based optimisation methods inspired by biological evolution — are the standard tool.
</div>

<div class="md">
### Genetic Algorithms

A **genetic algorithm** \cite{holland1975ga, goldberg1989ga} maintains a population of candidate solutions ("chromosomes"), each encoded as a string (the original work used bit strings; modern GAs use whatever representation is natural). At each generation, it:

1. Evaluates the fitness of each chromosome.
2. Selects parents proportionally to fitness.
3. Crossover: combines pairs of parents to produce offspring.
4. Mutates: flips bits (or otherwise perturbs) the offspring with low probability.
5. Replaces the old population with the new.

Convergence proofs for GAs are subtle. The **schema theorem** \cite{holland1975ga} argues that short, low-order, high-fitness bit patterns ("schemata") grow exponentially under selection. Critics — most famously \citeauthor{goldberg1989ga} himself in his book, and more recently the **No Free Lunch theorem** \cite{wolpert1997nfl} — have shown that GAs do not outperform random search *in expectation* across all problems, but on specific problem classes (combinatorial optimisation, scheduling, hyperparameter tuning) they consistently beat gradient methods. The **CMA-ES** algorithm \cite{hansen2001cmaes} is the gold standard for continuous black-box optimisation in moderate dimension; it adapts a multivariate Gaussian mutation distribution to the local fitness landscape and consistently wins the Black-Box Optimisation Benchmark competition.
</div>

<div class="md">
### Genetic Programming

**Genetic programming** \cite{koza1992gp} applies the GA idea to computer programs themselves. The chromosomes are tree-structured expressions (or, in modern variants, sequences of instructions in a typed language), and the fitness is the program's performance on a task. Famous demonstrations include rediscovering patented electronic circuits \cite{koza1996gp2} and competitive strategies for checkers \cite{chellapilla1999gp}. The modern descendant is **Neuroevolution**, in which the chromosomes are neural network architectures or weights \cite{stanley2002neat, real2019amoeba, such2019deepgo}. NEAT \cite{stanley2002neat} evolves both topology and weights; modern variants evolve cell architectures for image classification \cite{real2019amoeba} and Go-playing policies \cite{such2019deepgo}. The **AlphaGo policy network** was bootstrapped from supervised human games, but the **AlphaZero** policy was bootstrapped entirely from self-play, and pure-reinforcement-learning approaches like **MuZero** \cite{schrittwieser2020muzero} achieve state-of-the-art game-playing performance without any human data — a form of learning that no LLM has ever produced.
</div>

<div class="md">
### Evolutionary strategies and surrogate methods

**Evolution Strategies** \cite{rechenberg1973es, schwefel1977es} generalise GAs to continuous domains: instead of bit-string crossover, they perturb a population of real-valued vectors by Gaussian noise and select the best. **CMA-ES** is the practical instantiation. **Surrogate-based methods** like **Bayesian optimisation** \cite{mockus1978bo, shahriari2016bo} wrap a Gaussian process around an expensive black-box objective and use the GP's predictive uncertainty to choose the next point to evaluate. Bayesian optimisation is the standard tool for hyperparameter search in deep learning — it routinely beats grid search and random search on compute budget \cite{snoek2012spearmint}.
</div>

<div class="md">
## Reinforcement Learning beyond RLHF

The course has covered Reinforcement Learning and the use of RL in fine-tuning LLMs. That coverage was, by design, narrow. The wider field of RL is one of the richest areas of machine learning, and contains some of the most striking demonstrations of artificial intelligence ever achieved: TD-Gammon \cite{tesauro1995tdgammon}, AlphaGo \cite{silver2016go}, AlphaZero \cite{silver2018zero}, the Atari DQN \cite{mnih2015dqn}, the robotics work of \citeauthor{levine2016guidance} (\citeyear{levine2016guidance}), and the open-ended exploration of \citeauthor{openai2021dota} (\citeyear{openai2021dota}). None of these depend on a Transformer.
</div>

<div class="md">
### Tabular RL and the classical algorithms

The starting point is the **Markov Decision Process** \cite{puterman1994mdp}: states $s$, actions $a$, transition dynamics $P(s' \mid s, a)$, reward function $r(s, a)$, discount factor $\gamma$. The objective is a policy $\pi(a \mid s)$ that maximises the expected discounted return. Three classical algorithms solve exactly the tabular case:

* **Value Iteration** \cite{bellman1957dp}: iteratively apply the Bellman optimality operator until the value function converges.
* **Policy Iteration** \cite{howard1960pi}: alternate between evaluating the current policy (solve a linear system) and improving it greedily.
* **Linear Programming** \cite{puterman1994mdp}: formulate the MDP as a linear program and solve it directly.

All three are exact, all three are foundational, all three were known by 1960.
</div>

<div class="md">
### Model-free methods

When the dynamics are unknown, the agent has to learn from experience. The two foundational model-free methods are **Q-learning** \cite{watkins1992qlearning} (off-policy, learns the optimal action-value function from any data) and **SARSA** \cite{rummery1994sarsa, sutton1996sarsa} (on-policy, learns the action-value function of the policy it follows). Both are bootstrapped temporal-difference (TD) learners \cite{sutton1988td}. The **Deep Q-Network** \cite{mnih2015dqn} combines Q-learning with a deep convolutional network and an experience replay buffer; it was the first method to reach human-level play on a large fraction of Atari games using only raw pixels as input.

For continuous action spaces, **policy-gradient** methods directly parametrise the policy and optimise it by gradient ascent on the expected return. **REINFORCE** \cite{williams1992reinforce} is the simplest instance; **Actor–Critic** methods \cite{konda2000ac} combine it with a learned value function as a baseline; **PPO** \cite{schulman2017ppo} and **TRPO** \cite{schulman2015trpo} add trust-region constraints for stability. PPO is the workhorse of modern RLHF for LLMs, but it is also the workhorse of every other deep RL application.
</div>

<div class="md">
### Model-based RL and planning

When you *do* know the dynamics (because you learned them), you can plan. The **Dyna** architecture \cite{sutton1991dyna} interleaves planning, acting, and learning; **AlphaZero** \cite{silver2018zero} combines a learned model of the game with Monte Carlo Tree Search \cite{coulom2006mcts} and self-play reinforcement learning. The **MuZero** algorithm \cite{schrittwieser2020muzero} learns a *latent* dynamics model that does not have to match the real environment pixel-by-pixel but is still good enough to plan over. This is the deepest form of RL: the agent does not just react to the world, it builds an internal world and reasons about it.
</div>

<div class="md">
### Multi-armed bandits

Strip away the state and you get a **bandit problem**: at each step, choose one of $K$ arms, observe a reward, maximise cumulative reward. The classical algorithm is **upper confidence bound (UCB)** \cite{lai1985ucb, auer2002ucb}, which optimistically prefers arms whose upper confidence interval is high. **Thompson sampling** \cite{thompson1933ts} samples from the posterior and chooses the best sample. Bandits are the special case of RL with no state dynamics, and they show up everywhere — A/B testing, clinical trials, recommender systems, hyperparameter tuning, ad placement. The exploration–exploitation trade-off that bandits make explicit is *the* fundamental problem of decision-making under uncertainty.
</div>

<div class="md">
### Inverse RL and learning from demonstration

**Inverse reinforcement learning** \cite{ng2000irl, abbeel2004irl} recovers a reward function from expert demonstrations. The recovered reward is then used to train a policy with RL. This is the natural formulation of "I will show you how to do it". The modern descendant is **RLHF** for LLMs: the reward model is learned from human preferences, and the policy is fine-tuned against the reward model \cite{ouyang2022instructgpt}. The lineage is continuous from the original inverse-RL work in robotics to today's most-cited LLM training paper.
</div>

<div class="md">
## Symbolic AI and Knowledge Representation

The course has a separate chapter on symbolic AI and knowledge graphs. We only summarise the landscape here so that this tour is complete.
</div>

<div class="md">
### Logic-based reasoning

The symbolic branch of AI is older than the connectionist branch. Aristotle's syllogisms are the first formal logic; Frege's *Begriffsschrift* \cite{frege1879begriffsschrift} is the first modern logic; Russell and Whitehead's *Principia Mathematica* \cite{russell1910pm} is the first attempt to derive mathematics from logic. In the twentieth century, the field split into:

* **Propositional logic** and **first-order logic** for general knowledge representation.
* **SAT solvers** \cite{biere2009handbook}: DPLL \cite{davis1962dpll}, CDCL \cite{silva1996cdcl}, the modern $O(1.4^n)$-ish industrial solvers that win every competition.
* **SMT solvers** \cite{barrett2018smtlib}: SAT modulo theories (linear arithmetic, arrays, bit-vectors), used in program verification and type systems.
* **Logic programming** (Prolog) \cite{colmerauer1973prolog, kowalski1974prolog}: backward-chaining Horn-clause resolution.
* **Inductive Logic Programming** \cite{plotkin1970ilp, muggleton1991ilp}: learn logical rules from examples. The ancestor of every modern rule-learning system.
* **Production systems** and **expert systems** \cite{feigenbaum1984expert}: hand-coded IF–THEN rules with an inference engine. **MYCIN** \cite{shortliffe1976mycin} diagnosed bacterial infections; **DENDRAL** \cite{feigenbaum1965dendral} identified organic molecules; **R1** \cite{mcdermott1982r1} configured VAX computers.
* **Description logics** \cite{baader2003dl}: the logical foundation of the Semantic Web (OWL).
* **Automated theorem proving** \cite{robinson1965resolution}: from resolution to the modern **Lean** \cite{moura2015lean} and **Coq** \cite{bertot2013coq} interactive provers, used for hardware verification, programming language metatheory, and increasingly for formalising mathematics.

The whole symbolic branch was declared dead in the late 1980s and reborn in the 2020s as **neuro-symbolic AI** — systems that combine neural perception with symbolic reasoning. The chapter on symbolic AI in this course covers this in detail.
</div>

<div class="md">
### Knowledge graphs

A **knowledge graph** is a directed labelled multigraph of entities and relations. The semantic-web standards stack — **RDF**, **RDFS**, **OWL**, **SPARQL** \cite{berners2001sw, mcguinness2004owl} — provides the formal syntax and semantics. Real-world graphs include **Wikidata** (100M+ items), **DBpedia** (extracted from Wikipedia), **ConceptNet** \cite{liu2004conceptnet} (commonsense), **WordNet** \cite{miller1995wordnet} (lexical), **UMLS** (biomedical), and the proprietary graphs of Google, Meta, and Amazon. Methods for *completing* a knowledge graph from observations — **TransE** \cite{bordes2013transe}, **ComplEx** \cite{trouillon2016complex}, graph neural networks \cite{schlichtkrull2018rgcn} — are the symbolic equivalent of the next-token prediction that trains a Transformer, and they are the right tool when the answer has to be a fact in the world, not a fluent paragraph.
</div>

<div class="md">
## Recommender Systems

Recommender systems are one of the highest-revenue applications of machine learning in industry. They are also the canonical example of a problem where the algorithm of choice has nothing to do with Transformers.
</div>

<div class="md">
### Collaborative filtering

A **collaborative filter** predicts a user's preference for an item based on other users' preferences. The simplest version is the **neighbourhood method**: find the $k$ users whose past behaviour is most similar to yours, and predict your rating for an item as the weighted average of their ratings for that item. The more famous version is **matrix factorisation** \cite{koren2009mf}: factor the user–item rating matrix $R \in \mathbb{R}^{n \times m}$ as the product of two low-rank matrices $U \in \mathbb{R}^{n \times k}$ and $V \in \mathbb{R}^{m \times k}$, learnt by minimising the regularised squared error on the observed entries. Each user and each item has a $k$-dimensional embedding; the prediction is the dot product. The Netflix Prize \cite{bennett2007netflix} (2006–2009) was won by a blend of matrix factorisation and neighbourhood methods; the winning team \cite{bell2007netflix} showed that even simple SVD on the rating matrix was a strong baseline.

The deep-learning extension — **Neural Collaborative Filtering** \cite{he2017ncf}, **Two-Tower models** \cite{yi2019twotower}, **Deep & Cross** \cite{wang2017dcn} — replaces the dot product with a neural network, but the inductive bias is still "users and items live in the same vector space". Industrial systems at YouTube, TikTok, and Spotify still ship variants of matrix factorisation as their core, augmented with deep learning for feature extraction and re-ranking.
</div>

<div class="md">
### Content-based and hybrid methods

A **content-based** recommender predicts preferences from item features (genre, text, image) and user profiles. A **hybrid** recommender combines content and collaborative signals. The taxonomy is older than the algorithms themselves \cite{adomavicius2005recsys}. Modern industrial systems are hybrid by construction: candidate generation uses a fast two-tower model trained on implicit feedback; re-ranking uses a deep network over rich features; final ranking blends in business rules. None of this depends on language modelling.
</div>

<div class="md">
## Time-series models

A **time series** is a sequence of observations indexed by time. Time-series data is everywhere — finance, weather, sensor logs, biology, sales. The dominant models for forecasting time series before 2017 are **ARIMA** \cite{box1970arima}, **exponential smoothing** \cite{hyndman2008exp}, and the various forms of state-space models. The deep-learning revolution brought **RNNs**, **TCNs** \cite{bai2018tcn}, **Transformers** \cite{zhou2021informer}, and the **N-BEATS** \cite{oreshkin2020nbeats} and **N-HiTS** \cite{challu2023nhits} architectures that achieve state-of-the-art accuracy on the canonical M-competition benchmarks. In 2025, however, the M5 and M6 competitions show that a well-tuned LightGBM with carefully engineered calendar features is competitive with the best deep models, and **Prophet** \cite{taylor2018prophet} (a piecewise-linear + Fourier + holiday model from Facebook) is the standard baseline at many companies.

The lesson: time-series forecasting is a problem where *the right inductive bias* (calendar effects, level shifts, holidays, weekly seasonality) matters more than model capacity. LightGBM with the right features wins as often as a Transformer.
</div>

<div class="md">
## Graph algorithms

Many real-world data are graphs: social networks, molecules, knowledge graphs, transport networks, codebases, citation networks, the web itself. The field of **graph machine learning** has its own algorithms that are rarely discussed in the LLM literature.
</div>

<div class="md">
### PageRank and random walks

The web is a graph of 30 billion pages and a trillion edges. Ranking them by importance is the problem **PageRank** \cite{brin1998pagerank, page1999pagerank} solves: a page is important if it is linked to by other important pages. Formally, the PageRank vector is the stationary distribution of a random walk with teleportation:

$$
\mathbf{r} = (1 - d) \mathbf{A} \mathbf{r} + d \cdot \tfrac{1}{n} \mathbf{1},
$$

where $\mathbf{A}$ is the row-normalised link matrix, $d$ is the teleportation probability (typically 0.15), and $\mathbf{1}$ is the vector of all ones. The power-iteration algorithm converges in $O(k \cdot n)$ where $k$ is the number of iterations. PageRank was the foundation of Google's search engine and remains a fundamental graph algorithm.

The random walk is the **eigenvector** of $\mathbf{A}$ corresponding to eigenvalue 1. The teleportation term ensures the walk is ergodic and the stationary distribution is unique. Variants include **personalised PageRank** (teleport to a specific node instead of uniformly), **weighted PageRank**, and **temporal PageRank** for time-evolving graphs. The same idea underlies many other algorithms: **HITS** \cite{kleinberg1999hits} computes hub and authority scores; **SimRank** \cite{jeh2002simrank} computes structural similarity; **metapath2vec** \cite{dong2017metapath2vec} learns node embeddings from heterogeneous graphs via biased random walks.
</div>

<div class="md">
### Community detection

A **community** is a set of nodes that are more densely connected to each other than to the rest of the graph. **Girvan–Newman** \cite{girvan2002gn} removes edges with the highest *betweenness* (number of shortest paths passing through) iteratively. **Louvain** \cite{blondel2008louvain} optimises modularity greedily in $O(n \log n)$. **Leiden** \cite{traag2019leiden} is a refinement of Louvain that guarantees well-connected communities. These algorithms are the production tool for community detection in social networks, biological networks, and citation networks, and they are the workhorse of the single-cell transcriptomics pipelines mentioned earlier \cite{traag2019louvain}.
</div>

<div class="md">
### Graph Neural Networks

A **Graph Neural Network** \cite{scarselli2008gnn, kipf2017gcn} passes messages between neighbouring nodes and updates their representations. The basic GCN update is

$$
\mathbf{h}_v^{(k+1)} = \sigma\!\left( \sum_{u \in \mathcal{N}(v)} \tfrac{1}{|\mathcal{N}(v)|} \mathbf{W}^{(k)} \mathbf{h}_u^{(k)} \right),
$$

a weighted average of the transformed neighbour representations, passed through a nonlinearity. **GraphSAGE** \cite{hamilton2017graphsage} learns how to sample and aggregate; **GAT** \cite{velickovic2018gat} uses attention; **GIN** \cite{xu2019gin} is provably as expressive as the Weisfeiler–Leman test. GNNs have been applied to molecular property prediction \cite{duvenaud2015convfp}, traffic forecasting \cite{li2018dcrnn}, recommendation \cite{he2020lightgcn}, and physics simulation \cite{sanchez2020hamiltonian}. They are the standard tool when the data has explicit graph structure, and they are *not* the Transformer.
</div>

<div class="md">
## Dimensionality Reduction

High-dimensional data is hard to visualise, hard to cluster, and hard to feed to any downstream algorithm. **Dimensionality reduction** maps it to a lower-dimensional space while preserving as much structure as possible.
</div>

<div class="md">
### Linear methods

**Principal Component Analysis** \cite{pearson1901pca, hotelling1933pca} finds the orthogonal directions of greatest variance. It is equivalent to eigendecomposition of the covariance matrix and to truncated SVD of the centred data matrix. **Independent Component Analysis** \cite{hyvarinen2000ica} finds directions that are statistically independent; it is the workhorse of blind-source separation in EEG and audio. **Linear Discriminant Analysis** \cite{fisher1936lda} finds directions that best separate labelled classes. **Non-negative Matrix Factorisation** \cite{lee1999nmf} factorises a non-negative matrix into non-negative factors; it is the standard tool for topic modelling before neural alternatives and for hyperspectral image unmixing.

**Multidimensional Scaling** \cite{torgerson1952mds} preserves pairwise distances. **Isomap** \cite{tenenbaum2000isomap} preserves *geodesic* distances along the manifold. **Locally Linear Embedding** \cite{roweis2000lle} preserves local linear reconstructions. These three are the classical manifold-learning algorithms.
</div>

<div class="md">
### Non-linear methods

**t-SNE** \cite{van2008tsne} minimises the Kullback–Leibler divergence between a Gaussian distribution over pairwise similarities in high-dimensional space and a Student-t distribution in low-dimensional space. It produces the iconic 2D maps that you see in every single-cell biology paper. **UMAP** \cite{mcinnes2018umap} is a similar algorithm based on Riemannian geometry and algebraic topology; it is faster than t-SNE, has a useful theoretical foundation (it preserves the *topology* of the data), and preserves global structure better. Both are visualisation tools, not predictive models — they are not used as features for downstream classifiers.

**Autoencoders** \cite{hinton1989autoencoder, kramer1992autoencoder} are a neural-network view of dimensionality reduction: an encoder compresses the input to a latent code, a decoder reconstructs it, and the bottleneck code is the low-dimensional representation. **Variational autoencoders** \cite{kingma2014vae} add a probabilistic interpretation and a regularised latent space; they are the standard generative model for small images and are the basis of latent diffusion.
</div>

<div class="md">
## Specialised neural architectures

The Transformer is one of several neural-network architectures. There are dozens of others, some of them pre-deep-learning, some of them deep-learning siblings, some of them post-Transformer. They are described briefly here; the chapter on *Beyond Transformers* covers the post-Transformer architectures in detail.
</div>

<div class="md">
### Spiking Neural Networks

A **spiking neural network** \cite{maass1997spiking} communicates via discrete *spikes* rather than continuous activations, modelling the action potentials of biological neurons more faithfully. The two canonical models are **Leaky Integrate-and-Fire** and the **Hodgkin–Huxley** model \cite{hodgkin1952hh}. Spiking networks are the natural target of **neuromorphic hardware** \cite{merolla2014truenorth, davies2018loihi} — chips like Intel's Loihi and IBM's TrueNorth that emulate spiking neurons in silicon and promise orders-of-magnitude better energy efficiency. The learning rule is often a variant of **STDP** (spike-timing-dependent plasticity) \cite{bi1998stdp}, in which a synapse is strengthened if the pre-synaptic spike precedes the post-synaptic spike, and weakened otherwise. Spiking networks are the only neural-network paradigm where the *energy budget of inference* is a first-class design constraint, and they are the right tool for always-on sensory processing at the edge.
</div>

<div class="md">
### Reservoir Computing and Echo State Networks

A **reservoir computer** \cite{jaeger2001esn, maass2002liquid} is a recurrent neural network in which the recurrent weights are *fixed at random* and only a linear readout is trained. The internal dynamics are complex enough that the linear readout can solve any task that the reservoir's state space can represent. The trick is to set the random weights so that the dynamics are on the *edge of chaos* — neither too stable nor too chaotic. Echo State Networks \cite{jaeger2001esn} are the discrete-time version; Liquid State Machines \cite{maass2002liquid} are the continuous-time, spiking version. Reservoir computing is the canonical example of *computation without learning in the network itself* — only the linear output is trained — and it is the natural framework for physical computing substrates where the dynamics cannot be trained: a bucket of water \cite{fonseca2022reservoir}, a piece of bread \cite{rossi2021bread}, an optical cavity.
</div>

<div class="md">
### Capsule Networks

A **capsule** \cite{hinton2011capsules, sabour2017capsules} is a small group of neurons whose activations represent the *pose* (position, orientation, scale, deformation) of an entity. The output of a capsule is a vector, not a scalar; the *length* of the vector represents the probability that the entity exists, and the *direction* represents its pose. Capsules are connected by **routing-by-agreement**: a low-level capsule sends its output to a high-level capsule whose pose prediction matches the input. The original motivation was that convolutional networks are confused by viewpoint changes in ways that humans are not (the "Picasso problem"). Capsule networks have not displaced CNNs in practice, but the *vector-valued neuron* idea is alive in the geometric deep learning literature.
</div>

<div class="md">
### Normalising flows, VAEs, GANs, diffusion, autoregressive models

These five families are the canonical deep generative models. They were all covered briefly above (Wake-Sleep, variational inference). They are mentioned here only to note that each is a self-contained *modelling paradigm*, not a variation on the Transformer:

* **Variational Autoencoders** \cite{kingma2014vae}: amortised variational inference with a Gaussian latent and a Gaussian decoder (or any decoder with tractable likelihood). Easy to train; blurry samples.
* **Normalising Flows** \cite{dinh2017realnvp, rezende2015nf}: a sequence of invertible transformations between the data distribution and a simple base distribution. Exact likelihood; expensive training; used in density estimation.
* **GANs** \cite{goodfellow2014gan}: a generator network and a discriminator network trained in opposition. Sharp samples; unstable training; mode collapse.
* **Diffusion models** \cite{ho2020ddpm, sohl2015deep, song2019score}: learn to reverse a gradual noising process. State of the art on image and audio generation.
* **Autoregressive models** \cite{oord2016wavenet}: factorise $p(\mathbf{x}) = \prod_t p(x_t \mid x_{<t})$ and train each conditional with a likelihood loss. This is what GPT does for text; the same paradigm, applied pixel-by-pixel or waveform-sample-by-sample, gives WaveNet and PixelCNN.

These five families are the landscape of deep generative modelling as of 2025. Each is a self-contained research community with its own conferences, datasets, and evaluation protocols. None is reducible to the others.
</div>

<div class="md">
## Topological Data Analysis

**Topological Data Analysis (TDA)** \cite{edelsbrunner2002persistent, carlsson2009tda} applies tools from algebraic topology — persistent homology, Betti numbers, barcodes — to data. The idea: extract a **filtration** (a nested sequence of simplicial complexes) from the data, track how topological features (connected components, loops, voids) appear and disappear, and summarise the resulting persistence as a **barcode**. The barcode is a topological signature of the shape of the data.

TDA has been applied to neuronal morphology \cite{li2017tda}, to viral evolution \cite{emmert2014tda}, to materials science \cite{hiraoka2016tda}, and to financial networks \cite{gidea2018tda}. It is the only machine-learning method whose feature representation is provably invariant under continuous deformation, and the only one whose "features" are higher-dimensional holes, not vectors. The **Mapper** algorithm \cite{singh2007mapper} is a related approach that builds a graph representation of the data via a filter function and has been used for cancer sub-type discovery.
</div>

<div class="md">
## Causal Inference

Machine learning models are *correlational*: they predict $Y$ from $X$ given that they co-vary in the training data. They are not *causal*: they do not tell you what would happen if you intervened on $X$. **Causal inference** is the discipline of answering interventional and counterfactual questions from observational and experimental data.
</div>

<div class="md">
### The causal graph

The mathematical foundation is the **causal Bayesian network** \cite{pearl1985bn, pearl1995book, pearl2009book}, a directed acyclic graph where each edge $X \to Y$ means "$X$ is a direct cause of $Y$". The do-calculus \cite{pearl1995do} is the algebraic engine for computing interventional distributions $p(Y \mid \mathrm{do}(X))$ from the joint distribution $p(V)$ of the graph. **Counterfactual reasoning** \cite{lewis1973counterfactuals} extends the framework to questions of the form "what would have happened to $Y$ if $X$ had been $x'$ instead of $x$?".

Causal inference is essential when the deployed system will be used to make decisions — in medicine (does the drug cure the disease?), in policy (does the policy cause the outcome?), in economics (did the intervention cause the recession?), in recommender systems (will showing the ad cause a click?). The **potential outcomes framework** of \citeauthor{imbens2015causal} (\citeyear{imbens2015causal}) and the **structural causal models** of \citeauthor{pearl2009book} (\citeyear{pearl2009book}) are the two modern formulations. **Instrumental variables**, **propensity score matching**, **doubly robust estimation**, and **causal forests** \cite{wager2018cf} are the practical workhorses. **Double machine learning** \cite{chernozhukov2018dml} combines any predictive model with Neyman-orthogonal correction terms to get valid causal estimates from observational data. None of this is in the LLM curriculum, and none of it should be skipped by anyone who wants to use data to *change* the world rather than to describe it.
</div>

<div class="md">
## Anomaly detection

An **anomaly** is a data point that does not fit. Detecting anomalies is one of the highest-value applications of machine learning in industry — fraud detection, intrusion detection, manufacturing quality control, medical diagnosis.
</div>

<div class="md">
### Statistical and density-based methods

The simplest anomaly detector is a **z-score**: a point is anomalous if its distance from the mean is more than, say, three standard deviations. **Mahalanobis distance** generalises this to correlated features. **Isolation Forest** \cite{liu2008iforest} builds random decision trees and declares anomalies to be the points with the shortest average path length; the intuition is that anomalies are easy to *isolate* because they are rare. **Local Outlier Factor** \cite{breunig2000lof} compares the density around a point to the density around its neighbours. **One-Class SVM** \cite{scholkopf2001ocsvm} learns a boundary that encloses the normal data and declares points outside the boundary to be anomalous.

These are the production tools for fraud and intrusion detection. They are *fast*, *interpretable*, and *cheap*. They routinely outperform deep-learning-based anomaly detectors on the canonical benchmarks, in part because anomaly detection is intrinsically an *imbalanced* problem and deep models need a lot of data to learn the rare class.
</div>

<div class="md">
### Reconstruction-based methods

If you train an autoencoder on normal data, anomalous inputs will have high reconstruction error. This is the basis of every reconstruction-based anomaly detector, from the simplest autoencoder \cite{hawkins2002ae} to modern variants using variational autoencoders \cite{an2015vaeano}. The fundamental limitation is that autoencoders can be *too good* — a sufficiently expressive autoencoder will reconstruct anomalies almost as well as normal data, blurring the distinction. The literature is rich with techniques to mitigate this: denoising autoencoders \cite{vincent2008dae}, memory-based autoencoders \cite{gong2019memoryae}, contrastive learning on top of the latent code.
</div>

<div class="md">
## Information-theoretic methods

The **information bottleneck** method \cite{tishby2000informationbottleneck} finds a compressed representation $T$ of an input $X$ that is maximally informative about an output $Y$. The optimisation is

$$
\min_{p(t \mid x)} \; I(X; T) - \beta \, I(T; Y),
$$

where $I$ is mutual information. This is a beautiful objective with deep connections to rate-distortion theory, minimal sufficient statistics, and the geometry of neural network learning \cite{shwartz2017opening}. **Decision trees** can be derived as a greedy information-bottleneck optimisation, with each split chosen to maximise the reduction in conditional entropy of the label \cite{quinlan1986id3}. **The Information Bottleneck as a model of deep learning** \cite{shwartz2017opening} argues that the layered representations of a deep network are successive information-bottleneck compressions of the input — a striking theoretical claim that has been partially supported empirically and partially contested.

**Maximum-entropy models** \cite{jaynes1957maxent} infer a distribution subject to moment constraints, with the principle of maximum entropy choosing the least-committal distribution consistent with the data. They are the foundation of **log-linear models** in natural language processing \cite{berger1996cpmc} and of the **exponential family** in statistical mechanics.
</div>

<div class="md">
## Probabilistic programming

A **probabilistic programming language** \cite{goodman2008pp} lets the user write a Bayesian model as a program and get full posterior inference for free. The classical systems are **BUGS** \cite{lunn2000bugs} and **JAGS** \cite{plummer2003jags}. The modern systems are **Stan** \cite{carpenter2017stan} (the de facto standard for applied statistics), **PyMC** \cite{salvatier2016pymc}, **NumPyro** \cite{phan2019numpyro}, and **TensorFlow Probability** \cite{dillon2017tfp}. They support a wide variety of inference algorithms — NUTS, ADVI, SMC, forward-filtering backward-sampling — and let the user express the model declaratively while the system handles the algorithmic complexity.

Probabilistic programming is the natural tool when you have a generative story for the data, you want posterior uncertainty on the parameters, and you do not want to write a custom MCMC sampler. The LLMs of the world have no answer to "what is the posterior probability of $H_0$ given this dataset?"; probabilistic programming does.
</div>

<div class="md">
## Ensemble methods in depth

The chapter on classical supervised learning mentioned bagging and boosting. Both are instances of a deeper idea: **ensemble methods** combine many weak learners to get a strong learner. The theory behind them is some of the most beautiful in all of machine learning.
</div>

<div class="md">
### Bagging, boosting, and stacking

* **Bagging** \cite{breiman1996bagging}: train $B$ models on bootstrap samples and average their predictions. Variance reduction of $\sigma^2/B$ for independent models.
* **Boosting** \cite{freund1997boosting, friedman2001gbm}: train $B$ models sequentially, each focused on the errors of the previous ensemble. Bias reduction; can drive training error to zero (which is sometimes a problem).
* **Stacking** \cite{wolpert1992stacking}: train $B$ diverse base models, then train a meta-model on their predictions. Used heavily in Kaggle competitions.
* **Mixture of Experts** \cite{jacobs1991moe, shazeer2017moe}: a soft-gated ensemble in which a learned router assigns each input to one of several "expert" sub-networks. The Sparsely-Gated MoE of \citeauthor{shazeer2017moe} (\citeyear{shazeer2017moe}) is the basis of the production LLM scaling strategy at Google and elsewhere. Every Mixtral model, every Switch Transformer, every Gemini is an MoE.

The deeper fact: ensembles are *the* historical recipe for winning machine-learning competitions. The Netflix Prize was won by an ensemble. Most Kaggle tabular competitions are won by ensembles. Modern LLM leaderboards are won by *ensembles of LLMs* \cite{wang2024ensemble} — a fact that should remind us that ensembling is still the most reliable way to make a good model better.
</div>

<div class="md">
## The model zoo in one table

A summary, with the year of the foundational paper and the most common use case:

$$
\begin{array}{|l|c|c|l|}
\hline
\textbf{Algorithm} & \textbf{Year} & \textbf{Family} & \textbf{Canonical use} \\
\hline
\textit{Wake-Sleep} & 1995 & \text{Deep generative} & \text{Helmholtz machines} \\
k\textit{-means (Lloyd)} & 1957 & \text{Clustering} & \text{Vector quantisation} \\
k\textit{-means++} & 2007 & \text{Clustering} & \text{General clustering baseline} \\
\text{Hierarchical (Ward)} & 1963 & \text{Clustering} & \text{Taxonomy building} \\
\text{DBSCAN} & 1996 & \text{Clustering} & \text{Anomaly-aware clustering} \\
\text{HDBSCAN} & 2013 & \text{Clustering} & \text{Density-based, no } \varepsilon \\
\text{EM (GMM)} & 1977 & \text{Clustering, Bayes} & \text{Probabilistic clustering} \\
\text{Mean shift} & 1975 & \text{Clustering} & \text{Non-parametric} \\
\text{Spectral} & 2000 & \text{Clustering} & \text{Image segmentation} \\
\text{Affinity propagation} & 2007 & \text{Clustering} & \text{Unknown } k \\
\text{OPTICS} & 1999 & \text{Clustering} & \text{Hierarchy of densities} \\
\hline
\text{Decision tree (CART)} & 1984 & \text{Supervised} & \text{Interpretable baseline} \\
\text{ID3/C4.5} & 1986 & \text{Supervised} & \text{Multiclass} \\
\text{Random forest} & 2001 & \text{Supervised} & \text{Tabular SOTA (pre-2014)} \\
\text{XGBoost} & 2016 & \text{Supervised} & \text{Tabular SOTA} \\
\text{LightGBM} & 2017 & \text{Supervised} & \text{Large-scale tabular} \\
\text{SVM} & 1995 & \text{Supervised} & \text{Kernel methods} \\
k\textit{-NN} & 1967 & \text{Supervised} & \text{Non-parametric} \\
\text{Naive Bayes} & 1961 & \text{Supervised} & \text{Text baseline} \\
\text{Linear / logistic} & 1805/1958 & \text{Supervised} & \text{Interpretable} \\
\hline
\text{Metropolis–Hastings} & 1953 & \text{Bayesian} & \text{MCMC} \\
\text{Gibbs sampling} & 1984 & \text{Bayesian} & \text{MCMC} \\
\text{HMC/NUTS} & 1987/2014 & \text{Bayesian} & \text{Gradient MCMC} \\
\text{VI} & 1999 & \text{Bayesian} & \text{Approximate Bayes} \\
\text{Kalman filter} & 1960 & \text{Bayesian, time series} & \text{Linear–Gaussian state-space} \\
\text{HMM} & 1966 & \text{Bayesian, time series} & \text{Sequence labelling} \\
\text{Gaussian Process} & 1940s & \text{Bayesian} & \text{Small data, uncertainty} \\
\text{Bayesian network} & 1985 & \text{Bayesian} & \text{Generative graphical model} \\
\hline
\text{GA} & 1975 & \text{Evolutionary} & \text{Combinatorial} \\
\text{GP} & 1992 & \text{Evolutionary} & \text{Symbolic regression} \\
\text{CMA-ES} & 2001 & \text{Evolutionary} & \text{Continuous black-box} \\
\text{NEAT} & 2002 & \text{Evolutionary} & \text{Neuroevolution} \\
\text{Bayesian optimisation} & 1978 & \text{Evolutionary} & \text{Hyperparameter search} \\
\hline
\text{Value/Policy iteration} & 1957/60 & \text{RL} & \text{Tabular MDP} \\
\text{Q-learning} & 1992 & \text{RL} & \text{Off-policy TD} \\
\text{SARSA} & 1996 & \text{RL} & \text{On-policy TD} \\
\text{REINFORCE} & 1992 & \text{RL} & \text{Policy gradient} \\
\text{PPO} & 2017 & \text{RL} & \text{Stable policy gradient} \\
\text{DQN} & 2015 & \text{RL} & \text{Deep value-based} \\
\text{AlphaZero} & 2018 & \text{RL} & \text{Self-play + MCTS} \\
\text{MuZero} & 2020 & \text{RL} & \text{Learned latent model} \\
\text{Inverse RL} & 2000 & \text{RL} & \text{Learn from demo} \\
\text{UCB/Thompson} & 1933/85 & \text{Bandits} & \text{Exploration} \\
\hline
\text{SAT solver} & 1962 & \text{Symbolic} & \text{Boolean satisfiability} \\
\text{SMT solver} & 1970s & \text{Symbolic} & \text{Program verification} \\
\text{Prolog} & 1973 & \text{Symbolic} & \text{Logic programming} \\
\text{ILP} & 1991 & \text{Symbolic} & \text{Rule learning} \\
\text{MYCIN/R1} & 1976/82 & \text{Symbolic} & \text{Expert system} \\
\text{Lean/Coq} & 2015/13 & \text{Symbolic} & \text{Interactive theorem proving} \\
\hline
\text{Matrix factorisation} & 2009 & \text{Recommender} & \text{Collaborative filtering} \\
\text{Neural CF} & 2017 & \text{Recommender} & \text{Deep recommendation} \\
\text{Two-tower} & 2019 & \text{Recommender} & \text{Retrieval at scale} \\
\hline
\text{ARIMA} & 1970 & \text{Time series} & \text{Forecasting baseline} \\
\text{Prophet} & 2018 & \text{Time series} & \text{Business forecasting} \\
\text{N-BEATS} & 2020 & \text{Time series} & \text{Deep univariate} \\
\text{DeepAR} & 2017 & \text{Time series} & \text{Probabilistic forecasting} \\
\hline
\text{PageRank} & 1998 & \text{Graph} & \text{Web search} \\
\text{Louvain/Leiden} & 2008/19 & \text{Graph} & \text{Community detection} \\
\text{GCN/GraphSAGE/GAT} & 2017 & \text{Graph} & \text{Node/graph classification} \\
\text{GIN} & 2019 & \text{Graph} & \text{Provably expressive GNN} \\
\hline
\text{PCA} & 1901 & \text{Dim. reduction} & \text{Linear} \\
\text{ICA} & 1980s & \text{Dim. reduction} & \text{Blind source separation} \\
\text{t-SNE} & 2008 & \text{Dim. reduction} & \text{Visualisation} \\
\text{UMAP} & 2018 & \text{Dim. reduction} & \text{Visualisation, manifold} \\
\text{Autoencoder} & 1989 & \text{Dim. reduction} & \text{Nonlinear} \\
\hline
\text{Spiking NN} & 1997 & \text{Neural, special} & \text{Neuromorphic hardware} \\
\text{Reservoir} & 2001/02 & \text{Neural, special} & \text{Physical computing} \\
\text{Capsule} & 2011/17 & \text{Neural, special} & \text{Viewpoint-equivariant} \\
\text{Normalising flow} & 2015 & \text{Generative} & \text{Exact likelihood} \\
\text{GAN} & 2014 & \text{Generative} & \text{Sharp samples} \\
\text{Diffusion} & 2015/20 & \text{Generative} & \text{Image/audio generation} \\
\hline
\text{Persistent homology} & 2002 & \text{TDA} & \text{Shape of data} \\
\text{Mapper} & 2007 & \text{TDA} & \text{Graph from data} \\
\hline
\text{Do-calculus} & 1995 & \text{Causal} & \text{Intervention} \\
\text{Causal forest} & 2018 & \text{Causal} & \text{Heterogeneous treatment} \\
\text{DML} & 2018 & \text{Causal} & \text{Doubly robust} \\
\hline
\text{Isolation Forest} & 2008 & \text{Anomaly} & \text{Tree-based anomaly} \\
\text{LOF} & 2000 & \text{Anomaly} & \text{Density-based anomaly} \\
\text{One-Class SVM} & 2001 & \text{Anomaly} & \text{Boundary anomaly} \\
\hline
\text{Information Bottleneck} & 2000 & \text{Info. theory} & \text{Compression} \\
\text{Maximum Entropy} & 1957 & \text{Info. theory} & \text{Principled distributions} \\
\hline
\text{Stan/PyMC} & 2017/16 & \text{Prob. programming} & \text{Bayesian modelling} \\
\hline
\end{array}
$$

More than eighty algorithms. Twenty-plus research communities. Half a dozen deep-learning paradigms. Eight classical learning paradigms that *predate* deep learning and remain competitive on the problems they were designed for.
</div>

<div class="md">
## The lesson

The LLM is the loudest voice in the room. It is also one of the youngest. The other eighty algorithms in this chapter predate it by an average of more than three decades, and the engineering infrastructure that supports them — MCMC samplers, gradient-boosted-tree libraries, kd-trees, kernel methods, sparse GP approximations, probabilistic programming systems — is older than the course.

The right way to use this chapter is not to memorise every algorithm. It is to walk away with a *map of the landscape*. The next time you have a dataset, the first question is not "how do I fine-tune a Transformer?" but rather: *what kind of problem is this?* Is it classification, regression, clustering, density estimation, anomaly detection, forecasting, causal inference, or something else? Is the data tabular, sequential, graph-shaped, image-shaped, or text-shaped? Is interpretability required? Is calibrated uncertainty required? Is there a constraint on the inference budget?

The answers to those questions narrow the field of candidate algorithms from eighty to a handful. The answer is rarely "a Transformer". More often, it is a well-tuned classical algorithm that has been solving exactly this problem for half a century. The course's other chapters describe the Transformer; this chapter describes the room it sits in.
</div>

<div class="md">
## Further reading

For clustering: \citeauthor{jain2010clustering} (\citeyear{jain2010clustering}) is the canonical survey. For dimensionality reduction and manifold learning: \citeauthor{van2009dimensionality} (\citeyear{van2009dimensionality}). For kernel methods: \citeauthor{scholkopf2002learning} (\citeyear{scholkopf2002learning}). For Bayesian methods: \citeauthor{gelman2013bda} (\citeyear{gelman2013bda}) and \citeauthor{rasmussen2006gpbook} (\citeyear{rasmussen2006gpbook}). For reinforcement learning: \citeauthor{sutton2018rlbook} (\citeyear{sutton2018rlbook}). For causal inference: \citeauthor{pearl2009book} (\citeyear{pearl2009book}) and \citeauthor{imbens2015causal} (\citeyear{imbens2015causal}). For graph neural networks: \citeauthor{hamilton2020graphbook} (\citeyear{hamilton2020graphbook}). For probabilistic programming: \citeauthor{carpenter2017stan} (\citeyear{carpenter2017stan}). For symbolic AI: \citeauthor{russell2010aima} (\citeyear{russell2010aima}).
</div>
