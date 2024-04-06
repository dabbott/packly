import { Element, Node, ParentNode, TextNode } from 'parse5'
import { withOptions } from 'tree-visit'

export type InlineDataUrl = { url: string }

export function inlineDataUrl(data: string): InlineDataUrl {
  return { url: data }
}

function createTextNode(parentNode: ParentNode, text: string): TextNode {
  return {
    parentNode,
    nodeName: '#text',
    value: text,
  }
}

export function inlineStyle(node: Element, css: string | InlineDataUrl) {
  if (typeof css !== 'string') {
    const href = css.url
    const hrefAttr = node.attrs.find((attr) => attr.name === 'href')
    if (hrefAttr) {
      hrefAttr.value = href
    } else {
      node.attrs.push({ name: 'href', value: href })
      node.childNodes = []
    }
    return
  }

  node.nodeName = 'style'
  node.tagName = 'style'
  node.attrs = []
  node.childNodes = [createTextNode(node, css)]
}

export function inlineScript(node: Element, js: string | InlineDataUrl) {
  if (typeof js !== 'string') {
    const src = js.url
    const srcAttr = node.attrs.find((attr) => attr.name === 'src')
    if (srcAttr) {
      srcAttr.value = src
    } else {
      node.attrs.push({ name: 'src', value: src })
      node.childNodes = []
    }
    return
  }

  node.nodeName = 'script'
  node.tagName = 'script'
  node.attrs = []
  node.childNodes = [createTextNode(node, js)]
}

export const traverse = withOptions<Node>({
  getChildren: (node) => ('childNodes' in node ? node.childNodes : []),
})
