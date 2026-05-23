/* ==========================================
   States · Button Lifecycle / State Matrix
   4 buttons × 4 states each
   ========================================== */
(function() {
  const page = document.getElementById('page-states');

  const cell = (num, label, demo, note) => `
    <div class="state-cell">
      <div style="display:flex;align-items:baseline;gap:8px;">
        <div class="state-num">${num}</div>
        <div class="state-label">${label}</div>
      </div>
      <div class="state-demo">${demo}</div>
      <div class="state-note">${note}</div>
    </div>`;

  const matrixRow = (title, sub, cells) => `
    <div class="matrix-row">
      <div class="matrix-header">
        <div class="ttl">${title}</div>
        <div class="sub">${sub}</div>
      </div>
      <div class="matrix-body">${cells}</div>
    </div>`;

  // ---- Pitch (Heart) Button ----
  const heartBtn = (variant) => {
    if (variant === 'default') return `<button style="width:54px;height:54px;border-radius:50%;background:white;border:2.5px solid var(--green);color:var(--green);display:grid;place-items:center;box-shadow:3px 4px 0 rgba(22,163,74,0.18);">
      <svg width="22" height="22" viewBox="0 0 18 18" fill="currentColor"><path d="M9 16s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0116 6c0 5.5-7 10-7 10z"/></svg>
    </button>`;
    if (variant === 'pressed') return `<button style="width:54px;height:54px;border-radius:50%;background:var(--green-soft);border:2.5px solid var(--green);color:var(--green);display:grid;place-items:center;transform:scale(0.92);box-shadow:1px 2px 0 rgba(22,163,74,0.18);">
      <svg width="22" height="22" viewBox="0 0 18 18" fill="currentColor"><path d="M9 16s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0116 6c0 5.5-7 10-7 10z"/></svg>
    </button>`;
    if (variant === 'loading') return `<button style="width:54px;height:54px;border-radius:50%;background:white;border:2.5px solid var(--green);color:var(--green);display:grid;place-items:center;">
      <svg width="22" height="22" viewBox="0 0 24 24" style="animation:spin 1s linear infinite;"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="14 14" stroke-linecap="round"/></svg>
    </button>`;
    if (variant === 'success') return `<div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;">
      <div style="background:var(--ink);color:white;font-family:var(--ui);font-weight:800;font-size:11px;padding:5px 10px;border-radius:999px;white-space:nowrap;">✓ Pitch Sent!</div>
      <div style="font-family:var(--hand);font-size:18px;color:var(--ink-faint);">card flies →</div>
    </div>`;
  };

  const pitchRow = matrixRow('① Mobile · Pitch (Heart)', 'Swipe-right action — sends pitch + deducts 1 credit', `
    ${cell('01','Default', heartBtn('default'),'White circle · green heart icon · drop shadow.')}
    ${cell('02','Active / Pressed', heartBtn('pressed'),'Scales down to 95%. Subtle haptic feedback.')}
    ${cell('03','Processing', heartBtn('loading'),'Spinner replaces icon. <strong>−1 pitch credit</strong> from quota.')}
    ${cell('04','Success', heartBtn('success'),'Card animates off-screen right. Toast at top: "Pitch Sent!"')}
  `);

  // ---- Accept Collab Button ----
  const acceptBtn = (v) => {
    if (v==='default') return `<button style="padding:10px 18px;background:var(--orange);border:1.5px solid var(--orange);color:white;border-radius:9px;font-family:var(--ui);font-weight:800;font-size:13px;">Accept Collab</button>`;
    if (v==='hover') return `<button style="padding:10px 18px;background:#c2410c;border:1.5px solid #9a3412;color:white;border-radius:9px;font-family:var(--ui);font-weight:800;font-size:13px;cursor:pointer;box-shadow:2px 3px 0 rgba(154,52,18,0.25);">Accept Collab</button>`;
    if (v==='loading') return `<button style="padding:10px 18px;background:#c2410c;border:1.5px solid #9a3412;color:white;border-radius:9px;font-family:var(--ui);font-weight:800;font-size:13px;display:flex;align-items:center;gap:7px;">
      <svg width="14" height="14" viewBox="0 0 24 24" style="animation:spin 1s linear infinite;"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="14 14" stroke-linecap="round"/></svg>
      Approving…
    </button>`;
    if (v==='success') return `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
      <div style="font-family:var(--hand);font-size:18px;color:var(--ink-faint);text-align:center;line-height:1.1;">card removed →<br/>moved to Active</div>
      <div style="background:var(--green-soft);border:1.5px solid var(--green);border-radius:7px;padding:5px 10px;font-family:var(--ui);font-size:10px;font-weight:800;color:var(--green);">+ webhook fired</div>
    </div>`;
  };

  const acceptRow = matrixRow('② Desktop · Accept Collab', 'Brand approves an inbound creator pitch', `
    ${cell('01','Default', acceptBtn('default'),'Solid orange · white text. Primary CTA.')}
    ${cell('02','Hover', acceptBtn('hover'),'Background darkens. Cursor → pointer.')}
    ${cell('03','Click / Loading', acceptBtn('loading'),'Spinner inline · text "Approving…"')}
    ${cell('04','Post-Click', acceptBtn('success'),'Card removed from Inbound · added to Active · webhook → Creator app.')}
  `);

  // ---- Book Table → Reservation ----
  const bookBtn = (v) => {
    if (v==='default') return `<button style="padding:9px 14px;background:white;border:1.5px solid var(--blue);color:var(--blue);border-radius:8px;font-family:var(--ui);font-weight:800;font-size:12px;">📅 Book Table</button>`;
    if (v==='hover') return `<button style="padding:9px 14px;background:var(--blue-soft);border:1.5px solid var(--blue);color:var(--blue);border-radius:8px;font-family:var(--ui);font-weight:800;font-size:12px;cursor:pointer;">📅 Book Table</button>`;
    if (v==='click') return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
      <div style="background:white;border:2px solid var(--ink);border-radius:8px;padding:6px;width:120px;font-family:var(--ui);font-size:9px;text-align:center;font-weight:700;box-shadow:2px 3px 0 rgba(0,0,0,0.1);">
        New Reservation
        <div style="height:4px;background:var(--rule);border-radius:2px;margin-top:4px;"></div>
        <div style="height:4px;background:var(--rule);border-radius:2px;margin-top:3px;width:60%;margin-left:auto;margin-right:auto;"></div>
      </div>
      <div style="font-family:var(--hand);font-size:13px;color:var(--ink-faint);">modal opens</div>
    </div>`;
    if (v==='success') return `<button style="padding:9px 14px;background:var(--green);border:1.5px solid var(--green);color:white;border-radius:8px;font-family:var(--ui);font-weight:800;font-size:12px;display:flex;align-items:center;gap:5px;">
      ✓ Table Booked
      <span style="opacity:0.8;font-weight:600;">(View Floor)</span>
    </button>`;
  };

  const bookRow = matrixRow('③ Desktop · Convert to Reservation', 'The "magic integration" — collab → table booking', `
    ${cell('01','Default', bookBtn('default'),'Outlined blue · "Book Table"')}
    ${cell('02','Hover', bookBtn('hover'),'Fills with light blue.')}
    ${cell('03','Click', bookBtn('click'),'Opens native Treva OS booking modal.')}
    ${cell('04','Success', bookBtn('success'),'Solid green · "Table Booked (View Floor)" · ✓ icon · routes to Floor &amp; Live module on click.')}
  `);

  // ---- Connect Instagram ----
  const igBtn = (v) => {
    if (v==='default') return `<button style="padding:9px 14px;background:white;border:1.5px solid var(--ink);color:var(--ink);border-radius:9px;font-family:var(--ui);font-weight:700;font-size:12px;display:flex;align-items:center;gap:6px;">
      <span style="display:inline-block;width:14px;height:14px;background:linear-gradient(135deg,#E1306C,#F77737);border-radius:4px;"></span>
      Connect Instagram
    </button>`;
    if (v==='tap') return `<button style="padding:9px 14px;background:var(--paper-tint);border:1.5px solid var(--ink);color:var(--ink);border-radius:9px;font-family:var(--ui);font-weight:700;font-size:12px;display:flex;align-items:center;gap:6px;opacity:0.85;">
      <span style="display:inline-block;width:14px;height:14px;background:linear-gradient(135deg,#E1306C,#F77737);border-radius:4px;"></span>
      Connect Instagram
    </button>`;
    if (v==='loading') return `<div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
      <button style="padding:9px 14px;background:white;border:1.5px solid var(--ink);color:var(--ink-faint);border-radius:9px;font-family:var(--ui);font-weight:700;font-size:12px;display:flex;align-items:center;gap:6px;">
        <svg width="12" height="12" viewBox="0 0 24 24" style="animation:spin 1s linear infinite;"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="14 14" stroke-linecap="round"/></svg>
        Authenticating…
      </button>
      <div style="display:flex;gap:4px;">
        <div style="width:34px;height:14px;background:var(--rule-soft);border-radius:4px;animation:shimmer 1.4s ease-in-out infinite;"></div>
        <div style="width:34px;height:14px;background:var(--rule-soft);border-radius:4px;animation:shimmer 1.4s ease-in-out infinite;animation-delay:0.2s;"></div>
      </div>
    </div>`;
    if (v==='success') return `<div style="background:linear-gradient(135deg,#E1306C,#F77737);color:white;padding:10px 14px;border-radius:9px;display:flex;align-items:center;gap:8px;">
      <span style="font-family:var(--ui);font-weight:800;font-size:11px;">@foodie_blr</span>
      <span style="background:rgba(255,255,255,0.25);width:18px;height:18px;border-radius:50%;display:grid;place-items:center;font-size:10px;font-weight:800;">✓</span>
      <span style="font-family:var(--ui);font-weight:700;font-size:10px;opacity:0.9;">Verified</span>
    </div>`;
  };

  const igRow = matrixRow('④ Mobile · Connect Instagram (Social Sync)', 'Auto-syncs follower count via API', `
    ${cell('01','Default', igBtn('default'),'IG icon + "Connect" text · grey outline.')}
    ${cell('02','Hover / Tap', igBtn('tap'),'Slight opacity / tint change.')}
    ${cell('03','Loading', igBtn('loading'),'"Authenticating…" + skeleton loader on stats below.')}
    ${cell('04','Success', igBtn('success'),'Locked field with synced handle + green ✓ "Verified" badge. Non-editable.')}
  `);

  page.innerHTML = `
    <style>
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes shimmer {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }
    </style>
    <header class="page-header">
      <div><h2 class="page-title"><span class="num">⚙</span>Element &amp; Button Lifecycle</h2></div>
      <div class="page-sub">Every interactive element accounts for <strong>default → interim → success</strong>. Four critical buttons mapped across all states.</div>
    </header>
    <div class="matrix">
      ${pitchRow}
      ${acceptRow}
      ${bookRow}
      ${igRow}
    </div>

    <div class="legend">
      <div>
        <h4>Color Roles</h4>
        <p>Orange = primary CTA / brand · Blue = secondary / external action · Green = success / match · Red = destructive / pass · Amber = pending.</p>
        <div class="swatch-row">
          <span class="pill orange" style="font-size:9px;">Orange</span>
          <span class="pill blue" style="font-size:9px;">Blue</span>
          <span class="pill green" style="font-size:9px;">Green</span>
          <span class="pill red" style="font-size:9px;">Red</span>
          <span class="pill amber" style="font-size:9px;">Amber</span>
        </div>
      </div>
      <div>
        <h4>Type</h4>
        <p>Plus Jakarta Sans for UI · weights 600/700/800 for hierarchy. Kalam &amp; Caveat for sketch annotations only — they get replaced by real type at hi-fi.</p>
      </div>
      <div>
        <h4>Wireframe Conventions</h4>
        <p>Orange handwriting = annotation · Diagonal-cross fill = image placeholder · Dashed border = optional / deferred · Solid black box = present in spec.</p>
      </div>
      <div>
        <h4>Next Steps</h4>
        <p>1 · Pick variation per screen · 2 · Real photography for cards · 3 · Treva OS sidebar exact match · 4 · Wire pitch-credit accounting · 5 · FloorLivePage handoff spec.</p>
      </div>
    </div>
  `;
})();
