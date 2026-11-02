const ApiError = require("../utils/ApiError")
const userRepository = require("../repositories/user.repository")
const { toLibraryUser } = require("../utils/serializers")

const list = async () => ({ items: (await userRepository.list()).map(toLibraryUser) })

const setActive = async ({ id, active, actor }) => {
  if (String(actor.id) === String(id) && !active) throw ApiError.conflict("You cannot disable your own account.")
  const user = await userRepository.setActive(id, active)
  if (!user) throw ApiError.notFound("Member not found.")
  return toLibraryUser(user)
}

module.exports = { list, setActive }
