import { Link2Icon } from "@radix-ui/react-icons";

export function Header() {
  return (
    <header className="flex min-h-16 items-end border-gray-200 border-b py-4">
      <h1 className="ml-4 font-bold text-3xl text-primary">
        Angluin's L* Algorithm Visualization
        <small className="ml-2 font-normal">
          made by{" "}
          <a className="font-medium underline underline-offset-4" href="https://github.com/makenowjust">
            @makenowjust
          </a>
        </small>
      </h1>
      <div className="ml-2">
        <a href="https://github.com/makenowjust-labs/lstar-viz">
          <Link2Icon className="inline-block h-8 w-8" />
        </a>
      </div>
    </header>
  );
}
