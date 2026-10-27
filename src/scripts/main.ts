import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const $ = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = document) =>
  scope.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = document) =>
  Array.from(scope.querySelectorAll<T>(sel));

let lenis: Lenis | null = null;

/** Odottaa fontteja, mutta korkeintaan `max` ms. */
function fontsReady(max = 900): Promise<void> {
  return Promise.race([
    document.fonts.ready.then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, max)),
  ]);
}

// ── Pehmeä vieritys ─────────────────────────────────────────────────────────
function initLenis() {
  lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4) });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function scrollToTarget(target: HTMLElement | number) {
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.4 });
  } else if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: reduceMotion ? 'auto' : 'smooth' });
  } else {
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }
}

// ── Ylätunniste, valikko ja ankkurilinkit ───────────────────────────────────
function initHeader() {
  const header = $('[data-header]');
  const toggle = $<HTMLButtonElement>('[data-menu-toggle]');
  const menu = $('[data-menu]');

  let lastY = window.scrollY;
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = window.scrollY;
    header?.classList.toggle('header--scrolled', y > 24);
    if (!root.classList.contains('menu-open')) {
      const down = y > lastY + 4;
      const up = y < lastY - 4;
      if (down && y > 480) header?.classList.add('header--hidden');
      else if (up || y < 480) header?.classList.remove('header--hidden');
    }
    lastY = y;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true },
  );
  onScroll();

  // Mobiilivalikko
  let closeTimer = 0;
  const setMenu = (open: boolean) => {
    if (!toggle || !menu) return;
    window.clearTimeout(closeTimer);
    toggle.setAttribute('aria-expanded', String(open));
    const label = toggle.querySelector('.sr-only');
    if (label) label.textContent = open ? 'Sulje valikko' : 'Avaa valikko';
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('menu-open')));
      lenis?.stop();
      $<HTMLAnchorElement>('a', menu)?.focus({ preventScroll: true });
    } else {
      root.classList.remove('menu-open');
      lenis?.start();
      closeTimer = window.setTimeout(() => (menu.hidden = true), reduceMotion ? 0 : 800);
    }
  };
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('menu-open')) {
      setMenu(false);
      toggle?.focus();
    }
  });
  window.matchMedia('(min-width: 960px)').addEventListener('change', (e) => e.matches && setMenu(false));

  // Ankkurilinkit pehmeällä vierityksellä
  document.addEventListener('click', (e) => {
    const link = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href')!.slice(1);
    const target = id === 'top' ? null : document.getElementById(id);
    if (id !== 'top' && !target) return;
    e.preventDefault();
    if (root.classList.contains('menu-open')) setMenu(false);
    scrollToTarget(target ?? 0);
    history.replaceState(null, '', `#${id}`);
    if (target) {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });

  // Aktiivinen valikkolinkki
  const links = $$<HTMLAnchorElement>('.nav__link');
  const sections = links
    .map((l) => document.getElementById(l.hash.slice(1)))
    .filter((s): s is HTMLElement => !!s);
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) =>
          l.hash === `#${entry.target.id}`
            ? l.setAttribute('aria-current', 'true')
            : l.removeAttribute('aria-current'),
        );
      });
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  sections.forEach((s) => io.observe(s));
}

// ── Avajaislaskuri ──────────────────────────────────────────────────────────
function initCountdown() {
  const el = $('[data-countdown]');
  if (!el) return;
  const target = new Date(el.dataset.target ?? '').getTime();
  if (Number.isNaN(target)) return;

  const setOpen = () => {
    $$('[data-cd-soon]', el).forEach((n) => n.remove());
    $$('[data-cd-open]', el).forEach((n) => (n.hidden = false));
  };
  if (Date.now() >= target) {
    setOpen();
    return;
  }
  $$('[data-cd-open]', el).forEach((n) => n.remove());

  const fields = {
    days: $('[data-cd="days"]', el),
    hours: $('[data-cd="hours"]', el),
    minutes: $('[data-cd="minutes"]', el),
    seconds: $('[data-cd="seconds"]', el),
  };

  const setField = (field: HTMLElement | null, value: string, animate: boolean) => {
    if (!field) return;
    let digits = $$('.cd-digit', field);
    if (digits.length !== value.length) {
      field.textContent = '';
      digits = value.split('').map(() => {
        const d = document.createElement('span');
        d.className = 'cd-digit';
        d.appendChild(document.createElement('span'));
        field.appendChild(d);
        return d;
      });
      animate = false;
    }
    value.split('').forEach((ch, i) => {
      const digit = digits[i];
      const current = digit.lastElementChild as HTMLElement;
      if (current.textContent === ch) return;
      if (!animate || reduceMotion) {
        current.textContent = ch;
        return;
      }
      const next = document.createElement('span');
      next.textContent = ch;
      digit.appendChild(next);
      gsap.set(current, { position: 'absolute', top: '0.05em', left: 0 });
      gsap.to(current, { yPercent: -100, duration: 0.6, ease: 'expo.inOut', onComplete: () => current.remove() });
      gsap.fromTo(next, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: 'expo.inOut' });
    });
  };

  let timer = 0;
  const render = (animate: boolean) => {
    const diff = Math.max(0, target - Date.now());
    const s = Math.floor(diff / 1000);
    setField(fields.days, String(Math.floor(s / 86400)).padStart(2, '0'), animate);
    setField(fields.hours, String(Math.floor((s % 86400) / 3600)).padStart(2, '0'), animate);
    setField(fields.minutes, String(Math.floor((s % 3600) / 60)).padStart(2, '0'), animate);
    setField(fields.seconds, String(s % 60).padStart(2, '0'), animate);
    if (diff <= 0) {
      window.clearInterval(timer);
      window.setTimeout(() => window.location.reload(), 1500);
    }
  };
  render(false);
  timer = window.setInterval(() => render(true), 1000);
}

