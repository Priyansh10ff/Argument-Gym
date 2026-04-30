import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConvexReactClient } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { AuthProvider } from './lib/auth';
import App from './App';
import './index.css';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

ReactDOM.createRoot(document.getElementById('root')).render(
  <ConvexAuthProvider client={convex}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ConvexAuthProvider>
);
