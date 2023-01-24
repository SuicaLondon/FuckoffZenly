import Reader from "./src/reader"

const fs = require('fs')
const path = require('path')
const { async } = require('regenerator-runtime')
const jsdom = require('jsdom')
const {JSDOM} = jsdom

function loadLocationHTMLFile(monthPath, file) {
    let filePath = path.join(monthPath, file)
    let date = file.slice(0, -5)
    return new Promise((resolve, reject)=>{
        fs.readFile(filePath, 'utf-8', (err, data)=> {
            if (err) reject(err)
            const dom = new JSDOM(data)
            let nodeList = dom.window.document.querySelectorAll('tbody tr')
            let locations = []
            let previous = null
            console.log(nodeList.length)
            for(let i = 0; i < nodeList.length; i++) {
                const tr = nodeList[i]
                const locationData = {
                    date: new Date(date + " " + tr.children[0].textContent),
                    dateTime: date,
                    time: tr.children[0].textContent,
                    latitude: getRoughData(tr.children[1].textContent),
                    longitude: getRoughData(tr.children[2].textContent),
                    altitude: tr.children[3].textContent,
                    bearing: tr.children[4].textContent,
                    speed: tr.children[5].textContent,
                }
                if (locations.length === 0) {
                    locations.push([locationData])
                    continue
                }
                if (previous && previous.latitude === locationData.latitude && previous.longitude === locationData.longitude) {
                    continue
                }
                if (previous && timeDifferent(locationData.date, previous.date, 15 * 60000)) {
                    // console.log('different', previous.latitude, locationData.latitude, ' | ', previous.longitude, locationData.longitude)
                    locations.push([locationData])
                    previous = locationData
                } else {
                    let location = locations[locations.length - 1]
                    location.push(locationData)
                    locations[locations.length - 1] = location
                    previous = locationData
                }
            }
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
        <name>${locations[0].dateTime}</name>
        <trk><name>Zenly gpx</name><number>1</number><trkseg>
        ${locations.map(location=>{
            return `<trkpt lat="${location.latitude}" lon="${location.longitude}"><ele>${location.altitude}</ele><time>${location.date}T${location.time}Z</time></trkpt>`
        })}
        </trkseg></trk>
    </gpx>
    `
}

function timeDifferent(date1, date2, lag) {
    return Math.abs(date1.getTime() - date2.getTime()) > lag
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
    var reader = new Reader();
    let folderNames = await reader.getFolderNames('./', 'Zenly Data')
    reader.directToLocation(folderNames)
}()
