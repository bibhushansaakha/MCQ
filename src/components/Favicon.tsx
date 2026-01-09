'use client';

import { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function Favicon() {
  const { theme } = useTheme();

  useEffect(() => {
    // Find existing favicon link or create one
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    // Set favicon based on theme
    if (theme === 'dark') {
      link.href = '/favicons/dark.png';
    } else {
      link.href = '/favicons/light.png';
    }
  }, [theme]);

  return null; // This component doesn't render anything
}


