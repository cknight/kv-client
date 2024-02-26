const listFormIds = [
  "show",
  "from",
  "filter",
  "prefix",
  "start",
  "end",
  "limit",
  "reverse",
  "disableCache",
];

const getFormIds = [
  "kvKey",
  "disableCache",
];

export function updateListUrl() {
  listFormIds.forEach(updateUrl);
}

export function submitListForm() {
  listFormIds.forEach(updateUrl);
  const form = document.getElementById("pageForm") as HTMLFormElement;
  form.submit();
}

export function submitGetForm() {
  getFormIds.forEach(updateUrl);
  const form = document.getElementById("pageForm") as HTMLFormElement;
  form.submit();
}

export function clearListForm() {
  const resetIds = ["prefix", "start", "end", "limit", "reverse", "filter", "disableCache"];
  resetIds.forEach(reset);
}

export function clearGetForm() {
  const resetIds = ["kvKey"];
  resetIds.forEach(reset);
}

function reset(id: string) {
  const element = document.getElementById(id);

  if (!element) return;
  if (isCheckbox(element)) {
    (element as HTMLInputElement).checked = false;
  } else if (isSelect(element)) {
    (element as HTMLSelectElement).selectedIndex = 0;
  } else if (isInput(element)) {
    (element as HTMLInputElement).value = "";
  }
}

function isInput(element: HTMLElement): boolean {
  return element.tagName === "INPUT";
}

function isCheckbox(element: HTMLElement): boolean {
  return element.tagName === "INPUT" && (element as HTMLInputElement).type === "checkbox";
}

function isSelect(element: HTMLElement): boolean {
  return element.tagName === "SELECT";
}

function updateUrl(id: string) {
  const searchParams = new URLSearchParams(window.location.search);
  const element = document.getElementById(id) as HTMLInputElement;

  if (!element) {
    searchParams.delete(id);
    return;
  }
  let value = "";

  if (isCheckbox(element)) {
    value = element.checked ? "true" : "false";
  } else {
    value = element.value;
  }
  searchParams.set(id, value);
  window.history.pushState({}, "", `?${searchParams.toString()}`);
}
