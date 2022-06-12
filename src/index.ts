import "./style.css";

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

function getAccesTokenFromURL(): string | undefined {
  const urlSearchParams = new URLSearchParams(window.location.hash.slice(1));
  const params = Object.fromEntries(urlSearchParams.entries());
  if (params.state != localStorage.getItem("authorization_state")) {
    return undefined;
  }
  return params.access_token;
}

function authorize() {
  let state = generateRandomString(16);
  const params = new URLSearchParams();
  params.append("client_id", CLIENT_ID);
  params.append("scope", "user-read-currently-playing");
  params.append("show_dialog", "true");
  params.append("redirect_uri", REDIRECT_URI);
  params.append("response_type", "token");
  params.append("state", state);

  localStorage.setItem("authorization_state", state);

  const url = "https://accounts.spotify.com/authorize?" + params.toString();
  window.open(url, "_self");
}

async function makeSpotifyApiRequest(
  endpoint: string,
  method: "GET" | "POST",
  access_token: string,
  query_params: { [index: string]: string } | null = null
): Promise<any> {
  let url = "https://api.spotify.com/v1/" + endpoint;
  if (query_params) {
    const search_params = new URLSearchParams();
    for (const [key, value] of Object.entries(query_params)) {
      search_params.append(key, value);
    }
    url += "?" + search_params.toString();
  }
  const response = await fetch(url, {
    method: method,
    headers: {
      Authorization: "Bearer " + access_token,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  if (response.status == 401) {
    throw Error("401");
  }

  if (response.status == 204) {
    return null;
  }
  return response.json();
}

interface Track {
  id: string;
  name: string;
  artists: string[];
  tempo: number;
}

async function getCurrentlyPlayingTrack(
  access_token: string
): Promise<Track | null> {
  const track_response = await makeSpotifyApiRequest(
    "me/player/currently-playing",
    "GET",
    access_token
  );
  if (!track_response) {
    return null;
  }
  const audio_features_response = await makeSpotifyApiRequest(
    "audio-features",
    "GET",
    access_token,
    { ids: track_response.item.id }
  );
  return {
    id: track_response.item.id,
    name: track_response.item.name,
    artists: track_response.item.artists.map((artist: any) => artist.name),
    tempo: audio_features_response.audio_features[0].tempo,
  };
}

function updateHTML(track: Track | null): void {
  if (!track) {
    document.getElementById("tempo-value")!.innerHTML = "";
    document.getElementById("tempo-unit")!.innerHTML = "";
    document.getElementById("song")!.innerHTML = "No track is playing";
    document.getElementById("artists")!.innerHTML = "";
    return;
  }
  document.getElementById("tempo-value")!.innerHTML = Math.floor(
    track.tempo
  ).toString();
  document.getElementById("tempo-unit")!.innerHTML = "BPM";
  document.getElementById("song")!.innerHTML = track.name;
  document.getElementById("artists")!.innerHTML = track.artists.join(", ");
}

function update(access_token: string): void {
  getCurrentlyPlayingTrack(access_token)
    .then(updateHTML)
    .catch((error: Error) => {
      if (error.message == "401") {
        authorize();
        return;
      }
      throw error;
    });
}

function startIntervalWithPause(func: () => any, time_ms: number): void {
  let interval = setInterval(func, time_ms);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      clearInterval(interval);
    } else {
      interval = setInterval(func, time_ms);
    }
  });
}

function main() {
  const access_token = getAccesTokenFromURL();
  if (!access_token) {
    authorize();
    return;
  }
  startIntervalWithPause(() => update(access_token), 1000);
}

main();
