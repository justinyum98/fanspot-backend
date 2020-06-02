const _ = require('lodash');
const { resolvers: gqlsResolvers } = require('graphql-scalars');
const { Query } = require('./query');
const { Mutation } = require('./mutation');

const resolvers = _.merge(gqlsResolvers, Query, Mutation);

module.exports = { resolvers };
