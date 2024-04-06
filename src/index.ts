import mime from 'mime-types'
import { Element, parse, serialize } from 'parse5'
import { isTextNode } from 'parse5/lib/tree-adapters/default'
import { InlineDataUrl, inlineScript, inlineStyle, traverse } from './dom'

export * from './dom'

export interface RequestOptions {
  /**
   * The file that initiated this request.
   *
   * If the request is for the entry file itself, this will be undefined.
   */
  origin?: string
  url: string
}

export interface BundleOptions {
  /**
   * The initial HTML filename
   */
  entry: string

  /**
   * Return either the contents of the requested file, or undefined to skip inlining
   */
  request: (options: RequestOptions) => InlineDataUrl | string | undefined
}

/**
 * Transform an HTML file, optionally inlining external resources
 *
 * @param options
 * @returns The transformed HTML file
 */
export function bundle(options: BundleOptions) {
  const { entry, request } = options

  const html = request({ url: entry })

  if (typeof html !== 'string') {
    throw new Error(`Request for entry file '${entry}' failed`)
  }

  const documentRoot = parse(html)

  const links = traverse.findAll<Element>(
    documentRoot,
    (node): node is Element => node.nodeName === 'link'
  )

  links.forEach((link) => {
    // Remove any preload or prefetch links
    if (
      link.attrs.some(
        (attr) =>
          attr.name === 'rel' && ['preload', 'prefetch'].includes(attr.value)
      )
    ) {
      link.parentNode.childNodes = link.parentNode.childNodes.filter(
        (node) => node !== link
      )
      return
    }

    const href = link.attrs.find((attr) => attr.name === 'href')

    if (!href) return

    const file = request({ origin: entry, url: href.value })

    if (file === undefined) return

    inlineStyle(link, file)
  })

  const scripts = traverse.findAll<Element>(
    documentRoot,
    (node): node is Element => node.nodeName === 'script'
  )

  scripts.forEach((script) => {
    const src = script.attrs.find((attr) => attr.name === 'src')

    if (!src) return

    const file = request({ origin: entry, url: src.value })

    if (file === undefined) return

    inlineScript(script, file)
  })

  const images = traverse.findAll<Element>(
    documentRoot,
    (node): node is Element => node.nodeName === 'img'
  )

  images.forEach((image) => {
    const src = image.attrs.find((attr) => attr.name === 'src')

    if (!src) return

    const file = request({ origin: entry, url: src.value })

    if (file === undefined) return

    if (typeof file === 'string') {
      src.value = file
    } else {
      src.value = file.url
    }
  })

  return serialize(documentRoot)
}

export type InlineResource = { type: 'inline'; mime: string; content: string }
export type LinkedResource = { type: 'linked'; mime: string; url: string }
export type Resource = InlineResource | LinkedResource

/**
 * Given an HTML file, extract all inline and linked resources
 *
 * @param html
 * @returns The extracted resources
 */
export function extractResources(html: string): Resource[] {
  const documentRoot = parse(html)

  const resources: Resource[] = []

  traverse.visit(documentRoot, (node) => {
    switch (node.nodeName) {
      case 'style': {
        const textContent = node.childNodes.find(isTextNode)

        if (!textContent) return

        resources.push({
          mime: 'text/css',
          type: 'inline',
          content: textContent.value.trim(),
        })

        break
      }
      case 'link': {
        const href = node.attrs.find((attr) => attr.name === 'href')

        if (!href) return

        resources.push({
          mime: mime.lookup(href.value) || 'application/octet-stream',
          type: 'linked',
          url: href.value,
        })

        break
      }
      case 'script': {
        const src = node.attrs.find((attr) => attr.name === 'src')

        if (src) {
          resources.push({
            mime: 'text/javascript',
            type: 'linked',
            url: src.value,
          })
        } else {
          const textContent = node.childNodes.find(isTextNode)

          if (!textContent) return

          resources.push({
            mime: 'text/javascript',
            type: 'inline',
            content: textContent.value.trim(),
          })
        }

        break
      }
      case 'img': {
        const src = node.attrs.find((attr) => attr.name === 'src')

        if (!src) return

        resources.push({
          mime: mime.lookup(src.value) || 'application/octet-stream',
          type: 'linked',
          url: src.value,
        })

        break
      }
    }
  })

  return resources
}
