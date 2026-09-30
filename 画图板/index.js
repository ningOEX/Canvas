// ------------------- 快捷工具获取dom ------------------
const $ = (el) => document.querySelector(el)
const $$ = (el) => document.querySelectorAll(el)

// 创建画布
const canvas1 = document.createElement('canvas') //画布
const canvas2 = document.createElement('canvas') //绘画
canvas1.width = canvas2.width = 800
canvas1.height = canvas2.height = 400
const container = $('#canvas-container')
container.append(canvas1, canvas2)

// 获取画笔
const ctx1 = canvas1.getContext('2d')
const ctx2 = canvas2.getContext('2d')


// 形状类型 / 颜色 / 粗细
let shapeType = "line", color = "#000", lineWidth = 1; drawType = 'stroke'

/**
 * 按钮事件注册
 */
function preBtnEvent() {
    // 图形
    $$('.shapeType').forEach(btn => {
        btn.onclick = function (e) {
            // 点击当前按钮已高亮，不处理
            if (this.classList.contains('active')) return
            // 切换状态
            const activeBtn = $('.shapeType.active')
            if (activeBtn) activeBtn.classList.remove('active')
            this.classList.add('active')
            // 切换图形类型
            shapeType = this.getAttribute('data-type')

            if (shapeType !== 'line' && shapeType !== 'rubber') {
                $('#drawType').classList.add('block')
                return
            }
            // 绘制图案显示单选框绘制类型
            $('#drawType').classList.remove('block')
            $('#drawType').classList.add('none')
        }
    })

    $('#boldBtn').onchange = function () { lineWidth = +this.value }  // 粗细
    $('#colorBtn').onchange = function () { color = this.value }  // 颜色
    $('#clearBtn').onclick = () => ctx1.clearRect(0, 0, canvas1.width, canvas1.height) // 清空画布
    // 保存
    $('#saveBtn').onclick = function () {
        const img = canvas1.toDataURL('image/png')
        const a = document.createElement('a')
        a.href = img
        a.download = '保存图片'
        document.body.appendChild(a);
        a.click()
        a.remove()
    }
    // 单选框
    $$('input[name]').forEach(input => {
        input.onchange = function () {
            drawType = this.value
        }
    })


}
preBtnEvent()


// ---------- 形状策略表：start / update / end / commit ----------
const shapeStrategies = {
    line: {
        // 按下：预览层起笔
        start(ctx, s) {
            ctx.save()
            setStrokeStyle(ctx)
            ctx.beginPath()
            ctx.moveTo(s.x, s.y)
        },
        // 拖动：追加线段 + 记录点
        update(ctx, s, ex, ey) {
            ctx.lineTo(ex, ey)
            ctx.stroke()
            s.points.push({ ex, ey }) // 添加拖动点
        },
        // 抬起：预览层出栈
        end(ctx) {
            ctx.restore()
        },
        // 定稿：把记录的点画到持久层
        commit(s) {
            s.ctx.save()
            setStrokeStyle(s.ctx)
            s.ctx.beginPath()
            s.ctx.moveTo(s.x, s.y)
            s.points?.forEach(point => s.ctx.lineTo(point.ex, point.ey))
            s.ctx.stroke()
            s.ctx.restore()
        },
    },
    rect: {
        start(ctx, s) {
            ctx.save()
            setStrokeStyle(ctx)
            ctx.beginPath()
        },
        update(ctx, s, ex, ey) {
            s.ex = ex
            s.ey = ey
            const { x, y, w, h } = getRectCalcParams(s)
            drawType === 'stroke' ? ctx.strokeRect(x, y, w, h) : ctx.fillRect(x, y, w, h)
        },
        end(ctx, s) {
            ctx.restore()
        },
        commit(s) {
            s.ctx.save()
            setStrokeStyle(s.ctx)
            s.ctx.beginPath()
            const { x, y, w, h } = getRectCalcParams(s)
            console.log(drawType === 'stroke');

            drawType === 'stroke' ? s.ctx.strokeRect(x, y, w, h) : s.ctx.fillRect(x, y, w, h)
            s.ctx.restore()
        },
    },
    circle: {
        start() { },
        update(ctx, s, ex, ey) {
            ctx.save()
            ctx.beginPath()
            s.ex = ex
            s.ey = ey
            setStrokeStyle(ctx)
            const { r1, r2, x, y } = getCircleCalcParams(s)
            if (r1 === r2) {
                // 正圆
                ctx.arc(x, y, r1, 0, Math.PI * 2)
                drawType === 'stroke' ? ctx.stroke() : ctx.fill()
                return
            }
            // 椭圆
            ctx.ellipse(x, y, r1, r2, 0, 0, Math.PI * 2)
            drawType === 'stroke' ? ctx.stroke() : ctx.fill()
        },
        end(ctx, s) {
            ctx.restore()
        },
        commit(s) {
            s.ctx.save()
            s.ctx.beginPath()
            setStrokeStyle(s.ctx)
            const { r1, r2, x, y } = getCircleCalcParams(s)
            if (r1 === r2) {
                // 正圆
                s.ctx.arc(x, y, r1, 0, Math.PI * 2)
                drawType === 'stroke' ? s.ctx.stroke() : s.ctx.fill()
                return
            }
            // 椭圆
            s.ctx.ellipse(x, y, r1, r2, 0, 0, Math.PI * 2)
            drawType === 'stroke' ? s.ctx.stroke() : s.ctx.fill()
            s.ctx.restore()
        },
    },
    fill: {
        start(ctx, s) {
            console.log('start');
        },
        update(ctx, s, ex, ey) {
            console.log('update');
        },
        end(ctx, s) {
            console.log('end');
        },
        commit(s) {
            console.log('commit');
        },
    },
    rubber: {
        start(ctx, s) {
            s.ctx.save()
            s.ctx.beginPath()
            s.ctx.lineWidth = lineWidth
            s.ctx.strokeStyle = "#fff"
            s.ctx.moveTo(s.x, s.y)
        },
        update(ctx, s, ex, ey) {
            s.ex = ex
            s.ey = ey
            console.log('update', s);
            s.ctx.lineTo(s.ex, s.ey)
            s.ctx.stroke()
        },
        end(ctx, s) {
            console.log('end');
            s.ctx.restore()
        },
        commit(s) {
            console.log('commit');
        },
    }
}

