// =====================================================================
//  Le "duel" : un type contre les 17 autres, en attaque ET en défense
//  Graphique en papillon : à gauche les dégâts SUBIS, à droite les dégâts INFLIGÉS.
//  Variable visuelle principale : LONGUEUR de la barre = multiplicateur de dégâts
//  (la longueur est la variable la plus précise pour une quantité).
//  Couleur : vert = avantage pour le type choisi, rouge = désavantage.
// =====================================================================

// ---------- Types, couleurs, icônes ----------
const TYPES = [
  ["Normal", "#a8a77a"], ["Feu", "#ee8130"], ["Eau", "#6390f0"], ["Électrik", "#f7d02c"],
  ["Plante", "#7ac74c"], ["Glace", "#96d9d6"], ["Combat", "#c22e28"], ["Poison", "#a33ea1"],
  ["Sol", "#e2bf65"], ["Vol", "#a98ff3"], ["Psy", "#f95587"], ["Insecte", "#a6b91a"],
  ["Roche", "#b6a136"], ["Spectre", "#735797"], ["Dragon", "#6f35fc"], ["Ténèbres", "#705746"],
  ["Acier", "#b7b7ce"], ["Fée", "#d685ad"]
];
const NOMS = TYPES.map(t => t[0]);
const couleurType = d3.scaleOrdinal().domain(NOMS).range(TYPES.map(t => t[1]));

const DOSSIER_ICONES = "../assets/pokemon-types/";
const ICONES = {
  "Normal": "normal.ico", "Feu": "feu.ico", "Eau": "eau.ico", "Électrik": "electrik.ico",
  "Plante": "plante.ico", "Glace": "glace.ico", "Combat": "combat.ico", "Poison": "poison.ico",
  "Sol": "sol.ico", "Vol": "vol.ico", "Psy": "psy.ico", "Insecte": "insecte.ico",
  "Roche": "roche.ico", "Spectre": "spectre.ico", "Dragon": "dragon.ico", "Ténèbres": "tenebres.ico",
  "Acier": "acier.ico", "Fée": "fee.ico"
};
const urlIcone = type => DOSSIER_ICONES + ICONES[type];

// ---------- Efficacités (génération 6 et suivantes) ----------
const REGLES = {
  "Normal":   {x2: [],                                         x05: ["Roche", "Acier"],                                                          x0: ["Spectre"]},
  "Feu":      {x2: ["Plante", "Glace", "Insecte", "Acier"],    x05: ["Feu", "Eau", "Roche", "Dragon"],                                            x0: []},
  "Eau":      {x2: ["Feu", "Sol", "Roche"],                    x05: ["Eau", "Plante", "Dragon"],                                                  x0: []},
  "Électrik": {x2: ["Eau", "Vol"],                             x05: ["Électrik", "Plante", "Dragon"],                                             x0: ["Sol"]},
  "Plante":   {x2: ["Eau", "Sol", "Roche"],                    x05: ["Feu", "Plante", "Poison", "Vol", "Insecte", "Dragon", "Acier"],             x0: []},
  "Glace":    {x2: ["Plante", "Sol", "Vol", "Dragon"],         x05: ["Feu", "Eau", "Glace", "Acier"],                                             x0: []},
  "Combat":   {x2: ["Normal", "Glace", "Roche", "Ténèbres", "Acier"], x05: ["Poison", "Vol", "Psy", "Insecte", "Fée"],                             x0: ["Spectre"]},
  "Poison":   {x2: ["Plante", "Fée"],                          x05: ["Poison", "Sol", "Roche", "Spectre"],                                        x0: ["Acier"]},
  "Sol":      {x2: ["Feu", "Électrik", "Poison", "Roche", "Acier"], x05: ["Plante", "Insecte"],                                                   x0: ["Vol"]},
  "Vol":      {x2: ["Plante", "Combat", "Insecte"],            x05: ["Électrik", "Roche", "Acier"],                                               x0: []},
  "Psy":      {x2: ["Combat", "Poison"],                       x05: ["Psy", "Acier"],                                                             x0: ["Ténèbres"]},
  "Insecte":  {x2: ["Plante", "Psy", "Ténèbres"],              x05: ["Feu", "Combat", "Poison", "Vol", "Spectre", "Acier", "Fée"],                x0: []},
  "Roche":    {x2: ["Feu", "Glace", "Vol", "Insecte"],         x05: ["Combat", "Sol", "Acier"],                                                   x0: []},
  "Spectre":  {x2: ["Psy", "Spectre"],                         x05: ["Ténèbres"],                                                                 x0: ["Normal"]},
  "Dragon":   {x2: ["Dragon"],                                 x05: ["Acier"],                                                                    x0: ["Fée"]},
  "Ténèbres": {x2: ["Psy", "Spectre"],                         x05: ["Combat", "Ténèbres", "Fée"],                                                x0: []},
  "Acier":    {x2: ["Glace", "Roche", "Fée"],                  x05: ["Feu", "Eau", "Électrik", "Acier"],                                          x0: []},
  "Fée":      {x2: ["Combat", "Dragon", "Ténèbres"],           x05: ["Feu", "Poison", "Acier"],                                                   x0: []}
};
const eff = {};
NOMS.forEach(a => {
  eff[a] = {};
  NOMS.forEach(d => {
    const r = REGLES[a];
    eff[a][d] = r.x2.includes(d) ? 2 : r.x05.includes(d) ? 0.5 : r.x0.includes(d) ? 0 : 1;
  });
});

