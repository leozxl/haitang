import type { APIRoute } from "astro";
import { asc, count } from "drizzle-orm";
import { localdb as db } from "@/database/localdb";
import {
  table_authors,
  table_collections,
  table_dynasties,
  table_works,
} from "@/database/schema_sqlite";
import config from "@/config/config.json";

const CHUNK_SIZE = 45_000;
const STATIC_PATHS = [
  "/",
  "/today",
  "/works",
  "/authors",
  "/collections",
  "/dynasties",
  "/about",
  "/info",
  "/terms-of-service",
  "/privacy-policy",
];
type ContentKind = "pages" | "works" | "authors" | "collections" | "dynasties";

async function getCount(kind: ContentKind): Promise<number> {
  if (kind === "pages") return STATIC_PATHS.length;

  let total = 0;
  switch (kind) {
    case "works": {
      const [row] = await db.select({ total: count() }).from(table_works);
      total = Number(row?.total ?? 0);
      break;
    }
    case "authors": {
      const [row] = await db.select({ total: count() }).from(table_authors);
      total = Number(row?.total ?? 0);
      break;
    }
    case "collections": {
      const [row] = await db.select({ total: count() }).from(table_collections);
      total = Number(row?.total ?? 0);
      break;
    }
    case "dynasties": {
      const [row] = await db.select({ total: count() }).from(table_dynasties);
      total = Number(row?.total ?? 0);
      break;
    }
  }
  return total;
}

async function getPaths(kind: ContentKind, offset: number): Promise<string[]> {
  if (kind === "pages") return STATIC_PATHS.slice(offset, offset + CHUNK_SIZE);

  switch (kind) {
    case "works": {
      const rows = await db
        .select({ id: table_works.id })
        .from(table_works)
        .orderBy(asc(table_works.id))
        .limit(CHUNK_SIZE)
        .offset(offset);
      return rows.map((row) => "/works/" + row.id);
    }
    case "authors": {
      const rows = await db
        .select({ id: table_authors.id })
        .from(table_authors)
        .orderBy(asc(table_authors.id))
        .limit(CHUNK_SIZE)
        .offset(offset);
      return rows.map((row) => "/authors/" + row.id);
    }
    case "collections": {
      const rows = await db
        .select({ id: table_collections.id })
        .from(table_collections)
        .orderBy(asc(table_collections.id))
        .limit(CHUNK_SIZE)
        .offset(offset);
      return rows.map((row) => "/collections/" + row.id);
    }
    case "dynasties": {
      const rows = await db
        .select({ id: table_dynasties.id })
        .from(table_dynasties)
        .orderBy(asc(table_dynasties.id))
        .limit(CHUNK_SIZE)
        .offset(offset);
      return rows.map((row) => "/dynasties/" + row.id);
    }
  }
  return [];
}

export const GET: APIRoute = async ({ params }) => {
  const match = /^(pages|works|authors|collections|dynasties)-([0-9]+)$/.exec(params.name ?? "");
  if (!match) return new Response("Not found", { status: 404 });

  const kind = match[1] as ContentKind;
  const page = Number(match[2]);
  const total = await getCount(kind);
  const pageCount = Math.ceil(total / CHUNK_SIZE);
  if (!Number.isSafeInteger(page) || page < 0 || page >= pageCount) {
    return new Response("Not found", { status: 404 });
  }

  const paths = await getPaths(kind, page * CHUNK_SIZE);
  const baseUrl = config.site.base_url.endsWith("/")
    ? config.site.base_url.slice(0, -1)
    : config.site.base_url;
  const xmlEscape = (value: string) =>
    value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const entries = paths
    .map((path) => "<url><loc>" + xmlEscape(baseUrl + path) + "</loc></url>")
    .join("");

  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + entries + "</urlset>",
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    },
  );
};
