import { writeFileSync } from "node:fs";
import {
  createOriginalMdxTree,
  createTranslationObject,
} from "./extractHelperfunctions.js";

export default function extract(mdx) {
  // Name for file output
  const [name, ...ext] = mdx.split(".");
  const fileName = ext.length > 1 ? name + "." + ext[0] : name;

  // Create a tree from mdx file
  const originalMdxTree = createOriginalMdxTree(mdx);

  // Create a translation object from
  const translationObject = createTranslationObject(originalMdxTree);

  // Store both as json files
  const mdxtreeJson = JSON.stringify(originalMdxTree, null, 2);
  const translationJson = JSON.stringify(translationObject, null, 2);
  writeFileSync(`${fileName}.mdx-tree.json`, mdxtreeJson, (er) =>
    console.log(er)
  );
  writeFileSync(`${fileName}.json`, translationJson, (er) => console.log(er));
}
