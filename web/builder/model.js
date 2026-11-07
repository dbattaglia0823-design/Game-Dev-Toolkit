/** Pure, versioned document model. No HTML is accepted as executable input. */
export const TYPES = ['panel', 'button', 'text', 'image', 'progress'];
export const PRESETS = Object.freeze({
  blank: { title: 'Untitled UI', background: '#101722', elements: [] },
  menu: { title: 'Main Menu', background: '#101722', elements: [
    {type:'panel',x:115,y:60,w:570,h:385,label:'',fill:'#1d2939',radius:24},
    {type:'text',x:205,y:110,w:390,h:72,label:'GAME TITLE',fill:'#ffffff',fontSize:45},
    {type:'button',x:245,y:230,w:310,h:60,label:'PLAY',fill:'#fb8c35',radius:14},
    {type:'button',x:245,y:308,w:310,h:54,label:'SETTINGS',fill:'#344256',radius:14}
  ]},
  hud: {title:'Game HUD',background:'#131d2b',elements:[
    {type:'panel',x:28,y:26,w:275,h:92,label:'',fill:'#202e42',radius:16},
    {type:'text',x:50,y:42,w:190,h:40,label:'SCORE  1,250',fill:'#f5f5fb',fontSize:23},
    {type:'panel',x:28,y:390,w:300,h:75,label:'',fill:'#202e42',radius:16},
    {type:'text',x:44,y:399,w:200,h:30,label:'HEALTH',fill:'#dfe7f1',fontSize:18},
    {type:'progress',x:44,y:437,w:250,h:12,label:'',fill:'#fb8c35',value:75}
  ]}
});
const DEFAULTS = Object.freeze({ panel:{w:240,h:150,label:'',fill:'#243247',radius:18},button:{w:175,h:52,label:'BUTTON',fill:'#fb8c35',radius:12},text:{w:240,h:55,label:'New text',fill:'#ffffff',fontSize:26},image:{w:220,h:135,label:'Image placeholder',fill:'#34445b',radius:12},progress:{w:220,h:18,label:'',fill:'#fb8c35',value:65,radius:9} });
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const isColor = value => typeof value === 'string' && /^#[\da-fA-F]{6}$/.test(value);
const number = (v, fallback, min, max) => typeof v === 'number' && Number.isFinite(v) ? clamp(Math.round(v),min,max) : fallback;
export function normalizeElement(raw, index = 0) {
  if (!raw || typeof raw !== 'object' || !TYPES.includes(raw.type)) throw new TypeError('Unsupported element type');
  const d = DEFAULTS[raw.type];
  return { id: typeof raw.id === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(raw.id) ? raw.id : 'item'+index,
    type:raw.type,
    x:number(raw.x,40,0,780),y:number(raw.y,40,0,480),
    w:number(raw.w,d.w,24,800),h:number(raw.h,d.h,8,500),
    label: String(raw.label ?? d.label).slice(0,120),
    fill: isColor(raw.fill) ? raw.fill : d.fill,
    radius:number(raw.radius,d.radius ?? 0,0,80),
    fontSize:number(raw.fontSize,d.fontSize ?? 20,10,76),
    value:number(raw.value,d.value ?? 50,0,100)
  };
}
export function normalizeDocument(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Invalid document');
  if (input.version !== undefined && input.version !== 1) throw new Error('Unsupported document version');
  if (!Array.isArray(input.elements) || input.elements.length > 100) throw new RangeError('Invalid element count');
  const elements=input.elements.map((e,i)=>normalizeElement(e,i));
  const ids=new Set();
  for (const element of elements) {
    if (ids.has(element.id)) element.id='item'+(Math.random().toString(36).slice(2,9));
    ids.add(element.id);
  }
  return {version:1, title:String(input.title ?? 'Untitled UI').slice(0,100),
    background:isColor(input.background)?input.background:'#101722',elements};
}
export function makePreset(name) {
  if (!Object.hasOwn(PRESETS,name)) throw new Error('Unknown preset');
  return normalizeDocument(structuredClone(PRESETS[name]));
}
export function addElement(doc,type) {
  if (!TYPES.includes(type)) throw new Error('Unknown component');
  if (doc.elements.length >= 100) return doc;
  const id = 'el'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const index=doc.elements.length;
  return {...doc,elements:[...doc.elements,normalizeElement({type,id,x:60+(index%7)*24,y:60+(index%7)*24},index)]};
}
export function updateElement(doc,id,changes) {
  return {...doc,elements:doc.elements.map(item=>item.id===id?normalizeElement({...item,...changes,id:item.id,type:item.type}):item)};
}
export function removeElement(doc,id) {return {...doc,elements:doc.elements.filter(e=>e.id!==id)};}
export function exportJSON(doc) { return JSON.stringify(normalizeDocument(doc),null,2); }
export function importJSON(text) {
  if (typeof text !== 'string' || text.length > 100000) throw new RangeError('Invalid input size');
  return normalizeDocument(JSON.parse(text));
}
