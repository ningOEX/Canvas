// 分为两部分，一部分为棋盘，一部分为贪吃蛇与食物。
const canvas1 = document.createElement('canvas')
const canvas2 = document.createElement('canvas')
const ctx1 = canvas1.getContext('2d')
const ctx2 = canvas2.getContext('2d')

// 初始化
function initCanvas(canvas) {
    canvas.width = 200
    canvas.height = 200
    document.body.append(canvas)
}

initCanvas(canvas1)
initCanvas(canvas2)

let cell = 20  // 每个格子大小
const grid = {}

const type = {
    head: 1,
    food: 2
}

function initGrid() {
    for (let i = 0; i < canvas1.width / cell; i++) {
        for (let j = 0; j < canvas1.height / cell; j++) {
            grid[`${i * cell}-${j * cell}`] = 0
        }
    }
}
initGrid()

// 创建棋盘
function drawBoard() {
    ctx1.save()
    ctx1.strokeStyle = "#bebaba"
    for (let i = 0; i < canvas1.width / cell; i++) {
        ctx1.beginPath()
        ctx1.moveTo(i * cell, 0)
        ctx1.lineTo(i * cell, canvas1.width)
        ctx1.stroke()

        ctx1.beginPath()
        ctx1.moveTo(0, i * cell)
        ctx1.lineTo(canvas1.width, i * cell)
        ctx1.stroke()
    }
    ctx1.restore()
}

drawBoard()


// 蛇头，身体，食物
class Rect {
    constructor(x, y, type, color = "#fac") {
        this.x = x
        this.y = y
        this.oldX = x
        this.oldY = y
        this.color = color
        this.w = cell
        this.h = cell
        this.type = type
    }
    draw() {
        // 修改格子的状态，将之前占用的格式进行释放，将新格子占用
        grid[`${this.oldX}-${this.oldY}`] = 0
        grid[`${this.x}-${this.y}`] = this.type

        ctx2.clearRect(this.oldX, this.oldY, this.w, this.h)
        this.oldX = this.x
        this.oldY = this.y
        ctx2.save()
        ctx2.beginPath()
        ctx2.fillStyle = this.color
        ctx2.fillRect(this.x, this.y, this.w, this.h)
        ctx2.restore()
    }
}

// 蛇
// dir = ArrowRight, ArrowDown, ArrowLeft, ArrowUp
class Snake {
    constructor(x, y, dir = "ArrowRight") {
        this.x = x * cell
        this.y = y * cell
        this.dir = dir
        this.head = new Rect(this.x, this.y, type.head, 'red') // 蛇头
        this.body = [] // 蛇身
        this.timer = null
    }
    draw() {
        this.head.draw()
        if (this.body.length) this.body[0].draw() // 重绘最开始一个
    }
    move() {
        if (this.timer) clearInterval(this.timer)
        switch (this.dir) {
            case 'ArrowRight':
                this.head.x += cell
                break;
            case 'ArrowLeft':
                this.head.x -= cell
                break;
            case 'ArrowDown':
                this.head.y += cell
                break;
            case 'ArrowUp':
                this.head.y -= cell
                break;
        }
        // 判断是否到达零界点，游戏结束
        if (this.isOver()) {
            createGameEnd()
            clearInterval(this.timer)
            return
        }
        // 判断是否吃到食物
        if (this.isEat()) {
            // 吃到食物身体增加一个小格子,增加到蛇头移动的上一个位置
            const rect = new Rect(this.head.oldX, this.head.oldY, type.head)
            this.body.unshift(rect)
            randomFood()
        } else {
            // 没吃到食物，找到蛇身的最后一格，替换到蛇头前进的旧格子。
            if (this.body.length) {
                const last = this.body.pop()
                last.x = this.head.oldX
                last.y = this.head.oldY
                this.body.unshift(last)
            }
        }


        this.draw()
        this.timer = setInterval(() => {
            this.move()
        }, 200);
    }
    isOver() {
        return this.head.x >= canvas2.width || this.head.y < 0 || this.head.x < 0 || this.head.y >= canvas1.height || grid[`${this.head.x}-${this.head.y}`] === 1
    }
    isEat() {
        return this.head.x === food.x && this.head.y === food.y
    }

}

// 随机生成食物
let food
function randomFood() {
    while (true) {
        const x = Math.floor(Math.random() * canvas1.width / cell) * cell
        const y = Math.floor(Math.random() * canvas1.height / cell) * cell
        if (grid[`${x}-${y}`] === 0) {
            // 随机位置空闲，产生创建食物
            food = new Rect(x, y, type.food)
            food.draw()
            break;
        }
    }
}
randomFood()

// 创建蛇头
const snake = new Snake(0, 0)

function createGameEnd(){
    const div = document.getElementById('tip')
    div.innerText = `游戏结束！分数:${snake.body.length * cell / 100 * 10 / 2}分`
    div.style.userSelect = 'none'
    div.style.paddingLeft = canvas1.width + 20 +"px"
    document.body.append(div)
}

document.onkeydown = function (e) {
    if (e.code === "ArrowRight" || e.code === "ArrowLeft" || e.code === "ArrowDown" || e.code === "ArrowUp") {
        if (snake.dir === "ArrowRight" && e.code === "ArrowLeft"
            || snake.dir === "ArrowLeft" && e.code === "ArrowRight"
            || snake.dir === "ArrowDown" && e.code === "ArrowUp"
            || snake.dir === "ArrowUp" && e.code === "ArrowDown"
        ) return
        snake.dir = e.code
    }
    // enter 开始游戏
    if (e.code === "Enter") {
        snake.draw()
        snake.move()
    }
}

/**
 * 创建提示
 */
function createTip(){
    const div = document.createElement('div')
    div.id = 'tip'
    div.style.paddingLeft = canvas1.width + 20 + 'px'
    div.style.userSelect = 'none'
    div.innerText = "按Enter 游戏开始!"
    document.body.append(div)
}

createTip()
