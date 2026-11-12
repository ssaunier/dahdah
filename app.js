(function () {
  const { scriptUrl, goal } = window.PETITION_CONFIG;
  const form = document.getElementById("petition-form");
  const errorEl = document.getElementById("form-error");
  const submitBtn = document.getElementById("submit-btn");

  function showCount(count) {
    if (typeof count !== "number") return;
    document.getElementById("count").textContent = count;
    document.getElementById("counter").hidden = false;
    document.getElementById("progress-count").textContent = count;
    document.getElementById("progress-goal").textContent = goal;
    document.getElementById("progress-fill").style.width =
      Math.min(100, (count / goal) * 100) + "%";
    document.getElementById("progress").hidden = false;
  }

  async function loadCount() {
    if (!scriptUrl) return;
    try {
      const res = await fetch(scriptUrl);
      const data = await res.json();
      showCount(data.count);
    } catch (e) {
      /* compteur indisponible : on n'affiche rien */
    }
  }

  function fail(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  // --- Profil : boulevard (n°) ou quartier (adresse complète) ---
  const addrBd = document.getElementById("addr-bd");
  const addrQuartier = document.getElementById("addr-quartier");
  const isQuartier = () => form.profil.value === "Habitant(e) du quartier";
  form.querySelectorAll('input[name="profil"]').forEach((r) =>
    r.addEventListener("change", () => {
      addrBd.hidden = isQuartier();
      addrQuartier.hidden = !isQuartier();
      (isQuartier() ? form.adresse : form.numero).focus();
    })
  );

  // --- Autocomplétion d'adresse : Géoplateforme IGN (ex-API Adresse / BAN) ---
  const input = document.getElementById("adresse");
  const list = document.getElementById("adresse-list");
  let items = [];
  let active = -1;
  let timer;
  let controller;

  function close() {
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    active = -1;
  }

  function render() {
    list.innerHTML = "";
    items.forEach((label, i) => {
      const li = document.createElement("li");
      li.setAttribute("role", "option");
      li.textContent = label;
      li.setAttribute("aria-selected", i === active);
      li.addEventListener("mousedown", (e) => {
        e.preventDefault();
        pick(i);
      });
      list.appendChild(li);
    });
    list.hidden = items.length === 0;
    input.setAttribute("aria-expanded", String(!list.hidden));
  }

  function pick(i) {
    input.value = items[i];
    close();
  }

  async function search(q) {
    controller?.abort();
    controller = new AbortController();
    const query = /marseille|130\d\d/i.test(q) ? q : q + " Marseille";
    const url =
      "https://data.geopf.fr/geocodage/search?index=address&autocomplete=1&limit=8" +
      "&lat=43.3103&lon=5.3946&q=" + encodeURIComponent(query);
    try {
      const res = await fetch(url, { signal: controller.signal });
      const json = await res.json();
      items = json.features
        .map((f) => f.properties)
        .filter((p) => /^130\d\d$/.test(p.postcode)) // Marseille uniquement
        .map((p) => p.label)
        .slice(0, 5);
      active = -1;
      render();
    } catch (e) {
      /* réseau / abort : on laisse la saisie libre */
    }
  }

  input.addEventListener("input", () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 3) return close();
    timer = setTimeout(() => search(q), 200);
  });
  input.addEventListener("keydown", (e) => {
    if (list.hidden) return;
    if (e.key === "ArrowDown") active = Math.min(active + 1, items.length - 1);
    else if (e.key === "ArrowUp") active = Math.max(active - 1, 0);
    else if (e.key === "Enter" && active >= 0) pick(active);
    else if (e.key === "Escape") close();
    else return;
    e.preventDefault();
    if (!list.hidden) render();
  });
  input.addEventListener("blur", close);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorEl.hidden = true;

    const data = Object.fromEntries(new FormData(form));
    data.prenom = (data.prenom || "").trim();
    data.nom = (data.nom || "").trim();
    data.numero = (data.numero || "").trim();
    data.adresse = (data.adresse || "").trim();
    data.consentement = form.consentement.checked;

    if (!data.prenom || !data.nom) return fail("Merci d'indiquer votre prénom et votre nom.");
    if (isQuartier()) {
      data.numero = "";
      if (data.adresse.length < 5) return fail("Merci d'indiquer votre adresse.");
    } else {
      data.adresse = "";
      if (!/^\d{1,4}\s?(bis|ter|[a-z])?$/i.test(data.numero))
        return fail("Merci d'indiquer votre numéro dans le boulevard (ex : 12, 12 bis).");
    }
    if (!data.consentement)
      return fail("Merci de cocher la case de consentement pour que votre signature soit prise en compte.");

    submitBtn.disabled = true;
    submitBtn.textContent = "Envoi…";

    try {
      if (scriptUrl) {
        // text/plain = requête "simple", pas de preflight CORS côté Apps Script
        const res = await fetch(scriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || "Erreur");
        showCount(json.count);
      } else {
        console.warn("Mode démo : aucune URL Apps Script configurée (config.js).");
      }
      document.getElementById("thanks-name").textContent = data.prenom;
      form.hidden = true;
      document.getElementById("thanks").hidden = false;
    } catch (e) {
      fail(
        e.message && e.message !== "Erreur" && !e.message.includes("fetch")
          ? e.message
          : "Oups, l'envoi a échoué. Vérifiez votre connexion et réessayez."
      );
      submitBtn.disabled = false;
      submitBtn.textContent = "Je signe";
    }
  });

  document.getElementById("share-btn").addEventListener("click", async () => {
    const shareData = {
      title: "Pétition — Un boulevard Dahdah propre",
      text: "J'ai signé la pétition pour un nettoyage régulier du boulevard Dahdah. Signez aussi !",
      url: location.origin + location.pathname,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (e) {}
    } else {
      await navigator.clipboard.writeText(shareData.url);
      document.getElementById("share-btn").textContent = "Lien copié !";
    }
  });

  loadCount();
})();
