import { gql } from 'apollo-server-express';

export const typeDefs = gql`
    ### USER ###
    type User {
        id: ID!
        username: String!
        password: String!
        email: EmailAddress!
        isArtist: Boolean!
        profilePictureUrl: URL
        privacy: Privacy!
        followers: [ID!]! # ids of Users
        following: [ID!]! # ids of Users
        # posts: [Post!]!
        # comments: [Comment!]!
        # activities: [Activity!]!
        createdAt: DateTime!
        updatedAt: DateTime!
    }

    type Privacy {
        # If true, your following and followers lists are public.
        follow: Boolean!
    }

    ### POST ###
    # type Post {
    #     id: ID!
    #     poster: ID! # id of User
    #     title: String!
    #     likes: Int!
    #     dislikes: Int!
    #     likers: [ID!]! # ids of Users
    #     dislikers: [ID!]! #ids of Users
    #     postType: PostType!
    #     text: String
    #     mediaUrl: URL
    # }

    # enum PostType {
    #     TEXT
    #     MEDIA
    # }

    ### QUERY ###
    type Query {
        # Public
        sayHello: String!
        getUserFollowers(userId: ID!): [Follower!]!
        getUserFollowing(userId: ID!): [Follower!]!

        # Private (requires token)
        getCurrentUserFollowers: [Follower!]!
        getCurrentUserFollowing: [Follower!]!
    }

    type Follower {
        id: ID!
        username: String!
        profilePictureUrl: URL
    }

    ### MUTATION ###
    type Mutation {
        # Public
        login(username: String!, password: String!): AuthPayload
        register(username: String!, password: String!, email: EmailAddress!): AuthPayload

        # Private (requires token)
        follow(targetUserId: ID!): FollowMutationPayload
        unfollow(targetUserId: ID!): FollowMutationPayload
    }

    # interface MutationResponse {
    #     code: String!
    #     success: Boolean!
    #     message: String!
    # }

    type AuthPayload {
        user: User!
        token: String!
    }

    type FollowMutationPayload {
        # "String!" being the user IDs.
        currentUserFollowing: [ID!]!
        targetUserFollowers: [ID!]!
    }
`;
