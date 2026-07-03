export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-8">
      <h1 className="font-heading text-3xl text-ink">Product detail</h1>
      <p className="mt-2 text-sm text-ink/60">
        Full editable product view coming in Milestone 4. (Product ID: {id})
      </p>
    </div>
  );
}
