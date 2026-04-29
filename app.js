const STORAGE_KEY = 'cc2a_interventions_v1';
const STATUSES = ['Tous','À faire','Confirmé','En cours','Terminé','À facturer','Facturé','Payé','Annulé'];
const TYPES = ['Remplacement chauffe-eau','Recherche de fuite','Débouchage','Remplacement WC','Remplacement robinetterie','Groupe de sécurité','Dépannage chauffage','Intervention syndic','Devis à faire','Facture à faire','Autre'];
const CLIENT_CATEGORIES = ['Client perso','ERILIA','Syndic','Assurance','Agence','Autre'];

const demo = [
  {id:crypto.randomUUID(),date:'2026-04-29',start:'08:30',end:'10:30',client:'M. Rossi',phone:'0600000001',email:'rossi@mail.com',address:'Ajaccio Centre',building:'A',floor:'2',door:'5',type:'Remplacement chauffe-eau',description:'Remplacement chauffe-eau 200 L',materials:'Chauffe-eau 200L + raccords',notes:'Accès cave',amount:'890',status:'Confirmé',urgent:false,category:'Client perso'},
  {id:crypto.randomUUID(),date:'2026-04-29',start:'11:00',end:'12:00',client:'Mme Martin',phone:'0600000002',email:'martin@mail.com',address:'Les Salines, Ajaccio',building:'B',floor:'1',door:'2',type:'Recherche de fuite',description:'Fuite salle de bain',materials:'Détecteur humidité',notes:'Syndic informé',amount:'180',status:'En cours',urgent:true,category:'ERILIA'},
  {id:crypto.randomUUID(),date:'2026-04-30',start:'09:00',end:'10:30',client:'M. Leone',phone:'0600000003',email:'leone@mail.com',address:'Route des Sanguinaires',building:'-',floor:'RDC',door:'-',type:'Remplacement WC',description:'Remplacement WC complet',materials:'Pack WC',notes:'',amount:'420',status:'À faire',urgent:false,category:'Client perso'},
  {id:crypto.randomUUID(),date:'2026-05-01',start:'14:00',end:'15:30',client:'Mme Bianchi',phone:'0600000004',email:'bianchi@mail.com',address:'Alata',building:'-',floor:'-',door:'-',type:'Débouchage',description:'Débouchage évacuation cuisine',materials:'Furet + pompe',notes:'',amount:'150',status:'À faire',urgent:false,category:'Syndic'},
  {id:crypto.randomUUID(),date:'2026-05-02',start:'10:00',end:'11:00',client:'M. Guidi',phone:'0600000005',email:'guidi@mail.com',address:'Mezzavia',building:'C',floor:'3',door:'9',type:'Groupe de sécurité',description:'Groupe de sécurité à remplacer',materials:'Groupe 20/27',notes:'Couper eau générale',amount:'210',status:'Confirmé',urgent:false,category:'Agence'}
];

let interventions = migrateInterventions(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || demo);
let mode = 'day';
let editingId = null;

const planning = document.getElementById('planning');
const dateFilter = document.getElementById('dateFilter');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const categoryFilter = document.getElementById('categoryFilter');
const formDialog = document.getElementById('formDialog');
const form = document.getElementById('interventionForm');
const fields = document.getElementById('formFields');
const viewTitle = document.getElementById('viewTitle');

dateFilter.value = getLocalDateString();
statusFilter.innerHTML = STATUSES.map(s=>`<option>${s}</option>`).join('');
categoryFilter.innerHTML = ['Tous les clients', ...CLIENT_CATEGORIES].map(c=>`<option>${c}</option>`).join('');

