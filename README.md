# 💬 Chat WebSocket App

Cette application est un système de chat en temps réel utilisant :

- ⚙️ **NestJS** (backend)
- 🌐 **Next.js** (frontend)
- 🐘 **PostgreSQL avec Docker** (base de données)
- 🔐 Authentification avec JWT
- 🎨 Couleurs personnalisées pour chaque utilisateur
- 🔄 Communication en temps réel via **WebSocket (Socket.IO)**

---

## 🧱 Prérequis

- [Node.js](https://nodejs.org/) v18+
- [Docker](https://www.docker.com/) installé et démarré
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)

---

## 🚀 Lancer l'application

### 1. 🐘 Lancer PostgreSQL avec Docker

Dans le dossier `chat-app-backend` 

```bash
docker compose up -d
```

---

### 2. 🔧 Configuration des variables d’environnement

#### 📁 Backend (`chat-app-backend/.env`)

```env
DATABASE_URL=postgres://chatuser:chatpass@localhost:5432/chatapp
JWT_SECRET=une_clé_très_longue_et_sécurisée
PORT=8000
```

#### 📁 Frontend (`chat-app-frontend/.env`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### 3. 📦 Installer les dépendances

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

### 4. 🧠 Démarrer les applications

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

## 📌 Infos supplémentaires

- ✉️ Authentification : JWT
- 💬 Messagerie en temps réel avec Socket.IO
- 🎨 Couleurs personnalisées visibles dans les messages
- 🛡️ Routes sécurisées avec `@UseGuards()`
- 🧼 Validation des formulaires avec `zod`

---


