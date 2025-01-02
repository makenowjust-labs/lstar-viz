import { useCallback, useEffect, useRef, useState } from "react";

import * as d3 from "d3";
import { Graphviz, graphviz } from "d3-graphviz";

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

import { learn, Log, ObservationTable, Teacher } from "@/lib/lstar";
import { Automaton, diff, parseDOT, run, toDOT } from "@/lib/automaton";
import { presets, defaultTargetDOT } from "@/lib/presets";

type ControlPanelProps = {
  isRunning: boolean;
  targetDOT: string;
  onStart: () => void;
  onStop: () => void;
  onNext: () => void;
  onUpdateTargetDOT: (dot: string) => void;
  onReset: () => void;
};

function ControlPanel({
  isRunning,
  targetDOT,
  onStart,
  onStop,
  onNext,
  onUpdateTargetDOT,
  onReset,
}: ControlPanelProps) {
  const [open, setOpen] = useState(false);

  const onChangeTextarea = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onUpdateTargetDOT(event.target.value);
    },
    [onUpdateTargetDOT],
  );
  const onResetAndRestart = useCallback(() => {
    onReset();
    setOpen(() => false);
  }, [onReset]);

  const onSelectPreset = useCallback(
    (value: string) => {
      onUpdateTargetDOT(presets[Number.parseInt(value)].dot);
    },
    [onUpdateTargetDOT],
  );

  return (
    <div className="flex h-16 pt-4">
      <Button className="w-24" onClick={isRunning ? onStop : onStart}>
        {isRunning ? "Stop" : "Start"}
      </Button>
      <Button className="w-24 ml-2" onClick={onNext} disabled={isRunning}>
        Next
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-24 ml-2" variant="secondary">
            Config
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
            <div className="my-2">
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
            <Textarea
              onChange={onChangeTextarea}
              placeholder="Graphviz DOT"
              rows={10}
              className="font-mono"
              value={targetDOT}
            />
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
};

function AutomatonView({ dot }: AutomatonViewProps) {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .transition(() => d3.transition().duration(500) as any)
      .renderDot(dot);
  }, [dot]);

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
                    {value ? "✓" : "×"}
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
                    {value ? "✓" : "×"}
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

type LogViewProps = {
  logs: string[];
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
        {logs.map((log, index) => (
          <div
            key={index}
            className="my-1"
            {...(index === logs.length - 1 ? { ref: lastLog } : {})}
          >
            {log}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export function Main() {
  const [targetDOT, setTargetDOT] = useState(defaultTargetDOT);
  const [isRunning, setIsRunning] = useState(false);

  const [hypothesis, setHypothesis] = useState<Automaton | null>(null);
  const [table, setTable] = useState<ObservationTable | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

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
    onStop();
    gen.current = null;
    setHypothesis(() => null);
    setTable(() => null);
    setLogs(() => []);

    try {
      const target = parseDOT(targetDOT);
      const teacher: Teacher = {
        alphabet: target.alphabet,
        membership: (word) => target.accepts.includes(run(target, word)),
        equivalence: (hypothesis) => diff(target, hypothesis),
      };
      gen.current = learn({ teacher, cexProcessMethod: "rivest-schapire" });
    } catch (error) {
      setLogs((logs) =>
        logs.concat([
          `Error on parsing DOT: ${error instanceof Error ? error.message : error}`,
        ]),
      );
    }
  }, [targetDOT, onStop]);

  const onNext = useCallback(() => {
    if (gen.current === null) {
      return;
    }

    try {
      const { value, done } = gen.current.next();
      if (done) {
        setHypothesis(() => value as Automaton);
        onStop();
        gen.current = null;
        return;
      }

      const { message, table, hypothesis } = value as Log;
      setLogs((logs) => [...logs, message]);
      setTable(() => table);
      if (hypothesis !== undefined) {
        setHypothesis(() => hypothesis);
      }
    } catch (error) {
      setLogs((logs) =>
        logs.concat([
          `Error on learning: ${error instanceof Error ? error.message : error}`,
        ]),
      );
      gen.current = null;
    }
  }, [onStop]);

  const onStart = useCallback(() => {
    if (gen.current === null) {
      onReset();
    }

    timerId.current = window.setInterval(onNext, 100);
    setIsRunning(() => true);
  }, [onNext, onReset]);

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
        onStart={onStart}
        onStop={onStop}
        onNext={onNext}
        onUpdateTargetDOT={onUpdateTargetDOT}
        onReset={onReset}
      />
      <div className="flex mt-4 border-b-4">
        <AutomatonView dot={hypothesis ? toDOT(hypothesis) : ""} />
        <div className="w-1 h-[calc(100vh-19rem)] bg-gray-200"></div>
        <ObservationTableView table={table} />
      </div>
      <LogView logs={logs} />
    </main>
  );
}
