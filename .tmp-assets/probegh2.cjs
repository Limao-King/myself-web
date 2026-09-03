const fs = require('fs'); const path = require('path');
const { decode } = require('./pngio.cjs');
const S = p => decode(fs.readFileSync(path.join(__dirname,'shots2',p)));
const hex = (r,g,b)=>`#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
const px=(img,x,y)=>{const i=(y*img.width+x)*4;return [img.data[i],img.data[i+1],img.data[i+2]];};
const s1=S('game-history-1.png'), s3=S('game-history-3.png'), d1=S('docs-1.png');
console.log('--- top band shot1: x700 y0..30');
for(let y=0;y<=30;y+=3) console.log(y, hex(...px(s1,700,y)));
console.log('--- nav bg', hex(...px(s1,700,40)));
console.log('--- dock bottom shot3: x700 y885..899');
for(let y=884;y<900;y+=2) console.log(y, hex(...px(s3,700,y)));
console.log('--- dock top edge shot3 x=660..760 y=884:', hex(...px(s3,700,884)));
console.log('--- copyright text color darkest y845..850 x540..620');
let best=[255,255,255],bs=1e9; for(let y=842;y<852;y++)for(let x=540;x<640;x++){const[r,g,b]=px(s3,x,y);const s=r+g+b;if(s<bs){bs=s;best=[r,g,b];}}
console.log(hex(...best));
console.log('--- footer bg', hex(...px(s3,300,850)), 'content bg', hex(...px(s3,300,700)));
console.log('--- docs-1 dock for comparison x700 bottom rows');
for(let y=884;y<900;y+=3) console.log(y, hex(...px(d1,700,y)));
console.log('--- 图鉴 subtitle color', (()=>{let b=[255,255,255],bs=1e9;for(let y=790;y<800;y++)for(let x=225;x<340;x++){const[r,g,bb]=px(s3,x,y);const s=r+g+bb;if(s<bs){bs=s;b=[r,g,bb];}}return hex(...b);})());
