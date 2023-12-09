export function ConnectButton() {
  function enterAccessToken() {
    window.location.href = "/accessToken";
  }

  return (
    <button
      type="button"
      onClick={enterAccessToken}
      class="btn btn-primary"
    >
      Connect
    </button>
  );
}
