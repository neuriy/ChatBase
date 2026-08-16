"use client";

import { AuthGate } from "@/components/AuthGate";
import { ChatShell } from "@/components/ChatShell";
import { MarketplaceStore } from "@/components/MarketplaceStore";

export default function MarketplacePage() {
  return (
    <AuthGate>
      <ChatShell>
        <MarketplaceStore />
      </ChatShell>
    </AuthGate>
  );
}
