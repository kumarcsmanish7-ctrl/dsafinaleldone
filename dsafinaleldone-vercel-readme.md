This repo contains a static site under the `dsa-visualizer/` folder.

Deployment to Vercel
- Option A (recommended): Import the GitHub repo in Vercel, set the Root Directory to `/dsa-visualizer`.
- Option B: Use the provided `vercel.json` which routes all requests to `dsa-visualizer/`.

Quick steps after linking the repo on Vercel:

1. In Project Settings > General, set Root Directory to `dsa-visualizer` (optional if using `vercel.json`).
2. Deploy (Vercel will serve static files automatically).

Local preview

Run a quick static server from the project root:

```powershell
cd "c:\Users\kumar\c tutorials\dsa label main\dsa-visualizer"
python -m http.server 3000
# or with node (if you installed serve): npx serve . -p 3000
```

Notes
- The site is a static HTML/CSS/JS app located at `dsa-visualizer/`.
