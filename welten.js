/* ================================================================
   ENTDECKERFISCH – WELTEN & LEVELDESIGN
   ================================================================
   Diese Datei enthält zwei Dinge:

   1. WELTEN  – Die Liste der Welten (Level). Jede Welt hat eigene
                Farben, eigene Deko-Emojis und eine eigene Mischung
                aus Bau-Mustern. Neue Welten kannst du einfach unten
                an die Liste anhängen!

   2. MUSTER  – Die "Bau-Muster" für das Leveldesign. Ein Muster ist
                ein kleines Stück Strecke (z. B. ein Felsen-Slalom
                oder eine Höhle), das der Level-Generator in spiel.js
                aneinanderreiht. So entsteht bei jedem Spielen ein
                etwas anderer, abwechslungsreicher Weg.

   Koordinaten-Erinnerung: Alles wird in "E" gemessen
   (1 E = 1 % der Bildschirmhöhe, siehe config.js).
   y = 0 ist die Wasseroberfläche, y = 100 der Meeresboden.
   ================================================================ */


/* ----------------------------------------------------------------
   DIE WELTEN
   ----------------------------------------------------------------
   Jede Welt bestimmt:
   - name / emoji     : Anzeige beim Levelstart
   - farbeOben/Unten  : Farbverlauf des Wassers (oben hell, unten dunkel)
   - farbeBoden       : Farbe des Sandbodens
   - emojis           : Welche Emojis für Felsen, Korallen und Algen
                        benutzt werden (so sieht jede Welt anders aus)
   - deko             : Emojis, die als harmlose Deko herumschwimmen
   - musterGewichte   : Wie oft welches Bau-Muster vorkommt.
                        Höhere Zahl = kommt häufiger. 0 = kommt nie.
   ---------------------------------------------------------------- */
const WELTEN = [
    {
        name: "Korallenriff",
        emoji: "🐠",
        farbeOben: "#3fa9f5",
        farbeUnten: "#0a4d8c",
        farbeBoden: "#e8c87a",
        emojis: { fels: "🪨", koralle: "🪸", alge: "🌿" },
        deko: ["🐠", "🐚", "⭐"],
        musterGewichte: { freiesWasser: 3, slalom: 3, torbogen: 3, algenwald: 2, hoehle: 1, abzweigung: 2 },
    },
    {
        name: "Geheimnisvolle Höhlen",
        emoji: "🦑",
        farbeOben: "#4a6fb5",
        farbeUnten: "#1a1a4e",
        farbeBoden: "#8a7a9a",
        emojis: { fels: "🪨", koralle: "💎", alge: "🍄" },
        deko: ["🦑", "💎", "🐌"],
        musterGewichte: { freiesWasser: 2, slalom: 2, torbogen: 3, algenwald: 1, hoehle: 4, abzweigung: 3 },
    },
    {
        name: "Algen-Dschungel",
        emoji: "🐢",
        farbeOben: "#3fb58a",
        farbeUnten: "#0a5c3c",
        farbeBoden: "#7a9a5a",
        emojis: { fels: "🪨", koralle: "🌺", alge: "🌿" },
        deko: ["🐢", "🐸", "🍃"],
        musterGewichte: { freiesWasser: 2, slalom: 2, torbogen: 2, algenwald: 5, hoehle: 1, abzweigung: 3 },
    },
    {
        name: "Funkelndes Nachtmeer",
        emoji: "🌙",
        farbeOben: "#2c3e70",
        farbeUnten: "#0b1030",
        farbeBoden: "#3a3a5c",
        emojis: { fels: "🪨", koralle: "🎐", alge: "🪼" },
        deko: ["🌟", "🪼", "🐙"],
        musterGewichte: { freiesWasser: 3, slalom: 3, torbogen: 3, algenwald: 2, hoehle: 2, abzweigung: 3 },
    },
];


/* ----------------------------------------------------------------
   KLEINE ZUFALLS-HELFER
   ---------------------------------------------------------------- */

// Zufallszahl zwischen min und max (mit Komma-Stellen)
function zufall(min, max) {
    return min + Math.random() * (max - min);
}

// Zufällige ganze Zahl zwischen min und max (beide einschließlich)
function zufallGanz(min, max) {
    return Math.floor(zufall(min, max + 1));
}

// Wählt zufällig ein Element aus einer Liste
function zufallAus(liste) {
    return liste[Math.floor(Math.random() * liste.length)];
}


