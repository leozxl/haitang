import { defineMiddleware } from "astro:middleware";

const OLD_HOST = "verse.yufm.com";
const NEW_ORIGIN = "https://verse.xqrp.com";

export const onRequest = defineMiddleware(async ({ url }, next) => {
  if (url.hostname === OLD_HOST) {
    const destination = new URL(`${url.pathname}${url.search}`, NEW_ORIGIN);
    return Response.redirect(destination, 301);
  }

  return next();
});
