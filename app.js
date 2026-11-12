const $=s=>document.querySelector(s), app=$('#app');let D;
const SUB={s1:'科目一《基金基础知识与法律法规》',s2:'科目二《证券投资基金基础知识》'};
const EXAM={count:100,minutes:120,pass:60};
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem('fe_'+k))??d}catch{return d}},set:(k,v)=>localStorage.setItem('fe_'+k,JSON.stringify(v))};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
function record(q,ok){const st=LS.get('stats',{});st[q.id]={ok:(st[q.id]?.ok||0)+ok,n:(st[q.id]?.n||0)+1,last:ok};LS.set('stats',st);
  const w=LS.get('wrong',{});if(!ok)w[q.id]=(w[q.id]||0)+1;LS.set('wrong',w);}
const qs=(sub,ch)=>D.questions.filter(q=>q.sub===sub&&(ch==null||q.ch===ch));
function home(){let h='<section class="review-hero"><span class="eyebrow">理解，再记住</span><h1>把错题变成会用的知识</h1><p>先找混淆点，再看记忆提示，最后用一道变式题检查理解。</p><a class="btn" href="#/knowledge">开始知识点复习</a><a class="btn sec" href="#/backup">备份学习进度</a></section>'+'<p class="muted">考试形式（官方）：每科100道单选题，每题1分，120分钟，闭卷机考，60分合格。</p>';
  for(const s in SUB){const all=qs(s),st=LS.get('stats',{}),done=all.filter(q=>st[q.id]).length;
    h+=`<div class="card"><h2>${SUB[s]}</h2><div class="muted">题库 ${all.length} 题 · 已练 ${done}</div><div class="bar"><i style="width:${all.length?done/all.length*100:0}%"></i></div>
    <p><a class="btn" href="#/practice/${s}/all/seq">顺序练习</a><a class="btn" href="#/practice/${s}/all/rand">随机练习</a><a class="btn" href="#/exam/${s}">模拟考试</a></p><div class="grid">`;
    D.chapters[s].forEach((c,i)=>{const n=qs(s,i+1).length;h+=`<div class="card"><b>第${i+1}章 ${esc(c.name)}</b><div class="muted">${c.cards.length} 张卡片 · ${n} 题</div>
      <a class="btn sec" href="#/cards/${s}/${i+1}">知识卡片</a><a class="btn sec" href="#/practice/${s}/${i+1}/seq">顺序</a><a class="btn sec" href="#/practice/${s}/${i+1}/rand">随机</a></div>`});
    h+='</div></div>'}app.innerHTML=h}
function pt(p){const b=p.status==='ok'?`<span class="ok">✓ ${esc(p.name)}${p.article?' '+esc(p.article):''}</span>`:p.status==='unverified'?'<span class="uv">未核实</span>':'';
  return `<li>${esc(p.text)} ${b}${p.status==='ok'?`<details><summary>原文</summary><div class="quote">${esc(p.quote)}</div></details>`:''}</li>`}
function cardBody(k){return k.points?`<ul class="pts">${k.points.map(pt).join('')}</ul>`:`<pre>${esc(k.content||'')}</pre>`}
function cards(s,ch){const c=D.chapters[s][ch-1];let i=0;const r=()=>{const k=c.cards[i];app.innerHTML=`<p><a href="#/">← 返回</a></p><h3>第${ch}章 ${esc(c.name)}</h3>
  <div class="card"><div class="muted">${i+1}/${c.cards.length} · 大纲 ${esc(k.syllabus||'')}</div><h3>${esc(k.title)}</h3>${cardBody(k)}</div>
  <button class="sec" id="p">上一张</button><button id="n">下一张</button><a class="btn sec" href="#/allcards/${s}/${ch}">本章全部</a><a class="btn sec" href="#/practice/${s}/${ch}/seq">练本章题</a>
  <p class="muted">✓ = 已与官方原文逐字核对；「未核实」= 未能在已抓取的官方原文中找到依据，请以教材为准。</p>`;
  $('#p').onclick=()=>{i=(i-1+c.cards.length)%c.cards.length;r()};$('#n').onclick=()=>{i=(i+1)%c.cards.length;r()}};r()}
