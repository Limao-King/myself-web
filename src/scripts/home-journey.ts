import { ScrollGesture } from './scroll-gesture.mjs';

export function initHomeJourney() {
  const root = document.documentElement;
  const scenes = [...document.querySelectorAll<HTMLElement>('[data-home-scene]')];
  const header = document.querySelector<HTMLElement>('.pf-header');
  const nav = document.querySelector<HTMLElement>('[data-scene-nav]');
  if (!root.classList.contains('pf-homepage') || !header || !scenes.length) return;
  const desktop = matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const gesture = new ScrollGesture();
  const buttons = [...(nav?.querySelectorAll<HTMLButtonElement>('[data-scene-go]') ?? [])];
  let enabled = false;
  let points: number[] = [];
  let active = 0;
  let targetIndex = 0;
  let frame = 0;
  let layoutFrame = 0;
  let pendingDirection = 0;

  const nearest = () => points.reduce((best, point, i) => Math.abs(point - scrollY) < Math.abs(points[best] - scrollY) ? i : best, 0);
  // 瞬时定位：分页模式下 CSS `scroll-behavior` 已置 auto，这里再显式要求 instant。
  // 少数旧引擎的 ScrollBehavior 枚举没有 'instant'（会抛 TypeError），一旦抛在 rAF 回调里，
  // frame 会残留为非 0 ⇒ 分页逻辑卡死；故给一次性兜底。
  const setScrollTop = (top: number) => {
    try {
      window.scrollTo({ top, behavior: 'instant' as ScrollBehavior });
    } catch {
      const scroller = document.scrollingElement;
      if (scroller) scroller.scrollTop = top;
      else window.scrollTo(0, top);
    }
  };
  const paint = (index: number) => {
    active = index;
    root.dataset.homeCurrent = scenes[index].dataset.homeScene;
    buttons.forEach((button, i) => {
      if (i === index) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  };
  const cancel = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    pendingDirection = 0;
    delete root.dataset.homeScrolling;
  };
  const go = (index: number, immediate = false) => {
    cancel();
    targetIndex = Math.max(0, Math.min(points.length - 1, index));
    const from = scrollY;
    const to = points[targetIndex];
    if (immediate || reduced.matches || Math.abs(to - from) < 1) {
      setScrollTop(to);
      paint(targetIndex);
      return;
    }
    root.dataset.homeScrolling = 'true';
    const started = performance.now();
    const duration = Math.min(520, Math.max(360, Math.abs(to - from) * .55));
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      // A single animation owns the scroll; browser CSS smoothing is disabled in paging mode.
      setScrollTop(from + (to - from) * (1 - (1 - t) ** 3));
      if (t < 1) frame = requestAnimationFrame(step);
      else {
        frame = 0;
        delete root.dataset.homeScrolling;
        paint(targetIndex);
        const queued = pendingDirection;
        pendingDirection = 0;
        if (queued) go(targetIndex + queued);
      }
    };
    frame = requestAnimationFrame(step);
  };
  const advance = (direction: number) => {
    // The contact footer scrolls freely; coming back first lands on the town.
    if (!frame && direction < 0 && scrollY > points[points.length - 1] + 2) {
      go(points.length - 1);
      return;
    }
    if (frame) {
      // A reversal responds immediately. One distinct new forward gesture can queue.
      if (direction !== Math.sign(points[targetIndex] - scrollY)) go(targetIndex + direction);
      else pendingDirection = direction;
      return;
    }
    go(nearest() + direction);
  };
  const measure = () => {
    layoutFrame = 0;
    const wasEnabled = enabled;
    const oldScene = active;
    cancel();
    gesture.reset();
    const headerHeight = Math.ceil(header.getBoundingClientRect().height);
    root.style.setProperty('--home-header-height', `${headerHeight}px`);
    const room = innerHeight - headerHeight;
    // Never turn a taller-than-screen story into an inaccessible fixed frame.
    enabled = desktop.matches && !reduced.matches && scenes.every(scene => scene.offsetHeight <= room + 2);
    root.dataset.homePaging = enabled ? 'on' : 'off';
    if (nav) nav.hidden = !enabled;
    const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    points = scenes.map(scene => Math.max(0, Math.min(max, Math.round(scene.getBoundingClientRect().top + scrollY - headerHeight))));
    if (wasEnabled && enabled) go(oldScene, true);
    else paint(nearest());
  };
  const scheduleMeasure = () => {
    if (!layoutFrame) layoutFrame = requestAnimationFrame(measure);
  };
  const nestedScroll = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    if (target.closest('iframe, dialog, [data-native-scroll]')) return true;
    for (let node: Element | null = target; node && node !== document.body; node = node.parentElement) {
      if (node.scrollHeight > node.clientHeight + 2 && /^(auto|scroll)$/.test(getComputedStyle(node).overflowY)) return true;
    }
    return false;
  };
  window.addEventListener('wheel', event => {
    if (!enabled || event.ctrlKey || event.metaKey || !event.cancelable || nestedScroll(event.target)) return;
    if (!event.deltaY || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
    const direction = Math.sign(event.deltaY);
    const index = frame ? targetIndex : nearest();
    if (!frame && (index === 0 && direction < 0 || index === scenes.length - 1 && direction > 0)) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    const intent = gesture.accept(event.deltaY * unit, performance.now());
    if (intent) advance(intent);
  }, { passive: false });
  window.addEventListener('keydown', event => {
    if (!enabled || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target instanceof Element && event.target.closest('input, textarea, select, button, [contenteditable="true"], [role="slider"]')) return;
    const direction = event.key === 'PageDown' || event.key === ' ' && !event.shiftKey ? 1 : event.key === 'PageUp' || event.key === ' ' && event.shiftKey ? -1 : 0;
    if (direction || event.key === 'Home' || event.key === 'End') {
      if (direction > 0 && !frame && nearest() === scenes.length - 1) return;
      event.preventDefault();
      gesture.reset();
      if (direction) advance(direction);
      else go(event.key === 'Home' ? 0 : scenes.length - 1);
    }
  });
  const sceneForHash = (hash: string) => {
    let id: string;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return -1; }
    if (id === 'main') return 0;
    const element = document.getElementById(id);
    return element ? scenes.findIndex(scene => scene === element || scene.contains(element)) : -1;
  };
  document.addEventListener('click', event => {
    if (!enabled || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
    if (!link) return;
    const hash = link.getAttribute('href') ?? '';
    const index = sceneForHash(hash);
    if (index < 0) return;
    event.preventDefault();
    gesture.reset();
    history.pushState(null, '', hash);
    go(index);
  });
  buttons.forEach((button, i) => button.addEventListener('click', () => { gesture.reset(); go(i); }));
  window.addEventListener('scroll', () => { if (!frame && points.length) paint(nearest()); }, { passive: true });
  window.addEventListener('pointerdown', cancel, { passive: true });
  window.addEventListener('resize', scheduleMeasure, { passive: true });
  window.addEventListener('hashchange', () => {
    const index = sceneForHash(location.hash);
    if (enabled && index >= 0) go(index);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancel(); gesture.reset(); } });
  desktop.addEventListener('change', scheduleMeasure);
  reduced.addEventListener('change', scheduleMeasure);
  const observer = new ResizeObserver(scheduleMeasure);
  observer.observe(header);
  scenes.forEach(scene => observer.observe(scene));
  measure();
  document.fonts.ready.then(scheduleMeasure);
}
