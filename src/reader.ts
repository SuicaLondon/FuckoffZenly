import { PathLike, readdir } from "fs";
import path = require("path");

export default class Reader {
    readDir(dir: PathLike): Promise<string[]> {
        return new Promise((resolve, reject) => {
            readdir(dir, (err, files) => {
                if (err) reject(err)
                resolve(files)
            })
        })
    }

    async getFolderNames(path: string, fileName: string): Promise<string[]> {
        let files = await this.readDir('./') as any[]
        return files.filter(file => file.includes('Zenly Data'))
    }


    async directToLocation(names: string[]) {
        names.forEach(async name => {
            let locationsPath = path.join(__dirname, name, 'locations')
            await this.enterAllLocationFile(locationsPath)
        })
    }

    async enterAllLocationFile(locationsPath: string) {
        let tasks: Task[] = []
        console.log('=========')
        await this.enterFolders(locationsPath, './', async (path, file) => {
            await this.enterFolders(path, file, async (path, file) => {
                await this.enterFolders(path, file, async (path, file) => {
                    console.log(path, file)
                    tasks.push({ path, file })
                })
            })
        })
        // for (let i = 0; i < tasks.length; i++) {
        //     let task = tasks[i]
        //     let locations = await loadLocationHTMLFile(task.path, task.file)
        //     console.log(locations.length)
        //     console.log(locations.flat().length)
        //     for (let i = 0; i < locations.length; i++) {
        //         let gpx = convertToGPX(locations[i])
        //         let name = task.file.slice(0, -5)
        //         if (i > 0) {
        //             name = name + `(${i})`
        //         }
        //         await writeGPX(name, gpx)
        //         console.log('finish: ', name)
        //     }
        // }

        // console.time()
        // Promise.all(tasks.map(task=>loadLocationHTMLFile(task.path, task.file)))
        //     .then(()=>{
        //         console.log(locations.length)
        //         console.timeEnd()
        //     })
    }
    async enterFolder(fatherPath: string, folder: string, targetName: string, callback: (currentPath: string, file: string) => Promise<any>) {
        let currentPath = path.join(fatherPath, folder)
        let files = await this.readDir(currentPath)
        files = files.filter(file => !Number.isNaN(parseInt(file, 10)))
        let file = files.find(file => file === targetName)
        return Promise.all([callback(currentPath, file)])
    }

    async enterFolders(fatherPath: string, folder: string, callback: (currentPath: string, file: string) => Promise<any>) {
        let currentPath = path.join(fatherPath, folder)
        let files = await this.readDir(currentPath)
        files = files.filter(file => !Number.isNaN(parseInt(file, 10)))
        return Promise.all(files.map(async file => {
            return callback(currentPath, file)
        }))
    }
}