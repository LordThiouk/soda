# Instructions d'initialisation de la base de données Supabase

Ce dossier contient les scripts SQL nécessaires pour initialiser la base de données Supabase utilisée par SODAV Monitor.

## Scripts SQL

Les scripts doivent être exécutés dans l'ordre suivant:

1. `1_create_tables.sql` - Crée toutes les tables de base
2. `2_create_indexes.sql` - Crée les index pour optimiser les performances
3. `3_create_functions_and_triggers.sql` - Crée les fonctions et déclencheurs
4. `4_create_rls_policies.sql` - Configure les politiques Row Level Security
5. `5_sample_data.sql` - Insère des données d'exemple (optionnel, pour le développement uniquement)

## Comment exécuter les scripts

1. Connectez-vous à votre projet Supabase via l'interface web
2. Allez dans la section "SQL Editor"
3. Copiez et collez le contenu de chaque script dans l'éditeur SQL
4. Exécutez les scripts dans l'ordre indiqué ci-dessus

**Note importante**: Le script `5_sample_data.sql` est optionnel et ne devrait pas être exécuté en production.

## Conseils de dépannage

- Si vous rencontrez des erreurs avec les politiques RLS, assurez-vous que l'authentification Supabase est correctement configurée.
- Les triggers peuvent parfois causer des problèmes si les tables sont modifiées sans respecter leurs contraintes.
- Vérifiez les permissions de votre base de données si certaines opérations échouent.

## Modifications post-installation

Après avoir exécuté tous les scripts, assurez-vous de:

1. Créer un utilisateur administrateur dans Supabase Authentication
2. Mettre à jour les variables d'environnement dans le fichier `.env` du backend pour inclure vos identifiants Supabase
3. Mettre à jour les variables d'environnement dans le fichier `.env.local` du frontend pour inclure vos identifiants Supabase publics 