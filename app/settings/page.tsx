"use client";

import { AuthGate } from "@/components/AuthGate";
import { ChatShell } from "@/components/ChatShell";
import { SettingsPage } from "@/components/SettingsPage";

export default function SettingsRoutePage() {
  return (
    <AuthGate>
      <ChatShell>
        <SettingsPage />
      </ChatShell>
    </AuthGate>
  );
}
