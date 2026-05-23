/* ==========================================
   B-shared · Treva OS desktop shell helpers
   exposed on window: window.osShell, window.osNav
   ========================================== */
(function() {
  window.osNav = function(active) {
    const items = [
      { k:'dash', l:'Dashboard', s:'main' },
      { k:'floor', l:'Floor & Live', s:'main' },
      { k:'orders', l:'Orders', s:'main' },
      { k:'__sec', l:'Marketing' },
      { k:'inbound', l:'Inbound', s:'mkt' },
      { k:'discover', l:'Discover', s:'mkt' },
      { k:'campaigns', l:'Campaigns', s:'mkt' },
      { k:'__sec2', l:'Settings' },
      { k:'team', l:'Team', s:'set' },
      { k:'billing', l:'Billing', s:'set' },
    ];
    return `<aside class="os-sidebar">
      <div class="os-brand">
        <div class="os-brand-mark">T</div>
        <div class="os-brand-name">Treva OS</div>
      </div>
      ${items.map(it => {
        if (it.k.startsWith('__sec')) return `<div class="os-nav-section">${it.l}</div>`;
        return `<div class="os-nav-item ${active===it.k?'active':''}">
          <div class="ico"></div>${it.l}
          ${it.k==='inbound' && active!=='inbound' ? '<span style="margin-left:auto;background:var(--orange);color:white;font-size:9px;font-weight:800;padding:1px 5px;border-radius:8px;">12</span>' : ''}
        </div>`;
      }).join('')}
      <div style="margin-top:auto;display:flex;gap:8px;align-items:center;padding:10px 8px;border-top:1px solid rgba(255,255,255,0.08);">
        <div style="width:26px;height:26px;border-radius:50%;background:var(--paper-tint);"></div>
        <div style="font-size:11px;line-height:1.2;">
          <div style="font-weight:700;">Smokehouse</div>
          <div style="opacity:0.5;font-size:9px;">Indiranagar</div>
        </div>
      </div>
    </aside>`;
  };

  window.osShell = function({ crumb, pills, content, urlText }) {
    return `<div class="desktop-frame">
      <div class="desktop-chrome">
        <div class="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
        <div class="url">${urlText || 'app.treva.io/marketing/inbound'}</div>
      </div>
      <div class="os-shell">
        ${osNav(crumb.active)}
        <div class="os-main">
          <div class="os-topbar">
            <div class="crumbs">${crumb.path}</div>
            <div class="spacer"></div>
            ${pills || ''}
            <div style="width:28px;height:28px;border:1.5px solid var(--rule);border-radius:8px;"></div>
            <div style="width:28px;height:28px;border-radius:50%;background:var(--paper-tint);border:1.5px solid var(--rule);"></div>
          </div>
          <div class="os-content">${content}</div>
        </div>
      </div>
    </div>`;
  };
})();
