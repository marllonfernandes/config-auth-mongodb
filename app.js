(async() => {

    const controller = require('./controller')

    try {

        // cria o usuario no mongodb
        await controller.createUserMongoDb()

        // cria os diretorios + arquivo de log
        await controller.setDirFile()

        // cria o arquivo sem autenticacao
        await controller.createFileMongodCfg(false)

        // executa o comando para criar o servico no windows
        await controller.setServiceMongo(false)

        await controller.sleep(2000)

        // cria o arquivo com autenticacao
        await controller.createFileMongodCfg(true)

        // executa o comando para criar o servico no windows
        await controller.setServiceMongo(true)

    } catch (error) {
        console.error('ERROR: ', error);
    }

    process.on('exit', async(code) => {
        console.log(`MongoDb configurado com sucesso!`)
    })

})()