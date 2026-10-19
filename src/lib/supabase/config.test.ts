import { afterEach, describe, expect, it, vi } from "vitest";
import { supabaseConfig } from "./config";

describe("supabaseConfig", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("retorna null sem variáveis", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(supabaseConfig()).toBeNull();
  });

  it("retorna null se só uma das variáveis estiver preenchida", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(supabaseConfig()).toBeNull();
  });

  it("retorna url e key", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_abc");
    expect(supabaseConfig()).toEqual({
      url: "https://x.supabase.co",
      key: "sb_publishable_abc",
    });
  });
});