// ── Hinnaston koko-välilehdet ───────────────────────────────────────────────
function initPricing() {
  const scope = $('[data-pricing]');
  if (!scope) return;
  const tabs = $$<HTMLButtonElement>('[role="tab"]', scope);
  const indicator = $('[data-tabs-indicator]', scope);
  const panel = $('[role="tabpanel"]', scope);
  const rows = $$('[data-prices]', scope);
  let currentIndex = 0;

  const select = (index: number, focus = false) => {
    if (index === currentIndex) return;
    const dir = index > currentIndex ? 1 : -1;
    currentIndex = index;
    const tab = tabs[index];
    const size = tab.dataset.size!;
    tabs.forEach((t, i) => {
      t.setAttribute('aria-selected', String(i === index));
      t.tabIndex = i === index ? 0 : -1;
    });
    if (focus) tab.focus();
    if (indicator) indicator.style.transform = `translateX(${index * 100}%)`;
    panel?.setAttribute('aria-labelledby', tab.id);

    rows.forEach((row) => {
      const num = $('[data-price-num]', row);
      const prices = JSON.parse(row.dataset.prices ?? '{}') as Record<string, number>;
      const to = prices[size];
      if (!num || to === undefined) return;
      if (reduceMotion) {
        num.textContent = String(to);
        return;
      }
      const counter = { v: Number(num.textContent) || 0 };
      gsap.to(counter, {
        v: to,
        duration: 0.9,
        ease: 'power3.out',
        onUpdate: () => (num.textContent = String(Math.round(counter.v))),
      });
    });
    if (!reduceMotion) {
      gsap.fromTo(
        rows,
        { x: 14 * dir, opacity: 0.35 },
        { x: 0, opacity: 1, duration: 0.7, stagger: 0.045, ease: 'expo.out', overwrite: true },
      );
    }
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (e) => {
      const keys: Record<string, number> = {
        ArrowRight: (i + 1) % tabs.length,
        ArrowLeft: (i - 1 + tabs.length) % tabs.length,
        Home: 0,
        End: tabs.length - 1,
      };
      if (e.key in keys) {
        e.preventDefault();
        select(keys[e.key], true);
      }
    });
  });
}

// ── Ennen / jälkeen -liukusäädin ────────────────────────────────────────────
function initBeforeAfter() {
  $$('[data-ba]').forEach((ba) => {
    const range = $<HTMLInputElement>('[data-ba-range]', ba);
    const state = { pos: 50 };
    const apply = () => {
      ba.style.setProperty('--pos', `${state.pos}%`);
      if (range) range.value = String(Math.round(state.pos));
    };
    const fromPointer = (e: PointerEvent) => {
      const rect = ba.getBoundingClientRect();
      gsap.killTweensOf(state);
      state.pos = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
      apply();
    };

    let dragging = false;
    ba.addEventListener('pointerdown', (e) => {
      dragging = true;
      ba.setPointerCapture(e.pointerId);
      fromPointer(e);
    });
    ba.addEventListener('pointermove', (e) => dragging && fromPointer(e));
    const stop = () => (dragging = false);
    ba.addEventListener('pointerup', stop);
    ba.addEventListener('pointercancel', stop);
    range?.addEventListener('input', () => {
      gsap.killTweensOf(state);
      state.pos = Number(range.value);
      apply();
    });

    // Pieni vihje liikkeestä, kun säädin tulee näkyviin
    if (!reduceMotion) {
      gsap
        .timeline({ scrollTrigger: { trigger: ba, start: 'top 70%', once: true }, onUpdate: apply })
        .to(state, { pos: 28, duration: 0.9, ease: 'power2.inOut' })
        .to(state, { pos: 68, duration: 1.1, ease: 'power2.inOut' })
        .to(state, { pos: 50, duration: 0.8, ease: 'power2.out' });
    }
  });
}

