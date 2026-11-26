const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const statusName = {available:"Үйге беруге дайын",reserved:"Броньдалған",adopted:"Үйге берілген",treatment:"Емделуде",archived:"Мұрағатта"};
const ERR = "Деректерді жүктеу мүмкін болмады. Сервер қосулы ма?";

async function api(url, opts) {
  const r = await fetch(url, opts);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "Қате");
  return data;
}
function ageText(birth) {
  if (!birth) return "";
  const b = new Date(birth), n = new Date();
  const m = (n.getFullYear() - b.getFullYear()) * 12 + n.getMonth() - b.getMonth();
  return m < 12 ? Math.max(m, 1) + " ай" : Math.floor(m / 12) + " жас";
}
function norm(a) {
  const dog = a.species === "Ит";
  return {
    id: a.id, name: a.name, species: a.species, status: a.status,
    emoji: dog ? "🐕" : "🐈", photo: a.photo_url,
    age: ageText(a.birth_date), sex: a.sex === "M" ? "Ұл" : "Қыз",
    vaccinated: a.vaccinated,
    note: a.description || (a.vaccinated ? "Егілген, үйге беруге дайын." : "Үйге беруге дайын."),
    story: a.description || "Бұл жануар жаңа отбасын күтіп тұр. Толығырақ білу үшін бізге жазыңыз."
  };
}
function picHTML(a) {
  return a.photo
    ? `<img src="${esc(a.photo)}" alt="${esc(a.name)}" loading="lazy" onerror="this.replaceWith(document.createTextNode('${a.emoji}'))">`
    : a.emoji;
}
function cardHTML(a) {
  return `<article class="card"><div class="pic">${picHTML(a)}</div><div class="body">
    <h3>${esc(a.name)}</h3><div class="meta">${esc(a.species)} · ${esc(a.age)} · ${esc(a.sex)}</div>
    <div>${esc(a.note)}</div>
    <a class="btn" href="animal.html?id=${a.id}">Толығырақ</a></div></article>`;
}

(async () => {
  const featured = document.getElementById("featured");
  const grid = document.getElementById("grid");
  const detail = document.getElementById("detail");

  if (featured || grid) {
    let animals = [];
    try { animals = (await api("/api/animals")).map(norm); }
    catch (e) { (featured || grid).innerHTML = `<p>${ERR}</p>`; return; }

    const count = document.getElementById("count");
    if (count) count.textContent = animals.length;
    if (featured) featured.innerHTML = animals.slice(0, 3).map(cardHTML).join("");

    if (grid) {
      const fEl = document.getElementById("filters");
      const types = [["all","Барлығы"],["Ит","Иттер"],["Мысық","Мысықтар"]];
      let cur = "all";
      const render = () => {
        fEl.innerHTML = types.map(t => `<button class="chip ${t[0]===cur?"on":""}" data-t="${t[0]}" type="button">${t[1]}</button>`).join("");
        grid.innerHTML = animals.filter(a => cur === "all" || a.species === cur).map(cardHTML).join("");
      };
      fEl.addEventListener("click", e => { const b = e.target.closest("[data-t]"); if (b) { cur = b.dataset.t; render(); } });
      render();
    }
  }

  if (detail) {
    const id = Number(new URLSearchParams(location.search).get("id"));
    try {
      const a = norm(await api("/api/animals/" + id));
      document.title = a.name + " — Дос жүрек";
      const can = a.status === "available";
      detail.innerHTML = `<div class="pic">${picHTML(a)}</div><div>
        <h1>${esc(a.name)}</h1>
        <div class="tags"><span class="tag">${esc(a.species)}</span><span class="tag">${esc(a.age)}</span><span class="tag">${esc(a.sex)}</span>
        <span class="tag">${a.vaccinated ? "Егілген ✔" : "Егу жоспарда"}</span><span class="tag">${esc(statusName[a.status] || a.status)}</span></div>
        <p>${esc(a.story)}</p>
        ${can ? `<a class="btn" href="contact.html?animal_id=${a.id}&animal=${encodeURIComponent(a.name)}">Үйге алғым келеді</a><br>` : ""}
        <a class="back" href="animals.html">← Барлық жануарларға</a></div>`;
    } catch (e) { detail.innerHTML = `<p>${esc(e.message === "Қате" ? ERR : e.message)}</p>`; }
  }

  const send = document.getElementById("send");
  if (send) {
    const q = new URLSearchParams(location.search);
    const animalId = Number(q.get("animal_id")), pet = q.get("animal");
    const petEl = document.getElementById("pet"), m = document.getElementById("msg");
    petEl.innerHTML = animalId
      ? "Таңдалған жануар: <b>" + esc(pet) + "</b>"
      : 'Алдымен <a href="animals.html">жануарды таңдаңыз</a>.';
    send.addEventListener("click", async () => {
      const body = {
        animal_id: animalId,
        full_name: document.getElementById("n").value,
        phone: document.getElementById("ph").value,
        email: document.getElementById("em").value
      };
      try {
        await api("/api/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        m.textContent = "Рахмет! Сұраныс қабылданды, біз сізбен байланысамыз.";
      } catch (e) { m.textContent = e.message; }
    });
  }
})();
