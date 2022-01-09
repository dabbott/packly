import { Node, path, Volume } from 'imfs'
import { parse, serialize } from 'parse5'
import { bundle, BundleOptions, RequestOptions } from '..'

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

it('identity', () => {
  const volume = Volume.create<string>()

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>My page</title>
  </head>
  <body>
    <p>Hello, world!</p>
  </body>
</html>`

  Volume.writeFile(volume, `/index.html`, html)

  const result = bundle(createOptions(volume))

  expect(result).toEqual(serialize(parse(html)))
})

describe('styles', () => {
  it('inlines a style', () => {
    const volume = Volume.create<string>()

    const html = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>My page</title>
      <link rel="stylesheet" href="style.css">
    </head>
    <body>
      <p>Hello, world!</p>
    </body>
  </html>`

    const css = `body { background: #222; }`

    Volume.writeFile(volume, `/index.html`, html)
    Volume.writeFile(volume, `/style.css`, css)

    const result = bundle(createOptions(volume))

    expect(result).toMatchSnapshot()
  })

  it('ignores a style', () => {
    const html = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>My page</title>
      <link rel="stylesheet" href="style.css">
    </head>
    <body>
      <p>Hello, world!</p>
    </body>
  </html>`

    const result = bundle({
      entry: '/index.html',
      request: ({ url }: RequestOptions) => {
        if (url === '/index.html') return html
        return undefined
      },
    })

    expect(result).toEqual(serialize(parse(html)))
  })
})

describe('scripts', () => {
  it('inlines a script', () => {
    const volume = Volume.create<string>()

    const html = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>My page</title>
      <script src="main.js"></script>
    </head>
    <body>
      <p>Hello, world!</p>
    </body>
  </html>`

    const js = `console.log('Hello, world!');`

    Volume.writeFile(volume, `/index.html`, html)
    Volume.writeFile(volume, `/main.js`, js)

    const result = bundle(createOptions(volume))

    expect(result).toMatchSnapshot()
  })

  it('ignores a script', () => {
    const html = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>My page</title>
      <script src="main.js"></script>
    </head>
    <body>
      <p>Hello, world!</p>
    </body>
  </html>`

    const result = bundle({
      entry: '/index.html',
      request: ({ url }: RequestOptions) => {
        if (url === '/index.html') return html
        return undefined
      },
    })

    expect(result).toEqual(serialize(parse(html)))
  })
})
