const STORAGE_KEY = 'cc2a_interventions_v1';
const STATUSES = ['Tous','À faire','Confirmé','En cours','Terminé','À facturer','Facturé','Payé','Annulé'];
const TYPES = ['Remplacement chauffe-eau','Recherche de fuite','Débouchage','Remplacement WC','Remplacement robinetterie','Groupe de sécurité','Dépannage chauffage','Intervention syndic','Devis à faire','Facture à faire','Autre'];

const demo = [
  {id:crypto.randomUUID(),date:'2026-04-29',start:'08:30',end:'10:30',client:'M. Rossi',phone:'0600000001',email:'rossi@mail.com',address:'Ajaccio Centre',building:'A',floor:'2',door:'5',type:'Remplacement chauffe-eau',description:'Remplacement chauffe-eau 200 L',materials:'Chauffe-eau 200L + raccords',notes:'Accès cave',amount:'890',status:'Confirmé',urgent:false},
  {id:crypto.randomUUID(),date:'2026-04-29',start:'11:00',end:'12:00',client:'Mme Martin',phone:'0600000002',email:'martin@mail.com',address:'Les Salines, Ajaccio',building:'B',floor:'1',door:'2',type:'Recherche de fuite',description:'Fuite salle de bain',materials:'Détecteur humidité',notes:'Syndic informé',amount:'180',status:'En cours',urgent:true},
  {id:crypto.randomUUID(),date:'2026-04-30',start:'09:00',end:'10:30',client:'M. Leone',phone:'0600000003',email:'leone@mail.com',address:'Route des Sanguinaires',building:'-',floor:'RDC',door:'-',type:'Remplacement WC',description:'Remplacement WC complet',materials:'Pack WC',notes:'',amount:'420',status:'À faire',urgent:false},
  {id:crypto.randomUUID(),date:'2026-05-01',start:'14:00',end:'15:30',client:'Mme Bianchi',phone:'0600000004',email:'bianchi@mail.com',address:'Alata',building:'-',floor:'-',door:'-',type:'Débouchage',description:'Débouchage évacuation cuisine',materials:'Furet + pompe',notes:'',amount:'150',status:'À faire',urgent:false},
  {id:crypto.randomUUID(),date:'2026-05-02',start:'10:00',end:'11:00',client:'M. Guidi',phone:'0600000005',email:'guidi@mail.com',address:'Mezzavia',building:'C',floor:'3',door:'9',type:'Groupe de sécurité',description:'Groupe de sécurité à remplacer',materials:'Groupe 20/27',notes:'Couper eau générale',amount:'210',status:'Confirmé',urgent:false}
];

let interventions = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || demo;
let mode = 'day';
let editingId = null;

const planning = document.getElementById('planning');
const dateFilter = document.getElementById('dateFilter');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const formDialog = document.getElementById('formDialog');
const form = document.getElementById('interventionForm');
const fields = document.getElementById('formFields');

dateFilter.value = getLocalDateString();
statusFilter.innerHTML = STATUSES.map(s=>`<option>${s}</option>`).join('');

const schema = [
['date','Date','date'],['start','Heure début','time'],['end','Heure fin','time'],['client','Nom client'],['phone','Téléphone'],['email','Email','email'],['address','Adresse chantier'],['building','Bâtiment'],['floor','Étage'],['door','Porte'],['type','Type'],['description','Description des travaux','textarea'],['materials','Matériel à prévoir','textarea'],['notes','Notes chantier','textarea'],['amount','Montant estimé (€)','number'],['status','Statut','select'],['urgent','Urgence','checkbox']
];

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(interventions)); }
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fmtDate(d){ return new Date(d+'T00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'}); }
function weekKey(d){ const dt=new Date(d+'T00:00'); const day=(dt.getDay()+6)%7; dt.setDate(dt.getDate()-day); return dt.toISOString().slice(0,10); }

function filtered(){
  const q = searchInput.value.trim().toLowerCase();
  return interventions.filter(i => (statusFilter.value==='Tous' || i.status===statusFilter.value) &&
    (!q || [i.client,i.phone,i.address,i.type,i.description].join(' ').toLowerCase().includes(q)));
}

function render(){
  const list = filtered().sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));
  const targetDate = dateFilter.value;
  const groups = {};
  list.forEach(i=>{
    if(mode==='day' && i.date!==targetDate) return;
    if(mode==='week' && weekKey(i.date)!==weekKey(targetDate)) return;
    (groups[i.date] ||= []).push(i);
  });
  planning.innerHTML = '';
  Object.keys(groups).sort().forEach(day=>{
    planning.insertAdjacentHTML('beforeend', `<h2 class="day-title">${fmtDate(day)}</h2>`);
    groups[day].forEach(i=>planning.append(card(i)));
  });
  if(!planning.innerHTML) planning.innerHTML = '<p>Aucune intervention.</p>';
}

