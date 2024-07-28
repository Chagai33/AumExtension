// content.js
console.log("Content script loaded.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in content script:', request);
  if (request.action === 'updateProgress') {
    // בצע פעולות נדרשות כאן
    sendResponse({status: 'success'}); // שלח תגובה חזרה
  }
  return true; // חשוב כדי להבטיח שהתגובה נשלחת בצורה אסינכרונית
});