const schema = [
['date','Date','date'],['start','Heure début','time'],['end','Heure fin','time'],['client','Nom client'],['category','Catégorie client','category'],['phone','Téléphone'],['email','Email','email'],['address','Adresse chantier'],['building','Bâtiment'],['floor','Étage'],['door','Porte'],['type','Type'],['description','Description des travaux','textarea'],['materials','Matériel à prévoir','textarea'],['notes','Notes chantier','textarea'],['amount','Montant estimé (€)','number'],['status','Statut','select'],['urgent','Urgence','checkbox']
];

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(interventions)); }
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function fmtDate(d){ return new Date(d+'T00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'}); }
function weekStart(dateStr){ const dt=new Date(dateStr+'T00:00'); const day=(dt.getDay()+6)%7; dt.setDate(dt.getDate()-day); return dt; }
function fmtDayShort(date){ return date.toLocaleDateString('fr-FR',{weekday:'long',day:'2-digit',month:'2-digit'}); }
function monthStartGrid(dateStr){
  const dt = new Date(dateStr+'T00:00');
  dt.setDate(1);
  const day = (dt.getDay()+6)%7;
  dt.setDate(dt.getDate()-day);
  return dt;
}
function monthTitle(dateStr){
  const dt = new Date(dateStr+'T00:00');
  return `Mois de ${dt.toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}`;
}

function migrateInterventions(items){
  let changed = false;
  const migrated = items.map(i=>{
    if(!i.category){ changed = true; return {...i, category:'Client perso'}; }
    return i;
  });
  if(changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  return migrated;
}

function filtered(){
  const q = searchInput.value.trim().toLowerCase();
  return interventions.filter(i =>
    (statusFilter.value==='Tous' || i.status===statusFilter.value) &&
    (categoryFilter.value==='Tous les clients' || (i.category || 'Client perso')===categoryFilter.value) &&
    (!q || [i.client,i.phone,i.address,i.type,i.description,i.category].join(' ').toLowerCase().includes(q))
  );
}

function dayTitle(targetDate){
  const today = getLocalDateString();
  return targetDate===today ? `Aujourd’hui – ${fmtDate(targetDate)}` : `Jour sélectionné – ${fmtDate(targetDate)}`;
}

function weekTitle(targetDate){
  const start = weekStart(targetDate);
  const end = new Date(start); end.setDate(start.getDate()+6);
  return `Semaine du ${fmtDate(getLocalDateString(start))} au ${fmtDate(getLocalDateString(end))}`;
}

function render(){
  const list = filtered().sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));
  const targetDate = dateFilter.value;
  planning.innerHTML = '';
  if(mode==='day') return renderDay(list,targetDate);
  if(mode==='week') return renderWeek(list,targetDate);
  return renderMonth(list,targetDate);
}

function renderDay(list,targetDate){
  viewTitle.textContent = dayTitle(targetDate);
  const dayItems = list.filter(i=>i.date===targetDate);
  if(!dayItems.length){ planning.innerHTML = '<p>Aucune intervention prévue ce jour.</p>'; return; }
  dayItems.forEach(i=>planning.append(card(i)));
}

function renderWeek(list,targetDate){
  viewTitle.textContent = weekTitle(targetDate);
  const start = weekStart(targetDate);
  const days = Array.from({length:7}, (_,idx)=>{ const d = new Date(start); d.setDate(start.getDate()+idx); return d; });
  const week = document.createElement('div');
  week.className = 'week-grid';

  days.forEach(d=>{
    const key = getLocalDateString(d);
    const col = document.createElement('section');
    col.className = 'week-day';
    col.innerHTML = `<h3>${fmtDayShort(d)}</h3>`;
    const items = list.filter(i=>i.date===key).sort((a,b)=>a.start.localeCompare(b.start));
    if(!items.length) col.insertAdjacentHTML('beforeend','<p class="week-empty">Aucune intervention</p>');
    items.forEach(i=>col.append(card(i,false)));
    week.append(col);
  });

  planning.append(week);
}

