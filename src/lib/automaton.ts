export type Automaton = {
  readonly states: readonly number[];
  readonly alphabet: readonly string[];
  readonly transitions: ReadonlyMap<number, Map<string, number>>;
  readonly start: number;
  readonly accepts: readonly number[];
};

export const run = (automaton: Automaton, word: string, state: number = automaton.start): number => {
  let q: number | undefined = state;
  for (let i = 0; i < word.length; i++) {
    const char = word[i];

    q = automaton.transitions.get(q)?.get(char);
    if (q === undefined) {
      throw new Error(`No transition for state ${state} and char ${char}`);
    }
  }

  return q;
};

export const diff = (automaton1: Automaton, automaton2: Automaton): true | string => {
  // NOTE: This function assumes that the alphabets of the two automata are the same.

  const encode = (state1: number, state2: number): string => `${state1},${state2}`;

  const queue: [number, number, string][] = [];
  const visited = new Set<string>();

  queue.push([automaton1.start, automaton2.start, ""]);
  visited.add(encode(automaton1.start, automaton2.start));

  while (queue.length > 0) {
    // biome-ignore lint/style/noNonNullAssertion:
    const [state1, state2, word] = queue.shift()!;
    if (automaton1.accepts.includes(state1) !== automaton2.accepts.includes(state2)) {
      return word;
    }

    for (const char of automaton1.alphabet) {
      const nextState1 = automaton1.transitions.get(state1)?.get(char);
      const nextState2 = automaton2.transitions.get(state2)?.get(char);
      if (nextState1 === undefined || nextState2 === undefined) {
        throw new Error(`No transition for char ${char}`);
      }

      const nextWord = word + char;
      const nextEncoded = encode(nextState1, nextState2);

      if (!visited.has(nextEncoded)) {
        queue.push([nextState1, nextState2, nextWord]);
        visited.add(nextEncoded);
      }
    }
  }

  return true;
};

const commentRe = /\/\*(?:(?!\*\/).)*\*\/|\/\/.*|^\s*#.*/;
const startRe = /\b__start0(?:_\w+)?\s*->\s*(?<start_name>\w+)/;
const transitionRe = /\b(?<from_name>\w+)\s*->\s*(?<to_name>\w+)\s*\[(?<params>(?:"[^"]*"|[^\]]+)*)\]/;
const stateRe = /\b(?<name>\w+)\s*\[(?<params>(?:"[^"]*"|[^\]]+)*)\]/;
const labelRe = /\blabel=(?<value>"[^"]*"|[^\s\],]*)/;
const shapeRe = /\bshape=(?<value>"[^"]*"|[^\s\],]*)/;

export const parseDOT = (dot: string): Automaton => {
  const nameToStateMap = new Map<string, number>();
  const nameToState = (name: string): number => {
    let state = nameToStateMap.get(name);
    if (state === undefined) {
      state = nameToStateMap.size;
      nameToStateMap.set(name, state);
    }
    return state;
  };

  const strip = (value: string) => (value[0] === '"' && value[value.length - 1] === '"' ? value.slice(1, -1) : value);

  const extract = (re: RegExp, params: string): string => {
    const match = params.match(re);
    if (match === null) {
      return "";
    }
    return strip(match.groups?.value ?? "");
  };

  let start = 0;
  const transitions = new Map<number, Map<string, number>>();
  const accepts: number[] = [];

  const lines = dot
    .split("\n")
    .map((line) => line.replace(commentRe, "").trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    const startMatch = line.match(startRe);
    if (startMatch !== null) {
      const startName = startMatch.groups?.start_name ?? "";
      start = nameToState(startName);

      continue;
    }

    const transitionMatch = line.match(transitionRe);
    if (transitionMatch !== null) {
      const fromName = transitionMatch.groups?.from_name ?? "";
      const toName = transitionMatch.groups?.to_name ?? "";
      const from = nameToState(fromName);
      const to = nameToState(toName);

      const params = transitionMatch.groups?.params ?? "";
      const char = extract(labelRe, params);

      let successors = transitions.get(from);
      if (successors === undefined) {
        successors = new Map<string, number>();
        transitions.set(from, successors);
      }
      successors.set(char, to);

      continue;
    }

    const stateMatch = line.match(stateRe);
    if (stateMatch !== null) {
      const name = stateMatch.groups?.name ?? "";
      if (name === "__start0") {
        continue;
      }

      const state = nameToState(name);

      const params = stateMatch.groups?.params ?? "";
      const shape = extract(shapeRe, params);
      if (shape === "doublecircle") {
        accepts.push(state);
      }
    }
  }

  const states = Array.from(nameToStateMap.values());
  const alphabet = Array.from(
    new Set(Array.from(transitions.values()).flatMap((map) => Array.from(map.keys()))),
  ).sort();

  return Object.freeze({
    states: Object.freeze(states),
    alphabet: Object.freeze(alphabet),
    transitions: Object.freeze(transitions),
    start,
    accepts: Object.freeze(accepts),
  });
};

export const toDOT = (automaton: Automaton): string => {
  const lines = [];

  lines.push("digraph {");
  lines.push("  rankdir=LR;");

  lines.push('  __start0 [label="" shape="point"];');
  for (const state of automaton.states) {
    const shape = automaton.accepts.includes(state) ? "doublecircle" : "circle";
    lines.push(`  s${state} [shape="${shape}" label="s${state}"];`);
  }
  lines.push(`  __start0 -> s${automaton.start};`);

  for (const [from, map] of automaton.transitions) {
    for (const [char, to] of map) {
      lines.push(`  s${from} -> s${to} [label="${char}"];`);
    }
  }

  lines.push("}");

  return lines.join("\n");
};
