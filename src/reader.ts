import { PathLike, readdir } from "fs";
import path = require("path");
import { Task } from "./Zenly.type";

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
        let files = await this.readDir(path) as any[]
        return files.filter(file => file.includes(fileName))
    }


    async directToLocation(rootPath: string, names: string[]): Promise<Task[]> {
        let tasks = await Promise.all(names.map(async name => {
            let locationsPath = path.join(rootPath, name, 'locations')
            return await this.enterAllLocationFile(locationsPath)
        }))
        return tasks.flat()
    }

    async enterAllLocationFile(path: string): Promise<Task[]> {
        let tasks: Task[] = []
        await this.enterFolders(path, './', async (path, file) => {
            console.log(path, file)
            await this.enterFolders(path, file, async (path, file) => {
                console.log(path, file)
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
        console.log('fatherPath', fatherPath, folder)
        let currentPath = path.join(fatherPath, folder)
        console.log(currentPath)
        let files = await this.readDir(currentPath)
        files = files.filter(file => !Number.isNaN(parseInt(file, 10)))
        return Promise.all(files.map(async file => {
            return callback(currentPath, file)
        }))
    }
}