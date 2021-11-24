const express = require('express')
const path = require("path");
const  router = express.Router()

router.get('/:project/:id/*', function(req, res, next) {
  const taskDispatcher  = global.taskDispatcher
  const { id } = req.params
  let task = taskDispatcher.getTask(id)
  if (!task) {
    return res.status(404).render("error", {
      message: "File not found",
      error: new Error("File not found")
    })
  }
  res.sendFile(path.join(global.baseDir, "git", ...req.url.split("/")))
})

module.exports = router