// ── Kursori ja magneettiset painikkeet ──────────────────────────────────────
function initCursor() {
  const cursor = $('[data-cursor]');
  const label = $('[data-cursor-label]');
  if (!cursor || !label) return;
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.45, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.45, ease: 'power3' });

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      root.classList.add('cursor-on');
      xTo(e.clientX);
      yTo(e.clientY);
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => root.classList.remove('cursor-on'));

  document.addEventListener('pointerover', (e) => {
    const t = e.target as Element;
    const labelled = t.closest<HTMLElement>('[data-cursor-label]');
    if (labelled) {
      label.textContent = labelled.dataset.cursorLabel ?? '';
      cursor.classList.add('cursor--label');
      cursor.classList.remove('cursor--hover');
      return;
    }
    cursor.classList.remove('cursor--label');
    cursor.classList.toggle('cursor--hover', !!t.closest('a, button, [data-cursor-hover], [role="tab"]'));
  });
}

function initMagnetic() {
  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.36);
    });
    el.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}

// ── Esilataus ja hero-intro ─────────────────────────────────────────────────
function heroIntro() {
  const hero = $('[data-hero-section]');
  if (!hero) return gsap.timeline();
  const dog = $('[data-hero-dog]', hero);
  const dogImg = $('img', hero);
  const letters = $$('.hero__letter', hero);
  const rules = $$('.hero__rule', hero);
  const script = $('.hero__script', hero);
  const paw = $('.hero__paw', hero);
  const floats = $$('.hero__float', hero);
  const halo = $('[data-hero-halo]', hero);
  const rest = $$('.hero__badge, .hero__lead, .hero__ctas, .hero__scroll', hero);

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, paused: true });
  tl.fromTo(halo, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 2.2 }, 0)
    .fromTo(
      dog,
      { opacity: 1, clipPath: 'circle(0% at 50% 62%)' },
      { opacity: 1, clipPath: 'circle(75% at 50% 50%)', duration: 1.6, ease: 'expo.inOut', clearProps: 'clipPath' },
      0,
    )
    .fromTo(dogImg, { scale: 1.3, y: 40 }, { scale: 1, y: 0, duration: 2 }, 0.1)
    .fromTo(
      letters,
      { opacity: 0, yPercent: 80, filter: 'blur(10px)' },
      { opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: 1.1, stagger: 0.045 },
      0.75,
    )
    .fromTo(rules, { opacity: 1, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 1.3, ease: 'expo.inOut' }, 0.95)
    .fromTo(
      script,
      { opacity: 1, clipPath: 'inset(-30% 100% -30% -10%)' },
      { opacity: 1, clipPath: 'inset(-30% -10% -30% -10%)', duration: 1.5, ease: 'power2.inOut' },
      1.05,
    )
    .fromTo(
      paw,
      { opacity: 0, scale: 0, rotate: -50 },
      { opacity: 1, scale: 1, rotate: 0, duration: 0.9, ease: 'back.out(3)' },
      2.0,
    )
    .fromTo(rest, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.09 }, 1.6)
    .fromTo(
      floats,
      { opacity: 0, scale: 0.4 },
      { opacity: 0.55, scale: 1, duration: 1.2, stagger: 0.07, ease: 'back.out(2)' },
      1.4,
    )
    .add(() => {
      // Koiranpää kelluu kevyesti intron jälkeen
      if (dogImg) gsap.to(dogImg, { y: -10, duration: 3.2, ease: 'sine.inOut', repeat: -1, yoyo: true });
      floats.forEach((f, i) =>
        gsap.to(f, {
          y: i % 2 ? 14 : -14,
          rotate: `+=${i % 2 ? 8 : -8}`,
          duration: 3 + i * 0.4,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        }),
      );
    });
  return tl;
}

