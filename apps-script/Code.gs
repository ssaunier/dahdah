/**
 * Backend de la pétition — à coller dans la Google Sheet :
 *   Extensions > Apps Script > coller ce fichier > Déployer > Nouveau déploiement
 *   Type : Application Web · Exécuter en tant que : Moi · Accès : Tout le monde
 * Puis copier l'URL /exec dans config.js (scriptUrl).
 */

const SHEET_NAME = 'Signatures';
const HEADERS = ['Date', 'Prénom', 'Nom', 'Profil', 'N° bd Dahdah', 'Adresse', 'Consentement', 'Source'];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

function count_(sheet) {
  return Math.max(0, sheet.getLastRow() - 1);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Empêche l'injection de formules dans la feuille (=, +, -, @)
function clean_(value, max) {
  let s = String(value || '').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function doGet() {
  return json_({ ok: true, count: count_(getSheet_()) });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_();
    const p = JSON.parse(e.postData.contents || '{}');

    // Honeypot anti-robots : on fait semblant que tout va bien
    if (p.website) return json_({ ok: true, count: count_(sheet) });

    const prenom = clean_(p.prenom, 60);
    const nom = clean_(p.nom, 60);
    const profil = clean_(p.profil, 80);
    const adresse = clean_(p.adresse, 160);
    // N° extrait si l'adresse est sur le boulevard Dahdah (pour les stats)
    const m = adresse.match(/^(\d{1,4}\s?(bis|ter|[a-z])?)\b.*\b(boulevard|bd)\s+dahdah/i);
    const numero = m ? m[1] : '';

    if (!prenom || !nom || !adresse) return json_({ ok: false, error: 'Champs manquants.' });
    if (p.consentement !== true) return json_({ ok: false, error: 'Le consentement est requis.' });

    // Doublon (même prénom + nom + adresse)
    const key = [prenom, nom, adresse].join('|').toLowerCase();
    const rows = sheet.getLastRow() > 1
      ? sheet.getRange(2, 2, sheet.getLastRow() - 1, 5).getValues()
      : [];
    const duplicate = rows.some(r => [r[0], r[1], r[4]].join('|').toLowerCase() === key);
    if (duplicate) {
      return json_({ ok: false, error: 'Vous avez déjà signé cette pétition. Merci !' });
    }

    sheet.appendRow([new Date(), prenom, nom, profil, numero, adresse, 'oui', 'web']);
    return json_({ ok: true, count: count_(sheet) });
  } catch (err) {
    return json_({ ok: false, error: 'Erreur serveur.' });
  } finally {
    lock.releaseLock();
  }
}
