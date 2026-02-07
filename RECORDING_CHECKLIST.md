# 🚀 Checklist - Système d'Enregistrement Vocal

## 1️⃣ Installation du Schéma DB

### Étapes:
- [ ] Aller sur **Supabase Dashboard** → **SQL Editor**
- [ ] Créer une nouvelle requête
- [ ] Copier-coller le contenu de `RECORDING_SETUP.sql` (entire file)
- [ ] Cliquer **Run** pour exécuter

### Vérification:
```bash
# Dans Supabase Dashboard → Database → Tables:
# Vérifier que ces tables existent:
- recording_sessions ✓
- recording_drafts ✓
- voix_enregistrees (avec colonnes enregistreur_nom, is_locked) ✓
```

---

## 2️⃣ Configuration Environnement

### .env.local doit contenir:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_TTS_BUCKET=tts  # Important!
```

### Vérification:
```bash
# Dans terminal:
grep "SUPABASE_TTS_BUCKET" .env.local
# Should output: SUPABASE_TTS_BUCKET=tts
```

---

## 3️⃣ Créer un Bijou Test

### Via Supabase Dashboard SQL:
```sql
INSERT INTO bijoux (
  id_bijou,
  id_user,
  destinataire_prenom,
  type_bijou,
  langue,
  credits_restants,
  actif
) VALUES (
  gen_random_uuid(),
  'your-user-id',
  'Jean',
  'voix_enregistree',  -- Important!
  'fr',
  5,
  true
);

-- Copier l'id_bijou généré pour tester
```

---

## 4️⃣ Test Local

### Démarrer le serveur:
```bash
npm run dev
# Devrait compiler sans erreurs (aucun TS error)
```

### Tester l'enregistrement:
1. Aller à `http://localhost:3000/record/[id_bijou_from_above]`
2. Vérifier affichage du nom du destinataire
3. Vérifier affichage "Essais: 5/5"
4. Cliquer "Enregistrer"
5. Vérifier que le micro demande permission
6. Parler pendant 10-15 secondes
7. Cliquer "Arrêter"
8. Vérifier que brouillon apparaît et se crée dans Supabase

### Tester le playback:
1. Cliquer "▶ Écouter" sur le brouillon
2. Vérifier que votre voix joue
3. Cliquer "▶ Écouter" à nouveau pour pause
4. Cliquer "↻ Recommencer" pour nouvel essai

### Tester la validation:
1. Satisfait du brouillon
2. Cliquer "✓ Valider et enregistrer"
3. Vérifier page loading "Sauvegarde..."
4. Vérifier page success "Message enregistré!"
5. Vérifier redirection automatique vers `/listen/[id]`

### Tester l'auto-play de voix_enregistree:
1. Sur `/listen/[id]`, vérifier que:
   - Message s'affiche en typewriter
   - Audio joue **automatiquement** après message (pas de clic)
   - Bouton affiche "⏸ Pause"
   - Vous entendez votre voix enregistrée

### Vérifier les données Supabase:
```bash
# Dans Supabase Dashboard → Database:

# 1. recording_sessions:
SELECT * FROM recording_sessions WHERE id_bijou = '[your-test-id]';
# Vérifier: essais_restants = 5, locked = true

# 2. voix_enregistrees:
SELECT * FROM voix_enregistrees WHERE id_bijou = '[your-test-id]';
# Vérifier: audio_url valide, is_locked = true

# 3. recording_drafts:
SELECT * FROM recording_drafts WHERE id_bijou = '[your-test-id]';
# Vérifier: audio_url exist (pour aperçu)
```

---

## 5️⃣ Cas Limites à Tester

### Cas: Recharge de page pendant enregistrement
- [ ] Ouvrir `/record/[id]`
- [ ] Commencer enregistrement
- [ ] Recharger la page avant d'arrêter
- [ ] Vérifier que brouillon se crée quand même

### Cas: Plus d'essais
- [ ] Supprimer recording_sessions de la DB pour ce bijou
- [ ] Créer manuellement avec essais_restants = 0
- [ ] Aller à `/record/[id]`
- [ ] Vérifier affichage "Plus d'essais disponibles"

### Cas: Déjà verrouillé
- [ ] Aller à `/record/[id]` d'un bijou déjà enregistré
- [ ] Vérifier affichage "Enregistrement verrouillé"
- [ ] Vérifier bouton "Retourner à l'écoute" fonctionne

### Cas: Erreur microphone
- [ ] Refuser permission microphone dans navigateur
- [ ] Aller à `/record/[id]`
- [ ] Cliquer "Enregistrer"
- [ ] Vérifier message d'erreur s'affiche

---

## 6️⃣ Erreurs Courantes et Dépannage

### ❌ "Erreur lors de la sauvegarde du brouillon"
**Causes possibles:**
- [ ] Bucket `tts` n'existe pas dans Supabase Storage
- [ ] SUPABASE_SERVICE_ROLE_KEY incorrect
- [ ] recording_drafts table n'existe pas

**Solution:**
```bash
# 1. Vérifier bucket tts
# Supabase Dashboard → Storage → Buckets

# 2. Vérifier SQL schema
# Supabase Dashboard → SQL Editor → exécuter RECORDING_SETUP.sql

# 3. Vérifier env var
grep "SUPABASE_SERVICE_ROLE_KEY" .env.local
```

