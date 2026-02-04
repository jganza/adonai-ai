// Frontend client script for the Adonai.ai chat demo
// This script binds the Send button to post a prompt to the backend API and display the result.

document.addEventListener('DOMContentLoaded', () => {
  const promptInput = document.getElementById('prompt');
  const sendBtn = document.getElementById('sendBtn');
  const responseDiv = document.getElementById('response');

  // Ensure required elements exist
  if (!promptInput || !sendBtn || !responseDiv) {
    console.error('One or more required elements are missing from the page.');
    return;
  }

  // Attach click handler to the Send button
  sendBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
      responseDiv.textContent = 'Please enter a prompt.';
      return;
    }
    // Disable the button and show a loading message while awaiting the API response
    sendBtn.disabled = true;
    responseDiv.textContent = 'Seeking wisdom...';
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (res.ok) {
        // Display the response message (support both `message` and `response` keys)
        responseDiv.textContent = data.message || data.response || '';
      } else {
        // Display any error returned from the API
        responseDiv.textContent = data.error || `Error: ${res.status}`;
      }
    } catch (err) {
      responseDiv.textContent = 'Error: ' + err.message;
    } finally {
      sendBtn.disabled = false;
    }
  });
});
