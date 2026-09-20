# FootSt4ts

Application française de calendriers, statistiques et analyses football. React, TypeScript, Tailwind et Vinext (API Next.js), Worker Cloudflare, base D1 persistante.

## Ce qui fonctionne réellement

- Calendriers et résultats réels OpenFootball des cinq grands championnats, saisons 2025/26 et 2026/27 ; lecture serveur, cache D1 partagé, instantanés réels de secours.
- Navigation par date, championnat, équipe, marché et présence de cotes ; favoris locaux sans inscription applicative.
- Fiches : forme sur 5/10 matchs terminés, domicile/extérieur, buts, BTTS, over 2,5 et confrontations descriptives.
- Poisson régularisé, paramètres fixes versionnés, marché 1N2/double chance/totaux/BTTS. Absence d'historique suffisant = abstention. L'heure OpenFootball n'est pas convertie sans fuseau certifié.
- Évaluation glissante exécutée sur 2025/26 : 351 matchs test au total, Brier/log loss et calibration. Résultats dans `docs/validation.json`. Ce n'est pas une validation de rentabilité.
- Connecteurs football-data.org, The Odds API et statistiques joueurs API-Football codés ; **non vérifiés avec une clé réelle**, aucune clé fournie.
- Historique prospectif de prédictions préparé et persisté par collecte avant horaire certifié ; pas de prédictions rétrodatées.

## Partiel / indisponible

Les cotes, joueurs, compositions, blessures, suspensions, xG/xA et marchés joueurs ne sont **pas connectés dans la livraison sans clé**. Le collecteur joueurs fournit uniquement des statistiques saisonnières si la saison et les droits sont accessibles. La forme par apparition et la modélisation participation/minutes ne disposent pas de source : aucune prédiction joueur affichée. Fonction mathématique de mélange des scénarios testée, pas de moteur joueur prétendument entraîné.

Les identifiants OpenFootball sont locaux à une source, ligue et saison ; pas de fusion des équipes par nom entre fournisseurs ou saisons. Cela limite l'historique utilisé par le modèle au début de saison. Les associations événements Odds API / matchs exigent une correspondance vérifiée dans `mappings`, avec preuve et contrôle de l'horaire. Aucun nom seul ne suffit.

Les recommandations automatiques sont **désactivées** : incertitude pas encore estimée ni validée. Aucun score de confiance arbitraire. Pas de combinés. ROI, drawdown, intervalle de rendement et référence marché sont inconnus tant qu'il n'y a pas de paris prospectifs avec cotes archivées. Dixon–Coles, xG et facteurs absences/repos non ajoutés sans mesure de leur contribution.

## Depuis Android

1. Ouvrir le lien du Site ; utiliser le calendrier ou « Prochaine date avec matchs ». Les données ouvertes fonctionnent sans compte fournisseur.
2. Pour les horaires certifiés, créer un compte gratuit sur https://www.football-data.org/client/register. Pour les cotes, choisir uniquement l'offre gratuite sur https://the-odds-api.com/.
3. Dans FootSt4ts, ouvrir ⚙️ Sources & configuration → Mes clés API, coller chaque clé et appuyer sur Enregistrer. Utiliser ensuite Collecter les cotes et joueurs. Ne jamais envoyer les clés dans le chat ou sur GitHub.
4. API-Football est facultatif : utiliser le compte direct, pas une offre RapidAPI pouvant facturer des dépassements. Vérifier la saison autorisée et les droits avant `API_FOOTBALL_RIGHTS_CONFIRMED=true`.
5. Programmer `scripts/collect.mjs` avec `SITE_ORIGIN` et `COLLECT_TOKEN` dans un ordonnanceur autorisé. **Le Site livré est privé : un ordonnanceur externe nécessite également une voie d'accès autorisée au Site. Aucun contournement de cette protection n'est installé.** La planification n'est donc pas activée dans cette livraison. Les lectures de calendrier se rafraîchissent à la consultation, dans les limites du cache partagé.

La version Sites est ajoutée à part dans le dépôt d'origine : l'ancien projet Express/Replit est conservé. Son ancien calcul de probabilités n'est pas utilisé par le Site. Ne pas le confondre avec ce moteur expérimental.

## Développement

