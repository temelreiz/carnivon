import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /api is server-only; /vault is the private investor area.
        disallow: ["/api/", "/vault", "/vault/"],
      },
    ],
    sitemap: "https://carnivon.io/sitemap.xml",
    host: "https://carnivon.io",
  };
}
