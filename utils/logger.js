class Logger {
    constructor() {
        this.logs = ""
    }

    log(stdout) {
        this.logs = this.logs + (this.logs.length > 0 ? "\n" : "") + stdout
    }

    getLogs() {
        return this.logs
    }
}

module.exports = Logger
