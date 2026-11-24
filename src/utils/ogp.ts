export interface Ogp {
	url: string;
	host: string;
	title: string;
	description: string;
	image: string | null;
}

// shortcut: キャッシュは Worker の isolate ごとのメモリだけ。カードが増えて表示が遅くなったら KV などに保存する
const cache = new Map<string, Promise<Ogp>>();

export function getOgp(url: string): Promise<Ogp> {
	let p = cache.get(url);
	if (!p) {
		p = load(url);
		cache.set(url, p);
	}
	return p;
}

const ENTITIES: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">" };
const decode = (s: string) =>
	s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) =>
		e[0] === "#"
			? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1)))
			: (ENTITIES[e.toLowerCase()] ?? m),
	);

// 取得した HTML は信用しない：meta の文字列だけを取り出し、表示側でエスケープされる
function meta(html: string, key: string) {
	const tag = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*>`, "i"))?.[0];
	const v = tag?.match(/content=["']([^"']*)["']/i)?.[1];
	return v ? decode(v).trim() : undefined;
}

async function load(url: string): Promise<Ogp> {
	const host = new URL(url).hostname;
	const fallback: Ogp = { url, host, title: url, description: "", image: null };
	try {
		const res = await fetch(url, {
			headers: { "user-agent": "Mozilla/5.0 (compatible; LinkCard/1.0)" },
			signal: AbortSignal.timeout(3000),
		});
		if (!res.ok || !res.headers.get("content-type")?.includes("text/html")) throw new Error();
		// Google Play は <head> に約1MBのスクリプトがあり OGP がその後ろにあるため、上限は大きめにして </head> で切る
		const body = (await res.text()).slice(0, 2_000_000);
		const headEnd = body.indexOf("</head>");
		const html = headEnd === -1 ? body : body.slice(0, headEnd);
		const titleTag = html.match(/<title[^>]*>([^<]*)/i)?.[1];
		const rawImage = meta(html, "og:image");
		const image = rawImage ? new URL(rawImage, res.url) : null;
		return {
			url,
			host,
			title: meta(html, "og:title") ?? (titleTag ? decode(titleTag).trim() : url),
			description: meta(html, "og:description") ?? meta(html, "description") ?? "",
			image: image && /^https?:$/.test(image.protocol) ? image.href : null,
		};
	} catch {
		cache.delete(url); // 失敗は次のリクエストで再試行する
		return fallback;
	}
}
