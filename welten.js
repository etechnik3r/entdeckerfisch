/* ================================================================
   ENTDECKERFISCH – WELTEN & LEVELDESIGN
   ================================================================
   Diese Datei enthält drei Dinge:

   1. WELTEN  – Die Liste der 44 Welten (Level). Jede Welt hat eigene
                Farben, eigene Hindernis-Emojis und eigene Tiere, die
                harmlos im Hintergrund mitschwimmen. Neue Welten
                kannst du einfach unten an die Liste anhängen!
                Extra: Welten mit "dunkel" sind TIEFSEE-Welten –
                dort ist es duster und man sieht nur im Lichtkreis
                um den Fisch richtig gut (0 = hell, 1 = stockfinster).

   2. MUSTER  – Die "Bau-Muster" für das Leveldesign. Ein Muster ist
                ein kleines Stück Strecke (z. B. ein Felsen-Slalom
                oder eine Abzweigung), das der Level-Generator in
                spiel.js übereinanderstapelt – denn der Fisch
                schwimmt NACH OBEN, zur Wasseroberfläche!

   3. HOEHLEN_MUSTER – Extra-Muster für die dunklen Höhlen:
                viele Steine, enge Gänge, kaum Pflanzen.

   Koordinaten-Erinnerung: Alles wird in "E" gemessen
   (1 E = 1 % der Bildschirmhöhe, siehe config.js).
   h = 0 ist der Start unten, h = streckeProWelt die Oberfläche.
   x = 0 ist die Mitte des Spielfelds (links negativ, rechts positiv).
   ================================================================ */


/* ----------------------------------------------------------------
   DIE WELTEN
   ----------------------------------------------------------------
   Jede Welt bestimmt:
   - name / emoji     : Anzeige beim Levelstart
   - farbeOben/Unten  : Farbverlauf des Wassers (oben hell, unten dunkel)
   - farbeBoden       : Farbe des Meeresbodens (nur am Start sichtbar)
   - emojis           : Welche Emojis für Felsen und Pflanzen benutzt
                        werden (Felsen stoppen sanft, Pflanzen bremsen nur)
   - tiere            : Tiere, die harmlos im Hintergrund mitschwimmen.
                        Wenn man über sie schwimmt, passiert NICHTS –
                        sie sind nur schöne Kulisse!
   - musterGewichte   : Wie oft welches Bau-Muster vorkommt.
                        Höhere Zahl = kommt häufiger. 0 = kommt nie.
   ---------------------------------------------------------------- */
