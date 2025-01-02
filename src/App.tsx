import { useEffect, useRef } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function App() {
  return (
    <>
      <Header />
      <Main />
    </>
  );
}

function Header() {
  return (
    <header className="block h-16 border-b border-gray-200 py-4">
      <h1 className="text-3xl font-bold ml-4 text-primary">
        Angluin's L* Algorithm Visualization
        <small className="ml-2 font-normal">
          made by{" "}
          <a
            className="font-medium underline underline-offset-4"
            href="https://github.com/makenowjust"
          >
            @makenowjust
          </a>
        </small>
      </h1>
    </header>
  );
}

function Main() {
  const automaton = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viz = useRef<Graphviz<any, any, any, any>>();

  useEffect(() => {
    if (automaton.current === null) {
      return;
    }

    viz.current = graphviz(automaton.current, { useWorker: false })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .transition(() => d3.transition().duration(500) as any).renderDot(`
        digraph g {
          rankdir=LR;
          __start0 [label="" shape="none"]
          s1 [shape="doublecircle" label="s1"]
          s2 [shape="circle" label="s2"]
          __start0 -> s1
          s1 -> s2[label="0"]
          s1 -> s1[label="1"]
          s2 -> s1[label="0"]
          s2 -> s2[label="1"]
        }
      `);
  });

  return (
    <main className="block px-4 w-screen">
      <div className="flex h-16 pt-4">
        <Button className="w-24">Start</Button>
        <Button className="w-24 ml-2">Next</Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-24 ml-2" variant="secondary">
              Config
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configuration</DialogTitle>
              <DialogDescription>
                Configure the target automaton.
              </DialogDescription>
            </DialogHeader>
            <div className="">
              <div className="my-2">
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a preset automaton" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Automaton</SelectLabel>
                      <SelectItem value="a">A</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                placeholder="Graphviz DOT"
                rows={10}
                className="font-mono"
              />
            </div>
            <DialogFooter>
              <Button>Reset & Restart</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex mt-4 border-b-4">
        <ScrollArea className="w-1/2 h-[calc(100vh-19rem)]">
          <h2 className="ml-2 text-lg font-bold">Automaton</h2>
          <div
            ref={automaton}
            className="absolute top-[1.75rem] bottom-0 left-0 right-0 [&>svg]:h-full [&>svg]:w-full"
          />
        </ScrollArea>
        <div className="w-1 h-[calc(100vh-19rem)] bg-gray-200"></div>
        <ScrollArea className="w-1/2 h-[calc(100vh-19rem)]">
          <h2 className="ml-2 text-lg font-bold">Observation table</h2>
          <table className="overflow-x-auto w-full text-sm relative">
            <thead className="sticky top-0 text-gray-700 bg-gray-50 text-center">
              <tr className="my-2">
                <th></th>
                <th scope="col">""</th>
                <th scope="col">"a"</th>
                <th scope="col">"b"</th>
                <th scope="col">"ab"</th>
                <th scope="col">"abc"</th>
                <th scope="col">"cba"</th>
                <th scope="col">"cba"</th>
                <th scope="col">"cba"</th>
                <th scope="col">"cba"</th>
                <th scope="col">"cba"</th>
                <th scope="col">"cba"</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b my-2">
                <th scope="row">""</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="border-b my-2">
                <th scope="row">"a"</th>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
              <tr className="my-2">
                <th scope="row">"b"</th>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center"></td>
                <td className="text-center">✓</td>
                <td className="text-center">✓</td>
              </tr>
            </tbody>
          </table>
        </ScrollArea>
      </div>
      <ScrollArea className="w-full pt-2 h-[9.5rem]">
        <h2 className="ml-2 text-lg font-bold sticky top-0 bg-white">Log</h2>
        <div className="ml-2 text-sm">
          <div>log line...</div>
          <div>log line...</div>
          <div>log line...</div>
          <div>log line...</div>
          <div>log line...</div>
          <div>log line...</div>
          <div>log line...</div>
          <div>log line...</div>
          <div>log line...</div>
          <div>log line...</div>
          <div>log line...</div>
          <div>log line...</div>
          <div>log line...</div>
          <div>log line...</div>
          <div>log line...</div>
          <div>log line...</div>
          <div>log line...</div>
        </div>
      </ScrollArea>
    </main>
  );
}

export default App;
