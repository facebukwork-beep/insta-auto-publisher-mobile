/* Blocked Videos + Copyright Dispute Center. Final disputes are submitted through official Instagram/Meta review flows. */
(() => {
  const $q=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const safeToast=m=>{try{toast(m)}catch{alert(m)}};
  let blockedState={items:[],loading:false,account:'all'};

  function ensureUi(){
    const app=$q('.app'),nav=$q('.bottomnav>div');
    if(!app||!nav)return;
    if(!$q('#view-blocked')){
      const sec=document.createElement('section');sec.id='view-blocked';sec.className='view';
      sec.innerHTML=`
        <div class="card">
          <div class="sectionhead"><div><h3>🚫 Blocked Videos</h3><div id="blockedSummary" class="sub">Loading blocked/restricted videos…</div></div><button id="refreshBlocked" class="btn small ghost">Scan / Refresh</button></div>
          <div class="notice">This section combines publisher errors, saved block reports, and Instagram rights signals. A rights signal is shown separately because it is not proof that a post is blocked.</div>
          <div class="field"><label>Account</label><select id="blockedAccount" class="select"><option value="all">All connected accounts</option></select></div>
          <div id="blockedList"><div class="empty">No blocked videos loaded yet.</div></div>
        </div>
        <div class="card">
          <div class="sectionhead"><div><h3>➕ Add Blocked Video Manually</h3><div class="sub">Use this when Instagram shows a block/copyright notice that the API cannot read.</div></div></div>
          <div class="field"><label>Account</label><select id="manualBlockedAccount" class="select"><option value="">Select account</option></select></div>
          <div class="field"><label>Video / Reel URL</label><input id="manualBlockedUrl" class="input" placeholder="https://www.instagram.com/reel/..."></div>
          <div class="field"><label>Video name / note</label><input id="manualBlockedName" class="input" placeholder="movie_clip_12.mp4"></div>
          <div class="field"><label>Claimant</label><input id="manualBlockedClaimant" class="input" placeholder="Example: JioHotstar"></div>
          <div class="field"><label>Block reason shown by Instagram</label><textarea id="manualBlockedReason" class="textarea" rows="4" placeholder="Paste/write the exact restriction notice here..."></textarea></div>
          <button id="saveManualBlocked" class="btn purple">Save to Blocked Videos</button>
        </div>
        <div class="card" id="blockedDisputeCard">
          <div class="sectionhead"><div><h3>🛡 Dispute Helper</h3><div class="sub">Select Dispute on a blocked item, then add your genuine rights basis and supporting evidence.</div></div><span class="pill">Manual submit</span></div>
          <div class="notice">Only dispute if you own the content, have a valid license/permission, or the claim is genuinely mistaken. The tool drafts the appeal; it does not auto-submit or bypass Meta's review.</div>
          <div class="field"><label>Account</label><input id="disputeAccountLabel" class="input" readonly></div>
          <div class="field"><label>Blocked video</label><input id="disputePostDesc" class="input" readonly></div>
          <div class="field"><label>Post URL</label><input id="disputePostUrl" class="input" readonly></div>
          <div class="field"><label>Claimant / rights owner</label><input id="disputeClaimant" class="input" placeholder="Claimant shown by Instagram"></div>
          <div class="field"><label>Restriction notice</label><textarea id="disputeNotice" class="textarea" rows="3"></textarea></div>
          <div class="field"><label>Why are you disputing?</label><select id="disputeBasis" class="select">
            <option value="">Choose a valid reason</option><option value="original">I created and own the material</option><option value="licensed">I have a valid license</option><option value="permission">I have permission from the rights holder</option><option value="public_domain">The material is public domain</option><option value="misidentification">The claim identified the wrong material</option><option value="other">Other legitimate rights basis</option>
          </select></div>
          <div class="field"><label>Supporting evidence / explanation</label><textarea id="disputeEvidence" class="textarea" rows="5" placeholder="License details, permission, original files, invoice, why the match is wrong, etc."></textarea></div>
          <label class="featurecheck"><input id="disputeTruth" type="checkbox"><span><strong>I confirm this dispute is truthful</strong><small>I have a genuine rights/permission basis.</small></span></label>
          <div class="jobactions"><button id="generateDispute" class="btn purple">✍ Generate Draft</button><button id="copyDispute" class="btn ghost">Copy Draft</button><a id="openAccountStatus" class="btn ghost" target="_blank" rel="noopener" href="https://www.instagram.com/accounts/status/">Open Account Status ↗</a></div>
          <div class="field"><label>Draft</label><textarea id="disputeDraft" class="textarea" rows="10" readonly></textarea></div>
        </div>`;
      app.appendChild(sec);
    }
    if(!$q('.navbtn[data-view="blocked"]')){
      const b=document.createElement('button');b.className='navbtn';b.dataset.view='blocked';b.innerHTML='<b>🚫</b>Blocked';nav.appendChild(b);
      b.onclick=()=>openBlocked();
    }
    bind();fillAccounts();
  }

  function fillAccounts(){
    const accounts=window.state?.accounts||[];
    for(const id of ['blockedAccount','manualBlockedAccount']){
      const el=$q('#'+id);if(!el)continue;const keep=el.value;
      el.innerHTML=(id==='blockedAccount'?'<option value="all">All connected accounts</option>':'<option value="">Select account</option>')+accounts.map(a=>`<option value="${esc(a.id)}">@${esc(a.label)}</option>`).join('');
      if([...el.options].some(o=>o.value===keep))el.value=keep;
    }
  }

  async function openBlocked(){
    document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-blocked'));
    document.querySelectorAll('.navbtn').forEach(b=>b.classList.toggle('active',b.dataset.view==='blocked'));
    await loadBlocked(true);
  }

  async function loadBlocked(scan=false){
    const el=$q('#blockedList'),sum=$q('#blockedSummary');if(!el||blockedState.loading)return;
    blockedState.loading=true;sum.textContent='Scanning blocked/restricted videos…';
    try{
      const aid=$q('#blockedAccount')?.value||'all';
      const x=await api(`/api/blocked-content?accountId=${encodeURIComponent(aid)}&limit=300${scan?'&scan=1':''}`);
      blockedState.items=x.items||[];sum.textContent=`${x.blockedCount||0} blocked · ${x.reviewCount||0} rights signal(s) · ${x.count||0} total`;
      renderBlocked();
      if(x.scanErrors?.length)safeToast(`${x.scanErrors.length} account scan warning(s)`);
    }catch(e){sum.textContent='Blocked center unavailable';el.innerHTML=`<div class="empty">${esc(e.message)}</div>`}
    finally{blockedState.loading=false}
  }

  function renderBlocked(){
    const el=$q('#blockedList');if(!el)return;
    if(!blockedState.items.length){el.innerHTML='<div class="empty">No blocked/restricted videos detected yet.</div>';return}
    el.innerHTML=blockedState.items.map((x,i)=>`<div class="job ${x.severity==='review'?'':'blockedcase'}">
      <div class="jobtop"><div class="grow"><div class="jobname">${esc(x.fileName||x.title||'Instagram video')}</div><div class="jobmeta">@${esc(x.accountLabel||'account')} · ${x.detectedAt?new Date(x.detectedAt).toLocaleString():''}</div><div class="jobmeta">${esc(x.reason||x.title||'Restriction detected')}</div>${x.claimant?`<div class="jobmeta">Claimant: ${esc(x.claimant)}</div>`:''}</div><span class="status ${x.severity==='review'?'retry_wait':'failed'}">${x.severity==='review'?'review signal':'blocked'}</span></div>
      <div class="jobactions">${x.postUrl?`<a class="btn small green" target="_blank" rel="noopener" href="${esc(x.postUrl)}">Open Post ↗</a>`:''}<button class="btn small purple" data-dispute-index="${i}">🛡 Dispute</button>${x.source==='manual'?`<button class="btn small red" data-remove-manual="${esc(x.id)}">Remove</button>`:''}</div>${x.signalOnly?'<div class="sub">Signal only — confirm the actual block in Instagram before disputing.</div>':''}</div>`).join('');
    el.querySelectorAll('[data-dispute-index]').forEach(b=>b.onclick=()=>selectDispute(Number(b.dataset.disputeIndex)));
    el.querySelectorAll('[data-remove-manual]').forEach(b=>b.onclick=async()=>{try{await api('/api/blocked-content/manual/'+encodeURIComponent(b.dataset.removeManual),{method:'DELETE'});safeToast('Removed');loadBlocked(false)}catch(e){safeToast(e.message)}});
  }

  function selectDispute(i){
    const x=blockedState.items[i];if(!x)return;
    $q('#disputeAccountLabel').value='@'+(x.accountLabel||'');$q('#disputePostDesc').value=x.fileName||x.title||'Blocked Instagram video';$q('#disputePostUrl').value=x.postUrl||'';$q('#disputeClaimant').value=x.claimant||'';$q('#disputeNotice').value=x.reason||'';$q('#disputeDraft').value='';$q('#blockedDisputeCard')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  async function saveManual(){
    const accountId=$q('#manualBlockedAccount')?.value||'';if(!accountId){safeToast('Account select karo.');return}
    try{await api('/api/blocked-content/manual',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accountId,postUrl:$q('#manualBlockedUrl').value.trim(),fileName:$q('#manualBlockedName').value.trim(),claimant:$q('#manualBlockedClaimant').value.trim(),reason:$q('#manualBlockedReason').value.trim()})});safeToast('Blocked video saved ✅');['manualBlockedUrl','manualBlockedName','manualBlockedClaimant','manualBlockedReason'].forEach(id=>$q('#'+id).value='');loadBlocked(false)}catch(e){safeToast(e.message)}
  }

  async function generateDraft(){
    const basis=$q('#disputeBasis')?.value||'',evidence=$q('#disputeEvidence')?.value.trim()||'',confirmed=!!$q('#disputeTruth')?.checked;
    if(!basis){safeToast('Valid dispute reason select karo.');return}if(!confirmed){safeToast('Truthful confirmation tick karo.');return}
    try{const x=await api('/api/dispute-helper/draft',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accountLabel:($q('#disputeAccountLabel')?.value||'').replace(/^@/,''),postDescription:$q('#disputePostDesc')?.value||'',claimant:$q('#disputeClaimant')?.value||'',notice:$q('#disputeNotice')?.value||'',rightsBasis:basis,evidence,confirmedRights:true})});$q('#disputeDraft').value=(x.subject?`Subject: ${x.subject}\n\n`:'')+(x.draft||'');safeToast('Dispute draft ready ✅')}catch(e){safeToast(e.message)}
  }

  async function copyDraft(){const t=$q('#disputeDraft')?.value||'';if(!t){safeToast('Pehle draft generate karo.');return}try{await navigator.clipboard.writeText(t);safeToast('Draft copied ✅')}catch{$q('#disputeDraft').select();document.execCommand('copy');safeToast('Draft copied ✅')}}

  let bound=false;function bind(){if(bound)return;bound=true;$q('#refreshBlocked')?.addEventListener('click',()=>loadBlocked(true));$q('#blockedAccount')?.addEventListener('change',()=>loadBlocked(false));$q('#saveManualBlocked')?.addEventListener('click',saveManual);$q('#generateDispute')?.addEventListener('click',generateDraft);$q('#copyDispute')?.addEventListener('click',copyDraft)}

  window.addEventListener('DOMContentLoaded',()=>{ensureUi();setTimeout(()=>{fillAccounts();},1200)});
  const mo=new MutationObserver(()=>fillAccounts());window.addEventListener('load',()=>{const r=$q('#accountsList');if(r)mo.observe(r,{childList:true,subtree:true})});
})();
