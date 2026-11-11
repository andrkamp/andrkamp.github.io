// ----- Car Maze game -----
// Drive the car from the start (bottom) to the checkered flag (top).
// Touching a tree, the spikes, or the edge of the board ends the run.
// Controls: the arrow keys on the keyboard.
(function () {
  var canvas = document.getElementById('maze-canvas');
  if (!canvas || !canvas.getContext) { return; }

  var ctx = canvas.getContext('2d');
  var startBtn = document.getElementById('maze-start');
  var timerEl = document.getElementById('maze-timer');
  var bestEl = document.getElementById('maze-best');
  var statusEl = document.getElementById('maze-status');

  // ----- The maze -----
  // #  = trees or spikes (don't touch!)
  // .  = road
  // S  = start (bottom)
  // G  = goal, the checkered flag (top)
  // Every row must have the same number of characters.
  // The board is wide and short (20 x 9) so it fits on screen without scrolling.
  var MAP = [
    '#################G##',
    '#####..............#',
    '##################.#',
    '##.....#...........#',
    '##.#####.###########',
    '##................##',
    '#################.##',
    '#.................##',
    '##########S#########'
  ];

  var TILE = 40;          // size of one square in pixels
  var ROWS = MAP.length;
  var COLS = MAP[0].length;
  var SPEED = 110;        // car speed in pixels per second
  var CAR_SIZE = 26;      // how big the car is drawn
  var HIT_RADIUS = 9;     // how close the car's middle can get to a wall

  canvas.width = COLS * TILE;
  canvas.height = ROWS * TILE;

  // ----- Images (from the img folder) -----
  var images = {};
  ['car', 'road', 'grass', 'tree', 'spikes', 'finish'].forEach(function (name) {
    var img = new Image();
    img.onload = function () { draw(); };  // redraw as each picture finishes loading
    img.src = 'img/' + name + '.svg';
    images[name] = img;
  });

  function ready(img) {
    return img.complete && img.naturalWidth > 0;
  }

  // ----- Find the start square -----
  var start = { x: 0, y: 0 };
  for (var r = 0; r < ROWS; r++) {
    var c = MAP[r].indexOf('S');
    if (c !== -1) {
      start.x = (c + 0.5) * TILE;
      start.y = (r + 0.5) * TILE;
    }
  }

  // ----- Game state -----
  var car = { x: start.x, y: start.y, angle: 0 };
  var keys = { up: false, down: false, left: false, right: false };
  var playing = false;
  var crashed = false;
  var startTime = 0;
  var lastFrame = 0;

  // What is on the map at this pixel? Outside the board counts as a wall.
  function tileAt(px, py) {
    var col = Math.floor(px / TILE);
    var row = Math.floor(py / TILE);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) { return '#'; }
    return MAP[row].charAt(col);
  }

  // Check the middle of the car and 8 points in a circle around it.
  function touchesWall(x, y) {
    if (tileAt(x, y) === '#') { return true; }
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4;
      if (tileAt(x + Math.cos(a) * HIT_RADIUS, y + Math.sin(a) * HIT_RADIUS) === '#') {
        return true;
      }
    }
    return false;
  }

  // ----- Drawing -----
  function paint(img, x, y, fallbackColor) {
    if (ready(img)) {
      ctx.drawImage(img, x, y, TILE, TILE);
    } else if (fallbackColor) {
      ctx.fillStyle = fallbackColor;
      ctx.fillRect(x, y, TILE, TILE);
    }
  }

  function draw() {
    for (var row = 0; row < ROWS; row++) {
      for (var col = 0; col < COLS; col++) {
        var ch = MAP[row].charAt(col);
        var x = col * TILE;
        var y = row * TILE;
        if (ch === '#') {
          paint(images.grass, x, y, '#4caf50');
          // Mix trees and spikes so the edges look dangerous
          paint((row * 7 + col * 3) % 5 === 0 ? images.spikes : images.tree, x, y, null);
        } else {
          paint(images.road, x, y, '#555b61');
          if (ch === 'G') { paint(images.finish, x, y, '#ffffff'); }
        }
      }
    }

    // The car, turned to face the way it is driving
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);
    if (ready(images.car)) {
      ctx.drawImage(images.car, -CAR_SIZE / 2, -CAR_SIZE / 2, CAR_SIZE, CAR_SIZE);
    } else {
      ctx.fillStyle = '#e53935';
      ctx.fillRect(-7, -11, 14, 22);
    }
    ctx.restore();

    // Red ring where the car crashed
    if (crashed) {
      ctx.beginPath();
      ctx.arc(car.x, car.y, 18, 0, Math.PI * 2);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ff1744';
      ctx.stroke();
    }
  }

  // ----- Timer and best time -----
  function showTime(seconds) {
    timerEl.textContent = 'Time: ' + seconds.toFixed(1) + ' s';
  }

  function loadBest() {
    try { return parseFloat(localStorage.getItem('carMazeBest')) || 0; } catch (e) { return 0; }
  }

  function saveBest(seconds) {
    try { localStorage.setItem('carMazeBest', String(seconds)); } catch (e) { /* storage blocked */ }
  }

  function showBest() {
    var best = loadBest();
    bestEl.textContent = best ? 'Best: ' + best.toFixed(1) + ' s' : '';
  }

  // ----- Game flow -----
  function clearKeys() {
    keys.up = false;
    keys.down = false;
    keys.left = false;
    keys.right = false;
  }

  function startGame() {
    car.x = start.x;
    car.y = start.y;
    car.angle = 0;
    clearKeys();
    crashed = false;
    playing = true;
    startBtn.disabled = true;
    statusEl.textContent = 'Go! Drive to the checkered flag at the top.';
    showTime(0);
    draw();
    // Start the clock on the next animation frame
    requestAnimationFrame(function (now) {
      startTime = now;
      lastFrame = now;
      requestAnimationFrame(loop);
    });
  }

  function endGame(message, buttonText, giveFocus) {
    playing = false;
    clearKeys();
    startBtn.disabled = false;
    startBtn.textContent = buttonText;
    statusEl.textContent = message;
    draw();
    if (giveFocus) { startBtn.focus(); }
  }

  function crash() {
    crashed = true;
    endGame('Crash! You touched the trees or spikes. Press "Try again" to start over.', 'Try again', true);
  }

  function win(seconds) {
    var best = loadBest();
    var newBest = !best || seconds < best;
    if (newBest) { saveBest(seconds); }
    showBest();
    endGame('You made it in ' + seconds.toFixed(1) + ' seconds!' + (newBest ? ' New best time!' : ''), 'Play again', true);
  }

  function loop(now) {
    if (!playing) { return; }

    // Stop if the Games tab was closed while driving
    if (canvas.offsetParent === null) {
      endGame('Game stopped because you left the Games tab. Press Start to play again.', 'Start', false);
      return;
    }

    var dt = Math.min(Math.max((now - lastFrame) / 1000, 0), 0.05);
    lastFrame = now;

    var dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    var dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    if (dx !== 0 || dy !== 0) {
      var len = Math.sqrt(dx * dx + dy * dy);
      car.x += dx / len * SPEED * dt;
      car.y += dy / len * SPEED * dt;
      car.angle = Math.atan2(dx, -dy);  // 0 = facing up
    }

    var seconds = (now - startTime) / 1000;
    showTime(seconds);

    if (touchesWall(car.x, car.y)) { crash(); return; }
    if (tileAt(car.x, car.y) === 'G') { win(seconds); return; }

    draw();
    requestAnimationFrame(loop);
  }

  // ----- Keyboard controls (arrow keys) -----
  var KEY_DIRS = {
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'ArrowLeft': 'left',
    'ArrowRight': 'right'
  };

  document.addEventListener('keydown', function (e) {
    var dir = KEY_DIRS[e.key];
    if (playing && dir) {
      keys[dir] = true;
      e.preventDefault();  // stop the arrow keys from scrolling the page
    }
  });

  document.addEventListener('keyup', function (e) {
    var dir = KEY_DIRS[e.key];
    if (dir) { keys[dir] = false; }
  });

  window.addEventListener('blur', clearKeys);

  startBtn.addEventListener('click', startGame);

  showBest();
  draw();
})();
