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
    let tasks = []
    console.log('=========')
    await enterFolder(locationsPath, './', async (path, file)=>{
        await enterFolder(path, file, async (path, file) => {
            await enterFolder(path, file, async (path, file) => {
                tasks.push({path, file})
            })
        })
    })
    let task = tasks[5]
    Promise.all([loadLocationHTMLFile(task.path, task.file)])
        .then(()=>{
            console.log(locations)
            let gpx = convertToGPX(locations)
            let name = task.file.slice(0, -5)
            writeGPX(name, gpx)
        })

    // console.time()
    // Promise.all(tasks.map(task=>loadLocationHTMLFile(task.path, task.file)))
    //     .then(()=>{
    //         console.log(locations.length)
    //         console.timeEnd()
    //     })
}

async function enterFolder(fatherPath, folder, callback) {
    let currentPath = path.join(fatherPath, folder)
    let files = await readdirPromise(currentPath)
    files = files.filter(file => !Number.isNaN(parseInt(file, 10)))
    return Promise.all(files.map(async file=>{
        return callback(currentPath, file)  
    }))
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
                locations.push(locationData)
                resolve(locationData)
            })
        })
    })
}

function convertToGPX(locations) {
    return `
    <?xml version="1.0" encoding="UTF-8"?>
    <gpx version="1.0">
        <name>${locations[0].date}</name>
        <trk><name>Zenly gpx</name><number>1</number><trkseg>
        ${locations.map(location=>{
            return `<trkpt lat="${location.latitude}" lon="${location.longitude}"><ele>${location.altitude}</ele><time>${location.date}T${location.time}Z</time></trkpt>`
        })}
        </trkseg></trk>
    </gpx>
    `
}

async function writeGPX(name, content) {
    const dir = `./gpx`
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(dir)){
            console.log('create')
            fs.mkdirSync(dir);
        }
        fs.writeFile(`${dir}/${name}.gpx`, content, err=>{
            if (err) reject(err)
            resolve()
        })
    })
}


!async function(){
    let folderNames = await getFolderNames()
    directToLocation(folderNames)
}()
