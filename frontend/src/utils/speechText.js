/**
 * Strip HTML and extra whitespace so TTS reads educational copy, not markup.
 */
export function extractSpeakableText(htmlOrText) {
    if (htmlOrText == null) return '';
    if (typeof htmlOrText !== 'string') return String(htmlOrText);

    const withoutBlocks = htmlOrText
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');

    const withoutTags = withoutBlocks
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/g, "'");

    return withoutTags.replace(/\s+/g, ' ').trim();
}

export function combineSpeakableParts(parts) {
    return parts
        .map((part) => extractSpeakableText(part))
        .filter(Boolean)
        .join('. ');
}
