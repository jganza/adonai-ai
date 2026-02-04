# Deploy Commands for ADONAI AI

This document summarizes the git commands needed to upload your project to GitHub and run tests locally.

## Initializing and pushing to GitHub

1. Initialize a new git repository in your project directory:
   ```bash
   git init
   ```

2. Add all files to the repository:
   ```bash
   git add .
   ```

3. Commit the files with a message:
   ```bash
   git commit -m "Initial commit"
   ```

4. Set the default branch to `main`:
   ```bash
   git branch -M main
   ```

5. Add the remote origin (replace `<your-username>` with your GitHub username):
   ```bash
   git remote add origin https://github.com/<your-username>/adonai-ai.git
   ```

6. Push the code to GitHub:
   ```bash
   git push -u origin main
   ```

## Updating your code

After making changes to the project, use the following commands:

```bash
git add <path-to-files>
git commit -m "Describe your changes"
git push
```

Render will automatically redeploy the application when new commits are pushed if auto-deploy is enabled.

## Running tests locally

Ensure your dependencies are installed (`npm install`), then run:

```bash
npm test
```
