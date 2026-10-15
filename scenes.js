// Scene builders + slot timelines. Depends on helpers in template.html.
const SLOTS={
 morning:{hi_th:'อรุณสวัสดิ์ เชียงใหม่',hi_en:'Good morning, the north',q_th:'เช้านี้เป็นไงบ้าง?',q_en:"How's this morning?",cards:[['sky','WEATHER'],['haze','PM2.5 · SMOKE'],['cal','7 DAYS']],body:['weatherNow','air','forecast7'],cta_th:'เช็คฝน ฝุ่น ก่อนออกจากบ้าน',cta_en:'Check rain & smoke before you go'},
 noon:{hi_th:'เที่ยงนี้มีอะไร?',hi_en:"What's on today?",q_th:'วันนี้มีอะไรบ้าง?',q_en:"What's on?",cards:[['map','OPEN NOW'],['film','MOVIES'],['lant','COMING UP']],body:['openNow','cinema','festival'],cta_th:'ร้านเปิด หนังฉาย งานใกล้ตัว',cta_en:"What's open, showing and coming up"},
 evening:{hi_th:'คืนนี้ที่ภาคเหนือ',hi_en:'Tonight in the north',q_th:'คืนนี้มีอะไร?',q_en:"What's on tonight?",cards:[['moon','SKY TONIGHT'],['film','LATE SHOWS'],['sunrise','TOMORROW']],body:['sky','cinema','tomorrow'],cta_th:'วางแผนพรุ่งนี้ได้ที่นี่',cta_en:"Plan tomorrow, right here"}};
const S=SLOTS[SLOT]||SLOTS.morning;

function illus(kind){
 const sunG=`<div class="abs" style="left:230px;top:70px;width:140px;height:140px;border-radius:50%;background:radial-gradient(#ffe08a,#f6b33a);box-shadow:0 0 60px 20px rgba(255,200,90,.5)"></div>`;
 if(kind==='sky')return `<div class="abs" style="inset:0;background:linear-gradient(#7fbde8,#cfe8f7)"></div>${sunG}<div class="abs" style="left:120px;top:120px">${wxIcon('cloud',260)}</div>`;
 if(kind==='haze')return `<div class="abs" style="inset:0;background:linear-gradient(#e9b98a,#f3dcc0)"></div>${sunG}<svg class="abs" style="left:0;bottom:0" width="600" height="260" viewBox="0 0 600 260"><path d="M0 160 L120 70 L220 140 L330 40 L460 150 L600 90 V260 H0Z" fill="#b98c6c" opacity=".7"/><path d="M0 210 L150 130 L280 200 L420 120 L600 190 V260 H0Z" fill="#8d6a52" opacity=".8"/></svg>`;
 if(kind==='cal')return `<div class="abs" style="inset:0;background:#f8e9c4"></div>`+[...Array(7)].map((_,i)=>`<div class="abs" style="left:${30+i*80}px;top:${110+Math.sin(i)*20}px;width:64px;height:${120+((i*37)%60)}px;border-radius:14px;background:${['#f2c641','#f08a2c','#c8352a','#f2c641','#5aa86a','#3b8fd0','#f08a2c'][i]};border:3px solid #2a1f19"></div>`).join('');
 if(kind==='map'){seed=11;return `<div class="abs" style="inset:0;background:#cfe5c0"></div><div class="abs" style="left:150px;top:60px;width:300px;height:280px;border:22px solid #9fd3e8;border-radius:30px;background:#faf5ea;outline:6px solid #fff"></div>`+[...Array(9)].map(()=>`<div class="abs" style="left:${190+rnd()*200}px;top:${100+rnd()*170}px;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${['#c8352a','#f2c641','#5aa86a'][Math.floor(rnd()*3)]};border:3px solid #2a1f19"></div>`).join('')}
 if(kind==='film')return `<div class="abs" style="inset:0;background:#1f1714"></div><div class="abs" style="left:-40px;top:0;width:340px;height:420px;background:conic-gradient(from 160deg at 50% 0,transparent 0 10deg,rgba(255,230,160,.45) 20deg 30deg,transparent 40deg);"></div><div class="abs" style="left:150px;top:150px;width:300px;height:170px;background:#faf5ea;border-radius:10px;border:6px solid #f2c641;display:flex;align-items:center;justify-content:center;font:800 60px KanitL;color:#c8352a">▶</div>`;
 if(kind==='lant'){seed=5;return `<div class="abs" style="inset:0;background:linear-gradient(#2b1d3a,#7a3a3a)"></div>`+[...Array(9)].map(()=>`<div class="lantern" style="left:${rnd()*540}px;top:${30+rnd()*300}px;transform:scale(${.7+rnd()})"></div>`).join('')}
 if(kind==='moon')return `<div class="abs" style="inset:0;background:linear-gradient(#141b3a,#3b2f5a)"></div><div class="abs" style="left:150px;top:10px;transform:scale(.55);transform-origin:0 0">${moonSVG(D.moon,180)}</div>`;
 if(kind==='sunrise')return `<div class="abs" style="inset:0;background:linear-gradient(#f9c98b,#fbe6c4)"></div><div class="abs" style="left:220px;top:190px;width:170px;height:170px;border-radius:50%;background:#f6a33a;box-shadow:0 0 70px 20px rgba(255,170,80,.6)"></div><svg class="abs" style="left:0;bottom:0" width="600" height="200"><path d="M0 120 Q150 40 300 110 T600 90 V200 H0Z" fill="#5aa86a"/><path d="M0 160 Q200 100 380 150 T600 140 V200 H0Z" fill="#3f8a52"/></svg>`;
 return ''}

