export const removeEmojisAndUppercaseWords = (text: string) => {
    const textWithoutEmojis = text.replace(/\p{Emoji}/gu, '').trim();
    return textWithoutEmojis.replace(/\b[A-Z]{2,}\b/g, (word) => 
        word.charAt(0) + word.slice(1).toLowerCase()
    );
};