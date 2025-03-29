# Guide d'initialisation manuelle de la base de données Supabase pour SODAV Monitor

Ce guide vous explique comment initialiser manuellement la base de données Supabase pour le projet SODAV Monitor en utilisant l'interface d'administration de Supabase.

## Prérequis

- Un compte Supabase (inscription gratuite sur [supabase.com](https://supabase.com))
- Les fichiers SQL situés dans le dossier `backend/db` du projet

## Étapes d'initialisation

### 1. Connexion à Supabase

1. Connectez-vous à votre compte Supabase sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet SODAV Monitor (ou créez-en un nouveau si nécessaire)

### 2. Accéder à l'éditeur SQL

1. Dans le menu de gauche, cliquez sur **SQL Editor**
2. Créez un nouveau script SQL en cliquant sur **New Query**

### 3. Exécuter les scripts SQL dans l'ordre

Les scripts doivent être exécutés dans cet ordre précis:

#### 3.1. Créer les tables (`1_create_tables.sql`)

1. Ouvrez le fichier `backend/db/1_create_tables.sql`
2. Copiez tout le contenu du fichier
3. Collez-le dans l'éditeur SQL de Supabase
4. Cliquez sur **Run** pour exécuter le script
5. Vérifiez qu'aucune erreur n'est signalée

#### 3.2. Créer les index (`2_create_indexes.sql`)

1. Ouvrez le fichier `backend/db/2_create_indexes.sql`
2. Copiez tout le contenu du fichier
3. Collez-le dans l'éditeur SQL de Supabase (créez un nouveau script si nécessaire)
4. Cliquez sur **Run** pour exécuter le script
5. Vérifiez qu'aucune erreur n'est signalée

#### 3.3. Créer les fonctions et les triggers (`3_create_functions_and_triggers.sql`)

1. Ouvrez le fichier `backend/db/3_create_functions_and_triggers.sql`
2. Copiez tout le contenu du fichier
3. Collez-le dans l'éditeur SQL de Supabase (créez un nouveau script si nécessaire)
4. Cliquez sur **Run** pour exécuter le script
5. Vérifiez qu'aucune erreur n'est signalée

#### 3.4. Configurer les politiques de sécurité RLS (`4_create_rls_policies.sql`)

1. Ouvrez le fichier `backend/db/4_create_rls_policies.sql`
2. Copiez tout le contenu du fichier
3. Collez-le dans l'éditeur SQL de Supabase (créez un nouveau script si nécessaire)
4. Cliquez sur **Run** pour exécuter le script
5. Vérifiez qu'aucune erreur n'est signalée

### 4. Création du premier utilisateur administrateur

Vous pouvez créer le premier utilisateur administrateur via l'interface de Supabase:

1. Dans le menu de gauche, cliquez sur **Authentication**
2. Cliquez sur **Users**
3. Cliquez sur **Add User**
4. Remplissez les informations (email, mot de passe, etc.)
5. Après avoir créé l'utilisateur, notez son UUID
6. Allez dans l'éditeur SQL et exécutez la requête suivante pour le définir comme administrateur:

```sql
INSERT INTO public.users (id, email, full_name, role, is_active)
VALUES 
('UUID-DE-L-UTILISATEUR', 'email@exemple.com', 'Administrateur', 'admin', true);
```

Remplacez `UUID-DE-L-UTILISATEUR` par l'UUID de l'utilisateur que vous venez de créer et `email@exemple.com` par son email.

### 5. Vérification de l'initialisation

Pour vérifier que votre base de données a été correctement initialisée:

1. Dans le menu de gauche, cliquez sur **Table Editor**
2. Vous devriez voir toutes les tables créées (users, songs, channels, etc.)
3. Vérifiez que l'utilisateur administrateur apparaît dans la table `users`

## Problèmes courants

### Erreur lors de la création des tables

Si vous rencontrez des erreurs lors de la création des tables:
- Vérifiez que vous avez les permissions suffisantes (rôle service_role)
- Vérifiez qu'aucune des tables n'existe déjà (dans ce cas, ajoutez `DROP TABLE IF EXISTS` au début du script)

### Erreur avec les références aux tables auth.*

Si vous rencontrez des erreurs avec les références à `auth.users`:
- Vérifiez que votre projet Supabase a bien l'authentification activée
- Dans certains cas, vous devrez peut-être ajuster la référence ou créer une vue qui expose les données nécessaires

### Erreur avec les politiques RLS

Si vous rencontrez des erreurs avec les politiques RLS:
- Vérifiez que les tables existent toutes avant de créer les politiques
- Assurez-vous que toutes les fonctions référencées dans les politiques ont été créées

## Configuration des variables d'environnement

Après avoir initialisé la base de données, vous devrez configurer les variables d'environnement de votre application:

1. Dans le menu de gauche de Supabase, cliquez sur **Project Settings**
2. Cliquez sur **API**
3. Notez l'URL du projet et la clé API (anon key et service_role key)
4. Configurez ces valeurs dans votre fichier `.env` du projet:

```
NEXT_PUBLIC_SUPABASE_URL=votre-url-projet
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
SUPABASE_SERVICE_ROLE_KEY=votre-clé-service-role
``` 