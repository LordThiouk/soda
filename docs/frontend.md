# Documentation Frontend SODAV Monitor

## Structure du Frontend

Le frontend de SODAV Monitor est construit avec Next.js 14 et utilise l'architecture App Router. L'application est structurée de la manière suivante :

```
frontend/
├── public/               # Fichiers statiques (images, etc.)
├── src/
│   ├── app/              # Pages de l'application (App Router)
│   │   ├── (auth)/       # Pages nécessitant authentification
│   │   │   ├── dashboard/
│   │   │   ├── analyses/
│   │   │   ├── rapports/
│   │   │   ├── parametres/
│   │   │   └── layout.tsx
│   │   ├── login/        # Page de connexion
│   │   ├── signup/       # Page d'inscription
│   │   ├── globals.css   # Styles globaux
│   │   ├── layout.tsx    # Layout principal
│   │   └── page.tsx      # Page d'accueil
│   ├── components/       # Composants réutilisables
│   │   ├── ui/           # Composants UI (Shadcn)
│   │   └── Header.tsx    # En-tête de navigation
│   ├── lib/              # Bibliothèques et utilitaires
│   │   └── supabaseClient.ts # Client Supabase
│   └── types/            # Types TypeScript
└── tailwind.config.ts    # Configuration Tailwind CSS
```

## Technologies et Dépendances

- **Next.js 14** : Framework React avec App Router et Server Components
- **TypeScript** : Pour un typage fort et une meilleure maintenabilité
- **Tailwind CSS** : Utilitaire CSS pour le styling rapide et cohérent
- **Shadcn UI** : Composants UI personnalisables basés sur Radix UI
- **Supabase** : Pour l'authentification et l'accès à la base de données
- **React Hook Form** : Gestion des formulaires
- **Lucide React** : Icônes modernes et accessibles

## Thème et Design System

Le design system est inspiré des couleurs du drapeau sénégalais, avec une palette de couleurs comprenant:

- Vert (`--senegal-green: 120 66% 31%`)
- Jaune (`--senegal-yellow: 48 100% 50%`)
- Rouge (`--senegal-red: 0 85% 50%`)

Ces couleurs sont utilisées comme couleurs primaires, secondaires et d'accent dans l'application, à la fois en mode clair et sombre.

### Exemple de configuration des couleurs (Extrait de `globals.css`)

```css
:root {
  /* Base */
  --background: 0 0% 100%;
  --foreground: 210 20% 25%;
  
  /* Senegal Flag Colors */
  --senegal-green: 120 66% 31%; /* Green */
  --senegal-yellow: 48 100% 50%; /* Yellow */
  --senegal-red: 0 85% 50%; /* Red */
  
  /* Primary (Green) */
  --primary: 120 66% 31%;
  --primary-foreground: 0 0% 98%;
  
  /* Secondary (Yellow) */
  --secondary: 48 100% 50%;
  --secondary-foreground: 210 20% 25%;
  
  /* Accent (Red) */
  --accent: 0 85% 50%;
  --accent-foreground: 0 0% 98%;
}
```

## Composants Principaux

### Layout principal (RootLayout)

Le layout principal (`app/layout.tsx`) définit la structure HTML de base et inclut les éléments partagés entre toutes les pages :

```tsx
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SODAV Monitor',
  description: 'Système de surveillance des radios et chaînes TV sénégalaises',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <main className="min-h-screen flex flex-col">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  )
}
```

### Layout pour les pages authentifiées (AuthLayout)

Un layout spécifique (`(auth)/layout.tsx`) est utilisé pour les pages nécessitant une authentification, incluant l'en-tête de navigation et le pied de page :

```tsx
import Header from "@/components/Header";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
      <footer className="border-t border-border bg-muted py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} SODAV Monitor. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
```

### En-tête avec navigation (Header)

Le composant Header gère la navigation principale et est adaptatif pour les appareils mobiles :

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export default function Header() {
  const navItems = [
    { label: "Tableau de bord", href: "/dashboard" },
    { label: "Analyses", href: "/analyses" },
    { label: "Rapports", href: "/rapports" },
    { label: "Paramètres", href: "/parametres" },
  ];

  return (
    <header className="sticky top-0 z-10 w-full border-b border-border bg-card">
      {/* Contenu du header avec navigation */}
    </header>
  );
}
```

## Pages Principales

### Page d'accueil

La page d'accueil présente le système aux visiteurs et offre des options de connexion/inscription.

### Page de connexion

Permet aux utilisateurs de se connecter avec leur email et mot de passe.

### Page de tableau de bord

Affiche les statistiques en temps réel, les tendances de diffusion et les dernières détections.

### Page d'analyses

Permet d'analyser en détail les diffusions par période, chaîne ou artiste.

### Page de rapports

Permet de générer et consulter des rapports personnalisés sur les diffusions.

### Page de paramètres

Configure les différents aspects du système (profil, sources, notifications, système).

## Client Supabase

Le client Supabase (`lib/supabaseClient.ts`) gère la connexion à la base de données et l'authentification :

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fonctions d'authentification
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email, password
  });
  return { data, error };
};

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email, password
  });
  return { data, error };
};

// Fonctions des données utilisateur et abonnements temps réel
// ...
```

## Variables d'environnement

Le projet utilise les variables d'environnement suivantes dans `.env.local` :

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anonyme-supabase

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Services externes
NEXT_PUBLIC_ACOUSTID_API_URL=https://api.acoustid.org/v2
NEXT_PUBLIC_AUDD_API_URL=https://api.audd.io/

# Environnement
NEXT_PUBLIC_APP_ENV=development
```

## Fonctionnalités à implémenter

- **Authentification complète** : Connexion, inscription, réinitialisation de mot de passe
- **Gestion de session** : Persister l'état de connexion
- **Contrôle d'accès** : Restreindre l'accès aux pages selon le rôle de l'utilisateur
- **Validation des formulaires** : Utiliser Zod pour la validation côté client
- **Notifications** : Utiliser le composant Toast pour les messages
- **Graphiques interactifs** : Intégrer une bibliothèque de graphiques pour les visualisations
- **État global** : Gérer l'état global avec React Context ou Redux
- **Tests unitaires** : Implémenter des tests avec Jest et React Testing Library

## Bonnes pratiques

### Performance

- Utiliser les Server Components de Next.js pour les parties statiques
- Optimiser les images avec next/image
- Utiliser la pagination et le chargement différé pour les grandes listes

### Accessibilité

- Utiliser des contrastes appropriés pour le texte
- Assurer que tous les éléments interactifs sont accessibles au clavier
- Fournir des attributs ARIA pour les composants complexes

### Sécurité

- Sanitiser les entrées utilisateurs pour éviter les injections XSS
- Utiliser les jetons JWT correctement pour l'authentification
- Ne jamais stocker de données sensibles dans localStorage

## Déploiement

Le frontend est conçu pour être déployé sur Vercel, qui offre une intégration optimale avec Next.js. Pour déployer :

1. Connecter le dépôt GitHub à Vercel
2. Configurer les variables d'environnement
3. Déployer l'application 