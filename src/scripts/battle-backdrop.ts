import type { BackgroundLayer } from 'earthbound-battle-backgrounds';

// Render original tile/palette/distortion data with the existing library.
// Own the loop so offscreen scenes and loaded media do no background work.
export function initBattleBackdrops() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const states = [...document.querySelectorAll<HTMLElement>('[data-battle-backdrop]')].flatMap(element => {
    const canvas = element.querySelector('canvas');
    const context = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !context) return [];
    context.imageSmoothingEnabled = false;
    return [{ element, context, pixels: context.createImageData(256, 224), layers: [] as BackgroundLayer[], visible: false, tick: 0 }];
  });
  if (!states.length) return;
  let frame = 0;
  let previous = 0;
  let loading: Promise<void> | undefined;
  let suspended = false;
  const active = () => states.filter(state => state.visible && !state.element.closest('[hidden]') && !document.hidden && !suspended);
  const draw = (state: typeof states[number]) => {
    state.layers.forEach((layer, index) => layer.overlayFrame(state.pixels.data, 0, state.tick, .5, index === 0));
    state.context.putImageData(state.pixels, 0, 0);
    state.tick++;
  };
  const tick = (now: number) => {
    const visible = active();
    if (!visible.length || reduced.matches || !visible[0].layers.length) { frame = 0; return; }
    if (now - previous >= 1000 / 30) {
      visible.forEach(draw);
      previous = now;
    }
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    const visible = active();
    if (visible.length && !loading) {
      loading = import('earthbound-battle-backgrounds').then(({ default: library }) => {
        states.forEach(state => {
          const pair = state.element.dataset.battleBackdrop === 'video' ? [83, 270] : [50, 300];
          state.layers = pair.map(id => new library.BackgroundLayer(id));
          draw(state);
          state.element.dataset.ready = 'true';
        });
        sync();
      }).catch(error => { console.error('Battle background could not load', error); });
    }
    states.forEach(state => {
      state.element.dataset.motion = state.layers.length && visible.includes(state) && !reduced.matches ? 'running' : 'still';
    });
    if (reduced.matches || !visible.length) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else if (!frame && visible[0].layers.length) frame = requestAnimationFrame(tick);
  };
  const visibility = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const state = states.find(state => state.element === entry.target);
      if (state) state.visible = entry.isIntersecting;
    });
    sync();
  }, { threshold: .01 });
  states.forEach(state => visibility.observe(state.element));
  const observer = new MutationObserver(sync);
  const television = document.querySelector('[data-home-play]');
  if (television) observer.observe(television, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  window.addEventListener('pagehide', () => { suspended = true; cancelAnimationFrame(frame); frame = 0; });
  window.addEventListener('pageshow', () => { suspended = false; sync(); });
}
