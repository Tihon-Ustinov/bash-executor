const JobView = require('../dataVeiws/JobView')
const TaskView = require('../dataVeiws/TaskView')

class TaskViewBuilder {
    build(task) {
        const jobs = task.getJobs()
        const resultTask =  new TaskView(task.id, task.status)
        for (let [key, value] of task.getProps()) {
            if (Object.hasOwnProperty(key)) {
                key = global.makeId(5)
            }
            resultTask[key] = value
        }
        for (let job of jobs) {
            resultTask.addJob(new JobView(job.label, job.status, job.getMessage()))
        }
        return resultTask
    }

}

module.exports = TaskViewBuilder
