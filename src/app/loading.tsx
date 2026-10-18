export default function Loading() {
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: 12 }, (_, index) => (
        <div
          key={index}
          className="aspect-[2/3] animate-pulse rounded-md bg-[var(--surface)]"
        />
      ))}
    </div>
  );
}
