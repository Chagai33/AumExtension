# Spotify Song Details Extension

## Introduction

The "Spotify Song Details" extension was developed to address a significant challenge I faced in my music project, Aum.Music. This project involves curating and updating weekly playlists with the top releases across various genres for over 216 consecutive weeks. The main issue was managing and updating dozens of existing playlists with new music. It was practically impossible to manually check which playlists a particular song was already included in. This extension was born out of necessity and has become an essential tool in my workflow.

## Purpose of Development

**I initially considered developing a Python script to check which playlists a specific song appears in, similar to the dozens of scripts I've created to manage my project. However, this solution seemed cumbersome, and I wasn't eager to pursue it. Then, on a recent Saturday, I stumbled upon a YouTube video explaining how to develop Chrome extensions. While washing dishes, I found myself captivated by the clear explanation and decided to watch the entire video. Inspired, I decided to try it out, and within a couple of days, I had a fully functioning extension that solved my main problem effortlessly.**

## Features

### 1. Display Song Details
- **Song Information**: Shows the currently playing song's title and artists directly in the popup.
- **Artist Links**: Clicking on the artist names opens their Spotify profile page.

### 2. Search and Lyrics
- **Find on YouTube**: A button that searches for the current song on YouTube.
- **Lyrics**: A button that opens Skiley.net to find the lyrics of the current song.

### 3. Playlist Management
- **Playlist Check**: Automatically checks and displays which of your playlists include the currently playing song. This feature is crucial for efficiently managing and updating your playlists.

### 4. Spotify Web Player Navigation
- **Switch to Spotify Web Player**: A button that allows you to switch to an already open Spotify web player tab.
- **Open Spotify Web Player**: If no Spotify tab is open, this button opens a new tab with the Spotify web player.
- **These buttons appear according to their relevance.**

### 5. Share Song
- **Copy Link to Song**: A button that copies the direct link to the currently playing song to your clipboard.

### 6. Profile Links
- **Spotify Profile**: Clicking the logo in the popup takes you to my Spotify profile page.
- **Instagram Profile**: Clicking the Instagram icon takes you to the Aum.Music Instagram page.

## Technical Details

### Files and Structure
- **manifest.json**: Configuration file for the Chrome extension.
- **background.js**: Handles background processes, including playlist data fetching.
- **content.js**: Injects scripts into the Spotify web player to retrieve song details.
- **popup.html**: The HTML file for the popup interface.
- **popup.js**: JavaScript for handling interactions within the popup.
- **callback.html & callback.js**: Used for Spotify authentication callbacks.
- **icons/**: Directory containing icons for the extension.

### Installation
1. **Download the Extension Files**: Clone or download the files from the GitHub repository.
2. **Open Chrome Extensions Page**: Navigate to `chrome://extensions/` in your Chrome browser.
3. **Enable Developer Mode**: Toggle the switch in the top right corner.
4. **Load Unpacked**: Click on "Load unpacked" and select the directory containing the extension files.

### Usage
1. **Open Spotify Web Player**: Navigate to the Spotify web player.
2. **Activate the Extension**: Click on the extension icon in the Chrome toolbar.
3. **View Song Details**: Instantly see the song details, check playlists, search on YouTube, find lyrics, and share the song link.

## Conclusion

**The development of this extension highlights my ability to quickly learn and apply new technologies to solve real-world problems. It's a testament to my versatile learning capabilities, curiosity for new technologies, and the ability to dive into new challenges and understand how to get things done step by step. If you have any questions or need further assistance, feel free to contact me.**

---

**Developed by**: Chagai Yechiel  
**Contact**: [chagai33@gmail.com](mailto:chagai33@gmail.com)  
**LinkedIn**: [Chagai Yechiel](https://www.linkedin.com/in/chagai-yechiel)  
**Spotify Profile**: [Aum.Music](https://open.spotify.com/user/fbszxf6omus5ze8x3uaawd5d6)  
**Instagram**: [Aum.Music Instagram](https://www.instagram.com/aum.music/)  

