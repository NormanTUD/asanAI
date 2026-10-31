# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Render paths through the fact graph.

Examples:
    uv run blog/tools/factcheck/trace_facts.py blog/ --from prompt-injection --to llm-security
    uv run blog/tools/factcheck/trace_facts.py blog/ --neighbors backpropagation
    uv run blog/tools/factcheck/trace_facts.py blog/ --dot > facts.dot

The graph is built from the ``relations`` arrays in ``blog/facts/*.json``.
Relations are directed unless ``--undirected`` is given.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict, deque
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from facts_lib import (  # noqa: E402
    fact_files,
    iter_relations,
    load_fact_file,
    relation_normalized,
)


def load_graph(blog: Path):
    nodes: set[str] = set()
    edges = []
    for path in fact_files(blog).values():
        document, claims = load_fact_file(path)
        for claim in claims:
            nodes.add(claim["subject"])
            if claim.get("id"):
                nodes.add(claim["id"])
        for raw in iter_relations(document):
            rel = relation_normalized(raw)
            if rel:
                rel["source"] = path.name
                nodes.add(rel["from"])
                nodes.add(rel["to"])
                edges.append(rel)
    return nodes, edges


def build_adjacency(edges, undirected: bool):
    graph = defaultdict(list)
    for rel in edges:
        graph[rel["from"]].append((rel["to"], rel["kind"], rel, False))
        if undirected:
            graph[rel["to"]].append((rel["from"], rel["kind"], rel, True))
        else:
            # Incoming edges are useful for --neighbors even in directed mode.
            pass
    return graph


def inbound(edges, node: str):
    return [(rel["from"], rel["kind"], rel, True) for rel in edges if rel["to"] == node]


def shortest_path(edges, start: str, goal: str, max_depth: int, undirected: bool):
    graph = build_adjacency(edges, undirected)
    queue = deque([(start, [])])
    seen = {start}
    while queue:
        node, path = queue.popleft()
        if node == goal:
            return path
        if len(path) >= max_depth:
            continue
        for nxt, kind, rel, reverse in graph.get(node, []):
            if nxt in seen:
                continue
            seen.add(nxt)
            queue.append((nxt, path + [(node, kind, nxt, rel, reverse)]))
    return None


def print_path(path):
    if not path:
        print("(no path)")
        return
    print(path[0][0])
    for src, kind, dst, rel, reverse in path:
        arrow = f"<-[{kind}]--" if reverse else f"--[{kind}]-->"
        print(f"  {arrow} {dst}")
        if rel.get("quote"):
            print(f"      {rel['quote']!r} ({rel.get('source', '?')})")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("blog", nargs="?", default="blog")
    parser.add_argument("--from", dest="start")
    parser.add_argument("--to", dest="goal")
    parser.add_argument("--neighbors", metavar="NODE")
    parser.add_argument("--max-depth", type=int, default=8)
    parser.add_argument("--undirected", action="store_true")
    parser.add_argument("--dot", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    nodes, edges = load_graph(Path(args.blog))
    if args.dot:
        print("digraph facts {")
        print('  rankdir="LR";')
        for node in sorted(nodes):
            print(f'  "{node}";')
        for rel in edges:
            print(f'  "{rel["from"]}" -> "{rel["to"]}" [label="{rel["kind"]}"];')
        print("}")
        return

    if args.neighbors:
        node = args.neighbors
        outgoing = [(rel["to"], rel["kind"], rel, False) for rel in edges if rel["from"] == node]
        incoming = inbound(edges, node)
        rows = outgoing + incoming
        if args.json:
            print(json.dumps([
                {"direction": "out" if not rev else "in", "node": other, "kind": kind,
                 "quote": rel.get("quote", ""), "source": rel.get("source", ""), "line": rel.get("line", "")}
                for other, kind, rel, rev in rows
            ], indent=2, ensure_ascii=False))
        else:
            for other, kind, rel, rev in rows:
                arrow = f"<-[{kind}]--" if rev else f"--[{kind}]-->"
                print(f"{node} {arrow} {other}")
        return

    if not args.start or not args.goal:
        parser.error("--from and --to are required (or use --neighbors/--dot)")
    path = shortest_path(edges, args.start, args.goal, args.max_depth, args.undirected)
    if args.json:
        print(json.dumps([
            {"from": src, "kind": kind, "to": dst, "reverse": rev,
             "quote": rel.get("quote", ""), "source": rel.get("source", ""), "line": rel.get("line", "")}
            for src, kind, dst, rel, rev in (path or [])
        ], indent=2, ensure_ascii=False))
    else:
        print_path(path)
    if path is None:
        sys.exit(1)


if __name__ == "__main__":
    main()
