export const removeEmojis = (text: string) => {
    return text.replace(/\p{Emoji}/gu, '').trim();
};