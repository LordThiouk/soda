/**
 * Utilitaires pour la gestion des codes ISRC
 * (International Standard Recording Code)
 */

/**
 * Valide un code ISRC
 * Format ISRC: CC-XXX-YY-NNNNN
 * CC: Code pays (2 caractères)
 * XXX: Code du propriétaire enregistré (3 caractères)
 * YY: Année de référence (2 chiffres)
 * NNNNN: Désignation d'enregistrement (5 chiffres)
 * 
 * @param {string} isrc - Code ISRC à valider
 * @returns {boolean} Validité du code ISRC
 */
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

/**
 * Normalise un code ISRC (supprime les espaces et tirets)
 * @param {string} isrc - Code ISRC à normaliser
 * @returns {string} Code ISRC normalisé
 */
const normalizeISRC = (isrc) => {
  if (!isrc) return '';
  return isrc.replace(/[-\s]/g, '').toUpperCase();
};

/**
 * Formate un code ISRC pour l'affichage (avec tirets)
 * @param {string} isrc - Code ISRC à formater
 * @returns {string} Code ISRC formaté
 */
const formatISRC = (isrc) => {
  if (!isrc) return '';
  
  // Normaliser d'abord
  const normalizedIsrc = normalizeISRC(isrc);
  
  // Vérifier si valide
  if (!validateISRC(normalizedIsrc)) {
    return isrc; // Retourner l'original si invalide
  }
  
  // Formater avec tirets: CC-XXX-YY-NNNNN
  return `${normalizedIsrc.substring(0, 2)}-${normalizedIsrc.substring(2, 5)}-${normalizedIsrc.substring(5, 7)}-${normalizedIsrc.substring(7)}`;
};

/**
 * Récupère le pays à partir d'un code ISRC
 * @param {string} isrc - Code ISRC
 * @returns {string} Code du pays
 */
const getCountryFromISRC = (isrc) => {
  if (!isrc || !validateISRC(isrc)) return null;
  
  const normalizedIsrc = normalizeISRC(isrc);
  return normalizedIsrc.substring(0, 2);
};

/**
 * Récupère l'année à partir d'un code ISRC
 * @param {string} isrc - Code ISRC
 * @returns {number} Année (attention: approximative car l'ISRC ne contient que 2 chiffres)
 */
const getYearFromISRC = (isrc) => {
  if (!isrc || !validateISRC(isrc)) return null;
  
  const normalizedIsrc = normalizeISRC(isrc);
  const yearCode = normalizedIsrc.substring(5, 7);
  
  // Année à 2 chiffres à convertir en 4 chiffres
  const twoDigitYear = parseInt(yearCode, 10);
  
  // Si > 50, on considère que c'est le 20e siècle, sinon 21e siècle
  // Cette règle est approximative et peut devenir obsolète avec le temps
  return twoDigitYear > 50 ? 1900 + twoDigitYear : 2000 + twoDigitYear;
};

/**
 * Extrait le code ISRC d'une réponse Acoustid
 * @param {Object} response - Réponse de l'API Acoustid
 * @returns {string|null} Code ISRC ou null si non trouvé
 */
const extractISRCFromAcoustid = (response) => {
  if (!response || !response.results || !response.results.length) {
    return null;
  }

  for (const result of response.results) {
    if (result.recordings && result.recordings.length) {
      for (const recording of result.recordings) {
        if (recording.isrcs && recording.isrcs.length) {
          return recording.isrcs[0]; // Retourne le premier ISRC trouvé
        }
      }
    }
  }

  return null;
};

/**
 * Extrait le code ISRC d'une réponse Audd
 * @param {Object} response - Réponse de l'API Audd
 * @returns {string|null} Code ISRC ou null si non trouvé
 */
const extractISRCFromAudd = (response) => {
  if (!response || !response.result) {
    return null;
  }

  // Tente d'extraire directement de la réponse principale
  if (response.result.isrc) {
    return response.result.isrc;
  }

  // Cherche dans les données Spotify
  if (response.result.spotify) {
    if (response.result.spotify.isrc) {
      return response.result.spotify.isrc;
    }
    // Chercher dans les external_ids de Spotify
    if (response.result.spotify.external_ids && response.result.spotify.external_ids.isrc) {
      return response.result.spotify.external_ids.isrc;
    }
  }

  // Cherche dans les données Apple Music
  if (response.result.apple_music && response.result.apple_music.isrc) {
    return response.result.apple_music.isrc;
  }

  return null;
};

module.exports = {
  validateISRC,
  normalizeISRC,
  formatISRC,
  getCountryFromISRC,
  getYearFromISRC,
  extractISRCFromAcoustid,
  extractISRCFromAudd
}; 