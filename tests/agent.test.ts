import { describe, it, expect } from "vitest";
import {
  detectIntent,
  runLocalAgent,
  formatArtifactsForChat,
} from "../lib/ellofive/local-agent";

describe("local agent intents", () => {
  it("detects greet / html / image / task / live / chat", () => {
    expect(detectIntent("Hello")).toBe("greet");
    expect(detectIntent("Make an HTML page for coffee")).toBe("html");
    expect(detectIntent("Generate an image of a robot")).toBe("image");
    expect(detectIntent("Help me plan a task to launch demo")).toBe("task");
    expect(detectIntent("Talk about live news today")).toBe("live");
    expect(detectIntent("What is Neuriy?")).toBe("chat");
  });

  it("builds a real HTML page artifact", async () => {
    const r = await runLocalAgent({
      prompt: "Create a webpage for Neuriy Studio",
    });
    expect(r.intent).toBe("html");
    expect(r.artifacts[0]?.type).toBe("html");
    expect(r.artifacts[0]?.content).toContain("<!DOCTYPE html>");
    expect(formatArtifactsForChat(r.artifacts)).toContain("```html");
  });

  it("builds an SVG image artifact", async () => {
    const r = await runLocalAgent({
      prompt: "Draw a picture of a Neuriy logo",
    });
    expect(r.intent).toBe("image");
    expect(r.artifacts[0]?.content).toContain("<svg");
  });

  it("builds a task plan", async () => {
    const r = await runLocalAgent({
      prompt: "Help me do a checklist to ship the chat app",
    });
    expect(r.intent).toBe("task");
    expect(r.artifacts[0]?.content).toMatch(/Task plan/i);
  });

  it("answers normal chat without marketplace false alarm", async () => {
    const r = await runLocalAgent({
      prompt: "Who are you?",
      marketplaceUnavailable: false,
    });
    expect(r.reply).not.toMatch(/Marketplace temporarily unavailable/i);
    expect(r.reply.toLowerCase()).toMatch(/neuriy/);
  });
});
