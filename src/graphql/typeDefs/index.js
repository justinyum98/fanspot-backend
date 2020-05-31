const { gql } = require('apollo-server-express');

const typeDefs = gql`
    type User {
        id: String!
        username: String!
        password: String!
        email: EmailAddress!
        isArtist: Boolean!
        # profilePictureURL: URL
        # posts: [Post!]!
        # comments: [Comment!]!
        # activities: [Activity!]!
        # followers: [User!]!
        # following: [User!]!
        # thirdParty: ThirdParty!
    }

    type AuthPayload {
        user: User!
        token: String!
    }

    type Query {
        sayHello: String!
    }

    type Mutation {
        login(username: String!, password: String!): AuthPayload
        register(username: String!, password: String!, email: EmailAddress!): AuthPayload
    }
`;

module.exports = typeDefs;
