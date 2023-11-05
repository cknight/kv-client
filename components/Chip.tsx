interface ChipProps {
  name: string;
  bgColor: string;
}

export function Chip(props: ChipProps) {
  return (
    <div class={props.bgColor + " break-normal my-2 mr-2 h-7 flex items-center justify-between rounded-2xl px-3 py-0 text-sm font-normal text-white"}>
      {props.name}
    </div>
  );
}
