const STORAGE_KEY = 'cc2a_interventions_v1';
const STATUSES = ['Tous','À faire','Confirmé','En cours','Terminé','À facturer','Facturé','Payé','Annulé'];
const TYPES = ['Dépannage plomberie','Dépannage chauffage','Installation plomberie','Installation chauffage','Recherche de fuite','Intervention urgente','RDV devis'];
const CATEGORIES = ['Client perso','ERILIA','Syndic','Assurance','Agence','Autre'];

const demo = [
  {id:crypto.randomUUID(),date:'2026-04-29',start:'08:30',end:'10:30',client:'M. Rossi',category:'ERILIA',phone:'0600000001',email:'rossi@mail.com',address:'Ajaccio Centre',building:'A',floor:'2',door:'5',type:'Remplacement chauffe-eau',description:'Remplacement chauffe-eau 200 L',materials:'Chauffe-eau 200L + raccords',notes:'Accès cave',amount:'890',status:'Confirmé',urgent:false},
  {id:crypto.randomUUID(),date:'2026-04-29',start:'11:00',end:'12:00',client:'Mme Martin',category:'Syndic',phone:'0600000002',email:'martin@mail.com',address:'Les Salines, Ajaccio',building:'B',floor:'1',door:'2',type:'Recherche de fuite',description:'Fuite salle de bain',materials:'Détecteur humidité',notes:'Syndic informé',amount:'180',status:'En cours',urgent:true},
  {id:crypto.randomUUID(),date:'2026-04-30',start:'09:00',end:'10:30',client:'M. Leone',category:'Client perso',phone:'0600000003',email:'leone@mail.com',address:'Route des Sanguinaires',building:'-',floor:'RDC',door:'-',type:'Remplacement WC',description:'Remplacement WC complet',materials:'Pack WC',notes:'',amount:'420',status:'À faire',urgent:false}
];

let interventions = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || demo;
let mode = 'day';
let editingId = null;

const planning = document.getElementById('planning');
const dateFilter = document.getElementById('dateFilter');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const categoryFilter = document.getElementById('categoryFilter');
const rangeNav = document.getElementById('rangeNav');
const typeQuickButtons = document.getElementById('typeQuickButtons');
const formDialog = document.getElementById('formDialog');
const form = document.getElementById('interventionForm');
const fields = document.getElementById('formFields');

migrateData();
dateFilter.value = getLocalDateString();
statusFilter.innerHTML = STATUSES.map(s=>`<option>${s}</option>`).join('');
categoryFilter.innerHTML = ['Tous les clients', ...CATEGORIES].map(c=>`<option>${c}</option>`).join('');

const schema = [
['date','Date','date'],['start','Heure début','time'],['end','Heure fin','time'],['client','Nom client'],['category','Catégorie client','category'],['phone','Téléphone'],['email','Email','email'],['address','Adresse chantier'],['building','Bâtiment'],['floor','Étage'],['door','Porte'],['type','Type'],['description','Description des travaux','textarea'],['materials','Matériel à prévoir','textarea'],['notes','Notes chantier','textarea'],['amount','Montant estimé (€)','number'],['status','Statut','select'],['urgent','Urgence','checkbox']
];

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(interventions)); }
function getLocalDateString(date = new Date()) { const y=date.getFullYear(); const m=String(date.getMonth()+1).padStart(2,'0'); const d=String(date.getDate()).padStart(2,'0'); return `${y}-${m}-${d}`; }
function fmtLong(d){ return new Date(`${d}T00:00`).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}); }
function fmtShort(d){ return new Date(`${d}T00:00`).toLocaleDateString('fr-FR',{weekday:'short',day:'2-digit',month:'2-digit'}); }
function getWeekStart(dateStr){ const dt=new Date(`${dateStr}T00:00`); const day=(dt.getDay()+6)%7; dt.setDate(dt.getDate()-day); return dt; }
function toYMD(dt){ return getLocalDateString(dt); }
function addDays(dateStr, days){ const dt=new Date(`${dateStr}T00:00`); dt.setDate(dt.getDate()+days); return toYMD(dt); }

function migrateData(){
  let changed = false;
  interventions = interventions.map(i=>{
    if(!i.category){ changed = true; return {...i, category:'Client perso'}; }
    return i;
  });
  if(changed) save();
}

function filtered(){
  const q = searchInput.value.trim().toLowerCase();
  return interventions.filter(i =>
    (statusFilter.value==='Tous' || i.status===statusFilter.value) &&
    (categoryFilter.value==='Tous les clients' || i.category===categoryFilter.value) &&
    (!q || [i.client,i.phone,i.address,i.type,i.description,i.category].join(' ').toLowerCase().includes(q))
  );
}

function render(){
  updateViewButtons();
  renderTypeQuickButtons();
  renderRangeNav();
  if(mode==='day') return renderDay();
  if(mode==='week') return renderWeek();
  return renderMonth();
}

