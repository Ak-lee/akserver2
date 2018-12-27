const fs = require('fs')
const Handlebars = require('handlebars')
const path = require('path')
const promisify = require('util').promisify
const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)
const mime = require('./mime')
const compress = require('./compress')
const isFresh = require('./cache')
const tplPath = path.join(__dirname, '../template/dir.tpl')
const source = fs.readFileSync(tplPath)
const template = Handlebars.compile(source.toString())


module.exports = async function (req, res, filePath, config) {
    try {
        const stats = await stat(filePath)
        if(stats.isFile()) {
            const contentType = mime(filePath).contentType
            if(isFresh(stats, req, res)) {
                res.statusCode = 304
                res.end()
                return ;
            }
            res.statusCode = 200
            res.setHeader('Content-Type', contentType)
            var rs = fs.createReadStream(filePath)
            if(filePath.match(config.compress)) {
                rs = compress(rs,req, res)
            }
            rs.pipe(res)
        } else if(stats.isDirectory()) {
            const files = await readdir(filePath)
            var readmeContent = ''
            for (var i =0; i<files.length; i++){
                let testPath = path.join(filePath, files[i])
                let stats = await stat(testPath)
                if(stats.isDirectory()){
                    files[i] = {
                        file: files[i],
                        icon: 'dir'
                    }
                }else{
                    if(files[i] === 'README.md' || 'readme.txt'){
                        readmeContent = fs.readFileSync(testPath)
                    }
                    files[i] = {
                        file: files[i],
                        icon: mime(files[i]).icon
                    }
                }
            }
            const dir = path.relative(config.root, filePath)
            const prevDir = path.join(`/${dir}`, '..')

            const data = {
                title: path.basename(filePath),
                dir: dir ? `/${dir}` : '',
                files,
                prevDir,
                readmeContent,
            }
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/html')
            res.end(template(data))
        }
    } catch (error) {
        res.statusCode = 404
        res.setHeader('Content-Type', 'text/plain')
        res.end(`${filePath} is not a directory or file`)
        return ;
    }
}