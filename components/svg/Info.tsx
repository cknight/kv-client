import { JSX } from "preact/jsx-runtime";

export function InfoIcon({ title, onClick }: { title: string, onClick?: (e: JSX.TargetedEvent<SVGElement, MouseEvent>) => void}) {
  return (
    <svg
      class="h-6 w-6 text-blue-500"
      title={title}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      onClick={onClick}
    >
      <circle cx="12" cy="12" r="10" /> <line x1="12" y1="16" x2="12" y2="12" />{" "}
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
