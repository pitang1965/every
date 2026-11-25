import cloudflare from "@astrojs/cloudflare";
import { cacheCloudflare } from "@astrojs/cloudflare/cache";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";

export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	// ページをエッジにキャッシュし、キャッシュが当たれば Worker を動かさない（無料プランの CPU 上限対策）。
	// 記事の公開時は EmDash がタグ（コレクション名）でキャッシュを自動破棄する。"all" は全消去用の予備タグ
	cache: {
		provider: cacheCloudflare(),
	},
	routeRules: {
		"/": { maxAge: 86_400, swr: 604_800, tags: ["posts", "all"] },
		"/posts/[slug]": { maxAge: 86_400, swr: 604_800, tags: ["posts", "all"] },
		"/[slug]": { maxAge: 86_400, swr: 604_800, tags: ["pages", "all"] },
		"/category/[slug]": {
			maxAge: 86_400,
			swr: 604_800,
			tags: ["posts", "emdash:taxonomy:category", "all"],
		},
		"/tag/[slug]": { maxAge: 86_400, swr: 604_800, tags: ["posts", "emdash:taxonomy:tag", "all"] },
	},
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			database: d1({ binding: "DB", session: "auto", coalesce: true }),
			storage: r2({ binding: "MEDIA" }),
		}),
	],
	devToolbar: { enabled: false },
});