Node >=22.13 ; utiliser le gestionnaire verrouillé dans package.json. `npm run dev`, `npm run build`, `npm run db:generate`. Environnement Sites géré : scripts du plugin et `sites-preview start`.

Variables dans `.env.example` ; aucune clé dans les bundles client. Les requêtes fournisseur sont exclusivement serveur. Les erreurs fournisseur sont expurgées des URLs et secrets. POST `/api/collect` exige le jeton serveur, est limité à 1/15 min et ne déclenche aucun achat. GET `/api/football` accepte uniquement des dates valides dans la plage active.

Migrations : `drizzle/0000_abnormal_freak.sql`, appliquées par Sites à la publication. Pour local : `node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_abnormal_freak.sql` après build.

Tests :

```sh
node --experimental-strip-types --test tests/core.test.mjs
python tests/database.py
node --experimental-strip-types scripts/validate.mjs
node node_modules/typescript/bin/tsc --noEmit
```

## Modèle et traçabilité

Forces domicile/extérieur relatives à la ligue. Pondération exponentielle demi-vie 120 jours et prior équivalent 8 matchs. Minimum : 30 matchs de ligue et 5 par équipe au lieu de jeu. Aucun résultat à la date du match ou après n'entre dans les variables. Poisson adaptatif, masse tronquée < 3e-10 et normalisation. Probabilités = estimations, pas certitudes.

Évaluation : premiers 60 % initiaux, 20 % réservés validation, derniers 20 % test glissant ; paramètres fixés avant le test, aucun tuning ici. Référence naïve uniforme (Brier multiclasse 2/3). Les résultats source ont été téléchargés après saison : l'absence de version historique des corrections interdit de prétendre à un backtest strictement « point-in-time ». Il faut une collecte prospective pour lever cette limite.

Tables D1 : cache, budgets, verrous, entités typées, observations immuables, correspondances explicites et prédictions/résultats. Les réponses source conservent date de collecte et référence. `null` signifie inconnu, zéro reste un zéro réel. Cache périmé conservé en cas d'erreur ; les compteurs sont réservés atomiquement avant requête. Les dates précises sont en UTC, affichage Paris ; les dates sans heure gardent explicitement leur précision journalière.

Voir [audit et budgets](docs/SOURCES.md) et [limitations](docs/LIMITATIONS.md).

Estimations statistiques, aucun gain garanti. 18+.

## Saisie mobile des clés
Ouvrir le site → ⚙️ Sources & configuration → Mes clés API. Coller puis enregistrer chaque clé. Le serveur chiffre les clés en AES-GCM dans D1 ; la clé maîtresse est un secret de production séparé. Accès limité au propriétaire autorisé. Les clés ne sont jamais renvoyées au navigateur. Le bouton Collecter déclenche les connecteurs cotes/joueurs sous leurs budgets et caches existants (15 minutes minimum entre demandes). Aucun accès payant ajouté. Une clé enregistrée ne garantit pas la couverture fournisseur. Les associations de matchs restent nécessaires pour afficher les cotes.

## Diagnostic des connexions
Le panneau de configuration affiche les collectes et erreurs par championnat. Les erreurs API-Football sont classées sans exposer le contenu brut. La saison joueurs peut être choisie explicitement ; aucun basculement silencieux vers des données historiques. Les événements The Odds API sont associés uniquement avec une correspondance unique du championnat, heure UTC exacte et deux équipes ordonnées (noms ou noms courts officiels football-data.org). La preuve et les identifiants sont conservés. Les événements ambigus restent exclus. Les sélections restent désactivées faute de validation de leur incertitude, même avec des clés valides.

## Mise à jour rapidité et analyses
Voir `docs/RECHERCHE-ET-CORRECTIONS.md` : cache navigateur et réponses D1, revalidation en arrière-plan, analyses Poisson v2 glissantes sur 365 jours, explications des tests et essai de source alternative pour les buteurs. Les vérifications API sont séparées et la liste se met à jour après collecte. Aucun scraping commercial sans autorisation.

