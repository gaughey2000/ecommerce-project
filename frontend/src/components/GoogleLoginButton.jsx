import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../services/api';

export default function GoogleLoginButton({ onSuccess, text = 'continue_with', size = 'large', theme = 'outline' }) {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID missing');
      return;
    }

    // If the script is already loaded, just init
    if (window.google && window.google.accounts?.id) {
      init();
      return;
    }

    // Inject script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = init;
    script.onerror = () => toast.error('Failed to load Google auth');
    document.head.appendChild(script);

    function init() {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          ux_mode: 'popup',
        });
        setReady(true);
      } catch (e) {
        console.error(e);
        toast.error('Google auth init failed');
      }
    }

    // cleanup: do not remove script to allow reuse on other pages
    // but clear the button container on unmount
    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    if (!ready || !containerRef.current) return;
    // Render the button
    try {
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        shape: 'rectangular',
        theme,     // 'filled_blue' | 'outline'
        text,      // 'continue_with' | 'signin_with'
        size,      // 'small' | 'medium' | 'large'
        width: '100%',
        logo_alignment: 'left',
      });
    } catch (e) {
      console.error(e);
    }
  }, [ready, text, size, theme]);

  async function handleCredentialResponse(response) {
    const { credential } = response || {};
    if (!credential) {
      toast.error('Google login cancelled');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Google login failed');

      // Expect: { token, email, username, role }
      onSuccess?.(data);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Google login failed');
    }
  }

  return (
    <div className="w-full">
      <div ref={containerRef} className="w-full flex justify-center" />
    </div>
  );
}