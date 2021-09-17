const fs = require('fs')
const path = require('path')
const { async } = require('regenerator-runtime')
const jsdom = require('jsdom')
const {JSDOM} = jsdom


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
                            loadLocationHTMLFile(monthPath, file)
                        })
                    })
                })
            })
        })
    })
}

async function loadLocationHTMLFile(monthPath, file) {
    let filePath = path.join(monthPath, file)
    let date = file.slice(0, -5)
    fs.readFile(filePath, 'utf-8', (err, data)=> {
        const dom = new JSDOM(data)
        let nodeList = dom.window.document.querySelectorAll('tbody tr')
        nodeList.forEach(tr=>{
            const locationData = {
                date: date,
                time: tr.children[0].textContent,
                latitude: tr.children[1].textContent,
                longitude: tr.children[2].textContent,
                altitude: tr.children[3].textContent,
                bearing: tr.children[4].textContent,
                speed: tr.children[5].textContent,
            }
            console.log(locationData)
        })
    })
}

!async function(){
    let folderNames = await getFolderNames()
    directToLocation(folderNames)
}()
