import { Automaton, run } from "./automaton";

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

export type Log = {
  message: string;
  table: ObservationTable;
  hypothesis?: Automaton;
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

  const log = (
    message: string,
    hypothesis: Automaton | undefined = undefined,
  ): Log => ({
    message,
    table,
    hypothesis,
  });

  const addState = function* (state: string): Generator<Log, void> {
    if (table.states.has(state)) {
      throw new Error(
        `The state prefix ${JSON.stringify(state)} is already in the observation table.`,
      );
    }

    const row: boolean[] = [];
    table.states.set(state, row);
    yield log(
      `A state prefix ${JSON.stringify(state)} is added to the observation table.`,
    );

    for (const separator of table.separators) {
      const word = state + separator;
      const result = teacher.membership(word);
      row.push(result);
      yield log(
        `The result of MQ(${JSON.stringify(state)} + ${JSON.stringify(separator)}) is ${result}.`,
      );
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
      throw new Error(
        `The separator ${JSON.stringify(separator)} is already in the observation table.`,
      );
    }

    table.separators.push(separator);
    yield log(
      `A separator ${JSON.stringify(separator)} is added to the observation table.`,
    );

    for (const state of table.states.keys()) {
      const row = table.states.get(state)!;
      const word = state + separator;
      const result = teacher.membership(word);
      row.push(result);
      yield log(
        `The result of MQ(${JSON.stringify(state)} + ${JSON.stringify(separator)}) is ${result}.`,
      );
    }

    for (const extension of table.extensions.keys()) {
      const row = table.extensions.get(extension)!;
      const word = extension + separator;
      const result = teacher.membership(word);
      row.push(result);
      yield log(
        `The result of MQ(${JSON.stringify(extension)} + ${JSON.stringify(separator)}) is ${result}.`,
      );
    }
  };

  const addExtension = function* (extension: string): Generator<Log, void> {
    if (table.states.has(extension) || table.extensions.has(extension)) {
      throw new Error(
        `The prefix ${JSON.stringify(extension)} is already in the observation table.`,
      );
    }

    const row: boolean[] = [];
    table.extensions.set(extension, row);
    yield log(
      `An extension prefix ${JSON.stringify(extension)} is added to the observation table.`,
    );

    for (const separator of table.separators) {
      const word = extension + separator;
      const result = teacher.membership(word);
      row.push(result);
      yield log(
        `The result of MQ(${JSON.stringify(extension)} + ${JSON.stringify(separator)}) is ${result}.`,
      );
    }
  };

  const promote = function* (extension: string): Generator<Log, void> {
    if (!table.extensions.has(extension)) {
      throw new Error(
        `An extensions prefix ${JSON.stringify(extension)} is not in the observation table.`,
      );
    }
    if (table.states.has(extension)) {
      throw new Error(
        `The state prefix ${JSON.stringify(extension)} is already in the observation table.`,
      );
    }

    const row = table.extensions.get(extension)!;
    table.extensions.delete(extension);
    table.states.set(extension, row);
    yield log(
      `The extension prefix ${JSON.stringify(extension)} is promoted to a state prefix.`,
    );

    for (const char of teacher.alphabet) {
      const newExtension = extension + char;
      if (
        !(table.states.has(newExtension) || table.extensions.has(newExtension))
      ) {
        yield* addExtension(newExtension);
      }
    }
  };

  const checkInconsistency = (): string | undefined => {
    const states = Array.from(table.states.keys());
    for (let i = 0; i < states.length; i++) {
      for (let j = i + 1; j < states.length; j++) {
        const state1 = states[i];
        const state2 = states[j];
        const row1 = table.states.get(state1)!;
        const row2 = table.states.get(state2)!;
        if (!row1.every((result, index) => result === row2[index])) {
          continue;
        }

        for (const char of teacher.alphabet) {
          const extension1 = state1 + char;
          const extension2 = state2 + char;
          const row1 = table.extensions.get(extension1)!;
          const row2 = table.extensions.get(extension2)!;

          const index = row1.findIndex(
            (result, index) => result !== row2[index],
          );
          if (index !== -1) {
            return char + table.separators[index];
          }
        }
      }
    }

    return undefined;
  };

  const checkClosedness = (): string | undefined => {
    const states = Array.from(table.states.keys());
    for (const extension of table.extensions.keys()) {
      const extensionRow = table.extensions.get(extension)!;
      const state = states.find((state) => {
        const stateRow = table.states.get(state)!;
        return stateRow.every(
          (result, index) => result === extensionRow[index],
        );
      });
      if (state === undefined) {
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
    for (const prefix of table.states.keys()) {
      const number = stateNumbers.get(prefix)!;
      const successors = new Map<string, number>();
      transitions.set(number, successors);
      for (const char of teacher.alphabet) {
        const extension = prefix + char;
        const row =
          table.states.get(extension) || table.extensions.get(extension)!;
        const successor = rowToStateNumber.get(encode(row))!;
        successors.set(char, successor);
      }
      if (table.states.get(prefix)![0] === true) {
        accepts.push(number);
      }
    }

    const hypothesis = Object.freeze({
      states: Object.freeze(Array.from(stateNumbers.values())),
      alphabet: teacher.alphabet,
      transitions: Object.freeze(transitions),
      start: stateNumbers.get("")!,
      accepts: Object.freeze(accepts),
    });
    const numberToStatePrefix = new Map(
      Array.from(stateNumbers.entries()).map(([state, number]) => [
        number,
        state,
      ]),
    );

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
    yield log("The observation table is closed and consistent.", hypothesis);
    const counterexample = teacher.equivalence(hypothesis);

    if (counterexample === true) {
      yield log(
        "The hypothesis is equivalent to the target automaton. Learning is done.",
      );
      return hypothesis;
    }

    yield log(`A counterexample ${JSON.stringify(counterexample)} is found.`);

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
        let low = 0;
        let high = counterexample.length;
        while (high - low > 1) {
          const mid = Math.floor((high - low) / 2) + low;
          const prefix = counterexample.slice(0, mid);
          const stateNumber = run(hypothesis, prefix);
          const statePrefix = numberToStatePrefix.get(stateNumber)!;
          const result = teacher.membership(statePrefix + counterexample[mid]);

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