### ❌ Microphone ne fonctionne pas
**Causes possibles:**
- [ ] Permissions navigateur refusées
- [ ] HTTPS requis (sauf localhost)
- [ ] Navigateur ne supporte pas getUserMedia

**Solution:**
- [ ] Chrome → Settings → Privacy → Microphone → Allow localhost
- [ ] Essayer sur https:// (ex: Vercel preview)
- [ ] Essayer sur navigateur différent

### ❌ Audio ne se joue pas sur /listen
**Causes possibles:**
- [ ] audio_url invalide ou URL expirée
- [ ] CORS issue avec Supabase Storage
- [ ] Bucket public non configuré

**Solution:**
- [ ] Vérifier URL du storage est valide (copier dans browser)
- [ ] Supabase Dashboard → Storage → Settings → CORS
- [ ] Vérifier bucket `tts` est Public

### ❌ "Auto-play blocked by browser"
- Certains navigateurs bloquent audio autoplay sans interaction
- **Solution:** Cliquer une fois sur page avant que audio joue
- Ou ajouter `muted` puis unmute au premier clic

---

## 7️⃣ Performance & Optimisation

### Vérifier la vitesse:
- [ ] Recording page load: < 2s
- [ ] Brouillon upload: < 5s
- [ ] Audio playback: < 1s de latence
- [ ] Redirection vers /listen: < 2s

### Si lent:
- [ ] Vérifier Supabase bandwidth usage
- [ ] Vérifier Supabase query performance
- [ ] Utiliser DevTools → Network tab pour identifier bottleneck

---

## 8️⃣ Production Checklist

Avant de déployer sur Vercel:

### Code:
- [ ] Tous les TS errors corrigés (`get_errors` retourne aucune erreur)
- [ ] Testé localement sur `localhost:3000`
- [ ] Testé sur `/record` et `/listen`

### Supabase:
- [ ] Schéma SQL exécuté
- [ ] RLS policies configurées (recommandé)
- [ ] Bucket `tts` public et accessible
- [ ] Backups activés

### Environnement:
- [ ] `.env.local` complet et correct
- [ ] Vercel env variables setées (SUPABASE_SERVICE_ROLE_KEY, etc.)
- [ ] CORS whitelist include Vercel domain

### Documentation:
- [ ] Équipe familière avec `/record` flow
- [ ] Équipe capable de debug Supabase issues
- [ ] Backup du RECORDING_SETUP.sql existant

### Monitoring:
- [ ] Sentry ou équivalent configuré
- [ ] Logs Supabase monitorés
- [ ] Database backups vérifiés

---

## 9️⃣ Test Utilisateur Réel

### Scenario: Client enregistre message pour son ami

```
1. Client reçoit NFC tag/QR code
   ↓
2. Scanne → app ouvre /record/[id_bijou]
   ↓
3. Voit: "Enregistrez votre message pour Jean"
         "Essais: 5/5"
   ↓
4. Clique "Enregistrer"
   ↓
5. Système demande permission micro
   ↓
6. Client parle: "Jean, tu me manques beaucoup..."
   ↓
7. Clique "Arrêter" après ~30 secondes
   ↓
8. Écoute aperçu "▶ Écouter"
   ↓
9. Satisfait, clique "✓ Valider et enregistrer"
   ↓
10. Voit "Message enregistré!" avec spinner
    ↓
11. Redirection vers /listen/[id]
    ↓
12. Son message joue automatiquement
```

### Mesurer réussite:
- [ ] Tout le flow prend < 5 min (enregistrement + validation)
- [ ] Client entend sa voix clairement
- [ ] Pas d'erreurs ou messages cryptiques
- [ ] Redirection transparente

---

## 🔟 Support & FAQ

### Q: Combien d'essais par défaut?
**R:** 5 (configurable dans RECORDING_SETUP.sql - colonne `max_essais`)

### Q: Durée max audio?
**R:** 120 secondes = 2 minutes (configurable)

### Q: Où sont stockés les audios?
**R:** Supabase Storage → bucket `tts` → `recordings/[id_bijou]/voix/` ou `drafts/`

### Q: Puis-je modifier après validation?
**R:** Non, session.locked = true après validation. Sécurité intentionnelle.

### Q: Les brouillons expirent quand?
**R:** 24 heures après création (expires_at dans DB)

### Q: Comment décrementer essais_restants?
**R:** Actuellement ne décrémente que lors validation finale. 
Pour décrementer à chaque tentative, modifier POST /api/record ligne ~60.

---

## ✅ Checklist Final

- [ ] Schéma DB exécuté
- [ ] Env variables configurées
- [ ] Code compile sans erreurs
- [ ] Test enregistrement fonctionnel
- [ ] Test playback fonctionnel
- [ ] Test auto-play sur /listen fonctionne
- [ ] Supabase data vérifiée
- [ ] Erreurs gérées proprement
- [ ] Performance acceptable
- [ ] Prêt pour production

---

**Status:** Ready for Production ✅
**Version:** 1.0.0
**Last Updated:** Jan 2025
