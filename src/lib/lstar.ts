import { type Automaton, run } from "@/lib/automaton";

export type Teacher = {
  readonly alphabet: readonly string[];
  readonly membership: (word: string) => boolean;
  readonly equivalence: (automaton: Automaton) => true | string;
};

export type ObservationTable = {
  readonly separators: string[];
  readonly states: Map<string, boolean[]>;
  readonly extensions: Map<string, boolean[]>;
};

export type Stat = {
  mq: number;
  eq: number;
};

export type Log = {
  message: string;
  important: boolean;
  table: Readonly<ObservationTable>;
  hypothesis?: Automaton;
  stat: Stat;
};

export type CexProcessMethod = "angluin" | "maler-pnueli" | "rivest-schapire";

export type Params = {
  teacher: Teacher;
  cexProcessMethod?: CexProcessMethod;
};

export const learn = function* (params: Params): Generator<Log, Automaton> {
  const { teacher, cexProcessMethod = "angluin" } = params;

  const table: ObservationTable = Object.freeze({
    separators: [],
    states: new Map<string, boolean[]>(),
    extensions: new Map<string, boolean[]>(),
  });

  const succRow = (prefix: string): boolean[] => {
    const row = table.states.get(prefix) || table.extensions.get(prefix);
    if (row === undefined) {
      throw new Error(`The successor prefix ${JSON.stringify(prefix)} is not in the observation table.`);
    }
    return row;
  };

  let mq = 0;
  let eq = 0;

  const log = (message: string, important = false, hypothesis: Automaton | undefined = undefined): Log => ({
    message,
    table: Object.freeze({
      separators: Array.from(table.separators),
      states: new Map(table.states),
      extensions: new Map(table.extensions),
    }),
    important,
    hypothesis,
    stat: { mq, eq },
  });

  const addState = function* (state: string): Generator<Log, void> {
    if (table.states.has(state)) {
      throw new Error(`The state prefix ${JSON.stringify(state)} is already in the observation table.`);
    }

    const row: boolean[] = [];
    table.states.set(state, row);
    yield log(`A state prefix ${JSON.stringify(state)} is added to the observation table.`, true);

    for (const separator of table.separators) {
      const word = state + separator;
      const result = teacher.membership(word);
      mq++;
      row.push(result);
      yield log(`The result of MQ(${JSON.stringify(state)} + ${JSON.stringify(separator)}) is ${result}.`);
    }

    for (const char of teacher.alphabet) {
      const extension = state + char;
      if (!(table.states.has(extension) || table.extensions.has(extension))) {
        yield* addExtension(extension);
      }
    }
  };

  const addSeparator = function* (separator: string): Generator<Log, void> {
    if (table.separators.includes(separator)) {
      throw new Error(`The separator ${JSON.stringify(separator)} is already in the observation table.`);
    }

    table.separators.push(separator);
    yield log(`A separator ${JSON.stringify(separator)} is added to the observation table.`, true);

    for (const [state, row] of table.states.entries()) {
      const word = state + separator;
      const result = teacher.membership(word);
      mq++;
      row.push(result);
      yield log(`The result of MQ(${JSON.stringify(state)} + ${JSON.stringify(separator)}) is ${result}.`);
    }

    for (const [extension, row] of table.extensions.entries()) {
      const word = extension + separator;
      const result = teacher.membership(word);
      mq++;
      row.push(result);
      yield log(`The result of MQ(${JSON.stringify(extension)} + ${JSON.stringify(separator)}) is ${result}.`);
    }
  };

  const addExtension = function* (extension: string): Generator<Log, void> {
    if (table.states.has(extension) || table.extensions.has(extension)) {
      throw new Error(`The prefix ${JSON.stringify(extension)} is already in the observation table.`);
    }

    const row: boolean[] = [];
    table.extensions.set(extension, row);
    yield log(`An extension prefix ${JSON.stringify(extension)} is added to the observation table.`);

    for (const separator of table.separators) {
      const word = extension + separator;
      const result = teacher.membership(word);
      mq++;
      row.push(result);
      yield log(`The result of MQ(${JSON.stringify(extension)} + ${JSON.stringify(separator)}) is ${result}.`);
    }
  };

  const promote = function* (extension: string): Generator<Log, void> {
    if (table.states.has(extension)) {
      throw new Error(`The state prefix ${JSON.stringify(extension)} is already in the observation table.`);
    }

    const row = table.extensions.get(extension);
    if (row === undefined) {
      throw new Error(`An extensions prefix ${JSON.stringify(extension)} is not in the observation table.`);
    }

    table.extensions.delete(extension);
    table.states.set(extension, row);
    yield log(`The extension prefix ${JSON.stringify(extension)} is promoted to a state prefix.`, true);

    for (const char of teacher.alphabet) {
      const newExtension = extension + char;
      if (!(table.states.has(newExtension) || table.extensions.has(newExtension))) {
        yield* addExtension(newExtension);
      }
    }
  };

  const checkInconsistency = (): string | undefined => {
    const states = Array.from(table.states.entries());
    for (let i = 0; i < states.length; i++) {
      for (let j = i + 1; j < states.length; j++) {
        const [state1, row1] = states[i];
        const [state2, row2] = states[j];
        if (!row1.every((result, index) => result === row2[index])) {
          continue;
        }

        for (const char of teacher.alphabet) {
          const succ1 = state1 + char;
          const succ2 = state2 + char;
          const row1 = succRow(succ1);
          const row2 = succRow(succ2);

          const index = row1.findIndex((result, index) => result !== row2[index]);
          if (index !== -1) {
            return char + table.separators[index];
          }
        }
      }
    }

    return undefined;
  };

  const checkClosedness = (): string | undefined => {
    const states = Array.from(table.states.entries());
    for (const [extension, extensionRow] of table.extensions.entries()) {
      const hasEqState = states.some(([_, stateRow]) =>
        stateRow.every((result, index) => result === extensionRow[index]),
      );
      if (!hasEqState) {
        return extension;
      }
    }

    return undefined;
  };

  const makeHypothesis = (): [Automaton, Map<number, string>] => {
    const encode = (row: boolean[]): string => {
      return row.map((result) => (result ? "1" : "0")).join("");
    };

    const stateNumbers = new Map<string, number>();
    const rowToStateNumber = new Map<string, number>();
    for (const [state, row] of table.states.entries()) {
      const number = stateNumbers.size;
      stateNumbers.set(state, number);
      rowToStateNumber.set(encode(row), number);
    }

    const transitions = new Map<number, Map<string, number>>();
    const accepts = [];
    for (const [prefix, number] of stateNumbers.entries()) {
      const succs = new Map<string, number>();
      transitions.set(number, succs);
      for (const char of teacher.alphabet) {
        const extension = prefix + char;
        const row = succRow(extension);
        // biome-ignore lint/style/noNonNullAssertion:
        const successor = rowToStateNumber.get(encode(row))!;
        succs.set(char, successor);
      }
      if (table.states.get(prefix)?.[0] === true) {
        accepts.push(number);
      }
    }

    const hypothesis = Object.freeze({
      states: Object.freeze(Array.from(stateNumbers.values())),
      alphabet: teacher.alphabet,
      transitions: Object.freeze(transitions),
      start: 0, // We know the first state is the initial state.
      accepts: Object.freeze(accepts),
    });
    const numberToStatePrefix = new Map(Array.from(stateNumbers.entries()).map(([state, number]) => [number, state]));

    return [hypothesis, numberToStatePrefix];
  };

  yield* addSeparator("");
  yield* addState("");

  while (true) {
    const newSeparator = checkInconsistency();
    if (newSeparator !== undefined) {
      yield* addSeparator(newSeparator);
      continue;
    }

    const newPrefix = checkClosedness();
    if (newPrefix !== undefined) {
      yield* promote(newPrefix);
      continue;
    }

    const [hypothesis, numberToStatePrefix] = makeHypothesis();
    yield log("The observation table is closed and consistent. Let's check equivalence.", true, hypothesis);
    const counterexample = teacher.equivalence(hypothesis);
    eq++;

    if (counterexample === true) {
      yield log("The hypothesis is equivalent to the target automaton. Learning is done.", true);
      return hypothesis;
    }

    yield log(`A counterexample ${JSON.stringify(counterexample)} is found.`, true);

    switch (cexProcessMethod) {
      case "angluin":
        // Angluin's CEX processing addes all prefixes of the counterexample as state prefixes
        // to the observation table.

        for (let i = 0; i <= counterexample.length; i++) {
          const prefix = counterexample.slice(0, i);
          if (table.states.has(prefix)) {
            continue;
          }

          yield* addState(prefix);
        }

        break;
      case "maler-pnueli":
        // Maler-Pnueli's CEX processing adds all suffixes of the counterexample as separators
        // to the observation table.

        for (let i = counterexample.length; i >= 0; i--) {
          const suffix = counterexample.slice(i, counterexample.length);
          if (table.separators.includes(suffix)) {
            continue;
          }

          yield* addSeparator(suffix);
        }

        break;
      case "rivest-schapire": {
        // Rivest-Schapire's CEX processing first finds a good suffix as a separator using binary search
        // and then adds it to the observation table.

        const expected = teacher.membership(counterexample);
        mq++;
        let low = 0;
        let high = counterexample.length;
        while (high - low > 1) {
          const mid = Math.floor((high - low) / 2) + low;
          const prefix = counterexample.slice(0, mid);
          const stateNumber = run(hypothesis, prefix);
          // biome-ignore lint/style/noNonNullAssertion:
          const statePrefix = numberToStatePrefix.get(stateNumber)!;
          const suffix = counterexample.slice(mid, counterexample.length);
          const result = teacher.membership(statePrefix + suffix);
          mq++;

          if (result === expected) {
            low = mid;
          } else {
            high = mid;
          }
        }

        const suffix = counterexample.slice(high, counterexample.length);
        yield* addSeparator(suffix);

        break;
      }
    }
  }
};
