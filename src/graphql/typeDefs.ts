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
        spotifyId: String
        biography: String
        profilePictureUrl: String
        genres: [String!]!
        albums: [ID!]! # ids of Albums
        posts: [ID!]! # ids of Posts
        likes: Int!
        likers: [ID!]! # ids of Users
    }

    ### ALBUM ###
    type Album {
        id: ID!
        title: String!
        spotifyId: String
        description: String
        coverArtUrl: URL
        albumType: AlbumType!
        artists: [ID!]! # ids of Artists
        tracks: [ID!]! # ids of Tracks
        releaseDate: DateTime!
        posts: [ID!]! # ids of Posts
        likes: Int!
        likers: [ID!]! # ids of Users
    }

    enum AlbumType {
        album
        single
    }

    ### TRACK ###
    type Track {
        id: ID!
        title: String!
        spotifyId: String
        description: String
        explicit: Boolean!
        discNumber: Int!
        trackNumber: Int!
        duration: Int! # duration in milliseconds (ms)
        artists: [ID!]! # ids of Artists
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
        artist: ID # id of Artist
        album: ID # id of Album
        track: ID # id of Track
        contentType: ContentType!
        content: String! # Either plaintext of Markdown OR media url
        createdAt: DateTime!
        updatedAt: DateTime!
    }

    enum PostType {
        ARTIST
        ALBUM
        TRACK
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
