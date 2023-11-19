import { once } from "events";
import { ReadStream, createReadStream, createWriteStream } from "fs";
import { basename } from "path";
import { createInterface } from "readline";

if (!globalThis.fetch) {
  globalThis.fetch = (await import("node-fetch")).default;
}

/**
 * Checks if the value is a valid domain.
 * @param {string} value The value to be checked.
 */
export const isValidDomain = (value) =>
  /^(?!-)[A-Za-z0-9-]+([\-\.]{1}[a-z0-9]+)*\.[A-Za-z]{2,6}$/.test(value);

/**
 * Extracts all subdomains from a domain including itself.
 * @param {string} domain The domain to be extracted.
 * @returns {string[]}
 */
export const extractDomain = (domain) => {
  const parts = domain.split(".");
  const extractedDomains = [];

  for (let i = 0; i < parts.length; i++) {
    const subdomains = parts.slice(i).join(".");

    extractedDomains.unshift(subdomains);
  }

  return extractedDomains;
};

/**
 * Checks if the value is a comment.
 * @param {string} value The value to be checked.
 */
export const isComment = (value) =>
  value.startsWith("#") ||
  value.startsWith("//") ||
  value.startsWith("!") ||
  value.startsWith("/*") ||
  value.startsWith("*/");

/**
 * Downloads files and concatenates them into one file.
 * @param {string} filePath The path to the file being written to.
 * @param {string[]} urls The URLs to the files to be downloaded.
 */
export const downloadFiles = async (filePath, urls) => {
  const responses = await Promise.all(urls.map((url) => fetch(url)));

  for (const response of responses) {
    const writeStream = createWriteStream(filePath, { flags: "a" });

    ReadStream.from(response.body)
      .on("end", () => {
        writeStream.write("\n");
      })
      .pipe(writeStream);
  }
};

/**
 * @callback onLine
 * @param {string} line The current line.
 * @param {ReturnType<createInterface>} rl The readline interface.
 */

/**
 * Asynchronously reads a file line by line.
 * @param {string} filePath The path to the file.
 * @param {onLine} onLine The callback executed on each line read.
 */
export const readFile = async (filePath, onLine) => {
  try {
    const rl = createInterface({
      input: createReadStream(filePath),
      crlfDelay: Infinity,
    });

    rl.on("line", (line) => onLine(line, rl));

    await once(rl, "close");
  } catch (err) {
    console.error(
      `Error occurred while reading ${basename(filePath)} - ${err.toString()}`
    );
    throw err;
  }
};

/**
 * Memoizes a function
 * @template T The argument type of the function.
 * @template R The return type of the function.
 * @param {(...fnArgs: T[]) => R} fn The function to be memoized.
 */
export const memoize = (fn) => {
  const cache = new Map();

  return (...args) => {
    const key = args.join("-");

    if (cache.has(key)) return cache.get(key);

    const result = fn(...args);

    cache.set(key, result);
    return result;
  };
};
