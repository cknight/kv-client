import { signal } from "@preact/signals";
import { State } from "../types.ts";

export const state: State = {
  kvUrl: "",
  pat: "",
  kv: null,
  activeTab: signal("search")
};
export const tabbar = signal<string>("search");
