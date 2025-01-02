import type { LogData } from "@/types";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { useRef, useEffect } from "react";

const levelToColor = {
	info: "bg-green-200",
	debug: "bg-white",
	error: "bg-red-200",
};

type LogViewProps = {
	logs: LogData[];
};

export function LogView({ logs }: LogViewProps) {
	const lastLog = useRef<HTMLDivElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (lastLog.current === null) {
			return;
		}

		lastLog.current.scrollIntoView({ behavior: "smooth" });
	}, [logs]);

	return (
		<ScrollArea className="w-full pt-2 h-[9.5rem]">
			<h2 className="ml-2 text-lg font-bold sticky top-0 bg-white">Log</h2>
			<div className="ml-2 text-sm">
				{logs.map(({ message, level, stat }, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						key={index}
						className={`my-1 ${levelToColor[level]}`}
						{...(index === logs.length - 1 ? { ref: lastLog } : {})}
					>
						{message}
						{stat ? ` [#MQ: ${stat.mq}, #EQ: ${stat.eq}]` : ""}
					</div>
				))}
			</div>
		</ScrollArea>
	);
}