function allcards(s,ch){const c=D.chapters[s][ch-1];app.innerHTML=`<p><a href="#/">← 返回</a></p><h3>第${ch}章 ${esc(c.name)}（${c.cards.length}张）</h3>`+c.cards.map(k=>`<div class="card"><div class="muted">大纲 ${esc(k.syllabus||'')}</div><h3>${esc(k.title)}</h3>${cardBody(k)}</div>`).join('')}
function mustknow(){const g={s1:[],s2:[]};(D.mustknow||[]).forEach(m=>g[m.sub].push(m));
  app.innerHTML='<h2>考前必背</h2><p class="muted">数字均已与官方原文逐字核对（点“原文”查看）。</p>'+['s1','s2'].map(s=>`<div class="card"><h3>${SUB[s]} · 关键数字（${g[s].length}）</h3><ol>${g[s].map(m=>`<li><span class="muted">第${m.ch}章</span> ${esc(m.text)} <span class="ok">${esc(m.name)} ${esc(m.article)}</span><details><summary>原文</summary><div class="quote">${esc(m.quote)}</div></details></li>`).join('')}</ol></div>`).join('')+
  `<div class="card"><h3>科目二 · 公式汇总</h3><ol>${(D.formulas||[]).map(f=>`<li><b>${esc(f.title)}</b> <span class="muted">大纲第${esc(f.syllabus)}章</span><br><code>${esc(f.formula)}</code></li>`).join('')}</ol><p class="muted">公式来源：2026大纲对应章节考点，与学员《公式汇总》交叉核对；公式非法规内容，无法规出处。</p></div>`}
function changes(){app.innerHTML='<h2>新旧规定变化</h2><p class="muted">对照用户笔记（编写于2026大纲前）与现行官方规定。</p>'+(D.changes||[]).map(c=>`<div class="card"><h3>${esc(c.title)} ${c.verified?'<span class="ok">✓ 已核对原文</span>':'<span class="uv">'+esc(c.status)+'</span>'}</h3>
  <p><b>旧：</b>${esc(c.old)}</p><p><b>现行：</b>${esc(c.new)}</p>${c.sources.map(x=>`<details><summary>${esc(x.name)} ${esc(x.article)} 原文</summary><div class="quote">${esc(x.quote)}</div></details>`).join('')}<div class="muted">${esc(c.status)}</div></div>`).join('')}
function qhtml(q,idx,total){return `<div class="card"><div><span class="tag">模拟练习题</span><span class="muted">${idx}/${total} · ${SUB[q.sub].slice(0,3)} 第${q.ch}章 · ${esc(q.syllabus||'')}</span></div>
  <p><b>${esc(q.q)}</b></p>${q.options.map((o,j)=>`<button class="opt" data-j="${j}">${'ABCD'[j]}. ${esc(o)}</button>`).join('')}<div id="fb"></div></div>`}
function reveal(q,sel){document.querySelectorAll('.opt').forEach(b=>{const j=+b.dataset.j;b.disabled=true;if(j===q.answer)b.classList.add('right');else if(j===sel)b.classList.add('wrong')});
  $('#fb').innerHTML=`<div class="exp"><b>${sel===q.answer?'✅ 回答正确':'❌ 回答错误'}，正确答案：${'ABCD'[q.answer]}</b>\n${esc(q.explanation)}${q.src?`<div class=\"src\">出处：${esc(q.src.name)} ${esc(q.src.article)} ✓<br>原文：${esc(q.src.quote)}</div>`:''}</div>`;
}
function practice(list,title,key){if(!list.length){app.innerHTML='<p>暂无题目。<a href="#/">返回</a></p>';return}
  let i=key?Math.min(LS.get('pos_'+key,0),list.length-1):0;const r=()=>{const q=list[i];app.innerHTML=`<p><a href="#/">← 返回</a> · ${esc(title)}</p>`+qhtml(q,i+1,list.length)+
  `<button class="sec" id="p">上一题</button><button id="n">下一题</button>`;
  document.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{const s=+b.dataset.j;record(q,s===q.answer?1:0);reveal(q,s)});
  $('#p').onclick=()=>{if(i>0){i--;key&&LS.set('pos_'+key,i);r()}};$('#n').onclick=()=>{if(i<list.length-1){i++;key&&LS.set('pos_'+key,i);r()}else app.insertAdjacentHTML('beforeend','<p>已到最后一题。</p>')}};r()}
