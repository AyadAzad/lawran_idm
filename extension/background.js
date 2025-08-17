// Listen for a message from the content script (when the user clicks our button)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Check if the message is for downloading a video
  if (request.action === "downloadVideo") {
    console.log("Background script received download request for:", request.url);

    // Send the request to your Flask backend API
    fetch('http://localhost:5000/api/download/video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // We'll just download at 1080p by default for simplicity
      body: JSON.stringify({ url: request.url, quality: '1080p' }),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Backend response:', data);
      // We could send a success message back to the content script if needed
      sendResponse({ status: 'success', data: data });
    })
    .catch(error => {
      console.error('Error sending request to backend:', error);
      sendResponse({ status: 'error', message: error.toString() });
    });

    // Return true to indicate that we will send a response asynchronously
    return true;
  }
});