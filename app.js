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

function calculateDDGFromTodayTerm(){
  const wEl=$("#todayWeeks"),dEl=$("#todayDays"),out=$("#calculatedDDG");
  if(!wEl||!dEl||!out)return null;
  let w=Math.max(2,Math.min(45,parseInt(wEl.value||"0",10)));
  let j=Math.max(0,Math.min(6,parseInt(dEl.value||"0",10)));
  let today=new Date();today.setHours(12,0,0,0);
  let gestDays=w*7+j;
  let ddgDate=add(today,-(gestDays-14));
  out.textContent=fmt(ddgDate,true);
  out.dataset.iso=iso(ddgDate);
  return ddgDate;
}
function useCalculatedDDG(){
  let d=calculateDDGFromTodayTerm();
  if(!d)return;
  if(mode!=="ddg")setMode("ddg");
  mainDate.value=iso(d);
  selected=null;
  render();
  mainDate.scrollIntoView({behavior:"smooth",block:"center"});
}
["#todayWeeks","#todayDays"].forEach(sel=>{const el=$(sel);if(el)el.addEventListener("input",calculateDDGFromTodayTerm)});
const useDDGBtn=$("#useCalculatedDDG");if(useDDGBtn)useDDGBtn.addEventListener("click",useCalculatedDDG);

let today=new Date();today.setHours(12,0,0,0);mainDate.value=iso(add(today,-157));targetDate.value=iso(add(today,30));render();
calculateDDGFromTodayTerm();

