var socket = io();

const scoreboard = document.getElementById("scoreboard");
const currentTurn = document.getElementById("currentTurn");
const name = document.getElementById("name");
const board = document.getElementById("board");
const volume = document.getElementById("volume");

const audio = new Howl({
  src: ["audio.mp3"],
  volume: 0.5,
});
var timer;

volume.oninput = function () {
  console.log(this.value);
  audio.volume(this.value / 100);
};

socket.on("update_scoreboard", function (data) {
  console.log(data);
  scoreboard.replaceChildren(
    ...Object.keys(data).map((name) => {
      const div = document.createElement("div");
      div.innerText = name + ": " + data[name];
      console.log(div);
      return div;
    })
  );
});

socket.on("current_turn", function (data) {
  currentTurn.innerText = "Current Turn: " + data;
});

socket.on("handshake", function (data) {
  name.innerText = "Your name: " + data;
});

socket.on("update_board", function (data) {
  console.log(data);
  if (board.children.length == 0) {
    const cards = [];
    for (var i = 0; i < data.length; i++) {
      const idx = i;
      const div = document.createElement("div");
      div.classList = "card";
      div.innerHTML = `<div class="card__face card__face--front"></div>
        <div class="card__face card__face--back"></div>`;
      div.onclick = () => {
        socket.emit("flip_card", idx);
      };
      cards.push(div);
    }

    board.replaceChildren(...cards);
  } else {
    for (var i = 0; i < data.length; i++) {
      board.children[i].classList =
        data[i] == 1 || isNaN(data[i]) ? "card is-flipped" : "card";
      board.children[i].innerHTML = isNaN(data[i])
        ? `<div class="card__face card__face--front"></div>
      <div class="card__face card__face--back">` +
          data[i] +
          `</div>`
        : `<div class="card__face card__face--front"></div>
      <div class="card__face card__face--back">
            </div>`;
    }
  }
});

socket.on("play_audio", function (data) {
  clearTimeout(timer);
  audio.stop();
  audio.seek(data[0]);
  audio.play();
  timer = setTimeout(() => audio.stop(), data[1] * 1000);
});

function restartGame() {
  socket.emit("restart", "");
}
