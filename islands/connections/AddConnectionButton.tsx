import { JSX } from "preact";

interface AddConnectionButtonProps {
  route: string;
  text: string;
}

export function AddConnectionButton(props: AddConnectionButtonProps) {
  function addConnection(event: JSX.TargetedEvent<HTMLButtonElement, Event>) {
    event.preventDefault();
    window.location.href = props.route; //"/addLocalConnection";
  }

  return (
    <button
      type="button"
      onClick={addConnection}
      class="btn btn-primary"
    >
      Add {props.text}
    </button>
  );
}
