import mongoose from 'mongoose';
import faker from 'faker';
import { createTestClient, ApolloServerTestClient } from 'apollo-server-testing';
import { gql, ApolloServer } from 'apollo-server-express';
import { createTestServer } from '../../src/graphql';
import {
    FollowAlbumMutationResponse,
    FollowArtistMutationResponse,
    Follower,
    FollowingResult,
    FollowMutationPayload,
    FollowTrackMutationResponse,
} from '../../src/graphql/types';
import { connectDatabase, closeDatabase } from '../../src/database';
import { UserModel, UserDocument } from '../../src/database/models/UserModel';
import { generateJWT } from '../../src/utils/jwt';
import { createUser, findUserById } from '../../src/database/dataAccess/User';
import { ArtistDocument, ArtistModel } from '../../src/database/models/ArtistModel';
import { AlbumDocument, AlbumModel } from '../../src/database/models/AlbumModel';
import { TrackDocument, TrackModel } from '../../src/database/models/TrackModel';
import { findArtistById } from '../../src/database/dataAccess/Artist';
import { findAlbumById } from '../../src/database/dataAccess/Album';
import { findTrackById } from '../../src/database/dataAccess/Track';

describe('Follow feature', () => {
    let connection: mongoose.Connection;

    const FOLLOW_USER = gql`
        mutation FollowUser($targetUserId: ID!) {
            follow(targetUserId: $targetUserId) {
                currentUserFollowing
                targetUserFollowers
            }
        }
    `;

    const UNFOLLOW_USER = gql`
        mutation UnfollowUser($targetUserId: ID!) {
            unfollow(targetUserId: $targetUserId) {
                currentUserFollowing
                targetUserFollowers
            }
        }
    `;

    const FOLLOW_ARTIST = gql`
        mutation FollowArtist($artistId: ID!) {
            followArtist(artistId: $artistId) {
                code
                success
                message
                artistId
            }
        }
    `;

    const UNFOLLOW_ARTIST = gql`
        mutation UnfollowArtist($artistId: ID!) {
            unfollowArtist(artistId: $artistId) {
                code
                success
                message
                artistId
            }
        }
    `;

    const FOLLOW_ALBUM = gql`
        mutation FollowAlbum($albumId: ID!) {
            followAlbum(albumId: $albumId) {
                code
                success
                message
                albumId
            }
        }
    `;

    const UNFOLLOW_ALBUM = gql`
        mutation UnfollowAlbum($albumId: ID!) {
            unfollowAlbum(albumId: $albumId) {
                code
                success
                message
                albumId
            }
        }
    `;

    const FOLLOW_TRACK = gql`
        mutation FollowTrack($trackId: ID!) {
            followTrack(trackId: $trackId) {
                code
                success
                message
                trackId
            }
        }
    `;

    const UNFOLLOW_TRACK = gql`
        mutation UnfollowTrack($trackId: ID!) {
            unfollowTrack(trackId: $trackId) {
                code
                success
                message
                trackId
            }
        }
    `;

    const GET_CURRENT_USER_FOLLOWING = gql`
        query GetCurrentUserFollowing {
            getCurrentUserFollowing {
                id
                username
                profilePictureUrl
            }
        }
    `;

    const GET_CURRENT_USER_FOLLOWERS = gql`
        query GetCurrentUserFollowers {
            getCurrentUserFollowers {
                id
                username
                profilePictureUrl
            }
        }
    `;

    const GET_USER_FOLLOWING = gql`
        query GetUserFollowing($userId: ID!) {
            getUserFollowing(userId: $userId) {
                id
                username
                profilePictureUrl
            }
        }
    `;

    const GET_USER_FOLLOWERS = gql`
        query GetUserFollowers($userId: ID!) {
            getUserFollowers(userId: $userId) {
                id
                username
                profilePictureUrl
            }
        }
    `;

    const GET_USER_FOLLOWING_ARTISTS = gql`
        query GetUserFollowingArtists($userId: ID!) {
            getUserFollowingArtists(userId: $userId) {
                id
                name
                pictureUrl
            }
        }
    `;

    const GET_USER_FOLLOWING_ALBUMS = gql`
        query GetUserFollowingAlbums($userId: ID!) {
            getUserFollowingAlbums(userId: $userId) {
                id
                name
                pictureUrl
            }
        }
    `;

    const GET_USER_FOLLOWING_TRACKS = gql`
        query GetUserFollowingTracks($userId: ID!) {
            getUserFollowingTracks(userId: $userId) {
                id
                name
                pictureUrl
            }
        }
    `;

    beforeAll(async () => {
        connection = await connectDatabase();
    });

    afterAll(async () => {
        await closeDatabase(connection);
    });

    describe('Mutation Follow', () => {
        let server: ApolloServer;
        let client: ApolloServerTestClient;
        let currentUser: UserDocument;
        let targetUser: UserDocument;
        let artistDoc: ArtistDocument;
        let albumDoc: AlbumDocument;
        let trackDoc: TrackDocument;

        beforeAll(async () => {
            currentUser = await createUser(
                faker.internet.userName(),
                faker.internet.password(),
                faker.internet.email(),
            );
            targetUser = await createUser(faker.internet.userName(), faker.internet.password(), faker.internet.email());
            artistDoc = new ArtistModel({ name: faker.internet.userName() });
            await artistDoc.save();
            albumDoc = new AlbumModel({ title: faker.lorem.word(), albumType: 'album', releaseDate: new Date() });
            await albumDoc.save();
            trackDoc = new TrackModel({
                title: faker.lorem.words(2),
                explicit: true,
                trackNumber: 1,
                duration: 10000,
                album: albumDoc.id,
            });
            await trackDoc.save();
            const token = generateJWT(currentUser.id, currentUser.username);
            const context = { token };
            server = createTestServer(context);
            client = createTestClient(server);
        });

        afterAll(async () => {
            await UserModel.deleteMany({}).exec();
            await ArtistModel.findByIdAndDelete(artistDoc.id).exec();
            await AlbumModel.findByIdAndDelete(albumDoc.id).exec();
            await TrackModel.findByIdAndDelete(trackDoc.id).exec();
        });

        beforeEach(async () => {
            currentUser = await findUserById(currentUser.id);
            targetUser = await findUserById(targetUser.id);
        });

        it('can follow another user', async () => {
            const expectedPayload: FollowMutationPayload = {
                currentUserFollowing: [targetUser.id],
                targetUserFollowers: [currentUser.id],
            };

            const res = await client.mutate({
                mutation: FOLLOW_USER,
                variables: {
                    targetUserId: targetUser.id,
                },
            });
            const payload = res.data.follow;

            expect(payload).toEqual(expectedPayload);
        });

        it('cannot follow a user that you are already following', async () => {
            const res = await client.mutate({
                mutation: FOLLOW_USER,
                variables: {
                    targetUserId: targetUser.id,
                },
            });
            currentUser = await findUserById(currentUser.id);
            targetUser = await findUserById(targetUser.id);

            expect(res.data.follow).toBeNull();
            expect(res.errors).toBeDefined();
            expect(res.errors[0].message).toEqual('Already following user.');

            expect(currentUser.following.length).toEqual(1);
            expect(targetUser.followers.length).toEqual(1);
        });

        it('can unfollow another user', async () => {
            expect(currentUser.following.length).toEqual(1);
            expect(targetUser.followers.length).toEqual(1);

            const expectedPayload: FollowMutationPayload = {
                currentUserFollowing: [],
                targetUserFollowers: [],
            };

            const res = await client.mutate({
                mutation: UNFOLLOW_USER,
                variables: {
                    targetUserId: targetUser._id.toString(),
                },
            });

            const payload = res.data.unfollow;

            expect(payload).toEqual(expectedPayload);
        });

        it('cannot unfollow user you are not following', async () => {
            expect(currentUser.following.length).toEqual(0);
            expect(targetUser.followers.length).toEqual(0);

            const res = await client.mutate({
                mutation: UNFOLLOW_USER,
                variables: {
                    targetUserId: targetUser._id.toString(),
                },
            });

            expect(res.data.unfollow).toBeNull();
            expect(res.errors).toBeDefined();
            expect(res.errors[0].message).toEqual('Already not following user.');
        });

        // Follow Artist
        it('can follow an artist', async () => {
            // ARRANGE
            const requiredData = {
                artistId: artistDoc.id,
            };

            // ACT
            const res = await client.mutate({
                mutation: FOLLOW_ARTIST,
                variables: requiredData,
            });
            const payload = res.data.followArtist;
            currentUser = await findUserById(currentUser.id);
            artistDoc = await findArtistById(artistDoc.id);

            // ASSERT
            const expectedPayload: FollowArtistMutationResponse = {
                code: '200',
                success: true,
                message: 'Successfully followed the artist.',
                artistId: artistDoc.id,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.followedArtists.length).toEqual(1);
            expect(artistDoc.followers.length).toEqual(1);
        });

        it('cannot follow an artist that the user is already following', async () => {
            // ARRANGE
            const requiredData = {
                artistId: artistDoc.id,
            };

            // ACT
            const res = await client.mutate({
                mutation: FOLLOW_ARTIST,
                variables: requiredData,
            });
            const payload = res.data.followArtist;
            currentUser = await findUserById(currentUser.id);
            artistDoc = await findArtistById(artistDoc.id);

            // ASSERT
            const expectedPayload: FollowArtistMutationResponse = {
                code: '409',
                success: false,
                message: 'ConflictError: Already following the artist.',
                artistId: null,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.followedArtists.length).toEqual(1);
            expect(artistDoc.followers.length).toEqual(1);
        });

        it('can unfollow an artist', async () => {
            // ARRANGE
            const requiredData = {
                artistId: artistDoc.id,
            };

            // ACT
            const res = await client.mutate({
                mutation: UNFOLLOW_ARTIST,
                variables: requiredData,
            });
            const payload = res.data.unfollowArtist;
            currentUser = await findUserById(currentUser.id);
            artistDoc = await findArtistById(artistDoc.id);

            // ASSERT
            const expectedPayload: FollowArtistMutationResponse = {
                code: '200',
                success: true,
                message: 'Successfully unfollowed the artist.',
                artistId: artistDoc.id,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.followedArtists.length).toEqual(0);
            expect(artistDoc.followers.length).toEqual(0);
        });

        it('cannot unfollow an artist that the user is not following', async () => {
            // ARRANGE
            const requiredData = {
                artistId: artistDoc.id,
            };

            // ACT
            const res = await client.mutate({
                mutation: UNFOLLOW_ARTIST,
                variables: requiredData,
            });
            const payload = res.data.unfollowArtist;
            currentUser = await findUserById(currentUser.id);
            artistDoc = await findArtistById(artistDoc.id);

            // ASSERT
            const expectedPayload: FollowArtistMutationResponse = {
                code: '409',
                success: false,
                message: 'ConflictError: Not following the artist.',
                artistId: null,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.followedArtists.length).toEqual(0);
            expect(artistDoc.followers.length).toEqual(0);
        });

        // Follow Album
        it('can follow an album', async () => {
            // ARRANGE
            const requiredData = {
                albumId: albumDoc.id,
            };

            // ACT
            const res = await client.mutate({
                mutation: FOLLOW_ALBUM,
                variables: requiredData,
            });
            const payload = res.data.followAlbum;
            currentUser = await findUserById(currentUser.id);
            albumDoc = await findAlbumById(albumDoc.id);

            // ASSERT
            const expectedPayload: FollowAlbumMutationResponse = {
                code: '200',
                success: true,
                message: 'Successfully followed the album.',
                albumId: albumDoc.id,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.followedAlbums.length).toEqual(1);
            expect(albumDoc.followers.length).toEqual(1);
        });

        it('cannot follow an album that the user is already following', async () => {
            // ARRANGE
            const requiredData = {
                albumId: albumDoc.id,
            };

            // ACT
            const res = await client.mutate({
                mutation: FOLLOW_ALBUM,
                variables: requiredData,
            });
            const payload = res.data.followAlbum;
            currentUser = await findUserById(currentUser.id);
            albumDoc = await findAlbumById(albumDoc.id);

            // ASSERT
            const expectedPayload: FollowAlbumMutationResponse = {
                code: '409',
                success: false,
                message: 'ConflictError: Already following the album.',
                albumId: null,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.followedAlbums.length).toEqual(1);
            expect(albumDoc.followers.length).toEqual(1);
        });

        it('can unfollow an album', async () => {
            // ARRANGE
            const requiredData = {
                albumId: albumDoc.id,
            };

            // ACT
            const res = await client.mutate({
                mutation: UNFOLLOW_ALBUM,
                variables: requiredData,
            });
            const payload = res.data.unfollowAlbum;
            currentUser = await findUserById(currentUser.id);
            albumDoc = await findAlbumById(albumDoc.id);

            // ASSERT
            const expectedPayload: FollowAlbumMutationResponse = {
                code: '200',
                success: true,
                message: 'Successfully unfollowed the album.',
                albumId: albumDoc.id,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.followedArtists.length).toEqual(0);
            expect(albumDoc.followers.length).toEqual(0);
        });

        it('cannot unfollow an album that the user is not following', async () => {
            // ARRANGE
            const requiredData = {
                albumId: albumDoc.id,
            };

            // ACT
            const res = await client.mutate({
                mutation: UNFOLLOW_ALBUM,
                variables: requiredData,
            });
            const payload = res.data.unfollowAlbum;
            currentUser = await findUserById(currentUser.id);
            albumDoc = await findAlbumById(albumDoc.id);

            // ASSERT
            const expectedPayload: FollowAlbumMutationResponse = {
                code: '409',
                success: false,
                message: 'ConflictError: Not following the album.',
                albumId: null,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.followedArtists.length).toEqual(0);
            expect(albumDoc.followers.length).toEqual(0);
        });

        // Follow Track
        it('can follow a track', async () => {
            // ARRANGE
            const requiredData = {
                trackId: trackDoc.id,
            };

            // ACT
            const res = await client.mutate({
                mutation: FOLLOW_TRACK,
                variables: requiredData,
            });
            const payload = res.data.followTrack;
            currentUser = await findUserById(currentUser.id);
            trackDoc = await findTrackById(trackDoc.id);

            // ASSERT
            const expectedPayload: FollowTrackMutationResponse = {
                code: '200',
                success: true,
                message: 'Successfully followed the track.',
                trackId: trackDoc.id,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.followedTracks.length).toEqual(1);
            expect(trackDoc.followers.length).toEqual(1);
        });

        it('cannot follow a track that the user is already following', async () => {
            // ARRANGE
            const requiredData = {
                trackId: trackDoc.id,
            };

            // ACT
            const res = await client.mutate({
                mutation: FOLLOW_TRACK,
                variables: requiredData,
            });
            const payload = res.data.followTrack;
            currentUser = await findUserById(currentUser.id);
            trackDoc = await findTrackById(trackDoc.id);

            // ASSERT
            const expectedPayload: FollowTrackMutationResponse = {
                code: '409',
                success: false,
                message: 'ConflictError: Already following the track.',
                trackId: null,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.followedTracks.length).toEqual(1);
            expect(trackDoc.followers.length).toEqual(1);
        });

        it('can unfollow a track', async () => {
            // ARRANGE
            const requiredData = {
                trackId: trackDoc.id,
            };

            // ACT
            const res = await client.mutate({
                mutation: UNFOLLOW_TRACK,
                variables: requiredData,
            });
            const payload = res.data.unfollowTrack;
            currentUser = await findUserById(currentUser.id);
            trackDoc = await findTrackById(trackDoc.id);

            // ASSERT
            const expectedPayload: FollowTrackMutationResponse = {
                code: '200',
                success: true,
                message: 'Successfully unfollowed the track.',
                trackId: trackDoc.id,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.followedTracks.length).toEqual(0);
            expect(trackDoc.followers.length).toEqual(0);
        });

        it('cannot unfollow a track that the user is not following', async () => {
            // ARRANGE
            const requiredData = {
                trackId: trackDoc.id,
            };

            // ACT
            const res = await client.mutate({
                mutation: UNFOLLOW_TRACK,
                variables: requiredData,
            });
            const payload = res.data.unfollowTrack;
            currentUser = await findUserById(currentUser.id);
            trackDoc = await findTrackById(trackDoc.id);

            // ASSERT
            const expectedPayload: FollowTrackMutationResponse = {
                code: '409',
                success: false,
                message: 'ConflictError: Not following the track.',
                trackId: null,
            };
            expect(payload).toMatchObject(expectedPayload);
            expect(currentUser.followedTracks.length).toEqual(0);
            expect(trackDoc.followers.length).toEqual(0);
        });
    });

    describe('Query Follow', () => {
        let server: ApolloServer;
        let client: ApolloServerTestClient;
        let currentUser: UserDocument;
        let targetUser: UserDocument;
        let artistDoc: ArtistDocument;
        let albumDoc: AlbumDocument;
        let trackDoc: TrackDocument;

        beforeAll(async () => {
            currentUser = await createUser(
                faker.internet.userName(),
                faker.internet.password(),
                faker.internet.email(),
            );
            targetUser = await createUser(faker.internet.userName(), faker.internet.password(), faker.internet.email());
            artistDoc = new ArtistModel({ name: faker.internet.userName() });
            await artistDoc.save();
            albumDoc = new AlbumModel({ title: faker.lorem.word(), albumType: 'album', releaseDate: new Date() });
            await albumDoc.save();
            trackDoc = new TrackModel({
                title: faker.lorem.words(2),
                explicit: true,
                trackNumber: 1,
                duration: 10000,
                album: albumDoc.id,
            });
            await trackDoc.save();
            const token = generateJWT(currentUser.id, currentUser.username);
            server = createTestServer({ token });
            client = createTestClient(server);
        });

        afterAll(async () => {
            await UserModel.deleteMany({}).exec();
            await ArtistModel.findByIdAndDelete(artistDoc.id);
            await AlbumModel.findByIdAndDelete(albumDoc.id);
            await TrackModel.findByIdAndDelete(trackDoc.id);
        });

        it("can get current user's list of followers", async () => {
            // Make targetUser follow currentUser
            targetUser.following.push(currentUser.id);
            await targetUser.save();
            // Update currentUser's followers
            currentUser.followers.push(targetUser.id);
            await currentUser.save();
            const expectedPayload: Follower[] = [
                {
                    id: targetUser.id,
                    username: targetUser.username,
                    profilePictureUrl: targetUser.profilePictureUrl,
                },
            ];

            // Retreive currentUser's followers
            const res = await client.query({
                query: GET_CURRENT_USER_FOLLOWERS,
            });
            const payload = res.data.getCurrentUserFollowers;

            expect(payload).toEqual(expectedPayload);
        });

        it("can get current user's list of following", async () => {
            // Make currentUser follow targetUser
            currentUser.following.push(targetUser.id);
            await currentUser.save();
            // Update targetUser's followers
            targetUser.followers.push(currentUser.id);
            await targetUser.save();
            const expectedPayload: Follower[] = [
                {
                    id: targetUser.id,
                    username: targetUser.username,
                    profilePictureUrl: targetUser.profilePictureUrl,
                },
            ];

            // Retrieve currentUser's following
            const res = await client.query({
                query: GET_CURRENT_USER_FOLLOWING,
            });
            const payload = res.data.getCurrentUserFollowing;

            expect(payload).toEqual(expectedPayload);
        });

        it("can get another user's list of following", async () => {
            // Set follow privacy setting to public
            targetUser.privacy.follow = true;
            await targetUser.save();

            const expectedPayload: Follower[] = [
                {
                    id: currentUser.id,
                    username: currentUser.username,
                    profilePictureUrl: currentUser.profilePictureUrl,
                },
            ];

            const res = await client.query({
                query: GET_USER_FOLLOWING,
                variables: {
                    userId: targetUser.id,
                },
            });
            const payload = res.data.getUserFollowing;

            expect(payload).toEqual(expectedPayload);
        });

        it("can get another user's list of followers", async () => {
            const expectedPayload: Follower[] = [
                {
                    id: currentUser.id,
                    username: currentUser.username,
                    profilePictureUrl: currentUser.profilePictureUrl,
                },
            ];

            const res = await client.query({
                query: GET_USER_FOLLOWERS,
                variables: {
                    userId: targetUser.id,
                },
            });
            const payload = res.data.getUserFollowers;

            expect(payload).toEqual(expectedPayload);
        });

        it("cannot get another user's list of followers if follow privacy setting is private", async () => {
            targetUser.privacy.follow = false;
            await targetUser.save();

            const res = await client.query({
                query: GET_USER_FOLLOWERS,
                variables: {
                    userId: targetUser.id,
                },
            });

            expect(res.data).toBeNull();
            expect(res.errors).toBeDefined();
            expect(res.errors[0].message).toEqual("User's follow setting is set to private.");
        });

        it("cannot get another user's list of following if follow privacy setting is private", async () => {
            const res = await client.query({
                query: GET_USER_FOLLOWING,
                variables: {
                    userId: targetUser.id,
                },
            });

            expect(res.data).toBeNull();
            expect(res.errors).toBeDefined();
            expect(res.errors[0].message).toEqual("User's follow setting is set to private.");
        });

        it('can get the artists that the user is following', async () => {
            // ARRANGE
            // First, follow the artist.
            const followArtistRes = await client.mutate({
                mutation: FOLLOW_ARTIST,
                variables: {
                    artistId: artistDoc.id,
                },
            });
            currentUser = await findUserById(currentUser.id);
            artistDoc = await findArtistById(artistDoc.id);
            expect(followArtistRes.data.followArtist).toBeDefined();
            expect(currentUser.followedArtists.length).toEqual(1);
            expect(artistDoc.followers.length).toEqual(1);

            // ACT
            const res = await client.query({
                query: GET_USER_FOLLOWING_ARTISTS,
                variables: {
                    userId: currentUser.id,
                },
            });
            const payload = res.data.getUserFollowingArtists;
            currentUser = await findUserById(currentUser.id);
            artistDoc = await findArtistById(artistDoc.id);

            // ASSERT
            const expectedPayload: FollowingResult[] = [
                {
                    id: artistDoc.id,
                    name: artistDoc.name,
                    pictureUrl: artistDoc.profilePictureUrl,
                },
            ];
            expect(payload).toMatchObject(expectedPayload);
        });

        it('can get the albums that the user is following', async () => {
            // ARRANGE
            // First, follow the album.
            const followAlbumRes = await client.mutate({
                mutation: FOLLOW_ALBUM,
                variables: {
                    albumId: albumDoc.id,
                },
            });
            currentUser = await findUserById(currentUser.id);
            albumDoc = await findAlbumById(albumDoc.id);
            expect(followAlbumRes.data.followAlbum).toBeDefined();
            expect(currentUser.followedAlbums.length).toEqual(1);
            expect(albumDoc.followers.length).toEqual(1);

            // ACT
            const res = await client.query({
                query: GET_USER_FOLLOWING_ALBUMS,
                variables: {
                    userId: currentUser.id,
                },
            });
            const payload = res.data.getUserFollowingAlbums;
            currentUser = await findUserById(currentUser.id);
            albumDoc = await findAlbumById(albumDoc.id);

            // ASSERT
            const expectedPayload: FollowingResult[] = [
                {
                    id: albumDoc.id,
                    name: albumDoc.title,
                    pictureUrl: albumDoc.coverArtUrl,
                },
            ];
            expect(payload).toMatchObject(expectedPayload);
        });

        it('can get the tracks that the user is following', async () => {
            // ARRANGE
            // First, follow the track.
            const followTrackRes = await client.mutate({
                mutation: FOLLOW_TRACK,
                variables: {
                    trackId: trackDoc.id,
                },
            });
            currentUser = await findUserById(currentUser.id);
            trackDoc = await findTrackById(trackDoc.id);
            expect(followTrackRes.data.followTrack).toBeDefined();
            expect(currentUser.followedTracks.length).toEqual(1);
            expect(trackDoc.followers.length).toEqual(1);

            // ACT
            const res = await client.query({
                query: GET_USER_FOLLOWING_TRACKS,
                variables: {
                    userId: currentUser.id,
                },
            });
            const payload = res.data.getUserFollowingTracks;
            currentUser = await findUserById(currentUser.id);
            trackDoc = await findTrackById(trackDoc.id);
            await trackDoc.populate('album').execPopulate();

            // ASSERT
            const expectedPayload: FollowingResult[] = [
                {
                    id: trackDoc.id,
                    name: trackDoc.title,
                    pictureUrl: trackDoc.album.coverArtUrl,
                },
            ];
            expect(payload).toMatchObject(expectedPayload);
        });
    });
});
