const audio = document.getElementById('audio-player');
const trackName = document.getElementById('track-name');
const artistName = document.getElementById('artist-name');
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const repeatBtn = document.getElementById('repeat-btn');
const muteBtn = document.getElementById('mute-btn');
const folderBtn = document.getElementById('folder-btn');
const progressBar = document.getElementById('progress-bar');
const volumeSlider = document.getElementById('volume-slider');

let tracks = [];
let currentTrackIndex = 0;
let isShuffle = false;
let isRepeat = false;
let isMuted = false;

async function loadStoredFolder() {
  console.log('Renderer: Loading stored folder');
  if (!window.electronAPI) {
    console.error('Renderer: electronAPI is not available');
    trackName.textContent = 'App initialization error';
    return;
  }
  try {
    const folder = await window.electronAPI.getStoredFolder();
    console.log('Renderer: Stored folder:', folder);
    if (folder) {
      await loadTracks(folder);
    } else {
      trackName.textContent = 'Select a folder to start';
    }
  } catch (error) {
    console.error('Renderer: Error loading stored folder:', error);
    trackName.textContent = 'Error loading folder';
  }
}

async function loadTracks(folderPath) {
  try {
    console.log('Renderer: Reading folder:', folderPath);
    const files = await window.electronAPI.readFolder(folderPath);
    console.log('Renderer: Raw files:', files);
    tracks = await Promise.all(
      files
        .filter(file => file.isFile && /\.(mp3|wav|m4a)$/i.test(file.name))
        .map(file => window.electronAPI.getFilePath(folderPath, file.name))
    );
    
    console.log('Renderer: Found tracks:', tracks);
    if (tracks.length > 0) {
      currentTrackIndex = 0;
      loadTrack(currentTrackIndex);
    } else {
      trackName.textContent = 'No audio files found';
      artistName.textContent = '';
    }
  } catch (error) {
    console.error('Renderer: Error loading tracks:', error);
    trackName.textContent = 'Error loading folder';
    artistName.textContent = '';
  }
}

function extractArtist(fileName) {
  // Basic heuristic: assume artist is before a hyphen or first word
  const parts = fileName.replace(/\.(mp3|wav)$/i, '').split('-');
  return parts.length > 1 ? parts[0].trim() : fileName.split(' ')[0].trim();
}

function loadTrack(index) {
  if (tracks.length === 0) {
    trackName.textContent = 'No tracks available';
    artistName.textContent = '';
    return;
  }
  audio.src = tracks[index];
  const fileName = tracks[index].split('/').pop().split('\\').pop();
  trackName.textContent = fileName;
  artistName.textContent = extractArtist(fileName);
  trackName.classList.toggle('marquee', trackName.scrollWidth > trackName.parentElement.clientWidth);
  progressBar.value = 0;
}

const playPauseImg = document.querySelector(".playPauseImg");
const playImgPath = "Images/control-images/play.JPG";
const pauseImgPath = "Images/control-images/pause.JPG";
playPauseImg.src = playImgPath;
function playPause() {
  if (audio.paused) {
    audio.play().catch(error => {
      console.error('Playback error:', error);
      trackName.textContent = 'Error playing track';
    });
    playPauseImg.src = pauseImgPath;
  } else {
    audio.pause();
    playPauseImg.src = playImgPath;
  }
}

window.addEventListener("DOMContentLoaded", () => {
    const imagePath = window.electronAPI.getImagePath("play.png");
    console.log(imagePath);
});

function nextTrack() {
  if (tracks.length === 0) return;
  if (isShuffle) {
    currentTrackIndex = Math.floor(Math.random() * tracks.length);
  } else {
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
  }
  loadTrack(currentTrackIndex);
  playPause();
}

function prevTrack() {
  if (tracks.length === 0) return;
  currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
  loadTrack(currentTrackIndex);
}

function updateProgress() {
  if (audio.duration) {
    progressBar.value = (audio.currentTime / audio.duration) * 100;
  }
}

function setProgress(e) {
  if (audio.duration) {
    audio.currentTime = (e.target.value / 100) * audio.duration;
  }
}

function adjustVolume(value) {
  audio.volume = value;
  isMuted = value === 0;
//   muteBtn.textContent = isMuted ? '🔈' : '🔇';
  volumeSlider.value = value;
}

function toggleMute() {
  if (isMuted) {
    audio.volume = volumeSlider.value || 1;
    // muteBtn.textContent = '🔇';
  } else {
    audio.volume = 0;
    // muteBtn.textContent = '🔈';
  }
  isMuted = !isMuted;
}

audio.addEventListener('ended', () => {
  console.log('Renderer: Track ended');
  if (isRepeat) {
    loadTrack(currentTrackIndex);
  } else {
    nextTrack();
  }
});

audio.addEventListener('timeupdate', updateProgress);

playPauseBtn.addEventListener('click', () => {
  console.log('Renderer: Play/Pause clicked');
  playPause();
});

nextBtn.addEventListener('click', () => {
  console.log('Renderer: Next clicked');
  nextTrack();
});

prevBtn.addEventListener('click', () => {
  console.log('Renderer: Previous clicked');
  prevTrack();
});

shuffleBtn.addEventListener('click', () => {
  console.log('Renderer: Shuffle clicked');
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle('active', isShuffle);
});

repeatBtn.addEventListener('click', () => {
  console.log('Renderer: Repeat clicked');
  isRepeat = !isRepeat;
  repeatBtn.classList.toggle('active', isRepeat);
});

progressBar.addEventListener('input', setProgress);

volumeSlider.addEventListener('input', (e) => {
  console.log('Renderer: Volume changed to', e.target.value);
  adjustVolume(e.target.value);
});

folderBtn.addEventListener('click', async () => {
  console.log('Renderer: Folder button clicked');
  if (!window.electronAPI) {
    console.error('Renderer: electronAPI is not available');
    trackName.textContent = 'App initialization error';
    return;
  }
  try {
    const folderPath = await window.electronAPI.selectFolder();
    console.log('Renderer: Selected folder:', folderPath);
    if (folderPath) {
      await window.electronAPI.setStoredFolder(folderPath);
      await loadTracks(folderPath);
    }
  } catch (error) {
    console.error('Renderer: Error selecting folder:', error);
    trackName.textContent = 'Error selecting folder';
  }
});

document.addEventListener('keydown', (e) => {
  console.log('Renderer: Key pressed:', e.key);
  switch (e.key) {
    case 'ArrowUp':
      adjustVolume(Math.min(1, audio.volume + 0.1));
      break;
    case 'ArrowDown':
      adjustVolume(Math.max(0, audio.volume - 0.1));
      break;
    case 'ArrowRight':
      nextTrack();
      break;
    case 'ArrowLeft':
      prevTrack();
      break;
    case 's':
      isShuffle = !isShuffle;
      shuffleBtn.classList.toggle('active', isShuffle);
      console.log('Renderer: Shuffle toggled to', isShuffle);
      break;
    case 'a':
      isRepeat = !isRepeat;
      repeatBtn.classList.toggle('active', isRepeat);
      console.log('Renderer: Repeat toggled to', isRepeat);
      break;
    case 'm':
      toggleMute();
      break;
    case ' ':
      e.preventDefault(); // Prevent scrolling
      playPause();
      break;
  }
});

window.addEventListener('load', () => {
  console.log('Renderer: Window loaded');
  loadStoredFolder();
});