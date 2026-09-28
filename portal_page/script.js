/* ============================================================
   华夏文传 · 交互与动效
   全屏滚动叙事 / 入场动画 / 数字增长 / 案例轮播 / 导航
   ============================================================ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const screens = Array.from(document.querySelectorAll(".screen"));
  const header = document.getElementById("siteHeader");
  const navLinks = Array.from(document.querySelectorAll(".main-nav a[data-nav]"));
  const toTop = document.getElementById("toTop");

  /* ---------- 工具 ---------- */
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  /* ---------- 构建侧边锚点 ---------- */
  const dotLabels = ["宣言", "使命", "矩阵", "案例", "数据", "伙伴", "联系"];
  // 每个锚点一枚独特的华夏印章字：華·道·文·藝·數·盟·聚
  const dotSymbols = ["華", "道", "文", "藝", "數", "盟", "聚"];
  const dotsOl = document.getElementById("sideDots"); // <ol id="sideDots"></ol>
  screens.forEach((s, i) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-label", "跳转到 " + dotLabels[i]);
    btn.dataset.label = dotLabels[i];
    btn.dataset.target = s.id;
    btn.innerHTML = '<span class="dot-glyph">' + dotSymbols[i] + '</span>';
    if (i === 0) btn.classList.add("active");
    btn.addEventListener("click", () => goToScreen(i));
    li.appendChild(btn);
    dotsOl.appendChild(li);
  });
  const dotBtns = Array.from(dotsOl.querySelectorAll("button"));

  /* ---------- 跳转指定屏 ---------- */
  function goToScreen(index) {
    const el = screens[clamp(index, 0, screens.length - 1)];
    if (!el) return;
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  /* ---------- 滚动监听：高亮导航 / 激活屏幕 / 触发动效 ---------- */
  let activeIndex = 0;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          const idx = screens.indexOf(entry.target);
          if (idx !== -1) setActive(idx);
        }
      });
    },
    { root: null, threshold: [0.5, 0.75] }
  );
  screens.forEach((s) => observer.observe(s));

  function setActive(idx) {
    activeIndex = idx;
    screens.forEach((s, i) => s.classList.toggle("is-active", i === idx));
    navLinks.forEach((a, i) => a.classList.toggle("active", i === idx));
    dotBtns.forEach((b, i) => b.classList.toggle("active", i === idx));

    // 深色屏时侧边点与头部适配
    const dark = screens[idx].classList.contains("screen-hero") ||
                 screens[idx].classList.contains("screen-cases") ||
                 screens[idx].classList.contains("screen-contact");
    document.body.classList.toggle("on-dark", dark);

    // 触发该屏入场动画
    triggerReveal(screens[idx]);

    // 数字增长（仅数据屏）
    if (screens[idx].id === "impact") runCounters();

    // 回到顶部按钮
    toTop.hidden = idx === 0;
  }

  /* ---------- 入场动画 ---------- */
  const revealed = new WeakSet();
  function triggerReveal(scope) {
    scope.querySelectorAll("[data-reveal]").forEach((el) => {
      if (!revealed.has(el)) {
        revealed.add(el);
        // 下一帧添加，确保 transition 生效
        requestAnimationFrame(() => el.classList.add("in-view"));
      }
    });
  }

  /* ---------- 数字滚动增长 ---------- */
  const counted = new WeakSet();
  function runCounters() {
    document.querySelectorAll(".num[data-count]").forEach((el) => {
      if (counted.has(el)) return;
      counted.add(el);
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const dur = reduceMotion ? 1 : 1600;
      const start = performance.now();
      function tick(now) {
        const p = clamp((now - start) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target + suffix;
      }
      requestAnimationFrame(tick);
    });
  }

  /* ---------- 键盘导航：上下 / 空格 / PageUp / PageDown ---------- */
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea, select")) return;
    let handled = true;
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); goToScreen(activeIndex + 1); }
    else if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); goToScreen(activeIndex - 1); }
    else if (e.key === "Home") { goToScreen(0); }
    else if (e.key === "End") { goToScreen(screens.length - 1); }
    else handled = false;
    if (handled) closeSearch();
  });

  /* ---------- 滚动进度：头部背景 + 下滚收起/上滚出现 ---------- */
  let lastScrollY = window.scrollY;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 40);

    // 下滚收起导航，上滚（或回到顶部）出现导航
    if (y <= 0) {
      header.classList.remove("nav-hidden");
    } else if (y > lastScrollY && y > var_header_h()) {
      header.classList.add("nav-hidden");      // 向下滚动 → 收起
    } else if (y < lastScrollY) {
      header.classList.remove("nav-hidden");   // 向上滚动 → 出现
    }
    lastScrollY = y;
  }, { passive: true });

  // 读取 CSS 中 --header-h 的像素值作为收起阈值
  function var_header_h() {
    const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h"));
    return isNaN(v) ? 72 : v;
  }

  /* ---------- 导航点击平滑滚动 ---------- */
  navLinks.forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id && id.startsWith("#")) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
        }
      }
    });
  });

  /* ---------- 回到顶部 ---------- */
  toTop.addEventListener("click", () => goToScreen(0));

  /* ---------- 案例轮播 ---------- */
  const caseItems = Array.from(document.querySelectorAll(".case-item"));
  const caseDots = document.getElementById("caseDots");
  let caseIdx = 0;
  caseItems.forEach((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-label", "案例 " + (i + 1));
    if (i === 0) b.classList.add("active");
    b.addEventListener("click", () => showCase(i));
    caseDots.appendChild(b);
  });
  const caseDotBtns = Array.from(caseDots.querySelectorAll("button"));

  function showCase(i) {
    caseIdx = clamp(i, 0, caseItems.length - 1);
    caseItems.forEach((it, k) => { it.hidden = k !== caseIdx; });
    caseDotBtns.forEach((b, k) => b.classList.toggle("active", k === caseIdx));
    // 重新触发切换后案例的入场
    if (!reduceMotion) {
      caseItems[caseIdx].style.animation = "none";
      void caseItems[caseIdx].offsetWidth;
      caseItems[caseIdx].classList.remove("in-view");
      requestAnimationFrame(() => caseItems[caseIdx].classList.add("in-view"));
    }
  }
  document.getElementById("casePrev").addEventListener("click", () => showCase(caseIdx - 1));
  document.getElementById("caseNext").addEventListener("click", () => showCase(caseIdx + 1));

  // 自动轮播（用户在该屏时），可跳过
  let caseTimer = null;
  const startCaseAuto = () => {
    stopCaseAuto();
    if (reduceMotion) return;
    caseTimer = setInterval(() => {
      if (screens[activeIndex] && screens[activeIndex].id === "cases")
        showCase((caseIdx + 1) % caseItems.length);
    }, 5000);
  };
  const stopCaseAuto = () => { if (caseTimer) clearInterval(caseTimer); caseTimer = null; };
  startCaseAuto();
  document.querySelector(".case-showcase").addEventListener("mouseenter", stopCaseAuto);
  document.querySelector(".case-showcase").addEventListener("mouseleave", startCaseAuto);

  /* ---------- 搜索面板 ---------- */
  const searchBtn = document.getElementById("searchBtn");
  const searchPanel = document.getElementById("searchPanel");
  const searchInput = document.getElementById("searchInput");
  const searchSuggest = document.getElementById("searchSuggest");
  const SUGGEST = ["二十四节气", "非遗数字化", "昆曲·牡丹亭", "故宫文创", "敦煌壁画", "城市影像志"];

  function openSearch() {
    searchPanel.hidden = false;
    requestAnimationFrame(() => searchPanel.classList.add("open"));
    searchBtn.setAttribute("aria-expanded", "true");
    setTimeout(() => searchInput.focus(), 250);
  }
  function closeSearch() {
    searchPanel.classList.remove("open");
    searchBtn.setAttribute("aria-expanded", "false");
    setTimeout(() => { searchPanel.hidden = true; }, 300);
  }
  searchBtn.addEventListener("click", () => {
    searchPanel.hidden ? openSearch() : closeSearch();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeSearch(); closeMobileMenu(); }
    if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); openSearch(); }
  });
  document.addEventListener("click", (e) => {
    if (!searchPanel.contains(e.target) && !searchBtn.contains(e.target)) closeSearch();
  });
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim();
    if (!q) { searchSuggest.textContent = "热门：" + SUGGEST.join(" · "); return; }
    const hits = SUGGEST.filter((s) => s.includes(q));
    searchSuggest.textContent = hits.length ? "建议：" + hits.join(" · ") : "未找到相关内容，试试其它关键词";
  });
  searchSuggest.textContent = "热门：" + SUGGEST.join(" · ");
  document.querySelector(".search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = searchInput.value.trim();
    searchSuggest.textContent = q ? "正在为您检索「" + q + "」…（演示）" : "请输入关键词";
  });

  /* ---------- 语言切换（演示） ---------- */
  const langBtn = document.getElementById("langBtn");
  const langSpan = langBtn.querySelector("span");
  let isEN = false;
  const i18n = {
    "文化使命": "Mission", "内容矩阵": "Content", "精品案例": "Cases",
    "数据影响": "Impact", "合作伙伴": "Partners", "加入联系": "Contact",
    "搜索": "Search"
  };
  langBtn.addEventListener("click", () => {
    isEN = !isEN;
    langSpan.textContent = isEN ? "中" : "EN";
    navLinks.forEach((a) => {
      const t = a.textContent.trim();
      a.textContent = isEN ? (i18n[t] || t) : Object.keys(i18n).find((k) => i18n[k] === t) || t;
    });
  });

  /* ---------- 移动端菜单 ---------- */
  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  function closeMobileMenu() {
    mobileMenu.hidden = true;
    menuBtn.setAttribute("aria-expanded", "false");
  }
  menuBtn.addEventListener("click", () => {
    const open = mobileMenu.hidden;
    mobileMenu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  mobileMenu.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id && id.startsWith("#")) {
        const t = document.querySelector(id);
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: "smooth" }); closeMobileMenu(); }
      }
    });
  });

  /* ---------- 联系表单 ---------- */
  const form = document.getElementById("contactForm");
  const formMsg = document.getElementById("formMsg");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.querySelector("#cf-name").value.trim();
    const email = form.querySelector("#cf-email").value.trim();
    if (!name || !email) {
      formMsg.style.color = "#ff9a9a";
      formMsg.textContent = "请填写称呼与联系方式。";
      return;
    }
    formMsg.style.color = "";
    formMsg.textContent = "感谢您的咨询，我们将在 1 个工作日内与您联系。";
    form.reset();
  });

  /* ============================================================
     首屏 Canvas 粒子氛围层
     - 氛围/情绪/叙事层，不抢主角，不遮内容（pointer-events:none，位于内容之下）
     - 丝滑：rAF + DPR 上限 2；克制：低透明度、慢速、弱连线
     - 可降级：粒子数随面积并设上限，FPS<45 自动削减
     - 可关闭：按钮开关 + localStorage 记忆
     - 可监控：内置 FPS 统计（console.info 可选）
     - 尊重 prefers-reduced-motion
     ============================================================ */
  (function initHeroFx() {
    const canvas = document.getElementById("heroCanvas");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const hero = document.getElementById("hero");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0, H = 0, dpr = 1;
    let particles = [], blooms = [];
    let raf = 0, running = false;
    let visible = false;
    let frames = 0, lastFpsT = 0, fps = 60, lowFpsStreak = 0;

    // 粒子氛围常开（无开关 UI），仅在系统减少动态时关闭
    const enabled = true;

    // 鎏金 / 宣纸 / 朱红 / 青绿 —— 呼应品牌色系
    const PALETTE = ["201,169,97", "245,239,226", "193,39,45", "46,92,90"];

    function resize() {
      const rect = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.floor(rect.width));
      H = Math.max(1, Math.floor(rect.height));
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function targetCount() {
      const n = Math.round((W * H) / 16000); // 随面积
      return clamp(n, 26, 90);               // 设上下限
    }

    function seed() {
      const n = targetCount();
      particles = [];
      for (let i = 0; i < n; i++) particles.push(spawn());
    }
    function spawn() {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.5 + Math.random() * 1.7,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        a: 0.12 + Math.random() * 0.32,   // 整体低透明，克制
        tw: Math.random() * Math.PI * 2,   // 呼吸相位
        c: PALETTE[(Math.random() * PALETTE.length) | 0]
      };
    }
    function spawnBloom() {
      blooms.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 8, max: 130 + Math.random() * 160,
        life: 0, dur: 280 + Math.random() * 220,
        c: Math.random() < 0.5 ? "201,169,97" : "245,239,226"
      });
    }

    function step(now) {
      ctx.clearRect(0, 0, W, H); // 透明，透出下层水墨

      // 偶发水墨晕染（极弱、淡入淡出，叙事感）
      if (blooms.length < 2 && Math.random() < 0.004) spawnBloom();
      for (let i = blooms.length - 1; i >= 0; i--) {
        const b = blooms[i];
        b.life++;
        const t = b.life / b.dur;
        if (t >= 1) { blooms.splice(i, 1); continue; }
        b.r = 8 + (b.max - 8) * t;
        const a = Math.sin(t * Math.PI) * 0.06;
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, "rgba(" + b.c + "," + a + ")");
        g.addColorStop(1, "rgba(" + b.c + ",0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      }

      // 粒子 + 局部连线（每点最多连 4 个邻居，距离平方预过滤，避免 O(n²)）
      const LINK_D = 110, LINK_D2 = LINK_D * LINK_D;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.tw += 0.02;
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;

        const alpha = p.a * (0.7 + 0.3 * Math.sin(p.tw));
        ctx.beginPath();
        ctx.fillStyle = "rgba(" + p.c + "," + alpha + ")";
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        let linked = 0;
        for (let j = i + 1; j < particles.length && linked < 4; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK_D2) {
            const o = (1 - Math.sqrt(d2) / LINK_D) * 0.10;
            ctx.strokeStyle = "rgba(201,169,97," + o + ")";
            ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
            linked++;
          }
        }
      }

      // 监控 + 自适应降级
      frames++;
      if (now - lastFpsT >= 1000) {
        fps = Math.round(frames * 1000 / (now - lastFpsT));
        frames = 0; lastFpsT = now;
        if (fps < 45) {
          if (++lowFpsStreak >= 2 && particles.length > 30) trim();
        } else {
          lowFpsStreak = 0;
        }
        if (window.__fxDebug) console.info("[heroFx] fps=" + fps + " particles=" + particles.length);
      }
      raf = requestAnimationFrame(step);
    }

    function trim() {
      particles.length = Math.max(26, Math.round(particles.length * 0.7));
      console.info("[heroFx] 自适应降级，粒子数削减至 " + particles.length);
    }

    function start() {
      if (running) return;
      running = true;
      frames = 0; lastFpsT = performance.now();
      raf = requestAnimationFrame(step);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      ctx.clearRect(0, 0, W, H);
    }

    function shouldRun() { return enabled && !reduceMotion && visible && !document.hidden; }
    function sync() { if (shouldRun()) start(); else stop(); }

    // 仅首屏可见时运行，离开即停（省电）
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { visible = e.isIntersecting; sync(); });
    }, { threshold: 0.05 });
    io.observe(hero);

    document.addEventListener("visibilitychange", sync); // 页签隐藏即停

    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });

    if (reduceMotion) { canvas.style.display = "none"; return; } // 系统减少动态：直接不渲染
    resize();
    visible = true; // 初始即首屏
    sync();
  })();

  /* ---------- 初始化：首屏入场 ---------- */
  window.addEventListener("load", () => {
    setActive(0);
    header.classList.toggle("scrolled", window.scrollY > 40);
  });
  // 兜底：DOM 就绪即激活首屏
  if (document.readyState === "complete") setActive(0);
  else setActive(0);
})();
