// Solo Chess puzzle. Every move is a capture, each piece may move at most
// twice, and the goal is to reduce the board to a single piece.
//
// Puzzles are generated backwards from the lone survivor: repeatedly "un-move"
// a piece to an empty square along a clear path and drop the captured piece
// where it stood. Requiring a clear path each step guarantees the forward
// solution is legal, so every board is solvable by construction.

export type PieceType = 'queen' | 'rook' | 'bishop' | 'knight';

export interface Piece {
  type: PieceType;
  /** Moves used so far (max 2). */
  moves: number;
}

export type Board = (Piece | null)[];

export interface SoloChessPuzzle {
  size: number;
  board: Board;
}

const ROOK_DIRS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
const BISHOP_DIRS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];
const QUEEN_DIRS = [...ROOK_DIRS, ...BISHOP_DIRS];
const KNIGHT_OFFSETS = [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1],
];

const rc = (i: number, size: number): [number, number] => [Math.floor(i / size), i % size];
const inBounds = (r: number, c: number, size: number) => r >= 0 && r < size && c >= 0 && c < size;

function randInt(n: number): number {
  return Math.floor(Math.random() * n);
}

function randType(): PieceType {
  // Queens are rare — they trivialise puzzles.
  return (['rook', 'bishop', 'knight', 'rook', 'bishop', 'knight', 'queen'] as PieceType[])[randInt(7)];
}

function dirsFor(type: PieceType): number[][] {
  if (type === 'rook') return ROOK_DIRS;
  if (type === 'bishop') return BISHOP_DIRS;
  return QUEEN_DIRS;
}

function occupied(board: Board): number[] {
  const out: number[] = [];
  for (let i = 0; i < board.length; i++) if (board[i]) out.push(i);
  return out;
}

// Squares holding a piece that the piece at `from` could capture.
export function captureTargets(board: Board, from: number, size: number): number[] {
  const piece = board[from];
  if (!piece) return [];
  const [r, c] = rc(from, size);
  const targets: number[] = [];

  if (piece.type === 'knight') {
    for (const [dr, dc] of KNIGHT_OFFSETS) {
      const rr = r + dr;
      const cc = c + dc;
      if (inBounds(rr, cc, size) && board[rr * size + cc]) targets.push(rr * size + cc);
    }
    return targets;
  }

  for (const [dr, dc] of dirsFor(piece.type)) {
    let rr = r + dr;
    let cc = c + dc;
    while (inBounds(rr, cc, size)) {
      const j = rr * size + cc;
      if (board[j]) {
        targets.push(j);
        break; // blocked beyond the first piece
      }
      rr += dr;
      cc += dc;
    }
  }
  return targets;
}

// Empty squares a piece of `type` at `from` could slide/jump to (clear path).
function reachableEmpty(board: Board, from: number, type: PieceType, size: number): number[] {
  const [r, c] = rc(from, size);
  const out: number[] = [];

  if (type === 'knight') {
    for (const [dr, dc] of KNIGHT_OFFSETS) {
      const rr = r + dr;
      const cc = c + dc;
      if (inBounds(rr, cc, size) && !board[rr * size + cc]) out.push(rr * size + cc);
    }
    return out;
  }

  for (const [dr, dc] of dirsFor(type)) {
    let rr = r + dr;
    let cc = c + dc;
    while (inBounds(rr, cc, size)) {
      const j = rr * size + cc;
      if (board[j]) break;
      out.push(j);
      rr += dr;
      cc += dc;
    }
  }
  return out;
}

export function createSoloChessPuzzle(size = 6, pieceCount = 7): SoloChessPuzzle {
  const minPieces = Math.min(pieceCount, 5);

  for (let attempt = 0; attempt < 40; attempt++) {
    const board: Board = new Array(size * size).fill(null);
    board[randInt(size * size)] = { type: randType(), moves: 0 };
    let pieces = 1;
    let stalls = 0;

    while (pieces < pieceCount && stalls < 40) {
      const movable = occupied(board).filter((sq) => board[sq]!.moves < 2);
      if (!movable.length) break;
      const y = movable[randInt(movable.length)];
      const piece = board[y]!;
      const froms = reachableEmpty(board, y, piece.type, size);
      if (!froms.length) {
        stalls++;
        continue;
      }
      const x = froms[randInt(froms.length)];
      board[x] = { type: piece.type, moves: piece.moves + 1 };
      board[y] = { type: randType(), moves: 0 };
      pieces++;
      stalls = 0;
    }

    if (pieces >= minPieces) {
      for (const sq of occupied(board)) board[sq]!.moves = 0; // player starts fresh
      return { size, board };
    }
  }

  // Fallback — a trivially small board (extremely unlikely to be reached).
  const board: Board = new Array(size * size).fill(null);
  board[0] = { type: 'rook', moves: 0 };
  board[1] = { type: 'knight', moves: 0 };
  return { size, board };
}

// Forward search used to verify a board is solvable (for tests).
export function isSolvable(board: Board, size: number): boolean {
  const start = board.map((p) => (p ? { ...p } : null));
  const seen = new Set<string>();
  const key = (b: Board) => b.map((p) => (p ? p.type[0] + p.moves : '.')).join('');

  const dfs = (b: Board, count: number): boolean => {
    if (count === 1) return true;
    const k = key(b);
    if (seen.has(k)) return false;
    seen.add(k);
    for (const from of occupied(b)) {
      if (b[from]!.moves >= 2) continue;
      for (const to of captureTargets(b, from, size)) {
        const nb = b.slice();
        nb[to] = { type: b[from]!.type, moves: b[from]!.moves + 1 };
        nb[from] = null;
        if (dfs(nb, count - 1)) return true;
      }
    }
    return false;
  };

  return dfs(start, occupied(start).length);
}

export function countPieces(board: Board): number {
  return occupied(board).length;
}

// Is any legal capture available? (Used to detect a stuck board.)
export function hasAnyMove(board: Board, size: number): boolean {
  return occupied(board).some((from) => board[from]!.moves < 2 && captureTargets(board, from, size).length > 0);
}

const PIECE_NAME: Record<PieceType, string> = {
  queen: 'queen',
  rook: 'rook',
  bishop: 'bishop',
  knight: 'knight',
};

export interface SoloHint {
  from: number;
  to: number;
  reason: string;
}

// Suggest a capture that keeps the board solvable, and explain why it's the
// move to make now.
export function soloHint(board: Board, size: number): SoloHint | null {
  for (let from = 0; from < board.length; from++) {
    const piece = board[from];
    if (!piece || piece.moves >= 2) continue;

    for (const to of captureTargets(board, from, size)) {
      const next = board.map((p) => (p ? { ...p } : null));
      next[to] = { type: piece.type, moves: piece.moves + 1 };
      next[from] = null;
      if (!isSolvable(next, size)) continue;

      // Is this the only piece that can take the target?
      const otherCapturers = occupied(board).some(
        (f) => f !== from && board[f]!.moves < 2 && captureTargets(board, f, size).includes(to),
      );
      const targetName = PIECE_NAME[board[to]!.type];
      const reason = otherCapturers
        ? `Take the ${targetName} with this ${PIECE_NAME[piece.type]} — it keeps every remaining piece within reach.`
        : `Only this ${PIECE_NAME[piece.type]} can take the ${targetName}, so capture it now before it's stranded.`;
      return { from, to, reason };
    }
  }
  return null;
}
