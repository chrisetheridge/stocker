import { ItemDetailScreen } from "~/features/items/item-detail-screen";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  return <ItemDetailScreen itemId={itemId} />;
}
