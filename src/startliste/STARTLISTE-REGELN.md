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
- Tabelle hat dieselben Spalten wie beim Einzelstart (Nr., Startzeit, Nachname, Vorname, Jahrgang, Skiclub, Kategorie) — Startzeit ist für alle Personen derselben Welle identisch.
- Fortlaufende Startnummern für das gesamte Rennen, wie beim Einzelstart.

## Einzelstart

- Fortlaufende Startnummern für das **gesamte Rennen** (nicht pro Kategorie neu beginnend).
- Innerhalb einer Kategorie startet jede Person **30 Sekunden** nach der vorherigen, beginnend bei der Wellen-Startzeit (bzw. bei der Startzeit, die sich aus der vorherigen Kategorie fortlaufend ergibt).
- Zwischen zwei Kategorien **derselben Welle** werden **2 reservierte Leer-Startplätze** (= 1 Minute, je 2×30s) eingefügt, für kurzfristige Nachmeldungen. Diese Plätze erscheinen in der Liste ohne Namen.
- Beim Wechsel zu einer **neuen Welle** springt die Uhrzeit direkt auf die nächste Wellen-Startzeit (keine zusätzlichen Leerplätze nötig, der Wellen-Abstand dient bereits als Puffer).

## Reihenfolge innerhalb einer Kategorie

- Teilnehmer werden nach **Anmeldezeitpunkt** (CSV-Spalte "Erhalten am") sortiert, nicht zufällig gemischt.
- Grund: Eine zufällige Reihenfolge müsste bei jeder neuen Anmeldung komplett neu gewürfelt werden (ändert sich die Anzahl Personen, ändert sich die ganze Permutation) — das würde Startnummern/-zeiten bereits angemeldeter Personen ständig verschieben. Nach Anmeldezeitpunkt sortiert landet eine neu dazukommende Person immer **ans Ende ihrer Kategorie**, ohne bereits vorhandene Personen zu verschieben.
- Bewusst **kein** fixes Nummern-Kontingent pro Kategorie (z. B. "Kategorie X bekommt immer Bibs 50-65") — das wäre für eine Vereins-Breitensport-Veranstaltung unnötig komplex (KISS). Die Liste ist explizit **provisorisch**; die definitive Startnummer wird vor Ort an der Startnummernausgabe abgeholt. Kleine Verschiebungen bei späten Anmeldungen (eine frühere Kategorie wächst) sind akzeptiert.
- Die 2 reservierten Leerplätze gelten nach **jeder** Kategorie, auch der letzten einer Welle (nicht nur zwischen Kategorien derselben Welle).

## Anzeige

- Ein Dropdown ("Rennen auswählen") erlaubt die Auswahl eines einzelnen Renndatums oder "Alle Rennen" (Standard: alle gestapelt sichtbar).
- Die Auswahl blendet nur die Anzeige ein/aus (reines CSS `display`), es wird nichts neu berechnet.

## Offene Punkte für die Implementierung

- Die 2 reservierten Leerplätze pro Kategorie sind ein Startwert und bei Bedarf anpassbar.
- E-Mail wird wie bei der Anmeldeliste nie angezeigt. "Erhalten am" wird nur intern zur Sortierung verwendet, nie angezeigt.

