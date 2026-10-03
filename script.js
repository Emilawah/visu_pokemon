// ---------- Paramètres ----------
const TAILLE = 650;                 // viewBox carré
const CENTRE = TAILLE / 2;
const RAYON = 225;
const NB_GRADUATIONS = 5

// 18 types (ordre fixe autour de l'araignée) + couleur (variable visuelle : teinte = type)
const TYPES = [
  ["Normal", "#a8a77a"], ["Feu", "#ee8130"], ["Eau", "#6390f0"], ["Électrik", "#f7d02c"],
  ["Plante", "#7ac74c"], ["Glace", "#96d9d6"], ["Combat", "#c22e28"], ["Poison", "#a33ea1"],
  ["Sol", "#e2bf65"], ["Vol", "#a98ff3"], ["Psy", "#f95587"], ["Insecte", "#a6b91a"],
  ["Roche", "#b6a136"], ["Spectre", "#735797"], ["Dragon", "#6f35fc"], ["Ténèbres", "#705746"],
  ["Acier", "#b7b7ce"], ["Fée", "#d685ad"]
];
const NOMS_TYPES = TYPES.map(t => t[0]);


const DOSSIER_ICONES = "assets/pokemon-types/";
const ICONES = {
  "Normal": "normal.ico", "Feu": "feu.ico", "Eau": "eau.ico", "Électrik": "electrik.ico",
  "Plante": "plante.ico", "Glace": "glace.ico", "Combat": "combat.ico", "Poison": "poison.ico",
  "Sol": "sol.ico", "Vol": "vol.ico", "Psy": "psy.ico", "Insecte": "insecte.ico",
  "Roche": "roche.ico", "Spectre": "spectre.ico", "Dragon": "dragon.ico", "Ténèbres": "tenebres.ico",
  "Acier": "acier.ico", "Fée": "fee.ico"
};

const TAILLE_ICONE = 30;
const couleurType = d3.scaleOrdinal().domain(NOMS_TYPES).range(TYPES.map(t => t[1]));


const angle = d3.scalePoint().domain(NOMS_TYPES).range([0, 2 * Math.PI * (1 - 1 / NOMS_TYPES.length)]);

const NOMS_GEN = {1: "Kanto", 2: "Johto", 3: "Hoenn", 4: "Sinnoh", 5: "Unys", 6: "Kalos", 7: "Alola", 8: "Galar", 9: "Paldea"};



const svg = d3.select("#graphique").append("svg")
  .attr("viewBox", `0 0 ${TAILLE} ${TAILLE}`)
  .attr("role", "img")
  .attr("aria-label", "Graphique araignée du nombre de Pokémon par type");
const g = svg.append("g").attr("transform", `translate(${CENTRE},${CENTRE})`);

const gGrille = g.append("g");
const gAxes = g.append("g");
const gForme = g.append("g");
const gPoints = g.append("g");
const gIcones = g.append("g");
const gLabels = g.append("g");

const infobulle = d3.select("#infobulle");


const xy = (a, r) => [r * Math.sin(a), -r * Math.cos(a)];

