export function PageBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div className="hero-glow absolute left-1/2 top-0 aspect-square w-[min(120vw,56rem)] -translate-x-1/2 -translate-y-[42%] rounded-full" />
      <div className="grain-overlay absolute inset-0" />
    </div>
  );
}
