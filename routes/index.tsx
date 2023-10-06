/// <reference lib="deno.unstable" />
import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { ValidationError } from "../utils/validationError.ts";
import { KvKeyInput } from "../components/KvKeyInput.tsx";
import { parseKvKey } from "../utils/kvKeyParser.ts";
import DarkMode from "../islands/DarkMode.tsx";
import { useSignal } from "@preact/signals";
import {
  KvUIEntry,
  SearchData,
  State,
  TW_TABLE,
  TW_TABLE_WRAPPER,
  TW_TBODY,
  TW_TH,
  TW_THEAD,
  TW_TR,
} from "../types.ts";
import { SearchBox } from "../islands/SearchBox.tsx";
import { TabBar } from "../islands/TabBar.tsx";


export default function Home(data: PageProps<SearchData>) {
  return (
    <>
    </>
  );
}
