// download.js

document.addEventListener('DOMContentLoaded', () => {
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const playlistNames = document.getElementById('playlist-names');
  const startButton = document.getElementById('start-button');
  const stopButton = document.getElementById('stop-button');
  const clearCacheButton = document.getElementById('clear-cache-button');
  const connectSpotifyButton = document.getElementById('connect-spotify-button');
  let stopRequested = false;

  function updateProgress(processed, total, name) {
    chrome.runtime.sendMessage({
      action: 'updateProgress',
      processed: processed,
      total: total,
      name: name
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to update content script:', chrome.runtime.lastError.message);
      } else {
        console.log('Update progress response:', response);
        if (!response) {
          console.error('No response received from service worker');
        }
      }
    });
  }

  function downloadPlaylists(token) {
    console.log('Starting to download playlists...');
    fetchPlaylists(token)
      .then(playlists => {
        console.log('Fetched playlists:', playlists);
        const report = {
          totalPlaylists: playlists.length,
          playlists: playlists.map(playlist => ({
            id: playlist.id,
            name: playlist.name,
            tracks: playlist.tracks
          }))
        };

        const json = JSON.stringify(report, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'playlists_report.json';
        a.click();
        URL.revokeObjectURL(url);

        alert('Playlists downloaded successfully. The file has been saved as playlists_report.json in your Downloads folder.');
        displayPlaylists(playlists);

        console.log('Playlists downloaded successfully');
      })
      .catch(error => {
        console.error('Error fetching playlists for download:', error);
        displayError(error.message);
        startButton.textContent = 'Start Download';
      });
  }

  async function fetchPlaylists(token) {
    const playlists = new Set();
    let url = 'https://api.spotify.com/v1/me/playlists';
    let totalPlaylists = 0;
    const allFilteredPlaylists = [];

    while (url && !stopRequested) {
      const playlistsResponse = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!playlistsResponse.ok) {
        const errorText = await playlistsResponse.text();
        throw new Error(`Error fetching playlists: ${playlistsResponse.status} ${errorText}`);
      }

      const playlistsData = await playlistsResponse.json();
      const filteredPlaylists = playlistsData.items.filter(playlist => playlist.tracks.total <= 100 && !playlist.name.toLowerCase().includes('outofplaylist'));

      filteredPlaylists.forEach(playlist => {
        if (!playlists.has(playlist.id)) {
          playlists.add(playlist.id);
          allFilteredPlaylists.push(playlist);
          updateProgress(playlists.size, totalPlaylists + filteredPlaylists.length, playlist.name);
          console.log(`Currently processing: ${playlist.name}`);
        }
      });

      totalPlaylists += filteredPlaylists.length;
      url = playlistsData.next; // Go to next page if available
      await sleep(200); // Sleep for 200ms to avoid rate limits
    }

    if (stopRequested) {
      alert('Download process stopped.');
      return [];
    }

    console.log(`Total playlists fetched: ${totalPlaylists}`);

    for (const playlist of allFilteredPlaylists) {
      const tracks = [];
      let tracksUrl = `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`;
      let totalTracks = 0;

      while (tracksUrl && !stopRequested) {
        const tracksResponse = await fetch(tracksUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!tracksResponse.ok) {
          const errorText = await tracksResponse.text();
          throw new Error(`Error fetching tracks for playlist ${playlist.id}: ${tracksResponse.status} ${errorText}`);
        }

        const tracksData = await tracksResponse.json();
        tracks.push(...tracksData.items);
        totalTracks += tracksData.items.length;

        console.log(`Fetched ${tracksData.items.length} tracks for playlist ${playlist.name}, total so far: ${totalTracks}`);

        tracksUrl = tracksData.next; // Go to next page if available

        await sleep(200); // Sleep for 200ms to avoid rate limits
      }

      if (stopRequested) {
        alert('Download process stopped.');
        return [];
      }

      playlist.tracks = tracks.map(item => ({
        id: item.track.id,
        name: item.track.name,
        artists: item.track.artists.map(artist => artist.name).join(', '),
        album: item.track.album.name
      }));

      console.log(`Total tracks for playlist ${playlist.name}: ${totalTracks}`);
    }

    return allFilteredPlaylists;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function displayPlaylists(playlists) {
    playlistNames.innerHTML = '';
    playlists.forEach(playlist => {
      const playlistElement = document.createElement('div');
      playlistElement.className = 'playlist-item';
      playlistElement.innerHTML = `
        <h3>${playlist.name}</h3>
        <p>Total tracks: ${playlist.tracks.length}</p>
      `;
      playlistNames.appendChild(playlistElement);
    });
  }

  function displayError(message) {
    const errorElement = document.createElement('p');
    errorElement.style.color = 'red';
    errorElement.textContent = `Error: ${message}`;
    document.body.appendChild(errorElement);
  }

  connectSpotifyButton.addEventListener('click', () => {
    initiateSpotifyAuth();
  });

  startButton.addEventListener('click', () => {
    chrome.storage.local.get('token', (result) => {
      if (result.token) {
        startButton.textContent = 'Downloading...';
        downloadPlaylists(result.token);
      } else {
        console.error('No token found in storage');
        displayError('No token found in storage');
      }
    });
  });

  stopButton.addEventListener('click', () => {
    if (stopButton.textContent === 'Stop Download') {
      stopRequested = true;
    } else {
      location.reload();
    }
  });

  clearCacheButton.addEventListener('click', () => {
    clearCache();
  });

  function clearCache() {
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        displayError('Error clearing cache');
      } else {
        const clearedMessage = 'Cache cleared successfully.';
        alert(clearedMessage);
        console.log(clearedMessage);
      }
    });
  }

  // Add note about exclusions
  const noteElement = document.createElement('p');
  noteElement.innerHTML = `
    <strong>NOTE:</strong><br>
    Playlists with more than 100 songs and playlists named "Outofplaylist" are excluded.<br>
    The file will be downloaded as playlists_report.json in your Downloads folder. Please save it in the extension's folder to view which playlist a song belongs to while playing.
  `;
  document.body.appendChild(noteElement);
});

