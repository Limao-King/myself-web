// 极简 PNG 解码/编码（仅支持 8bit 无隔行，ct=6/3/2/0），够本项目用。
const zlib = require('zlib');

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};

function decode(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not png');
  let off = 8;
  let w, h, depth, ct, interlace;
  let idat = [];
  let plte = null, trns = null;
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      depth = data[8]; ct = data[9]; interlace = data[12];
    } else if (type === 'PLTE') plte = data;
    else if (type === 'tRNS') trns = data;
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (interlace) throw new Error('interlaced png not supported');
  if (depth !== 8) throw new Error('bit depth ' + depth + ' not supported');
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const ch = ct === 6 ? 4 : ct === 2 ? 3 : ct === 3 ? 1 : 1;
  const stride = w * ch;
  const out = new Uint8Array(w * h * 4); // RGBA
  let prev = new Uint8Array(stride);
  let line = new Uint8Array(stride);
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)];
    for (let i = 0; i < stride; i++) {
      const x = raw[y * (stride + 1) + 1 + i];
      const a = i >= ch ? line[i - ch] : 0;
      const b = prev[i];
      const c = i >= ch ? prev[i - ch] : 0;
      let v;
      switch (filter) {
        case 0: v = x; break;
        case 1: v = x + a; break;
        case 2: v = x + b; break;
        case 3: v = x + ((a + b) >> 1); break;
        case 4: {
          const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default: throw new Error('filter ' + filter);
      }
      line[i] = v & 0xff;
    }
    // 写出该行 RGBA
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      if (ct === 6) {
        out[o] = line[x * 4]; out[o + 1] = line[x * 4 + 1]; out[o + 2] = line[x * 4 + 2]; out[o + 3] = line[x * 4 + 3];
      } else if (ct === 2) {
        out[o] = line[x * 3]; out[o + 1] = line[x * 3 + 1]; out[o + 2] = line[x * 3 + 2]; out[o + 3] = 255;
      } else if (ct === 3) {
        const idx = line[x];
        out[o] = plte[idx * 3]; out[o + 1] = plte[idx * 3 + 1]; out[o + 2] = plte[idx * 3 + 2];
        out[o + 3] = trns && idx < trns.length ? trns[idx] : 255;
      } else {
        out[o] = out[o + 1] = out[o + 2] = line[x]; out[o + 3] = 255;
      }
    }
    const tmp = prev; prev = line; line = tmp;
  }
  return { width: w, height: h, data: out };
}

function encode(img) {
  const { width: w, height: h, data } = img;
  const stride = w * 4;
  const raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter none
    for (let i = 0; i < stride; i++) raw[y * (stride + 1) + 1 + i] = data[y * stride + i];
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const chunk = (type, body) => {
    const b = Buffer.alloc(8 + body.length + 4);
    b.writeUInt32BE(body.length, 0);
    b.write(type, 4, 'ascii');
    body.copy(b, 8);
    b.writeUInt32BE(crc32(b.subarray(4, 8 + body.length)), 8 + body.length);
    return b;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0)),
  ]);
}

module.exports = { decode, encode };
