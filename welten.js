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
   EMOJI-VARIANTEN – mehr Abwechslung bei Steinen & Pflanzen!
   ----------------------------------------------------------------
   Jede Welt legt in "emojis" nur EIN Haupt-Bild für Felsen und
   Pflanzen fest. Damit die Welt nicht wie eine Tapete aussieht,
   bekommt jedes Hindernis beim Bauen zufällig eine VARIANTE aus
   dieser Tabelle. Das Haupt-Bild steht mehrfach in der Liste,
   damit es am häufigsten drankommt – die anderen sind die
   Farbtupfer dazwischen.
   ---------------------------------------------------------------- */
const EMOJI_VARIANTEN = {
    fels: {
        "🪸": ["🪸", "🪸", "🪨", "🐚"],      // Korallen-Welten: dazwischen Steine & Muscheln
        "🪨": ["🪨", "🪨", "🪨", "🗿", "🐚"], // Stein-Welten: mal ein Findling, mal eine Muschel
        "🧊": ["🧊", "🧊", "🧊", "🪨"],       // Eis-Welten: ab und zu ein dunkler Fels im Eis
        "⚓": ["⚓", "🪨", "🪨", "🛟"],       // Piraten-Bucht: Anker, Steine, alter Rettungsring
        "🏛️": ["🏛️", "🏛️", "🏺", "🪨"],     // Versunkene Stadt: Säulen, Amphoren, Trümmer
        "💎": ["💎", "💎", "🔮", "🪨"],       // Glitzer-Welten: Kristalle zwischen Felsen
        "🪵": ["🪵", "🪵", "🪨", "🪵"],       // Fluss-Welten: Treibholz und runde Kiesel
        "🐚": ["🐚", "🐚", "🪨", "🦪"],       // Muschel-Welten: Muscheln, Austern, Steine
    },
    pflanze: {
        "🌿": ["🌿", "🌿", "🌱", "☘️"],       // Seegras in mehreren Grüntönen
        "🪼": ["🪼", "🪼", "🪼", "🌿"],       // Quallen-Wälder mit etwas Seegras
        "🌺": ["🌺", "🌺", "🌸", "🪷"],       // Blüten-Welten: Hibiskus, Kirschblüte, Lotus
        "🌱": ["🌱", "🌱", "🌿", "☘️"],       // Junges Grün am Fluss- und Teichboden
    },
};

// Sucht für ein Hindernis das passende Bild aus: das Haupt-Emoji der
// Welt plus zufällige Varianten aus der Tabelle oben.
function hindernisEmoji(welt, art) {
    const haupt = welt.emojis[art];
    const varianten = EMOJI_VARIANTEN[art] && EMOJI_VARIANTEN[art][haupt];
    return varianten ? zufallAus(varianten) : haupt;
}


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
        const lueckeGroesse = 26;           // Wie breit ist die Lücke? (in E – schön
                                            // fehlerverzeihend, auch für den GROSSEN Fisch!)
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
   Das Spielfeld wird in drei Spuren gedacht: LINKS, GERADEAUS,
   RECHTS. Bei jeder Abzweigung ist eine andere Kombination davon
   offen – mal alle drei Gänge, mal nur zwei. WICHTIG: Es sind
   immer MINDESTENS ZWEI Wege offen, denn eine Abzweigung soll eine
   echte ENTSCHEIDUNG sein: links, geradeaus oder rechts? Über den
   Gängen schweben Wegweiser-Symbole (zeichnet spiel.js), die schon
   von Weitem zeigen, was einen wo erwartet – Garnelen-Weg 🦐,
   Pflanzen-Weg 🌿 oder Höhlen-Eingang 🕳️. Gesperrte Spuren sind
   mit Felsen zugebaut (unten trichterförmig, damit der Fisch sanft
   in einen offenen Gang geleitet wird).

   Sobald sich der Fisch für einen Gang entschieden hat, schwimmen
   die ANDEREN Wege zur Seite davon und verschwinden (das macht
   spiel.js – dafür bekommt hier jedes Teil eine "kanal"-Nummer).

   Einer der Wege kann ein HÖHLEN-EINGANG sein: Man erkennt ihn am
   dunklen Loch mit dem Steinrand. Wer hineinschwimmt, landet in
   einer dunklen Höhle (siehe HOEHLEN_MUSTER unten)!

   erzwingeHoehle = true baut die PFLICHT-HÖHLEN-Abzweigung: Dann
   führen ALLE offenen Wege in die Höhle (man sucht sich nur den
   Eingang aus) – so hat garantiert jede Welt ihre Höhle.

   Der Eingang selbst ist IMMER komplett frei: keine Steinreihe
   quer darüber, die Rand-Steine sitzen ganz außen an den Spur-
   Kanten. Eine zugebaute Höhle kann es so nicht mehr geben.
   ---------------------------------------------------------------- */
let zonenNummer = 0;   // Fortlaufende Nummer, damit spiel.js die Teile einer Abzweigung wiederfindet

