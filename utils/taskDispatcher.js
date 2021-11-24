const Logger = require('./logger')

const TaskStatus = {
    failed: "failed",
    success: "success",
    pending: "pending",
    processing: "processing",
    canceled: "canceled"
}

class Job {
    constructor(label, task) {
        this.label = label
        this.task = task
        this.status = TaskStatus.pending
        this.stdout = ""
        this.logger = new Logger()
    }

    async run() {
        this.status = TaskStatus.processing
        try {
            await this.task(this.logger)
            this.status = TaskStatus.success
            return true
        } catch (err) {
            this.status = TaskStatus.failed
            return false
        }
    }

    getMessage() {
        return this.logger.getLogs()
    }
}

class Task {
    constructor(id) {
        this.id = id
        this.jobs = []
        this.status = TaskStatus.pending
        this.props = new Map()
    }

    setProp(key, value) {
        this.props.set(key, value)
    }

    getProp(key) {
        return this.props.get(key)
    }

    getProps() {
        return Array.from(this.props)
    }

    createJob(label, task) {
        this.jobs.push(new Job(label, task))
        return this
    }

    getJobs() {
        return this.jobs
    }

    async run() {
        this.status = TaskStatus.processing
        for (let job of this.jobs) {
            if (this.status === TaskStatus.canceled) {
                return
            }
            let isSuccess = await job.run()
            if (!isSuccess) {
                this.status = TaskStatus.failed
                return
            }
        }
        this.status = TaskStatus.success
    }

    cancel() {
        this.status = TaskStatus.canceled
    }

    isFailed() {
        return this.status === TaskStatus.failed
    }

    isSuccess() {
        return this.status === TaskStatus.success
    }

    isPending() {
        return this.status === TaskStatus.pending
    }

    isProcessing() {
        return this.status === TaskStatus.processing
    }

    isCanceled() {
        return this.status === TaskStatus.canceled
    }
}

class TaskDispatcher {
    constructor() {
        this.tasks = new Map()
    }

    createTask() {
        let id = global.makeId(12)
        let task = new Task(id)
        this.tasks.set(id, task)
        return task
    }

    getTask(id) {
        return this.tasks.get(id)
    }

    removeTask(id) {
        if (this.tasks.has(id)) {
            return this.tasks.delete(id)
        }
    }

    getTasks() {
        return Array.from(this.tasks.values())
    }
}

module.exports = TaskDispatcher
