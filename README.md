# Nachtloipen Cup – Webseite

Code-Snippets und Assets für die Webseite des Nachtloipen Cup. Die Webseite selbst läuft auf [Clubdesk](https://www.clubdesk.com/) (Vereinsverwaltungs- und Homepage-Plattform); dieses Repo dient als Ablage für:

- HTML/CSS/JS-Snippets, die in Clubdesk's Custom-Code-Bereiche (z. B. Textbausteine, Header/Footer, individuelle Seiten) eingefügt werden
- Bilder und Logos, die auf der Webseite verwendet werden

## Struktur

```
src/
  header/       header.html (Quelle) + header-loader.html (in Clubdesk einfügen)
  mainpage/     mainpage-content.html (Quelle) + mainpage-content-loader.html (in Clubdesk einfügen)
  startliste/   startliste.js (Quelle, lädt Anmeldeliste live aus ClubDesk) + startliste-loader.html (in Clubdesk einfügen)
Bilder/           Strecken-Bilder und Vereinslogo (PNG/TIFF/EPS)
Helvetialogo/      Sponsor-Logo "Helvetia" in verschiedenen Formaten (EPS, PNG, SVG)
```

## Hinweise

- Clubdesk bietet keine native Versionierung für Custom Code – Änderungen werden hier versioniert und danach manuell in Clubdesk eingefügt.
- Bilder sollten in der jeweils benötigten Auflösung/Format direkt aus diesem Repo in Clubdesk hochgeladen werden.

## Automatisches Nachladen aus dem Repo

Damit Änderungen an `src/header/header.html` / `src/mainpage/mainpage-content.html` nicht mehr manuell in Clubdesk kopiert werden müssen, gibt es pro Snippet einen kleinen "Loader":

- `src/header/header-loader.html` → einmalig in den Clubdesk-Header-Bereich einfügen
- `src/mainpage/mainpage-content-loader.html` → einmalig in die Inhaltsseite einfügen

Diese Loader bestehen nur aus einem leeren `<div>` + einem kurzen Script, das den eigentlichen Inhalt zur Laufzeit von [jsDelivr](https://www.jsdelivr.com/) (CDN für GitHub-Repos) lädt und einfügt:

```
https://cdn.jsdelivr.net/gh/mleibi/nachtloipencup-webseite@main/src/header/header.html
https://cdn.jsdelivr.net/gh/mleibi/nachtloipencup-webseite@main/src/mainpage/mainpage-content.html
```

Nach dem einmaligen Einfügen der Loader in Clubdesk reicht es, die Dateien unter `src/` hier im Repo zu ändern und nach `main` zu pushen – die Webseite zeigt danach automatisch den neuen Inhalt. Ein GitHub Action Workflow ([.github/workflows/purge-jsdelivr.yml](.github/workflows/purge-jsdelivr.yml)) leert bei jedem Push den jsDelivr-Cache, damit die Änderung sofort (statt erst nach bis zu 24h CDN-Cache) sichtbar wird.

## Provisorische Startliste / Anmeldeliste

Die Seite zeigt zwei Abschnitte, die beide aus denselben Live-Daten generiert werden: zuerst die **Anmeldeliste** (flache Liste aller Anmeldungen), danach die **Provisorische Startliste** pro Renndatum (siehe [STARTLISTE-REGELN.md](src/startliste/STARTLISTE-REGELN.md) für die genauen Regeln). Der Mainpage-Button heisst bewusst "Anmeldeliste" (geläufigerer Begriff, matcht die ClubDesk-URL `/anmeldeliste`), auch wenn die Seite zusätzlich die Startliste enthält.

`src/startliste/startliste.js` lädt bei jedem Seitenaufruf live die öffentliche CSV-Exportdatei der ClubDesk-Anmeldetabelle ("Nachtloipencup Anmeldeliste 2026/27", via `fileservlet`-Link) und rendert daraus beide Abschnitte. E-Mail-Adresse wird aus Datenschutzgründen nie angezeigt; "Erhalten am" wird nur intern zur Sortierung verwendet.

Die CSV-URL enthält ein von ClubDesk generiertes Signatur-Token. Falls ClubDesk das Dokument ersetzt/neu hochlädt, ändert sich dieses Token und muss in `startliste.js` (Variable `CSV_URL`) aktualisiert werden.

## Lokale Test-Seite (kein produktiver Code)

`test/local-startliste.html` + `test/sample-anmeldeliste.csv` erlauben es, die Startlisten-Logik lokal mit echten (historischen) Beispieldaten zu überprüfen, ohne ClubDesk oder die Live-CSV anzufassen. Diese Dateien werden nirgends in Clubdesk eingefügt und sind nicht Teil der Loader-Kette.

Ausführen:

```
cd test
python3 -m http.server 8765
```

Danach `http://localhost:8765/local-startliste.html` im Browser öffnen (nicht direkt per `file://`, da `fetch()` der lokalen CSV sonst an CORS scheitert).

