import { ItemDetailClient } from './item-detail-client';

// Required for static export with dynamic routes
export function generateStaticParams() {
  // Return empty array - pages will be generated on-demand
  return [];
}

export default function ItemDetailPage() {
  return <ItemDetailClient />;
}
