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
];
type ContentKind = "pages" | "works" | "authors" | "collections" | "dynasties";

async function getCount(kind: ContentKind): Promise<number> {
  if (kind === "pages") return STATIC_PATHS.length;
  const [row] =
    kind === "works"
      ? await db.select({ total: count() }).from(table_works)
      : kind === "authors"
        ? await db.select({ total: count() }).from(table_authors)
        : kind === "collections"
          ? await db.select({ total: count() }).from(table_collections)
          : await db.select({ total: count() }).from(table_dynasties);
  return Number(row?.total ?? 0);
}

export const GET: APIRoute = async ({ params }) => {
  const match = params.name?.match(/^(pages|works|authors|collections|dynasties)-(\d+)$/);
  if (!match) return new Response("Not found", { status: 404 });

  const kind = match[1] as ContentKind;
  const page = Number(match[2]);
  const total = await getCount(kind);
  const pageCount = Math.ceil(total / CHUNK_SIZE);
  if (!Number.isSafeInteger(page) || page < 0 || page >= pageCount) {
    return new Response("Not found", { status: 404 });
  }

  const offset = page * CHUNK_SIZE;
  let paths: string[];
  if (kind === "pages") {
    paths = STATIC_PATHS.slice(offset, offset + CHUNK_SIZE);
  } else {
    const rows =
      kind === "works"
        ? await db.select({ id: table_works.id }).from(table_works).orderBy(asc(table_works.id)).limit(CHUNK_SIZE).offset(offset)
        : kind === "authors"
          ? await db.select({ id: table_authors.id }).from(table_authors).orderBy(asc(table_authors.id)).limit(CHUNK_SIZE).offset(offset)
          : kind === "collections"
            ? await db.select({ id: table_collections.id }).from(table_collections).orderBy(asc(table_collections.id)).limit(CHUNK_SIZE).offset(offset)
            : await db.select({ id: table_dynasties.id }).from(table_dynasties).orderBy(asc(table_dynasties.id)).limit(CHUNK_SIZE).offset(offset);
    paths = rows.map((row) => "/" + kind + "/" + row.id);
  }

  const baseUrl = config.site.base_url.replace(/\/$/, "");
  const xmlEscape = (value: string) =>
    value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const entries = paths
    .map((path) => "<url><loc>" + xmlEscape(baseUrl + path) + "</loc></url>")
    .join("");

  return new Response(
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?><urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">" + entries + "</urlset>",
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    },
  );
};