// ---------------- common scenes ----------------
function sIntro(st,du){
 const rots=[-8,6,-4];const xs=[60,420,170];const ys=[420,620,980];
 const cards=S.cards.map(([k,tag],i)=>`<div class="abs card" data-in="${.15+i*.28}" data-d=".9" data-fx="fly" data-fx2="${i%2?700:-700}" data-float="6" style="left:${xs[i]}px;top:${ys[i]}px;width:600px;height:500px;transform:rotate(${rots[i]}deg);overflow:hidden;padding:0">
  <div class="abs" style="left:0;right:0;top:0;height:420px;overflow:hidden;border-bottom:4px solid var(--ink)">${illus(k)}</div>
  <div class="abs mono" style="left:26px;top:20px;font-size:22px;font-weight:600;background:var(--cream);padding:4px 12px;border-radius:8px;border:3px solid var(--ink)">0${i+1}/03</div>
  <div class="abs mono" style="right:22px;top:20px;font-size:20px;font-weight:600;background:var(--cream);padding:4px 14px;border-radius:999px;border:3px solid var(--ink)">${tag}</div>
  <div class="abs th" style="left:26px;bottom:14px;font-size:40px;font-weight:700">${['วันนี้','ตอนนี้','เร็ว ๆ นี้'][i]} <span class="mono" style="font-size:20px;opacity:.6">${['TODAY','NOW','SOON'][i]}</span></div></div>`).join('');
 return scene(st,du,`
 <div class="abs center th" data-in="0" style="top:90px;font-size:40px;font-weight:700">เชียงใหม่ · เชียงราย · ตอนนี้</div>
 <div class="abs center mono" data-in=".1" style="top:146px;font-size:22px;opacity:.6">CHIANG MAI · CHIANG RAI · NOW</div>
 <div class="abs center" data-in=".2" data-fx="pop" style="top:200px"><span class="live"><i></i>LIVE <b>${D.now}</b> · ${D.date_short.toUpperCase()}</span></div>
 ${cards}
 <div class="abs center" data-in="2.2" data-d=".8" data-fx="drop" style="top:1500px"><div class="title" style="display:inline-block;background:var(--yellow);border:5px solid var(--ink);box-shadow:12px 14px 0 var(--ink);padding:18px 46px;border-radius:24px;transform:rotate(-3deg)">${S.q_th}</div></div>
 <div class="abs center" data-in="2.6" style="top:1690px;font-size:46px;font-weight:800;color:var(--red)">${S.q_en}</div>`,{});}

function sBrand(st,du){
 return scene(st,du,`
 ${[520,700,880].map((r,i)=>`<div class="abs ringc" style="left:${540-r/2}px;top:${760-r/2}px;width:${r}px;height:${r}px;border-radius:50%;border:3px ${i==1?'dashed':'solid'} rgba(255,240,220,.18)"></div>`).join('')}
 <div class="abs" data-in=".15" data-d=".9" data-fx="pop" style="left:340px;top:560px">${badge(400,'bdg')}</div>
 <div class="abs center th" data-in=".9" style="top:930px;font-size:220px;font-weight:800;color:var(--cream);line-height:1;text-shadow:8px 10px 0 var(--deep)">มดแดง</div>
 <div class="abs" data-in="1.3" data-fx="growX" style="left:300px;top:1195px;width:480px;height:14px;border-radius:7px;background:var(--yellow);transform-origin:left"></div>
 <div class="abs center mono" data-in="1.5" style="top:1235px;font-size:44px;font-weight:600;color:var(--yellow);letter-spacing:.2em">MOT DANG</div>
 <div class="abs center th" data-in="1.8" style="top:1310px;font-size:56px;font-weight:700;color:var(--cream)">เชียงใหม่ · เชียงราย ตอนนี้</div>
 <div class="abs center body" data-in="2.0" style="top:1385px;font-size:38px;color:#ffd9cf">Chiang Mai & Chiang Rai, now</div>
 <div class="abs" style="left:0;right:0;bottom:0;height:240px;background:var(--cream);border-top:6px solid var(--ink)"></div>
 <div class="abs antw" style="left:0;top:1470px">${ant(330,'antB')}</div>`,
 {bg:'var(--red)',trans:'tear',color:'var(--cream)',lanterns:16,update:(lt,s)=>{
  s.el.querySelectorAll('.bdg .logo *').forEach((p,i)=>{const k=E.out(P(lt,.5+i*.05,1.4+i*.05));p.style.strokeDasharray=1;p.style.strokeDashoffset=1-k});
  s.el.querySelectorAll('.ringc').forEach((r,i)=>r.style.transform=`rotate(${lt*(i%2?-12:9)}deg) scale(${1+Math.sin(lt*2+i)*.02})`);
  const a=s.el.querySelector('.antw');const x=-380+Math.min(lt,3.2)*190;a.style.transform=`translateX(${x}px)`;antUpdate(a.querySelector('svg'),lt,lt<3.2);}});}

