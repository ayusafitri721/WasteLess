"use client";

import Link from "next/link";
import { useCurrentUser } from "@/components/auth/auth-provider";
import { ListingEditor } from "@/components/provider/listing-editor";
import { Notice } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";

export default function NewListingPage() {
  const { user } = useCurrentUser();

  if (!user) return null;

  return (
    <div className="space-y-7">
      <PageHeader
        kicker="Listing baru"
        title="Catat makanan yang bisa diambil."
        description="Isi data yang benar. Jumlah awal menjadi stok yang dapat direservasi, dan setiap perubahan tercatat di backend."
      />

      {user.verificationStatus !== "verified" ? (
        <Notice tone="warning">
          Akun Anda belum terverifikasi, sehingga backend akan menolak
          pembuatan listing.{" "}
          <Link href="/verifikasi" className="link-underline">
            Ajukan verifikasi
          </Link>{" "}
          lebih dulu.
        </Notice>
      ) : null}

      <section className="panel p-5 sm:p-7">
        <ListingEditor />
      </section>
    </div>
  );
}
