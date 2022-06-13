import { generateURLWithSearchParams } from "./url";

const CLIENT_ID = "41c67233bcd94457a9d0cecaf0e36aae";
declare var REDIRECT_URI: string;

function generateRandomString(length: Number): string {
  let possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function getAccesTokenFromURL(): string | undefined {
  const urlSearchParams = new URLSearchParams(window.location.hash.slice(1));
  const params = Object.fromEntries(urlSearchParams.entries());
  if (params.state != localStorage.getItem("authorization_state")) {
    return undefined;
  }
  return params.access_token;
}

export function authorize() {
  let state = generateRandomString(16);
  localStorage.setItem("authorization_state", state);
  const url = generateURLWithSearchParams(
    "https://accounts.spotify.com/authorize",
    {
      client_id: CLIENT_ID,
      scope: "user-read-currently-playing",
      show_dialog: "true",
      redirect_uri: REDIRECT_URI,
      response_type: "token",
      state: state,
    }
  );
  window.open(url, "_self");
}
