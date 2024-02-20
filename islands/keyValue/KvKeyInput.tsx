import { useSignal } from "@preact/signals";
import { JSX } from "preact";
import { useEffect } from "preact/hooks";

export interface KvKeyInputProps extends JSX.HTMLAttributes<HTMLInputElement> {
  disableTypes?: boolean;
  typesId?: string;
}

export function KvKeyInput(props: KvKeyInputProps) {
  const { onInput: parentOnInput, disableTypes = false, ...inputProps } = props;
  const types = useSignal("");
  const typesId = useSignal(props.typesId || crypto.randomUUID());
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

  function handleInput(event: JSX.TargetedEvent<HTMLInputElement, Event>) {
    event.preventDefault();
    if (disableTypes) return;

    //Debounce checking types of the key parts
    clearTimeout(timeoutId);
    const value = event.currentTarget.value;
    timeoutId = setTimeout(() => {
      fetch("/api/keyTypes", {
        method: "POST",
        body: value,
      })
        .then((res) => res.text())
        .then((res) => {
          const input = document.getElementById(inputProps.id as string) as HTMLInputElement;
          if (res !== "<invalid>") {
            // if the types are valid, remove the error class, but only re-validate on blur
            input.classList.remove("input-error");
          }

          const safeRes = res.replace(/</g, "&lt;").replace(/>/g, "&gt;");
          (document.getElementById(typesId.value) as HTMLDivElement).innerHTML = safeRes;
        });
    }, 250);

    // Call the onInput handler defined in a parent component, if defined
    // E.g. <KvKeyInput onInput={debouncedUpdateKeyLength} ... />
    if (parentOnInput) {
      parentOnInput(event);
    }
  }

  function validate(event: JSX.TargetedEvent<HTMLInputElement, Event>) {
    event.preventDefault();
    if (disableTypes) return;

    const types = (document.getElementById(typesId.value) as HTMLDivElement).innerHTML;
    if (types === "&lt;invalid&gt;") {
      event.currentTarget.classList.add("input-error");
    } else {
      event.currentTarget.classList.remove("input-error");
    }
  }

  return (
    <div>
      <div class="flex items-center w-full mt-2">
        <span class="ml-2 mx-2">{`[`}</span>
        <input onInput={handleInput} onBlur={validate} {...inputProps} />
        <span class="ml-2 my-2">{`]`}</span>
      </div>
      {!disableTypes && (
        <div class="flex flex-row ml-5 h-4 pt-1 mt-1 text-xs ">
          <p class="mr-2">Types:</p>
          <div id={typesId.value}>{types}</div>
        </div>
      )}
    </div>
  );
}
