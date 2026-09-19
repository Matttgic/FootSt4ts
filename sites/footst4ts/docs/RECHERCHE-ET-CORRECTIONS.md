# Corrections et recherche — 18 septembre 2026

## Rapidité
- Conservation des résultats en mémoire et dans le stockage de session du navigateur (aucune clé).
- Déduplication des requêtes simultanées. Un changement d’onglet ne recharge pas le calendrier.
- Cache serveur D1 des réponses pendant 5 minutes. Après expiration, dernière copie servie immédiatement et reconstruction en arrière-plan. Les quotas et caches fournisseurs restent applicables.
- Données conservées en cas de panne ; actualisation à la reprise et toutes les 5 minutes lorsque la page est visible. Premier chargement sans cache dépend encore des sources.
- Cotes collectées en arrière-plan, une fois par 24 heures et par championnat. Aucune promesse de direct.

## Sources alternatives vérifiées
| Source | Constat | Décision |
|---|---|---|
| [OpenFootball](https://github.com/openfootball/football.json/blob/master/LICENSE.md) | Licence CC0 autorise extraction et republication | JSON structuré déjà intégré, aucune raison de scraper son HTML |
| [FotMob](https://www.fotmob.com/terms) | Interdit les robots et l’usage systématique automatisé | Aucun scraping |
| [SofaScore](https://www.sofascore.com/terms-and-conditions) | La page récupérée ne fournit pas d’autorisation exploitable de republication | Pas d’intégration sans autorisation |
| [Sports Reference](https://www.sports-reference.com/data_use.html) | Conditions non accessibles pendant cette vérification (403) | Pas d’autorisation présumée pour FBref |
| [Football-data.co.uk](https://www.football-data.co.uk/) | Accès limité (429), conditions non vérifiables pendant cette session | Aucune tentative de contournement ou intégration |
| [StatsBomb Open Data](https://github.com/hudl/open-data) | Données de certaines compétitions, destinées à la recherche avec attribution ; pas un calendrier mondial actuel | Ne remplace pas les statistiques des joueurs du jour |
| [football-data.org scorers](https://docs.football-data.org/general/v4/competition.html) | Endpoint officiel buts/passes/pénalties documenté ; accès gratuit à vérifier avec la clé réelle | Connecteur de secours top 20, champs absents à null, saison explicite |

La collecte de pages n’améliore pas mécaniquement la vitesse : le cache évite de demander les mêmes données à chaque visiteur. Aucune nouvelle source sans autorisation n’a été ajoutée.

## Modèle et explications
Poisson v2 utilise au maximum 365 jours. La saison précédente est utilisable uniquement avec les identifiants stables football-data.org ; aucune jointure d’équipe inter-saisons fondée uniquement sur un nom. Les buts et les paramètres restent ceux du modèle simple. Cette extension aide en début de saison mais ne constitue pas une preuve d’amélioration prédictive.

L’interface explique Brier (multiclasse, somme de 3 erreurs au carré), log loss, calibration, échantillon, rendement et drawdown. Référence uniforme et référence aux fréquences passées du championnat. Intervalle Brier indicatif par bootstrap de dates (500 répétitions reproductibles). Le test 2025/26 n’évalue pas à lui seul le transfert entre saisons : prudence supplémentaire pour le modèle glissant. Aucun ajustement sur le test.

Les analyses détaillent probabilité, cote théorique, cote réelle fraîche et espérance brute, sans transformer les résultats en recommandations validées. Les marchés joueurs restent indisponibles sans données de minutes et de participation fiables.

## Budget supplémentaire
Le connecteur compact buteurs demande au maximum 5 appels football-data.org/jour pour les 5 championnats, sans pagination (limite demandée : 20). Si ce fournisseur refuse les données, repli sur 5 appels API-Football topscorers/jour, sous le budget global 80. Les échecs ont un cache de 15 minutes et restent soumis aux budgets ; les refus de couverture ne déclenchent aucun paiement. Le connecteur exhaustif ancien reste disponible uniquement par la tâche de collecte protégée ; l’interface utilise le connecteur compact.
