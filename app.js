const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const defaultData = {
  journals: [],
  videos: [],
  projects: [],
  notes: []
};

let data = JSON.parse(localStorage.getItem("rifxJournalData") || "null") || defaultData;

function save() {
  localStorage.setItem("rifxJournalData", JSON.stringify(data));
  renderAll();
}

function esc(value="") {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function dateNow() {
  return new Date().toLocaleDateString("id-ID", {day:"2-digit", month:"short", year:"numeric"});
}

function showApp() {
  $("#loginScreen").classList.add("hidden");
  $("#app").classList.remove("hidden");
  const user = JSON.parse(localStorage.getItem("rifxUser") || "null");
  if (user) {
    $("#userName").textContent = user.name || "Google User";
    $("#userEmail").textContent = user.email || "";
    $("#avatar").textContent = (user.name || "G").charAt(0).toUpperCase();
  }
  $("#today").textContent = dateNow();
  renderAll();
}

function openPage(page) {
  $$(".page").forEach(p => p.classList.remove("active-page"));
  $(`#${page}`).classList.add("active-page");
  $$(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.page === page));
  const titles = {dashboard:"Dashboard",journal:"Journal",videos:"Video Library",portfolio:"Portfolio",notes:"Notes"};
  const eyebrows = {dashboard:"PRIVATE WORKSPACE",journal:"TRADING / DAILY LOG",videos:"WATCH / REVIEW",portfolio:"PROJECTS / WORK",notes:"THOUGHTS / IDEAS"};
  $("#pageTitle").textContent = titles[page];
  $("#pageEyebrow").textContent = eyebrows[page];
  $(".sidebar").classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
}

$$(".nav-item").forEach(btn => btn.addEventListener("click", () => openPage(btn.dataset.page)));
$$("[data-go]").forEach(btn => btn.addEventListener("click", () => openPage(btn.dataset.go)));
$("#mobileMenu").addEventListener("click", () => $(".sidebar").classList.toggle("open"));

$("#googleLogin").addEventListener("click", () => {
  // DEMO: replace this with real Google Identity Services later.
  const user = {name:"RIFX", email:"Google account (demo)"};
  localStorage.setItem("rifxUser", JSON.stringify(user));
  showApp();
});

$("#logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("rifxUser");
  $("#app").classList.add("hidden");
  $("#loginScreen").classList.remove("hidden");
});

function openModal(title, fields, onSubmit) {
  $("#modalTitle").textContent = title;
  $("#modalForm").innerHTML = `<div class="form-grid">
    ${fields.map(f => `
      <div class="field">
        <label>${esc(f.label)}</label>
        ${f.type === "textarea"
          ? `<textarea name="${esc(f.name)}" placeholder="${esc(f.placeholder||"")}">${esc(f.value||"")}</textarea>`
          : `<input name="${esc(f.name)}" type="${f.type||"text"}" placeholder="${esc(f.placeholder||"")}" value="${esc(f.value||"")}" ${f.required ? "required":""}>`}
      </div>`).join("")}
    <button class="primary form-submit" type="submit">Save</button>
  </div>`;
  $("#modal").classList.remove("hidden");
  $("#modalForm").onsubmit = e => {
    e.preventDefault();
    const form = new FormData(e.target);
    const obj = Object.fromEntries(form.entries());
    onSubmit(obj);
    $("#modal").classList.add("hidden");
  };
}

$("#closeModal").addEventListener("click", () => $("#modal").classList.add("hidden"));
$(".modal-backdrop").addEventListener("click", () => $("#modal").classList.add("hidden"));

$("#addJournalBtn").addEventListener("click", () => openModal("New Journal Entry", [
  {name:"title",label:"Title",placeholder:"Contoh: XAUUSD London Session",required:true},
  {name:"result",label:"Result / P&L",placeholder:"+$25 / -$10"},
  {name:"setup",label:"Setup",placeholder:"FVG, OB, liquidity sweep..."},
  {name:"content",label:"Journal",type:"textarea",placeholder:"Apa yang terjadi? Kenapa entry? Apa yang dipelajari?"}
], v => {
  data.journals.unshift({id:Date.now(),date:dateNow(),...v});
  save();
}));

$("#addVideoBtn").addEventListener("click", () => openModal("Add Video", [
  {name:"title",label:"Video name",placeholder:"Nama video / playlist",required:true},
  {name:"url",label:"Video URL",placeholder:"YouTube / direct MP4 URL",required:true},
  {name:"category",label:"Category",placeholder:"Trading / Coding / Personal"}
], v => {
  data.videos.unshift({id:Date.now(),date:dateNow(),...v});
  save();
}));

$("#addProjectBtn").addEventListener("click", () => openModal("Add Project", [
  {name:"title",label:"Project name",placeholder:"Nama project",required:true},
  {name:"description",label:"Description",type:"textarea",placeholder:"Deskripsi singkat project"},
  {name:"link",label:"Project link",placeholder:"https://..."}
], v => {
  data.projects.unshift({id:Date.now(),date:dateNow(),...v});
  save();
}));