d3.csv("csv/pokemon.csv", d3.autoType).then(brut => {

  const vus = new Set();
  const donnees = brut.filter(d => {
    if (vus.has(d["#"])) return false;
    vus.add(d["#"]);
    return true;
  });

  const generations = [...new Set(donnees.map(d => d["Génération"]))].sort((a, b) => a - b);

  // Menu déroulant
  d3.select("#select-gen").selectAll("option")
    .data(generations)
    .join("option")
      .attr("value", d => d)
      .text(d => `Génération ${d} – ${NOMS_GEN[d] ?? ""}`.replace(/ – $/, ""));
  d3.select("#select-gen").insert("option", ":first-child").attr("value", "tout").text("Toutes les générations");

  // Calcul : pour une liste de Pokémon, le nombre de Pokémon par type
  // mode : "tous" (Type 1 ou Type 2), "type1" (type principal) ou "type2" (type secondaire des doubles types)
  function calculer(liste, mode) {
    return NOMS_TYPES.map(type => {
      const membres = liste.filter(d =>
        mode === "type1" ? d["Type 1"] === type :
        mode === "type2" ? d["Type 2"] === type :
        d["Type 1"] === type || d["Type 2"] === type);
      return {type, valeur: membres.length, membres};
    });
  }

  const parGen = gen => gen === "tout" ? donnees : donnees.filter(d => d["Génération"] === +gen);




  function echelleRadiale(valeurs) {
    const maxi = d3.max(valeurs, d => d.valeur);
    const pas = d3.tickStep(0, maxi, NB_GRADUATIONS);
    const haut = Math.max(pas, Math.ceil(maxi / pas) * pas);
    return {r: d3.scaleLinear().domain([0, haut]).range([0, RAYON]), pas, haut};
  }


  const polygone = r => d3.lineRadial()
    .curve(d3.curveLinearClosed)
    .angle(d => angle(d.type))
    .radius(d => r(d.valeur));


    let premierRendu = true;

  function dessiner() {
    const gen = d3.select("#select-gen").property("value");
    const t = d3.transition().duration(premierRendu ? 0 : 700).ease(d3.easeCubicInOut);
    premierRendu = false;

    const liste = parGen(gen);
    const mode = d3.select("#select-types").property("value");
    const valeurs = calculer(liste, mode);
    const {r, pas, haut} = echelleRadiale(valeurs);

    const niveaux = d3.range(pas, haut + pas / 2, pas);
    gGrille.selectAll("circle").data(niveaux).join("circle").attr("class", "anneau").attr("r", d => r(d));
    gGrille.selectAll("text").data(niveaux).join("text")
      .attr("class", "graduation").attr("x", 4).attr("y", d => -r(d) - 3)
      .text(d => d);


    gAxes.selectAll("line").data(NOMS_TYPES).join("line")
      .attr("class", "axe").attr("x1", 0).attr("y1", 0)
      .attr("x2", d => xy(angle(d), RAYON)[0]).attr("y2", d => xy(angle(d), RAYON)[1]);



    gIcones.selectAll("image").data(NOMS_TYPES).join("image")
      .attr("href", d => DOSSIER_ICONES + ICONES[d])
      .attr("width", TAILLE_ICONE).attr("height", TAILLE_ICONE)
      .attr("x", d => xy(angle(d), RAYON + 28)[0] - TAILLE_ICONE / 2)
      .attr("y", d => xy(angle(d), RAYON + 28)[1] - TAILLE_ICONE / 2)
      .on("error", function () { d3.select(this).attr("display", "none"); })
      .append("title").text(d => d);

    gLabels.selectAll("text").data(NOMS_TYPES).join("text")
      .attr("class", "etiquette")
      .attr("x", d => xy(angle(d), RAYON + 58)[0])
      .attr("y", d => xy(angle(d), RAYON + 58)[1])
      .attr("text-anchor", d => { const x = xy(angle(d), 1)[0]; return Math.abs(x) < 0.15 ? "middle" : x > 0 ? "start" : "end"; })
      .attr("dominant-baseline", "middle")
      .attr("fill", d => d3.color(couleurType(d)).darker(0.6))
      .text(d => d);

    const zero = valeurs.map(v => ({type: v.type, valeur: 0}));
    gForme.selectAll("path").data([valeurs]).join(
      enter => enter.append("path").attr("class", "forme").attr("d", polygone(r)(zero))
    ).transition(t).attr("d", d => polygone(r)(d));

    gPoints.selectAll("circle").data(valeurs, d => d.type).join(
      enter => enter.append("circle").attr("class", "point").attr("r", 7)
        .attr("fill", d => couleurType(d.type)).attr("cx", 0).attr("cy", 0)
    )
      .on("mouseenter", function () {
        d3.select(this).transition("survol").duration(150).attr("r", 12);
      })
      .on("mousemove", (event, d) => montrerInfobulle(event, d))
      .on("mouseleave", function () {
        infobulle.style("opacity", 0);
        d3.select(this).transition("survol").duration(150).attr("r", 7);
      })
      .transition(t)
      .attr("cx", d => xy(angle(d.type), r(d.valeur))[0])
      .attr("cy", d => xy(angle(d.type), r(d.valeur))[1]);


    const top = [...valeurs].sort((a, b) => b.valeur - a.valeur)[0];
    const libelle = {tous: "types 1 et 2", type1: "Type 1 uniquement", type2: "doubles types (Type 2)"}[mode];
    const titre = gen === "tout" ? "Toutes générations" : `Génération ${gen} (${NOMS_GEN[gen]})`;
    d3.select("#resume").html(
      `<strong>${titre}</strong> – ${libelle} : ${liste.length} Pokémon. ` +
      `Type le plus représenté : <strong>${top.type}</strong> (${top.valeur} Pokémon).`
    );
  }

 function montrerInfobulle(event, d) {
  const exemples = d.membres.slice(0, 4).map(m => m.Nom).join(", ");
  const icone = `<img src="${DOSSIER_ICONES + ICONES[d.type]}" alt="" class="icone-infobulle"
                      onerror="this.style.display='none'">`;
  infobulle.style("opacity", 1)
    .style("left", (event.clientX + 14) + "px")
    .style("top", (event.clientY + 14) + "px")
    .html(
      `<div class="titre-infobulle">${icone}<strong>${d.type}</strong></div>` +
      `${d.valeur} Pokémon` +
      (exemples ? `<br><span style="opacity:.75">${exemples}…</span>` : "")
    );
}

  d3.selectAll("#select-gen, #select-types").on("change", dessiner);
  dessiner();
});