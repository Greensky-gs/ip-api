import App from 'express';
import { config } from 'dotenv';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { v4 as uuid } from 'uuid';
import requestIp from 'request-ip'
config()

const logDir = (x?: string) => `./dist/logs${x ? `/${x}` : ''}`
if (!existsSync(logDir())) mkdirSync(logDir())

const app = App()

app.use(requestIp.mw())
app.get('/img.png', (req, res) => {
    const uid = uuid()
    const id = Date.now().toString().slice(Math.floor(Date.now().toString().length / 2)) + '.' + uid.slice(Math.floor(uid.length / 2))
    writeFileSync(logDir(`${id}.json`), JSON.stringify({
        params: req.params,
        body: req.body,
        headers: req.headers,
        ip: req.ip,
        ips: req.ips,
        httpVersion: req.httpVersion,
        query: req.query,
        clientIp: req.clientIp
    }, null, 1))

    res.sendFile('./img.png', {
        root: process.cwd() + '/assets'
    })
})

app.listen(process.env.port)

console.log(`API started on port ${process.env.port}`)