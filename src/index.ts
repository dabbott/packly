import { Element, parse, serialize } from 'parse5'
import { inlineScript, inlineStyle, traverse } from './dom'

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
  request: (options: RequestOptions) => string | undefined
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

  if (html === undefined) {
    throw new Error(`Request for entry file '${entry}' failed`)
  }

  const documentRoot = parse(html)

  const links = traverse.findAll<Element>(
    documentRoot,
    (node): node is Element => node.nodeName === 'link'
  )

  links.forEach((link) => {
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

  return serialize(documentRoot)
}
