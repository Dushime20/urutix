export const encodeUrl = (url: Record<string, unknown>) => {
  return encodeURIComponent(JSON.stringify(url));
};

export const decodeUrl = (url: string) => {
  return JSON.parse(decodeURIComponent(url));
};
