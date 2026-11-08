// Anmeldeliste + provisorische Startliste Nachtloipencup: lädt die öffentliche CSV-
// Exportdatei aus ClubDesk und rendert daraus die Anmeldeliste sowie pro Renndatum
// eine generierte Startliste gemäss STARTLISTE-REGELN.md. Mount-Element: #nlc-startliste-mount
//
// Hinweis: Die URL enthält ein von ClubDesk generiertes Signatur-Token (s=...).
// Falls ClubDesk das Dokument neu hochlädt/ersetzt, kann sich dieses Token ändern
// und muss hier aktualisiert werden (neue "Link kopieren"-URL aus ClubDesk holen).
(function () {
  var CSV_URL = "https://www.scdavos.ch/clubdesk/fileservlet?type=file&id=1000725&s=djEtUMoXkZ5uJrzAp4eg4XLLUlNaIs5Ot-PC2f5jzi7lhI0=";
  var MOUNT_ID = "nlc-startliste-mount";

  // Kategorie-Reihenfolge und Wellen-Zuordnung, siehe STARTLISTE-REGELN.md.
  var CATEGORY_ORDER = [
    { name: "U10 Mädchen (2017/18)", wave: 0 },
    { name: "U10 Knaben (2017/18)", wave: 0 },
    { name: "U12 Mädchen (2015/16)", wave: 0 },
    { name: "U12 Knaben (2015/16)", wave: 0 },
    { name: "U14 Mädchen (2013/14)", wave: 1 },
    { name: "U14 Knaben (2013/14)", wave: 1 },
    { name: "U16 Mädchen (2011/12)", wave: 1 },
    { name: "U16 Knaben (2011/12)", wave: 1 },
    { name: "Juniorinnen Frauen (2007/08/09/10)", wave: 1 },
    { name: "Frauen (ab Jg. 2006)", wave: 1 },
    { name: "Fun (offen für alle)", wave: 1 },
    { name: "Junior Männer (2007/08/09/10)", wave: 2 },
    { name: "Männer (ab Jg. 2006)", wave: 2 }
  ];

  // Wellen-Startzeiten je Renndatum (siehe Kategorien-Tabelle auf der Hauptseite).
  // "match" wird gegen den Anfang des CSV-Spaltentitels geprüft.
  var RACE_DATE_WAVE_TIMES = [
    { match: "10. Dezember 2026", waveTimes: ["18:30:00", "18:45:00", "19:05:00"] },
    { match: "21. Januar 2027", waveTimes: ["18:30:00", "18:45:00", "19:05:00"] },
    { match: "18. Februar 2027", waveTimes: ["18:30:00", "18:45:00", "19:05:00"] },
    { match: "25. März 2027", waveTimes: ["18:00:00", "18:15:00", "18:35:00"] }
  ];
  var DEFAULT_WAVE_TIMES = ["18:30:00", "18:45:00", "19:05:00"];

  var SLOT_SECONDS = 30;
  var RESERVE_SLOTS_BETWEEN_CATEGORIES = 2;

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

  function waveTimesFor(header) {
    for (var i = 0; i < RACE_DATE_WAVE_TIMES.length; i++) {
      if (header.indexOf(RACE_DATE_WAVE_TIMES[i].match) === 0) return RACE_DATE_WAVE_TIMES[i].waveTimes;
    }
    console.warn("Nachtloipencup Startliste: keine Wellen-Startzeiten konfiguriert für", header, "- verwende Standardzeiten.");
    return DEFAULT_WAVE_TIMES;
  }

  function categoryInfo(name) {
    var trimmed = (name || "").trim();
    for (var i = 0; i < CATEGORY_ORDER.length; i++) {
      if (CATEGORY_ORDER[i].name === trimmed) return CATEGORY_ORDER[i];
    }
    return null;
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

  // Wandelt "08.11.2026 14:11:09" in einen vergleichbaren Zeitstempel (ms) um.
  // Nicht parsbare Werte landen ans Ende (Number.MAX_SAFE_INTEGER), statt den Sort zu verfälschen.
  function parseErhaltenAm(str) {
    var m = (str || "").trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})/);
    if (!m) return Number.MAX_SAFE_INTEGER;
    return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5], +m[6]).getTime();
  }

  function addSeconds(hms, seconds) {
    var parts = hms.split(":").map(Number);
    var total = parts[0] * 3600 + parts[1] * 60 + parts[2] + seconds;
    var h = Math.floor(total / 3600) % 24;
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    return pad(h) + ":" + pad(m) + ":" + pad(s);
  }

  // Spaltenindizes werden anhand der Kopfzeilen-Texte ermittelt (nicht per fixer Position),
  // da ClubDesk die Spaltenreihenfolge im CSV-Export ändern kann.
  var FIXED_COLUMNS = ["Vorname", "Nachname", "Erhalten am", "Jahrgang", "Skiclub", "E-Mail", "Kategorie"];

  function findColumn(header, name) {
    for (var i = 0; i < header.length; i++) {
      if (header[i].trim() === name) return i;
    }
    return -1;
  }

  function buildEntries(header, rows) {
    var vornameIdx = findColumn(header, "Vorname");
    var nachnameIdx = findColumn(header, "Nachname");
    var erhaltenAmIdx = findColumn(header, "Erhalten am");
    var jahrgangIdx = findColumn(header, "Jahrgang");
    var skiclubIdx = findColumn(header, "Skiclub");
    var kategorieIdx = findColumn(header, "Kategorie");

    var dateColIndexes = [];
    for (var h = 0; h < header.length; h++) {
      if (FIXED_COLUMNS.indexOf(header[h].trim()) === -1) dateColIndexes.push(h);
    }

    return rows.map(function (r) {
      return {
        vorname: (r[vornameIdx] || "").trim(),
        nachname: (r[nachnameIdx] || "").trim(),
        erhaltenAm: parseErhaltenAm(r[erhaltenAmIdx]),
        jahrgang: (r[jahrgangIdx] || "").trim(),
        skiclub: (r[skiclubIdx] || "").trim(),
        kategorie: (r[kategorieIdx] || "").trim(),
        rennen: dateColIndexes
          .filter(function (idx) { return (r[idx] || "").trim().toLowerCase() === "ja"; })
      };
    });
  }

  // Gruppiert Teilnehmer einer einzelnen Renndatums-Spalte nach Kategorie (in fester Reihenfolge),
  // unbekannte Kategorien landen gesammelt am Ende.
  //
  // Reihenfolge innerhalb der Kategorie: nach Anmeldezeitpunkt (Erhalten am), nicht zufällig.
  // Nur so bleiben Startnummer/-zeit bestehender Anmeldungen stabil, wenn später jemand
  // Neues dazukommt (neue Person hat immer einen späteren Zeitstempel -> wird immer ans Ende gehängt).
  function groupByCategory(entrants) {
    var buckets = CATEGORY_ORDER.map(function (c) { return { category: c, entrants: [] }; });
    var unknown = { category: { name: "Weitere", wave: 3 }, entrants: [] };

    entrants.forEach(function (e) {
      var info = categoryInfo(e.kategorie);
      var bucket = info ? buckets[CATEGORY_ORDER.indexOf(info)] : unknown;
      bucket.entrants.push(e);
    });

    buckets = buckets.concat(unknown.entrants.length ? [unknown] : []);

    buckets.forEach(function (b) {
      b.entrants = b.entrants.slice().sort(function (a, c) { return a.erhaltenAm - c.erhaltenAm; });
    });

    return buckets.filter(function (b) { return b.entrants.length > 0; });
  }

  function renderMassenstart(buckets, waveTimes) {
    var waves = [[], [], [], []];
    buckets.forEach(function (b) { waves[b.category.wave].push(b); });

    var html = '<div class="nlc-sl-table-wrap"><table class="nlc-sl-table"><thead><tr>';
    html += "<th>Nr.</th><th>Startzeit</th><th>Nachname</th><th>Vorname</th><th>Jahrgang</th><th>Skiclub</th><th>Kategorie</th></tr></thead><tbody>";

    var bib = 1;
    var catCounter = 0;
    waves.forEach(function (waveBuckets, waveIdx) {
      if (waveBuckets.length === 0) return;
      var time = waveIdx < waveTimes.length ? waveTimes[waveIdx] : waveTimes[waveTimes.length - 1];
      waveBuckets.forEach(function (b, bIdx) {
        var catClass = "nlc-sl-cat-" + (catCounter % 2);
        b.entrants.forEach(function (e, eIdx) {
          var rowClass = catClass + (eIdx === 0 ? " nlc-sl-cat-start" : "");
          html += '<tr class="' + rowClass + '"><td>' + bib + "</td><td>" + time + "</td><td>" + escapeHtml(e.nachname) + "</td><td>" +
            escapeHtml(e.vorname) + "</td><td>" + escapeHtml(e.jahrgang) + "</td><td>" + escapeHtml(e.skiclub) +
            "</td><td>" + escapeHtml(b.category.name) + "</td></tr>";
          bib++;
        });
        catCounter++;

        for (var r = 0; r < RESERVE_SLOTS_BETWEEN_CATEGORIES; r++) {
          html += '<tr class="nlc-sl-reserve"><td>' + bib + "</td><td>" + time +
            '</td><td colspan="5"><em>frei (Nachmeldung)</em></td></tr>';
          bib++;
        }
      });
    });

    html += "</tbody></table></div>";
    return html;
  }



  function renderEinzelstart(buckets, waveTimes) {
    var waves = [[], [], [], []];
    buckets.forEach(function (b) { waves[b.category.wave].push(b); });

    var html = '<div class="nlc-sl-table-wrap"><table class="nlc-sl-table"><thead><tr>';
    html += "<th>Nr.</th><th>Startzeit</th><th>Nachname</th><th>Vorname</th><th>Jahrgang</th><th>Skiclub</th><th>Kategorie</th></tr></thead><tbody>";

    var bib = 1;
    var catCounter = 0;
    waves.forEach(function (waveBuckets, waveIdx) {
      if (waveBuckets.length === 0) return;
      var time = waveIdx < waveTimes.length ? waveTimes[waveIdx] : waveTimes[waveTimes.length - 1];

      waveBuckets.forEach(function (b, bIdx) {
        var catClass = "nlc-sl-cat-" + (catCounter % 2);
        b.entrants.forEach(function (e, eIdx) {
          var rowClass = catClass + (eIdx === 0 ? " nlc-sl-cat-start" : "");
          html += '<tr class="' + rowClass + '"><td>' + bib + "</td><td>" + time + "</td><td>" + escapeHtml(e.nachname) +
            "</td><td>" + escapeHtml(e.vorname) + "</td><td>" + escapeHtml(e.jahrgang) + "</td><td>" +
            escapeHtml(e.skiclub) + "</td><td>" + escapeHtml(b.category.name) + "</td></tr>";
          bib++;
          time = addSeconds(time, SLOT_SECONDS);
        });
        catCounter++;

        for (var r = 0; r < RESERVE_SLOTS_BETWEEN_CATEGORIES; r++) {
          html += '<tr class="nlc-sl-reserve"><td>' + bib + "</td><td>" + time +
            '</td><td colspan="5"><em>frei (Nachmeldung)</em></td></tr>';
          bib++;
          time = addSeconds(time, SLOT_SECONDS);
        }
      });
    });

    html += "</tbody></table></div>";
    return html;
  }

  function renderAnmeldeliste(entries) {
    var sorted = entries.slice().sort(function (a, b) {
      return a.nachname.localeCompare(b.nachname, "de") || a.vorname.localeCompare(b.vorname, "de");
    });

    var html = '<div class="nlc-sl-wrap">';
    html += '<h3>Anmeldeliste</h3>';
    html += '<p class="nlc-sl-count">' + sorted.length + " Anmeldung" + (sorted.length === 1 ? "" : "en") + "</p>";
    html += '<div class="nlc-sl-table-wrap"><table class="nlc-sl-table"><thead><tr>';
    html += "<th>Nachname</th><th>Vorname</th><th>Jahrgang</th><th>Skiclub</th><th>Kategorie</th><th>Rennen</th>";
    html += "</tr></thead><tbody>";
    sorted.forEach(function (e) {
      html += "<tr>";
      html += "<td>" + escapeHtml(e.nachname) + "</td>";
      html += "<td>" + escapeHtml(e.vorname) + "</td>";
      html += "<td>" + escapeHtml(e.jahrgang) + "</td>";
      html += "<td>" + escapeHtml(e.skiclub) + "</td>";
      html += "<td>" + escapeHtml(e.kategorie) + "</td>";
      html += "<td>" + e.rennenLabels.join(", ") + "</td>";
      html += "</tr>";
    });
    html += "</tbody></table></div></div>";
    return html;
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
    for (var h = 0; h < header.length; h++) {
      if (FIXED_COLUMNS.indexOf(header[h].trim()) === -1) dateColIndexes.push(h);
    }

    var entries = buildEntries(header, rows.slice(1));
    entries.forEach(function (e) {
      e.rennenLabels = e.rennen.map(function (idx) { return shortDate(header[idx]); });
    });

    var html = renderAnmeldeliste(entries);

    var races = dateColIndexes
      .map(function (idx) {
        var raceHeader = header[idx];
        var entrants = entries.filter(function (e) { return e.rennen.indexOf(idx) !== -1; });
        return { idx: idx, header: raceHeader, entrants: entrants };
      })
      .filter(function (r) { return r.entrants.length > 0; });

    html += '<div class="nlc-sl-wrap"><h3>Provisorische Startlisten</h3>';
    html += '<p class="nlc-sl-disclaimer">⚠️ Diese Startliste ist <strong>provisorisch</strong>, solange die Anmeldung l\u00e4uft. ' +
      'Startnummern und Startzeiten k\u00f6nnen sich bis zum Anmeldeschluss noch \u00e4ndern. ' +
      'Die definitive Startnummer erh\u00e4ltst du an der Startnummernausgabe vor Ort.</p>';

    html += '<label class="nlc-sl-race-label" for="nlc-sl-race-select">Rennen ausw\u00e4hlen: </label>';
    html += '<select id="nlc-sl-race-select" class="nlc-sl-race-select"><option value="all">Alle Rennen</option>';
    races.forEach(function (r, i) {
      html += '<option value="' + i + '">' + escapeHtml(r.header) + "</option>";
    });
    html += "</select>";

    races.forEach(function (r, i) {
      var isMassenstart = r.header.toLowerCase().indexOf("massenstart") !== -1;
      var waveTimes = waveTimesFor(r.header);
      var buckets = groupByCategory(r.entrants);

      html += '<div class="nlc-sl-race-section" data-race-index="' + i + '">';
      html += '<h4 class="nlc-sl-race">' + escapeHtml(r.header) + "</h4>";
      html += isMassenstart ? renderMassenstart(buckets, waveTimes) : renderEinzelstart(buckets, waveTimes);
      html += "</div>";
    });
    html += "</div>";

    mount.innerHTML = html;

    var select = document.getElementById("nlc-sl-race-select");
    var sections = mount.querySelectorAll(".nlc-sl-race-section");
    if (select) {
      select.addEventListener("change", function () {
        sections.forEach(function (section) {
          var show = select.value === "all" || section.getAttribute("data-race-index") === select.value;
          section.style.display = show ? "" : "none";
        });
      });
    }
  }

  function injectStyle() {
    if (document.getElementById("nlc-sl-style")) return;
    var style = document.createElement("style");
    style.id = "nlc-sl-style";
    style.textContent =
      ".nlc-sl-wrap{max-width:860px;margin:0 auto;padding:1.5rem 1rem;color:#1b2436;font-size:1rem;}" +
      ".nlc-sl-wrap h3{color:#16213e;}" +
      ".nlc-sl-count{font-weight:600;color:#16213e;margin:0 0 .75rem;}" +
      ".nlc-sl-race{margin:2rem 0 .5rem;padding-bottom:.3rem;border-bottom:3px solid #cdb97a;color:#16213e;}" +
      ".nlc-sl-disclaimer{background:#fdf6e3;border:1px solid #e3d7b0;border-radius:8px;padding:.7rem 1rem;font-size:.9rem;color:#5b4b1f;}" +
      ".nlc-sl-race-label{font-weight:600;color:#16213e;}" +
      ".nlc-sl-race-select{margin:.5rem 0 1rem;padding:.4rem .6rem;border-radius:6px;border:1px solid #cdb97a;font-size:.95rem;}" +
      ".nlc-sl-wave{margin:1.2rem 0 .3rem;color:#16213e;}" +
      ".nlc-sl-category{font-weight:600;margin:.8rem 0 .3rem;}" +
      ".nlc-sl-table-wrap{overflow-x:auto;border-radius:10px;box-shadow:0 2px 10px rgba(22,33,62,.08);margin-bottom:.5rem;}" +
      ".nlc-sl-table{width:100%;border-collapse:collapse;font-size:.92rem;}" +
      ".nlc-sl-table thead th{background:#16213e;color:#eaf6ff;text-align:left;padding:.6rem .8rem;}" +
      ".nlc-sl-table tbody td{padding:.55rem .8rem;border-bottom:1px solid #e7e0cc;}" +
      ".nlc-sl-table tbody tr.nlc-sl-cat-0{background:#ffffff;}" +
      ".nlc-sl-table tbody tr.nlc-sl-cat-1{background:#f7f5ee;}" +
      ".nlc-sl-table tbody tr.nlc-sl-cat-start td{border-top:2px solid #cdb97a;}" +
      ".nlc-sl-table tbody tr.nlc-sl-reserve td{color:#9aa3b2;font-style:italic;}" +
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
