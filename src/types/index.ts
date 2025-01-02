import type { Stat } from "@/lib/lstar";

export type Speed = "slow" | "fast" | "quick";

export type LogData = {
	level: "info" | "debug" | "error";
	message: string;
	stat?: Stat;
};
