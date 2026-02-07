# 🚀 Déploiement Vercel - Mindwood App

## Domaines
- 🇫🇷 **FR**: `appatelierdesliensinvisibles.fr`
- 🇬🇧 **EN**: `appatelierdesliensinvisibles.com`

---

## 1️⃣ Connecter le projet à Vercel

### Option A: Via CLI (recommandé)
```bash
npm i -g vercel
vercel login
vercel
```

### Option B: Via Dashboard Vercel
1. Aller sur https://vercel.com/new
2. Sélectionner "GitHub"
3. Chercher `mindwood-app`
4. Cliquer "Import"

---

## 2️⃣ Configurer les variables d'environnement

Dans **Vercel Dashboard** → **Settings** → **Environment Variables**, ajouter:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_TTS_BUCKET=tts
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://appatelierdesliensinvisibles.fr
```

**Important:** 
- Utiliser les clés **LIVE** de Stripe (pas test)
- Les clés `NEXT_PUBLIC_*` sont publiques, c'est normal

---

## 3️⃣ Ajouter les domaines personnalisés

### Domaine FR (.fr)
1. **Vercel Dashboard** → **Domains**
2. Cliquer **Add**
3. Entrer: `appatelierdesliensinvisibles.fr`
4. Vercel te donne les **nameservers**:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ns3.vercel-dns.com
   ns4.vercel-dns.com
   ```
5. Aller chez ton registrar (.fr) et update les nameservers
6. Attendre ~24h de propagation DNS

### Domaine COM (.com)
Même processus:
1. Ajouter `appatelierdesliensinvisibles.com`
2. Update nameservers chez le registrar
3. Attendre propagation DNS

---

## 4️⃣ Configurer le Stripe Webhook

Le webhook doit pointer vers Vercel (pas localhost).

### Chez Stripe
1. **Dashboard** → **Developers** → **Webhooks**
2. Ajouter un endpoint:
   ```
   https://appatelierdesliensinvisibles.fr/api/stripe/webhook
   ```
3. Sélectionner événements:
   - `checkout.session.completed`
4. Copier le **Signing Secret** (commence par `whsec_`)
5. Ajouter dans Vercel env: `STRIPE_WEBHOOK_SECRET=whsec_...`

---

## 5️⃣ Vérifier le déploiement

Une fois les domaines propagés:

```bash
# Test FR
curl https://appatelierdesliensinvisibles.fr

# Test EN
curl https://appatelierdesliensinvisibles.com

# Vérifier la page de recording
https://appatelierdesliensinvisibles.fr/record/test-id-bijou
https://appatelierdesliensinvisibles.com/record/test-id-bijou
```

---

## 6️⃣ Checklist final

- [ ] Projet connecté à Vercel
- [ ] Variables d'env configurées
- [ ] Domaine FR ajouté et nameservers mis à jour
- [ ] Domaine COM ajouté et nameservers mis à jour
- [ ] Stripe webhook configuré vers `appatelierdesliensinvisibles.fr/api/stripe/webhook`
- [ ] SSL/TLS activé (auto sur Vercel)
- [ ] Tests des routes:
  - [ ] `/record/[id]` accessible
  - [ ] `/listen/recorded/[id]` accessible avec design luxe
  - [ ] `/recharge/[id]` fonctionne
  - [ ] Stripe checkout fonctionne
  - [ ] Webhook Stripe reçoit les paiements

---

## 7️⃣ Redirection FR → EN (optionnel)

Si tu veux que `.fr` soit prioritaire et `.com` le fallback:

Dans `vercel.json` ajouter:
```json
{
  "rewrites": [
    {
      "source": "/:path*",
      "destination": "/:path*"
    }
  ]
}
```

Ou utiliser les domaines Vercel pour des redirects automatiques.

---

## 8️⃣ Monitoring post-déploiement

- **Vercel Analytics**: Dashboard → Analytics
- **Supabase Logs**: Dashboard → Logs
- **Stripe Webhooks**: Dashboard → Developers → Webhooks → Events

---

**Status**: Prêt pour déploiement production ✅
**Version**: 1.0.0
**Date**: 7 février 2026
