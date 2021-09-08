// https://github.com/apify/apify-js/blob/master/src/pseudo_url.js
const parsePurl = (purl) => {
  const trimmedPurl = purl.trim();
  if (trimmedPurl.length === 0)
    throw new Error(
      `Cannot parse PURL '${trimmedPurl}': it must be an non-empty string`
    );

  let regex = "^";

  try {
    let openBrackets = 0;
    for (let i = 0; i < trimmedPurl.length; i++) {
      const ch = trimmedPurl.charAt(i);

      if (ch === "[" && ++openBrackets === 1) {
        // Beginning of '[regex]' section
        // Enclose regex in () brackets to enforce operator priority
        regex += "(";
      } else if (ch === "]" && openBrackets > 0 && --openBrackets === 0) {
        // End of '[regex]' section
        regex += ")";
      } else if (openBrackets > 0) {
        // Inside '[regex]' section
        regex += ch;
      } else {
        // Outside '[regex]' section, parsing the URL part
        const code = ch.charCodeAt(0);
        if (
          (code >= 48 && code <= 57) ||
          (code >= 65 && code <= 90) ||
          (code >= 97 && code <= 122)
        ) {
          // Alphanumeric character => copy it.
          regex += ch;
        } else {
          // Special character => escape it
          const hex = code < 16 ? `0${code.toString(16)}` : code.toString(16);
          regex += `\\x${hex}`;
        }
      }
    }
    regex += "$";
  } catch (err) {
    throw new Error(`Cannot parse PURL '${purl}': ${err}`);
  }

  return regex;
};

DEF.purl = (u) => {
  if (!(u instanceof RegExp)) u = new RegExp(parsePurl(u), "i");
  return {
    match: (url) => typeof url === "string" && url.match(u) !== null,
  };
};

DEF.ucFirst = (str) =>
  str
    .split("")
    .map((v, i) => (i === 0 ? v.toUpperCase() : v))
    .join("");
DEF.ucWords = (str) =>
  str
    .split(" ")
    .map((i) => DEF.ucFirst(i))
    .join(" ");
