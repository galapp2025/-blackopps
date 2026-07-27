from __future__ import annotations

from collections import deque
from typing import Any


class InfluenceNetwork:
    def __init__(self) -> None:
        self._entities: dict[str, dict[str, Any]] = {}
        self._edges: dict[str, set[str]] = {}
        self._edge_meta: dict[tuple[str, str], dict[str, Any]] = {}

    def add_entity(self, name: str, data: dict[str, Any] | None = None) -> None:
        self._entities[name] = data or {}
        self._edges.setdefault(name, set())

    def add_connection(self, source: str, target: str, relation: str = "associated", weight: float = 1.0) -> None:
        self.add_entity(source)
        self.add_entity(target)
        self._edges.setdefault(source, set()).add(target)
        self._edges.setdefault(target, set()).add(source)
        key = tuple(sorted((source, target)))
        self._edge_meta[key] = {"relation": relation, "weight": weight}

    def find_path(self, source: str, target: str, max_depth: int = 4) -> list[str]:
        if source not in self._edges or target not in self._edges:
            return []
        if source == target:
            return [source]
        queue: deque[tuple[str, list[str]]] = deque([(source, [source])])
        visited = {source}
        while queue:
            node, path = queue.popleft()
            if len(path) > max_depth:
                continue
            for neighbor in self._edges.get(node, set()):
                if neighbor in visited:
                    continue
                next_path = path + [neighbor]
                if neighbor == target:
                    return next_path
                visited.add(neighbor)
                queue.append((neighbor, next_path))
        return []

    def identify_hubs(self, min_connections: int = 3) -> list[dict[str, Any]]:
        hubs = []
        for name, neighbors in self._edges.items():
            count = len(neighbors)
            if count >= min_connections:
                hubs.append({"entity": name, "connections": count})
        return sorted(hubs, key=lambda item: item["connections"], reverse=True)

    def compute_centrality(self, sample_size: int = 20) -> dict[str, float]:
        nodes = list(self._edges.keys())
        if not nodes:
            return {}
        sample = nodes[:sample_size]
        scores = {node: 0.0 for node in nodes}
        for src in sample:
            for dst in sample:
                if src == dst:
                    continue
                path = self.find_path(src, dst, max_depth=4)
                if len(path) > 2:
                    for mid in path[1:-1]:
                        scores[mid] = scores.get(mid, 0.0) + 1.0
        max_score = max(scores.values()) if scores else 1.0
        if max_score <= 0:
            return {k: 0.0 for k in scores}
        return {k: round(v / max_score, 3) for k, v in scores.items()}

    def get_cluster(self, entity: str, depth: int = 2) -> dict[str, Any]:
        if entity not in self._edges:
            return {"entity": entity, "cluster": [], "size": 0, "hub_count": 0}
        seen = {entity}
        frontier = {entity}
        cluster: list[dict[str, Any]] = []
        for _ in range(depth):
            nxt: set[str] = set()
            for node in frontier:
                for neighbor in self._edges.get(node, set()):
                    if neighbor in seen:
                        continue
                    seen.add(neighbor)
                    nxt.add(neighbor)
                    key = tuple(sorted((node, neighbor)))
                    meta = self._edge_meta.get(key, {})
                    cluster.append({"entity": neighbor, "via": node, **meta})
            frontier = nxt
        hubs = self.identify_hubs(min_connections=3)
        hub_names = {h["entity"] for h in hubs}
        return {
            "entity": entity,
            "cluster": cluster,
            "size": len(seen),
            "hub_count": len([n for n in seen if n in hub_names]),
        }

    def build_from_collected_data(self, name: str, data: dict[str, Any]) -> None:
        self.add_entity(name, data)
        for conn in data.get("connections") or []:
            target = str(conn.get("target") or conn.get("name") or "")
            if not target:
                continue
            self.add_connection(name, target, str(conn.get("relation") or "associated"), float(conn.get("weight") or 1.0))
        political = data.get("political", {})
        for role in political.get("political_roles") or []:
            org = str(role.get("organization") or role.get("party") or "")
            if org:
                self.add_connection(name, org, "political", 1.2)
        financial = data.get("financial", {})
        for company in financial.get("company_names") or []:
            self.add_connection(name, str(company), "business", 1.0)
        for rel in data.get("family_connections") or []:
            self.add_connection(name, str(rel), "family", 1.5)
        for geo in data.get("geographic_links") or []:
            self.add_connection(name, str(geo), "geographic", 0.8)

    def summary(self) -> dict[str, Any]:
        return {
            "entities": len(self._entities),
            "edges": sum(len(v) for v in self._edges.values()) // 2,
            "hubs": self.identify_hubs(min_connections=3)[:10],
        }
