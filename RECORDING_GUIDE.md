# Système d'Enregistrement Vocal - Documentation

## Installation

### 1. Exécuter le schéma SQL

Connectez-vous à votre Supabase et exécutez `RECORDING_SETUP.sql` via l'éditeur SQL:
1. Allez sur **Supabase Dashboard** → **SQL Editor**
2. Créez une nouvelle requête
3. Copiez-collez le contenu de `RECORDING_SETUP.sql`
4. Cliquez sur **Run**

Cela créera:
- Table `recording_sessions` (sessions d'enregistrement avec essais tracking)
- Table `recording_drafts` (brouillons temporaires)
- Colonnes additionnelles sur `voix_enregistrees` (enregistreur_nom, is_locked)
- Indexes pour optimisation

### 2. Configurer les variables d'environnement

Assurez-vous que `.env.local` contient:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_TTS_BUCKET=tts
```

## Architecture

### Workflow d'enregistrement

```
1. Utilisateur accède à /record/[id_bijou]
   ↓
2. RecordClient charge config (session, voix finale, brouillons)
   ↓
3. AudioRecorder capte l'audio via MediaRecorder API
   ↓
4. Sur enregistrement complet:
   - Créer brouillon (isDraft: true) → /api/record POST
   - Sauvegarder dans recording_drafts table
   - Afficher aperçu playback
   ↓
5. Utilisateur clique "Valider et enregistrer"
   ↓
6. Upload audio final (isDraft: false) → /api/record POST
   - Sauvegarder dans voix_enregistrees
   - Décrémenter essais_restants
   - Verrouiller session (locked = true)
   - Rediriger vers /listen/[id]
```

### Endpoints API

#### POST /api/record
**Upload audio (brouillon ou final)**

Request:
```json
{
  "id_bijou": "uuid-string",
  "audioBase64": "base64-encoded-audio",
  "durationSeconds": 45,
  "isDraft": true,
  "enregistreur_nom": "John" // optionnel, pour voix finale
}
```

Response:
```json
{
  "success": true,
  "url": "https://supabase-url/storage/v1/object/public/tts/recordings/...",
  "isDraft": true
}
```

**Comportement:**
- `isDraft: true` → créer recording_drafts entry, retourner URL pour playback
- `isDraft: false` → créer voix_enregistrees entry, mettre locked: true, verrouiller session

#### GET /api/record?id_bijou=uuid
**Récupérer config et brouillons**

Response:
```json
{
  "session": {
    "id_bijou": "uuid",
    "essais_restants": 5,
    "max_essais": 5,
    "locked": false,
    "duree_max_secondes": 120
  },
  "voixEnregistree": {
    "id": "uuid",
    "audio_url": "https://...",
    "is_locked": true,
    "created_at": "2025-01-10T..."
  },
  "drafts": [
    {
      "id": "uuid",
      "audio_url": "https://...",
      "duree_secondes": 45,
      "created_at": "2025-01-10T..."
    }
  ]
}
```

#### GET /api/record/config?id_bijou=uuid
**Alias pour GET /api/record (même réponse)**

### Composants

#### `<AudioRecorder>`
**Props:**
```typescript
maxDurationSeconds?: number = 120
onRecordingComplete: (blob: Blob, durationSeconds: number) => void
disabled?: boolean = false
```

**Fonctionnalité:**
- Demande permission microphone
- Enregistre audio en WebM format
- Affiche timer countdown
- Boutons Start/Stop
- Gère les erreurs (mic non accessible)

#### `<RecordClient>`
**Workflow complet:**
1. Charge config (session, voix existante, brouillons)
2. Vérifie si déjà verrouillé → affiche écran "verrouillé"
3. Vérifie essais restants → affiche écran "plus d'essais"
4. Affiche AudioRecorder + aperçu playback
5. Sur validation → upload + redirection vers /listen

## User Flow

### Nouvel utilisateur avec enregistrement

```
Scan NFC → /record/[id_bijou]
    ↓
Voir "Enregistrez votre message pour Jean"
Essais: 5/5
    ↓
Cliquer "Enregistrer" → AudioRecorder active le micro
    ↓
Parler (max 2 minutes)
    ↓
Cliquer "Arrêter" → brouillon créé automatiquement
    ↓
Écouter aperçu du brouillon
    ↓
Cliquer "▶ Écouter" → playback du brouillon
    ↓
Satisfaction?
  → OUI: Cliquer "✓ Valider et enregistrer" → upload final + verrouiller + redirection
  → NON: Cliquer "↻ Recommencer" → essai suivant (essais: 4/5)
```

### Utilisateur avec voix déjà enregistrée

```
Scan NFC → /record/[id_bijou]
    ↓
"Enregistrement verrouillé" (🔒)
"Votre message pour Jean a été enregistré"
"Vous ne pouvez pas modifier ce message"
    ↓
Cliquer "Retourner à l'écoute" → /listen/[id]
```

### Utilisateur ayant utilisé tous les essais

```
Scan NFC → /record/[id_bijou]
    ↓
"Plus d'essais disponibles" (❌)
"Vous avez utilisé tous vos essais"
    ↓
Cliquer "Retourner" → /listen/[id]
```

## État des Essais

- **Création session:** essais_restants = 5 (ou configurable via max_essais)
- **Chaque essai:** l'utilisateur enregistre et écoute, sans décrémenter
- **Validation finale:** isDraft: false → session verrouillée (locked: true)

> **Note:** Actuellement les essais ne se décrémentent que lors de la validation finale. Si vous voulez décrémenter à chaque tentative d'enregistrement, modifier le POST /api/record pour décrémenter essais_restants avant de créer le brouillon.

## Cleanup Automatique

Les brouillons expirent après 24h (expires_at). Pour nettoyer:

1. Configurer un job cron (via Supabase Realtime ou job queue externe)
2. Query: `DELETE FROM recording_drafts WHERE expires_at < NOW()`

Les sessions expirent après 30 jours (expires_at).

## Sécurité (RLS)

Recommandé d'ajouter des politiques RLS:

```sql
-- recording_sessions: L'utilisateur ne peut voir/modifier que ses propres sessions
CREATE POLICY "Users can view own recording sessions" ON recording_sessions
  FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM bijoux WHERE id_bijou = id_bijou));