// ---------- Couleurs des barres (vert = bon pour le type choisi) ----------
const COUL_ATT = {2: "#2f9e5b", 1: "#cfd4df", 0.5: "#e8909b", 0: "#2f3440"};
const COUL_DEF = {4: "#a4161a", 2: "#d1495b", 1: "#cfd4df", 0.5: "#8fd6a8", 0.25: "#2f9e5b", 0: "#2f3440"};
const fmt = m => m === 0 ? "0" : m === 0.5 ? "½" : m === 0.25 ? "¼" : String(m);

// ---------- Géométrie ----------
const LIGNE = 30;           // hauteur d'une ligne
const HAUT = 84;            // espace pour les titres
const UNITE = 62;           // largeur de la barre pour un multiplicateur de ×1
const GOUTTIERE = 138;      // colonne centrale (icône + nom)
const MAXI = 4;             // échelle commune aux deux côtés : de ×0 à ×4
const X_GAUCHE = 46 + MAXI * UNITE;             // départ des barres de défense (elles vont vers la gauche)
const X_DROITE = X_GAUCHE + GOUTTIERE;          // départ des barres d'attaque (elles vont vers la droite)
const W = X_DROITE + MAXI * UNITE + 46;
const H = HAUT + NOMS.length * LIGNE + 16;
const longueur = m => m === 0 ? 6 : m * UNITE;  // un petit rectangle sombre pour "aucun effet"

const svg = d3.select("#duel").append("svg")
  .attr("viewBox", `0 0 ${W} ${H}`)
  .attr("role", "img")
  .attr("aria-label", "Dégâts subis et infligés par un type contre chacun des 18 types");
const gFond = svg.append("g");
const gLignes = svg.append("g");
const infobulle = d3.select("#infobulle");

// Titres des deux côtés
svg.append("text").attr("class", "duel-titre").attr("x", X_GAUCHE - 2 * UNITE).attr("y", 22).attr("text-anchor", "middle").text("DÉGÂTS SUBIS");
svg.append("text").attr("class", "duel-sous-titre").attr("x", X_GAUCHE - 2 * UNITE).attr("y", 40).attr("text-anchor", "middle").text("quand l'adversaire l'attaque");
svg.append("text").attr("class", "duel-titre").attr("x", X_DROITE + 2 * UNITE).attr("y", 22).attr("text-anchor", "middle").text("DÉGÂTS INFLIGÉS");
svg.append("text").attr("class", "duel-sous-titre").attr("x", X_DROITE + 2 * UNITE).attr("y", 40).attr("text-anchor", "middle").text("quand il attaque l'adversaire");
svg.append("text").attr("class", "duel-sous-titre").attr("x", X_GAUCHE + GOUTTIERE / 2).attr("y", HAUT - 12).attr("text-anchor", "middle").text("Adversaire");

