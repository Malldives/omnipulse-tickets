# OmniPulse — WhatsApp & Instagram Incoming Ticket Hub

Self-hosted UI/UX dashboard and Node.js webhook receiver for tracking real-time incoming customer tickets from **WhatsApp Business Cloud API** and **Instagram Direct / Story Mentions**.

## Quick Start (Local Self-Address)

1. Install dependencies and start the server:
   ```bash
   npm install
   cp .env.example .env
   npm start
   ```
2. Open `http://localhost:3000` in your browser.
3. Click the **GitHub & Self-Address Setup** tab inside the app and click **Connect** next to `http://localhost:3000` to enable live Server-Sent Events (SSE).

## Hosting on GitHub Pages with Your Custom Domain (Self-Address)

1. Edit the `CNAME` file and replace `tickets.yourdomain.com` with your own domain or subdomain.
2. Push this folder to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: OmniPulse Ticket Hub"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
3. In your GitHub repository, open **Settings → Pages**, set **Build and deployment** to **GitHub Actions** (or **Deploy from a branch: main**), and enter your custom domain.
4. Add a `CNAME` record in your DNS provider pointing your subdomain (e.g., `tickets`) to `<your-username>.github.io`.
