var socket = io();

const scoreboard = document.getElementById("scoreboard");
const currentTurn = document.getElementById("currentTurn");
const board = document.getElementById("board");

const audio = new Howl({
  src: ["audio.mp3"],
});
var timer;

socket.on("update_scoreboard", function (data) {
  console.log(data);
  scoreboard.replaceChildren(
    ...Object.keys(data).map((name) => {
      console.log(name);
      const div = document.createElement("div");
      div.innerText = name + ": " + data[name];
      console.log(div);
      return div;
    })
  );
});

socket.on("current_turn", function (data) {
  currentTurn.innerText = data;
});

socket.on("update_board", function (data) {
  if (board.children.length == 0) {
    const cards = [];
    for (var i = 0; i < data.length; i++) {
      for (var j = 0; j < data[i].length; j++) {
        const row = i;
        const column = j;
        const div = document.createElement("div");
        div.classList = "card";
        div.innerHTML = `<div class="card__face card__face--front">front</div>
        <div class="card__face card__face--back">back</div>`;
        div.onclick = function () {
          socket.emit("flip_card", [row, column]);
        };
        div.style.top = (i + 1) * 150 - 120 + "px";
        div.style.left = (j + 1) * 150 + 120 + "px";
        cards.push(div);
      }
    }

    board.replaceChildren(...cards);
  } else {
    k = 0;
    for (var i = 0; i < data.length; i++) {
      for (var j = 0; j < data[i].length; j++) {
        const row = i;
        const column = j;
        board.children[k].classList =
          data[row][column] == 1 ? "card is-flipped" : "card";
        k++;
      }
    }
  }
});

socket.on("play_audio", function (data) {
  console.log(data);
  audio.pause();
  audio.seek(data[0]);
  audio.play();
  clearTimeout(timer);
  timer = setTimeout(() => audio.pause(), data[1] * 1000);
});

function restartGame() {
  socket.emit("restart", "");
}
