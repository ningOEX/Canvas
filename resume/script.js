/* ============================================================
   万花筒叙事简历 · 导演脚本（GSAP + ScrollTrigger）
   主时间线：预加载 → 爆裂 → 标题 → 交互 → 滚动章节
   ============================================================ */
(function () {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const HAS_GSAP = typeof window.gsap !== "undefined";
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceMotion = reduceMotionQuery.matches;

  /* ---------- 工具：手动切减少动态 ---------- */
  const reduceBtn = $("#reduceBtn");
  function applyReduce(state) {
    reduceMotion = state;
    document.body.classList.toggle("reduce-motion", state);
    if (reduceBtn) reduceBtn.textContent = state ? "●" : "◐";
  }
  applyReduce(reduceMotion);
  reduceMotionQuery.addEventListener?.("change", (e) => applyReduce(e.matches));
  reduceBtn?.addEventListener("click", () => applyReduce(!reduceMotion));

  /* ============================================================
     1) 预加载：黑场光点脉冲 + 环形刻度
     ============================================================ */
  const preloader = $("#preloader");
  const plPct = $("#plPct");
  const plCore = $("#plCore");
  const plGlow = $("#plGlow");
  const plTicksSvg = $(".pl-ticks");

  // 生成环形刻度
  (function buildTicks() {
    if (!plTicksSvg) return;
    let d = "";
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const r1 = 92, r2 = i % 5 === 0 ? 80 : 86;
      const x1 = 100 + Math.cos(a) * r1, y1 = 100 + Math.sin(a) * r1;
      const x2 = 100 + Math.cos(a) * r2, y2 = 100 + Math.sin(a) * r2;
      d += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,${i % 5 === 0 ? 0.5 : 0.22})" stroke-width="1"/>`;
    }
    plTicksSvg.innerHTML = d;
  })();

  function runPreloader(onDone) {
    if (reduceMotion) {
      if (preloader) preloader.classList.add("is-done");
      onDone && onDone();
      return;
    }
    let p = 0;
    const tick = () => {
      p += Math.random() * 14 + 6;
      if (p >= 100) { p = 100; }
      if (plPct) plPct.textContent = Math.floor(p);
      if (HAS_GSAP) {
        gsap.to(plCore, { scale: 1 + (p / 100) * 0.5, duration: 0.25, ease: "power2.out" });
        gsap.to(plGlow, { opacity: 0.4 + (p / 100) * 0.6, scale: 0.8 + (p / 100) * 0.5, duration: 0.3, ease: "power2.out" });
      }
      if (p < 100) { setTimeout(tick, 90 + Math.random() * 120); }
      else { finishPreloader(onDone); }
    };
    tick();
  }

  function finishPreloader(onDone) {
    const tl = HAS_GSAP ? gsap.timeline() : null;
    const core = plCore, glow = plGlow;
    if (tl) {
      tl.to([core, glow, $(".pl-label")], { scale: 0.2, opacity: 0, duration: 0.4, ease: "power2.in" })
        .to({}, { duration: 0.45 }) // 静默半秒
        .add(() => { preloader && preloader.classList.add("is-done"); onDone && onDone(); });
    } else {
      preloader && preloader.classList.add("is-done");
      onDone && onDone();
    }
  }

  /* ============================================================
     2) 万花筒镜片：六边形碎片径向生成 + 爆裂
     ============================================================ */
  const kaleidoWrap = $("#kaleidoWrap");
  const SHARD_COUNT = reduceMotion ? 18 : 42;
  const SHARD_COLORS = ["#39e0ff", "#7b6dff", "#ff3d7f", "#5ad1c2", "#c084fc", "#ffb347"];

  function hexPoints(cx, cy, r) {
    let p = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      p.push((cx + Math.cos(a) * r).toFixed(1) + "," + (cy + Math.sin(a) * r).toFixed(1));
    }
    return p.join(" ");
  }

  function buildShards() {
    if (!kaleidoWrap) return [];
    const frag = document.createDocumentFragment();
    const shards = [];
    for (let i = 0; i < SHARD_COUNT; i++) {
      const ring = Math.floor(i / 12);
      const inRing = i % 12;
      const angle = (inRing / 12) * Math.PI * 2 + ring * 0.26;
      const dist = 40 + ring * 70 + (inRing % 3) * 26;
      const color = SHARD_COLORS[i % SHARD_COLORS.length];
      const el = document.createElement("div");
      el.className = "shard";
      el.dataset.angle = angle.toFixed(3);
      el.dataset.dist = dist;
      el.innerHTML = `<svg viewBox="0 0 100 100">
        <defs><linearGradient id="sg${i}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0.15"/>
        </linearGradient></defs>
        <polygon points="${hexPoints(50, 50, 42)}" fill="url(#sg${i})" stroke="${color}" stroke-width="1.2" stroke-opacity="0.8"/>
        <polygon points="${hexPoints(50, 50, 22)}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="0.8"/>
      </svg>`;
      frag.appendChild(el);
      shards.push({ el, angle, dist });
    }
    kaleidoWrap.appendChild(frag);
    return shards;
  }

  /* ============================================================
     3) 文字拆分（轻量 SplitText 替代）
     ============================================================ */
  function splitIntoChars(text, cls) {
    return text.split("").map((ch) =>
      ch === " " ? `<span class="${cls}" style="width:.32em">&nbsp;</span>` : `<span class="${cls}">${ch}</span>`
    ).join("");
  }

  // 首屏姓名拆分
  const heroName = $("#heroName");
  if (heroName) {
    const name = "林深";
    const en = "LIN SHEN";
    heroName.innerHTML =
      `<span class="cn">${splitIntoChars(name, "ch")}</span>` +
      `<span class="en-split" style="display:block;font-size:.34em;letter-spacing:.5em;margin-top:.35em;color:var(--ink-dim);font-weight:400">${splitIntoChars(en, "ch")}</span>`;
  }

  /* ============================================================
     4) 爆裂 + 首屏主时间线
     ============================================================ */
  function playHero(shards) {
    if (!HAS_GSAP) { revealStatic(); return; }
    if (reduceMotion) { gsap.set(".shard", { opacity: 0 }); gsap.set(["#heroName .ch", "#heroSlit", "#heroRole", "#heroTag", "#heroCta", ".scroll-hint", ".nav-bar"], { opacity: 1 }); return; }

    gsap.registerPlugin(ScrollTrigger);
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

    // —— 爆裂：碎片从中心复制、旋转、放大，径向对称展开 ——
    tl.from(".shard", {
      x: 0, y: 0, scale: 0, rotation: 0, opacity: 0,
      duration: 1.1, stagger: { each: 0.018, from: "random" }, ease: "back.out(1.6)"
    }, 0);
    tl.to(shards.map(s => s.el), {
      x: (i, el) => Math.cos(Number(el.dataset.angle)) * Number(el.dataset.dist),
      y: (i, el) => Math.sin(Number(el.dataset.angle)) * Number(el.dataset.dist),
      rotation: (i) => (Number(shards[i].angle) * 180 / Math.PI) + (i % 2 ? 60 : -60),
      duration: 1.1, stagger: 0.018, ease: "expo.out"
    }, 0);

    // 镜片持续缓慢自转（交互层）
    gsap.to(".kaleido-wrap", { rotation: 360, duration: 60, repeat: -1, ease: "none" });

    // —— 标题：字符从碎片弧线飞入，先模糊后清晰，字距收紧 ——
    const chars = $$("#heroName .ch");
    tl.from(chars, {
      x: (i) => (Math.random() - 0.5) * 520,
      y: (i) => (Math.random() - 0.5) * 360,
      scale: 1.6, opacity: 0, filter: "blur(14px)",
      rotation: (i) => (Math.random() - 0.5) * 80,
      duration: 0.95, stagger: 0.035, ease: "expo.out"
    }, 0.55);
    tl.to(".hero-name", { letterSpacing: "0.02em", duration: 1, ease: "power2.out" }, 0.55);

    // —— 角色标题：水平光缝扫描显影 ——
    const slit = $("#heroSlit"), role = $("#heroRole");
    tl.to(slit, { width: "70vw", maxWidth: 620, duration: 0.7, ease: "power3.inOut" }, 1.15)
      .to(slit, { opacity: 0, duration: 0.4 }, 1.75)
      .fromTo(role, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.6 }, 1.5);

    tl.to("#heroTag", { opacity: 1, y: 0, duration: 0.7 }, 1.7)
      .to("#heroCta", { opacity: 1, y: 0, duration: 0.7 }, 1.9)
      .to(".btn-glow", { boxShadow: "0 0 26px rgba(57,224,255,.6)", repeat: 1, yoyo: true, duration: 0.6, ease: "sine.inOut" }, 2.2)
      .to([".scroll-hint", ".nav-bar"], { opacity: 1, y: 0, duration: 0.8 }, 1.9);

    // —— 交互：鼠标视差 + 反向旋转 ——
    const stage = $("#kaleidoStage");
    if (stage) {
      window.addEventListener("pointermove", (e) => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        gsap.to(".kaleido-wrap", { x: nx * 18, y: ny * 18, duration: 1.2, ease: "power2.out", overwrite: "auto" });
        gsap.to(".shard", {
          rotate: "+=" + (nx * 0.6),
          duration: 1.2, ease: "power2.out", overwrite: false, stagger: 0
        });
      }, { passive: true });
    }

    // —— 滚动：镜片旋转向外飞出，露出第二屏 ——
    ScrollTrigger.create({
      trigger: "#hero", start: "top top", end: "bottom top", scrub: 1,
      onUpdate: (self) => {
        const p = self.progress;
        gsap.set(".shard", { scale: 1 + p * 2.2, opacity: 1 - p, y: (i, el) => {
          const a = Number(el.dataset.angle), d = Number(el.dataset.dist);
          return Math.sin(a) * (d + p * 900);
        }, x: (i, el) => {
          const a = Number(el.dataset.angle), d = Number(el.dataset.dist);
          return Math.cos(a) * (d + p * 900);
        }, rotation: (i, el) => Number(el.dataset.angle) * 57 + p * 240 });
        gsap.set(".hero-content", { y: -p * 120, opacity: 1 - p * 1.1 });
      }
    });
  }

  /* ============================================================
     5) 章节：通用 reveal + split-lines 逐行展开
     ============================================================ */
  function setupReveals() {
    if (!HAS_GSAP) { revealStatic(); return; }

    // split-lines：按行包 word，从中心光圈逐行展开
    $$(".split-lines").forEach((block) => {
      const lines = block.innerHTML.split(/<br\s*\/?>/i);
      block.innerHTML = lines.map((ln) =>
        `<span class="word"><span class="line-inner">${ln.trim()}</span></span>`
      ).join("");
      gsap.set(block.querySelectorAll(".line-inner"), { yPercent: 110 });
      ScrollTrigger.create({
        trigger: block, start: "top 82%", once: true,
        onEnter: () => gsap.to(block.querySelectorAll(".line-inner"), { yPercent: 0, duration: 0.9, stagger: 0.12, ease: "expo.out" })
      });
    });

    // 通用 data-reveal
    $$("[data-reveal]").forEach((el) => {
      ScrollTrigger.create({
        trigger: el, start: "top 88%", once: true,
        onEnter: () => el.classList.add("is-visible")
      });
    });
  }

  /* ============================================================
     6) 技能：六边形矩阵爆开 + 光轨填充
     ============================================================ */
  function buildSkills() {
    const matrix = $("#skillsMatrix");
    if (!matrix) return;
    const skills = [
      { label: "动效 / 叙事", title: "Motion & Story", tags: ["GSAP", "ScrollTrigger", "Keyframes", "Timeline"], pct: 95 },
      { label: "三维 / 渲染", title: "WebGL & 3D", tags: ["Three.js", "GLSL", "Shaders", "Instancing"], pct: 88 },
      { label: "前端工程", title: "Frontend", tags: ["TypeScript", "React", "Vue", "Vite"], pct: 92 },
      { label: "视觉 / 交互", title: "UI & Interaction", tags: ["CSS/SVG", "Design System", "Prototyping"], pct: 90 },
      { label: "性能雕刻", title: "Performance", tags: ["LCP", "RAIL", "60fps", "Tree-shaking"], pct: 86 },
      { label: "可访问性", title: "A11y", tags: ["WCAG", "Keyboard", "Reduced-motion", "Semantics"], pct: 84 }
    ];
    matrix.innerHTML = skills.map((s, i) => `
      <div class="skill-hex" style="--i:${i}">
        <div class="sh-label">${s.label}</div>
        <h4>${s.title}</h4>
        <div class="skill-tags">${s.tags.map(t => `<span>${t}</span>`).join("")}</div>
        <div class="skill-bar"><span class="skill-pct">${s.pct}%</span><div class="skill-fill" data-pct="${s.pct}"></div></div>
      </div>`).join("");

    if (!HAS_GSAP) { $$(".skill-hex").forEach(h => h.style.opacity = 1); return; }
    if (reduceMotion) {
      $$(".skill-hex").forEach(h => { h.style.opacity = 1; h.style.transform = "none"; });
      $$(".skill-fill").forEach(f => f.style.width = f.dataset.pct + "%");
      return;
    }
    ScrollTrigger.create({
      trigger: matrix, start: "top 75%", once: true,
      onEnter: () => {
        gsap.to(".skill-hex", {
          opacity: 1, scale: 1, y: 0, duration: 0.8,
          stagger: { each: 0.07, from: "center" }, ease: "back.out(1.5)"
        });
        gsap.to(".skill-fill", { width: (i, el) => el.dataset.pct + "%", duration: 1.4, stagger: 0.12, ease: "power2.inOut", delay: 0.3 });
      }
    });
  }

  /* ============================================================
     7) 项目：粘性堆叠 · 碎片拼合 · 故障切换
     ============================================================ */
  function setupProjects() {
    $$(".project-card").forEach((card) => {
      // 碎片网格拼合
      const grid = card.querySelector(".shard-grid");
      if (grid) {
        const hue = card.dataset.hue;
        const colorA = `hsl(${hue} 90% 60%)`, colorB = `hsl(${(+hue + 60) % 360} 85% 55%)`;
        grid.innerHTML = Array.from({ length: 9 }, (_, i) =>
          `<i style="--sc:${colorA};--sc2:${colorB};animation-delay:${i * 0.05}s"></i>`
        ).join("");
      }
      if (!HAS_GSAP) return;
      ScrollTrigger.create({
        trigger: card, start: "top 55%", end: "bottom 45%",
        onToggle: (self) => card.classList.toggle("is-active", self.isActive)
      });
      if (!reduceMotion) {
        ScrollTrigger.create({
          trigger: card, start: "top 80%", once: true,
          onEnter: () => gsap.to(card.querySelectorAll(".shard-grid i"), {
            scale: 1, duration: 0.6, stagger: { each: 0.04, from: "random" }, ease: "back.out(1.7)"
          })
        });
      } else {
        card.querySelectorAll(".shard-grid i").forEach(i => i.style.transform = "scale(1)");
      }
    });
  }

  /* ============================================================
     8) 经历：路径绘制 + 光点沿路径前进 + 节点爆开
     ============================================================ */
  function setupExperience() {
    const path = $("#expSvgPathFill"), basePath = $("#expSvgPath"), dot = $("#expDot");
    if (!path) return;
    // 用 pathLength=1 让 dash 精确可控
    [path, basePath].forEach(p => { p.setAttribute("pathLength", "1"); });
    path.style.strokeDasharray = "1";
    path.style.strokeDashoffset = "1";

    const nodes = $$(".exp-node");
    if (!HAS_GSAP) { path.style.strokeDashoffset = "0"; nodes.forEach(n => { n.style.opacity = 1; n.style.transform = "none"; }); return; }
    if (reduceMotion) {
      gsap.set(path, { strokeDashoffset: 0 });
      gsap.set(nodes, { opacity: 1, y: 0 });
      gsap.set(dot, { display: "none" });
      return;
    }

    // 沿 SVG 路径取点（替代 MotionPathPlugin）
    const ns = "http://www.w3.org/2000/svg";
    const proxyPath = document.createElementNS(ns, "path");
    proxyPath.setAttribute("d", basePath.getAttribute("d"));
    const total = proxyPath.getTotalLength();

    ScrollTrigger.create({
      trigger: ".timeline", start: "top 70%", end: "bottom 80%", scrub: 1,
      onUpdate: (self) => {
        const p = self.progress;
        gsap.set(path, { strokeDashoffset: 1 - p });
        const pt = proxyPath.getPointAtLength(total * p);
        // SVG viewBox 100x600，映射到 .timeline 实际尺寸
        const tlRect = $(".timeline").getBoundingClientRect();
        const container = $(".exp-path").getBoundingClientRect();
        // 以 .exp-path 元素为坐标系
        const scaleX = container.width / 100;
        const scaleY = container.height / 600;
        gsap.set(dot, {
          left: container.left - tlRect.left + pt.x * scaleX,
          top: container.top - tlRect.top + pt.y * scaleY,
          xPercent: -50, yPercent: -50
        });
      }
    });

    nodes.forEach((node, i) => {
      ScrollTrigger.create({
        trigger: node, start: "top 78%", once: true,
        onEnter: () => gsap.to(node, {
          opacity: 1, y: 0, duration: 0.8, ease: "back.out(1.4)",
          onStart: () => burstAt(node)
        })
      });
    });
  }

  function burstAt(node) {
    if (reduceMotion) return;
    const rect = node.getBoundingClientRect();
    const cx = rect.left + (rect.width * (Array.from(node.parentNode.children).indexOf(node) % 2 ? 0 : 1));
    for (let i = 0; i < 10; i++) {
      const p = document.createElement("div");
      p.style.cssText = `position:fixed;left:${cx}px;top:${rect.top + 20}px;width:5px;height:5px;border-radius:50%;background:#39e0ff;pointer-events:none;z-index:999;box-shadow:0 0 8px #39e0ff`;
      document.body.appendChild(p);
      const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 80;
      gsap.to(p, { x: Math.cos(a) * d, y: Math.sin(a) * d, opacity: 0, scale: 0, duration: 0.8, ease: "power2.out", onComplete: () => p.remove() });
    }
  }

  /* ============================================================
     9) 联系：碎片回收成光点 → 爆发成入口
     ============================================================ */
  function setupContact() {
    const recollect = $("#contactRecollect");
    if (recollect && HAS_GSAP && !reduceMotion) {
      // 回收光点：从四周飞向中心，再炸开
      ScrollTrigger.create({
        trigger: "#contact", start: "top 60%", once: true,
        onEnter: () => {
          const core = document.createElement("div");
          core.style.cssText = "position:absolute;left:50%;top:30%;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 0 24px #39e0ff;z-index:1";
          recollect.appendChild(core);
          gsap.fromTo(core, { scale: 0 }, { scale: 1, duration: 0.5, ease: "back.out(2)" });
          for (let i = 0; i < 24; i++) {
            const a = (i / 24) * Math.PI * 2;
            const d = 260;
            const s = document.createElement("div");
            s.style.cssText = `position:absolute;left:50%;top:30%;width:8px;height:8px;border-radius:50%;background:${SHARD_COLORS[i % SHARD_COLORS.length]};z-index:1`;
            recollect.appendChild(s);
            gsap.fromTo(s, { x: Math.cos(a) * d, y: Math.sin(a) * d, opacity: 0 },
              { x: 0, y: 0, opacity: 1, duration: 0.7, ease: "power2.in",
                onComplete: () => gsap.to(s, { x: Math.cos(a) * 60, y: Math.sin(a) * 60, opacity: 0, duration: 0.5, onComplete: () => s.remove() })
              });
          }
          gsap.to(".contact-card", { opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.1, ease: "back.out(1.5)", delay: 0.6 });
          gsap.to(core, { scale: 0, duration: 0.5, delay: 0.6, onComplete: () => core.remove() });
        }
      });
      gsap.set(".contact-card", { opacity: 0, y: 40, scale: 0.9 });
    } else {
      $$(".contact-card").forEach(c => c.style.opacity = 1);
    }
  }

  /* ============================================================
     10) 侧边锚点 + 导航高亮
     ============================================================ */
  function setupNav() {
    const dots = $("#sideDots");
    const acts = $$(".act, #footer");
    if (dots) {
      dots.innerHTML = acts.map((a, i) => `<button data-i="${i}" aria-label="跳到${a.id}"></button>`).join("");
      $$("button", dots).forEach((b) => b.addEventListener("click", () => {
        const target = acts[b.dataset.i];
        target && window.scrollTo({ top: target.offsetTop, behavior: reduceMotion ? "auto" : "smooth" });
      }));
    }
    const dotBtns = dots ? $$("button", dots) : [];
    const navLinks = $$(".nav-links a");

    function setActive(i) {
      dotBtns.forEach((b, j) => b.classList.toggle("is-active", j === i));
      const id = acts[i] ? acts[i].id : "";
      navLinks.forEach(l => l.classList.toggle("is-active", l.getAttribute("href") === "#" + id));
    }

    // 滚动高亮：取“顶边越过视口 35% 基准线”的最后一个章节；
    // 滚到页面底部时强制命中最后一个（footer），否则末段因太短永远无法跨基准线。
    function computeActive() {
      const baseline = window.innerHeight * 0.35;
      let active = 0;
      for (let i = 0; i < acts.length; i++) {
        if (acts[i].getBoundingClientRect().top <= baseline) active = i;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        active = acts.length - 1;
      }
      setActive(active);
    }

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { computeActive(); ticking = false; });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    if (HAS_GSAP) ScrollTrigger.addEventListener("refresh", computeActive);
    computeActive();
  }

  /* ============================================================
     11) 粒子星空（Canvas，离屏/隐藏标签页时暂停）
     ============================================================ */
  function initParticles() {
    const canvas = $("#particleCanvas");
    if (!canvas) return;
    if (reduceMotion) { return; }
    const ctx = canvas.getContext("2d");
    let W, H, stars = [], running = false, raf = 0;

    function resize() {
      W = canvas.width = window.innerWidth * devicePixelRatio;
      H = canvas.height = window.innerHeight * devicePixelRatio;
      const count = Math.min(140, Math.floor((W * H) / 26000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.6 + 0.3,
        s: Math.random() * 0.25 + 0.05,
        a: Math.random() * 0.6 + 0.2,
        hue: SHARD_COLORS[Math.floor(Math.random() * SHARD_COLORS.length)]
      }));
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (const st of stars) {
        st.y += st.s * devicePixelRatio;
        if (st.y > H) { st.y = 0; st.x = Math.random() * W; }
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r * devicePixelRatio, 0, Math.PI * 2);
        ctx.fillStyle = st.hue;
        ctx.globalAlpha = st.a;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (running) raf = requestAnimationFrame(draw);
    }

    // 离屏 / 隐藏标签页暂停（项目硬约束）
    function check() {
      const rect = canvas.getBoundingClientRect();
      const onScreen = rect.bottom > 0 && rect.top < window.innerHeight;
      const shouldRun = onScreen && !document.hidden;
      if (shouldRun && !running) { running = true; draw(); }
      else if (!shouldRun && running) { running = false; cancelAnimationFrame(raf); }
    }
    document.addEventListener("visibilitychange", check);
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    check();
  }

  /* ============================================================
     12) 无 GSAP / 降级：静态可读
     ============================================================ */
  function revealStatic() {
    if (preloader) preloader.classList.add("is-done");
    $$(".shard").forEach(s => s.style.opacity = 0);
    $$("#heroName .ch").forEach(c => c.style.opacity = 1);
    ["#heroSlit", "#heroRole", "#heroTag", "#heroCta", ".scroll-hint", ".nav-bar"].forEach(s => {
      const el = $(s); if (el) el.style.opacity = 1;
    });
    $$(".split-lines").forEach(b => b.querySelectorAll(".line-inner").forEach(l => l.style.transform = "none"));
    $$("[data-reveal]").forEach(el => el.classList.add("is-visible"));
  }

  /* ============================================================
     启动
     ============================================================ */
  function boot() {
    const shards = buildShards();
    setupReveals();
    buildSkills();
    setupProjects();
    setupExperience();
    setupContact();
    setupNav();
    initParticles();

    runPreloader(() => {
      playHero(shards);
      if (HAS_GSAP) ScrollTrigger.refresh();
    });

    // 字体加载后刷新滚动度量
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => HAS_GSAP && ScrollTrigger.refresh());
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
