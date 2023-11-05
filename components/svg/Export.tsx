export function ExportIcon({ title }: { title: string }) {
  return (
    <svg
      class="h-6 w-6 text-blue-700"
      width="24"
      height="24"
      title={title}
      viewBox="0 0 24 24"
      stroke-width="2"
      stroke="currentColor"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" />{" "}
      <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
      {" "}
      <path d="M7 12h14l-3 -3m0 6l3 -3" />
    </svg>
  );
}