function sOutro(st,du){
 return scene(st,du,`
 <div class="abs" data-in=".1" data-d=".9" data-fx="pop" style="left:370px;top:260px">${badge(340,'bdg')}</div>
 <div class="abs center th" data-in=".6" style="top:640px;font-size:200px;font-weight:800;color:var(--red);line-height:1;text-shadow:5px 6px 0 rgba(42,31,25,.85)">มดแดง</div>
 <div class="abs center mono" data-in=".9" style="top:880px;font-size:40px;font-weight:600;color:var(--red);letter-spacing:.2em">MOT DANG</div>
 <div class="abs center th" data-in="1.1" style="top:950px;font-size:52px;font-weight:700">${S.cta_th}</div>
 <div class="abs center body" data-in="1.3" style="top:1025px;font-size:36px;opacity:.75">${S.cta_en}</div>
 <div class="abs center" data-in="1.6" data-fx="pop" style="top:1130px"><span class="pill url" style="display:inline-block;background:var(--red);color:var(--cream);font-family:Mono;font-weight:600;font-size:64px;padding:22px 64px;border:5px solid var(--ink);box-shadow:10px 12px 0 var(--ink)"><span data-in="1.9" data-d="1" data-fx="wipe" style="display:inline-block">motdang.net</span></span></div>
 <div class="abs center" data-in="2.4" style="top:1310px"><span class="pill" style="display:inline-flex;border:4px solid var(--ink);overflow:hidden;font-weight:800;font-size:34px"><span style="background:var(--ink);color:var(--cream);padding:8px 26px">ไทย</span><span style="padding:8px 26px">EN</span></span></div>
 <div class="abs cursor" style="left:700px;top:1250px;font-size:80px">👆</div>
 <div class="abs antw" style="left:0;top:1440px">${ant(300,'antO',true)}</div>
 ${FOOT('ข้อมูลจาก motdang.net · Open-Meteo · Major Cineplex')}`,{trans:'tear',lanterns:9,update:(lt,s)=>{
  s.el.querySelectorAll('.bdg .logo *').forEach((p,i)=>{const k=E.out(P(lt,.4+i*.04,1.3+i*.04));p.style.strokeDasharray=1;p.style.strokeDashoffset=1-k});
  const a=s.el.querySelector('.antw');const x=1100-Math.min(lt,3)*230;a.style.transform=`translateX(${x}px)`;antUpdate(a.querySelector('svg'),lt,lt<3);
  const c=s.el.querySelector('.cursor');const k=E.out(P(lt,2.6,3.4));const click=P(lt,3.4,3.7);c.style.transform=`translate(${(1-k)*300}px,${(1-k)*400}px) scale(${1-Math.sin(click*Math.PI)*.2})`;c.style.opacity=k;
  const u=s.el.querySelector('.url');u.style.transform=`scale(${1+Math.sin(click*Math.PI)*.06})`;}});}

// ---------------- body components ----------------
const header=(th,en,dark)=>`<div class="abs center th" data-in=".25" style="top:95px;font-size:84px;font-weight:800;line-height:1.1;${dark?'color:var(--cream)':''}">${th}</div>
 <div class="abs center sub" data-in=".4" style="top:205px;${dark?'color:var(--yellow)':''}">${en}</div>`;

function cWeatherNow(st,du){
 const city=(c,i)=>`<div class="abs card" data-in="${.5+i*.35}" data-fx="${i?'right':'left'}" style="left:60px;top:${330+i*520}px;width:960px;height:470px">
  <div class="abs" style="left:20px;top:40px">${wxIcon(c.kind,270)}</div>
  <div class="abs th" style="left:330px;top:24px;font-size:46px;font-weight:700">${c.th} <span class="body" style="font-size:28px;opacity:.6">${c.en}</span></div>
  <div class="abs big" style="left:322px;top:78px;font-size:170px;line-height:1;color:var(--red)"><span data-count="${c.temp}" data-cin="${.8+i*.35}" data-suf="°"></span></div>
  <div class="abs th" style="left:330px;top:258px;font-size:40px;font-weight:700">${c.wx_th} <span class="body" style="font-size:28px;opacity:.6">· ${c.wx_en}</span></div>
  <div class="abs" style="left:24px;right:24px;bottom:22px;display:flex;gap:14px">
   ${[['รู้สึก','FEELS',c.feels+'°'],['ความชื้น','HUMID',c.humidity+'%'],['ลม','WIND',Math.round(c.wind)+' km/h'],['UV','UV',(c.uv??0).toFixed(1)]].map(([a,b,v],j)=>`<div data-in="${1.2+i*.35+j*.1}" data-fx="pop" style="flex:1;background:${['#fde9c8','#dcefff','#e3f3e2','#fff1b8'][j]};border:3px solid var(--ink);border-radius:16px;padding:8px 14px"><div class="th" style="font-size:22px;font-weight:500">${a} <span class="mono" style="font-size:15px;opacity:.6">${b}</span></div><div class="big" style="font-size:38px;line-height:1.1">${v}</div></div>`).join('')}</div></div>`;
 const day=cm.days[0]||{};const sr=day.sunrise||'06:15',ss=day.sunset||'18:00';
 const tm=x=>{const[h,m]=x.split(':').map(Number);return h*60+m};const pos=clamp((tm(D.now)-tm(sr))/(tm(ss)-tm(sr)));
 return scene(st,du,`
 <div class="abs" style="inset:0;background:linear-gradient(#8cc8ee 0%,#cfe8f7 45%,#fbf1dc 100%)"></div>
 ${[[80,300,1.4],[700,470,1],[300,1380,1.2]].map(([x,y,s],i)=>`<div class="abs bgc" data-i="${i}" style="left:${x}px;top:${y}px;opacity:.55;transform:scale(${s})">${wxIcon('cloud',260)}</div>`).join('')}
 ${header('อากาศเช้านี้','THIS MORNING · WEATHER')}
 ${city(cm,0)}${city(cr,1)}
 <div class="abs card" data-in="1.6" style="left:60px;top:1390px;width:960px;height:380px">
  <div class="abs th" style="left:30px;top:20px;font-size:36px;font-weight:700">พระอาทิตย์วันนี้ <span class="mono" style="font-size:20px;opacity:.6">SUN TODAY · CHIANG MAI</span></div>
  <svg class="abs" style="left:60px;top:80px" width="840" height="240" viewBox="0 0 840 240"><path id="arc" d="M30 220 Q420 -120 810 220" fill="none" stroke="#e7c98a" stroke-width="8" stroke-dasharray="4 18" stroke-linecap="round"/><path class="arcp" d="M30 220 Q420 -120 810 220" fill="none" stroke="#f2a32c" stroke-width="10" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/><line x1="0" y1="222" x2="840" y2="222" stroke="#2a1f19" stroke-width="4"/><circle class="sunp" r="26" fill="#ffc93c" stroke="#2a1f19" stroke-width="5"/></svg>
  <div class="abs" style="left:40px;bottom:16px;font-size:40px;font-weight:800">↑ ${sr}</div><div class="abs" style="right:40px;bottom:16px;font-size:40px;font-weight:800">${ss} ↓</div>
 </div>${FOOT('ข้อมูลจาก motdang.net · Open-Meteo')}`,{trans:'iris',update:(lt,s)=>{
  s.el.querySelectorAll('.bgc').forEach(c=>c.style.translate=`${Math.sin(lt*.4+ +c.dataset.i)*40+lt*8}px 0`);
  const k=E.io(P(lt,2.2,4.2))*pos;s.el.querySelector('.arcp').style.strokeDashoffset=1-k;
  const arc=s.el.querySelector('#arc');const L=arc.getTotalLength();const pt=arc.getPointAtLength(L*k);const sp=s.el.querySelector('.sunp');sp.setAttribute('cx',pt.x);sp.setAttribute('cy',pt.y);sp.setAttribute('r',26+Math.sin(lt*4)*2);}});}

