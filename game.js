module.exports = class Game {
  io;
  pairCount = 10;
  currentTurn = -1;

  grainLength = 1;
  audioLength;

  scoreboard = {};
  audioPositions = [];

  board = [];
  tempFlipped = [];
  timer = null;

  constructor(io, pairCount, audioLength) {
    this.io = io;
    this.pairCount = pairCount;
    this.audioLength = audioLength;

    this.populateBoard();
  }

  onConnect(name) {
    this.scoreboard[name] = 0;
    this.io.emit("update_scoreboard", this.scoreboard);
    this.io.emit("current_turn", this.currentTurn);

    console.log("a user connected: " + name);
  }

  onDisconnect(name) {
    if (this.currentTurn === name) {
      this.nextTurn();
    }

    delete this.scoreboard[name];
    this.io.emit("update_scoreboard", this.scoreboard);

    console.log("a user disconnected: " + name);
  }

  populateBoard() {
    this.grainLength = this.audioLength / this.pairCount;
    this.board = [...Array(this.pairCount)]
      .map((val, idx) => [
        (idx + 1) * this.grainLength,
        (idx + 1) * this.grainLength,
      ])
      .flat();

    this.shufflePositions();
    this.emitBoard();
  }

  emitBoard() {
    this.io.emit(
      "update_board",
      this.board.map((value, idx) =>
        this.isFlipped(idx) ? (isNaN(value) ? value : 1) : 0
      )
    );
  }

  nextTurn() {
    this.tempFlipped = [];

    const clients = Object.keys(this.scoreboard);
    const currentIdx = clients.indexOf(this.currentTurn);
    if (currentIdx === -1 || clients.length === currentIdx + 1) {
      this.currentTurn = clients[0];
    } else this.currentTurn = clients[currentIdx + 1];

    this.io.emit("current_turn", this.currentTurn);
  }

  flipCard(name, idx) {
    if (
      this.currentTurn === name &&
      this.tempFlipped.length < 2 &&
      !this.isFlipped(idx)
    ) {
      this.io.emit("play_audio", [this.board[idx], this.grainLength]);
      clearTimeout(this.timer);
      if (this.tempFlipped.length === 0) {
        this.tempFlipped.push(idx);
        this.emitBoard();
      } else if (this.tempFlipped.length === 1) {
        this.tempFlipped.push(idx);
        this.emitBoard();
        this.compareCards(name);
        this.nextTurn();

        this.timer = setTimeout(() => {
          this.emitBoard();
        }, Math.max(2000, this.grainLength * 1000));
      }
    }
  }

  isFlipped(idx) {
    return isNaN(this.board[idx]) || this.tempFlipped.indexOf(idx) != -1;
  }

  compareCards(name) {
    if (
      this.tempFlipped.length === 2 &&
      this.board[this.tempFlipped[0]] == this.board[this.tempFlipped[1]]
    ) {
      this.scoreboard[name] = this.scoreboard[name] + 1;
      this.io.emit("update_scoreboard", this.scoreboard);

      this.board[this.tempFlipped[0]] = name;
      this.board[this.tempFlipped[1]] = name;
    }
  }

  shufflePositions() {
    for (let i = this.board.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = this.board[i];
      this.board[i] = this.board[j];
      this.board[j] = temp;
    }
  }
};
