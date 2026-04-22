import { ChevronRight } from "lucide-react";
import { formatPrice } from "../utils/helpers";

export default function ProductCard({ product, onAdd }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-48 overflow-hidden bg-slate-100">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">
          {product.brand}
        </div>
      </div>
      <div className="space-y-3 p-5">
        <div>
          <h3 className="text-lg font-semibold text-ink">{product.name}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {product.cpu} · {product.ram}
          </p>
        </div>
        <p className="text-sm leading-6 text-slate-500">{product.note}</p>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
              Giá bán
            </p>
            <p className="text-xl font-bold text-ink">
              {formatPrice(product.price)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onAdd(product)}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Thêm vào giỏ
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
