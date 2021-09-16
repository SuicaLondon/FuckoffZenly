const fs = require('fs')
const path = require('path')
const { async } = require('regenerator-runtime')


async function getFolderNames() {
    return await new Promise((resolve, reject) => {
        fs.readdir('./', (err, files) => {
            resolve(files.filter(file => file.includes('Zenly Data')))
        })
    })
}


async function directToLocation(names) {
    return new Promise((resolve, reject)=> {
        names.forEach(async name => {
            let locationsPath = path.join(__dirname, name, 'locations')
            await enterAllLocationFile(locationsPath)
        })
    })
}

async function enterAllLocationFile(locationsPath) {
    fs.readdir(locationsPath, (err, files) => {
        let filteredFile = files.filter(file => !Number.isNaN(parseInt(file, 10)))
        filteredFile.forEach(file=> {
            let yearPath = path.join(locationsPath, file)
            fs.readdir(yearPath, (err, files)=> {
                let filteredFile = files.filter(file => !Number.isNaN(parseInt(file, 10)))
                filteredFile.forEach(file =>{
                    let monthPath = path.join(yearPath, file)
                    fs.readdir(monthPath, (err, files) => {
                        let filteredFile = files.filter(file => !Number.isNaN(parseInt(file, 10)))
                        filteredFile.forEach(file =>{
                            let filePath = path.join(monthPath, file)
                            loadLocationHTMLFile(filePath)
                        })
                    })
                })
            })
        })
    })
}

async function loadLocationHTMLFile(filePath) {
    fs.readFile(filePath, 'utf-8', (err, data)=> {
        console.log(data)
    })
}

!async function(){
    let folderNames = await getFolderNames()
    directToLocation(folderNames)
}()