const patientStages=[
 {min:0,max:7,label:"6 SA",img:"assets/6sa.png",title:"Les tout premiers développements",text:"À ce stade précoce, les structures essentielles commencent à se mettre en place.",facts:["Début du développement","Croissance rapide","1er trimestre"]},
 {min:8,max:9,label:"8 SA",img:"assets/8sa.png",title:"Les premiers organes se forment",text:"La croissance est très rapide et la silhouette embryonnaire devient de plus en plus identifiable.",facts:["Organes en formation","Croissance","1er trimestre"]},
 {min:10,max:11,label:"10 SA",img:"assets/10sa.png",title:"Une silhouette qui se précise",text:"Le développement se poursuit rapidement et les principaux organes continuent leur maturation.",facts:["Silhouette plus nette","Maturation","1er trimestre"]},
 {min:12,max:15,label:"12 SA",img:"assets/12sa.png",title:"Fin du premier trimestre",text:"La silhouette fœtale est bien identifiable et les mouvements se développent progressivement.",facts:["Organes en place","Mouvements","Fin du T1"]},
 {min:16,max:19,label:"16 SA",img:"assets/16sa.png",title:"Croissance et mouvements",text:"Votre bébé grandit et ses mouvements deviennent progressivement plus coordonnés.",facts:["Croissance","Mouvements","2e trimestre"]},
 {min:20,max:23,label:"20 SA",img:"assets/20sa.png",title:"Le deuxième trimestre avance",text:"Le développement sensoriel et moteur progresse, tandis que la croissance s’accélère.",facts:["Sens en développement","Mouvements","2e trimestre"]},
 {min:24,max:27,label:"24 SA",img:"assets/24sa.png",title:"Votre bébé réagit davantage",text:"La maturation se poursuit et les réactions aux sons et aux stimulations deviennent plus présentes.",facts:["Réactions","Maturation","2e trimestre"]},
 {min:28,max:31,label:"28 SA",img:"assets/28sa.png",title:"Entrée dans le troisième trimestre",text:"Votre bébé prend davantage de poids et poursuit la maturation de ses différents organes.",facts:["Prise de poids","Maturation","3e trimestre"]},
 {min:32,max:36,label:"32 SA",img:"assets/32sa.png",title:"Une croissance importante",text:"La prise de poids s’accentue et la maturation se poursuit en vue de la naissance.",facts:["Croissance","Maturation finale","3e trimestre"]},
 {min:37,max:45,label:"37–41 SA",img:"assets/37sa.png",title:"Bébé à terme",text:"À partir de 37 SA, la grossesse entre dans sa période de terme.",facts:["À terme","Croissance finale","Rencontre proche"]}
];
function patientStageFor(w){return patientStages.find(s=>w>=s.min&&w<=s.max)||patientStages[patientStages.length-1]}
function currentPregnancyData(){
 const start=ddr(); if(!start)return null;
 const now=new Date();now.setHours(12,0,0,0);
 const n=Math.max(0,days(now,start)),w=Math.floor(n/7),j=n%7;
 return {start,now,n,w,j,dpa:add(start,287)};
}
function fadePatientImage(src){
 const im=$("#fetalImage"); if(!im)return;
 im.classList.remove("fade-in");
 setTimeout(()=>{im.src=src;requestAnimationFrame(()=>requestAnimationFrame(()=>im.classList.add("fade-in")))},80);
}
function renderPatient(){
 const data=currentPregnancyData();if(!data)return;
 const s=patientStageFor(data.w);
 $("#patientTerm").textContent=`${data.w} SA${data.j?` + ${data.j} j`:""}`;
 $("#patientDate").textContent=fmt(data.now);
 $("#patientDPA").textContent=fmt(data.dpa);
 if($("#fetalImage").dataset.stage!==s.label){$("#fetalImage").dataset.stage=s.label;fadePatientImage(s.img)}
 $("#babyStageTitle").textContent=s.title;$("#babyStageText").textContent=s.text;
 $("#babyFact1").textContent=s.facts[0];$("#babyFact2").textContent=s.facts[1];$("#babyFact3").textContent=s.facts[2];
 $("#babyFact1Text").textContent="Le développement se poursuit semaine après semaine.";
 $("#babyFact2Text").textContent="Les capacités de votre bébé évoluent progressivement.";
 $("#babyFact3Text").textContent="L’illustration représente une grande étape, pas une mesure exacte.";
 const marks=[
   ["22 SA","Échographie T2",154,true],
   ["32 SA","Échographie T3",224,true],
   ["37 SA","Début du terme",259,false],
   ["41 SA","Terme prévu",287,false]
 ];
 $("#patientTimeline").innerHTML=marks.map(m=>`
   <div class="timeline-card">
     <button class="timeline-main" type="button" data-o="${m[2]}">
       <b>${m[0]}</b>
       <span>${m[1]}</span>
       <small>${fmt(add(data.start,m[2]),true)}</small>
     </button>
     ${m[3]?`<a class="doctolib-btn" href="https://www.doctolib.fr/sage-femme/la-roche-sur-yon/alexandre-soum" target="_blank" rel="noopener noreferrer">Prendre rendez-vous sur Doctolib</a>`:""}
   </div>
 `).join("");
 document.querySelectorAll(".timeline-main").forEach(b=>b.onclick=()=>{selected=add(data.start,+b.dataset.o);switchToPro();render()});
 $("#developmentCards").innerHTML=patientStages.map(x=>`<button class="dev-card ${x===s?"active":""}" data-stage="${x.label}"><img src="${x.img}" alt=""><b>${x.label}</b><small>${x.title}</small></button>`).join("");
 document.querySelectorAll(".dev-card").forEach(b=>b.onclick=()=>openBabyDialog(patientStages.find(x=>x.label===b.dataset.stage)));
}
function openBabyDialog(stage){
 if(!stage)return;
 $("#dialogBabyImage").src=stage.img;$("#dialogStage").textContent=stage.label;$("#dialogTitle").textContent=stage.title;$("#dialogText").textContent=stage.text;
 $("#babyDialog").showModal();
}
function switchToPatient(){
 $("#professionalMode").hidden=true;$("#patientMode").hidden=false;
 $("#modePro").classList.remove("active");$("#modePatient").classList.add("active");
 renderPatient();window.scrollTo({top:0,behavior:"smooth"});
}
function switchToPro(){
 $("#patientMode").hidden=true;$("#professionalMode").hidden=false;
 $("#modePatient").classList.remove("active");$("#modePro").classList.add("active");
 window.scrollTo({top:0,behavior:"smooth"});
}
$("#modePatient")?.addEventListener("click",switchToPatient);
$("#modePro")?.addEventListener("click",switchToPro);
$("#backToPro")?.addEventListener("click",switchToPro);
$("#returnCalc")?.addEventListener("click",switchToPro);
$("#fetalImageButton")?.addEventListener("click",()=>{const d=currentPregnancyData();if(d)openBabyDialog(patientStageFor(d.w))});
$("#showAllStages")?.addEventListener("click",()=>document.querySelector(".development-section")?.scrollIntoView({behavior:"smooth"}));
$("#sharePatient")?.addEventListener("click",async()=>{
 const d=currentPregnancyData();if(!d)return;
 const text=`Grossesse : ${d.w} SA${d.j?` + ${d.j} j`:""} aujourd’hui — terme prévu : ${fmt(d.dpa,true)}.`;
 if(navigator.share){try{await navigator.share({title:"Mon calendrier de grossesse",text})}catch{}}
 else{try{await navigator.clipboard.writeText(text);alert("Calendrier copié.")}catch{}}
});


