# HackerBoard — Dokumentation

> Live: **https://board.derhacker.com**
> ⚠️ Enthält Zugangs-Infos — nicht öffentlich teilen.

---

## 1. Was kann das Tool

Ein **kreatives Command-Center / Ideen-Board** (Huly-inspiriert). Premium-Dark-UI zum visuellen Ideen-Festhalten und Next-Step-Planen.

- **Cards** mit Thumbnail, Titel, Notiz, Status, Next Step, Fälligkeitsdatum, Tags, Datei-Anzahl
- **Sektionen**: Inbox, What's Next, Ideas, Projects, Trailers, Events, Clients, Archive
- **Command Bar** (Cmd/Ctrl+K) zum Springen
- **Daily Spark** als Startbereich: dichter, täglich neu mischbarer Mosaik-Mix aus Ideen, Bildern, Projekten und anstehenden Aufgaben
- **Fortschritt & Reward**: Erledigt-Zähler für heute/Woche, offene Aufgaben sowie visueller XP-Reward mit kurzem Sound
- **Inspiration Feed**: animierte Kachel aus vorhandenen Bild-Cards; eine externe Midjourney-Anbindung benötigt später eine zulässige, stabile Datenquelle
- **Inspector** (rechte Spalte): Vorschau, Beschreibung, Next Step, Datum, Dateien, Links, Notizen, Checkliste, Activity
- **Drag & Drop Upload** — Dateien reinziehen → werden zu Cards (Bild-Thumbnail), Dateien landen auf dem Server
- **Lightbox** — Vorschaubild per Klick groß
- Karte löschen (Hover-Button + Inspector), archivieren, Section wechseln
- Design: homogen **Mono-Lime** auf tiefem Anthrazit, animierte Aurora, rotierender Glow-Rand um Cards, Punkt-Halos, Grain

---

## 2. Was es in Zukunft können soll

- Weitere Card-Features nach Bedarf (Verknüpfungen, mehr Filter)
- Persistente Streaks, XP-Level und historische Auswertung statt der zunächst aus Card-Status und Änderungsdatum berechneten Werte
- Optionaler kuratierter externer Inspirationsfeed (keine fragile Midjourney-Seitenabfrage)
- (Design gilt als Referenz für die anderen Tools — „HackerBoard-Look")

---

## 3. Worauf achten ⚠️

- **Farbschema homogen Mono-Lime** (#ccff00) — bewusst **keine** zweite Kontrastfarbe (Koralle/Blau wurden verworfen). Farbe nur für Bedeutung (grün = done).
- **Deploy nie per docker-compose** (Prisma/Alpine-Probleme historisch) — läuft direkt via **pm2** auf dem Host.
- Bei Prisma-Schema-Änderungen zusätzlich `npx prisma generate` + `npm run build` auf der VPS.
- Lokale `package-lock.json`-Konflikte → `git fetch && git reset --hard origin/main`.
- Der Proxy läuft über Coolify-Traefik: zusätzliche Datei `/data/coolify/proxy/dynamic/hackerboard.yaml` routet `board.derhacker.com` → `172.18.0.1:3002`. **Andere Coolify-Dateien nicht anfassen.**

---

## 4. Wie es gebaut ist

- **Frontend**: React 18 + Vite + TypeScript (`frontend/src/`), Komponenten Sidebar/CommandBar/CardGrid/Card/Inspector/Lightbox, eigene SVG-Gradient-Icons, Inter-Font. Build geht nach `backend/public/`.
- **Backend**: Fastify + TypeScript (`backend/src/server.ts`), REST-API für Cards/Files/Checklist, Datei-Upload (multipart), serviert auch das gebaute Frontend.
- **Datenbank**: **SQLite via Prisma** (`backend/prisma/schema.prisma`) — DB-Datei `/root/hackerboard/data/hackerboard.db`. Tags als JSON-String gespeichert.
- **Uploads**: `/root/hackerboard/data/uploads/`, serviert unter `/uploads/`.

---

## 5. Wo es liegt & Links

| Was | Ort / Link |
|---|---|
| **Live** | https://board.derhacker.com |
| **Lokal** | `/Users/derhacker/Documents/Mediahub/hackerboard` (Git, primärer Arbeitsordner) |
| **VPS** | `187.127.87.96:/root/hackerboard` (pm2-Dienst `hackerboard-api`, Port 3002) |
| **GitHub** | github.com/chrisderhacker/hackerboard |
| **Proxy-Config** | `/data/coolify/proxy/dynamic/hackerboard.yaml` (auf der VPS) |

**Zugänge**: SSH `root@187.127.87.96` (Key). DNS: A-Record `board` → `187.127.87.96` bei lima-city.

---

## 6. Wie deployed wird

```bash
# lokal
cd /Users/derhacker/Documents/Mediahub/hackerboard
git add -A && git commit -m "..." && git push

# auf der VPS
ssh root@187.127.87.96
cd /root/hackerboard
git fetch && git reset --hard origin/main
cd frontend && npm run build          # baut nach backend/public
pm2 restart hackerboard-api
# bei Prisma-Änderungen zusätzlich:
cd ../backend && npx prisma generate && npm run build && pm2 restart hackerboard-api
```

pm2-Dienste: `hackerboard-api` (Port 3002, serviert API + Frontend). Autostart nach Reboot via `pm2 save` + `pm2 startup`.

---

## 7. Lokale Projektstruktur

Der Ordner `/Users/derhacker/Documents/Mediahub/hackerboard` ist das primäre Git-Repository und der verbindliche Arbeitsort für alle weiteren Änderungen. Die Anwendung liegt direkt im Projektstamm:

`frontend/` (React/Vite) · `backend/` (Fastify/Prisma) · `DOKUMENTATION.md` · `docker-compose.yml` · `backend.Dockerfile` · `nginx.conf` · `README.md` · `.env.example`

Der ältere Ordner `./files/` ist nur noch eine historische Projektkopie und darf nicht als Quelle für Entwicklung oder Deployment verwendet werden. Der bisherige Arbeitsordner `/Users/derhacker/Documents/board` ist ebenfalls nicht mehr der primäre Arbeitsort.
