'use strict';
function tankHeat(p){
 const {kind,d,L,depth,wall,ins,lambdaSteel,lambdaIns,h,Tinside,Tair,fill}=p;
 if(![d,L,depth,wall,ins,lambdaSteel,lambdaIns,h,Tinside,Tair,fill].every(Number.isFinite)||d<=2*wall||L<=0||wall<=0||ins<=0||lambdaSteel<=0||lambdaIns<=0||h<=0||fill<0||fill>100)throw Error('Некорректные тепловые параметры');
 const ri=d/2-wall,ro=d/2,re=ro+ins,dt=Tinside-Tair;
 let sideR,sideArea,capArea,capR,capQ,sideQ;
 if(kind==='box'){
  const Ai=2*((d-2*wall)*L+(depth-2*wall)*L+(d-2*wall)*(depth-2*wall));
  const Ao=2*((d+2*ins)*(L+2*ins)+(depth+2*ins)*(L+2*ins)+(d+2*ins)*(depth+2*ins));
  const thickness=wall/lambdaSteel+ins/lambdaIns+1/h;
  const A=(Ai+Ao)/2;
  sideQ=dt*A/thickness;sideArea=Ao;capQ=0;capArea=0;
 }else{
  sideR=Math.log(ro/ri)/(2*Math.PI*lambdaSteel*L)+Math.log(re/ro)/(2*Math.PI*lambdaIns*L)+1/(h*2*Math.PI*re*L);
  sideQ=dt/sideR;sideArea=2*Math.PI*re*L;
  // End-cap approximation uses plane-wall resistance; domed heads are not resolved.
  capArea=2*Math.PI*re*re;
  capR=(wall/lambdaSteel+ins/lambdaIns+1/h)/(capArea);
  capQ=dt/capR;
 }
 const q=sideQ+capQ,outerTemp=Tair+q/(h*(sideArea+capArea));
 return {q,sideQ,capQ,outerTemp,sideArea,capArea,approximation:true,
  note:'Инженерная оценка: постоянная внутренняя температура, равномерная изоляция, без опор и 3D локальных потоков. Уровень жидкости влияет только на визуализацию.'};
}
if(typeof module!=='undefined')module.exports={tankHeat};
