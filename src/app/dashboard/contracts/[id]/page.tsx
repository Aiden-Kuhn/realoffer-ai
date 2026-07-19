import { ContractBuilder } from "@/components/contracts/ContractBuilder";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContractBuilder id={id} />;
}