function renderDay(){
  const selectedDate = dateFilter.value;
  const dayItems = filtered().filter(i=>i.date===selectedDate).sort((a,b)=>a.start.localeCompare(b.start));
  planning.innerHTML = `<h2 class="day-title">${fmtLong(selectedDate)}</h2>`;
  if(!dayItems.length){ planning.innerHTML += '<p>Aucune intervention prévue ce jour.</p>'; return; }
  dayItems.forEach(i=>planning.append(card(i)));
}

function renderWeek(){
  const start = getWeekStart(dateFilter.value);
  const weekDates = [...Array(7)].map((_,idx)=>{ const d=new Date(start); d.setDate(start.getDate()+idx); return toYMD(d); });
  const end = weekDates[6];
  planning.innerHTML = `<h2 class="day-title">Semaine du ${fmtLong(weekDates[0])} au ${fmtLong(end)}</h2><div class="week-grid"></div>`;
  const weekGrid = planning.querySelector('.week-grid');
  weekDates.forEach(day=>{
    const items = filtered().filter(i=>i.date===day).sort((a,b)=>a.start.localeCompare(b.start));
    const col = document.createElement('section'); col.className='day-column';
    col.innerHTML = `<h3>${fmtShort(day)}</h3>`;
    if(!items.length) col.innerHTML += '<p class="muted">Aucune intervention</p>';
    items.forEach(i=>col.append(card(i)));
    weekGrid.append(col);
  });
}

function renderMonth(){
  const anchor = new Date(`${dateFilter.value}T00:00`);
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = new Date(monthStart);
  const day = (gridStart.getDay()+6)%7;
  gridStart.setDate(gridStart.getDate()-day);
  planning.innerHTML = `<h2 class="day-title">${monthStart.toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}</h2><div class="month-head">${['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d=>`<span>${d}</span>`).join('')}</div><div class="month-grid"></div>`;
  const grid = planning.querySelector('.month-grid');
  for(let i=0;i<42;i++){
    const current = new Date(gridStart); current.setDate(gridStart.getDate()+i);
    const ymd = toYMD(current);
    const items = filtered().filter(x=>x.date===ymd).sort((a,b)=>a.start.localeCompare(b.start));
    const cell = document.createElement('section');
    cell.className = 'month-cell';
    if(current.getMonth()!==monthStart.getMonth()) cell.classList.add('outside');
    if(ymd===getLocalDateString()) cell.classList.add('today');
    cell.innerHTML = `<h4>${current.getDate()}</h4>`;
    items.forEach(i=>cell.append(card(i,true)));
    if(!items.length) cell.innerHTML += '<p class="muted">&nbsp;</p>';
    grid.append(cell);
  }
}

function card(i,compact=false){
  const tpl = document.getElementById('interventionCardTpl').content.cloneNode(true);
  const root = tpl.querySelector('.intervention');
  if(compact) root.classList.add('compact');
  if(i.urgent) root.classList.add('urgent');
  tpl.querySelector('h3').textContent = `${i.start}-${i.end} · ${i.client} · ${i.type}`;
  tpl.querySelector('.badge').textContent = i.status;
  const cat = tpl.querySelector('.category-badge');
  cat.textContent = i.category || 'Client perso';
  if((i.category||'')==='ERILIA') cat.classList.add('erilia');
  tpl.querySelector('.meta').textContent = `${i.address} | Bât ${i.building} | Étage ${i.floor} | Porte ${i.door} | ${i.amount} €`;
  tpl.querySelector('.desc').textContent = i.description;
  tpl.querySelector('.contact').innerHTML = `<a href="tel:${i.phone}">${i.phone}</a> · <a href="mailto:${i.email}">${i.email}</a> · <a target="_blank" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(i.address)}">Itinéraire</a>`;
  const actions = tpl.querySelector('.actions');
  const quick = ['Terminé','À facturer','Facturé','Payé'];
  actions.innerHTML = `<button data-act="edit">Modifier</button><button data-act="delete">Supprimer</button>${quick.map(s=>`<button data-act="status" data-status="${s}">${s}</button>`).join('')}`;
  actions.querySelectorAll('button').forEach(b=>b.onclick=()=>handleAction(b.dataset.act,i,b.dataset.status));
  return tpl;
}

function renderRangeNav(){
  if(mode==='day') rangeNav.innerHTML = `<button id="prevRangeBtn">Jour précédent</button><button id="nextRangeBtn">Jour suivant</button>`;
  if(mode==='week') rangeNav.innerHTML = `<button id="prevRangeBtn">Semaine précédente</button><button id="nextRangeBtn">Semaine suivante</button>`;
  if(mode==='month') rangeNav.innerHTML = `<button id="prevRangeBtn">Mois précédent</button><button id="nextRangeBtn">Mois suivant</button>`;
  document.getElementById('prevRangeBtn').onclick = ()=>shiftRange(-1);
  document.getElementById('nextRangeBtn').onclick = ()=>shiftRange(1);
}