function cAir(st,du){
 const v=aCM.pm25;const [col,bth,ben]=BAND(v);
 const bands=[[0,15,'#3bb2d0'],[15,25,'#4caf50'],[25,37.5,'#f2c641'],[37.5,75,'#f08a2c'],[75,100,'#d83a2a']];
 const R=330,cx=480,cy=420;const ang=x=>Math.PI*(1-Math.min(x,100)/100);
 const arcs=bands.map(([a,b,c])=>{const a0=ang(a),a1=ang(b);return `<path d="M${cx+R*Math.cos(a0)} ${cy-R*Math.sin(a0)} A${R} ${R} 0 0 1 ${cx+R*Math.cos(a1)} ${cy-R*Math.sin(a1)}" stroke="${c}" stroke-width="64" fill="none"/>`}).join('');
 const hrs=aCM.hours.length?aCM.hours:[...Array(24)].map(()=>v);const mx=Math.max(40,...hrs);const nowH=+D.now.split(':')[0];
 const towns=D.air.filter(a=>a.id!=='chiang-mai').slice(0,8);
 return scene(st,du,`
 ${header('ฝุ่น PM2.5 วันนี้','AIR TODAY · PM2.5 · µg/m³')}
 <div class="abs" data-in=".5" data-fx="pop" style="left:60px;top:250px;width:960px;height:560px">
  <svg width="960" height="560" viewBox="0 0 960 560" style="overflow:visible">${arcs}
   ${[0,15,25,37.5,75,100].map(x=>`<text x="${cx+(R+62)*Math.cos(ang(x))}" y="${cy-(R+62)*Math.sin(ang(x))+8}" text-anchor="middle" font-family="Mono" font-size="24" fill="#2a1f19">${x}</text>`).join('')}
   <g class="needle" transform="translate(${cx} ${cy})"><path d="M-14 0 L0 -${R-40} L14 0Z" fill="#2a1f19"/><circle r="30" fill="#2a1f19"/><circle r="12" fill="var(--yellow)"/></g></svg></div>
 <div class="abs center big" style="top:700px;font-size:120px;line-height:1;color:${col};text-shadow:5px 6px 0 var(--ink)"><span data-count="${v}" data-cin=".8" data-cd="1.8"></span></div>
 <div class="abs center" data-in="2.2" data-fx="pop" style="top:840px"><span class="chip" style="background:${col}"><b class="th" style="font-size:38px">${bth}</b><span class="body" style="font-size:28px">· ${ben} · เชียงใหม่ ${D.now}</span></span></div>
 <div class="abs card" data-in="2.2" style="left:60px;top:950px;width:960px;height:400px">
  <div class="abs th" style="left:30px;top:18px;font-size:34px;font-weight:700">รายชั่วโมงวันนี้ · เชียงใหม่ <span class="mono" style="font-size:18px;opacity:.6">HOURLY</span></div>
  <div class="abs" style="left:30px;right:30px;top:80px;height:240px;display:flex;align-items:flex-end;gap:8px;border-bottom:4px solid var(--ink)">
  ${hrs.map((h,i)=>`<div data-in="${2.5+i*.05}" data-d=".5" data-fx="growY" style="flex:1;height:${Math.max(4,h/mx*240)}px;transform-origin:bottom;border-radius:6px 6px 0 0;background:${i===nowH?'var(--yellow)':BAND(h)[0]};border:2px solid var(--ink);border-bottom:0"></div>`).join('')}</div>
  <div class="abs mono" style="left:30px;right:30px;bottom:24px;display:flex;justify-content:space-between;font-size:20px"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div></div>
 <div class="abs" style="left:60px;top:1390px;width:960px;display:grid;grid-template-columns:1fr 1fr;gap:20px">
  ${towns.map((a,i)=>`<div data-in="${3.6+i*.12}" data-fx="pop" style="display:flex;align-items:center;gap:16px;background:var(--cream);border:3px solid var(--ink);border-radius:18px;box-shadow:5px 6px 0 var(--ink);padding:12px 22px"><span class="dot" style="background:${BAND(a.pm25)[0]};border:2px solid var(--ink);width:26px;height:26px"></span><span class="th" style="font-size:32px;font-weight:700;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.th}</span><span class="big" style="font-size:40px">${a.pm25}</span></div>`).join('')}</div>
 ${FOOT('ข้อมูลจาก motdang.net · Open-Meteo CAMS (แบบจำลอง)')}`,{trans:'blinds',update:(lt,s)=>{
  const k=E.el(P(lt,.9,2.6));const a=-90+180*Math.min(v,100)/100*k;s.el.querySelector('.needle').setAttribute('transform',`translate(${cx} ${cy}) rotate(${a+Math.sin(lt*6)*.6*(k>=1)})`);}});}

function cForecast(st,du){
 const days=cm.days.slice(0,7);const lo=Math.min(...days.map(d=>d.min))-2,hi=Math.max(...days.map(d=>d.max))+2;const sc=x=>(x-lo)/(hi-lo)*420;
 return scene(st,du,`
 ${header('7 วันข้างหน้า','CHIANG MAI · 7-DAY FORECAST',1)}
 ${days.map((d,i)=>`<div class="abs" data-in="${.5+i*.18}" data-fx="left" style="left:50px;top:${300+i*205}px;width:980px;height:180px;background:${i?'#3f2f25':'#4b3328'};border:3px solid #5d4636;border-radius:24px;color:var(--cream)">
  <div class="abs th" style="left:30px;top:26px;font-size:40px;font-weight:800">${i?d.dow_th:'วันนี้'}</div><div class="abs mono" style="left:32px;top:100px;font-size:22px;opacity:.65">${d.dow_en.toUpperCase()} ${d.date.slice(8)}</div>
  <div class="abs" style="left:205px;top:14px">${wxIcon(d.kind,145)}</div>
  <div class="abs big" style="left:360px;top:56px;font-size:42px;color:#9fd3e8">${d.min}°</div>
  <div class="abs" style="left:450px;top:78px;width:420px;height:22px;border-radius:11px;background:rgba(255,255,255,.08)"></div>
  <div class="abs" data-in="${.9+i*.18}" data-d="1" data-fx="growX" style="left:${450+sc(d.min)}px;top:78px;width:${sc(d.max)-sc(d.min)}px;height:22px;border-radius:11px;background:linear-gradient(90deg,#f2c641,#e5532f);transform-origin:left"></div>
  <div class="abs big" style="left:${450+sc(d.max)+12}px;top:56px;font-size:42px;color:var(--yellow)">${d.max}°</div>
  <div class="abs" style="right:28px;top:118px;font-size:28px;font-weight:700;color:#9fd3e8">💧 ${d.prob}%</div></div>`).join('')}
 ${FOOT('ข้อมูลจาก motdang.net · Open-Meteo')}`,{bg:'var(--brown)',color:'var(--cream)',trans:'diag'});}

function cOpenNow(st,du){
 const o=D.open_now.cm;seed=42;const colors={food:'#c8352a',market:'#f2a32c',massage:'#a35ad1',medical:'#3b8fd0',hotel:'#5aa86a',shopping:'#e5532f'};
 const pins=[];o.rows.forEach(r=>{const n=Math.min(10,Math.max(r.n?2:0,Math.round(Math.sqrt(r.n)*1.1)));for(let i=0;i<n;i++)pins.push(r.key)});
 pins.sort(()=>rnd()-.5);
 const blocks=[...Array(54)].map((_,i)=>{const gx=i%9,gy=Math.floor(i/9);return `<div class="abs" style="left:${40+gx*60}px;top:${40+gy*66}px;width:${36+((i*7)%3)*6}px;height:${30+((i*5)%3)*8}px;background:${(i*13)%11===0?'#bfe3b0':'#efe2c8'};border-radius:5px;box-shadow:0 4px 0 #d7c6a6"></div>`}).join('');
 const ic={food:'🍜',market:'🧺',massage:'💆',medical:'💊',hotel:'🛏️',shopping:'🛍️'};
 return scene(st,du,`
 <div class="abs" style="inset:0;background:#cfe5c0"></div>
 ${[...Array(16)].map(()=>`<div class="abs" style="left:${rnd()*1000}px;top:${250+rnd()*1300}px;width:${80+rnd()*160}px;height:${60+rnd()*120}px;background:${['#bddbaa','#e3e8b8','#d6e9c4','#b4d49e'][Math.floor(rnd()*4)]};border-radius:10px;transform:rotate(${rnd()*20-10}deg)"></div>`).join('')}
 <svg class="abs" style="left:0;top:0" width="1080" height="1920"><path d="M1000 0 C900 400 1060 700 960 1000 S900 1600 1020 1920" stroke="#9fd3e8" stroke-width="70" fill="none"/><path d="M1000 0 C900 400 1060 700 960 1000 S900 1600 1020 1920" stroke="#7cc0dc" stroke-width="16" fill="none" stroke-dasharray="30 40" class="river"/></svg>
 <div class="abs" style="left:-120px;top:150px;width:700px;height:380px;border-radius:50% 50% 0 0;background:#7fb98a"></div><div class="abs" style="left:-40px;top:230px;width:520px;height:300px;border-radius:50% 50% 0 0;background:#5aa86a"></div>
 <div class="abs" style="left:160px;top:300px;width:90px;height:90px">${'<div style="width:0;height:0;border-left:30px solid transparent;border-right:30px solid transparent;border-bottom:80px solid #e6b84a;margin:auto"></div>'}</div>
 <div class="abs" data-in=".4" data-fx="pop" style="left:200px;top:560px;width:680px;height:640px;border:44px solid #9fd3e8;outline:10px solid #faf5ea;border-radius:50px;background:#faf5ea;overflow:hidden;box-shadow:0 0 0 18px #fffaf0">${blocks}
  ${pins.map((k,i)=>{const x=20+rnd()*520,y=20+rnd()*480;return `<div class="abs" data-in="${1.4+i*.06}" data-d=".5" data-fx="pop" style="left:${x}px;top:${y}px;width:46px;height:46px;border-radius:50% 50% 50% 0;rotate:-45deg;background:${colors[k]};border:4px solid var(--ink);transform-origin:50% 100%"></div>`}).join('')}</div>
 <div class="abs antw" style="left:0;top:470px">${ant(170,'antM')}</div>
 <div class="abs center" data-in=".2" data-fx="pop" style="top:70px"><span class="live"><i></i>LIVE <b>CHIANG MAI · ${D.now}</b></span></div>
 <div class="abs card" data-in=".5" data-fx="down" style="left:150px;top:170px;width:780px;height:270px;text-align:center">
  <div class="th" style="font-size:46px;font-weight:700;margin-top:18px">เปิดอยู่ตอนนี้ แถวคูเมือง</div>
  <div class="big" style="font-size:130px;line-height:1;color:var(--red)"><span data-count="${o.total}" data-cin="1" data-cd="2.2"></span><span class="th" style="font-size:50px;color:var(--ink)"> แห่ง</span></div>
  <div class="mono" style="font-size:20px;opacity:.6">OPEN NOW · WITHIN 4 KM OF THE OLD CITY</div></div>
 <div class="abs" style="left:50px;top:1300px;width:980px;display:grid;grid-template-columns:1fr 1fr;gap:22px">
  ${o.rows.map((r,i)=>`<div data-in="${2.2+i*.15}" data-fx="pop" style="display:flex;align-items:center;gap:14px;background:var(--cream);border:4px solid var(--ink);border-radius:22px;box-shadow:6px 7px 0 var(--ink);padding:16px 22px"><span style="width:62px;height:62px;border-radius:16px;background:${colors[r.key]};display:flex;align-items:center;justify-content:center;font-size:36px;border:3px solid var(--ink)">${ic[r.key]}</span><span style="flex:1"><div class="th" style="font-size:34px;font-weight:700;line-height:1.1">${r.th}</div><div class="mono" style="font-size:17px;opacity:.6">${r.en.toUpperCase()}</div></span><span class="big" style="font-size:54px;color:var(--red)" data-count="${r.n}" data-cin="${2.4+i*.15}"></span></div>`).join('')}</div>
 ${FOOT('ข้อมูลร้านค้าจาก motdang.net · OpenStreetMap')}`,{trans:'iris',update:(lt,s)=>{
  const a=s.el.querySelector('.antw');a.style.transform=`translateX(${180+lt*70}px)`;antUpdate(a.querySelector('svg'),lt,1);
  s.el.querySelector('.river').style.strokeDashoffset=-lt*60;}});}

function cCinema(st,du){
 const c=D.cinema;const eve=SLOT==='evening';
 const films=c.top.filter(f=>!eve||f.times.length).slice(0,4);
 const strip=side=>`<div class="abs fstrip" style="${side}:0;top:0;bottom:0;width:70px;background:#120c0a;border-${side==='left'?'right':'left'}:4px solid #3a2a22"><div class="holes abs" style="left:18px;top:-80px;width:34px;bottom:-80px;background:repeating-linear-gradient(#120c0a 0 26px,#e9dcc4 26px 54px,#120c0a 54px 80px);border-radius:6px"></div></div>`;
 return scene(st,du,`
 <div class="abs beam" data-i="0" style="left:-200px;top:-200px;width:900px;height:2400px;background:linear-gradient(90deg,transparent,rgba(255,226,150,.13),transparent);transform-origin:50% 0"></div>
 <div class="abs beam" data-i="1" style="left:400px;top:-200px;width:900px;height:2400px;background:linear-gradient(90deg,transparent,rgba(255,200,140,.10),transparent);transform-origin:50% 0"></div>
 ${strip('left')}${strip('right')}
 ${header(eve?'รอบค่ำคืนนี้':'หนังวันนี้',(eve?'LATE SHOWS · ':'MOVIES TODAY · ')+'MAJOR CINEPLEX · CM + CR',1)}
 <div class="abs" style="left:110px;top:300px;width:860px;display:flex;gap:20px">
  ${[[c.films,'เรื่อง','films'],[eve?c.late:c.shows,'รอบ',eve?'after 6pm':'shows'],[c.screens,'โรง','cinemas']].map(([n,th,en],i)=>`<div data-in="${.5+i*.15}" data-fx="pop" style="flex:1;background:var(--cream);color:var(--ink);border:4px solid var(--yellow);border-radius:24px;padding:14px 20px;text-align:center"><div class="big" style="font-size:96px;line-height:1;color:var(--red)" data-count="${n}" data-cin="${.7+i*.15}"></div><div class="th" style="font-size:34px;font-weight:700">${th} <span class="mono" style="font-size:17px;opacity:.6">${en.toUpperCase()}</span></div></div>`).join('')}</div>
 ${films.map((f,i)=>`<div class="abs" data-in="${1.5+i*.3}" data-fx="${i%2?'right':'left'}" style="left:110px;top:${580+i*305}px;width:860px;height:270px;display:flex">
  <div style="flex:1;background:var(--cream);color:var(--ink);border-radius:22px 0 0 22px;padding:22px 28px;position:relative;border:4px solid var(--ink);border-right:4px dashed var(--ink)">
   <div class="mono" style="font-size:20px;color:var(--red);font-weight:600">#${i+1} · ${(f.genre||'').toUpperCase()} · ${f.minutes||'–'} MIN</div>
   <div class="th" style="font-size:46px;font-weight:800;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:560px">${f.title}</div>
   <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:nowrap">${f.times.slice(0,4).map((t,j)=>`<span data-in="${1.9+i*.3+j*.08}" data-fx="pop" style="font-family:Mono;font-weight:600;font-size:28px;padding:6px 14px;border:3px solid var(--ink);border-radius:12px;background:${j===0?'var(--yellow)':'#fff'}">${t}</span>`).join('')}</div></div>
  <div style="width:170px;background:var(--red);color:var(--cream);border-radius:0 22px 22px 0;border:4px solid var(--ink);border-left:0;display:flex;flex-direction:column;align-items:center;justify-content:center"><div class="big" style="font-size:76px;line-height:1">${f.shows}</div><div class="th" style="font-size:26px">รอบวันนี้</div></div></div>`).join('')}
 ${FOOT('รอบฉายจาก motdang.net · Major Cineplex')}`,{bg:'#1f1714',color:'var(--cream)',trans:'blinds',update:(lt,s)=>{
  s.el.querySelectorAll('.beam').forEach(b=>b.style.transform=`rotate(${Math.sin(lt*.7+ +b.dataset.i*2)*14}deg)`);
  s.el.querySelectorAll('.holes').forEach((h,i)=>h.style.transform=`translateY(${((lt*120)%80)*(i?1:-1)}px)`);}});}

function cFestival(st,du){
 const f=D.festival||{th:'ยี่เป็ง',en:'Yi Peng',days:30,date_th:'',date_en:'',note_th:'',note_en:''};
 return scene(st,du,`
 <div class="abs" style="inset:0;background:radial-gradient(ellipse at 50% 40%,#3b2450,#1c1226 75%)"></div>
 ${header('เร็ว ๆ นี้','COMING UP · NORTHERN CALENDAR',1)}
 <div class="abs" data-in=".5" data-fx="drop" style="left:240px;top:330px;width:600px;height:640px">
  <div class="abs" style="inset:0;background:var(--cream);border:6px solid var(--ink);border-radius:36px;box-shadow:14px 16px 0 #000"></div>
  <div class="abs" style="left:0;right:0;top:0;height:150px;background:var(--red);border:6px solid var(--ink);border-radius:36px 36px 0 0;display:flex;align-items:center;justify-content:center;color:var(--cream)" ><span class="th" style="font-size:56px;font-weight:800">อีก</span></div>
  ${[150,300,450].map(x=>`<div class="abs" style="left:${x-14}px;top:-34px;width:28px;height:70px;border-radius:14px;background:#d9d0bf;border:5px solid var(--ink)"></div>`).join('')}
  <div class="abs center big days" style="top:150px;font-size:330px;line-height:1.2;color:var(--red)">${f.days}</div>
  <div class="abs center th" style="bottom:30px;font-size:64px;font-weight:800;color:var(--ink)">วัน <span class="mono" style="font-size:28px;opacity:.6">DAYS</span></div></div>
 <div class="abs center th" data-in="1.4" style="top:1040px;font-size:104px;font-weight:800;color:var(--yellow);text-shadow:6px 8px 0 #000">${f.th}</div>
 <div class="abs center body" data-in="1.6" style="top:1185px;font-size:46px;color:var(--cream);font-weight:600">${f.en}</div>
 <div class="abs center" data-in="1.9" data-fx="pop" style="top:1280px"><span class="chip" style="font-size:40px"><span class="th">${f.date_th}</span> · <span class="mono" style="font-size:30px">${f.date_en.toUpperCase()}</span></span></div>
 <div class="abs center th" data-in="2.3" style="top:1410px;font-size:40px;color:#e8d8f0;padding:0 80px">${f.note_th}</div>
 <div class="abs center body" data-in="2.5" style="top:1470px;font-size:30px;color:#bda8cc;padding:0 80px">${f.note_en}</div>
 ${FOOT('ปฏิทินจาก motdang.net')}`,{bg:'#1c1226',color:'var(--cream)',trans:'diag',lanterns:24,update:(lt,s)=>{
  const k=E.out5(P(lt,.9,2.6));const n=Math.round(f.days+(f.days+20-f.days)*(1-k));const el=s.el.querySelector('.days');el.textContent=n;el.style.transform=`scale(${1+(P(lt,2.5,2.6)-P(lt,2.6,2.9))*.12})`;}});}

function cSky(st,du){
 const m=D.moon||{illum:.5,waxing:true,thai_label_th:'',phase_en:'',thai_day:0,thai_month:0};
 const day=cm.days[0]||{},tm=cm.days[1]||{};seed=99;
 return scene(st,du,`
 <div class="abs" style="inset:0;background:linear-gradient(#0d1430 0%,#22204a 50%,#5c3350 80%,#a2564a 100%)"></div>
 ${[...Array(140)].map(()=>`<div class="abs star" data-p="${rnd()*6}" style="left:${rnd()*1080}px;top:${rnd()*1300}px;width:${2+rnd()*5}px;height:${2+rnd()*5}px;border-radius:50%;background:#fff6d8"></div>`).join('')}
 ${header('คืนนี้ ดวงจันทร์','THE SKY TONIGHT · CHIANG MAI',1)}
 <div class="abs moonw" data-in=".4" data-d="1.4" data-fx="up" style="left:${540-280}px;top:270px">${moonSVG(m,180)}</div>
 <div class="abs center th" data-in="1.2" style="top:860px;font-size:110px;font-weight:800;color:var(--yellow);text-shadow:6px 8px 0 #000">${m.thai_label_th||m.phase_th}</div>
 <div class="abs center body" data-in="1.4" style="top:1000px;font-size:40px;color:var(--cream)">${m.phase_en} · ${Math.round(m.illum*100)}% lit · เดือน ${m.thai_month}</div>
 ${m.wan_phra?`<div class="abs center" data-in="1.7" data-fx="pop" style="top:1075px"><span class="chip" style="background:var(--yellow)"><span class="th">🙏 วันนี้วันพระ</span></span></div>`:''}
 <div class="abs" style="left:110px;top:1160px;width:860px;display:flex;gap:24px">
  ${[['🌇','ตกวันนี้','SUNSET',day.sunset||'--'],['🌅','ขึ้นพรุ่งนี้','SUNRISE',tm.sunrise||'--']].map(([e,th,en,v],i)=>`<div data-in="${1.9+i*.2}" data-fx="pop" style="flex:1;background:rgba(250,245,234,.95);color:var(--ink);border:4px solid var(--ink);border-radius:26px;box-shadow:8px 10px 0 #000;padding:18px 24px"><div class="th" style="font-size:32px;font-weight:700">${e} ${th} <span class="mono" style="font-size:17px;opacity:.6">${en}</span></div><div class="big" style="font-size:80px;line-height:1.1">${v}</div></div>`).join('')}</div>
 <svg class="abs" style="left:0;bottom:0" width="1080" height="560" viewBox="0 0 1080 560"><path d="M0 330 C140 250 230 120 380 90 C480 70 560 150 650 210 C780 290 900 260 1080 300 V560 H0Z" fill="#1d1630"/><path d="M380 92 l-10 -40 l10 -16 l10 16z" fill="#f2c641"/><path d="M0 430 C200 380 400 420 600 400 S900 380 1080 410 V560 H0Z" fill="#120d1f"/>
 ${[...Array(60)].map(()=>`<circle class="city" data-p="${rnd()*6}" cx="${rnd()*1080}" cy="${440+rnd()*100}" r="${2+rnd()*3}" fill="${rnd()>.5?'#ffd27a':'#ffb05a'}"/>`).join('')}</svg>
 ${FOOT('ข้อมูลท้องฟ้าจาก motdang.net · Open-Meteo')}`,{bg:'#0d1430',color:'var(--cream)',trans:'iris',update:(lt,s)=>{
  s.el.querySelectorAll('.star').forEach(e=>e.style.opacity=.35+.65*Math.abs(Math.sin(lt*1.7+ +e.dataset.p)));
  s.el.querySelectorAll('.city').forEach(e=>e.setAttribute('opacity',.5+.5*Math.abs(Math.sin(lt*3+ +e.dataset.p))));
  const g=s.el.querySelector('.moonw .glow');if(g)g.setAttribute('r',275+Math.sin(lt*1.5)*12);}});}

function cTomorrow(st,du){
 const t0=cm.days[1]||cm.days[0]||{},t1=cr.days[1]||cr.days[0]||{};
 const air=id=>{const a=D.air.find(x=>x.id===id);return a&&a.tomorrow?a.tomorrow.pm25:(a?a.pm25:0)};
 const wet=Math.max(t0.prob||0,t1.prob||0)>=40;
 const card=(c,d,id,i)=>{const pm=air(id);return `<div class="abs card" data-in="${.5+i*.3}" data-fx="${i?'right':'left'}" style="left:60px;top:${330+i*560}px;width:960px;height:510px">
  <div class="abs" style="left:24px;top:60px">${wxIcon(d.kind||'cloud',280)}</div>
  <div class="abs th" style="left:340px;top:26px;font-size:50px;font-weight:800">${c.th} <span class="body" style="font-size:28px;opacity:.6">${c.en}</span></div>
  <div class="abs big" style="left:336px;top:90px;font-size:150px;line-height:1"><span style="color:var(--red)" data-count="${d.max||0}" data-cin="${.8+i*.3}" data-suf="°"></span><span style="font-size:80px;color:var(--blue)"> / ${d.min||0}°</span></div>
  <div class="abs th" style="left:340px;top:270px;font-size:40px;font-weight:700">${d.th||''} <span class="body" style="font-size:26px;opacity:.6">· ${d.en||''}</span></div>
  <div class="abs" style="left:24px;right:24px;bottom:24px;display:flex;gap:16px">
   <div data-in="${1.2+i*.3}" data-fx="pop" style="flex:1;background:#dcefff;border:3px solid var(--ink);border-radius:18px;padding:10px 18px"><div class="th" style="font-size:24px">โอกาสฝน <span class="mono" style="font-size:15px;opacity:.6">RAIN</span></div><div class="big" style="font-size:46px">💧 ${d.prob||0}%</div></div>
   <div data-in="${1.35+i*.3}" data-fx="pop" style="flex:1;background:${BAND(pm)[0]}33;border:3px solid var(--ink);border-radius:18px;padding:10px 18px"><div class="th" style="font-size:24px">ฝุ่น PM2.5 <span class="mono" style="font-size:15px;opacity:.6">FORECAST</span></div><div class="big" style="font-size:46px"><span class="dot" style="background:${BAND(pm)[0]};border:2px solid var(--ink)"></span> ${pm} · <span class="th" style="font-size:32px">${BAND(pm)[1]}</span></div></div></div></div>`};
 return scene(st,du,`
 <div class="abs" style="inset:0;background:linear-gradient(#fbe3bf,#faf5ea 40%)"></div>
 ${header('พรุ่งนี้','TOMORROW · '+(t0.dow_en||'').toUpperCase()+' '+(t0.date||'').slice(8))}
 ${card(cm,t0,'chiang-mai',0)}${card(cr,t1,'chiang-rai',1)}
 <div class="abs center" data-in="2.2" data-fx="drop" style="top:1490px"><div style="display:inline-block;background:var(--yellow);border:5px solid var(--ink);box-shadow:10px 12px 0 var(--ink);padding:18px 40px;border-radius:24px;transform:rotate(-2deg)"><div class="th" style="font-size:56px;font-weight:800">${wet?'☂️ พกร่มไปด้วยนะ':'☀️ อากาศดี ออกไปเที่ยวได้'}</div><div class="body" style="font-size:32px;font-weight:600">${wet?'Pack an umbrella tomorrow':'A good day to get out'}</div></div></div>
 ${FOOT('ข้อมูลจาก motdang.net · Open-Meteo')}`,{trans:'diag'});}

// ---------------- timeline ----------------
const BUILD={weatherNow:cWeatherNow,air:cAir,forecast7:cForecast,openNow:cOpenNow,cinema:cCinema,festival:cFestival,sky:cSky,tomorrow:cTomorrow};
const T=[[0,4.8],[4.2,5.0],[8.6,9.8],[17.8,10.0],[27.2,10.4],[37.0,8.0]];
sIntro(...T[0]);sBrand(...T[1]);
S.body.forEach((k,i)=>BUILD[k](...T[2+i]));
sOutro(...T[5]);
window.DURATION=45;
const strips=document.createElement('div');strips.innerHTML='<div class="strip t"></div><div class="strip b"></div><div id="vignette"></div><div id="grain"></div>';document.getElementById('stage').append(...strips.children);
window.TRANSITIONS=T.slice(1).map(x=>x[0]);
render(0);
