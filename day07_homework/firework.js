// NOTE: This isn't code you'd want to use in a production particle engine!
var screen = document.getElementsByTagName('canvas')[0]
var ctx = screen.getContext('2d')
var devicePix = window.devicePixelRatio || window.webkitDevicePixelRatio || 1.0

function onResize() {
  screen.style.width = window.innerWidth
  screen.style.height = window.innerHeight
  screen.width = window.innerWidth * devicePix
  screen.height = window.innerHeight * devicePix
}
window.addEventListener('resize', onResize)
onResize()

function randPointOnCircle(size) {
  if (size == null) {
    size = 1
  }
  var x = 0.0
  var y = 0.0
  var s = 0.0
  do {
    x = (Math.random() - 0.5) * 2.0
    y = (Math.random() - 0.5) * 2.0
    s = x * x + y * y
  } while (s > 1)

  var scale = size / Math.sqrt(s)
  return { x: x * scale, y: y * scale }
}

function randColor() {
  var components = [
    (Math.random() * 128 + 128) & 0xff,
    (Math.random() * 128 + 128) & 0xff,
    (Math.random() * 128 + 128) & 0xff,
  ]
  components[Math.floor(Math.random() * 3)] =
    Math.floor(Math.random() * 200 + 55) & 0xff
  if (Math.random() < 0.3) {
    components[Math.floor(Math.random() * 3)] =
      (Math.random() * 200 + 55) & 0xff
  }
  return 'rgb(' + components.join(',') + ')'
}

var PARTICLES = []

function Particle(x, y) {
  this.x = x
  this.y = y

  var pt = randPointOnCircle(Math.random() + 1)

  this.vx = pt.x
  this.vy = pt.y

  this.life = Math.floor(Math.random() * 20) + 40
  this.bounce = 0.6
  this.gravity = 0.07
  this.drag = 0.998

  this.active = true
}

Particle.prototype.update = function () {
  if (--this.life < 0) {
    this.active = false
  }
  this.vy += this.gravity
  this.vx *= this.drag
  this.x += this.vx
  this.y += this.vy
}

Particle.prototype.render = function (ctx) {}

function FireworkSpark() {
  Particle.apply(this, arguments)
  this.hue = Math.floor(Math.random() * 360)
  this.lifeMax = this.life
  this.drag = 0.9
  this.color = randColor()
}

FireworkSpark.prototype = Object.create(Particle.prototype, {
  constructor: { value: FireworkSpark },
})

FireworkSpark.prototype.render = function (ctx) {
  //var l = (this.life / this.lifeMax)*3/4+0.25;
  //l = Math.floor(l*100);
  //ctx.fillStyle = 'hsl('+this.hue+', 90%, '+l+'%)';
  ctx.fillStyle = this.color
  ctx.fillRect(this.x - 1, this.y - 1, 2, 2)
}

FireworkSpark.prototype.update = function () {
  Particle.prototype.update.call(this)
  if (Math.random() < 0.05) {
    this.color = randColor()
  }
}

function FireworkFlame() {
  Particle.apply(this, arguments)
  this.life *= 2
}

FireworkFlame.prototype = Object.create(Particle.prototype, {
  constructor: { value: FireworkFlame },
})

FireworkFlame.prototype.update = function () {
  var spark = new FireworkSpark(this.x, this.y)
  spark.vx /= 10
  spark.vy /= 10
  spark.vx += this.vx / 2
  spark.vy += this.vy / 2
  PARTICLES.push(spark)
  Particle.prototype.update.call(this)
}

FireworkFlame.prototype.render = function (ctx) {}

function Firework() {
  Particle.apply(this, arguments)
  this.lifeMax = 5
  this.life = this.lifeMax
}

Firework.prototype = Object.create(Particle.prototype, {
  constructor: { value: Firework },
})

Firework.prototype.update = function () {
  Particle.prototype.update.call(this)
  var bits = Math.ceil((this.life * 10) / this.lifeMax)
  var dd = (this.lifeMax - this.life) / this.lifeMax + 0.2
  for (var i = 0; i < bits; ++i) {
    var flame = new FireworkFlame(this.x, this.y)
    flame.vy *= 1.5
    flame.vx *= 1.5
    PARTICLES.push(flame)
  }
}
var ticks = 0
function update() {
  if (ticks++ % 40 === 0) {
    var fw = new Firework(
      Math.random() * window.innerWidth,
      Math.random() * window.innerHeight * 0.75
    )
    fw.vx *= 5
    fw.vy *= 3
    PARTICLES.push(fw)
  }
  var arr = PARTICLES
  for (var i = 0; i < arr.length; ++i) {
    arr[i].update()
  }
  var j = 0
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i].active) {
      arr[j++] = arr[i]
    }
  }
  arr.length = j
}

function render() {
  ctx.save()
  {
    ctx.scale(devicePix, devicePix)
    
    ctx.fillStyle = 'rgb(148, 0, 0)'
    ctx.fillRect(0, 0, screen.width, screen.height)
    for (var i = 0, l = PARTICLES.length; i < l; ++i) {
      PARTICLES[i].render(ctx)
    }
  }
  ctx.restore()
}

var now = Date.now
if (window.performance != null && window.performance.now != null) {
  now = window.performance.now.bind(window.performance)
}

screen.addEventListener('click', function (e) {
  var x = e.clientX
  var y = e.clientY
  var rect = screen.getBoundingClientRect()
  x -= rect.left
  y -= rect.top
  var fw = new Firework(x, y)
  fw.vx *= 5
  fw.vy *= 3
  PARTICLES.push(fw)
})

var currentTime = 0.0
var accum = 0.0
var deltaTime = 1.0 / 60.0
var frames = 0
var displayMspf = 0
var displayFps = 0
var lastPrint = now()
function updateWorld() {
  var frameStart = now()
  var newTime = frameStart / 1000.0
  var frameTime = newTime - currentTime
  if (frameTime > 1.0) {
    frameTime = deltaTime
  }
  currentTime = newTime
  accum += frameTime
  while (accum >= deltaTime) {
    update()
    accum -= deltaTime
  }
  requestAnimationFrame(updateWorld)
  render()
  var frameEnd = now()
  var fps = 1.0 / frameTime
  var mspf = frameEnd - frameStart
  ++frames
  if (frameEnd - lastPrint > 1000) {
    displayFps = frames
    lastPrint = frameEnd
    displayMspf = mspf
    frames = 0
  } else if (false && mspf > displayMspf) {
    displayMspf = mspf
  }

  // ctx.save()
  // {
  //   ctx.scale(devicePix, devicePix)
  //   ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  //   ctx.fillRect(0, 0, 200, 60)
  //   ctx.font = '15px monospace'
  //   ctx.fillStyle = 'white'
  //   ctx.fillText('fps:  ' + displayFps.toFixed(1), 10, 15)
  //   ctx.fillText('mspf: ' + displayMspf.toFixed(3), 10, 40)
  // }
  ctx.restore()
}
updateWorld()
