// Pure ZIP-store writer for original sound bank WAV bundles.
// No compression, native deps, or external assets. Node and browser compatible.
function zipCrc32(bytes) {
  const table = Array.from({length:256},(_,i)=>{
    let c=i; for(let j=0;j<8;j++)c=(c&1)?0xEDB88320^(c>>>1):(c>>>1);
    return c>>>0;
  });
  let value=0xFFFFFFFF;
  for(const b of bytes)value=table[(value^b)&255]^(value>>>8);
  return (value^0xFFFFFFFF)>>>0;
}
function bytesConcat(parts) {
  const size=parts.reduce((sum,item)=>sum+item.length,0);
  const output=new Uint8Array(size);
  let offset=0;
  for(const item of parts){output.set(item,offset);offset+=item.length;}
  return output;
}
function zipStore(files) {
  if(files.length>65535)throw new Error("Too many archive entries");
  const parts=[],central=[];
  let offset=0;
  for(const file of files){
    if(!/^[a-z0-9_/-]+\.wav$/.test(file.name)||file.name.includes("../"))
      throw new Error("Unsafe archive path: "+file.name);
    const name=Uint8Array.from(file.name,letter=>letter.charCodeAt(0));
    const data=file.bytes,check=zipCrc32(data);
    const local=new Uint8Array(30+name.length),header=new DataView(local.buffer);
    header.setUint32(0,0x04034b50,true);
    header.setUint16(4,20,true);
    header.setUint32(14,check,true);
    header.setUint32(18,data.length,true);
    header.setUint32(22,data.length,true);
    header.setUint16(26,name.length,true);
    local.set(name,30);
    const descriptor=new Uint8Array(46+name.length),cd=new DataView(descriptor.buffer);
    cd.setUint32(0,0x02014b50,true);
    cd.setUint16(4,20,true);cd.setUint16(6,20,true);
    cd.setUint32(16,check,true);
    cd.setUint32(20,data.length,true);cd.setUint32(24,data.length,true);
    cd.setUint16(28,name.length,true);cd.setUint32(42,offset,true);
    descriptor.set(name,46);
    parts.push(local,data);
    central.push(descriptor);
    offset+=local.length+data.length;
  }
  const directory=bytesConcat(central);
  const end=new Uint8Array(22),record=new DataView(end.buffer);
  record.setUint32(0,0x06054b50,true);
  record.setUint16(8,files.length,true);record.setUint16(10,files.length,true);
  record.setUint32(12,directory.length,true);record.setUint32(16,offset,true);
  return bytesConcat([...parts,directory,end]);
}
function base64Encode(bytes) {
  const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",output=[];
  for(let i=0;i<bytes.length;i+=3){
    const n=bytes[i]<<16|(bytes[i+1]??0)<<8|(bytes[i+2]??0);
    output.push(alphabet[n>>>18],alphabet[(n>>>12)&63],
      i+1<bytes.length?alphabet[(n>>>6)&63]:"=",
      i+2<bytes.length?alphabet[n&63]:"=");
  }
  return output.join("");
}
export {zipCrc32,bytesConcat,zipStore,base64Encode};
