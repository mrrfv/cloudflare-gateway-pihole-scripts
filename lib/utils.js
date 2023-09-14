import { once } from "events";
import { createReadStream } from "fs";
import { basename } from "path";
import { createInterface } from "readline";

/**
 * Sleeps for a specified amount of time.
 * @param {number} [ms=350] The amount of time in ms.
 */
export const sleep = (ms = 350) =>
  new Promise((resolve) => setTimeout(resolve, ms));

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
