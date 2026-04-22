export function formatPrice(value) {
  return new Intl.NumberFormat("vi-VN").format(value) + " VND";
}

export function filterProducts(
  products,
  search,
  selectedBrand,
  selectedRam,
  selectedCpu,
  selectedPrice,
  priceRanges,
) {
  return products.filter((product) => {
    const matchesSearch =
      `${product.name} ${product.brand} ${product.cpu} ${product.ram}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesBrand =
      selectedBrand === "All" || product.brand === selectedBrand;
    const matchesRam = selectedRam === "All" || product.ram === selectedRam;
    const matchesCpu = selectedCpu === "All" || product.cpu === selectedCpu;
    const priceRange =
      priceRanges.find((item) => item.label === selectedPrice) ??
      priceRanges[0];
    const matchesPrice =
      product.price >= priceRange.min && product.price <= priceRange.max;

    return (
      matchesSearch && matchesBrand && matchesRam && matchesCpu && matchesPrice
    );
  });
}
