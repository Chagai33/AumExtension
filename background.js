// background.js
console.log('Background script loaded');

// Listener for onInstalled event to create context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'downloadPlaylists',
    title: 'Download Playlists',
    contexts: ['action']
  });
  console.log('Context menu created');
});

// Listener for context menu click
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

// Listener for runtime messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background:', request);
  if (request.action === 'downloadPlaylists') {
    downloadPlaylists(request.token);
  } else if (request.action === 'updateProgress') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateProgress',
          processed: request.processed,
          total: request.total,
          name: request.name
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error sending message to content script:', chrome.runtime.lastError);
          } else {
            console.log('Response from content script:', response);
          }
        });
      } else {
        console.error('No active tab found');
      }
    });
  }
});

// Function to download playlists
async function downloadPlaylists(token) {
  console.log('Starting to download playlists...');
  try {
    const playlists = await fetchPlaylists(token);
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
  } catch (error) {
    console.error('Error fetching playlists for download:', error);
  }
}

// Function to fetch playlists
async function fetchPlaylists(token) {
  const playlists = [];
  let url = 'https://api.spotify.com/v1/me/playlists';
  let totalPlaylists = 0;

  chrome.runtime.sendMessage({ action: 'showProgressBar' });

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
    const filteredPlaylists = playlistsData.items.filter(playlist => playlist.tracks.total <= 500);
    playlists.push(...filteredPlaylists);
    totalPlaylists += filteredPlaylists.length;

    console.log(`Fetched ${filteredPlaylists.length} playlists, total so far: ${totalPlaylists}`);

    url = playlistsData.next; // Go to next page if available

    chrome.runtime.sendMessage({
      action: 'updateProgress',
      processed: playlists.length,
      total: totalPlaylists,
      name: filteredPlaylists[filteredPlaylists.length - 1].name
    });

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

  chrome.runtime.sendMessage({ action: 'hideProgressBar' });

  return playlists;
}

// Sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
