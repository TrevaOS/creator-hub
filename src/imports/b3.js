/* ==========================================
   B3 · Campaign & Reservation Manager
   3 variations: Table+Modal | Split Pane | Inline Side Sheet
   ========================================== */
(function() {
  const page = document.getElementById('page-b3');

  // --- V1 Table + Modal (per brief) ---
  const tableRow = (name, status, statusColor, deadline, btnState) => {
    let btn = '';
    if (btnState === 'book') {
      btn = `<button style="padding:7px 12px;background:white;border:1.5px solid var(--blue);color:var(--blue);border-radius:7px;font-family:var(--ui);font-weight:800;font-size:11px;">📅 Book Table</button>`;
    } else if (btnState === 'booked') {
      btn = `<button style="padding:7px 12px;background:var(--green);border:1.5px solid var(--green);color:white;border-radius:7px;font-family:var(--ui);font-weight:800;font-size:11px;">✓ Table Booked (View Floor)</button>`;
    } else if (btnState === 'pending') {
      btn = `<button style="padding:7px 12px;background:var(--orange);border:1.5px solid var(--orange);color:white;border-radius:7px;font-family:var(--ui);font-weight:800;font-size:11px;">↗ Review Draft</button>`;
    } else {
      btn = `<button style="padding:7px 12px;background:white;border:1.5px solid var(--rule);color:var(--ink-soft);border-radius:7px;font-family:var(--ui);font-weight:700;font-size:11px;">View</button>`;
    }
    return `
      <div style="display:grid;grid-template-columns:32px 1.4fr 1fr 1fr 220px;gap:14px;align-items:center;padding:12px 14px;border-bottom:1px solid var(--rule-soft);background:white;">
        <div style="width:30px;height:30px;border-radius:50%;background:var(--paper-tint);border:1px solid var(--ink);"></div>
        <div>
          <div style="font-family:var(--ui);font-weight:800;font-size:12px;">${name}</div>
          <div style="font-family:var(--ui);font-size:10px;color:var(--ink-faint);">@handle · 28K</div>
        </div>
        <div><span class="pill ${statusColor}" style="font-size:10px;">${status}</span></div>
        <div style="font-family:var(--ui);font-size:11px;color:var(--ink-soft);">${deadline}</div>
        <div>${btn}</div>
      </div>`;
  };

  const v1Content = `
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:14px;">
      <div>
        <div style="font-family:var(--ui);font-weight:800;font-size:20px;">Active Campaigns</div>
        <div style="font-family:var(--ui);font-size:11px;color:var(--ink-faint);">5 collabs in motion · 2 awaiting visit · 1 content pending</div>
      </div>
      <div style="display:flex;gap:6px;"><span class="pill ghost" style="font-size:10px;">Filter</span><span class="pill ghost" style="font-size:10px;">Export</span></div>
    </div>
    <div style="background:white;border:1.5px solid var(--ink);border-radius:10px;overflow:hidden;">
      <div style="display:grid;grid-template-columns:32px 1.4fr 1fr 1fr 220px;gap:14px;padding:10px 14px;background:var(--paper-tint);border-bottom:1.5px solid var(--ink);font-family:var(--ui);font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-soft);">
        <div></div><div>Creator</div><div>Status</div><div>Next Step</div><div>Action</div>
      </div>
      ${tableRow('Maya R.','Awaiting Visit','blue','Reservation needed','book')}
      ${tableRow('Priya S.','Awaiting Visit','blue','Reservation needed','book')}
      ${tableRow('Devi P.','Table Booked','green','Sat 14 · 8:00pm · 2 pax','booked')}
      ${tableRow('Kiran A.','Content Pending','amber','Draft due Friday','pending')}
      ${tableRow('Tanvi G.','Done','green','Posted · 42K reach','view')}
    </div>
  `;

  // The reservation modal (overlay)
  const modal = `
    <div style="position:absolute;inset:0;background:rgba(15,23,42,0.45);z-index:10;display:flex;align-items:center;justify-content:center;">
      <div style="width:420px;background:white;border:2px solid var(--ink);border-radius:14px;box-shadow:6px 8px 0 rgba(0,0,0,0.15);overflow:hidden;">
        <div style="padding:14px 18px;border-bottom:1.5px solid var(--rule);display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-family:var(--ui);font-weight:800;font-size:15px;">New Reservation</div>
            <div style="font-family:var(--ui);font-size:10px;color:var(--ink-faint);">For collab with Maya R. · @foodie_blr</div>
          </div>
          <div style="width:24px;height:24px;border:1.5px solid var(--rule);border-radius:6px;display:grid;place-items:center;font-size:12px;color:var(--ink-faint);">✕</div>
        </div>
        <div style="padding:18px;display:flex;flex-direction:column;gap:12px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div>
              <div style="font-family:var(--ui);font-size:9px;font-weight:800;color:var(--ink-faint);text-transform:uppercase;margin-bottom:4px;">Date</div>
              <div style="background:white;border:1.5px solid var(--rule);border-radius:8px;padding:8px;font-family:var(--ui);font-size:11px;font-weight:700;">📅 Sat 14 Mar 2026</div>
            </div>
            <div>
              <div style="font-family:var(--ui);font-size:9px;font-weight:800;color:var(--ink-faint);text-transform:uppercase;margin-bottom:4px;">Time</div>
              <div style="background:white;border:1.5px solid var(--rule);border-radius:8px;padding:8px;font-family:var(--ui);font-size:11px;font-weight:700;">⏰ 8:00 pm</div>
            </div>
          </div>
          <div>
            <div style="font-family:var(--ui);font-size:9px;font-weight:800;color:var(--ink-faint);text-transform:uppercase;margin-bottom:4px;">Pax</div>
            <div style="display:flex;gap:6px;align-items:center;">
              <button style="width:28px;height:28px;border:1.5px solid var(--rule);background:white;border-radius:7px;font-family:var(--ui);font-weight:800;">−</button>
              <div style="flex:1;background:white;border:1.5px solid var(--rule);border-radius:8px;padding:8px;font-family:var(--ui);font-size:11px;font-weight:700;text-align:center;">2 guests</div>
              <button style="width:28px;height:28px;border:1.5px solid var(--rule);background:white;border-radius:7px;font-family:var(--ui);font-weight:800;">+</button>
              <div style="font-family:var(--hand);font-size:14px;color:var(--ink-faint);">pre-filled</div>
            </div>
          </div>
          <div>
            <div style="font-family:var(--ui);font-size:9px;font-weight:800;color:var(--ink-faint);text-transform:uppercase;margin-bottom:4px;">Tags</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap;">
              <span class="pill orange" style="font-size:10px;">🎁 Marketing: Barter</span>
              <span class="pill ghost" style="font-size:10px;">+ Add tag</span>
            </div>
            <div style="font-family:var(--hand);font-size:13px;color:var(--ink-faint);margin-top:6px;">↑ forced tag — front desk sees this on the day</div>
          </div>
          <div>
            <div style="font-family:var(--ui);font-size:9px;font-weight:800;color:var(--ink-faint);text-transform:uppercase;margin-bottom:4px;">Notes</div>
            <div style="background:var(--paper-tint);border:1.5px dashed var(--rule);border-radius:8px;padding:8px;font-family:var(--ui);font-size:11px;color:var(--ink-faint);min-height:36px;">Optional · e.g. dietary preferences</div>
          </div>
        </div>
        <div style="padding:12px 18px;border-top:1.5px solid var(--rule);background:var(--paper-tint);display:flex;gap:8px;justify-content:flex-end;">
          <button style="padding:9px 14px;background:white;border:1.5px solid var(--rule);color:var(--ink-soft);border-radius:8px;font-family:var(--ui);font-weight:700;font-size:11px;">Cancel</button>
          <button style="padding:9px 14px;background:var(--orange);border:1.5px solid var(--orange);color:white;border-radius:8px;font-family:var(--ui);font-weight:800;font-size:11px;">✓ Confirm Reservation</button>
        </div>
      </div>
    </div>
  `;

  const v1 = `
    <div style="position:relative;">
      <div class="annot ink" style="top:90px;right:-10px;width:140px;">"Book Table" CTA<br/>only on accepted<br/>collabs
        <svg class="arrow" style="left:-22px;top:14px;" width="30" height="20"><path d="M28 4 Q14 14 0 16" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M8 8 L0 16 L9 16" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
      </div>
      <div class="annot" style="top:240px;right:-10px;width:140px;color:var(--green);">success state:<br/>green + "view floor"
        <svg class="arrow" style="left:-22px;top:14px;" width="30" height="20"><path d="M28 4 Q14 14 0 16" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M8 8 L0 16 L9 16" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
      </div>
      ${osShell({
        crumb:{ active:'campaigns', path:'<strong>Marketing</strong> / Campaigns' },
        pills:'',
        content: v1Content,
        urlText:'app.treva.io/marketing/campaigns'
      })}
    </div>
    <!-- modal preview below -->
    <div style="margin-top:32px;position:relative;">
      <div class="annot blue" style="top:-22px;left:0;width:280px;">📋 New Reservation Modal — opens on "Book Table" click. Forced [Marketing: Barter] tag pushes to FloorLivePage.
      </div>
      <div style="position:relative;background:rgba(15,23,42,0.5);border-radius:14px;padding:32px;display:flex;justify-content:center;border:1.5px dashed var(--rule);">
        <div style="width:420px;background:white;border:2px solid var(--ink);border-radius:14px;box-shadow:6px 8px 0 rgba(0,0,0,0.15);overflow:hidden;">
          <div style="padding:14px 18px;border-bottom:1.5px solid var(--rule);display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-family:var(--ui);font-weight:800;font-size:15px;">New Reservation</div>
              <div style="font-family:var(--ui);font-size:10px;color:var(--ink-faint);">For collab with Maya R. · @foodie_blr</div>
            </div>
            <div style="width:24px;height:24px;border:1.5px solid var(--rule);border-radius:6px;display:grid;place-items:center;font-size:12px;color:var(--ink-faint);">✕</div>
          </div>
          <div style="padding:18px;display:flex;flex-direction:column;gap:12px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <div style="font-family:var(--ui);font-size:9px;font-weight:800;color:var(--ink-faint);text-transform:uppercase;margin-bottom:4px;">Date</div>
                <div style="background:white;border:1.5px solid var(--rule);border-radius:8px;padding:8px;font-family:var(--ui);font-size:11px;font-weight:700;">📅 Sat 14 Mar 2026</div>
              </div>
              <div>
                <div style="font-family:var(--ui);font-size:9px;font-weight:800;color:var(--ink-faint);text-transform:uppercase;margin-bottom:4px;">Time</div>
                <div style="background:white;border:1.5px solid var(--rule);border-radius:8px;padding:8px;font-family:var(--ui);font-size:11px;font-weight:700;">⏰ 8:00 pm</div>
              </div>
            </div>
            <div>
              <div style="font-family:var(--ui);font-size:9px;font-weight:800;color:var(--ink-faint);text-transform:uppercase;margin-bottom:4px;">Pax</div>
              <div style="display:flex;gap:6px;align-items:center;">
                <button style="width:28px;height:28px;border:1.5px solid var(--rule);background:white;border-radius:7px;font-family:var(--ui);font-weight:800;">−</button>
                <div style="flex:1;background:white;border:1.5px solid var(--rule);border-radius:8px;padding:8px;font-family:var(--ui);font-size:11px;font-weight:700;text-align:center;">2 guests</div>
                <button style="width:28px;height:28px;border:1.5px solid var(--rule);background:white;border-radius:7px;font-family:var(--ui);font-weight:800;">+</button>
                <div style="font-family:var(--hand);font-size:14px;color:var(--ink-faint);">pre-filled</div>
              </div>
            </div>
            <div>
              <div style="font-family:var(--ui);font-size:9px;font-weight:800;color:var(--ink-faint);text-transform:uppercase;margin-bottom:4px;">Tags</div>
              <div style="display:flex;gap:4px;flex-wrap:wrap;">
                <span class="pill orange" style="font-size:10px;">🎁 Marketing: Barter</span>
                <span class="pill ghost" style="font-size:10px;">+ Add tag</span>
              </div>
              <div style="font-family:var(--hand);font-size:13px;color:var(--ink-faint);margin-top:6px;">↑ forced tag — front desk sees this on the day</div>
            </div>
          </div>
          <div style="padding:12px 18px;border-top:1.5px solid var(--rule);background:var(--paper-tint);display:flex;gap:8px;justify-content:flex-end;">
            <button style="padding:9px 14px;background:white;border:1.5px solid var(--rule);color:var(--ink-soft);border-radius:8px;font-family:var(--ui);font-weight:700;font-size:11px;">Cancel</button>
            <button style="padding:9px 14px;background:var(--orange);border:1.5px solid var(--orange);color:white;border-radius:8px;font-family:var(--ui);font-weight:800;font-size:11px;">✓ Confirm Reservation</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // --- V2 Split Pane (list left, detail right) ---
  const v2Content = `
    <div style="display:flex;gap:14px;height:100%;">
      <div style="width:280px;flex-shrink:0;display:flex;flex-direction:column;gap:6px;">
        <div style="font-family:var(--ui);font-weight:800;font-size:14px;margin-bottom:4px;">Active · 5</div>
        ${[
          {n:'Maya R.',s:'Awaiting Visit',c:'blue',sel:true},
          {n:'Priya S.',s:'Awaiting Visit',c:'blue'},
          {n:'Devi P.',s:'Booked',c:'green'},
          {n:'Kiran A.',s:'Content Pending',c:'amber'},
          {n:'Tanvi G.',s:'Done',c:'green'},
        ].map(c => `
          <div style="background:${c.sel?'white':'transparent'};border:1.5px solid ${c.sel?'var(--ink)':'transparent'};border-radius:8px;padding:10px;display:flex;gap:8px;align-items:center;${c.sel?'box-shadow:2px 2px 0 var(--orange);':''}">
            <div style="width:30px;height:30px;border-radius:50%;background:var(--paper-tint);border:1px solid var(--ink);"></div>
            <div style="flex:1;min-width:0;">
              <div style="font-family:var(--ui);font-weight:${c.sel?'800':'600'};font-size:12px;">${c.n}</div>
              <div style="margin-top:3px;"><span class="pill ${c.c}" style="font-size:9px;">${c.s}</span></div>
            </div>
          </div>`).join('')}
      </div>
      <div style="flex:1;background:var(--paper-tint);border:1.5px solid var(--rule);border-radius:12px;padding:18px;min-width:0;">
        <div style="display:flex;gap:14px;align-items:center;margin-bottom:14px;">
          <div style="width:54px;height:54px;border-radius:50%;background:white;border:2px solid var(--ink);"></div>
          <div style="flex:1;">
            <div style="font-family:var(--ui);font-weight:800;font-size:18px;">Maya R. · @foodie_blr</div>
            <div style="font-family:var(--ui);font-size:11px;color:var(--ink-faint);">28.4K · 7.2% eng · Barter: Dinner for 2</div>
          </div>
          <button style="padding:9px 14px;background:white;border:1.5px solid var(--blue);color:var(--blue);border-radius:8px;font-family:var(--ui);font-weight:800;font-size:11px;">📅 Book Table</button>
        </div>
        <!-- timeline -->
        <div style="background:white;border:1.5px solid var(--rule);border-radius:10px;padding:14px;">
          <div style="font-family:var(--ui);font-size:10px;font-weight:800;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">Timeline</div>
          ${[
            {d:'Mar 5',l:'Pitched · barter for dinner',done:true},
            {d:'Mar 6',l:'Accepted by you',done:true},
            {d:'·',l:'Book table & reserve date',done:false,active:true},
            {d:'·',l:'Visit + content draft',done:false},
            {d:'·',l:'Posted + reach reported',done:false},
          ].map(s => `
            <div style="display:flex;gap:10px;align-items:flex-start;padding:6px 0;">
              <div style="width:18px;height:18px;border-radius:50%;background:${s.done?'var(--green)':s.active?'var(--orange)':'white'};border:1.5px solid ${s.done?'var(--green)':s.active?'var(--orange)':'var(--rule)'};display:grid;place-items:center;color:white;font-family:var(--ui);font-weight:800;font-size:10px;flex-shrink:0;">${s.done?'✓':''}</div>
              <div style="flex:1;font-family:var(--ui);font-size:11px;font-weight:${s.active?'800':'600'};color:${s.active?'var(--ink)':'var(--ink-soft)'};">${s.l}</div>
              <div style="font-family:var(--ui);font-size:10px;color:var(--ink-faint);">${s.d}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;

  const v2 = `
    <div style="position:relative;">
      <div class="annot" style="top:90px;left:0%;width:130px;text-align:center;">list left,<br/>detail right
        <svg class="arrow" style="left:50px;top:36px;" width="40" height="40"><path d="M0 4 Q14 24 28 32" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M22 24 L28 32 L20 32" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
      </div>
      ${osShell({
        crumb:{ active:'campaigns', path:'<strong>Marketing</strong> / Campaigns · Detail' },
        content: v2Content,
        urlText:'app.treva.io/marketing/campaigns/maya-r'
      })}
    </div>
  `;

  // --- V3 Inline Side Sheet (reservation slides in) ---
  const v3Content = `
    <div style="display:flex;gap:14px;height:100%;">
      <div style="flex:1;min-width:0;">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:12px;">
          <div style="font-family:var(--ui);font-weight:800;font-size:18px;">Active Campaigns · 5</div>
        </div>
        <div style="background:white;border:1.5px solid var(--ink);border-radius:10px;overflow:hidden;">
          <div style="display:grid;grid-template-columns:32px 1.4fr 1fr 1fr;gap:12px;padding:9px 12px;background:var(--paper-tint);border-bottom:1.5px solid var(--ink);font-family:var(--ui);font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:var(--ink-soft);">
            <div></div><div>Creator</div><div>Status</div><div>Action</div>
          </div>
          ${[
            {n:'Maya R.',s:'Awaiting Visit',c:'blue',a:'📅 Book',sel:true},
            {n:'Priya S.',s:'Awaiting Visit',c:'blue',a:'📅 Book'},
            {n:'Devi P.',s:'Booked',c:'green',a:'✓ View'},
            {n:'Kiran A.',s:'Content Pending',c:'amber',a:'↗ Draft'},
            {n:'Tanvi G.',s:'Done',c:'green',a:'View'},
          ].map(r => `
            <div style="display:grid;grid-template-columns:32px 1.4fr 1fr 1fr;gap:12px;padding:10px 12px;border-bottom:1px solid var(--rule-soft);background:${r.sel?'var(--orange-soft)':'white'};align-items:center;">
              <div style="width:28px;height:28px;border-radius:50%;background:var(--paper-tint);border:1px solid var(--ink);"></div>
              <div style="font-family:var(--ui);font-weight:700;font-size:11px;">${r.n}</div>
              <div><span class="pill ${r.c}" style="font-size:9px;">${r.s}</span></div>
              <div><button style="padding:5px 10px;background:white;border:1.5px solid var(--rule);border-radius:6px;font-family:var(--ui);font-weight:700;font-size:10px;">${r.a}</button></div>
            </div>`).join('')}
        </div>
      </div>
      <!-- side sheet -->
      <div style="width:340px;background:white;border:2px solid var(--ink);border-radius:12px;flex-shrink:0;overflow:hidden;box-shadow:-4px 0 0 var(--orange-soft);">
        <div style="padding:12px 14px;background:var(--ink);color:white;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-family:var(--ui);font-weight:800;font-size:13px;">Quick Reservation</div>
            <div style="font-family:var(--ui);font-size:10px;opacity:0.7;">Maya R. · Barter</div>
          </div>
          <div style="width:22px;height:22px;border:1.5px solid rgba(255,255,255,0.3);border-radius:6px;color:white;display:grid;place-items:center;font-size:11px;">✕</div>
        </div>
        <div style="padding:14px;display:flex;flex-direction:column;gap:10px;">
          <!-- date strip -->
          <div>
            <div style="font-family:var(--ui);font-size:9px;font-weight:800;color:var(--ink-faint);text-transform:uppercase;margin-bottom:4px;">Pick a date</div>
            <div style="display:flex;gap:4px;">
              ${['Wed 11','Thu 12','Fri 13','Sat 14','Sun 15'].map((d,i) => `
                <div style="flex:1;text-align:center;padding:6px 4px;border:1.5px solid ${i===3?'var(--orange)':'var(--rule)'};background:${i===3?'var(--orange-soft)':'white'};border-radius:7px;font-family:var(--ui);font-weight:${i===3?'800':'600'};font-size:10px;color:${i===3?'var(--orange)':'var(--ink)'};">${d}</div>`).join('')}
            </div>
          </div>
          <!-- time slots -->
          <div>
            <div style="font-family:var(--ui);font-size:9px;font-weight:800;color:var(--ink-faint);text-transform:uppercase;margin-bottom:4px;">Time</div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;">
              ${['7:00','7:30','8:00','8:30','9:00','9:30'].map((t,i) => `
                <div style="text-align:center;padding:6px;border:1.5px solid ${i===2?'var(--orange)':'var(--rule)'};background:${i===2?'var(--orange-soft)':'white'};border-radius:7px;font-family:var(--ui);font-weight:${i===2?'800':'600'};font-size:10px;color:${i===2?'var(--orange)':'var(--ink)'};">${t}</div>`).join('')}
            </div>
          </div>
          <!-- pax -->
          <div>
            <div style="font-family:var(--ui);font-size:9px;font-weight:800;color:var(--ink-faint);text-transform:uppercase;margin-bottom:4px;">Pax</div>
            <div style="display:flex;gap:6px;align-items:center;">
              <div style="flex:1;background:white;border:1.5px solid var(--rule);border-radius:8px;padding:8px;text-align:center;font-family:var(--ui);font-weight:700;font-size:11px;">2 guests · pre-filled</div>
            </div>
          </div>
          <!-- tag -->
          <div style="background:var(--orange-soft);border:1.5px solid var(--orange);border-radius:8px;padding:8px 10px;">
            <span class="pill orange" style="font-size:10px;">🎁 Marketing: Barter</span>
            <div style="font-family:var(--hand2);font-size:11px;color:var(--ink-soft);margin-top:4px;">Auto-tagged · seen by host</div>
          </div>
          <button style="margin-top:4px;width:100%;padding:11px;background:var(--orange);border:none;color:white;border-radius:9px;font-family:var(--ui);font-weight:800;font-size:12px;">✓ Confirm — Push to Floor</button>
          <div style="font-family:var(--hand2);font-size:10px;color:var(--ink-faint);text-align:center;">Pushes to FloorLivePage waitlist</div>
        </div>
      </div>
    </div>`;

  const v3 = `
    <div style="position:relative;">
      <div class="annot" style="top:90px;right:280px;width:140px;text-align:right;color:var(--orange);">side sheet —<br/>book without<br/>leaving the table
        <svg class="arrow" style="right:-30px;top:14px;" width="40" height="20"><path d="M0 4 Q20 14 38 12" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M30 16 L38 12 L33 6" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
      </div>
      ${osShell({
        crumb:{ active:'campaigns', path:'<strong>Marketing</strong> / Campaigns · Quick book' },
        content: v3Content,
        urlText:'app.treva.io/marketing/campaigns?reserve=maya-r'
      })}
    </div>
  `;

  page.innerHTML = `
    <header class="page-header">
      <div><h2 class="page-title"><span class="num">B3</span>Campaign &amp; Reservation Manager</h2></div>
      <div class="page-sub">The "magic integration" — turning an accepted collab into a booked table that flows to the FloorLivePage. Three takes on the booking flow.</div>
    </header>
    <div class="variations desktop">
      <div class="variation"><div class="var-label"><span class="var-num">01</span><span class="var-name">Table + Modal</span></div><div class="var-desc">Per brief — campaigns table with [Book Table] button per row; opens the native Treva booking modal w/ forced [Marketing: Barter] tag. Modal preview shown below.</div>${v1}</div>
      <div class="variation"><div class="var-label"><span class="var-num">02</span><span class="var-name">Split Pane + Timeline</span></div><div class="var-desc">List on left, detail+timeline on right. Better for marketing managers tracking the full lifecycle of each collab — reservation is one step in a clear journey.</div>${v2}</div>
      <div class="variation"><div class="var-label"><span class="var-num">03</span><span class="var-name">Inline Side Sheet</span></div><div class="var-desc">Books without losing context — date strip + time slots + pax in a side panel. Fastest to confirm; reservation is the most-frequent action so it deserves the least friction.</div>${v3}</div>
    </div>
  `;
})();
