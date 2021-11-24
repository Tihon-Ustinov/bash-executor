const express = require('express')
const router = express.Router()
const TaskViewBuilder = require('../builders/TaskViewBuilder')

router.get('/', function(req, res, next) {
  const taskDispatcher = global.taskDispatcher
  const tasks = taskDispatcher.getTasks()
  const taskViewBuilder = new TaskViewBuilder()
  const result = []
  for (let task of tasks) {
    result.push(taskViewBuilder.build(task))
  }
  res.render('index', {
    title: 'Apple executor',
    tasks: result
  })
})

module.exports = router
