export const decodeUrl = (encodedStr) => {
  if (!encodedStr || encodedStr.startsWith("http")) return encodedStr;
  try {
    const secret = import.meta.env.VITE_URL_DECODE_KEY;
    const decodedB64 = atob(encodedStr);
    return decodedB64
      .split("")
      .map((char, i) =>
        String.fromCharCode(
          char.charCodeAt(0) ^ secret.charCodeAt(i % secret.length),
        ),
      )
      .join("");
  } catch (e) {
    return encodedStr;
  }
};
