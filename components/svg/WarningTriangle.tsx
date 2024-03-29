export function WarningTriangleIcon(props: { type: "warning" | "error" }) {
  return (
    <svg
      class={"h-6 w-6 " + (props.type === "warning" ? "text-yellow-500" : "text-red-500")}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      stroke-width="2"
      stroke="currentColor"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" /> <path d="M12 9v2m0 4v.01" />{" "}
      <path d="M5.07 19H19a2 2 0 0 0 1.75 -2.75L13.75 4a2 2 0 0 0 -3.5 0L3.25 16.25a2 2 0 0 0 1.75 2.75" />
    </svg>
  );
}
