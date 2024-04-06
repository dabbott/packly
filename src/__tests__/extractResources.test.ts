import { Node, path, Volume } from 'imfs'
import { BundleOptions, extractResources, RequestOptions } from '..'

const createOptions = (volume: Node<string>): BundleOptions => ({
  entry: '/index.html',
  request: ({ url, origin }: RequestOptions) => {
    if (/^(https?)?\/\//.test(url)) return undefined

    return Volume.readFile(
      volume,
      origin && !url.startsWith('/') ? path.join(origin, '..', url) : url
    )
  },
})

describe('extracts', () => {
  it('scripts', () => {
    const result = extractResources(`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>My page</title>
        <script src="main.js"></script>
      </head>
      <body>
        <p>Hello, world!</p>
        <script>
          console.log('Hello, world!')
        </script>
      </body>
    </html>`)

    expect(result).toEqual([
      { type: 'linked', mime: 'text/javascript', url: 'main.js' },
      {
        type: 'inline',
        mime: 'text/javascript',
        content: `console.log('Hello, world!')`,
      },
    ])
  })

  it('styles', () => {
    const result = extractResources(`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>My page</title>
        <link rel="stylesheet" href="main.css">
        <style>
          body { color: red; }
        </style>
      </head>
      <body>
        <p>Hello, world!</p>
      </body>
    </html>`)

    expect(result).toEqual([
      { type: 'linked', mime: 'text/css', url: 'main.css' },
      {
        type: 'inline',
        mime: 'text/css',
        content: `body { color: red; }`,
      },
    ])
  })

  it('images', () => {
    const result = extractResources(`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>My page</title>
      </head>
      <body>
        <img src="image.jpg" alt="An image">
      </body>
    </html>`)

    expect(result).toEqual([
      { type: 'linked', mime: 'image/jpeg', url: 'image.jpg' },
    ])
  })

  it('other', () => {
    const result = extractResources(`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>My page</title>
        <link rel="icon" href="favicon.ico">
      </head>
      <body>
        <p>Hello, world!</p>
      </body>
    </html>`)

    expect(result).toEqual([
      { type: 'linked', mime: 'image/vnd.microsoft.icon', url: 'favicon.ico' },
    ])
  })
})