-- recording_drafts: Même logique
CREATE POLICY "Users can manage own recording drafts" ON recording_drafts
  FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM bijoux WHERE id_bijou = id_bijou));
```

## Testing

### 1. Accès à la page d'enregistrement
```bash
# Développement
http://localhost:3000/record/[id_bijou_test]

# Production
https://yourapp.vercel.app/record/[id_bijou_test]
```

### 2. Tester le microphone
- Accepter la demande de permission micro
- Cliquer "Enregistrer"
- Parler pendant 5-10 secondes
- Cliquer "Arrêter"
- Vérifier que le brouillon apparaît

### 3. Tester la validation
- Cliquer "▶ Écouter" pour écouter le brouillon
- Cliquer "✓ Valider et enregistrer"
- Vérifier que la page charge "Message enregistré!"
- Vérifier que la redirection vers /listen se fait après 2s

### 4. Vérifier les données Supabase
- Aller à **Supabase Dashboard** → **Database** → **recording_sessions**
- Vérifier que votre entry existe avec essais_restants = 5, locked = false
- Aller à **recording_drafts** et **voix_enregistrees**
- Vérifier que les uploads sont là

### 5. Tester la redirection
- Après validation, vérifier que /listen/[id] se charge correctement
- Vérifier que le type_bijou "voix_enregistree" joue automatiquement l'audio

## Dépannage

### "Erreur lors de la sauvegarde du brouillon"
- Vérifier que le bucket `tts` existe dans Supabase Storage
- Vérifier que SUPABASE_SERVICE_ROLE_KEY est correct
- Vérifier que recording_drafts table existe (exécuter RECORDING_SETUP.sql)

### Microphone ne fonctionne pas
- Vérifier les permissions du navigateur (Settings → Privacy → Microphone)
- Tester sur https (localhost marche aussi)
- Vérifier que le navigateur supporte getUserMedia

### Audio ne se sauvegarde pas
- Vérifier les logs API: voir `/api/record` console errors
- Vérifier que Supabase Storage bucket a le droit à `insert`

### Les brouillons n'apparaissent pas
- Vérifier que le brouillon a bien été créé via POST
- Vérifier que GET /api/record/config retourne les drafts
- Vérifier les logs Supabase pour les erreurs SQL

## Améliorations Futures

- [ ] Timer d'auto-lock configurable par bijou (auto_lock_apres_heures)
- [ ] Stockage des essais décrémentés (actuellement valide = verrous immédiat)
- [ ] Draft playback avec waveform visualizer
- [ ] Compression audio (WebM → MP3) avant upload
- [ ] Partage de brouillons temporaires avant validation
- [ ] Webhook notification au destinataire après enregistrement
- [ ] Statistiques d'enregistrement (nombre de tentatives, durée moyenne)
- [ ] Support du voice naming (enregistreur_nom détecté via OS)
