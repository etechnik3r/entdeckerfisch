/* ================================================================
   ENTDECKERFISCH – SPIEL-LOGIK
   ================================================================
   Diese Datei enthält das eigentliche Spiel. Sie ist in klar
   getrennte Abschnitte gegliedert – jeder Abschnitt hat eine
   große Überschrift, damit du schnell die richtige Stelle findest:

     1. Canvas & Bildschirm-Anpassung (responsive)
     2. Spielzustand & Spieler-Daten
     3. Sound-Effekte (WebAudio, ohne Dateien)
     4. Einstellungen (Ton, Tempo) + Speichern
     5. Touch- & Tastatur-Steuerung
     6. Level-Generator (baut die Welt nach OBEN auf)
     7. Update: Spieler-Fisch (Aufstieg, Lenken, Boost, Wachstum)
     8. Update: Kollisionen (Hindernisse, Garnelen, Abzweigungen)
     9. Update: Höhlen (dunkel, steinig, gefährlich!)
    10. Update: Hai-KI (der Verfolger von unten)
    11. Zeichnen (alles aufs Canvas malen, inkl. echtem Hai!)
    12. Meldungen & Partikel (Text-Einblendungen, Blasen, Spritzer)
    13. Spielablauf (Start, Pause, Oberfläche erreicht, Sprung!)
    14. Haupt-Schleife (Game Loop)

   DAS SPIELPRINZIP: Der Fisch schwimmt von ganz unten NACH OBEN.
   Das Ziel ist die WASSEROBERFLÄCHE! Dort angekommen springt der
   Fisch einmal hoch aus dem Wasser – und dann darf man in der
   nächsten Welt weiterspielen.

   Alle einstellbaren Zahlen stehen in config.js!
   ================================================================ */

"use strict";

/* ================================================================
   1. CANVAS & BILDSCHIRM-ANPASSUNG
   ================================================================
   Das Canvas passt sich automatisch an jede Bildschirmgröße an.
   Wir rechnen intern in "E"-Einheiten (1 E = 1 % der Bildschirm-
   höhe), damit das Spiel auf jedem Gerät gleich aussieht.
   ================================================================ */

const canvas = document.getElementById("spielfeld");
const ctx = canvas.getContext("2d");

let breitePx = 0;      // Bildschirm-Breite in Pixeln
let hoehePx = 0;       // Bildschirm-Höhe in Pixeln
let E = 1;             // Umrechnungsfaktor: 1 E = so viele Pixel
let schirmBreiteE = 0; // Bildschirm-Breite umgerechnet in E

/* ---------- DER SPRITE-CACHE (wichtig für flüssiges Spielen!) ----------
   Emojis mit fillText() zu malen ist auf Handys TEUER – bei vielen
   Steinen und Pflanzen fängt das Bild an zu ruckeln. Deshalb wird
   jedes Emoji nur EINMAL pro Größenstufe auf ein kleines unsichtbares
   Canvas gemalt und danach immer nur noch als fertiges Bildchen
   kopiert (drawImage) – das ist um ein Vielfaches schneller. */
const spriteCache = new Map();

function emojiSprite(emoji, groessePx) {
    // Größen in Stufen einteilen, damit der Cache klein bleibt.
    // Die Feinabstimmung übernimmt drawImage beim Kopieren:
    const stufe = Math.max(4, Math.round(groessePx / 4) * 4);
    const key = emoji + "@" + stufe;
    let sprite = spriteCache.get(key);
    if (!sprite) {
        if (spriteCache.size > 400) spriteCache.clear();   // Sicherheits-Deckel
        const dpr = window.devicePixelRatio || 1;
        const seite = Math.ceil(stufe * 2.6);              // Etwas Rand für breite Emojis
        const c = document.createElement("canvas");
        c.width = c.height = Math.ceil(seite * dpr);
        const cx = c.getContext("2d");
        cx.scale(dpr, dpr);
        cx.font = `${stufe * 2}px sans-serif`;
        cx.textAlign = "center";
        cx.textBaseline = "middle";
        cx.fillText(emoji, seite / 2, seite / 2);
        sprite = { bild: c, seite, stufe };
        spriteCache.set(key, sprite);
    }
    return sprite;
}

// Wird beim Start und bei jeder Größenänderung (z. B. Handy drehen) aufgerufen:
function bildschirmAnpassen() {
    // Auf scharfen Displays (Retina) zeichnen wir mit mehr Pixeln:
    const dpr = window.devicePixelRatio || 1;
    breitePx = window.innerWidth;
    hoehePx = window.innerHeight;

    canvas.width = breitePx * dpr;
    canvas.height = hoehePx * dpr;
    // Alle Zeichenbefehle automatisch auf die Retina-Auflösung hochskalieren:
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    E = hoehePx / 100;                 // 1 E = 1 % der Bildschirmhöhe (in Pixeln)
    schirmBreiteE = breitePx / E;      // Wie viele E passen nebeneinander auf den Schirm?
    spriteCache.clear();               // Neue Bildschirmgröße → Sprites neu aufbauen
}
window.addEventListener("resize", bildschirmAnpassen);
bildschirmAnpassen();

// Wie breit ist das Spielfeld? Auf Handys der ganze Bildschirm,
// auf großen Bildschirmen höchstens maxBreite E (mittig zentriert):
function spielfeldBreite() {
    return Math.min(schirmBreiteE, KONFIG.spielfeld.maxBreite);
}

// Der Spieler-Fisch wird immer bei 72 % der Bildschirmhöhe gezeichnet.
// (Die Welt zieht an ihm vorbei nach unten – so hat man freie Sicht nach OBEN.)
const FISCH_SCHIRM_Y = 72;


/* ================================================================
   2. SPIELZUSTAND & SPIELER-DATEN
   ================================================================ */

// In welchem Zustand ist das Spiel gerade?
// "start" = Startbildschirm, "laeuft" = es wird gespielt,
// "pause" = pausiert, "sprung" = der Fisch springt aus dem Wasser,
// "geschafft" = Welt-geschafft-Bildschirm
let zustand = "start";

let weltIndex = 0;     // Welche Welt (Level) gerade gespielt wird (0 = erste)
let runde = 0;         // Wie oft schon ALLE Welten durchgespielt wurden
let spielZeit = 0;     // Sekunden seit Levelstart (für Spawn-Timer)
let sprungZeit = 0;    // Sekunden seit Beginn des Ziel-Sprungs
let sprungGeplatscht = false;   // Wurde der Lande-Platscher schon abgespielt?

// Alle Daten des Spieler-Fisches:
const spieler = {
    x: 0,              // Position links/rechts (0 = Mitte des Spielfelds, in E)
    h: 0,              // Wie hoch der Fisch schon aufgestiegen ist (in E)
    zielX: 0,          // Wohin der Finger den Fisch lenkt
    boostZeit: 0,      // Restliche Boost-Sekunden (> 0 = Fisch ist schnell)
    gebremstZeit: 0,   // Restliche Sekunden "abgebremst" (nach Felsen-Rempler)
    pflanzenZeit: 0,   // Restliche Sekunden "im Pflanzen-Dickicht" (schwimmt langsamer)
    schonzeit: 0,      // Restliche Unverwundbar-Sekunden (Fisch blinkt)
    garnelenGesamt: 0, // Alle jemals gefressenen Garnelen (für die Anzeige)
    wachstum: 0,       // Aktuelle Wachstums-Stufe (0 bis maxWachstum)
    schwimmPhase: 0,   // Nur für die Optik: lässt den Fisch hin und her wippen
    schlaengelZeit: 0, // > 0 = der Fisch macht sich "schmal" und schlängelt sich
                       // durch enge Stellen (Anti-Hänger-Hilfe)
};

// Der Anti-Hänger-Wächter: merkt sich, ob der Fisch vorankommt.
let festTimer = 0;     // Sekunden ohne nennenswerten Höhen-Fortschritt
let festMerkH = 0;     // Bei welcher Höhe zuletzt Fortschritt gemessen wurde

// Für die "Hineinschwimm"-Animation am Höhlen-Eingang:
let hoehlenEintritt = null;   // { x, h, zeit } oder null

// Der aktuelle Radius des Fisches – wächst mit den Wachstums-Stufen:
function fischRadius() {
    return KONFIG.fisch.radiusStart + spieler.wachstum * KONFIG.fisch.radiusProWachstum;
}

// Das Grundtempo, inklusive Tempo-Einstellung und Runden-Bonus:
function grundTempo() {
    const tempoWahl = { langsam: 0.75, normal: 1.0, schnell: 1.25 }[einstellungen.tempo];
    return KONFIG.fisch.tempo * tempoWahl * (1 + runde * KONFIG.level.tempoPlusProRunde);
}

// Die Listen aller Dinge, die gerade in der Welt existieren:
let hindernisse = [];  // Felsen & Pflanzen  { x, h, r, art }
let garnelen = [];     // Sammelbare Garnelen { x, h }
let angreifer = null;  // Der Hai (höchstens einer gleichzeitig)
let tiere = [];        // Harmlose Hintergrund-Tiere { x, h, vx, emoji }
let zonen = [];        // Abzweigungen: Welchen Weg wählt der Fisch?
let hoehle = null;     // Ist der Fisch gerade in einer Höhle? { startH, endeH }
let partikel = [];     // Blasen, Funkel & Wasser-Spritzer
let meldungen = [];    // Text-Einblendungen ("Hai abgehängt!" usw.)

// Spawn-Timer: Wann kommt der nächste Hai? Bis wohin ist gebaut?
let naechsterAngreifer = 0;
let naechsteBauH = 0;          // Bis zu dieser Höhe wurde die Welt schon "gebaut"
let naechsteAbzweigungH = 0;   // Ab dieser Höhe kommt die nächste Abzweigung

// Die Höhlen-Garantie: JEDE Welt hat mindestens eine Höhle.
let hoehleBesucht = false;       // Hat der Fisch in dieser Welt schon eine Höhle betreten?
let hoehlePflichtGebaut = false; // Wurde die "alle Wege führen hinein"-Abzweigung schon gebaut?

// Die Hai-Garantie: Zählt die Angriffe, damit pro Welt MINDESTENS
// KONFIG.angreifer.minProWelt Haie kommen.
let haisGesamt = 0;

// Die aktuelle Welt (Farben, Emojis, Tiere) aus welten.js:
function aktuelleWelt() {
    return WELTEN[weltIndex];
}


/* ================================================================
   3. SOUND-EFFEKTE
   ================================================================
   Alle Töne werden live mit der WebAudio-API erzeugt – es werden
   keine Sound-Dateien benötigt. Jeder Ton ist ein kurzer "Piep"
   mit Start- und End-Tonhöhe.
   ================================================================ */

let audioCtx = null;   // Wird erst beim ersten Fingertipp erstellt (Browser-Regel)

function tonAnschalten() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
}

// Spielt einen einzelnen Piep-Ton.
// freqVon/freqBis = Tonhöhe am Anfang/Ende (Hz), dauer in Sekunden,
// lautstaerke 0–1, form = "sine" (weich) / "square" (kantig) / "triangle"
function piep(freqVon, freqBis, dauer, lautstaerke = 0.15, form = "sine", verzoegerung = 0) {
    if (!einstellungen.ton || !audioCtx) return;
    const start = audioCtx.currentTime + verzoegerung;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = form;
    osc.frequency.setValueAtTime(freqVon, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqBis, 1), start + dauer);
    gain.gain.setValueAtTime(lautstaerke, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dauer);   // Sanft ausblenden
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + dauer + 0.05);
}

// Fertige Sound-Effekte für die verschiedenen Ereignisse:
const SOUND = {
    garnele()    { piep(600, 1100, 0.12, 0.15); },                       // Fröhliches "Blip"
    wachsen()    { piep(400, 800, 0.15, 0.15); piep(600, 1200, 0.2, 0.15, "sine", 0.12); },
    rempler()    { piep(180, 90, 0.2, 0.12, "triangle"); },              // Dumpfes "Autsch"
    angreifer()  { piep(300, 200, 0.3, 0.1, "triangle"); },              // Unheilvolles "Wumm"
    abgehaengt() { piep(500, 700, 0.12, 0.15); piep(700, 1000, 0.18, 0.15, "sine", 0.1); },
    erwischt()   { piep(300, 120, 0.35, 0.15, "triangle"); },
    hoehle()     { piep(220, 110, 0.5, 0.12, "triangle"); },             // Dunkles Höhlen-Grollen
    sprung()     { piep(350, 1100, 0.5, 0.15); },                        // Whoosh nach oben!
    platscher()  { piep(600, 150, 0.35, 0.15, "triangle"); },            // Platsch beim Eintauchen
    ziel()       { [523, 659, 784, 1047].forEach((f, i) => piep(f, f, 0.22, 0.15, "sine", i * 0.13)); },
    knopf()      { piep(500, 650, 0.08, 0.1); },
};


