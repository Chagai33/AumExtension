document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    let activeTab = tabs[0];
    if (activeTab.url.includes("open.spotify.com")) {
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        function: getSpotifySongDetails
      }, (results) => {
        if (results && results[0]) {
          let songDetails = results[0].result;
          if (songDetails) {
            document.getElementById('song-info').innerHTML = `<strong>${songDetails.title}</strong> - ${songDetails.artists}` || "N/A";
            document.getElementById('trackId').textContent = songDetails.trackId || "N/A";

            document.getElementById('search-youtube').addEventListener('click', () => {
              let query = `${songDetails.title} ${songDetails.artists}`;
              let youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
              chrome.tabs.create({ url: youtubeUrl });
            });

            document.getElementById('lyrics-button').addEventListener('click', () => {
              let skileyUrl = `https://skiley.net/`;
              chrome.tabs.create({ url: skileyUrl });
            });
          }
        }
      });
    } else {
      document.body.innerHTML = '<h3 id="header">Aum.music</h3><p>Notice: This extension works on Spotify website only.</p>';
    }
  });
});

function getSpotifySongDetails() {
  let nowPlayingElement = document.querySelector('[aria-label="now playing view link"]');
  if (!nowPlayingElement) {
    return {
      title: "N/A",
      artists: "N/A",
      trackId: "N/A"
    };
  }

  let trackId = nowPlayingElement.getAttribute('href').split(':').pop();
  let songTitleElement = document.querySelector('[data-testid="context-item-info-title"] a');
  let artistsContainer = document.querySelector('[data-testid="context-item-info-subtitles"]');
  let artistsElements = artistsContainer ? artistsContainer.querySelectorAll('[data-testid="context-item-info-artist"]') : [];

  // Set to keep track of unique artists
  let uniqueArtists = new Set();

  if (songTitleElement && artistsElements.length > 0) {
    let songTitle = songTitleElement.textContent;
    artistsElements.forEach(a => uniqueArtists.add(a.textContent));
    let artists = Array.from(uniqueArtists).join(', ');

    return {
      title: songTitle,
      artists: artists,
      trackId: trackId
    };
  } else {
    return {
      title: songTitleElement ? songTitleElement.textContent : "N/A",
      artists: "N/A",
      trackId: trackId
    };
  }
}
