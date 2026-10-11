import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import queryClient from './lib/queryClient.js';
import AuthProvider from './context/auth/AuthProvider.jsx';
import CartProvider from './context/cart/CartProvider.jsx';
import './index.css';
import App from './App.jsx';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Without transitions a page whose code is still downloading shows its
        loading state at once; with them the old page stayed up, and a click
        on a link looked like it had done nothing */}
    <BrowserRouter useTransitions={false}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <App />
            <Toaster position="top-right" richColors closeButton />
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
