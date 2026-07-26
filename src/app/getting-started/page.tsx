import type { Metadata } from "next";
import { GettingStartedPage } from "@/components/help/GettingStartedPage";

export const metadata: Metadata = { title: "Getting Started — RealOffer AI" };

export default function Page() {
  return <GettingStartedPage />;
}
