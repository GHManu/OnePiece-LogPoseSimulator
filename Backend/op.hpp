#ifndef MAIN_HPP
#define MAIN_HPP

#include<iostream>
#include<vector>
#include<map>
#include<unordered_map>
#include "json.hpp" //per leggere/scrivere json
#include <fstream>
#include <optional>
using json = nlohmann::json;


enum class TipoReparto {
    SedeCentrale,        // Marineford / Nuova Marineford - elite assoluta
    MareEsterno,         // basi nei 4 Blues (East/West/North/South)
    SWORD,               // unità segreta, agisce senza autorizzazione
    SSG,                 // divisione scientifica (Seraphim, Pacifisti)
    G5,                  // base di frontiera Nuovo Mondo, indisciplinati
    BusterCallFleet,      // flotta d'emergenza (5 Viceammiragli, temporanea)
    DivisioneGiant,       // reparto di giganti
    DivisioneScientifica, // ex Sentomaru, guardia Vegapunk/Pacifisti PX
    CipherPol,            // CP0-CP9, NON è Marina ma Governo Mondiale
    ImpelDown             // prigione, personale separato ma alleato
};


NLOHMANN_JSON_SERIALIZE_ENUM(TipoReparto, {
    {TipoReparto::SedeCentrale, "SedeCentrale"},
    {TipoReparto::MareEsterno, "MareEsterno"},
    {TipoReparto::SWORD, "SWORD"},
    {TipoReparto::SSG, "SSG"},
    {TipoReparto::G5, "G5"},
    {TipoReparto::BusterCallFleet, "BusterCallFleet"},
    {TipoReparto::DivisioneGiant, "DivisioneGiant"},
    {TipoReparto::DivisioneScientifica, "DivisioneScientifica"},
    {TipoReparto::CipherPol, "CipherPol"},
    {TipoReparto::ImpelDown, "ImpelDown"}
})

struct EventoViaggio {
    int giorno;
    int isola_id;
    std::string evento;   // stringa vuota = nessun evento quel giorno
};


struct RepartoMarina {
    TipoReparto tipo;
    std::string nome_unita;      // es. "G-5", "CP0", "Buster Call Squadra 3"
    int forza;                   // potenza effettiva del reparto
    bool e_marina_ufficiale;     // false per CipherPol/ImpelDown (Governo, non Marina)
    bool pattuglia_rotte;        // se true, il rischio si propaga anche agli archi collegati
    bool presenza_temporanea = false; // true per Buster Call (non è stanziale)
    bool presenza_ammiraglio = false;
};

struct Isola {
    int id;
    std::vector<RepartoMarina> reparti;  
    std::string nome;
    float x, y;          // per disegnare dopo
    std::string tipo;    // stagione,...
    bool visitata = false;
    int pericolo_base;  //mostri marini, meteo, criminalità locale...
    std::string personaggio; // vuoto = isola "principale", non vuoto = isola del timeskip
    int pericoloEffettivo() const {
        int forza_tot = 0;
        for(auto& reparto : reparti){
            forza_tot += reparto.forza; 
             if(reparto.presenza_ammiraglio)
                forza_tot += 10;
        }
        return forza_tot + pericolo_base;
    } 
   
};

struct Arco {
    int isola_destinazione;
    int pericolo_base = 0;
    float magnetismo = std::min(giorni,100/giorni);     // "forza" del Log Pose verso questa isola, mi permette di scegliere l'isola
    int giorni;
};

//grafo principale
class GrandLine {   
    std::unordered_map<int, Isola> isole;
    std::unordered_map<int, std::vector<Arco>> adiacenze;
public:
    void aggiungiIsola(Isola i);
    void aggiungiArco(int daId, int aId, int pericolo,float magnetismo, int giorni);
    std::optional<Arco> prossimaIsola(int correnteId); // Log Pose logic
    int pericoloTragitto(int daId, int aId) const;

    //per json
    void caricaDaJson(const json& j);
    static GrandLine caricaDaFile(const std::string& percorso);
    json esportaViaggioJson(const std::vector<EventoViaggio>& viaggio,
                             const std::vector<std::string>& membriCiurma,
                             int saluteCiurma) const;

    const Isola& getIsola(int id) const { return isole.at(id); }
};

#endif