chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'downloadPlaylists',
    title: 'Download Playlists',
    contexts: ['action']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'downloadPlaylists') {
    chrome.storage.local.get('token', (result) => {
      if (result.token) {
        downloadPlaylists(result.token);
      } else {
        console.error('No token found in storage');
      }
    });
  }
});

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

      console.log('Playlists downloaded successfully');
    })
    .catch(error => {
      console.error('Error fetching playlists for download:', error);
    });
}

async function fetchPlaylists(token) {
  const playlists = [];
  let url = 'https://api.spotify.com/v1/me/playlists';
  let totalPlaylists = 0;

  while (url) {
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
    playlists.push(...playlistsData.items);
    totalPlaylists += playlistsData.items.length;

    console.log(`Fetched ${playlistsData.items.length} playlists, total so far: ${totalPlaylists}`);

    url = playlistsData.next; // Go to next page if available

    await sleep(200); // Sleep for 200ms to avoid rate limits
  }

  console.log(`Total playlists fetched: ${totalPlaylists}`);

  for (const playlist of playlists) {
    const tracks = [];
    let tracksUrl = `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`;
    let totalTracks = 0;

    while (tracksUrl) {
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

    playlist.tracks = tracks.map(item => ({
      id: item.track.id,
      name: item.track.name,
      artists: item.track.artists.map(artist => artist.name).join(', '),
      album: item.track.album.name
    }));

    console.log(`Total tracks for playlist ${playlist.name}: ${totalTracks}`);
  }

  return playlists;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
