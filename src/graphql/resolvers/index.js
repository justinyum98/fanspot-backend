const _ = require('lodash');
const { Query } = require('./Query');
const { Mutation } = require('./Mutation');

const resolvers = _.merge(Query, Mutation);

module.exports = { resolvers };