async function runIntro() {
  const intro = heroIntro();
  const pre = $('[data-preloader]');
  const showPreloader = !!pre && getComputedStyle(pre).display !== 'none';
  root.classList.add('anim-ready');

  if (!showPreloader) {
    pre?.remove();
    await fontsReady(700);
    intro.play();
    return;
  }

  try {
    sessionStorage.setItem('costa-intro', '1');
  } catch {
    /* yksityinen selaus */
  }
  lenis?.stop();
  if (!window.location.hash) window.scrollTo(0, 0);
  const paws = $$('.preloader__paw', pre);
  const word = $('.preloader__word', pre);
  const bar = $('.preloader__bar span', pre);

  const tl = gsap.timeline({
    onComplete: () => {
      pre.remove();
      lenis?.start();
    },
  });
  tl.fromTo(paws, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.17, ease: 'back.out(2.4)' })
    .to(bar, { scaleX: 1, duration: 1.2, ease: 'power2.inOut' }, 0)
    .to(word, { clipPath: 'inset(-30% -10% -30% -10%)', duration: 0.9, ease: 'power2.inOut' }, 0.45)
    .to(paws, { opacity: 0, y: -10, duration: 0.4, stagger: 0.05, ease: 'power2.in' }, '+=0.15')
    .to(pre, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '-=0.15')
    .add(() => {
      intro.play();
    }, '-=0.55');
}

