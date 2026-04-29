# Planning CC-2A (version 100 % statique)

Application web simple pour **CC-2A Plomberie Chauffage** (Ajaccio), sans npm, sans build, sans dépendance externe obligatoire.

## 1) Ouvrir l'application

1. Télécharger ou cloner le dépôt.
2. Ouvrir directement le fichier `index.html` dans votre navigateur (Chrome, Edge, Firefox, Safari).

Aucune commande n'est nécessaire.

## 2) Utiliser l'application

- **Ajouter une intervention** : bouton `Ajouter intervention`.
- **Modifier / Supprimer** : boutons sur chaque carte intervention.
- **Vue jour / Vue semaine** : boutons `Vue Jour` et `Vue Semaine`.
- **Recherche** : champ texte (client, adresse, type, description).
- **Filtrer par statut** : menu déroulant.
- **Actions rapides** : `Créer devis`, `Créer facture`, `Créer rapport de fuite`, `Terminé`, `À facturer`, `Facturé`, `Payé`.
- **Téléphone cliquable** : lien `tel:`.
- **Adresse cliquable** : ouvre Google Maps.

## 3) Sauvegarde des données

Les interventions sont enregistrées automatiquement dans le navigateur via **localStorage**.

- Si vous fermez/rouvrez le navigateur, les données restent disponibles sur le même appareil/navigateur.
- Pour repartir à zéro, vider le stockage du site dans les paramètres navigateur.

## 4) Exporter / imprimer le planning

- **Exporter CSV** : bouton `Exporter CSV`.
- **Exporter PDF / impression** : bouton `Exporter PDF / Imprimer` (utilise `window.print()` puis “Enregistrer en PDF” du navigateur).

## Fichiers du projet

- `index.html` : structure de l'interface.
- `style.css` : design responsive (bleu nuit, doré, blanc).
- `app.js` : logique métier (CRUD, vues, recherche, filtres, localStorage, CSV, impression).

## Mentions entreprise intégrées

- **CC-2A Plomberie Chauffage**
- **Ajaccio**
- **Téléphone : 06 03 82 81 67**
- Mention facture : **TVA non applicable, article 293 B du CGI**


## Vérification de contenu

- Le fichier `index.html` contient uniquement l'application **Planning CC-2A**.
- Aucun contenu MATLAB/Simulink/Bode/fonction de transfert n'est présent dans le projet.
