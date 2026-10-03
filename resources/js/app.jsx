import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../../frontend/src/App';
import '../../frontend/src/styles/app.css';

const root = createRoot(document.getElementById('app'));

root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
