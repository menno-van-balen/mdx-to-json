import { argv, exit } from "process";
import extract from "./lib/extract.js";
import make from "./lib/make.js";

const args = argv.slice(2);

const arr = args[1]?.split(".") || null;
const ext = arr === null ? null : arr[arr.length - 1];
const arr2 = args[2]?.split(".") || null;
const extTmx = arr2 === null ? undefined : arr2[arr2.length - 1];

const commandCondition = args[0] !== "extract" && args[0] !== "make";
const lengthCondition =
  (args[0] === "extract" && args.length !== 2) ||
  (args[0] === "make" && args.length !== 3);
const fileConditionExtract =
  args[0] === "extract" && ext !== "mdx" && ext !== "md";
const fileConditionMake =
  (args[0] === "make" && ext !== "json") ||
  (args[0] === "make" && extTmx !== "json");

if (
  commandCondition ||
  lengthCondition ||
  fileConditionExtract ||
  fileConditionMake
) {
  if (commandCondition) console.log("\nHint: not the right command");
  if (lengthCondition) console.log("\nHint: not the right ammount of inputs");
  if (fileConditionExtract)
    console.log("\nHint: not the right input file extension (.mdx)");
  if (fileConditionMake)
    console.log(
      "\nHint: not the right input file or tmx file extension (.json)"
    );
  console.log(
    "\nUsage: extract input.mdx\n   or: make translated.json tmx-file.json\n"
  );
  exit(1);
} else if (args[0] === "extract") {
  extract(args[1]);
} else {
  make(args[1], args[2]);
}
