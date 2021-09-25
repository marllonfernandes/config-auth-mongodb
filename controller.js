const exec = require('child-process-promise').exec
const fs = require("fs")
const { MongoClient } = require('mongodb')
const { nameMongoService, versionMongo, port, bindIp, dir_mongodb, userAdmin, pwdAdmin, urldb, dbNames, dir_data, dir_data_log, env } = require('./options')

// pesquisa o status do servico windows
// return object { message, status }
exports.getStatusService = async(service) => {
    let data = { message: null, status: null }
    try {
        let { stderr, stdout } = await exec(`sc.exe query ${service}`)
        if (stderr) {
            data.message = stderr
        } else {
            let statusService = stdout.split('\r\n').find(el => el.includes(env === 'development' ? 'ESTADO' : 'STATE')).trim().split(':')[1].trim().split(' ')[2].trim()
            data.status = statusService
        }
    } catch (error) {
        data.message = error.message.includes('1060') ? 'service not found' : error.message
    }
    return data
}

// funcao para sleep
exports.sleep = (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

// cria o arquivo mongod.cfg com as configuracoes necessarias
exports.createFileMongodCfg = async(authEnable) => {

    var valueConf = ``
    const dirFile = `${dir_mongodb}\\bin\\mongod.cfg`

    valueConf += `# mongod.conf \r\n`
    valueConf += `\r\n`
    valueConf += `# for documentation of all options, see: \r\n`
    valueConf += `#   http://docs.mongodb.org/manual/reference/configuration-options/\r\n`
    valueConf += `\r\n`
    valueConf += `# Where and how to store data.\r\n`
    valueConf += `storage:\r\n`
    valueConf += `  dbPath: C:\\Program Files\\${nameMongoService}\\Server\\${versionMongo}\\data\r\n`
    valueConf += `  journal:\r\n`
    valueConf += `    enabled: true\r\n`
    valueConf += `#  engine:\r\n`
    valueConf += `#  mmapv1:\r\n`
    valueConf += `#  wiredTiger:\r\n`
    valueConf += `\r\n`
    valueConf += `# where to write logging data.\r\n`
    valueConf += `systemLog:\r\n`
    valueConf += `  destination: file\r\n`
    valueConf += `  logAppend: true\r\n`
    valueConf += `  path:  C:\\Program Files\\${nameMongoService}\\Server\\${versionMongo}\\log\\mongod.log\r\n`
    valueConf += `\r\n`
    valueConf += `# network interfaces\r\n`
    valueConf += `net:\r\n`
    valueConf += `  port: ${port}\r\n`
    valueConf += `  bindIp: ${bindIp}\r\n`
    valueConf += `\r\n`
    valueConf += `\r\n`
    valueConf += `#processManagement:\r\n`
    valueConf += `\r\n`
    if (authEnable) {
        valueConf += `security:\r\n`
        valueConf += `  authorization: enabled\r\n`
    } else {
        valueConf += `#security:\r\n`
        valueConf += `#	authorization: enabled\r\n`
    }
    valueConf += `#operationProfiling:\r\n`
    valueConf += `\r\n`
    valueConf += `#replication:\r\n`
    valueConf += `\r\n`
    valueConf += `#sharding:\r\n`
    valueConf += `\r\n`
    valueConf += `## Enterprise-Only Options:\r\n`
    valueConf += `\r\n`
    valueConf += `#auditLog:\r\n`
    valueConf += `\r\n`
    valueConf += `#snmp:\r\n`

    fs.unlinkSync(dirFile)
    fs.writeFileSync(dirFile, valueConf)

}

// cria para e deleta servico no windows
exports.setServiceMongo = async(stopService) => {

    let dataStatusService = await this.getStatusService(nameMongoService)

    if (dataStatusService.status) {

        if (dataStatusService.status.trim().toUpperCase() == 'RUNNING') {
            await exec(`sc.exe stop ${nameMongoService}`)
            await this.sleep(5000)
        }
        await exec(`sc.exe delete ${nameMongoService}`)
        await this.sleep(5000)
    }

    // exemplo de como deve ficar a linha
    // sc.exe create MongoDB binPath= "\"C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe\" --service --config=\"C:\Program Files\MongoDB\Server\5.0\bin\mongod.cfg\"" DisplayName= "MongoDB" start= "auto"
    const commandCreate = `sc.exe create ${nameMongoService} binPath= "\\"C:\\Program Files\\${nameMongoService}\\Server\\${versionMongo}\\bin\\mongod.exe\\" --service --config=\\"C:\\Program Files\\${nameMongoService}\\Server\\${versionMongo}\\bin\\mongod.cfg\\"" DisplayName= "${nameMongoService}" start= "auto"`
    let dataCreateService = await exec(commandCreate)

    if (dataCreateService.stderr) {
        console.log('dataCreateService.stderr: ', dataCreateService.stderr);
        return
    }

    console.log('dataCreateService.stdout: ', dataCreateService.stdout);

    await this.sleep(5000)
    await exec(`sc.exe start ${nameMongoService}`)

}

// cria os diretorios data e log + arquivo mongod.log
exports.setDirFile = async() => {
    if (!fs.existsSync(dir_data)) {
        fs.mkdirSync(dir_data)
    }
    if (!fs.existsSync(dir_data_log)) {
        fs.mkdirSync(dir_data_log)
    }
    if (!fs.existsSync(`${dir_data_log}\\mongod.log`)) {
        fs.writeFileSync(`${dir_data_log}\\mongod.log`, '')
    }
}

// cria usuario no mongodb
exports.createUserMongoDb = async() => {
    for (let i = 0; i < dbNames.length; i++) {
        let dbName = dbNames[i]
        let mongoclient = new MongoClient(urldb)
        await mongoclient.connect()
        let db = mongoclient.db(dbName)
        try {
            await db.addUser(userAdmin, pwdAdmin, { readOnly: false })
        } catch (error) {
            console.log(`User "${userAdmin}" already exists`)
        }
        mongoclient.close()
    }
}