// Graduations (×1, ×2, ×4) de chaque côté
[1, 2, 4].forEach(k => {
  [[X_GAUCHE - k * UNITE, "g"], [X_DROITE + k * UNITE, "d"]].forEach(([x]) => {
    gFond.append("line").attr("class", "duel-grille").attr("x1", x).attr("x2", x).attr("y1", HAUT - 8).attr("y2", H - 10);
    gFond.append("text").attr("class", "duel-grad").attr("x", x).attr("y", HAUT - 12).attr("text-anchor", "middle").text("×" + k);
  });
});
gFond.append("line").attr("class", "duel-axe").attr("x1", X_GAUCHE).attr("x2", X_GAUCHE).attr("y1", HAUT - 8).attr("y2", H - 10);
gFond.append("line").attr("class", "duel-axe").attr("x1", X_DROITE).attr("x2", X_DROITE).attr("y1", HAUT - 8).attr("y2", H - 10);

// ---------- Sélection du type ----------
let type1 = "Feu";
let type2 = "";

const boutons = d3.select("#choix-types").selectAll("button").data(NOMS).join("button")
  .attr("class", "type-btn").attr("type", "button")
  .style("--c", d => couleurType(d))
  .on("click", (e, d) => choisir(d));
boutons.append("img").attr("src", urlIcone).attr("alt", "").on("error", function () { d3.select(this).remove(); });
boutons.append("span").text(d => d);

const selType2 = d3.select("#select-type2");
selType2.selectAll("option").data(["", ...NOMS]).join("option").attr("value", d => d).text(d => d === "" ? "— Aucun —" : d);
selType2.on("change", () => { type2 = selType2.property("value"); if (type2 === type1) { type2 = ""; selType2.property("value", ""); } maj(); });
d3.select("#select-tri").on("change", maj);

function choisir(t) {
  type1 = t;
  if (type2 === t) { type2 = ""; selType2.property("value", ""); }
  maj();
}

// ---------- Mise à jour ----------
const icone = (t, c = "icone-infobulle") =>
  `<img src="${urlIcone(t)}" alt="" class="${c}" onerror="this.style.display='none'">`;

