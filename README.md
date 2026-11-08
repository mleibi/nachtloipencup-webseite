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

`src/startliste/startliste.js` lädt bei jedem Seitenaufruf live die öffentliche CSV-Exportdatei der ClubDesk-Anmeldetabelle ("Nachtloipencup Anmeldeliste 2026/27", via `fileservlet`-Link) und rendert daraus eine sortierte Tabelle (Nachname, Vorname, Jahrgang, Skiclub, Kategorie, angemeldete Renndaten). E-Mail-Adresse und Anmeldezeitpunkt werden aus Datenschutzgründen nicht angezeigt.

Die CSV-URL enthält ein von ClubDesk generiertes Signatur-Token. Falls ClubDesk das Dokument ersetzt/neu hochlädt, ändert sich dieses Token und muss in `startliste.js` (Variable `CSV_URL`) aktualisiert werden.