/* ----------------------------------------------------------------
   DIE BAU-MUSTER
   ----------------------------------------------------------------
   Jedes Muster ist eine Funktion, die ab der Position startX ein
   Stück Strecke "baut" und Folgendes zurückgibt:

   {
     laenge:      Wie lang das Stück ist (in E)
     hindernisse: Liste von Hindernissen  { x, y, r, art }
                  art = "fels" | "koralle" | "alge"
                  (Felsen & Korallen stoppen den Fisch sanft,
                   Algen bremsen ihn nur ein bisschen)
     garnelen:    Liste von Garnelen { x, y }
   }
   ---------------------------------------------------------------- */
const MUSTER = {

    /* ---------- FREIES WASSER ----------
       Eine Verschnaufpause: keine Hindernisse, dafür ein schöner
       Bogen aus Garnelen zum Einsammeln. */
    freiesWasser(startX) {
        const laenge = zufall(80, 120);
        const garnelen = [];
        const mitteY = zufall(30, 70);      // Höhe der Bogen-Mitte
        const anzahl = zufallGanz(4, 6);
        for (let i = 0; i < anzahl; i++) {
            garnelen.push({
                x: startX + 20 + i * 12,
                // Sinus-Kurve → die Garnelen bilden eine schöne Welle
                y: mitteY + Math.sin(i * 0.9) * 14,
            });
        }
        return { laenge, hindernisse: [], garnelen };
    },

    /* ---------- FELSEN-SLALOM ----------
       Felsen abwechselnd oben und unten – der Fisch muss in
       Schlangenlinien hindurchschwimmen. */
    slalom(startX) {
        const anzahl = zufallGanz(3, 5);    // Wie viele Felsen
        const abstand = 38;                 // Abstand zwischen den Felsen (in E)
        const hindernisse = [];
        const garnelen = [];
        for (let i = 0; i < anzahl; i++) {
            const oben = i % 2 === 0;       // Abwechselnd oben / unten
            hindernisse.push({
                x: startX + 25 + i * abstand,
                y: oben ? zufall(18, 32) : zufall(68, 82),
                r: zufall(7, 11),
                art: "fels",
            });
            // Belohnung: eine Garnele jeweils auf der freien Seite
            garnelen.push({
                x: startX + 25 + i * abstand,
                y: oben ? zufall(60, 75) : zufall(25, 40),
            });
        }
        return { laenge: 25 + anzahl * abstand + 20, hindernisse, garnelen };
    },

    /* ---------- KORALLEN-TOR ----------
       Eine Wand aus Korallen (unten) und Felsen (oben) mit einer
       Lücke, durch die man präzise hindurchschwimmen muss.
       Die Lücke ist bewusst groß genug für Kinderhände. */
    torbogen(startX) {
        const torX = startX + 40;
        const lueckeY = zufall(28, 72);     // Wo ist die Lücke?
        const lueckeGroesse = 24;           // Wie groß ist die Lücke? (in E, fehlerverzeihend!)
        const hindernisse = [];

        // Wand von oben bis zur Lücke und von der Lücke bis unten bauen:
        for (let y = 8; y < 96; y += 11) {
            const abstandZurLuecke = Math.abs(y - lueckeY);
            if (abstandZurLuecke < lueckeGroesse / 2) continue;  // Lücke freilassen
            hindernisse.push({
                x: torX + zufall(-3, 3),
                y: y,
                r: 6.5,
                art: y > 55 ? "koralle" : "fels",   // Unten Korallen, oben Felsen
            });
        }

        // Eine Garnele mitten in der Lücke zeigt den Weg – wie ein Wegweiser!
        const garnelen = [
            { x: torX - 18, y: lueckeY },
            { x: torX, y: lueckeY },
            { x: torX + 18, y: lueckeY },
        ];
        return { laenge: 90, hindernisse, garnelen };
    },

    /* ---------- HÖHLE ----------
       Ein Felsmassiv mit einem Tunnel hindurch. Der Fisch hat die
       Wahl: OBEN über die Felsen (kurz, aber nah an der Oberfläche,
       wo die Boote fahren!) oder MITTENDURCH den Tunnel (sicher vor
       Booten, dafür eng – und mit Garnelen als Belohnung). */
    hoehle(startX) {
        const laenge = zufall(100, 140);
        const tunnelY = zufall(52, 68);     // Höhe des Tunnels
        const tunnelGroesse = 22;           // Tunnel-Durchmesser (in E)
        const deckeY = 36;                  // Oberkante des Felsmassivs
        const hindernisse = [];

        // Das Felsmassiv Stück für Stück bauen (Spalten von links nach rechts):
        for (let x = startX + 20; x < startX + laenge - 10; x += 12) {
            for (let y = deckeY; y < 96; y += 11) {
                // Den Tunnel freilassen:
                if (Math.abs(y - tunnelY) < tunnelGroesse / 2) continue;
                hindernisse.push({
                    x: x + zufall(-2, 2),
                    y: y + zufall(-2, 2),
                    r: 7,
                    art: "fels",
                });
            }
        }

        // Garnelen-Spur durch den Tunnel (Belohnung für den mutigen Weg):
        const garnelen = [];
        for (let x = startX + 30; x < startX + laenge - 15; x += 22) {
            garnelen.push({ x: x, y: tunnelY });
        }
        return { laenge, hindernisse, garnelen };
    },

    /* ---------- ABZWEIGUNG ----------
       Eine lange Felswand in der Mitte teilt den Weg in einen
       OBEREN und einen UNTEREN Kanal. Der Fisch muss sich
       entscheiden! In einem Kanal warten Garnelen, im anderen
       stehen ein paar Algen im Weg. Perfekt, um Verfolger
       abzuschütteln (die werden in Hindernissen ja gebremst). */
    abzweigung(startX) {
        const laenge = zufall(110, 150);
        const wandY = zufall(42, 58);       // Höhe der Trennwand
        const hindernisse = [];
        const garnelen = [];

        // Die Trennwand in der Mitte:
        for (let x = startX + 25; x < startX + laenge - 15; x += 13) {
            hindernisse.push({
                x: x,
                y: wandY + zufall(-1.5, 1.5),
                r: 7.5,
                art: "fels",
            });
        }

        // Zufällig entscheiden: In welchem Kanal liegen die Garnelen?
        const garnelenOben = Math.random() < 0.5;
        const garnelenY = garnelenOben ? wandY - 25 : wandY + 25;
        const algenY = garnelenOben ? wandY + 25 : wandY - 25;

        // Garnelen-Spur im "Belohnungs-Kanal":
        for (let x = startX + 40; x < startX + laenge - 20; x += 25) {
            garnelen.push({ x: x, y: garnelenY + zufall(-4, 4) });
        }
        // Ein paar Algen im anderen Kanal (bremsen nur, tun nicht weh):
        for (let x = startX + 45; x < startX + laenge - 20; x += 35) {
            hindernisse.push({ x: x, y: algenY + zufall(-5, 5), r: 6, art: "alge" });
        }
        return { laenge, hindernisse, garnelen };
    },

    /* ---------- ALGENWALD ----------
       Viele Algen wachsen vom Boden hoch, ein paar Felsen hängen
       von oben. Der Fisch schlängelt sich hindurch. Algen sind
       weich: Sie bremsen nur, statt den Fisch zu stoppen. */
    algenwald(startX) {
        const laenge = zufall(90, 130);
        const hindernisse = [];
        const garnelen = [];

        // Algen am Boden (in zwei Etagen übereinander, wie hohes Gras):
        for (let x = startX + 20; x < startX + laenge - 10; x += zufall(14, 22)) {
            const hoehe = zufall(60, 78);              // Wie hoch die Alge reicht
            hindernisse.push({ x: x, y: 88, r: 6, art: "alge" });
            hindernisse.push({ x: x, y: hoehe, r: 6, art: "alge" });
        }
        // Vereinzelte Felsen von oben:
        for (let x = startX + 40; x < startX + laenge - 20; x += zufall(45, 65)) {
            hindernisse.push({ x: x, y: zufall(14, 24), r: 8, art: "fels" });
        }
        // Garnelen im freien Mittelbereich:
        for (let x = startX + 35; x < startX + laenge - 15; x += 30) {
            garnelen.push({ x: x, y: zufall(35, 50) });
        }
        return { laenge, hindernisse, garnelen };
    },
};


/* ----------------------------------------------------------------
   MUSTER AUSWÄHLEN (gewichteter Zufall)
   ----------------------------------------------------------------
   Wählt anhand der musterGewichte der aktuellen Welt aus, welches
   Bau-Muster als Nächstes drankommt. Ein Muster mit Gewicht 4 kommt
   viermal so oft dran wie eines mit Gewicht 1.
   ---------------------------------------------------------------- */
function waehleMuster(welt) {
    const gewichte = welt.musterGewichte;
    let summe = 0;
    for (const name in gewichte) summe += gewichte[name];

    let wurf = Math.random() * summe;      // Zufälliger "Würfelwurf"
    for (const name in gewichte) {
        wurf -= gewichte[name];
        if (wurf <= 0) return name;        // Dieses Muster hat "gewonnen"
    }
    return "freiesWasser";                 // Sicherheitsnetz (sollte nie passieren)
}
