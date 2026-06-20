(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Year ── */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ── Mobile nav ── */
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!open));
      navMenu.classList.toggle("open");
    });
    navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navToggle.setAttribute("aria-expanded", "false");
        navMenu.classList.remove("open");
      });
    });
  }

  /* ── Scroll progress ── */
  const progressBar = document.querySelector(".scroll-progress span");
  function updateProgress() {
    if (!progressBar) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = docHeight > 0 ? `${(scrollTop / docHeight) * 100}%` : "0%";
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  /* ── Cursor glow ── */
  const glow = document.querySelector(".cursor-glow");
  if (glow && !prefersReduced && window.matchMedia("(pointer: fine)").matches) {
    let gx = 0, gy = 0;
    document.addEventListener("mousemove", (e) => {
      gx = e.clientX;
      gy = e.clientY;
      glow.style.left = `${gx}px`;
      glow.style.top = `${gy}px`;
    });
  } else if (glow) {
    glow.style.display = "none";
  }

  /* ── Particle canvas ── */
  const canvas = document.getElementById("bg-canvas");
  if (canvas && !prefersReduced) {
    const ctx = canvas.getContext("2d");
    let w, h, particles, mouse = { x: -999, y: -999 };
    const COUNT = 60;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      particles = Array.from({ length: COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5,
      }));
    }

    document.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    function draw() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          p.x -= dx * 0.008;
          p.y -= dy * 0.008;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(110, 231, 183, 0.35)";
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(124, 156, 255, ${0.12 * (1 - d / 130)})`;
            ctx.stroke();
          }
        }
      });
      requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);
  }

  /* ── Typed text ── */
  const typedEl = document.getElementById("typed-text");
  if (typedEl && !prefersReduced) {
    const phrases = [
      "intelligent AI systems",
      "deep learning pipelines",
      "full-stack web apps",
      "data-driven solutions",
    ];
    let pi = 0, ci = 0, deleting = false;

    function type() {
      const current = phrases[pi];
      typedEl.textContent = deleting
        ? current.slice(0, ci--)
        : current.slice(0, ++ci);

      if (!deleting && ci === current.length) {
        deleting = true;
        setTimeout(type, 1800);
        return;
      }
      if (deleting && ci === 0) {
        deleting = false;
        pi = (pi + 1) % phrases.length;
      }
      setTimeout(type, deleting ? 40 : 70);
    }
    type();
  } else if (typedEl) {
    typedEl.textContent = "intelligent AI systems";
    document.querySelector(".typed-cursor")?.remove();
  }

  /* ── Scroll reveal ── */
  const revealEls = document.querySelectorAll(".reveal, .reveal-stagger");
  if ("IntersectionObserver" in window) {
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            revealObs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => revealObs.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  /* ── Nav active section ── */
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-menu a[href^='#']");
  if (sections.length && navLinks.length && "IntersectionObserver" in window) {
    const navObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
          });
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach((s) => navObs.observe(s));
  }

  /* ── Counter animation ── */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const isFloat = target % 1 !== 0;
    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = target * eased;
      el.textContent = isFloat ? val.toFixed(2) : Math.round(val);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    const countObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animateCount(e.target);
            countObs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((c) => countObs.observe(c));
  }

  /* ── GPA rings ── */
  document.querySelectorAll(".gpa-ring").forEach((ring) => {
    const gpa = parseFloat(ring.dataset.gpa);
    const pct = gpa / 4;
    const circumference = 94.2;
    const offset = circumference * (1 - pct);
    const fill = ring.querySelector(".gpa-fill");
    if (fill) fill.style.setProperty("--offset", `${offset}px`);

    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              ring.classList.add("animated");
              fill.style.strokeDashoffset = offset;
              obs.unobserve(ring);
            }
          });
        },
        { threshold: 0.5 }
      );
      obs.observe(ring);
    }
  });

  /* ── Skill bars ── */
  const skillRows = document.querySelectorAll(".skill-row");
  if (skillRows.length && "IntersectionObserver" in window) {
    const barObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const level = e.target.dataset.level;
            e.target.querySelector(".bar-fill")?.style.setProperty("--level", `${level}%`);
            e.target.classList.add("animated");
            barObs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    skillRows.forEach((row) => barObs.observe(row));
  }

  /* ── Hero icon parallax ── */
  const hero = document.querySelector(".hero");
  const floatIcons = document.querySelectorAll(".float-icon");
  if (hero && floatIcons.length && !prefersReduced && window.matchMedia("(pointer: fine)").matches) {
    hero.addEventListener("mousemove", (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      floatIcons.forEach((icon, i) => {
        const depth = (i % 3 + 1) * 6;
        icon.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
      });
    });
    hero.addEventListener("mouseleave", () => {
      floatIcons.forEach((icon) => { icon.style.transform = ""; });
    });
  }

  /* ── 3D card tilt ── */
  if (!prefersReduced && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".card-3d").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.classList.add("is-tilting");
        card.style.transform = `perspective(900px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) translateY(-6px) scale(1.02)`;
        card.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
        card.style.setProperty("--my", `${(y + 0.5) * 100}%`);
      });
      card.addEventListener("mouseleave", () => {
        card.classList.remove("is-tilting");
        card.style.transform = "";
      });
    });
  }

  /* ── Project filters ── */
  const filterBtns = document.querySelectorAll(".filter-btn");
  const projectCards = document.querySelectorAll(".project-card[data-category]");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      filterBtns.forEach((b) => b.classList.toggle("active", b === btn));
      projectCards.forEach((card) => {
        const cats = card.dataset.category.split(" ");
        const show = filter === "all" || cats.includes(filter);
        card.classList.toggle("hidden", !show);
        if (show) {
          card.style.animation = "fadeIn 0.4s ease";
        }
      });
    });
  });

  /* ── Project expand ── */
  document.querySelectorAll(".project-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const extra = btn.nextElementSibling;
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      btn.textContent = open ? "Read more" : "Show less";
      if (extra) extra.hidden = open;
    });
  });

  /* ── Interactive tags tooltip ── */
  document.querySelectorAll(".interactive-tags li[data-tip]").forEach((tag) => {
    tag.title = tag.dataset.tip;
  });

  /* ── Magnetic buttons ── */
  if (!prefersReduced && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".magnetic-btn").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.2}px)`;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "";
      });
    });
  }
})();
