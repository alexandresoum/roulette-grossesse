const DAY=86400000,$=s=>document.querySelector(s);
let mode="ddg",selected=null,dragging=false,lastRawAngle=0,unwrappedAngle=0,dragBaseDate=null,dragDays=0,rotorBase=0,rafPending=false;
const DEG_PER_DAY=5,mainDate=$("#mainDate"),targetDate=$("#targetDate"),wheel=$("#wheel"),rotor=$("#rotor"),dragDelta=$("#dragDelta");
function parse(v){if(!v)return null;let [y,m,d]=v.split("-").map(Number);return new Date(y,m-1,d,12)}
function iso(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function add(d,n){let x=new Date(d);x.setDate(x.getDate()+n);return x}
function days(a,b){let x=new Date(a),y=new Date(b);x.setHours(12,0,0,0);y.setHours(12,0,0,0);return Math.round((x-y)/DAY)}
function fmt(d,short=false){return new Intl.DateTimeFormat("fr-FR",short?{day:"2-digit",month:"2-digit",year:"numeric"}:{day:"numeric",month:"long",year:"numeric"}).format(d)}
function ddr(){let d=parse(mainDate.value);return !d?null:mode==="ddr"?d:add(d,-14)}
function age(date,start){let n=days(date,start),sign=n<0?"−":"";n=Math.abs(n);let w=Math.floor(n/7),j=n%7;return `${sign}${w} SA${j?` + ${j} j`:""}`}
function dateFor(w,j=0){return add(ddr(),w*7+j)}
const reps=[["Début fenêtre T1","11 SA",77],["Échographie T1","11 SA → 13 SA + 6 j",77],["Fin fenêtre T1","13 SA + 6 j",97],["Échographie T2","≈ 22 SA",154],["Échographie T3","≈ 32 SA",224],["Début du terme","37 SA",259],["39 SA","39 SA",273],["DPA","41 SA",287]];
function render(){
 let start=ddr();if(!start)return;
 let today=new Date();today.setHours(12,0,0,0);let dpa=add(start,287),shown=selected||today;
 $("#dpa").textContent=fmt(dpa,true);$("#dpa2").textContent=fmt(dpa);$("#term").textContent=age(shown,start);$("#selectedDate").textContent=fmt(shown);
 $("#hubTitle").textContent=selected?"TERME À LA DATE SÉLECTIONNÉE":"TERME AUJOURD’HUI";
 let left=days(dpa,today);$("#remaining").textContent=left>=0?left+" jours restants":"DPA dépassée de "+Math.abs(left)+" j";
 let t=parse(targetDate.value);$("#targetTerm").textContent=t?age(t,start):"—";
 let w=Math.max(0,Math.min(45,+$("#weeks").value||0)),j=Math.max(0,Math.min(6,+$("#days").value||0));$("#termDate").textContent=fmt(dateFor(w,j),true);
 $("#milestones").innerHTML=reps.map(r=>`<button class="card" data-offset="${r[2]}"><b>${r[0]} • ${r[1]}</b><span>${fmt(add(start,r[2]),true)}</span></button>`).join("");
 document.querySelectorAll(".card").forEach(b=>b.onclick=()=>{selected=add(start,+b.dataset.offset);render()});
 let source=mode==="ddr"?`DDR du ${fmt(start,true)}`:`DDG du ${fmt(add(start,14),true)}`;let text=`${source} — terme ce jour : ${age(today,start)} — DPA : ${fmt(dpa,true)}.`;
 $("#copyText").textContent=text;$("#copy").dataset.text=text;
}
function setMode(m){let old=ddr();mode=m;document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.mode===m));$("#mainLabel").textContent=m==="ddr"?"DDR":"DDG";$("#method").textContent=m==="ddr"?"Datation • 41 SA depuis la DDR":"DDG = DDR + 14 jours • DPA = DDG + 39 semaines";if(old)mainDate.value=iso(m==="ddr"?old:add(old,14));selected=null;render()}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
[mainDate,targetDate,$("#weeks"),$("#days")].forEach(e=>e.addEventListener("input",()=>{if(e===mainDate)selected=null;render()}));
document.querySelectorAll(".quick button").forEach(b=>b.onclick=()=>{selected=dateFor(+b.dataset.w);render()});
$("#todayBtn").onclick=()=>{selected=null;rotorBase=0;rotor.style.transform="rotate(0deg)";render()};
$("#help").onclick=()=>$("#dlg").showModal();
$("#copy").onclick=async()=>{let t=$("#copy").dataset.text;try{await navigator.clipboard.writeText(t);let s=$("#copy strong"),old=s.textContent;s.textContent="COPIÉ ✓";setTimeout(()=>s.textContent=old,1200)}catch{prompt("Copier :",t)}};
$("#share").onclick=async()=>{let t=$("#copy").dataset.text;if(navigator.share){try{await navigator.share({title:"Roulette de grossesse",text:t})}catch{}}else{try{await navigator.clipboard.writeText(t);alert("Résumé copié.")}catch{}}};
function angle(ev){let r=wheel.getBoundingClientRect(),x=ev.clientX-(r.left+r.width/2),y=ev.clientY-(r.top+r.height/2);return Math.atan2(y,x)*180/Math.PI}
function clampDate(d,start){let min=add(start,-14),max=add(start,315);if(d<min)return min;if(d>max)return max;return d}
function setDeltaBadge(n){let sign=n>0?"+":n<0?"−":"±";dragDelta.textContent=`${sign} ${Math.abs(n)} j`;dragDelta.classList.toggle("positive",n>0);dragDelta.classList.toggle("negative",n<0)}
function applyDragFrame(){
 rafPending=false;let start=ddr();if(!start||!dragBaseDate)return;
 let newDays=Math.round(unwrappedAngle/DEG_PER_DAY);if(newDays===dragDays)return;
 let old=dragDays;dragDays=newDays;selected=clampDate(add(dragBaseDate,dragDays),start);
 rotor.style.transform=`rotate(${rotorBase+dragDays*DEG_PER_DAY}deg)`;setDeltaBadge(dragDays);render();
}

