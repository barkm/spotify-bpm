import "./style.css";
import { authorize } from "./authorization";
import { generateURLWithSearchParams } from "./url";

async function makeSpotifyApiRequest(
  endpoint: string,
  method: "GET" | "POST",
  access_token: string,
  search_params: { [index: string]: string } = {}
): Promise<any> {
  const url = generateURLWithSearchParams(
    "https://api.spotify.com/v1/" + endpoint,
    search_params
  );
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
  const container = document.getElementById("container")!;
  if (track) {
    container.innerHTML = `
      <div id="tempo">
        <span id="tempo-value">${Math.round(track.tempo)}</span>
        <span id="tempo-unit">BPM</span>
      </div>
      <div id="song">${track.name}</div>
      <div id="artists">${track.artists.join(", ")}</div>
    `;
  } else {
    container.innerHTML = `<div id="song">No track is playing</div>`;
  }
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
  func();
  let interval = setInterval(func, time_ms);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      clearInterval(interval);
    } else {
      interval = setInterval(func, time_ms);
    }
  });
}

function signOut() {
  localStorage.clear();
  location.reload();
}

function main() {
  authorize()?.then((access_token) => {
    if (access_token) {
      startIntervalWithPause(() => update(access_token), 1000);
    }
  });
  document.getElementById("sign-out")!.onclick = signOut;
}

main();
