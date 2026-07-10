# 🐟 Entdeckerfisch

Ein kindgerechtes Browser-Spiel von **✨ Jonfi Studios ✨** – für Kinder ab ca. 4 Jahren,
komplett für Smartphones und Touch-Steuerung optimiert.

Ein kleiner Fisch schwimmt von ganz unten **nach oben zur Wasseroberfläche** –
das ist das Ziel! Unterwegs: Garnelen fressen 🦐, wachsen ✨, dem Hai entkommen 🦈,
an Abzweigungen den Weg wählen 🪨 und manchmal durch **dunkle Höhlen** tauchen 🕳️.
Oben angekommen springt der Fisch einmal hoch aus dem Wasser – platsch! – und
weiter geht's in die nächste von **44 Welten**.

## ▶️ Spielen

Einfach die Datei `index.html` in einem Browser öffnen – es wird **kein Server,
keine Installation und kein Internet** benötigt. Alles ist Vanilla
HTML5 + CSS3 + JavaScript (Canvas API).

Zum lokalen Testen mit einem kleinen Server (z. B. für das Handy im gleichen WLAN):

```bash
# Im Projektordner:
python3 -m http.server 8000
# Dann am Handy öffnen: http://<IP-des-Computers>:8000
```

## 🎮 Steuerung

| Geste | Wirkung |
|---|---|
| Finger auflegen & bewegen | Der Fisch schwimmt sanft nach links/rechts zum Finger (nach oben schwimmt er von allein!) |
| Kurz tippen (links/rechts vom Fisch) | Kleiner Ausweich-Hüpfer zur Seite |
| Pfeiltasten ← → (am Computer) | Zum Testen ohne Touchscreen |

## 🧩 Spielmechanik

- **Das Ziel ist die Wasseroberfläche 🌊**: Je höher der Fisch steigt, desto
  heller wird das Wasser. Oben springt er aus dem Wasser, taucht wieder ein –
  und man darf entscheiden, ob man weiterspielt.
- **Garnelen 🦐** geben einen kurzen **Geschwindigkeits-Boost**. Nach 8 Garnelen
  **wächst** der Fisch sichtbar.
- **Wasserpflanzen 🌿** sind weich und **fest verwurzelt**: Jede Pflanze steht
  auf einem kleinen Sand-Sockel mit Steinchen und wiegt sich um ihren Fuß in
  der Strömung. Im Pflanzen-Dickicht schwimmt man **spürbar langsamer** –
  wehtun tut es aber nie. Felsen stoppen den Fisch sanft.
- **Der Hai 🦈** ist eine richtige, große und breite gezeichnete Figur (kein
  Mini-Emoji!) und **nähert sich langsam von hinten** – man spürt richtig, wie
  er näherkommt. Abhängen durch Boosts oder kluge Wegwahl (der Hai wird in
  Hindernissen stark gebremst!). Gibt er auf, **dreht er gemächlich ab** –
  mal taucht er langsam weg, mal *„schwimmt er in den falschen Gang"*.
  Wird man erwischt, gibt es **kein Game Over** – der Fisch schrumpft nur eine
  Stufe und bekommt einen Flucht-Boost.
- **Abzweigungen 🪨**: Felswände teilen den Weg in links / geradeaus / rechts.
  Der Fisch schwimmt den gewählten Weg entlang – die anderen ziehen unten vorbei.
- **Höhlen 🕳️**: Einer der Wege kann ein dunkles Höhlen-Loch sein – ein
  richtiges **Felsentor** mit Steinbogen und dunklem Loch. Schwimmt man hinein,
  **erschrecken die Hintergrund-Tiere**: Sie flüchten und verschwinden nach und
  nach – in die Höhle traut sich keiner mit! Drinnen wird es **richtig dunkel**,
  zackige **Felswände** ragen links und rechts ins Bild, überall liegen Steine –
  und der **Hai findet einen viel schneller**! Nach ein paar Bildschirmen geht
  es wieder hinaus ins Helle.
- **44 Welten 🌍**: Vom Korallenriff über die Kiesel-Welt, den Schildkröten-Fluss
  und das Fische-Meer bis zum Zaubermeer – jede Welt hat eigene Farben, eigene
  Hindernisse und eigene **Hintergrund-Tiere**, die harmlos mitschwimmen (in der
  Schildkrötenwelt Schildkröten 🐢, in der Tiefsee Tintenfische 🦑 …). Über sie
  schwimmen ist völlig ungefährlich – sie sind nur schöne Kulisse.
- **Tiefsee-Welten 🌑**: Welten wie die *Mitternachts-Tiefsee*, der
  *Anglerfisch-Abgrund* oder die *Leucht-Tiefe* sind **dauerhaft duster** – nur
  um den Fisch bleibt ein Lichtkreis, und es schwimmen ganz andere Lebewesen
  herum (Kraken 🐙, Leuchtquallen 🪼, Tintenfische 🦑).

## 🗂️ Dateien – wo ändere ich was?

| Datei | Inhalt |
|---|---|
| `config.js` | **Alle Stellschrauben**: Geschwindigkeiten, Spawn-Raten, Größen, Höhlen-Dunkelheit … Hier zuerst schauen, wenn du das Spiel leichter/schwerer machen willst! |
| `welten.js` | Die **44 Welten** (Farben, Emojis, Tiere, Häufigkeit der Muster) und die **Bau-Muster** des Leveldesigns (Slalom, Torbogen, Abzweigung, Höhlen-Gänge …) |
| `spiel.js` | Die Spiel-Logik: Bewegung, Hai-KI, Höhlen, Kollisionen, Zeichnen, Sound, Menüs – in 14 kommentierte Abschnitte gegliedert |
| `index.html` | Grundgerüst und die Menü-Bildschirme (Start, Pause, Einstellungen ⚙️) |
| `style.css` | Aussehen der Menüs und Anzeigen |

Der komplette Code ist ausführlich **auf Deutsch kommentiert**.

## 🌍 Eigene Welten bauen

In `welten.js` einfach einen neuen Eintrag an die `WELTEN`-Liste anhängen –
Name, Farben, Emojis, Tiere und die Gewichte der Bau-Muster festlegen, fertig.
