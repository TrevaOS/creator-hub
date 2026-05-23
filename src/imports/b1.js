/* ==========================================
   B1 · Inbound Matches — "Likes You" queue
   3 variations: Grid | Kanban | Priority Queue
   ========================================== */
(function() {
  const page = document.getElementById('page-b1');

  const creatorCard = (name, handle, followers, eng, offer, badge) => `
    <div class="box" style="padding:14px;display:flex;flex-direction:column;gap:10px;background:white;">
      <div style="display:flex;gap:10px;align-items:flex-start;">
        <div style="width:42px;height:42px;border-radius:50%;background:var(--paper-tint);border:1.5px solid var(--ink);flex-shrink:0;"></div>
        <div style="flex:1;min-width:0;">
          <div style="font-family:var(--ui);font-weight:800;font-size:13px;line-height:1.1;">${name}</div>
          <div style="font-family:var(--ui);font-size:10px;color:var(--ink-faint);margin-top:2px;">${handle}</div>
        </div>
        ${badge || ''}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
        <div style="background:var(--paper-tint);border-radius:6px;padding:6px;">
          <div style="font-family:var(--ui);font-size:8px;color:var(--ink-faint);text-transform:uppercase;font-weight:700;">Followers</div>
          <div style="font-family:var(--hand);font-weight:700;font-size:18px;line-height:1;">${followers}</div>
        </div>
        <div style="background:var(--green-soft);border-radius:6px;padding:6px;">
          <div style="font-family:var(--ui);font-size:8px;color:var(--green);text-transform:uppercase;font-weight:700;">Engagement</div>
          <div style="font-family:var(--hand);font-weight:700;font-size:18px;line-height:1;color:var(--green);">${eng}</div>
        </div>
      </div>
      <div style="background:var(--orange-soft);border:1px dashed var(--orange);border-radius:6px;padding:6px 8px;">
        <div style="font-family:var(--ui);font-size:8px;color:var(--orange);text-transform:uppercase;font-weight:700;">Requested Offer</div>
        <div style="font-family:var(--ui);font-size:11px;font-weight:700;color:var(--ink);">${offer}</div>
      </div>
      <div style="display:flex;gap:6px;">
        <button style="flex:1;padding:8px;background:white;border:1.5px solid var(--rule);color:var(--red);border-radius:8px;font-family:var(--ui);font-weight:700;font-size:11px;">✕ Decline</button>
        <button style="flex:1.6;padding:8px;background:var(--orange);border:1.5px solid var(--orange);color:white;border-radius:8px;font-family:var(--ui);font-weight:800;font-size:11px;">Accept Collab</button>
      </div>
    </div>`;

  const v1Content = `
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:18px;">
      <div>
        <div style="font-family:var(--ui);font-weight:800;font-size:22px;letter-spacing:-0.01em;">Creators Interested in You</div>
        <div style="font-family:var(--ui);font-size:12px;color:var(--ink-faint);margin-top:2px;">12 new pitches · 3 super matches</div>
      </div>
      <div style="display:flex;gap:6px;">
        <span class="pill ghost" style="font-size:10px;">Sort: Newest</span>
        <span class="pill ghost" style="font-size:10px;">Filter</span>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
      ${creatorCard('Maya R.','@foodie_blr','28.4K','7.2%','Barter: Dinner for 2', '<span class="pill" style="background:var(--blue);color:white;border-color:var(--blue);font-size:9px;">★ Super</span>')}
      ${creatorCard('Arjun K.','@bangalorebites','45.1K','5.8%','Barter + ₹3,000', '')}
      ${creatorCard('Priya S.','@dineanddash','12.2K','9.1%','Barter only', '')}
      ${creatorCard('Rohan M.','@thefoodiephd','82K','4.2%','₹8,000 + Meal', '')}
    </div>`;

  const v1 = `
    <div style="position:relative;">
      <div class="annot" style="top:-8px;left:24%;width:160px;">grid layout — easy<br/>scanning of multiple<br/>creators
        <svg class="arrow" style="left:30px;top:50px;" width="40" height="40"><path d="M4 4 Q14 24 28 32" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M22 24 L28 32 L20 32" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
      </div>
      <div class="annot ink" style="top:280px;right:-10px;width:140px;">decline (ghost) +<br/>accept (orange)<br/>per brief
        <svg class="arrow" style="left:-22px;top:14px;" width="30" height="20"><path d="M28 4 Q14 14 0 16" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M8 8 L0 16 L9 16" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
      </div>
      ${osShell({
        crumb:{ active:'inbound', path:'<strong>Marketing</strong> / Inbound' },
        pills:'<span class="pill orange" style="font-size:10px;">12 new</span>',
        content: v1Content,
        urlText:'app.treva.io/marketing/inbound'
      })}
    </div>
  `;

  // --- V2 Kanban ---
  const kanCard = (name, eng, offer) => `
    <div class="box" style="padding:9px;background:white;">
      <div style="display:flex;gap:8px;align-items:center;">
        <div style="width:30px;height:30px;border-radius:50%;background:var(--paper-tint);border:1px solid var(--ink);flex-shrink:0;"></div>
        <div style="flex:1;min-width:0;">
          <div style="font-family:var(--ui);font-weight:700;font-size:11px;line-height:1.1;">${name}</div>
          <div style="font-family:var(--ui);font-size:9px;color:var(--green);font-weight:700;">${eng} eng</div>
        </div>
      </div>
      <div style="font-family:var(--ui);font-size:9px;color:var(--ink-faint);margin-top:6px;line-height:1.3;">${offer}</div>
    </div>`;
  const kanCol = (label, color, count, cards) => `
    <div style="background:var(--paper-tint);border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:8px;min-width:0;">
      <div style="display:flex;align-items:center;gap:6px;">
        <div style="width:8px;height:8px;background:${color};border-radius:50%;"></div>
        <div style="font-family:var(--ui);font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">${label}</div>
        <div style="font-family:var(--ui);font-size:10px;color:var(--ink-faint);">· ${count}</div>
      </div>
      ${cards}
    </div>`;
  const v2Content = `
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:14px;">
      <div style="font-family:var(--ui);font-weight:800;font-size:20px;">Pipeline · Kanban</div>
      <div style="display:flex;gap:6px;"><span class="pill ghost" style="font-size:10px;">+ Invite</span></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
      ${kanCol('New', 'var(--orange)', 12,
        kanCard('Maya R.','7.2%','Barter: Dinner for 2') + kanCard('Arjun K.','5.8%','Barter + ₹3,000') + kanCard('Priya S.','9.1%','Barter only')
      )}
      ${kanCol('Reviewing', 'var(--blue)', 4,
        kanCard('Rohan M.','4.2%','₹8,000 + Meal') + kanCard('Sara V.','6.1%','Barter only')
      )}
      ${kanCol('Accepted', 'var(--green)', 2,
        kanCard('Devi P.','8.4%','Barter: Dinner for 4')
      )}
      ${kanCol('Active', 'var(--amber)', 3,
        kanCard('Kiran A.','5.5%','Awaiting visit') + kanCard('Tanvi G.','7.8%','Content pending')
      )}
    </div>`;
  const v2 = `
    <div style="position:relative;">
      <div class="annot" style="top:-6px;left:30%;width:160px;">kanban — drag<br/>creators across<br/>stages
        <svg class="arrow" style="left:30px;top:50px;" width="60" height="40"><path d="M4 4 Q24 24 50 30" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M44 22 L50 30 L42 32" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
      </div>
      ${osShell({
        crumb:{ active:'inbound', path:'<strong>Marketing</strong> / Inbound · Pipeline' },
        pills:'',
        content: v2Content,
        urlText:'app.treva.io/marketing/inbound?view=kanban'
      })}
    </div>
  `;

  // --- V3 Priority Queue ---
  const queueRow = (rank, name, score, why, offer, isTop) => `
    <div style="display:grid;grid-template-columns:40px 1fr 220px 220px 200px;gap:14px;align-items:center;padding:14px;background:${isTop?'var(--orange-soft)':'white'};border:1.5px solid ${isTop?'var(--orange)':'var(--rule)'};border-radius:10px;">
      <div style="font-family:var(--hand);font-weight:700;font-size:30px;color:${isTop?'var(--orange)':'var(--ink-faint)'};line-height:1;">${rank}</div>
      <div>
        <div style="font-family:var(--ui);font-weight:800;font-size:13px;">${name}</div>
        <div style="font-family:var(--ui);font-size:10px;color:var(--ink-faint);margin-top:2px;">${why}</div>
      </div>
      <div>
        <div style="font-family:var(--ui);font-size:9px;color:var(--ink-faint);font-weight:700;text-transform:uppercase;">Match Score</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
          <div style="flex:1;height:6px;background:var(--rule-soft);border-radius:3px;overflow:hidden;"><div style="height:100%;width:${score}%;background:${score>80?'var(--green)':score>60?'var(--amber)':'var(--rule)'};"></div></div>
          <div style="font-family:var(--ui);font-weight:800;font-size:12px;">${score}</div>
        </div>
      </div>
      <div>
        <div style="font-family:var(--ui);font-size:9px;color:var(--ink-faint);font-weight:700;text-transform:uppercase;">Offer</div>
        <div style="font-family:var(--ui);font-size:11px;font-weight:700;margin-top:2px;">${offer}</div>
      </div>
      <div style="display:flex;gap:6px;">
        <button style="padding:7px 10px;background:white;border:1.5px solid var(--rule);color:var(--red);border-radius:7px;font-family:var(--ui);font-weight:700;font-size:10px;">✕</button>
        <button style="flex:1;padding:7px 10px;background:var(--orange);border:1.5px solid var(--orange);color:white;border-radius:7px;font-family:var(--ui);font-weight:800;font-size:10px;">Accept</button>
      </div>
    </div>`;
  const v3Content = `
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:14px;">
      <div>
        <div style="font-family:var(--ui);font-weight:800;font-size:20px;">Ranked Inbound · 12</div>
        <div style="font-family:var(--ui);font-size:11px;color:var(--ink-faint);margin-top:2px;">Sorted by AI match score · audience overlap, niche fit, recency</div>
      </div>
      <div style="display:flex;gap:6px;"><span class="pill ghost" style="font-size:10px;">Sort: Score</span></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${queueRow('01','Maya R. · @foodie_blr',92,'92% audience overlap · same neighbourhood','Barter: Dinner for 2', true)}
      ${queueRow('02','Priya S. · @dineanddash',87,'Top engagement rate · food niche','Barter only', false)}
      ${queueRow('03','Arjun K. · @bangalorebites',74,'High reach · partial niche fit','Barter + ₹3,000', false)}
      ${queueRow('04','Rohan M. · @thefoodiephd',58,'Big follower count · low engagement','₹8,000 + Meal', false)}
    </div>`;
  const v3 = `
    <div style="position:relative;">
      <div class="annot" style="top:-6px;left:35%;width:160px;color:var(--orange);">AI-ranked: top<br/>match highlighted
        <svg class="arrow" style="left:30px;top:46px;" width="40" height="40"><path d="M4 4 Q14 24 28 32" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M22 24 L28 32 L20 32" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
      </div>
      ${osShell({
        crumb:{ active:'inbound', path:'<strong>Marketing</strong> / Inbound · Ranked' },
        pills:'',
        content: v3Content,
        urlText:'app.treva.io/marketing/inbound?view=ranked'
      })}
    </div>
  `;

  page.innerHTML = `
    <header class="page-header">
      <div><h2 class="page-title"><span class="num">B1</span>Inbound · "Likes You" Queue</h2></div>
      <div class="page-sub">Where the brand sees creators pitching them. Three takes on <strong>information density</strong> &amp; <strong>decision support</strong> — grid, pipeline, or AI-ranked queue.</div>
    </header>
    <div class="variations desktop">
      <div class="variation"><div class="var-label"><span class="var-num">01</span><span class="var-name">Card Grid</span></div><div class="var-desc">Per brief — 4-up grid. Familiar, scannable, surfaces all the brief's required fields per card.</div>${v1}</div>
      <div class="variation"><div class="var-label"><span class="var-num">02</span><span class="var-name">Kanban Pipeline</span></div><div class="var-desc">Inbound + accepted + active in one board — drag creators across stages. Higher-context view for marketing managers running 10+ collabs.</div>${v2}</div>
      <div class="variation"><div class="var-label"><span class="var-num">03</span><span class="var-name">Ranked Queue</span></div><div class="var-desc">AI ranks by match score with explanation. Faster decisions when inbound volume is high — "just look at the top 3".</div>${v3}</div>
    </div>
  `;
})();
