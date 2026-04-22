export const mockProducts = [
  {
    id: 1,
    name: "Dell XPS 13 Plus",
    brand: "Dell",
    cpu: "Intel Core i7",
    ram: "16GB",
    price: 32990000,
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80",
    note: "Màn hình OLED, viền siêu mỏng, pin bền.",
  },
  {
    id: 2,
    name: "MacBook Air M2",
    brand: "Apple",
    cpu: "Apple M2",
    ram: "8GB",
    price: 28990000,
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80",
    note: "Mỏng nhẹ, tối ưu cho học tập và văn phòng.",
  },
  {
    id: 3,
    name: "ASUS ROG Zephyrus G14",
    brand: "ASUS",
    cpu: "AMD Ryzen 9",
    ram: "16GB",
    price: 41990000,
    image:
      "https://images.unsplash.com/photo-1593642634367-d91a135587b5?auto=format&fit=crop&w=900&q=80",
    note: "Gaming mạnh, tản nhiệt tốt, màn hình 120Hz.",
  },
  {
    id: 4,
    name: "Lenovo ThinkPad X1 Carbon",
    brand: "Lenovo",
    cpu: "Intel Core i7",
    ram: "16GB",
    price: 39990000,
    image:
      "https://images.unsplash.com/photo-1541807084-5c52b6b1c8c3?auto=format&fit=crop&w=900&q=80",
    note: "Bàn phím tốt, bền bỉ, dành cho doanh nghiệp.",
  },
  {
    id: 5,
    name: "HP Pavilion 14",
    brand: "HP",
    cpu: "Intel Core i5",
    ram: "8GB",
    price: 17990000,
    image:
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=900&q=80",
    note: "Giá tốt, phù hợp sinh viên.",
  },
  {
    id: 6,
    name: "Acer Nitro 5",
    brand: "Acer",
    cpu: "AMD Ryzen 5",
    ram: "16GB",
    price: 22990000,
    image:
      "https://images.unsplash.com/photo-1484788984921-03950022c9ef?auto=format&fit=crop&w=900&q=80",
    note: "Laptop gaming phổ thông, hiệu năng ổn.",
  },
  {
    id: 7,
    name: "MSI Prestige 14",
    brand: "MSI",
    cpu: "Intel Core i7",
    ram: "16GB",
    price: 30990000,
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
    note: "Thiết kế sang, phù hợp creator.",
  },
  {
    id: 8,
    name: "LG Gram 16",
    brand: "LG",
    cpu: "Intel Core i7",
    ram: "16GB",
    price: 37990000,
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80",
    note: "Trọng lượng nhẹ, màn hình lớn.",
  },
];

export const priceRanges = [
  { label: "All", min: 0, max: Infinity },
  { label: "Under 20M", min: 0, max: 20000000 },
  { label: "20M - 30M", min: 20000000, max: 30000000 },
  { label: "30M - 40M", min: 30000000, max: 40000000 },
  { label: "Above 40M", min: 40000000, max: Infinity },
];