/* ================================================================
   4. EINSTELLUNGEN (Ton, Tempo)
   ================================================================
   Die Auswahl wird im Browser gespeichert (localStorage) und ist
   beim nächsten Spielstart wieder da.
   ================================================================ */

let einstellungen = { ton: true, tempo: "normal" };

function einstellungenLaden() {
    try {
        const gespeichert = localStorage.getItem("entdeckerfisch-einstellungen");
        if (gespeichert) einstellungen = { ...einstellungen, ...JSON.parse(gespeichert) };
    } catch (e) { /* Wenn Speichern nicht erlaubt ist, einfach Standardwerte nehmen */ }
}

function einstellungenSpeichern() {
    try {
        localStorage.setItem("entdeckerfisch-einstellungen", JSON.stringify(einstellungen));
    } catch (e) { /* macht nichts */ }
}

// Die Knöpfe im Einstellungs-Menü mit dem aktuellen Stand abgleichen:
function einstellungenAnzeigen() {
    document.getElementById("ton-knopf").textContent = einstellungen.ton ? "🔊" : "🔇";
    for (const stufe of ["langsam", "normal", "schnell"]) {
        document.getElementById("tempo-" + stufe)
            .classList.toggle("aktiv", einstellungen.tempo === stufe);
    }
}


/* ================================================================
   5. TOUCH- & TASTATUR-STEUERUNG
   ================================================================
   So einfach wie möglich, damit auch 4-Jährige klarkommen:

   - Finger aufs Wasser legen und bewegen:
     Der Fisch schwimmt sanft zur LINKS/RECHTS-Position des Fingers.
     (Nach oben schwimmt er von ganz alleine!)
   - Kurz tippen: Der Fisch macht einen kleinen Ausweich-Hüpfer
     nach links (Tipp links vom Fisch) oder rechts (Tipp rechts).
   - Am Computer gehen auch die Pfeiltasten ← und →.
   ================================================================ */

let fingerLiegt = false;   // Liegt gerade ein Finger auf dem Bildschirm?
let tippStartZeit = 0;     // Wann wurde der Finger aufgesetzt? (für Tipp-Erkennung)
let tippStartX = 0;        // Wo wurde der Finger aufgesetzt?

// Rechnet eine Finger-Position (Pixel) in Spielfeld-x um (E, Mitte = 0):
function fingerZuX(clientX) {
    return (clientX - breitePx / 2) / E;
}

canvas.addEventListener("pointerdown", (ereignis) => {
    tonAnschalten();                       // Browser erlauben Ton erst nach einer Berührung
    if (zustand !== "laeuft") return;
    fingerLiegt = true;
    tippStartZeit = performance.now();
    tippStartX = ereignis.clientX;
    spieler.zielX = fingerZuX(ereignis.clientX);
});

canvas.addEventListener("pointermove", (ereignis) => {
    if (zustand !== "laeuft" || !fingerLiegt) return;
    spieler.zielX = fingerZuX(ereignis.clientX);   // Fisch folgt dem Finger
});

canvas.addEventListener("pointerup", (ereignis) => {
    if (zustand !== "laeuft") { fingerLiegt = false; return; }
    fingerLiegt = false;

    // War das nur ein kurzes Tippen (statt Ziehen)? Dann: Ausweich-Hüpfer!
    const dauer = performance.now() - tippStartZeit;
    const bewegung = Math.abs(ereignis.clientX - tippStartX);
    if (dauer < 250 && bewegung < 12) {
        const tippX = fingerZuX(ereignis.clientX);
        // Tipp LINKS vom Fisch → nach links ausweichen, sonst nach rechts:
        if (tippX < spieler.x) spieler.zielX = spieler.x - KONFIG.steuerung.tippSprung;
        else                   spieler.zielX = spieler.x + KONFIG.steuerung.tippSprung;
    }
});

canvas.addEventListener("pointercancel", () => { fingerLiegt = false; });

// Pfeiltasten für den Computer (praktisch zum Testen):
window.addEventListener("keydown", (ereignis) => {
    if (zustand !== "laeuft") return;
    if (ereignis.key === "ArrowLeft")  spieler.zielX = spieler.x - KONFIG.steuerung.tippSprung;
    if (ereignis.key === "ArrowRight") spieler.zielX = spieler.x + KONFIG.steuerung.tippSprung;
});


/* ================================================================
   6. LEVEL-GENERATOR
   ================================================================
   Baut die Welt Stück für Stück ÜBER dem Fisch auf, indem er die
   Bau-Muster aus welten.js (Slalom, Torbogen, Abzweigung …)
   zufällig übereinanderstapelt. Unter dem Fisch wird wieder
   aufgeräumt, damit das Spiel flüssig bleibt.

   Besonderheiten:
   - Regelmäßig kommt eine ABZWEIGUNG: Der Weg teilt sich!
   - In HÖHLEN werden nur die steinigen Höhlen-Muster gebaut.
   - Kurz vor der Wasseroberfläche bleibt alles frei (Zielgerade).
   ================================================================ */

function weltWeiterbauen() {
    const strecke = KONFIG.level.streckeProWelt;

    // So lange bauen, bis die Strecke ein Stück über den oberen
    // Bildschirmrand hinaus fertig ist:
    while (naechsteBauH < spieler.h + 130) {

        // Kurz vor der Oberfläche keine Hindernisse mehr – freie Zielgerade:
        if (naechsteBauH > strecke - KONFIG.level.freieZielgerade) {
            naechsteBauH += 100;
            continue;
        }

        let stueck;

        // Die HÖHLEN-GARANTIE: Hat der Fisch bis "pflichtAb" der Strecke
        // noch keine Höhle betreten, führt die nächste Abzweigung mit
        // ALLEN offenen Wegen hinein – jede Welt hat so sicher ihre Höhle!
        const hoehlePflicht = !hoehle && !hoehleBesucht && !hoehlePflichtGebaut
            && naechsteBauH > strecke * KONFIG.hoehle.pflichtAb
            && naechsteBauH < strecke - 500;

        if (hoehle && naechsteBauH < hoehle.endeH) {
            // In der Höhle: nur steinige Höhlen-Muster!
            const namen = Object.keys(HOEHLEN_MUSTER);
            stueck = HOEHLEN_MUSTER[zufallAus(namen)](naechsteBauH);
        } else if (!hoehle && naechsteBauH < strecke - 500
                   && (hoehlePflicht || naechsteBauH >= naechsteAbzweigungH)) {
            // Zeit für eine Abzweigung! (Aber nicht mehr kurz vor dem Ziel,
            // damit eine mögliche Höhle noch genug Platz hat.)
            stueck = abzweigungBauen(naechsteBauH, hoehlePflicht);
            if (hoehlePflicht) hoehlePflichtGebaut = true;
            naechsteAbzweigungH = naechsteBauH + stueck.laenge
                                + KONFIG.level.abzweigungAbstand
                                + zufall(0, KONFIG.level.abzweigungZufall);
        } else {
            // Ein normales Bau-Muster auswürfeln (gewichtet nach der Welt):
            const musterName = waehleMuster(aktuelleWelt());
            stueck = MUSTER[musterName](naechsteBauH);
        }

        // DURCHKOMM-GARANTIE: In jedem Streckenabschnitt bleibt immer eine
        // ausreichend breite Lücke frei – Steine können weder eine Höhle
        // zubauen noch einen Gang so eng machen, dass der große Fisch
        // stecken bleibt. (Abzweigungen sind von Hand sicher gebaut.)
        if (!stueck.zone) durchkommenSichern(stueck.hindernisse);

        // Jedes Hindernis bekommt sein Bild samt kleiner Zufalls-Deko
        // (Varianten-Emoji, Spiegelung, leichte Drehung, Größen-Streuung):
        hindernisseSchmuecken(stueck.hindernisse);

        hindernisse.push(...stueck.hindernisse);
        garnelen.push(...stueck.garnelen);
        if (stueck.zone) zonen.push(stueck.zone);
        naechsteBauH += stueck.laenge + zufall(8, 20);   // Kleine Lücke zwischen den Mustern
    }

    // Aufräumen: Alles löschen, was weit unter dem Fisch liegt.
    const unten = spieler.h - 45;
    hindernisse = hindernisse.filter(hi => hi.h > unten);
    garnelen = garnelen.filter(g => g.h > unten);
    zonen = zonen.filter(z => z.bisH > unten);

    // Ab und zu Hintergrund-Tiere der Welt dazustellen. Die Tiere
    // sind völlig harmlos – wenn man über sie schwimmt, passiert NICHTS.
    // In Höhlen schwimmen andere Tiere als draußen!
    if (Math.random() < 0.02 && tiere.length < 8) {
        const liste = hoehleDunkel() > 0.3 ? HOEHLEN_TIERE : aktuelleWelt().tiere;
        // Tiere starten außerhalb des BILDSCHIRMS (nicht nur des Spielfelds),
        // damit sie auch auf breiten Bildschirmen von außen hereinschwimmen:
        const rand = schirmBreiteE / 2;
        const vonLinks = Math.random() < 0.5;
        const emoji = zufallAus(liste);
        // Schnelle Schwimmer ziehen große Wellen-Bögen durchs Wasser,
        // gemütliche Tiere wackeln nur sanft auf und ab:
        const flink = emoji === "🐬" || emoji === "🦭" || emoji === "🐧";
        // Delfine & Fische kommen gern als kleine Gruppe angeschwommen:
        const gruppe = Math.random() < 0.4 ? zufallGanz(2, 3) : 1;
        for (let i = 0; i < gruppe && tiere.length < 8; i++) {
            tiere.push({
                x: (vonLinks ? -rand - 8 : rand + 8) + (vonLinks ? -1 : 1) * i * zufall(5, 9),
                h: spieler.h + zufall(20, 85) + (i === 0 ? 0 : zufall(-7, 7)),
                vx: (vonLinks ? 1 : -1) * (flink ? zufall(7, 12) : zufall(2.5, 6)),
                vh: 0,
                emoji: emoji,
                groesse: zufall(2.2, 3.8),
                phase: zufall(0, 6),
                wellenHoehe: flink ? zufall(5, 9) : zufall(1, 3),
                wellenTempo: flink ? zufall(1.2, 2) : zufall(0.6, 1.2),
            });
        }
    }
}


/* ----------------------------------------------------------------
   DIE DURCHKOMM-GARANTIE
   ----------------------------------------------------------------
   Prüft ein frisch gebautes Streckenstück Band für Band (alle 5 E):
   Bleibt zwischen den Felsen überall eine freie Lücke von mindestens
   KONFIG.level.mindestLuecke E übrig? Wenn nicht, werden so lange
   die kleinsten Felsen des Bandes entfernt, bis der Weg frei ist.
   So kann KEIN Zufalls-Muster je eine Höhle oder einen Gang zubauen –
   und auch der groß gewachsene Fisch klemmt nirgendwo fest.
   (Pflanzen zählen nicht: Sie sind weich und bremsen nur.)
   ---------------------------------------------------------------- */
