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
export const extractDomain = (domain) =>
  domain.split(".").reduce((previous, current, index, array) => {
    const nextIndex = index + 1;

    if (nextIndex > array.length - 1) return previous;

    const domain = [current, ...array.slice(nextIndex)].join(".");

    previous.push(domain);

    return previous;
  }, []);

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
  const writeStream = createWriteStream(filePath, { flags: "a" });
  const responses = await Promise.all(urls.map((url) => fetch(url)));

  for (const response of responses) {
    const readable = ReadStream.from(response.body, {
      autoDestroy: true,
    });

    readable.on("end", () => {
      writeStream.write("\n");
    });

    readable.pipe(writeStream, { end: false });
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
  }
};
