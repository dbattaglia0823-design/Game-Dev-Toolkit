import { normalizeDocument } from './model.js';
const escaped = text => String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const gdString = text => JSON.stringify(String(text)).replace(/\\u2028/g,' ').replace(/\\u2029/g,' ');
const rgb = hex => {
 const vals=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
 return 'Color('+vals.map(v=>Number(v.toFixed(5))).join(', ')+', 1)';
};
/** Export as self-contained, accessible static HTML layout. Event handlers are game-specific. */
export function exportHTML(source) {
 const doc=normalizeDocument(source);
 const block=doc.elements.map(el=>{
  const style=`left:${el.x}px;top:${el.y}px;width:${el.w}px;height:${el.h}px;border-radius:${el.radius}px;`;
  const label=escaped(el.label);
  if(el.type==='panel')return `<div class="ui-panel" style="${style}background:${el.fill}"></div>`;
  if(el.type==='button')return `<button type="button" class="ui-button" style="${style}background:${el.fill};font-size:${el.fontSize}px">${label}</button>`;
  if(el.type==='text')return `<div class="ui-text" style="${style}font-size:${el.fontSize}px;color:${el.fill}">${label}</div>`;
  if(el.type==='image')return `<div role="img" aria-label="${label || 'Image placeholder'}" class="ui-image" style="${style}background:${el.fill}">${label}</div>`;
  return `<div role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${el.value}" class="ui-progress" style="${style}background:#192330"><span style="display:block;height:100%;width:${el.value}%;background:${el.fill}"></span></div>`;
 }).join('\n');
 return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escaped(doc.title)}</title><style>
*{box-sizing:border-box}body{margin:0;background:#080b10;color:white;font:16px system-ui}
.ui-frame{width:min(100vw,800px);aspect-ratio:8/5;margin:auto;position:relative;overflow:hidden}
.ui-design{width:800px;height:500px;transform:scale(var(--ui-scale,1));transform-origin:top left;position:relative;background:${doc.background}}
.ui-design>*{position:absolute;display:flex;align-items:center;justify-content:center;overflow:hidden;text-align:center;overflow-wrap:anywhere;padding:4px;font-family:inherit;white-space:pre-wrap}
.ui-button{color:#fff;border:1px solid #ffffff25;cursor:pointer;font-weight:600}.ui-panel{border:1px solid #ffffff18}
.ui-image{border:2px dashed #ffffff77}.ui-text{font-weight:600}.ui-progress{padding:0}
@media(max-width:800px){.ui-design{transform:scale(calc(100vw / 800))}}
</style></head><body><main class="ui-frame" aria-label="${escaped(doc.title)}"><div class="ui-design">
${block}
</div></main></body></html>`;
}
/** Godot 4 Control scene; visual-only nodes intentionally have no game signals. */
export function exportGodot(source) {
 const doc=normalizeDocument(source);
 const resources=[];
 const nodes=[];
 const background = `[node name="Background" type="ColorRect" parent="."]\nlayout_mode = 0\noffset_right = 800.0\noffset_bottom = 500.0\ncolor = ${rgb(doc.background)}`;
 nodes.push(background);
 for(const [i,el] of doc.elements.entries()) {
  const name=el.type.charAt(0).toUpperCase()+el.type.slice(1)+'_'+String(i+1).padStart(2,'0');
  const base=`[node name="${name}" type="${({panel:'Panel',button:'Button',text:'Label',image:'ColorRect',progress:'ProgressBar'})[el.type]}" parent="."]\nlayout_mode = 0\noffset_left = ${el.x}.0\noffset_top = ${el.y}.0\noffset_right = ${el.x+el.w}.0\noffset_bottom = ${el.y+el.h}.0`;
  let extra='';
  if(el.type==='panel'||el.type==='button') {
   const id='Style'+(i+1);
   resources.push(`[sub_resource type="StyleBoxFlat" id="${id}"]\nbg_color = ${rgb(el.fill)}\ncorner_radius_top_left = ${el.radius}\ncorner_radius_top_right = ${el.radius}\ncorner_radius_bottom_right = ${el.radius}\ncorner_radius_bottom_left = ${el.radius}`);
   extra=el.type==='panel'?`theme_override_styles/panel = SubResource("${id}")`:
   `text = ${gdString(el.label)}\ntheme_override_styles/normal = SubResource("${id}")\ntheme_override_styles/hover = SubResource("${id}")\ntheme_override_styles/pressed = SubResource("${id}")\ntheme_override_font_sizes/font_size = ${el.fontSize}`;
  } else if(el.type==='text') extra=`text = ${gdString(el.label)}\nhorizontal_alignment = 1\nvertical_alignment = 1\ntheme_override_colors/font_color = ${rgb(el.fill)}\ntheme_override_font_sizes/font_size = ${el.fontSize}`;
  else if(el.type==='image')extra=`color = ${rgb(el.fill)}\nmouse_filter = 2`;
  else extra=`value = ${el.value}.0\nshow_percentage = false\nmouse_filter = 2`;
  nodes.push(base+'\n'+extra);
 }
 return `[gd_scene load_steps=${resources.length+1} format=3]\n\n${resources.join('\n\n')}${resources.length?'\n\n':''}[node name="ExportedUI" type="Control"]\nlayout_mode = 3\nanchors_preset = 0\noffset_right = 800.0\noffset_bottom = 500.0\n\n${nodes.join('\n\n')}\n`;
}
