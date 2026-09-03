const fs = require('fs'); const path = require('path');
const { decode } = require('./pngio.cjs');
const S = p => decode(fs.readFileSync(path.join(__dirname,'shots2',p)));
const hex = (r,g,b)=>`#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
const px=(img,x,y)=>{const i=(y*img.width+x)*4;return [img.data[i],img.data[i+1],img.data[i+2]];};
const s1=S('game-history-1.png'), s2=S('game-history-2.png'), s3=S('game-history-3.png');
console.log('size', s1.width, s1.height);
// find hero panel left/right border on row y=300 (dark border pixels)
function edges(img, y, x0, x1, test){ const xs=[]; for(let x=x0;x<x1;x++){const [r,g,b]=px(img,x,y); if(test(r,g,b)) xs.push(x);} return xs.length?[xs[0],xs[xs.length-1]]:null; }
const dark=(r,g,b)=>r<120&&g<110&&b<100;
console.log('shot1 y300 panel dark cols:', edges(s1,300,150,1300,dark));
// panel bg sample (hero) and page bg
console.log('hero panel bg', hex(...px(s1,700,150)), 'page bg', hex(...px(s1,100,300)));
// card title vs body color (shot2 杀戮尖塔: title y=214, body y=249, x sweep find darkest text px)
function darkest(img,y,x0,x1){let best=[255,255,255],bs=999;for(let x=x0;x<x1;x++){const[r,g,b]=px(img,x,y);const s=r+g+b;if(s<bs){bs=s;best=[r,g,b];}}return best;}
console.log('card title darkest', hex(...darkest(s2,214,738,860)), 'card body darkest', hex(...darkest(s2,249,738,1160)));
// footer divider line (shot3 ~y808): sample colors across
for (const y of [806,808,810,812]) { const [r,g,b]=px(s3,700,y); console.log('shot3 x700 y'+y, hex(r,g,b)); }
// footer top border
for (const y of [758,760,762]) { const [r,g,b]=px(s3,700,y); console.log('shot3 border y'+y, hex(r,g,b)); }
// panel centering shot2: find 深度体验 panel border on y=400
const e2=edges(s2,400,150,1350,dark); console.log('shot2 y400 outer border:', e2, 'center offset:', e2?((e2[0]+(s1.width-17-e2[1]))/2 - e2[0]):null);
// scrollbar width check: sample column x=1440..1455 at y=400 of shot1
let sb=null; for(let x=1430;x<1456;x++){const[r,g,b]=px(s1,x,400); if(r>200&&g>200&&b>200){sb=x;break;}}
console.log('scrollbar light col start', sb, 'img width', s1.width);
// collapsed panel text vertical: find dark rows in shot2 x=230..1240, y=737..812
let rows=[]; for(let y=730;y<820;y++){let c=0;for(let x=225;x<1230;x+=3){const[r,g,b]=px(s2,x,y);if(r+g+b<330)c++;}if(c>2)rows.push(y);}
console.log('collapsed panel text rows', rows[0], '-', rows[rows.length-1]);