function maj() {
  boutons.classed("actif", d => d === type1).classed("actif2", d => d === type2);

  // Pour chaque adversaire : dégâts infligés (meilleur type) et dégâts subis (produit)
  const lignes = NOMS.map(o => ({
    type: o,
    att: Math.max(...[type1, type2].filter(Boolean).map(t => eff[t][o])),
    def: eff[o][type1] * (type2 ? eff[o][type2] : 1)
  }));

  // Tri
  const tri = d3.select("#select-tri").property("value");
  const ordre = [...lignes];
  if (tri === "attaque") ordre.sort((a, b) => b.att - a.att || NOMS.indexOf(a.type) - NOMS.indexOf(b.type));
  if (tri === "defense") ordre.sort((a, b) => b.def - a.def || NOMS.indexOf(a.type) - NOMS.indexOf(b.type));
  const rang = new Map(ordre.map((d, i) => [d.type, i]));

  const t = d3.transition().duration(600).ease(d3.easeCubicInOut);

  gLignes.selectAll("g.duel-ligne").data(lignes, d => d.type).join(enter => {
    const g = enter.append("g").attr("class", "duel-ligne")
      .attr("transform", d => `translate(0,${HAUT + rang.get(d.type) * LIGNE})`)
      .on("click", (e, d) => choisir(d.type))
      .on("mousemove", (e, d) => infobulleLigne(e, d))
      .on("mouseleave", () => infobulle.style("opacity", 0));
    g.append("rect").attr("class", "duel-survol").attr("x", 0).attr("width", W).attr("y", 0).attr("height", LIGNE - 2).attr("rx", 6);
    g.append("rect").attr("class", "barre-def").attr("y", 5).attr("height", LIGNE - 12).attr("rx", 3);
    g.append("text").attr("class", "val-def").attr("y", LIGNE / 2 - 1).attr("dominant-baseline", "central");
    g.append("rect").attr("class", "barre-att").attr("y", 5).attr("height", LIGNE - 12).attr("rx", 3).attr("x", X_DROITE);
    g.append("text").attr("class", "val-att").attr("y", LIGNE / 2 - 1).attr("dominant-baseline", "central");
    // pastille de couleur + icône + nom de l'adversaire
    g.append("circle").attr("cx", X_GAUCHE + 17).attr("cy", LIGNE / 2 - 1).attr("r", 10).attr("fill", d => couleurType(d.type));
    g.append("image").attr("href", d => urlIcone(d.type)).attr("x", X_GAUCHE + 6).attr("y", LIGNE / 2 - 12)
      .attr("width", 22).attr("height", 22).on("error", function () { d3.select(this).remove(); });
    g.append("text").attr("class", "duel-nom").attr("x", X_GAUCHE + 36).attr("y", LIGNE / 2 - 1)
      .attr("dominant-baseline", "central").text(d => d.type);
    return g;
  });

  const g = gLignes.selectAll("g.duel-ligne");
  g.transition(t).attr("transform", d => `translate(0,${HAUT + rang.get(d.type) * LIGNE})`);

  g.select(".barre-def").transition(t)
    .attr("x", d => X_GAUCHE - longueur(d.def)).attr("width", d => longueur(d.def)).attr("fill", d => COUL_DEF[d.def]);
  g.select(".val-def").transition(t)
    .attr("x", d => X_GAUCHE - longueur(d.def) - 6).attr("text-anchor", "end");
  g.select(".val-def").text(d => d.def === 0 ? "aucun effet" : "×" + fmt(d.def))
    .classed("fort", d => d.def >= 2).classed("bon", d => d.def < 1);

  g.select(".barre-att").transition(t)
    .attr("width", d => longueur(d.att)).attr("fill", d => COUL_ATT[d.att]);
  g.select(".val-att").transition(t).attr("x", d => X_DROITE + longueur(d.att) + 6).attr("text-anchor", "start");
  g.select(".val-att").text(d => d.att === 0 ? "aucun effet" : "×" + fmt(d.att))
    .classed("fort", d => d.att >= 2).classed("bon", d => d.att < 1);

  // Bilan chiffré
  const forces = lignes.filter(d => d.att >= 2).length;
  const faibles = lignes.filter(d => d.def >= 2).length;
  const resist = lignes.filter(d => d.def > 0 && d.def < 1).length;
  const immun = lignes.filter(d => d.def === 0).length;
  const nom = type2 ? `${type1} / ${type2}` : type1;
  d3.select("#bilan").html(
    `<div class="bilan-titre">${icone(type1, "icone-fiche")}${type2 ? icone(type2, "icone-fiche") : ""}<h2>${nom}</h2></div>` +
    `<ul class="bilan-chiffres">` +
    `<li class="b-vert"><strong>${forces}</strong> type${forces > 1 ? "s" : ""} qu'il bat (×2 ou plus)</li>` +
    `<li class="b-rouge"><strong>${faibles}</strong> faiblesse${faibles > 1 ? "s" : ""}</li>` +
    `<li class="b-vert"><strong>${resist}</strong> résistance${resist > 1 ? "s" : ""}</li>` +
    `<li class="b-noir"><strong>${immun}</strong> immunité${immun > 1 ? "s" : ""}</li>` +
    `</ul>` +
    (type2 ? `<p class="note">Double type : les dégâts subis sont multipliés entre eux (ex. ×2 et ×2 = ×4). ` +
             `En attaque, on garde le meilleur des deux types.</p>` : "")
  );
}

function infobulleLigne(event, d) {
  infobulle.style("opacity", 1)
    .style("left", (event.clientX + 14) + "px").style("top", (event.clientY + 14) + "px")
    .html(
      `<div class="titre-infobulle">${icone(d.type)}<strong>${d.type}</strong></div>` +
      `Il subit : ${d.def === 0 ? "aucun dégât" : "×" + fmt(d.def)}<br>` +
      `Il inflige : ${d.att === 0 ? "aucun dégât" : "×" + fmt(d.att)}<br>` +
      `<span style="opacity:.7">Clique pour choisir ce type</span>`
    );
}

maj();