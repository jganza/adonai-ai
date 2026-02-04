// Client-side JavaScript to handle user interactions for the Adonai chat
// This script binds a click handler to the "Send" button and posts the prompt to the backend API.

document.addEventListener('DOMContentLoaded', () => {
  // Grab references to elements defined in index.html
  const textarea = document.getElementById('prompt');
  const sendBtn = document.getElementById('sendBtn');
  const responseDiv = document.getElementById('response');

  // Check that the expected elements exist
  if (!textarea || !sendBtn || !responseDiv) {
    console.error('One or more required elements are missing from the page.');
    return;
  }

  // Attach a click event listener to the Send button
  sendBtn.addEventListener('click', async () => {
    const message = textarea.value.trim();
    if (!message) {
      return; // ignore empty prompts
    }
    // Display a loading message while waiting for the API response
    responseDiv.textContent = 'Seeking wisdom...';
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      // Display the returned message or an error
      responseDiv.textContent = data.assistantMessage || data.error || '';
    } catch (err) {
      responseDiv.textContent = 'Error: ' + err.message;
    }
  });
});
