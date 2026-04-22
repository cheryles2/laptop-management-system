export default function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="h-44 rounded-2xl bg-slate-200" />
      <div className="mt-4 h-4 w-3/4 rounded bg-slate-200" />
      <div className="mt-3 h-3 w-full rounded bg-slate-200" />
      <div className="mt-2 h-3 w-5/6 rounded bg-slate-200" />
      <div className="mt-4 h-10 rounded-xl bg-slate-200" />
    </div>
  );
}
