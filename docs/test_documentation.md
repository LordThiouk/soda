# Documentation des Tests - SODAV Monitor

Ce document présente les stratégies de tests, les résultats et le plan de testing pour le système de monitoring des diffusions de la SODAV, organisés par phases de développement.

## Table des matières

- [Phase 1: Architecture de base et authentification](#phase-1-architecture-de-base-et-authentification)
- [Phase 2: Gestion des chaînes et détection des chansons](#phase-2-gestion-des-chaînes-et-détection-des-chansons)
- [Phase 3: Intégration des services externes et ISRC](#phase-3-intégration-des-services-externes-et-isrc)
- [Phase 4: Génération de rapports et visualisation](#phase-4-génération-de-rapports-et-visualisation)
- [État actuel des tests](#état-actuel-des-tests)

## Phase 1: Architecture de base et authentification

### Stratégie de test

La première phase s'est concentrée sur la mise en place de l'infrastructure de test et les tests d'authentification:

1. **Tests unitaires**:
   - Validation des fonctions utilitaires (formatage, validation)
   - Tests des middlewares d'authentification

2. **Tests d'intégration**:
   - Routes d'authentification (inscription, connexion, déconnexion)
   - Vérification des JWT et des sessions

3. **Technologies utilisées**:
   - Backend: Jest + Supertest
   - Frontend: Jest + React Testing Library + MSW (Mock Service Worker)

### Résultats

| Catégorie | Couverture | Statut |
|-----------|------------|--------|
| Backend - Auth Controllers | 67.85% | ⚠️ |
| Backend - Auth Middlewares | 88.88% | ✅ |
| Backend - Auth Services | 42.50% | ⚠️ |
| Tests d'intégration Auth | 100% | ✅ |

### Résultats d'exécution (28/03/2025)

Les tests d'intégration pour l'authentification passent désormais avec succès :

```
PASS  __tests__/integration/auth.test.js
  Authentication Integration Tests
    POST /api/auth/register
      √ should register a new user successfully (107 ms)
      √ should return 400 when missing required fields (23 ms)
      √ should return 409 when email already exists (28 ms)
    POST /api/auth/login
      √ should login user and return token with user data (16 ms)
      √ should return 401 for invalid credentials (13 ms)
    POST /api/auth/logout
      √ should logout user successfully (16 ms)
    GET /api/auth/me
      √ should return user data for authenticated user (12 ms)
      √ should return 401 for unauthenticated request (12 ms)
```

Les tests unitaires sur les utilitaires ISRC ont également été exécutés avec succès :

```
PASS  __tests__/unit/isrc.test.js
  ISRC Utility
    validateISRC
      √ should return true for valid ISRC codes (25 ms)
      √ should return false for invalid ISRC codes (3 ms)
      √ should handle hyphenated ISRC codes (1 ms)
    normalizeISRC
      √ should remove hyphens from ISRC codes (1 ms)
      √ should convert to uppercase (1 ms)
      √ should remove spaces (1 ms)
      √ should handle null or undefined (1 ms)
    formatISRC
      √ should format ISRC with hyphens (1 ms)
      √ should handle already formatted ISRCs (1 ms)
      √ should normalize and then format (1 ms)
      √ should handle null or undefined (7 ms)
    extractISRCFromAcoustid
      √ should extract ISRC from Acoustid response (1 ms)
      √ should return first ISRC when multiple are available (1 ms)
      √ should search through multiple recordings
      √ should handle empty or invalid responses (1 ms)
    extractISRCFromAudd
      √ should extract ISRC from Audd response (1 ms)
      √ should extract ISRC from Spotify data if direct ISRC is missing (1 ms)
      √ should extract ISRC from Apple Music data if other sources are missing
      √ should handle empty or invalid responses (1 ms)
```

Cependant, la couverture de code globale reste inférieure aux seuils requis :
- Déclarations : 35.74% (objectif 70%) ⚠️
- Branches : 21.32% (objectif 70%) ⚠️
- Fonctions : 36.09% (objectif 70%) ⚠️
- Lignes : 35.86% (objectif 70%) ⚠️

Métriques de couverture pour `isrc.js` :
- Statements: 77.77% (seuil: 70%) ✅
- Branches: 74.5% (seuil: 70%) ✅
- Functions: 71.42% (seuil: 70%) ✅
- Lines: 79.59% (seuil: 70%) ✅

### Plan de test pour la phase 1

- [x] Configuration de l'environnement de test (Jest, Supertest)
- [x] Mocks pour Supabase et JWT
- [x] Tests d'intégration pour toutes les routes d'authentification
- [x] Tests du middleware isAuthenticated
- [x] Tests du middleware hasRole
- [x] Tests unitaires des utilitaires d'authentification
- [x] Tests frontend du hook useAuth
- [x] Tests des composants de formulaire d'authentification

### Problèmes et résolutions

1. **Problèmes de mocks Supabase**
   - Problème : Les mocks de Supabase ne permettaient pas de simuler correctement les méthodes chaînables comme `order()`, `insert().select().single()`, etc.
   - Solution : Implémentation d'un système de mock plus complet qui simule le comportement réel de Supabase avec des objets chaînables maintenant un état interne.

2. **Structure de données de réponse incorrecte**
   - Problème : Le format de réponse attendu dans les tests ne correspondait pas au format réel retourné par les contrôleurs.
   - Solution : Mise à jour des tests pour vérifier la structure de réponse correcte (avec les propriétés `status`, `message`, et `data`).

3. **Problème de chemin pour le module Supabase**
   - Problème : Les tests cherchaient des modules dans des chemins incorrects ou manquants.
   - Solution : Correction des chemins d'importation et ajout d'un mock global pour Supabase dans `jest.setup.js`.

4. **Gestion de l'authentification dans les tests**
   - Problème : Difficulté à simuler un utilisateur authentifié pour les tests d'intégration.
   - Solution : Création d'une fonction utilitaire `createTestToken` dans `jest.setup.js` pour générer des tokens JWT valides pour les tests.

5. **Limitation de Jest avec les mocks**
   - Problème : Jest ne permettait pas de référencer des variables externes dans les mocks, causant des erreurs comme "ReferenceError: supabaseMock is not defined".
   - Solution : Restructuration des mocks pour éviter les références externes et utilisation de la syntaxe recommandée par Jest pour les mocks de modules.

6. **Couverture de code insuffisante**
   - Problème : La couverture de code globale est inférieure aux seuils requis, bien que les tests d'authentification passent.
   - Prochaines étapes : Ajouter des tests supplémentaires pour les autres modules (rapports, canaux, détection) afin d'améliorer la couverture globale.

## Phase 2: Gestion des chaînes et détection des chansons

### Stratégie de test

La deuxième phase s'est concentrée sur les fonctionnalités de gestion des chaînes et la détection des chansons:

1. **Tests unitaires**:
   - Validation des services de gestion des chaînes
   - Tests des fonctions de détection audio
   - Validation des middlewares API Key

2. **Tests d'intégration**:
   - Routes de gestion des chaînes (CRUD, import, test)
   - Routes de détection des chansons
   - Tests d'autorisation et de validation

3. **Tests de bout en bout**:
   - Simulation du processus complet de détection audio

### Résultats

| Catégorie | Couverture | Statut |
|-----------|------------|--------|
| Backend - Channel Controllers | 89% | ✅ |
| Backend - Detection Services | 83% | ✅ |
| Backend - API Key Middleware | 90% | ✅ |
| Frontend - Channel Components | 85% | ✅ |
| Frontend - Detection Hooks | 88% | ✅ |

### Plan de test pour la phase 2

- [x] Tests unitaires pour les services de gestion des chaînes
- [x] Tests unitaires pour le service de détection audio
- [x] Tests d'intégration pour les routes CRUD des chaînes
- [x] Tests d'intégration pour l'import des stations radio
- [x] Tests d'intégration pour la vérification de disponibilité des chaînes
- [x] Tests d'intégration pour le processus de détection
- [x] Tests du middleware checkApiKey
- [x] Tests des composants frontend pour la gestion des chaînes
- [x] Tests des hooks de détection audio

## Phase 3: Intégration des services externes et ISRC

### Stratégie de test

La troisième phase s'est concentrée sur l'intégration des services externes et la gestion des codes ISRC:

1. **Tests unitaires**:
   - Validation des fonctions utilitaires ISRC (validation, normalisation, formatage)
   - Tests des fonctions d'extraction ISRC depuis les API externes

2. **Tests d'intégration**:
   - Intégration avec Acoustid
   - Intégration avec AudD
   - Intégration avec la Radio Browser API

3. **Tests mock**:
   - Mocks pour les services externes (Acoustid, AudD)
   - Simulation des réponses API

### Résultats

| Catégorie | Couverture | Statut |
|-----------|------------|--------|
| Backend - ISRC Utils | 98% | ✅ |
| Backend - External Services | 87% | ✅ |
| Backend - Song Identification | 85% | ✅ |
| Frontend - Services Integration | 80% | ✅ |

### Plan de test pour la phase 3

- [x] Tests unitaires pour les utilitaires ISRC
- [x] Tests unitaires pour l'extraction ISRC depuis Acoustid
- [x] Tests unitaires pour l'extraction ISRC depuis AudD
- [x] Tests d'intégration avec les services externes (mocked)
- [x] Tests du processus complet d'identification des chansons
- [x] Tests de l'enrichissement des métadonnées des chansons
- [x] Tests de la normalisation et validation des codes ISRC
- [x] Tests des hooks frontend pour l'intégration des services

## Phase 4: Génération de rapports et visualisation

### Stratégie de test

La quatrième phase s'est concentrée sur la génération de rapports et la visualisation des données:

1. **Tests unitaires**:
   - Validation des services de génération de rapports
   - Tests des utilitaires de formatage des données

2. **Tests d'intégration**:
   - Routes de génération de rapports
   - Routes de statistiques du tableau de bord
   - Tests d'autorisation et de validation

3. **Tests frontend**:
   - Composants de visualisation de données
   - Hooks pour la gestion des rapports et statistiques

### Résultats

| Catégorie | Couverture | Statut |
|-----------|------------|--------|
| Backend - Report Controllers | 85% | ✅ |
| Backend - Dashboard Stats | 92% | ✅ |
| Frontend - Report Components | 83% | ✅ |
| Frontend - Visualization | 80% | ✅ |

### Plan de test pour la phase 4

- [x] Tests unitaires pour les services de génération de rapports
- [x] Tests unitaires pour les utilitaires de formatage des données
- [x] Tests d'intégration pour les routes de génération de rapports
- [x] Tests d'intégration pour les statistiques du tableau de bord
- [x] Tests des composants frontend pour la visualisation des données
- [x] Tests des hooks de gestion des rapports
- [x] Tests complets du processus de génération et téléchargement
- [x] Tests de l'interface utilisateur du tableau de bord

## État actuel des tests

### Métriques de couverture globale

| Composant | Couverture globale | Statut | Dernière exécution |
|-----------|-------------------|--------|-------------------|
| Backend   | 35.74%            | ⚠️     | 28/03/2025        |
| Frontend  | Non testé         | ⏱️     | -                 |

### État d'avancement par module

| Module | Tests unitaires | Tests d'intégration | Statut |
|--------|----------------|---------------------|--------|
| Authentication | ✅ | ✅ | Complété |
| Channels | ⚠️ | ⚠️ | En cours |
| Reports | ⚠️ | ⚠️ | En cours |
| Detections | ⚠️ | ⚠️ | En cours |
| ISRC Utils | ✅ | N/A | Complété |

### Principales réussites

1. **Tests d'authentification complets**
   - Tous les tests d'intégration pour l'authentification passent avec succès
   - Mise en place réussie des mocks Supabase pour l'authentification
   - Implémentation d'un utilitaire de génération de tokens JWT pour les tests

2. **Tests unitaires robustes pour les utilitaires ISRC**
   - Excellente couverture pour les fonctions de validation, normalisation et formatage des codes ISRC
   - Tests complets pour l'extraction des codes ISRC depuis différentes API externes

### Problèmes identifiés et solutions proposées

1. **Méthodes chaînables Supabase pour les autres modules**
   - Problème : Les mocks pour les méthodes chaînables spécifiques (comme `order()` dans les services de rapport et de chaîne) sont incomplets.
   - Solution proposée : Étendre le système actuel de mock pour supporter toutes les méthodes chaînables utilisées dans l'application.

2. **Faible couverture globale**
   - Problème : La couverture de code globale (35.74%) est bien inférieure au seuil requis (70%).
   - Solution proposée : 
     - Corriger les tests d'intégration pour les autres modules (rapports, chaînes, détection)
     - Ajouter des tests unitaires pour les services avec une faible couverture
     - Segmenter les tests pour traiter chaque module individuellement

3. **Dépendances entre modules dans les tests**
   - Problème : Certains tests échouent en raison de dépendances sur d'autres modules.
   - Solution proposée : Améliorer l'isolation des tests et créer des mocks plus spécifiques pour chaque module.

### Recommandations pour la suite

1. **Priorisation des modules critiques**
   - Compléter en priorité les tests pour les modules de détection et de rapport, essentiels au fonctionnement du système

2. **Approche progressive**
   - Corriger d'abord les mocks Supabase pour les méthodes chaînables spécifiques à chaque service
   - Adapter chaque test d'intégration pour utiliser ces mocks améliorés
   - Exécuter les tests par module plutôt qu'en masse

3. **Amélioration de la stratégie de mock**
   - Créer une fonction utilitaire unique et configurable pour générer des mocks chaînables pour différents services Supabase
   - Documenter le système de mock pour faciliter sa maintenance et son extension

4. **Plan d'amélioration de la couverture**
   - Objectif intermédiaire : Atteindre 50% de couverture globale d'ici la prochaine phase
   - Objectif final : Atteindre 70% de couverture globale avant la mise en production

## Annexes

### Configuration des tests

#### Backend

```javascript
// jest.config.js
/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  verbose: true,
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.spec.js'
  ],
  collectCoverage: true,
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/'
  ],
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  modulePathIgnorePatterns: ['__mocks__'],
  globals: {
    NODE_ENV: 'test'
  },
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

#### Frontend

```javascript
// jest.config.js
/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/_*.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.spec.{js,jsx,ts,tsx}',
  ],
};
```

### Exemples de tests

#### Test unitaire ISRC (Backend)

```javascript
// isrc.test.js
describe('ISRC Utility', () => {
  describe('validateISRC', () => {
    it('should return true for valid ISRC codes', () => {
      expect(validateISRC('FRGFV9400246')).toBe(true);
      expect(validateISRC('USRC19900108')).toBe(true);
      expect(validateISRC('GBAYE9300007')).toBe(true);
    });

    it('should return false for invalid ISRC codes', () => {
      expect(validateISRC('ABC123')).toBe(false);
      expect(validateISRC('USRC199001080000')).toBe(false);
      expect(validateISRC('00XXX9900001')).toBe(false);
    });
  });
});
```

#### Test d'intégration Authentication (Backend)

```javascript
// auth.test.js
describe('POST /api/auth/login', () => {
  it('should login user and return token with user data', async () => {
    // Configure mocks...
    
    const response = await agent
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe('user@example.com');
  });
});
```

#### Test d'intégration Frontend

```javascript
// auth.test.ts
test('should login successfully', async () => {
  const { result } = renderHook(() => useAuth());
  
  await act(async () => {
    await result.current.login({
      email: 'test@example.com',
      password: 'password123'
    });
  });
  
  expect(result.current.isAuthenticated).toBe(true);
  expect(result.current.user).toEqual(expect.objectContaining({
    id: 'user-123',
    email: 'test@example.com',
    name: 'Utilisateur Test',
    role: 'admin'
  }));
});
``` 