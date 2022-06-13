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

async function generateCodeChallenge(code_verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(code_verifier)
  );
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function getAuthorizationCodeFromURL(): string | undefined {
  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());
  if (params.state != localStorage.getItem("authorization_state")) {
    return undefined;
  }
  return params.code;
}

function redirectToSpotifyAuthorizationEndpoint() {
  const authorization_state = generateRandomString(64);
  localStorage.setItem("authorization_state", authorization_state);
  const code_verifier = generateRandomString(64);
  localStorage.setItem("code_verifier", code_verifier);
  generateCodeChallenge(code_verifier).then((code_challenge) => {
    localStorage.setItem("code_challenge", code_challenge);
    const url = generateURLWithSearchParams(
      "https://accounts.spotify.com/authorize",
      {
        client_id: CLIENT_ID,
        scope: "user-read-currently-playing",
        show_dialog: "true",
        redirect_uri: REDIRECT_URI,
        state: authorization_state,
        response_type: "code",
        code_challenge_method: "S256",
        code_challenge: code_challenge,
      }
    );
    window.open(url, "_self");
  });
}

async function requestAccessToken(
  authorization_code: string
): Promise<string | null> {
  const code_verifier = localStorage.getItem("code_verifier");
  if (!code_verifier) {
    return null;
  }
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "authorization_code",
      code: authorization_code,
      redirect_uri: REDIRECT_URI,
      code_verifier: code_verifier,
    }),
  });
  return response.json().then((data) => {
    return data.access_token;
  });
}

export function authorize(): Promise<string | null> | null {
  const access_token = localStorage.getItem("access_token");
  if (access_token) {
    return Promise.resolve(access_token);
  }
  const authorization_code = getAuthorizationCodeFromURL();
  if (authorization_code) {
    window.history.replaceState({}, document.title, "/");
    return requestAccessToken(authorization_code).then((access_token) => {
      if (!access_token) {
        return null;
      }
      localStorage.setItem("access_token", access_token);
      return access_token;
    });
  } else {
    redirectToSpotifyAuthorizationEndpoint();
    return null;
  }
}
