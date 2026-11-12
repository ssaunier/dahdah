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

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorEl.hidden = true;

    const data = Object.fromEntries(new FormData(form));
    data.prenom = (data.prenom || "").trim();
    data.nom = (data.nom || "").trim();
    data.numero = (data.numero || "").trim();
    data.consentement = form.consentement.checked;

    if (!data.prenom || !data.nom) return fail("Merci d'indiquer votre prénom et votre nom.");
    if (!/^\d{1,4}\s?(bis|ter|[a-z])?$/i.test(data.numero))
      return fail("Merci d'indiquer votre numéro dans le boulevard (ex : 12, 12 bis).");
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
