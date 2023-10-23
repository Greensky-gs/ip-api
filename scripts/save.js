const { existsSync, mkdirSync, readdirSync, copyFileSync } = require('node:fs')

const saveFolder = './saves'
const logFolder = './dist/logs'

const color = (t, c) => `\x1b[${c}m${t}\x1b[0m`

if (!existsSync(logFolder)) {
    console.log(color(`No logs`, '33'))
    return
}
if (!existsSync(saveFolder)) mkdirSync(saveFolder)

const saveCache = readdirSync(saveFolder)
const fetched = readdirSync(logFolder).filter(x => !saveCache.includes(x))

if (!fetched.length) return console.log(color(`No new logs`, '33'))
console.log(color(`Starting copy of ${fetched.length} new logs...`, 36))

fetched.forEach((log) => {
    copyFileSync(`${logFolder}/${log}`, `${saveFolder}/${log}`)
})

console.log(color(`Copied ${fetched.length} logs`, '32'))