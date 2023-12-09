import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { JSX } from "preact";

export interface KvKeyInputProps extends JSX.HTMLAttributes<HTMLInputElement> {
  disableTypes?: boolean;
}

export function KvKeyInput(props: KvKeyInputProps) {
  const { disableTypes = false, ...inputProps } = props;
  const types = useSignal("");
  const typesId = useSignal(crypto.randomUUID());
  let timeoutId = -1;

  useEffect(() => {
    if (disableTypes) return;
    
    fetch("/api/keyTypes", {
      method: "POST",
      body: (document.getElementById(props.id as string) as HTMLInputElement).value,
    })
      .then((res) => res.text())
      .then((res) => {
        const safeRes = res.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        (document.getElementById(typesId.value) as HTMLDivElement).innerHTML = safeRes;
      });
  }, []);

  function parseTypes(event: JSX.TargetedEvent<HTMLInputElement, Event>) {
    event.preventDefault();
    if (disableTypes) return;

    clearTimeout(timeoutId);
    const value = event.currentTarget.value;
    timeoutId = setTimeout(() => {
      fetch("/api/keyTypes", {
        method: "POST",
        body: value,
      })
        .then((res) => res.text())
        .then((res) => {
          const safeRes = res.replace(/</g, "&lt;").replace(/>/g, "&gt;");
          (document.getElementById(typesId.value) as HTMLDivElement).innerHTML = safeRes;
        });
    }, 250);
  }

  return (
    <div>
      <div class="flex items-center w-full mt-2">
        <span class="ml-2 mx-2">{`[`}</span>
        <input onInput={parseTypes} {...inputProps} />
        <span class="ml-2 my-2">{`]`}</span>
      </div>
      <div id={typesId.value} class="ml-5 h-4 pt-1 text-xs ">{types}</div>
    </div>
  );
}
