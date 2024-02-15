import { WarningTriangleIcon } from "./svg/WarningTriangle.tsx";
import { ComponentChildren } from "preact";

export function Caution(props: { children: ComponentChildren }) {
  return (
    <div class="border-2 border-yellow-500 bg-[#252525] rounded  p-4 flex flex-row mt-4">
      <WarningTriangleIcon type="warning" />
      {props.children}
    </div>
  );
}
