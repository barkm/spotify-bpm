import "./style.css";
import { authorize, getAccesTokenFromURL } from "./authorization";
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
