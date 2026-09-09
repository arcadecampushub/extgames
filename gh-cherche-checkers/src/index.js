import Checkers from './js/checkers.js'
import Array2 from './js/array2.js'

const width = 8
const height = 8
const checkers = Checkers(width, height)

const tiles = Array2({ size: [width, height] })

const $gameContainer = document.createElement('div')
$gameContainer.className = 'game-container'
const $board = document.createElement('table')
$board.className = 'board'

for (let y = 0; y < height; y++) {
  const $tr = document.createElement('tr')
  for (let x = 0; x < width; x++) {
    const $td = document.createElement('td')
    $td.className = ((x + y) % 2 == 0) ? 'even' : 'odd'
    const $tile = document.createElement('div')
    $tile.className = 'highlight'
    tiles[x][y] = $tile
    const $piece = document.createElement('div')
    $tile.appendChild($piece)
    $td.appendChild($tile)
    $tr.appendChild($td)
  }
  $board.appendChild($tr)
}

$gameContainer.appendChild($board)
document.body.appendChild($gameContainer)

const setTileType = function setTileType([x, y], type) {
  const $tile = tiles[x][y]
  // This is clunky, but it works . . .
  $tile.classList.remove('s0')
  $tile.classList.remove('s1')
  $tile.classList.remove('s2')
  $tile.classList.add('s' + type)
}

const setTileActive = function setTileActive([x, y], isActive) {
  const $tile = tiles[x][y]
  if (isActive) {
    $tile.classList.add('active')
  } else {
    $tile.classList.remove('active')
  }
}

// A one-time (hopefully) thing to initiative the board
checkers.board.forEach2((id, pos) => {
  setTileType(pos, id)
})

setTileActive([2, 4], true)
setTileActive([3, 5], true)
setTileActive([4, 4], true)
