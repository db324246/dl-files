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
      path = require('path')

const DEFAULT_COPYCONFIG = {
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

const clean = url => {
  return isDirectory(url)
    .then(
      () => {
        const dirs = fs.readdirSync(url)
        return Promise.all(
          dirs.map(file => clean(path.join(url, file)))
        )
          .then(() => fs.rmdirSync(url))
      },
      () => {
        fs.unlinkSync(url)
      }
    )
    .catch(err => Promise.reject(err))
}

class DlClone {
  constructor (config) {
    this.COPYCONFIG = Object.assign({}, DEFAULT_COPYCONFIG, config)
    this._File = {}
    this._File.fileName = config.fileName || path.basename(this.COPYCONFIG.input)
  }

  copyInit(src, target) {
    // 在复制前需要判断目标是文件还是目录 
    return new Promise((resolve, reject) => {  
      isDirectory(src)
        .then(() => {
          this._File.type = 'directory'
        }, (err) => {
          if (err) throw err
          this._File.type = 'file'
        })
        .then(() => {
          fs.readdir(target, (err, files) => {
            if (err) throw err
            if (this._File.type === 'directory') resolve(files)
            else reject(files)
          })
        })
    })
  }

  clone() {
    const { input: src, output: target } = this.COPYCONFIG
    return this.copyInit(src, target)
      .then(files => {
        const targetDir = `${target}/${this._File.fileName}`
        return new Promise(resolve => {
          if (files.includes(this._File.fileName)) resolve(clean(targetDir))
          resolve()
        })
          .then(() => {
            return new Promise(r => {
              fs.mkdir(targetDir, err => {
                if (err) throw err
                r(targetDir)
              })
            })
          })
      }, files => {
        if (files && !Array.isArray(files)) throw files
        if (files.includes(this._File.fileName)) fs.unlinkSync(`${target}/${this._File.fileName}`)
        return Promise.resolve(target)
      })
      .then((dest) => {
        return this.copy(src, dest)
      })
  }
  
  copy(src, dst){
    const _File = this._File
    const _this = this
    return new Promise(resolve => {
      if (_File.type !== 'directory') { 
        this.COPYCONFIG.handleCopy(src, dst + '/' +_File.fileName)
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
                return _this.copy(_src, _dst)
              })
            }, err => {
              if (err) throw err
              return _this.COPYCONFIG.handleCopy(_src, _dst)
            })
          )
        })
  
        Promise.all(promiseAll).then(() => {
          resolve()
        })
      })
    })
  }
}

module.exports = {
  clean,
  clone: (config = {}) => {
    const dlClone = new DlClone(config)
    return dlClone.clone()
  }
}