function renderMonth(list,targetDate){
  viewTitle.textContent = monthTitle(targetDate);
  const today = getLocalDateString();
  const month = new Date(targetDate+'T00:00').getMonth();
  const start = monthStartGrid(targetDate);
  const days = Array.from({length:42}, (_,idx)=>{ const d = new Date(start); d.setDate(start.getDate()+idx); return d; });
  const monthGrid = document.createElement('div');
  monthGrid.className = 'month-grid';
  ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].forEach(name=>{
    const h = document.createElement('div');
    h.className = 'month-head';
    h.textContent = name;
    monthGrid.append(h);
  });
  days.forEach(d=>{
    const key = getLocalDateString(d);
    const cell = document.createElement('section');
    const isCurrentMonth = d.getMonth()===month;
    cell.className = `month-day ${isCurrentMonth?'':'month-day-muted'} ${key===today?'month-day-today':''}`.trim();
    cell.innerHTML = `<h3>${d.getDate()}</h3>`;
    const items = list.filter(i=>i.date===key).sort((a,b)=>a.start.localeCompare(b.start));
    if(!items.length){
      cell.insertAdjacentHTML('beforeend', '<p class="week-empty">—</p>');
    } else {
      items.forEach(i=>{
        const category = i.category || 'Client perso';
        const catClass = category==='ERILIA' ? 'category-badge category-erilia' : 'category-badge';
        cell.insertAdjacentHTML('beforeend', `<article class="month-item ${i.urgent?'urgent':''}"><div><strong>${i.start}</strong> · ${i.client}</div><div><span class="${catClass}">${category}</span></div><div>${i.type}</div></article>`);
      });
    }
    monthGrid.append(cell);
  });
  planning.append(monthGrid);
}

function card(i, showActions = true){
  const tpl = document.getElementById('interventionCardTpl').content.cloneNode(true);
  const root = tpl.querySelector('.intervention');
  if(i.urgent) root.classList.add('urgent');
  tpl.querySelector('h3').textContent = `${i.start}-${i.end} · ${i.client}`;
  tpl.querySelector('.badge').textContent = i.status;
  const category = i.category || 'Client perso';
  const categoryClass = category === 'ERILIA' ? 'category-badge category-erilia' : 'category-badge';
  tpl.querySelector('.meta').innerHTML = `${i.type}<br>${i.address} | Bât ${i.building} | Étage ${i.floor} | Porte ${i.door} | ${i.amount} €`;
  tpl.querySelector('.desc').innerHTML = `<span class="badges"><span class="${categoryClass}">${category}</span>${i.urgent?'<span class="category-badge">Urgence</span>':''}</span><br>${i.description}`;
  tpl.querySelector('.contact').innerHTML = `<a href="tel:${i.phone}">${i.phone}</a> · <a href="mailto:${i.email}">${i.email}</a> · <a target="_blank" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(i.address)}">Itinéraire</a>`;
  const actions = tpl.querySelector('.actions');
  const quick = ['Terminé','À facturer','Facturé','Payé'];
  if(showActions){
    actions.innerHTML = `
      <button data-act="edit">Modifier</button>
      <button data-act="delete">Supprimer</button>
      <button data-act="devis">Créer devis</button>
      <button data-act="facture">Créer facture</button>
      <button data-act="rapport">Créer rapport de fuite</button>
      ${quick.map(s=>`<button data-act="status" data-status="${s}">${s}</button>`).join('')}
    `;
    actions.querySelectorAll('button').forEach(b=>b.onclick=()=>handleAction(b.dataset.act,i,b.dataset.status));
  } else {
    actions.remove();
  }
  return tpl;
}

function handleAction(act,i,status){
  if(act==='edit') return openForm(i);
  if(act==='delete'){ interventions = interventions.filter(x=>x.id!==i.id); save(); return render(); }
  if(act==='status'){ i.status=status; save(); return render(); }
  if(['devis','facture','rapport'].includes(act)){
    const w = window.open('','_blank');
    w.document.write(`<h1>${act.toUpperCase()}</h1><p>Client: ${i.client}</p><p>Catégorie: ${i.category || 'Client perso'}</p><p>Date: ${i.date} ${i.start}-${i.end}</p><p>Adresse: ${i.address}</p><p>Description: ${i.description}</p><p>Montant estimé: ${i.amount} €</p><p>TVA non applicable, article 293 B du CGI</p>`);
  }
}

