# Simulatore Log Pose e mappa One Piece
Ho creato una simulazione personale del funzionamento del Log Pose usato in One Piece dalle ciurme per sapere la rotta per la prossima isola. Ho creato anche una sorta di mappa rappresentativa del mondo di One Piece e situato le isole e tutte le info in modo soggettivo, esplorabile.


# Struttura
Ho creato un backend in cpp e python: cpp per creare strutture dati e la logica di creazione dei file .json che userò nel frontend, python per creare un piccolo server locale; nel frontend abbiamo il sito quindi i file .html, .css e .js; il dataset composto da file .json.




# How To Compile
* Requirements: compilatore python e cpp
1. Dentro alla directory Backend: compila op.cpp,op.hpp,main.cpp,json.hpp,grandline.json: g++ -std=c++17 main.cpp op.cpp -o ../bin/simulatore
2. Lancia simulatore dentro alla directory  bin e si creerà viaggio.json
3. Lancia il server con: python3 ./Backend/local_server.py

> Per modificare la mappa, basta modificare lo script image_svg_generator.py e lanciarlo sempre con python3, così crea in automatico un nuovo file.svg

# How To Contribute
Fai un fork, clonalo in locale, modifica il codice, vai alla seziona sopra "How To Compile" per compilarlo e testarlo e infine apri una Pull Request. 