let currFolder;
async function getsongs(folder) {
  currFolder = folder;
  let a = await fetch(`${folder}/`);
  let response = await a.text();
  // console.log(response);
  let div = document.createElement("div");
  div.innerHTML = response;
  let as = div.getElementsByTagName("a");
  songs = [];
  for (let index = 0; index < as.length; index++) {
    const element = as[index];
    if (element.href.endsWith(".mp3")) {
      let parts = element.href.split("/");
      songs.push(parts[parts.length - 1]);
    }
  }

  let songUL = document
    .querySelector(".songlist")
    .getElementsByTagName("ul")[0];
  songUL.innerHTML = "";
  for (const song of songs) {
    songUL.innerHTML =
      songUL.innerHTML +
      `<li>
                <img class="invert" style="width: 30px;" src="img/music.svg" alt="">
                <div class="info">
                  <div>${song
                    .replaceAll("%20", " ")
                    .replaceAll(".mp3", "")}</div>
                  <div>Diddy</div>
                </div>
                <div class="playnow">
                  <span>Play Now</span>
                  <img class="invert" src="img/play.svg" alt="">
                </div>
                
            </li>`;
  }
  // Add event listeners to each song
  Array.from(
    document.querySelector(".songlist").getElementsByTagName("li")
  ).forEach((li) => {
    li.addEventListener("click", (ev) => {
      // console.log(li.querySelector(".info").firstElementChild.innerHTML.trim());
      playmusic(
        li.querySelector(".info").firstElementChild.innerHTML.trim() + ".mp3"
      );
    });
  });
  return songs;
}

const playmusic = (track, pause = false) => {
  // let audio=new Audio("spotify%20clone/songs/" + track);
  currentsong.src = `${currFolder}/` + track;
  if (!pause) {
    currentsong.play();
    play.src = "img/pause.svg";
  }

  document.querySelector(".songinfo").innerHTML = decodeURI(
    track.split(".mp3")[0]
  );

  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};
let currentsong = new Audio();

function formatTime(seconds) {
  if (isNaN(seconds)) return "00:00";
  let mins = Math.floor(seconds / 60);
  let secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
async function displayAlbums() {
  let res = await fetch(`songs/`);
  let text = await res.text();
  let div = document.createElement("div");
  div.innerHTML = text;

  let anchors = div.getElementsByTagName("a");
  const cardContainer = document.querySelector(".card-container");
  cardContainer.innerHTML = ""; // Clear previous cards

  Array.from(anchors).forEach(async (e) => {
    if (e.href.includes("/songs")) {
      let folder = e.href.split("/").slice(-2)[0].replaceAll("%20", " ");

      try {
        let a = await fetch(
          `songs/${folder}/info.json`
        );
        let response = await a.json();

        let card = document.createElement("div");
        card.classList.add("card");
        card.setAttribute("data-folder", folder);
        card.innerHTML = `
          <div class="play">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <polygon points="8,5 19,12 8,19" />
            </svg>
          </div>
          <img src="songs/${folder}/${response.image}" alt="" />
          <img class="cardplay" src="img/cardPlay.svg" alt="">
          <h2>${response.title}</h2>
          <p>${response.description}</p>
        `;

        // Add event listener to play first music on card click
        card.addEventListener("click", async () => {
          songs = await getsongs(`songs/${folder}`);
          if (songs.length > 0) {
            playmusic(songs[0]);
          }
        });

        // Add event listener to open left panel on card click
        card.addEventListener("click", ()=>{
          
          document.querySelector(".left").style.left="0";
          
        });
        

        cardContainer.appendChild(card);
      } catch (err) {
        console.error("Missing info.json in folder:", folder);
      }
    }
  });
  
}

let songs;
async function main() {
  await getsongs("songs/top hit");
  // currentsong.src = "/spotify%20clone/songs/" + songs[0];
  playmusic(songs[0], true);

  //display all the albums
  displayAlbums();

  // Add event listener to the play , next and previous buttons
  play.addEventListener("click", () => {
    if (currentsong.paused) {
      currentsong.play();
      play.src = "img/pause.svg";
    } else {
      currentsong.pause();
      play.src = "img/play.svg";
    }
  });

  //time update event
  currentsong.addEventListener("timeupdate", () => {
    // console.log(currentsong.currentTime, currentsong.duration);
    document.querySelector(".songtime").innerHTML =
      formatTime(currentsong.currentTime) +
      " / " +
      formatTime(currentsong.duration);
    document.querySelector(".circle").style.left =
      (currentsong.currentTime / currentsong.duration) * 100 + "%";
  });

  //add event listener to the seekbar
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentsong.currentTime = (currentsong.duration * percent) / 100;
  });

  // add event listener for the hamburger

  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });

  //add event listener for the close button
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  //add event listner for previous and next buttons
  previous.addEventListener("click", () => {
    currentsong.pause();
    // console.log("Previous clicked");
    let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
    if (index > 0) {
      playmusic(songs[index - 1]);
    }
  });

  next.addEventListener("click", () => {
    currentsong.pause();
    // console.log("Next clicked");
    let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
    if (index < songs.length - 1) {
      playmusic(songs[index + 1]);
    }
  });

  //add event listener for the volume slider
  let vol;
  vol = currentsong.volume=0.5;
  console.log("Volume set to:", vol);
  document.querySelector(".volslider").addEventListener("input", (e) => {
    vol = e.target.value / 100;
    currentsong.volume = vol;
    console.log("Volume set to:", vol);
    const volIcon = document.querySelector(".volicon");
    if (vol === 0) {
      volIcon.src = "img/mute.svg";
    } else {
      volIcon.src = "img/vol.svg";
    }
  });
  //add event listener for the mute button
  document.querySelector(".volicon").addEventListener("click", () => {
    if (currentsong.volume > 0) {
      currentsong.volume = 0;
      document.querySelector(".volicon").src = "img/mute.svg";
      document.querySelector(".volslider").value = 0;
    } else {
      if (vol === 0) {
        vol = 0.5;
        currentsong.volume = vol;
      } else {
        currentsong.volume = vol;
      }
      document.querySelector(".volicon").src = "img/vol.svg";
      document.querySelector(".volslider").value = vol * 100;
    }
  });

  //load the albums
  Array.from(document.getElementsByClassName("card")).forEach((e) => {
    e.addEventListener("click", async (item) => {
      songs = await getsongs(`songs/${item.currentTarget.dataset.folder}`);
    });
  });
}
main();