document.querySelectorAll(".wheel-link").forEach(btn=>{
  btn.addEventListener("click",e=>{
    e.stopPropagation();
    let start=ddr();
    if(!start)return;
    selected=add(start,+btn.dataset.offset);
    render();
  });
});

wheel.addEventListener("pointerdown",e=>{if(e.target.closest(".wheel-link"))return;dragging=true;wheel.classList.add("dragging");wheel.setPointerCapture(e.pointerId);lastRawAngle=angle(e);unwrappedAngle=0;dragDays=0;let today=new Date();today.setHours(12,0,0,0);dragBaseDate=selected?new Date(selected):today;setDeltaBadge(0)});
wheel.addEventListener("pointermove",e=>{if(!dragging)return;e.preventDefault();let a=angle(e),delta=a-lastRawAngle;if(delta>180)delta-=360;if(delta<-180)delta+=360;unwrappedAngle+=delta;lastRawAngle=a;if(!rafPending){rafPending=true;requestAnimationFrame(applyDragFrame)}},{passive:false});
function finishDrag(e){if(!dragging)return;dragging=false;wheel.classList.remove("dragging");dragDelta.classList.remove("positive","negative");if(e&&wheel.hasPointerCapture?.(e.pointerId)){try{wheel.releasePointerCapture(e.pointerId)}catch{}}}
wheel.addEventListener("pointerup",finishDrag);wheel.addEventListener("pointercancel",finishDrag);wheel.addEventListener("lostpointercapture",()=>finishDrag());
let today=new Date();today.setHours(12,0,0,0);mainDate.value=iso(add(today,-157));targetDate.value=iso(add(today,30));render();
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");