# Interface Utilisateur - SODAV Monitor

## Aperçu général

L'interface utilisateur de SODAV Monitor est conçue pour être intuitive, moderne et efficace, permettant aux gestionnaires de droits d'auteur de suivre facilement les diffusions musicales sur les stations de radio et chaînes TV sénégalaises.

## Charte graphique

- **Palette de couleurs** : Inspirée des couleurs du drapeau sénégalais (vert, jaune, rouge) avec une base neutre de bleus et gris pour une apparence professionnelle
- **Typographie** : Police Inter pour une lisibilité optimale
- **Iconographie** : Utilisation des icônes Lucide React pour un style cohérent et moderne

## Pages principales

### 1. Tableau de bord (Dashboard)

![Dashboard](../screenshots/dashboard.png)

Le tableau de bord est la page d'accueil après connexion, offrant :

- **Vue d'ensemble** : Statistiques clés (chansons détectées, stations actives, etc.)
- **Activité récente** : Dernières détections avec horodatage précis
- **Graphiques** : Visualisations des tendances de diffusion
- **Indicateurs de performance** : Taux de détection, stations les plus actives

### 2. Stations

![Stations](../screenshots/stations.png)

La page Stations permet de gérer les sources de diffusion :

- **Liste des stations** : Affichage tabulaire avec filtres (radio/TV, actif/inactif)
- **Informations détaillées** : Nom, URL, bitrate, codec, pays, langue
- **Actions** : Tester, modifier, supprimer une station
- **Import automatique** : Bouton pour importer des stations depuis RadioBrowser API
- **Ajout manuel** : Fonctionnalité pour ajouter une nouvelle station manuellement

### 3. Analyses

![Analyses](../screenshots/analyses.png)

La page Analyses offre des outils puissants pour explorer les données :

- **Filtres avancés** : Par période, station, genre, artiste
- **Visualisations interactives** : Graphiques à barres, circulaires, et linéaires
- **Comparaisons** : Entre stations, périodes ou artistes
- **Tendances** : Évolution des diffusions dans le temps

### 4. Rapports

![Rapports](../screenshots/rapports.png)

La page Rapports permet de générer et gérer des rapports détaillés :

- **Liste des rapports** : Rapports existants avec statut et date
- **Génération** : Interface pour créer de nouveaux rapports avec options personnalisables
- **Prévisualisation** : Aperçu des rapports avant téléchargement
- **Export** : Options pour télécharger au format PDF, CSV ou Excel
- **Programmation** : Configuration de rapports automatiques à intervalles réguliers

### 5. Paramètres

![Paramètres](../screenshots/parametres.png)

La page Paramètres permet de personnaliser l'application :

- **Profil utilisateur** : Gestion des informations personnelles
- **Préférences** : Configuration de l'interface et des notifications
- **Sécurité** : Changement de mot de passe et options d'authentification
- **API** : Gestion des clés API pour intégrations externes
- **Rôles et permissions** : Administration des accès utilisateurs (admin uniquement)

## Composants UI réutilisables

### Navigation

- **Sidebar** : Navigation principale avec icônes et libellés
- **Breadcrumbs** : Navigation hiérarchique pour les pages imbriquées
- **Tabs** : Organisation du contenu en onglets dans les pages complexes

### Affichage des données

- **Tables** : Affichage tabulaire avec tri, filtrage et pagination
- **Cards** : Présentation des informations dans des cartes visuelles
- **Charts** : Graphiques et visualisations dynamiques
- **Timeline** : Historique chronologique des événements

### Formulaires

- **Inputs** : Champs texte, nombres, URL avec validation
- **Select** : Menus déroulants pour choix uniques ou multiples
- **Date Picker** : Sélecteur de date avec plages et préréglages
- **Switches** : Boutons à bascule pour options binaires
- **Checkbox** : Cases à cocher pour sélections multiples

### Feedback

- **Toast** : Notifications temporaires pour actions réussies ou erreurs
- **Modal** : Fenêtres de dialogue pour actions importantes ou confirmations
- **Alerts** : Messages contextuels pour information, avertissement ou erreur
- **Progress** : Indicateurs de progression pour opérations longues

## Responsive Design

L'interface s'adapte automatiquement à différentes tailles d'écran :

- **Desktop** : Layout complet avec sidebar visible et affichage des détails
- **Tablet** : Sidebar rétractable et agencement optimisé pour l'espace disponible
- **Mobile** : Navigation simplifiée avec menu hamburger et vues empilées

## Accessibilité

- Support de la navigation au clavier
- Contrastes de couleurs conformes aux normes WCAG
- Support des lecteurs d'écran avec attributs ARIA
- Focus visibles et messages d'erreur explicites

## Interface administrateur

Les utilisateurs avec le rôle Admin ont accès à des fonctionnalités supplémentaires :

- **Gestion des utilisateurs** : Ajout, modification, désactivation des comptes
- **Logs système** : Suivi des activités et des erreurs
- **Configuration avancée** : Paramètres système et quotas
- **Supervision des API** : Monitoring des appels API et rate limiting

## Captures d'écran

Les captures d'écran seront ajoutées au fur et à mesure du développement dans le dossier `/screenshots`. 