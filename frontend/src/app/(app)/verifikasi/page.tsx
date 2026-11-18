import type { Metadata } from "next";
import { VerificationView } from "@/components/verification-view";

export const metadata: Metadata = {
  title: "Verifikasi",
};

export default function VerificationPage() {
  return <VerificationView />;
}
