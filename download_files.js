import { resolve } from "path";

import { downloadFiles } from "./lib/utils.js";

downloadFiles(resolve(process.argv[2]), process.argv.slice(3));
