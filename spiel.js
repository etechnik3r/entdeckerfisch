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
        if (hoehle && naechsteBauH < hoehle.endeH) {
            // In der Höhle: nur steinige Höhlen-Muster!
            const namen = Object.keys(HOEHLEN_MUSTER);
            stueck = HOEHLEN_MUSTER[zufallAus(namen)](naechsteBauH);
        } else if (!hoehle && naechsteBauH >= naechsteAbzweigungH
                   && naechsteBauH < strecke - 350) {
            // Zeit für eine Abzweigung! (Aber nicht mehr kurz vor dem Ziel,
            // damit eine mögliche Höhle noch genug Platz hat.)
            stueck = abzweigungBauen(naechsteBauH);
            naechsteAbzweigungH = naechsteBauH + stueck.laenge
                                + KONFIG.level.abzweigungAbstand
                                + zufall(0, KONFIG.level.abzweigungZufall);
        } else {
            // Ein normales Bau-Muster auswürfeln (gewichtet nach der Welt):
            const musterName = waehleMuster(aktuelleWelt());
            stueck = MUSTER[musterName](naechsteBauH);
        }

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

    // Ab und zu ein Hintergrund-Tier der Welt dazustellen. Die Tiere
    // sind völlig harmlos – wenn man über sie schwimmt, passiert NICHTS.
    // In Höhlen schwimmen andere Tiere als draußen!
    if (Math.random() < 0.01 && tiere.length < 5) {
        const liste = hoehleDunkel() > 0.3 ? HOEHLEN_TIERE : aktuelleWelt().tiere;
        // Tiere starten außerhalb des BILDSCHIRMS (nicht nur des Spielfelds),
        // damit sie auch auf breiten Bildschirmen von außen hereinschwimmen:
        const rand = schirmBreiteE / 2;
        const vonLinks = Math.random() < 0.5;
        tiere.push({
            x: vonLinks ? -rand - 8 : rand + 8,
            h: spieler.h + zufall(20, 85),
            vx: (vonLinks ? 1 : -1) * zufall(2.5, 6),   // Schwimmt gemütlich quer durchs Bild
            emoji: zufallAus(liste),
            groesse: zufall(2.2, 3.8),
            phase: zufall(0, 6),
        });
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
    spieler.boostZeit    = Math.max(0, spieler.boostZeit - dt);
    spieler.gebremstZeit = Math.max(0, spieler.gebremstZeit - dt);
    spieler.pflanzenZeit = Math.max(0, spieler.pflanzenZeit - dt);
    spieler.schonzeit    = Math.max(0, spieler.schonzeit - dt);

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
    spieler.schwimmPhase += dt * (spieler.boostZeit > 0 ? 14 : 7);
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

    // ---------- GARNELEN einsammeln ----------
    for (let i = garnelen.length - 1; i >= 0; i--) {
        const g = garnelen[i];
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
        const dx = spieler.x - hi.x;
        const dh = spieler.h - hi.h;
        const abstand = Math.sqrt(dx * dx + dh * dh);
        // 0.75 = die Hitbox ist nur 75 % so groß wie das Bild (fehlerverzeihend):
        const mindestAbstand = (r + hi.r) * 0.75;

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
                spieler.h += nh * ueberlappung;

                // Beim ersten Aufprall: kurz bremsen + "Autsch"-Ton
                if (spieler.gebremstZeit <= 0) {
                    spieler.gebremstZeit = 0.5;
                    SOUND.rempler();
                }
            }
        }
    }

    // ---------- ABZWEIGUNGEN: Welchen Weg hat der Fisch gewählt? ----------
    for (const zone of zonen) {
        if (zone.entschieden || spieler.h <= zone.bisH) continue;
        zone.entschieden = true;
        // In welchem Weg (Kanal) ist der Fisch gerade?
        const kanal = zone.kanaele.find(k => spieler.x >= k.von && spieler.x < k.bis)
                    || zone.kanaele[0];
        if (kanal.art === "hoehle") {
            hoehleStarten();                          // Ab in die dunkle Höhle!
        } else if (kanal.art === "garnelen") {
            meldung("Leckerer Weg! 🦐");
        } else {
            meldung("Gut durchgeschlängelt! 🌿");
        }
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

function hoehleStarten() {
    // Wie lang wird die Höhle? (Nie länger, als bis zur Zielgeraden Platz ist.)
    const maxEnde = KONFIG.level.streckeProWelt - KONFIG.level.freieZielgerade - 40;
    const laenge = Math.min(zufall(KONFIG.hoehle.minLaenge, KONFIG.hoehle.maxLaenge),
                            maxEnde - spieler.h);
    if (laenge < 60) return;   // Zu nah am Ziel? Dann bleibt es hell.

    hoehle = { startH: spieler.h, endeH: spieler.h + laenge };

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
    const rein = (spieler.h - hoehle.startH) / 14;
    const raus = (hoehle.endeH - spieler.h) / 14;
    return Math.max(0, Math.min(1, rein, raus));
}

function hoehleUpdate() {
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
    if (!angreifer && spielZeit > naechsterAngreifer
        && spieler.h < KONFIG.level.streckeProWelt - 150) {
        angreifer = {
            x: spieler.x + zufall(-10, 10),
            h: spieler.h - KONFIG.angreifer.startAbstand,   // Startet weit unterhalb des Bildschirms
            verfolgZeit: 0,         // Wie lange er schon jagt
            flieht: false,          // true = er hat aufgegeben und zieht ab
            phase: 0,               // Nur für die Optik (Schwanzflossen-Wedeln)
            bewX: 0, bewH: 1,       // Seine Schwimmrichtung (fürs Zeichnen)
        };
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
        if (hi.art === "pflanze") continue;   // Durch Pflanzen kommt er gut durch
        const dx = a.x - hi.x, dh = a.h - hi.h;
        if (dx * dx + dh * dh < (hi.r + KONFIG.angreifer.radius) ** 2 * 0.6) {
            tempo *= KONFIG.angreifer.bremseInHindernis;
            break;
        }
    }

    // Auf den Fisch zuschwimmen (normalisierte Richtung × Tempo):
    const dx = spieler.x - a.x;
    const dh = spieler.h - a.h;
    const abstand = Math.sqrt(dx * dx + dh * dh) || 0.01;
    a.x += (dx / abstand) * tempo * dt;
    a.h += (dh / abstand) * tempo * dt;
    a.bewX = dx / abstand;
    a.bewH = dh / abstand;

    // ---- Hat der Fisch den Hai abgehängt? ----
    const rueckstand = spieler.h - a.h;
    if (rueckstand > KONFIG.angreifer.fluchtAbstand
        || a.verfolgZeit > KONFIG.angreifer.maxVerfolgung) {
        meldung(zufallAus([
            "Hai abgehängt! 🎉",
            "Der Hai schwimmt in den falschen Gang! 🦈💨",
            "Der Hai gibt auf und zieht davon! 🎉",
        ]));
        SOUND.abgehaengt();
        haiGibtAuf(a);
        return;
    }

    // ---- Hat der Hai den Fisch erwischt? ----
    if (abstand < fischRadius() + KONFIG.angreifer.radius * 0.7 && spieler.schonzeit <= 0) {
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

// Malt ein Emoji zentriert an eine Pixel-Position.
// groessePx = ungefährer Radius in Pixeln, spiegeln = umdrehen, drehung in Bogenmaß
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

/* ---------- PFLANZEN – fest verwurzelt, nicht schwebend! ----------
   Jede Pflanze bekommt einen kleinen Sand-Sockel mit Steinchen,
   auf dem sie fest steht. Und sie wiegt sich um ihren FUSS in der
   Strömung – nicht um die Mitte. So schwebt nichts mehr in der Luft! */
function zeichnePflanze(emoji, px, py, groessePx, wackeln, bodenFarbe) {
    const basisY = py + groessePx * 0.85;   // Hier "steht" die Pflanze

    // Der Sand-Hügel, in dem die Pflanze wurzelt:
    ctx.fillStyle = bodenFarbe;
    ctx.beginPath();
    ctx.ellipse(px, basisY, groessePx * 1.1, groessePx * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    // Ein paar Steinchen auf dem Hügel (halten die Pflanze fest):
    ctx.fillStyle = "rgba(95, 88, 80, 0.85)";
    ctx.beginPath();
    ctx.arc(px - groessePx * 0.55, basisY - groessePx * 0.02, groessePx * 0.18, 0, Math.PI * 2);
    ctx.arc(px + groessePx * 0.5, basisY + groessePx * 0.06, groessePx * 0.14, 0, Math.PI * 2);
    ctx.fill();

    // Die Pflanze selbst – sie dreht sich um ihren Fußpunkt:
    ctx.save();
    ctx.translate(px, basisY);
    ctx.rotate(wackeln);
    ctx.font = `${groessePx * 2}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(emoji, 0, groessePx * 0.15);
    ctx.restore();
}

/* ---------- DER HAI – eine richtige, selbstgemalte Figur! ----------
   Kein kleines Emoji mehr: Der Hai wird mit Körper, Bauch, Flossen,
   Auge und Maul direkt aufs Canvas gemalt und dreht sich immer in
   seine Schwimmrichtung. s = seine Größe in Pixeln. */
function zeichneHai(px, py, s, winkel, phase) {
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

    // Das Maul (ein freundlich-gefährlicher Bogen):
    ctx.strokeStyle = "#3a4a5a";
    ctx.lineWidth = Math.max(1.5, 0.08 * s);
    ctx.beginPath();
    ctx.arc(0.85 * s, 0.3 * s, 0.55 * s, Math.PI * 0.1, Math.PI * 0.55);
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
        const schwoof = Math.sin(zeitstempel * 0.002 + t.phase) * E * 0.8;
        // Tiere schauen in ihre Schwimmrichtung (Emojis schauen links):
        zeichneEmoji(t.emoji, schirmX(t.x), schirmY(t.h) + schwoof, t.groesse * E, t.vx > 0);
    }
    ctx.globalAlpha = 1;

    // ---------- 5. Höhlen-Eingänge (dunkle Löcher an Abzweigungen) ----------
    // Der Eingang sieht jetzt wie ein richtiges Felsenloch aus:
    // innen stockdunkel, nach außen weicher werdend, mit einem
    // grauen Steinrand rundherum.
    for (const zone of zonen) {
        for (const k of zone.kanaele) {
            if (k.art !== "hoehle") continue;
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
        // Höhlen-Steine bringen ihr eigenes Emoji mit (🪨), sonst nimmt
        // jede Welt ihre eigenen Bilder:
        const emoji = hi.emoji || welt.emojis[hi.art];
        if (hi.art === "pflanze") {
            // Pflanzen stehen FEST auf einem kleinen Sand-Sockel und
            // wiegen sich um ihren Fuß in der Strömung:
            const wackeln = Math.sin(zeitstempel * 0.002 + hi.h) * 0.12;
            zeichnePflanze(emoji, schirmX(hi.x), hy, hi.r * E * 1.15, wackeln, welt.farbeBoden);
        } else {
            zeichneEmoji(emoji, schirmX(hi.x), hy, hi.r * E * 1.15);
        }
    }

    // ---------- 7. Garnelen ----------
    for (const g of garnelen) {
        const gy = schirmY(g.h);
        if (gy < -5 * E || gy > hoehePx + 5 * E) continue;
        // Garnelen hüpfen leicht hin und her, damit man sie gut sieht:
        const huepfen = Math.sin(zeitstempel * 0.005 + g.h) * E * 0.8;
        zeichneEmoji("🦐", schirmX(g.x) + huepfen, gy, KONFIG.garnelen.radius * E * 1.2);
    }

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
            zeichneHai(ax, ay, s, winkel, a.phase);
        } else {
            // Noch unterhalb des Bildschirms? Ein Warnzeichen zeigt,
            // wo er gleich auftauchen wird:
            const puls = 1 + Math.sin(zeitstempel * 0.01) * 0.15;
            zeichneEmoji("⚠️", ax, hoehePx - 4 * E, 2.5 * E * puls);
        }
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
function blase(x, h) {
    partikel.push({ art: "blase", x, h, groesse: zufall(0.3, 0.9), leben: 1, vh: zufall(6, 12) });
}

// Glitzer-Funkeln (z. B. wenn eine Garnele gefressen wird):
function funkeln(x, h) {
    for (let i = 0; i < 4; i++) {
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
    // Hintergrund-Tiere schwimmen gemütlich quer durchs Bild:
    const rand = schirmBreiteE / 2;
    for (let i = tiere.length - 1; i >= 0; i--) {
        const t = tiere[i];
        t.x += t.vx * dt;
        // Fliehende Tiere (z. B. vor einer Höhle) werden dabei immer
        // durchsichtiger, bis man sie gar nicht mehr sieht:
        if (t.flieht) {
            t.alpha = (t.alpha ?? 1) - dt * 0.6;
            if (t.alpha <= 0) { tiere.splice(i, 1); continue; }
        }
        if (Math.abs(t.x) > rand + 14) tiere.splice(i, 1);   // Aus dem Bild? Weg damit.
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
    spieler.schonzeit = 1;   // 1 Sekunde Schonfrist beim Start

    hindernisse = [];
    garnelen = [];
    tiere = [];
    zonen = [];
    partikel = [];
    meldungen = [];
    angreifer = null;
    hoehle = null;

    spielZeit = 0;
    sprungZeit = 0;
    sprungGeplatscht = false;
    naechsteBauH = 45;   // Die ersten 45 E sind freies Wasser zum Eingewöhnen
    naechsteAbzweigungH = 150 + zufall(0, 80);
    naechsterAngreifer = KONFIG.angreifer.erstesSpawnAb + zufall(0, KONFIG.angreifer.spawnZufall);

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

// Die Anzeigen oben (Garnelen-Zähler + Fortschrittsbalken) aktualisieren:
function hudAktualisieren() {
    el("garnelen-zahl").textContent = spieler.garnelenGesamt;
    const anteil = Math.min(100, (spieler.h / KONFIG.level.streckeProWelt) * 100);
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
        weltWeiterbauen();          // Level-Generator: Strecke über dem Fisch bauen
        spielerBewegen(dt);         // Fisch aufsteigen lassen & lenken
        kollisionenPruefen(dt);     // Garnelen, Hindernisse, Abzweigungen
        hoehleUpdate();             // Höhlen-Anfang und -Ende verwalten
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
