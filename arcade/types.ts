// Shared contracts for the arcade. Game logic stays pure (exported per module
// and unit-tested); a thin RunningGame shell holds the mutable cursor state and
// delegates to those pure functions.

export type RNG = () => number;

export type View = { readonly cols: number; readonly rows: number };

// A frame a game wants drawn: board lines (already styled, each line's visible
// width must be <= view.cols) plus a one-line status and a one-line help hint.
export type Drawn = {
  readonly lines: readonly string[];
  readonly status: string;
  readonly help: string;
};

export type GameConfig = Record<string, unknown>;

// A live instance of a game. All input/advance is driven by the arcade loop.
export type RunningGame = {
  readonly onKey: (key: string) => void;
  readonly tick: () => void; // no-op for turn-based games
  readonly draw: (view: View) => Drawn;
  readonly isOver: () => boolean;
  readonly restart: () => void;
};

export type GameModule = {
  readonly id: string;
  readonly name: string;
  readonly blurb: string;
  readonly realtime: boolean; // true => respects play/pause and uses tick()
  readonly tickMs: number; // base advance interval for realtime games
  readonly create: (rng: RNG, cfg: GameConfig) => RunningGame;
};
