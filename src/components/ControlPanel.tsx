import { Button } from "@/components/ui/button";
import { DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { CexProcessMethod } from "@/lib/lstar";
import { presets } from "@/lib/presets";
import type { Speed } from "@/types";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { StopIcon, ResumeIcon, GearIcon } from "@radix-ui/react-icons";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectGroup,
	SelectLabel,
	SelectItem,
} from "@radix-ui/react-select";
import { PlayIcon } from "lucide-react";
import { useState, useCallback } from "react";

type Props = {
	isRunning: boolean;
	targetDOT: string;
	cexProcessMethod: CexProcessMethod;
	speed: Speed;
	onStart: () => void;
	onStop: () => void;
	onNext: () => void;
	onUpdateTargetDOT: (dot: string) => void;
	onReset: () => void;
	onUpdateCexProcessMethod: (method: CexProcessMethod) => void;
	onUpdateSpeed: (speed: Speed) => void;
};

export function ControlPanel({
	isRunning,
	targetDOT,
	cexProcessMethod,
	speed,
	onStart,
	onStop,
	onNext,
	onUpdateTargetDOT,
	onReset,
	onUpdateCexProcessMethod,
	onUpdateSpeed,
}: Props) {
	const [open, setOpen] = useState(false);

	const onChangeTextarea = useCallback(
		(event: React.ChangeEvent<HTMLTextAreaElement>) => {
			onUpdateTargetDOT(event.target.value);
		},
		[onUpdateTargetDOT],
	);
	const onResetAndRestart = useCallback(() => {
		onStop();
		onReset();
		setOpen(false);
	}, [onStop, onReset]);

	const onSelectPreset = useCallback(
		(value: string) => {
			onUpdateTargetDOT(presets[Number.parseInt(value)].dot);
		},
		[onUpdateTargetDOT],
	);

	const onSelectCexProcessMethod = useCallback(
		(value: string) => {
			onUpdateCexProcessMethod(value as CexProcessMethod);
		},
		[onUpdateCexProcessMethod],
	);

	const onSelectSpeed = useCallback(
		(value: string) => {
			onUpdateSpeed(value as Speed);
		},
		[onUpdateSpeed],
	);

	return (
		<div className="flex h-16 pt-4">
			<Button className="w-12" onClick={isRunning ? onStop : onStart}>
				{isRunning ? <StopIcon /> : <PlayIcon />}
			</Button>
			<Button className="w-12 ml-2" onClick={onNext} disabled={isRunning}>
				<ResumeIcon />
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<Button className="w-12 ml-2" variant="secondary">
						<GearIcon />
					</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Configuration</DialogTitle>
						<DialogDescription>
							Configure the target automaton and learning parameters.
						</DialogDescription>
					</DialogHeader>
					<div>
						<div>
							<Label htmlFor="automaton">Target Automaton</Label>
						</div>
						<div className="mt-2">
							<Select onValueChange={onSelectPreset}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Choose a preset automaton" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>Automaton</SelectLabel>
										{presets.map((preset, index) => {
											return (
												// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
												<SelectItem key={index} value={String(index)}>
													{preset.name}
												</SelectItem>
											);
										})}
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
						<div className="mt-2">
							<Textarea
								id="automaton"
								onChange={onChangeTextarea}
								placeholder="Graphviz DOT"
								rows={10}
								className="font-mono"
								value={targetDOT}
							/>
						</div>
						<div className="mt-2">
							<Label>Counterexample Processing Method</Label>
						</div>
						<div className="mt-2">
							<Select
								value={cexProcessMethod}
								onValueChange={onSelectCexProcessMethod}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Choose a counterexample processing method" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>Counterexample Processing Method</SelectLabel>
										<SelectItem value="rivest-schapire">
											Rivest-Schapire
										</SelectItem>
										<SelectItem value="angluin">Angluin</SelectItem>
										<SelectItem value="maler-pnueli">Maler-Pnueli</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
						<div className="mt-2">
							<Label>Speed</Label>
						</div>
						<div className="mt-2">
							<Select value={speed} onValueChange={onSelectSpeed}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Choose a speed" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>Speed</SelectLabel>
										<SelectItem value="slow">Slow</SelectItem>
										<SelectItem value="fast">Fast</SelectItem>
										<SelectItem value="quick">Quick</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button onClick={onResetAndRestart}>Reset & Restart</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
