# Documentation Backend SODAV Monitor

## Structure du Backend

Le backend de SODAV Monitor est conçu pour être robuste, évolutif et rapide, reposant sur une architecture moderne avec les éléments suivants :

- **Supabase** : Plateforme backend tout-en-un fournissant base de données PostgreSQL, authentification, et plus
- **API RESTful** : Pour la communication avec le frontend et les intégrations externes
- **Services de reconnaissance audio** : Utilisation d'Acoustid et Audd pour l'identification des morceaux

## Configuration de la Base de Données

### Schéma principal

```sql
-- Table des utilisateurs
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  organization TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des chansons
CREATE TABLE songs (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  isrc TEXT UNIQUE,
  fingerprint TEXT UNIQUE,
  duration INTEGER,
  release_year INTEGER,
  genre TEXT,
  album_art_url TEXT,
  musicbrainz_id TEXT,  -- ID MusicBrainz pour référence externe
  spotify_id TEXT,      -- ID Spotify pour référence externe
  metadata JSONB,       -- Autres métadonnées (sources, IDs externes, scores)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des stations
CREATE TABLE channels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('radio', 'tv')), -- radio ou tv
  url TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  country TEXT DEFAULT 'Sénégal',
  language TEXT DEFAULT 'Français',
  homepage TEXT,
  bitrate INTEGER,
  codec TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'testing')),
  metadata JSONB,  -- Données supplémentaires (géolocalisation, tags, clics, votes, etc.)
  last_check_status BOOLEAN, -- Résultat du dernier test de disponibilité
  last_check_time TIMESTAMP WITH TIME ZONE, -- Date du dernier test
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des diffusions (airplay)
CREATE TABLE airplay_logs (
  id SERIAL PRIMARY KEY,
  song_id INTEGER REFERENCES songs(id),
  channel_id INTEGER REFERENCES channels(id),
  play_timestamp TIMESTAMP WITH TIME ZONE NOT NULL, -- Heure de début de diffusion
  end_timestamp TIMESTAMP WITH TIME ZONE, -- Heure de fin de diffusion (calculée)
  duration INTEGER, -- durée de diffusion en secondes
  playback_position FLOAT, -- position de l'échantillon dans la chanson en secondes
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL, -- moment exact de la détection
  confidence FLOAT, -- niveau de confiance de la détection (0-100)
  fingerprint_data JSONB, -- données brutes du fingerprint
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des corrections manuelles
CREATE TABLE manual_corrections (
  id SERIAL PRIMARY KEY,
  airplay_log_id INTEGER REFERENCES airplay_logs(id),
  corrected_song_id INTEGER REFERENCES songs(id),
  correction_reason TEXT,
  corrected_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table pour la gestion des API keys
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  key TEXT UNIQUE NOT NULL,
  permissions JSONB,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);
```

### Indexation et Optimisation

```sql
-- Indexation pour les requêtes fréquentes
CREATE INDEX idx_songs_artist ON songs(artist);
CREATE INDEX idx_songs_title ON songs(title);
CREATE INDEX idx_songs_fingerprint ON songs(fingerprint);
CREATE INDEX idx_songs_isrc ON songs(isrc);

CREATE INDEX idx_airplay_logs_timestamp ON airplay_logs(play_timestamp);
CREATE INDEX idx_airplay_logs_channel ON airplay_logs(channel_id);
CREATE INDEX idx_airplay_logs_song ON airplay_logs(song_id);

-- Politique d'accès aux tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE airplay_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Politique pour les utilisateurs
CREATE POLICY "Public users are viewable by all users"
  ON users FOR SELECT
  USING (true);

-- Politique pour les administrateurs
CREATE POLICY "Only admins can insert/update/delete"
  ON users FOR ALL
  USING (auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  ));
```

## Endpoints API

Le backend expose les endpoints API suivants:

### Authentification

- `POST /api/auth/register` - Enregistrement d'un nouvel utilisateur
- `POST /api/auth/login` - Connexion d'un utilisateur
- `POST /api/auth/logout` - Déconnexion d'un utilisateur
- `POST /api/auth/reset-password` - Réinitialisation du mot de passe

### Stations (Chaînes)

- `GET /api/channels` - Récupérer toutes les stations
- `GET /api/channels/:id` - Récupérer une station spécifique
- `POST /api/channels` - Ajouter une nouvelle station
- `PUT /api/channels/:id` - Mettre à jour une station
- `DELETE /api/channels/:id` - Supprimer une station

### Détection Audio

- `POST /api/detection` - Soumettre un échantillon audio pour détection
- `GET /api/detection/status/:id` - Vérifier l'état d'une détection en cours

### Diffusions (Airplay)

