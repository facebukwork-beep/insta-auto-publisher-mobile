/* v19 Smart Performance Suite overlay for the v17 mobile manager. */
(() => {
  const CF_BACKEND='https://insta-auto-publisher-backend.facebukwork.workers.dev';
  state.accountControls=state.accountControls||{};
  state.calendar=state.calendar||[];
  state.performance=state.performance||null;

  function v19Toast(m){ try{toast(m)}catch{console.log(m)} }
  function localOffset(){return -new Date().getTimezoneOffset()}
  function hourLabel(h){h=((Number(h)%24)+24)%24;return `${h%12||12}:00 ${h>=12?'PM':'AM'}`}
  function v19Esc(s){return typeof esc==='function'?esc(s):String(s??'')}

  if(!state.backend || /onrender\.com/i.test(state.backend)){
    state.backend=CF_BACKEND;
    localStorage.setItem('iap_backend_url',CF_BACKEND);
    if($('#backendUrl')) $('#backendUrl').value=CF_BACKEND;
  }

  async function loadV19Data(){
    if(!state.backend)return;
    try{const c=await api('/api/account-controls');state.accountControls=Object.fromEntries((c.accounts||[]).map(x=>[String(x.accountId),x]))}catch{state.accountControls={}}
    try{const c=await api(`/api/calendar/next24h?tzOffsetMinutes=${localOffset()}`);state.calendar=c.jobs||[]}catch{state.calendar=[]}
  }

  function renderCalendarV19(){
    const el=$('#calendarMobile'),sel=$('#calendarAccountMobile'),cnt=$('#calendarCountMobile');
    if(!el||!sel||!cnt)return;
    const keep=sel.value||'all';
    const pairs=[...new Map((state.calendar||[]).map(x=>[String(x.accountId),x.accountLabel])).entries()];
    sel.innerHTML='<option value="all">All accounts</option>'+pairs.map(([id,l])=>`<option value="${v19Esc(id)}">@${v19Esc(l||id)}</option>`).join('');
    if([...sel.options].some(o=>o.value===keep))sel.value=keep;
    const jobs=(state.calendar||[]).filter(x=>sel.value==='all'||String(x.accountId)===sel.value).sort((a,b)=>new Date(a.displayScheduledAt||a.scheduledAt)-new Date(b.displayScheduledAt||b.scheduledAt));
    cnt.textContent=`${jobs.length} post${jobs.length===1?'':'s'} in next 24h`;
    if(!jobs.length){el.innerHTML='<div class="empty">No posts in the next 24 hours.</div>';return}
    el.innerHTML=jobs.map(x=>`<div class="calmobile ${x.accountPaused?'paused':''}"><div class="caltime">${new Date(x.displayScheduledAt||x.scheduledAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}</div><div class="grow"><div class="jobname">@${v19Esc(x.accountLabel||'account')}</div><div class="calfile">${v19Esc(x.fileName||'video')}</div></div><span class="status">${x.accountPaused?'paused':v19Esc(x.status||'scheduled')}</span></div>`).join('');
  }

  function renderAccountsV19(){
    const el=$('#accountsList');if(!el)return;
    if(!state.accounts.length){el.innerHTML='<div class="empty">No connected accounts.</div>';return}
    el.innerHTML=state.accounts.map(a=>{const ctl=state.accountControls[String(a.id)]||{},p=!!ctl.paused;return `<div class="accountrow"><div class="grow"><strong>@${v19Esc(a.label)}${p?' · PAUSED':''}</strong><span>${v19Esc(a.igUserId)}</span></div><button class="btn small accountpause ${p?'paused':''}" data-v19ctl="${a.id}" data-v19action="${p?'resume':'pause'}">${p?'▶ Resume':'⏸ Pause'}</button><button class="btn small red" data-removeacct="${a.id}">Remove</button></div>`}).join('');
    el.querySelectorAll('[data-v19ctl]').forEach(b=>b.onclick=async()=>{try{await api(`/api/accounts/${encodeURIComponent(b.dataset.v19ctl)}/${b.dataset.v19action}`,{method:'POST'});v19Toast(b.dataset.v19action==='pause'?'Account paused':'Account resumed');await refreshAll(false)}catch(e){v19Toast(e.message)}});
    el.querySelectorAll('[data-removeacct]').forEach(b=>b.onclick=async()=>{if(!confirm('Remove this account?'))return;try{await api('/api/accounts/'+b.dataset.removeacct,{method:'DELETE'});state.selected.delete(b.dataset.removeacct);saveSelection();await refreshAll(false)}catch(e){v19Toast(e.message)}});
  }

  function renderV19(){renderCalendarV19();renderAccountsV19();}

  const oldRefreshAll=refreshAll;
  refreshAll=async function(showErr=true){const r=await oldRefreshAll(showErr);await loadV19Data();renderV19();return r};
  const oldRefreshSystem=refreshSystem;
  refreshSystem=async function(){const r=await oldRefreshSystem();try{const c=await api('/api/account-controls');state.accountControls=Object.fromEntries((c.accounts||[]).map(x=>[String(x.accountId),x]))}catch{}renderAccountsV19();return r};
  const oldRefreshJobsOnly=refreshJobsOnly;
  refreshJobsOnly=async function(){const r=await oldRefreshJobsOnly();try{const c=await api(`/api/calendar/next24h?tzOffsetMinutes=${localOffset()}`);state.calendar=c.jobs||[];renderCalendarV19()}catch{}return r};
  const oldRender=render;
  render=function(){oldRender();renderV19()};

  async function refreshCalendarV19(){try{const c=await api(`/api/calendar/next24h?tzOffsetMinutes=${localOffset()}`);state.calendar=c.jobs||[];renderCalendarV19();v19Toast('24-hour timeline refreshed')}catch(e){v19Toast(e.message)}}
  if($('#calendarAccountMobile'))$('#calendarAccountMobile').onchange=renderCalendarV19;
  if($('#refreshCalendarMobile'))$('#refreshCalendarMobile').onclick=refreshCalendarV19;

  async function accountBulkV19(action){
    const ids=[...state.selected];if(!ids.length){v19Toast('Schedule screen me account(s) select karo first.');return}
    try{const r=await api('/api/accounts/bulk-control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accountIds:ids,action})});v19Toast(`${r.changedAccounts||0} account(s) ${action==='pause'?'paused':'resumed'}`);await refreshAll(false)}catch(e){v19Toast(e.message)}
  }
  if($('#pauseSelectedMobile'))$('#pauseSelectedMobile').onclick=()=>accountBulkV19('pause');
  if($('#resumeSelectedMobile'))$('#resumeSelectedMobile').onclick=()=>accountBulkV19('resume');

  function renderPerformanceV19(){
    const x=state.performance,st=$('#performanceStatusMobile'),hours=$('#bestHoursMobile'),el=$('#performanceMobile');if(!st||!hours||!el)return;
    if(!x){st.textContent='Select one account above to load performance.';hours.innerHTML='';el.innerHTML='<div class="empty">No performance data loaded.</div>';return}
    st.textContent=`${x.source||'analytics'} · ${x.fetchedAt?new Date(x.fetchedAt).toLocaleTimeString():''}`;
    hours.innerHTML=(x.bestHours||[]).map((h,i)=>`<span class="bestHourChip">#${i+1} ${v19Esc(h.label||hourLabel(h.hour))}</span>`).join('');
    const items=x.items||[];
    el.innerHTML=items.length?items.slice(0,16).map(it=>`<div class="perfmobile"><div class="jobname">${v19Esc(it.caption||'Instagram media')}</div><div class="jobmeta">${it.timestamp?new Date(it.timestamp).toLocaleString():''}</div><div class="perfgrid"><span><strong>${Number(it.views||0).toLocaleString()}</strong>Views</span><span><strong>${Number(it.reach||0).toLocaleString()}</strong>Reach</span><span><strong>${Number(it.likes||0).toLocaleString()}</strong>Likes</span><span><strong>${Number(it.comments||0).toLocaleString()}</strong>Comments</span></div>${it.permalink?`<div class="jobactions"><a class="btn small green" target="_blank" rel="noopener" href="${v19Esc(it.permalink)}">View ↗</a></div>`:''}</div>`).join(''):'<div class="empty">No recent media metrics returned. Best Time will use published-history fallback.</div>';
  }
  async function loadPerformanceV19(force=false){
    const aid=state.publishedAccount||$('#publishedAccountFilter')?.value||'all',st=$('#performanceStatusMobile');if(!st)return;
    if(aid==='all'){state.performance=null;renderPerformanceV19();return}
    st.textContent='Loading recent Instagram performance…';
    try{state.performance=await api(`/api/performance?accountId=${encodeURIComponent(aid)}&tzOffsetMinutes=${localOffset()}${force?'&refresh=1':''}`);renderPerformanceV19()}catch(e){st.textContent=e.message;$('#performanceMobile').innerHTML='<div class="empty">Performance unavailable.</div>'}
  }
  if($('#refreshPerformanceMobile'))$('#refreshPerformanceMobile').onclick=()=>loadPerformanceV19(true);
  if($('#publishedAccountFilter'))$('#publishedAccountFilter').addEventListener('change',()=>setTimeout(()=>loadPerformanceV19(false),0));
  const oldShowView=showView;
  showView=function(name){const r=oldShowView(name);if(name==='published')setTimeout(()=>loadPerformanceV19(false),0);if(name==='accounts')setTimeout(()=>renderAccountsV19(),0);return r};

  async function computeBestTimesV19(videoCount,accountIds){
    const date=$('#scheduleDate').value;if(!date)throw new Error('Date select karo.');
    const data=await api(`/api/best-times?accountIds=${encodeURIComponent(accountIds.join(','))}&tzOffsetMinutes=${localOffset()}`),by=new Map((data.accounts||[]).map(x=>[String(x.accountId),x]));
    const now=Date.now(),today=dateKey(new Date()),rows=[];
    for(let i=0;i<videoCount;i++){
      const row={};
      for(const aid of accountIds){
        const best=(by.get(String(aid))?.bestHours||[]).map(x=>Number(x.hour)).filter(Number.isFinite);let day=date,base=null;
        for(const h of (best.length?best:[12,18,21])){const t=new Date(`${date}T${String(h).padStart(2,'0')}:00:00`).getTime();if(date!==today||t+burstOffset(i)>now+60000){base=t;break}}
        if(base===null){day=addDaysKey(date,1);const h=(best[0]??12);base=new Date(`${day}T${String(h).padStart(2,'0')}:00:00`).getTime()}
        row[aid]=new Date(base+burstOffset(i)).toISOString();
      }
      rows.push(row);
    }
    return rows;
  }

  const oldSetMode=setMode;
  setMode=function(mode){
    if(mode!=='best'){oldSetMode(mode);if($('#modeBest'))$('#modeBest').classList.remove('active');if($('#bestTimeNote'))$('#bestTimeNote').style.display='none';return}
    state.mode='best';
    ['modeRandom','mode24','modeFixed','modeMonthly'].forEach(id=>$('#'+id)?.classList.remove('active'));$('#modeBest')?.classList.add('active');
    if($('#randomTimes'))$('#randomTimes').style.display='none';if($('#fixedTimes'))$('#fixedTimes').style.display='none';if($('#mode24Note'))$('#mode24Note').style.display='none';if($('#monthlyFields'))$('#monthlyFields').style.display='none';if($('#bestTimeNote'))$('#bestTimeNote').style.display='block';
    const f=$('#scheduleDate')?.closest('.field');if(f)f.style.display='block';if($('#scheduleSummary'))$('#scheduleSummary').style.display='none';
  };
  if($('#modeBest'))$('#modeBest').onclick=()=>setMode('best');

  async function quickFingerprintV19(f){
    if(f.fingerprint)return f.fingerprint;const blob=f.blob||f,chunk=256*1024,first=new Uint8Array(await blob.slice(0,Math.min(chunk,blob.size)).arrayBuffer()),last=new Uint8Array(await blob.slice(Math.max(0,blob.size-chunk),blob.size).arrayBuffer()),meta=new TextEncoder().encode(`${f.name||blob.name||''}|${blob.size}|${f.lastModified||blob.lastModified||0}|${f.type||blob.type||''}`),all=new Uint8Array(meta.length+first.length+last.length);all.set(meta);all.set(first,meta.length);all.set(last,meta.length+first.length);const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',all));f.fingerprint=[...digest].map(b=>b.toString(16).padStart(2,'0')).join('');return f.fingerprint;
  }
  async function directUploadV19(batch,f){
    if(f.driveFileId)return f.driveFileId;const blob=f.blob;
    const init=await api('/api/direct-upload/init',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:f.name,type:f.type||blob.type||'video/mp4',size:Number(blob.size||0)})});
    const r=await fetch(init.uploadUrl,{method:'PUT',headers:{'Content-Type':f.type||blob.type||'video/mp4'},body:blob});const txt=await r.text();let data={};try{data=txt?JSON.parse(txt):{}}catch{}
    if(!r.ok||!data.id)throw new Error(`Google Drive direct upload failed (${r.status})`);f.driveFileId=data.id;await dbPut(batch);return data.id;
  }

  async function enhancedSaveV19(){
    try{
      const accountIds=selectedAccountIds();if(!accountIds.length)throw new Error('Kam se kam 1 account select karo.');let files=await buildPicked();if(!files.length)throw new Error('Video files select karo.');if(state.storage&&state.storage.safeToSchedule===false)throw new Error('Backend storage is not safe for scheduling yet.');
      let times,extraConfig={scheduleKind:state.mode,appendExisting:$('#appendExistingMobile')?.checked!==false,duplicateProtection:$('#duplicateProtectionMobile')?.checked!==false,appendGapMinutes:10};
      if(state.mode==='monthly'){
        const p=monthlyPlanSpec();if(p.days<1)throw new Error('Monthly dates select karo.');if(files.length<p.required)throw new Error(`Monthly plan needs ${p.required} videos. Select ${p.required-files.length} more.`);if(files.length>p.required){files=files.slice(0,p.required);v19Toast(`Using first ${p.required} videos for this monthly plan.`)}times=computeMonthlyTimes(accountIds,p);extraConfig={...extraConfig,scheduleKind:'monthly_smart',planId:crypto.randomUUID(),monthlyPlan:{startDate:p.start,endDate:p.end,dailyLimit:p.daily,distribution:'smart_24h_staggered',videos:p.required,accounts:accountIds.length}};
      }else{
        if(files.length>NORMAL_MAX_VIDEOS)throw new Error(`Normal modes allow max ${NORMAL_MAX_VIDEOS} videos. Use Monthly Smart for larger batches.`);times=state.mode==='best'?await computeBestTimesV19(files.length,accountIds):computeTimes(files.length,accountIds);if(state.mode==='best')extraConfig={...extraConfig,scheduleKind:'best_time'};
      }
      const id=crypto.randomUUID(),rec={id,createdAt:new Date().toISOString(),backend:state.backend,accountIds,files:files.map((f,i)=>({...f,times:times[i],lastModified:Number(f.blob?.lastModified||0)})),extraConfig,nextIndex:0,status:'pending'};
      $('#uploadProgressWrap').style.display='block';$('#uploadProgressText').textContent='Saving files safely on this phone…';await dbPut(rec);state.lastUploadError='';v19Toast(`${files.length} videos added to resume queue`);state.pickedFiles=[];$('#files').value='';$('#folderFiles').value='';$('#fileCount').textContent='Files saved. Uploading directly to Google Drive…';updateMonthlySummary();await renderUploadMini();enhancedResumeV19();
    }catch(e){v19Toast(e.message)}
  }

  async function enhancedResumeV19(){
    if(state.uploading||!state.backend)return;const all=(await dbAll()).filter(b=>b.backend===state.backend&&b.status!=='done'&&b.status!=='duplicate_blocked');if(!all.length){renderUploadMini();return}state.uploading=true;
    try{
      for(const batch of all){
        while(batch.nextIndex<batch.files.length){
          const chunk=batch.files.slice(batch.nextIndex,batch.nextIndex+5),explicit=[];for(const f of chunk)for(const aid of batch.accountIds)explicit.push(f.times[aid]);
          $('#uploadProgressWrap').style.display='block';const pct=Math.round(batch.nextIndex/batch.files.length*100);$('#uploadProgress').style.width=pct+'%';$('#uploadProgressText').textContent=`Checking duplicates & uploading ${batch.nextIndex}/${batch.files.length} videos…`;
          for(const f of chunk)await quickFingerprintV19(f);
          if((batch.extraConfig||{}).duplicateProtection!==false){
            const d=await api('/api/duplicates/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accountIds:batch.accountIds,files:chunk.map(f=>({fingerprint:f.fingerprint,name:f.name,size:Number(f.blob?.size||0)}))})});
            if(d.count){batch.status='duplicate_blocked';await dbPut(batch);throw new Error(`Duplicate Protection blocked ${d.count} matching item(s). Remove duplicate files or intentionally turn protection off and select again.`)}
          }
          for(const f of chunk)await directUploadV19(batch,f);
          const body={files:chunk.map(f=>({fileId:f.driveFileId,name:f.name,type:f.type||'video/mp4',size:Number(f.blob?.size||0),lastModified:Number(f.lastModified||0),fingerprint:f.fingerprint||null})),config:{accountIds:batch.accountIds,mode:'explicit',explicitTimes:explicit,captions:chunk.map(f=>f.caption),batchId:batch.id,...(batch.extraConfig||{})}};
          const result=await api('/api/schedule-direct',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});batch.nextIndex+=chunk.length;await dbPut(batch);state.lastUploadError='';if(result.appendInfo?.shiftedJobs)v19Toast(`${result.appendInfo.shiftedJobs} new job(s) shifted after existing queue`);await renderUploadMini();await refreshJobsOnly();
        }
        batch.status='done';await dbDelete(batch.id);$('#uploadProgress').style.width='100%';$('#uploadProgressText').textContent='All selected videos uploaded directly to Drive & scheduled.';v19Toast('All videos scheduled ✅');
      }
    }catch(e){state.lastUploadError=e.message;v19Toast('Upload paused: '+e.message)}finally{state.uploading=false;await renderUploadMini();setTimeout(()=>{if(!state.uploading)enhancedResumeV19()},15000)}
  }

  saveBatchAndUpload=enhancedSaveV19;
  resumeUploads=enhancedResumeV19;
  if($('#scheduleBtn'))$('#scheduleBtn').onclick=enhancedSaveV19;
  if($('#retryPendingBtn'))$('#retryPendingBtn').onclick=()=>{state.lastUploadError='';enhancedResumeV19()};

  if($('#backendUrl'))$('#backendUrl').value=state.backend||CF_BACKEND;
  const small=document.querySelector('.brand small');if(small)small.textContent='v19 · Smart Performance Suite';
  setTimeout(async()=>{await loadV19Data();renderV19();if((state.publishedAccount||'all')!=='all')loadPerformanceV19(false)},300);
})();