const WELTEN = [
    {
        name: "Korallenriff",
        emoji: "🐠",
        farbeOben: "#3fa9f5", farbeUnten: "#0a4d8c", farbeBoden: "#e8c87a",
        emojis: { fels: "🪸", pflanze: "🌿" },
        tiere: ["🐠", "🐟", "🐡"],
        musterGewichte: { freiesWasser: 3, slalom: 3, torbogen: 3, pflanzenwald: 2, felsengarten: 2 },
    },
    {
        name: "Schildkrötenbucht",
        emoji: "🐢",
        farbeOben: "#3fc4b0", farbeUnten: "#0a6b5c", farbeBoden: "#d8c88a",
        emojis: { fels: "🪨", pflanze: "🌿" },
        tiere: ["🐢", "🐢", "🐠"],
        musterGewichte: { freiesWasser: 4, slalom: 2, torbogen: 2, pflanzenwald: 3, felsengarten: 2 },
    },
    {
        name: "Quallen-Lagune",
        emoji: "🪼",
        farbeOben: "#7f8fe5", farbeUnten: "#2a2a7c", farbeBoden: "#9a8ab5",
        emojis: { fels: "🪨", pflanze: "🪼" },
        tiere: ["🪼", "🪼", "🐟"],
        musterGewichte: { freiesWasser: 3, slalom: 2, torbogen: 2, pflanzenwald: 4, felsengarten: 1 },
    },
    {
        name: "Delfin-Bucht",
        emoji: "🐬",
        farbeOben: "#4fc3f7", farbeUnten: "#0d5ba5", farbeBoden: "#eed9a0",
        emojis: { fels: "🪨", pflanze: "🌿" },
        tiere: ["🐬", "🐬", "🐟"],
        musterGewichte: { freiesWasser: 4, slalom: 3, torbogen: 2, pflanzenwald: 1, felsengarten: 2 },
    },
    {
        name: "Seegras-Wiese",
        emoji: "🌿",
        farbeOben: "#3fb58a", farbeUnten: "#0a5c3c", farbeBoden: "#7a9a5a",
        emojis: { fels: "🪨", pflanze: "🌿" },
        tiere: ["🐢", "🐟", "🐸"],
        musterGewichte: { freiesWasser: 2, slalom: 2, torbogen: 2, pflanzenwald: 5, felsengarten: 1 },
    },
    {
        name: "Eismeer",
        emoji: "🧊",
        farbeOben: "#bfe6f5", farbeUnten: "#3a7ca8", farbeBoden: "#dcedf5",
        emojis: { fels: "🧊", pflanze: "🌿" },
        tiere: ["🐧", "🦭", "🐟"],
        musterGewichte: { freiesWasser: 3, slalom: 3, torbogen: 3, pflanzenwald: 1, felsengarten: 3 },
    },
    {
        name: "Vulkan-Riff",
        emoji: "🌋",
        farbeOben: "#e58a5f", farbeUnten: "#6b1a1a", farbeBoden: "#4a3a3a",
        emojis: { fels: "🪨", pflanze: "🌿" },
        tiere: ["🦀", "🐠", "🐟"],
        musterGewichte: { freiesWasser: 2, slalom: 3, torbogen: 3, pflanzenwald: 1, felsengarten: 4 },
    },
    {
        name: "Wal-Weite",
        emoji: "🐋",
        farbeOben: "#5a9fd5", farbeUnten: "#123a6b", farbeBoden: "#8a9ab5",
        emojis: { fels: "🪨", pflanze: "🌿" },
        tiere: ["🐋", "🐳", "🐟"],
        musterGewichte: { freiesWasser: 5, slalom: 2, torbogen: 2, pflanzenwald: 1, felsengarten: 2 },
    },
    {
        name: "Krabben-Küste",
        emoji: "🦀",
        farbeOben: "#5fc4d5", farbeUnten: "#1a6b7c", farbeBoden: "#eed9a0",
        emojis: { fels: "🪨", pflanze: "🌿" },
        tiere: ["🦀", "🦀", "🐠"],
        musterGewichte: { freiesWasser: 3, slalom: 3, torbogen: 2, pflanzenwald: 2, felsengarten: 3 },
    },
    {
        name: "Oktopus-Garten",
        emoji: "🐙",
        farbeOben: "#9a7fd5", farbeUnten: "#3a1a6b", farbeBoden: "#7a6a9a",
        emojis: { fels: "🪨", pflanze: "🌿" },
        tiere: ["🐙", "🐙", "🐠"],
        musterGewichte: { freiesWasser: 3, slalom: 2, torbogen: 3, pflanzenwald: 2, felsengarten: 3 },
    },
    {
        name: "Regenbogen-Riff",
        emoji: "🌈",
        farbeOben: "#5fd5c4", farbeUnten: "#7c3a9a", farbeBoden: "#f5c4d5",
        emojis: { fels: "🪸", pflanze: "🌺" },
        tiere: ["🐠", "🐟", "🦐"],
        musterGewichte: { freiesWasser: 3, slalom: 3, torbogen: 3, pflanzenwald: 2, felsengarten: 2 },
    },
    {
        name: "Piraten-Bucht",
        emoji: "🏴‍☠️",
        farbeOben: "#6b8f7c", farbeUnten: "#1a3a2c", farbeBoden: "#8a7a5a",
        emojis: { fels: "⚓", pflanze: "🌿" },
        tiere: ["🐠", "🐡", "🐟"],
        musterGewichte: { freiesWasser: 2, slalom: 3, torbogen: 3, pflanzenwald: 2, felsengarten: 3 },
    },
    {
        name: "Versunkene Stadt",
        emoji: "🏛️",
        farbeOben: "#7f9fb5", farbeUnten: "#2a3a5c", farbeBoden: "#9a9a8a",
        emojis: { fels: "🏛️", pflanze: "🌿" },
        tiere: ["🐬", "🐟", "🐠"],
        musterGewichte: { freiesWasser: 2, slalom: 3, torbogen: 4, pflanzenwald: 1, felsengarten: 3 },
    },
    {
        name: "Glitzer-Grotte",
        emoji: "💎",
        farbeOben: "#4a6fb5", farbeUnten: "#1a1a4e", farbeBoden: "#8a7a9a",
        emojis: { fels: "💎", pflanze: "🌿" },
        tiere: ["🦑", "🐟", "🐠"],
        musterGewichte: { freiesWasser: 2, slalom: 3, torbogen: 3, pflanzenwald: 1, felsengarten: 4 },
    },
    {
        name: "Funkelndes Nachtmeer",
        emoji: "🌙",
        farbeOben: "#2c3e70", farbeUnten: "#0b1030", farbeBoden: "#3a3a5c",
        emojis: { fels: "🪨", pflanze: "🪼" },
        tiere: ["🪼", "🦑", "🐙"],
        dunkel: 0.2,
        musterGewichte: { freiesWasser: 3, slalom: 3, torbogen: 3, pflanzenwald: 2, felsengarten: 2 },
    },
    {
        name: "Tiefsee-Schlucht",
        emoji: "🦑",
        farbeOben: "#1a2a4e", farbeUnten: "#05081c", farbeBoden: "#2a2a3c",
        emojis: { fels: "🪨", pflanze: "🪼" },
        tiere: ["🦑", "🐙", "🐡"],
        dunkel: 0.35,
        musterGewichte: { freiesWasser: 2, slalom: 3, torbogen: 3, pflanzenwald: 1, felsengarten: 4 },
    },
    {
        name: "Goldener See",
        emoji: "🌞",
        farbeOben: "#f5c45f", farbeUnten: "#a5601a", farbeBoden: "#d8b87a",
        emojis: { fels: "🪨", pflanze: "🌿" },
        tiere: ["🐟", "🐠", "🦆"],
        musterGewichte: { freiesWasser: 4, slalom: 2, torbogen: 2, pflanzenwald: 3, felsengarten: 2 },
    },
    {
        name: "Mangroven-Wald",
        emoji: "🌳",
        farbeOben: "#8fb56b", farbeUnten: "#2c4a1a", farbeBoden: "#5c4a2c",
        emojis: { fels: "🪵", pflanze: "🌱" },
        tiere: ["🐟", "🐢", "🐸"],
        musterGewichte: { freiesWasser: 2, slalom: 2, torbogen: 2, pflanzenwald: 5, felsengarten: 2 },
    },
    {
        name: "Pinguin-Eisbucht",
        emoji: "🐧",
        farbeOben: "#d5ecf5", farbeUnten: "#4a8ab5", farbeBoden: "#eef5fa",
        emojis: { fels: "🧊", pflanze: "🌿" },
        tiere: ["🐧", "🐧", "🦭"],
        musterGewichte: { freiesWasser: 3, slalom: 4, torbogen: 2, pflanzenwald: 1, felsengarten: 3 },
    },
    {
        name: "Robben-Felsen",
        emoji: "🦭",
        farbeOben: "#8fa5b5", farbeUnten: "#2c3a4a", farbeBoden: "#6a7a8a",
        emojis: { fels: "🪨", pflanze: "🌿" },
        tiere: ["🦭", "🦭", "🐟"],
        musterGewichte: { freiesWasser: 3, slalom: 3, torbogen: 3, pflanzenwald: 1, felsengarten: 3 },
    },
    {
        name: "Seestern-Schlucht",
        emoji: "⭐",
        farbeOben: "#f5a55f", farbeUnten: "#7c2a5c", farbeBoden: "#e8c87a",
        emojis: { fels: "🪨", pflanze: "🌿" },
        tiere: ["⭐", "🐠", "🐟"],
        musterGewichte: { freiesWasser: 3, slalom: 3, torbogen: 3, pflanzenwald: 2, felsengarten: 2 },
    },
    {
        name: "Muschel-Meer",
        emoji: "🐚",
        farbeOben: "#f5d5e5", farbeUnten: "#7c5a8a", farbeBoden: "#f0e0c8",
        emojis: { fels: "🐚", pflanze: "🌿" },
        tiere: ["🐠", "🐟", "🐬"],
        musterGewichte: { freiesWasser: 3, slalom: 2, torbogen: 3, pflanzenwald: 2, felsengarten: 3 },
    },
    {
        name: "Blubberblasen-Riff",
        emoji: "🫧",
        farbeOben: "#7fdcf5", farbeUnten: "#1a7c9a", farbeBoden: "#c8e8d8",
        emojis: { fels: "🪸", pflanze: "🌿" },
        tiere: ["🐟", "🐠", "🐡"],
        musterGewichte: { freiesWasser: 4, slalom: 3, torbogen: 2, pflanzenwald: 2, felsengarten: 2 },
    },
    {
        name: "Zaubermeer",
        emoji: "✨",
        farbeOben: "#c45fd5", farbeUnten: "#2a0a5c", farbeBoden: "#8a5ab5",
        emojis: { fels: "💎", pflanze: "🌺" },
        tiere: ["🧜‍♀️", "🐬", "🐠"],
        musterGewichte: { freiesWasser: 3, slalom: 3, torbogen: 3, pflanzenwald: 2, felsengarten: 2 },
    },
    {
        name: "Kiesel-Welt",
        emoji: "🪨",
        farbeOben: "#9aa8b5", farbeUnten: "#4a5560", farbeBoden: "#b5b0a0",
        emojis: { fels: "🪨", pflanze: "🌱" },
        tiere: ["🐟", "🦀", "🐌"],
        musterGewichte: { freiesWasser: 2, slalom: 3, torbogen: 3, pflanzenwald: 1, felsengarten: 5 },
    },
    {
        name: "Schildkröten-Fluss",
        emoji: "🐢",
        farbeOben: "#7cc47f", farbeUnten: "#1a5c3a", farbeBoden: "#8a7a4a",
        emojis: { fels: "🪵", pflanze: "🌿" },
        tiere: ["🐢", "🐢", "🐸"],
        musterGewichte: { freiesWasser: 3, slalom: 2, torbogen: 2, pflanzenwald: 4, felsengarten: 2 },
    },
    {
        name: "Fische-Meer",
        emoji: "🐟",
        farbeOben: "#4fb5e5", farbeUnten: "#0d4a8c", farbeBoden: "#d8c88a",
        emojis: { fels: "🪨", pflanze: "🌿" },
        tiere: ["🐟", "🐠", "🐟"],
        musterGewichte: { freiesWasser: 5, slalom: 2, torbogen: 2, pflanzenwald: 2, felsengarten: 1 },
    },
    {
        name: "Hummer-Bucht",
        emoji: "🦞",
        farbeOben: "#d58a6f", farbeUnten: "#5c2a1a", farbeBoden: "#c8a87a",
        emojis: { fels: "🪨", pflanze: "🌿" },
        tiere: ["🦞", "🦀", "🐟"],
        musterGewichte: { freiesWasser: 2, slalom: 3, torbogen: 3, pflanzenwald: 2, felsengarten: 3 },
    },
    {
        name: "Flamingo-Lagune",
        emoji: "🦩",
        farbeOben: "#f5a5c5", farbeUnten: "#8a3a6b", farbeBoden: "#f0d5b5",
        emojis: { fels: "🪨", pflanze: "🌺" },
        tiere: ["🦩", "🐠", "🐟"],
        musterGewichte: { freiesWasser: 4, slalom: 2, torbogen: 2, pflanzenwald: 3, felsengarten: 1 },
    },
    {
        name: "Otter-Fluss",
        emoji: "🦦",
        farbeOben: "#8fb5a5", farbeUnten: "#2c5c4a", farbeBoden: "#7a6a4a",
        emojis: { fels: "🪵", pflanze: "🌱" },
        tiere: ["🦦", "🐟", "🐢"],
        musterGewichte: { freiesWasser: 3, slalom: 3, torbogen: 2, pflanzenwald: 3, felsengarten: 2 },
    },
    {
        name: "Kugelfisch-Bucht",
        emoji: "🐡",
        farbeOben: "#f5d57f", farbeUnten: "#9a6b1a", farbeBoden: "#e8d8a0",
        emojis: { fels: "🪸", pflanze: "🌿" },
        tiere: ["🐡", "🐡", "🐠"],
        musterGewichte: { freiesWasser: 3, slalom: 3, torbogen: 3, pflanzenwald: 2, felsengarten: 2 },
    },
    {
        name: "Anemonen-Garten",
        emoji: "🌺",
        farbeOben: "#f58a9a", farbeUnten: "#7c1a4a", farbeBoden: "#e8b8c8",
        emojis: { fels: "🪸", pflanze: "🌺" },
        tiere: ["🐠", "🦐", "🐟"],
        musterGewichte: { freiesWasser: 2, slalom: 2, torbogen: 2, pflanzenwald: 5, felsengarten: 2 },
    },
    {
        name: "Leucht-Tiefe",
        emoji: "🪼",
        farbeOben: "#1a3a5c", farbeUnten: "#050a20", farbeBoden: "#2a3a4c",
        emojis: { fels: "🪨", pflanze: "🪼" },
        tiere: ["🪼", "🪼", "🦑"],
        dunkel: 0.35,
        musterGewichte: { freiesWasser: 3, slalom: 2, torbogen: 2, pflanzenwald: 4, felsengarten: 2 },
    },
    {
        name: "Anglerfisch-Abgrund",
        emoji: "🎣",
        farbeOben: "#12203c", farbeUnten: "#03050f", farbeBoden: "#1c2430",
        emojis: { fels: "🪨", pflanze: "🪼" },
        tiere: ["🦑", "🐙", "🪼"],
        dunkel: 0.5,
        musterGewichte: { freiesWasser: 2, slalom: 3, torbogen: 3, pflanzenwald: 1, felsengarten: 4 },
    },
    {
        name: "Mitternachts-Tiefsee",
        emoji: "🌑",
        farbeOben: "#0e1530", farbeUnten: "#020308", farbeBoden: "#161a28",
        emojis: { fels: "🪨", pflanze: "🪼" },
        tiere: ["🐙", "🦑", "🐡"],
        dunkel: 0.55,
        musterGewichte: { freiesWasser: 3, slalom: 2, torbogen: 3, pflanzenwald: 1, felsengarten: 3 },
    },
    {
        name: "Sandbank-Bucht",
        emoji: "🏝️",
        farbeOben: "#7fdce5", farbeUnten: "#2a8a9a", farbeBoden: "#f0e0b0",
        emojis: { fels: "🐚", pflanze: "🌱" },
        tiere: ["🐠", "🐟", "🦀"],
        musterGewichte: { freiesWasser: 5, slalom: 2, torbogen: 2, pflanzenwald: 1, felsengarten: 2 },
    },
    {
        name: "Kelp-Wald",
        emoji: "🌿",
        farbeOben: "#4a9a6b", farbeUnten: "#0f3c28", farbeBoden: "#5c5a3a",
        emojis: { fels: "🪨", pflanze: "🌿" },
        tiere: ["🦦", "🐟", "🐠"],
        musterGewichte: { freiesWasser: 1, slalom: 2, torbogen: 2, pflanzenwald: 6, felsengarten: 1 },
    },
    {
        name: "Gletscher-See",
        emoji: "❄️",
        farbeOben: "#cfeaf5", farbeUnten: "#5a9ac5", farbeBoden: "#e8f2fa",
        emojis: { fels: "🧊", pflanze: "🌿" },
        tiere: ["🦭", "🐧", "🐟"],
        musterGewichte: { freiesWasser: 3, slalom: 4, torbogen: 3, pflanzenwald: 1, felsengarten: 3 },
    },
    {
        name: "Schwanen-See",
        emoji: "🦢",
        farbeOben: "#b5d5e5", farbeUnten: "#3a6b8a", farbeBoden: "#a8b89a",
        emojis: { fels: "🪨", pflanze: "🌱" },
        tiere: ["🦢", "🦆", "🐟"],
        musterGewichte: { freiesWasser: 4, slalom: 2, torbogen: 2, pflanzenwald: 3, felsengarten: 1 },
    },
    {
        name: "Biber-Bach",
        emoji: "🦫",
        farbeOben: "#a5b57f", farbeUnten: "#3c4a1a", farbeBoden: "#6b5a3a",
        emojis: { fels: "🪵", pflanze: "🌱" },
        tiere: ["🦫", "🐟", "🐸"],
        musterGewichte: { freiesWasser: 2, slalom: 3, torbogen: 3, pflanzenwald: 3, felsengarten: 2 },
    },
    {
        name: "Frosch-Teich",
        emoji: "🐸",
        farbeOben: "#8fc47f", farbeUnten: "#2a4a1a", farbeBoden: "#5a6a3a",
        emojis: { fels: "🪨", pflanze: "🌱" },
        tiere: ["🐸", "🐸", "🐟"],
        musterGewichte: { freiesWasser: 3, slalom: 2, torbogen: 2, pflanzenwald: 4, felsengarten: 2 },
    },
    {
        name: "Enten-Teich",
        emoji: "🦆",
        farbeOben: "#a5cfe5", farbeUnten: "#4a7a5c", farbeBoden: "#9a8a5a",
        emojis: { fels: "🪨", pflanze: "🌿" },
        tiere: ["🦆", "🦆", "🐟"],
        musterGewichte: { freiesWasser: 4, slalom: 2, torbogen: 2, pflanzenwald: 3, felsengarten: 1 },
    },
    {
        name: "Schnecken-Riff",
        emoji: "🐌",
        farbeOben: "#d5c4a5", farbeUnten: "#6b5a3c", farbeBoden: "#c8b88a",
        emojis: { fels: "🐚", pflanze: "🌿" },
        tiere: ["🐌", "🐠", "🐟"],
        musterGewichte: { freiesWasser: 3, slalom: 2, torbogen: 3, pflanzenwald: 3, felsengarten: 2 },
    },
    {
        name: "Sternschnuppen-See",
        emoji: "🌠",
        farbeOben: "#2a2a6b", farbeUnten: "#0a0a25", farbeBoden: "#3a3a5a",
        emojis: { fels: "💎", pflanze: "🪼" },
        tiere: ["⭐", "🐟", "🪼"],
        dunkel: 0.3,
        musterGewichte: { freiesWasser: 3, slalom: 3, torbogen: 2, pflanzenwald: 2, felsengarten: 3 },
    },
];