let timerH;
function exam(s){const pool=qs(s);const by={};pool.forEach(q=>(by[q.ch]=by[q.ch]||[]).push(q));
  // stratified sample across chapters
  let pick=[];const chs=Object.keys(by);chs.forEach(c=>pick.push(...shuffle(by[c]).slice(0,Math.round(EXAM.count*by[c].length/pool.length))));
  pick=shuffle(pick).slice(0,EXAM.count);if(pick.length<EXAM.count)pick.push(...shuffle(pool.filter(q=>!pick.includes(q))).slice(0,EXAM.count-pick.length));
  const ans=Array(pick.length).fill(null),end=Date.now()+EXAM.minutes*60000;let i=0;
  const submit=()=>{clearInterval(timerH);let sc=0;pick.forEach((q,k)=>{const ok=ans[k]===q.answer?1:0;sc+=ok;record(q,ok)});
    const hist=LS.get('exams',[]);hist.push({s,score:sc,total:pick.length,t:Date.now()});LS.set('exams',hist);
    app.innerHTML=`<div class="card"><h2>${sc>=EXAM.pass?'🎉 合格':'未合格'}：${sc} / ${pick.length}</h2><p class="muted">合格线 ${EXAM.pass} 分</p><a class="btn" href="#/">返回首页</a></div>`+
    pick.map((q,k)=>ans[k]===q.answer?'':`<div class="card"><span class="tag">模拟练习题</span><b>${k+1}. ${esc(q.q)}</b><br>${q.options.map((o,j)=>`${'ABCD'[j]}. ${esc(o)}`).join('<br>')}<div class="exp">你的答案：${ans[k]==null?'未答':'ABCD'[ans[k]]}；正确答案：${'ABCD'[q.answer]}\n${esc(q.explanation)}</div></div>`).join('')};
  const r=()=>{const q=pick[i];app.innerHTML=`<div class="timer" id="tm"></div>`+qhtml(q,i+1,pick.length)+`<button class="sec" id="p">上一题</button><button id="n">下一题</button><button class="sec" id="sb">交卷</button>
    <div class="card pal">${pick.map((_,k)=>`<span class="${ans[k]!=null?'done':''} ${k===i?'cur':''}" data-k="${k}">${k+1}</span>`).join('')}</div>`;
    document.querySelectorAll('.opt').forEach(b=>{if(+b.dataset.j===ans[i])b.classList.add('sel');b.onclick=()=>{ans[i]=+b.dataset.j;if(i<pick.length-1)i++;r()}});
    document.querySelectorAll('.pal span').forEach(e=>e.onclick=()=>{i=+e.dataset.k;r()});tick();
    $('#p').onclick=()=>{if(i>0){i--;r()}};$('#n').onclick=()=>{if(i<pick.length-1){i++;r()}};$('#sb').onclick=()=>{if(confirm(`已答 ${ans.filter(a=>a!=null).length}/${pick.length}，确定交卷？`))submit()}};
  const tick=()=>{const l=Math.max(0,end-Date.now());const t=$('#tm');if(t)t.textContent=`⏱ 剩余 ${Math.floor(l/60000)}:${String(Math.floor(l/1000)%60).padStart(2,'0')} · ${SUB[s]}`;if(l<=0)submit()};
  clearInterval(timerH);timerH=setInterval(tick,1000);r()}
function wrong(){const w=LS.get('wrong',{});const list=D.questions.filter(q=>w[q.id]);
  app.innerHTML=`<h2>错题本（${list.length}）</h2>`+(list.length?`<a class="btn" href="#/wrongpractice">练习错题</a><button class="sec" id="clr">清空</button>`:'<p>暂无错题。</p>')+
  list.map(q=>`<div class="card"><span class="tag">模拟练习题</span><span class="muted">错 ${esc(w[q.id])} 次</span><p><b>${esc(q.q)}</b></p><div class="exp">正确答案：${'ABCD'[q.answer]}. ${esc(q.options[q.answer])}\n${esc(q.explanation)}</div><button class="sec" data-rm="${q.id}">移出错题本</button></div>`).join('');
  document.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{delete w[b.dataset.rm];LS.set('wrong',w);wrong()});const c=$('#clr');if(c)c.onclick=()=>{if(confirm('清空错题本？')){LS.set('wrong',{});wrong()}}}
