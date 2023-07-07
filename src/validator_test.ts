/** Reads reports from test/reports/*.html and parses them */
import "reflect-metadata"

import path from "path"
import fs from "fs"
import { parseReport } from "./parser.js"

async function main() {

const testPath = path.join(__dirname, "../test/reports")
const testFiles = fs
    .readdirSync(testPath)
    .filter((file) => file.endsWith(".html"))

for (const file of testFiles) {
    const filePath = path.join(testPath, file)
    const fileContents = fs.readFileSync(filePath, {encoding: 'utf8'})
    console.log('Parsing ', filePath)
    try {
        await parseReport(fileContents)
        console.log('No Errors')
    } catch(e) {
        console.log('Error:', e)
    }
}
}

main()

