// 表盘，刻度，刻针 （时针，分针，秒针）
// 1.准备工作
let canvas = document.createElement('canvas')
document.body.append(canvas)
canvas.width = 400
canvas.height = 400
// 获取画笔
let ctx = canvas.getContext('2d')

// 将xy轴移至中心点
ctx.translate(200, 200);

// 2.绘制表盘
ctx.save()
ctx.beginPath()
ctx.strokeStyle = "#666"
ctx.arc(0, 0, 200, 0, Math.PI * 2)
ctx.stroke()
ctx.restore()

// 3.绘制刻度
// 时刻度
ctx.save()
ctx.lineWidth = 5
for (let i = 0; i < 12; i++) {
    ctx.beginPath()
    ctx.moveTo(0, -200)
    ctx.lineTo(0, -188)
    ctx.stroke()
    ctx.rotate(Math.PI * 2 / 12)
}
ctx.restore()

// 分刻度
ctx.save()
ctx.strokeStyle = "#ccc"
for (let i = 0; i < 60; i++) {
    if (i % 5 !== 0) {
        ctx.beginPath()
        ctx.moveTo(0, -200)
        ctx.lineTo(0, -192)
        ctx.stroke()
    }
    ctx.rotate(Math.PI * 2 / 60)
}
ctx.restore()

// 4.绘制文字
ctx.save()
const r = 170 // 半径
const hd = Math.PI * 2 / 12 // 弧度
ctx.font = '20px serif'
ctx.textAlign = "center"
ctx.textBaseline = "middle"
for (let i = 0; i < 12; i++) {
    const text = i === 0 ? 12 : i
    const x = Math.sin(hd * i) * r // 角度
    const y = -Math.cos(hd * i) * r // 弧度
    ctx.fillText(text, x, y)
}
ctx.restore()

canvas = document.createElement('canvas')
document.body.append(canvas)
canvas.width = 400
canvas.height = 400
// 获取画笔
ctx = canvas.getContext('2d')
ctx.translate(200, 200);
function draw() {
    // 将xy轴移至中心点
    ctx.clearRect(-200, -200, canvas.width, canvas.height)

    const now = new Date()
    const hour = now.getHours() % 12 // 12小时制
    const minute = now.getMinutes()
    const second = now.getSeconds()

    // 1.绘制秒针
    ctx.save()
    ctx.rotate(Math.PI * 2 / 60 * second)
    ctx.lineWidth = 3
    ctx.fillStyle = "#f00"
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(-2, 0)
    ctx.lineTo(0, -190)
    ctx.lineTo(2, 0)
    ctx.lineTo(0, 60)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    // 2.绘制分针
    ctx.save()
    ctx.rotate((minute * 60 + second) * Math.PI * 2 / 3600)
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(-2, 0)
    ctx.lineTo(0, -150)
    ctx.lineTo(2, 20)
    ctx.lineTo(0, 30)
    ctx.lineTo(-2, 20)
    ctx.closePath()
    ctx.stroke()
    ctx.restore()

    // 3.绘制时针
    ctx.save()
    ctx.rotate((hour * 3600 + minute * 60 + second) * Math.PI * 2 / (60 * 60 * 12))
    ctx.lineWidth = 3
    ctx.fillStyle = "#000"
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(-4, 0)
    ctx.lineTo(0, -120)
    ctx.lineTo(4, 20)
    ctx.lineTo(0, 30)
    ctx.lineTo(-4, 20)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
}

draw()
setInterval(draw, 1000);