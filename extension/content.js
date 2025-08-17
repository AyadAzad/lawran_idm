// A unique ID for our button to prevent creating duplicates
const BUTTON_ID = 'lawran-idm-download-button';

/**
 * Creates the beautiful "Download" button.
 * @returns {HTMLButtonElement}
 */
function createDownloadButton() {
  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download-cloud"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg>
    <span>Download</span>
  `;

  // --- Styling with modern CSS ---
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.gap = '8px';
  button.style.padding = '10px 16px';
  button.style.marginLeft = '8px';
  button.style.backgroundColor = '#1e3a8a'; // A deep blue
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '20px';
  button.style.fontSize = '14px';
  button.style.fontWeight = 'bold';
  button.style.cursor = 'pointer';
  button.style.transition = 'background-color 0.2s, transform 0.2s';

  button.onmouseover = () => button.style.backgroundColor = '#1e40af';
  button.onmouseout = () => button.style.backgroundColor = '#1e3a8a';

  button.addEventListener('click', () => {
    // Send a message to the background script with the current video URL
    chrome.runtime.sendMessage({
      action: "downloadVideo",
      url: window.location.href
    });

    // Provide visual feedback to the user
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>
      <span>Requested!</span>
    `;
    button.style.backgroundColor = '#166534'; // Green for success
    button.disabled = true;

    // Reset the button after a few seconds
    setTimeout(() => {
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download-cloud"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg>
            <span>Download</span>
        `;
        button.style.backgroundColor = '#1e3a8a';
        button.disabled = false;
    }, 4000);
  });

  return button;
}

/**
 * Injects the download button into the YouTube page.
 * YouTube is a Single Page App, so we need to periodically check if the
 * target element for our button exists.
 */
function injectButton() {
  // This is a stable element that appears below the video title
  const targetElement = document.querySelector('#owner-and-actions #subscribe-button');

  // If the target exists and our button doesn't, inject it
  if (targetElement && !document.getElementById(BUTTON_ID)) {
    console.log('Lawran IDM: Target element found. Injecting button.');
    const downloadButton = createDownloadButton();
    targetElement.parentNode.insertBefore(downloadButton, targetElement.nextSibling);
  }
}

// Since YouTube navigates without full page reloads, we need to
// run our injection logic periodically to catch page changes.
setInterval(injectButton, 1000);