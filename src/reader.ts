import { PathLike, readdir } from "fs";
import path = require("path");
import { Task } from "./zenly.type";

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


    async directToLocation(names: string[]): Promise<Task[]> {
        let tasks = await Promise.all(names.map(async name => {
            let locationsPath = path.join(__dirname, name, 'locations')
            return await this.enterAllLocationFile(locationsPath)
        }))
        return tasks.flat()
    }

    async enterAllLocationFile(locationsPath: string): Promise<Task[]> {
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
        return tasks
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