- `GET /api/airplay` - Récupérer l'historique des diffusions
- `GET /api/airplay/recent` - Récupérer les diffusions récentes
- `GET /api/airplay/statistics` - Obtenir des statistiques globales
- `POST /api/airplay/correction` - Soumettre une correction manuelle

### Rapports

- `GET /api/reports` - Liste des rapports disponibles
- `POST /api/reports/generate` - Générer un nouveau rapport
- `GET /api/reports/:id` - Obtenir un rapport spécifique
- `GET /api/reports/:id/download` - Télécharger un rapport (PDF, Excel, CSV)

## Intégrations Externes

### Acoustid

L'intégration avec Acoustid est utilisée comme premier choix pour l'identification des morceaux musicaux:

```python
import requests

def identify_with_acoustid(fingerprint, duration):
    api_key = "your_acoustid_api_key"
    url = "https://api.acoustid.org/v2/lookup"
    
    params = {
        "client": api_key,
        "meta": "recordings releasegroups",
        "fingerprint": fingerprint,
        "duration": duration
    }
    
    response = requests.get(url, params=params)
    return response.json()
```

### Audd

Audd est utilisé comme solution de secours si Acoustid ne donne pas de résultats satisfaisants:

```python
import requests

def identify_with_audd(audio_file):
    api_token = "your_audd_api_token"
    url = "https://api.audd.io/"
    
    files = {
        'file': open(audio_file, 'rb'),
    }
    
    data = {
        'api_token': api_token,
        'return': 'spotify,apple_music,deezer'
    }
    
    response = requests.post(url, files=files, data=data)
    return response.json()
```

### RadioBrowser API

Pour obtenir des informations sur les stations de radio sénégalaises:

```python
import requests

def get_senegalese_stations():
    url = "https://nl1.api.radio-browser.info/json/stations/bycountry/senegal"
    
    response = requests.get(url, headers={'User-Agent': 'SODAV-Monitor/1.0'})
    return response.json()
```

## Implémentation de la Sécurité

### Protection des Endpoints

```python
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import APIKeyHeader
from supabase import create_client, Client

api_key_header = APIKeyHeader(name="X-API-Key")

async def get_api_key(api_key: str = Depends(api_key_header)):
    # Vérifier l'API key dans la base de données
    supabase: Client = create_client(supabase_url, supabase_key)
    response = supabase.table("api_keys").select("*").eq("key", api_key).eq("active", True).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired API Key",
        )
    return response.data[0]

app = FastAPI()

@app.get("/api/secure-endpoint", dependencies=[Depends(get_api_key)])
async def secure_endpoint():
    return {"message": "You have access to this secure endpoint"}
```

### Limitation de Débit (Rate Limiting)

```python
from fastapi import FastAPI, Depends, HTTPException, status
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/limited-endpoint")
@limiter.limit("5/minute")
async def limited_endpoint(request):
    return {"message": "This endpoint is rate-limited"}
```

## Déploiement

Le backend peut être déployé de différentes manières:

1. **Supabase** pour la base de données et l'authentification
2. **Vercel** ou **Netlify** pour les fonctions serverless
3. **Docker** pour un déploiement conteneurisé
4. **AWS** pour un hébergement cloud scalable

## Monitoring et Logging

Pour assurer le bon fonctionnement du système, nous utilisons:

- **Sentry** pour la surveillance des erreurs
- **Prometheus** pour les métriques de performance
- **Grafana** pour la visualisation des métriques
- **CloudWatch** (AWS) ou équivalent pour les logs centralisés

## Prochaines Étapes

- Implémentation des webhooks pour les intégrations externes
- Mise en place d'un système de file d'attente pour traiter les échantillons audio
- Création d'un système de cache pour améliorer les performances
- Mise en place de tests unitaires et d'intégration

## Modifications et mises à jour du schéma

Suite à la phase 3 de développement, nous avons amélioré plusieurs tables pour optimiser le suivi du temps de jeu des morceaux et la gestion des codes ISRC.

### Table des chansons (songs) améliorée

```sql
-- Table des chansons
CREATE TABLE songs (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  isrc TEXT UNIQUE,
  fingerprint TEXT UNIQUE,
  duration INTEGER, -- durée en secondes
  release_year INTEGER,
  genre TEXT,
  album_art_url TEXT,
  musicbrainz_id TEXT,  -- ID MusicBrainz pour référence externe
  spotify_id TEXT,      -- ID Spotify pour référence externe
  metadata JSONB,       -- Autres métadonnées (sources, IDs externes, scores)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Nouvelles fonctionnalités

### Utilitaire de validation des codes ISRC

Nous avons développé un module utilitaire pour valider et normaliser les codes ISRC:

```javascript
/**
 * Utilitaire pour la gestion des codes ISRC
 * (International Standard Recording Code)
 */

