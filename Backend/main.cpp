#include "op.hpp"
#include <fstream>

int main(){
    GrandLine grandline = GrandLine::caricaDaFile("../Dataset/grandline.json");

    std::vector<EventoViaggio> viaggio;
    int correnteId = 0;
    int giornoTotale = 0;
    viaggio.push_back({giornoTotale, correnteId, ""});
/*
    for (int passo = 0; passo < 10; ++passo) {
        auto arcoScelto = grandline.prossimaIsola(correnteId);
        if (!arcoScelto) break; // Log Pose non punta più da nessuna parte

        int rischio = grandline.pericoloTragitto(correnteId, arcoScelto->isola_destinazione);
        giornoTotale += arcoScelto->giorni;      // ora è il valore VERO, non un placeholder
        correnteId = arcoScelto->isola_destinazione;

        std::string evento = (rischio >= 8) ? "Incontro con pattuglia Marina" : "";
        viaggio.push_back({giornoTotale, correnteId, evento});
    }
*/
    json out = grandline.esportaViaggioJson(viaggio,
        {"Rufy","Zoro","Sanji","Nami","Usopp","Jinbe","Franky","Nico Robin","Chopper","Brook"}, 85);

    std::ofstream file("../Dataset/viaggio.json");
    file << out.dump(2);

    return 0;
}