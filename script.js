// ================== CONSTANTES ==================
const DAYS = ['Lunes','Martes','Miércoles','Jueves','Viernes'];
const HOURS = ['8-9','9-10','10-11','11-12','1-2','2-3','3-4'];

let currentUser = null;
let editingTeacher = null;
let editingScheduleCopy = null;

// ================== DATOS ==================
function getUsers() {
  const data = localStorage.getItem('users');
  if (data) return JSON.parse(data);
  const defaults = [
    { username: 'director', password: 'admin123', role: 'director', name: 'Director General' },
    { username: 'juan', password: '1234', role: 'teacher', name: 'Juan Pérez' },
    { username: 'maria', password: '1234', role: 'teacher', name: 'María López' }
  ];
  localStorage.setItem('users', JSON.stringify(defaults));
  return defaults;
}

function getSchedules() {
  const data = localStorage.getItem('schedules');
  return data ? JSON.parse(data) : {};
}

function saveSchedules(data) {
  localStorage.setItem('schedules', JSON.stringify(data));
}

function emptySchedule() {
  const sch = {};
  DAYS.forEach(d => sch[d] = HOURS.map(() => ''));
  return sch;
}

// ================== ELEMENTOS ==================
const loginSection = document.getElementById('login-section');
const directorSection = document.getElementById('director-section');
const teacherSection = document.getElementById('teacher-section');

const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

const selectTeacher = document.getElementById('select-teacher');
const directorContent = document.getElementById('director-content');
const teacherContent = document.getElementById('teacher-schedule');

const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const logoutBtn2 = document.getElementById('logout-btn-2');

const modal = document.getElementById('modal');
const modalTeacher = document.getElementById('modal-teacher');
const modalTable = document.getElementById('modal-table');
const saveScheduleBtn = document.getElementById('save-schedule-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

// ================== LOGIN ==================
loginBtn.addEventListener('click', () => {
  const users = getUsers();
  const u = usernameInput.value.trim();
  const p = passwordInput.value.trim();
  const found = users.find(x => x.username === u && x.password === p);
  if (!found) { alert("Usuario o contraseña incorrectos"); return; }

  currentUser = found;
  usernameInput.value = '';
  passwordInput.value = '';

  if (found.role === 'director') showDirector();
  else showTeacher(found.username);
});

logoutBtn.addEventListener('click', logout);
logoutBtn2.addEventListener('click', logout);

function logout() {
  currentUser = null;
  directorSection.classList.add('hidden');
  teacherSection.classList.add('hidden');
  loginSection.classList.remove('hidden');
}

// ================== VISTA DIRECTOR ==================
function showDirector() {
  loginSection.classList.add('hidden');
  teacherSection.classList.add('hidden');
  directorSection.classList.remove('hidden');

  document.getElementById('director-name').textContent = currentUser.name;

  populateTeacherSelect();
  renderAllTeacherTables();
}

function populateTeacherSelect() {
  const users = getUsers().filter(u => u.role === 'teacher');
  selectTeacher.innerHTML = '<option value="">-- elige --</option>' +
    users.map(u => `<option value="${u.username}">${u.name}</option>`).join('');
}

document.getElementById('new-schedule').addEventListener('click', () => {
  const selected = selectTeacher.value;
  if (!selected) return alert("Selecciona un maestro");
  openModalForTeacher(selected);
});

document.getElementById('view-all')?.addEventListener('click', renderAllTeacherTables);

function renderAllTeacherTables() {
  const schedules = getSchedules();
  const users = getUsers().filter(u => u.role === 'teacher');
  directorContent.innerHTML = '';

  users.forEach(u => {
    const div = document.createElement('div');
    div.className = 'card';
    div.style.marginBottom = '15px';

    const title = document.createElement('h3');
    title.textContent = u.name;
    div.appendChild(title);

    const tbl = buildScheduleTable(schedules[u.username] || emptySchedule(), false);
    div.appendChild(tbl);

    const btn = document.createElement('button');
    btn.textContent = 'Editar';
    btn.className = 'btn';
    btn.onclick = () => openModalForTeacher(u.username);
    div.appendChild(btn);

    directorContent.appendChild(div);
  });
}

// ================== VISTA MAESTRO ==================
function showTeacher(username) {
  const users = getUsers();
  const u = users.find(x => x.username === username);
  if (!u) { alert("Usuario no encontrado."); return; }

  currentUser = u;

  loginSection.classList.add('hidden');
  directorSection.classList.add('hidden');
  teacherSection.classList.remove('hidden');

  document.getElementById('teacher-name').textContent = u.name;
  renderTeacherSchedule(u.username);
}

function renderTeacherSchedule(username) {
  const schedules = getSchedules();
  const schedule = schedules[username];
  const container = teacherContent;
  container.innerHTML = '';

  if (!schedule) {
    container.innerHTML = "<p style='color:gray'>No hay horario asignado aún.</p>";
    return;
  }

  const table = buildScheduleTable(schedule, false);
  container.appendChild(table);
}

// ================== MODAL ==================
function openModalForTeacher(username) {
  editingTeacher = username;
  const schedules = getSchedules();
  editingScheduleCopy = JSON.parse(JSON.stringify(schedules[username] || emptySchedule()));

  modalTeacher.textContent = username;
  modalTable.innerHTML = '';
  modalTable.appendChild(buildScheduleTable(editingScheduleCopy, true));
  modal.classList.remove('hidden');
}

closeModalBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
  editingTeacher = null;
  editingScheduleCopy = null;
});

saveScheduleBtn.addEventListener('click', () => {
  if (!editingTeacher) return alert("No hay maestro seleccionado");
  const schedules = getSchedules();
  schedules[editingTeacher] = editingScheduleCopy;
  saveSchedules(schedules);
  modal.classList.add('hidden');
  editingTeacher = null;
  editingScheduleCopy = null;
  renderAllTeacherTables();
  alert("✅ Horario guardado correctamente");
});

// ================== CONSTRUIR TABLA ==================
function buildScheduleTable(schedule, editable=false) {
  const table = document.createElement('table');

  // Encabezado
  const thead = document.createElement('tr');
  thead.innerHTML = "<th>Hora</th>" + DAYS.map(d => `<th>${d}</th>`).join('');
  table.appendChild(thead);

  HOURS.forEach((h, i) => {
    const row = document.createElement('tr');
    const hourCell = document.createElement('td');
    hourCell.textContent = h;
    row.appendChild(hourCell);

    DAYS.forEach(d => {
      const td = document.createElement('td');
      td.textContent = schedule[d][i] || '';
      if (editable) {
        td.contentEditable = true;
        td.oninput = () => editingScheduleCopy[d][i] = td.textContent;
      }
      row.appendChild(td);
    });

    table.appendChild(row);
  });

  return table;
}