// Valide un code ISRC
const validateISRC = (isrc) => {
  if (!isrc) return false;
  
  // Supprimer les tirets et espaces
  const cleanIsrc = isrc.replace(/[-\s]/g, '');
  
  // Vérifier la longueur
  if (cleanIsrc.length !== 12) {
    return false;
  }
  
  // Vérifier le format (2 lettres, 3 caractères, 7 chiffres)
  const isrcRegex = /^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/;
  return isrcRegex.test(cleanIsrc);
};

// Normalise un code ISRC
const normalizeISRC = (isrc) => {
  if (!isrc) return null;
  return isrc.replace(/[-\s]/g, '').toUpperCase();
};

// Formate un code ISRC pour l'affichage (avec tirets)
const formatISRC = (isrc) => {
  if (!isrc) return null;
  const normalizedIsrc = normalizeISRC(isrc);
  if (!validateISRC(normalizedIsrc)) return isrc;
  return `${normalizedIsrc.substring(0, 2)}-${normalizedIsrc.substring(2, 5)}-${normalizedIsrc.substring(5, 7)}-${normalizedIsrc.substring(7)}`;
};
```

### Améliorations d'Acoustid et Audd

#### Acoustid amélioré

```javascript
/**
 * Récupération des codes ISRC depuis Acoustid avec validation
 */
// Demander des métadonnées complètes
formData.append('meta', 'recordings recordings+sources+releasegroups+releases+tracks+compress musicbrainz');

// Extraction des ISRC depuis différentes sources
let isrcs = [];

// Méthode 1: Chercher dans les sources
if (recording.sources) {
  for (const source of recording.sources) {
    if (source.source_data && source.source_data.isrc) {
      const sourceIsrc = source.source_data.isrc;
      if (validateISRC(sourceIsrc)) {
        const normalizedIsrc = normalizeISRC(sourceIsrc);
        if (!isrcs.includes(normalizedIsrc)) {
          isrcs.push(normalizedIsrc);
        }
      }
    }
  }
}

