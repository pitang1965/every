// Cocoon風の日付表示（2024.11.15）。Workers は UTC なので日本時間に固定する
const jpDate = new Intl.DateTimeFormat("ja-JP", {
	timeZone: "Asia/Tokyo",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});
export const formatDate = (d: Date) => jpDate.format(d).replaceAll("/", ".");

// WordPress から来た記事は抜粋が空なので、本文の段落テキストから作る
export function snippet(content: unknown, max = 120): string {
	if (!Array.isArray(content)) return "";
	const text = content
		.filter((b) => b?._type === "block" && b.style === "normal")
		.flatMap((b) => b.children ?? [])
		.map((c) => c.text ?? "")
		.join("");
	return text.length > max ? `${text.slice(0, max)}...` : text;
}
