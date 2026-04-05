# Plan d'Implémentation : Qr Share 📸

**Objectif :** Créer une application web professionnelle pour collecter et partager des photos d'événements via QR Code (Mobile-First).
**Architecture :** Next.js 14+ (App Router), Supabase (Auth/DB/Storage/Edge Functions), Vanilla CSS (CSS Modules), Deno (Edge Function ZIP).

---

### Tâche 1 : Initialisation & Structure CSS
**Lieu :** Dossier racine du projet.

**Étape 1 : Initialiser le projet Next.js**
- Commande : `npx -y create-next-app@latest ./ --ts --eslint --no-tailwind --src-dir --app --import-alias "@/*" --use-npm --yes`
- Configurer `.env.local` avec `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

**Étape 2 : Design System (Vanilla CSS Tokens)**
- Fichier : `src/app/globals.css`
- Définir les variables de thème (Pearl, Champagne, Glassmorphism).
- Implémenter une structure de layout responsive (Conteneur max 600px pour mobile-first).

---

### Tâche 2 : Configuration Backend Supabase
**Lieu :** Supabase Dashboard (SQL Editor & Storage).

**Étape 1 : Schéma de données**
- Table `profiles` : `id (uuid, primary key, references auth.users)`, `full_name (text)`.
- Table `events` : `id (uuid)`, `name (text)`, `slug (text, unique)`, `owner_id (uuid, references profiles)`, `date (timestamp)`, `password (text)`.
- Table `uploads` : `id (uuid)`, `event_id (uuid, references events)`, `file_url (text)`, `uploader_name (text)`, `created_at`.

**Étape 2 : Storage & RLS**
- Créer le bucket `event-photos`.
- Règle RLS (Storage) : `SELECT` autorisé si l'owner regarde, ou lien public si activé. `INSERT` autorisé pour tout le monde (Public).

---

### Tâche 3 : Page de l'Événement (Public / Guest)
**Lieu :** `src/app/event/[slug]/page.tsx`

**Étape 1 : Interface d'Upload**
- Composant : `UploadZone.tsx`.
- État local : Liste des fichiers sélectionnés, prévisualisation via `URL.createObjectURL`.
- Fonction d'envoi : `supabase.storage.upload` avec renommage `timestamp_random.jpg`.
- Barre de progression animée.

**Étape 2 : Live Wall (Galerie Temps Réel)**
- Composant : `LiveWall.tsx`.
- Utiliser `supabase.channel().on('postgres_changes', ...)` pour rafraîchir la liste des photos dès qu'un nouvel enregistrement apparaît dans la table `uploads`.
- Design : Grille Masonry avec Glassmorphism sur les légendes.

---

### Tâche 4 : Espace Administration
**Lieu :** `src/app/admin/[slug]/page.tsx`

**Étape 1 : Middleware & Auth**
- Vérifier la session de l'utilisateur.
- Rediriger vers `/login` si non authentifié.

**Étape 2 : Panel de Gestion**
- Afficher les statistiques de l'événement.
- Outil de suppression : Supprimer le fichier physique dans le Storage et l'entrée en DB.
- Générateur de QR Code via `qrcode.react`.
- Copie du lien événement en un clic.

---

### Tâche 5 : Fonctionnalité Premium : Générateur ZIP
**Lieu :** `supabase/functions/generate-zip/index.ts`

**Étape 1 : Edge Function (Deno)**
- Utiliser la librairie `JSZip` compatible Deno.
- Récupérer tous les objets du dossier `/event_slug/` dans le bucket.
- Concaténer dans un ZIP et renvoyer le flux.

**Étape 2 : UI de téléchargement**
- Bouton "Télécharger tout (.zip)" dans le dashboard admin.
- Afficher un état de chargement pendant que l'Edge Function prépare le fichier.

---

### Tâche 6 : Finalisation & Déploiement
- Audit de performance (Lighthouse).
- Vérification de la compatibilité HEIC (important pour les photos iPhone).
- Déploiement via Coolify / VPS (création du `Dockerfile` si nécessaire).
