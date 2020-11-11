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
        comments: [ID!]! # ids of Comments
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
        comments: [ID!]!
        createdAt: DateTime!
        updatedAt: DateTime!
    }

    enum PostType {
        artist
        album
        track
    }

    enum ContentType {
        text
        media
    }

    ### COMMENT ###
    type Comment {
        id: ID!
        post: ID!
        poster: ID!
        content: String!
        likes: Int!
        dislikes: Int!
        likers: [ID!]!
        dislikers: [ID!]!
        parent: ID
        children: [ID!]!
        isDeleted: Boolean!
        createdAt: DateTime!
        updatedAt: DateTime!
    }

    ### QUERY ###
    type Query {
        # Public
        search(queryStr: String!): [SearchResult!]!
        getUserFollowers(userId: ID!): [Follower!]!
        getUserFollowing(userId: ID!): [Follower!]!
        getUserPosts(userId: ID!): [Post!]!

        # Private (requires token)
        ## User
        getCurrentUserFollowers: [Follower!]!
        getCurrentUserFollowing: [Follower!]!
        getCurrentUserPosts: [Post!]!

        ## Comment
        getPostComments(postId: ID!): [PostComment!]!
    }

    type SearchResult {
        id: ID!
        name: String!
        author: String
        pictureUrl: URL
        type: SearchResultType!
    }

    enum SearchResultType {
        user
        artist
        album
        track
        post
    }

    type Follower {
        id: ID!
        username: String!
        profilePictureUrl: URL
    }

    type PostComment {
        id: ID!
        poster: Follower!
        content: String!
        likes: Int!
        dislikes: Int!
        parent: ID
        children: [ID!]!
        isDeleted: Boolean!
        createdAt: DateTime!
        updatedAt: DateTime!
    }

    ### MUTATION ###
    type Mutation {
        # Public
        login(username: String!, password: String!): AuthPayload
        register(username: String!, password: String!, email: EmailAddress!): AuthPayload

        # Private (requires token)
        ## Follow
        follow(targetUserId: ID!): FollowMutationPayload
        unfollow(targetUserId: ID!): FollowMutationPayload
        followArtist(artistId: ID!): FollowArtistMutationResponse
        unfollowArtist(artistId: ID!): FollowArtistMutationResponse
        followAlbum(albumId: ID!): FollowAlbumMutationResponse
        unfollowAlbum(albumId: ID!): FollowAlbumMutationResponse
        followTrack(trackId: ID!): FollowTrackMutationResponse
        unfollowTrack(trackId: ID!): FollowTrackMutationResponse

        ## Post
        createPost(
            title: String!
            postType: PostType!
            entityId: ID!
            contentType: ContentType!
            content: String!
        ): CreatePostMutationResponse
        deletePost(postId: ID!): DeletePostMutationResponse
        likeOrDislikePost(postId: ID!, action: LikeAction!): LikeOrDislikePostMutationResponse
        undoLikeOrDislikePost(postId: ID!, action: LikeAction!): LikeOrDislikePostMutationResponse

        ## Comment
        addComment(postId: ID!, content: String!, parentId: ID): AddCommentMutationResponse
        deleteComment(commentId: ID!): DeleteCommentMutationResponse
        likeOrDislikeComment(commentId: ID!, action: LikeAction!): LikeOrDislikeCommentMutationResponse
        undoLikeOrDislikeComment(commentId: ID!, action: LikeAction!): LikeOrDislikeCommentMutationResponse

        ## Artist
        likeArtist(artistId: ID!): LikeArtistMutationResponse
        undoLikeArtist(artistId: ID!): LikeArtistMutationResponse

        ## Album
        likeAlbum(albumId: ID!): LikeAlbumMutationResponse
        undoLikeAlbum(albumId: ID!): LikeAlbumMutationResponse

        ## Track
        likeTrack(trackId: ID!): LikeTrackMutationResponse
        undoLikeTrack(trackId: ID!): LikeTrackMutationResponse
    }

    enum LikeAction {
        like
        dislike
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

    type FollowArtistMutationResponse implements MutationResponse {
        code: String!
        success: Boolean!
        message: String!
        artistId: ID
    }

    type FollowAlbumMutationResponse implements MutationResponse {
        code: String!
        success: Boolean!
        message: String!
        albumId: ID
    }

    type FollowTrackMutationResponse implements MutationResponse {
        code: String!
        success: Boolean!
        message: String!
        trackId: ID
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

    type AddCommentMutationResponse implements MutationResponse {
        code: String!
        success: Boolean!
        message: String!
        comment: Comment
    }

    type DeleteCommentMutationResponse implements MutationResponse {
        code: String!
        success: Boolean!
        message: String!
        deletedCommentId: ID
    }

    type LikeOrDislikePostMutationResponse implements MutationResponse {
        code: String!
        success: Boolean!
        message: String!
        postLikes: Int
        postDislikes: Int
    }

    type LikeOrDislikeCommentMutationResponse implements MutationResponse {
        code: String!
        success: Boolean!
        message: String!
        commentLikes: Int
        commentDislikes: Int
    }

    type LikeArtistMutationResponse implements MutationResponse {
        code: String!
        success: Boolean!
        message: String!
        artistLikes: Int
    }

    type LikeAlbumMutationResponse implements MutationResponse {
        code: String!
        success: Boolean!
        message: String!
        albumLikes: Int
    }

    type LikeTrackMutationResponse implements MutationResponse {
        code: String!
        success: Boolean!
        message: String!
        trackLikes: Int
    }
`;