// 定义图形类
class Shape {
    constructor(type, x, y, ctx) {
        this.type = type
        this.x = x
        this.y = y
        this.ex = x
        this.ey = y
        this.ctx = ctx  // 持久层
        this.points = []
    }
    get strategy() { return shapeStrategies[this.type] }

    start(ctx) { this.strategy?.start?.(ctx, this) }
    update(ctx, ex, ey) { this.strategy?.update?.(ctx, this, ex, ey) }
    end(ctx) { this.strategy?.end?.(ctx, this) }
    draw() { this.strategy?.commit?.(this) }
}

// ---------------- 辅助区域 ----------------
// 画布坐标换算：兼容 CSS 缩放 / 高分屏
function toCanvasPos(e, rect) {
    return {
        x: Math.floor((e.clientX - rect.left) * (canvas2.width / rect.width)),
        y: Math.floor((e.clientY - rect.top) * (canvas2.height / rect.height)),
    }
}
function setStrokeStyle(ctx) {

    if (drawType === "stroke") {
        ctx.strokeStyle = color
        ctx.lineWidth = lineWidth
    } else {
        ctx.fillStyle = color
    }

}
function getRectCalcParams(s) {
    return {
        x: Math.min(s.x, s.ex),
        y: Math.min(s.y, s.ey),
        w: Math.abs(s.x - s.ex),
        h: Math.abs(s.y - s.ey)
    }
}
function getCircleCalcParams(s) {
    const r1 = Math.abs(s.x - s.ex) / 2
    const r2 = Math.abs(s.y - s.ey) / 2
    const x = Math.min(s.x, s.ex) + r1
    const y = Math.min(s.y, s.ey) + r2
    return {
        r1, r2, x, y
    }
}

// ------------ 绘制区域入口 ----------------
let session = null // { shape, rect, pointerId }，非空表示正在拖拽

// 只绑定一次，常驻
canvas2.addEventListener('pointerdown', onPointerDown)
canvas2.addEventListener('pointermove', onPointerMove)
canvas2.addEventListener('pointerup', onPointerUp)
canvas2.addEventListener('pointercancel', onPointerUp)

function onPointerDown(e) {
    // 只响应鼠标左键
    if (e.button !== 0) return
    if (session) return // 已有值正在绘制中
    const rect = canvas2.getBoundingClientRect()
    const { x, y } = toCanvasPos(e, rect)

    if (shapeType === 'fill') {
        new Shape(shapeType, x, y, ctx1).draw()
        return
    }
    const shape = new Shape(shapeType, x, y, ctx1)
    session = {
        shape,
        rect,
        pointerId: e.pointerId
    }
    shape.start(ctx2)

    // 捕获指针，后续 move/up 全部派发到 canvas2，即使移出元素/窗口
    canvas2.setPointerCapture(e.pointerId)
    e.preventDefault() // 阻止拖拽选中文本等默认行为
}
function onPointerMove(e) {
    if (!session || e.pointerId !== session.pointerId) return;
    const { x: ex, y: ey } = toCanvasPos(e, session.rect)

    if (shapeType !== 'line') {
        ctx2.clearRect(0, 0, canvas2.width, canvas2.height)
    }

    //移动开始绘制
    session.shape.update(ctx2, ex, ey)

}

function onPointerUp(e) {
    if (!session || e.pointerId !== session.pointerId) return
    session.shape.end(ctx2)
    session.shape.draw()
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height)
    ctx2.restore() // 抬起出栈
    session = null
}




