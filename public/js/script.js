let currFolder;
let songs = [];
let currentsong = new Audio();
let vol = 0.5;

function getCurrentSongFileName() {
  // Extract just the filename from currentsong.src (works with full URLs)
  try {
    let url = new URL(currentsong.src);
    return decodeURIComponent(url.pathname.split('/').pop());
  } catch {
    return decodeURIComponent(currentsong.src.split("/").pop());
  }
}

async function getsongs(folder) {
  currFolder = folder;
  try {
    let res = await fetch(`${folder}/info.json`);
    if (!res.ok) throw new Error("info.json not found");

    let data = await res.json();
    songs = data.songs || [];

    let songUL = document.querySelector(".songlist ul");
    songUL.innerHTML = "";
    for (const song of songs) {
      songUL.innerHTML += `
        <li>
          <img class="invert" style="width: 30px;" src="img/music.svg" alt="">
          <div class="info">
            <div>${song.replaceAll("%20", " ").replaceAll(".mp3", "")}</div>
            <div>Diddy</div>
          </div>
          <div class="playnow">
            <span>Play Now</span>
            <img class="invert" src="img/play.svg" alt="">
          </div>
        </li>`;
    }

    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach((li) => {
      li.addEventListener("click", () => {
        playmusic(li.querySelector(".info").firstElementChild.innerHTML.trim() + ".mp3");
      });
    });

    return songs;
  } catch (err) {
    console.error("Error fetching songs from folder:", folder, err);
    return [];
  }
}

const playmusic = (track, pause = false) => {
  if (!track) return;
  currentsong.src = `${currFolder}/${track}`;
  if (!pause) {
    currentsong.play();
    play.src = "img/pause.svg";
  }
  document.querySelector(".songinfo").innerHTML = decodeURI(track.split(".mp3")[0]);
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

function formatTime(seconds) {
  if (isNaN(seconds)) return "00:00";
  let mins = Math.floor(seconds / 60);
  let secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

async function displayAlbums() {
  const cardContainer = document.querySelector(".card-container");
  cardContainer.innerHTML = "";

  const folders = ["top-hit", "trending", "hindi"];

  for (const folder of folders) {
    try {
      let res = await fetch(`songs/${folder}/info.json`);
      if (!res.ok) throw new Error("info.json not found");

      let data = await res.json();

      let card = document.createElement("div");
      card.classList.add("card");
      card.setAttribute("data-folder", folder);
      card.innerHTML = `
        <div class="play">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <polygon points="8,5 19,12 8,19" />
          </svg>
        </div>
        <img src="songs/${folder}/${data.image}" alt="" />
        <img class="cardplay" src="img/cardPlay.svg" alt="">
        <h2>${data.title}</h2>
        <p>${data.description}</p>
      `;

      card.addEventListener("click", async () => {
        songs = await getsongs(`songs/${folder}`);
        if (songs.length > 0) {
          playmusic(songs[0]);
        }
        document.querySelector(".left").style.left = "0";
      });

      cardContainer.appendChild(card);
    } catch (err) {
      console.error("Error loading album info.json for folder:", folder, err);
    }
  }
}

async function main() {
  const defaultFolders = ["top-hit", "trending", "hindi"];

  let songsLoaded = false;
  for (const folder of defaultFolders) {
    songs = await getsongs(`songs/${folder}`);
    if (songs.length > 0) {
      playmusic(songs[0], true);
      songsLoaded = true;
      break;
    }
  }

  if (!songsLoaded) {
    console.warn("No songs loaded from default folders.");
  }

  displayAlbums();

  play.addEventListener("click", () => {
    if (currentsong.paused) {
      currentsong.play();
      play.src = "img/pause.svg";
    } else {
      currentsong.pause();
      play.src = "img/play.svg";
    }
  });

  currentsong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML =
      formatTime(currentsong.currentTime) + " / " + formatTime(currentsong.duration);
    document.querySelector(".circle").style.left =
      (currentsong.currentTime / currentsong.duration) * 100 + "%";
  });

  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentsong.currentTime = (currentsong.duration * percent) / 100;
  });

  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });

  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  previous.addEventListener("click", () => {
    currentsong.pause();
    let currentFile = getCurrentSongFileName();
    let index = songs.indexOf(currentFile);
    if (index > 0) {
      playmusic(songs[index - 1]);
    } else {
      // Optionally restart first song or do nothing
      playmusic(songs[0]);
    }
  });

  next.addEventListener("click", () => {
    currentsong.pause();
    let currentFile = getCurrentSongFileName();
    let index = songs.indexOf(currentFile);
    if (index >= 0 && index < songs.length - 1) {
      playmusic(songs[index + 1]);
    } else {
      // Optionally do nothing or loop to first song
      // playmusic(songs[0]);
    }
  });

  document.querySelector(".volslider").addEventListener("input", (e) => {
    vol = e.target.value / 100;
    currentsong.volume = vol;
    const volIcon = document.querySelector(".volicon");
    volIcon.src = vol === 0 ? "img/mute.svg" : "img/vol.svg";
  });

  document.querySelector(".volicon").addEventListener("click", () => {
    if (currentsong.volume > 0) {
      currentsong.volume = 0;
      document.querySelector(".volicon").src = "img/mute.svg";
      document.querySelector(".volslider").value = 0;
    } else {
      currentsong.volume = vol || 0.5;
      document.querySelector(".volicon").src = "img/vol.svg";
      document.querySelector(".volslider").value = currentsong.volume * 100;
    }
  });

  currentsong.addEventListener("ended", () => {
    let currentFile = getCurrentSongFileName();
    let index = songs.indexOf(currentFile);
    if (index >= 0 && index < songs.length - 1) {
      playmusic(songs[index + 1]);
    } else {
      // No next song, stop playback & update UI
      play.src = "img/play.svg";
      currentsong.pause();
    }
  });
}

main();
