const database = require("./database")
const repositories = require("../../repositories/sqlserver")

module.exports = { name: "sqlserver", database, repositories }
