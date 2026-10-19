import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: vi.fn() })),
}));
vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));
// React.cache memoiza dentro de uma requisição; nos testes deve ser transparente.
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <T,>(fn: T) => fn,
}));

import { createServerClient } from "@supabase/ssr";
import { getCurrentUser } from "./server";

function clienteCom(getUser: () => Promise<unknown>) {
  vi.mocked(createServerClient).mockReturnValue({
    auth: { getUser },
  } as unknown as ReturnType<typeof createServerClient>);
}

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.mocked(createServerClient).mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("retorna null sem config", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(await getCurrentUser()).toBeNull();
    expect(createServerClient).not.toHaveBeenCalled();
  });

  describe("com config", () => {
    beforeEach(() => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_abc");
    });

    it("mapeia id e email", async () => {
      clienteCom(async () => ({
        data: { user: { id: "u1", email: "a@b.com" } },
        error: null,
      }));
      expect(await getCurrentUser()).toEqual({ id: "u1", email: "a@b.com" });
    });

    it("retorna null quando getUser falha", async () => {
      clienteCom(async () => ({
        data: { user: null },
        error: { message: "jwt expired" },
      }));
      expect(await getCurrentUser()).toBeNull();
    });

    it("retorna null sem usuário", async () => {
      clienteCom(async () => ({ data: { user: null }, error: null }));
      expect(await getCurrentUser()).toBeNull();
    });

    it("retorna null e registra erro inesperado", async () => {
      const erro = vi.spyOn(console, "error").mockImplementation(() => {});
      clienteCom(async () => {
        throw new Error("rede");
      });
      expect(await getCurrentUser()).toBeNull();
      expect(erro).toHaveBeenCalled();
      erro.mockRestore();
    });
  });
});
