import { expect, test } from "vitest";

import { parseDOT, toDOT, diff, run } from "./automaton";

const exampleDOT = `
  digraph g {
    __start0 [label="" shape="none"]
    s1 [shape="doublecircle" label="s1"]
    s2 [shape="circle" label="s2"]
    __start0 -> s1
    s1 -> s2[label="0"]
    s1 -> s1[label="1"]
    s2 -> s1[label="0"]
    s2 -> s2[label="1"]
  }
`;

test("parseDOT", () => {
  const automaton = parseDOT(exampleDOT);

  expect(automaton).toEqual({
    states: [0, 1],
    alphabet: ["0", "1"],
    start: 0,
    accepts: [0],
    transitions: new Map([
      [
        0,
        new Map([
          ["0", 1],
          ["1", 0],
        ]),
      ],
      [
        1,
        new Map([
          ["0", 0],
          ["1", 1],
        ]),
      ],
    ]),
  });
});

test("toDOT", () => {
  const automaton = parseDOT(exampleDOT);

  expect(toDOT(automaton).split("\n")).toEqual([
    "digraph {",
    "  rankdir=LR;",
    '  __start0 [label="" shape="none"];',
    '  s0 [shape="doublecircle" label="s0"];',
    '  s1 [shape="circle" label="s1"];',
    "  __start0 -> s0;",
    '  s0 -> s1 [label="0"];',
    '  s0 -> s0 [label="1"];',
    '  s1 -> s0 [label="0"];',
    '  s1 -> s1 [label="1"];',
    "}",
  ]);
});

test("run", () => {
  const automaton = parseDOT(exampleDOT);
  expect(run(automaton, "")).toBe(0);
  expect(run(automaton, "0")).toBe(1);
  expect(run(automaton, "1")).toBe(0);
  expect(run(automaton, "00")).toBe(0);
  expect(run(automaton, "01")).toBe(1);
});

test("diff", () => {
  const automaton1 = parseDOT(exampleDOT);
  const automaton2 = Object.freeze({
    ...automaton1,
    accepts: Object.freeze([1]),
  });

  expect(diff(automaton1, automaton1)).toBe(true);
  expect(diff(automaton1, automaton2)).toBe("");
});
