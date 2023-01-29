import appRootPath from "app-root-path"
import path from "path"
import GPXConvertor from "./src/gpxConvertor"
import Reader from "./src/Reader"
import { Task } from "./src/Zenly.type"

!async function(){
    const reader = new Reader()
    const convertor = new GPXConvertor()
    let rootPath = appRootPath.path
    let folderNames = await reader.getFolderNames(rootPath, 'Zenly Data')
    let tasks: Task[] = await reader.directToLocation(rootPath, folderNames)
    console.log(tasks)
    convertor.convertHTML(path.join(rootPath, 'Test'), tasks)
}()
