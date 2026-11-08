// Anmeldeliste Nachtloipencup: lädt die öffentliche CSV-Exportdatei aus ClubDesk
// und rendert daraus eine sortierte Tabelle. Mount-Element: #nlc-startliste-mount
//
// Hinweis: Die URL enthält ein von ClubDesk generiertes Signatur-Token (s=...).
// Falls ClubDesk das Dokument neu hochlädt/ersetzt, kann sich dieses Token ändern
// und muss hier aktualisiert werden (neue "Link kopieren"-URL aus ClubDesk holen).
(function () {
  var CSV_URL = "https://www.scdavos.ch/clubdesk/fileservlet?type=file&id=1000725&s=djEtUMoXkZ5uJrzAp4eg4XLLUlNaIs5Ot-PC2f5jzi7lhI0=";
  var MOUNT_ID = "nlc-startliste-mount";

  var MONTHS = {
    "Januar": "01", "Februar": "02", "März": "03", "April": "04",
    "Mai": "05", "Juni": "06", "Juli": "07", "August": "08",
    "September": "09", "Oktober": "10", "November": "11", "Dezember": "12"
  };

  // Wandelt "10. Dezember 2026 - Davos - ..." in "10.12." um.
  function shortDate(header) {
    var m = header.match(/^(\d{1,2})\.\s*([A-Za-zÄÖÜäöü]+)\s*(\d{4})/);
    if (!m) return header;
    var day = m[1].length === 1 ? "0" + m[1] : m[1];
    var month = MONTHS[m[2]] || "??";
    return day + "." + month + ".";
  }

  // Einfacher CSV-Parser für ";"-getrennte, mit '"' gequotete Felder (inkl. "" als Escape).
  function parseCsv(text) {
    var rows = [];
    var row = [];
    var field = "";
    var inQuotes = false;
    var i = 0;

    function endField() {
      row.push(field);
      field = "";
    }
    function endRow() {
      endField();
      rows.push(row);
      row = [];
    }

    while (i < text.length) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        }
        field += c; i++; continue;
      }
      if (c === '"') { inQuotes = true; i++; continue; }
      if (c === ";") { endField(); i++; continue; }
      if (c === "\r") { i++; continue; }
      if (c === "\n") { endRow(); i++; continue; }
      field += c; i++;
    }
    if (field.length > 0 || row.length > 0) endRow();
    return rows.filter(function (r) { return r.length > 1 || r[0] !== ""; });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function render(rows) {
    var mount = document.getElementById(MOUNT_ID);
    if (!mount) return;

    if (rows.length < 2) {
      mount.innerHTML = '<p class="nlc-sl-empty">Noch keine Anmeldungen vorhanden.</p>';
      return;
    }

    var header = rows[0];
    var dateColIndexes = [];
    for (var h = 7; h < header.length; h++) dateColIndexes.push(h);

    var entries = rows.slice(1).map(function (r) {
      return {
        vorname: r[0] || "",
        nachname: r[2] || "",
        jahrgang: r[3] || "",
        skiclub: r[4] || "",
        kategorie: r[6] || "",
        rennen: dateColIndexes
          .filter(function (idx) { return (r[idx] || "").trim().toLowerCase() === "ja"; })
          .map(function (idx) { return shortDate(header[idx]); })
      };
    });

    entries.sort(function (a, b) {
      return a.nachname.localeCompare(b.nachname, "de") || a.vorname.localeCompare(b.vorname, "de");
    });

    var html = "";
    html += '<div class="nlc-sl-wrap">';
    html += '<p class="nlc-sl-count">' + entries.length + " Anmeldung" + (entries.length === 1 ? "" : "en") + "</p>";
    html += '<div class="nlc-sl-table-wrap"><table class="nlc-sl-table"><thead><tr>';
    html += "<th>Nachname</th><th>Vorname</th><th>Jahrgang</th><th>Skiclub</th><th>Kategorie</th><th>Rennen</th>";
    html += "</tr></thead><tbody>";
    entries.forEach(function (e) {
      html += "<tr>";
      html += "<td>" + escapeHtml(e.nachname) + "</td>";
      html += "<td>" + escapeHtml(e.vorname) + "</td>";
      html += "<td>" + escapeHtml(e.jahrgang) + "</td>";
      html += "<td>" + escapeHtml(e.skiclub) + "</td>";
      html += "<td>" + escapeHtml(e.kategorie) + "</td>";
      html += "<td>" + escapeHtml(e.rennen.join(", ")) + "</td>";
      html += "</tr>";
    });
    html += "</tbody></table></div></div>";
    mount.innerHTML = html;
  }

  function injectStyle() {
    if (document.getElementById("nlc-sl-style")) return;
    var style = document.createElement("style");
    style.id = "nlc-sl-style";
    style.textContent =
      ".nlc-sl-wrap{max-width:860px;margin:0 auto;padding:1.5rem 1rem;color:#1b2436;font-size:1rem;}" +
      ".nlc-sl-count{font-weight:600;color:#16213e;margin:0 0 .75rem;}" +
      ".nlc-sl-table-wrap{overflow-x:auto;border-radius:10px;box-shadow:0 2px 10px rgba(22,33,62,.08);}" +
      ".nlc-sl-table{width:100%;border-collapse:collapse;font-size:.92rem;}" +
      ".nlc-sl-table thead th{background:#16213e;color:#eaf6ff;text-align:left;padding:.6rem .8rem;}" +
      ".nlc-sl-table tbody td{padding:.55rem .8rem;border-bottom:1px solid #e7e0cc;}" +
      ".nlc-sl-table tbody tr:nth-child(even){background:#f7f5ee;}" +
      ".nlc-sl-empty{color:#5b6678;}";
    document.head.appendChild(style);
  }

  injectStyle();

  fetch(CSV_URL)
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.arrayBuffer();
    })
    .then(function (buffer) {
      // ClubDesk liefert den CSV-Export als Windows-1252 (nicht UTF-8), daher explizit dekodieren.
      var text = new TextDecoder("windows-1252").decode(buffer);
      render(parseCsv(text));
    })
    .catch(function (err) {
      var mount = document.getElementById(MOUNT_ID);
      if (mount) mount.innerHTML = '<p class="nlc-sl-empty">Anmeldeliste konnte nicht geladen werden.</p>';
      console.error("Nachtloipencup Startliste:", err);
    });
})();
