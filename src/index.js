const yargs = require('yargs')
const Server = require('./app')

const argv = yargs
    .usage('akServer [options]')
    .option('p', {
        alias: 'port',
        describe: '端口号',
        default: 8080
    })
    .option('d',{
        alias: 'root',
        describe: '根目录',
        default: process.cwd(),
    })
    .version()
    .alias('v', 'version')
    .help()
    .argv;

const server = new Server(argv)
server.start()