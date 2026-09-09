import Array2 from './array2.js'
import { arraysEqual } from './array-helpers.js'

function Checkers (width, height, whiteRows = 3, blackRows = 3) {
  const checkers = {
    width,
    height,
    whiteRows,
    blackRows,
    turn: 0
  }

  checkers.reset = function resetBoard () {
    // Just in case the board size changes, for some crazy reason
    // Maybe I'll change this so board size can't change
    const board = Array2({
      fill: 0,
      size: [checkers.width, checkers.height]
    })

    // Place all the white tiles
    for (let y = 0; y < checkers.whiteRows; y++) {
      // We start at row % 2 since it's a checker board
      // That is to say, each row of pieces of staggered
      for (let x = y % 2; x < checkers.width; x += 2) {
        board[x][y] = 1
      }
    }

    // Place all the black tiles
    for (let y = checkers.height - blackRows; y < checkers.height; y++) {
      for (let x = y % 2; x < checkers.width; x += 2) {
        board[x][y] = 2
      }
    }

    checkers.board = board
    // Oh, and we also need to reset the turn
    checkers.turn = 0
  }

  checkers.isInBoard = function isInBoard ([x, y]) {
    return (x >= 0 && x < width) && (y >= 0 && y < height)
  }

  checkers.makeMove = function makeMove ({ start, end, capture }) {
    // Because I like to keep turn counters simple,
    // turn numbers don't actually correspond to the
    // players on the board
    // turn 0 -- player 1
    // turn 1 -- player 2
    // This is just because I don't want to write a
    // longer formula to make the turn cycle correctly
    checkers.turn = (checkers.turn + 1) % 2

    if (capture) {
      checkers.board.set(capture, 0)
    }

    const piece = checkers.board.get(start)
    checkers.board.set(start, 0)

    const backRow = Math.abs(piece) === 1
      // Zero-indexed
      ? checkers.height - 1
      : 0

    // If it has to be promoted . . .
    if (piece > 0 && end[1] === backRow) {
      checkers.board.set(end, -piece)
    // If it doesn't have to be promoted!
    } else {
      checkers.board.set(end, piece)
    }
  }

  checkers.getLegalMoves = function getLegalMoves (start) {
    const [x, y] = start

    // Negative of the regular id represents a promoted piece
    // That is, -1 on the board is still belonging to player 1,
    // but it has more available moves
    const isPromoted = checkers.board[x][y] < 0
    const currentPlayer = Math.abs(checkers.board[x][y])

    // "Forward directions" determined by currentPlayer
    const forward = currentPlayer === 1 ? 1 : -1
    const backward = -forward
    const directions = [[1, forward], [-1, forward]]
    if (isPromoted) {
      directions.push([1, backward], [-1, backward])
    }

    const legalMoves = []
    for (let i = 0; i < directions.length; i++) {
      const [dx, dy] = directions[i]
      const pos = [x + dx, y + dy]

      if (checkers.isInBoard(pos)) {
        const tile = checkers.board.get(pos)

        if (tile === 0) {
          legalMoves.push({
            start,
            end: pos
          })
        } else if (tile !== currentPlayer) {
          // Copy to preserve against mutation
          const captureCandidate = pos.slice()

          pos[0] = pos[0] + dx
          pos[1] = pos[1] + dy

          // Basically, we just need for the next space in the
          // same direction to be empty in order to capture
          if (checkers.isInBoard(pos)) {
            if (checkers.board.get(pos) === 0) {
              legalMoves.push({
                start,
                end: pos,
                capture: captureCandidate
              })
            }
          }
        }
      }
    }

    return legalMoves
  }

  // In some implementations of the actual game (GUI or otherwise),
  // this method may not be used since users may only be able to
  // choose from the set of all legal moves anyway
  checkers.isLegalMove = function isLegalMove ({ start, end }) {
    const legalMoves = checkers.getLegalMoves(start)

    for (let i = 0; i < legalMoves.length; i++) {
      const move = legalMoves[i]

      if (arraysEqual(move.start, start) && arraysEqual(move.end, end)) {
        return true
      }
    }

    return false
  }

  // We kind of want there to be a board when we start . . .
  checkers.reset()
  return checkers
}

export default Checkers
