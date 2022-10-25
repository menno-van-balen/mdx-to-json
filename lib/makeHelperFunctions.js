import { EOL } from "node:os";

const tags = /<g[-:]\d+>|<\/g>/;

function createMdx(originalObject) {
  let mdxFile = "";
  originalObject.nodes.forEach((node) => {
    if (node.type === "yaml") {
      mdxFile += `---${EOL}`;
      node.attributes.forEach((atr) => {
        mdxFile += `${atr.name}: "${atr.value}"${EOL}`;
      });
      mdxFile += `---${EOL}`;
    } else if (node.type === "mdxjsEsm") {
      mdxFile += node.value + EOL;
    } else if (node.type === "paragraph") {
      mdxFile += `${createParagraph(node)}${EOL}`;
    } else if (node.type === "heading") {
      let headingTag = "";
      for (let i = 0; i < node.depth; i++) {
        headingTag += "#";
      }
      mdxFile += `${headingTag} ${node.value}${EOL}`;
    } else if (node.type === "iframe") {
      mdxFile += `${createHtmlTag(node)}${EOL}`;
    } else if (
      node.type === "Carousel" ||
      node.type === "SevenRoutesDownload"
    ) {
      mdxFile += `${createComponentTag(node)}${EOL}`;
    } else if (node.type === "blockquote") {
      if (node.children.length === 1) {
        mdxFile += `> ${createParagraph(node.children[0])}${EOL}`;
      } else {
        for (let i = 0; i < node.children.length; i++) {
          if (i < node.children.length - 1) {
            mdxFile += `> ${createParagraph(node.children[i])}${EOL}>${EOL}`;
          } else {
            mdxFile += `> ${createParagraph(node.children[i])}${EOL}`;
          }
        }
      }
    } else if (node.type === "list") {
      node.children.forEach((listItem, i) => {
        const sign = node.ordered ? `${i + 1}. ` : "- ";
        mdxFile += sign + createParagraph(listItem) + EOL;
      });
    } else if (node.type === "thematicBreak") {
      mdxFile += "---" + EOL;
    } else {
      const html = createHtmlTree(node);
      // Remove empty lines
      const htmlArray = html.split(EOL);
      let returnHtml = "";
      htmlArray.forEach((line) => {
        if (line !== "") returnHtml += line + EOL;
      });
      mdxFile += returnHtml;
    }
    mdxFile += EOL;
  });
  return mdxFile;
}

function createParagraph(node) {
  let returnString = "";
  node.children.forEach((child) => {
    if (child.type === "text") {
      returnString += child.value;
    } else if (child.type === "strong") {
      returnString += `**${child.value}**`;
    } else if (child.type === "emphasis") {
      returnString += `_${child.value}_`;
    } else if (child.type === "image") {
      returnString += `![${child.alt}](${child.url})`;
    } else if (child.type === "link") {
      returnString += `[${child.value}](${child.url})`;
    } else if (
      child.type === "a" ||
      child.type === "figcaption" ||
      child.type === "h1" ||
      child.type === "h2" ||
      child.type === "h3" ||
      child.type === "h4"
    ) {
      returnString += createHtmlTag(child);
    } else if (child.type === "break") {
      returnString += `${EOL}> `;
    } else {
      // console.log(child);
      console.log(
        "Message from createParagraph: There is an unkown child element in node.type === paragraph"
      );
    }
  });
  return returnString;
}

function createHtmlTree(node, num = 0) {
  // Indentation
  let tabs = "";
  for (let i = 0; i < num; i++) {
    tabs += "  ";
  }
  // Opening tag
  let html = `${tabs}<${node.type}`;
  if (node.attributes) html += createAttribute(node.attributes);
  html += `>`;
  if (node.type !== "p") html += EOL;
  // Content or inner html
  for (let j = 0; j < node.children.length; j++) {
    const child = node.children[j];
    // Inner html
    if (child.type === "div" || child.children) {
      const innerHtml = createHtmlTree(child, (num += 1));
      html += innerHtml;
    } else {
      // Indentation
      if (node.type !== "p") html += `${tabs}  `;
      // Content
      if (child.type === "text") {
        html += child.value;
      } else {
        html += `<${child.type}`;
        if (child.attributes) html += createAttribute(child.attributes);
        html += `>${child.value}</${child.type}>`;
      }
    }
    if (node.type !== "p") html += EOL;
  }
  // Closing tag
  if (node.type === "div") {
    html += tabs;
  }
  html += `</${node.type}>${EOL}`;

  return html;
}

function createAttribute(attributes) {
  let tagPart = "";
  attributes.forEach((atr) => {
    tagPart += ` ${atr.name}="${atr.value}"`;
  });
  return tagPart;
}

