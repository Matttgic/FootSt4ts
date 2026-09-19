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
