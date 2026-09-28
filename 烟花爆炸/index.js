/**
 * 烟花爆炸
 */

// 1.搭建画布以及自适应窗口
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

document.body.append(canvas)

let W, H;
function resize() {
    W = canvas.width = window.innerWidth
    H = canvas.height = window.innerHeight
}
resize()
window.addEventListener('resize', resize)

// 2.工具函数
const rand = (min, max) => Math.random() * (max - min) + min
const randInt = (min, max) => Math.floor(rand(min, max + 1))

// 3.爆炸粒子
class Particle {
    constructor(x, y, color) {
        this.x = x
        this.y = y
        this.color = color
        const angle = rand(0, Math.PI * 2) // 随机方向
        const speed = rand(1, 6) // 随机速度
        this.vx = Math.cos(angle) * speed // 把速度分解到X轴
        this.vy = Math.sin(angle) * speed // 分解到y轴

        this.gravity = rand(0.01,0.05) // 每帧给vy加一点，模拟下坠
        this.friction = 0.98 // 每帧速度乘以0.98 模拟空气阻力
        this.alpha = 1;// 控制颗粒渐渐消失
        this.decay = rand(0.008, 0.01); // 随机逐渐消失
        this.size = rand(1, 2.5);  // 颗粒半径，随机让画面有层次
        this.color = color;
    }

    // 颗粒更新
    update() {
        // 01)先衰减
        this.vx *= this.friction
        this.vy *= this.friction
        // 02)增加重力
        this.vy += this.gravity

        // 03)移动
        this.x += this.vx
        this.y += this.vy

        this.alpha -= this.decay //逐渐消失

        // 注：如果先加位置再改速度，物理会不自然。
    }

    // 绘制
    draw(ctx) {
        ctx.globalAlpha = Math.max(this.alpha, 0) // 透明度
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
    }
    get dead() {
        return this.alpha <= 0;
    }
}

// 4.主体烟花上升
class Rocket {
    constructor(x, targetY, color) {
        this.x = x
        this.y = H // 从底部触发
        this.targetY = targetY
        this.color = color
        this.vy = rand(-12, -9);  // 负值 = 向上
        this.vx = rand(-0.5, 0.5);
        this.trail = [];     // 拖尾点
    }
    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 8) this.trail.shift();

        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.15;     // 减速
    }

    draw(ctx) {
        for (let i = 0; i < this.trail.length; i++) {
            const p = this.trail[i];
            ctx.globalAlpha = i / this.trail.length;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    // 到达目标高度 或 速度归零 就爆炸。
    get exploded() {
        return this.y <= this.targetY || this.vy >= 0;
    }
}

// 5.爆炸逻辑
const rockets = [];
const particles = [];
const colors = [
    '#ff4d4d', '#ff9f43', '#ffd93d',
    '#6bcB77', '#4d96ff', '#b983ff',
    '#ff6fd8', '#00e5ff'
];
// x 限制在屏幕中间 70% 区域，避免烟花贴边。
// targetY 限制在屏幕上方 10%~45%，保证爆炸位置合理。
function launchFirework() {
    const x = rand(W * 0.15, W * 0.85);
    const targetY = rand(H * 0.1, H * 0.45);
    const color = colors[randInt(0, colors.length - 1)];
    rockets.push(new Rocket(x, targetY, color));
}

// 爆炸时一次性生成 60~120 个粒子，每个粒子独立随机方向。
function explode(rocket) {
    const count = randInt(60, 120);
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(rocket.x, rocket.y, rocket.color));
    }
}


// 5.循环生成烟花
function animate() {

    // 1. 半透明覆盖，形成拖尾
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.fillRect(0, 0, W, H);

    // 2. 随机发射
    if (Math.random() < 0.04) launchFirework();

    // 3. 更新火箭
    for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        
        r.update();
        r.draw(ctx);
        if (r.exploded) {
            explode(r);
            rockets.splice(i, 1);
        }
    }

    // 4. 更新粒子
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);

        if (p.dead) particles.splice(i, 1);
    }

    requestAnimationFrame(animate);
}
animate();

