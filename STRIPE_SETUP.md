# 💳 Intégration Stripe - Mindwood

## ✅ Fichiers créés

1. **`/api/stripe/create-checkout-session/route.ts`** - Crée une session de paiement Stripe
2. **`/api/stripe/webhook/route.ts`** - Webhook pour traiter les paiements confirmés
3. **`/components/RechargePanel.tsx`** - Interface utilisateur pour la recharge

## 🔧 Configuration requise

### 1. Variables d'environnement (`.env.local`)

```env
STRIPE_SECRET_KEY=sk_test_... # Votre clé secrète Stripe (test ou live)
STRIPE_WEBHOOK_SECRET=whsec_... # Secret du webhook Stripe
NEXT_PUBLIC_APP_URL=http://localhost:3000 # URL de votre app (en prod: https://mindwood.art)
```

### 2. Configuration Stripe Dashboard

#### A. Activer le mode test
- Aller sur https://dashboard.stripe.com
- Basculer en mode **Test** (toggle en haut à droite)

#### B. Configurer le webhook
1. Aller dans **Développeurs** → **Webhooks**
2. Cliquer sur **Ajouter un point de terminaison**
3. URL du webhook:
   - **Dev**: `http://localhost:3000/api/stripe/webhook` (utiliser Stripe CLI)
   - **Prod**: `https://mindwood.art/api/stripe/webhook`
4. Événements à écouter:
   - ✅ `checkout.session.completed`
5. Copier le **Secret du signing** et l'ajouter dans `.env.local`

#### C. Stripe CLI (pour le dev local)
```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Se connecter
stripe login

# Forwarder les webhooks en local
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copier le webhook secret affiché et l'ajouter dans .env.local
```

## 📦 Packages de crédits configurés

| Crédits | Prix | Réduction |
|---------|------|-----------|
| 10      | 10€  | -         |
| 25      | 22.5€| 10%       |
| 50      | 40€  | 20%       |
| 100     | 70€  | 30%       |

**Prix par crédit:** 1€ (modifiable dans `/api/stripe/create-checkout-session/route.ts`)

## 🚀 Utilisation

### Dans le code

```tsx
import RechargePanel from "@/components/RechargePanel";

<RechargePanel 
  id_bijou="abc123" 
  currentCredits={5} 
/>
```

### Flow utilisateur

1. **Client clique sur "Recharger"** → `/api/stripe/create-checkout-session`
2. **Redirection vers Stripe Checkout** → Paiement sécurisé
3. **Paiement confirmé** → Webhook `/api/stripe/webhook`
4. **Crédits ajoutés** en DB automatiquement
5. **Redirection** vers `/listen/{id_bijou}?payment=success`

## 🔒 Sécurité

- ✅ Clés secrètes côté serveur uniquement
- ✅ Signature des webhooks vérifiée
- ✅ Mode test par défaut
- ✅ Montants calculés côté serveur (pas modifiable par le client)

## 📊 Table transactions (optionnelle)

Pour tracker l'historique des paiements, créer cette table dans Supabase:

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_bijou TEXT NOT NULL REFERENCES bijoux(id_bijou),
  type TEXT NOT NULL, -- 'recharge'
  credits INTEGER NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🌍 Production

Avant de passer en production:

1. **Basculer en mode Live** sur Stripe Dashboard
2. Obtenir les **clés Live** (pas `_test_`)
3. Mettre à jour `.env.local` (ou variables Vercel)
4. Reconfigurer le **webhook en production** avec l'URL publique
5. Tester avec une vraie carte (mode Live)

## 🎨 Personnalisation

### Modifier les prix

Dans `/api/stripe/create-checkout-session/route.ts`:
```typescript
const PRICE_PER_CREDIT = 100; // en centimes (100 = 1€)
```

### Modifier les packages

Dans `/components/RechargePanel.tsx`:
```typescript
const CREDIT_PACKAGES = [
  { credits: 10, price: 10, popular: false },
  // Ajouter vos packages ici
];
```

## 🧪 Tests

### Cartes de test Stripe

- **Succès**: `4242 4242 4242 4242`
- **Échec**: `4000 0000 0000 0002`
- Date: n'importe quelle date future
- CVC: n'importe quel 3 chiffres

## ❓ Support

- [Documentation Stripe](https://stripe.com/docs)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Dashboard Stripe](https://dashboard.stripe.com)
