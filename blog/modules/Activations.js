class Activations {
	/**
	 * ReLU: Returns x if x > 0, else 0.
	 * LaTeX: f(x) = \max(0, x)
	 */
	static relu(x) {
		return Math.max(0, x);
	}

	/**
	 * GeLU: Smooth approximation of ReLU used in GPT-2/3.
	 * LaTeX: f(x) = 0.5x(1 + \tanh(\sqrt{2/\pi}(x + 0.044715x^3)))
	 */
	static gelu(x) {
		return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * Math.pow(x, 3))));
	}
}
