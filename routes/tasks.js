const express = require('express')
const GitInitializer = require('../utils/gitInitializer')
const TaskViewBuilder = require('../builders/TaskViewBuilder')

const gitInitializer = new GitInitializer()

const PROP_REPO = "repository"
const router = express.Router()
const taskViewBuilder = new TaskViewBuilder()

router.get('/', function (req, res) {
    const taskDispatcher = global.taskDispatcher
    const tasks = taskDispatcher.getTasks()
    const result = []
    for (let task of tasks) {
        result.push(taskViewBuilder.build(task))
    }
    res.json(result)
})



router.get('/:id', function (req, res, next) {
    const { id } = req.params
    const taskDispatcher = global.taskDispatcher
    const task = taskDispatcher.getTask(id)
    if (!task) {
        return res.status(404).json({
            message: "Not found task with id: " + id
        })
    }

    const responseResult = taskViewBuilder.build(task)
    if (task.isSuccess()) {
        responseResult.setResultPath(`/results/${gitInitializer.getRepositoryName(task.getProp(PROP_REPO))}/${id}`)
        return res.status(200).json(responseResult)
    }

    if (task.isFailed()) {
        return res.status(400).json(responseResult)
    }

    if (task.isProcessing()) {
        return res.status(201).json(responseResult)
    }

    if (task.isCanceled()) {
        return res.status(200).json(responseResult)
    }

    if (task.isPending()) {
        return res.status(200).json(responseResult)
    }
})

router.post('/create', async function (req, res) {
    const { repository, branch, commands } = req.body
    const taskDispatcher = global.taskDispatcher
    let task = taskDispatcher.createTask()
    task.setProp(PROP_REPO, repository)
    let stream
    let path
    task
        .createJob(`init git project ${gitInitializer.getRepositoryName(repository)}`, function (logger) {
            return gitInitializer.getStream(repository, task.id, logger).then(newStream => {
                    stream = newStream
                })
        })
        .createJob(`checkout branch ${branch}`, function (logger) {
            if (stream) {
                path = stream.open()
                return gitInitializer.checkout(path, branch, logger)
            } else {

                return Promise.reject(new Error("Error create stream to git project"))
            }
        })
    for (let command of commands) {
        task.createJob(command, function (logger) {
            return new Promise(((resolve, reject) => {
                gitInitializer.execCommand(path, command, logger)
                    .then(() => resolve())
                    .catch(err => reject(err))
            }))
        })
    }
    task.run()
    res.json({"id": task.id})
})

router.put('/:id/cancel', async function (req, res) {
    const { id } = req.params
    const taskDispatcher = global.taskDispatcher
    const task = taskDispatcher.getTask(id)
    if (!task) {
        return res.status(404).json({
            message: "Not found task with id: " + id
        })
    }
    task.cancel()
    const stream = gitInitializer.findStream(task.getProp(PROP_REPO), id)
    if (!stream.isFree()) {
        stream.close()
    }
    return res.status(200).json({
        message: `Task id: ${id} canceled`
    })
})

router.delete('/:id', async function (req, res) {
    const { id } = req.params
    const taskDispatcher = global.taskDispatcher
    const task = taskDispatcher.getTask(id)
    if (!task) {
        return res.status(404).json({
            message: "Not found task with id: " + id
        })
    }
    taskDispatcher.removeTask(id)
    const stream = gitInitializer.findStream(task.getProp(PROP_REPO), id)
    if (!stream.isFree()) {
        stream.close()
    }
    return res.status(200).json({
        message: `Task id: ${id} remove`
    })
})

module.exports = router
