# FWorld — Setup Guide

A step-by-step guide to run this project on your computer. No prior experience with
this codebase is needed — just follow each step in order.

FWorld is an online clothing store. It has three parts, and this one repository
contains all of them:

- **Frontend** — the website customers and admins see (Next.js). Runs on **http://localhost:3000**
- **Backend** — the API/server that stores data and handles logins, orders, payments (NestJS). Runs on **http://localhost:4000**
- **Databases** — PostgreSQL, Redis and Meilisearch, started automatically with Docker.

---

## 1. Install the prerequisites (one time)

Install these four programs first:

| Tool               | Version            | Where to get it                                                      |
| ------------------ | ------------------ | -------------------------------------------------------------------- |
| **Git**            | any recent         | https://git-scm.com/downloads                                        |
| **Node.js**        | **22.12 or newer** | https://nodejs.org (download the "LTS" installer)                    |
| **pnpm**           | 10+                | after installing Node, run: `corepack enable` (that's it)            |
| **Docker Desktop** | any recent         | https://www.docker.com/products/docker-desktop — **must be running** |

To confirm they're installed, open a terminal (PowerShell on Windows) and run:

```bash
node -v      # should print v22.x or higher
pnpm -v      # should print 10.x (if "command not found", run: corepack enable)
docker -v    # should print a version
```

> **Windows tip:** open **PowerShell** (search "PowerShell" in the Start menu). All
> commands below work there. Make sure **Docker Desktop is open and running** (whale
> icon in the system tray) before the Docker steps.

---

## 2. Get the code

```bash
git clone https://github.com/sunnychaun9/fworld-ecommerce.git
cd fworld-ecommerce
```

This downloads the project and moves you into its folder. Everything you need is on
the default branch (`main`).

---

## 3. Add the secret file (you'll receive this separately)

The project needs one configuration file that is **not** in the repository because it
contains passwords/keys: **`backend/.env`**.

- Ask the project owner to send you the **`backend/.env`** file.
- Put it inside the **`backend`** folder, so the path is exactly:
  `fworld-ecommerce/backend/.env`

> The **frontend needs no extra file** — it already defaults to the local backend.
> (Optional: if you're ever told to, copy `frontend/.env.example` to `frontend/.env`.)

If you can't get the file, you can create your own from the template:

```bash
cp backend/.env.example backend/.env
```

…but the app owner's file is preferred, since it already has the correct keys.

---

## 4. Install the project's packages

```bash
pnpm install
```

This downloads all the code libraries the project uses. It can take a few minutes the
first time.

---

## 5. Start the databases (Docker)

Make sure **Docker Desktop is running**, then:

```bash
docker compose up -d
```

This starts PostgreSQL, Redis and Meilisearch in the background. Check they're healthy:

```bash
docker compose ps
```

You should see three containers `running`: `fworld-postgres`, `fworld-redis`,
`fworld-meilisearch`.

---

## 6. Create the database tables (first run only)

```bash
pnpm --filter @fworld/backend prisma:migrate
```

This builds all the tables the app needs inside PostgreSQL. You only need to do this
the first time (and again if the database schema ever changes).

---

## 7. Run the app

```bash
pnpm dev
```

This starts **both** the backend and frontend together. Wait until you see it's ready,
then open your browser:

- **Website:** http://localhost:3000
- **API (backend):** http://localhost:4000

Leave this terminal open while you use the app. Press **Ctrl + C** to stop it.

---

## 8. Create an account (and an admin, if needed)

1. Open http://localhost:3000 and click **Register** to create a normal customer
   account.
2. **To use the Admin panel** (`/admin`), that account must be made an admin. New
   accounts are regular customers by default and will be redirected away from `/admin`.

   Promote your account to admin by running this (replace the email with yours):

   ```bash
   docker exec fworld-postgres psql -U fworld -d fworld -c "UPDATE users SET role='ADMIN' WHERE email='your-email@example.com';"
   ```

3. **Sign out and sign back in** (important — the role is read at login), then open
   **http://localhost:3000/admin**.

> **Adding images in Admin:** images are added by **URL** (paste a link to an
> image), not uploaded from your computer. Product images are added on a product's
> **edit** page (Admin → Products → open a product → Media). For quick testing you can
> paste a placeholder like `https://picsum.photos/600/800`.

---

## Everyday commands

| I want to…                            | Command                                        |
| ------------------------------------- | ---------------------------------------------- |
| Start the databases                   | `docker compose up -d`                         |
| Start the app (backend + frontend)    | `pnpm dev`                                     |
| Stop the app                          | press **Ctrl + C** in its terminal             |
| Stop the databases                    | `docker compose down`                          |
| See running containers                | `docker compose ps`                            |
| Rebuild DB tables after schema change | `pnpm --filter @fworld/backend prisma:migrate` |
| Browse the database visually          | `pnpm --filter @fworld/backend prisma:studio`  |

---

## Troubleshooting

**"The container name /fworld-redis is already in use"** — a leftover container from
before. Remove it and try again (your data is safe, it's stored in a volume):

```bash
docker rm -f fworld-redis
docker compose up -d
```

**A port is already in use (3000 or 4000)** — another program is using it. Close that
program, or stop any other copy of this app, then run `pnpm dev` again.

**Login fails / network or CORS errors in the browser console** — make sure the
backend is running on port 4000 and that `backend/.env` has
`CORS_ORIGIN=http://localhost:3000`.

**`/admin` keeps redirecting to the home page** — your account isn't an admin yet, or
you haven't re-logged-in after being promoted. Repeat step 8 (promote, then sign out
and back in).

**Prisma / database connection errors** — Docker Desktop probably isn't running, or the
containers aren't up. Run `docker compose up -d`, wait a few seconds, then retry.

**`pnpm: command not found`** — run `corepack enable`, then reopen the terminal.

---

## Project layout (for reference)

```
fworld-ecommerce/
├── frontend/        Next.js website (customer store + /admin dashboard)  → :3000
├── backend/         NestJS API server                                    → :4000
│   └── .env         ← the secret file you add in step 3 (not in git)
├── docker-compose.yml   PostgreSQL + Redis + Meilisearch
└── SETUP.md         this file
```

That's it — if the website opens at http://localhost:3000 and you can register and log
in, everything is working. 🎉
