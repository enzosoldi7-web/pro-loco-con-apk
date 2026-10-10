import { useState, useEffect, useCallback } from 'react';

// Interfaccia per compatibilità cross-browser con vendor prefixes
interface DocumentWithFullscreen extends Document {
  webkitFullscreenElement?: Element;
  mozFullScreenElement?: Element;
  msFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
}

interface ElementWithFullscreen extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    const doc = document as DocumentWithFullscreen;
    return !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
  });

  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [hasPromptedLaunch, setHasPromptedLaunch] = useState<boolean>(false);
  const [cssFullscreen, setCssFullscreen] = useState<boolean>(false);

  // Controlla se la modalità fullscreen è supportata
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const doc = document as DocumentWithFullscreen;
      const supported = !!(
        doc.fullscreenEnabled ||
        (doc as unknown as { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled ||
        (doc as unknown as { mozFullScreenEnabled?: boolean }).mozFullScreenEnabled ||
        (doc as unknown as { msFullscreenEnabled?: boolean }).msFullscreenEnabled
      );
      setIsSupported(supported);
    }
  }, []);

  // Aggiorna lo stato quando cambia il fullscreen nativo del browser o SO
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as DocumentWithFullscreen;
      const active = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(active);
      if (active) {
        setCssFullscreen(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Attiva lo schermo intero nativo
  const enterFullscreen = useCallback(async (): Promise<boolean> => {
    try {
      const el = document.documentElement as ElementWithFullscreen;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (el.mozRequestFullScreen) {
        await el.mozRequestFullScreen();
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen();
      }
      setIsFullscreen(true);
      setCssFullscreen(true);
      localStorage.setItem('proloco_fullscreen_attivo', 'true');
      return true;
    } catch {
      // In caso di blocco iframe o permessi browser, attiviamo comunque la modalità viewport espansa (CSS Fullscreen)
      setCssFullscreen(true);
      return false;
    }
  }, []);

  // Esci dallo schermo intero nativo
  const exitFullscreen = useCallback(async (): Promise<boolean> => {
    try {
      const doc = document as DocumentWithFullscreen;
      if (doc.exitFullscreen) {
        await doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen();
      }
      setIsFullscreen(false);
      setCssFullscreen(false);
      localStorage.setItem('proloco_fullscreen_attivo', 'false');
      return true;
    } catch {
      setCssFullscreen(false);
      return false;
    }
  }, []);

  // Toggle schermo intero
  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen || cssFullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [isFullscreen, cssFullscreen, enterFullscreen, exitFullscreen]);

  // Gestione avvio automatico al primo tocco / interazione dell'utente
  useEffect(() => {
    const preferenza = localStorage.getItem('proloco_fullscreen_attivo');
    // Di default se non esplicitamente disattivato dall'utente, attiva lo schermo intero al primo click/tap
    const autoAttiva = preferenza !== 'false';

    if (!autoAttiva) return;

    let attivato = false;
    const handleFirstInteraction = async () => {
      if (attivato) return;
      attivato = true;
      const doc = document as DocumentWithFullscreen;
      const isAlreadyFs = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );

      if (!isAlreadyFs) {
        try {
          await enterFullscreen();
        } catch {
          // Fallback silenzioso
        }
      }

      // Rimuovi i listener una volta consumata la prima interazione
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction, { once: true, passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true, passive: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true, passive: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [enterFullscreen]);

  return {
    isFullscreen: isFullscreen || cssFullscreen,
    isNativeFullscreen: isFullscreen,
    cssFullscreen,
    isSupported,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    hasPromptedLaunch,
    setHasPromptedLaunch
  };
}
