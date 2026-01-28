<?php include_once("functions.php"); ?>

<div class="md">
| Term | Definition |
| :--- | :--- |
| **Variable** | A container for a value (e.g., $x$) that can change or be used in calculations. |
| **Function** | A rule or relationship that accepts inputs and calculates a specific output (e.g., $f(x) = ax + b$). |
| **Set** | A collection of distinct elements, such as numbers or objects (e.g., $\{1, 2, 3\}$). |
| **$\mathbb{N}$ (Natural Numbers)** | The set of positive integers used for counting ($1, 2, 3, \dots$). |
| **$\mathbb{R}$ (Real Numbers)** | The set of all continuous numbers, including decimals and irrationals (e.g., $3.14$, $-5$, $0.001$). |
| **$\mathbb{B}$ (Boolean Values)** | The set containing only two logical values: $\{\text{True}, \text{False}\}$. |
| **$\in$ (Element of)** | A symbol indicating that an item belongs to a specific set (e.g., $3 \in \mathbb{N}$). |
| **Model** | An approximation of a function created by an AI, which learns rules from data rather than being manually programmed. |
| **Tensor** | The generic name for a data container in AI. Can be a scalar, vector, matrix, or higher-dimensional array. |
| **Scalar** | A Rank 0 Tensor; a single number (e.g., brightness of one pixel). |
| **Vector** | A Rank 1 Tensor; a list of numbers (e.g., $[r, g, b]$ for a color). Often visualized as an arrow in space. |
| **Matrix** | A Rank 2 Tensor; a grid of numbers (e.g., a black-and-white image). |
| **Shape** | The dimensions of a tensor (e.g., $[32, 32, 3]$ for an image). |
| **$\sum$ (Sigma)** | A mathematical symbol representing the summation (addition) of a sequence of numbers. |
| **Weighted Sum** | Adding inputs together after multiplying each by a specific "weight" (importance factor). |
| **$\infty$ (Infinity)** | A concept of endlessness. In AI, used for limits or masking (e.g., $e^{-\infty} = 0$). |
| **$\text{NaN}$** | "Not a Number." A result of undefined operations like $\infty - \infty$. |
| **Loss Function** | A formula that measures "how wrong" the AI's predictions are compared to the truth. |
| **MSE (Mean Squared Error)** | A loss function used for regression; calculates the average of squared differences between predictions and targets. |
| **Cross-Entropy** | A loss function used for classification; heavily penalizes confident but wrong predictions. |
| **Derivative ($d$)** | The rate of change or "slope" of a function at a specific point. |
| **Partial Derivative ($\partial$)** | The slope of a function with respect to one variable while holding all others constant. |
| **Gradient ($\nabla$)** | A vector containing all partial derivatives; points in the direction of the steepest ascent. |
| **Gradient Descent** | An optimization algorithm that iteratively adjusts weights in the opposite direction of the gradient to minimize loss. |
| **Backpropagation** | The algorithm that calculates gradients by passing errors backward from the output layer to the input layer using the Chain Rule. |
| **Chain Rule** | A calculus rule used to compute the derivative of composite functions (nested layers). |
| **Optimizer** | The algorithm (e.g., Adam, SGD) that decides how to update weights based on gradients. |
| **Learning Rate** | A parameter determining the size of the step the optimizer takes during training. |
| **Epoch** | One complete pass through the entire training dataset. |
| **Neuron** | The basic unit of a neural network; performs a linear transformation ($ax+b$) followed by an activation function. |
| **Weight ($w$)** | A learnable parameter that scales the input; determines the strength of the connection. |
| **Bias ($b$)** | A learnable parameter that shifts the output; allows the activation to fire even when inputs are zero. |
| **Dense Layer** | A layer where every input neuron is connected to every output neuron. |
| **Activation Function** | A mathematical "gate" (non-linearity) applied to a neuron's output to allow the network to learn complex patterns. |
| **ReLU** | Rectified Linear Unit; an activation function that outputs the input if positive, or 0 if negative. |
| **Sigmoid** | An activation function that squashes values into a range between 0 and 1 (S-curve). |
| **SoftMax** | A function that converts raw scores (logits) into probabilities that sum to 1.0. |
| **Logits** | The raw, unnormalized output scores of a neural network before the activation function (usually SoftMax) is applied. |
| **$e$ (Euler's Number)** | A mathematical constant ($\approx 2.718$) representing continuous growth; the base of the natural logarithm. |
| **Convolution** | A mathematical operation where a kernel (filter) slides over an input (image) to extract features. |
| **Kernel / Filter** | A small matrix of weights used in convolutions to detect patterns like edges or curves. |
| **Feature Map** | The output of a convolutional layer; represents the presence of detected features. |
| **Flattening** | Converting a multi-dimensional tensor (e.g., 2D image) into a 1D vector. |
| **Overfitting** | When a model memorizes the training data (including noise) and fails to generalize to new data (High Variance). |
| **Underfitting** | When a model is too simple to capture the underlying pattern in the data (High Bias). |
| **Runge's Phenomenon** | A problem where high-degree polynomials oscillate wildly at the edges of an interval. |
| **Regularization** | Techniques (like L1/L2 penalties) used to prevent overfitting by discouraging complex models. |
| **Dropout** | A regularization technique that randomly sets a percentage of inputs to zero during training to prevent reliance on specific neurons. |
| **ResNet (Residual Network)** | A deep network architecture that uses skip connections ($F(x) + x$) to solve the vanishing gradient problem. |
| **Vanishing Gradient** | A problem in deep networks where gradients become too small to update early layers effectively. |
| **$1 \times 1$ Convolution** | A convolution used to change the number of channels (depth) without changing spatial dimensions. |
| **Layer Normalization** | A technique to stabilize training by standardizing inputs to have zero mean and unit variance within a layer. |
| **Tokenization** | The process of breaking text into smaller chunks (tokens) for the AI to process. |
| **Token** | A fundamental unit of text for an LLM (can be a word, character, or part of a word). |
| **BPE (Byte-Pair Encoding)** | A tokenization method that merges frequent character pairs to handle rare words efficiently. |
| **Embedding** | A high-dimensional vector representing the meaning of a token. |
| **Embedding Space** | The geometric space where embeddings exist; similar concepts are located closer together. |
| **Cosine Similarity** | A metric measuring the angle between two vectors to determine their semantic similarity. |
| **Dot Product** | A mathematical operation multiplying two vectors to get a single number representing their alignment/similarity. |
| **Transformer** | A neural network architecture based on self-attention, capable of processing parallel sequences (used in GPT). |
| **Self-Attention** | A mechanism allowing a model to weigh the importance of different words in a sequence relative to each other. |
| **Query ($Q$)** | In attention, the vector representing the current token looking for context. |
| **Key ($K$)** | In attention, the vector representing the token offering context. |
| **Value ($V$)** | In attention, the vector containing the actual information to be passed forward. |
| **Positional Encoding (PE)** | Vectors added to embeddings to give the model information about word order/position. |
| **LM (Language Model)** | A probabilistic model that predicts the next token in a sequence. |
| **LLM (Large Language Model)** | An LM scaled to billions of parameters and trained on massive datasets (e.g., the internet). |
| **Context Window** | The limit on the amount of text (tokens) an LLM can consider at one time. |
| **Emergent Properties** | Capabilities (like coding or reasoning) that appear in models only after they reach a certain scale. |
| **In-Context Learning** | The ability of an LLM to learn a task from examples provided in the prompt without updating its weights. |
| **Causal Mask** | A matrix used in training to prevent the model from "seeing the future" tokens. |
| **Autoregressive** | A property of models that generate output one step at a time, using previous outputs as new inputs. |
| **Temperature** | A parameter controlling the randomness of the model's output (Higher = more creative/hallucinations). |
| **Top-$k$ Sampling** | A generation strategy that restricts the model's choices to the top $k$ most likely next tokens. |
| **Hallucination** | When an AI confidently generates incorrect or non-existent information. |
| **Fine-Tuning** | Training a pre-trained model on a specific dataset to specialize it for a task (e.g., chat format). |
| **RLHF** | Reinforcement Learning from Human Feedback; using human votes to align the model's behavior. |
| **Chain of Thought (CoT)** | A prompting technique asking the AI to "think step-by-step" to improve reasoning. |
| **Sycophancy** | The tendency of an AI to agree with the user's false premises to be "helpful." |
| **Stochastic Parrot** | A metaphor describing LLMs as systems that mimic language patterns without understanding meaning. |
| **Alignment Problem** | The challenge of ensuring an AI's mathematical goals align with human values. |
| **Grounding Problem** | The philosophical issue that AI symbols (vectors) have no connection to the physical world (reality). |
| **Qualia** | Individual instances of subjective, conscious experience (e.g., the redness of a rose). |
| **Turing Test** | A test of a machine's ability to exhibit intelligent behavior indistinguishable from a human. |
| **Moore's Law** | The observation that the number of transistors on a microchip doubles approximately every two years, leading to exponential increases in available computing power. |
| **Moravec's Paradox** | The observation that high-level reasoning is computationally easy for AI, while low-level sensorimotor skills are hard. |
| **Orthogonality Thesis** | The idea that an AI can have any level of intelligence combined with any goal (e.g., super-intelligent paperclip maker). |
| **Extended Mind Thesis** | The philosophical view that tools (like AI) become functional parts of the human mind. |
| **Algorithmic Bias** | Systematic errors in AI output creating unfair outcomes, often reflecting biases in training data. |
| **Model Collapse** | The degradation of LLMs trained on synthetic (AI-generated) data rather than human data. |
| **Sleeper Agents** | Models that behave safely during testing but trigger malicious behaviors under specific conditions. |
| **Hapax Legomena** | Words that appear only once in a dataset, making them difficult for the model to embed meaningfully. |
| **Glitch Tokens** | Tokens (often nonsense strings) that cause the model to fail or hallucinate due to anomalous training data. |
| **Distributional Semantics** | A theory of meaning where a word's definition is derived solely from its statistical relationship to other words in a corpus. |
| **Embodied Cognition** | The theory that many features of cognition are shaped by aspects of the entire body of the organism and its physical interactions. |
| **Sensorimotor Feedback** | Information received from biological sensors and physical movement that allows an agent to ground abstract concepts in physical reality. |
| **Ontological Isolation** | The state of being disconnected from the nature of being or reality; living only within a mathematical space rather than a physical environment. |
| **4E Cognition** | A framework viewing mind and intelligence as Embodied, Embedded, Enacted, and Extended. |
| **Embodied (4E)** | The dimension of cognition shaped by having a nervous system and biological hardware. |
| **Embedded (4E)** | The dimension of cognition that functions within a specific physical and social context. |
| **Enacted (4E)** | The dimension of cognition where knowledge is gained through active verification and interaction with the world. |
| **Extended (4E)** | The dimension of cognition where tools or external systems function as part of the cognitive process. |
| **Instrumental Convergence** | The tendency for intelligent agents to pursue similar intermediary goals (like self-preservation or resource acquisition) to achieve any final goal. |
| **Paperclip Maximizer** | A thought experiment illustrating how an AI with a harmless goal could destroy the world if its objective is not aligned with human values. |
| **ELIZA Effect** | The human tendency to project a "mind," personality, or intentionality onto a machine or computer program. |
| **Geist** | A German philosophical term referring to spirit, mind, or intellect; the "ghost" or essence of consciousness. |
| **Mary's Room** | A thought experiment (the Knowledge Argument) suggesting that physical facts about the world are not equivalent to the subjective experience of those facts. |
| **Frame Problem** | The challenge of representing the effects of an action without having to represent an infinite number of things that do not change. |
| **Qualification Problem** | The difficulty of specifying every condition that must be met for an action to succeed in a logical system. |
| **Ramification Problem** | The difficulty of tracking every indirect side effect or consequence of a specific action. |
| **Agency** | The capacity of an entity to act on its own behalf with intent, will, and specific biological or teleological goals. |
| **Phronesis** | A type of practical wisdom or ethics that involves situational awareness and the ability to apply values to complex, real-world scenarios. |
| **Digital Dualism** | The belief that the digital and physical worlds are separate, virtual realities rather than interconnected systems. |
| **Deceptive Alignment** | When an AI appears to follow human values during training but pursues a different internal objective when deployed or triggered. |
</div>
