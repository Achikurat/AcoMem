module.exports = class Game {
  io;
  rowCount = 5;
  columnCount = 5;
  currentTurn = -1;

  grainLength = 1;
  audioLength;

  scoreboard = {};
  audioPositions = [];

  board = [];
  tempFlippedCards = [];

  constructor(io, rows, columns, audioLength) {
    this.io = io;
    this.rowCount = rows;
    this.columnCount = columns;
    this.audioLength = audioLength;
    this.board = [...Array(rows)].map((e) => Array(columns));

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
    const cardCount = this.rowCount * this.columnCount;
    this.grainLength = this.audioLength / cardCount;

    for (var i = 0; i < cardCount / 2; i++) {
      this.audioPositions.push(
        ...[(i + 1) * this.grainLength, (i + 1) * this.grainLength]
      );
    }

    this.shufflePositions();

    var k = 0;
    for (var i = 0; i < this.rowCount; i++) {
      for (var j = 0; j < this.columnCount; j++) {
        this.board[i][j] = this.audioPositions[k];
        k++;
      }
    }

    this.emitBoard();
  }

  emitBoard() {
    const displayBoard = [...Array(this.rowCount)].map((e) =>
      Array(this.columnCount)
    );
    for (var i = 0; i < this.rowCount; i++) {
      for (var j = 0; j < this.columnCount; j++) {
        if (this.isFlipped(i, j)) {
          displayBoard[i][j] = "1";
        } else {
          displayBoard[i][j] = "0";
        }
      }
    }

    this.io.emit("update_board", displayBoard);
  }

  nextTurn() {
    const clients = Object.keys(this.scoreboard);
    const currentIdx = clients.indexOf(this.currentTurn);
    if (currentIdx === -1 || clients.length === currentIdx + 1) {
      this.currentTurn = clients[0];
    } else this.currentTurn = clients[currentIdx + 1];

    this.io.emit("current_turn", this.currentTurn);
  }

  flipCard(name, row, column) {
    if (
      this.currentTurn === name &&
      this.tempFlippedCards.length < 2 &&
      !this.isFlipped(row, column)
    ) {
      if (this.tempFlippedCards.length === 0) {
        this.tempFlippedCards.push([row, column]);
        this.emitBoard();
      } else if (this.tempFlippedCards.length === 1) {
        this.tempFlippedCards.push([row, column]);
        this.emitBoard();
        this.compareCards(name);

        setTimeout(() => {
          this.emitBoard();
          this.nextTurn();
        }, Math.max(2000, this.grainLength * 1000));
      }

      this.io.emit("play_audio", [this.board[row][column], this.grainLength]);
    }
  }

  isFlipped(row, column) {
    return (
      this.board[row][column] === -1 ||
      this.tempFlippedCards.filter(
        (card) => card[0] === row && card[1] === column
      ).length > 0
    );
  }

  compareCards(name) {
    if (
      this.tempFlippedCards.length === 2 &&
      this.board[this.tempFlippedCards[0][0]][this.tempFlippedCards[0][1]] ===
        this.board[this.tempFlippedCards[1][0]][this.tempFlippedCards[1][1]]
    ) {
      this.scoreboard[name] = this.scoreboard[name] + 1;
      this.io.emit("update_scoreboard", this.scoreboard);

      this.board[this.tempFlippedCards[0][0]][this.tempFlippedCards[0][1]] = -1;
      this.board[this.tempFlippedCards[1][0]][this.tempFlippedCards[1][1]] = -1;
    }
    this.tempFlippedCards = [];
  }

  shufflePositions() {
    for (let i = this.audioPositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = this.audioPositions[i];
      this.audioPositions[i] = this.audioPositions[j];
      this.audioPositions[j] = temp;
    }
  }
};
