#!/usr/bin/env node

const handler = require('../lib/index')

const command = process.argv[2]
const input = process.argv[3]

switch (command) {
  case 'clone':
    const output = process.argv[4] || ''
    const fileName = process.argv[5] || ''
    handler[command]({
      input,
      output,
      fileName
    })
    break;
  case 'clean': 
    handler[command](input)
    break
}