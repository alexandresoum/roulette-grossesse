V5.7.3 — CORRECTION RETOUR MODE PRO

Cause corrigée :
l'ancienne logique considérait une PWA/iPhone avec une DDG mémorisée comme une
ouverture patiente, même sans QR.

Nouvelle règle :
- URL avec ?mode=patiente -> Patiente verrouillée.
- Toute URL sans ?mode=patiente -> PIN 1612 -> interface Pro.
- Après PIN correct, l'interface Pro est affichée explicitement.

Conservé sans modification :
- fenêtre Taille / Poids / Croissance
- corrections LCC 10 et 12 SA
- 6 et 8 SA sans libellé tête-fesses/tête-pieds
- toutes les illustrations validées
- QR et verrouillage patiente
