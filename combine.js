const PDF = require('pdfkit')
const fs = require('fs')
const path = require('path')
const { inspect } = require('util')

if (!process.argv[2]) {
  console.error('Provide the path to the slides.json')
  process.exit(1)
} else {
  start(process.argv[2])
}

function join (left, right) {
  return path.join(left, right)
}

function start (slidesJSONPath) {
  const basePath = path.dirname(slidesJSONPath)
  const combinedPath = join(basePath, 'combined.pdf')

  const doc = new PDF()
  doc.pipe(fs.createWriteStream(combinedPath))

  fs.readFile(slidesJSONPath, (err, data) => {
    if (err) {
      console.error("Couldn't read the slides.json file at", slidesJSONPath, err)
      process.exit(1)
    }

    const json = JSON.parse(data)

    streamEachFile(json, doc, basePath, () => doc.end())
  })
}

function streamEachFile (slides, doc, basePath, next) {
  if (slides.length === 0) {
    next()
  } else {
    const slide = slides.shift()
    streamFile(slide, doc, basePath, () => {
      process.nextTick(() => streamEachFile(slides, doc, basePath, next))
    })
  }
}

function streamFile (slide, doc, basePath, next) {
  const filePath = join(basePath, slide.path)
  const stream = fs.createReadStream(filePath)

  stream.on('data', chunk => {
    doc.addContent(chunk)
  })
  stream.on('end', () => {
    doc.addPage()
    next()
  })
}
