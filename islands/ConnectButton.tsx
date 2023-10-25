export function ConnectButton() {
  function enterAccessToken() {
    window.location.href = "/accessToken";
  }

  return (
    <button
      type="button"
      onClick={enterAccessToken}
      class={"inline-flex items-center justify-center text-lg px-4 py-2 mx-2 rounded-md shadow-sm font-medium text-white bg-blue-500 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 text-lg w-40 "}
    >
      Connect
    </button>
  );
}
