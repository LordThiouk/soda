# Documentation d'implémentation - SODAV Monitor

## Structure générale

Le projet SODAV Monitor est structuré en deux parties principales :

1. **Frontend** : Application Next.js avec App Router
2. **Backend** : API RESTful avec Node.js et Express

## Implémentation du Backend

### Structure des dossiers

```
backend/
├── src/                # Code source principal
│   ├── app.js          # Configuration de l'application Express
│   ├── server.js       # Point d'entrée du serveur
│   ├── config/         # Configuration (base de données, etc.)
│   ├── controllers/    # Contrôleurs pour chaque entité
│   ├── middlewares/    # Middlewares (auth, validation, etc.)
│   ├── models/         # Modèles pour les interactions avec la base de données
│   ├── routes/         # Routes API pour chaque entité
│   ├── services/       # Services (logique métier)
│   ├── utils/          # Utilitaires (helpers, formatters, etc.)
│   └── validations/    # Schémas de validation
└── .env.example        # Variables d'environnement d'exemple
```

### Routes API principales

1. **Routes d'authentification** (`/api/auth/`)
   - `POST /api/auth/register` : Inscription d'un utilisateur
   - `POST /api/auth/login` : Connexion d'un utilisateur
   - `POST /api/auth/logout` : Déconnexion
   - `POST /api/auth/refresh-token` : Rafraîchissement du token

2. **Routes des chaînes** (`/api/channels/`)
   - `GET /api/channels` : Liste de toutes les chaînes
   - `GET /api/channels/{id}` : Détails d'une chaîne
   - `POST /api/channels` : Création d'une chaîne
   - `PUT /api/channels/{id}` : Mise à jour d'une chaîne
   - `DELETE /api/channels/{id}` : Suppression d'une chaîne
   - `POST /api/channels/import/radio` : Importation des stations radio

3. **Routes de détection** (`/api/detection/`)
   - `POST /api/detection/identify` : Identification d'une chanson
   - `POST /api/detection/identify-file` : Identification à partir d'un fichier
   - `GET /api/detection/recent` : Récupération des détections récentes
   - `POST /api/detection/{detection_id}/correction` : Correction d'une détection

4. **Routes des rapports** (`/api/reports/`)
   - `GET /api/reports` : Liste de tous les rapports
   - `GET /api/reports/{id}` : Détails d'un rapport
   - `POST /api/reports` : Génération d'un rapport
   - `DELETE /api/reports/{id}` : Suppression d'un rapport
   - `GET /api/reports/dashboard/stats` : Statistiques pour le tableau de bord

### Sécurité

- Authentification JWT avec rafraîchissement de token
- Middleware pour la vérification des rôles utilisateur
- Middleware pour la vérification des clés API
- Validation des entrées utilisateur avec des schémas de validation

### Services d'identification musicale

Le backend intègre deux services d'identification musicale :

1. **Acoustid** : Service principal d'identification
   - Permet d'identifier une chanson à partir d'une empreinte audio
   - Extraction du code ISRC depuis les métadonnées

2. **AudD** : Service de secours
   - Utilisé lorsque Acoustid ne trouve pas de correspondance
   - Fournit des métadonnées complémentaires

## Implémentation du Frontend

### Structure des dossiers

```
frontend/
├── src/
│   ├── app/                # Structure de routage Next.js
│   │   ├── (auth)/         # Pages protégées par authentification
│   │   │   ├── dashboard/  # Tableau de bord et visualisations
│   │   │   ├── stations/   # Gestion des stations radio/TV
│   │   │   ├── analyses/   # Analyses détaillées
│   │   │   ├── rapports/   # Gestion des rapports
│   │   │   └── parametres/ # Paramètres utilisateur
│   │   ├── login/          # Page de connexion
│   │   └── signup/         # Page d'inscription
│   ├── components/         # Composants réutilisables
│   │   ├── ui/             # Composants UI (buttons, cards, etc.)
│   │   └── ...             # Autres composants spécifiques
│   ├── lib/                # Bibliothèques et utilitaires
│   │   ├── supabaseClient.ts # Client Supabase
│   │   └── utils.ts        # Fonctions utilitaires
│   ├── services/           # Services API pour la communication avec le backend
│   │   ├── apiService.ts   # Service de base pour les appels API
│   │   ├── authService.ts  # Service d'authentification
│   │   ├── stationService.ts # Service pour la gestion des stations
│   │   ├── detectionService.ts # Service pour la détection de chansons
│   │   └── reportService.ts # Service pour la gestion des rapports
│   ├── hooks/              # Hooks personnalisés
│   │   ├── useAuth.ts      # Hook pour la gestion de l'authentification
│   │   └── useApi.ts       # Hook pour les appels API avec gestion d'erreurs
│   └── context/            # Contextes React
│       └── AppContext.tsx  # Contexte global de l'application
└── .env.example            # Variables d'environnement d'exemple
```

