"use client";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import states from "us-atlas/states-10m.json";
import { useMemo } from "react";

const W = 960;
const H = 600;

export function UsMap({
  cells,
  markets,
}: {
  cells: { lat: number; lon: number; affinity: number }[];
  markets: { name: string; lat: number; lon: number; score: number }[];
}) {
  const { outline, borders, project } = useMemo(() => {
    const topo = states as unknown as Topology<{ states: GeometryCollection }>;
    const land = feature(topo, topo.objects.states);
    const projection = geoAlbersUsa().fitSize([W, H], land);
    const path = geoPath(projection);
    return {
      outline: path(land) ?? "",
      borders: path(mesh(topo, topo.objects.states, (a, b) => a !== b)) ?? "",
      project: (lon: number, lat: number) => projection([lon, lat]),
    };
  }, []);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Map of US areas where this audience over-indexes">
      <path d={outline} fill="#ffffff0d" />
      <path d={borders} fill="none" stroke="#ffffff22" strokeWidth={0.8} />
      {cells.map((c, i) => {
        const p = project(c.lon, c.lat);
        if (!p) return null;
        return <circle key={i} cx={p[0]} cy={p[1]} r={6 + c.affinity * 18} fill="#ff4d4f" opacity={0.15 + c.affinity * 0.35} />;
      })}
      {markets.slice(0, 6).map((m, i) => {
        const p = project(m.lon, m.lat);
        if (!p) return null;
        const left = p[0] > W - 200;
        return (
          <g key={m.name}>
            <circle cx={p[0]} cy={p[1]} r={6} fill="#fbf7f6" />
            <text
              x={p[0] + (left ? -12 : 12)}
              y={p[1] + 6}
              textAnchor={left ? "end" : "start"}
              fill="#fbf7f6"
              fontSize={22}
              fontWeight={600}
              style={{ paintOrder: "stroke", stroke: "#090304", strokeWidth: 5 }}
            >
              {i + 1}. {m.name.split(",")[0]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