function initiateSpotifyAuth() {
  const clientId = '276ff68d7b8d45068933752f4cdbced5';
  const redirectUri = 'https://bicapbdkaileclciifbengifanfenolh.chromiumapp.org/spotify';
  const scopes = 'playlist-read-private playlist-read-collaborative';

  const codeVerifier = generateCodeVerifier();
  generateCodeChallenge(codeVerifier).then(codeChallenge => {
    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge_method=S256&code_challenge=${codeChallenge}`;

    chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, function (redirectUrl) {
      if (chrome.runtime.lastError || !redirectUrl) {
        console.error('Error during Spotify authentication:', chrome.runtime.lastError.message);
        return;
      }

      const urlParams = new URLSearchParams(new URL(redirectUrl).search);
      const code = urlParams.get('code');
      if (code) {
        exchangeCodeForToken(code, codeVerifier);
      } else {
        console.error('No code found in redirect URL');
      }
    });
  });
}

function generateCodeVerifier() {
  const array = new Uint8Array(56);
  window.crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

function generateCodeChallenge(codeVerifier) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier)).then(buffer => {
    return base64UrlEncode(new Uint8Array(buffer));
  });
}

function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode.apply(null, buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function exchangeCodeForToken(code, codeVerifier) {
  const clientId = '276ff68d7b8d45068933752f4cdbced5';
  const redirectUri = 'https://bicapbdkaileclciifbengifanfenolh.chromiumapp.org/spotify';
  const tokenUrl = 'https://accounts.spotify.com/api/token';

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier
  });

  fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  })
  .then(response => response.json())
  .then(data => {
    if (data.access_token) {
      chrome.storage.local.set({ token: data.access_token }, () => {
        console.log('Token saved');
        alert('Spotify connected successfully!');
        document.getElementById('start-button').style.display = 'block';
        document.getElementById('connect-spotify-button').style.display = 'none';
        document.getElementById('stop-button').style.display = 'block';
      });
    } else {
      console.error('Error obtaining token:', data);
    }
  })
  .catch(error => {
    console.error('Error exchanging code for token:', error);
  });
}
