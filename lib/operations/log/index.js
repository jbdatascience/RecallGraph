'use strict'

const { db, aql } = require('@arangodb')
const {
  getSortingClause,
  getGroupingClause,
  getReturnClause
} = require('./helpers')
const {
  getLimitClause,
  getEventLogQueryInitializer
} = require('../helpers')

module.exports = function log (
  path = '/',
  { since, until, sort = 'desc', skip, limit, groupBy, countsOnly, groupSort = 'desc', groupSkip, groupLimit, returnCommands } = {}
) {
  const queryParts = getEventLogQueryInitializer(path, since, until)

  queryParts.push(getGroupingClause(groupBy, countsOnly, returnCommands))
  queryParts.push(getSortingClause(sort, groupBy, countsOnly))
  queryParts.push(getLimitClause(limit, skip))
  queryParts.push(getReturnClause(groupBy, countsOnly, groupSort, groupSkip, groupLimit, returnCommands))

  const query = aql.join(queryParts, '\n')

  return db._query(query).toArray()
}
