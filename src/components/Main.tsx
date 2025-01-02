import { useCallback, useEffect, useRef, useState } from "react";

import { type Automaton, diff, parseDOT, run, toDOT } from "@/lib/automaton";
import {
	type CexProcessMethod,
	learn,
	type Log,
	type ObservationTable,
	type Teacher,
} from "@/lib/lstar";
import { defaultTargetDOT } from "@/lib/presets";
import { ControlPanel } from "@/components/ControlPanel";
import type { LogData, Speed } from "@/types";
import { AutomatonView } from "@/components/AutomatonView";
import { ObservationTableView } from "@/components/ObservationTableView";
import { LogView } from "@/components/LogView";

export function Main() {
	const [targetDOT, setTargetDOT] = useState(defaultTargetDOT);
	const [isRunning, setIsRunning] = useState(false);

	const [cexProcessMethod, setCexProcessMethod] =
		useState<CexProcessMethod>("rivest-schapire");
	const [speed, setSpeed] = useState<Speed>("fast");

	const [hypothesis, setHypothesis] = useState<Automaton | null>(null);
	const [table, setTable] = useState<ObservationTable | null>(null);
	const [logs, setLogs] = useState<LogData[]>([]);

	const gen = useRef<Generator<Log, Automaton> | null>(null);
	const timerId = useRef<number | null>(null);

	const onStop = useCallback(() => {
		if (timerId.current === null) {
			return;
		}

		window.clearInterval(timerId.current);
		setIsRunning(() => false);
	}, []);

	const onReset = useCallback(() => {
		gen.current = null;
		setHypothesis(null);
		setTable(null);
		setLogs([]);

		try {
			const target = parseDOT(targetDOT);
			const teacher: Teacher = {
				alphabet: target.alphabet,
				membership: (word) => target.accepts.includes(run(target, word)),
				equivalence: (hypothesis) => diff(target, hypothesis),
			};
			gen.current = learn({ teacher, cexProcessMethod });
		} catch (error) {
			setLogs((logs) =>
				logs.concat([
					{
						message: `Error on parsing DOT: ${error instanceof Error ? error.message : error}`,
						level: "error",
					},
				]),
			);
		}
	}, [targetDOT, cexProcessMethod]);

	const onNext = useCallback(() => {
		if (gen.current === null) {
			onReset();
		}

		// Still, `gen.current` is `null`, then some errors occured and `onNext` is cancelled.
		if (gen.current === null) {
			onStop();
			return;
		}

		try {
			let { value, done } = gen.current.next();
			while (true) {
				if (done) {
					setHypothesis(() => value as Automaton);
					onStop();
					gen.current = null;
					return;
				}

				const { message, table, important, hypothesis, stat } = value as Log;
				setLogs((logs) => [
					...logs,
					{ message, level: important ? "info" : "debug", stat },
				]);
				setTable(() => table);
				if (hypothesis !== undefined) {
					setHypothesis(() => hypothesis);
				}

				if (speed === "quick" && !important) {
					({ value, done } = gen.current.next());
					continue;
				}

				break;
			}
		} catch (error) {
			setLogs((logs) =>
				logs.concat([
					{
						message: `Error on learning: ${error instanceof Error ? error.message : error}`,
						level: "error",
					},
				]),
			);
			onStop();
			gen.current = null;
		}
	}, [onStop, onReset, speed]);

	const onStart = useCallback(() => {
		timerId.current = window.setInterval(onNext, speed === "slow" ? 250 : 100);
		setIsRunning(() => true);
	}, [onNext, speed]);

	const onUpdateTargetDOT = useCallback((dot: string) => {
		setTargetDOT(() => dot);
	}, []);

	useEffect(() => {
		onReset();

		return () => {
			onStop();
		};
	}, [onReset, onStop]);

	return (
		<main className="block px-4 w-screen">
			<ControlPanel
				isRunning={isRunning}
				targetDOT={targetDOT}
				cexProcessMethod={cexProcessMethod}
				speed={speed}
				onStart={onStart}
				onStop={onStop}
				onNext={onNext}
				onUpdateTargetDOT={onUpdateTargetDOT}
				onReset={onReset}
				onUpdateCexProcessMethod={setCexProcessMethod}
				onUpdateSpeed={setSpeed}
			/>
			<div className="flex mt-4 border-b-4">
				<AutomatonView
					dot={hypothesis ? toDOT(hypothesis) : ""}
					speed={speed}
				/>
				<div className="w-1 h-[calc(100vh-19rem)] bg-gray-200" />
				<ObservationTableView table={table} />
			</div>
			<LogView logs={logs} />
		</main>
	);
}
