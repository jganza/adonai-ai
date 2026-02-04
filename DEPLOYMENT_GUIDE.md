# Deployment Guide for ADONAI AI

This guide explains how to deploy the ADONAI AI monorepo to a public URL using GitHub and Render.com. It assumes you have a working project directory as described in the README.

## 1. Prepare a GitHub repository

1. **Create a GitHub account** – go to https://github.com and sign up if you do not have an account.
2. **Create a new repository** – after logging in, click the **New** repository button. Name the repository `adonai-ai` and leave it public. Do not initialize with a README because you will push the existing code.
3. **Upload the code**:
   - *Option A: GitHub web interface*: In your new repository, click **Add file → Upload files** and drag all files and folders from your project directory. Commit the upload with a descriptive message.
   - *Option B: Command line*:
     ```bash
     # in your project directory
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin https://github.com/<your-username>/adonai-ai.git
     git push -u origin main
     ```
     Replace `<your‑username>` with your GitHub username. This sequence initializes a git repository, commits all files, sets the branch to `main`, and pushes to GitHub.

## 2. Configure Render.com

1. **Create a Render.com account** – visit https://render.com and sign up (free tier available).
2. **Connect GitHub** – after logging in to Render, go to the **Dashboard**, click **New → Web Service**, then click **Connect account** and authorize Render to access your GitHub repositories.
3. **Create the service**:
   - Select the `adonai-ai` repository.
   - Set **Name** to `adonai-ai`.
   - Choose **Runtime** as **Node**.
   - For **Build Command** you can leave it blank (Render runs `npm install` automatically) or explicitly set `npm install`.
   - For **Start Command** enter `npm start`. The `start` script in `package.json` runs `node backend/server.js`, which starts the application.
   - Choose the **Free** instance type to deploy on the free tier.
4. **Set environment variables** – click **Add environment variable** and add:
   - `OPENAI_API_KEY` → **your real API key** (starts with `sk-...`). Render marks this as secret.
   - `PORT` (optional) → `3000`. Render automatically injects `PORT`; leaving it blank uses Render’s default port.
5. **Auto‑deploy** – the provided `render.yaml` file instructs Render to automatically deploy on new commits. Check the **Auto deploy** option.
6. Click **Create Web Service**. Render will install dependencies, build the service, and start it.

## 3. Testing the deployed app

Once deployment completes, Render will provide a public URL (for example, `https://adonai-ai.onrender.com`). Visit the URL in your browser. You should see the chat interface with a text area, a **Seek Wisdom** button, and a results panel.

Try asking a question such as:

- “What does the Bible say about forgiveness?”
- “How can I manage worry and anxiety?”

If the API key is valid, the app will show a response. If the key is missing or incorrect, you will see an error message.

## 4. Troubleshooting

- **Invalid API key (401)** – ensure `OPENAI_API_KEY` is correctly set in Render’s environment variables and that there is no extra whitespace.
- **Build fails** – check the build logs on Render under the **Logs** tab. Make sure `package.json` includes a `start` script. You can set the build command to `npm install` if needed.
- **Changes don’t show** – confirm that you committed and pushed your changes to GitHub. Auto‑deploy triggers on push; you can also click **Manual deploy** in Render.
- **Application crash** – view the **Logs** tab. Errors may indicate missing environment variables, network issues, or exceptions in the code. You can restart the service or redeploy via the Render dashboard.

## Conclusion

After completing these steps, your ADONAI AI app will be publicly accessible. Use the checklist in [DEPLOYMENT_CHECKLIST.md] to verify each stage, and consult this guide whenever you need to redeploy or troubleshoot.
