import { writeFileSync, readFileSync } from "node:fs";
import { translateOriginalObject, createMdx } from "./makeHelperFunctions.js";

export default function make(transJson, mdxTree) {
  // Load files
  const translatedJson = readFileSync(transJson);
  const originalMdxTree = readFileSync(mdxTree);

  // Create objects from translated content and original tmx file
  const transObject = JSON.parse(translatedJson);
  const originalObject = JSON.parse(originalMdxTree);

  console.log(transObject);

  // Exchange the original content with the translated
  translateOriginalObject(originalObject, transObject);

  // create new mdx file
  // const fileName = mdxTree.split(".")[0];
  // const mdxfile = createMdx(originalObject);
  // writeFileSync(`${fileName}-translated.mdx`, mdxfile, (er) => console.log(er));
}