function durchkommenSichern(hindernisListe) {
    const rHit = KONFIG.fisch.hitboxMax;          // Größte Hitbox des Fisches
    const grenze = spielfeldBreite() / 2 - 1.5;   // Spielfeld-Rand
    const minLuecke = KONFIG.level.mindestLuecke;

    const felsen = hindernisListe.filter(hi => hi.art === "fels");
    if (felsen.length === 0) return;
    let minH = Infinity, maxH = -Infinity;
    for (const f of felsen) {
        minH = Math.min(minH, f.h);
        maxH = Math.max(maxH, f.h);
    }

    const entfernen = new Set();
    for (let bandH = minH; bandH <= maxH; bandH += 5) {
        // Sicherheits-Schleife: pro Band höchstens so viele Steine
        // entfernen, wie es überhaupt gibt.
        for (let runde = 0; runde < felsen.length; runde++) {
            // Alle Felsen sammeln, die in dieses Höhen-Band hineinragen.
            // "reichweite" = wie weit der Fels die Fisch-MITTE blockiert
            // (Fels-Radius + Fisch-Hitbox, mal dem Hitbox-Faktor 0.75):
            const belegt = [];
            for (const f of felsen) {
                if (entfernen.has(f)) continue;
                const reichweite = (f.r + rHit) * 0.75;
                if (Math.abs(f.h - bandH) > reichweite) continue;
                belegt.push([f.x - reichweite, f.x + reichweite, f]);
            }
            if (belegt.length === 0) break;
            belegt.sort((a, b) => a[0] - b[0]);

            // Die größte freie Lücke in diesem Band ausmessen:
            let groessteLuecke = 0, cursor = -grenze;
            for (const [von, bis] of belegt) {
                groessteLuecke = Math.max(groessteLuecke, Math.min(von, grenze) - cursor);
                cursor = Math.max(cursor, bis);
            }
            groessteLuecke = Math.max(groessteLuecke, grenze - cursor);
            if (groessteLuecke >= minLuecke) break;   // Alles gut – nächstes Band!

            // Zu eng! Den KLEINSTEN Fels des Bandes herausnehmen (so
            // bleibt möglichst viel von der gebauten Kulisse stehen):
            let kleinster = null;
            for (const [, , f] of belegt) {
                if (!kleinster || f.r < kleinster.r) kleinster = f;
            }
            entfernen.add(kleinster);
        }
    }

    if (entfernen.size > 0) {
        for (let i = hindernisListe.length - 1; i >= 0; i--) {
            if (entfernen.has(hindernisListe[i])) hindernisListe.splice(i, 1);
        }
    }
}

/* ----------------------------------------------------------------
   HINDERNIS-DEKO – jede Welt sieht lebendiger aus!
   ----------------------------------------------------------------
   Jedes Hindernis bekommt beim Bauen einmalig sein Aussehen:
   - ein Varianten-Emoji der Welt (verschiedene Steine & Pflanzen,
     siehe EMOJI_VARIANTEN in welten.js),
   - Felsen werden zufällig gespiegelt, leicht gedreht und in der
     Größe gestreut – kein Stein gleicht dem anderen.
   (Nur Optik! Die Hitbox bleibt unverändert fair.)
   ---------------------------------------------------------------- */
function hindernisseSchmuecken(hindernisListe) {
    const welt = aktuelleWelt();
    for (const hi of hindernisListe) {
        if (!hi.emoji) hi.emoji = hindernisEmoji(welt, hi.art);
        if (hi.art === "fels") {
            hi.flip = Math.random() < 0.5;
            hi.dreh = zufall(-0.3, 0.3);
            hi.deko = zufall(0.92, 1.18);   // Größen-Streuung – nur fürs Bild!
        }
    }
}


/* ================================================================
   7. UPDATE: SPIELER-FISCH
   ================================================================
   Aufstieg nach oben (automatisch), Lenken nach links/rechts
   (Finger), Boost-Verwaltung und die Begrenzung des Spielfelds.
   ================================================================ */

function spielerBewegen(dt) {
    // ---- Tempo nach oben berechnen ----
    let tempo = grundTempo();
    if (spieler.boostZeit > 0) tempo *= KONFIG.boost.faktor;    // Garnelen-Boost!
    if (spieler.gebremstZeit > 0) tempo *= 0.4;                 // Nach Rempler kurz langsam
    if (spieler.pflanzenZeit > 0) tempo *= KONFIG.pflanzen.bremsFaktor;  // Im Dickicht geht's langsamer

    spieler.h += tempo * dt;

    // ---- Timer herunterzählen ----
    spieler.boostZeit      = Math.max(0, spieler.boostZeit - dt);
    spieler.gebremstZeit   = Math.max(0, spieler.gebremstZeit - dt);
    spieler.pflanzenZeit   = Math.max(0, spieler.pflanzenZeit - dt);
    spieler.schonzeit      = Math.max(0, spieler.schonzeit - dt);
    spieler.schlaengelZeit = Math.max(0, spieler.schlaengelZeit - dt);

    // ---- Der Anti-Hänger-Wächter ----
    // Kommt der Fisch längere Zeit nicht voran (er hängt z. B. unter
    // einer Felswand), hilft ihm das Spiel automatisch weiter:
    if (spieler.h - festMerkH > 3) {
        festMerkH = spieler.h;
        festTimer = 0;
    } else {
        festTimer += dt;
        if (festTimer > KONFIG.hilfe.festNach) fischBefreien();
    }

    // Während der Schlängel-Hilfe hält der Fisch entschlossen auf die
    // freie Lücke zu – sonst würde er sofort wieder gegen dieselbe
    // Wand gelenkt und bliebe erneut hängen:
    if (spieler.schlaengelZeit > 0 && spieler.schlaengelZielX !== undefined) {
        spieler.zielX = spieler.schlaengelZielX;
    }

    // ---- Nach links/rechts lenken (weich zum Finger-Ziel gleiten) ----
    // Die Formel sorgt für eine sanfte, "schwimmende" Bewegung:
    const weichheit = 1 - Math.exp(-KONFIG.fisch.lenkWeichheit * dt);
    let unterschied = spieler.zielX - spieler.x;
    // Nicht schneller lenken als tempoSeite erlaubt:
    const maxSchritt = KONFIG.fisch.tempoSeite * dt;
    let schritt = unterschied * weichheit;
    schritt = Math.max(-maxSchritt, Math.min(maxSchritt, schritt));
    spieler.x += schritt;

    // ---- Im Spielfeld bleiben! (linker und rechter Rand) ----
    const grenze = spielfeldBreite() / 2 - fischRadius() - KONFIG.spielfeld.randAbstand;
    spieler.x = Math.max(-grenze, Math.min(grenze, spieler.x));
    spieler.zielX = Math.max(-grenze, Math.min(grenze, spieler.zielX));

    // ---- Nur Optik: Schwimm-Wippen und Blasen ----
    // (Beim Boosten und beim Durchschlängeln wedelt der Fisch schneller.)
    spieler.schwimmPhase += dt * (spieler.boostZeit > 0 || spieler.schlaengelZeit > 0 ? 14 : 7);
    if (spieler.boostZeit > 0 && Math.random() < 0.5) {
        blase(spieler.x + zufall(-1, 1), spieler.h - fischRadius());   // Boost-Blasen hinterm Fisch
    } else if (Math.random() < 0.05) {
        blase(spieler.x, spieler.h - fischRadius());                   // Ab und zu eine normale Blase
    }

    // ---- DIE WASSEROBERFLÄCHE ERREICHT? Dann: SPRUNG! ----
    if (spieler.h >= KONFIG.level.streckeProWelt) {
        sprungStarten();
    }
}

/* ---------- ANTI-HÄNGER-HILFE ----------
   Sucht die nächstgelegene freie Lücke zwischen den Felsen direkt
   über dem Fisch und gibt ihre Mitte zurück. */
function freieLuecke() {
    const grenze = spielfeldBreite() / 2 - 2;
    const rHit = Math.min(fischRadius(), KONFIG.fisch.hitboxMax);

    // Alle Felsen knapp über dem Fisch als "belegte Bereiche" sammeln:
    const belegt = [];
    for (const hi of hindernisse) {
        if (hi.art !== "fels" || hi.weg) continue;
        if (hi.h <= spieler.h || hi.h > spieler.h + 20) continue;
        const breit = (hi.r + rHit) * 0.75;
        belegt.push([hi.x - breit, hi.x + breit]);
    }
    belegt.sort((a, b) => a[0] - b[0]);

    // Die freien Lücken dazwischen finden:
    const luecken = [];
    let cursor = -grenze;
    for (const [von, bis] of belegt) {
        if (von > cursor + 1.5) luecken.push([cursor, Math.min(von, grenze)]);
        cursor = Math.max(cursor, bis);
    }
    if (cursor < grenze - 1.5) luecken.push([cursor, grenze]);
    if (luecken.length === 0) return spieler.x;   // Alles zu? Dann hilft nur Schlängeln.

    // Die dem Fisch nächstgelegene Lücke auswählen:
    let besteMitte = spieler.x, besterAbstand = Infinity;
    for (const [von, bis] of luecken) {
        const mitte = (von + bis) / 2;
        const abstand = Math.abs(mitte - spieler.x);
        if (abstand < besterAbstand) { besterAbstand = abstand; besteMitte = mitte; }
    }
    return besteMitte;
}

// Befreit einen festhängenden Fisch: Er schwimmt zur nächsten freien
// Lücke und macht sich dabei kurz "ganz schmal" (Schlängel-Modus),
// um auch durch enge Stellen zu flutschen.
function fischBefreien() {
    festTimer = 0;
    festMerkH = spieler.h;
    spieler.schlaengelZeit = KONFIG.hilfe.schlaengelDauer;
    spieler.schlaengelZielX = freieLuecke();
    spieler.zielX = spieler.schlaengelZielX;
    for (let i = 0; i < 6; i++) {
        blase(spieler.x + zufall(-2, 2), spieler.h + zufall(-2, 2));
    }
}


/* ================================================================
   8. UPDATE: KOLLISIONEN
   ================================================================
   Hier wird geprüft, ob der Fisch etwas berührt:
   - Garnele  → einsammeln, Boost, evtl. wachsen
   - Pflanze  → nur sanft abbremsen (tut nicht weh)
   - Fels     → sanft wegschieben + kurz abbremsen
   Außerdem: An jeder Abzweigung wird geschaut, welchen Weg der
   Fisch gewählt hat (führt er in eine Höhle?).
   Alle Treffer sind absichtlich FEHLERVERZEIHEND eingestellt:
   Hitboxen sind kleiner als die Bilder, nichts führt zum Game Over.
   ================================================================ */

// Abstand zwischen dem Fisch und einem Punkt in der Welt (in E):
function abstandZumFisch(x, h) {
    const dx = x - spieler.x;
    const dh = h - spieler.h;
    return Math.sqrt(dx * dx + dh * dh);
}

