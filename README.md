### dl-files

> `dl-files` 会陆续集成了一些在 node 环境下的文件操作工具

#### Orders
| 命令 | api | 描述 | 参数 | 上线时间 |
| --- | --- | --- | --- | --- |
| dl-files clone | clone | 对指定路径的文件或目录克隆到目标路径 | option 对象，具体看下表 | 2020.12.2 |
| dl-files clean | clean | 清除指定路径的文件或目录 | targetPath，目标路径 | 2020.12.2 |


#### option

| 参数 | 描述 | 类型 |
| --- | --- | --- | 
| input | 需要复制的文件或目录的入口路径 | string |
| output | 复制的文件或目录的目标路径 | string |
| fileName | 复制的文件或目录的重命名 | string |
| handleCopy | 自定义复制操作，返回一个 Promise | function |
