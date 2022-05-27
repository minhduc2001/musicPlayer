const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const PLAYER_STORAGE_KEY = "MD";

const heading = $('header h2');
const thumb = $('.cd-thumb');
const audio = $('#audio');
const cd = $('.cd');
const playBtn = $('.btn.btn-toggle-play');
const player = $('.player');
const progress = $('#progress');
const nextBtn = $('.btn.btn-next');
const prevBtn = $('.btn.btn-prev');
const randomBtn = $('.btn.btn-random');
const repeatBtn = $('.btn.btn-repeat');
const title = $('.title')
const playlist = $('.playlist');

const api = 'https://iridescent-twilight-discovery.glitch.me/';
let listSong = [];

const app = async () => {
    const getData = async () => {
        await fetch(api + 'list')
            .then(res => res.json())
            .then((res) => {
                listSong = res
                // listSong.pop();
                return listSong
            }).then(res => {
                listSong.push(5)
                console.log('123', listSong);
            })
        console.log('s', listSong);
    }
    await getData();
    listSong.pop();
    // const sendRequest = async (data) => {
    //     await fetch(api + 'revc', {
    //         method: 'POST', // *GET, POST, PUT, DELETE, etc.
    //         mode: 'cors', // no-cors, *cors, same-origin
    //         cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    //         credentials: 'same-origin', // include, *same-origin, omit
    //         headers: {
    //             'Content-Type': 'application/json'
    //             // 'Content-Type': 'application/x-www-form-urlencoded',
    //         },
    //         redirect: 'follow', // manual, *follow, error
    //         referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    //         body: JSON.stringify(data) // body data type must match "Content-Type" header
    //     }).then((res) => res.json());
    // }
    const handle = {
        currentIndex: 0,
        isPlaying: false,
        isRandom: false,
        isRepeat: false,
        config: JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)) || {},
        songs: listSong,
        setconfig: function (key, value) {
            this.config[key] = value;
            localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(this.config));
        },
        render: function () {
            // const a = document.createElement('audio')
            // a.id = 'audio'
            // dashboard.appendChild(a)
            const htmls = this.songs.map((song, index) => {
                return `<div class="song ${index === this.currentIndex ? 'active' : ''}" data-index = ${index}>
                <div class="thumb" style="background-image: url('${song.image}')">
                </div>
                <div class="body">
                    <h3 class="title">${song.name}</h3>
                    <p class="author">${song.singer}</p>
                </div>
                <div class="option" style="color:while;">
                    <a href="${api}download?id=${song.src}"><i class="fas fa-download"></i></a>
                </div>
                </div>`;
            });
            $('.playlist').innerHTML = htmls.join('');
        },
        defineProperties: function () {
            Object.defineProperty(this, 'currentSong', {
                get: function () {
                    return this.songs[this.currentIndex];
                }
            })
        },
        loadConfig: function () {
            this.isRandom = this.config.isRandom;
            this.isRepeat = this.config.isRepeat;
            console.log(this.songs);

            repeatBtn.classList.toggle('active', this.isRepeat);
            randomBtn.classList.toggle('active', this.isRandom);
        },
        handleEvent: function () {

            // xử lí cuộn
            const witdh = cd.offsetWidth;
            document.onscroll = function () {
                const newCdWidth = witdh - window.scrollY;
                cd.style.width = newCdWidth <= 0 ? 0 + 'px' : newCdWidth + 'px';
                cd.style.opacity = newCdWidth / witdh;
            }

            // CD animation 
            const animateCD = thumb.animate([
                { transform: 'rotate(360deg)' }
            ], {
                duration: 10000,
                iterations: Infinity,
            });

            animateCD.pause();

            // xử lí audio
            playBtn.onclick = function () {

                if (!handle.isPlaying) audio.play();
                else audio.pause();
            }

            audio.onplay = function () {
                handle.isPlaying = true;
                animateCD.play();
                player.classList.add('playing');
            }

            audio.onpause = function () {
                handle.isPlaying = false;
                animateCD.pause();
                player.classList.remove('playing');
            }

            // chạy time theo current audio/ progress
            audio.ontimeupdate = function () {
                var percent = audio.currentTime / audio.duration * 100;
                // console.log(percent);
                if (percent) {
                    progress.value = Math.floor(percent);
                }

            }

            // tua audio
            progress.onchange = function () {
                // console.log(progress.value);
                // console.log(progress.value * audio.duration * 100);
                const seek = progress.value * audio.duration / 100;
                audio.currentTime = seek;
            }


            //next song 
            nextBtn.onclick =async function () {
                if (handle.isRandom) {
                    await handle.randomSong();
                } else {
                    await handle.nextSong();
                }
                await handle.render();
                await audio.play();
                
                await handle.scrollToActiveSong();
            }

            // prev song
            prevBtn.onclick =async function () {
                if (handle.isRandom) {
                    await handle.randomSong();
                } else {
                    await handle.prevSong();
                }
                await handle.render();
                await audio.play();
                
                await handle.scrollToActiveSong();
            }

            //phát ngẫu nhiên
            randomBtn.onclick = function () {
                handle.isRandom = !handle.isRandom;
                handle.setconfig('isRandom', handle.isRandom);
                randomBtn.classList.toggle('active', handle.isRandom);
                // console.log(randomBtn.classList);
            }

            // xử lí khi bài hát kết thúc
            audio.onended = function () {
                if (handle.isRepeat) {
                    audio.play();
                } else nextBtn.onclick();
            }

            // lap lai bai hat

            repeatBtn.onclick = function () {
                handle.isRepeat = !handle.isRepeat;
                handle.setconfig('isRepeat', handle.isRepeat);
                repeatBtn.classList.toggle('active', handle.isRepeat);

            }

            // lắng nghe hành vi click vào playlist
            playlist.onclick =async function (e) {
                const songElement = e.target.closest('.song:not(.active)');
                if (songElement || e.target.closest('.song .option')) {
                    // xử lí click khi ấn vào song option
                    if (songElement) {
                        handle.currentIndex = Number(songElement.dataset.index)
                        // console.log(handle.currentIndex);
                        await handle.loadCurrentSong();
                        await handle.render();
                        await audio.load();
                        await audio.play();
                    }
                }
            }

        },
        // kéo phần active lên tầm nhìn
        scrollToActiveSong: function () {
            setTimeout(() => {
                $('.song.active').scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 100)
        },
        loadCurrentSong: async function () {
            heading.innerText = this.currentSong.name;
            // console.log(thumb);
            thumb.style = `background-image: url(' ${this.currentSong.image}')`;
            // await sendRequest({name: this.currentSong.name})
            audio.src = api+'stream?id='+ this.currentSong.src;
            await audio.load()
        },
        nextSong: async function () {
            this.currentIndex++;
            if (this.currentIndex >= this.songs.length) this.currentIndex = 0;
            await handle.loadCurrentSong();
        },
        prevSong: function () {
            this.currentIndex--;
            if (this.currentIndex < 0) this.currentIndex = this.songs.length - 1;
            handle.loadCurrentSong();
        },
        randomSong: function () {
            const tmp = this.currentIndex;
            do {
                this.currentIndex = Math.floor(Math.random() * (this.songs.length - 1));
                // console.log(this.currentIndex);
            } while (this.currentIndex === tmp);
            this.loadCurrentSong();
        },
        start:async function () {
            // load config
            await this.loadConfig();

            // định nghĩa ra các thuộc tính cho Obj
            await this.defineProperties();

            // sử lí các sự kiện
            await this.handleEvent();

            // load bài hát đầu tiên vào UI
            await this.loadCurrentSong();

            // tạo playlist
            await this.render();

        }
    }
    handle.start();
}

app();
