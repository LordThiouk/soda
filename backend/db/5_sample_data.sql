-- Script 5: Insertion de données d'exemple pour le développement

-- Données de test pour les chansons
INSERT INTO public.songs (title, artist, album, isrc) VALUES
('Africa', 'Toto', 'Toto IV', 'USSM17900028'),
('Désolé', 'Sexion d''Assaut', 'L''École des points vitaux', 'FR9W11000795'),
('Wakanda', 'Djuna Djanana', 'Kaysha Collection Vol.2', 'FRUM71600053'),
('Mbeuguel', 'Youssou N''Dour', 'Joko', 'GBAYE0200013');

-- Exemple de chaînes sénégalaises
INSERT INTO public.channels (name, type, url, country, language) VALUES
('RTS1', 'tv', 'https://example.com/rts1', 'Sénégal', 'Français/Wolof'),
('TFM', 'tv', 'https://example.com/tfm', 'Sénégal', 'Français/Wolof'),
('RFM', 'radio', 'https://rfm_radio.org', 'Sénégal', 'Français/Wolof'),
('Dakar Musique', 'radio', 'https://dakar.music.stream', 'Sénégal', 'Français/Wolof'); 