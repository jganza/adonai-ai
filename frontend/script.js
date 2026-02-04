// Client-side JavaScript to handle form submission and display response
// Wait until the DOM is fully loaded

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  const textarea = document.querySelector('textarea');
  const responseDiv = document.getElementById('response');

  if (!form || !textarea || !responseDiv) {
    console.error('Required elements not found in the DOM');
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = textarea.value.trim();
    if (!message) {
      return;
    }
    // Show loading message while waiting for the API response
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
      // Display the assistant's message or an error message
      responseDiv.textContent = data.assistantMessage || data.error || '';
    } catch (err) {
      responseDiv.textContent = 'Error: ' + err.message;
    }
  });
});
