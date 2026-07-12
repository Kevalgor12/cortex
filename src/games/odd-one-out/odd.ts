// Odd One Out round generator. A grid of tiles shares one colour, except a
// single tile whose shade is slightly off. Difficulty climbs on two axes at
// once: the grid grows and the colour difference shrinks, so late rounds pack
// more tiles that look almost identical.

export interface OddChallenge {
  /** Grid is `size` x `size`. */
  size: number;
  baseColor: string;
  oddColor: string;
  /** Index (0..size*size-1) of the odd tile. */
  oddIndex: number;
}

function rand(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function gridSize(level: number): number {
  if (level <= 2) return 3;
  if (level <= 4) return 4;
  if (level <= 6) return 5;
  return 6;
}

export function createOddChallenge(level: number): OddChallenge {
  const size = gridSize(level);
  const cells = size * size;

  const hue = rand(0, 359);
  const saturation = rand(55, 72);
  const lightness = rand(46, 60);

  // The lightness gap between the odd tile and the rest — the whole game.
  const delta = Math.max(5, 26 - level * 3);
  const sign = Math.random() < 0.5 ? -1 : 1;
  const oddLightness = lightness + sign * delta;

  return {
    size,
    baseColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    oddColor: `hsl(${hue}, ${saturation}%, ${oddLightness}%)`,
    oddIndex: rand(0, cells - 1),
  };
}