## Interface joueurs et pistes expérimentales
Les joueurs sont présentés par pages de 10, en lignes compactes (nom, équipe, buts, passes). Une fiche latérale conserve les autres statistiques et leur source. Les sources détaillées sont repliées.
L’onglet Sélections commence par 3 pistes statistiques maximum, une par match. Priorité aux marchés présentant une cote de moins de 2 heures et un avantage brut ≥ 5 % (seuil expérimental) ; sinon, analyse seule du marché simple à plus forte probabilité. Ce ne sont pas des recommandations validées : aucune estimation fiable de l’incertitude n’est encore disponible. Sans cote fraîche, aucune value bet n’est annoncée.
Le propriétaire peut demander des cotes récentes dans les paramètres : maximum 10 crédits supplémentaires par demande, 1 demande toutes les 6 heures, sous le plafond global 400 crédits/mois et la réserve fournisseur. Des demandes fréquentes réduisent les collectes restantes du mois ; aucune facturation ou hausse de quota automatique.

## Améliorations du 19 septembre 2026
Navigation mobile fixe en bas, lien d’évitement clavier, animation réduite selon les préférences système. Les cartes affichent le marché choisi, le bookmaker de la meilleure cote (parmi les connectés), et signalent les cotes de plus de 2 h. Une cote fraîche est préférée à une cote ancienne plus élevée.
Les analyses du jour pour les matchs des 24 prochaines heures sont archivées lors du calcul serveur, avant le coup d’envoi uniquement. Unicité match + version : le premier instantané est conservé. Les résultats terminés du calendrier permettent l’évaluation prospective Brier/log loss ; aucune rentabilité de pari n’est fabriquée. Le suivi affiche les 100 dernières analyses au maximum. Cette collecte dépend des consultations, pas d’un planificateur garanti.
Les réponses de requêtes anciennes ne remplacent plus l’écran après un changement de date. Une requête navigateur expire après 30 secondes en conservant les données précédentes.

## Optimisation septembre 2026
- Réponse quotidienne : meilleures cotes par match/marché/issue/ligne ; les bookmakers complets restent sur la fiche.
- Analyses et suivi chargés uniquement sur l’onglet Analyses. Historique transmis sans répétition des cotes ; observations complètes conservées en base.
- Réduction des lectures de correspondances : lecture groupée des identifiants cotes.
- Collecte cotes automatique lors des consultations, seulement à moins de 90 minutes d’un match certifié, au maximum une tentative par ligue et date Paris. Collecte manuelle existante conservée, plafonds et réserve inchangés. Pas de planificateur autonome activé : aucune garantie sans visite.
- Maximum automatique inchangé : 5 ligues × 2 marchés × 1 région × 31 jours = 310 crédits. Maximum global local 400/mois, réserve fournisseur 50. L’échec peut consommer une tentative ; pas de boucle de reprises. Une unique collecte ne garantit pas des cotes fraîches pour chaque match d’une ligue.
- Stratégie : analyses seules ; pas de rentabilité prétendue. EV brute explicitée, méthodes et archives repliables.

## Laboratoire de décision paper-v1
Le protocole prospectif simule une unité constante, au maximum une sélection par match et version. Règles fixes : 100 matchs ligue, 10 par équipe dans le contexte, calendrier collecté depuis moins de 12 h, cote observée depuis moins de 2 h, EV brute ≥ 5 %, EV encore positive si p diminue de 5 points. Cette sensibilité n’est pas une incertitude statistique validée. Aucun pari réel ni recommandation rentable.
Les entrées nouvelles utilisent une clé match+paper-v1, sont enregistrées avant coup d’envoi avec cote/bookmaker/date/règles et ne remplacent jamais les analyses précédentes. Les probabilités et les simulations ont des suivis séparés. Aucun backtest de cotes inventé. Le bilan porte sur 1 000 entrées maximum ; le détail affiche 30 lignes. Annulations/reports restent en attente faute de règlement bookmaker vérifié ; résultats FINISHED du fournisseur uniquement. Drawdown calculé dans l’ordre des coups d’envoi (convention, pas chronologie des encaissements). Pas de planification autonome : enregistrement et règlement lors des visites.

