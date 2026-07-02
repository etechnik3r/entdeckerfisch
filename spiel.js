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
     6. Level-Generator (baut die Welt aus Mustern zusammen)
     7. Update: Spieler-Fisch (Bewegung, Boost, Wachstum)
     8. Update: Kollisionen (Hindernisse, Garnelen, Ziel)
     9. Update: Angreifer-KI (Verfolger)
    10. Update: Boote (Schatten an der Oberfläche)
    11. Zeichnen (alles aufs Canvas malen)
    12. Meldungen & Partikel (Text-Einblendungen, Blasen)
    13. Spielablauf (Start, Pause, Welt geschafft, Neustart)
    14. Haupt-Schleife (Game Loop)

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
}
window.addEventListener("resize", bildschirmAnpassen);
bildschirmAnpassen();

// Der Spieler-Fisch wird immer bei 30 % der Bildschirmbreite gezeichnet.
// (Die Welt zieht an ihm vorbei – so hat man freie Sicht nach vorn.)
function fischSchirmX() {
    return schirmBreiteE * 0.30;
}


/* ================================================================
   2. SPIELZUSTAND & SPIELER-DATEN
   ================================================================ */

// In welchem Zustand ist das Spiel gerade?
// "start" = Startbildschirm, "laeuft" = es wird gespielt,
// "pause" = pausiert, "geschafft" = Welt-geschafft-Bildschirm
let zustand = "start";

let weltIndex = 0;     // Welche Welt (Level) gerade gespielt wird (0 = erste)
let runde = 0;         // Wie oft schon ALLE Welten durchgespielt wurden
let spielZeit = 0;     // Sekunden seit Levelstart (für Spawn-Timer)

// Alle Daten des Spieler-Fisches:
const spieler = {
    weltX: 0,          // Wie weit der Fisch schon geschwommen ist (in E)
    y: 50,             // Höhe im Wasser (0 = Oberfläche, 100 = Boden)
    zielY: 50,         // Wohin der Finger den Fisch lenkt
    stossY: 0,         // Kurzer Schubs nach oben/unten (z. B. von einem Boot)
    boostZeit: 0,      // Restliche Boost-Sekunden (> 0 = Fisch ist schnell)
    gebremstZeit: 0,   // Restliche Sekunden "abgebremst" (nach Felsen-Rempler)
    schonzeit: 0,      // Restliche Unverwundbar-Sekunden (Fisch blinkt)
    garnelenGesamt: 0, // Alle jemals gefressenen Garnelen (für die Anzeige)
    wachstum: 0,       // Aktuelle Wachstums-Stufe (0 bis maxWachstum)
    schwimmPhase: 0,   // Nur für die Optik: lässt den Fisch auf und ab wippen
};

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
let hindernisse = [];  // Felsen, Korallen, Algen  { x, y, r, art }
let garnelen = [];     // Sammelbare Garnelen      { x, y }
let angreifer = null;  // Der Verfolger-Fisch (höchstens einer gleichzeitig)
let boote = [];        // Boote an der Oberfläche  { x, vx }
let deko = [];         // Harmlose Deko-Tiere      { x, y, emoji, tempo }
let partikel = [];     // Blasen & Funkel-Effekte
let meldungen = [];    // Text-Einblendungen ("Angreifer abgehängt!" usw.)
let ziel = null;       // Der Ziel-Strudel am Ende der Welt { x, y }

// Spawn-Timer: Wann kommt der nächste Angreifer / das nächste Boot?
let naechsterAngreifer = 0;
let naechstesBoot = 0;
let naechsteBauX = 0;  // Bis hierhin wurde die Welt schon "gebaut" (Level-Generator)

// Die aktuelle Welt (Farben, Emojis, Muster) aus welten.js:
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
    boot()       { piep(140, 100, 0.4, 0.12, "square"); },               // Tiefes Boots-Tuten
    angreifer()  { piep(300, 200, 0.3, 0.1, "triangle"); },              // Unheilvolles "Wumm"
    abgehaengt() { piep(500, 700, 0.12, 0.15); piep(700, 1000, 0.18, 0.15, "sine", 0.1); },
    erwischt()   { piep(300, 120, 0.35, 0.15, "triangle"); },
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
     Der Fisch schwimmt sanft zur Höhe des Fingers.
   - Kurz tippen: Der Fisch macht einen kleinen Ausweich-Hüpfer
     nach oben (Tipp über dem Fisch) oder unten (Tipp darunter).
   - Am Computer gehen auch die Pfeiltasten ↑ und ↓.
   ================================================================ */

