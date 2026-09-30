declare module 'earthbound-battle-backgrounds' {
  export class BackgroundLayer {
    constructor(id: number);
    overlayFrame(pixels: Uint8ClampedArray, aspectRatio: number, tick: number, alpha: number, erase: boolean): Uint8ClampedArray;
  }
  const library: { BackgroundLayer: typeof BackgroundLayer };
  export default library;
}
