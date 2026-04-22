export default function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
        active
          ? "border-blue-600 bg-blue-600 text-white shadow-soft"
          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
      }`}
    >
      {label}
    </button>
  );
}
