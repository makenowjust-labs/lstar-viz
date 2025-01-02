import type { ObservationTable } from "@/lib/lstar";
import { Cross2Icon } from "@radix-ui/react-icons";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { CheckIcon } from "lucide-react";

type ObservationTableViewProps = {
	table: ObservationTable | null;
};

export function ObservationTableView({ table }: ObservationTableViewProps) {
	const separators = table?.separators ?? [];
	const states = table?.states ?? new Map<string, boolean[]>();
	const extensions = table?.extensions ?? new Map<string, boolean[]>();

	return (
		<ScrollArea className="w-1/2 h-[calc(100vh-19rem)]">
			<h2 className="ml-2 text-lg font-bold">Observation table</h2>
			<table className="ml-2 overflow-x-auto w-full text-sm relative table-fixed">
				<thead className="sticky top-0 text-gray-700 bg-gray-50 text-center">
					<tr className="my-2">
						<th />
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
										// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
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
										// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
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
