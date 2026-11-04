const database = require("./database")
const repositories = require("../../repositories/mongodb")

module.exports = { name: "mongodb", database, repositories }
