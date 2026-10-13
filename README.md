# OpenEOS Shop

Öffentlicher Online-Shop für einzelne OpenEOS-Veranstaltungen (`/[eventId]`). Gäste durchstöbern das Produktangebot einer Veranstaltung, legen Artikel in den Warenkorb und schließen den Kauf über die Checkout-Seite (inkl. PayPal-Rückkehr-Flow unter `/[eventId]/checkout/return`) ab.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI:** React 19 + Untitled UI Icons
- **State Management:** TanStack Query + Zustand
- **Zahlung:** PayPal
- **Icons:** `@openeos/pos-icons`

## Setup

```bash
# Dependencies installieren
pnpm install

# Development Server starten (Port 3004)
pnpm dev

# Production Build
pnpm build
pnpm start

# Linting
pnpm lint
```

Der Dev-Server läuft standardmäßig auf [http://localhost:3004](http://localhost:3004).

## Docker

```bash
docker compose up -d --build
```

## Automatisches Deployment

Nach jedem erfolgreichen Image-Build auf `main` (Workflow `.github/workflows/build-deploy.yaml`, Job `deploy`) kann automatisch auf den Produktionsserver deployed werden. Der Deploy-Job ist standardmäßig deaktiviert und muss explizit aktiviert werden.

**Aktivieren:** Repository-Variable `DEPLOY_ENABLED` auf `true` setzen (Settings → Secrets and variables → Actions → Variables).

**Benötigte Variables:**

| Variable | Beschreibung |
|----------|--------------|
| `DEPLOY_ENABLED` | `true` aktiviert den Deploy-Job, sonst wird er übersprungen |
| `DEPLOY_PATH` | Optional — Compose-Verzeichnis auf dem Server (Default: `/srv/docker/<repo-name>`) |
| `DEPLOY_SERVICE` | Optional — Compose-Dienst (Default: der Dienst mit dem Image dieses Repos) |
| `DEPLOY_GUARD_URL` | Optional — Deploy-Schutz-Endpunkt (Default: `https://api.openeos.de/api/internal/deploy-guard`) |

**Benötigte Secrets:**

| Secret | Beschreibung |
|--------|--------------|
| `DEPLOY_HOST` | Hostname/IP des Produktionsservers |
| `DEPLOY_USER` | SSH-Benutzer |
| `DEPLOY_SSH_KEY` | Privater SSH-Key für den Zugriff |
| `DEPLOY_PORT` | (optional) SSH-Port, Standard: `22` |
| `DEPLOY_GUARD_TOKEN` | Token des Deploy-Schutzes (wie in der `.env` der Produktions-API); ohne ihn wird die Prüfung mit Warnung übersprungen |

Ablauf:

1. **Deploy-Schutz** (nur Produktion, Composite Action
   `OpenEOS-Project/.github/actions/deploy-guard`): läuft gerade ein Fest —
   eine aktive Veranstaltung mit echten Bestellungen in den letzten
   30 Minuten —, wartet der Job, fragt alle 5 Minuten erneut und bricht nach
   90 Minuten ab. Übergehen: „Run workflow“ auf `main` mit `force: true`.
2. Per SSH: `docker compose pull <dienst>`, dann **`docker rollout <dienst>`**
   ([docker-rollout](https://github.com/wowu/docker-rollout)): neue Instanzen
   starten neben den alten, bekommen erst Verkehr, wenn ihr Health-Check
   (`/api/health`) grün ist; die alten werden über `/tmp/drain` aus dem Proxy
   genommen und dann gestoppt. Werden die neuen nicht gesund, laufen die alten
   weiter und das vorige Image bekommt sein Tag zurück. Ohne `docker rollout`
   auf dem Server: `docker compose up -d` wie bisher.
3. `docker image prune -f`.

**Health-Check:** `GET /api/health` antwortet 200, sobald der Next-Server läuft
(ohne API-Aufruf). **Herunterfahren:** Auf SIGTERM nimmt Next.js keine neuen
Verbindungen mehr an, lässt laufende Anfragen zu Ende laufen und beendet sich.