function card(i){
  const tpl = document.getElementById('interventionCardTpl').content.cloneNode(true);
  const root = tpl.querySelector('.intervention');
  if(i.urgent) root.classList.add('urgent');
  tpl.querySelector('h3').textContent = `${i.start}-${i.end} · ${i.client} · ${i.type}`;
  tpl.querySelector('.badge').textContent = i.status;
  tpl.querySelector('.meta').textContent = `${i.address} | Bât ${i.building} | Étage ${i.floor} | Porte ${i.door} | ${i.amount} €`;
  tpl.querySelector('.desc').textContent = i.description;
  tpl.querySelector('.contact').innerHTML = `<a href="tel:${i.phone}">${i.phone}</a> · <a href="mailto:${i.email}">${i.email}</a> · <a target="_blank" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(i.address)}">Itinéraire</a>`;
  const actions = tpl.querySelector('.actions');
  const quick = ['Terminé','À facturer','Facturé','Payé'];
  actions.innerHTML = `
    <button data-act="edit">Modifier</button>
    <button data-act="delete">Supprimer</button>
    <button data-act="devis">Créer devis</button>
    <button data-act="facture">Créer facture</button>
    <button data-act="rapport">Créer rapport de fuite</button>
    ${quick.map(s=>`<button data-act="status" data-status="${s}">${s}</button>`).join('')}
  `;
  actions.querySelectorAll('button').forEach(b=>b.onclick=()=>handleAction(b.dataset.act,i,b.dataset.status));
  return tpl;
}

function handleAction(act,i,status){
  if(act==='edit') return openForm(i);
  if(act==='delete'){ interventions = interventions.filter(x=>x.id!==i.id); save(); return render(); }
  if(act==='status'){ i.status=status; save(); return render(); }
  if(['devis','facture','rapport'].includes(act)){
    const w = window.open('','_blank');
    w.document.write(`<h1>${act.toUpperCase()}</h1><p>Client: ${i.client}</p><p>Date: ${i.date} ${i.start}-${i.end}</p><p>Adresse: ${i.address}</p><p>Description: ${i.description}</p><p>Montant estimé: ${i.amount} €</p><p>TVA non applicable, article 293 B du CGI</p>`);
  }
}

function openForm(item){
  editingId = item?.id || null;
  document.getElementById('formTitle').textContent = editingId ? 'Modifier intervention' : 'Nouvelle intervention';
  fields.innerHTML = schema.map(([k,l,t='text'])=>{
    if(k==='type') return `<label>${l}<select name="${k}">${TYPES.map(v=>`<option ${item?.[k]===v?'selected':''}>${v}</option>`).join('')}</select></label>`;
    if(k==='status') return `<label>${l}<select name="${k}">${STATUSES.slice(1).map(v=>`<option ${item?.[k]===v?'selected':''}>${v}</option>`).join('')}</select></label>`;
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
  obj.id = editingId || crypto.randomUUID();
  interventions = editingId ? interventions.map(i=>i.id===editingId?obj:i) : [...interventions,obj];
  save(); formDialog.close(); render();
};

document.getElementById('cancelBtn').onclick = ()=>formDialog.close();
document.getElementById('newInterventionBtn').onclick = ()=>openForm();
document.getElementById('dayViewBtn').onclick = ()=>{mode='day'; dayViewBtn.classList.add('active'); weekViewBtn.classList.remove('active'); render();};
document.getElementById('weekViewBtn').onclick = ()=>{mode='week'; weekViewBtn.classList.add('active'); dayViewBtn.classList.remove('active'); render();};
[dateFilter,searchInput,statusFilter].forEach(el=>el.oninput=render);
document.getElementById('printBtn').onclick = ()=>window.print();
document.getElementById('exportCsvBtn').onclick = ()=>{
  const rows = filtered().map(i=>[i.date,i.start,i.end,i.client,i.phone,i.email,i.address,i.building,i.floor,i.door,i.type,i.description,i.materials,i.notes,i.amount,i.status,i.urgent?'Oui':'Non']);
  const csv = [['Date','Début','Fin','Client','Téléphone','Email','Adresse','Bâtiment','Étage','Porte','Type','Description','Matériel','Notes','Montant','Statut','Urgence'],...rows]
    .map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(';')).join('\n');
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='planning-cc2a.csv'; a.click();
};
render();
