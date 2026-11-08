# Startliste-Regeln (Nachtloipencup)

Diese Regeln beschreiben, wie aus der Anmeldeliste (CSV-Export der ClubDesk-Tabelle, siehe [startliste.js](startliste.js)) pro Renndatum eine **Startliste** erzeugt wird. Gilt für die zukünftige Startliste-Funktion (noch nicht implementiert — reine Spezifikation).

## Datengrundlage

- Pro Renndatum (CSV-Spalte, z. B. `"10. Dezember 2026 - Davos - klassische Technik, Massenstart"`) werden nur Personen berücksichtigt, die für dieses Datum `"Ja"` angemeldet haben.
- Rennart (Massenstart / Einzelstart) wird aus dem Spaltentitel gelesen (enthält `"Massenstart"` oder `"Einzelstart"`).
- Die `Kategorie`-Spalte enthält einen der 13 exakten Werte aus dem Anmeldeformular:

  ```
  U10 Mädchen (2017/18)       U10 Knaben (2017/18)
  U12 Mädchen (2015/16)       U12 Knaben (2015/16)
  U14 Mädchen (2013/14)       U14 Knaben (2013/14)
  U16 Mädchen (2011/12)       U16 Knaben (2011/12)
  Juniorinnen Frauen (2007/08/09/10)
  Frauen (ab Jg. 2006)
  Junior Männer (2007/08/09/10)
  Männer (ab Jg. 2006)
  Fun (offen für alle)
  ```

## Kategorie-Reihenfolge & Wellen-Startzeiten

Kategorien starten in dieser festen Reihenfolge, gruppiert in drei "Wellen" (gemäss Haupttabelle auf der Webseite):

| Welle | Kategorien (in dieser Reihenfolge) | Start 10.12 / 21.1 / 18.2 | Start 25.3 |
|---|---|---|---|
| 1 | U10 Mädchen, U10 Knaben, U12 Mädchen, U12 Knaben | 18:30 | 18:00 |
| 2 | U14 Mädchen, U14 Knaben, U16 Mädchen, U16 Knaben, Juniorinnen Frauen, Frauen, Fun | 18:45 | 18:15 |
| 3 | Junior Männer, Männer | 19:05 | 18:35 |

(Reihenfolge innerhalb einer Welle: Mädchen/Frauen vor Knaben/Männer je Alterskategorie, wie in historischen Startlisten 2025.)

## Massenstart

- Alle Kategorien einer Welle starten **gemeinsam** zur Wellen-Startzeit.
- Pro Rennen eine Liste **gruppiert nach Kategorie**, innerhalb der Kategorie Teilnehmer in zufälliger, aber stabiler Reihenfolge (siehe Randomisierung unten).
- Keine individuellen Startzeiten pro Person nötig (nur die Wellen-Startzeit wird angezeigt).

## Einzelstart

- Fortlaufende Startnummern für das **gesamte Rennen** (nicht pro Kategorie neu beginnend).
- Innerhalb einer Kategorie startet jede Person **30 Sekunden** nach der vorherigen, beginnend bei der Wellen-Startzeit (bzw. bei der Startzeit, die sich aus der vorherigen Kategorie fortlaufend ergibt).
- Zwischen zwei Kategorien **derselben Welle** werden **2 reservierte Leer-Startplätze** (= 1 Minute, je 2×30s) eingefügt, für kurzfristige Nachmeldungen. Diese Plätze erscheinen in der Liste ohne Namen.
- Beim Wechsel zu einer **neuen Welle** springt die Uhrzeit direkt auf die nächste Wellen-Startzeit (keine zusätzlichen Leerplätze nötig, der Wellen-Abstand dient bereits als Puffer).

## Randomisierung

- Innerhalb jeder Kategorie wird die Reihenfolge der Teilnehmer **zufällig, aber deterministisch** bestimmt: ein seeded Pseudo-Zufallsgenerator (kein `Math.random()`), dessen Seed sich aus Renndatum + Kategorie-Name ableitet.
- Dieselbe Eingabe (gleiche Liste an Anmeldungen) ergibt bei jedem Seitenaufruf **exakt dieselbe Reihenfolge** — kein Neumischen bei jedem Laden.
- Ändert sich die Anmeldeliste (neue/gelöschte Anmeldung), kann sich die Reihenfolge für die betroffene Kategorie ändern — das ist erwartet.

## Offene Punkte für die Implementierung

- Die 2 reservierten Leerplätze pro Kategorie-Übergang sind ein Startwert und bei Bedarf anpassbar.
- E-Mail und "Erhalten am" werden wie bei der Anmeldeliste nie angezeigt.