## Comparaison au marché et validité de l’affichage
Les comparaisons 1N2 et totaux normalisent uniquement des issues exhaustives du même opérateur, source, match, marché et ligne, à moins de 60 secondes d’écart. Aucun mélange des meilleures cotes pour retirer la marge. Marché incomplet ou doublon ambigu : comparaison indisponible. Alerte descriptive dès 15 points d’écart, sans modifier les critères paper-v1 ni prétendre valider cet avantage.
L’écran réévalue les critères temporels toutes les 30 secondes ; le journal conserve la première sélection enregistrée. Les commissions, notamment celles des bourses de paris, et la fiscalité ne sont pas modélisées : bilan brut. Aucun règlement automatique si l’heure de coup d’envoi fournisseur a changé depuis l’archivage. Les reports demeurent à vérifier.

## Protocoles prospectifs comparés
- paper-v1 reste inchangé : son historique n’est ni remplacé ni reclassé.
- paper-v2-prudent est un nouveau protocole prospectif. Il ajoute cote ≤ 5, comparaison au marché disponible, divergence absolue ≤ 15 points et exclusion des noms identifiés comme bourses (Matchbook, Betfair, Smarkets, Betdaq, exchange), faute de frais vérifiés. Seuils expérimentaux choisis avant les résultats futurs, pas preuve de supériorité. Pas de garantie que cette liste identifie tous les opérateurs à frais. Tous les bilans restent bruts.
- Le journal SQL agrège toute l’archive par version, avec détail paginé 30 entrées. Tests SQLite > 1 000 lignes. Dates de départ différentes : ne pas comparer les profits bruts comme une expérience à échantillon identique.
- Le règlement traite tous les matchs terminés présents dans la saison chargée, sans limite des 100 plus anciennes attentes. Les changements d’horaire demeurent en attente. Aucun ancien pari réinventé ; la collecte dépend encore des visites.

### Diagnostic V2 et correction du choix des opérateurs
Le diagnostic regroupe les motifs réels d’exclusion, sans transformer une cote inconnue en un mauvais pari. La collecte actuelle dépend des visites, dans les 90 minutes avant un match, une fois par championnat/jour ; elle ne garantit pas de cotes fraîches toute la journée.
Correction d’implémentation du 20 septembre 2026 : les mêmes critères V2 sont appliqués aux opérateurs avant de retenir la meilleure cote compatible. Une cote maximale issue d’une bourse exclue ne masque plus un autre opérateur compatible. Aucun ancien enregistrement n’est réécrit. Les nouvelles analyses conservent la cote et la référence exactes de cet opérateur.
Piste scientifique prioritaire : calibration sur validation chronologique indépendante, comparaison au marché sur un même échantillon et évaluation finale prospective. Le Brier et la log loss ne prouvent pas une rentabilité. Voir https://scikit-learn.org/stable/modules/calibration.html. Aucune rentabilité du moteur n’est démontrée.

### Expérience de calibration (20 septembre 2026)
Exécuter `node --experimental-strip-types scripts/research-calibration.mjs`. Résultats et empreintes SHA-256 des jeux de données : `docs/calibration-research.json`. Calibration par température sélectionnée sur les dates de validation (60–80 %), comparaison sur les dates suivantes, aucune journée divisée entre les groupes. Résultats glissants sur 359 matchs ; la correction n’améliore pas les mesures globales. Elle n’est pas activée. Cette saison ayant déjà été examinée, l’expérience est exploratoire et non un nouveau test final indépendant. Sans historique de cotes contemporain, rendement à 10 € non calculable.

### Collecte planifiée : préparation, pas activation
`POST /api/collect` utilise maintenant exactement le modèle roulant, l’historique partagé et le règlement prudent du site. Il ne remplace plus les résultats antérieurs, respecte les changements de coup d’envoi et ne déclenche pas la pagination joueurs. Les cotes passent par la fenêtre de 90 minutes et les budgets existants.
Aucun ordonnanceur n’est activé : les outils d’hébergement actuellement accessibles ne permettent pas d’en attacher un directement. Un ordonnanceur autorisé doit pouvoir accéder au site privé et fournir le secret serveur `COLLECT_TOKEN` ; ne pas rendre le site public pour cela et ne pas enregistrer de jeton de session personnel dans GitHub. Le script de collecte seul ne supprime pas l’authentification de l’hébergement. Sans cette connexion, l’actualisation reste déclenchée par les visites ou les paramètres.
