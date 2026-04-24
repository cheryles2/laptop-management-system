import { Search, ShoppingCart, User } from "lucide-react";

export default function Navbar({
  search,
  onSearchChange,
  cartCount,
  authUser,
  onLoginGoogle,
  onLoginFacebook,
  onLogout,
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-lg font-extrabold text-white shadow-soft">
            L
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
              LaptopShop
            </p>
            <h1 className="text-lg font-extrabold text-ink">
              Modern Laptop Store
            </h1>
          </div>
        </div>

        <div className="hidden flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm md:flex">
          <Search size={18} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm laptop, CPU, RAM..."
            className="ml-3 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-ink shadow-sm transition hover:border-blue-200 hover:bg-blue-50">
            <ShoppingCart size={18} />
            <span>Giỏ hàng</span>
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
              {cartCount}
            </span>
          </button>
          {authUser ? (
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white">
                <User size={18} />
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-ink">
                  {authUser.name || "Người dùng"}
                </p>
                <p className="text-xs text-slate-500">
                  {authUser.email || authUser.provider || "Đã đăng nhập"}
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onLoginGoogle}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-ink shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
              >
                <User size={18} />
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={onLoginFacebook}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-ink shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
              >
                <User size={18} />
                <span>Facebook</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto px-4 pb-4 md:hidden">
        <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
          <Search size={18} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm laptop, CPU, RAM..."
            className="ml-3 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>
      </div>
    </header>
  );
}
