-- Tables pour le système d'enregistrement vocal

-- 1. Sessions d'enregistrement (tracking des essais et statut)
CREATE TABLE recording_sessions (
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
CREATE TABLE recording_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_bijou TEXT NOT NULL REFERENCES bijoux(id_bijou) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  duree_secondes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Indexs pour performance
CREATE INDEX idx_recording_sessions_bijou ON recording_sessions(id_bijou);
CREATE INDEX idx_recording_drafts_bijou ON recording_drafts(id_bijou);
CREATE INDEX idx_recording_drafts_expires ON recording_drafts(expires_at);

-- Mettre à jour voix_enregistrees pour ajouter des infos utiles
ALTER TABLE voix_enregistrees 
ADD COLUMN IF NOT EXISTS enregistreur_nom TEXT,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS lectures_restantes INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS lectures_totales INTEGER DEFAULT 0;
