'use strict'

const joi = require('joi')
const { diff } = require('../../handlers/diffHandlers')
const { makeRe } = require('minimatch')
const {
  getDBScope,
  getGraphScope,
  getCollectionScope,
  getNodeGlobScope,
  getNodeBraceScope
} = require('../../operations/helpers')

const dbSchema = joi.string().regex(makeRe(getDBScope().pathPattern))
const graphSchema = joi.string().regex(makeRe(getGraphScope().pathPattern))
const collSchema = joi.string().regex(makeRe(getCollectionScope().pathPattern))
const nodeGlobSchema = joi
  .string()
  .regex(makeRe(getNodeGlobScope().pathPattern))
const nodeBraceSchema = joi
  .string()
  .regex(makeRe(getNodeBraceScope().pathPattern))

const pathSchema = joi
  .alternatives()
  .try(dbSchema, graphSchema, collSchema, nodeGlobSchema, nodeBraceSchema)
  .required()

module.exports = router => {
  const pathDesc =
    'The path pattern to pick nodes whose diffs should be returned.'
  const reqBodySchema = joi.object().keys({ path: pathSchema })

  buildEndpoint(router.get('/diff', processDiffRequest, 'diffGet'))
    .queryParam('path', pathSchema, pathDesc)
    .summary('Get diffs (path param in query).')

  buildEndpoint(router.post('/diff', processDiffRequest, 'diffPost'))
    .body(reqBodySchema, `${pathDesc}  (e.g. \`{"path": "/c/*raw_data*"}\`)`)
    .summary('Get diffs (path param in body).')

  console.log('Loaded "diff" routes')
}

function processDiffRequest (req, res) {
  res.status(200).json(diff(req))
}

function buildEndpoint (endpoint) {
  return endpoint
    .queryParam(
      'since',
      joi
        .number()
        .precision(5)
        .optional(),
      'The unix timestamp (sec) for the earliest matching event from which to start fetching diffs. Precision: 10μs.' +
      ' Example: since=1547560124.43204'
    )
    .queryParam(
      'until',
      joi
        .number()
        .precision(5)
        .optional(),
      'The unix timestamp (sec) for the latest matching event until which to keep fetching diffs. Precision: 10μs.' +
      ' Example: until=1547572124.23412'
    )
    .queryParam(
      'skip',
      joi
        .number()
        .integer()
        .min(0)
        .optional(),
      'The number records to skip/omit from the result set, starting from the first. Falsey or missing implies none.'
    )
    .queryParam(
      'limit',
      joi
        .number()
        .integer()
        .min(0)
        .optional(),
      'The number records to keep in the result set, starting from "skip"/0. Falsey or missing implies all.'
    )
    .queryParam(
      'reverse',
      joi
        .boolean()
        .optional(),
      'Whether to invert the individual diffs, so that they can be applied in reverse order. This also reverses the' +
      ' order of diffs within a node.'
    )
    .response(200, ['application/json'], 'The diff was successfully generated.')
    .error(500, 'The operation failed.')
    .description(
      'Returns diffs for nodes matching the given path pattern.'
    )
    .tag('Event')
}