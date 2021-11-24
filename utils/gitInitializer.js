const fs = require('fs')
const path = require('path')
const {spawn} = require('child_process')

class GitStream {
    constructor(id, path) {
        this.id = id
        this._path = path
        this._open = false
    }

    open() {
        if (this._open) {
            throw Error("Stream is already open")
        }
        this._open = true
        return this._path
    }

    close() {
        if (!this._open) {
            throw Error("Stream is already close")
        }
        this._open = false
    }

    isFree() {
        return this._open === false
    }

}

class GitInitializer {
    constructor() {
        this.repositories = new Map()
        if (!fs.existsSync(path.join(__dirname, "..", 'git'))) {
            fs.mkdirSync(path.join(__dirname, "..", 'git'))
        }
    }

    findStream(repository, id) {
        return this.repositories.get(repository)?.find(it => it.id === id)
    }

    getRepositoryName(repository) {
        return repository.split("/").pop().split(".").shift()
    }

    deleteStream(stream) {
        if (!stream.isFree()) {
            throw Error("Stream doesn't closed")
        }
        for (let value of this.repositories.values()) {
            let index = value.indexOf(stream)
            if (index > -1) {
                value.splice(index, 1)
            }
        }
    }

    async getStream(repository, id, logger) {
        const existStream = this.findStream(repository, id)
        if (existStream) {
            return Promise.resolve(existStream)
        } else {
            const freeStream = this.repositories.get(repository)?.find(it => it.isFree())
            if (freeStream) {
                this.deleteStream(freeStream)
                const projectPath = path.join(global.baseDir, "git", this.getRepositoryName(repository))
                await this.execCommand(projectPath, `mv ${freeStream.id} ${id}`, logger)
                const newStream = new GitStream(id, path.join(projectPath, id))
                return Promise.resolve(newStream)
            } else {
                return this.createStream(repository, id, logger)
            }
        }
    }

    async createStream(repository, id, logger) {
        const projectName = this.getRepositoryName(repository)
        const pathToProject = path.join(global.baseDir, 'git', projectName)

        if (!fs.existsSync(pathToProject)) {
            fs.mkdirSync(pathToProject)
        }

        let pathToStream = path.join(pathToProject, id)

        fs.mkdirSync(pathToStream)
        await this._exec(path.join(global.baseDir), `git clone ${repository} ${pathToStream}`, logger)
        const stream = new GitStream(id, pathToStream)
        let repositories = this.repositories.get(repository)
        if (!repositories) {
            repositories = []
            this.repositories.set(repository, repositories)
        }
        repositories.push(stream)
        return stream
    }

    async execCommand(path, command, logger) {
        await this._exec(path, command, logger)
    }

    async checkout(path, branch, logger) {
        await this._exec(path, "git fetch origin", logger)
        await this._exec(path, `git reset --hard origin/${branch}`, logger)
    }

    async _exec(path, command, logger) {
        return await new Promise((resolve, reject) => {
            const child = spawn(`cd ${path} && ${command}`, {
                shell: true
            })
            child.on('error', function (err) {
                logger.log(err.stack)
                reject(err)
            });

            child.stdout.on('data', (data) => {
                logger.log(data.toString())
            });
            child.stderr.on('data', (data) => {
                logger.log(data.toString())
            });
            child.on('close', (code) => {
                if (code === 0) {
                    resolve()
                } else {
                    reject()
                }
            });
        })
    }
}

module.exports = GitInitializer
