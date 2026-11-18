import { requireUser } from "@/lib/auth";

export default async function ReceiverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser("receiver");
  return children;
}