function shiftRange(direction){
  if(mode==='day') dateFilter.value = addDays(dateFilter.value, direction);
  if(mode==='week') dateFilter.value = addDays(dateFilter.value, 7*direction);
  if(mode==='month'){ const dt=new Date(`${dateFilter.value}T00:00`); dt.setMonth(dt.getMonth()+direction); dateFilter.value = toYMD(dt); }
  render();
}

function updateViewButtons(){
  ['day','week','month'].forEach(v=>document.getElementById(`${v}ViewBtn`).classList.toggle('active', mode===v));
}

function handleAction(act,i,status){
  if(act==='edit') return openForm(i);
  if(act==='delete'){ interventions = interventions.filter(x=>x.id!==i.id); save(); return render(); }
  if(act==='status'){ i.status=status; save(); return render(); }
}

function renderTypeQuickButtons(){
  if(!typeQuickButtons) return;
  typeQuickButtons.innerHTML = TYPES.map(t=>`<button type="button" data-type="${t}">${t}</button>`).join('');
  typeQuickButtons.querySelectorAll('button').forEach(btn=>{
    btn.onclick = ()=>openForm({ type: btn.dataset.type });
  });
}

function openForm(item){
  editingId = item?.id || null;
  document.getElementById('formTitle').textContent = editingId ? 'Modifier intervention' : 'Nouvelle intervention';
  fields.innerHTML = schema.map(([k,l,t='text'])=>{
    if(k==='type') return `<label>${l}<select name="${k}">${TYPES.map(v=>`<option ${item?.[k]===v?'selected':''}>${v}</option>`).join('')}</select></label>`;
    if(k==='status') return `<label>${l}<select name="${k}">${STATUSES.slice(1).map(v=>`<option ${item?.[k]===v?'selected':''}>${v}</option>`).join('')}</select></label>`;
    if(k==='category' || t==='category') return `<label>${l}<select name="${k}">${CATEGORIES.map(v=>`<option ${(item?.[k]||'Client perso')===v?'selected':''}>${v}</option>`).join('')}</select></label>`;
    if(t==='textarea') return `<label>${l}<textarea name="${k}">${item?.[k]||''}</textarea></label>`;
    if(t==='checkbox') return `<label>${l}<input name="${k}" type="checkbox" ${item?.[k]?'checked':''}></label>`;
    return `<label>${l}<input name="${k}" type="${t}" value="${item?.[k]||''}"></label>`;
  }).join('');
  formDialog.showModal();
}

form.onsubmit = (e)=>{
  e.preventDefault();
  const fd = new FormData(form);
  const obj = Object.fromEntries(fd.entries());
  obj.category = obj.category || 'Client perso';
  obj.urgent = fields.querySelector('input[name="urgent"]').checked;
  obj.id = editingId || crypto.randomUUID();
  interventions = editingId ? interventions.map(i=>i.id===editingId?obj:i) : [...interventions,obj];
  save(); formDialog.close(); render();
};

document.getElementById('cancelBtn').onclick = ()=>formDialog.close();
document.getElementById('newInterventionBtn').onclick = ()=>openForm();
document.getElementById('dayViewBtn').onclick = ()=>{mode='day'; render();};
document.getElementById('weekViewBtn').onclick = ()=>{mode='week'; render();};
document.getElementById('monthViewBtn').onclick = ()=>{mode='month'; render();};
document.getElementById('todayBtn').onclick = ()=>{mode='day'; dateFilter.value=getLocalDateString(); render();};
document.getElementById('thisWeekBtn').onclick = ()=>{mode='week'; dateFilter.value=getLocalDateString(); render();};
document.getElementById('thisMonthBtn').onclick = ()=>{mode='month'; dateFilter.value=getLocalDateString(); render();};
[dateFilter,searchInput,statusFilter,categoryFilter].forEach(el=>el.oninput=render);
document.getElementById('printBtn').onclick = ()=>window.print();
document.getElementById('exportCsvBtn').onclick = ()=>{
  const rows = filtered().map(i=>[i.date,i.start,i.end,i.client,i.category,i.phone,i.email,i.address,i.building,i.floor,i.door,i.type,i.description,i.materials,i.notes,i.amount,i.status,i.urgent?'Oui':'Non']);
  const csv = [['Date','Début','Fin','Client','Catégorie client','Téléphone','Email','Adresse','Bâtiment','Étage','Porte','Type','Description','Matériel','Notes','Montant','Statut','Urgence'],...rows]
    .map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(';')).join('\n');
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='planning-cc2a.csv'; a.click();
};

render();
