# ADONAI AI

ADONAI is a web application that uses OpenAI's GPT-4o model to provide biblical wisdom for modern life. The project is organised as a monorepo with a Node.js backend and a simple HTML/JavaScript frontend. The backend exposes an API endpoint for chat and serves the frontend.

## Running locally

1. **Install dependencies** – make sure you have Node.js (v14 or later) installed. Check with `node -v` and `npm -v`. Install dependencies by running `npm install`.
2. **Set your OpenAI API key** – the application expects your OpenAI API key in the `OPENAI_API_KEY` environment variable. On Windows Command Prompt you can use:
   ```
   set OPENAI_API_KEY=your-api-key
   ```
   On macOS/Linux use:
   ```
   export OPENAI_API_KEY=your-api-key
   ```
   This environment variable is used to authenticate requests to OpenAI.
3. **Start the app** – run:
   ```
   npm start
   ```
   The server will listen on port 3000 by default, or the value of the `PORT` environment variable if defined. The frontend will be served from the same address, e.g. `http://localhost:3000`.

## Testing

The repository includes a minimal test runner and a test for the OpenAI service. To run the tests:

```
npm test
```

This executes `test/run-tests.js`, which loads any `.test.js` files in the `test` folder.

## Deployment

A complete deployment guide is provided in [DEPLOYMENT_GUIDE.md]. Quick commands for git operations are in [DEPLOY_COMMANDS.md], and a checklist to verify deployment is in [DEPLOYMENT_CHECKLIST.md].
