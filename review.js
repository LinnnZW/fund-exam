/* Additive review module. Existing fe_* keys and original question IDs stay intact. */
let reviewData;
const reviewKey='fe_knowledge_v1';
function reviewState(){try{const v=JSON.parse(localStorage.getItem(reviewKey));return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch{return {}}}
async function reviewKnowledge(){
  app.innerHTML='<p role="status">正在加载知识点…</p>';
  try{if(!reviewData){const r=await fetch('knowledge.json');if(!r.ok)throw Error();reviewData=await r.json()}}
  catch{if(location.hash.startsWith('#/knowledge')){app.innerHTML='<div class="card">知识点暂时无法加载，请检查网络后重试。<button id="retry-knowledge">重试</button></div>';$('#retry-knowledge').onclick=reviewKnowledge;}return}
  if(!location.hash.startsWith('#/knowledge'))return;
  let mode='all',term='';
  app.innerHTML=`<section class="review-hero"><span class="eyebrow">知识点复习</span><h1>不只记答案，记住为什么</h1><p>这一批仅展示已整理的通用考点，不代表全部错题已收录。个人答题和掌握情况仅保存在当前浏览器。</p></section><div class="review-tools"><label for="review-search">查找考点</label><input id="review-search" type="search" placeholder="输入概念、公式或关键词"><label for="review-filter">复习范围</label><select id="review-filter"><option value="all">全部知识点</option><option value="pending">还需复习</option><option value="done">已经掌握</option></select><a href="#/backup">备份与恢复</a></div><p id="review-count" class="muted" aria-live="polite"></p><div id="review-list"></div>`;
  const draw=()=>{const st=reviewState();const list=reviewData.filter(k=>(mode==='all'||(mode==='done')===!!st[k.id]?.mastered)&&JSON.stringify(k).toLowerCase().includes(term.toLowerCase()));$('#review-count').textContent=`显示 ${list.length} / ${reviewData.length} 个考点 · 点击展开后先回忆，再看答案`;
    $('#review-list').innerHTML=list.length?list.map(k=>`<article class="card review-card"><span class="tag">${esc(k.category)}</span><h2>${esc(k.title)}</h2><p>${esc(k.summary)}</p><div class="memory"><b>记忆提示</b><p>${esc(k.memory)}</p></div><details><summary>展开易混对比与例子</summary><div class="compare">${k.comparison.map(c=>`<div><h3>${esc(c[0])}</h3><b>${esc(c[1])}</b><p>${esc(c[2])}</p></div>`).join('')}</div><p>${esc(k.example)}</p></details><details class="review-quiz"><summary>用一道变式题检查理解</summary><p>${esc(k.question)}</p>${k.options.map((v,i)=>`<button class="opt" data-k="${esc(k.id)}" data-answer="${i}">${'ABCD'[i]}. ${esc(v)}</button>`).join('')}<div id="feedback-${esc(k.id)}" aria-live="polite"></div></details><div class="review-bottom"><button class="sec" data-master="${esc(k.id)}">${st[k.id]?.mastered?'已掌握 · 标为需复习':'标记为已掌握'}</button><small>整理核对：${esc(k.checked)}</small></div><p class="muted">${esc(k.source)} ${safeSourceUrl(k.sourceUrl)?`<a href="${esc(safeSourceUrl(k.sourceUrl))}" target="_blank" rel="noopener noreferrer">查看来源</a>`:''}</p></article>`).join(''):'<div class="card"><h2>没有符合条件的考点</h2><p>试试其他关键词，或选择“全部知识点”。</p></div>';
    document.querySelectorAll('[data-master]').forEach(b=>b.onclick=()=>{const s=reviewState(),id=b.dataset.master;s[id]={...s[id],mastered:!s[id]?.mastered,updated:Date.now()};if(saveReviewState(s))draw()});
    document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{const k=reviewData.find(k=>k.id===b.dataset.k),ok=+b.dataset.answer===k.answer;const box=b.closest('details');box.querySelectorAll('button').forEach(v=>{v.disabled=true;if(+v.dataset.answer===k.answer)v.classList.add('right');else if(v===b)v.classList.add('wrong')});$('#feedback-'+k.id).innerHTML=`<div class="exp"><b>${ok?'答对了':'再看一下思路'}</b><p>${esc(k.explanation)}</p></div>`;const s=reviewState();s[k.id]={...s[k.id],lastCorrect:ok,attempts:(s[k.id]?.attempts||0)+1,updated:Date.now()};if(!ok)s[k.id].mastered=false;saveReviewState(s)});
  };$('#review-search').oninput=e=>{term=e.target.value;draw()};$('#review-filter').onchange=e=>{mode=e.target.value;draw()};draw();
}
function reviewBackup(){
  app.innerHTML='<div class="card"><h1>备份与恢复</h1><p>题目进度、错题、考试记录和知识点掌握情况只在当前浏览器内保存。导出的文件不会上传到服务器；请自己妥善保管。</p><button id="export-progress">下载进度备份</button><h2>恢复备份</h2><p>恢复会替换备份中同名的学习记录。请先导出当前进度。不会改动其他网站的数据。</p><label for="import-progress">选择本网站导出的 JSON 文件</label><input type="file" id="import-progress" accept="application/json,.json"><div id="backup-status" role="status"></div><p><a href="#/">返回首页</a></p></div>';
  $('#export-progress').onclick=()=>{const values={};Object.keys(localStorage).filter(k=>k.startsWith('fe_')).forEach(k=>values[k]=localStorage.getItem(k));const blob=new Blob([JSON.stringify({format:'fund-exam-progress',version:1,created:new Date().toISOString(),values},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='基金复习进度-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#backup-status').textContent='备份已生成，请确认浏览器下载完成。'};
  $('#import-progress').onchange=async e=>{const f=e.target.files[0];if(!f)return;const status=$('#backup-status');try{if(f.size>5000000)throw Error('文件过大');const d=JSON.parse(await f.text());if(d.format!=='fund-exam-progress'||d.version!==1||!d.values||Array.isArray(d.values))throw Error('不是支持的备份格式');const entries=validateProgressBackup(d.values);if(!confirm(`恢复 ${entries.length} 项学习记录？备份中的同名记录会替换当前值。`)){status.textContent='已取消，原进度未改变。';return}const old=entries.map(([k])=>[k,localStorage.getItem(k)]);try{entries.forEach(([k,v])=>localStorage.setItem(k,v))}catch(err){try{old.forEach(([k])=>localStorage.removeItem(k));old.forEach(([k,v])=>{if(v!==null)localStorage.setItem(k,v)})}catch{throw Error('恢复失败，且原进度未能完整还原。请勿继续操作或清除浏览器数据，使用之前导出的备份恢复。')}throw Error('存储空间不足或浏览器拒绝保存；已还原原进度')}status.textContent='恢复完成。返回首页查看进度。'}catch(err){status.textContent='未恢复：'+err.message}finally{e.target.value=''}};
}

function safeSourceUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&['www.csrc.gov.cn','www.amac.org.cn','www.samacn.org.cn','www.court.gov.cn'].includes(u.hostname)&&!u.username&&!u.password?u.href:''}catch{return ''}}
function validateProgressBackup(values){
  const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  const num=v=>Number.isSafeInteger(v)&&v>=0;
  const fail=()=>{throw Error('备份内容格式无效，未修改进度')};
  const clean=v=>{if(v&&typeof v==='object'){for(const k of Object.keys(v)){if(['__proto__','constructor','prototype'].includes(k))fail();clean(v[k])}}};
  if(!obj(values))fail();const entries=Object.entries(values);if(entries.length>1000)fail();
  const ids=new Set(D.questions.map(q=>q.id));
  for(const [key,raw] of entries){
    if(typeof raw!=='string')fail();const v=JSON.parse(raw);clean(v);
    if(key==='fe_wrong'){if(!obj(v)||Object.entries(v).some(([id,n])=>!ids.has(id)||!num(n)))fail()}
    else if(key==='fe_stats'){if(!obj(v)||Object.entries(v).some(([id,x])=>!ids.has(id)||!obj(x)||Object.keys(x).some(k=>!['ok','n','last'].includes(k))||!num(x.ok)||!num(x.n)||x.ok>x.n||![0,1].includes(x.last)))fail()}
    else if(key==='fe_exams'){if(!Array.isArray(v)||v.some(x=>!obj(x)||Object.keys(x).some(k=>!['s','score','total','t'].includes(k))||!['s1','s2'].includes(x.s)||!num(x.score)||!num(x.total)||x.total>100||x.score>x.total||!num(x.t)))fail()}
    else if(key===reviewKey){if(!obj(v)||Object.entries(v).some(([id,x])=>!/^[a-z0-9-]{1,80}$/.test(id)||!obj(x)||Object.entries(x).some(([k,y])=>['mastered','lastCorrect'].includes(k)?typeof y!=='boolean':['attempts','updated'].includes(k)?!num(y):true)))fail()}
    else if(/^fe_pos_practice_s[12]_(all|[1-9][0-9]?)_seq$/.test(key)){if(!num(v)||v>D.questions.length)fail()}
    else fail();
  }return entries;
}

function saveReviewState(state){try{localStorage.setItem(reviewKey,JSON.stringify(state));return true}catch{let msg=document.getElementById('review-save-warning');if(!msg){msg=document.createElement('div');msg.id='review-save-warning';msg.className='card';msg.setAttribute('role','alert');app.prepend(msg)}msg.textContent='本次复习结果未能保存：存储空间不足或浏览器禁止保存。当前页面仍可阅读；请先备份已有进度，不要清除浏览器数据。';msg.scrollIntoView({block:'nearest'});return false}}
