/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)",
      },
      colors: {
        ink: "#0f172a",
        muted: "#64748b",
        accent: "#2563eb",
        accentSoft: "#eff6ff",
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at top left, rgba(37,99,235,0.18), transparent 30%), radial-gradient(circle at right top, rgba(16,185,129,0.14), transparent 24%), linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
      },
    },
  },
  plugins: [],
};
