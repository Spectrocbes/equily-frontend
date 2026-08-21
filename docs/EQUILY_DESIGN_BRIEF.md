# Equily — Brief de refonte graphique

Document de cadrage à passer en contexte à Claude Code. Il décrit **quoi** faire et **sous quelles contraintes**. Il ne contient pas de code : c'est à Claude Code de le produire, en respectant ce cadre.

---

## 1. Contexte & périmètre

- **Produit** : Equily, application de gestion de patrimoine (alternative type Finary) à usage personnel et familial. Consolide comptes courants, livrets, portefeuilles d'investissement, PEA et crypto.
- **Utilisateurs** : toi et ta famille. Peu d'utilisateurs, mais usage régulier et sérieux — on lit un état financier, on suit une évolution dans le temps, on prend des décisions.
- **Objectif de la refonte** : refonte **graphique** (identité visuelle, design system, thèmes clair/sombre, cohérence des composants). **Hors périmètre** : logique métier, backend, règles fiscales, calculs. On ne touche pas au comportement, seulement à la présentation.
- **Rôle de cette refonte** : faire passer l'app d'un rendu fonctionnel à un rendu qui inspire confiance et sérieux, sans tomber dans le tape-à-l'œil.

---

## 2. Stack technique (contraintes à respecter)

- **Framework** : Angular 18, **Standalone Components** + **Signals**.
- **Styling** : **TailwindCSS**. Toute la refonte doit passer par le système de thème Tailwind (tokens/variables CSS), pas de valeurs codées en dur dispersées dans les composants.
- **Data-viz** : **D3.js** (graphiques d'évolution, allocation, exposition géographique).
- **i18n** : internationalisation **EN/FR déjà en place**. La refonte ne doit casser **aucune clé de traduction** ni introduire de texte codé en dur non traduit.
- **Backend** (hors périmètre, pour info) : Java 21 / Spring Boot, PostgreSQL, montants normalisés en EUR.

---

## 3. Direction artistique

Ton général : **sobre, professionnel, rassurant, précis**. On vise le registre d'une interface de banque privée moderne : calme, dense en information mais lisible, sans esbroufe.

Principes :
- **La donnée est le héros.** L'interface s'efface au profit des chiffres et des courbes. Pas de décoration gratuite.
- **Restreinte chromatique.** Pas de couleurs extravagantes, pas de dégradés flashy. Une base neutre, un seul accent, et des couleurs sémantiques (gain/perte) maîtrisées.
- **Densité maîtrisée.** Un dashboard patrimonial affiche beaucoup d'infos : hiérarchie claire, espacements réguliers, alignements stricts. La lisibilité prime sur le remplissage.
- **Cohérence avant originalité.** Un même composant se comporte partout pareil. L'utilisateur apprend l'interface une fois.

À éviter (ce sont des tics de design générique, pas des choix) :
- Fond crème + serif contrasté + accent terracotta.
- Fond quasi-noir + accent vert acide ou vermillon.
- Style « journal » à filets fins et colonnes denses.

Prendre **un seul** parti fort (l'élément signature, cf. §5) et garder tout le reste discipliné.

---

## 4. Système de couleurs — thèmes clair & sombre

**Les deux thèmes sont de premier rang**, pas un mode sombre bricolé après coup. Implémentation via la stratégie `class` de Tailwind (`dark:`) pilotée par des **variables CSS**, avec bascule manuelle + respect de `prefers-color-scheme` par défaut.

Structure de palette attendue (Claude Code propose les hex exacts et les valide en contraste) :

- **Neutres** : une échelle de gris/ardoise (slate) qui porte 90 % de l'interface — fonds, surfaces, bordures, textes. C'est le socle sobre.
- **Accent unique** : une seule couleur d'accent, sobre et « patrimoniale ». Piste à privilégier : un ton profond et mat (bleu pétrole / teal sombre, ou laiton/or **très** désaturé pour évoquer la gestion de patrimoine sans clinquant). Réservé aux actions primaires, états actifs, éléments focalisés. Jamais en aplats massifs.
- **Sémantique financière** :
  - Gain / positif : vert **maîtrisé** (pas fluo).
  - Perte / négatif : rouge **maîtrisé**.
  - Ces couleurs ne servent **que** au sens financier, jamais à décorer.
- **Surfaces** : distinguer fond de page / carte / carte surélevée par des paliers de neutres, pas par des ombres lourdes.

Règles :
- Chaque couleur existe en version claire **et** sombre, définie comme token, jamais en dur dans un composant.
- Le contraste texte/fond respecte **WCAG AA** dans les deux thèmes.
- **Ne jamais coder l'information par la couleur seule** (daltonisme) : un gain/perte s'accompagne d'un signe (+/−) ou d'une flèche, pas uniquement du vert/rouge.

---

## 5. Typographie

- **Chiffres tabulaires obligatoires** pour toutes les valeurs financières (montants, %, variations) : activer `font-variant-numeric: tabular-nums` (ou une police à chasse tabulaire). Les colonnes de chiffres doivent s'aligner parfaitement à la virgule. C'est non négociable dans une app financière.
- **Police d'interface** : une grotesque/sans-serif neutre et très lisible pour le corps et l'UI.
- **Hiérarchie claire** : une échelle typographique définie (display / titres / corps / légende / donnée), avec des graisses intentionnelles. Les gros chiffres clés (patrimoine total, variation) portent la hiérarchie.
- **Élément signature** : concentrer le seul vrai parti-pris visuel à un endroit — par exemple le traitement du **chiffre patrimonial principal** et de sa variation (échelle, graisse, unités en exposant discret). Tout le reste reste calme autour.

---

## 6. Composants & data-viz

- **Design system cohérent** : cartes, tableaux, boutons, champs, badges, onglets, tooltips — un langage unifié, espacements sur une échelle régulière, rayons de bordure constants et sobres.
- **Tableaux** : pensés pour la donnée financière — alignement à droite des montants, chiffres tabulaires, lignes lisibles, tri clair.
- **Graphiques D3** :
  - Les couleurs des graphiques viennent des **mêmes tokens** que le reste de l'app et **s'adaptent au thème clair/sombre** (pas de palette D3 figée qui devient illisible en sombre).
  - **Contrainte critique à préserver** : le positionnement des tooltips repose sur `getBoundingClientRect()`. Ne pas casser cette logique — la refonte porte sur le style (couleurs, typo, grille, axes), pas sur le mécanisme de positionnement.
  - Axes, grilles et légendes restent discrets : la courbe prime.

---

## 7. Accessibilité (plancher de qualité)

- Contraste **AA** minimum, vérifié dans les deux thèmes.
- Focus clavier visible sur tous les éléments interactifs.
- `prefers-reduced-motion` respecté (animations sobres et désactivables).
- Information jamais portée par la seule couleur.
- Responsive jusqu'au mobile.

---

## 8. Garde-fous techniques (à ne pas casser)

- **i18n EN/FR** : aucune clé cassée, aucun texte en dur non traduit introduit.
- **Tooltips D3** : logique `getBoundingClientRect()` préservée.
- **Affichage EUR** : les montants restent normalisés/affichés en EUR comme aujourd'hui.
- **Qualité (SonarCloud, avant merge)** : couverture ≥ 80 %, duplication ≤ 3 %, fiabilité ≥ A.
- **Tests fonctionnels** passants avant chaque commit.
- Refonte **incrémentale et réversible** : on doit pouvoir relire et valider par lots.

---

## 9. Livrables attendus de Claude Code

1. Un **plan** de refonte (proposé et validé avant toute modification).
2. Un **design system** centralisé (tokens de couleur clair/sombre, échelle typo, espacements) exploitable par tout composant.
3. La **bascule de thème** clair/sombre fonctionnelle.
4. La **migration composant par composant** vers le nouveau système, par commits lisibles.
5. L'**adaptation des graphiques D3** aux tokens et aux deux thèmes, sans toucher au positionnement des tooltips.
6. Un court **récapitulatif** des choix (palette, typo, signature) et de ce qui a changé.
