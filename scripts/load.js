const { existsSync, mkdirSync, readdirSync, copyFileSync } = require('node:fs')

const saveFolder = './saves'
const logFolder = './dist/logs'

const color = (t, c) => `\x1b[${c}m${t}\x1b[0m`

if (!existsSync(saveFolder)) {
    console.log(color(`No save`, '33'))
    return
}
if (!existsSync(logFolder)) mkdirSync(logFolder)

const fetched = readdirSync(saveFolder)

if (!fetched.length) return console.log(color(`No new logs`, '33'))
console.log(color(`Starting copy of ${fetched.length} new logs...`, 36))

fetched.forEach((log) => {
    copyFileSync(`${saveFolder}/${log}`, `${logFolder}/${log}`)
})

console.log(color(`Copied ${fetched.length} logs`, '32'))