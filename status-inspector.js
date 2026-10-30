// A body-level panel keeps status explanations clear of the clipped battle scene.
let anchor, panel, pinned = false, closeTimer;
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function closeStatusInspector(restoreFocus = false) {
  clearTimeout(closeTimer);
  const previous = anchor;
  if (previous) {
    previous.setAttribute('aria-expanded', 'false');
    previous.removeAttribute('aria-describedby');
  }
  panel?.remove(); panel = null; anchor = null; pinned = false;
  // The trigger remains focused after a mouse click; Escape does not reopen it.
  if (restoreFocus && previous?.isConnected && document.activeElement !== previous) {
    previous.focus({preventScroll:true});
    closeStatusInspector();
  }
}

function placePanel() {
  if (!panel || !anchor?.isConnected) return closeStatusInspector();
  const width = document.documentElement.clientWidth, height = document.documentElement.clientHeight;
  panel.style.maxWidth = `${Math.max(1, width - 24)}px`;
  const rect = anchor.getBoundingClientRect(), box = panel.getBoundingClientRect();
  const left = Math.max(12, Math.min(rect.left, width - box.width - 12));
  const below = rect.bottom + 10;
  const top = below + box.height <= height - 12 ? below : Math.max(12, rect.top - box.height - 10);
  panel.style.left = `${left}px`; panel.style.top = `${top}px`;
}

function showStatus(button, pin = false) {
  clearTimeout(closeTimer);
  if (pinned && !pin) return;
  if (anchor === button && panel && !pin) return;
  closeStatusInspector(); anchor = button; pinned = pin;
  const data = button.dataset;
  panel = document.createElement('div');
  panel.id = 'status-inspector';
  panel.className = `status-inspector ${data.statusKind === 'บัฟ' ? 'is-buff' : 'is-debuff'}`;
  panel.setAttribute('role', pin ? 'dialog' : 'tooltip');
  panel.setAttribute('aria-labelledby', 'status-inspector-title');
  if (pin) panel.setAttribute('aria-modal', 'false');
  panel.innerHTML = `<div class="status-inspector-top"><span>${escapeHtml(data.statusKind)} · ${escapeHtml(data.statusOwner)}</span>${pin ? '<button type="button" class="status-inspector-close" aria-label="ปิดรายละเอียดสถานะ">×</button>' : ''}</div><h3 id="status-inspector-title">${escapeHtml(data.statusName)}</h3><p>${escapeHtml(data.statusEffect)}</p><div class="status-inspector-duration">◷ เหลือ ${escapeHtml(data.statusDuration)}</div><small>${escapeHtml(data.statusExpiry)}</small>`;
  document.body.append(panel);
  button.setAttribute('aria-expanded', String(pin));
  if (!pin) button.setAttribute('aria-describedby', panel.id);
  panel.querySelector('button')?.addEventListener('click', () => closeStatusInspector(true));
  panel.addEventListener('pointerenter', () => clearTimeout(closeTimer));
  panel.addEventListener('pointerleave', scheduleClose);
  placePanel();
}

function scheduleClose() {
  if (!pinned && document.activeElement !== anchor) closeTimer = setTimeout(() => closeStatusInspector(), 160);
}

document.addEventListener('pointerover', event => {
  const button = event.target.closest('[data-status-name]');
  if (button && event.pointerType !== 'touch') showStatus(button);
});
document.addEventListener('pointerout', event => {
  if (event.target.closest('[data-status-name]') && !event.relatedTarget?.closest('[data-status-name], .status-inspector')) scheduleClose();
});
document.addEventListener('focusin', event => {
  const button = event.target.closest('[data-status-name]');
  if (button) showStatus(button);
  else if (!pinned && !event.target.closest('.status-inspector')) closeStatusInspector();
});
document.addEventListener('click', event => {
  const button = event.target.closest('[data-status-name]');
  if (button) {
    if (anchor === button && pinned) closeStatusInspector();
    else showStatus(button, true);
  } else if (!event.target.closest('.status-inspector')) closeStatusInspector();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && panel) { event.preventDefault(); closeStatusInspector(true); }
});
window.addEventListener('resize', () => closeStatusInspector());
window.addEventListener('scroll', event => {
  if (!panel || event.target.closest?.('.status-inspector')) return;
  const rect = anchor?.getBoundingClientRect();
  if (!rect || rect.bottom < 0 || rect.top > document.documentElement.clientHeight) closeStatusInspector();
  else placePanel();
}, true);
