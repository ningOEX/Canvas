/**
 * 烟花爆炸分为两部分
 * 1. 主体升空的过程
 *  - 小球逐渐上升时，渐渐变透明
 * 2. 颗粒散开
 */

const canvas = document.createElement('canvas')
document.body.append(canvas)
canvas.width = window.innerWidth
canvas.height = window.innerHeight

// 获取画笔
const ctx = canvas.getContext('2d')

// 将xy轴进行变换到底部
ctx.translate(0, canvas.height)
ctx.scale(1, -1)

// 绘制烟花
class Fireworks {
    constructor(x, y) {
        this.x = x
        this.y = y
        this.r = 6
        this.opacity = 1
        this.count = 400 // 爆炸颗粒总数
        this.particles = []
    }
    //绘制主体
    draw() {
        this.opacity = this.opacity < 0.25 ? 0.25 : this.opacity
        for (let i = 0; i < 100; i++) {
            const ball = new Ball(this.x, this.y - i, this.r - i / 20, `rgba(200,200,40,${this.opacity - i / 100})`)
            ball.draw()
        }
    }
    // 绘制颗粒爆炸
    bomb() {
        if (this.particles.length === 0) {
            // 首次爆炸
            const hd = Math.PI * 2 / this.count
            const cell = (val) => Math.ceil(val) // 向上取整
            const color = `rgba(${cell(Math.random() * 256)},${cell(Math.random() * 256)},${cell(Math.random() * 256)},0.8)`
            // const color = `hsl(${Math.random() * 360},50%)`
            for (let i = 0; i < this.count; i++) {
                const color2 = `rgba(${cell(Math.random() * 256)},${cell(Math.random() * 256)},${cell(Math.random() * 256)},0.8)`
                const dirX = Math.cos(i * hd) * Math.random() * 4
                const dirY = Math.sin(i * hd) * Math.random() * 4
                const particle = new Particle(this.x, this.y, dirX, dirY, color, color2, i % 2 == 0)
                this.particles.push(particle)
                particle.draw()
            }
        } else {
            this.particles.forEach(particle => particle.update())
        }
    }
}

/**
 * 绘制小球
 * @param {*} x 
 * @param {*} y 
 * @param {*} r 
 * @param {*} color 
 */
class Ball {
    constructor(x, y, r, color) {
        this.x = x
        this.y = y
        this.r = r
        this.color = color
    }
    draw() {
        ctx.save()
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
    }
}

/**
 * 绘制颗粒
 * @param {*} x 起始爆炸位置x
 * @param {*} y 起始爆炸位置y
 * @param {*} dirX 爆炸的移动方向X
 * @param {*} dirY 爆炸的移动方向Y
 * @param {*} color 颗粒颜色
 */
class Particle {
    constructor(x, y, dirX, dirY, color, color2, type) {
        this.x = x
        this.y = y
        this.r = 2
        this.dirX = dirX
        this.dirY = dirY
        this.color = color
        this.color2 = color2
        this.type = type
    }
    draw() {
        if (this.type) {
            ctx.save()
            ctx.beginPath()
            ctx.fillStyle = this.color
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
            ctx.fill()
            ctx.restore()

            ctx.save()
            ctx.strokeStyle = this.color
            ctx.beginPath()
            ctx.moveTo(this.x - 5, this.y - 5) // 起点
            ctx.quadraticCurveTo(this.x, this.y, this.x + 5, this.y + 5)
            ctx.stroke()
            ctx.restore()
        }
        ctx.save()
        ctx.beginPath()
        ctx.fillStyle = this.color2
        ctx.fillRect(this.x, this.y, 4, 4)
        ctx.restore()
    }
    // 移动位置
    update() {
        this.x += this.dirX
        this.y += this.dirY
        this.dirX *= 0.99
        this.dirY *= 0.99
        this.draw()
    }
}

const fireworksArray = [] // 主体
const bombArray = [] // 颗粒
let sum = 0
function move() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (sum % 30 === 0) {
        // 到达一定时间，释放一个烟花升空
        const x = Math.random() * canvas.width * 3 / 4 + canvas.width / 8
        const y = Math.random() * 100

        const fireworks = new Fireworks(x, y)
        fireworksArray.push(fireworks)
    }

    if (fireworksArray.length === 4) {
        // 最开始的烟花进行爆炸
        const fire = fireworksArray.shift()
        bombArray.push(fire)
    }

    if (bombArray.length === 4) bombArray.shift()

    // 主体
    fireworksArray.forEach((fire, i) => {
        fire.y += 6
        fire.opacity -= 0.01
        fire.draw()
    })
    // 颗粒
    bombArray.forEach((fire, i) => {
        fire.bomb()
    })
    sum++
    requestAnimationFrame(move)
}
move()