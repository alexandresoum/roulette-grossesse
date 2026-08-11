const DAY=86400000,$=s=>document.querySelector(s);
let mode="ddg",selected=null,dragging=false,lastRawAngle=0,unwrappedAngle=0,dragBaseDate=null,dragDays=0,rotorBase=0,rafPending=false;
let patientLocked=false;
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
 {
  min:0,max:7,label:"6 SA",img:"assets/6sa.png",
  sizeLabel:"≈ 5 mm",weightLabel:"≈ 0,1 g",sizeNum:0.5,measureNote:"",
  cheveux:"La peau est encore très fine et en plein développement ; aucune pilosité n’est visible à ce stade.",
  title:"Les tout premiers développements",
  text:"La croissance est très rapide. Les premières structures du futur cerveau, du cœur et des membres commencent à se mettre en place.",
  organes:"Le cœur débute son activité et les ébauches du cerveau, du tube digestif et des membres se développent.",
  sensoriel:"Le système nerveux commence à se structurer ; les fonctions sensorielles sont encore très immatures.",
  interaction:"Les premiers mouvements cellulaires et embryonnaires existent, mais ils ne sont pas encore perceptibles."
 },
 {
  min:8,max:9,label:"8 SA",img:"assets/8sa.png",
  sizeLabel:"≈ 1,6 cm",weightLabel:"≈ 1 g",sizeNum:1.6,measureNote:"",
  cheveux:"La peau reste très fine et poursuit sa formation ; la pilosité n’est pas encore développée.",
  title:"Les organes prennent forme",
  text:"La silhouette se précise rapidement : tête, tronc, bras et jambes deviennent de plus en plus reconnaissables.",
  organes:"Les principaux organes sont en formation et le cœur poursuit son développement.",
  sensoriel:"Le cerveau se développe rapidement et les premières connexions nerveuses apparaissent.",
  interaction:"De petits mouvements spontanés commencent, encore trop discrets pour être ressentis."
 },
 {
  min:10,max:11,label:"10 SA",img:"assets/10sa.png",
  sizeLabel:"≈ 3,1 cm",weightLabel:"≈ 4 g",sizeNum:3.1,measureNote:"tête aux fesses (LCC)*",
  cheveux:"La peau poursuit sa maturation et les futurs follicules pileux se mettent progressivement en place.",
  title:"Une silhouette de plus en plus humaine",
  text:"Les traits se dessinent et les doigts et les orteils sont individualisés. La croissance reste très rapide.",
  organes:"Les organes essentiels sont présents et poursuivent leur maturation et leur organisation.",
  sensoriel:"Le système nerveux commence à coordonner des réponses motrices simples.",
  interaction:"Le fœtus réalise des mouvements réflexes spontanés visibles à l’échographie."
 },
 {
  min:12,max:15,label:"12 SA",img:"assets/12sa.png",
  sizeLabel:"≈ 5,4 cm",weightLabel:"≈ 14 g",sizeNum:5.4,measureNote:"tête aux fesses (LCC)*",
  cheveux:"La peau reste fine ; le cuir chevelu se structure et les follicules pileux poursuivent leur développement.",
  title:"Fin du premier trimestre",
  text:"Le bébé bouge déjà beaucoup même si ces mouvements ne sont généralement pas encore perçus par la mère.",
  organes:"Les organes sont en place et poursuivent leur maturation ; les reins commencent notamment à fonctionner.",
  sensoriel:"Le système nerveux se complexifie et les récepteurs sensoriels commencent progressivement à se développer.",
  interaction:"Il peut ouvrir la bouche, déglutir du liquide amniotique et effectuer de nombreux mouvements."
 },
 {
  min:16,max:19,label:"16 SA",img:"assets/16sa.png",
  sizeLabel:"≈ 16 cm",weightLabel:"≈ 120 g",sizeNum:16,measureNote:"de la tête aux pieds*",
  cheveux:"La peau est encore fine et peu graisseuse ; le lanugo, un duvet très fin, commence progressivement à apparaître.",
  title:"Croissance et mouvements",
  text:"Le corps s’allonge et les mouvements deviennent plus coordonnés. Certaines patientes commencent à les ressentir.",
  organes:"Le foie, les reins et le système digestif poursuivent leur maturation.",
  sensoriel:"L’audition se met progressivement en place ; le goût et l’odorat poursuivent également leur développement.",
  interaction:"Le bébé bouge, se retourne, porte parfois les mains au visage ou suce son pouce."
 },
 {
  min:20,max:23,label:"20 SA",img:"assets/20sa.png",
  sizeLabel:"≈ 25 cm",weightLabel:"≈ 320 g",sizeNum:25,measureNote:"de la tête aux pieds*",
  cheveux:"La peau est protégée progressivement par le vernix et le lanugo devient bien présent ; les cheveux commencent à pousser.",
  title:"Le monde extérieur devient perceptible",
  text:"Le développement moteur et sensoriel s’accélère et les mouvements sont de mieux en mieux coordonnés.",
  organes:"Le squelette se renforce et les différents organes poursuivent leur croissance et leur spécialisation.",
  sensoriel:"L’audition progresse : le bébé perçoit de plus en plus les sons internes et certaines voix extérieures.",
  interaction:"Il réagit aux mouvements maternels, aux changements de position et progressivement à certains sons."
 },
 {
  min:24,max:27,label:"24 SA",img:"assets/24sa.png",
  sizeLabel:"≈ 30 cm",weightLabel:"≈ 600 g",sizeNum:30,measureNote:"de la tête aux pieds*",
  cheveux:"La peau reste fine mais poursuit sa maturation ; vernix et lanugo la protègent, tandis que les cheveux deviennent plus visibles.",
  title:"Votre bébé réagit davantage",
  text:"La maturation neurologique et pulmonaire se poursuit. Les périodes de sommeil et d’éveil commencent à être mieux organisées.",
  organes:"Les poumons poursuivent leur maturation et le cerveau développe de nouvelles connexions.",
  sensoriel:"Les réactions aux sons et à la lumière deviennent plus nettes.",
  interaction:"Le bébé peut réagir à votre voix, à la musique, aux mouvements et aux stimulations extérieures."
 },
 {
  min:28,max:31,label:"28 SA",img:"assets/28sa.png",
  sizeLabel:"≈ 38 cm",weightLabel:"≈ 1 kg",sizeNum:38,measureNote:"de la tête aux pieds*",
  cheveux:"La peau s’épaissit progressivement avec l’augmentation de la graisse sous-cutanée ; les cheveux sont visibles et le lanugo reste présent.",
  title:"Entrée dans le troisième trimestre",
  text:"La prise de poids devient importante et le cerveau poursuit une phase intense de maturation.",
  organes:"Les poumons, le cerveau et le système digestif continuent à mûrir ; les réserves corporelles augmentent.",
  sensoriel:"Il reconnaît progressivement des sons familiers et différencie davantage les périodes de lumière et d’obscurité.",
  interaction:"Les mouvements sont francs et les cycles veille-sommeil deviennent plus organisés."
 },
 {
  min:32,max:36,label:"32 SA",img:"assets/32sa.png",
  sizeLabel:"≈ 42 cm",weightLabel:"≈ 1,7 kg",sizeNum:42,measureNote:"de la tête aux pieds*",
  cheveux:"La peau devient plus lisse avec l’accumulation de graisse sous-cutanée ; les cheveux sont visibles et le lanugo commence à diminuer.",
  title:"Une maturation de plus en plus complète",
  text:"Le bébé prend du poids rapidement et se prépare progressivement à la vie après la naissance.",
  organes:"Les poumons sont presque matures et le système immunitaire continue à se développer.",
  sensoriel:"La vue et l’audition progressent ; il perçoit les variations lumineuses et reconnaît des sons familiers.",
  interaction:"Il manque progressivement de place mais ses mouvements restent présents et bien perceptibles."
 },
 {
  min:37,max:45,label:"37–41 SA",img:"assets/37sa.png",
  sizeLabel:"≈ 48–52 cm",weightLabel:"≈ 2,9–3,5 kg",sizeNum:50,measureNote:"de la tête aux pieds*",
  cheveux:"La peau est plus épaisse et plus lisse à terme ; la quantité de cheveux varie selon les bébés et le lanugo a en grande partie disparu.",
  title:"Bébé à terme",
  text:"À partir de 37 SA, la grossesse entre dans la période du terme. Le bébé poursuit surtout sa prise de poids.",
  organes:"Les grandes fonctions sont matures et prêtes à assurer l’adaptation à la vie extra-utérine.",
  sensoriel:"Les sens sont fonctionnels : audition, toucher, goût, odorat et vision poursuivront leur maturation après la naissance.",
  interaction:"Il réagit aux voix, au toucher et aux mouvements ; il alterne périodes de sommeil et d’éveil."
 }
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
 $("#babyFact1").textContent="Organes";
 $("#babyFact2").textContent="Sensoriel";
 $("#babyFact3").textContent="Interactions";
 $("#babyFact4").textContent="Peau / cheveux";
 $("#babyFact1Text").textContent=s.organes;
 $("#babyFact2Text").textContent=s.sensoriel;
 $("#babyFact3Text").textContent=s.interaction;
 $("#babyFact4Text").textContent=s.cheveux;
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
 $("#developmentCards").innerHTML=patientStages.map(x=>`
 <button class="dev-card ${x===s?"active":""}" data-stage="${x.label}">
   <img src="${x.img}" alt="Illustration du développement fœtal à ${x.label}">
   <b>${x.label}</b>
   <strong>${x.title}</strong>
   <p>${x.text}</p>
   <span class="dev-info"><i>Organes</i>${x.organes}</span>
   <span class="dev-info"><i>Sensoriel</i>${x.sensoriel}</span>
   <span class="dev-info"><i>Interactions</i>${x.interaction}</span>
   <span class="dev-info"><i>Peau / cheveux</i>${x.cheveux}</span>
 </button>`).join("");
 document.querySelectorAll(".dev-card").forEach(b=>b.onclick=()=>openBabyDialog(patientStages.find(x=>x.label===b.dataset.stage)));
}
function openBabyDialog(stage){
 if(!stage)return;
 const img=$("#dialogBabyImage"),stageEl=$("#dialogStage"),sizeEl=$("#growthSize"),weightEl=$("#growthWeight"),chart=$("#growthChart");
 if(!img||!stageEl||!sizeEl||!weightEl||!chart)return;
 img.src=stage.img;
 stageEl.textContent=stage.label;
 $("#dialogTitle").textContent="Votre bébé aujourd’hui";
 sizeEl.textContent=stage.sizeLabel;
 weightEl.textContent=stage.weightLabel;
 const measureNote=$("#growthMeasureNote");
 if(measureNote){
   measureNote.textContent=stage.measureNote||"";
   measureNote.style.visibility=stage.measureNote?"visible":"hidden";
 }

 const activeIndex=patientStages.indexOf(stage);
 const maxSize=Math.max(...patientStages.map(s=>s.sizeNum||0));
 chart.innerHTML=patientStages.map((s,i)=>{
   const h=Math.max(8,Math.round(((s.sizeNum||0)/maxSize)*76));
   return `<div class="growth-point ${i===activeIndex?"active":""} ${i<=activeIndex?"done":""}">
     <div class="growth-bar-area">
       <span class="growth-bar" style="height:${h}px"></span>
       <span class="growth-dot"></span>
     </div>
     <b>${s.label.replace("–41","")}</b>
     <small>${s.sizeLabel}</small>
   </div>`;
 }).join("");
 $("#babyDialog")?.showModal();
}

