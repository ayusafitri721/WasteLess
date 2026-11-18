import { requireUser } from "@/lib/auth";

export default async function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser("provider");
  return children;
}
