import fs from "node:fs";
import { translateOriginalObject, createMdx } from "./makeHelperFunctions.js";

export default function make(transJson, tmxFile) {
  // Load files
  const translatedJson = fs.readFileSync(transJson);
  const tmxTreeJson = fs.readFileSync(tmxFile);

  // Create objects from translated content and original tmx file
  const transObject = JSON.parse(translatedJson);
  const originalObject = JSON.parse(tmxTreeJson);

  // Exchange the original content with the translated
  translateOriginalObject(originalObject, transObject);

  // create new mdx file
  const fileName = tmxFile.split(".")[0];
  const mdxfile = createMdx(originalObject);
  fs.writeFile(`${fileName}-translated.mdx`, mdxfile, (er) => console.log(er));
}
