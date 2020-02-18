const canvas = document.getElementById('canvas')

const GAME_WIDTH = 640,
     GAME_HEIGHT = 480

const GRAVITY = 0.2

const MIN_PLATFORM_WIDTH = 100,
      MAX_PLATFORM_WIDTH = 200

const PLAYER_SIZE = 30,
      PLAYER_SPEED = 7

const WINDOW_ACCELERATION = 0.001

canvas.width = 2 * GAME_WIDTH
canvas.height = 2 * GAME_HEIGHT

canvas.style.width = GAME_WIDTH + 'px'
canvas.style.height = GAME_HEIGHT + 'px'

const ctx = canvas.getContext('2d')

let dead = false

ctx.scale(2, 2)

ctx.fillRoundRect = function(x, y, width, height, radius = 5) {
  this.beginPath()
  this.moveTo(x + radius, y)
  this.arcTo(x + width, y, x + width, y + height, radius)
  this.arcTo(x + width, y + height, x, y + height, radius)
  this.arcTo(x, y + height, x, y, radius)
  this.arcTo(x, y, x + width, y, radius)

  this.fill()

  return this;
}

const entities = {}

let currentId = 0
function generateId() {
  currentId++

  return currentId;
}

function GameWindow() {
  this.x = 0
  this.y = 0

  this.velY = -1
  this.accelY = -WINDOW_ACCELERATION

  this.width = GAME_WIDTH
  this.height = GAME_HEIGHT

  this.update = function() {
    this.velY += this.accelY

    this.y += this.velY
  }
}

var up, left, down, right;

const onKey = bool => event => {
  var keyCode = event.keyCode;

  switch (keyCode) {
    case 38: // up
    case 87: // w
         up = bool;
      break;
    case 37: // left
    case 65: // a
       left = bool;
      break;
    case 40: // down
    case 83: // s
       down = bool;
      break;
    case 39: // right
    case 68: // d
      right = bool;
      break;
  }
}

window.addEventListener('keydown', onKey(true));
window.addEventListener('keyup',   onKey(false));

function Player() {
  this.x = GAME_WIDTH / 2 - PLAYER_SIZE / 2
  this.y = PLAYER_SIZE

  this.velX = 0
  this.velY = 1

  this.accelX = 0
  this.accelY = GRAVITY

  this.width = PLAYER_SIZE
  this.height = PLAYER_SIZE

  this.update = function() {
    if (left) {
      this.x -= PLAYER_SPEED
    }

    if (right) {
      this.x += PLAYER_SPEED
    }

    this.velX += this.accelX
    this.velY += this.accelY

    this.x += this.velX
    this.y += this.velY

    // Out of window — game over
    if (this.y > GAME_HEIGHT - gameWindow.y ||
        this.y + this.height < -gameWindow.y)
    { dead = true }

    // Collisions
    for (let entity of Object.values(entities)) {
      if (this.x + this.width > entity.x &&
          this.x < entity.x + entity.width &&
          this.y + this.height > entity.y &&
          this.y < entity.y + entity.height)
      {
        // Inside x axis?
        if (this.y + this.height < entity.y + 15) {
          this.velY = 0
          this.y = entity.y - this.height
        }
        else if (left) {
          this.x = entity.x + entity.width
        }
        else if (right) {
          this.x = entity.x - this.width
        }
      }
    }
  }

  this.draw = function() {
    ctx.fillStyle = '#4FD1C5';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

const SCORE_PADDING = 10

function Score() {
  this.start = 0
  this.value = 0

  this.update = function() {
    this.value = ((new Date().getTime() - this.start) / 1000).toFixed(2)
  }

  this.draw = function() {
    ctx.font = "20px Arial"
    ctx.fillStyle='#5A67D8'

    let text = `Score: ${ this.value }`,
        measure = ctx.measureText(text)

    ctx.fillText(
      text,
      GAME_WIDTH - measure.width - SCORE_PADDING,
      -gameWindow.y + measure.actualBoundingBoxAscent + SCORE_PADDING
    )
  }
}

const gameWindow = new GameWindow()

const player = new Player()

const score = new Score()

function clear() {
  ctx.restore()
  ctx.fillStyle = '#EDF2F7'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}


function Platform(x, y, width) {
  this.id = generateId()
  this.x = x
  this.y = y
  this.width = width
  this.height = 25
  this.color = '#1A202C'

  this.update = function() {
    // Off screen
    if (gameWindow.y + this.y + this.height < 0) {
      delete entities[this.id]
    }
  }

  this.draw = function() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height, this.height / 2);
  }
}

function addPlatform(y = GAME_HEIGHT + Math.min(250, -100 * gameWindow.velY) - gameWindow.y) {
  let width = Math.floor(Math.random() * MAX_PLATFORM_WIDTH) + MIN_PLATFORM_WIDTH

  let x = Math.floor(Math.random() * (GAME_WIDTH - width + 100)) - 50

  let platform = new Platform(x, y, width)

  entities[platform.id] = platform
}

addPlatform(GAME_HEIGHT)

function gameOver() {
  ctx.restore()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.font = '50px Arial'
  ctx.fillStyle='#E53E3E'

  let heading = 'GAME OVER',
      hMeasure = ctx.measureText(heading)

  ctx.fillText(
    heading,
    GAME_WIDTH / 2 - hMeasure.width / 2,
    GAME_HEIGHT / 2
  )

  ctx.font = '20px Arial'
  ctx.fillStyle='#2D3748'

  let subtitle = `Final score: ${ score.value }`,
      sMeasure = ctx.measureText(subtitle)

  ctx.fillText(
    subtitle,
    GAME_WIDTH / 2 - sMeasure.width / 2,
    GAME_HEIGHT / 2 + hMeasure.actualBoundingBoxAscent + 10
  )
}

function loop() {
  if (dead) { return gameOver() }

  clear()

  let offScreenEntities = Object.values(entities).filter(entity =>
    (entity.y + gameWindow.y) > GAME_HEIGHT
  )

  if (offScreenEntities.length === 0) { addPlatform() }

  // UPDATE
  gameWindow.update()

  ctx.translate(gameWindow.x, gameWindow.y)

  for (let id in entities) {
    entities[id].update()
  }

  player.update()
  score.update()

  // DRAW

  for (let id in entities) {
    entities[id].draw()
  }

  player.draw()
  score.draw()

  ctx.translate(-gameWindow.x, -gameWindow.y)

  window.requestAnimationFrame(loop)
}

function start() {
  score.start = new Date().getTime()

  window.requestAnimationFrame(loop)
}

start()