const PRO_PIN="1612";
let proUnlocked=false;

function openProPin(){
  if(patientLocked)return;
  const dlg=$("#proPinDialog");
  $("#proPinInput").value="";
  $("#proPinError").textContent="";
  dlg?.showModal();
  setTimeout(()=>$("#proPinInput")?.focus(),50);
}

function unlockProWithPin(pin){
  if(pin===PRO_PIN){
    proUnlocked=true;
    patientLocked=false;
    document.body.classList.remove("pro-locked","patient-locked");
    $("#proPinDialog")?.close();
    $("#patientMode").hidden=true;
    $("#professionalMode").hidden=false;
    $("#modePatient")?.classList.remove("active");
    $("#modePro")?.classList.add("active");
    window.scrollTo({top:0,behavior:"smooth"});
    return true;
  }
  $("#proPinError").textContent="Code incorrect";
  $("#proPinInput")?.select();
  return false;
}

$("#proPinForm")?.addEventListener("submit",(e)=>{
  e.preventDefault();
  unlockProWithPin($("#proPinInput").value.trim());
});
$("#closeProPin")?.addEventListener("click",()=>$("#proPinDialog")?.close());


function switchToPatient(){
 $("#professionalMode").hidden=true;$("#patientMode").hidden=false;
 $("#modePro")?.classList.remove("active");$("#modePatient")?.classList.add("active");
 document.body.classList.toggle("patient-locked",patientLocked);
 renderPatient();window.scrollTo({top:0,behavior:"smooth"});
}
function switchToPro(force=false){
 if(patientLocked)return;
 if(!force && !proUnlocked){openProPin();return;}
 $("#patientMode").hidden=true;$("#professionalMode").hidden=false;
 $("#modePatient")?.classList.remove("active");$("#modePro")?.classList.add("active");
 document.body.classList.remove("patient-locked");
 window.scrollTo({top:0,behavior:"smooth"});
}
$("#modePatient")?.addEventListener("click",switchToPatient);
$("#modePro")?.addEventListener("click",()=>switchToPro());
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
   patientLocked=true;
   ddgValue=params.get("ddg");
   savePatientDDG(ddgValue);
    try{history.replaceState(null,"",location.pathname+location.hash)}catch{}
 }else if(params.get("mode")==="patiente"){
   patientLocked=true;
   ddgValue=loadPatientDDG();
 }else if(!params.get("mode") && loadPatientDDG() && window.matchMedia("(display-mode: standalone)").matches){
   patientLocked=true;
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


/* Verrouillage strict de l'espace patiente */
document.addEventListener("click",(e)=>{
  if(!patientLocked)return;
  const forbidden=e.target.closest("#modePro,#backToPro,#returnCalc,[data-target='professionalMode'],[data-mode='pro']");
  if(forbidden){e.preventDefault();e.stopImmediatePropagation();}
},true);




/* V5.7.5 — purge des anciennes versions sur navigateur classique */
(function purgeLegacyBrowserCache(){
 const standalone=window.matchMedia("(display-mode: standalone)").matches;
 if(standalone)return;
 if("caches" in window){
   caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("roulette-v5")).map(k=>caches.delete(k)))).catch(()=>{});
 }
})();

/* Démarrage V5.7.4 : QR = Patiente ; PWA patiente = Patiente ; navigateur normal = Pro */
(function bootApp(){
 const params=new URLSearchParams(location.search);
 const patientFromQR=params.get("mode")==="patiente";
 const patientStandalone=!patientFromQR && window.matchMedia("(display-mode: standalone)").matches && !!loadPatientDDG();

 if(patientFromQR || patientStandalone){
   initPatientLink();
   return;
 }

 patientLocked=false;
 proUnlocked=false;
 document.body.classList.remove("patient-locked");
 document.body.classList.add("pro-locked");
 $("#patientMode").hidden=true;
 $("#professionalMode").hidden=true;
 setTimeout(openProPin,80);
})();

if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js?v=5.7.5",{updateViaCache:"none"});

