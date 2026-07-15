import { DealWorkspace } from "@/components/analysis/DealWorkspace";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DealWorkspace id={id} />;
}
