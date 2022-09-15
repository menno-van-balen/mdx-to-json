import fs from "node:fs";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkFrontmatter from "remark-frontmatter";

function createTranslationObject(tmxTree) {
  const transObject = {};
  tmxTree.nodes.forEach((node, i) => {
    if (node.type === "yaml") {
      node.attributes.forEach((atr, j) => {
        if (
          atr.name === "path" ||
          atr.name === "title_post" ||
          atr.name === "title_html" ||
          atr.name === "hero_img_alt" ||
          atr.name === "description"
        ) {
          const key = `${i}.${j}-${node.type}-${atr.name}`;
          transObject[key] = atr.value;
        }
      });
    } else if (node.type === "SevenRoutesDownload") {
      node.attributes?.forEach((atr, j) => {
        if (atr.name === "text") {
          const key = `${i}.${j}-${node.type}-${atr.name}`;
          transObject[key] = atr.value;
        }
      });
    } else if (node.type === "Carousel") {
      node.attributes.forEach((atr, j) => {
        if (atr.name === "imagesObject") {
          atr.value.forEach((val, k) => {
            val.forEach((el, l) => {
              if (
                el.name === "alt" ||
                el.name === "title" ||
                el.name === "text" ||
                el.name === "linkText"
              ) {
                const key = `${i}.${j}.${k}.${l}-${node.type}-${el.name}`;
                transObject[key] = el.value;
              }
            });
          });
        }
      });
    } else if (node.type === "div") {
      // HTML wrapped in a div
      writeHtmlToTransObject(node.children, transObject, i);
    } else if (node.type === "paragraph" && node.children.length === 1) {
      // Markdown paragraph with one markdown or html element
      const children = node.children[0];
      if (children.type === "text") {
        const key = `${i}-${node.type}`;
        transObject[key] = children.value;
      } else if (children.type === "image") {
        const key = `${i}-${children.type}`;
        transObject[key] = children.alt;
      } else if (
        children.type === "link" ||
        children.type === "a" ||
        children.type === "figcaption" ||
        children.type === "strong" ||
        children.type === "emphasis" ||
        children.type === "h1" ||
        children.type === "h2" ||
        children.type === "h3" ||
        children.type === "h4"
      ) {
        const key = `${i}-${children.type}`;
        transObject[key] = children.value;
      } else {
        console.log(node);
        console.log(
          "Message from make transObject: New markdown element found!"
        );
      }
      // console.log(transObject);
    } else if (
      (node.type === "paragraph" || node.type === "p") &&
      node.children.length > 1
    ) {
      // Markdown or html paragraph with inline elements
      const key = `${i}-${node.type}`;
      let value = "";
      node.children.forEach((child, j) => {
        if (child.type === "text") {
          value += child.value;
        } else {
          value += `<g-${j}>${child.value}</g>`;
        }
      });
      transObject[key] = value;
    } else if (node.type === "paragraph" && node.children.length === 0) {
      console.log(
        "Message from createTransObject: There is an html element not picked up at position",
        i,
        "Maybe this element should be wrapped in a div"
      );
    } else if (node.type === "heading") {
      const key = `${i}-${node.type}`;
      transObject[key] = node.value;
    } else {
      if (node.type !== "mdxjsEsm" && node.type !== "iframe") {
        console.log(
          "Message from createTransObject: There is an element not picked up at index",
          i
        );
      }
    }
  });
  return transObject;
}

function writeHtmlToTransObject(children, transObject, index, parrent) {
  let key = "";
  let value = "";
  children.forEach((child, k) => {
    if (child.children) {
      writeHtmlToTransObject(child.children, transObject, index, children[k]);
    } else if (parrent && parrent.type === "p") {
      // There are subelements
      key = `${index}-${parrent.type}:${parrent.id}`;
      if (child.type !== "text") {
        value += `<g:${child.id}>${child.value}</g>`;
      } else {
        value += child.value;
      }
    } else {
      key = `${index}-${child.type}:${child.id}`;
      value += child.value;
    }
  });
  transObject[key] = value;
}

