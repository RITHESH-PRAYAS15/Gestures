import React from 'react';
import { createRoot } from 'react-dom/client';
import { CameraManager } from './CameraManager';

// Inject the root element into the comic web page
const injectUI = () => {
    // Check if we already injected to avoid duplicates during dev/HMR
    if (document.getElementById('gesture-extension-root')) return;

    const rootElement = document.createElement('div');
    rootElement.id = 'gesture-extension-root';
    document.body.appendChild(rootElement);

    const root = createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <CameraManager />
        </React.StrictMode>
    );
};

// Run the injection
injectUI();
