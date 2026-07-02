# 🐟 Entdeckerfisch

Ein kindgerechtes Browser-Spiel von **✨ Jonfi Studios ✨** – für Kinder ab ca. 4 Jahren,
komplett für Smartphones und Touch-Steuerung optimiert.

Ein kleiner Fisch schwimmt immer weiter durch bunte Unterwasser-Welten:
Garnelen fressen 🦐, wachsen ✨, Angreifern entkommen 🦈, Booten ausweichen 🚤
und am Ende jeder Welt durch den Ziel-Strudel 🌀 schwimmen.

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
| Finger auflegen & bewegen | Der Fisch schwimmt sanft zur Höhe des Fingers |
| Kurz tippen (über/unter dem Fisch) | Kleiner Ausweich-Hüpfer nach oben/unten |
| Pfeiltasten ↑ ↓ (am Computer) | Zum Testen ohne Touchscreen |

## 🧩 Spielmechanik

- **Garnelen 🦐** geben einen kurzen **Geschwindigkeits-Boost**. Nach 8 Garnelen
  **wächst** der Fisch sichtbar.
- **Angreifer 🦈** verfolgen den Fisch hartnäckig. Abhängen durch Boosts oder
  kluge Wegwahl (Angreifer werden in Hindernissen stark gebremst!) →
  *„Angreifer abgehängt!"*. Wird man erwischt, gibt es **kein Game Over** –
  der Fisch schrumpft nur eine Stufe und bekommt einen Flucht-Boost.
- **Boote 🚤** werfen einen Schatten ins Wasser. Wer tief genug schwimmt, ist sicher.
- **Ziel 🌀**: Nach genug Strecke erscheint der Strudel – hindurchschwimmen
  führt in die **nächste Welt** (neues Design, neue Hindernis-Mischung).

## 🗂️ Dateien – wo ändere ich was?

| Datei | Inhalt |
|---|---|
| `config.js` | **Alle Stellschrauben**: Geschwindigkeiten, Spawn-Raten, Größen, Boost-Dauer … Hier zuerst schauen, wenn du das Spiel leichter/schwerer machen willst! |
| `welten.js` | Die **Welten** (Farben, Emojis, Häufigkeit der Muster) und die **Bau-Muster** des Leveldesigns (Slalom, Höhle, Abzweigung, Algenwald …) |
| `spiel.js` | Die Spiel-Logik: Bewegung, KI, Kollisionen, Zeichnen, Sound, Menüs – in 14 kommentierte Abschnitte gegliedert |
| `index.html` | Grundgerüst und die Menü-Bildschirme (Start, Pause, Einstellungen ⚙️) |
| `style.css` | Aussehen der Menüs und Anzeigen |

Der komplette Code ist ausführlich **auf Deutsch kommentiert**.

## 🌍 Eigene Welten bauen

In `welten.js` einfach einen neuen Eintrag an die `WELTEN`-Liste anhängen –
Name, Farben, Emojis und die Gewichte der Bau-Muster festlegen, fertig.
