À L’OREILLE — BLIND TEST SONORE
==============================

LANCER SUR CE MAC
Double-cliquer sur Lancer.command. Python 3 est nécessaire.
Si macOS refuse de lancer le fichier, ouvrir Terminal dans ce dossier puis :
  python3 serve.py
Le navigateur s’ouvre sur http://localhost:8080.
Ne pas ouvrir directement index.html avec file:// : le stockage hors ligne nécessite un serveur local ou HTTPS.

JOUER
Les réponses sont masquées au démarrage. Cliquer sur un numéro lance une boucle ; recliquer met en pause. Un nouveau son arrête le précédent.
Révéler la réponse dévoile uniquement la carte choisie. « Masquer les réponses » agit sur toute la grille.
« Recommencer » relance au début de l’extrait. La barre de position permet de choisir un moment dans l’extrait : cliquer ou glisser, ou utiliser les flèches du clavier. Déplacer la position en pause conserve la pause.
Barre espace : pause/reprise quand le focus n’est pas sur un contrôle. Échap : arrêt, ou fermeture du panneau de préparation.
Les réponses sont masquées à l’écran, mais ne constituent pas un secret sécurisé : elles restent accessibles dans les fichiers du site.

PRÉPARER
« Préparer les sons » permet de changer les réponses, importer/remplacer un fichier, choisir les bornes en secondes et ajouter des emplacements.
Enregistrer les nouvelles bornes avant d’écouter l’extrait. Les bornes doivent être valides et la fin ne peut dépasser la durée du fichier.
Importer remplace le fichier local de la carte et remet le début à 0 et la fin à 15 secondes maximum. Limite par fichier : 150 Mo.
MP3 et WAV offrent une compatibilité large ; les autres formats dépendent du navigateur.
Les imports et réglages utilisent IndexedDB et restent dans le même navigateur sur la même origine (adresse ET port). Aucun envoi de fichier ni backend.
Le navigateur peut purger ses données. Conserver les originaux ; éviter la navigation privée et ne pas effacer les données du site.

HORS LIGNE / MOBILE
Attendre « Prêt hors ligne » après la première visite : l’interface et les dix fichiers audio intégrés sont en cache.
Ensuite le site peut se recharger et jouer sans réseau, y compris les fichiers importés. Une installation PWA n’est pas obligatoire.
Sur smartphone : héberger le dossier sur HTTPS, le visiter une première fois sur ce smartphone et attendre le message de disponibilité. Les imports du Mac ne se synchronisent pas avec le téléphone.
Pour installer : menu du navigateur « Installer » ou sur iPhone Partager > Sur l’écran d’accueil, selon le navigateur.
Une adresse http://192.168… sur le réseau local ne permet généralement pas le service worker. localhost est admis sur le Mac.
Le cache n’assure pas une conservation illimitée : vérifier le site et tous les sons sur l’appareil de la soirée avant l’événement.

SONS INTÉGRÉS ET LIMITES
10 des 10 emplacements disposent maintenant d’un fichier.
01 Cerf, 02 Clavier, 03 Apnée, 05 2CV, 10 Basketball : fichiers du kit fourni.
04 Thermomix : 13 secondes du moteur (secondes 2 à 15 de l’original), puis dernier passage sonore du fichier de sonnerie. Introduction de ringtone retirée.
06 Cuillère : nouveau véritable enregistrement « Stirring Coffee », Ed Thomas / Echo SFX, téléchargé en WAV et converti en MP3. Passage initial de 15 secondes. Température du café non documentée. Licence Creative Use : usage créatif autorisé, redistribution du fichier sonore seul interdite. Voir https://www.echosfx.com/free-sound-effects-license.
07 Pilates : Orianne Campion, extrait 66,4 à 81,4 secondes, sans le mot Pilates dans la transcription.
08 Tortue : fichier M4A joint par l’organisateur « Funny Turtle Panting meme », converti en MP3. Intégralité de ~11 secondes.
09 Fest-noz : fichier M4A joint « Andro par Fariell au Fest-Noz à Surzur le 17 août 2024 », converti en MP3. Les 15 premières secondes sélectionnées ; les bornes peuvent être modifiées dans Préparer les sons.
Sources et limites de droits détaillées dans sources.json. Le projet local n’a pas été publié ; vérifier les droits des sons avant redistribution publique.

DÉPLOIEMENT STATIQUE
Aucune compilation ni dépendance npm.
Déployer le contenu de ce dossier sur un hébergeur statique HTTPS (GitHub Pages, Netlify, Cloudflare Pages, etc.). index.html doit être à la racine publiée. Le site fonctionne aussi dans un sous-dossier.
Le serveur Python sert seulement à prévisualiser localement. Ne pas exécuter serve.py sur l’hébergement ; les scripts Python et Lancer.command peuvent être exclus de la publication.
Pour ajouter des sons intégrés : modifier tracks.json et copier leurs MP3 dans audio/. Chaque id doit être unique. Ajouter ces chemins au tableau ASSETS de sw.js.
Après une modification de ressource, incrémenter le nom du cache dans sw.js ET app.js. Recharger après activation de la nouvelle version. Les imports IndexedDB ne sont pas remplacés par les mises à jour : ils prennent priorité sur tracks.json.
Ne pas ajouter de CDN ou de ressources distantes si l’on souhaite maintenir le fonctionnement hors ligne.

VÉRIFICATION RÉALISÉE
Syntaxe JavaScript validée. Tous les fichiers audio analysés par ffprobe.
Dans le navigateur : lecture, passage à une autre piste, pause/reprise, extraits de 2 secondes, import, sauvegarde après rechargement, ajout d’un emplacement.
Serveur de test coupé : rechargement de la page, lecture d’un import puis d’un fichier intégré depuis le cache réussis.
Interface et panneau de préparation vérifiés à 390 pixels, sans débordement horizontal.

Ajustement clavier : niveau augmenté de 10 dB, limiteur de pics pour éviter la saturation.
