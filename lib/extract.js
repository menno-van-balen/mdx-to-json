import fs from "node:fs";
import { createTmxTree, createTransObject } from "./extractHelperfunctions.js";

export default function extract(mdx) {
  // Name for file output
  const [name, ...ext] = mdx.split(".");
  const fileName = ext.length > 1 ? name + "." + ext[0] : name;

  // Create a tree from mdx file
  const tmxTree = createTmxTree(mdx);

  // Create a translation object from
  const transObject = createTransObject(tmxTree);

  // Store both as json files
  const tmxJson = JSON.stringify(tmxTree, null, 2);
  const transJson = JSON.stringify(transObject, null, 2);
  fs.writeFile(`${fileName}.tmx.json`, tmxJson, (er) => console.log(er));
  fs.writeFile(`${fileName}.json`, transJson, (er) => console.log(er));
}
