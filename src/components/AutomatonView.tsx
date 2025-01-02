import type { Speed } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as d3 from "d3";
import { type Graphviz, graphviz } from "d3-graphviz";
import { useRef, useEffect } from "react";

type Props = {
	dot: string;
	speed: Speed;
};

export function AutomatonView({ dot, speed }: Props) {
	const automaton = useRef<HTMLDivElement>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const viz = useRef<Graphviz<any, any, any, any>>();

	useEffect(() => {
		if (automaton.current === null) {
			return;
		}

		if (dot === "") {
			d3.select(automaton.current).selectAll("svg *").remove();
			return;
		}

		viz.current = graphviz(automaton.current, { useWorker: false })
			.transition(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				() => d3.transition().duration(speed === "slow" ? 1000 : 500) as any,
			)
			.renderDot(dot);
	}, [dot, speed]);

	return (
		<ScrollArea className="w-1/2 h-[calc(100vh-19rem)]">
			<h2 className="ml-2 text-lg font-bold">Automaton</h2>
			<div
				ref={automaton}
				className="absolute top-[1.75rem] bottom-0 left-0 right-0 [&>svg]:h-full [&>svg]:w-full"
			/>
		</ScrollArea>
	);
}
