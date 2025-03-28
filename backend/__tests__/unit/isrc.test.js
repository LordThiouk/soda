const {
  validateISRC,
  normalizeISRC,
  formatISRC,
  extractISRCFromAcoustid,
  extractISRCFromAudd
} = require('../../src/utils/isrc');

describe('ISRC Utility', () => {
  describe('validateISRC', () => {
    it('should return true for valid ISRC codes', () => {
      expect(validateISRC('FRGFV9400246')).toBe(true);
      expect(validateISRC('USRC19900108')).toBe(true);
      expect(validateISRC('GBAYE9300007')).toBe(true);
      expect(validateISRC('QZFME1146562')).toBe(true);
      expect(validateISRC('FRXXX0123456')).toBe(true);
    });

    it('should return false for invalid ISRC codes', () => {
      // Trop court
      expect(validateISRC('ABC123')).toBe(false);
      
      // Trop long
      expect(validateISRC('USRC199001080000')).toBe(false);
      
      // Code pays invalide
      expect(validateISRC('00XXX9900001')).toBe(false);
      
      // Caractères non alphanumériques
      expect(validateISRC('FR-XX_9900*1')).toBe(false);
      
      // Valeur null ou undefined
      expect(validateISRC(null)).toBe(false);
      expect(validateISRC(undefined)).toBe(false);
      expect(validateISRC('')).toBe(false);
    });

    it('should handle hyphenated ISRC codes', () => {
      expect(validateISRC('FR-GFV-94-00246')).toBe(true);
      expect(validateISRC('US-RC1-99-00108')).toBe(true);
    });
  });

  describe('normalizeISRC', () => {
    it('should remove hyphens from ISRC codes', () => {
      expect(normalizeISRC('FR-GFV-94-00246')).toBe('FRGFV9400246');
      expect(normalizeISRC('US-RC1-99-00108')).toBe('USRC19900108');
    });

    it('should convert to uppercase', () => {
      expect(normalizeISRC('frgfv9400246')).toBe('FRGFV9400246');
      expect(normalizeISRC('usrc19900108')).toBe('USRC19900108');
    });

    it('should remove spaces', () => {
      expect(normalizeISRC('FR GFV 94 00246')).toBe('FRGFV9400246');
      expect(normalizeISRC(' USRC19900108 ')).toBe('USRC19900108');
    });

    it('should handle null or undefined', () => {
      expect(normalizeISRC(null)).toBe('');
      expect(normalizeISRC(undefined)).toBe('');
      expect(normalizeISRC('')).toBe('');
    });
  });

  describe('formatISRC', () => {
    it('should format ISRC with hyphens', () => {
      expect(formatISRC('FRGFV9400246')).toBe('FR-GFV-94-00246');
      expect(formatISRC('USRC19900108')).toBe('US-RC1-99-00108');
    });

    it('should handle already formatted ISRCs', () => {
      expect(formatISRC('FR-GFV-94-00246')).toBe('FR-GFV-94-00246');
      expect(formatISRC('US-RC1-99-00108')).toBe('US-RC1-99-00108');
    });

    it('should normalize and then format', () => {
      expect(formatISRC('frgfv9400246')).toBe('FR-GFV-94-00246');
      expect(formatISRC('usrc19900108')).toBe('US-RC1-99-00108');
    });

    it('should handle null or undefined', () => {
      expect(formatISRC(null)).toBe('');
      expect(formatISRC(undefined)).toBe('');
      expect(formatISRC('')).toBe('');
    });
  });

  describe('extractISRCFromAcoustid', () => {
    it('should extract ISRC from Acoustid response', () => {
      const mockResponse = {
        results: [
          {
            recordings: [
              {
                isrcs: ['FRGFV9400246'],
                title: '7 Seconds'
              }
            ]
          }
        ]
      };

      expect(extractISRCFromAcoustid(mockResponse)).toBe('FRGFV9400246');
    });

    it('should return first ISRC when multiple are available', () => {
      const mockResponse = {
        results: [
          {
            recordings: [
              {
                isrcs: ['FRGFV9400246', 'USRC19900108'],
                title: '7 Seconds'
              }
            ]
          }
        ]
      };

      expect(extractISRCFromAcoustid(mockResponse)).toBe('FRGFV9400246');
    });

    it('should search through multiple recordings', () => {
      const mockResponse = {
        results: [
          {
            recordings: [
              {
                title: '7 Seconds'
                // Pas d'ISRC
              },
              {
                isrcs: ['FRGFV9400246'],
                title: '7 Seconds (Remix)'
              }
            ]
          }
        ]
      };

      expect(extractISRCFromAcoustid(mockResponse)).toBe('FRGFV9400246');
    });

    it('should handle empty or invalid responses', () => {
      expect(extractISRCFromAcoustid(null)).toBe(null);
      expect(extractISRCFromAcoustid({})).toBe(null);
      expect(extractISRCFromAcoustid({ results: [] })).toBe(null);
      expect(extractISRCFromAcoustid({ results: [{ recordings: [] }] })).toBe(null);
    });
  });

  describe('extractISRCFromAudd', () => {
    it('should extract ISRC from Audd response', () => {
      const mockResponse = {
        result: {
          isrc: 'FRGFV9400246',
          title: '7 Seconds',
          spotify: {
            external_ids: {
              isrc: 'FRGFV9400246'
            }
          }
        }
      };

      expect(extractISRCFromAudd(mockResponse)).toBe('FRGFV9400246');
    });

    it('should extract ISRC from Spotify data if direct ISRC is missing', () => {
      const mockResponse = {
        result: {
          title: '7 Seconds',
          spotify: {
            external_ids: {
              isrc: 'FRGFV9400246'
            }
          }
        }
      };

      expect(extractISRCFromAudd(mockResponse)).toBe('FRGFV9400246');
    });

    it('should extract ISRC from Apple Music data if other sources are missing', () => {
      const mockResponse = {
        result: {
          title: '7 Seconds',
          apple_music: {
            isrc: 'FRGFV9400246'
          }
        }
      };

      expect(extractISRCFromAudd(mockResponse)).toBe('FRGFV9400246');
    });

    it('should handle empty or invalid responses', () => {
      expect(extractISRCFromAudd(null)).toBe(null);
      expect(extractISRCFromAudd({})).toBe(null);
      expect(extractISRCFromAudd({ result: null })).toBe(null);
      expect(extractISRCFromAudd({ result: {} })).toBe(null);
    });
  });
}); 