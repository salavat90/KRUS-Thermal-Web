'use strict';
function calculateTankReference(p){
 const keys=['diameter','height','wall','insulation','lambdaSteel','lambdaInsulation','hOutside','tProduct','tAmbient','supportCount','supportArea','supportLength','lambdaSupport'];
 for(const k of keys)if(!Number.isFinite(p[k]))throw Error('Некорректный параметр: '+k);
 if(!(p.diameter>2*p.wall&&p.wall>0&&p.height>0&&p.insulation>0&&p.lambdaSteel>0&&p.lambdaInsulation>0&&p.hOutside>0&&p.supportCount>=0&&Number.isInteger(p.supportCount)&&p.supportArea>0&&p.supportLength>0&&p.lambdaSupport>0))throw Error('Параметры вне допустимых границ');
 const ri=(p.diameter/2-p.wall)/1000,ro=p.diameter/2000,re=ro+p.insulation/1000,L=p.height/1000;
 const Rsteel=Math.log(ro/ri)/(2*Math.PI*p.lambdaSteel*L);
 const Rins=Math.log(re/ro)/(2*Math.PI*p.lambdaInsulation*L);
 const Rconv=1/(p.hOutside*2*Math.PI*re*L);
 const dt=p.tProduct-p.tAmbient;
 const qShell=dt/(Rsteel+Rins+Rconv);
 const qSupportSingle=dt/(p.supportLength/(p.lambdaSupport*p.supportArea)+1/(p.hOutside*p.supportArea));
 const qSupports=p.supportCount*qSupportSingle;
 const supportInsulation=p.supportInsulation||0,lambdaSupportInsulation=p.lambdaSupportInsulation||.04;
 if(supportInsulation<0||lambdaSupportInsulation<=0)throw Error('Некорректная изоляция опор');
 const supportR=p.supportLength/(p.lambdaSupport*p.supportArea)+supportInsulation/(lambdaSupportInsulation*p.supportArea)+1/(p.hOutside*p.supportArea);
 const qSupportsInsulated=p.supportCount*dt/supportR;
 const rCap=(p.wall/1000/p.lambdaSteel+p.insulation/1000/p.lambdaInsulation+1/p.hOutside)/(Math.PI*re*re);
 const qCaps=2*dt/rCap;
 const qTotal=qShell+qSupports+qCaps;
 const tOuter=p.tAmbient+qShell*Rconv;
 const tShell=p.tProduct-qShell*Rsteel;
 return {qShell,qCaps,qSupports,qSupportsInsulated,qTotal,qTotalInsulated:qShell+qCaps+qSupportsInsulated,tOuter,tShell,Rsteel,Rins,Rconv,assumptions:'Стационарная аналитическая оценка: цилиндрическая обечайка, плоские днища, отдельные одномерные пути через опоры. Нет 3D FEM, контактов, распределения температуры по опорам и влияния уровня жидкости.'};
}
if(typeof module!=='undefined')module.exports={calculateTankReference};
