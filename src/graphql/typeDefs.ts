import { gql } from 'apollo-server-express';

export const typeDefs = gql`
    ### USER ###
    type User {
        id: ID!
        username: String!
        password: String!
        email: EmailAddress!
        isArtist: Boolean!
        artist: ID # id of Artist
        profilePictureUrl: URL
        privacy: Privacy!
        followers: [ID!]! # ids of Users
        following: [ID!]! # ids of Users
        posts: [ID!]! # ids of Posts
        createdAt: DateTime!
        updatedAt: DateTime!
    }

    type Privacy {
        # If true, your following and followers lists are public.
        follow: Boolean!
    }

    ### ARTIST ###
    type Artist {
        id: ID!
        name: String!
        user: ID # id of User
        biography: String
        images: [URL!]!
        albums: [ID!]! # ids of Albums
        songs: [ID!]! # ids of Songs
        posts: [ID!]! # ids of Posts
        likes: Int!
        likers: [ID!]!
    }

    ### ALBUM ###
    type Album {
        id: ID!
        title: String!
        description: String
        cover: URL!
        artists: [ID!]! # ids of Artists
        tracks: [ID!]! # ids of Songs
        releaseDate: DateTime!
        posts: [ID!]! # ids of Posts
        likes: Int!
        likers: [ID!]! # ids of Users
    }

    ### SONG ###
    type Song {
        id: ID!
        title: String!
        description: String
        artists: [ID!]! # ids of Artists
        features: [ID!]! # ids of Artists
        album: ID! # id of Album
        posts: [ID!]! # ids of posts
        likes: Int!
        likers: [ID!]! # ids of Users
    }

    ### POST ###
    type Post {
        id: ID!
        poster: ID! # id of User
        title: String!
        likes: Int!
        dislikes: Int!
        likers: [ID!]! # ids of Users
        dislikers: [ID!]! #ids of Users
        postType: PostType!
        contentType: ContentType!
        content: String! # Either plaintext of Markdown OR media url
        createdAt: DateTime!
        updatedAt: DateTime!
    }

    enum PostType {
        ARTIST
        ALBUM
        SONG
    }

    enum ContentType {
        TEXT
        MEDIA
    }

    ### QUERY ###
    type Query {
        # Public
        sayHello: String!
        getUserFollowers(userId: ID!): [Follower!]!
        getUserFollowing(userId: ID!): [Follower!]!
        getUserPosts(userId: ID!): [Post!]!

        # Private (requires token)
        getCurrentUserFollowers: [Follower!]!
        getCurrentUserFollowing: [Follower!]!
        getCurrentUserPosts: [Post!]!
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
        createPost(
            title: String!
            postType: PostType!
            contentType: ContentType!
            content: String!
        ): CreatePostMutationResponse
        deletePost(postId: ID!): DeletePostMutationResponse
    }

    interface MutationResponse {
        code: String!
        success: Boolean!
        message: String!
    }

    type AuthPayload {
        user: User!
        token: String!
    }

    type FollowMutationPayload {
        # "String!" being the user IDs.
        currentUserFollowing: [ID!]!
        targetUserFollowers: [ID!]!
    }

    type CreatePostMutationResponse implements MutationResponse {
        code: String!
        success: Boolean!
        message: String!
        post: Post
    }

    type DeletePostMutationResponse implements MutationResponse {
        code: String!
        success: Boolean!
        message: String!
        deletedPostId: ID!
    }
`;