// Diese Tiere schwimmen in HÖHLEN im Hintergrund herum
// (andere Fische als draußen – Höhlenbewohner eben):
const HOEHLEN_TIERE = ["🦑", "🐡", "🐙"];


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
   Jedes Muster ist eine Funktion, die ab der Höhe startH ein
   Stück Strecke "baut" und Folgendes zurückgibt:

   {
     laenge:      Wie hoch das Stück ist (in E)
     hindernisse: Liste von Hindernissen  { x, h, r, art }
                  art = "fels" | "pflanze"
                  (Felsen stoppen den Fisch sanft,
                   Pflanzen bremsen ihn nur ein bisschen)
     garnelen:    Liste von Garnelen { x, h }
     zone:        (nur bei der Abzweigung) Beschreibung der Wege
   }

   Die Funktion spielfeldBreite() kommt aus spiel.js und sagt uns,
   wie breit das Spielfeld gerade ist.
   ---------------------------------------------------------------- */
const MUSTER = {

    /* ---------- FREIES WASSER ----------
       Eine Verschnaufpause: keine Hindernisse, dafür eine schöne
       Schlangenlinie aus Garnelen zum Einsammeln. */
    freiesWasser(startH) {
        const laenge = zufall(70, 110);
        const rand = spielfeldBreite() / 2;
        const garnelen = [];
        const anzahl = zufallGanz(4, 6);
        const richtung = Math.random() < 0.5 ? 1 : -1;
        for (let i = 0; i < anzahl; i++) {
            garnelen.push({
                x: Math.sin(i * 0.9) * rand * 0.6 * richtung,   // Sinus-Kurve → schöne Welle
                h: startH + 15 + i * 11,
            });
        }
        return { laenge, hindernisse: [], garnelen };
    },

    /* ---------- FELSEN-SLALOM ----------
       Felsen abwechselnd links und rechts – der Fisch muss in
       Schlangenlinien nach oben schwimmen. */
    slalom(startH) {
        const anzahl = zufallGanz(3, 5);    // Wie viele Felsen
        const abstand = 32;                 // Höhen-Abstand zwischen den Felsen (in E)
        const rand = spielfeldBreite() / 2;
        const hindernisse = [];
        const garnelen = [];
        for (let i = 0; i < anzahl; i++) {
            const links = i % 2 === 0;      // Abwechselnd links / rechts
            const seite = links ? -1 : 1;
            hindernisse.push({
                x: seite * rand * zufall(0.35, 0.6),
                h: startH + 20 + i * abstand,
                r: zufall(6, 9),
                art: "fels",
            });
            // Belohnung: eine Garnele jeweils auf der freien Seite
            garnelen.push({
                x: -seite * rand * zufall(0.4, 0.65),
                h: startH + 20 + i * abstand,
            });
        }
        return { laenge: 20 + anzahl * abstand + 15, hindernisse, garnelen };
    },

    /* ---------- FELSEN-TOR ----------
       Eine Felswand quer über das Wasser mit einer Lücke, durch
       die man präzise hindurchschwimmen muss.
       Die Lücke ist bewusst groß genug für Kinderhände. */
    torbogen(startH) {
        const torH = startH + 30;
        const rand = spielfeldBreite() / 2;
        const lueckeX = zufall(-rand * 0.55, rand * 0.55);  // Wo ist die Lücke?
        const lueckeGroesse = 20;           // Wie breit ist die Lücke? (in E, fehlerverzeihend!)
        const hindernisse = [];

        // Wand von links bis zur Lücke und von der Lücke bis rechts bauen:
        for (let x = -rand + 4; x <= rand - 4; x += 9) {
            if (Math.abs(x - lueckeX) < lueckeGroesse / 2) continue;  // Lücke freilassen
            hindernisse.push({
                x: x,
                h: torH + zufall(-2.5, 2.5),
                r: 6,
                art: "fels",
            });
        }

        // Garnelen mitten in der Lücke zeigen den Weg – wie Wegweiser!
        const garnelen = [
            { x: lueckeX, h: torH - 14 },
            { x: lueckeX, h: torH },
            { x: lueckeX, h: torH + 14 },
        ];
        return { laenge: 70, hindernisse, garnelen };
    },

    /* ---------- PFLANZENWALD ----------
       Viele Wasserpflanzen versperren den Weg. Pflanzen sind
       weich: Sie bremsen den Fisch nur, statt ihn zu stoppen.
       Dazwischen ein paar Felsen und Garnelen in den Lücken. */
    pflanzenwald(startH) {
        const laenge = zufall(80, 120);
        const rand = spielfeldBreite() / 2;
        const hindernisse = [];
        const garnelen = [];

        // Pflanzen-Büschel verteilt über die ganze Breite:
        for (let h = startH + 15; h < startH + laenge - 10; h += zufall(12, 18)) {
            const x = zufall(-rand * 0.8, rand * 0.8);
            hindernisse.push({ x: x, h: h, r: 5.5, art: "pflanze" });
            // Manchmal wächst gleich daneben noch eine zweite Pflanze:
            if (Math.random() < 0.5) {
                hindernisse.push({ x: x + zufall(-10, 10), h: h + zufall(-4, 4), r: 5.5, art: "pflanze" });
            }
        }
        // Vereinzelte Felsen am Rand:
        for (let h = startH + 30; h < startH + laenge - 15; h += zufall(40, 60)) {
            const seite = Math.random() < 0.5 ? -1 : 1;
            hindernisse.push({ x: seite * rand * zufall(0.6, 0.8), h: h, r: 7, art: "fels" });
        }
        // Garnelen in der Mitte als Belohnung:
        for (let h = startH + 25; h < startH + laenge - 10; h += 26) {
            garnelen.push({ x: zufall(-rand * 0.4, rand * 0.4), h: h });
        }
        return { laenge, hindernisse, garnelen };
    },

    /* ---------- FELSENGARTEN ----------
       Verstreute Felsen, zwischen denen man sich den Weg suchen
       muss. Garnelen zeigen gute Schwimm-Wege. */
    felsengarten(startH) {
        const laenge = zufall(80, 120);
        const rand = spielfeldBreite() / 2;
        const hindernisse = [];
        const garnelen = [];

        for (let h = startH + 18; h < startH + laenge - 12; h += zufall(20, 30)) {
            // Pro "Reihe" 1–2 Felsen an zufälligen Stellen:
            const x1 = zufall(-rand * 0.75, rand * 0.75);
            hindernisse.push({ x: x1, h: h, r: zufall(6, 9), art: "fels" });
            if (Math.random() < 0.4) {
                // Der zweite Felsen kommt auf die andere Seite (Weg bleibt frei):
                hindernisse.push({ x: x1 > 0 ? zufall(-rand * 0.75, -8) : zufall(8, rand * 0.75),
                                   h: h + zufall(-5, 5), r: zufall(5, 8), art: "fels" });
            }
            // Eine Garnele in sicherem Abstand:
            garnelen.push({ x: x1 > 0 ? x1 - zufall(16, 22) : x1 + zufall(16, 22), h: h + 8 });
        }
        return { laenge, hindernisse, garnelen };
    },
};


