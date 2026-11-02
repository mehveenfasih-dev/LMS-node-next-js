const userService = require("../../services/user.service")

const list = async (req, res) => res.json(await userService.list())
const setActive = async (req, res) =>
  res.json(await userService.setActive({ id: req.validated.params.id, active: req.body.active, actor: req.user }))

module.exports = { list, setActive }
