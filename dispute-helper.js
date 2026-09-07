/* Copyright Dispute Helper — assists users who own rights or have permission. It never auto-submits a dispute. */
(() => {
  const $q=s=>document.querySelector(s);
  const esc2=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const safeToast=m=>{try{toast(m)}catch{alert(m)}};

  function inject(){
    const published=$q('#view-published');
    if(!published || $q('#disputeHelperCard')) return;
    const card=document.createElement('div');
    card.className='card dispute-card';
    card.id='disputeHelperCard';
    card.innerHTML=`
      <div class="sectionhead"><div><h3>🛡 Copyright / Block Dispute Helper</h3><div class="sub">Use only when you own the content, have a license/permission, or the match is genuinely mistaken.</div></div><span class="pill">Manual submit</span></div>
      <div class="notice dispute-warning">This helper drafts your appeal. It does not bypass copyright systems and does not auto-submit anything to Meta/Instagram.</div>
      <div class="field"><label>Instagram account</label><select id="disputeAccount" class="select"><option value="">Select account</option></select></div>
      <div class="field"><label>Blocked post / Reel URL</label><input id="disputePostUrl" class="input" placeholder="https://www.instagram.com/reel/..." inputmode="url"></div>
      <div class="field"><label>Claimant / rights owner shown by Instagram</label><input id="disputeClaimant" class="input" placeholder="Example: JioHotstar"></div>
      <div class="field"><label>Why are you disputing?</label><select id="disputeBasis" class="select">
        <option value="">Choose a valid reason</option>
        <option value="original">I created and own this content</option>
        <option value="licensed">I have a valid license / written permission</option>
        <option value="publicdomain">The claimed material is public domain / not protected</option>
        <option value="mistake">The claim is a mistaken match and does not use the claimant's protected content</option>
      </select></div>
      <div class="field"><label>Proof / explanation</label><textarea id="disputeProof" class="textarea" rows="5" placeholder="Describe your ownership, license, permission, source files, contract, invoice, email permission, or why the match is wrong."></textarea></div>
      <label class="featurecheck dispute-confirm"><input id="disputeTruth" type="checkbox"><span><strong>I confirm this appeal is truthful</strong><small>I have a legitimate rights/permission basis and am not filing a false dispute.</small></span></label>
      <div class="jobactions"><button id="generateDispute" class="btn purple">✍ Generate dispute draft</button><button id="copyDispute" class="btn ghost">Copy draft</button><a id="openAccountStatus" class="btn ghost" target="_blank" rel="noopener" href="https://www.instagram.com/accounts/status/">Open Account Status ↗</a></div>
      <div class="field"><label>Draft</label><textarea id="disputeDraft" class="textarea dispute-draft" rows="10" readonly placeholder="Your dispute draft will appear here."></textarea></div>
      <div class="sub">Attach supporting proof in Instagram's official review flow where available. Do not submit a dispute if you do not have a legitimate basis.</div>`;
    const first=published.querySelector('.card');
    if(first) first.insertAdjacentElement('afterend',card); else published.appendChild(card);
    bind();
    fillAccounts();
  }

  function fillAccounts(){
    const sel=$q('#disputeAccount'); if(!sel) return;
    const keep=sel.value;
    const accts=(window.state?.accounts||[]);
    sel.innerHTML='<option value="">Select account</option>'+accts.map(a=>`<option value="${esc2(a.id)}">@${esc2(a.label)}</option>`).join('');
    if([...sel.options].some(o=>o.value===keep)) sel.value=keep;
  }

  function basisText(v){
    return ({
      original:'I am the original creator and rights holder of the content in this post.',
      licensed:'I have a valid license or written permission to use the material identified in the claim.',
      publicdomain:'The material identified in the claim is public domain or otherwise not protected in the manner asserted.',
      mistake:'This appears to be a mistaken automated match; my post does not use the claimant’s protected material in the way alleged.'
    })[v]||'';
  }

  function generate(){
    const account=$q('#disputeAccount')?.selectedOptions?.[0]?.textContent||'';
    const post=$q('#disputePostUrl')?.value.trim()||'';
    const claimant=$q('#disputeClaimant')?.value.trim()||'the claimant';
    const basis=$q('#disputeBasis')?.value||'';
    const proof=$q('#disputeProof')?.value.trim()||'';
    const truthful=!!$q('#disputeTruth')?.checked;
    if(!basis){safeToast('Valid dispute reason select karo.');return}
    if(!proof){safeToast('Proof / explanation likho.');return}
    if(!truthful){safeToast('Truthful appeal confirmation tick karo.');return}
    const txt=`Hello Instagram Review Team,\n\nI am requesting a review of the copyright/content restriction affecting my Instagram post${post?` (${post})`:''}${account?` on ${account}`:''}.\n\nThe notice identifies ${claimant} as the claimant. ${basisText(basis)}\n\nSupporting explanation / evidence:\n${proof}\n\nI am submitting this request in good faith and confirm that the information above is accurate. Please review the restriction and the supporting evidence associated with my appeal.\n\nThank you.`;
    $q('#disputeDraft').value=txt;
    safeToast('Dispute draft ready ✅');
  }

  async function copy(){
    const t=$q('#disputeDraft')?.value||''; if(!t){safeToast('Pehle draft generate karo.');return}
    try{await navigator.clipboard.writeText(t);safeToast('Draft copied ✅')}catch{$q('#disputeDraft').select();document.execCommand('copy');safeToast('Draft copied ✅')}
  }

  function bind(){
    $q('#generateDispute')?.addEventListener('click',generate);
    $q('#copyDispute')?.addEventListener('click',copy);
  }

  const mo=new MutationObserver(()=>fillAccounts());
  window.addEventListener('DOMContentLoaded',()=>{inject();setTimeout(fillAccounts,1500);const root=$q('#accountsList');if(root)mo.observe(root,{childList:true,subtree:true})});
})();
