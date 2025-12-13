'use client';

// This route handles language-prefixed stores pages (e.g., /du/stores, /es/stores)
// It renders the same content as the stores page

import StoresPage from '../../stores/page';

export default function LangStoresPage() {
  return <StoresPage />;
}

