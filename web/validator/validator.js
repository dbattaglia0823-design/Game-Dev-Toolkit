import {getPreset,PRESETS} from '../layout-kit/presets.js';
import {parseLayout} from '../layout-kit/schema.js';
import {validateIntegration} from '../layout-kit/validator.js';
const $=id=>document.getElementById(id);
let current=getPreset('inventory'),result=null;
function show(message){$('status').textContent=message;}
function run(){
 let data;
 try{const text=$('data').value.trim();if(text){data=JSON.parse(text);if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Expected a JSON object');}}
 catch(error){show('Invalid sample data: '+error.message);return;}
 const handlers=$('handlers').value.split(/\r?\n|,/).map(x=>x.trim()).filter(Boolean);
 result=validateIntegration(current,{handlerIds:handlers,sampleData:data});
 $('errors').textContent=String(result.errors.length);
 $('warnings').textContent=String(result.warnings.length);
 $('actions').textContent=String(result.contract?.actions.length??0);
 $('bindings').textContent=String(result.contract?.bindings.length??0);
 show(result.valid?(result.ready?'No validator issues found. Runtime testing is still required.':'Structurally valid; review integration warnings.'):'Fix structural errors before integration.');
 const issues=$('issues');issues.replaceChildren();
 for(const issue of [...result.errors,...result.warnings]){
  const row=document.createElement('div');row.className='issue '+issue.severity;
  const heading=document.createElement('strong');heading.textContent=issue.severity.toUpperCase()+' · '+issue.code;
  const body=document.createElement('p');body.textContent=issue.message+(issue.nodeId?' — '+issue.nodeId:'');
  row.append(heading,body);issues.append(row);
 }
 if(!issues.children.length)issues.textContent='No issues reported.';
 $('contract').textContent=result.contract?JSON.stringify(result.contract,null,2):'Contract unavailable until structural errors are fixed.';
 $('download').disabled=false;
}
$('preset').addEventListener('change',event=>{current=getPreset(event.target.value);$('file').value='';run();});
$('file').addEventListener('change',async event=>{
 const file=event.target.files?.[0];if(!file)return;
 try{if(file.size>250000)throw Error('Maximum size: 250 KB');current=parseLayout(await file.text());run();}
 catch(error){show('Import failed: '+error.message);}
});
$('validate').addEventListener('click',run);
$('download').addEventListener('click',()=>{
 if(!result)return;
 const url=URL.createObjectURL(new Blob([JSON.stringify({template:current.name,...result},null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='ui-validation-report.json';document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
});
const requestedPreset=new URLSearchParams(location.search).get('preset');
if(requestedPreset && Object.hasOwn(PRESETS,requestedPreset)) {
 current=getPreset(requestedPreset);
 $('preset').value=requestedPreset;
}
run();
