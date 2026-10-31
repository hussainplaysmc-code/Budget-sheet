import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import './style.css';
import { Preferences } from '@capacitor/preferences';
import { createIcons, Utensils, ShoppingBag, CarFront, House, ReceiptText, HeartPulse, Clapperboard, Wallet, Shapes, ChartNoAxesCombined, LayoutDashboard, List, Plus, ShieldCheck, ChevronRight, CircleCheck, CircleAlert, Settings2, ChevronDown, CalendarDays, Ellipsis, Sparkles, ArrowUpRight, ArrowDownLeft, MoveUpRight, Target, Search, ClipboardList, Heart, Lightbulb, FolderPlus, X } from 'lucide';
const icons = { Utensils, ShoppingBag, CarFront, House, ReceiptText, HeartPulse, Clapperboard, Wallet, Shapes, ChartNoAxesCombined, LayoutDashboard, List, Plus, ShieldCheck, ChevronRight, CircleCheck, CircleAlert, Settings2, ChevronDown, CalendarDays, Ellipsis, Sparkles, ArrowUpRight, ArrowDownLeft, MoveUpRight, Target, Search, ClipboardList, Heart, Lightbulb, FolderPlus, X };

const KEY = 'pocket-ledger-v1';
const CATEGORIES = ['Food & drink', 'Shopping', 'Transport', 'Home', 'Bills', 'Health', 'Entertainment', 'Salary', 'Other'];
const categoryInfo = {
  'Food & drink': ['utensils', 'peach'], Shopping: ['shopping-bag', 'lavender'], Transport: ['car-front', 'blue'], Home: ['house', 'green'], Bills: ['receipt-text', 'yellow'], Health: ['heart-pulse', 'pink'], Entertainment: ['clapperboard', 'lavender'], Salary: ['wallet', 'green'], Other: ['shapes', 'blue']
};
const $ = (s) => document.querySelector(s);
const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = (name, cls = '') => `<i data-lucide="${name}" class="${cls}"></i>`;
const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const monthDate = day => `${today().slice(0,7)}-${String(Math.min(day, new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate())).padStart(2,'0')}`;
const initialState = () => {
  const id = uid();
  return { version: 1, activeId: id, currency: 'USD', lists: [{ id, name: 'Example budget', budget: 2500, entries: [
    { id: uid(), name: 'Monthly paycheck', category: 'Salary', date: monthDate(1), type: 'income', amount: 4200 },
    { id: uid(), name: 'Apartment rent', category: 'Home', date: monthDate(2), type: 'expense', amount: 1200 },
    { id: uid(), name: 'Weekly groceries', category: 'Food & drink', date: monthDate(8), type: 'expense', amount: 86.40 },
    { id: uid(), name: 'Coffee & catch-up', category: 'Food & drink', date: monthDate(12), type: 'expense', amount: 14.50 },
    { id: uid(), name: 'Internet bill', category: 'Bills', date: monthDate(15), type: 'expense', amount: 59.99 },
    { id: uid(), name: 'New headphones', category: 'Shopping', date: monthDate(18), type: 'expense', amount: 89 }
  ] }] };
};
let state;
let filter = 'all';
let query = '';
let modal = null;
let saveQueue = Promise.resolve();
let saveError = false;
const app = $('#app');
const money = n => new Intl.NumberFormat(undefined, { style: 'currency', currency: state.currency || 'USD', maximumFractionDigits: 2 }).format(n || 0);
const list = () => state.lists.find(l => l.id === state.activeId) || state.lists[0];
const total = (entries, type) => entries.filter(e => e.type === type).reduce((sum, e) => sum + Number(e.amount || 0), 0);
const formatDate = value => { const [y,m,d] = value.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); };
const currentMonth = () => 'All time';
function persist() {
  const snapshot = JSON.stringify(state);
  saveQueue = saveQueue.catch(() => {}).then(() => Preferences.set({ key: KEY, value: snapshot })).then(() => { if (saveError) { saveError = false; render(); } }).catch(() => { saveError = true; render(); });
}
function categoryIcon(category) { const [name, color] = categoryInfo[category] || categoryInfo.Other; return `<span class="category-icon ${color}">${icon(name)}</span>`; }
function render() {
  const active = list();
  const income = total(active.entries, 'income');
  const spent = total(active.entries, 'expense');
  const budget = Number(active.budget) || 0;
  const percent = budget ? Math.round(spent / budget * 100) : 0;
  const filtered = [...active.entries].filter(e => (filter === 'all' || e.type === filter) && `${e.name} ${e.category}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => b.date.localeCompare(a.date));
  const cats = Object.entries(active.entries.filter(e => e.type === 'expense').reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + Number(e.amount); return acc; }, {})).sort((a,b) => b[1]-a[1]);
  app.innerHTML = `
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><span class="brand-mark">${icon('chart-no-axes-combined')}</span><span>pocket<span class="brand-light">ledger</span><small>YOUR MONEY, MADE SIMPLE</small></span></div>
      <div class="side-label">WORKSPACE</div>
      <button class="side-link active" data-action="overview">${icon('layout-dashboard')}<span>Overview</span><span class="side-dot"></span></button>
      <button class="side-link" data-action="scroll-entries">${icon('list')}<span>Transactions</span></button>
      <div class="side-label lists-label">YOUR LISTS <button class="icon-button" data-action="new-list" aria-label="Create list">${icon('plus')}</button></div>
      <div class="side-lists">${state.lists.map(l => `<button class="side-list ${l.id === active.id ? 'selected' : ''}" data-action="select-list" data-id="${esc(l.id)}"><span class="list-hash">#</span><span>${esc(l.name)}</span></button>`).join('')}</div>
      <button class="new-list-link" data-action="new-list">${icon('plus')} Create a list</button>
      <div class="side-bottom"><div class="privacy-icon">${icon('shield-check')}</div><div><strong>Just for you</strong><span>Your data stays on this device.</span></div></div>
    </aside>
    <main class="main">
      <header class="topbar"><div class="breadcrumb"><span>My workspace</span>${icon('chevron-right')}<strong>Overview</strong></div><div class="top-actions"><span class="saved">${icon(saveError ? 'circle-alert' : 'circle-check')} ${saveError ? 'Could not save' : 'Saved on device'}</span><button class="avatar" data-action="settings" aria-label="Settings">${icon('settings-2')}</button></div></header>
      <div class="content">
        <div class="mobile-brand"><div class="brand"><span class="brand-mark">${icon('chart-no-axes-combined')}</span><span>pocket<span class="brand-light">ledger</span></span></div><button class="avatar" data-action="settings" aria-label="Settings">${icon('settings-2')}</button></div>
        <div class="heading-row"><div><div class="eyebrow"><span class="eyebrow-dot"></span> YOUR FINANCIAL SNAPSHOT</div><h1>Your money, in focus<span>.</span></h1><p>Every little detail, all in one place.</p></div><button class="primary-button desktop-add" data-action="add-entry">${icon('plus')} Add transaction</button></div>
        <div class="list-heading"><div><span class="section-kicker">CURRENT LIST</span><div class="list-select-wrap"><select id="list-select" aria-label="Choose budget list">${state.lists.map(l => `<option value="${esc(l.id)}" ${l.id === active.id ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}</select>${icon('chevron-down')}</div></div><div class="list-tools"><span class="date-pill">${icon('calendar-days')} ${currentMonth()}</span><button class="outline-icon" data-action="list-settings" aria-label="Edit current list">${icon('ellipsis')}</button></div></div>
        ${active.name === 'Example budget' ? '<div class="demo-note">This is an example list to get you started. Create your own list or edit these transactions.</div>' : ''}
        <section class="summary-grid" aria-label="Budget summary">
          <div class="balance-card"><div class="balance-top"><span>NET BALANCE</span><span class="balance-symbol">${icon('sparkles')}</span></div><div class="balance-value">${money(income-spent)}</div><p>Income minus expenses</p><div class="balance-bottom"><span><span class="tiny-dot"></span> Your overall balance</span>${icon('arrow-up-right')}</div><div class="card-orb orb-one"></div><div class="card-orb orb-two"></div></div>
          <div class="metric-card"><div class="metric-head"><span class="metric-icon income-icon">${icon('arrow-down-left')}</span>${icon('move-up-right','metric-corner')}</div><span class="metric-label">Total income</span><strong>${money(income)}</strong><span class="metric-caption">Money coming in</span></div>
          <div class="metric-card"><div class="metric-head"><span class="metric-icon expense-icon">${icon('arrow-up-right')}</span>${icon('move-up-right','metric-corner')}</div><span class="metric-label">Total expenses</span><strong>${money(spent)}</strong><span class="metric-caption">Money going out</span></div>
        </section>
        <section class="budget-strip"><div class="budget-copy"><span class="budget-icon">${icon('target')}</span><div><strong>Budget check-in</strong><p>${budget ? `${money(spent)} of ${money(budget)} spent` : 'Set a budget to track your spending'}</p></div></div><div class="budget-progress"><div class="progress-label"><span>${budget ? `${percent}% used` : 'No budget set'}</span><button data-action="edit-budget">${budget ? 'Edit budget' : 'Set budget'}</button></div><div class="progress-track"><div style="width:${Math.min(percent,100)}%" class="${percent > 100 ? 'over' : ''}"></div></div></div></section>
        <div class="lower-grid"><section class="transactions panel" id="transactions"><div class="panel-heading"><div><div class="section-kicker">THE DETAILS</div><h2>Transactions <span class="count">${active.entries.length}</span></h2><p>A closer look at your money moves.</p></div><button class="small-add" data-action="add-entry">${icon('plus')} <span>Add new</span></button></div>
          <div class="table-controls"><div class="tabs" role="group" aria-label="Filter transactions">${[['all','All'],['expense','Expenses'],['income','Income']].map(([id,label]) => `<button class="tab ${filter===id?'selected':''}" data-action="filter" data-filter="${id}">${label}</button>`).join('')}</div><label class="search">${icon('search')}<input id="search" placeholder="Search" value="${esc(query)}" aria-label="Search transactions"></label></div>
          <div class="table-wrap"><table><thead><tr><th>NAME</th><th>CATEGORY</th><th>DATE</th><th class="amount-head">AMOUNT</th><th></th></tr></thead><tbody>${filtered.map(e => `<tr class="entry-row" data-action="edit-entry" data-id="${esc(e.id)}" tabindex="0" role="button" aria-label="Edit ${esc(e.name)}"><td><div class="entry-name">${categoryIcon(e.category)}<div><strong>${esc(e.name)}</strong><span class="mobile-entry-meta">${esc(e.category)} · ${formatDate(e.date)}</span></div></div></td><td><span class="category-tag">${esc(e.category)}</span></td><td class="date-cell">${formatDate(e.date)}</td><td class="amount ${e.type}">${e.type === 'income' ? '+' : '−'}${money(Number(e.amount))}</td><td class="row-arrow">${icon('chevron-right')}</td></tr>`).join('')}</tbody></table>${!filtered.length ? `<div class="empty-state">${icon('clipboard-list')}<strong>${active.entries.length ? 'No transactions found' : 'A fresh start'}</strong><span>${active.entries.length ? 'Try a different search or filter.' : 'Add your first transaction to see it here.'}</span>${!active.entries.length ? '<button data-action="add-entry">Add a transaction</button>' : ''}</div>` : ''}</div>
          <div class="table-footer"><span>Showing ${filtered.length} of ${active.entries.length} transactions</span><span>Made for the little details ${icon('heart')}</span></div></section>
          <aside class="insights panel"><div class="section-kicker">A LITTLE INSIGHT</div><h2>Spending breakdown</h2><p>Where your money goes.</p><div class="insight-total"><span>Total spent</span><strong>${money(spent)}</strong></div><div class="stacked-bar">${cats.length ? [...cats.slice(0,4), ...(cats.length > 4 ? [['Other categories', cats.slice(4).reduce((sum, c) => sum + c[1], 0)]] : [])].map(([cat,n],i) => `<div class="bar-${i}" style="width:${n/spent*100}%" title="${esc(cat)}"></div>`).join('') : '<div class="bar-empty" style="width:100%"></div>'}</div><div class="category-list">${cats.length ? cats.slice(0,4).map(([cat,n],i) => `<div class="category-line"><span class="legend-dot bar-${i%5}"></span><span>${esc(cat)}</span><strong>${money(n)}</strong></div>`).join('') : '<p class="no-insight">Your expense categories will appear here.</p>'}${cats.length > 4 ? `<div class="category-line"><span class="legend-dot bar-4"></span><span>Other categories</span><strong>${money(cats.slice(4).reduce((sum, c) => sum+c[1],0))}</strong></div>` : ''}</div><div class="insight-note">${icon('lightbulb')} <span>Small steps add up to big things.</span></div></aside></div>
        <footer><span>Made for a more mindful you <span class="footer-heart">♥</span></span><span>YOUR MONEY. YOUR WAY.</span></footer>
      </div>
    </main>
    <nav class="mobile-nav"><button class="active" data-action="overview">${icon('layout-dashboard')}<span>Overview</span></button><button data-action="scroll-entries">${icon('list')}<span>Transactions</span></button><button class="nav-add" data-action="add-entry" aria-label="Add transaction">${icon('plus')}</button><button data-action="new-list">${icon('folder-plus')}<span>New list</span></button><button data-action="settings">${icon('settings-2')}<span>Settings</span></button></nav>
  </div><div id="modal-root">${modal ? modalMarkup() : ''}</div>`;
  createIcons({ icons });
}
function modalMarkup() {
  const active = list();
  if (modal.kind === 'entry') {
    const e = modal.entry || {name:'', amount:'', type:'expense', category:'Food & drink', date:today()};
    return `<div class="modal-backdrop" data-action="backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-header"><div><span class="section-kicker">THE LITTLE DETAILS</span><h2 id="modal-title">${modal.entry ? 'Edit transaction' : 'Add a transaction'}</h2><p>Keep track of every money move.</p></div><button class="close-button" data-action="close-modal" aria-label="Close">${icon('x')}</button></div><form id="entry-form"><label>Transaction name<input name="name" required maxlength="80" value="${esc(e.name)}" placeholder="e.g. Weekly groceries" autocomplete="off"></label><div class="form-row"><label>Amount<input name="amount" type="number" min="0.01" max="999999999" step="0.01" required value="${esc(e.amount)}" placeholder="0.00" inputmode="decimal"></label><label>Type<select name="type"><option value="expense" ${e.type==='expense'?'selected':''}>Expense</option><option value="income" ${e.type==='income'?'selected':''}>Income</option></select></label></div><div class="form-row"><label>Category<select name="category">${CATEGORIES.map(c => `<option ${e.category===c?'selected':''}>${esc(c)}</option>`).join('')}</select></label><label>Date<input name="date" type="date" required value="${esc(e.date)}"></label></div><div class="modal-actions">${modal.entry ? '<button type="button" class="delete-button" data-action="delete-entry">Delete</button>' : ''}<button type="button" class="cancel-button" data-action="close-modal">Cancel</button><button class="primary-button" type="submit">${modal.entry ? 'Save changes' : 'Add transaction'}</button></div></form></section></div>`;
  }
  if (modal.kind === 'list') return `<div class="modal-backdrop" data-action="backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-header"><div><span class="section-kicker">YOUR WORKSPACE</span><h2 id="modal-title">${modal.edit ? 'Edit list' : 'Create a list'}</h2><p>Give your money a place to land.</p></div><button class="close-button" data-action="close-modal" aria-label="Close">${icon('x')}</button></div><form id="list-form"><label>List name<input name="name" required maxlength="60" value="${modal.edit ? esc(active.name) : ''}" placeholder="e.g. Monthly budget"></label><label>Spending budget <span class="optional">(optional)</span><input name="budget" type="number" min="0" max="999999999" step="0.01" value="${modal.edit ? active.budget || '' : ''}" placeholder="0.00" inputmode="decimal"></label><div class="modal-actions">${modal.edit ? '<button type="button" class="delete-button" data-action="delete-list">Delete list</button>' : ''}<button type="button" class="cancel-button" data-action="close-modal">Cancel</button><button class="primary-button" type="submit">${modal.edit ? 'Save changes' : 'Create list'}</button></div></form></section></div>`;
  if (modal.kind === 'settings') return `<div class="modal-backdrop" data-action="backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-header"><div><span class="section-kicker">MAKE IT YOURS</span><h2 id="modal-title">Settings</h2><p>A few things to make this feel like home.</p></div><button class="close-button" data-action="close-modal" aria-label="Close">${icon('x')}</button></div><form id="settings-form"><label>Currency<select name="currency">${[['USD','USD — US Dollar'],['PKR','PKR — Pakistani Rupee'],['EUR','EUR — Euro'],['GBP','GBP — British Pound'],['INR','INR — Indian Rupee'],['CAD','CAD — Canadian Dollar'],['AUD','AUD — Australian Dollar']].map(([code,label]) => `<option value="${code}" ${state.currency===code?'selected':''}>${label}</option>`).join('')}</select></label><div class="settings-note">${icon('shield-check')}<span><strong>Private by design</strong><br>Your lists are stored on this device. Uninstalling the app or clearing app data will remove them.</span></div><div class="modal-actions"><button type="button" class="cancel-button" data-action="close-modal">Cancel</button><button class="primary-button" type="submit">Save settings</button></div></form></section></div>`;
}
app.addEventListener('click', event => {
  const target = event.target.closest('[data-action]'); if (!target) return;
  const action = target.dataset.action;
  if (action === 'backdrop' && event.target !== target) return;
  if (action === 'close-modal' || action === 'backdrop') modal = null;
  if (action === 'add-entry') modal = {kind:'entry'};
  if (action === 'edit-entry') { const entry = list().entries.find(e => e.id === target.dataset.id); if (entry) modal = {kind:'entry', entry}; }
  if (action === 'new-list') modal = {kind:'list',edit:false};
  if (action === 'list-settings' || action === 'edit-budget') modal = {kind:'list',edit:true};
  if (action === 'settings') modal = {kind:'settings'};
  if (action === 'delete-entry' && confirm('Delete this transaction?')) { list().entries = list().entries.filter(e => e.id !== modal.entry.id); modal = null; persist(); }
  if (action === 'delete-list') { if (state.lists.length === 1) { alert('Keep at least one list. Create another list before deleting this one.'); return; } if (confirm(`Delete “${list().name}” and all its transactions? This cannot be undone.`)) { state.lists = state.lists.filter(l => l.id !== state.activeId); state.activeId = state.lists[0].id; modal = null; filter='all'; query=''; persist(); } }
  if (action === 'select-list') { state.activeId = target.dataset.id; filter='all'; query=''; persist(); }
  if (action === 'filter') filter = target.dataset.filter;
  if (action === 'overview') { window.scrollTo({top:0, behavior:'smooth'}); return; }
  if (action === 'scroll-entries') { $('#transactions')?.scrollIntoView({behavior:'smooth'}); return; }
  render();
  if (modal && ['add-entry','edit-entry','new-list','list-settings','edit-budget','settings'].includes(action)) setTimeout(() => $('.modal input, .modal select')?.focus(), 50);
});
app.addEventListener('keydown', e => { if (e.key === 'Escape' && modal) { modal = null; render(); } else if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.entry-row')) { e.preventDefault(); e.target.click(); } });
app.addEventListener('change', e => { if (e.target.id === 'list-select') { state.activeId = e.target.value; filter='all'; query=''; persist(); render(); } });
app.addEventListener('input', e => { if (e.target.id === 'search') { const pos = e.target.selectionStart; query = e.target.value; render(); const input = $('#search'); input.focus(); input.setSelectionRange(pos,pos); } });
app.addEventListener('submit', e => {
  e.preventDefault(); const data = new FormData(e.target);
  if (e.target.id === 'entry-form') { const name = String(data.get('name')).trim(); const amount = Number(data.get('amount')); if (!name || !Number.isFinite(amount) || amount <= 0) return; const entry = {id: modal.entry?.id || uid(), name, amount, type:data.get('type'), category:data.get('category'), date:data.get('date')}; if (modal.entry) { const index = list().entries.findIndex(x => x.id === entry.id); if (index >= 0) list().entries[index] = entry; } else list().entries.push(entry); }
  if (e.target.id === 'list-form') { const name = String(data.get('name')).trim(); if (!name) return; const budget = Number(data.get('budget')) || 0; if (modal.edit) { list().name = name; list().budget = budget; } else { const id = uid(); state.lists.push({id,name,budget,entries:[]}); state.activeId=id; filter='all'; query=''; } }
  if (e.target.id === 'settings-form') state.currency = data.get('currency');
  modal = null; persist(); render();
});
async function init() { try { const {value} = await Preferences.get({key:KEY}); const parsed = value ? JSON.parse(value) : null; state = parsed && Array.isArray(parsed.lists) && parsed.lists.length ? parsed : initialState(); if (!parsed) persist(); } catch (error) { console.error('Could not load saved data', error); state = initialState(); saveError = true; } render(); }
init();
