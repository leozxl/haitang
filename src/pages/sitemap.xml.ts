import type { APIRoute } from "astro";
import { count } from "drizzle-orm";
import { localdb as db } from "@/database/localdb";
import {
  table_authors,
  table_collections,
  table_dynasties,
  table_works,
} from "@/database/schema_sqlite";
import config from "@/config/config.json";

const CHUNK_SIZE = 45_000;
const STATIC_PAGE_COUNT = 10;

export const GET: APIRoute = async () => {
  const [works, authors, collections, dynasties] = await Promise.all([
    db.select({ total: count() }).from(table_works),
    db.select({ total: count() }).from(table_authors),
    db.select({ total: count() }).from(table_collections),
    db.select({ total: count() }).from(table_dynasties),
  ]);
  const groups = [
    { name: "pages", total: STATIC_PAGE_COUNT },
    { name: "works", total: Number(works[0]?.total ?? 0) },
    { name: "authors", total: Number(authors[0]?.total ?? 0) },
    { name: "collections", total: Number(collections[0]?.total ?? 0) },
    { name: "dynasties", total: Number(dynasties[0]?.total ?? 0) },
  ];

  const baseUrl = config.site.base_url.endsWith("/")
    ? config.site.base_url.slice(0, -1)
    : config.site.base_url;
  const sitemapUrls = groups.flatMap((group) =>
    Array.from(
      { length: Math.ceil(group.total / CHUNK_SIZE) },
      (_, page) => baseUrl + "/sitemap-" + group.name + "-" + page + ".xml",
    ),
  );
  const entries = sitemapUrls
    .map((url) => "<sitemap><loc>" + url + "</loc></sitemap>")
    .join("");

  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + entries + "</sitemapindex>",
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    },
  );
};