function createComponentTag(node) {
  let tag = `<${node.type}`;
  node.attributes?.forEach((atr) => {
    if (atr.name === "size") {
      tag += `${EOL}  ${atr.name}={${atr.value}}`;
    } else if (atr.name === "imagesObject") {
      tag += `${EOL}  ${atr.name}={[`;
      atr.value.forEach((slide) => {
        if (slide.length === 1) {
          tag += `${EOL}    { ${slide[0].name}: "${slide[0].value}" },`;
        } else {
          tag += `${EOL}    {`;
          slide.forEach((slideAtr) => {
            tag += `${EOL}      ${slideAtr.name}: "${slideAtr.value}",`;
          });
          tag += `${EOL}    },`;
        }
      });
      tag += `${EOL}  ]}`;
    } else {
      tag += `${EOL}  ${atr.name}="${atr.value}"`;
    }
  });
  tag += node.attributes ? `${EOL}/>` : ` />`;
  return tag;
}

// createTag returns html tag
function createHtmlTag(node) {
  let tag = `<${node.type}`;
  node.attributes.forEach((atr) => {
    tag += ` ${atr.name}="${atr.value}"`;
  });
  tag += `>${node.value ? node.value : ""}</${node.type}>`;
  return tag;
}

// translateOriginalObject alters the originalObject with the translated content, returns nothing
function translateOriginalObject(originalObject, transObject) {
  for (let key in transObject) {
    const [transIndex, ...transKey] = key.split("-");
    const index = transIndex.split(".");
    const type = transKey[0];
    const attribute = transKey.length === 2 && transKey[1];
    const translation = transObject[key];
    if ((type === "yaml" || type === "SevenRoutesDownload") && attribute) {
      // Original attribute = originalObject.nodes[index[0]].attributes[index[1]]
      if (
        originalObject.nodes[index[0]].attributes[index[1]].name === attribute
      ) {
        originalObject.nodes[index[0]].attributes[index[1]].value = translation;
      } else {
        console.log(
          "Message from translateOriginalObject: there is an error in yaml or SevenRoutesDownload: attributes are not the same."
        );
      }
      // console.log(index, transKey, type, attribute);
      // console.log(originalObject.nodes[index[0]].attributes[index[1]]);
    } else if (type === "Carousel") {
      // Original attribute = originalObject.nodes[index[0]].attributes[1].value[index[2]][index[3]]
      if (
        originalObject.nodes[index[0]].attributes[1].value[index[2]][index[3]]
          .name === attribute
      ) {
        originalObject.nodes[index[0]].attributes[1].value[index[2]][
          index[3]
        ].value = translation;
      } else {
        console.log(
          "Message from translateOriginalObject: there is an error in Carousel: attributes are not the same."
        );
      }
    } else if (type === "paragraph" || type === "p") {
      if (originalObject.nodes[index[0]].children.length === 1) {
        originalObject.nodes[index[0]].children[0].value = translation;
      } else {
        handleParagraphWithInlineElements(
          originalObject.nodes[index[0]],
          translation
        );
      }
    } else if (type === "heading") {
      originalObject.nodes[index[0]].value = translation;
    } else if (type === "image") {
      originalObject.nodes[index[0]].children[0].alt = translation;
    } else if (
      type === "link" ||
      type === "a" ||
      type === "figcaption" ||
      type === "strong" ||
      type === "emphasis" ||
      type === "h1" ||
      type === "h2" ||
      type === "h3" ||
      type === "h4"
    ) {
      originalObject.nodes[index[0]].children[0].value = translation;
    } else if (type === "blockquote" || type === "list") {
      if (!tags.test(translation)) {
        // Blockquote- or list paragraph without inline elements
        originalObject.nodes[index[0]].children[index[1]].children[0].value =
          translation;
      } else {
        // Blockquote- or list paragraph with inline elements
        handleParagraphWithInlineElements(
          originalObject.nodes[index[0]].children[index[1]],
          translation
        );
      }
    } else {
      // Html wrapped in a div or multi layered html
      // console.log(type);
      const [typeInput, id] = type.split(":");
      if (!id)
        console.log(
          "Message from translateOriginalObject / type === paragraph: there is an error in else, no id found"
        );
      findChildwithID(
        originalObject.nodes[index[0]].children,
        typeInput,
        Number(id),
        translation
      );
    }
  }
}

// handleParagraphWithInlineElements alters the transObject, returns nothing
function handleParagraphWithInlineElements(element, translation) {
  // Paragraph with inline elements
  // In paragraphParts indices from text are even (or 0), and from tags uneven, always!
  const paragraphParts = translation.split(tags);
  const beginsWithText = element.children[0].type === "text";

  element.children.forEach((child, i) => {
    const index = beginsWithText ? i : i + 1;
    child.value = paragraphParts[index];
    if (paragraphParts[i] === undefined) {
      // console.log(element);
      console.log(
        "Message from handleParagraphWithInlineElements: sentence parts and tags don't match in md paragraph wiht inline elements"
      );
    }
  });
}

// findChildwithID alters the transObject, returns nothing
function findChildwithID(children, typeInput, id, translation) {
  children.forEach((child) => {
    if (typeInput === child.type && id === child.id) {
      if (child.children) {
        handleParagraphWithInlineElements(child, translation);
      } else {
        child.value = translation;
      }
    } else if (child.children && typeInput !== child.type && id !== child.id) {
      findChildwithID(child.children, typeInput, id, translation);
    }
  });
}

export { translateOriginalObject, createMdx };
