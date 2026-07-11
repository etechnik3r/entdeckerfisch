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
- **Wasserpflanzen 🌿** sind weich und wachsen **auf Sand und Steinen**: Jede
  Pflanze sitzt auf einem Steinhaufen im Sand und wiegt sich um ihren Fuß in
  der Strömung – nichts schwebt einfach im Wasser. Im Pflanzen-Dickicht schwimmt
  man **spürbar langsamer** – wehtun tut es aber nie. Felsen stoppen den Fisch sanft.
- **Niemand bleibt hängen 🫧**: Kommt der Fisch mal nicht weiter (z. B. unter
  einer Felswand), rutscht er automatisch seitlich am Fels entlang – und wenn
  das nicht reicht, macht er sich kurz **ganz schmal und schlängelt sich** zur
  nächsten freien Lücke durch. Außerdem zählt für Zusammenstöße immer nur eine
  kleine Hitbox: Auch ein groß gewachsener Fisch passt durch jede Lücke.
- **Der Hai 🦈** ist eine richtige, große gezeichnete Figur (kein Mini-Emoji!)
  und sorgt für **echte Verfolgungsjagden**: **Mindestens zwei Haie pro Welt**
  greifen an. Ein Hai schwimmt immer erst **sichtbar ganz nah heran** und jagt
  eine Weile dicht hinter dem Fisch – erst danach lässt er sich überhaupt
  abhängen (nie mehr "Hai abgehängt!", ohne je einen Hai gesehen zu haben!).
  Abhängen klappt mit Garnelen-Boosts oder kluger Wegwahl (in Hindernissen
  wird er stark gebremst). Wird man erwischt, gibt es **kein Game Over** –
  der Fisch schrumpft nur eine Stufe und bekommt einen Flucht-Boost.
- **Abzweigungen = Entscheidungen 🪧**: An jeder Abzweigung sind **immer
  mindestens zwei Wege offen** – links, geradeaus, rechts. Kommt sie in Sicht,
  ploppt „Wähle deinen Weg! 🤔“ auf und über jedem Gang schwebt ein
  **pulsierender Wegweiser-Pfeil** mit ehrlichem Symbol: 🦐 Garnelen-Weg,
  🌿 Pflanzen-Weg, 🕳️ Höhlen-Eingang. Sobald sich der Fisch für einen Gang
  entschieden hat, **schwimmen die anderen Wege zur Seite davon und
  verschwinden**.
- **Höhlen 🕳️**: **Jede Welt hat garantiert mindestens eine Höhle** – wer bis
  zur Level-Mitte keine betreten hat, dem führt die nächste Abzweigung mit
  allen Wegen hinein. Schwimmt man hinein, sieht es **wirklich wie
  Hineinschwimmen** aus: Das dunkle Loch wächst hinter dem Fisch über den
  ganzen Bildschirm, Blasen wirbeln auf, und es wird zügig finster. Die
  Höhlen sind jetzt **richtig lange Abschnitte**, die Hintergrund-Tiere
  erschrecken und flüchten, drinnen ragen zackige **Felswände** ins Bild –
  und der **Hai findet einen viel schneller**! Nach einer ganzen Weile geht
  es wieder hinaus ins Helle.
- **Nichts ist je zugebaut 🛡️**: Eine **Durchkomm-Garantie** prüft jedes
  gebaute Streckenstück: Überall bleibt eine ausreichend breite Lücke frei.
  Steine können weder einen Höhlen-Eingang versperren noch einen Gang so eng
  machen, dass der groß gewachsene Fisch stecken bleibt.
- **Lebendige Hintergrund-Tiere 🐬**: Delfine, Robben & Co. schwimmen auf echten
  **Wellen-Bahnen** auf und ab, neigen sich in ihre Schwimmrichtung, machen mal
  einen Spurt und kommen gern als kleine **Gruppe** angeschwommen.
- **44 Welten 🌍**: Vom Korallenriff über die Kiesel-Welt, den Schildkröten-Fluss
  und das Fische-Meer bis zum Zaubermeer – jede Welt hat eigene Farben, eigene
  Hindernisse und eigene **Hintergrund-Tiere**, die harmlos mitschwimmen (in der
  Schildkrötenwelt Schildkröten 🐢, in der Tiefsee Tintenfische 🦑 …). Über sie
  schwimmen ist völlig ungefährlich – sie sind nur schöne Kulisse. Jede Welt ist
  eine **richtige kleine Reise** (doppelt so lang wie früher), und Steine &
  Pflanzen kommen in **vielen Varianten** daher: mal ein Findling 🗿, eine
  Amphore 🏺, eine Auster 🦪 oder eine Lotusblüte 🪷 – gespiegelt, leicht
  gedreht und in der Größe gestreut, kein Stein gleicht dem anderen.
- **Flüssig auch auf älteren Handys 🚀**: Alle Emojis werden über einen
  **Sprite-Cache** gezeichnet (einmal rendern, danach nur noch kopieren),
  Pflanzen-Sockel sind vorgerendert und Partikel gedeckelt – auch bei vollen
  Pflanzenwäldern ruckelt nichts.
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
