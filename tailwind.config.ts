import { type Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
  ],
  theme: {
    fontFamily: {
      body: [
        "system-ui",
        "sans-serif",
      ],
      sans: [
        "system-ui",
        "sans-serif",
      ],
      mono: [
        "ui-monospace",
        "Cascadia Code",
        "Source Code Pro",
        "Menlo",
        "Consolas",
        "DejaVu Sans Mono",
        "monospace",
      ],
    },
  },
} as Config;