function kollisionenPruefen(dt) {
    const r = fischRadius();
    // Für Hindernisse zählt höchstens hitboxMax – auch ein groß
    // gewachsener Fisch passt so noch durch jede Lücke:
    const rHit = Math.min(r, KONFIG.fisch.hitboxMax);
    // Im Schlängel-Modus (Anti-Hänger-Hilfe) macht sich der Fisch
    // noch schmaler, um durch enge Stellen zu flutschen:
    const hitboxFaktor = spieler.schlaengelZeit > 0 ? 0.5 : 0.75;

    // ---------- GARNELEN einsammeln ----------
    for (let i = garnelen.length - 1; i >= 0; i--) {
        const g = garnelen[i];
        if (g.weg) continue;   // Davonschwimmende Abzweigungs-Garnelen zählen nicht mehr
        // fangHilfe macht den Fang-Radius extra groß (fehlerverzeihend):
        if (abstandZumFisch(g.x, g.h) < r + KONFIG.garnelen.radius + KONFIG.garnelen.fangHilfe) {
            garnelen.splice(i, 1);                    // Garnele verschwindet
            spieler.garnelenGesamt++;
            spieler.boostZeit = KONFIG.boost.dauer;   // Geschwindigkeits-Boost!
            funkeln(g.x, g.h);                        // Glitzer-Effekt
            SOUND.garnele();

            // Genug Garnelen gefressen? Dann wachsen!
            if (spieler.garnelenGesamt % KONFIG.garnelen.fuersWachstum === 0
                && spieler.wachstum < KONFIG.fisch.maxWachstum) {
                spieler.wachstum++;
                meldung("Du wächst! 🐟✨");
                SOUND.wachsen();
            }
            hudAktualisieren();
        }
    }

    // ---------- HINDERNISSE (Felsen & Pflanzen) ----------
    for (const hi of hindernisse) {
        if (hi.weg) continue;   // Davonschwimmende Abzweigungs-Teile sind nur noch Deko
        const dx = spieler.x - hi.x;
        const dh = spieler.h - hi.h;
        const abstand = Math.sqrt(dx * dx + dh * dh);
        // Die Hitbox ist kleiner als das Bild (fehlerverzeihend):
        const mindestAbstand = (rHit + hi.r) * hitboxFaktor;

        if (abstand < mindestAbstand) {
            if (hi.art === "pflanze") {
                // Pflanzen sind weich: Sie tun nicht weh, aber im Dickicht
                // schwimmt man SPÜRBAR langsamer (wie durch echtes Seegras).
                spieler.pflanzenZeit = KONFIG.pflanzen.nachwirkung;
                if (Math.random() < 0.1) blase(spieler.x, spieler.h);
            } else {
                // Felsen: den Fisch sanft aus dem Hindernis herausschieben.
                const ueberlappung = mindestAbstand - abstand;
                // Richtung vom Hindernis weg (falls genau mittig: zur Seite):
                const nx = abstand > 0.01 ? dx / abstand : 1;
                const nh = abstand > 0.01 ? dh / abstand : 0;
                spieler.x += nx * ueberlappung;
                // Im Schlängel-Modus drückt der Fels kaum noch nach unten –
                // so windet sich der Fisch durch die enge Stelle hindurch:
                spieler.h += nh * ueberlappung * (spieler.schlaengelZeit > 0 ? 0.25 : 1);

                // Drückt der Fels hauptsächlich nach UNTEN (der Fisch hängt
                // unter einer Wand) und der Finger lenkt gerade nirgendwohin?
                // Dann seitlich am Fels vorbeirutschen statt hängen zu bleiben:
                if (nh < -0.5 && Math.abs(spieler.zielX - spieler.x) < 2) {
                    spieler.zielX = spieler.x + (nx >= 0 ? 5 : -5);
                }

                // Beim ersten Aufprall: kurz bremsen + "Autsch"-Ton
                if (spieler.gebremstZeit <= 0) {
                    spieler.gebremstZeit = 0.5;
                    SOUND.rempler();
                }
            }
        }
    }

    // ---------- ABZWEIGUNGEN: Welchen Weg wählt der Fisch? ----------
    for (const zone of zonen) {
        // Kommt eine Abzweigung in Sicht, wird die ENTSCHEIDUNG angekündigt:
        // Eine Meldung ploppt auf und über den Gängen schweben Wegweiser
        // (zeichnet abzweigungWegweiser) – so weiß man im fließenden Spiel
        // rechtzeitig: Gleich muss ich mich entscheiden – links, Mitte, rechts?
        if (!zone.hinweisGezeigt && zone.gewaehlt < 0
            && spieler.h < zone.vonH && zone.vonH - spieler.h < 55) {
            zone.hinweisGezeigt = true;
            const alleHoehle = zone.kanaele.every(k => k.art === "hoehle");
            meldung(alleHoehle ? "Alle Wege führen in die Höhle! 🕳️"
                               : "Wähle deinen Weg! 🤔");
        }

        // Schon MITTEN in der Abzweigung wird geschaut, in welchen Gang
        // der Fisch geschwommen ist – die anderen Wege räumen dann sofort
        // das Feld: Sie schwimmen zur Seite davon und verschwinden!
        if (zone.gewaehlt < 0 && spieler.h > zone.vonH + 30 && spieler.h < zone.bisH) {
            const drin = zone.kanaele.find(k => spieler.x >= k.von + 1 && spieler.x <= k.bis - 1);
            if (drin) {
                zone.gewaehlt = drin.kanal;
                andereWegeAusblenden(zone);
            }
        }

        // Oben angekommen: die Wahl gilt!
        if (zone.entschieden || spieler.h <= zone.bisH) continue;
        zone.entschieden = true;
        let kanal = zone.kanaele.find(k => spieler.x >= k.von && spieler.x < k.bis);
        if (!kanal) {
            // Zur Not zählt der nächstgelegene Gang:
            let bester = Infinity;
            for (const k of zone.kanaele) {
                const abstand = Math.abs((k.von + k.bis) / 2 - spieler.x);
                if (abstand < bester) { bester = abstand; kanal = k; }
            }
        }
        if (kanal.art === "hoehle") {
            hoehleStarten((kanal.von + kanal.bis) / 2);   // Ab in die dunkle Höhle!
        } else if (kanal.art === "garnelen") {
            meldung("Leckerer Weg! 🦐");
        } else {
            meldung("Gut durchgeschlängelt! 🌿");
        }
    }
}

// Der Fisch hat sich für einen Gang entschieden: Alle Teile der ANDEREN
// Wege dieser Abzweigung schwimmen nach außen davon und verblassen.
function andereWegeAusblenden(zone) {
    const gewaehlt = zone.kanaele.find(k => k.kanal === zone.gewaehlt);
    const mitteG = (gewaehlt.von + gewaehlt.bis) / 2;
    const wegDamit = (teil) => {
        teil.weg = true;
        teil.alpha = 1;
        // Nach außen davonschwimmen (weg vom gewählten Gang):
        teil.vx = (teil.x >= mitteG ? 1 : -1) * zufall(15, 28);
    };

    for (const hi of hindernisse) {
        if (hi.zonenId !== zone.id || hi.weg) continue;
        if (hi.kanal === zone.gewaehlt) continue;           // Der eigene Weg bleibt!
        if (hi.kanal === -1) continue;                      // Gesperrte Spuren sind Kulisse, die bleibt
        if (hi.kanal === -2 && hi.nachbarn.includes(zone.gewaehlt)) continue;  // Die Wand am eigenen Gang bleibt
        wegDamit(hi);
    }
    for (const g of garnelen) {
        if (g.zonenId === zone.id && !g.weg && g.kanal !== zone.gewaehlt) wegDamit(g);
    }
    // Auch das dunkle Höhlen-Loch eines NICHT gewählten Weges blendet aus:
    for (const k of zone.kanaele) {
        if (k.kanal !== zone.gewaehlt) k.weg = true;
    }
}


/* ================================================================
   9. UPDATE: HÖHLEN
   ================================================================
   Wählt der Fisch an einer Abzweigung den Höhlen-Eingang, wird es
   DUNKEL: Steinige Gänge, kaum Pflanzen, andere Tiere – und der
   Hai findet einen hier viel schneller! Nach ein paar Bildschirmen
   schwimmt man oben wieder ins helle Wasser hinaus.
   ================================================================ */

function hoehleStarten(eintrittX = spieler.x) {
    // Wie lang wird die Höhle? (Nie länger, als bis zur Zielgeraden Platz ist.)
    const maxEnde = KONFIG.level.streckeProWelt - KONFIG.level.freieZielgerade - 40;
    const laenge = Math.min(zufall(KONFIG.hoehle.minLaenge, KONFIG.hoehle.maxLaenge),
                            maxEnde - spieler.h);
    if (laenge < 60) return;   // Zu nah am Ziel? Dann bleibt es hell.

    hoehle = { startH: spieler.h, endeH: spieler.h + laenge };
    hoehleBesucht = true;   // Die Höhlen-Garantie dieser Welt ist erfüllt!

    // Die "Hineinschwimm"-Animation: Das dunkle Höhlenloch wächst gleich
    // hinter dem Fisch über den ganzen Bildschirm – als würde er wirklich
    // in den Felsen hineintauchen. Dazu wirbeln Blasen am Eingang auf:
    hoehlenEintritt = { x: eintrittX, h: spieler.h - 5, zeit: 0 };
    for (let i = 0; i < 10; i++) {
        blase(eintrittX + zufall(-6, 6), spieler.h + zufall(-5, 2));
    }

    // Alles, was oberhalb des Bildschirms schon "normal" gebaut wurde,
    // wegräumen – ab hier wird als Höhle weitergebaut:
    const grenze = spieler.h + 55;
    hindernisse = hindernisse.filter(hi => hi.h < grenze);
    garnelen = garnelen.filter(g => g.h < grenze);
    zonen = zonen.filter(z => z.vonH < grenze);
    naechsteBauH = grenze;
    // In der Höhle gibt es keine Abzweigungen – die nächste kommt danach:
    naechsteAbzweigungH = Math.max(naechsteAbzweigungH, hoehle.endeH + 60);

    // GEFAHR: In Höhlen wird man viel schneller vom Hai gefunden!
    naechsterAngreifer = Math.min(naechsterAngreifer,
        spielZeit + KONFIG.angreifer.hoehleSpawnAb + zufall(0, 4));

    // Die Hintergrund-Tiere erschrecken sich vor der dunklen Höhle:
    // Sie schwimmen schnell davon und verschwinden nach und nach –
    // in die Höhle traut sich von ihnen keiner hinein!
    for (const t of tiere) {
        t.flieht = true;
        t.vx = (t.x >= 0 ? 1 : -1) * Math.max(Math.abs(t.vx) * 2, 9);
    }

    meldung("Eine dunkle Höhle! 🕳️");
    SOUND.hoehle();
}

// Wie dunkel ist es gerade? 0 = hell, 1 = ganz dunkel.
// Am Höhlen-Anfang und -Ende wird sanft ein-/ausgeblendet:
function hoehleDunkel() {
    if (!hoehle) return 0;
    const rein = (spieler.h - hoehle.startH) / 8;    // Beim Hineinschwimmen wird es ZÜGIG dunkel
    const raus = (hoehle.endeH - spieler.h) / 14;    // Am Ausgang wird es sanft wieder hell
    return Math.max(0, Math.min(1, rein, raus));
}

function hoehleUpdate(dt) {
    // Die Hineinschwimm-Animation weiterlaufen lassen:
    if (hoehlenEintritt) {
        hoehlenEintritt.zeit += dt;
        if (hoehlenEintritt.zeit > 1.4) hoehlenEintritt = null;
    }

    // Das Ende der Höhle erreicht? Wieder raus ins Helle!
    if (hoehle && spieler.h > hoehle.endeH) {
        hoehle = null;
        meldung("Wieder im hellen Wasser! ☀️");
    }
}


/* ================================================================
   10. UPDATE: HAI-KI (der Verfolger)
   ================================================================
   Der Hai taucht UNTER dem Fisch auf und jagt ihn nach oben. Er
   ist etwas schneller als der Fisch OHNE Boost – aber:
   - Mit Garnelen-Boost hängt man ihn ab.
   - In Hindernissen wird der Hai stark gebremst
     (kluge Wegwahl durch enge Stellen lohnt sich!).
   - Nach "fluchtAbstand" E Rückstand oder "maxVerfolgung"
     Sekunden gibt er auf → "Hai abgehängt!"
   In HÖHLEN taucht er viel schneller auf – Vorsicht!
   ================================================================ */

// Der Hai gibt auf: Er dreht LANGSAM ab – mal taucht er gemächlich
// nach unten weg, mal verschwindet er zur Seite in einen "falschen Gang".
// Das wirkt viel echter, als wenn er einfach blitzschnell wegzappt.
function haiGibtAuf(a) {
    a.flieht = true;
    a.fluchtVx = (Math.random() < 0.5 ? -1 : 1) * zufall(4, 9);   // Leicht zur Seite abdrehen
    a.fluchtTempo = zufall(KONFIG.angreifer.fluchtTempoMin, KONFIG.angreifer.fluchtTempoMax);
}