function abzweigungBauen(startH, erzwingeHoehle = false) {
    const laenge = 95;
    const breite = spielfeldBreite();
    const rand = breite / 2;
    const spurBreite = breite / 3;
    const schmal = breite <= 52;

    // Welche Spuren sind diesmal offen? (0 = links, 1 = geradeaus, 2 = rechts)
    // Auf schmalen Handys nie alle drei gleichzeitig – das wäre zu eng.
    // Immer mindestens ZWEI offene Wege: Abzweigen heißt entscheiden!
    const komboListe = schmal
        ? [[0, 2], [0, 2], [0, 1], [1, 2]]
        : [[0, 1, 2], [0, 1, 2], [0, 1, 2], [0, 2], [0, 1], [1, 2]];
    const offen = zufallAus(komboListe);

    const zonenId = ++zonenNummer;
    const hindernisse = [];
    const garnelen = [];
    const kanaele = [];

    // Einer der offenen Wege wird (mit hoehle.chance) zum Höhlen-Eingang.
    // Bei der Pflicht-Höhle führen ALLE offenen Wege hinein:
    const hoehlenWeg = Math.random() < KONFIG.hoehle.chance
        ? offen[zufallGanz(0, offen.length - 1)] : -1;

    for (const spur of offen) {
        const von = -rand + spur * spurBreite;
        const bis = von + spurBreite;
        const mitte = (von + bis) / 2;
        let art;

        if (erzwingeHoehle || spur === hoehlenWeg) {
            art = "hoehle";
            // Der Höhlen-Eingang: kleine Steine säumen den Weg – aber nur
            // GANZ AUSSEN an den Spur-Kanten, die Mitte bleibt vollständig
            // frei. Und über dem dunklen Loch liegt KEINE Steinreihe mehr:
            // Der Eingang kann nie wieder zugebaut sein!
            // (Die Steine bekommen immer das 🪨-Emoji, egal in welcher Welt.)
            if (spurBreite >= 18) {
                for (let h = startH + 35; h < startH + laenge - 8; h += 9) {
                    hindernisse.push({ x: von + 0.5, h: h + zufall(-2, 2), r: 3,
                                       art: "fels", emoji: "🪨", zonenId, kanal: spur });
                    hindernisse.push({ x: bis - 0.5, h: h + zufall(-2, 2), r: 3,
                                       art: "fels", emoji: "🪨", zonenId, kanal: spur });
                }
            }
        } else if (Math.random() < 0.6) {
            art = "garnelen";
            // Der Leckerbissen-Weg: eine Garnelen-Spur:
            for (let h = startH + 20; h < startH + laenge - 5; h += 16) {
                garnelen.push({ x: mitte + zufall(-3, 3), h: h, zonenId, kanal: spur });
            }
        } else {
            art = "pflanzen";
            // Der Pflanzen-Weg: bremst ein bisschen, tut aber nicht weh:
            for (let h = startH + 22; h < startH + laenge - 8; h += 18) {
                hindernisse.push({ x: mitte + zufall(-4, 4), h: h, r: 5.5,
                                   art: "pflanze", zonenId, kanal: spur });
            }
        }
        kanaele.push({ von, bis, art, kanal: spur });
    }

    // Trennwände zwischen zwei NEBENEINANDERLIEGENDEN offenen Gängen
    // (sie gehören zu beiden Nachbarn – deshalb merken sie sich beide).
    // Die Wand-Steine sind bewusst schlank (r = 4) und wackeln kaum zur
    // Seite, damit in jedem Gang genug Platz für den GROSSEN Fisch bleibt:
    for (let i = 0; i < 2; i++) {
        if (!offen.includes(i) || !offen.includes(i + 1)) continue;
        const wandX = -rand + (i + 1) * spurBreite;
        for (let h = startH + 14; h < startH + laenge - 4; h += 8.5) {
            hindernisse.push({ x: wandX + zufall(-0.8, 0.8), h: h, r: 4,
                               art: "fels", zonenId, kanal: -2, nachbarn: [i, i + 1] });
        }
    }

    // Gesperrte Spuren mit Felsen zubauen. Die unterste Reihe ist wie
    // ein Dach geformt (in der Mitte hoch, außen tief) – so RUTSCHT der
    // Fisch von selbst zur Seite in einen offenen Gang, statt hängen
    // zu bleiben:
    for (let spur = 0; spur < 3; spur++) {
        if (offen.includes(spur)) continue;
        const von = -rand + spur * spurBreite;
        const bis = von + spurBreite;
        const mitteSperre = (von + bis) / 2;
        const halb = spurBreite / 2;
        for (let x = von + 3; x <= bis - 3; x += 7) {
            const dach = (1 - Math.abs(x - mitteSperre) / halb) * 12;
            hindernisse.push({ x: x, h: startH + 14 + dach, r: 5.5,
                               art: "fels", zonenId, kanal: -1 });
        }
        // Darüber wird die Spur locker aufgefüllt, damit niemand
        // hineinschwimmen kann:
        for (let h = startH + 38; h < startH + laenge - 6; h += 11) {
            for (let x = von + 4; x <= bis - 3; x += 9) {
                hindernisse.push({ x: x + zufall(-1.5, 1.5), h: h + zufall(-2, 2), r: 5,
                                   art: "fels", zonenId, kanal: -1 });
            }
        }
    }

    // Die Zone merkt sich, wo die Abzweigung ist – spiel.js prüft dann,
    // welchen Weg der Fisch gewählt hat. "hinweisGezeigt" steuert die
    // einmalige "Wähle deinen Weg!"-Ankündigung beim Heranschwimmen:
    const zone = { id: zonenId, vonH: startH, bisH: startH + laenge,
                   kanaele: kanaele, entschieden: false, gewaehlt: -1,
                   hinweisGezeigt: false };
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
            if (Math.abs(x - lueckeX) < 13) continue;    // Die Lücke freilassen
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
