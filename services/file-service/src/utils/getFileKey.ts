export const getFileKey = (url: string) => {
    const match = url.match(/^https?:\/\/[^/]+\/(.+)$/);
    const key = match ? match[1] : null;
    return key;
};
