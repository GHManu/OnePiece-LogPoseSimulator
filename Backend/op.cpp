#include "op.hpp"

int GrandLine::pericoloTragitto(int daId, int aId) const {
    int base = 0;
    for (const auto& arco : adiacenze.at(daId)) {
        if (arco.isola_destinazione == aId) {
            base = arco.pericolo_base;
            break;
        }
    }

    int bonus = 0;
    for (const auto& isolaId : {daId, aId}) {
        for (const auto& r : isole.at(isolaId).reparti) {
            if (r.pattuglia_rotte && r.forza > bonus) {
                bonus = r.forza;
            }
        }
    }

    return base + bonus;
}

void GrandLine::aggiungiIsola(Isola i){
    //inserisco l'isola solo se non esiste già
    if( isole.find(i.id) != isole.end()) return;
    this->isole.insert({i.id, i});

    this->adiacenze[i.id] = std::vector<Arco>();

    return;
    
}

void GrandLine::aggiungiArco(int daId, int aId, int pericolo, float magnetismo,int giorni){

    if (isole.find(daId) == isole.end() || isole.find(aId) == isole.end()) {
        return; // Una o entrambe le isole non esistono
    }
    this->adiacenze[daId].push_back({aId, pericolo, magnetismo,giorni});

    return;
}


std::optional<Arco> GrandLine::prossimaIsola(int cur_id){
     //verifico che l'isola esista e abbia almeno un arco uscente
    auto it = adiacenze.find(cur_id);
    if (it == adiacenze.end() || it->second.empty()) {
        return std::nullopt; // nessuna isola raggiungibile
    }

    const Arco* migliore = &it->second[0];
    for (const auto& cur_arco : it->second) {
        if (cur_arco.magnetismo >= migliore->magnetismo) {
            migliore = &cur_arco;
        }
    }

    return *migliore; // copia dell'arco scelto
}

//JSON

// --- parsing di un singolo reparto dal json ---
static RepartoMarina repartoDaJson(const json& jr){
    RepartoMarina r;
    r.tipo = jr.at("tipo").get<TipoReparto>();
    r.nome_unita = jr.value("nome_unita", "");
    r.forza = jr.value("forza", 0);
    r.e_marina_ufficiale = jr.value("e_marina_ufficiale", true);
    r.pattuglia_rotte = jr.value("pattuglia_rotte", false);
    r.presenza_temporanea = jr.value("presenza_temporanea", false);
    r.presenza_ammiraglio = jr.value("presenza_ammiraglio", false);
    return r;
}

// --- parsing di una singola isola dal json ---
static Isola isolaDaJson(const json& ji){
    Isola i;
    i.id = ji.at("id").get<int>();
    i.nome = ji.at("nome").get<std::string>();
    i.x = ji.value("x", 0.0f);
    i.y = ji.value("y", 0.0f);
    i.tipo = ji.value("tipo", "");
    i.pericolo_base = ji.value("pericolo_base", 0);
    i.personaggio = ji.value("personaggio", "");
    if (ji.contains("reparti")) {
        for (const auto& jr : ji.at("reparti"))
            i.reparti.push_back(repartoDaJson(jr));
    }
    return i;
}

void GrandLine::caricaDaJson(const json& j){
    for (const auto& ji : j.at("isole")) {
        aggiungiIsola(isolaDaJson(ji));
    }
    for (const auto& ja : j.at("archi")) {
        int da = ja.at("da").get<int>();
        int a  = ja.at("a").get<int>();
        int giorni = ja.value("giorni", 1);

        // fallback finché il json non definisce esplicitamente questi due campi sugli archi
        int pericolo = ja.value("pericolo_base", 0);
        float magnetismo = ja.value("magnetismo", std::min(15.0f, 100.0f / giorni));

        aggiungiArco(da, a, pericolo, magnetismo, giorni);
    }
}

GrandLine GrandLine::caricaDaFile(const std::string& percorso){
    std::ifstream file(percorso);
    if (!file.is_open()) {
        throw std::runtime_error("Impossibile aprire il file: " + percorso);
    }
    json j;
    file >> j;

    GrandLine g;
    g.caricaDaJson(j);
    return g;
}

json GrandLine::esportaViaggioJson(const std::vector<EventoViaggio>& viaggio,
                                    const std::vector<std::string>& membriCiurma,
                                    int saluteCiurma) const {
    json j;

    // 1. Esporta le isole
    j["isole"] = json::array();
    for (const auto& [id, isola] : isole) {
        j["isole"].push_back({
            {"id", isola.id},
            {"nome", isola.nome},
            {"x", isola.x},
            {"y", isola.y},
            {"tipo", isola.tipo},
            {"pericolo_base", isola.pericolo_base},
            {"pericolo_effettivo", isola.pericoloEffettivo()},
            {"personaggio", isola.personaggio} // utile se usi isole del timeskip
        });
    }

    // 2. Esporta gli archi
    j["archi"] = json::array();
    for (const auto& [daId, listaArchi] : adiacenze) {
        for (const auto& arco : listaArchi) {
            j["archi"].push_back({
                {"da", daId},
                {"a", arco.isola_destinazione},
                {"giorni", arco.giorni},
                {"pericolo_base", arco.pericolo_base},
                {"magnetismo", arco.magnetismo}
            });
        }
    }

    // 3. Esporta il viaggio
    j["viaggio"] = json::array();
    for (const auto& ev : viaggio) {
        j["viaggio"].push_back({
            {"giorno", ev.giorno},
            {"isola_id", ev.isola_id},
            {"evento", ev.evento.empty() ? json(nullptr) : json(ev.evento)}
        });
    }

    // 4. Esporta la ciurma
    j["ciurma"] = { {"salute", saluteCiurma}, {"membri", membriCiurma} };

    return j;
}