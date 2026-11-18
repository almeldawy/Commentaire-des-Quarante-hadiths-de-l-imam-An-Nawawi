(function(){
  var K='minha-';
  function get(k,d){try{var v=localStorage.getItem(K+k);return v?JSON.parse(v):d}catch(e){return d}}
  function set(k,v){try{localStorage.setItem(K+k,JSON.stringify(v))}catch(e){}}
  var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var ch=document.body.getAttribute('data-ch');
  var CH=window.CHAPTERS||[], TI=window.TITLES||{};

  // Thème
  var tb=$('#theme');
  if(tb) tb.onclick=function(){var d=document.documentElement.classList.toggle('dark');try{localStorage.setItem(K+'theme',d?'dark':'light')}catch(e){}};

  // Menu mobile
  var mb=$('#menu'); if(mb) mb.onclick=function(e){e.stopPropagation();document.body.classList.toggle('open')};
  document.addEventListener('click',function(e){if(document.body.classList.contains('open')&&!e.target.closest('#toc'))document.body.classList.remove('open')});

  // Fenêtre modale
  var modal=$('#modal');
  function show(html){$('.c',modal).innerHTML=html;modal.hidden=false}
  function hide(){modal.hidden=true}
  if(modal){$('.x',modal).onclick=hide;modal.addEventListener('click',function(e){if(e.target===modal)hide()})}
  document.addEventListener('keydown',function(e){if(e.key==='Escape')hide()});
  function toast(t){var el=$('#toast');if(!el)return;el.textContent=t;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(function(){el.classList.remove('show')},1600)}

  // Notes
  $$('sup.nref').forEach(function(s){
    function open(){var n=s.getAttribute('data-n'),li=document.getElementById('n'+n);show('<p><b>Note '+n+'</b></p><p>'+(li?li.innerHTML:'')+'</p>')}
    s.onclick=open; s.onkeydown=function(e){if(e.key==='Enter')open()};
  });

  // Progression
  var prog=get('progress',{});
  function pct(){var h=document.documentElement.scrollHeight-innerHeight;return h<=0?1:Math.min(1,scrollY/h)}
  function refreshToc(){
    $$('a[data-ch]').forEach(function(a){var c=a.getAttribute('data-ch');a.classList.toggle('isdone',(prog[c]||0)>=0.95)});
    var tot=0;CH.forEach(function(c){tot+=Math.min(1,prog[c]||0)});
    var g=CH.length?Math.round(100*tot/CH.length):0; var el=$('#gpct'); if(el) el.textContent=g+' %';
  }
  if(ch){
    var bf=$('#barfill'), t=null;
    var onS=function(){var p=pct();if(bf)bf.style.width=(p*100)+'%';
      clearTimeout(t);t=setTimeout(function(){if(p>(prog[ch]||0)){prog[ch]=p;set('progress',prog);refreshToc()}set('last',{ch:ch,y:scrollY})},250)};
    addEventListener('scroll',onS,{passive:true}); onS();
    var last=get('last',null);
    if(location.hash){var tg=document.getElementById(location.hash.slice(1));if(tg){setTimeout(function(){tg.scrollIntoView({block:'center'});tg.classList.add('flash')},80)}}
    else if(last&&last.ch===ch&&sessionStorage.getItem(K+'resume')==='1'){setTimeout(function(){scrollTo(0,last.y)},60)}
    try{sessionStorage.removeItem(K+'resume')}catch(e){}
  }
  refreshToc();

  // Reprise de lecture (accueil)
  var rs=$('#resume'), last0=get('last',null);
  if(rs&&last0&&TI[last0.ch]){rs.innerHTML='<a href="'+last0.ch+'">Reprendre : '+TI[last0.ch]+'</a>';rs.firstChild.onclick=function(){try{sessionStorage.setItem(K+'resume','1')}catch(e){}}}

  // Marque-pages
  var bms=get('bookmarks',[]);
  function has(id){return bms.some(function(b){return b.ch===ch&&b.id===id})}
  if(ch){
    $$('article p[id], article h2[id], article h3[id]').forEach(function(el){
      var b=document.createElement('button');b.className='bm'+(has(el.id)?' on':'');b.title='Marque-page';b.textContent='🔖';
      b.onclick=function(e){e.stopPropagation();
        if(has(el.id)){bms=bms.filter(function(x){return !(x.ch===ch&&x.id===el.id)});b.classList.remove('on');toast('Marque-page retiré')}
        else{var txt=el.textContent.replace('🔖','').trim().slice(0,110);bms.push({ch:ch,id:el.id,t:txt,d:Date.now()});b.classList.add('on');toast('Marque-page ajouté')}
        set('bookmarks',bms)};
      el.insertBefore(b,el.firstChild);
    });
  }
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function listBm(){
    if(!bms.length){show('<h3>Marque-pages</h3><p>Aucun marque-page. Survolez (ou touchez) un paragraphe puis cliquez sur 🔖 pour le marquer.</p>');return}
    var h='<h3>Marque-pages</h3><ul>'+bms.slice().sort(function(a,b){return b.d-a.d}).map(function(b){
      return '<li><a href="'+b.ch+'#'+b.id+'"><b>'+esc(TI[b.ch]||b.ch)+'</b><br>'+esc(b.t)+'…</a><button class="del" data-k="'+b.ch+'#'+b.id+'" title="Supprimer">✕</button></li>'}).join('')+'</ul>';
    show(h);
    $$('.del',modal).forEach(function(d){d.onclick=function(){var k=d.getAttribute('data-k');bms=bms.filter(function(x){return x.ch+'#'+x.id!==k});set('bookmarks',bms);
      var el=k.split('#')[0]===ch?document.getElementById(k.split('#')[1]):null;if(el){var bb=$('.bm',el);if(bb)bb.classList.remove('on')}listBm()}});
  }
  var bl=$('#bm-list'); if(bl) bl.onclick=listBm;

  // Réinitialisation
  var rb=$('#reset');
  if(rb) rb.onclick=function(){
    show('<h3>Réinitialiser</h3><p>Effacer la progression de lecture et tous les marque-pages ?</p><div class="btns"><button id="no">Annuler</button><button id="yes" class="danger">Réinitialiser</button></div>');
    $('#no').onclick=hide;
    $('#yes').onclick=function(){prog={};bms=[];set('progress',prog);set('bookmarks',bms);try{localStorage.removeItem(K+'last')}catch(e){}
      $$('.bm.on').forEach(function(b){b.classList.remove('on')});refreshToc();if(rs)rs.innerHTML='';hide();toast('Progression réinitialisée')};
  };
})();
