import _ from 'lodash';
import { Query } from './Query';
import { Mutation } from './Mutation';

export const resolvers = _.merge(Query, Mutation);
