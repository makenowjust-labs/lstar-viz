import { expect, test } from "vitest";

import { type Automaton, diff, parseDOT, run } from "@/lib/automaton";
import { type Log, type Teacher, learn } from "@/lib/lstar";

const exampleDOT = `
  digraph g {
    __start0 [label="" shape="none"]
    s1 [shape="doublecircle" label="s1"]
    s2 [shape="circle" label="s2"]
    s3 [shape="circle" label="s3"]
    __start0 -> s1
    s1 -> s2[label="0"]
    s1 -> s1[label="1"]
    s2 -> s1[label="0"]
    s2 -> s3[label="1"]
    s3 -> s2[label="0"]
    s3 -> s1[label="1"]
  }
`;

test("learn", () => {
  const target = parseDOT(exampleDOT);
  const teacher: Teacher = {
    alphabet: target.alphabet,
    membership: (word) => target.accepts.includes(run(target, word)),
    equivalence: (hypothesis) => diff(target, hypothesis),
  };

  const gen = learn({ teacher, cexProcessMethod: "rivest-schapire" });
  const logs: string[] = [];

  let { value, done } = gen.next();
  while (!done) {
    logs.push((value as Log).message);
    ({ value, done } = gen.next());
  }

  const result = value as Automaton;

  expect(logs).toEqual([
    'A separator "" is added to the observation table.',
    'A state prefix "" is added to the observation table.',
    'The result of MQ("" + "") is true.',
    'An extension prefix "0" is added to the observation table.',
    'The result of MQ("0" + "") is false.',
    'An extension prefix "1" is added to the observation table.',
    'The result of MQ("1" + "") is true.',
    'The extension prefix "0" is promoted to a state prefix.',
    'An extension prefix "00" is added to the observation table.',
    'The result of MQ("00" + "") is true.',
    'An extension prefix "01" is added to the observation table.',
    'The result of MQ("01" + "") is false.',
    "The observation table is closed and consistent. Let's check equivalence.",
    'A counterexample "010" is found.',
    'A separator "0" is added to the observation table.',
    'The result of MQ("" + "0") is false.',
    'The result of MQ("0" + "0") is true.',
    'The result of MQ("1" + "0") is false.',
    'The result of MQ("00" + "0") is false.',
    'The result of MQ("01" + "0") is false.',
    'The extension prefix "01" is promoted to a state prefix.',
    'An extension prefix "010" is added to the observation table.',
    'The result of MQ("010" + "") is false.',
    'The result of MQ("010" + "0") is true.',
    'An extension prefix "011" is added to the observation table.',
    'The result of MQ("011" + "") is true.',
    'The result of MQ("011" + "0") is false.',
    "The observation table is closed and consistent. Let's check equivalence.",
    "The hypothesis is equivalent to the target automaton. Learning is done.",
  ]);

  expect(result).toEqual({
    states: [0, 1, 2],
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
          ["1", 2],
        ]),
      ],
      [
        2,
        new Map([
          ["0", 1],
          ["1", 0],
        ]),
      ],
    ]),
  });
});
