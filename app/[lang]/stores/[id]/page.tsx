'use client';

// This route handles language-prefixed store detail pages (e.g., /du/stores/slug, /es/stores/slug)
// It renders the same content as the store detail page

import StoreDetailPage from '../../../stores/[id]/page';

export default function LangStoreDetailPage() {
  return <StoreDetailPage />;
}