function stats(){const st=LS.get('stats',{}),ex=LS.get('exams',[]);let h='<h2>学习统计</h2>';
  for(const s in SUB){h+=`<div class="card"><h3>${SUB[s]}</h3>`;D.chapters[s].forEach((c,i)=>{const l=qs(s,i+1),d=l.filter(q=>st[q.id]),ok=d.filter(q=>st[q.id].last).length;
    h+=`<div>第${i+1}章 ${esc(c.name)} <span class="muted">已练 ${d.length}/${l.length} · 最近正确率 ${d.length?Math.round(ok/d.length*100):0}%</span><div class="bar"><i style="width:${l.length?d.length/l.length*100:0}%"></i></div></div>`});h+='</div>'}
  h+='<div class="card"><h3>模拟考试记录</h3>'+(ex.length?ex.slice(-20).reverse().map(e=>`<div>${new Date(e.t).toLocaleString()} · ${e.s==='s1'?'科目一':'科目二'} · <b>${esc(e.score)}</b>/${esc(e.total)}</div>`).join(''):'暂无')+'</div><button class="sec" id="rs">重置全部进度</button>';
  app.innerHTML=h;$('#rs').onclick=()=>{if(confirm('确定清除所有本地进度？')){Object.keys(localStorage).filter(k=>k.startsWith('fe_')).forEach(k=>localStorage.removeItem(k));stats()}}}
function routeUnsafe(){clearInterval(timerH);scrollTo(0,0);const p=location.hash.slice(2).split('/');
  if(p[0]==='knowledge')return reviewKnowledge();if(p[0]==='backup')return reviewBackup();if(p[0]==='cards')return cards(p[1],+p[2]);if(p[0]==='allcards')return allcards(p[1],+p[2]);if(p[0]==='mustknow')return mustknow();if(p[0]==='changes')return changes();
  if(p[0]==='practice'){const ch=p[2]==='all'?null:+p[2];let l=qs(p[1],ch);if(p[3]==='rand')l=shuffle(l);return practice(l,SUB[p[1]]+(ch?` 第${ch}章`:'')+(p[3]==='rand'?' 随机':' 顺序'),p[3]==='seq'?p.join('_'):null)}
  if(p[0]==='exam')return exam(p[1]);if(p[0]==='wrong')return wrong();if(p[0]==='stats')return stats();
  if(p[0]==='wrongpractice'){const w=LS.get('wrong',{});return practice(shuffle(D.questions.filter(q=>w[q.id])),'错题练习')}home()}
fetch('data.json').then(r=>{if(!r.ok)throw Error('题库读取失败');return r.json()}).then(d=>{D=d;D.ai=false;addEventListener('hashchange',route);route()}).catch(()=>{app.innerHTML='<div class="card"><h2>题库暂时没有加载成功</h2><p>学习记录仍保存在当前浏览器。请检查网络后刷新，不要清除浏览器数据。</p><button id="retry-data">重新加载</button></div>';$('#retry-data').onclick=()=>location.reload()});

function route(){
 const p=location.hash.slice(2).split('/');
 const withSub=['cards','allcards','practice','exam'];
 const ch=p[2];
 if(withSub.includes(p[0])&&(!Object.hasOwn(SUB,p[1])||(['cards','allcards','practice'].includes(p[0])&&!(p[0]==='practice'&&ch==='all')&&(!/^[1-9][0-9]*$/.test(ch||'')||+ch>D.chapters[p[1]].length)))){clearInterval(timerH);app.innerHTML='<div class="card"><h2>没有找到这个章节</h2><p>学习进度没有改变。</p><a href="#/">返回首页</a></div>';return}
 try{routeUnsafe()}catch{clearInterval(timerH);app.innerHTML='<div class="card"><h2>这一页暂时无法显示</h2><p>请返回首页重试。学习记录没有被清空。</p><a href="#/">返回首页</a><a class="btn sec" href="#/backup">备份进度</a></div>'}
}
