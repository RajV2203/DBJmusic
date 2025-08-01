let currentSong = new Audio();
let songs = [];
let currFolder = "";

// -------------------- UTILITIES --------------------

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function updateSongTimeDisplay() {
    document.querySelector(".songTime").innerHTML =
        `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;
    document.querySelector(".circle").style.left =
        (currentSong.currentTime / currentSong.duration) * 100 + "%";
}

// -------------------- SONG FUNCTIONS --------------------

async function getSongs(folder) {
    currFolder = folder;
    const res = await fetch(`/songs/${folder}`);
    const html = await res.text();

    const div = document.createElement("div");
    div.innerHTML = html;
    const anchors = div.getElementsByTagName("a");

    songs = [];
    for (let a of anchors) {
        if (a.href.endsWith(".mp3")) {
            const file = a.href.split(`${folder}/`)[1];
            songs.push(file);
        }
    }
    displaySongList();
    return songs;
}

function displaySongList() {
    const songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";

    for (let song of songs) {
        songUL.innerHTML += `
            <li data-file="${song}">
                <img src="img/music.svg" alt="">
                <div class="info">
                    <div>${decodeURIComponent(song)}</div>
                    <div>Song Artist</div>
                </div>
                <div class="playNow">
                    <img src="img/play.svg" alt="">
                </div>
            </li>
        `;
    }

    document.querySelectorAll(".songList li").forEach(li => {
        li.addEventListener("click", () => {
            playMusic(li.dataset.file);
        });
    });
}

function playMusic(track) {
    const playBtn = document.getElementById("play");
    currentSong.pause();
    currentSong.src = `/songs/${currFolder}/${track}`;
    currentSong.play().then(() => {
        playBtn.src = "img/pause.svg";
    }).catch(err => console.error("Playback error:", err));

    document.querySelector(".songInfo").innerHTML = decodeURIComponent(track);
    document.querySelector(".songTime").innerHTML = "00:00 / 00:00";
}

// -------------------- ALBUM FUNCTIONS --------------------

async function displayAlbums() {
    const res = await fetch("tree/main/songs/");
    const html = await res.text();
    const div = document.createElement("div");
    div.innerHTML = html;
    const anchors = div.getElementsByTagName("a");
    const cardContainer = document.querySelector(".cardContainer");

    for (let a of anchors) {
        if (a.href.includes("/songs/")) {
            const folder = a.href.split("/").filter(Boolean).pop();

            try {
                const metaRes = await fetch(`/songs/${folder}/info.json`);
                const meta = await metaRes.json();

                cardContainer.innerHTML += `
                    <div data-folder="/songs/${folder}" class="card">
                        <div class="play">
                            <img src="img/playButton.svg" alt="playButton">
                        </div>
                        <img class="poster" src="/songs/${folder}/Cover.jpg" onerror="this.src='fallback.jpg'" alt="Cover">
                        <h2>${meta.title}</h2>
                        <p>${meta.description}</p>
                    </div>
                `;
            } catch (err) {
                console.warn(`Skipping ${folder}, info.json missing.`);
            }
        }
    }

    addCardEventListeners();
}

function addCardEventListeners() {
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            songs = await getSongs(card.dataset.folder);
            playMusic(songs[0]);
        });
    });
}

// -------------------- CONTROLS --------------------

function setupPlayButton() {
    const playBtn = document.getElementById("play");
    playBtn.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            playBtn.src = "img/pause.svg";
        } else {
            currentSong.pause();
            playBtn.src = "img/play.svg";
        }
    });
}

function setupSeekBar() {
    document.querySelector(".seekbar").addEventListener("click", e => {
        const percent = e.offsetX / e.target.clientWidth;
        currentSong.currentTime = currentSong.duration * percent;
        document.querySelector(".circle").style.left = percent * 100 + "%";
    });
}

function setupVolumeControls() {
    const rangeInput = document.querySelector(".range input");
    const volumeIcon = document.querySelector(".volume img");

    rangeInput.addEventListener("input", e => {
        currentSong.volume = e.target.value / 100;
    });

    volumeIcon.addEventListener("click", () => {
        if (currentSong.volume > 0) {
            volumeIcon.src = "img/muted.svg";
            currentSong.volume = 0;
            rangeInput.value = 0;
        } else {
            volumeIcon.src = "img/volume.svg";
            currentSong.volume = 0.5;
            rangeInput.value = 50;
        }
    });
}

function setupSidebarControls() {
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".cross").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });
}

function setupNextPreviousButtons() {
    document.getElementById("previous").addEventListener("click", () => {
        let currentIndex = songs.indexOf(currentSong.src.split("/").pop());
        if (currentIndex > 0) {
            playMusic(songs[currentIndex - 1]);
        }
    });

    document.getElementById("next").addEventListener("click", () => {
        let currentIndex = songs.indexOf(currentSong.src.split("/").pop());
        if (currentIndex < songs.length - 1) {
            playMusic(songs[currentIndex + 1]);
        }
    });
}

function setupTimeUpdate() {
    currentSong.addEventListener("timeupdate", updateSongTimeDisplay);
}

// -------------------- MAIN --------------------

async function main() {
    await displayAlbums();
    await getSongs("songs"); // Optional default

    setupPlayButton();
    setupSeekBar();
    setupVolumeControls();
    setupSidebarControls();
    setupNextPreviousButtons();
    setupTimeUpdate();
}

main();