function openForm(item){
  editingId = item?.id || null;
  document.getElementById('formTitle').textContent = editingId ? 'Modifier intervention' : 'Nouvelle intervention';
  fields.innerHTML = schema.map(([k,l,t='text'])=>{
    if(k==='type') return `<label>${l}<select name="${k}">${TYPES.map(v=>`<option ${item?.[k]===v?'selected':''}>${v}</option>`).join('')}</select></label>`;
    if(k==='status') return `<label>${l}<select name="${k}">${STATUSES.slice(1).map(v=>`<option ${item?.[k]===v?'selected':''}>${v}</option>`).join('')}</select></label>`;
    if(k==='category') return `<label>${l}<select name="${k}">${CLIENT_CATEGORIES.map(v=>`<option ${(item?.[k]||'Client perso')===v?'selected':''}>${v}</option>`).join('')}</select></label>`;
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
  obj.urgent = fields.querySelector('input[name="urgent"]').checked;
  obj.category = obj.category || 'Client perso';
  obj.id = editingId || crypto.randomUUID();
  interventions = editingId ? interventions.map(i=>i.id===editingId?obj:i) : [...interventions,obj];
  save(); formDialog.close(); render();
};

document.getElementById('cancelBtn').onclick = ()=>formDialog.close();
document.getElementById('newInterventionBtn').onclick = ()=>openForm();
function setMode(nextMode){
  mode = nextMode;
  dayViewBtn.classList.toggle('active', mode==='day');
  weekViewBtn.classList.toggle('active', mode==='week');
  monthViewBtn.classList.toggle('active', mode==='month');
}
document.getElementById('dayViewBtn').onclick = ()=>{ setMode('day'); render(); };
document.getElementById('weekViewBtn').onclick = ()=>{ setMode('week'); render(); };
document.getElementById('monthViewBtn').onclick = ()=>{ setMode('month'); render(); };
document.getElementById('todayBtn').onclick = ()=>{ dateFilter.value = getLocalDateString(); setMode('day'); render(); };
document.getElementById('prevWeekBtn').onclick = ()=>{ const d = weekStart(dateFilter.value); d.setDate(d.getDate()-7); dateFilter.value = getLocalDateString(d); setMode('week'); render(); };
document.getElementById('currentWeekBtn').onclick = ()=>{ dateFilter.value = getLocalDateString(); setMode('week'); render(); };
document.getElementById('nextWeekBtn').onclick = ()=>{ const d = weekStart(dateFilter.value); d.setDate(d.getDate()+7); dateFilter.value = getLocalDateString(d); setMode('week'); render(); };
document.getElementById('prevMonthBtn').onclick = ()=>{ const d = new Date(dateFilter.value+'T00:00'); d.setMonth(d.getMonth()-1); dateFilter.value = getLocalDateString(d); setMode('month'); render(); };
document.getElementById('currentMonthBtn').onclick = ()=>{ dateFilter.value = getLocalDateString(); setMode('month'); render(); };
document.getElementById('nextMonthBtn').onclick = ()=>{ const d = new Date(dateFilter.value+'T00:00'); d.setMonth(d.getMonth()+1); dateFilter.value = getLocalDateString(d); setMode('month'); render(); };
[dateFilter,searchInput,statusFilter,categoryFilter].forEach(el=>el.oninput=render);
document.getElementById('printBtn').onclick = ()=>window.print();
document.getElementById('exportCsvBtn').onclick = ()=>{
  const rows = filtered().map(i=>[i.date,i.start,i.end,i.client,i.category||'Client perso',i.phone,i.email,i.address,i.building,i.floor,i.door,i.type,i.description,i.materials,i.notes,i.amount,i.status,i.urgent?'Oui':'Non']);
  const csv = [['Date','Début','Fin','Client','Catégorie client','Téléphone','Email','Adresse','Bâtiment','Étage','Porte','Type','Description','Matériel','Notes','Montant','Statut','Urgence'],...rows]
    .map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(';')).join('\n');
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='planning-cc2a.csv'; a.click();
};
render();
