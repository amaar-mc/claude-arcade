import { test, expect } from "bun:test";
import {
  type Board,
  type SnakeState,
  initialState,
  nextDirection,
  spawnFood,
  step,
} from "../arcade/games/snake.ts";

const board: Board = { gridWidth: 10, gridHeight: 10, wrap: false };
const wrapBoard: Board = { gridWidth: 10, gridHeight: 10, wrap: true };
const zero = (): number => 0;

test("snake starts length 3 heading right", () => {
  const s = initialState(board, zero);
  expect(s.snake.length).toBe(3);
  expect(s.dir).toBe("right");
  expect(s.alive).toBe(true);
});

test("step moves the head one cell forward", () => {
  const s = initialState(board, zero);
  const head = s.snake[0];
  const next = step(s, board, zero);
  expect(next.snake[0]).toEqual({ x: head.x + 1, y: head.y });
  expect(next.snake.length).toBe(3);
});

test("hitting a wall ends the game without wrap", () => {
  const s: SnakeState = {
    snake: [{ x: 9, y: 5 }, { x: 8, y: 5 }, { x: 7, y: 5 }],
    dir: "right", food: { x: 0, y: 0 }, score: 0, alive: true, won: false,
  };
  expect(step(s, board, zero).alive).toBe(false);
});

test("wrap mode teleports across the edge", () => {
  const s: SnakeState = {
    snake: [{ x: 9, y: 5 }, { x: 8, y: 5 }, { x: 7, y: 5 }],
    dir: "right", food: { x: 0, y: 0 }, score: 0, alive: true, won: false,
  };
  const next = step(s, wrapBoard, zero);
  expect(next.alive).toBe(true);
  expect(next.snake[0]).toEqual({ x: 0, y: 5 });
});

test("eating food grows and scores", () => {
  const s: SnakeState = {
    snake: [{ x: 4, y: 5 }, { x: 3, y: 5 }, { x: 2, y: 5 }],
    dir: "right", food: { x: 5, y: 5 }, score: 0, alive: true, won: false,
  };
  const next = step(s, board, zero);
  expect(next.score).toBe(1);
  expect(next.snake.length).toBe(4);
});

test("running into the body ends the game", () => {
  const s: SnakeState = {
    snake: [{ x: 2, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }],
    dir: "down", food: { x: 9, y: 9 }, score: 0, alive: true, won: false,
  };
  expect(step(s, board, zero).alive).toBe(false);
});

test("a 180-degree reversal is rejected", () => {
  expect(nextDirection("right", "left")).toBe("right");
  expect(nextDirection("right", "up")).toBe("up");
});

test("food never spawns on the snake", () => {
  const snake = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }];
  for (let r = 0; r < 100; r++) {
    const food = spawnFood(snake, board, () => r / 100);
    expect(snake.some((p) => p.x === food.x && p.y === food.y)).toBe(false);
  }
});