/* ----------------------------------------------------------------
   DIE ABZWEIGUNG
   ----------------------------------------------------------------
   Felswände teilen das Wasser in 2 oder 3 Wege: links, geradeaus,
   rechts. Der Fisch muss sich entscheiden und wird dann seinen
   gewählten Weg entlangschwimmen – die anderen Wege ziehen unten
   vorbei und verschwinden.

   Einer der Wege kann ein HÖHLEN-EINGANG sein: Man erkennt ihn an
   den vielen Steinen und dem dunklen Loch. Wer hineinschwimmt,
   landet in einer dunklen Höhle (siehe HOEHLEN_MUSTER unten)!
   Die anderen Wege haben Garnelen oder Pflanzen.
   ---------------------------------------------------------------- */
function abzweigungBauen(startH) {
    const laenge = 85;
    const breite = spielfeldBreite();
    const rand = breite / 2;
    // Auf schmalen Handys 2 Wege, auf breiten Bildschirmen auch mal 3:
    const anzahlWege = breite > 52 ? zufallGanz(2, 3) : 2;
    const hindernisse = [];
    const garnelen = [];

    // Die Trennwände zwischen den Wegen (lange Felsreihen nach oben):
    for (let i = 1; i < anzahlWege; i++) {
        const wandX = -rand + (breite * i) / anzahlWege;
        for (let h = startH + 12; h < startH + laenge - 4; h += 8.5) {
            hindernisse.push({ x: wandX + zufall(-1.5, 1.5), h: h, r: 5.5, art: "fels" });
        }
    }

    // Die Wege beschreiben: Grenzen + was darin wartet.
    // Ein Weg wird (mit hoehle.chance) zum Höhlen-Eingang:
    const kanaele = [];
    const hoehlenWeg = Math.random() < KONFIG.hoehle.chance ? zufallGanz(0, anzahlWege - 1) : -1;
    for (let i = 0; i < anzahlWege; i++) {
        const von = -rand + (breite * i) / anzahlWege;
        const bis = -rand + (breite * (i + 1)) / anzahlWege;
        const mitte = (von + bis) / 2;
        let art;
        if (i === hoehlenWeg) {
            art = "hoehle";
            // Höhlen-Eingang: GANZ VIELE Steine drumherum, wie ein
            // richtiges Felsentor – so erkennt man ihn sofort.
            // (Die Steine bekommen immer das 🪨-Emoji, egal in welcher Welt.)
            const halb = (bis - von) / 2;
            for (let h = startH + 35; h < startH + laenge; h += 8) {
                hindernisse.push({ x: mitte - halb * 0.62, h: h + zufall(-2, 2), r: 5, art: "fels", emoji: "🪨" });
                hindernisse.push({ x: mitte + halb * 0.62, h: h + zufall(-2, 2), r: 5, art: "fels", emoji: "🪨" });
            }
            // Der Steinbogen ÜBER dem Eingang (mit Lücke in der Mitte,
            // durch die man hineinschwimmt):
            for (let dx = -halb * 0.62; dx <= halb * 0.62; dx += 7) {
                if (Math.abs(dx) < halb * 0.3) continue;   // Der Eingang bleibt frei
                hindernisse.push({ x: mitte + dx, h: startH + laenge - 4 + zufall(-1.5, 1.5), r: 4.5, art: "fels", emoji: "🪨" });
            }
        } else if (Math.random() < 0.6) {
            art = "garnelen";
            // Der Leckerbissen-Weg: eine Garnelen-Spur:
            for (let h = startH + 20; h < startH + laenge - 5; h += 16) {
                garnelen.push({ x: mitte + zufall(-3, 3), h: h });
            }
        } else {
            art = "pflanzen";
            // Der Pflanzen-Weg: bremst ein bisschen, tut aber nicht weh:
            for (let h = startH + 22; h < startH + laenge - 8; h += 18) {
                hindernisse.push({ x: mitte + zufall(-4, 4), h: h, r: 5.5, art: "pflanze" });
            }
        }
        kanaele.push({ von, bis, art });
    }

    // Die Zone merkt sich, wo die Abzweigung ist – spiel.js prüft dann,
    // welchen Weg der Fisch gewählt hat, wenn er oben herauskommt:
    const zone = { vonH: startH, bisH: startH + laenge, kanaele: kanaele, entschieden: false };
    return { laenge, hindernisse, garnelen, zone };
}


