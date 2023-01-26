import Reader from "./src/reader"
import { Task } from "./src/zenly.type";

!async function(){
    let reader = new Reader();
    let folderNames = await reader.getFolderNames('./', 'Zenly Data')
    let tasks: Task[] = await reader.directToLocation(folderNames)
    console.log(tasks)

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
}()
