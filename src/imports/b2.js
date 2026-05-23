/* ==========================================
   B2 · Outbound Discovery (Search Creators)
   3 variations: Filter+Grid | Map Search | Saved Lists
   ========================================== */
(function() {
  const page = document.getElementById('page-b2');

  // --- V1 Filter + Grid (per brief) ---
  const filterBar = `
    <div style="display:flex;gap:8px;align-items:center;padding:12px;background:var(--paper-tint);border:1.5px solid var(--rule);border-radius:10px;margin-bottom:16px;">
      <div style="flex:1;background:white;border:1.5px solid var(--rule);border-radius:8px;padding:8px 10px;display:flex;align-items:center;gap:6px;color:var(--ink-faint);font-family:var(--hand2);font-size:12px;">🔍 Search creators by handle, niche…</div>
      <div style="background:white;border:1.5px solid var(--rule);border-radius:8px;padding:7px 10px;font-family:var(--ui);font-size:11px;font-weight:700;display:flex;align-items:center;gap:5px;">📍 Within 10km ▾</div>
      <div style="background:white;border:1.5px solid var(--rule);border-radius:8px;padding:7px 10px;display:flex;align-items:center;gap:6px;">
        <span class="pill" style="background:linear-gradient(135deg,#E1306C,#F77737);color:white;border-color:transparent;font-size:9px;">IG</span>
        <span class="pill ghost" style="font-size:9px;">YT</span>
      </div>
      <div style="background:white;border:1.5px solid var(--rule);border-radius:8px;padding:7px 10px;font-family:var(--ui);font-size:11px;display:flex;align-items:center;gap:8px;min-width:180px;">
        <span style="font-weight:700;font-size:10px;color:var(--ink-faint);">Followers</span>
        <div style="flex:1;height:4px;background:var(--rule);border-radius:2px;position:relative;">
          <div style="position:absolute;left:20%;right:30%;height:100%;background:var(--orange);border-radius:2px;"></div>
          <div style="position:absolute;left:20%;top:-3px;width:10px;height:10px;background:white;border:1.5px solid var(--orange);border-radius:50%;transform:translateX(-50%);"></div>
          <div style="position:absolute;left:70%;top:-3px;width:10px;height:10px;background:white;border:1.5px solid var(--orange);border-radius:50%;transform:translateX(-50%);"></div>
        </div>
        <span style="font-weight:700;font-size:10px;">10K–50K</span>
      </div>
    </div>`;

  const discoverCard = (name, handle, followers, eng, niche, dist) => `
    <div class="box" style="padding:12px;background:white;display:flex;flex-direction:column;gap:10px;">
      <div class="ph" style="height:80px;border-radius:8px;"></div>
      <div style="display:flex;gap:8px;align-items:flex-start;">
        <div style="width:36px;height:36px;border-radius:50%;background:var(--paper-tint);border:1.5px solid var(--ink);flex-shrink:0;margin-top:-22px;"></div>
        <div style="flex:1;min-width:0;">
          <div style="font-family:var(--ui);font-weight:800;font-size:12px;line-height:1.1;">${name}</div>
          <div style="font-family:var(--ui);font-size:10px;color:var(--ink-faint);margin-top:2px;">${handle} · 📍 ${dist}</div>
        </div>
      </div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;">
        <span class="pill ghost" style="font-size:9px;">${niche}</span>
        <span class="pill ghost" style="font-size:9px;">${followers}</span>
        <span class="pill green" style="font-size:9px;">${eng} eng</span>
      </div>
      <button style="width:100%;padding:8px;background:var(--blue);border:none;color:white;border-radius:8px;font-family:var(--ui);font-weight:800;font-size:11px;">Invite to Pitch</button>
    </div>`;

  const v1Content = `
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:14px;">
      <div>
        <div style="font-family:var(--ui);font-weight:800;font-size:20px;">Discover Creators</div>
        <div style="font-family:var(--ui);font-size:11px;color:var(--ink-faint);margin-top:2px;">426 creators within 10km matching your filters</div>
      </div>
    </div>
    ${filterBar}
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
      ${discoverCard('Maya R.','@foodie_blr','28K','7.2%','🍜 Food','2.5km')}
      ${discoverCard('Arjun K.','@bangalorebites','45K','5.8%','🍜 Food','4.1km')}
      ${discoverCard('Priya S.','@dineanddash','12K','9.1%','✨ Lifestyle','1.2km')}
      ${discoverCard('Rohan M.','@thefoodiephd','82K','4.2%','🍜 Food','7.8km')}
    </div>`;

  const v1 = `
    <div style="position:relative;">
      <div class="annot" style="top:90px;left:0%;width:140px;text-align:center;">filter bar — radius,<br/>platform, follower<br/>range
        <svg class="arrow" style="left:60px;top:36px;" width="60" height="60"><path d="M0 4 Q40 30 50 50" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M44 42 L50 50 L42 50" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
      </div>
      <div class="annot blue" style="bottom:30px;right:-10px;width:140px;">primary action:<br/>"invite to pitch"<br/>(blue, not orange)
        <svg class="arrow" style="left:-22px;top:14px;" width="30" height="20"><path d="M28 4 Q14 14 0 16" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M8 8 L0 16 L9 16" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
      </div>
      ${osShell({
        crumb:{ active:'discover', path:'<strong>Marketing</strong> / Discover' },
        pills:'',
        content: v1Content,
        urlText:'app.treva.io/marketing/discover'
      })}
    </div>
  `;

  // --- V2 Map Search ---
  const v2Content = `
    <div style="display:flex;gap:14px;height:100%;">
      <div style="width:280px;display:flex;flex-direction:column;gap:10px;flex-shrink:0;">
        <div style="background:white;border:1.5px solid var(--rule);border-radius:8px;padding:8px 10px;font-family:var(--hand2);font-size:12px;color:var(--ink-faint);">🔍 Search…</div>
        <div style="background:var(--paper-tint);border:1.5px solid var(--rule);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:10px;">
          <div style="font-family:var(--ui);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;">Filters</div>
          <div><div style="font-size:10px;color:var(--ink-faint);font-weight:700;margin-bottom:4px;">Radius</div><div class="line" style="background:var(--rule);"></div></div>
          <div><div style="font-size:10px;color:var(--ink-faint);font-weight:700;margin-bottom:4px;">Followers</div><div class="line" style="background:var(--rule);"></div></div>
          <div><div style="font-size:10px;color:var(--ink-faint);font-weight:700;margin-bottom:6px;">Niche</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap;"><span class="pill orange" style="font-size:9px;">Food</span><span class="pill ghost" style="font-size:9px;">Lifestyle</span><span class="pill ghost" style="font-size:9px;">Travel</span></div>
          </div>
        </div>
        <div style="font-family:var(--ui);font-size:11px;font-weight:800;color:var(--ink);">3 results in view</div>
        ${[
          {n:'Maya R.',h:'@foodie_blr',f:'28K',e:'7.2%',d:'2.5km',sel:true},
          {n:'Priya S.',h:'@dineanddash',f:'12K',e:'9.1%',d:'1.2km',sel:false},
          {n:'Arjun K.',h:'@bangalorebites',f:'45K',e:'5.8%',d:'4.1km',sel:false},
        ].map(c => `
          <div style="background:white;border:1.5px solid ${c.sel?'var(--orange)':'var(--rule)'};border-radius:10px;padding:10px;display:flex;gap:8px;align-items:center;${c.sel?'box-shadow:2px 2px 0 var(--orange);':''}">
            <div style="width:30px;height:30px;border-radius:50%;background:var(--paper-tint);border:1px solid var(--ink);"></div>
            <div style="flex:1;min-width:0;">
              <div style="font-family:var(--ui);font-weight:700;font-size:11px;">${c.n}</div>
              <div style="font-family:var(--ui);font-size:9px;color:var(--ink-faint);">${c.h} · ${c.f} · ${c.e}</div>
            </div>
            <div style="font-family:var(--ui);font-size:9px;color:var(--orange);font-weight:700;">${c.d}</div>
          </div>`).join('')}
      </div>
      <div style="flex:1;background:#e8e3d4;border-radius:10px;border:1.5px solid var(--rule);position:relative;overflow:hidden;">
        <svg viewBox="0 0 600 460" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;display:block;">
          <rect width="600" height="460" fill="#e8e3d4"/>
          <path d="M0 80 L600 90 M0 220 L600 230 M0 360 L600 370" stroke="#cfc8b3" stroke-width="2"/>
          <path d="M120 0 L130 460 M280 0 L290 460 M440 0 L450 460" stroke="#cfc8b3" stroke-width="2"/>
          <rect x="180" y="120" width="100" height="80" fill="#d4e5c4" stroke="#bdd0a8"/>
          <!-- restaurant (you) -->
          <circle cx="300" cy="240" r="14" fill="#f97316" stroke="white" stroke-width="3"/>
          <text x="300" y="244" font-family="Plus Jakarta Sans" font-size="12" font-weight="800" fill="white" text-anchor="middle">★</text>
          <!-- radius -->
          <circle cx="300" cy="240" r="160" fill="none" stroke="#f97316" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.6"/>
          <!-- selected creator -->
          <g><circle cx="380" cy="180" r="20" fill="#f97316" stroke="#0f172a" stroke-width="2"/><text x="380" y="186" font-family="Plus Jakarta Sans" font-size="14" font-weight="800" fill="white" text-anchor="middle">M</text></g>
          <!-- other creators -->
          <g><circle cx="220" cy="320" r="14" fill="white" stroke="#0f172a" stroke-width="1.5"/><text x="220" y="325" font-family="Plus Jakarta Sans" font-size="11" font-weight="800" text-anchor="middle">P</text></g>
          <g><circle cx="450" cy="280" r="14" fill="white" stroke="#0f172a" stroke-width="1.5"/><text x="450" y="285" font-family="Plus Jakarta Sans" font-size="11" font-weight="800" text-anchor="middle">A</text></g>
        </svg>
        <!-- creator preview popup -->
        <div style="position:absolute;top:60px;left:340px;background:white;border:1.5px solid var(--ink);border-radius:10px;padding:10px;box-shadow:3px 4px 0 rgba(0,0,0,0.1);min-width:180px;">
          <div style="display:flex;gap:8px;align-items:center;">
            <div style="width:32px;height:32px;border-radius:50%;background:var(--paper-tint);border:1px solid var(--ink);"></div>
            <div style="flex:1;">
              <div style="font-family:var(--ui);font-weight:800;font-size:11px;">Maya R.</div>
              <div style="font-family:var(--ui);font-size:9px;color:var(--ink-faint);">28K · 7.2% eng</div>
            </div>
          </div>
          <button style="margin-top:8px;width:100%;padding:6px;background:var(--blue);border:none;color:white;border-radius:6px;font-family:var(--ui);font-weight:800;font-size:10px;">Invite to Pitch</button>
        </div>
      </div>
    </div>`;

  const v2 = `
    <div style="position:relative;">
      <div class="annot" style="top:90px;right:-10px;width:140px;color:var(--orange);">your restaurant<br/>+ radius circle
        <svg class="arrow" style="left:-22px;top:14px;" width="30" height="20"><path d="M28 4 Q14 14 0 16" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M8 8 L0 16 L9 16" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
      </div>
      ${osShell({
        crumb:{ active:'discover', path:'<strong>Marketing</strong> / Discover · Map' },
        pills:'',
        content: v2Content,
        urlText:'app.treva.io/marketing/discover?view=map'
      })}
    </div>
  `;

  // --- V3 Saved Lists ---
  const listSidebar = `
    <div style="width:200px;display:flex;flex-direction:column;gap:4px;flex-shrink:0;border-right:1.5px solid var(--rule);padding-right:14px;">
      <div style="font-family:var(--ui);font-size:9px;font-weight:800;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.06em;padding:6px 8px;">Saved Lists</div>
      ${[
        {n:'Anniversary Push',c:8,sel:true},
        {n:'Sunday Brunch',c:14,sel:false},
        {n:'Vegan Tasting',c:5,sel:false},
        {n:'Watchlist',c:23,sel:false},
      ].map(l => `<div style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:8px;background:${l.sel?'var(--orange-soft)':'transparent'};cursor:pointer;">
        <div style="width:8px;height:8px;border-radius:2px;background:${l.sel?'var(--orange)':'var(--rule)'};"></div>
        <div style="flex:1;font-family:var(--ui);font-weight:${l.sel?'800':'600'};font-size:12px;color:${l.sel?'var(--ink)':'var(--ink-soft)'};">${l.n}</div>
        <div style="font-family:var(--ui);font-size:10px;color:var(--ink-faint);">${l.c}</div>
      </div>`).join('')}
      <div style="border-top:1.5px dashed var(--rule);margin:6px 0;"></div>
      <div style="padding:8px;font-family:var(--hand);font-size:14px;color:var(--orange);font-weight:700;">+ New list</div>
    </div>`;

  const v3Content = `
    <div style="display:flex;gap:14px;">
      ${listSidebar}
      <div style="flex:1;min-width:0;">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:14px;">
          <div>
            <div style="font-family:var(--ui);font-weight:800;font-size:20px;">Anniversary Push · 8</div>
            <div style="font-family:var(--ui);font-size:11px;color:var(--ink-faint);">Curated for Smokehouse 5-yr anniversary · Mar 2026</div>
          </div>
          <div style="display:flex;gap:6px;">
            <span class="pill ghost" style="font-size:10px;">+ Add creator</span>
            <span class="pill blue" style="font-size:10px;">Invite all</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${[
            {n:'Maya R.',h:'@foodie_blr',f:'28K',e:'7.2%',s:'Pending invite'},
            {n:'Priya S.',h:'@dineanddash',f:'12K',e:'9.1%',s:'Accepted'},
            {n:'Arjun K.',h:'@bangalorebites',f:'45K',e:'5.8%',s:'Not yet invited'},
            {n:'Rohan M.',h:'@thefoodiephd',f:'82K',e:'4.2%',s:'Declined'},
          ].map(c => `
            <div style="display:grid;grid-template-columns:32px 1fr 90px 90px 130px 130px;gap:12px;align-items:center;background:white;border:1.5px solid var(--rule);border-radius:8px;padding:10px;">
              <div style="width:30px;height:30px;border-radius:50%;background:var(--paper-tint);border:1px solid var(--ink);"></div>
              <div>
                <div style="font-family:var(--ui);font-weight:800;font-size:12px;">${c.n}</div>
                <div style="font-family:var(--ui);font-size:10px;color:var(--ink-faint);">${c.h}</div>
              </div>
              <div style="font-family:var(--ui);font-size:11px;font-weight:700;">${c.f}</div>
              <div style="font-family:var(--ui);font-size:11px;font-weight:700;color:var(--green);">${c.e}</div>
              <div><span class="pill ${c.s==='Accepted'?'green':c.s==='Declined'?'red':c.s==='Pending invite'?'amber':'ghost'}" style="font-size:9px;">${c.s}</span></div>
              <button style="padding:7px;background:var(--blue);border:none;color:white;border-radius:6px;font-family:var(--ui);font-weight:800;font-size:10px;">${c.s==='Not yet invited'?'Invite to Pitch':'View'}</button>
            </div>`).join('')}
        </div>
      </div>
    </div>`;

  const v3 = `
    <div style="position:relative;">
      <div class="annot" style="top:90px;left:0%;width:130px;text-align:center;">curated lists<br/>(campaigns, vibes)
        <svg class="arrow" style="left:50px;top:36px;" width="40" height="40"><path d="M0 4 Q14 24 28 32" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M22 24 L28 32 L20 32" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
      </div>
      ${osShell({
        crumb:{ active:'discover', path:'<strong>Marketing</strong> / Discover · Lists' },
        pills:'',
        content: v3Content,
        urlText:'app.treva.io/marketing/discover/lists/anniversary'
      })}
    </div>
  `;

  page.innerHTML = `
    <header class="page-header">
      <div><h2 class="page-title"><span class="num">B2</span>Outbound Discovery</h2></div>
      <div class="page-sub">Brand-led search for creators. Three approaches: <strong>filter+grid</strong> (per brief), <strong>map</strong>, or <strong>saved lists</strong> for repeat campaigns.</div>
    </header>
    <div class="variations desktop">
      <div class="variation"><div class="var-label"><span class="var-num">01</span><span class="var-name">Filter &amp; Grid</span></div><div class="var-desc">Per brief — filter bar (radius, platform toggle, follower slider) over a creator card grid. "Invite to Pitch" sends notification to mobile.</div>${v1}</div>
      <div class="variation"><div class="var-label"><span class="var-num">02</span><span class="var-name">Map Search</span></div><div class="var-desc">Hyper-local matters — see creators on a map relative to your restaurant + the brief's "within Xkm" radius. Click a pin to invite.</div>${v2}</div>
      <div class="variation"><div class="var-label"><span class="var-num">03</span><span class="var-name">Saved Lists</span></div><div class="var-desc">Curate cohorts (e.g. "Anniversary Push") &amp; manage their pitch state. Designed for repeat / planned campaigns rather than one-off discovery.</div>${v3}</div>
    </div>
  `;
})();
