// Frontend client script for ADONAI Biblical Wisdom AI
document.addEventListener('DOMContentLoaded', () => {
  const promptInput = document.getElementById('prompt');
  const sendBtn = document.getElementById('sendBtn');
  const responseDiv = document.getElementById('response');

  async function sendPrompt() {
    const prompt = promptInput.value.trim();
    if (!prompt) {
      alert('Please enter your question');
      return;
    }
    
    // Disable button and show loading
    sendBtn.disabled = true;
    sendBtn.textContent = 'Seeking wisdom...';
    responseDiv.textContent = 'ADONAI is contemplating your question...';
    responseDiv.className = 'loading';
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      
      if (res.ok) {
        responseDiv.textContent = data.message;
        responseDiv.className = '';
      } else {
        responseDiv.textContent = 'Error: ' + data.error;
        responseDiv.className = '';
      }
    } catch (err) {
      responseDiv.textContent = 'Error connecting to ADONAI: ' + err.message;
      responseDiv.className = '';
    } finally {
      // Re-enable button
      sendBtn.disabled = false;
      sendBtn.textContent = 'Seek Wisdom';
    }
  }

  // Send on button click
  sendBtn.addEventListener('click', sendPrompt);
  
  // Send on Enter (Ctrl+Enter for new line)
  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  });
});