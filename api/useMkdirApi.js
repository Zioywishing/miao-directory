import fs from 'fs'
import path from 'path'
import express from 'express'
import { api, staticPath } from '../config.js'

export default function useMkdirApi(app) {
    app.post(api.mkdir, express.json(), (req, res) => {
        const folderName = req.body.folderName
        const decodedPath = decodeURIComponent(req.path).substring(
            api.mkdir.length - 1
        )
        const mkdirPath = path.join(staticPath, decodedPath, folderName)
        // res.status(200).json({ mkdirPath, folderName })

        // 创建文件夹
        fs.mkdir(mkdirPath, { recursive: true }, (err) => {
            if (err) {
                return res.status(500).json({ message: 'failed', error: err })
            }
            res.status(200).json({ message: 'success' })
        })
    })
}
