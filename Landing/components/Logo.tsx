import type { FC } from "react";

/**
 * THEYINE node mark — an original SVG recreation of the brand's geometric
 * network symbol (six perimeter nodes + a central hub) representing
 * connection, intelligence and automation. Uses `currentColor` so it adapts
 * to any context. No raster asset is embedded.
 */

type MarkProps = {
  size?: number;
  className?: string;
};

// Pointy-top hexagon vertices around a centre at (50,50), radius 40.
const NODES: [number, number][] = [
  [50, 10], // top
  [84.6, 30], // upper-right
  [84.6, 70], // lower-right
  [50, 90], // bottom
  [15.4, 70], // lower-left
  [15.4, 30], // upper-left
];
const CENTER: [number, number] = [50, 50];

export const TheyineMark: FC<MarkProps> = ({ size = 40, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    role="img"
    aria-label="THEYINE network mark"
    className={className}
  >
    {/* Perimeter edges */}
    {NODES.map((node, i) => {
      const next = NODES[(i + 1) % NODES.length];
      return (
        <line
          key={`edge-${i}`}
          x1={node[0]}
          y1={node[1]}
          x2={next[0]}
          y2={next[1]}
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
        />
      );
    })}
    {/* Spokes to the central hub */}
    {NODES.map((node, i) => (
      <line
        key={`spoke-${i}`}
        x1={node[0]}
        y1={node[1]}
        x2={CENTER[0]}
        y2={CENTER[1]}
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        opacity={0.55}
      />
    ))}
    {/* Nodes */}
    {NODES.map((node, i) => (
      <circle key={`node-${i}`} cx={node[0]} cy={node[1]} r={7} fill="currentColor" />
    ))}
    <circle cx={CENTER[0]} cy={CENTER[1]} r={8} fill="currentColor" />
  </svg>
);

type LogoProps = {
  size?: number;
  className?: string;
  /** Hide the wordmark and show only the symbol */
  markOnly?: boolean;
};

export const Logo: FC<LogoProps> = ({ size = 30, className = "", markOnly = false }) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <TheyineMark size={size} className="text-ink" />
    {!markOnly && (
      <span className="text-xl font-bold tracking-tight text-ink">Theyine</span>
    )}
  </span>
);

export default Logo;
