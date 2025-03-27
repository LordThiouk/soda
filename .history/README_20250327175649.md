# SODAV Monitor

Système de monitoring des diffusions pour SODAV (Société Sénégalaise du Droit d'Auteur et des Droits Voisins).

## À propos du projet

SODAV Monitor est une solution de surveillance des diffusions musicales pour les stations de radio et chaînes TV, conçue pour assurer une gestion transparente des droits d'auteur. Le système détecte et enregistre automatiquement les chansons diffusées à la radio, enregistre les temps de diffusion précis avec horodatage, extrait les empreintes audio, récupère et stocke les codes ISRC, et génère des rapports détaillés de diffusion.

## Fonctionnalités principales

- **Détection en temps réel** des chansons diffusées
- **Identification précise** via Acoustid et AudD comme service de secours
- **Suivi des diffusions** avec horodatage exact et durée estimée
- **Gestion des stations** radio et TV avec importation depuis RadioBrowser API
- **Tableaux de bord interactifs** pour la visualisation des données
- **Rapports détaillés** pour la gestion des droits d'auteur

## Structure du projet

Le projet est divisé en deux parties principales :

### Frontend

- Basé sur Next.js 14 (App Router)
- Utilise Tailwind CSS et Shadcn UI pour l'interface
- Fonctionnalités principales :
  - Tableau de bord pour le suivi en temps réel
  - Page des stations pour gérer les flux radio/TV
  - Analyses détaillées avec filtres
  - Rapports pour la gestion des droits d'auteur

### Backend

- API RESTful pour le traitement des données
- Intégration avec Supabase (PostgreSQL)
- Services d'identification musicale (Acoustid, AudD)
- Sécurité avec authentification JWT et gestion des clés API

## Progression du développement

- [x] **Phase 1** : Configuration de l'environnement
- [x] **Phase 2** : Développement du Frontend de base
- [x] **Phase 3** : Développement du Backend
  - [x] API RESTful complète avec mesures de sécurité
  - [x] Services pour l'authentification, la gestion des chaînes, la détection de chansons et la gestion des rapports
  - [x] Suivi précis du temps de diffusion des chansons
  - [x] Intégration avec l'API RadioBrowser pour les stations radio sénégalaises
- [ ] **Phase 4** : Intégration (en cours)
  - [x] Mise à jour des composants UI pour la compatibilité React Day Picker v9
  - [x] Création de la page des stations pour la gestion des flux radio/TV
  - [ ] Connexion des API frontend-backend
  - [ ] Tests d'intégration complets
- [ ] **Phase 5** : Déploiement

## Installation et démarrage

### Prérequis

- Node.js v18+
- NPM ou Yarn

### Installation

1. Cloner le dépôt
   ```
   git clone https://github.com/votre-utilisateur/sodav-monitor.git
   cd sodav-monitor
   ```

2. Installer les dépendances du frontend
   ```
   cd frontend
   npm install
   ```

3. Installer les dépendances du backend
   ```
   cd backend
   npm install
   ```

4. Configurer les variables d'environnement
   - Copier `.env.example` vers `.env.local` dans le dossier frontend
   - Copier `.env.example` vers `.env` dans le dossier backend

### Démarrage

1. Démarrer le backend
   ```
   cd backend
   npm run dev
   ```

2. Démarrer le frontend
   ```
   cd frontend
   npm run dev
   ```

3. Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur

## Licence

© 2025 SODAV. Tous droits réservés. 