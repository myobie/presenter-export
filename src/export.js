/* global NSString */

import ui from 'sketch/ui'
import dom from 'sketch/dom'
import toArray from 'sketch-utils/to-array'
import url from 'url'
import path from 'path'

export default function (context) {
  const doc = context.document
  let basePath = decodeURIComponent(path.dirname(url.parse(String(context.document.fileURL())).pathname)) + '/'
  console.log('basePath', basePath)
  let slidesPath = path.join(basePath, 'slides') + '/'
  console.log('slidesPath', slidesPath)
  const artboards = toArray(doc.currentPage().artboards())

  if (artboards.length === 0) {
    ui.message('There are no artboards')
    return
  }

  let columns = []

  let [nextColumn, nextRemainder] = getNextColumnAndRemainder(artboards)
  columns.push(nextColumn)

  while (nextRemainder.length > 0) {
    [nextColumn, nextRemainder] = getNextColumnAndRemainder(nextRemainder)
    columns.push(nextColumn)
  }

  let toBeExported = columns.map(column => {
    return column.map(board => {
      return {
        artboard: board,
        id: board.objectID(),
        x: board.frame().x(),
        y: board.frame().y(),
        name: String(board.name())
      }
    })
  })

  toBeExported = [].concat(...toBeExported).map((obj, i) => {
    obj.number = i + 1
    return obj
  })

  const exportOptions = {
    output: slidesPath,
    formats: 'svg',
    'use-id-for-name': true,
    overwriting: true
  }

  toBeExported.forEach(o => {
    console.log('exporting', o.name)
    dom.export(o.artboard, exportOptions)
  })

  const slidesJSON = JSON.stringify(toBeExported.map(o => {
    return {
      name: o.name,
      path: `/slides/${o.id}.svg`,
      number: o.number
    }
  }))

  console.log('slidesJSON', slidesJSON)

  const slidesJSONPath = path.join(basePath, 'slides.json')
  console.log('slidesJSONPath', slidesJSONPath)
  const slidesNSString = NSString.stringWithString(slidesJSON)

  slidesNSString.writeToFile_atomically_encoding_error(slidesJSONPath, true, 4, null)
}

function pos (board) {
  const frame = board.frame()
  return [frame.x(), frame.y()]
}

function sortArtboards (list) {
  return list.sort((a, b) => {
    const aa = pos(a)
    const bb = pos(b)

    if (aa[0] > bb[0] || aa[1] > bb[1]) {
      return 1
    }

    if (aa[0] < bb[0] || aa[1] < bb[1]) {
      return -1
    }

    return 0
  })
}

function getNextColumnAndRemainder (list) {
  if (list.length === 0) {
    return [[], []]
  }

  list = sortArtboards(list)

  let remainder = []
  let column = []

  const first = list.shift()
  const firstPos = pos(first)
  const firstWidth = first.frame().width()

  column.push(first)

  while (list.length > 0) {
    const next = list.shift()
    const nextPos = pos(next)
    const nextWidth = first.frame().width()

    if (nextPos[0] === firstPos[0] ||
        (nextPos[0] > firstPos[0] && nextPos[0] < firstPos[0] + firstWidth) ||
        (nextPos[0] + nextWidth > firstPos[0] && nextPos[0] + firstWidth < firstPos[0] + firstWidth)) {
      column.push(next)
    } else {
      remainder.push(next)
    }
  }

  column = sortArtboards(column)

  return [column, remainder]
}
