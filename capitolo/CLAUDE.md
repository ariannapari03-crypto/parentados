# Capitolo — contesto e invarianti

Raccoglitore di regole e scadenze della tesi dagli atenei italiani, e pagine pubbliche generate da quei dati.
Non è ancora l'app per gli studenti: non costruire funzioni per studenti o relatori senza che siano richieste esplicitamente.

## Cosa fa questo sistema

1. Scopre i corsi di laurea di un ateneo e le pagine dove stanno le regole della prova finale.
2. Scarica quelle pagine **e i loro allegati**, conservando il contenuto grezzo.
3. Estrae, con un modello, regole e scadenze come **proposte**.
4. Fa confermare le proposte a una persona.
5. Pubblica solo ciò che è stato confermato.

---

## Invarianti — non negoziabili

### 1. Mai inventare una data
Una data entra nel database solo se è **scritta** in un documento scaricato, oppure ricavabile da un intervallo esplicito nel regolamento («circa un mese prima» → −30 giorni).
Non dedurre da altri anni accademici. Non dedurre da altri corsi. Non stimare.
Se una scadenza esiste ma la data non è pubblicata, va salvata con `data_da = null` e resa visibile come lacuna.

> Una data sbagliata fa perdere una sessione di laurea a una persona reale. Una data mancante fa solo alzare il telefono.

### 2. Ogni affermazione porta la sua fonte
`fonte_url` e `fonte_citazione` — la frase esatta — sono obbligatorie su ogni scadenza e ogni regola.
Se un'estrazione non riesce a produrle, l'estrazione è fallita, non parzialmente riuscita.

### 3. Le date sono per dipartimento, le regole sono per corso
Verificato su UniBo e UniTO. I calendari si ripetono identici fra i corsi dello stesso dipartimento; lunghezza, formato e criteri di voto cambiano da corso a corso.
Non collassare le due cose in una tabella sola.

### 4. Niente esce pubblico senza `stato = 'confermata'`
`proposta` è il valore predefinito di ogni estrazione. Solo una persona può passare a `confermata`.
Le query delle pagine pubbliche filtrano sempre su `confermata`. Nessuna eccezione, nemmeno in sviluppo.

### 5. Segui gli allegati
Molte pagine non contengono le date: rimandano a un PDF nel riquadro laterale.
Se la pagina rimanda a un documento, scaricalo ed estrai anche da lì. Traccia la catena: pagina → allegato → dato.

### 6. Conserva il grezzo, calcola l'hash
Ogni documento scaricato si conserva integralmente con l'hash del contenuto.
Serve a due cose: ri-estrarre senza ri-scaricare quando i prompt migliorano, e accorgersi quando un ateneo cambia una pagina.

### 7. Ritaglia prima di chiamare il modello
Il contenuto utile di queste pagine è spesso sotto il 5%: il resto è navigazione ripetuta.
Ritagliare non è ottimizzazione prematura, è la differenza fra pochi euro e qualche centinaio per ateneo.

### 8. La chiave API non entra mai nel repository
Solo variabili d'ambiente. Nessuna chiamata al modello dal browser.

### 9. I consigli restano consigli
Se il regolamento dice «lunghezza orientativa 50 pagine», non diventa un controllo che blocca. Va salvato con `vincolante = false` e mostrato come indicazione.
Il giorno in cui il sistema blocca qualcosa per una regola che l'ateneo chiamava orientativa, ha perso l'utente.

---

## Convenzioni

- **Codice, nomi di tabella e commenti in italiano.** Il dominio è italiano e i termini non hanno traduzione utile: *benestare*, *seduta*, *laureando*, *fuori corso*. Tradurli genera confusione.
- **I prompt stanno in `lib/estrattore.ts`, versionati.** Ogni estrazione registra quale versione del prompt ha usato: senza, non si può confrontare la qualità nel tempo.
- **Test su pagine reali salvate in `test/fixtures/`.** Non chiamare i siti degli atenei durante i test.
- **Le migrazioni non si modificano dopo essere state applicate.** Se ne aggiunge una nuova.

## Casi di prova canonici

Coprono i tre comportamenti che abbiamo osservato:

| Caso | Comportamento | Cosa deve succedere |
|---|---|---|
| UniBo · Scienze storiche e orientalistiche (LM) | tabelle di scadenze complete nell'HTML | 30 date estratte su due anni accademici |
| UniBo · Politica, amministrazione e organizzazione (LM) | **nessuna data nell'HTML**, calendario in PDF allegato | il PDF viene seguito e le date estratte da lì |
| UniTO · Lingue | calendario di dipartimento, HTML molto rumoroso | ritaglio sotto il 15%, nessuna tabella persa |

---

## Ciò che è fuori perimetro

Finché non richiesto esplicitamente: account e autenticazione degli studenti, lato relatore, bacheca degli argomenti, conversazioni, pagamenti, calcolo del voto per il singolo studente.

Se una richiesta sembra portare lì, chiedi conferma prima di scrivere codice.

---

## Contesto utile

Il progetto nasce da una constatazione verificata su tre atenei: **le regole della tesi non stanno nel regolamento d'ateneo**, ma nella pagina di ogni singolo corso, e variano molto. La magistrale Bocconi chiede circa 18.000 parole; Scienze storiche a Bologna ne chiede l'equivalente di circa 50.000. Uno studente che chiede a un amico di un altro corso riceve una risposta sbagliata di un fattore tre.

Il valore del sistema è mettere insieme, per corso, informazioni che oggi stanno su tre pagine diverse e che nessuno raccoglie.

---

## Stato di avanzamento (i sette compiti del brief)

- [x] **① Impalcatura e schema** — `npm run db:push` crea le tabelle; il test di lettura/scrittura passa.
- [ ] ② Scarica con allegati
- [ ] ③ Ritaglio
- [ ] ④ Estrazione
- [ ] ⑤ Revisione
- [ ] ⑥ Pagine pubbliche
- [ ] ⑦ Ricognizione

Un compito per sessione. Non passare al successivo senza il criterio di completamento del precedente.
