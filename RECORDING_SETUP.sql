-- Tables pour le système d'enregistrement vocal

-- IMPORTANT: le type du bijou doit etre choisi par le client au moment du scellement,
-- pas au moment de la creation initiale en base.
ALTER TABLE bijoux
  ALTER COLUMN type_bijou DROP NOT NULL;

ALTER TABLE bijoux
  ALTER COLUMN type_bijou DROP DEFAULT;

-- 1. Sessions d'enregistrement (tracking des essais et statut)
CREATE TABLE IF NOT EXISTS recording_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_bijou TEXT NOT NULL REFERENCES bijoux(id_bijou) ON DELETE CASCADE,
  enregistreur_nom TEXT,
  essais_restants INTEGER DEFAULT 5,
  max_essais INTEGER DEFAULT 5,
  duree_max_secondes INTEGER DEFAULT 120,
  locked BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMPTZ,
  auto_lock_apres_heures INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  UNIQUE(id_bijou)
);

-- 2. Brouillons temporaires (les essais avant validation)
CREATE TABLE IF NOT EXISTS recording_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_bijou TEXT NOT NULL REFERENCES bijoux(id_bijou) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  duree_secondes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Indexs pour performance
CREATE INDEX IF NOT EXISTS idx_recording_sessions_bijou ON recording_sessions(id_bijou);
CREATE INDEX IF NOT EXISTS idx_recording_drafts_bijou ON recording_drafts(id_bijou);
CREATE INDEX IF NOT EXISTS idx_recording_drafts_expires ON recording_drafts(expires_at);

-- Mettre à jour voix_enregistrees pour ajouter des infos utiles
ALTER TABLE voix_enregistrees 
ADD COLUMN IF NOT EXISTS enregistreur_nom TEXT,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS lectures_restantes INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS lectures_totales INTEGER DEFAULT 0;

-- Nettoyer les doublons existants: on garde la voix la plus récente par bijou
DELETE FROM voix_enregistrees a
USING voix_enregistrees b
WHERE a.id_bijou = b.id_bijou
  AND a.created_at < b.created_at;

-- Garantir une seule voix finale par bijou
CREATE UNIQUE INDEX IF NOT EXISTS idx_voix_enregistrees_unique_bijou
ON voix_enregistrees(id_bijou);
