const _ = require('lodash');
const { Query } = require('./query');
const { Mutation } = require('./mutation');

const resolvers = _.merge(Query, Mutation);

module.exports = { resolvers };
