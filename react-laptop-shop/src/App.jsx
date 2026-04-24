import { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ProductCard from "./components/ProductCard";
import SkeletonCard from "./components/SkeletonCard";
import { mockProducts, priceRanges } from "./data/products";
import { filterProducts } from "./utils/helpers";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://laptop-management-system-oy7i.onrender.com"
).replace(/\/+$/, "");

const AUTH_STORAGE_KEY = "laptop_market_auth_user";

export default function LaptopShopUI() {
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedRam, setSelectedRam] = useState("All");
  const [selectedCpu, setSelectedCpu] = useState("All");
  const [selectedPrice, setSelectedPrice] = useState("All");
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 1100);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          setAuthUser(parsed);
        }
      } catch {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }

    const params = new URLSearchParams(window.location.search);
    const provider = params.get("authProvider") || params.get("mockLogin");
    const name = params.get("authName") || params.get("name");
    const email = params.get("authEmail") || params.get("email");
    const mode =
      params.get("authMode") || (params.get("mockLogin") ? "mock" : "success");

    if (provider) {
      const nextUser = {
        provider,
        name: name || "Người dùng",
        email: email || "",
        mode,
      };
      setAuthUser(nextUser);
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleLogin = async (provider) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/${provider}/url`, {
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Không thể mở đăng nhập");
      }

      if (!data.loginUrl) {
        throw new Error("Thiếu loginUrl từ backend");
      }

      window.location.href = data.loginUrl;
    } catch (error) {
      console.error(error);
      alert(error.message || "Đăng nhập thất bại");
    }
  };

  const handleLogout = () => {
    setAuthUser(null);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.history.replaceState({}, "", window.location.pathname);
  };

  const filteredProducts = useMemo(() => {
    return filterProducts(
      mockProducts,
      search,
      selectedBrand,
      selectedRam,
      selectedCpu,
      selectedPrice,
      priceRanges,
    );
  }, [search, selectedBrand, selectedRam, selectedCpu, selectedPrice]);

  const onAddToCart = (product) => {
    setCartCount((prev) => prev + 1);
    console.log("Added to cart:", product);
  };

  return (
    <div className="min-h-screen bg-mesh">
      <Navbar
        search={search}
        onSearchChange={setSearch}
        cartCount={cartCount}
        authUser={authUser}
        onLoginGoogle={() => handleLogin("google")}
        onLoginFacebook={() => handleLogin("facebook")}
        onLogout={handleLogout}
      />

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
        <Sidebar
          selectedBrand={selectedBrand}
          onBrandChange={setSelectedBrand}
          selectedRam={selectedRam}
          onRamChange={setSelectedRam}
          selectedCpu={selectedCpu}
          onCpuChange={setSelectedCpu}
          selectedPrice={selectedPrice}
          onPriceChange={setSelectedPrice}
        />

        <section className="space-y-5">
          <div className="rounded-[2rem] bg-white px-6 py-8 shadow-soft ring-1 ring-slate-200/70">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
              New Season
            </p>
            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-3xl font-extrabold text-ink md:text-4xl">
                  Laptop hiện đại, hiệu năng mạnh, UI sạch.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  Mẫu giao diện React + Tailwind với navbar, sidebar lọc, card
                  grid, loading giả lập và responsive theo yêu cầu.
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 px-5 py-4 text-sm text-slate-600 ring-1 ring-slate-200">
                <p className="font-semibold text-ink">Kết quả lọc</p>
                <p className="mt-1">{filteredProducts.length} sản phẩm</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {loading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <SkeletonCard key={index} />
                ))
              : filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={onAddToCart}
                  />
                ))}
          </div>

          {!loading && filteredProducts.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-soft">
              Không tìm thấy sản phẩm phù hợp.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
