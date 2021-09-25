const nameMongoService = 'MongoDB'
const versionMongo = '5.0'
const dir_mongodb = `C:\\Program Files\\${nameMongoService}\\Server\\${versionMongo}`
const dir_data = `${dir_mongodb}\\data`
const port = 27017
const env = 'development' // production;development;test
const bindIp = env === 'production' ? '127.0.0.1' : env === 'test' ? '127.0.0.1' : '127.0.0.1'

module.exports = {

    env: env,
    versionMongo: versionMongo,
    nameMongoService: nameMongoService,
    dir_mongodb: dir_mongodb,
    dir_data: dir_data,
    dir_data_log: `${dir_mongodb}\\log`,
    port: port,
    bindIp: [bindIp].join(','),
    userAdmin: '',
    pwdAdmin: '',
    urldb: `mongodb://localhost:${port}`,
    dbNames: ['admin', 'db01', 'db02']

}