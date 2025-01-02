export function Header() {
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