let fingerLiegt = false;   // Liegt gerade ein Finger auf dem Bildschirm?
let tippStartZeit = 0;     // Wann wurde der Finger aufgesetzt? (für Tipp-Erkennung)
let tippStartY = 0;        // Wo wurde der Finger aufgesetzt?

canvas.addEventListener("pointerdown", (ereignis) => {
    tonAnschalten();                       // Browser erlauben Ton erst nach einer Berührung
    if (zustand !== "laeuft") return;
    fingerLiegt = true;
    tippStartZeit = performance.now();
    tippStartY = ereignis.clientY;
    spieler.zielY = ereignis.clientY / E;  // Pixel → E umrechnen
});

canvas.addEventListener("pointermove", (ereignis) => {
    if (zustand !== "laeuft" || !fingerLiegt) return;
    spieler.zielY = ereignis.clientY / E;  // Fisch folgt dem Finger
});

canvas.addEventListener("pointerup", (ereignis) => {
    if (zustand !== "laeuft") { fingerLiegt = false; return; }
    fingerLiegt = false;

    // War das nur ein kurzes Tippen (statt Ziehen)? Dann: Ausweich-Hüpfer!
    const dauer = performance.now() - tippStartZeit;
    const bewegung = Math.abs(ereignis.clientY - tippStartY);
    if (dauer < 250 && bewegung < 12) {
        const tippY = ereignis.clientY / E;
        // Tipp ÜBER dem Fisch → nach oben ausweichen, sonst nach unten:
        if (tippY < spieler.y) spieler.zielY = spieler.y - KONFIG.steuerung.tippSprung;
        else                   spieler.zielY = spieler.y + KONFIG.steuerung.tippSprung;
    }
});

canvas.addEventListener("pointercancel", () => { fingerLiegt = false; });

// Pfeiltasten für den Computer (praktisch zum Testen):
window.addEventListener("keydown", (ereignis) => {
    if (zustand !== "laeuft") return;
    if (ereignis.key === "ArrowUp")   spieler.zielY = spieler.y - KONFIG.steuerung.tippSprung;
    if (ereignis.key === "ArrowDown") spieler.zielY = spieler.y + KONFIG.steuerung.tippSprung;
});


/* ================================================================
   6. LEVEL-GENERATOR
   ================================================================
   Baut die Welt Stück für Stück VOR dem Fisch auf, indem er die
   Bau-Muster aus welten.js (Slalom, Höhle, Abzweigung …) zufällig
   aneinanderreiht. Hinter dem Fisch wird wieder aufgeräumt, damit
   das Spiel flüssig bleibt.
   ================================================================ */

function weltWeiterbauen() {
    const zielX = KONFIG.level.streckeProWelt;

    // So lange bauen, bis die Strecke ein Stück über den rechten
    // Bildschirmrand hinaus fertig ist:
    while (naechsteBauX < spieler.weltX + schirmBreiteE + 60) {

        // Kurz vor dem Ziel keine Hindernisse mehr – freie Zielgerade:
        if (naechsteBauX > zielX - 80) {
            naechsteBauX += 100;
            continue;
        }

        // Ein Bau-Muster auswürfeln (gewichtet nach der aktuellen Welt)
        // und bauen lassen:
        const musterName = waehleMuster(aktuelleWelt());
        const stueck = MUSTER[musterName](naechsteBauX);

        hindernisse.push(...stueck.hindernisse);
        garnelen.push(...stueck.garnelen);
        naechsteBauX += stueck.laenge + zufall(10, 25);   // Kleine Lücke zwischen den Mustern
    }

    // Aufräumen: Alles löschen, was weit hinter dem Fisch liegt.
    const hinten = spieler.weltX - 60;
    hindernisse = hindernisse.filter(h => h.x > hinten);
    garnelen = garnelen.filter(g => g.x > hinten);
    deko = deko.filter(d => d.x > hinten);

    // Ab und zu ein Deko-Tier der Welt dazustellen (rein zur Zierde):
    if (Math.random() < 0.008 && deko.length < 6) {
        deko.push({
            x: spieler.weltX + schirmBreiteE + 20,
            y: zufall(15, 85),
            emoji: zufallAus(aktuelleWelt().deko),
            tempo: zufall(2, 6),               // Deko schwimmt langsam nach links
            groesse: zufall(2, 3.5),
        });
    }

    // Wenn die Strecke geschafft ist: das Ziel (Strudel) erscheinen lassen!
    if (!ziel && spieler.weltX > zielX - schirmBreiteE) {
        ziel = { x: zielX + schirmBreiteE * 0.6, y: 50, drehung: 0 };
        meldung("Da vorne ist das Ziel! 🌀");
    }
}