$("#addNoteBtn").addEventListener("click", () => openModal("Add Note", [
  {name:"title",label:"Title",placeholder:"Idea / reminder",required:true},
  {name:"content",label:"Content",type:"textarea",placeholder:"Tulis catatanmu..."}
], v => {
  data.notes.unshift({id:Date.now(),date:dateNow(),...v});
  save();
}));

function deleteItem(type,id) {
  data[type] = data[type].filter(x => x.id !== id);
  save();
}

function renderJournal() {
  const box = $("#journalList");
  if (!data.journals.length) { box.innerHTML = `<div class="empty-state">Belum ada journal. Klik <b>+ Add Entry</b> untuk mulai.</div>`; return; }
  box.innerHTML = data.journals.map(j => `
    <article class="journal-card">
      <div>
        <p class="eyebrow">${esc(j.date)}</p>
        <h4>${esc(j.title)}</h4>
        <p>${esc(j.content || "Tidak ada catatan tambahan.")}</p>
        <div class="meta">
          ${j.result ? `<span class="tag red">${esc(j.result)}</span>`:""}
          ${j.setup ? `<span class="tag">${esc(j.setup)}</span>`:""}
        </div>
      </div>
      <button class="delete-btn" onclick="deleteItem('journals',${j.id})">Delete</button>
    </article>`).join("");
}

function youtubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v") || u.pathname.split("/").pop();
  } catch(e){}
  return null;
}

function renderVideos() {
  const box = $("#videoGrid");
  if (!data.videos.length) { box.innerHTML = `<div class="empty-state">Belum ada video. Tambahkan YouTube atau direct MP4 URL.</div>`; return; }
  box.innerHTML = data.videos.map(v => `
    <article class="video-card" onclick="playVideo(${v.id})">
      <div class="thumb">▶</div>
      <div class="video-info"><b>${esc(v.title)}</b><small>${esc(v.category || "Video")} · ${esc(v.date)}</small></div>
    </article>`).join("");
}

window.playVideo = function(id) {
  const v = data.videos.find(x => x.id === id);
  if (!v) return;
  const yt = youtubeId(v.url);
  $("#videoPlayer").innerHTML = yt
    ? `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(yt)}" allowfullscreen title="${esc(v.title)}"></iframe>`
    : `<video controls src="${esc(v.url)}"></video>`;
};

function renderPortfolio() {
  const box = $("#portfolioGrid");
  if (!data.projects.length) { box.innerHTML = `<div class="empty-state">Belum ada project portfolio.</div>`; return; }
  box.innerHTML = data.projects.map(p => `
    <article class="project-card">
      <p class="eyebrow">${esc(p.date)}</p>
      <h4>${esc(p.title)}</h4>
      <p>${esc(p.description || "Project pribadi.")}</p>
      ${p.link ? `<a class="project-link" href="${esc(p.link)}" target="_blank" rel="noopener">Open project ↗</a>`:""}
      <button class="delete-btn" style="position:absolute;right:15px;top:15px" onclick="deleteItem('projects',${p.id})">×</button>
    </article>`).join("");
}

function renderNotes() {
  const box = $("#notesGrid");
  if (!data.notes.length) { box.innerHTML = `<div class="empty-state">Belum ada catatan.</div>`; return; }
  box.innerHTML = data.notes.map(n => `
    <article class="note-card">
      <span class="note-date">${esc(n.date)}</span>
      <h4>${esc(n.title)}</h4>
      <p>${esc(n.content || "")}</p>
      <button class="delete-btn" style="margin-top:16px" onclick="deleteItem('notes',${n.id})">Delete</button>
    </article>`).join("");
}

function renderDashboard() {
  $("#journalCount").textContent = data.journals.length;
  $("#videoCount").textContent = data.videos.length;
  $("#projectCount").textContent = data.projects.length;
  $("#noteCount").textContent = data.notes.length;
  const items = [
    ...data.journals.map(x => ({type:"Journal",title:x.title,date:x.date})),
    ...data.videos.map(x => ({type:"Video",title:x.title,date:x.date})),
    ...data.projects.map(x => ({type:"Project",title:x.title,date:x.date})),
    ...data.notes.map(x => ({type:"Note",title:x.title,date:x.date}))
  ].slice(0,6);
  $("#latestActivity").classList.toggle("empty-state", !items.length);
  $("#latestActivity").innerHTML = items.length ? items.map(x =>
    `<div class="activity-item"><span><b>${esc(x.type)}</b> — ${esc(x.title)}</span><small>${esc(x.date)}</small></div>`
  ).join("") : "Belum ada aktivitas. Mulai dari Journal atau Video.";
}

function renderAll() {
  renderDashboard(); renderJournal(); renderVideos(); renderPortfolio(); renderNotes();
}

$("#themePulse").addEventListener("click", () => {
  document.documentElement.style.setProperty("--red", "#111");
  document.documentElement.style.setProperty("--red2", "#eee");
  setTimeout(() => {
    document.documentElement.style.setProperty("--red", "#6d001a");
    document.documentElement.style.setProperty("--red2", "#930026");
  }, 350);
});

if (localStorage.getItem("rifxUser")) showApp();
