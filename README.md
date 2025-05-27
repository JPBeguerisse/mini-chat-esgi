# Chat WebSocket App

Cette application est un système de chat en temps réel utilisant :

- **NestJS** (backend)
- **Next.js** (frontend)
- **PostgreSQL avec Docker** (base de données)
- Authentification avec JWT
- Couleurs personnalisées pour chaque utilisateur
- Communication en temps réel via **WebSocket (Socket.IO)**

---

## Prérequis

- [Node.js](https://nodejs.org/) v18+
- [Docker](https://www.docker.com/) installé et démarré
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)

---

## Lancer l'application

### 1. Lancer PostgreSQL avec Docker

Dans le dossier `chat-app-backend` 

```bash
docker compose up -d
```

---

### 2. Configuration des variables d’environnement

#### Backend (`chat-app-backend/.env`)

```env
DATABASE_URL=postgres://chatuser:chatpass@localhost:5432/chatapp
JWT_SECRET=une_clé_très_longue_et_sécurisée
PORT=8000
```

#### Frontend (`chat-app-frontend/.env`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### 3. Installer les dépendances

#### Backend

```bash
cd chat-app-backend
npm install
```

#### Frontend

```bash
cd ../chat-app-frontend
npm install
```

---

### 4. Démarrer les applications

#### Backend (NestJS)

```bash
cd chat-app-backend
npm run start:dev
```

#### Frontend (Next.js)

```bash
cd ../chat-app-frontend
npm run dev
```

---

## ✅ Fonctionnalités
- **Inscription JWT** sécurisée
- **Authentification JWT** sécurisée
- **Chat en temps réel** avec Socket.IO
- **Couleur personnalisée par utilisateur** (modifiable dans le chat)
- **Validation des formulaires** avec Zod
- **Routes protégées** avec `@UseGuards()`
- **Stockage des messages en base** 
- **Suppression de message** (si c’est le tien)
- **Affichage du jour** lors d’un changement de date dans l’historique des messages
- **Affichage de l’heure d’envoi** pour chaque message
- **Indicateur de message vu** (affiche qui a vu quel message)
- **Indicateur de frappe** (quand un utilisateur est en train d’écrire)
- **Mise à jour en base de la couleur** de l’utilisateur après modification
- **Interface responsive** et soignée avec Tailwind CSS
---

## Structure des dossiers

```
mini-chat-esgi/
│
├── chat-app-backend/      → NestJS (API + WebSocket)
│
├── chat-app-frontend/     → Next.js (UI avec Socket.IO client)
│
└── docker-compose.yml     → Conteneur PostgreSQL + app
```

---

## 📮 Auteur
- Jean Pierre Beguerisse
- Ilyesse HAMCHERIF

