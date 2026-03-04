# P2P Rental Platform

A peer-to-peer platform for renting items between users.
The project is focused exclusively on **item rentals**.

Users can list items for rent, search for available items, and rent them from other users.

---

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- TanStack Query

### Backend

- NestJS
- TypeScript
- PostgreSQL

### Infrastructure

- Docker
- PostgreSQL
- MinIO (S3 compatible object storage)

---

## Architecture

```
Frontend (Next.js)
        |
        v
Backend (NestJS API)
        |
        |---- PostgreSQL (application data)
        |
        |---- MinIO (file storage: images, avatars, etc.)
```

---

## Project Structure

```
Rental
│
├ frontend          # Next.js application
│
├ backend           # NestJS API
│
├ docker-compose.yml
│
├ .editorconfig
├ .prettierrc
└ README.md
```

---

## Features (planned)

- User authentication
- Create rental listings
- Upload item images
- Search and filter listings
- Booking / rental requests
- User profiles
- Messaging between users
- Ratings and reviews

---

## Getting Started

### 1. Clone repository

```
git clone https://github.com/AZ4T/Rental.git
cd Rental
```

---

### 2. Start infrastructure

Run PostgreSQL and MinIO using Docker:

```
docker compose up -d
```

Services:

| Service       | URL                   |
| ------------- | --------------------- |
| PostgreSQL    | localhost:5432        |
| MinIO Console | http://localhost:9001 |
| MinIO S3 API  | http://localhost:9000 |

MinIO credentials:

```
login: minio
password: minio12345
```

---

### 3. Run backend

```
cd backend
npm install
npm run start:dev
```

Backend will start on:

```
http://localhost:3000
```

---

### 4. Run frontend

```
cd frontend
npm install
npm run dev
```

Frontend will start on:

```
http://localhost:3001
```

---

## Development

Code formatting:

```
Prettier
tab width: 4 spaces
```

Linting:

```
ESLint
```

---

## Storage

The project uses **MinIO** as a local S3-compatible storage for:

- item images
- user avatars
- uploaded files

---

## Database

PostgreSQL is used as the main database for storing:

- users
- listings
- rentals
- reviews
- messages

---

## License

This project is developed as a **diploma project**.