function patientDDG(){
 const start=ddr();
 return start?add(start,14):null;
}
function buildPatientURL(ddgDate){
 const u=new URL(window.location.href);
 u.search="";
 u.hash="";
 u.searchParams.set("mode","patiente");
 u.searchParams.set("ddg",iso(ddgDate));
 return u.toString();
}
function showPatientQR(){
 const ddgDate=patientDDG();
 if(!ddgDate){alert("Renseignez d’abord une DDG ou une DDR.");return}
 const start=ddr(), dpa=add(start,287), url=buildPatientURL(ddgDate);
 $("#qrDDG").textContent=fmt(ddgDate,true);
 $("#qrDPA").textContent=fmt(dpa,true);
 $("#patientQRCode").innerHTML="";
 $("#patientQRCode").dataset.url=url;
 $("#qrStatus").textContent="";
 if(window.QRCode){
   new QRCode($("#patientQRCode"),{text:url,width:214,height:214,colorDark:"#07162f",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.M}); setTimeout(preparePrintableQR,120);
 }else{
   $("#patientQRCode").innerHTML='<div style="color:#07162f;text-align:center;padding:18px;font-weight:800">QR indisponible hors connexion.<br><small>Utilisez “Copier le lien patiente”.</small></div>';
 }
 $("#patientQRDialog").showModal();
}
$("#openPatientQR")?.addEventListener("click",showPatientQR);
$("#closePatientQR")?.addEventListener("click",()=>$("#patientQRDialog").close());

function preparePrintableQR(){
  const qrRoot=$("#patientQRCode");
  const printImg=$("#printQRCodeImage");
  if(!qrRoot||!printImg)return;
  const canvas=qrRoot.querySelector("canvas");
  const img=qrRoot.querySelector("img");
  if(canvas){
    try{printImg.src=canvas.toDataURL("image/png")}catch{}
  }else if(img){
    printImg.src=img.src;
  }
  $("#printDDG").textContent=$("#qrDDG")?.textContent||"";
  $("#printDPA").textContent=$("#qrDPA")?.textContent||"";
}
function printPatientQR(){
  preparePrintableQR();
  document.body.classList.add("printing-patient-qr");
  setTimeout(()=>window.print(),80);
}
window.addEventListener("afterprint",()=>document.body.classList.remove("printing-patient-qr"));
$("#printPatientQR")?.addEventListener("click",printPatientQR);

$("#copyPatientLink")?.addEventListener("click",async()=>{
 const url=$("#patientQRCode").dataset.url;
 if(!url)return;
 try{
   await navigator.clipboard.writeText(url);
   $("#qrStatus").textContent="Lien patiente copié ✓";
 }catch{
   $("#qrStatus").textContent=url;
 }
});

function savePatientDDG(value){
 try{localStorage.setItem("roulette_patient_ddg",value)}catch{}
}
function loadPatientDDG(){
 try{return localStorage.getItem("roulette_patient_ddg")}catch{return null}
}
function addPatientWelcome(){
 if($("#patientWelcome"))return;
 const box=document.createElement("div");
 box.id="patientWelcome";box.className="patient-first-open";
 box.innerHTML="<b>Votre grossesse est enregistrée sur cet appareil ✓</b><small>Revenez quand vous voulez : le terme du jour et le développement de votre bébé se mettront à jour automatiquement. Sur iPhone, vous pouvez faire Partager → Sur l’écran d’accueil pour garder l’application avec vos autres apps.</small>";
 const header=document.querySelector(".patient-header");
 header?.insertAdjacentElement("afterend",box);
}
function initPatientLink(){
 const params=new URLSearchParams(location.search);
 let ddgValue=null;
 if(params.get("mode")==="patiente" && /^\d{4}-\d{2}-\d{2}$/.test(params.get("ddg")||"")){
   ddgValue=params.get("ddg");
   savePatientDDG(ddgValue);
 }else if(params.get("mode")==="patiente"){
   ddgValue=loadPatientDDG();
 }else if(!params.get("mode") && loadPatientDDG() && window.matchMedia("(display-mode: standalone)").matches){
   ddgValue=loadPatientDDG();
 }
 if(ddgValue){
   mode="ddg";
   document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.mode==="ddg"));
   $("#mainLabel").textContent="DDG";
   $("#method").textContent="DDG = DDR + 14 jours • DPA = DDG + 39 semaines";
   mainDate.value=ddgValue;
   selected=null;
   render();
   switchToPatient();
   addPatientWelcome();
 }
}
initPatientLink();

if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");