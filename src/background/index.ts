/// <reference types="chrome" />
// This is the background service worker for Manifest V3.
// Currently empty as inference happens locally in the active tab.

chrome.runtime.onInstalled.addListener(() => {
    console.log("Gestures Extension Installed.");
});
