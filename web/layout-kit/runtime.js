import {normalizeLayout,getContract} from './schema.js';
/** Runtime adapter for DOM games. Views have no game-specific state or theme. */
export function mountLayout({container,layout,data={},onAction=()=>{}}) {
 if(!container||typeof container.replaceChildren!=='function')throw new TypeError('Container element required');
 if(typeof onAction!=='function')throw new TypeError('onAction must be a callback');
 const spec=normalizeLayout(layout);
 let bindings=data;
 const root=document.createElement('section');
 root.className='gdt-wireframe';
 root.setAttribute('aria-label',spec.name);
 root.style.aspectRatio=spec.viewport.width+'/'+spec.viewport.height;
 const nodeMap=new Map();
 const getValue=key=>{
  if(!key)return undefined;
  if(bindings!=null&&Object.hasOwn(Object(bindings),key))return bindings[key];
  return key.split('.').reduce((value,part)=>value!=null?value[part]:undefined,bindings);
 };
 const emit=(node,payload={})=>{
  if(node.actionId)onAction(node.actionId,{nodeId:node.id,...payload});
 };
 const displayValue=value=>value==null?'':typeof value==='object'?
  (value.name??value.label??value.title??'') :String(value);
 function makeView(node) {
  let el;
  switch(node.type){
   case 'button':case 'slot':el=document.createElement('button');el.type='button';break;
   case 'input':el=document.createElement('input');el.type='search';break;
   case 'toggle':el=document.createElement('label');break;
   case 'slider':el=document.createElement('label');break;
   case 'progress':el=document.createElement('progress');break;
   default:el=document.createElement('div');
  }
  el.className='gdt-wireframe-node gdt-wireframe-'+node.type;
  el.dataset.nodeId=node.id;
  el.dataset.role=node.role;
  el.style.left=(node.x/spec.viewport.width*100)+'%';
  el.style.top=(node.y/spec.viewport.height*100)+'%';
  el.style.width=(node.w/spec.viewport.width*100)+'%';
  el.style.height=(node.h/spec.viewport.height*100)+'%';
  if(node.type==='input'){
   el.placeholder=node.label;
   el.setAttribute('aria-label',node.label||node.role||node.id);
   el.addEventListener('change',()=>emit(node,{value:el.value}));
  } else if(node.type==='toggle'||node.type==='slider'){
   const caption=document.createElement('span');caption.textContent=node.label;
   const input=document.createElement('input');
   input.type=node.type==='toggle'?'checkbox':'range';
   if(node.type==='slider'){input.min='0';input.max='100';input.value='0';}
   input.setAttribute('aria-label',node.label||node.role||node.id);
   input.addEventListener('change',()=>emit(node,{value:node.type==='toggle'?input.checked:Number(input.value)}));
   el.append(caption,input);
  }else if(node.type==='progress'){
   el.max=100;el.value=0;el.setAttribute('aria-label',node.label||node.role||node.id);
  }else if(node.type==='grid'||node.type==='list'){
   el.setAttribute('role',node.type==='grid'?'group':'list');
   el.setAttribute('aria-label',node.label||node.role||node.id);
  }else{
   el.textContent=node.label||'';
   if(node.type==='button'||node.type==='slot')el.addEventListener('click',()=>emit(node));
  }
  return el;
 }
 for(const node of spec.nodes){const el=makeView(node);root.append(el);nodeMap.set(node.id,el);}
 function update(nextData) {
  bindings=nextData??{};
  for(const node of spec.nodes){
   const el=nodeMap.get(node.id),value=getValue(node.bindingKey);
   if(node.type==='label'){
    el.textContent=value===undefined?node.label:displayValue(value);
   }else if(node.type==='progress'){
    const number=Number(value);el.value=Number.isFinite(number)?Math.max(0,Math.min(100,number)):0;
   }else if(node.type==='toggle'){
    const checkbox=el.querySelector('input');checkbox.checked=Boolean(value);
   }else if(node.type==='slider'){
    const slider=el.querySelector('input');slider.value=Number.isFinite(Number(value))?String(Math.max(0,Math.min(100,Number(value)))):'0';
   }else if(node.type==='input'){
    if(document.activeElement!==el)el.value=value==null?'':String(value);
   }else if(node.type==='grid'||node.type==='list'){
    el.replaceChildren();
    const values=Array.isArray(value)?value:[];
    for(const [index,item] of values.entries()){
     const btn=document.createElement('button');btn.type='button';
     btn.className='gdt-wireframe-entry';
     btn.textContent=displayValue(item)||'Item '+(index+1);
     btn.addEventListener('click',()=>emit(node,{index,item}));
     el.append(btn);
    }
    if(!values.length){const empty=document.createElement('span');empty.className='gdt-wireframe-empty';empty.textContent=node.label||'Empty';el.append(empty);}
   }else if(node.type==='slot'&&value!==undefined){
    el.textContent=displayValue(value)||node.label;
   }
  }
 }
 container.replaceChildren(root);
 update(data);
 return {element:root,setData:update,getContract:()=>getContract(spec),destroy(){root.remove();nodeMap.clear();}};
}