// ── Vierityksen animaatiot ──────────────────────────────────────────────────
function initScrollAnimations() {
  // Otsikot rivi kerrallaan maskin takaa
  $$('[data-split]').forEach((el) => {
    if (el.closest('[hidden]')) return;
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 110,
          duration: 1.25,
          stagger: 0.1,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }),
    });
  });

  $$('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 40,
      opacity: 0,
      duration: 1.2,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  $$('[data-reveal-stagger]').forEach((el) => {
    gsap.from(el.children, {
      y: 50,
      opacity: 0,
      duration: 1.2,
      stagger: 0.09,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  // Ikonit piirtyvät näkyviin
  $$('[data-draw]').forEach((el) => {
    const shapes = $$<SVGGeometryElement>('path, circle, ellipse, rect', el);
    shapes.forEach((s) => {
      const len = s.getTotalLength();
      gsap.set(s, { strokeDasharray: len, strokeDashoffset: len });
    });
    gsap.to(shapes, {
      strokeDashoffset: 0,
      duration: 1.6,
      stagger: 0.08,
      ease: 'power2.inOut',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  // Hero: logo liukuu ja himmenee vieritettäessä, hiiri liikuttaa syvyyksiä
  const hero = $('[data-hero-section]');
  if (hero) {
    gsap.to('.hero__inner', {
      yPercent: 18,
      opacity: 0.15,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('.hero__scroll', {
      autoAlpha: 0,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: '20% top', scrub: true },
    });
    gsap.to('[data-hero-halo]', {
      scale: 1.25,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });

    if (finePointer) {
      // Koiranpää liikkuu molemmilla akseleilla; tassujen y on jo kellunnan käytössä
      const dog = $('[data-parallax-dog]', hero);
      const dogX = dog && gsap.quickTo(dog, 'x', { duration: 1.2, ease: 'power3' });
      const dogY = dog && gsap.quickTo(dog, 'y', { duration: 1.2, ease: 'power3' });
      const floats = $$('.hero__float', hero).map((el) => ({
        x: gsap.quickTo(el, 'x', { duration: 1.4, ease: 'power3' }),
        depth: Number(el.dataset.depth) || 1,
      }));
      hero.addEventListener('pointermove', (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        dogX?.(nx * 16);
        dogY?.(ny * 10);
        floats.forEach((f) => f.x(nx * -36 * f.depth));
      });
    }
  }

  // Marquee: jatkuva liike, joka kiihtyy ja kääntyy vierityksen mukaan
  const track = $('[data-marquee-track]');
  if (track) {
    const loop = gsap.to(track, { xPercent: -50, duration: 32, ease: 'none', repeat: -1 });
    let dir = 1;
    ScrollTrigger.create({
      trigger: track,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        dir = self.direction;
        const boost = Math.min(5, 1 + Math.abs(self.getVelocity()) / 400);
        gsap.to(loop, { timeScale: dir * boost, duration: 0.2, overwrite: true });
        gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.25, ease: 'power2.out' });
      },
    });
  }

  // Meistä: kuvan maskipaljastus, parallaksi, pyörivä merkki, laskurit
  $$('[data-mask-reveal]').forEach((el) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 80%', once: true } });
    tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' }).fromTo(
      $('img', el),
      { scale: 1.3 },
      { scale: 1, duration: 2, ease: 'expo.out' },
      0.2,
    );
  });

  $$('[data-parallax]').forEach((el) => {
    const amount = Number(el.dataset.parallax) || 8;
    gsap.fromTo(
      el,
      { yPercent: -amount },
      {
        yPercent: amount,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });

  $$('[data-spin]').forEach((el) => {
    const svg = $('svg', el);
    if (!svg) return;
    const spin = gsap.to(svg, { rotate: 360, duration: 22, ease: 'none', repeat: -1 });
    ScrollTrigger.create({
      trigger: el,
      onUpdate: (self) => {
        gsap.to(spin, { timeScale: 1 + Math.min(6, Math.abs(self.getVelocity()) / 250), duration: 0.2, overwrite: true });
        gsap.to(spin, { timeScale: 1, duration: 1.4, delay: 0.2 });
      },
    });
    gsap.from(el, {
      scale: 0,
      rotate: -90,
      duration: 1.4,
      ease: 'back.out(1.6)',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
    });
  });

  $$('[data-count]').forEach((el) => {
    const to = Number(el.dataset.count);
    const counter = { v: to === 0 ? 10 : 0 };
    el.textContent = String(counter.v);
    gsap.to(counter, {
      v: to,
      duration: 2,
      ease: 'power2.out',
      onUpdate: () => (el.textContent = String(Math.round(counter.v))),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  // Käynnin kulku: viiva täyttyy ja tassu kävelee vierityksen mukana
  const process = $('[data-process]');
  if (process) {
    const fill = $('[data-process-fill]', process);
    const walker = $('[data-process-walker]', process);
    const stepsEls = $$('[data-step]', process);
    const mm = gsap.matchMedia();
    mm.add({ desktop: '(min-width: 900px)', mobile: '(max-width: 899.98px)' }, (ctx) => {
      const desktop = ctx.conditions?.desktop;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: $('.steps', process),
          start: 'top 75%',
          end: desktop ? 'bottom 55%' : 'bottom 65%',
          scrub: 0.6,
          onUpdate: (self) => {
            const active = Math.floor(self.progress * stepsEls.length + 0.15);
            stepsEls.forEach((s, i) => s.classList.toggle('is-active', i < active || (i === 0 && self.progress > 0.02)));
          },
        },
      });
      tl.fromTo(fill, desktop ? { scaleX: 0 } : { scaleY: 0 }, desktop ? { scaleX: 1, ease: 'none' } : { scaleY: 1, ease: 'none' }, 0)
        .fromTo(walker, { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0)
        .fromTo(walker, desktop ? { left: '0%' } : { top: '0%' }, desktop ? { left: '100%', ease: 'none' } : { top: '100%', ease: 'none' }, 0);
    });
  }

  // Galleria: kiinnitetty vaakavieritys isoilla näytöillä
  const hscroll = $('[data-hscroll]');
  const hTrack = $('[data-hscroll-track]');
  if (hscroll && hTrack) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      root.classList.add('hscroll-on');
      const distance = () => Math.max(0, hTrack.scrollWidth - window.innerWidth);
      const tween = gsap.to(hTrack, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: hscroll,
          start: 'center center',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });
      $$('.card', hTrack).forEach((card) => {
        gsap.fromTo(
          card,
          { rotate: 1.5, y: 24 },
          {
            rotate: -1.5,
            y: -24,
            ease: 'none',
            scrollTrigger: {
              trigger: card,
              containerAnimation: tween,
              start: 'left right',
              end: 'right left',
              scrub: true,
            },
          },
        );
      });
      return () => root.classList.remove('hscroll-on');
    });
  }

  // Alatunnisteen "Costa" kirjoittuu esiin
  const footerScript = $('.footer__script');
  if (footerScript) {
    gsap.fromTo(
      footerScript,
      { clipPath: 'inset(-30% 100% -30% -10%)' },
      {
        clipPath: 'inset(-30% -10% -30% -10%)',
        duration: 1.8,
        ease: 'power2.inOut',
        scrollTrigger: { trigger: footerScript, start: 'top 90%', once: true },
      },
    );
  }

  fontsReady(2500).then(() => ScrollTrigger.refresh());
}

// ── Käynnistys ──────────────────────────────────────────────────────────────
try {
  initCountdown();
  initPricing();
  initBeforeAfter();
  if (!reduceMotion) initLenis();
  initHeader();
  if (!reduceMotion) {
    if (finePointer) {
      initCursor();
      initMagnetic();
    }
    initScrollAnimations();
    runIntro();
  } else {
    $('[data-preloader]')?.remove();
    root.classList.add('anim-ready');
  }
} catch (err) {
  root.classList.add('anim-failsafe');
  console.error(err);
}
