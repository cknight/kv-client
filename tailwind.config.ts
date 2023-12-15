import { type Config } from "tailwindcss";
import daisyui from "daisyui";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
  ],
  //@ts-ignore - Unsure how to enable types for this library
  plugins: [daisyui as any],
  daisyui: {
    themes: [
      {
        kvclient: {
          "primary": "#0D63A5",
          "secondary": "#f6d860",
          "accent": "#37cdbe",
          "neutral": "#353535",
          "base-100": "#252525",

          "--rounded-box": "1rem", // border radius rounded-box utility class, used in card and other large boxes
          "--rounded-btn": "0.5rem", // border radius rounded-btn utility class, used in buttons and similar element
          "--rounded-badge": "1.9rem", // border radius rounded-badge utility class, used in badges and similar
          "--animation-btn": "0s", // duration of animation when you click on button
          "--animation-input": "0.2s", // duration of animation for inputs like checkbox, toggle, radio, etc
          "--btn-focus-scale": "0.95", // scale transform of button when you focus on it
          "--border-btn": "1px", // border width of buttons
          "--tab-border": "1px", // border width of tabs
          "--tab-radius": "0.5rem", // border radius of tabs
        },
      },
    ],
  },
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
