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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSongDetails') {
    sendResponse(getSpotifySongDetails());
  }
});
