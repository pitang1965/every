import BlockOrLinkCard from "./BlockOrLinkCard.astro";
import HtmlBlockOrLinkCard from "./HtmlBlockOrLinkCard.astro";

// 記事・固定ページ共通：WordPress から来たブログカードと Google マップの描画
export const contentComponents = {
	block: BlockOrLinkCard,
	type: { htmlBlock: HtmlBlockOrLinkCard },
};
