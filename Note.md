# Note
## Struttura
### Grafo
grafo principale diretto, pesato, sparso, semplice, con etichette su nodi e archi, ed embedding geometrico esplicito.

* Ciclico: archi come 9→10 e ritorni 10→9, oppure l'hub Sabaody (10) che va e torna dalle 9 isole del timeskip. Un cammino può tornare su un nodo già visitato.

* Sparso:Un grafo è "denso" quando il numero di archi si avvicina a n² (quasi ogni nodo collegato a quasi ogni altro); avendo:
circa 30 nodi (isole)
circa 50 archi
Con 30 nodi, un grafo denso avrebbe centinaia di archi (30×29 circa 870 nel caso diretto completo).Ho una minima parte - ogni isola è connessa solo a 1-3 vicine, non a tutte. Questo è sparso: il Log Pose non ti fa scegliere tra 20 isole, solo tra quelle raggiungibili dal punto in cui sei.
se fosse denso useresti una matrice di adiacenza, se fosse undirected dovresti gestire la simmetria degli archi da qualche parte, invece qua posso usare una lista di adiacenza.

* Diretto: ho {"da": 4, "a": 5, "giorni": 2} E separatamente {"da": 5, "a": 4, "giorni": 1} - due archi distinti con pesi diversi (2 giorni andata, 1 giorno ritorno). Se fosse undirected, un solo arco basterebbe e rappresenterebbe automaticamente entrambe le direzioni con lo stesso peso. Il fatto che tu debba scrivere esplicitamente sia da:4,a:5 che da:5,a:4 con pesi indipendenti è la prova che il grafo è diretto - semplicemente capita che molte coppie di nodi abbiano archi in entrambe le direzioni (ma non è obbligatorio, es. magari alcune rotte sono a senso unico).

* Semplice: un multigrafo (non-simple) avrebbe più archi paralleli nella stessa direzione tra la stessa coppia di nodi (es. due modi diversi di andare da Jaya a Skypiea, entrambi rappresentati come archi separati 4->5). Nel JSON attuale non c'è questo caso: ogni coppia ordinata (da, a) appare una sola volta. È simple, a meno che in futuro tu voglia aggiungere ad esempio due rotte alternative tra le stesse isole (una sicura più lunga, una pericolosa più corta) - lì sì diventerebbe un multigrafo.

* Weighted: giorni, pericolo, magnetismo come pesi sugli archi.

* Embedded:  x, y per ogni isola: il grafo ha un'immersione geometrica nel piano, non è solo topologia astratta.

* Explicit: rappresento gli archi esplicitamente in adiacenze (adjacency list), non li calcoli implicitamente da una regola.

* Labeled: sia nodi (nome, tipo, pericolo) che archi (giorni, magnetismo) portano etichette/attributi oltre alla pura connettività.