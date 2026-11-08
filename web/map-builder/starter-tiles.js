/** Original, generated starter pixel-art atlas. No third-party assets or attribution required. */
export const STARTER_NAMES = [
  'Grass','Grass variation','Dirt path','Stone floor','Sand','Deep water','Shallow water','Dark ground',
  'Stone wall','Wood floor','Brick wall','Flower patch','Tree','Bush','Rock','Chest',
  'Fence','Weeds','Wildflowers','Steps','Roof','Door','Bed','Table',
  'Mossy stone','Cobblestone','Tilled soil','Wood bridge','Torch','Sign','Crate','Spawn marker'
];
const BASE = ['#57965d','#4e915e','#a97a4e','#9297a0','#d8bc7d','#3371ae','#4d9fc2','#393e4d','#69717a','#8b603d','#9c665c','#568e4c'];
function pseudo(x,y,index) {let n = (x * 137 + y * 71 + index * 149 + 23417) | 0; n ^= n << 13; n ^= n >>> 17; n ^= n << 5; return (n >>> 0) / 4294967295;}
export function createStarterAtlas(size = 32) {
  const canvas = document.createElement('canvas');
  canvas.width = 8 * size; canvas.height = 4 * size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.scale(size / 32, size / 32);
  const fill = (x,y,w,h,c) => {ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
  for (let i=0;i<32;i++) {
    const ox = i%8*32, oy=Math.floor(i/8)*32;
    ctx.save();ctx.translate(ox,oy);
    const transparent = [12,13,14,15,16,17,18,28,29,30,31].includes(i);
    if (!transparent) {
      fill(0,0,32,32,BASE[i] || ['#6a7c61','#818583','#886344','#956d44','#774b40','#604d44','#9e744e','#80583b'][i-24]);
      for (let y=2;y<32;y+=5) for(let x=1;x<32;x+=6) {
        const r=pseudo(x,y,i);
        if(r>.58) fill(x+(r*3|0),y,2+(r*3|0),2, r>.78?'#ffffff1c':'#00000022');
      }
    }
    if (i===2||i===26) for(let y=3;y<32;y+=8) fill((y*7)%27,y,10,3,i===2?'#bf9565':'#6c4c32');
    if (i===3||i===24||i===25) {
      for(let x=0;x<32;x+=16)fill(x,0,1,32,'#4b5357');
      for(let y=0;y<32;y+=16)fill(0,y,32,1,'#4b5357');
    }
    if (i===5||i===6) for(let y=5;y<32;y+=11)fill((y*13)%23,y,9,2,'#86dbf488');
    if (i===8||i===10) {for(let y=7;y<32;y+=11){fill(0,y,32,2,'#303842');for(let x=(y%2)*10;x<32;x+=19)fill(x,y-7,2,7,'#343b43');}}
    if (i===9||i===27) for(let x=1;x<32;x+=8) fill(x,0,2,32,'#50371f');
    if (i===11||i===18) for(let k=0;k<7;k++){const x=(k*11+4)%29,y=(k*17+3)%27;fill(x,y,4,4,k%2?'#fff0a0':'#ea7699');}
    if(i===12){fill(13,18,7,13,'#704d31');fill(8,8,17,17,'#366949');fill(4,10,14,14,'#498958');fill(11,2,16,17,'#5b9e64');fill(19,14,11,10,'#2f744a');}
    if(i===13||i===17){fill(3,14,25,14,'#275b40');fill(6,9,20,16,i===13?'#4c9555':'#648949');fill(11,4,12,13,'#70a95b');}
    if(i===14){fill(5,18,25,11,'#565e68');fill(8,11,19,14,'#899099');fill(12,9,12,4,'#aab1b6');}
    if(i===15||i===30){fill(6,14,22,16,'#4a2e1c');fill(6,10,22,8,'#a67739');fill(8,17,18,10,'#915d2b');fill(15,12,3,14,'#d3ad52');}
    if(i===16){fill(5,5,4,27,'#8b613e');fill(24,5,4,27,'#8b613e');fill(2,12,28,5,'#bc8a59');fill(2,22,28,4,'#bc8a59');}
    if(i===19)for(let y=3;y<32;y+=8)fill(2,y,28,4,'#b6a98b');
    if(i===20)for(let y=0;y<32;y+=8)fill(0,y,32,5,'#a45153');
    if(i===21){fill(7,3,18,29,'#6b4029');fill(10,5,12,26,'#b07842');fill(19,18,2,2,'#ffcf76');}
    if(i===22){fill(3,5,26,23,'#69432c');fill(6,8,20,7,'#ebd6b2');fill(6,15,20,10,'#8b4b57');}
    if(i===23){fill(3,10,26,14,'#714726');fill(6,12,20,10,'#b27a46');fill(6,24,5,7,'#4c3525');fill(22,24,5,7,'#4c3525');}
    if(i===28){fill(11,13,10,17,'#4b342d');fill(9,4,14,13,'#f5b14e');fill(13,1,6,8,'#ffe69b');}
    if(i===29){fill(14,9,4,22,'#74523a');fill(5,3,22,14,'#a98550');fill(8,6,16,8,'#d2b47a');}
    if(i===31){fill(4,4,24,24,'#3b89c8');fill(9,9,14,14,'#8bdbff');fill(13,13,6,6,'#f8ffff');}
    ctx.restore();
  }
  return canvas;
}
