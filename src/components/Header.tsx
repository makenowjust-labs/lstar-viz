import { Link2Icon } from "@radix-ui/react-icons";

export function Header() {
	return (
		<header className="h-auto sm:h-16 border-b border-gray-200 py-4 flex items-end">
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
			<div className="ml-2">
				<a href="https://github.com/makenowjust-labs/lstar-viz">
					<Link2Icon className="w-8 h-8 inline-block" />
				</a>
			</div>
		</header>
	);
}
