import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { GoogleLogin } from '@react-oauth/google';

// La existencia del client ID decide si la app puede mostrar o no el botón federado.
const googleClientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

export default function GoogleAuthButton({ onSuccess, onError, disabled = false, text = 'continue_with' }) {
  const containerRef = useRef(null);
  const [buttonWidth, setButtonWidth] = useState(320);

  useEffect(() => {
    const updateWidth = () => {
      const containerWidth = containerRef.current?.getBoundingClientRect().width || 320;
      setButtonWidth(Math.max(200, Math.min(320, Math.floor(containerWidth))));
    };

    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }

    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Si falta configuración, el botón desaparece por completo para no ofrecer un flujo roto.
  if (!googleClientId) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`flex w-full max-w-full justify-center overflow-hidden ${disabled ? 'pointer-events-none opacity-60' : ''}`}
    >
      <GoogleLogin
        // Google entrega un credentialResponse; aquí solo propagamos el JWT que usa backend.
        onSuccess={(credentialResponse) => onSuccess?.(credentialResponse?.credential || '')}
        // El consumidor decide cómo mostrar el error final en cada modal.
        onError={() => {
          const origin = window.location.origin;
          console.error('[GoogleAuth] Google no entrego credential.', {
            origin,
            clientIdPrefix: googleClientId.slice(0, 12),
          });
          onError?.(`Google no autorizo este origen (${origin}). Verifica ese origen exacto en Google Cloud Console.`);
        }}
        text={text}
        theme="outline"
        shape="rectangular"
        width={String(buttonWidth)}
      />
    </div>
  );
}

GoogleAuthButton.propTypes = {
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
  disabled: PropTypes.bool,
  text: PropTypes.string,
};
