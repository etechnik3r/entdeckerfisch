/* ================================================================
   ENTDECKERFISCH – KONFIGURATION
   ================================================================
   In dieser Datei stehen ALLE Zahlen, die das Spielgefühl bestimmen.
   Du kannst hier gefahrlos Werte ändern, um das Spiel leichter,
   schwerer, schneller oder langsamer zu machen – ohne die eigentliche
   Spiel-Logik (spiel.js) anfassen zu müssen.

   WICHTIG – die Maßeinheit "E" (Einheit):
   Damit das Spiel auf jedem Handy gleich aussieht, rechnen wir nicht
   in Pixeln, sondern in "Einheiten". 1 E = 1 % der Bildschirmhöhe.
   Der Bildschirm ist also immer genau 100 E hoch – egal ob kleines
   oder großes Handy. Geschwindigkeiten sind in "E pro Sekunde".
   Beispiel: tempo = 30 heißt, der Fisch legt pro Sekunde eine Strecke
   von 30 % der Bildschirmhöhe zurück.
   ================================================================ */

const KONFIG = {

    /* ------------------------------------------------------------
       DER SPIELER-FISCH
       ------------------------------------------------------------ */
    fisch: {
        tempo: 26,             // Grund-Schwimmtempo nach vorn (E pro Sekunde)
        tempoHoch: 55,         // Wie schnell der Fisch nach oben/unten lenkt (E pro Sekunde)
        lenkWeichheit: 6,      // Wie "weich" der Fisch dem Finger folgt (größer = direkter, kleiner = träger)
        radiusStart: 3.2,      // Größe des Fisches am Anfang (Radius in E)
        radiusProWachstum: 0.7,// Um so viel wächst der Fisch pro Wachstums-Stufe (in E)
        maxWachstum: 4,        // Mehr als so viele Wachstums-Stufen gibt es nicht
        schonzeit: 2.0,        // Unverwundbar-Zeit in Sekunden nach einem Rempler (Fisch blinkt)
    },

    /* ------------------------------------------------------------
       GESCHWINDIGKEITS-BOOST (durch Garnelen)
       ------------------------------------------------------------ */
    boost: {
        faktor: 1.7,           // Multiplikator: 1.7 = 70 % schneller während des Boosts
        dauer: 2.2,            // Wie lange ein Boost anhält (Sekunden)
    },

    /* ------------------------------------------------------------
       GARNELEN (Sammelobjekte)
       ------------------------------------------------------------ */
    garnelen: {
        fuersWachstum: 8,      // Nach so vielen gefressenen Garnelen wächst der Fisch eine Stufe
        radius: 2.2,           // Größe einer Garnele (Radius in E)
        fangHilfe: 1.8,        // "Magnet"-Bonus: Um so viel E wird der Fang-Radius vergrößert
                               // (macht das Einsammeln für Kinder fehlerverzeihender)
    },

    /* ------------------------------------------------------------
       ANGREIFER-FISCHE (die Verfolger)
       ------------------------------------------------------------ */
    angreifer: {
        tempoFaktor: 1.10,     // Angreifer-Tempo im Verhältnis zum Fisch-Grundtempo
                               // (1.10 = etwas schneller als der Fisch OHNE Boost,
                               //  aber deutlich langsamer als MIT Boost!)
        radius: 3.6,           // Größe des Angreifers (Radius in E)
        spawnAbstand: 55,      // Neuer Angreifer frühestens alle X Sekunden …
        spawnZufall: 25,       // … plus zufällig 0 bis X Sekunden obendrauf
        fluchtAbstand: 65,     // Ist der Angreifer so weit (in E) abgehängt → er gibt auf
        maxVerfolgung: 22,     // Nach so vielen Sekunden gibt der Angreifer immer auf
        bremseInHindernis: 0.35,// Angreifer werden in Hindernissen stark gebremst (0.35 = nur 35 % Tempo).
                               // Deshalb lohnt es sich, durch enge Wege zu flüchten!
        erstesSpawnAb: 15,     // Sekunden Schonfrist am Levelanfang, bevor der erste Angreifer kommt
    },

    /* ------------------------------------------------------------
       BOOTE (fahren an der Oberfläche, werfen einen Schatten)
       ------------------------------------------------------------ */
    boote: {
        spawnAbstand: 18,      // Neues Boot frühestens alle X Sekunden …
        spawnZufall: 12,       // … plus zufällig 0 bis X Sekunden
        tempo: 34,             // Wie schnell das Boot (relativ zum Wasser) fährt (E pro Sekunde)
        breite: 26,            // Breite des Boots-Schattens (in E)
        gefahrTiefe: 13,       // Nur wenn der Fisch höher als diese Tiefe schwimmt (y < 13 E),
                               // kann ihn das Boot erwischen. Tiefer = sicher!
    },

    /* ------------------------------------------------------------
       LEVEL / WELTEN
       ------------------------------------------------------------ */
    level: {
        streckeProWelt: 1300,  // So viele E muss der Fisch schwimmen, bis das Ziel auftaucht
        zielRadius: 9,         // Größe des Ziel-Strudels (Radius in E)
        tempoPlusProRunde: 0.1,// Wenn alle Welten geschafft sind, geht es wieder von vorn los –
                               // aber pro Runde um 10 % schneller (0.1 = +10 %)
    },

    /* ------------------------------------------------------------
       STEUERUNG
       ------------------------------------------------------------ */
    steuerung: {
        // Der Fisch schwimmt immer zu der Stelle, an der der Finger liegt.
        // Zusätzlich kann man kurz oben/unten tippen, um auszuweichen:
        tippSprung: 18,        // Bei kurzem Tippen springt das Ziel um so viele E nach oben/unten
    },

    /* ------------------------------------------------------------
       OBERFLÄCHE & BODEN (Begrenzung des Schwimmbereichs)
       ------------------------------------------------------------ */
    wasser: {
        obenGrenze: 6,         // Näher als 6 E an die Oberfläche geht nicht (dort sind die Wellen)
        untenGrenze: 94,       // Tiefer als 94 E geht nicht (dort ist der Sandboden)
    },
};
