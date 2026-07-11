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

   DER FISCH SCHWIMMT NACH OBEN! Die Höhe "h" zählt, wie weit der
   Fisch schon aufgestiegen ist: h = 0 ist der Start am Meeresboden,
   h = streckeProWelt ist die Wasseroberfläche – das Ziel!
   Links/rechts wird mit "x" gemessen: x = 0 ist die Mitte des
   Spielfelds, negative Zahlen sind links, positive rechts.
   ================================================================ */

const KONFIG = {

    /* ------------------------------------------------------------
       DER SPIELER-FISCH
       ------------------------------------------------------------ */
    fisch: {
        tempo: 26,             // Grund-Schwimmtempo nach OBEN (E pro Sekunde)
        tempoSeite: 55,        // Wie schnell der Fisch nach links/rechts lenkt (E pro Sekunde)
        lenkWeichheit: 6,      // Wie "weich" der Fisch dem Finger folgt (größer = direkter, kleiner = träger)
        radiusStart: 3.2,      // Größe des Fisches am Anfang (Radius in E)
        radiusProWachstum: 0.7,// Um so viel wächst der Fisch pro Wachstums-Stufe (in E)
        maxWachstum: 4,        // Mehr als so viele Wachstums-Stufen gibt es nicht
        schonzeit: 2.0,        // Unverwundbar-Zeit in Sekunden nach einem Rempler (Fisch blinkt)
        hitboxMax: 4.2,        // Für Zusammenstöße zählt höchstens dieser Radius (in E) –
                               // auch ein groß gewachsener Fisch passt so noch durch jede
                               // Lücke. Das Wachsen bleibt reine Belohnung, keine Strafe!
    },

    /* ------------------------------------------------------------
       ANTI-HÄNGER-HILFE (damit niemand feststeckt!)
       ------------------------------------------------------------
       Kommt der Fisch eine Weile nicht voran (z. B. weil er unter
       einer Felswand hängt), hilft ihm das Spiel: Er schlängelt
       sich zur nächsten freien Lücke durch. */
    hilfe: {
        festNach: 2.2,         // Nach so vielen Sekunden ohne Fortschritt greift die Hilfe
        schlaengelDauer: 2.0,  // So lange (Sekunden) macht sich der Fisch "ganz schmal"
                               // und schlängelt sich durch enge Stellen
    },

    /* ------------------------------------------------------------
       GESCHWINDIGKEITS-BOOST (durch Garnelen)
       ------------------------------------------------------------ */
    boost: {
        faktor: 1.7,           // Multiplikator: 1.7 = 70 % schneller während des Boosts
        dauer: 2.2,            // Wie lange ein Boost anhält (Sekunden)
    },

    /* ------------------------------------------------------------
       PFLANZEN (weiche Hindernisse)
       ------------------------------------------------------------ */
    pflanzen: {
        bremsFaktor: 0.55,     // Im Pflanzen-Dickicht schwimmt der Fisch nur so schnell (0.55 = 55 % Tempo)
        nachwirkung: 0.25,     // So viele Sekunden wirkt die Bremse nach dem Durchschwimmen noch nach
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
       DER HAI (der Angreifer – kommt von unten!)
       ------------------------------------------------------------ */
    angreifer: {
        tempoFaktor: 1.12,     // Hai-Tempo im Verhältnis zum Fisch-Grundtempo
                               // (1.12 = spürbar schneller als der Fisch OHNE Boost –
                               //  er bleibt an einem DRAN, bis man ihn mit Boost abhängt!)
        aufholFaktor: 3.0,     // Ist der Hai noch WEIT weg, schwimmt er bis zu so viel
                               // schneller heran – er soll ja wirklich auftauchen und
                               // jagen, nicht nur eine Warn-Meldung bleiben!
        aufholAb: 30,          // Ab so viel E Abstand beginnt das Aufhol-Tempo
        bissAbstand: 14,       // Ist der Hai so nah (in E), macht er einen Schnapp-Spurt …
        spurtFaktor: 1.3,      // … und ist dabei kurz um so viel schneller. Vorsicht!
        radius: 7.0,           // Größe des Hais (Radius in E) – schön groß und breit, damit man ihn richtig sieht!
        startAbstand: 55,      // So weit unter dem Fisch taucht der Hai auf (in E)
        fluchtTempoMin: 0.6,   // Wenn der Hai aufgibt, entfernt er sich LANGSAM wieder:
        fluchtTempoMax: 0.9,   // sein Abtauch-Tempo liegt zufällig zwischen diesen Faktoren
        spawnAbstand: 8,       // Neuer Hai frühestens alle X Sekunden …
        spawnZufall: 6,        // … plus zufällig 0 bis X Sekunden obendrauf
        fluchtAbstand: 70,     // Ist der Hai so weit (in E) abgehängt → er gibt auf
        maxVerfolgung: 30,     // Nach so vielen Sekunden gibt der Hai auf – aber NICHT,
                               // solange er ganz dicht dran ist (echte Verfolgungsjagd!)
        bremseInHindernis: 0.35,// Der Hai wird in Hindernissen stark gebremst (0.35 = nur 35 % Tempo).
                               // Deshalb lohnt es sich, durch enge Wege zu flüchten!
        erstesSpawnAb: 8,      // Sekunden Schonfrist am Levelanfang, bevor der erste Hai kommt
        hoehleSpawnAb: 3,      // In HÖHLEN kommt der Hai viel schneller: schon nach so vielen Sekunden!

        // KEIN "Hai abgehängt!" mehr, ohne den Hai je gesehen zu haben:
        // Der Hai muss erst RICHTIG nah herangeschwommen sein (nahAbstand)
        // und dort eine Weile gejagt haben (minNahZeit), bevor er sich
        // überhaupt abhängen lässt. Vorher bleibt er hartnäckig dran!
        nahAbstand: 26,        // So nah (in E) muss der Hai erst einmal herankommen …
        minNahZeit: 3.0,       // … und so viele Sekunden nah dranbleiben – erst DANACH
                               // kann man ihn durch Boosts & kluge Wegwahl abhängen.
        notAufgabe: 45,        // Sicherheitsnetz: Findet der Hai ewig nicht zum Fisch
                               // (z. B. hinter Felsen verkeilt), zieht er nach so vielen
                               // Sekunden LEISE ab – ganz ohne "Abgehängt!"-Meldung.
        minProWelt: 2,         // MINDESTENS so viele Haie greifen pro Welt an. Hat es
                               // bis zur Level-Mitte nicht geklappt, kommt sofort einer!
    },

    /* ------------------------------------------------------------
       HÖHLEN (erreichbar über Abzweigungen)
       ------------------------------------------------------------ */
    hoehle: {
        minLaenge: 260,        // Eine Höhle ist mindestens so lang (in E) …
        maxLaenge: 420,        // … und höchstens so lang (schön ausgedehnte Höhlen-Abschnitte!)
        chance: 0.7,           // Wahrscheinlichkeit, dass eine Abzweigung einen Höhlen-Eingang hat (0.7 = 70 %)
        dunkelheit: 0.85,      // Wie dunkel es in der Höhle wird (0 = gar nicht, 1 = stockfinster)
        pflichtAb: 0.55,       // GARANTIE: Hat der Fisch bis zu diesem Anteil der Strecke
                               // (0.55 = 55 %) noch keine Höhle betreten, führt die nächste
                               // Abzweigung ganz sicher hinein – JEDE Welt hat mindestens
                               // eine Höhle!
    },

    /* ------------------------------------------------------------
       LEVEL / WELTEN
       ------------------------------------------------------------ */
    level: {
        streckeProWelt: 2000,  // So viele E muss der Fisch nach OBEN schwimmen bis zur
                               // Wasseroberfläche (doppelt so lang wie früher – jede Welt
                               // ist jetzt eine richtige kleine Reise!)
        abzweigungAbstand: 200,// Frühestens alle so viele E kommt eine Abzweigung …
        abzweigungZufall: 100, // … plus zufällig 0 bis so viele E
        freieZielgerade: 90,   // Die letzten E vor der Oberfläche bleiben frei (Zielgerade ohne Hindernisse)
        tempoPlusProRunde: 0.1,// Wenn alle Welten geschafft sind, geht es wieder von vorn los –
                               // aber pro Runde um 10 % schneller (0.1 = +10 %)
        mindestLuecke: 8,      // DURCHKOMM-GARANTIE: In jedem Streckenabschnitt bleibt
                               // immer eine freie Lücke von mindestens so vielen E –
                               // Steine können also NIE einen Weg komplett zubauen und
                               // auch ein groß gewachsener Fisch klemmt nirgends fest.
    },

    /* ------------------------------------------------------------
       STEUERUNG
       ------------------------------------------------------------ */
    steuerung: {
        // Der Fisch schwimmt immer zu der Stelle, an der der Finger liegt.
        // Zusätzlich kann man kurz links/rechts tippen, um auszuweichen:
        tippSprung: 14,        // Bei kurzem Tippen springt das Ziel um so viele E zur Seite
    },

    /* ------------------------------------------------------------
       DAS SPIELFELD (Begrenzung links und rechts)
       ------------------------------------------------------------ */
    spielfeld: {
        maxBreite: 60,         // Breiter als so viele E wird das Spielfeld nie
                               // (sonst wäre es auf großen Bildschirmen zu weitläufig)
        randAbstand: 1.5,      // So nah (in E) darf der Fisch an den Rand heran

        // DIE WELT IST BREITER ALS DER BILDSCHIRM! Die echte Spielfläche
        // ragt links und rechts über den Bildschirmrand hinaus. Schwimmt
        // der Fisch zur Seite, GLEITET die ganze Welt sanft mit hinüber –
        // das gibt richtig Weite und Tiefe:
        ueberBreite: 1.12,     // Spielfeld = Bildschirmbreite × 1.12 (12 % mehr Welt)
        kameraWeichheit: 3,    // Wie weich die Kamera zur Seite gleitet (größer = direkter)
    },

    /* ------------------------------------------------------------
       HINTERGRUND-BLASEN (Parallax-Tiefeneffekt)
       ------------------------------------------------------------
       Dezente Luftblasen in verschiedenen Tiefen-Ebenen. Nahe Blasen
       ziehen schnell vorbei, ferne nur langsam – wie die Sterne in
       einem Weltraumspiel. So spürt man Tiefe UND Geschwindigkeit! */
    hintergrundBlasen: {
        anzahl: 26,            // So viele Blasen schweben gleichzeitig im Hintergrund
        tiefeMin: 0.25,        // 0.25 = ganz weit hinten (zieht kaum mit) …
        tiefeMax: 0.9,         // … 0.9 = fast vorne (zieht fast so schnell wie die Welt)
        steigMin: 1.5,         // Eigenes Aufstiegs-Tempo der Blasen (E pro Sekunde) …
        steigMax: 4,           // … zufällig zwischen diesen Werten
    },
};
