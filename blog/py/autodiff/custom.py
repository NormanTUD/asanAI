import math

class Var:
    """A node in the computational graph."""
    def __init__(self, value, children=(), op=''):
        self.value = value
        self.grad = 0.0          # adjoint: df/d(self)
        self._backward = lambda: None  # closure to propagate gradient
        self._children = children
        self._op = op

    def __add__(self, other):
        other = other if isinstance(other, Var) else Var(other)
        out = Var(self.value + other.value, (self, other), '+')
        def _backward():
            # d(a+b)/da = 1, d(a+b)/db = 1
            self.grad  += 1.0 * out.grad
            other.grad += 1.0 * out.grad
        out._backward = _backward
        return out

    def __mul__(self, other):
        other = other if isinstance(other, Var) else Var(other)
        out = Var(self.value * other.value, (self, other), '*')
        def _backward():
            # d(a*b)/da = b, d(a*b)/db = a
            self.grad  += other.value * out.grad
            other.grad += self.value  * out.grad
        out._backward = _backward
        return out

    def sin(self):
        out = Var(math.sin(self.value), (self,), 'sin')
        def _backward():
            # d(sin(a))/da = cos(a)
            self.grad += math.cos(self.value) * out.grad
        out._backward = _backward
        return out

    def backward(self):
        """Topological sort + reverse traversal."""
        topo, visited = [], set()
        def build(v):
            if v not in visited:
                visited.add(v)
                for c in v._children:
                    build(c)
                topo.append(v)
        build(self)
        self.grad = 1.0  # seed
        for node in reversed(topo):
            node._backward()

# ── Usage ──
x = Var(math.pi / 2)
y = Var(1.0)

f = (x + y) * x.sin()   # f(x,y) = (x+y) * sin(x)
f.backward()

print(f"f  = {f.value:.4f}")
print(f"df/dx = {x.grad:.4f}")   # sin(x) + (x+y)*cos(x)
print(f"df/dy = {y.grad:.4f}")   # sin(x)
