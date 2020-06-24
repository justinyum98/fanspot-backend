import { gql } from 'apollo-server-express';

export const typeDefs = gql`
    type User {
        id: String!
        username: String!
        password: String!
        email: EmailAddress!
        isArtist: Boolean!
        profilePictureUrl: URL
        privacy: Privacy!
        followers: [String!]! # String! being the id
        following: [String!]! # String! being the id
        # tokens: ThirdParty!
        # posts: [Post!]!
        # comments: [Comment!]!
        # activities: [Activity!]!
    }

    type Privacy {
        # If true, your following and followers lists are public.
        follow: Boolean!
    }

    type AuthPayload {
        user: User!
        token: String!
    }

    type FollowMutationPayload {
        # "String!" being the user IDs.
        currentUserFollowing: [String!]!
        targetUserFollowers: [String!]!
    }

    type Follower {
        id: String!
        username: String!
        profilePictureUrl: URL
    }

    type Query {
        # Public
        sayHello: String!
        getUserFollowers(userId: String!): [Follower!]!
        getUserFollowing(userId: String!): [Follower!]!

        # Private (requires token)
        getCurrentUserFollowers: [Follower!]!
        getCurrentUserFollowing: [Follower!]!
    }

    type Mutation {
        # Public
        login(username: String!, password: String!): AuthPayload
        register(username: String!, password: String!, email: EmailAddress!): AuthPayload

        # Private (requires token)
        follow(targetUserId: String!): FollowMutationPayload
        unfollow(targetUserId: String!): FollowMutationPayload
    }
`;
