import { Element, Node, ParentNode, TextNode } from 'parse5'
import { withOptions } from 'tree-visit'

function createTextNode(parentNode: ParentNode, text: string): TextNode {
  return {
    parentNode,
    nodeName: '#text',
    value: text,
  }
}

export function inlineStyle(node: Element, css: string) {
  node.nodeName = 'style'
  node.tagName = 'style'
  node.attrs = []
  node.childNodes = [createTextNode(node, css)]
}

export function inlineScript(node: Element, js: string) {
  node.nodeName = 'script'
  node.tagName = 'script'
  node.attrs = []
  node.childNodes = [createTextNode(node, js)]
}

export const traverse = withOptions<Node>({
  getChildren: (node) => ('childNodes' in node ? node.childNodes : []),
})
