# Deployment Checklist

Use this checklist to ensure you have completed all steps required to deploy ADONAI AI successfully.

## Pre-deployment

- [ ] Node.js (v14 or later) and npm installed.
- [ ] All project files present (backend, frontend, test, config).
- [ ] `.gitignore` updated to exclude `node_modules`, `.env`, logs, and other sensitive files.
- [ ] Tests pass (`npm test`).

## GitHub

- [ ] GitHub account created and logged in.
- [ ] New repository `adonai-ai` created.
- [ ] Code uploaded or pushed to GitHub.
- [ ] Render deployment files (`render.yaml`) included.
- [ ] README and documentation committed.

## Render.com

- [ ] Render account created.
- [ ] GitHub account connected to Render.
- [ ] New Web Service created with:
  * Name: `adonai-ai`
  * Runtime: Node
  * Build command: `npm install` (or left blank)
  * Start command: `npm start`
  * Instance type: Free
- [ ] Environment variables configured:
  * `OPENAI_API_KEY` set to your actual key.
  * `PORT` (optional) set to `3000`.
- [ ] Auto deploy enabled.
- [ ] First deploy completed successfully.

## Post-deployment

- [ ] Visit the Render URL and confirm the UI loads.
- [ ] Ask sample questions to verify responses.
- [ ] Monitor logs for errors and adjust environment variables if necessary.
- [ ] If updates are needed, push commits to GitHub; verify Render redeploys automatically.

By following this checklist you can be confident that the application has been prepared, deployed, and tested correctly.
