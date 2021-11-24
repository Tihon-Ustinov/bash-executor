class TaskView {
    constructor(id, status) {
        this.id = id
        this.status = status
        this.result = undefined
        this.jobs = []
    }

    addJob(job) {
        this.jobs.push(job)
    }

    setResultPath(result) {
        this.result = result
    }
}

module.exports = TaskView
