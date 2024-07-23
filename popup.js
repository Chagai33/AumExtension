document.addEventListener('DOMContentLoaded', () => {
  console.log('Document loaded');

  // Add click event to the logo to open the Spotify profile page
  document.getElementById('logo').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let activeTab = tabs[0];
      chrome.tabs.create({ url: "https://open.spotify.com/user/fbszxf6omus5ze8x3uaawd5d6", index: activeTab.index + 1 });
    });
  });

  // Add click event to the Instagram icon to open the Instagram page
  document.getElementById('instagram').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let activeTab = tabs[0];
      chrome.tabs.create({ url: "https://www.instagram.com/aum.music/", index: activeTab.index + 1 });
    });
  });

  let currentTrackId = null;

  function updateSongDetails() {
    console.time('updateSongDetails');  // Start timer for updateSongDetails
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let activeTab = tabs[0];
      if (activeTab.url.includes("open.spotify.com")) {
        chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          function: getSpotifySongDetails
        }, async (results) => {
          if (results && results[0] && results[0].result) {
            let songDetails = results[0].result;
            console.log('Song details:', songDetails);
            console.timeEnd('updateSongDetails');  // End timer for updateSongDetails
            console.time('processSongDetails');  // Start timer for processing song details
            if (songDetails && songDetails.trackId !== currentTrackId) {
              currentTrackId = songDetails.trackId;
              const songInfoElement = document.getElementById('song-info');
              const trackId = songDetails.trackId || "N/A";
              const trackUrl = `https://open.spotify.com/track/${trackId}`;

              // Add the song details
              songInfoElement.innerHTML = `<strong>${songDetails.title}</strong> - ${songDetails.artists}` || "N/A";
              document.getElementById('trackId').textContent = trackId;

              // Add event listener for the track info button
              document.getElementById('track-info-button').addEventListener('click', () => {
                const trackInfoDiv = document.getElementById('track-info');
                trackInfoDiv.style.display = 'block';
                setTimeout(() => {
                  trackInfoDiv.style.display = 'none';
                }, 2000); // Hide after 2 seconds
              });

              // Add event listener for the share button
              document.getElementById('share-button').addEventListener('click', () => {
                copyToClipboard(trackUrl);
                showCopyNotification();
              });

              // Show the buttons only if we're on Spotify
              document.getElementById('find-youtube').style.display = 'inline-block';
              document.getElementById('lyrics-button').style.display = 'inline-block';
              document.getElementById('track-info-button').style.display = 'inline-block';
              document.getElementById('share-button').style.display = 'inline-block';

              document.getElementById('find-youtube').addEventListener('click', () => {
                console.log('Find On YouTube clicked');
                let query = `${songDetails.title} ${songDetails.artists.replace(/<[^>]*>/g, '')}`;
                let youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
                chrome.tabs.create({ url: youtubeUrl, index: activeTab.index + 1 });
              });

              document.getElementById('lyrics-button').addEventListener('click', () => {
                console.log('Lyrics button clicked');
                let skileyUrl = `https://skiley.net/`;
                chrome.tabs.create({ url: skileyUrl, index: activeTab.index + 1 });
              });

              await checkPlaylists(songDetails.trackId); // Automatically check playlists
            }

            // Stop animation if the music is paused
            const nowPlayingElement = document.getElementById('now-playing');
            if (songDetails.isPlaying) {
              nowPlayingElement.classList.remove('no-animation');
            } else {
              nowPlayingElement.classList.add('no-animation');
            }
            console.timeEnd('processSongDetails');  // End timer for processing song details
          } else {
            console.log('No song details found');
          }
        });
      } else {
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
          let spotifyTab = tabs.find(tab => tab.url.includes("open.spotify.com"));
          if (spotifyTab) {
            document.getElementById('notice-text').innerText = 'Notice: Spotify Web Player is open in another tab. Would you like to switch to it?';
            document.getElementById('notice').style.display = 'block';
            document.getElementById('skip-to-spotify').style.display = 'inline-block';
            document.getElementById('open-spotify').style.display = 'none';

            document.getElementById('skip-to-spotify').addEventListener('click', () => {
              chrome.tabs.update(spotifyTab.id, { active: true });
            });
          } else {
            document.getElementById('notice-text').innerText = 'Notice: Spotify Web Player is not open. Would you like to open it now?';
            document.getElementById('notice').style.display = 'block';
            document.getElementById('skip-to-spotify').style.display = 'none';
            document.getElementById('open-spotify').style.display = 'inline-block';

            document.getElementById('open-spotify').addEventListener('click', () => {
              chrome.tabs.create({ url: "https://open.spotify.com", index: activeTab.index + 1 });
            });
          }
        });

        // Hide the buttons if we're not on Spotify
        document.getElementById('find-youtube').style.display = 'none';
        document.getElementById('lyrics-button').style.display = 'none';
        document.getElementById('track-info-button').style.display = 'none';
        document.getElementById('share-button').style.display = 'none';
      }
    });
  }

  // Update song details every 5 seconds
  setInterval(updateSongDetails, 5000);

  // Initial update
  updateSongDetails();

  // Always show footer
  document.getElementById('footer').style.display = 'block';
});

