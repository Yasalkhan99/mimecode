'use client';

// This route handles language-prefixed home pages (e.g., /du, /es, /fr)
// It renders the same content as the home page

import Home from '../page';

export default function LangHomePage() {
  return <Home />;
}

