# Audit des sources — 17 septembre 2026

Les fonctionnalités commerciales annoncées ne prouvent pas l'accès avec une clé gratuite. Aucune clé privée n'a été fournie ni testée. Seul OpenFootball a été effectivement téléchargé. Aucun abonnement souscrit.

| Source officielle | Offre gratuite | Données utiles / restrictions | Décision |
|---|---|---|---|
| [football-data.org](https://www.football-data.org/pricing) | Permanente, 12 compétitions, 10 appels/minute | Calendriers, résultats différés, classements ; grands cinq, Portugal, Pays-Bas, Championship, C1 notamment. Statistiques détaillées et cotes sont des options payantes. | Connecteur serveur prêt, clé manquante ; pas de promesse de joueurs gratuits. |
| [API-Football](https://www.api-football.com/pricing) | 100 requêtes/jour, sans carte sur abonnement direct | Tous endpoints annoncés mais saisons gratuites restreintes, couverture variable par saison. Pas de liste de saisons gratuites tenue pour acquise. | Connecteur joueurs paginé facultatif ; saison à vérifier avec clé. |
| [The Odds API](https://the-odds-api.com/) | 500 crédits mensuels | Sports et bookmakers variables ; crédit = marché × région. Historique de cotes payant. | 1N2 et totaux, région eu, 1 collecte/jour ; clé manquante. |
| [OpenFootball](https://github.com/openfootball/football.json) | CC0, sans clé | Calendriers/résultats ; fichiers annuels, pas de pagination ; pas de joueurs/xG/cotes. Mise à jour du JSON annoncée quotidienne, amont non automatisé. | Source active ; dix fichiers des cinq ligues 2025/26 et 2026/27 vérifiés et livrés. |
| [StatsBomb / Hudl Open Data](https://github.com/hudl/open-data) | Compétitions historiques sélectionnées | Événements et compositions selon fichiers ; pas de calendrier mondial actuel ni cotes. Attribution demandée ; conditions particulières dans LICENSE.pdf. | Non intégré : réutilisation commerciale non confirmée ici. |

## Granularité des données

| Donnée | football-data.org gratuit | API-Football annoncé, accès gratuit non vérifié | The Odds API | OpenFootball |
|---|---|---|---|---|
| Calendriers / résultats | Oui, différés | Oui selon saison | Événements de cotes ; résultats endpoint distinct | Oui selon fichiers |
| Stats équipes / buts | Résultats, classements ; ratios calculables | Oui selon couverture | Non | Scores ; ratios calculables |
| Buteurs / passes / minutes / titularisations | Non promis par l'offre gratuite vérifiée | Players : buts, passes, minutes, lineups selon champs | Non, uniquement certains marchés | Non |
| Tirs / tirs cadrés | Add-on payant | Selon couverture | Non | Non |
| xG / xGA | Non confirmé gratuit | Selon endpoints et compétition, non promis | Non | Non |
| xA | Non confirmé | Non confirmé dans l'intégration | Non | Non |
| Compositions / absences | Deep Data payant ; blessures non promises | Lineups / injuries / sidelined annoncés | Non | Non |
| Cotes 1N2 | Add-on payant | Prématch annoncé, saison et disponibilité à tester | h2h | Non |
| Totaux / BTTS | Non couvert par add-on 1N2 annoncé | Marchés selon bookmakers | totals en endpoint global ; btts exige disponibilité événement | Non |
| Buteurs / passeurs | Non | Selon catalogue réel, non garanti | Marchés événementiels limités à certains sports/bookmakers ; passeurs non confirmés | Non |
| Historique | Pack 10 saisons payant ; accès gratuit à vérifier | Variable par saison, historique cotes limité | Cotes historiques payantes | Fichiers de saisons disponibles |

Docs : [football-data v4](https://docs.football-data.org/general/v4/index.html), [API-Football](https://www.api-football.com/documentation-v3), [The Odds API v4](https://the-odds-api.com/liveapi/guides/v4/).

## Droits et publication

- [football-data.org — conditions](https://www.football-data.org/about) : attribution visible requise ; conserver les contraintes du compte et vérifier l'usage commercial avant monétisation.
- [API-Football — conditions](https://www.api-football.com/terms) : le fournisseur ne concède pas lui-même tous les droits de publication ou commerciaux des compétitions. Activation conditionnelle `API_FOOTBALL_RIGHTS_CONFIRMED=true`, à ne pas déduire de l'achat d'un accès.
- [The Odds API — conditions](https://the-odds-api.com/terms-and-conditions.html) : affichage en application et analyses commerciales permis, revente de données brutes sous forme d'API interdite. Les réponses côté UI ne sont pas un service de revente. Conservation des observations permise.
- [Licence OpenFootball](https://github.com/openfootball/football.json/blob/master/LICENSE.md) : CC0. Source citée ; aucun logo tiers repris.
- SofaScore, FotMob, WhoScored, FBref et bookmakers : aucune autorisation de collecte/republication établie dans cet audit ; aucun connecteur ni scraping déployé. Ni robots.txt, ni accessibilité publique ne sont traités comme une licence.

## Consommation effective prévue

OpenFootball : 5 fichiers de saison courante × 1/jour = 5 lectures ; navigation vers 2025/26 ajoute au plus 5 lectures en cache quotidien. Pas de pagination. Plafond local global 20/jour. GitHub peut limiter l'accès : conserver alors le dernier instantané.

football-data.org : 5 ligues × 1 réponse saison entière × 4/jour = 20 appels/jour. Requête `competitions/{code}/matches?season=YYYY`, sans pagination. Maximum local 8 appels par minute UTC et 80/jour, couvrant la saison historique consultée. Les fenêtres fixes peuvent chevaucher une fenêtre glissante du fournisseur : un 429 interrompt la collecte et impose un cache d'erreur de 15 min. Aucun retry immédiat.

The Odds API : 5 sports × 2 marchés (`h2h,totals`) × 1 région (`eu`) × 31 collectes = **310 crédits / 31 jours**. Endpoint odds sans pagination. 190 crédits théoriques restants ; seuil local 400 et réserve fournisseur 50. Chaque tentative réserve 2 crédits même si l'appel échoue/retourne moins de marchés. Les headers fournisseur restent l'autorité pour les usages externes à l'application. À réserve atteinte, les ligues restantes ne sont plus collectées. Pas de BTTS/props automatique, pas de polling live. Budget mensuel local calendaire, ne remplace pas le cycle réel du fournisseur. Une ancienne réponse de quota à moins de 50 exige une vérification du renouvellement avant de reprendre.

API-Football : 1 requête **par page**, budget 80/jour, réserve 20. 5 ligues × nombre de pages inconnu : impossible de garantir toutes les statistiques joueurs. Seule une réponse entièrement paginée est publiée ; abandon avant dépassement. Collecte quotidienne facultative ; si une ligue ne tient pas dans le budget, elle reste indisponible. Aucun appel joueur par visiteur.

Données : coût visé **0 €** avec les seules offres gratuites. Hébergement Sites : aucune souscription ajoutée, limites et disponibilité liées au compte ; gratuité illimitée non affirmée. Aucun domaine payant. Stockage D1 croît avec les observations ; prévoir une politique d'archivage avant trafic public important.
