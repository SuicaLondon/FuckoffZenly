const fs = require('fs')
const path = require('path')
const { async } = require('regenerator-runtime')
const jsdom = require('jsdom')
const {JSDOM} = jsdom

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
    await enterFolder(locationsPath, './', '2019', async (path, file)=>{
        await enterFolder(path, file, '12', async (path, file) => {
            await enterFolders(path, file, async (path, file) => {
                console.log(path, file)
                tasks.push({path, file})
            })
        })
    })
    for(let i=0; i < tasks.length; i++) {
        let task = tasks[i]
        let locations = await loadLocationHTMLFile(task.path, task.file)
        // console.log(locations)
        let gpx = convertToGPX(locations)
        let name = task.file.slice(0, -5)
        await writeGPX(name, gpx)
        console.log('finish: ', name)
    }

    // console.time()
    // Promise.all(tasks.map(task=>loadLocationHTMLFile(task.path, task.file)))
    //     .then(()=>{
    //         console.log(locations.length)
    //         console.timeEnd()
    //     })
}
async function enterFolder(fatherPath, folder, targetName, callback) {
    let currentPath = path.join(fatherPath, folder)
    let files = await readdirPromise(currentPath)
    files = files.filter(file => !Number.isNaN(parseInt(file, 10)))
    let file = files.find(file => file === targetName)
    return Promise.all([callback(currentPath, file)])
}

async function enterFolders(fatherPath, folder, callback) {
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
            let locations = []
            nodeList.forEach(tr=>{
                const locationData = {
                    date: date,
                    time: tr.children[0].textContent,
                    latitude: getRoughData(tr.children[1].textContent),
                    longitude: getRoughData(tr.children[2].textContent),
                    altitude: tr.children[3].textContent,
                    bearing: tr.children[4].textContent,
                    speed: tr.children[5].textContent,
                }
                locations.push(locationData)
            })
            resolve(locations)
        })
    })
}

function getRoughData(data) {
    return data.split(' ± ')[0]
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