function angreiferUpdate(dt) {
    // ---- Neuen Hai spawnen, wenn es Zeit ist (aber nicht kurz vorm Ziel) ----
    // Die HAI-GARANTIE: Sind bis zur Level-Mitte noch keine
    // KONFIG.angreifer.minProWelt Haie gekommen, wird sofort nachgelegt –
    // jede Welt bekommt ihre Verfolgungsjagden!
    const haiFehlt = haisGesamt < KONFIG.angreifer.minProWelt
        && spieler.h > KONFIG.level.streckeProWelt * 0.45
        && spielZeit > KONFIG.angreifer.erstesSpawnAb;
    if (!angreifer && (spielZeit > naechsterAngreifer || haiFehlt)
        && spieler.h < KONFIG.level.streckeProWelt - 150) {
        angreifer = {
            x: spieler.x + zufall(-10, 10),
            h: spieler.h - KONFIG.angreifer.startAbstand,   // Startet weit unterhalb des Bildschirms
            verfolgZeit: 0,         // Wie lange er schon jagt
            nahZeit: 0,             // Wie lange er schon DICHT dran ist (sichtbar!)
            warNah: false,          // Hat er den Fisch überhaupt schon erreicht?
            flieht: false,          // true = er hat aufgegeben und zieht ab
            phase: 0,               // Nur für die Optik (Schwanzflossen-Wedeln)
            bewX: 0, bewH: 1,       // Seine Schwimmrichtung (fürs Zeichnen)
        };
        haisGesamt++;
        meldung("Achtung, ein Hai nähert sich von hinten! 🦈");
        SOUND.angreifer();
    }
    if (!angreifer) return;

    const a = angreifer;
    a.phase += dt * 10;

    // ---- Wenn er aufgegeben hat: LANGSAM abdrehen und verschwinden ----
    if (a.flieht) {
        const sinkTempo = grundTempo() * a.fluchtTempo;
        a.h -= sinkTempo * dt;              // Gemächlich zurückfallen …
        a.x += a.fluchtVx * dt;             // … und dabei zur Seite abdrehen
        const laenge = Math.sqrt(a.fluchtVx * a.fluchtVx + sinkTempo * sinkTempo) || 1;
        a.bewX = a.fluchtVx / laenge;
        a.bewH = -sinkTempo / laenge;
        // Ganz aus dem Bild (unten ODER seitlich)? Dann weg damit
        // und den Timer für den nächsten Hai stellen:
        if (a.h < spieler.h - 70 || Math.abs(a.x) > schirmBreiteE / 2 + 25) {
            angreifer = null;
            naechsterAngreifer = spielZeit + KONFIG.angreifer.spawnAbstand
                               + zufall(0, KONFIG.angreifer.spawnZufall);
        }
        return;
    }

    // ---- Verfolgen: Richtung zum Spieler-Fisch berechnen ----
    a.verfolgZeit += dt;
    let tempo = grundTempo() * KONFIG.angreifer.tempoFaktor;

    // Steckt der Hai in einem Hindernis? Dann stark bremsen!
    for (const hi of hindernisse) {
        if (hi.art === "pflanze" || hi.weg) continue;   // Durch Pflanzen kommt er gut durch
        const dx = a.x - hi.x, dh = a.h - hi.h;
        if (dx * dx + dh * dh < (hi.r + KONFIG.angreifer.radius) ** 2 * 0.6) {
            tempo *= KONFIG.angreifer.bremseInHindernis;
            break;
        }
    }

    // Beim Jagen schlängelt der Hai leicht hin und her – das sieht
    // lebendig aus und gibt dem Fisch eine faire Chance auszuweichen:
    const zielX = spieler.x + Math.sin(a.verfolgZeit * 2.2) * 5;
    const dx = zielX - a.x;
    const dh = spieler.h - a.h;
    const abstand = Math.sqrt(dx * dx + dh * dh) || 0.01;

    // Ist der Hai noch WEIT weg? Dann holt er RICHTIG auf – er soll ja
    // wirklich auftauchen und jagen, nicht nur eine Meldung bleiben:
    if (abstand > KONFIG.angreifer.aufholAb) {
        const weit = Math.min(1, (abstand - KONFIG.angreifer.aufholAb) / 30);
        tempo *= 1 + weit * (KONFIG.angreifer.aufholFaktor - 1);
    }
    // Und ganz nah dran macht er einen Schnapp-Spurt!
    if (abstand < KONFIG.angreifer.bissAbstand) {
        tempo *= KONFIG.angreifer.spurtFaktor;
    }

    // Auf den Fisch zuschwimmen (normalisierte Richtung × Tempo):
    a.x += (dx / abstand) * tempo * dt;
    a.h += (dh / abstand) * tempo * dt;
    a.bewX = dx / abstand;
    a.bewH = dh / abstand;

    // ---- Merken: Ist der Hai schon richtig nah dran gewesen? ----
    // Erst wenn er den Fisch WIRKLICH erreicht hat (man sieht ihn also
    // direkt hinter sich!) und dort eine Weile gejagt hat, kann man ihn
    // überhaupt abhängen. Vorher bleibt er hartnäckig auf der Spur –
    // ein "Hai abgehängt!" ohne je einen Hai gesehen zu haben, gibt es
    // damit nicht mehr.
    if (abstand < KONFIG.angreifer.nahAbstand) {
        a.warNah = true;
        a.nahZeit += dt;
    }

    // ---- Hat der Fisch den Hai abgehängt? ----
    // Wichtig: Solange der Hai DICHT dran ist, gibt er NIE einfach so
    // auf – eine echte Verfolgungsjagd endet erst, wenn man ihn nach
    // einer richtigen Jagd abschüttelt (oder er zuschnappt)!
    const rueckstand = spieler.h - a.h;
    const jagdWarEcht = a.warNah && a.nahZeit >= KONFIG.angreifer.minNahZeit;
    if (jagdWarEcht
        && (rueckstand > KONFIG.angreifer.fluchtAbstand
            || (a.verfolgZeit > KONFIG.angreifer.maxVerfolgung && abstand > 25))) {
        meldung(zufallAus([
            "Hai abgehängt! 🎉",
            "Der Hai schwimmt in den falschen Gang! 🦈💨",
            "Der Hai gibt auf und zieht davon! 🎉",
        ]));
        SOUND.abgehaengt();
        haiGibtAuf(a);
        return;
    }
    // Sicherheitsnetz: Findet der Hai ewig nicht zum Fisch (z. B. hinter
    // Felsen verkeilt), zieht er irgendwann LEISE ab – ohne Jubel-Meldung,
    // denn abgehängt hat man ihn ja nicht wirklich:
    if (!jagdWarEcht && a.verfolgZeit > KONFIG.angreifer.notAufgabe) {
        haiGibtAuf(a);
        return;
    }

    // ---- Hat der Hai den Fisch erwischt? ----
    if (abstandZumFisch(a.x, a.h) < fischRadius() + KONFIG.angreifer.radius * 0.7
        && spieler.schonzeit <= 0) {
        // Kindgerecht: KEIN Game Over! Der Fisch verliert eine Wachstums-Stufe,
        // ist kurz unverwundbar und bekommt einen Flucht-Boost geschenkt.
        spieler.wachstum = Math.max(0, spieler.wachstum - 1);
        spieler.schonzeit = KONFIG.fisch.schonzeit;
        spieler.boostZeit = KONFIG.boost.dauer * 1.5;   // Flucht-Boost!
        meldung("Ohje! Schnell weg! 💨");
        SOUND.erwischt();
        haiGibtAuf(a);   // Der Hai ist zufrieden und zieht gemächlich ab
    }
}


/* ================================================================
   11. ZEICHNEN
   ================================================================
   Malt jedes Bild komplett neu: Wasser, Himmel & Wellen (wenn die
   Oberfläche in Sicht kommt), Meeresboden (nur am Start), Tiere,
   Hindernisse, Garnelen, den HAI (als richtige, große Figur!),
   den Spieler-Fisch und alle Effekte.
   Reihenfolge = Ebenen: Was zuerst gemalt wird, liegt hinten.
   ================================================================ */

// Die Kamera folgt dem Fisch nach oben – aber kurz vor der Oberfläche
// bleibt sie stehen, damit man das Wasser-Ende schön sehen kann und
// der Fisch selbst auf dem Bildschirm nach oben schwimmt:
function kameraH() {
    const maxKamera = KONFIG.level.streckeProWelt - (FISCH_SCHIRM_Y - 24);
    return Math.min(spieler.h, maxKamera);
}

// Rechnet Welt-Positionen in Bildschirm-Pixel um:
function schirmX(x) {
    return breitePx / 2 + x * E;
}
function schirmY(h) {
    return (FISCH_SCHIRM_Y - (h - kameraH())) * E;
}

// Mischt zwei Hex-Farben ("#rrggbb"): t = 0 → nur farbeA, t = 1 → nur farbeB
function mischFarben(farbeA, farbeB, t) {
    const a = parseInt(farbeA.slice(1), 16);
    const b = parseInt(farbeB.slice(1), 16);
    const mix = (bitVersatz) => {
        const kanalA = (a >> bitVersatz) & 255;
        const kanalB = (b >> bitVersatz) & 255;
        return Math.round(kanalA + (kanalB - kanalA) * t);
    };
    return `rgb(${mix(16)}, ${mix(8)}, ${mix(0)})`;
}

// Malt ein Emoji zentriert an eine Pixel-Position – über den schnellen
// Sprite-Cache (siehe oben), statt es jedes Mal neu als Text zu rendern.
// groessePx = ungefährer Radius in Pixeln, spiegeln = umdrehen, drehung in Bogenmaß
function zeichneEmoji(emoji, x, y, groessePx, spiegeln = false, drehung = 0) {
    const sprite = emojiSprite(emoji, groessePx);
    const seite = sprite.seite * (groessePx / sprite.stufe);   // Feinabstimmung der Größe

    // Der häufigste Fall (nicht gespiegelt, nicht gedreht) kommt ganz
    // ohne teure Transformationen aus:
    if (!spiegeln && !drehung) {
        ctx.drawImage(sprite.bild, x - seite / 2, y - seite / 2, seite, seite);
        return;
    }
    ctx.save();
    ctx.translate(x, y);
    if (drehung) ctx.rotate(drehung);
    if (spiegeln) ctx.scale(-1, 1);      // Emojis schauen meist nach links → umdrehen
    ctx.drawImage(sprite.bild, -seite / 2, -seite / 2, seite, seite);
    ctx.restore();
}

/* ---------- PFLANZEN – fest verwurzelt, nicht schwebend! ----------
   Jede Pflanze bekommt einen kleinen Sand-Sockel mit Steinchen,
   auf dem sie fest steht. Und sie wiegt sich um ihren FUSS in der
   Strömung – nicht um die Mitte. So schwebt nichts mehr in der Luft! */
// Der Sockel (Sandhügel + Steinhaufen) wird pro Farbe und Größenstufe nur
// EINMAL vorgerendert – das spart bei vollen Pflanzenwäldern viele
// Zeichenbefehle pro Bild (Performance auf dem Handy!):
function sockelSprite(bodenFarbe, groessePx) {
    const stufe = Math.max(4, Math.round(groessePx / 4) * 4);
    const key = "sockel" + bodenFarbe + "@" + stufe;
    let sprite = spriteCache.get(key);
    if (!sprite) {
        const dpr = window.devicePixelRatio || 1;
        const w = Math.ceil(stufe * 2.4), h = Math.ceil(stufe * 1.1);
        const c = document.createElement("canvas");
        c.width = Math.ceil(w * dpr); c.height = Math.ceil(h * dpr);
        const cx = c.getContext("2d");
        cx.scale(dpr, dpr);
        const mx = w / 2, my = h * 0.45;   // Bezugspunkt = Fuß der Pflanze

        // Der kleine Sandhügel als Untergrund …
        cx.fillStyle = bodenFarbe;
        cx.beginPath();
        cx.ellipse(mx, my + stufe * 0.12, stufe * 0.95, stufe * 0.26, 0, 0, Math.PI * 2);
        cx.fill();
        // … und darauf ein Haufen dicker, runder Steine, aus dem die
        // Pflanze herauswächst – so wie Anemonen in echt auf Fels sitzen:
        const steine = [   // [x-Versatz, y-Versatz, Radius, Farbe]
            [-0.55,  0.04, 0.32, "#6b625a"],
            [ 0.52,  0.08, 0.28, "#756c62"],
            [ 0.05,  0.10, 0.40, "#7d746a"],
            [-0.18, -0.06, 0.24, "#655c54"],
        ];
        for (const [sx, sy, sr, farbe] of steine) {
            cx.fillStyle = farbe;
            cx.beginPath();
            cx.arc(mx + sx * stufe, my + sy * stufe, sr * stufe, 0, Math.PI * 2);
            cx.fill();
        }
        sprite = { bild: c, w, h, stufe };
        spriteCache.set(key, sprite);
    }
    return sprite;
}

function zeichnePflanze(emoji, px, py, groessePx, wackeln, bodenFarbe) {
    const basisY = py + groessePx * 0.85;   // Hier "steht" die Pflanze

    // Der vorgerenderte Sockel (Sandhügel + Steine) aus dem Cache:
    const sockel = sockelSprite(bodenFarbe, groessePx);
    const skala = groessePx / sockel.stufe;
    ctx.drawImage(sockel.bild, px - sockel.w * skala / 2, basisY - sockel.h * skala * 0.45,
                  sockel.w * skala, sockel.h * skala);

    // Die Pflanze selbst – sie dreht sich um ihren Fußpunkt zwischen den
    // Steinen (das Emoji sitzt dafür mit seiner Unterkante am Drehpunkt):
    ctx.save();
    ctx.translate(px, basisY);
    ctx.rotate(wackeln);
    zeichneEmoji(emoji, 0, -groessePx * 0.9, groessePx);
    ctx.restore();
}

/* ---------- DER HAI – eine richtige, selbstgemalte Figur! ----------
   Kein kleines Emoji mehr: Der Hai wird mit Körper, Bauch, Flossen,
   Auge und Maul direkt aufs Canvas gemalt und dreht sich immer in
   seine Schwimmrichtung. s = seine Größe in Pixeln.
   schnapp (0–1): Wie weit er das Maul aufreißt, wenn er nah dran ist! */
