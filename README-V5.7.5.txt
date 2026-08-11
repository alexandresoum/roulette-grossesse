V5.7.5 — correction cache/navigation

Le comportement observé (Pro très brièvement puis retour Patiente) était typique
d'une ancienne app.js encore servie par le Service Worker.

Corrections :
- app.js / index.html / style.css passent en NETWORK FIRST.
- nouvelle version du Service Worker avec updateViaCache:none.
- purge des anciens caches roulette-v5 sur navigateur classique.
- QR patient consommé puis URL nettoyée.
- navigateur classique sans QR => PIN 1612 => Pro.
- PWA patiente standalone => reste Patiente.
- aucun changement des illustrations, mesures, croissance ou design.
