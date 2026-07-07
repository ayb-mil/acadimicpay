# AcadPay — Site vitrine de paiement académique international

Site vitrine + prise de contact (Next.js 14, App Router, TypeScript, Tailwind CSS).
Aucune passerelle de paiement, aucun compte utilisateur, aucun portefeuille en ligne :
le paiement réel se négocie manuellement (WhatsApp / email) après contact.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Contenu en JSON dans `/content` (aucun contenu codé en dur dans les composants)
- Formulaire de contact : envoi d'email via [Resend](https://resend.com) + lien WhatsApp
  pré-rempli + stockage des soumissions dans `data/submissions.json` (en local)
- Déploiement : [Vercel](https://vercel.com) (build Next.js natif, HTTPS automatique),
  domaine **acadpay.me**

## Démarrage local

```bash
npm install
cp .env.example .env   # renseigner RESEND_API_KEY, CONTACT_EMAIL_TO, NEXT_PUBLIC_WHATSAPP_NUMBER
npm run dev
```

Le site est disponible sur http://localhost:3000. Sans `RESEND_API_KEY` /
`CONTACT_EMAIL_TO`, le formulaire de contact fonctionne quand même : la soumission
est enregistrée dans `data/submissions.json`, l'envoi d'email est simplement ignoré
(un avertissement est loggé côté serveur).

## Ajouter du contenu (sans toucher au code)

Tout le contenu éditable vit dans `/content/fr/*.json`. Éditez le fichier concerné et
redéployez — aucun composant à modifier.

| Je veux…                          | Fichier à éditer                     |
|-----------------------------------|---------------------------------------|
| Ajouter/modifier un service       | `content/fr/services.json`            |
| Ajouter un témoignage             | `content/fr/testimonials.json`        |
| Ajouter une question FAQ          | `content/fr/faq.json`                 |
| Modifier la grille tarifaire      | `content/fr/pricing.json`             |
| Modifier les cartes « bénéfices » (accueil) | `content/fr/benefits.json`  |
| Modifier l'étude de cas           | `content/fr/case-study.json`          |
| Modifier la checklist « revue prédatrice » | `content/fr/predatory-guide.json` |
| Modifier le pitch, les étapes, les coordonnées | `content/fr/site.json`   |
| Modifier les libellés de navigation/boutons | `content/locales/fr.json`   |

### Exemple : ajouter un service

Ajoutez une entrée dans `content/fr/services.json` :

```json
{
  "slug": "traduction",
  "order": 5,
  "title": "Traduction académique certifiée",
  "shortDescription": "Paiement de services de traduction certifiée pour vos publications.",
  "icon": "document",
  "intro": "...",
  "details": ["...", "..."],
  "whoFor": "..."
}
```

La page `/services/traduction` est générée automatiquement, ainsi que sa carte sur
`/services` et l'accueil.

### Ajouter une langue (arabe / anglais)

L'architecture est prête pour le multilingue :

- Contenu : créez `content/ar/services.json` (et les autres fichiers) — s'il manque
  un fichier pour une langue, le chargeur (`lib/content.ts`) retombe automatiquement
  sur la version française, donc rien ne casse pendant la traduction progressive.
- Interface (nav, boutons, footer) : créez `content/locales/ar.json` sur le modèle de
  `content/locales/fr.json` (`lib/i18n.ts` a le même comportement de repli).
- Le routage par langue (`/ar/...`) n'est pas encore branché : à ajouter plus tard via
  un segment `app/[locale]/` quand une deuxième langue sera prête à être publiée.

## Formulaire de contact

- `POST /api/contact` valide les champs (`lib/validation.ts`), enregistre la
  soumission dans `data/submissions.json` (`lib/submissions.ts`), puis envoie un email
  via Resend si `RESEND_API_KEY` et `CONTACT_EMAIL_TO` sont configurés.
- Le bouton « Écrire directement sur WhatsApp » construit un lien `wa.me` pré-rempli
  avec les informations déjà saisies dans le formulaire (`lib/whatsapp.ts`).
- Export des soumissions : `data/submissions.json` est un simple tableau JSON,
  consultable ou exportable directement (pas de base de données requise pour la V1).

## Déploiement sur Vercel

Vercel build et héberge Next.js nativement : **aucune configuration Docker, Nginx ou
Certbot n'est nécessaire**, et le **HTTPS/SSL est fourni et renouvelé automatiquement**.

### 1. Connecter le dépôt GitHub à Vercel

1. Poussez ce projet sur un dépôt GitHub.
2. Sur [vercel.com](https://vercel.com), **Add New… → Project**, puis importez le dépôt.
3. Vercel détecte Next.js automatiquement — laissez les réglages par défaut
   (Framework : Next.js, Build Command : `next build`, aucune modification requise).
4. **Environment Variables** : ajoutez les mêmes clés que `.env.example` :

   | Variable | Valeur |
   |----------|--------|
   | `RESEND_API_KEY` | votre clé Resend |
   | `CONTACT_EMAIL_FROM` | ex : `AcadPay <contact@acadpay.me>` (domaine vérifié sur Resend) |
   | `CONTACT_EMAIL_TO` | `ayoubelmqarta6@gmail.com` |
   | `NEXT_PUBLIC_WHATSAPP_NUMBER` | `212609933218` |
   | `NEXT_PUBLIC_SITE_URL` | `https://acadpay.me` |

5. **Deploy**. Chaque push sur `main` redéploie automatiquement (previews sur les autres branches).

### 2. Configurer le domaine acadpay.me

Dans le projet Vercel → **Settings → Domains** :

1. Ajoutez `acadpay.me` **et** `www.acadpay.me`.
2. Vercel propose de rediriger l'un vers l'autre — recommandé : `www` → `acadpay.me`
   (ou l'inverse), au choix.
3. Vercel affiche alors les enregistrements DNS exacts à créer (voir étape 3).

### 3. Enregistrements DNS à ajouter dans Namecheap

Dans Namecheap → **Domain List → acadpay.me → Manage → Advanced DNS** :

1. **Supprimez** les enregistrements par défaut de parking (CNAME `www` → `parkingpage`,
   et l'URL Redirect sur `@`) — sinon ils entrent en conflit.
2. Ajoutez :

   | Type          | Host  | Value (Vercel)            | TTL       |
   |---------------|-------|---------------------------|-----------|
   | `A Record`    | `@`   | `76.76.21.21`             | Automatic |
   | `CNAME Record`| `www` | `cname.vercel-dns.com.`   | Automatic |

   > `@` = le domaine racine (apex) `acadpay.me`. Namecheap n'autorise pas de CNAME sur
   > l'apex, d'où l'enregistrement **A** pour la racine. `76.76.21.21` est l'IP d'apex de
   > Vercel ; utilisez toujours la valeur exacte affichée dans **Settings → Domains** de
   > votre projet, car elle peut évoluer.

3. La propagation DNS prend de quelques minutes à quelques heures. Vercel passe le
   domaine en « Valid Configuration » et **émet le certificat SSL automatiquement** une
   fois la propagation détectée — rien à faire côté HTTPS.

### 4. Stockage des soumissions de contact en production

> ⚠️ Sur Vercel (fonctions serverless), le système de fichiers est **éphémère et en
> lecture seule** : l'écriture dans `data/submissions.json` **ne persiste pas**. Le code
> est prévu pour ça (l'échec d'écriture est silencieux et non bloquant), donc le
> formulaire fonctionne normalement — mais **l'email Resend devient la seule source de
> vérité** pour les demandes reçues. Configurez donc bien `RESEND_API_KEY` et
> `CONTACT_EMAIL_TO`.
>
> Le fichier `data/submissions.json` reste utile **en local** (développement) pour
> consulter les soumissions. Pour un archivage persistant en production plus tard, brancher
> un stockage externe (ex : une base Vercel Postgres/KV, ou un simple Google Sheet via
> webhook) — non requis pour la V1.

## Sécurité des dépendances

`npm audit` signale des avisories Next.js dont le correctif complet nécessite Next 16
(changement majeur, non demandé pour cette V1). Le projet utilise `14.2.35`, le dernier
correctif disponible sur la branche 14.x. À réévaluer une migration vers Next 15/16
lors d'une prochaine itération.

## Build & lint

```bash
npm run build
npm run lint
```

## Ce que ce site N'EST PAS (V1)

- Pas de passerelle de paiement en ligne ni d'intégration Stripe/crypto.
- Pas de compte utilisateur, pas de mot de passe.
- Pas de dashboard admin : `data/submissions.json` suffit pour consulter/exporter les
  demandes de contact.

## Avant mise en production

- Remplacer les témoignages d'exemple dans `content/fr/testimonials.json` par de vrais
  témoignages (le brief interdit les fausses preuves sociales).
- Vérifier les montants de commission dans `content/fr/pricing.json`.
- Renseigner les vraies coordonnées (email, WhatsApp) dans `content/fr/site.json` et `.env`.
