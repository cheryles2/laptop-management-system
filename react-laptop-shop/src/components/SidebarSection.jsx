import { SlidersHorizontal } from "lucide-react";

export default function SidebarSection({ title, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
        <SlidersHorizontal size={16} />
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}
