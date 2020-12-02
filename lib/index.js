/*
 * 复制目录中的所有文件包括子目录
 * @param{ config }
 * interface config: {
 *  input: string | path,
 *  output: string | path,
 *  fileName: string,
 *  handleCopy: (): promise => {} 
 * } 
 */

const { resolve } = require('path')

const fs = require('fs'),
      path = require('path'),
      _File = {}

let COPYCONFIG = {
  input: '',
  output: '',
  fileName: '',
  handleCopy(src, dst) {
    return new Promise(resolve => {
      // 创建读取流
      const readable = fs.createReadStream(src)
      // 创建写入流
      const writable = fs.createWriteStream(dst) 
      // 通过管道来传输流
      readable.pipe(writable)
  
      readable.on('close', resolve)
    })
  }
}

const isDirectory = src => {
  return new Promise((resolve, reject) => {
    // stat(url, callback) 读取目录下的文件，在回调中返回文件的详细信息
    fs.stat(src, function(err, st) {
      if (err) throw err
      if (st.isFile()) reject()
      else if (st.isDirectory()) resolve()
    })
  })
}

const clean = targetDir => {
  function empty (dir, flag = false) {
    const dirs = fs.readdirSync(dir)
    dirs.forEach(file => {
      let newPath = path.join(dir, file)
      // 读取文件，判断是文件还是文件目录
      // 如果文件还没有遍历结束的话，继续拼接新路径，使用fs.stats读取该路径
      const stats = fs.statSync(newPath) 
  
      if (stats.isDirectory()) {
        empty(newPath, true)
      } else {
        fs.unlinkSync(newPath)
      }
    })
    if (flag) fs.rmdirSync(dir)
  }
  
  return new Promise((resolve, reject) => {
    isDirectory(targetDir)
      .then(() => {
        try {
          empty(targetDir, true)
        } catch (error) {
          reject(error)
        }
        resolve(targetDir)
      }, () => {
        try {
          empty(targetDir, true)
        } catch (error) {
          reject(error)
        }
        resolve(targetDir)
      })
  })
}

const copy = (src, dst) => {
  return new Promise(resolve => {
    if (_File.type !== 'directory') { 
      COPYCONFIG.handleCopy(src, dst + '/' +_File.fileName)
      return resolve()
    }
    // 读取目录中的所有文件/目录
    fs.readdir(src, function(err, files) {
      if (err) throw err
      // resolve(files)
      const promiseAll = []
      files.forEach(function(file) {
        const _src = src + '/' + file,
            _dst = dst + '/' + file
        
        promiseAll.push(
          isDirectory(_src)
          .then(() => {
            return new Promise(_resolve => {
              // 如果是目录则在目标文件创建目录，再递归调用
              fs.mkdir(_dst, err => {
                if (err) throw err
                _resolve()
              })
            }).then(() => {
              return copy(_src, _dst)
            })
          }, err => {
            if (err) throw err
            return COPYCONFIG.handleCopy(_src, _dst)
          })
        )
      })

      Promise.all(promiseAll).then(() => {
        resolve()
      })
    })
  })
}

const copyInit = (src, target) => {
  // 在复制前需要判断目标是文件还是目录 
  return new Promise((resolve, reject) => {  
    isDirectory(src)
      .then(() => {
        _File.type = 'directory'
      }, (err) => {
        if (err) throw err
        _File.type = 'file'
      })
      .then(() => {
        fs.readdir(target, (err, files) => {
          if (err) throw err
          if (_File.type === 'directory') resolve(files)
          else reject(files)
        })
      })
  })
}

const clone = function(config = {}) {
  COPYCONFIG = Object.assign({}, COPYCONFIG, config)
  _File.fileName = config.fileName || path.basename(src)
  const { input: src, output: target } = COPYCONFIG

  return copyInit(src, target)
    .then(files => {
      const targetDir = `${target}/${_File.fileName}`
      if (files.includes(_File.fileName)) return clean(targetDir)
      
      return new Promise(resolve => {
        fs.mkdir(targetDir, err => {
          if (err) throw err
          resolve(targetDir)
        })
      })
    }, files => {
      if (files && !Array.isArray(files)) throw files
      if (files.includes(_File.fileName)) fs.unlinkSync(`${target}/${_File.fileName}`)
      return Promise.resolve(target)
    })
    .then((dest) => {
      return copy(src, dest)
    })
}

module.exports = {
  clone,
  clean
}