function zeichneHai(px, py, s, winkel, phase, schnapp = 0) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(winkel);
    const wedeln = Math.sin(phase) * 0.3;

    // Schwanzflosse (wedelt hin und her):
    ctx.fillStyle = "#5c7386";
    ctx.save();
    ctx.translate(-1.5 * s, 0);
    ctx.rotate(wedeln);
    ctx.beginPath();
    ctx.moveTo(0.2 * s, 0);
    ctx.lineTo(-0.8 * s, -0.9 * s);
    ctx.lineTo(-0.45 * s, 0);
    ctx.lineTo(-0.8 * s, 0.9 * s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Rückenflosse (die berühmte Hai-Flosse!):
    ctx.beginPath();
    ctx.moveTo(0.0 * s, -0.65 * s);
    ctx.quadraticCurveTo(-0.5 * s, -1.8 * s, -1.0 * s, -0.65 * s);
    ctx.closePath();
    ctx.fill();

    // Der Körper (schön breit – ein richtig stattlicher Hai!):
    ctx.fillStyle = "#7d93a6";
    ctx.beginPath();
    ctx.ellipse(0, 0, 1.7 * s, 0.95 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Der helle Bauch:
    ctx.fillStyle = "#dfe9f0";
    ctx.beginPath();
    ctx.ellipse(0.15 * s, 0.38 * s, 1.3 * s, 0.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Die Seitenflosse:
    ctx.fillStyle = "#5c7386";
    ctx.beginPath();
    ctx.moveTo(0.1 * s, 0.25 * s);
    ctx.lineTo(-0.55 * s, 1.1 * s);
    ctx.lineTo(-0.45 * s, 0.3 * s);
    ctx.closePath();
    ctx.fill();

    // Das Auge:
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(0.95 * s, -0.25 * s, 0.2 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a2530";
    ctx.beginPath();
    ctx.arc(1.0 * s, -0.25 * s, 0.1 * s, 0, Math.PI * 2);
    ctx.fill();

    // Das Maul (ein freundlich-gefährlicher Bogen) – kurz vorm
    // Zuschnappen reißt der Hai es sichtbar weiter auf:
    ctx.strokeStyle = "#3a4a5a";
    ctx.lineWidth = Math.max(1.5, (0.08 + schnapp * 0.12) * s);
    ctx.beginPath();
    ctx.arc(0.85 * s, 0.3 * s, (0.55 + schnapp * 0.3) * s,
            Math.PI * 0.1, Math.PI * (0.55 + schnapp * 0.2));
    ctx.stroke();

    ctx.restore();
}

function allesZeichnen(zeitstempel) {
    const welt = aktuelleWelt();
    const strecke = KONFIG.level.streckeProWelt;
    const dunkel = hoehleDunkel();

    // ---------- 1. Wasser (Farbverlauf der aktuellen Welt) ----------
    // Je höher der Fisch steigt, desto HELLER wird das Wasser –
    // in Höhlen wird stattdessen alles DUNKEL:
    const anteil = Math.min(1, spieler.h / strecke);
    let farbeOben = mischFarben(welt.farbeOben, "#bfe9ff", anteil * 0.55);
    let farbeUnten = mischFarben(welt.farbeUnten, welt.farbeOben, anteil * 0.5);
    if (dunkel > 0) {
        farbeOben = mischFarben(hexAusRgb(farbeOben), "#05060f", dunkel * 0.85);
        farbeUnten = mischFarben(hexAusRgb(farbeUnten), "#05060f", dunkel * 0.85);
    }
    const verlauf = ctx.createLinearGradient(0, 0, 0, hoehePx);
    verlauf.addColorStop(0, farbeOben);
    verlauf.addColorStop(1, farbeUnten);
    ctx.fillStyle = verlauf;
    ctx.fillRect(0, 0, breitePx, hoehePx);

    // ---------- 2. Himmel & Wellen (wenn die Oberfläche in Sicht ist) ----------
    const oberflaecheY = schirmY(strecke);
    if (oberflaecheY > -8 * E) {
        if (oberflaecheY > 0) {
            // Der Himmel über dem Wasser:
            const himmel = ctx.createLinearGradient(0, 0, 0, oberflaecheY);
            himmel.addColorStop(0, "#8fd8ff");
            himmel.addColorStop(1, "#e6f7ff");
            ctx.fillStyle = himmel;
            ctx.fillRect(0, 0, breitePx, oberflaecheY);
            // Die Sonne lacht:
            zeichneEmoji("🌞", breitePx * 0.8, oberflaecheY - 12 * E, 4 * E);
        }
        // Die Wellen-Linie mit weißem Schaum:
        ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
        ctx.lineWidth = 0.8 * E;
        ctx.beginPath();
        for (let x = 0; x <= breitePx; x += 10) {
            const welle = Math.sin(x * 0.025 + zeitstempel * 0.003) * E * 0.8;
            if (x === 0) ctx.moveTo(x, oberflaecheY + welle);
            else ctx.lineTo(x, oberflaecheY + welle);
        }
        ctx.stroke();
        // Ein heller Schimmer direkt unter der Oberfläche:
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        ctx.fillRect(0, oberflaecheY, breitePx, 3 * E);
    }

    // ---------- 3. Meeresboden (nur ganz am Anfang sichtbar) ----------
    const bodenY = schirmY(-3);
    if (bodenY < hoehePx + 10) {
        ctx.fillStyle = welt.farbeBoden;
        ctx.beginPath();
        ctx.moveTo(0, hoehePx);
        for (let x = 0; x <= breitePx; x += 20) {
            const huegel = Math.sin(x * 0.02) * 1.2 * E;
            ctx.lineTo(x, bodenY + huegel);
        }
        ctx.lineTo(breitePx, hoehePx);
        ctx.closePath();
        ctx.fill();
    }

    // ---------- 4. Hintergrund-Tiere (harmlos, nur Kulisse) ----------
    for (const t of tiere) {
        // Fliehende Tiere verblassen langsam (alpha sinkt bis 0):
        ctx.globalAlpha = 0.85 * (t.alpha ?? 1);
        // Die Tiere schwimmen echte Wellen-Bahnen (siehe partikelUpdate)
        // und NEIGEN sich dabei in ihre Schwimmrichtung – wie richtige
        // Delfine, die durchs Wasser ziehen:
        const steigung = Math.atan2(-(t.vh || 0), Math.abs(t.vx)) * 0.7;
        const neigung = t.vx > 0 ? steigung : -steigung;
        // Tiere schauen in ihre Schwimmrichtung (Emojis schauen links):
        zeichneEmoji(t.emoji, schirmX(t.x), schirmY(t.h), t.groesse * E, t.vx > 0, neigung);
    }
    ctx.globalAlpha = 1;

    // ---------- 5. Höhlen-Eingänge (dunkle Löcher an Abzweigungen) ----------
    // Der Eingang sieht jetzt wie ein richtiges Felsenloch aus:
    // innen stockdunkel, nach außen weicher werdend, mit einem
    // grauen Steinrand rundherum.
    for (const zone of zonen) {
        for (const k of zone.kanaele) {
            if (k.art !== "hoehle") continue;
            // Ein nicht gewählter Höhlen-Eingang blendet langsam aus:
            const lochAlpha = k.alpha ?? 1;
            if (lochAlpha <= 0) continue;
            ctx.globalAlpha = lochAlpha;
            const mx = schirmX((k.von + k.bis) / 2);
            const my = schirmY(zone.bisH - 12);
            if (my < -20 * E || my > hoehePx + 20 * E) continue;
            const rx = (k.bis - k.von) * 0.3 * E;
            const ry = 11 * E;

            // Der Fels-Rand um das Loch (etwas größer als das Loch selbst):
            ctx.fillStyle = "rgba(70, 65, 62, 0.9)";
            ctx.beginPath();
            ctx.ellipse(mx, my, rx * 1.25, ry * 1.2, 0, 0, Math.PI * 2);
            ctx.fill();
            // Einzelne Felsbrocken auf dem Rand verteilen:
            ctx.fillStyle = "rgba(95, 88, 82, 0.95)";
            for (let w = 0; w < Math.PI * 2; w += Math.PI / 5) {
                const bx = mx + Math.cos(w) * rx * 1.2;
                const by = my + Math.sin(w) * ry * 1.1;
                ctx.beginPath();
                ctx.arc(bx, by, (1.2 + Math.sin(w * 3) * 0.4) * E, 0, Math.PI * 2);
                ctx.fill();
            }
            // Das dunkle Loch: innen fast schwarz, außen weich auslaufend:
            const loch = ctx.createRadialGradient(mx, my, 0, mx, my, rx);
            loch.addColorStop(0, "rgba(3, 3, 12, 0.98)");
            loch.addColorStop(0.7, "rgba(8, 8, 26, 0.9)");
            loch.addColorStop(1, "rgba(8, 8, 26, 0.55)");
            ctx.fillStyle = loch;
            ctx.beginPath();
            ctx.ellipse(mx, my, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1;

    // ---------- 5b. Höhlen-Felswände ----------
    // In der Höhle wachsen links und rechts zackige Felswände ins
    // Bild – so fühlt es sich wirklich wie ein enger Steingang an.
    // Die Zacken wandern mit der Welt mit (sie hängen an der Höhe h):
    if (dunkel > 0.05) {
        ctx.fillStyle = `rgba(16, 13, 24, ${0.9 * dunkel})`;
        for (const seite of [-1, 1]) {
            const kante = seite < 0 ? 0 : breitePx;   // Linker oder rechter Bildschirmrand
            ctx.beginPath();
            ctx.moveTo(kante, -10);
            for (let y = -10; y <= hoehePx + 10; y += 14) {
                const hWelt = kameraH() + FISCH_SCHIRM_Y - y / E;   // Welt-Höhe an dieser Bildschirmzeile
                const tiefe = (3 + Math.sin(hWelt * 0.25) * 1.4 + Math.sin(hWelt * 0.71) * 0.9)
                              * E * dunkel;
                ctx.lineTo(kante - seite * tiefe, y);
            }
            ctx.lineTo(kante, hoehePx + 10);
            ctx.closePath();
            ctx.fill();
        }
    }

    // ---------- 6. Hindernisse (Felsen & Pflanzen) ----------
    for (const hi of hindernisse) {
        const hy = schirmY(hi.h);
        if (hy < -15 * E || hy > hoehePx + 15 * E) continue;   // Außerhalb? Nicht malen.
        // Teile einer nicht gewählten Abzweigung schwimmen davon und verblassen:
        ctx.globalAlpha = hi.alpha ?? 1;
        // Höhlen-Steine bringen ihr eigenes Emoji mit (🪨), sonst nimmt
        // jede Welt ihre eigenen Bilder:
        const emoji = hi.emoji || welt.emojis[hi.art];
        if (hi.art === "pflanze") {
            // Pflanzen stehen FEST auf einem kleinen Stein-Sockel und
            // wiegen sich um ihren Fuß in der Strömung:
            const wackeln = Math.sin(zeitstempel * 0.002 + hi.h) * 0.12;
            zeichnePflanze(emoji, schirmX(hi.x), hy, hi.r * E * 1.15, wackeln, welt.farbeBoden);
        } else {
            // Felsen mit ihrer persönlichen Deko: gespiegelt, leicht
            // gedreht und in der Größe gestreut – mehr Varianz im Bild!
            zeichneEmoji(emoji, schirmX(hi.x), hy, hi.r * E * 1.15 * (hi.deko || 1),
                         hi.flip || false, hi.dreh || 0);
        }
    }
    ctx.globalAlpha = 1;

    // ---------- 7. Garnelen ----------
    for (const g of garnelen) {
        const gy = schirmY(g.h);
        if (gy < -5 * E || gy > hoehePx + 5 * E) continue;
        ctx.globalAlpha = g.alpha ?? 1;
        // Garnelen hüpfen leicht hin und her, damit man sie gut sieht:
        const huepfen = Math.sin(zeitstempel * 0.005 + g.h) * E * 0.8;
        zeichneEmoji("🦐", schirmX(g.x) + huepfen, gy, KONFIG.garnelen.radius * E * 1.2);
    }
    ctx.globalAlpha = 1;

    // ---------- 7b. Wegweiser an Abzweigungen ----------
    // Solange sich der Fisch noch nicht entschieden hat, schwebt über
    // jedem offenen Gang ein pulsierender Pfeil mit einem Symbol, das
    // ehrlich verrät, was dort wartet: 🦐 Garnelen-Weg, 🌿 Pflanzen-Weg,
    // 🕳️ Höhlen-Eingang. So wird die Entscheidung mitten im fließenden
    // Spiel sichtbar – und man kann bewusst abbiegen!
    abzweigungWegweiser(zeitstempel);

    // ---------- 8. DER HAI (als richtige, große Figur!) ----------
    if (angreifer) {
        const a = angreifer;
        const ax = schirmX(a.x);
        const ay = schirmY(a.h);
        const s = KONFIG.angreifer.radius * E;
        // Sichtbar, sobald ein Stück von ihm ins Bild ragt (1.9 × s ≈ seine halbe Länge):
        if (ay - 1.9 * s < hoehePx) {
            // Der Hai dreht sich in seine Schwimmrichtung
            // (Bildschirm-y zeigt nach unten, Welt-h nach oben → Minus):
            const winkel = Math.atan2(-a.bewH, a.bewX);
            // Je näher er dem Fisch kommt, desto weiter reißt er das Maul auf:
            const schnapp = a.flieht ? 0
                : Math.max(0, Math.min(1, 1 - (abstandZumFisch(a.x, a.h) - 10) / 15));
            zeichneHai(ax, ay, s, winkel, a.phase, schnapp);
        } else {
            // Noch unterhalb des Bildschirms? Ein Warnzeichen zeigt,
            // wo er gleich auftauchen wird:
            const puls = 1 + Math.sin(zeitstempel * 0.01) * 0.15;
            zeichneEmoji("⚠️", ax, hoehePx - 4 * E, 2.5 * E * puls);
        }
    }

    // ---------- 8b. Hineinschwimmen in die Höhle ----------
    // Direkt nach dem Eintauchen wächst das dunkle Höhlenloch hinter
    // dem Fisch blitzschnell über den ganzen Bildschirm – so sieht es
    // aus, als würde man wirklich in den Felsen hineinschwimmen.
    // (Der Fisch wird DANACH gemalt und bleibt dadurch sichtbar.)
    if (hoehlenEintritt) {
        const t = Math.min(1, hoehlenEintritt.zeit / 1.2);
        const mx = schirmX(hoehlenEintritt.x);
        const my = schirmY(hoehlenEintritt.h);
        const radius = Math.max(1, (14 + t * t * 170) * E);
        const staerke = 0.95 * (1 - t * 0.35);
        const loch = ctx.createRadialGradient(mx, my, 0, mx, my, radius);
        loch.addColorStop(0, `rgba(3, 3, 12, ${staerke})`);
        loch.addColorStop(0.75, `rgba(3, 3, 12, ${staerke * 0.9})`);
        loch.addColorStop(1, "rgba(3, 3, 12, 0)");
        ctx.fillStyle = loch;
        ctx.fillRect(0, 0, breitePx, hoehePx);
    }

    // ---------- 9. Der Spieler-Fisch ----------
    if (zustand === "sprung") {
        // DER ZIEL-SPRUNG! Der Fisch springt in einem Bogen aus dem
        // Wasser, dreht sich dabei einmal und taucht wieder ein.
        const t = Math.min(sprungZeit / 1.8, 1);
        const sprungHoehe = Math.sin(Math.PI * t) * 13;   // Bogen: hoch und wieder runter
        const fx = schirmX(spieler.x);
        const fy = oberflaecheY - sprungHoehe * E;
        const winkel = Math.PI / 2 + t * Math.PI;   // Nase erst hoch, dann runter
        zeichneEmoji("🐟", fx, fy, fischRadius() * E * 1.3, false, winkel);
    } else {
        // Während der Schonzeit blinkt der Fisch (jede 0,1 s an/aus):
        const blinkt = spieler.schonzeit > 0 && Math.floor(zeitstempel / 100) % 2 === 0;
        if (!blinkt) {
            const wippen = Math.sin(spieler.schwimmPhase) * E * 0.5;
            // Der Fisch neigt sich leicht in Richtung seiner Lenk-Bewegung:
            const neigung = Math.max(-0.3, Math.min(0.3, (spieler.zielX - spieler.x) * 0.02));
            const fx = schirmX(spieler.x) + wippen;
            const fy = schirmY(spieler.h);
            // Beim Boost bekommt der Fisch einen gelben Glitzer-Schein:
            if (spieler.boostZeit > 0) {
                const schein = ctx.createRadialGradient(fx, fy, 0, fx, fy, fischRadius() * E * 2);
                schein.addColorStop(0, "rgba(255, 230, 120, 0.45)");
                schein.addColorStop(1, "rgba(255, 230, 120, 0)");
                ctx.fillStyle = schein;
                ctx.fillRect(fx - 10 * E, fy - 10 * E, 20 * E, 20 * E);
            }
            // Drehung um 90° → der Fisch schaut nach OBEN (plus Lenk-Neigung):
            zeichneEmoji("🐟", fx, fy, fischRadius() * E * 1.2, false, Math.PI / 2 + neigung);
        }
    }

    // ---------- 10. Dunkelheit (Höhlen & Tiefsee-Welten) ----------
    // In der Höhle wird es rundherum dunkel – nur um den Fisch
    // bleibt ein heller Licht-Kreis. Tiefsee-Welten (mit "dunkel"
    // in welten.js) sind IMMER etwas duster – wie ganz tief unten
    // im Meer, wo kaum noch Sonnenlicht ankommt:
    const weltDunkel = (welt.dunkel || 0) * (1 - dunkel);   // Höhlen-Dunkelheit hat Vorrang
    const finster = Math.min(0.92, dunkel * KONFIG.hoehle.dunkelheit + weltDunkel);
    if (finster > 0.02) {
        const fx = schirmX(spieler.x);
        const fy = schirmY(spieler.h);
        const licht = ctx.createRadialGradient(fx, fy, 8 * E, fx, fy, 55 * E);
        licht.addColorStop(0, "rgba(3, 4, 16, 0)");
        licht.addColorStop(0.5, `rgba(3, 4, 16, ${finster * 0.5})`);
        licht.addColorStop(1, `rgba(3, 4, 16, ${finster})`);
        ctx.fillStyle = licht;
        ctx.fillRect(0, 0, breitePx, hoehePx);
    }

    // ---------- 11. Partikel (Blasen, Funkeln & Wasser-Spritzer) ----------
    for (const p of partikel) {
        ctx.globalAlpha = Math.max(0, p.leben);
        if (p.art === "blase") {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(schirmX(p.x), schirmY(p.h), p.groesse * E, 0, Math.PI * 2);
            ctx.stroke();
        } else if (p.art === "tropfen") {
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.beginPath();
            ctx.arc(schirmX(p.x), schirmY(p.h), p.groesse * E * 0.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            zeichneEmoji("✨", schirmX(p.x), schirmY(p.h), p.groesse * E);
        }
    }
    ctx.globalAlpha = 1;

    // ---------- 12. Text-Meldungen ("Hai abgehängt!" …) ----------
    meldungenZeichnen();
}

// Kleiner Helfer: mischFarben gibt "rgb(r, g, b)" zurück – für eine
// zweite Misch-Runde brauchen wir wieder das "#rrggbb"-Format:
function hexAusRgb(rgbText) {
    const zahlen = rgbText.match(/\d+/g).map(Number);
    return "#" + zahlen.map(z => z.toString(16).padStart(2, "0")).join("");
}

/* ---------- WEGWEISER AN ABZWEIGUNGEN ----------
   Über jedem offenen Gang einer nahenden Abzweigung schwebt ein
   sanft auf- und abwippender, pulsierender Pfeil mit dem Symbol
   des Weges. Die Wegweiser erscheinen, sobald die Abzweigung in
   Sicht kommt, und verschwinden, sobald der Fisch sich für einen
   Gang entschieden hat. */
const WEGWEISER_SYMBOL = { hoehle: "🕳️", garnelen: "🦐", pflanzen: "🌿" };

function abzweigungWegweiser(zeitstempel) {
    for (const zone of zonen) {
        if (zone.gewaehlt >= 0 || zone.entschieden) continue;   // Schon entschieden
        const abstand = zone.vonH - spieler.h;
        if (abstand > 85 || spieler.h > zone.bisH) continue;    // Noch zu weit weg / vorbei

        // Beim Heranschwimmen sanft einblenden:
        const alpha = Math.max(0, Math.min(1, (85 - abstand) / 20));
        const wippen = Math.sin(zeitstempel * 0.004) * 0.8 * E;
        const puls = 1 + Math.sin(zeitstempel * 0.006) * 0.12;

        for (const k of zone.kanaele) {
            const mx = schirmX((k.von + k.bis) / 2);
            const my = schirmY(zone.vonH + 6) + wippen;
            if (my < -12 * E || my > hoehePx + 12 * E) continue;
            ctx.globalAlpha = alpha;

            // Der leuchtende Pfeil nach oben (zeigt: hier geht ein Weg lang):
            ctx.fillStyle = "rgba(255, 245, 160, 0.95)";
            ctx.strokeStyle = "rgba(90, 70, 10, 0.5)";
            ctx.lineWidth = 0.3 * E;
            const b = 2.6 * E * puls;   // Halbe Pfeil-Breite
            ctx.beginPath();
            ctx.moveTo(mx, my - 2.4 * E * puls);        // Spitze oben
            ctx.lineTo(mx + b, my + 1.4 * E * puls);    // rechts unten
            ctx.lineTo(mx + b * 0.4, my + 0.6 * E * puls);
            ctx.lineTo(mx + b * 0.4, my + 3.2 * E * puls);
            ctx.lineTo(mx - b * 0.4, my + 3.2 * E * puls);
            ctx.lineTo(mx - b * 0.4, my + 0.6 * E * puls);
            ctx.lineTo(mx - b, my + 1.4 * E * puls);    // links unten
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Darunter das Symbol des Weges (🦐 / 🌿 / 🕳️):
            zeichneEmoji(WEGWEISER_SYMBOL[k.art] || "⬆️", mx, my + 6 * E, 1.9 * E);
        }
        ctx.globalAlpha = 1;
    }
}


/* ================================================================
   12. MELDUNGEN & PARTIKEL
   ================================================================ */

// Zeigt eine große Text-Meldung in der Bildschirmmitte an:
function meldung(text) {
    meldungen.push({ text: text, leben: 2.5 });   // 2,5 Sekunden sichtbar
}

function meldungenZeichnen() {
    let reihe = 0;
    for (const m of meldungen) {
        // Am Anfang "ploppt" die Meldung auf (wird schnell größer):
        const plopp = Math.min(1, (2.5 - m.leben) * 6);
        // Am Ende blendet sie aus:
        const sichtbar = Math.min(1, m.leben);
        ctx.save();
        ctx.globalAlpha = sichtbar;
        ctx.translate(breitePx / 2, hoehePx * 0.22 + reihe * 8 * E);
        ctx.scale(plopp, plopp);

        ctx.font = `bold ${4.5 * E}px "Comic Sans MS", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // Runde weiße "Sprechblase" hinter dem Text:
        let breite = ctx.measureText(m.text).width + 4 * E;
        // Auf schmalen Handys: Text verkleinern, bis er auf den Schirm passt.
        if (breite > breitePx * 0.94) {
            const faktor = (breitePx * 0.94) / breite;
            ctx.scale(faktor, faktor);
            breite = breitePx * 0.94 / faktor;
        }
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.beginPath();
        ctx.roundRect(-breite / 2, -3.5 * E, breite, 7 * E, 3.5 * E);
        ctx.fill();
        ctx.fillStyle = "#0a4d8c";
        ctx.fillText(m.text, 0, 0.2 * E);
        ctx.restore();
        reihe++;
    }
}

// Eine aufsteigende Luftblase erzeugen. Der Deckel (max. 120 Blasen &
// Funkel gleichzeitig) hält das Spiel auch auf älteren Handys flüssig:
function blase(x, h) {
    if (partikel.length > 120) return;
    partikel.push({ art: "blase", x, h, groesse: zufall(0.3, 0.9), leben: 1, vh: zufall(6, 12) });
}

// Glitzer-Funkeln (z. B. wenn eine Garnele gefressen wird):
function funkeln(x, h) {
    for (let i = 0; i < 4 && partikel.length < 140; i++) {
        partikel.push({ art: "funkel", x: x + zufall(-2, 2), h: h + zufall(-2, 2),
                        groesse: zufall(1, 2), leben: 0.8, vh: 2 });
    }
}

// Wasser-Spritzer für den Ziel-Sprung (fliegen hoch und fallen runter):
function spritzer(x, h, anzahl) {
    for (let i = 0; i < anzahl; i++) {
        partikel.push({ art: "tropfen", x: x + zufall(-3, 3), h: h,
                        groesse: zufall(0.6, 1.4), leben: 1.2,
                        vx: zufall(-12, 12), vh: zufall(15, 40) });
    }
}

function partikelUpdate(dt) {
    for (let i = partikel.length - 1; i >= 0; i--) {
        const p = partikel[i];
        p.x += (p.vx || 0) * dt;
        p.h += (p.vh || 0) * dt;
        if (p.art === "tropfen") p.vh -= 70 * dt;   // Tropfen fallen wieder runter (Schwerkraft)
        p.leben -= dt;
        if (p.leben <= 0) partikel.splice(i, 1);
    }
    for (let i = meldungen.length - 1; i >= 0; i--) {
        meldungen[i].leben -= dt;
        if (meldungen[i].leben <= 0) meldungen.splice(i, 1);
    }
    // Hintergrund-Tiere schwimmen quer durchs Bild – und zwar auf
    // WELLEN-Bahnen wie echte Tiere: Delfine ziehen große Bögen auf
    // und ab, kleine Fische zittern nur leicht. Die Neigung in
    // Schwimmrichtung übernimmt das Zeichnen (allesZeichnen):
    const rand = schirmBreiteE / 2;
    for (let i = tiere.length - 1; i >= 0; i--) {
        const t = tiere[i];
        t.x += t.vx * dt;
        t.vh = Math.cos(spielZeit * t.wellenTempo * 2 + t.phase) * t.wellenHoehe;
        t.h += t.vh * dt;
        // Ab und zu ein kleiner Spurt – Tiere schwimmen nie ganz gleichmäßig:
        if (Math.random() < 0.005) t.vx *= zufall(0.85, 1.3);
        // Fliehende Tiere (z. B. vor einer Höhle) werden dabei immer
        // durchsichtiger, bis man sie gar nicht mehr sieht:
        if (t.flieht) {
            t.alpha = (t.alpha ?? 1) - dt * 0.6;
            if (t.alpha <= 0) { tiere.splice(i, 1); continue; }
        }
        if (Math.abs(t.x) > rand + 14) tiere.splice(i, 1);   // Aus dem Bild? Weg damit.
    }

    // Teile einer NICHT gewählten Abzweigung schwimmen zur Seite
    // davon und verblassen, bis sie ganz verschwunden sind:
    for (let i = hindernisse.length - 1; i >= 0; i--) {
        const hi = hindernisse[i];
        if (!hi.weg) continue;
        hi.x += hi.vx * dt;
        hi.alpha -= dt * 1.3;
        if (hi.alpha <= 0) hindernisse.splice(i, 1);
    }
    for (let i = garnelen.length - 1; i >= 0; i--) {
        const g = garnelen[i];
        if (!g.weg) continue;
        g.x += g.vx * dt;
        g.alpha -= dt * 1.3;
        if (g.alpha <= 0) garnelen.splice(i, 1);
    }
    // Auch die dunklen Höhlen-Löcher nicht gewählter Wege blenden aus:
    for (const zone of zonen) {
        for (const k of zone.kanaele) {
            if (k.weg) k.alpha = (k.alpha ?? 1) - dt * 1.3;
        }
    }
}


/* ================================================================
   13. SPIELABLAUF (Start, Pause, Oberfläche erreicht, Sprung!)
   ================================================================ */

// Kurzer Zugriff auf die Bildschirm-Elemente:
const el = (id) => document.getElementById(id);

function zeige(schirmId) {
    // Alle Overlays verstecken, dann nur das gewünschte zeigen:
    for (const id of ["start-schirm", "einstellungen-schirm", "pause-schirm", "welt-geschafft-schirm"]) {
        el(id).classList.add("versteckt");
    }
    if (schirmId) el(schirmId).classList.remove("versteckt");
}

// Setzt alles für einen frischen Level-Start zurück:
function weltStarten() {
    spieler.x = 0;
    spieler.zielX = 0;
    spieler.h = 0;
    spieler.boostZeit = 0;
    spieler.gebremstZeit = 0;
    spieler.pflanzenZeit = 0;
    spieler.schlaengelZeit = 0;
    spieler.schonzeit = 1;   // 1 Sekunde Schonfrist beim Start
    festTimer = 0;
    festMerkH = 0;

    hindernisse = [];
    garnelen = [];
    tiere = [];
    zonen = [];
    partikel = [];
    meldungen = [];
    angreifer = null;
    hoehle = null;
    hoehlenEintritt = null;

    spielZeit = 0;
    sprungZeit = 0;
    sprungGeplatscht = false;
    naechsteBauH = 45;   // Die ersten 45 E sind freies Wasser zum Eingewöhnen
    naechsteAbzweigungH = 150 + zufall(0, 80);
    naechsterAngreifer = KONFIG.angreifer.erstesSpawnAb + zufall(0, KONFIG.angreifer.spawnZufall);
    hoehleBesucht = false;        // Höhlen-Garantie für die neue Welt zurücksetzen
    hoehlePflichtGebaut = false;
    haisGesamt = 0;               // Hai-Zähler für die neue Welt zurücksetzen

    const welt = aktuelleWelt();
    meldung(`Welt ${weltIndex + 1 + runde * WELTEN.length}: ${welt.name} ${welt.emoji}`);
    meldung("Schwimm nach oben! ⬆️");
    hudAktualisieren();

    zustand = "laeuft";
    zeige(null);
    el("hud").classList.remove("versteckt");
}

// Ganz neues Spiel (von Welt 1, Fisch wieder klein):
function spielStarten() {
    weltIndex = 0;
    runde = 0;
    spieler.garnelenGesamt = 0;
    spieler.wachstum = 0;
    weltStarten();
}

// Der Fisch hat die Wasseroberfläche erreicht: SPRUNG!
function sprungStarten() {
    zustand = "sprung";
    sprungZeit = 0;
    sprungGeplatscht = false;
    spieler.h = KONFIG.level.streckeProWelt;
    angreifer = null;
    hoehle = null;
    hoehlenEintritt = null;
    SOUND.sprung();
    // Spritzer beim Heraus-Springen aus dem Wasser:
    spritzer(spieler.x, KONFIG.level.streckeProWelt, 14);
    hudAktualisieren();
}

// Läuft während der Sprung-Animation (ca. 2,6 Sekunden):
function sprungUpdate(dt) {
    sprungZeit += dt;
    partikelUpdate(dt);

    // Während des Flugs tropft Wasser vom Fisch:
    const t = Math.min(sprungZeit / 1.8, 1);
    if (t < 1 && Math.random() < 0.5) {
        const sprungHoehe = Math.sin(Math.PI * t) * 13;
        partikel.push({ art: "tropfen", x: spieler.x + zufall(-2, 2),
                        h: KONFIG.level.streckeProWelt + sprungHoehe,
                        groesse: zufall(0.5, 1), leben: 1,
                        vx: zufall(-4, 4), vh: zufall(-5, 5) });
    }
    // Beim Wieder-Eintauchen: PLATSCH!
    if (!sprungGeplatscht && sprungZeit >= 1.8) {
        sprungGeplatscht = true;
        SOUND.platscher();
        spritzer(spieler.x, KONFIG.level.streckeProWelt, 18);
    }
    // Animation vorbei? Dann den Geschafft-Bildschirm zeigen:
    if (sprungZeit > 2.6) {
        weltGeschafft();
    }
}

// Der Fisch ist gesprungen und wieder eingetaucht – Welt geschafft!
function weltGeschafft() {
    zustand = "geschafft";
    SOUND.ziel();
    const welt = aktuelleWelt();
    el("welt-geschafft-titel").textContent = `${welt.name} geschafft! ⭐`;

    // Zur nächsten Welt weiterschalten (nach der letzten: wieder von
    // vorn, aber eine "Runde" höher = alles etwas schneller):
    weltIndex++;
    if (weltIndex >= WELTEN.length) {
        weltIndex = 0;
        runde++;
        el("welt-geschafft-text").textContent =
            `Alle ${WELTEN.length} Welten entdeckt! 🏆 Möchtest du weiterspielen? Jetzt geht's noch flotter …`;
    } else {
        const naechste = WELTEN[weltIndex];
        el("welt-geschafft-text").textContent =
            `Möchtest du weiterspielen? Als Nächstes wartet: ${naechste.name} ${naechste.emoji}`;
    }
    zeige("welt-geschafft-schirm");
}

// Die Anzeigen oben (Garnelen-Zähler + Fortschrittsbalken) aktualisieren.
// Das HUD sind DOM-Elemente – die fassen wir nur an, wenn sich wirklich
// etwas sichtbar geändert hat (spart Layout-Arbeit in jedem Frame):
let hudLetzteGarnelen = -1;
let hudLetzterAnteil = -1;

function hudAktualisieren() {
    if (spieler.garnelenGesamt !== hudLetzteGarnelen) {
        hudLetzteGarnelen = spieler.garnelenGesamt;
        el("garnelen-zahl").textContent = spieler.garnelenGesamt;
    }
    const anteil = Math.min(100, (spieler.h / KONFIG.level.streckeProWelt) * 100);
    const gerundet = Math.round(anteil * 5) / 5;   // Nur in 0,2-%-Schritten anfassen
    if (gerundet !== hudLetzterAnteil) {
        hudLetzterAnteil = gerundet;
        el("fortschritt-balken").style.width = gerundet + "%";
        el("fortschritt-fisch").style.left = gerundet + "%";
    }
}

/* ---------- Alle Knöpfe verkabeln ---------- */

el("start-knopf").addEventListener("click", () => {
    tonAnschalten(); SOUND.knopf();
    spielStarten();
});

el("einstellungen-knopf").addEventListener("click", () => {
    tonAnschalten(); SOUND.knopf();
    zeige("einstellungen-schirm");
});

el("einstellungen-zurueck").addEventListener("click", () => {
    SOUND.knopf();
    zeige("start-schirm");
});

el("ton-knopf").addEventListener("click", () => {
    einstellungen.ton = !einstellungen.ton;
    einstellungenSpeichern();
    einstellungenAnzeigen();
    SOUND.knopf();
});

for (const stufe of ["langsam", "normal", "schnell"]) {
    el("tempo-" + stufe).addEventListener("click", () => {
        einstellungen.tempo = stufe;
        einstellungenSpeichern();
        einstellungenAnzeigen();
        SOUND.knopf();
    });
}

el("pause-knopf").addEventListener("click", () => {
    if (zustand !== "laeuft") return;
    SOUND.knopf();
    zustand = "pause";
    zeige("pause-schirm");
});

el("weiter-knopf").addEventListener("click", () => {
    SOUND.knopf();
    zustand = "laeuft";
    zeige(null);
});

el("neustart-knopf").addEventListener("click", () => {
    SOUND.knopf();
    spielStarten();
});

el("naechste-welt-knopf").addEventListener("click", () => {
    SOUND.knopf();
    weltStarten();
});

// Wenn die App in den Hintergrund geht (z. B. Anruf): automatisch pausieren.
document.addEventListener("visibilitychange", () => {
    if (document.hidden && zustand === "laeuft") {
        zustand = "pause";
        zeige("pause-schirm");
    }
});


/* ================================================================
   14. HAUPT-SCHLEIFE (Game Loop)
   ================================================================
   Läuft etwa 60-mal pro Sekunde:
   1. "dt" berechnen = wie viel Zeit seit dem letzten Bild verging
      (so läuft das Spiel auf schnellen und langsamen Handys gleich)
   2. Alles bewegen (nur wenn nicht pausiert)
   3. Alles neu zeichnen
   ================================================================ */

let letzteZeit = 0;

function hauptSchleife(zeitstempel) {
    // dt = vergangene Zeit in Sekunden, auf max. 0,05 s begrenzt
    // (damit nach einer Denkpause des Handys nichts "durchspringt"):
    const dt = Math.min(0.05, (zeitstempel - letzteZeit) / 1000);
    letzteZeit = zeitstempel;

    if (zustand === "laeuft") {
        spielZeit += dt;
        weltWeiterbauen();          // Level-Generator: Strecke über dem Fisch bauen
        spielerBewegen(dt);         // Fisch aufsteigen lassen & lenken
        kollisionenPruefen(dt);     // Garnelen, Hindernisse, Abzweigungen
        hoehleUpdate(dt);           // Höhlen-Anfang und -Ende verwalten
        angreiferUpdate(dt);        // Hai-KI
        partikelUpdate(dt);         // Blasen, Funkeln, Meldungen, Tiere
        hudAktualisieren();         // Fortschrittsbalken oben
    } else if (zustand === "sprung") {
        sprungUpdate(dt);           // Die Ziel-Sprung-Animation
    }

    // Gezeichnet wird immer – so sieht man das Spielfeld auch in der Pause:
    allesZeichnen(zeitstempel);

    requestAnimationFrame(hauptSchleife);   // Nächstes Bild anfordern
}

/* ---------- LOS GEHT'S! ---------- */
einstellungenLaden();
einstellungenAnzeigen();
requestAnimationFrame(hauptSchleife);
