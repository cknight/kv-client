interface KeyPartProps {
  index: number;
  keyValue: string;
  type: string;
}

export function KeyPart(props: KeyPartProps) {
  const { index, keyValue, type } = props;

  return (
    <div class="flex flex-row items-center">
      <label for={`kvKeyIndex` + index} class="w-24">Part {index + 1}</label>
      <input
        id={`kvKeyIndex` + index}
        form="pageForm"
        type="text"
        name={`kvKeyIndex` + index}
        value={keyValue}
        class="rounded bg-blue-100 p-2 mr-2 w-[500px]"
      />
      <select id={`typeHelper` + index} class="rounded bg-blue-100 p-2" value={type}>
        <option value="" disabled={true} selected={true}>Choose type</option>
        <option value="bigint">bigint</option>
        <option value="boolean">boolean</option>
        <option value="number">number</option>
        <option value="string">string</option>
        <option value="Uint8Array">Uint8Array</option>
      </select>
    </div>
  );
}
