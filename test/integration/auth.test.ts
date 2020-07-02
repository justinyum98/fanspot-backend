import { createTestClient, ApolloServerTestClient } from 'apollo-server-testing';
import { gql, ApolloServer } from 'apollo-server-express';
import mongoose from 'mongoose';
import { createTestServer } from '../../src/graphql';
import { connectDatabase, closeDatabase } from '../../src/database';
import { getCachedUser, closeRedis } from '../../src/redis/actions';
import { verifyJWT } from '../../src/utils/jwt';
import { validatePasswordMatch } from '../../src/utils/password';
import { findUserById, createUser } from '../../src/database/dataAccess/User';
import { UserDocument } from '../../src/database/models/UserModel';
import { AuthPayload } from '../../src/graphql/types';

const LOGIN_USER = gql`
    mutation LoginUser($username: String!, $password: String!) {
        login(username: $username, password: $password) {
            user {
                id
                username
                email
                profilePictureUrl
                privacy {
                    follow
                }
                isArtist
                followers
                following
                posts
                createdAt
                updatedAt
            }
            token
        }
    }
`;

const REGISTER_USER = gql`
    mutation RegisterUser($username: String!, $password: String!, $email: EmailAddress!) {
        register(username: $username, password: $password, email: $email) {
            user {
                id
                username
                email
                profilePictureUrl
                privacy {
                    follow
                }
                isArtist
                followers
                following
                posts
                createdAt
                updatedAt
            }
            token
        }
    }
`;

describe('Authentication feature', () => {
    let connection: mongoose.Connection;
    let server: ApolloServer;
    let client: ApolloServerTestClient;

    beforeAll(async () => {
        connection = await connectDatabase();
        server = createTestServer();
        client = createTestClient(server);
    });

    afterAll(async () => {
        await closeRedis();
        await connection.dropDatabase();
        await closeDatabase(connection);
    });

    describe('Register', () => {
        beforeAll(async () => {
            await connection.dropDatabase();
        });

        it('can successfully register a new user', async () => {
            const mockUser = {
                username: 'testuser1',
                password: 'password',
                email: 'testuser1@email.com',
            };

            // Create the user
            const res = await client.mutate({
                mutation: REGISTER_USER,
                variables: {
                    username: mockUser.username,
                    password: mockUser.password,
                    email: mockUser.email,
                },
            });
            const payload: AuthPayload = res.data.register;

            const actualUser: UserDocument = await findUserById(payload.user.id);
            const expectedPayload: AuthPayload = {
                user: {
                    id: actualUser.id,
                    username: mockUser.username,
                    email: mockUser.email,
                    profilePictureUrl: null,
                    privacy: {
                        follow: false,
                    },
                    isArtist: false,
                    followers: [],
                    following: [],
                    posts: [],
                },
                token: payload.token,
            };
            const passwordsMatch = await validatePasswordMatch(mockUser.password, actualUser.password);
            const decodedToken = await verifyJWT(payload.token);
            const cachedUser = await getCachedUser(actualUser.id);

            expect(actualUser).toBeDefined();
            expect(payload).toMatchObject(expectedPayload);
            expect(passwordsMatch).toEqual(true);
            expect(payload.user.createdAt).toBeDefined();
            expect(payload.user.updatedAt).toBeDefined();
            expect(decodedToken.id).toEqual(actualUser.id);
            expect(decodedToken.username).toEqual(actualUser.username);
            expect(cachedUser).toEqual(actualUser.toJSON());
        });

        // Note: Relies on previous test working properly, as it creates a user already.
        it('cannot register a user with a taken username', async () => {
            const mockUser = {
                username: 'testuser1', // 'testuser1' is already taken
                password: 'password',
                email: 'differentemail@email.com', // email is not taken
            };

            const res = await client.mutate({
                mutation: REGISTER_USER,
                variables: {
                    username: mockUser.username,
                    password: mockUser.password,
                    email: mockUser.email,
                },
            });

            expect(res.data.register).toBeNull();
            expect(res.errors).toBeDefined();
            expect(res.errors[0].message).toEqual('Username is taken.');
        });

        // Note: Relies on first test working properly
        it('cannot register a user with a taken email', async () => {
            const mockUser = {
                username: 'differentusername', // username is not taken
                password: 'password',
                email: 'testuser1@email.com', // email is already taken
            };

            const res = await client.mutate({
                mutation: REGISTER_USER,
                variables: {
                    username: mockUser.username,
                    password: mockUser.password,
                    email: mockUser.email,
                },
            });

            expect(res.data.register).toBeNull();
            expect(res.errors).toBeDefined();
            expect(res.errors[0].message).toEqual('Email is taken.');
        });
    });

    describe('Login', () => {
        let mockUser: { username: string; password: string; email: string };
        let userDocument: UserDocument;

        beforeAll(async () => {
            await connection.dropDatabase();
            mockUser = {
                username: 'testuser123',
                password: 'password',
                email: 'testuser123@email.com',
            };
            userDocument = await createUser(mockUser.username, mockUser.password, mockUser.email);
        });

        it('can login a user with a username and password', async () => {
            const res = await client.mutate({
                mutation: LOGIN_USER,
                variables: {
                    username: mockUser.username,
                    password: mockUser.password,
                },
            });
            const payload = res.data.login;
            const expectedPayload: AuthPayload = {
                user: {
                    id: userDocument.id,
                    username: mockUser.username,
                    email: mockUser.email,
                    profilePictureUrl: null,
                    isArtist: false,
                    privacy: {
                        follow: false,
                    },
                    followers: [],
                    following: [],
                    posts: [],
                },
                token: payload.token,
            };
            const passwordsMatch = await validatePasswordMatch(mockUser.password, userDocument.password);
            const decodedToken = await verifyJWT(payload.token);
            const cachedUser = await getCachedUser(userDocument.id);

            expect(payload).toMatchObject(expectedPayload);
            expect(passwordsMatch).toEqual(true);
            expect(payload.user.createdAt).toBeDefined();
            expect(payload.user.updatedAt).toBeDefined();
            expect(decodedToken.id).toEqual(payload.user.id);
            expect(decodedToken.username).toEqual(payload.user.username);
            expect(cachedUser).toEqual(userDocument.toJSON());
        });

        it('cannot login with the wrong username', async () => {
            const res = await client.mutate({
                mutation: LOGIN_USER,
                variables: {
                    username: 'wrongusername',
                    password: mockUser.password,
                },
            });

            expect(res.data.login).toBeNull();
            expect(res.errors).toBeDefined();
            expect(res.errors[0].message).toEqual('User with username could not be found.');
        });

        it('cannot login with the wrong password', async () => {
            const res = await client.mutate({
                mutation: LOGIN_USER,
                variables: {
                    username: mockUser.username,
                    password: 'wrongpassword',
                },
            });

            expect(res.data.login).toBeNull();
            expect(res.errors).toBeDefined();
            expect(res.errors[0].message).toEqual('Password is incorrect.');
        });
    });
});