function getSpotifySongDetails() {
  let nowPlayingElement = document.querySelector('[aria-label="now playing view link"]');
  if (!nowPlayingElement) {
    return {
      title: "N/A",
      artists: "N/A",
      trackId: "N/A",
      currentTime: 0,
      duration: 0,
      isPlaying: false
    };
  }

  let trackId = nowPlayingElement.getAttribute('href').split(':').pop();
  let songTitleElement = document.querySelector('[data-testid="context-item-info-title"] a');
  let artistsContainer = document.querySelector('[data-testid="context-item-info-subtitles"]');
  let artistsElements = artistsContainer ? artistsContainer.querySelectorAll('[data-testid="context-item-info-artist"]') : [];
  let isPlaying = document.querySelector('[data-testid="control-button-pause"]') !== null;

  let uniqueArtists = new Set();

  if (songTitleElement && artistsElements.length > 0) {
    let songTitle = songTitleElement.textContent;
    let artists = Array.from(artistsElements).map(a => {
      let artistName = a.textContent;
      let artistId = a.getAttribute('href').split('/').pop();
      return `<a href="https://open.spotify.com/artist/${artistId}" target="_blank">${artistName}</a>`;
    }).join(', ');

    return {
      title: songTitle,
      artists: artists,
      trackId: trackId,
      isPlaying: isPlaying
    };
  } else {
    return {
      title: songTitleElement ? songTitleElement.textContent : "N/A",
      artists: "N/A",
      trackId: trackId,
      isPlaying: isPlaying
    };
  }
}

function copyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function showCopyNotification() {
  const notification = document.getElementById('copy-notification');
  notification.style.display = 'block';
  setTimeout(() => {
    notification.style.display = 'none';
  }, 2000);
}

async function checkPlaylists(trackId) {
  try {
    const playlists = await loadPlaylistsFromFile();

    if (!playlists) {
      console.log('No playlists found in file');
      document.getElementById('song-info').innerHTML += `<p><strong>Playlists:</strong><br>No playlists found.</p>`;
      return;
    }

    const matchingPlaylists = await findTrackInPlaylists(trackId, playlists);

    if (matchingPlaylists.length > 0) {
      let playlistsHTML = matchingPlaylists.map(playlist => {
        return `<a href="https://open.spotify.com/playlist/${playlist.id}" target="_blank">${playlist.name}</a>`;
      }).join('<br>');

      document.getElementById('song-info').innerHTML += `<p><strong>Playlists:</strong><br>${playlistsHTML}</p>`;
    } else {
      document.getElementById('song-info').innerHTML += `<p><strong>Playlists:</strong><br>No playlists found.</p>`;
    }
  } catch (error) {
    console.error('Error fetching playlists:', error);
    document.getElementById('song-info').innerHTML += `<p><strong>Playlists:</strong><br>Error fetching playlists. ${error.message}</p>`;
  }
}

async function loadPlaylistsFromFile() {
  return new Promise((resolve, reject) => {
    fetch(chrome.runtime.getURL('playlists_report.json'))
      .then(response => response.json())
      .then(data => {
        console.log('Loaded playlists from file:', data);
        resolve(data.playlists);
      })
      .catch(error => {
        console.error('Error loading playlists from file:', error);
        reject(null);
      });
  });
}

async function findTrackInPlaylists(trackId, playlists) {
  const matchingPlaylists = [];
  const totalPlaylists = playlists.length;
  let processedPlaylists = 0;

  for (let playlist of playlists) {
    try {
      const trackIds = playlist.tracks.map(track => track.id);

      if (trackIds.includes(trackId)) {
        matchingPlaylists.push({
          name: playlist.name,
          id: playlist.id,  // Include the playlist ID here
          url: `https://open.spotify.com/playlist/${playlist.id}`
        });
      }

      processedPlaylists++;
      updateProgressBar(processedPlaylists, totalPlaylists, `Processing playlist ${playlist.name} (${processedPlaylists}/${totalPlaylists})`);
    } catch (error) {
      console.error(`Error processing playlist ${playlist.id}:`, error);
    }
  }
  return matchingPlaylists;
}

function updateProgressBar(processed, total, message) {
  console.log(message);  // Logging the progress
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
