import { gql } from 'apollo-server-express';

export const typeDefs = gql`
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
        followers: [User!]!
        following: [User!]!
        # thirdParty: ThirdParty!
    }

    type AuthPayload {
        user: User!
        token: String!
    }

    type FollowPayload {
        # "String!" being the user IDs.
        currentUserFollowing: [String!]!
        targetUserFollowers: [String!]!
    }

    type Query {
        sayHello: String!
    }

    type Mutation {
        login(username: String!, password: String!): AuthPayload
        register(username: String!, password: String!, email: EmailAddress!): AuthPayload
        follow(targetUserId: String!): FollowPayload
        unfollow(targetUserId: String!): FollowPayload
    }
`;
