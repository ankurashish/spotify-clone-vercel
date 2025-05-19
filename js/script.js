document.addEventListener("DOMContentLoaded", () => {
  let currFolder;
  let songs = [];
  const currentsong = new Audio();

  const play = document.querySelector("#play");
  const previous = document.querySelector("#previous");
  const next = document.querySelector("#next");
  const volslider = document.querySelector(".volslider");
  const volicon = document.querySelector(".volicon");

  async function getsongs(folder) {
    currFolder = folder;
    let res = await fetch(`/${folder}/`);
    let text = await res.text();
    let div = document.createElement("div");
    div.innerHTML = text;

    songs = [];
    const anchors = div.getElementsByTagName("a");
    for (let a of anchors) {
      if (a.href.endsWith(".mp3")) {
        let parts = a.href.split("/");
        songs.push(parts[parts.length - 1]);
      }
    }

    const songUL = document.querySelector(".songlist ul");
    songUL.innerHTML = "";
    for (const song of songs) {
      songUL.innerHTML += `
        <li>
          <img class="invert" style="width: 30px;" src="/img/music.svg" alt="">
          <div class="info">
            <div>${song.replaceAll("%20", " ").replace(".mp3", "")}</div>
            <div>Diddy</div>
          </div>
          <div class="playnow">
            <span>Play Now</span>
            <img class="invert" src="/img/play.svg" alt="">
          </div>
        </li>`;
    }

    Array.from(songUL.children).forEach((li) => {
      li.addEventListener("click", () => {
        const trackName = li.querySelector(".info div").textContent.trim() + ".mp3";
        playmusic(trackName);
      });
    });

    return songs;
  }

  function playmusic(track, pause = false) {
    currentsong.src = `/${currFolder}/` + track;
    if (!pause) {
      currentsong.play();
      play.src = "/img/pause.svg";
    }

    document.querySelector(".songinfo").textContent = decodeURI(track.split(".mp3")[0]);
    document.querySelector(".songtime").textContent = "00:00 / 00:00";
  }

  function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  async function displayAlbums() {
    const res = await fetch(`/songs/`);
    const text = await res.text();
    const div = document.createElement("div");
    div.innerHTML = text;

    const anchors = div.getElementsByTagName("a");
    const cardContainer = document.querySelector(".card-container");
    cardContainer.innerHTML = "";

    for (let e of anchors) {
      if (e.href.includes("/songs")) {
        const folder = e.href.split("/").slice(-2)[0].replaceAll("%20", " ");

        try {
          const a = await fetch(`/songs/${folder}/info.json`);
          const response = await a.json();

          const card = document.createElement("div");
          card.classList.add("card");
          card.dataset.folder = folder;
          card.innerHTML = `
            <div class="play">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <polygon points="8,5 19,12 8,19" />
              </svg>
            </div>
            <img src="/songs/${folder}/${response.image}" alt="" />
            <img class="cardplay" src="/img/cardPlay.svg" alt="">
            <h2>${response.title}</h2>
            <p>${response.description}</p>
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
          console.error("Missing info.json in folder:", folder);
        }
      }
    }
  }

  // Initialize volume
  let vol = 0.5;
  currentsong.volume = vol;

  play.addEventListener("click", () => {
    if (currentsong.paused) {
      currentsong.play();
      play.src = "/img/pause.svg";
    } else {
      currentsong.pause();
      play.src = "/img/play.svg";
    }
  });

  previous.addEventListener("click", () => {
    currentsong.pause();
    let index = songs.indexOf(currentsong.src.split("/").pop());
    if (index > 0) playmusic(songs[index - 1]);
  });

  next.addEventListener("click", () => {
    currentsong.pause();
    let index = songs.indexOf(currentsong.src.split("/").pop());
    if (index < songs.length - 1) playmusic(songs[index + 1]);
  });

  // ▶ Automatically play next song when current ends
  currentsong.addEventListener("ended", () => {
    let index = songs.indexOf(currentsong.src.split("/").pop());
    if (index < songs.length - 1) {
      playmusic(songs[index + 1]);
    }
  });

  currentsong.addEventListener("timeupdate", () => {
    const currentTime = formatTime(currentsong.currentTime);
    const duration = formatTime(currentsong.duration);
    document.querySelector(".songtime").textContent = `${currentTime} / ${duration}`;
    if (currentsong.duration) {
      document.querySelector(".circle").style.left =
        (currentsong.currentTime / currentsong.duration) * 100 + "%";
    }
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

  volslider.addEventListener("input", (e) => {
    vol = e.target.value / 100;
    currentsong.volume = vol;
    volicon.src = vol === 0 ? "/img/mute.svg" : "/img/vol.svg";
  });

  volicon.addEventListener("click", () => {
    if (currentsong.volume > 0) {
      currentsong.volume = 0;
      volicon.src = "/img/mute.svg";
      volslider.value = 0;
    } else {
      currentsong.volume = vol || 0.5;
      volicon.src = "/img/vol.svg";
      volslider.value = currentsong.volume * 100;
    }
  });

  // Initial load
  (async () => {
    await getsongs("songs/top-hit");
    playmusic(songs[0], true);
    displayAlbums();
  })();
});
