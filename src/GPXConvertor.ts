
import fs = require('fs')
import path = require('path')
import jsdom = require('jsdom')
import { PathLike } from 'fs'
import { Location, Task } from './Zenly.type'
const { JSDOM } = jsdom

export default class GPXConvertor {
    longPerMeter = 0.00001141
    latPerMeter = 0.00000899
    async convertHTML(dir: PathLike, tasks: Task[]) {
        for (let i = 0; i < tasks.length; i++) {
            let task = tasks[i]
            let locations = await this.loadLocationHTMLFile(task.path, task.file)
            let name = task.file.slice(0, -5)
            console.log('length: ', locations.length)
            console.log('flat: ', locations.flat().length)
            let gpx = this.convertToGPX(name, locations)
            await this.writeGPX(dir, name, gpx)
            console.log('finish: ', name)
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
                let locationMatrix: Location[][] = []
                let previous = null
                let bufferList: Location[] = []
                console.log('node lenght: ', nodeList.length)
                for (let i = 0; i < nodeList.length; i++) {
                    const tr = nodeList[i]
                    const locationData: Location = {
                        date: new Date(date + " " + tr.children[0].textContent),
                        dateTime: date,
                        time: tr.children[0].textContent,
                        latitude: this.getLatitudeRoughData(tr.children[1].textContent),
                        longitude: this.getLongitudeRoughData(tr.children[2].textContent),
                        altitude: parseFloat(tr.children[3].textContent),
                        bearing: tr.children[4].textContent,
                        speed: tr.children[5].textContent,
                    }
                    if (locationMatrix.length === 0) {
                        locationMatrix.push([locationData])
                        previous = locationData
                        continue
                    }
                    if (previous) {
                        if (previous.latitude === locationData.latitude && previous.longitude === locationData.longitude) {
                            continue
                        }

                        if (previous.date === locationData.date) { // anti-aliasing, it has multiple data in 1 second
                            if (bufferList.length === 0) {
                                bufferList = [previous, locationData]
                            } else {
                                bufferList.push(locationData)
                            }
                            continue
                        } else {
                            if (bufferList.length > 0) {
                                let sumLat: number, sumLong: number
                                for (let i = 0; i < bufferList.length; i++) {
                                    sumLat = bufferList[i].latitude
                                    sumLong = bufferList[i].longitude
                                }
                                locationData.latitude = sumLat / bufferList.length
                                locationData.longitude = sumLong / bufferList.length
                                bufferList = []
                                locationMatrix[locationMatrix.length - 1].push(locationData)
                                previous = locationData
                                continue
                            }
                        }

                        if (this.timeDifferent(locationData.date, previous.date, 15 * 60000)) {
                            // console.log('different', previous.latitude, locationData.latitude, ' | ', previous.longitude, locationData.longitude)
                            locationMatrix.push([locationData])
                            previous = locationData
                            continue
                        }

                    }
                    locationMatrix[locationMatrix.length - 1].push(locationData)
                    previous = locationData
                }
                resolve(locationMatrix)
            })
        })
    }

    getLatitudeRoughData(data: string): number {
        const dataList = data.split(' ± ')
        const precision = parseFloat(dataList[1]) * this.latPerMeter
        return parseFloat(dataList[0]) + precision
    }
    getLongitudeRoughData(data: string): number {
        const dataList = data.split(' ± ')
        const precision = parseFloat(dataList[1]) * this.longPerMeter
        return parseFloat(dataList[0]) + precision
    }

    convertToGPX(name: string, locationMatrix: Location[][]): string {
        return `
        <?xml version="1.0" encoding="UTF-8"?>
        <gpx version="1.0">
            <name>${name}</name>
            ${locationMatrix.map(locations => {
            if (locations.length > 1) {
                return `
                    <trk>
                        <name>Zenly gpx</name>
                        <number>1</number>
                        <trkseg>
                            ${locations.map(location => {
                    return `
                                    <trkpt lat="${location.latitude}" lon="${location.longitude}">
                                        <ele>${location.altitude}</ele>
                                        <time>${location.date}T${location.time}Z</time>
                                    </trkpt>
                                `
                })}
                        </trkseg>
                    </trk>
                    `
            } else {
                return `
                    <wpt>
                        <name>Zenly gpx</name>
                        <number>1</number>
                        <wptseg>
                            ${locations.map(location => {
                    return `
                                    <wptpt lat="${location.latitude}" lon="${location.longitude}">
                                        <ele>${location.altitude}</ele>
                                        <time>${location.date}T${location.time}Z</time>
                                    </wptpt>
                                `
                })}
                        </wptseg>
                    </wpt>
                `
            }
        })
            }
        </gpx>
        `
    }

    timeDifferent(date1: Date, date2: Date, lag: number): boolean {
        return Math.abs(date1.getTime() - date2.getTime()) > lag
    }

    async writeGPX(dir: PathLike, fileName: string, content: string) {
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