const fs = require('fs')
const path = require('path')
const { async } = require('regenerator-runtime')
const jsdom = require('jsdom')
const {JSDOM} = jsdom

const locations = []

function readdirPromise(dir) {
    return new Promise((resolve, reject) => {
        fs.readdir(dir, (err, files) => {
            if(err) reject(err)
            resolve(files)
        })
    })
}

async function getFolderNames() {
    let files = await readdirPromise('./')
    return files.filter(file => file.includes('Zenly Data'))
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
    let yearsFiles = await readdirPromise(locationsPath)
    yearsFiles = yearsFiles.filter(file => !Number.isNaN(parseInt(file, 10)))
    yearsFiles.forEach(async yearFile=>{
        let yearPath = path.join(locationsPath, yearFile)
        let monthFiles = await readdirPromise(yearPath)
        monthFiles = monthFiles.filter(file => !Number.isNaN(parseInt(file, 10)))
        monthFiles.forEach(async monthFile=>{
            let monthPath = path.join(yearPath, monthFile)
            let dayFiles = await readdirPromise(monthPath)
            dayFiles = dayFiles.filter(file => !Number.isNaN(parseInt(file, 10)))
            dayFiles.forEach(async dayFile=>{
                let locationData = await loadLocationHTMLFile(monthPath, dayFile)
                locations.push(locationData)
                console.log(locations.length)
            })
        })
    })
}

function loadLocationHTMLFile(monthPath, file) {
    let filePath = path.join(monthPath, file)
    let date = file.slice(0, -5)
    return new Promise((resolve, reject)=>{
        fs.readFile(filePath, 'utf-8', (err, data)=> {
            if (err) reject(err)
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
                resolve(locationData)
            })
        })
    })
}

!async function(){
    let folderNames = await getFolderNames()
    directToLocation(folderNames)
}()