/* ================================================================
   7. UPDATE: SPIELER-FISCH
   ================================================================
   Bewegung nach vorn (automatisch), Lenken nach oben/unten
   (Finger), Boost-Verwaltung und die Begrenzung des Wassers.
   ================================================================ */

function spielerBewegen(dt) {
    // ---- Tempo nach vorn berechnen ----
    let tempo = grundTempo();
    if (spieler.boostZeit > 0) tempo *= KONFIG.boost.faktor;    // Garnelen-Boost!
    if (spieler.gebremstZeit > 0) tempo *= 0.4;                 // Nach Rempler kurz langsam

    spieler.weltX += tempo * dt;

    // ---- Timer herunterzählen ----
    spieler.boostZeit    = Math.max(0, spieler.boostZeit - dt);
    spieler.gebremstZeit = Math.max(0, spieler.gebremstZeit - dt);
    spieler.schonzeit    = Math.max(0, spieler.schonzeit - dt);

    // ---- Nach oben/unten lenken (weich zum Finger-Ziel gleiten) ----
    // Die Formel sorgt für eine sanfte, "schwimmende" Bewegung:
    const weichheit = 1 - Math.exp(-KONFIG.fisch.lenkWeichheit * dt);
    let unterschied = spieler.zielY - spieler.y;
    // Nicht schneller lenken als tempoHoch erlaubt:
    const maxSchritt = KONFIG.fisch.tempoHoch * dt;
    let schritt = unterschied * weichheit;
    schritt = Math.max(-maxSchritt, Math.min(maxSchritt, schritt));
    spieler.y += schritt;

    // ---- Schubs von außen (z. B. Boot drückt den Fisch nach unten) ----
    spieler.y += spieler.stossY * dt;
    spieler.stossY *= Math.exp(-4 * dt);   // Der Schubs klingt schnell ab

    // ---- Im Wasser bleiben! (Oberfläche und Boden begrenzen) ----
    const r = fischRadius();
    const oben = KONFIG.wasser.obenGrenze + r;
    const unten = KONFIG.wasser.untenGrenze - r;
    spieler.y = Math.max(oben, Math.min(unten, spieler.y));
    spieler.zielY = Math.max(oben, Math.min(unten, spieler.zielY));

    // ---- Nur Optik: Schwimm-Wippen und Blasen ----
    spieler.schwimmPhase += dt * (spieler.boostZeit > 0 ? 14 : 7);
    if (spieler.boostZeit > 0 && Math.random() < 0.5) {
        blase(spieler.weltX - r, spieler.y + zufall(-1, 1));    // Boost-Blasen hinterm Fisch
    } else if (Math.random() < 0.05) {
        blase(spieler.weltX - r, spieler.y);                    // Ab und zu eine normale Blase
    }
}


/* ================================================================
   8. UPDATE: KOLLISIONEN
   ================================================================
   Hier wird geprüft, ob der Fisch etwas berührt:
   - Garnele  → einsammeln, Boost, evtl. wachsen
   - Alge     → nur sanft abbremsen (tut nicht weh)
   - Fels/Koralle → sanft wegschieben + kurz abbremsen
   - Ziel     → Welt geschafft!
   Alle Treffer sind absichtlich FEHLERVERZEIHEND eingestellt:
   Hitboxen sind kleiner als die Bilder, nichts führt zum Game Over.
   ================================================================ */

