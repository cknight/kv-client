export function ConnectionCard() {
  return (
    <div class="flex flex-col justify-between hover:bg-red-200 border-yellow-500 m-3 h-full border-1 rounded w-80 h-48 hover:cursor-pointer p-4">
      <div class="flex justify-center">
        <p class="text-lg font-bold">This is a longer name (prod)</p>
      </div>
      <div class="flex justify-center">
        <p class="text-xs break-all">
          /home/chris/.cache/deno/location_data/04e00dc8f52114de1a88d56fbb9842d2eedfe4603408be03c5c96be2d8e423b7/kv.sqlite3
        </p>
      </div>
      <div id="actionRow" class="flex justify-between">
        <div>
          <svg
            class="h-8 w-8 text-red-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <title>Remove connection</title>
            <polyline points="3 6 5 6 21 6" />{" "}
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            {" "}
            <line x1="10" y1="11" x2="10" y2="17" /> <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </div>
        <div class="flex justify-center items-center">
          <p class="text-xl">37.2Mb</p>
        </div>
        <div>
          <svg
            class="h-8 w-8 text-blue-700"
            width="24"
            height="24"
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
        </div>
      </div>
    </div>
  );
}
