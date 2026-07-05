# 🐟 Entdeckerfisch

Ein kindgerechtes Browser-Spiel von **✨ Jonfi Studios ✨** – für Kinder ab ca. 4 Jahren,
komplett für Smartphones und Touch-Steuerung optimiert.

Ein kleiner Fisch schwimmt von ganz unten **nach oben zur Wasseroberfläche** –
das ist das Ziel! Unterwegs: Garnelen fressen 🦐, wachsen ✨, dem Hai entkommen 🦈,
an Abzweigungen den Weg wählen 🪨 und manchmal durch **dunkle Höhlen** tauchen 🕳️.
Oben angekommen springt der Fisch einmal hoch aus dem Wasser – platsch! – und
weiter geht's in die nächste von **24 Welten**.

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
- **Wasserpflanzen 🌿** sind weich: Sie **bremsen nur ein bisschen**, tun aber
  nicht weh. Felsen stoppen den Fisch sanft.
- **Der Hai 🦈** ist eine richtige, große gezeichnete Figur (kein Mini-Emoji!)
  und jagt den Fisch von unten. Abhängen durch Boosts oder kluge Wegwahl
  (der Hai wird in Hindernissen stark gebremst!) → *„Hai abgehängt!"*.
  Wird man erwischt, gibt es **kein Game Over** – der Fisch schrumpft nur eine
  Stufe und bekommt einen Flucht-Boost.
- **Abzweigungen 🪨**: Felswände teilen den Weg in links / geradeaus / rechts.
  Der Fisch schwimmt den gewählten Weg entlang – die anderen ziehen unten vorbei.
- **Höhlen 🕳️**: Einer der Wege kann ein dunkles Höhlen-Loch sein (erkennbar an
  den vielen Steinen). In der Höhle wird es **dunkel**, es gibt nur Steine und
  kaum Pflanzen, andere Tiere schwimmen herum – und der **Hai findet einen viel
  schneller**! Nach ein paar Bildschirmen geht es wieder hinaus ins Helle.
- **24 Welten 🌍**: Vom Korallenriff über die Schildkrötenbucht und das Eismeer
  bis zum Zaubermeer – jede Welt hat eigene Farben, eigene Hindernisse und
  eigene **Hintergrund-Tiere**, die harmlos mitschwimmen (in der Schildkrötenwelt
  Schildkröten 🐢, in der Tiefsee Tintenfische 🦑 …). Über sie schwimmen ist
  völlig ungefährlich – sie sind nur schöne Kulisse.

## 🗂️ Dateien – wo ändere ich was?

| Datei | Inhalt |
|---|---|
| `config.js` | **Alle Stellschrauben**: Geschwindigkeiten, Spawn-Raten, Größen, Höhlen-Dunkelheit … Hier zuerst schauen, wenn du das Spiel leichter/schwerer machen willst! |
| `welten.js` | Die **24 Welten** (Farben, Emojis, Tiere, Häufigkeit der Muster) und die **Bau-Muster** des Leveldesigns (Slalom, Torbogen, Abzweigung, Höhlen-Gänge …) |
| `spiel.js` | Die Spiel-Logik: Bewegung, Hai-KI, Höhlen, Kollisionen, Zeichnen, Sound, Menüs – in 14 kommentierte Abschnitte gegliedert |
| `index.html` | Grundgerüst und die Menü-Bildschirme (Start, Pause, Einstellungen ⚙️) |
| `style.css` | Aussehen der Menüs und Anzeigen |

Der komplette Code ist ausführlich **auf Deutsch kommentiert**.

## 🌍 Eigene Welten bauen

In `welten.js` einfach einen neuen Eintrag an die `WELTEN`-Liste anhängen –
Name, Farben, Emojis, Tiere und die Gewichte der Bau-Muster festlegen, fertig.
