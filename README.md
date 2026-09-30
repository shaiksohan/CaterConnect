# CaterConnect

CaterConnect is a React + Vite frontend with a Node.js + Express + MongoDB backend for connecting catering providers with part-time catering workers.

## Project structure

```text
CaterConnect/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── global.css
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
├── server/
│   ├── middleware/
│   ├── models/
│   ├── .env.example
│   ├── package.json
│   ├── seed.js
│   └── server.js
│
├── .gitignore
└── README.md
```

## 1. Backend

Open a terminal:

```powershell
cd server
npm install
```

Create `server/.env` from `server/.env.example` and put your real MongoDB connection string in `MONGO_URI`.

Then seed demo data:

```powershell
npm run seed
```

Start the backend:

```powershell
npm run dev
```

Backend URL:

```text
http://localhost:5000
```

## 2. Frontend

Open a second terminal:

```powershell
cd client
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

If 5173 is already occupied, Vite may use 5174 or another available port; use the URL it prints.

## Demo accounts

Worker:

```text
Email: worker@demo.com
Password: demo123
```

Provider:

```text
Email: provider@demo.com
Password: demo123
```

## Important

MongoDB Atlas, payment processing, SMS/OTP, push notifications, image storage, maps, and production identity verification require the corresponding external accounts/API credentials. The local MVP includes the application structure and backend endpoints, but real third-party services cannot be activated without the user's own credentials.
