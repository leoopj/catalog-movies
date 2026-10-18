import { NextResponse } from "next/server";
import { parsePage } from "@/lib/paging";
import { TmdbUnavailable } from "@/lib/tmdb/client";
import { searchAvailable } from "@/lib/tmdb/movies";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);

  const pageRaw = searchParams.get("page");
  const page = pageRaw === null ? 1 : parsePage(pageRaw);
  if (page === null) {
    return NextResponse.json({ error: "Página inválida" }, { status: 400 });
  }

  const q = searchParams.get("q") ?? "";

  try {
    const paged = await searchAvailable(q, page);
    return NextResponse.json(paged);
  } catch (error) {
    if (error instanceof TmdbUnavailable) {
      return NextResponse.json({ error: "TMDB indisponível" }, { status: 503 });
    }
    throw error;
  }
}
