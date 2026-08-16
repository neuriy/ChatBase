"use client";

import { use } from "react";
import { AuthGate } from "@/components/AuthGate";
import { ChatShell } from "@/components/ChatShell";
import { MarketplaceAppDetail } from "@/components/MarketplaceAppDetail";

export default function MarketplaceAppPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <AuthGate>
      <ChatShell>
        <MarketplaceAppDetail appId={decodeURIComponent(id)} />
      </ChatShell>
    </AuthGate>
  );
}