function createOriginalMdxTree(mdx) {
  let tmxTree = {
    nodes: [],
  };

  const doc = fs.readFileSync(mdx);

  const tree = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkFrontmatter)
    .parse(doc);

  tree.children.forEach((el) => {
    if (el.type === "yaml") {
      const node = {
        type: el.type,
        attributes: [],
      };
      const valuearray = el.value.split("\r\n");
      valuearray.forEach((atr) => {
        const atribute = atr;
        const [key, ...rest] = atribute.split(":");
        const value = rest.join(":").trim().replace(/"/g, "");
        node.attributes.push({ name: key, value });
      });
      tmxTree.nodes.push(node);
    }
    if (el.type === "mdxjsEsm") {
      const node = {
        type: el.type,
        value: el.value,
      };
      tmxTree.nodes.push(node);
    }
    if (el.name === "Carousel") {
      const node = { type: el.name, attributes: [] };
      el.attributes.forEach((atr) => {
        if (atr.name === "imagesObject") {
          const imagesObjectArray = [];
          atr.value.data.estree.body[0].expression.elements.forEach((slide) => {
            const slidesarray = [];
            slide.properties.forEach((atr) => {
              slidesarray.push({
                name: atr.key.name,
                value: atr.value.value,
              });
            });
            imagesObjectArray.push(slidesarray);
          });
          node.attributes.push({ name: atr.name, value: imagesObjectArray });
        } else {
          node.attributes.push({ name: atr.name, value: atr.value.value });
        }
      });
      tmxTree.nodes.push(node);
    }
    if (el.type === "mdxJsxFlowElement" && el.name !== "Carousel") {
      const rootNode = getHTMLTree(el);
      tmxTree.nodes.push(rootNode);
    }
    if (el.type === "heading") {
      const { type, depth } = el;
      const node = { type, depth };
      node.value = el.children[0].value;
      tmxTree.nodes.push(node);
    }
    if (el.type === "paragraph") {
      const node = createMdTree(el);
      tmxTree.nodes.push(node);
      // console.log(el);
    }
  });
  return tmxTree;
}

function createMdTree(node) {
  const mdNode = { type: node.type, children: [] };
  node.children.forEach((child) => {
    if (child.type === "text") {
      mdNode.children.push({
        type: child.type,
        value: child.value,
      });
    } else if (child.type === "strong" || child.type === "emphasis") {
      mdNode.children.push({
        type: child.type,
        value: child.children[0].value,
      });
    } else if (child.type === "image") {
      mdNode.children.push({
        type: child.type,
        url: child.url,
        alt: child.alt,
      });
    } else if (child.type === "link") {
      mdNode.children.push({
        type: child.type,
        url: child.url,
        value: child.children[0].value,
      });
    } else if (child.name === "figcaption") {
      const captionNode = {
        type: child.name,
        value: child.children[0].value,
      };
      if (child.attributes.length > 0) {
        captionNode.attributes = getAttributes(child.attributes);
      }
      mdNode.children.push(captionNode);
    } else if (
      child.name === "h1" ||
      child.name === "h2" ||
      child.name === "h3" ||
      child.name === "h4" ||
      child.name === "a"
    ) {
      // Title or other html elements
      const titleNode = {
        type: child.name,
        value: child.children[0].value,
      };
      if (child.attributes.length > 0) {
        titleNode.attributes = getAttributes(child.attributes);
      }
      mdNode.children.push(titleNode);
    } else {
      if (child.name !== "p") {
        console.log("getMdTree says: There is a new type in a markdown file");
        console.log(child);
      }
    }
  });
  return mdNode;
}

function getAttributes(attributes) {
  const atrArray = [];
  attributes.forEach((atr) => {
    atrArray.push({ name: atr.name, value: atr.value });
  });
  return atrArray;
}

function getHTMLTree(node, id = 0) {
  // let id = 0;
  const htmlNode = { id: id };
  htmlNode.type = node.name || node.type;

  if (node.attributes?.length > 0) {
    htmlNode.attributes = getAttributes(node.attributes);
  }
  if (node.children) {
    htmlNode.children = [];
    node.children.forEach((child) => {
      // If child is another element that contains other elements, traverse the tree further. Else it is a normal html element
      if (child.type === "mdxJsxFlowElement") {
        htmlNode.children.push(getHTMLTree(child, id++));
      } else {
        // if element has children it is a paragraph with inline elements. Else it is a normal p element
        if (child.children.length > 1) {
          child.children.forEach((grantChild) => {
            if (grantChild.type === "text") {
              id++;
              htmlNode.children.push({
                type: grantChild.type,
                id: id,
                value: grantChild.value,
              });
            } else if (grantChild.type === "mdxTextExpression") {
              console.log('from extractHelperfunctins line 308:')
              console.log(grantChild)
            } else {
              id++;
              const inlineNode = { type: grantChild.name, id: id };
              if (grantChild.attributes?.length > 0) {
                inlineNode.attributes = getAttributes(grantChild.attributes);
              }
              inlineNode.value = grantChild.children[0].value;
              htmlNode.children.push(inlineNode);
            }
          });
        } else {
          id++;
          const grantChild = child.children[0];
          const elementNode = { type: grantChild.name, id: id };
          if (grantChild.attributes?.length > 0) {
            elementNode.attributes = getAttributes(grantChild.attributes);
          }
          // console.log(grantChild)
          elementNode.value = grantChild.children[0].value;
          htmlNode.children.push(elementNode);
        }
      }
    });
  }
  if (htmlNode.children.length === 0) delete htmlNode.children;
  return htmlNode;
}

export { createOriginalMdxTree, createTranslationObject };
