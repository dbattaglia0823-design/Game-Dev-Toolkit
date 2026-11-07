/** Engine-independent endpoint geometry for a semantic UI connection. */
export function center(node){return {x:node.x+node.w/2,y:node.y+node.h/2};}
export function endpoints(a,b){
 const c=center(a),d=center(b),dx=d.x-c.x,dy=d.y-c.y;
 const len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;
 const radius=(node)=>{
  if(node.shape==='circle')return Math.min(node.w,node.h)/2;
  const halfW=node.w/2,halfH=node.h/2;
  return Math.min(halfW/(Math.abs(ux)||1e-9),halfH/(Math.abs(uy)||1e-9));
 };
 const ra=radius(a),rb=radius(b);
 return {x1:c.x+ux*ra,y1:c.y+uy*ra,x2:d.x-ux*rb,y2:d.y-uy*rb};
}
export function connectionPaths(doc){
 const nodes=new Map(doc.nodes.map(n=>[n.id,n]));
 return (doc.edges||[]).map(edge=>({from:edge.from,to:edge.to,
  ...endpoints(nodes.get(edge.from),nodes.get(edge.to))}));
}