/* ----------------------------------------------------------------
   HÖHLEN-MUSTER
   ----------------------------------------------------------------
   In der Höhle ist alles anders: dunkel, enge steinige Gänge,
   kaum Pflanzen – und der Hai findet einen hier viel schneller!
   Alle Höhlen-Steine benutzen das 🪨-Emoji (Höhle ist Höhle,
   egal in welcher Welt).
   ---------------------------------------------------------------- */
const HOEHLEN_MUSTER = {

    /* ---------- STEINIGER GANG ----------
       Steinwände links und rechts, dazwischen versetzte Felsen.
       Eine Garnelen-Spur zeigt den Schlängel-Weg. */
    gang(startH) {
        const laenge = zufall(60, 90);
        const rand = spielfeldBreite() / 2;
        const hindernisse = [];
        const garnelen = [];

        // Die Höhlenwände links und rechts (schön dicht, damit es
        // richtig nach Fels aussieht):
        for (let h = startH; h < startH + laenge; h += 7) {
            hindernisse.push({ x: -rand + zufall(1, 4), h: h, r: 6, art: "fels", emoji: "🪨" });
            hindernisse.push({ x: rand - zufall(1, 4), h: h, r: 6, art: "fels", emoji: "🪨" });
        }
        // Versetzte Felsen in der Mitte (Slalom im Dunkeln!):
        for (let h = startH + 15; h < startH + laenge - 10; h += zufall(22, 30)) {
            const x = zufall(-rand * 0.5, rand * 0.5);
            hindernisse.push({ x: x, h: h, r: zufall(6, 8), art: "fels", emoji: "🪨" });
            // Die Garnele leuchtet den freien Weg aus:
            garnelen.push({ x: x > 0 ? x - zufall(15, 20) : x + zufall(15, 20), h: h });
        }
        return { laenge, hindernisse, garnelen };
    },

    /* ---------- ENGSTELLE ----------
       Eine Steinwand quer durch die Höhle mit schmaler Lücke –
       hier muss man genau zielen! */
    engstelle(startH) {
        const laenge = 55;
        const rand = spielfeldBreite() / 2;
        const torH = startH + 28;
        const lueckeX = zufall(-rand * 0.45, rand * 0.45);
        const hindernisse = [];

        for (let x = -rand + 3; x <= rand - 3; x += 8) {
            if (Math.abs(x - lueckeX) < 11) continue;    // Die Lücke freilassen
            hindernisse.push({ x: x, h: torH + zufall(-2, 2), r: 5.5, art: "fels", emoji: "🪨" });
        }
        // Garnelen als Wegweiser durch die Lücke:
        const garnelen = [
            { x: lueckeX, h: torH - 12 },
            { x: lueckeX, h: torH + 12 },
        ];
        return { laenge, hindernisse, garnelen };
    },

    /* ---------- STEINFELD ----------
       Überall Felsbrocken! Nur ein gewundener Pfad schlängelt sich
       hindurch – die Garnelen zeigen ihn. So sieht eine echte,
       steinige Höhle aus. */
    steinfeld(startH) {
        const laenge = zufall(70, 100);
        const rand = spielfeldBreite() / 2;
        const hindernisse = [];
        const garnelen = [];

        // Die Höhlenwände:
        for (let h = startH; h < startH + laenge; h += 7) {
            hindernisse.push({ x: -rand + zufall(1, 3), h: h, r: 6, art: "fels", emoji: "🪨" });
            hindernisse.push({ x: rand - zufall(1, 3), h: h, r: 6, art: "fels", emoji: "🪨" });
        }
        // Ein gewundener freier Pfad – rundherum liegen dicke Brocken:
        for (let h = startH + 12; h < startH + laenge - 8; h += zufall(11, 15)) {
            const pfadX = Math.sin(h * 0.05) * rand * 0.4;   // Der Schlängel-Weg
            for (let versuch = 0; versuch < 3; versuch++) {
                const x = zufall(-rand * 0.75, rand * 0.75);
                // Nur dort einen Stein hinlegen, wo der Pfad frei bleibt:
                if (Math.abs(x - pfadX) > 15) {
                    hindernisse.push({ x: x, h: h + zufall(-3, 3), r: zufall(4.5, 7), art: "fels", emoji: "🪨" });
                }
            }
            // Alle paar Reihen eine Garnele auf dem Pfad als Wegweiser:
            if (Math.random() < 0.6) garnelen.push({ x: pfadX, h: h + 5 });
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
