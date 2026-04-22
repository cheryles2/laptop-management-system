import SidebarSection from "./SidebarSection";
import FilterChip from "./FilterChip";

const brands = [
  "All",
  "Dell",
  "Apple",
  "ASUS",
  "Lenovo",
  "HP",
  "Acer",
  "MSI",
  "LG",
];
const ramOptions = ["All", "8GB", "16GB"];
const cpuOptions = [
  "All",
  "Intel Core i5",
  "Intel Core i7",
  "Apple M2",
  "AMD Ryzen 5",
  "AMD Ryzen 9",
];
const priceRanges = [
  { label: "All", min: 0, max: Infinity },
  { label: "Under 20M", min: 0, max: 20000000 },
  { label: "20M - 30M", min: 20000000, max: 30000000 },
  { label: "30M - 40M", min: 30000000, max: 40000000 },
  { label: "Above 40M", min: 40000000, max: Infinity },
];

export default function Sidebar({
  selectedBrand,
  onBrandChange,
  selectedRam,
  onRamChange,
  selectedCpu,
  onCpuChange,
  selectedPrice,
  onPriceChange,
}) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:overflow-auto">
      <SidebarSection title="Hãng">
        <div className="flex flex-wrap gap-2">
          {brands.map((brand) => (
            <FilterChip
              key={brand}
              label={brand}
              active={selectedBrand === brand}
              onClick={() => onBrandChange(brand)}
            />
          ))}
        </div>
      </SidebarSection>

      <SidebarSection title="RAM">
        <div className="flex flex-wrap gap-2">
          {ramOptions.map((ram) => (
            <FilterChip
              key={ram}
              label={ram}
              active={selectedRam === ram}
              onClick={() => onRamChange(ram)}
            />
          ))}
        </div>
      </SidebarSection>

      <SidebarSection title="CPU">
        <div className="flex flex-wrap gap-2">
          {cpuOptions.map((cpu) => (
            <FilterChip
              key={cpu}
              label={cpu}
              active={selectedCpu === cpu}
              onClick={() => onCpuChange(cpu)}
            />
          ))}
        </div>
      </SidebarSection>

      <SidebarSection title="Giá">
        <div className="flex flex-wrap gap-2">
          {priceRanges.map((range) => (
            <FilterChip
              key={range.label}
              label={range.label}
              active={selectedPrice === range.label}
              onClick={() => onPriceChange(range.label)}
            />
          ))}
        </div>
      </SidebarSection>
    </aside>
  );
}
