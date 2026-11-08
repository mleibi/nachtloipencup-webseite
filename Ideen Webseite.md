# Ideen Webseite Nachtloipencup

## Cooler HTML-Header (für ClubDesk HTML-Baustein)

Idee: Dunkler Nachthimmel mit funkelnden Sternen, fallendem Schnee und leuchtendem Titel (Stirnlampen-Glow-Effekt). Reines CSS, kein externes JavaScript nötig (ClubDesk erlaubt oft kein JS in HTML-Bausteinen).

```html
<div class="nlc-header">
  <div class="nlc-stars"></div>
  <div class="nlc-snow"></div>
  <div class="nlc-content">
    <h1 class="nlc-title">🎿 Nachtloipencup</h1>
    <p class="nlc-subtitle">Langlaufen, wenn die Loipe leuchtet</p>
  </div>
</div>

<style>
.nlc-header {
  position: relative;
  overflow: hidden;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: radial-gradient(ellipse at top, #16213e 0%, #0d0d1a 60%, #000000 100%);
  border-radius: 12px;
}

/* Sterne: mehrere Schichten von radialen Punkten, die sanft flimmern */
.nlc-stars {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(2px 2px at 20px 30px, #fff, transparent),
    radial-gradient(2px 2px at 140px 80px, #fff, transparent),
    radial-gradient(1px 1px at 90px 40px, #fff, transparent),
    radial-gradient(1px 1px at 200px 120px, #fff, transparent),
    radial-gradient(2px 2px at 260px 60px, #fff, transparent),
    radial-gradient(1px 1px at 320px 140px, #fff, transparent);
  background-repeat: repeat;
  background-size: 360px 180px;
  animation: nlc-twinkle 3s ease-in-out infinite alternate;
  opacity: 0.8;
}

@keyframes nlc-twinkle {
  from { opacity: 0.4; }
  to   { opacity: 1; }
}

/* Schnee: zwei Ebenen mit unterschiedlicher Geschwindigkeit für Tiefe */
.nlc-snow {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(3px 3px at 10% 10%, #fff, transparent),
    radial-gradient(2px 2px at 30% 40%, #fff, transparent),
    radial-gradient(3px 3px at 55% 20%, #fff, transparent),
    radial-gradient(2px 2px at 70% 60%, #fff, transparent),
    radial-gradient(3px 3px at 85% 30%, #fff, transparent),
    radial-gradient(2px 2px at 95% 70%, #fff, transparent);
  background-repeat: repeat;
  background-size: 400px 400px;
  opacity: 0.9;
  animation: nlc-fall 8s linear infinite;
}

@keyframes nlc-fall {
  from { background-position: 0 0; }
  to   { background-position: 60px 400px; }
}

.nlc-content {
  position: relative;
  z-index: 2;
}

.nlc-title {
  font-size: 3rem;
  margin: 0;
  color: #eaf6ff;
  text-shadow:
    0 0 8px #9fd8ff,
    0 0 20px #4fa3ff,
    0 0 40px #1e6fd9;
  animation: nlc-glow 2.5s ease-in-out infinite alternate;
}

@keyframes nlc-glow {
  from { text-shadow: 0 0 8px #9fd8ff, 0 0 20px #4fa3ff, 0 0 40px #1e6fd9; }
  to   { text-shadow: 0 0 14px #c7eaff, 0 0 30px #6fb6ff, 0 0 55px #2a7fe0; }
}

.nlc-subtitle {
  margin-top: 0.5rem;
  color: #b9cfe6;
  font-size: 1.2rem;
  letter-spacing: 1px;
}

@media (max-width: 600px) {
  .nlc-title { font-size: 2rem; }
  .nlc-subtitle { font-size: 1rem; }
}
</style>
```

Hinweise:
- Falls ClubDesk das `<style>`-Tag im HTML-Baustein entfernt: Styles stattdessen inline setzen oder im ClubDesk "Design/CSS"-Bereich (falls vorhanden) einfügen.
- Titel/Untertitel-Text, Farben und Icon (🎿) nach Belieben anpassen.
- Höhe (`height: 320px`) an restliches Seitenlayout anpassen.
