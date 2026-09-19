# Vérification effectuée

- Compilation de production Worker/Vinext réussie ; TypeScript sans erreurs.
- 10 tests ciblés passent : probabilités/masses, dates Paris/heure été-hiver, zéro/inconnu, identifiants isolés, exclusion des résultats futurs, marge/EV, scénarios minutes, abstention, limites configurables et suivi simulé.
- Migration exécutée sur SQLite/D1 local ; test concurrent : 150 réservations, exactement 80 autorisées.
- Données réellement téléchargées depuis OpenFootball, dix fichiers de saisons ; provenance et date de collecte conservées.
- Interface vue dans Chrome : calendrier réel, favori ajouté puis retrouvé après navigation/rechargement, fiche match calculant les ratios sur les résultats disponibles ; message d'abstention pour début de saison.
- Mise en page contrôlée dans une fenêtre intégrée de largeur 360 px ; largeur de document 345 px (barre de défilement comprise), aucun débordement horizontal. Date, navigation et cartes corrigées après contrôle. Ce contrôle ne remplace pas un test sur un appareil Android physique.
- Source distante inaccessible dans l'aperçu : repli sur instantanés réels observé avec badge Données anciennes. Aucun score ou cote de démonstration ajouté.
- Aucun secret fourni. Les fichiers client ne contiennent ni accès DB ni clé réelle. Code fournisseur importé uniquement par les routes serveur.
- WebMCP facultatif : outil présent dans le code ; contexte modelContext indisponible dans le navigateur de contrôle, donc exécution WebMCP non validée.
- Connecteurs nécessitant une clé : non testés en conditions réelles. Collecte planifiée privée non activée ; voir README.