// Abstand zwischen dem Fisch und einem Punkt in der Welt (in E):
function abstandZumFisch(x, y) {
    const dx = x - spieler.weltX;
    const dy = y - spieler.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function kollisionenPruefen(dt) {
    const r = fischRadius();

    // ---------- GARNELEN einsammeln ----------
    for (let i = garnelen.length - 1; i >= 0; i--) {
        const g = garnelen[i];
        // fangHilfe macht den Fang-Radius extra groß (fehlerverzeihend):
        if (abstandZumFisch(g.x, g.y) < r + KONFIG.garnelen.radius + KONFIG.garnelen.fangHilfe) {
            garnelen.splice(i, 1);                    // Garnele verschwindet
            spieler.garnelenGesamt++;
            spieler.boostZeit = KONFIG.boost.dauer;   // Geschwindigkeits-Boost!
            funkeln(g.x, g.y);                        // Glitzer-Effekt
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

    // ---------- HINDERNISSE (Felsen, Korallen, Algen) ----------
    for (const h of hindernisse) {
        const dx = spieler.weltX - h.x;
        const dy = spieler.y - h.y;
        const abstand = Math.sqrt(dx * dx + dy * dy);
        // 0.75 = die Hitbox ist nur 75 % so groß wie das Bild (fehlerverzeihend):
        const mindestAbstand = (r + h.r) * 0.75;

        if (abstand < mindestAbstand) {
            if (h.art === "alge") {
                // Algen sind weich: Sie bremsen nur ein kleines bisschen.
                spieler.gebremstZeit = Math.max(spieler.gebremstZeit, 0.15);
                if (Math.random() < 0.1) blase(spieler.weltX, spieler.y);
            } else {
                // Felsen & Korallen: den Fisch sanft aus dem Hindernis herausschieben.
                const ueberlappung = mindestAbstand - abstand;
                // Richtung vom Hindernis weg (falls genau mittig: nach oben):
                const nx = abstand > 0.01 ? dx / abstand : 0;
                const ny = abstand > 0.01 ? dy / abstand : -1;
                spieler.weltX += nx * ueberlappung;
                spieler.y += ny * ueberlappung;

                // Beim ersten Aufprall: kurz bremsen + "Autsch"-Ton
                if (spieler.gebremstZeit <= 0) {
                    spieler.gebremstZeit = 0.5;
                    SOUND.rempler();
                }
            }
        }
    }

    // ---------- ZIEL (der Strudel am Ende der Welt) ----------
    if (ziel) {
        // Kindgerecht: Der Strudel "zieht" sanft auf die Höhe des Fisches,
        // wenn er näher kommt – so kann niemand am Ziel vorbeischwimmen.
        if (ziel.x - spieler.weltX < schirmBreiteE * 0.6) {
            ziel.y += (spieler.y - ziel.y) * (1 - Math.exp(-2 * dt));
        }
        // Geschafft, wenn der Fisch den Strudel berührt ODER seine
        // Linie überquert hat (doppeltes Sicherheitsnetz):
        if (abstandZumFisch(ziel.x, ziel.y) < KONFIG.level.zielRadius + r
            || spieler.weltX >= ziel.x) {
            weltGeschafft();
        }
    }
}


/* ================================================================
   9. UPDATE: ANGREIFER-KI (die Verfolger)
   ================================================================
   Der Angreifer taucht hinter dem Fisch auf und schwimmt ihm
   hartnäckig hinterher. Er ist etwas schneller als der Fisch OHNE
   Boost – aber:
   - Mit Garnelen-Boost hängt man ihn ab.
   - In Hindernissen wird der Angreifer stark gebremst
     (kluge Wegwahl durch enge Stellen lohnt sich!).
   - Nach "fluchtAbstand" E Rückstand oder "maxVerfolgung"
     Sekunden gibt er auf → "Angreifer abgehängt!"
   ================================================================ */

function angreiferUpdate(dt) {
    // ---- Neuen Angreifer spawnen, wenn es Zeit ist ----
    if (!angreifer && spielZeit > naechsterAngreifer && !ziel) {
        angreifer = {
            x: spieler.weltX - fischSchirmX() - 15,   // Startet links außerhalb des Bildes
            y: spieler.y,
            verfolgZeit: 0,     // Wie lange er schon jagt
            flieht: false,      // true = er hat aufgegeben und schwimmt weg
            phase: 0,           // Nur für die Optik (Wackeln)
        };
        meldung("Achtung, ein Angreifer! 🦈");
        SOUND.angreifer();
    }
    if (!angreifer) return;

    const a = angreifer;
    a.phase += dt * 10;

    // ---- Wenn er aufgegeben hat: einfach nach links davonschwimmen ----
    if (a.flieht) {
        a.x -= grundTempo() * 1.5 * dt;
        // Ganz aus dem Bild? Dann weg damit und den nächsten Timer stellen:
        if (a.x < spieler.weltX - fischSchirmX() - 25) {
            angreifer = null;
            naechsterAngreifer = spielZeit + KONFIG.angreifer.spawnAbstand
                               + zufall(0, KONFIG.angreifer.spawnZufall);
        }
        return;
    }

    // ---- Verfolgen: Richtung zum Spieler-Fisch berechnen ----
    a.verfolgZeit += dt;
    let tempo = grundTempo() * KONFIG.angreifer.tempoFaktor;

    // Steckt der Angreifer in einem Hindernis? Dann stark bremsen!
    for (const h of hindernisse) {
        if (h.art === "alge") continue;   // Durch Algen kommt er gut durch
        const dx = a.x - h.x, dy = a.y - h.y;
        if (dx * dx + dy * dy < (h.r + KONFIG.angreifer.radius) ** 2 * 0.6) {
            tempo *= KONFIG.angreifer.bremseInHindernis;
            break;
        }
    }

    // Auf den Fisch zuschwimmen (normalisierte Richtung × Tempo):
    const dx = spieler.weltX - a.x;
    const dy = spieler.y - a.y;
    const abstand = Math.sqrt(dx * dx + dy * dy) || 0.01;
    a.x += (dx / abstand) * tempo * dt;
    a.y += (dy / abstand) * tempo * dt;

    // ---- Hat der Fisch den Angreifer abgehängt? ----
    const rueckstand = spieler.weltX - a.x;
    if (rueckstand > KONFIG.angreifer.fluchtAbstand
        || a.verfolgZeit > KONFIG.angreifer.maxVerfolgung) {
        meldung("Angreifer abgehängt! 🎉");
        SOUND.abgehaengt();
        a.flieht = true;
        return;
    }

    // ---- Hat der Angreifer den Fisch erwischt? ----
    if (abstand < fischRadius() + KONFIG.angreifer.radius * 0.7 && spieler.schonzeit <= 0) {
        // Kindgerecht: KEIN Game Over! Der Fisch verliert eine Wachstums-Stufe,
        // ist kurz unverwundbar und bekommt einen Flucht-Boost geschenkt.
        spieler.wachstum = Math.max(0, spieler.wachstum - 1);
        spieler.schonzeit = KONFIG.fisch.schonzeit;
        spieler.boostZeit = KONFIG.boost.dauer * 1.5;   // Flucht-Boost!
        meldung("Ohje! Schnell weg! 💨");
        SOUND.erwischt();
        a.flieht = true;   // Der Angreifer ist zufrieden und zieht ab
    }
}


/* ================================================================
   10. UPDATE: BOOTE
   ================================================================
   Boote fahren an der Wasseroberfläche entlang. Im Wasser sieht
   man ihren dunklen SCHATTEN. Schwimmt der Fisch zu dicht unter
   der Oberfläche (gefahrTiefe), wird er vom Boot nach unten
   gedrückt. Wer tief genug schwimmt, ist völlig sicher.
   ================================================================ */

function booteUpdate(dt) {
    // ---- Neues Boot spawnen, wenn es Zeit ist ----
    if (spielZeit > naechstesBoot) {
        naechstesBoot = spielZeit + KONFIG.boote.spawnAbstand + zufall(0, KONFIG.boote.spawnZufall);
        // Das Boot startet rechts außerhalb des Bildes und fährt dem Fisch entgegen:
        boote.push({
            x: spieler.weltX + schirmBreiteE + 20,
            vx: -zufall(KONFIG.boote.tempo * 0.2, KONFIG.boote.tempo * 0.5),
            tuckerPhase: 0,
        });
    }

    for (let i = boote.length - 1; i >= 0; i--) {
        const boot = boote[i];
        boot.x += boot.vx * dt;
        boot.tuckerPhase += dt * 6;

        // ---- Gefahr prüfen: Ist der Fisch unter dem Boot UND zu weit oben? ----
        const unterDemBoot = Math.abs(boot.x - spieler.weltX) < KONFIG.boote.breite / 2;
        const zuWeitOben = spieler.y < KONFIG.boote.gefahrTiefe;
        if (unterDemBoot && zuWeitOben && spieler.schonzeit <= 0) {
            spieler.stossY = 45;                       // Kräftig nach unten drücken
            spieler.schonzeit = KONFIG.fisch.schonzeit;
            spieler.gebremstZeit = 0.6;
            meldung("Vorsicht, Boot! 🚤");
            SOUND.boot();
            for (let b = 0; b < 8; b++) blase(spieler.weltX + zufall(-3, 3), spieler.y + zufall(-3, 3));
        }

        // Boot ist weit hinter dem Fisch? Aufräumen:
        if (boot.x < spieler.weltX - schirmBreiteE) boote.splice(i, 1);
    }
}


/* ================================================================
   11. ZEICHNEN
   ================================================================
   Malt jedes Bild komplett neu: Wasser, Boden, Wellen, Boote,
   Hindernisse, Garnelen, Ziel, Angreifer, Spieler-Fisch, Effekte.
   Reihenfolge = Ebenen: Was zuerst gemalt wird, liegt hinten.
   ================================================================ */

// Rechnet eine Welt-Position in Bildschirm-Pixel um:
function schirmX(weltX) {
    return (weltX - spieler.weltX + fischSchirmX()) * E;
}
function schirmY(y) {
    return y * E;
}

// Malt ein Emoji zentriert an eine Pixel-Position.
// groessePx = ungefährer Radius in Pixeln, spiegeln = nach rechts schauen lassen
function zeichneEmoji(emoji, x, y, groessePx, spiegeln = false, drehung = 0) {
    ctx.save();
    ctx.translate(x, y);
    if (drehung) ctx.rotate(drehung);
    if (spiegeln) ctx.scale(-1, 1);      // Emojis schauen meist nach links → umdrehen
    ctx.font = `${groessePx * 2}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emoji, 0, 0);
    ctx.restore();
}

function allesZeichnen(zeitstempel) {
    const welt = aktuelleWelt();

    // ---------- 1. Wasser (Farbverlauf der aktuellen Welt) ----------
    const verlauf = ctx.createLinearGradient(0, 0, 0, hoehePx);
    verlauf.addColorStop(0, welt.farbeOben);
    verlauf.addColorStop(1, welt.farbeUnten);
    ctx.fillStyle = verlauf;
    ctx.fillRect(0, 0, breitePx, hoehePx);

    // ---------- 2. Wellen an der Oberfläche ----------
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let x = 0; x <= breitePx; x += 12) {
        // Die Wellen wandern mit der Zeit und mit der Schwimm-Bewegung:
        const welle = Math.sin(x * 0.02 + zeitstempel * 0.002 + spieler.weltX * 0.05);
        ctx.lineTo(x, schirmY(2.5) + welle * E * 0.8);
    }
    ctx.lineTo(breitePx, 0);
    ctx.closePath();
    ctx.fill();

    // ---------- 3. Sandboden ----------
    ctx.fillStyle = welt.farbeBoden;
    ctx.beginPath();
    ctx.moveTo(0, hoehePx);
    for (let x = 0; x <= breitePx; x += 20) {
        // Leicht hügeliger Boden (die Hügel ziehen mit der Welt vorbei):
        const huegel = Math.sin((x / E + spieler.weltX) * 0.08) * 1.2;
        ctx.lineTo(x, schirmY(96 + huegel));
    }
    ctx.lineTo(breitePx, hoehePx);
    ctx.closePath();
    ctx.fill();

    // ---------- 4. Boote + ihre Schatten ----------
    for (const boot of boote) {
        const bx = schirmX(boot.x);
        const wippen = Math.sin(boot.tuckerPhase) * E * 0.4;
        // Der dunkle Schatten im Wasser (die eigentliche "Gefahr-Anzeige"):
        ctx.fillStyle = "rgba(0, 0, 40, 0.35)";
        ctx.beginPath();
        ctx.ellipse(bx, schirmY(7), (KONFIG.boote.breite / 2) * E, 2.5 * E, 0, 0, Math.PI * 2);
        ctx.fill();
        // Das Boot selbst an der Oberfläche:
        zeichneEmoji("🚤", bx, schirmY(1.5) + wippen, 5 * E, true);
    }

    // ---------- 5. Deko-Tiere (harmlos, nur hübsch) ----------
    for (const d of deko) {
        zeichneEmoji(d.emoji, schirmX(d.x), schirmY(d.y), d.groesse * E);
    }

    // ---------- 6. Hindernisse ----------
    for (const h of hindernisse) {
        const hx = schirmX(h.x);
        if (hx < -15 * E || hx > breitePx + 15 * E) continue;   // Außerhalb? Nicht malen.
        let emoji = welt.emojis[h.art];
        let wackeln = 0;
        if (h.art === "alge") {
            // Algen wiegen sich sanft in der Strömung:
            wackeln = Math.sin(zeitstempel * 0.002 + h.x) * 0.15;
        }
        zeichneEmoji(emoji, hx, schirmY(h.y), h.r * E * 1.15, false, wackeln);
    }

    // ---------- 7. Garnelen ----------
    for (const g of garnelen) {
        const gx = schirmX(g.x);
        if (gx < -5 * E || gx > breitePx + 5 * E) continue;
        // Garnelen hüpfen leicht auf und ab, damit man sie gut sieht:
        const huepfen = Math.sin(zeitstempel * 0.005 + g.x) * E * 0.8;
        zeichneEmoji("🦐", gx, schirmY(g.y) + huepfen, KONFIG.garnelen.radius * E * 1.2);
    }

    // ---------- 8. Das Ziel (Strudel) ----------
    if (ziel) {
        ziel.drehung += 0.03;
        const zx = schirmX(ziel.x);
        // Leuchtender Kreis dahinter, damit das Ziel richtig einlädt:
        const leuchten = ctx.createRadialGradient(zx, schirmY(ziel.y), 0, zx, schirmY(ziel.y), KONFIG.level.zielRadius * E * 1.6);
        leuchten.addColorStop(0, "rgba(255, 255, 180, 0.55)");
        leuchten.addColorStop(1, "rgba(255, 255, 180, 0)");
        ctx.fillStyle = leuchten;
        ctx.fillRect(zx - 20 * E, schirmY(ziel.y) - 20 * E, 40 * E, 40 * E);
        zeichneEmoji("🌀", zx, schirmY(ziel.y), KONFIG.level.zielRadius * E, false, ziel.drehung);
    }

    // ---------- 9. Der Angreifer ----------
    if (angreifer) {
        const wackeln = Math.sin(angreifer.phase) * 0.1;
        // Beim Fliehen schaut er nach links (dahin schwimmt er ja auch):
        zeichneEmoji("🦈", schirmX(angreifer.x), schirmY(angreifer.y),
                     KONFIG.angreifer.radius * E * 1.2, !angreifer.flieht, wackeln);
    }

    // ---------- 10. Der Spieler-Fisch ----------
    // Während der Schonzeit blinkt der Fisch (jede 0,1 s an/aus):
    const blinkt = spieler.schonzeit > 0 && Math.floor(zeitstempel / 100) % 2 === 0;
    if (!blinkt) {
        const wippen = Math.sin(spieler.schwimmPhase) * E * 0.5;
        // Der Fisch neigt sich leicht in Richtung seiner Lenk-Bewegung:
        const neigung = Math.max(-0.3, Math.min(0.3, (spieler.zielY - spieler.y) * 0.02));
        const fx = schirmX(spieler.weltX);
        const fy = schirmY(spieler.y) + wippen;
        // Beim Boost bekommt der Fisch einen gelben Glitzer-Schein:
        if (spieler.boostZeit > 0) {
            const schein = ctx.createRadialGradient(fx, fy, 0, fx, fy, fischRadius() * E * 2);
            schein.addColorStop(0, "rgba(255, 230, 120, 0.45)");
            schein.addColorStop(1, "rgba(255, 230, 120, 0)");
            ctx.fillStyle = schein;
            ctx.fillRect(fx - 10 * E, fy - 10 * E, 20 * E, 20 * E);
        }
        // ctx.scale(-1,1) beim Spiegeln dreht auch die Neigung um – daher minus:
        zeichneEmoji("🐟", fx, fy, fischRadius() * E * 1.2, true, -neigung);
    }

    // ---------- 11. Partikel (Blasen & Funkeln) ----------
    for (const p of partikel) {
        ctx.globalAlpha = Math.max(0, p.leben);
        if (p.art === "blase") {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(schirmX(p.x), schirmY(p.y), p.groesse * E, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            zeichneEmoji("✨", schirmX(p.x), schirmY(p.y), p.groesse * E);
        }
    }
    ctx.globalAlpha = 1;

    // ---------- 12. Text-Meldungen ("Angreifer abgehängt!" …) ----------
    meldungenZeichnen();
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

// Eine aufsteigende Luftblase erzeugen:
function blase(x, y) {
    partikel.push({ art: "blase", x, y, groesse: zufall(0.3, 0.9), leben: 1, steigt: zufall(6, 12) });
}

// Glitzer-Funkeln (z. B. wenn eine Garnele gefressen wird):
function funkeln(x, y) {
    for (let i = 0; i < 4; i++) {
        partikel.push({ art: "funkel", x: x + zufall(-2, 2), y: y + zufall(-2, 2),
                        groesse: zufall(1, 2), leben: 0.8, steigt: 2 });
    }
}

function partikelUpdate(dt) {
    for (let i = partikel.length - 1; i >= 0; i--) {
        const p = partikel[i];
        p.y -= p.steigt * dt;     // Blasen steigen nach oben
        p.leben -= dt;
        if (p.leben <= 0) partikel.splice(i, 1);
    }
    for (let i = meldungen.length - 1; i >= 0; i--) {
        meldungen[i].leben -= dt;
        if (meldungen[i].leben <= 0) meldungen.splice(i, 1);
    }
    // Deko-Tiere schwimmen langsam nach links:
    for (const d of deko) d.x -= d.tempo * dt;
}


/* ================================================================
   13. SPIELABLAUF (Start, Pause, Welt geschafft, Neustart)
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
    spieler.weltX = 0;
    spieler.y = 50;
    spieler.zielY = 50;
    spieler.stossY = 0;
    spieler.boostZeit = 0;
    spieler.gebremstZeit = 0;
    spieler.schonzeit = 1;   // 1 Sekunde Schonfrist beim Start

    hindernisse = [];
    garnelen = [];
    boote = [];
    deko = [];
    partikel = [];
    meldungen = [];
    angreifer = null;
    ziel = null;

    spielZeit = 0;
    naechsteBauX = 50;   // Die ersten 50 E sind freies Wasser zum Eingewöhnen
    naechsterAngreifer = KONFIG.angreifer.erstesSpawnAb + zufall(0, KONFIG.angreifer.spawnZufall);
    naechstesBoot = KONFIG.boote.spawnAbstand * 0.5;

    const welt = aktuelleWelt();
    meldung(`Welt ${weltIndex + 1 + runde * WELTEN.length}: ${welt.name} ${welt.emoji}`);
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

// Der Fisch ist durch den Ziel-Strudel geschwommen:
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
            "Alle Welten entdeckt! 🏆 Jetzt geht's noch flotter weiter …";
    } else {
        const naechste = WELTEN[weltIndex];
        el("welt-geschafft-text").textContent =
            `Als Nächstes: ${naechste.name} ${naechste.emoji}`;
    }
    zeige("welt-geschafft-schirm");
}

// Die Anzeigen oben (Garnelen-Zähler + Fortschrittsbalken) aktualisieren:
function hudAktualisieren() {
    el("garnelen-zahl").textContent = spieler.garnelenGesamt;
    const anteil = Math.min(100, (spieler.weltX / KONFIG.level.streckeProWelt) * 100);
    el("fortschritt-balken").style.width = anteil + "%";
    el("fortschritt-fisch").style.left = anteil + "%";
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
        weltWeiterbauen();          // Level-Generator: Strecke vor dem Fisch bauen
        spielerBewegen(dt);         // Fisch bewegen & lenken
        kollisionenPruefen(dt);     // Garnelen, Hindernisse, Ziel
        angreiferUpdate(dt);        // Verfolger-KI
        booteUpdate(dt);            // Boote & ihre Schatten
        partikelUpdate(dt);         // Blasen, Funkeln, Meldungen
        hudAktualisieren();         // Fortschrittsbalken oben
    }

    // Gezeichnet wird immer – so sieht man das Spielfeld auch in der Pause:
    allesZeichnen(zeitstempel);

    requestAnimationFrame(hauptSchleife);   // Nächstes Bild anfordern
}

/* ---------- LOS GEHT'S! ---------- */
einstellungenLaden();
einstellungenAnzeigen();
requestAnimationFrame(hauptSchleife);
