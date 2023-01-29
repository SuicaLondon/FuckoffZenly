
import fs = require('fs')
import path = require('path')
import jsdom = require('jsdom')
import { PathLike } from 'fs'
import { Location, Task } from './Zenly.type'
const { JSDOM } = jsdom

export default class GPXConvertor {

    async convertHTML(dir: PathLike, tasks: Task[]) {
        for (let i = 0; i < tasks.length; i++) {
            let task = tasks[i]
            let locations = await this.loadLocationHTMLFile(task.path, task.file)
            console.log(locations.length)
            console.log(locations.flat().length)
            let gpxs: string[] = []
            for (let i = 0; i < locations.length; i++) {
                let gpx = this.convertToGPX(locations[i])
                let name = task.file.slice(0, -5)
                if (i > 0) {
                    name = name + `(${i})`
                }
                await this.writeGPX(dir, name, gpx)
                console.log('finish: ', name)
            }
            
        }

        // console.time()
        // Promise.all(tasks.map(task=>this.loadLocationHTMLFile(task.path, task.file)))
        //     .then(()=>{
        //         console.log(locations.length)
        //         console.timeEnd()
        //     })
    }

    loadLocationHTMLFile(monthPath: string, fileName: string): Promise<Location[][]> {
        let filePath = path.join(monthPath, fileName)
        let date = fileName.slice(0, -5) // Remove .html
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf-8', (err, data) => {
                if (err) reject(err)
                const dom = new JSDOM(data)
                let nodeList = dom.window.document.querySelectorAll('tbody tr')
                let locations: Location[][] = []
                let previous = null
                console.log(nodeList.length)
                for (let i = 0; i < nodeList.length; i++) {
                    const tr = nodeList[i]
                    const locationData: Location = {
                        date: new Date(date + " " + tr.children[0].textContent),
                        dateTime: date,
                        time: tr.children[0].textContent,
                        latitude: this.getRoughData(tr.children[1].textContent),
                        longitude: this.getRoughData(tr.children[2].textContent),
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
                    if (previous && this.timeDifferent(locationData.date, previous.date, 15 * 60000)) {
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

    getRoughData(data: string): string {
        return data.split(' ± ')[0]
    }

    convertToGPX(locations: Location[]): string {
        return `
        <?xml version="1.0" encoding="UTF-8"?>
        <gpx version="1.0">
            <name>${locations[0].dateTime}</name>
            <trk><name>Zenly gpx</name><number>1</number><trkseg>
            ${locations.map(location => {
            return `<trkpt lat="${location.latitude}" lon="${location.longitude}"><ele>${location.altitude}</ele><time>${location.date}T${location.time}Z</time></trkpt>`
        })}
            </trkseg></trk>
        </gpx>
        `
    }

    timeDifferent(date1: Date, date2: Date, lag: number): boolean {
        return Math.abs(date1.getTime() - date2.getTime()) > lag
    }

    async writeGPX(dir: PathLike, fileName: string, content: string ) {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(dir)) {
                console.log('create')
                fs.mkdirSync(dir);
            }
            fs.writeFile(`${dir}/${fileName}.gpx`, content, err => {
                if (err) reject(err)
                resolve(null)
            })
        })
    }
}