// Méthode 2: Chercher dans les releases et tracks
if (recording.releases) {
  for (const release of recording.releases) {
    if (release.mediums) {
      for (const medium of release.mediums) {
        if (medium.tracks) {
          for (const track of medium.tracks) {
            if (track.isrcs && track.isrcs.length > 0) {
              for (const trackIsrc of track.isrcs) {
                if (validateISRC(trackIsrc)) {
                  const normalizedIsrc = normalizeISRC(trackIsrc);
                  if (!isrcs.includes(normalizedIsrc)) {
                    isrcs.push(normalizedIsrc);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

#### Audd amélioré

```javascript
/**
 * Récupération des codes ISRC depuis Audd avec validation
 */
// Demander des métadonnées complètes
formData.append('return', 'spotify,apple_music,deezer,musicbrainz');

// Extraction des ISRC depuis différentes sources
let isrcs = [];

// Méthode 1: ISRC directement dans le résultat
if (result.isrc) {
  const resultIsrc = result.isrc;
  if (validateISRC(resultIsrc)) {
    const normalizedIsrc = normalizeISRC(resultIsrc);
    isrc = normalizedIsrc;
    isrcs.push(normalizedIsrc);
  }
}

// Méthode 2: ISRC depuis Spotify
if (result.spotify && result.spotify.external_ids && result.spotify.external_ids.isrc) {
  const spotifyIsrc = result.spotify.external_ids.isrc;
  if (validateISRC(spotifyIsrc)) {
    const normalizedIsrc = normalizeISRC(spotifyIsrc);
    if (!isrcs.includes(normalizedIsrc)) {
      isrcs.push(normalizedIsrc);
      if (!isrc) isrc = normalizedIsrc;
    }
  }
}

// Méthodes supplémentaires pour Apple Music et MusicBrainz
```

### Suivi précis du temps de jeu

Nous avons implémenté un système de suivi précis du temps de jeu qui fonctionne comme suit:

```javascript
// Calcul de la position exacte de l'échantillon dans la chanson
const samplePosition = identificationResult.song.sample_position || 0;

// Estimer l'heure exacte de début de la chanson
const playTimestamp = new Date(timestamp);
const startTimestamp = new Date(playTimestamp.getTime() - (samplePosition * 1000));

// Calculer l'heure de fin estimée (basée sur la durée de la chanson)
let endTimestamp = null;
if (identificationResult.song.duration) {
  endTimestamp = new Date(startTimestamp.getTime() + (identificationResult.song.duration * 1000));
}

// Enregistrer la diffusion avec des informations précises sur le temps de jeu
const airplayData = {
  song_id: songId,
  channel_id,
  play_timestamp: startTimestamp.toISOString(), // Heure de début précise
  end_timestamp: endTimestamp ? endTimestamp.toISOString() : null, // Heure de fin estimée
  duration: identificationResult.song.duration || null,
  playback_position: samplePosition,
  detected_at: timestamp, // Conserver l'heure exacte de la détection
  fingerprint_data: identificationResult.raw_data
};
```

## Intégration améliorée avec RadioBrowser API

Nous avons amélioré l'intégration avec RadioBrowser API pour récupérer plus de métadonnées:

```javascript
// Utilisation du serveur recommandé (meilleure pratique)
const serversResponse = await axios.get('https://all.api.radio-browser.info/json/servers');
const randomServer = serversResponse.data[0].name;

// Récupération des stations sénégalaises
const response = await axios.get(`https://${randomServer}/json/stations/bycountry/senegal`, {
  params: {
    hidebroken: true,  // Ignorer les stations en panne
    order: 'clickcount', // Trier par popularité
    reverse: true,     // Ordre décroissant
    limit: 100         // Limiter à 100 stations
  }
});

// Extraction des métadonnées riches
const stationData = {
  name: station.name,
  type: 'radio',
  url: station.url_resolved || station.url, // Utiliser l'URL résolue si disponible
  logo_url: station.favicon || null,
  country: 'Sénégal',
  language: languages,
  status: 'active',
  description: station.tags || '',
  bitrate: station.bitrate ? parseInt(station.bitrate, 10) : null,
  codec: station.codec || null,
  homepage: station.homepage || null,
  metadata: {
    radiobrowser_id: station.stationuuid,
    click_count: station.clickcount,
    vote_count: station.votes,
    tags: tags,
    geo_lat: station.geo_lat,
    geo_long: station.geo_long
  }
};
```

## Frontend

### Structure du frontend

Le frontend de SODAV Monitor est développé avec Next.js 14 et utilise une architecture basée sur le modèle App Router. Les principales technologies utilisées sont:

- **Next.js 14**: Framework React avec support SSR et SSG
- **TypeScript**: Pour le typage statique
- **Tailwind CSS**: Pour le styling
- **shadcn/ui**: Pour les composants UI réutilisables
- **Recharts**: Pour les visualisations graphiques

La structure du frontend est organisée comme suit:

```
frontend/
├── public/              # Ressources statiques
├── src/
│   ├── app/             # Pages de l'application (App Router)
│   │   ├── (auth)/      # Pages authentifiées
│   │   │   ├── dashboard/
│   │   │   ├── analyses/
│   │   │   ├── rapports/
│   │   │   └── parametres/
│   │   ├── login/       # Page de connexion
│   │   └── signup/      # Page d'inscription
│   ├── components/      # Composants réutilisables
│   │   ├── ui/          # Composants d'interface utilisateur
│   │   ├── charts/      # Composants de visualisation
│   │   └── layout/      # Composants de mise en page
│   ├── lib/             # Utilitaires et fonctions
│   ├── types/           # Définitions de types TypeScript
│   └── styles/          # Styles globaux
```

### Composants de visualisation

Le système utilise des composants de visualisation basés sur Recharts pour présenter les données de diffusion de manière claire et intuitive. Ces composants sont conçus pour être hautement réutilisables et configurables.

#### AreaChart

Utilisé pour visualiser les tendances temporelles avec une zone remplie sous la courbe.

```tsx
<AreaChart
  data={trendData}
  height={300}
  showGrid={true}
  tooltipTitle="diffusions"
  gradientFrom="#00853F" // Vert sénégalais
  gradientTo="rgba(0, 133, 63, 0.1)"
/>
```

#### BarChart

Utilisé pour les comparaisons de valeurs, supporte l'orientation verticale et horizontale.

```tsx
<BarChart
  data={artistData}
  xAxisKey="name"
  yAxisKey="value"
  barKey="value"
  layout="vertical" // ou "horizontal"
  rotateLabels={true}
/>
```

#### LineChart

Utilisé pour visualiser l'évolution temporelle, avec support pour plusieurs séries de données.

```tsx
<LineChart
  data={weeklyData}
  series={[
    { dataKey: "RTS1", color: "#00853F" },
    { dataKey: "TFM", color: "#FDEF42" },
  ]}
  xAxisKey="date"
  showGrid={true}
  showLegend={true}
/>
```

#### PieChart

Utilisé pour visualiser les distributions et proportions.

```tsx
<PieChart
  data={channelData}
  innerRadius={60} // Pour créer un donut chart
  outerRadius={90}
  showLegend={true}
/>
```

Ces composants sont utilisés dans le tableau de bord et la page d'analyses pour présenter les données de diffusion, permettant aux utilisateurs de la SODAV d'analyser efficacement les tendances et de générer des rapports précis pour la distribution des droits d'auteur. 