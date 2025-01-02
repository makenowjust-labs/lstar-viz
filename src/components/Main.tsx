import { useCallback, useEffect, useRef, useState } from "react";

import * as d3 from "d3";
import { Graphviz, graphviz } from "d3-graphviz";

import {
  PlayIcon,
  ResumeIcon,
  GearIcon,
  StopIcon,
  CheckIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { Automaton, diff, parseDOT, run, toDOT } from "@/lib/automaton";
import {
  CexProcessMethod,
  learn,
  Log,
  ObservationTable,
  Teacher,
} from "@/lib/lstar";
import { presets, defaultTargetDOT } from "@/lib/presets";

type Speed = "slow" | "fast" | "quick";

type ControlPanelProps = {
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

function ControlPanel({
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
}: ControlPanelProps) {
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

type AutomatonViewProps = {
  dot: string;
  speed: Speed;
};

function AutomatonView({ dot, speed }: AutomatonViewProps) {
  const automaton = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

type ObservationTableViewProps = {
  table: ObservationTable | null;
};

function ObservationTableView({ table }: ObservationTableViewProps) {
  const separators = table?.separators ?? [];
  const states = table?.states ?? new Map<string, boolean[]>();
  const extensions = table?.extensions ?? new Map<string, boolean[]>();

  return (
    <ScrollArea className="w-1/2 h-[calc(100vh-19rem)]">
      <h2 className="ml-2 text-lg font-bold">Observation table</h2>
      <table className="ml-2 overflow-x-auto w-full text-sm relative table-fixed">
        <thead className="sticky top-0 text-gray-700 bg-gray-50 text-center">
          <tr className="my-2">
            <th></th>
            {separators.map((separator) => (
              <th key={separator} scope="col">
                {JSON.stringify(separator)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from(states).map(([state, row], index) => {
            return (
              <tr
                key={state}
                className={`my-2${index < states.size - 1 ? " border-b" : " border-b-2 border-gray-900"}`}
              >
                <th scope="row">{JSON.stringify(state)}</th>
                {row.map((value, index) => (
                  <td
                    key={index}
                    className={`text-center ${value ? "bg-green-500" : "bg-red-500"}`}
                  >
                    {value ? (
                      <CheckIcon className="inline-block" />
                    ) : (
                      <Cross2Icon className="inline-block" />
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
          {Array.from(extensions).map(([extension, row], index) => {
            return (
              <tr
                key={extension}
                className={`my-2${index < extensions.size - 1 ? " border-b" : ""}`}
              >
                <th scope="row">{JSON.stringify(extension)}</th>
                {row.map((value, index) => (
                  <td
                    key={index}
                    className={`text-center ${value ? "bg-green-500" : "bg-red-500"}`}
                  >
                    {value ? (
                      <CheckIcon className="inline-block" />
                    ) : (
                      <Cross2Icon className="inline-block" />
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </ScrollArea>
  );
}

type LogData = {
  level: "info" | "debug" | "error";
  message: string;
};

const levelToColor = {
  info: "bg-green-200",
  debug: "bg-white",
  error: "bg-red-200",
};

type LogViewProps = {
  logs: LogData[];
};

function LogView({ logs }: LogViewProps) {
  const lastLog = useRef<HTMLDivElement>(null);

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
        {logs.map(({ message, level }, index) => (
          <div
            key={index}
            className={`my-1 ${levelToColor[level]}`}
            {...(index === logs.length - 1 ? { ref: lastLog } : {})}
          >
            {message}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

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

        const { message, table, important, hypothesis } = value as Log;
        setLogs((logs) => [
          ...logs,
          { message, level: important ? "info" : "debug" },
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
        <div className="w-1 h-[calc(100vh-19rem)] bg-gray-200"></div>
        <ObservationTableView table={table} />
      </div>
      <LogView logs={logs} />
    </main>
  );
}
