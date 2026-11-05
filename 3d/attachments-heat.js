'use strict';
// Preliminary thermal-resistance models for vessel end caps and supports.
// Separate from the cylindrical tetrahedral FEM; NOT a coupled 3D FEM result.
function calculateTankAttachments(p){
 const keys=['diameter','wall','insulation','lambdaSteel','lambdaInsulation','lambdaSupport','hOutside','tProduct','tAmbient','supportCount','supportArea','supportLength'];
 for(const key of keys)if(!Number.isFinite(p[key]))throw Error('Invalid attachment parameter: '+key);
 if(!(p.diameter>2*p.wall&&p.wall>0&&p.insulation>0&&p.lambdaSteel>0&&p.lambdaInsulation>0&&p.lambdaSupport>0&&p.hOutside>0&&Number.isSafeInteger(p.supportCount)&&p.supportCount>=0&&p.supportArea>0&&p.supportLength>0))throw Error('Invalid attachment geometry');
 const ri=(p.diameter/2-p.wall)/1000,ro=p.diameter/2000,re=ro+p.insulation/1000;
 const A=Math.PI*re*re,dt=p.tProduct-p.tAmbient;
 const RcapSteel=(p.wall/1000)/(p.lambdaSteel*A),RcapIns=(p.insulation/1000)/(p.lambdaInsulation*A),RcapAir=1/(p.hOutside*A);
 const capFlow=dt/(RcapSteel+RcapIns+RcapAir);
 const capOuter=p.tAmbient+capFlow*RcapAir;
 const supportIns=Math.max(0,p.supportInsulation||0);
 const supportK=p.lambdaSupportInsulation||p.lambdaInsulation;
 if(!(supportK>0))throw Error('Invalid support insulation conductivity');
 // A compact 1D approximation: the same cross-sectional area is assumed for all resistances.
 // Real 3D spreading, contact resistance and exposed support area are NOT represented.
 const Rs=p.supportLength/(p.lambdaSupport*p.supportArea);
 const Rsi=supportIns/(supportK*p.supportArea);
 const Rsa=1/(p.hOutside*p.supportArea);
 const supportFlow=dt/(Rs+Rsi+Rsa);
 const supportOuter=p.tAmbient+supportFlow*Rsa;
 return {upper:{q:capFlow,tOuter:capOuter},lower:{q:capFlow,tOuter:capOuter},supports:{count:p.supportCount,each: supportFlow,total:p.supportCount*supportFlow,tOuter:supportOuter},total:2*capFlow+p.supportCount*supportFlow,method:'1D thermal-resistance estimate, not coupled FEM'};
}
if(typeof module!=='undefined')module.exports={calculateTankAttachments};
