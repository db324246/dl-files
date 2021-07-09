const path = require('path');
const { clone, clean } = require('../lib/index');

const arr = [
  './aaa.text',
  './aaa1.text',
  './aaa2.text',
  './aaa3.text'
]

// arr.forEach(a => {
//   clone({
//     input: path.join(__dirname, a),
//     output: path.join(__dirname, './dist')
//   })
// })

clean(path.join(__dirname, './dist'))