### Pages principales

1. **Dashboard** (`/dashboard`)
   - Vue d'ensemble des statistiques
   - Graphiques en temps réel des diffusions
   - Liste des dernières détections

2. **Stations** (`/stations`)
   - Liste des stations radio et TV
   - Filtrage par type (radio/TV) et statut
   - Actions pour tester, modifier ou supprimer des stations
   - Importation des stations radio depuis RadioBrowser API

3. **Analyses** (`/analyses`)
   - Visualisations interactives
   - Filtres par période, station, genre, etc.
   - Exploration détaillée des données de diffusion

4. **Rapports** (`/rapports`)
   - Liste des rapports générés
   - Génération de nouveaux rapports
   - Téléchargement des rapports aux formats PDF, CSV, Excel

### Composants UI

Le frontend utilise Shadcn UI, une collection de composants réutilisables construits avec Radix UI et stylisés avec Tailwind CSS. Les composants principaux incluent :

- **Tableaux de bord** : Cards, graphiques, indicateurs clés
- **Formulaires** : Input, Select, DatePicker, etc.
- **Navigation** : Sidebar, menus, onglets
- **Data Display** : Tables, listes, badges
- **Feedback** : Toast, alerts, modals

### Intégration backend-frontend

L'intégration entre le frontend et le backend est réalisée via :

1. **Services API** : 
   - `apiService.ts` : Service de base pour les appels API avec gestion des erreurs
   - `authService.ts` : Gestion de l'authentification avec Supabase
   - `stationService.ts` : CRUD pour les stations radio/TV
   - `detectionService.ts` : Gestion des détections de chansons
   - `reportService.ts` : Génération et récupération des rapports

2. **Gestion d'état** : 
   - `useAuth` hook pour gérer l'état d'authentification
   - `AppContext` pour l'état global de l'application
   - Intégration de Supabase pour les mises à jour en temps réel

3. **Gestion des erreurs** :
   - Composant `ErrorBoundary` pour la gestion des erreurs React
   - Composant `ApiError` pour afficher les erreurs API
   - Messages d'erreur contextuels dans les formulaires

## Progression du projet

### Phase 1 : Configuration de l'environnement ✅

- Installation et configuration de Node.js
- Initialisation du projet Next.js 14
- Configuration de Supabase

### Phase 2 : Développement du Frontend de base ✅

- Implémentation des composants UI avec Shadcn
- Création des pages principales (dashboard, login, etc.)
- Configuration du routage avec Next.js App Router

### Phase 3 : Développement du Backend ✅

- API RESTful complète avec mesures de sécurité
- Services pour l'authentification, la gestion des chaînes, la détection de chansons et la gestion des rapports
- Suivi précis du temps de diffusion des chansons
- Intégration avec l'API RadioBrowser pour les stations radio sénégalaises
- Implémentation de la validation des codes ISRC

### Phase 4 : Intégration ✅

- Correction des problèmes de compatibilité avec React Day Picker v9
- Création de la page des stations pour la gestion des flux radio/TV
- Implémentation des services API pour la communication frontend-backend :
  - Services API pour chaque fonctionnalité (authentification, stations, détections, rapports)
  - Hooks personnalisés pour la gestion de l'état et des appels API
  - Context API pour le partage d'état entre composants
- Mise en place de la gestion des erreurs API et des retours utilisateur
- Configuration du déploiement et versionning avec Git

## Prochaines étapes (Phase 5 - Déploiement)

- Configurer l'environnement de production
- Mettre en place le CI/CD avec GitHub Actions
- Déployer le frontend sur Vercel
- Configurer les variables d'environnement
- Effectuer des tests de charge
- Finaliser la documentation technique et utilisateur 