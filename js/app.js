const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const typeName = {dog:"Ит",cat:"Мысық"};

function picHTML(a){
  return a.photo
    ? `<img src="${esc(a.photo)}" alt="${esc(a.name)}" loading="lazy" onerror="this.replaceWith(document.createTextNode('${a.emoji}'))">`
    : a.emoji;
}

function cardHTML(a){
  return `<article class="card"><div class="pic">${picHTML(a)}</div><div class="body">
    <h3>${esc(a.name)}</h3><div class="meta">${esc(typeName[a.type])} · ${esc(a.age)} · ${esc(a.sex)}</div>
    <div>${esc(a.note)}</div>
    <a class="btn" href="animal.html?id=${a.id}">Толығырақ</a></div></article>`;
}

const featured = document.getElementById("featured");
if (featured) featured.innerHTML = animals.slice(0,3).map(cardHTML).join("");
const count = document.getElementById("count");
if (count) count.textContent = animals.length;

const grid = document.getElementById("grid");
if (grid) {
  const fEl = document.getElementById("filters");
  const types = [["all","Барлығы"],["dog","Иттер"],["cat","Мысықтар"]];
  let cur = "all";
  const render = () => {
    fEl.innerHTML = types.map(t => `<button class="chip ${t[0]===cur?"on":""}" data-t="${t[0]}" type="button">${t[1]}</button>`).join("");
    grid.innerHTML = animals.filter(a => cur==="all" || a.type===cur).map(cardHTML).join("");
  };
  fEl.addEventListener("click", e => { const b = e.target.closest("[data-t]"); if (b){ cur = b.dataset.t; render(); }});
  render();
}

const detail = document.getElementById("detail");
if (detail) {
  const id = Number(new URLSearchParams(location.search).get("id"));
  const a = animals.find(x => x.id === id);
  if (!a) {
    detail.innerHTML = `<p>Жануар табылмады.</p>`;
  } else {
    document.title = a.name + " — Дос жүрек";
    detail.innerHTML = `<div class="pic">${picHTML(a)}</div><div>
      <h1>${esc(a.name)}</h1>
      <div class="tags"><span class="tag">${esc(typeName[a.type])}</span><span class="tag">${esc(a.age)}</span><span class="tag">${esc(a.sex)}</span>
      <span class="tag">${a.vaccinated ? "Егілген ✔" : "Егу жоспарда"}</span></div>
      <p>${esc(a.story)}</p>
      <a class="btn" href="contact.html?animal=${encodeURIComponent(a.name)}">Үйге алғым келеді</a><br>
      <a class="back" href="animals.html">← Барлық жануарларға</a></div>`;
  }
}

const send = document.getElementById("send");
if (send) {
  const pet = new URLSearchParams(location.search).get("animal");
  if (pet) document.getElementById("t").value = "Мен " + pet + " жануарын үйге алғым келеді.";
  send.addEventListener("click", () => {
    const n = document.getElementById("n").value.trim(), t = document.getElementById("t").value.trim();
    const m = document.getElementById("msg");
    if (!n || !t) { m.textContent = "Атыңызды және хабарламаны толтырыңыз."; return; }
    m.textContent = "Рахмет, " + n + "! Біз сізбен жақын арада байланысамыз.";
  });
}