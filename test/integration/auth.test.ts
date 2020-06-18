import { createTestClient, ApolloServerTestClient } from 'apollo-server-testing';
import { gql, ApolloServer } from 'apollo-server-express';
import mongoose from 'mongoose';
import { createTestServer } from '../../src/graphql';
import { connectDatabase, closeDatabase } from '../../src/database';
import { getCachedUser, closeRedis } from '../../src/redis/actions';
import { verifyJWT } from '../../src/utils/jwt';
import { findUserById, populateUser, createUser } from '../../src/database/dataAccess/User';
import { UserDocument } from '../../src/database/models/UserModel';
import { AuthPayload } from '../../src/graphql/types';

const LOGIN_USER = gql`
    mutation LoginUser($username: String!, $password: String!) {
        login(username: $username, password: $password) {
            user {
                id
                username
                password
                email
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
                password
                email
                isArtist
                followers {
                    id
                }
                following {
                    id
                }
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

            const res = await client.mutate({
                mutation: REGISTER_USER,
                variables: {
                    username: mockUser.username,
                    password: mockUser.password,
                    email: mockUser.email,
                },
            });
            const { user, token } = res.data.register;
            let actualUser: UserDocument = await findUserById(user.id);
            actualUser = await populateUser(actualUser);
            const expectedData: AuthPayload = {
                user: {
                    id: actualUser.id,
                    username: mockUser.username,
                    password: mockUser.password,
                    email: mockUser.email,
                    isArtist: false,
                    followers: [],
                    following: [],
                },
                token,
            };
            const decodedToken = await verifyJWT(token);
            const cachedUser = await getCachedUser(actualUser.id);

            expect(actualUser).toBeDefined();
            expect(expectedData).toEqual(res.data.register);
            expect((decodedToken as any).id).toEqual(actualUser.id);
            expect((decodedToken as any).username).toEqual(mockUser.username);
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
        let mockUser: any;
        let userDocument: UserDocument;

        beforeAll(async () => {
            await connection.dropDatabase();
            mockUser = {
                username: 'testuser123',
                password: 'password',
                email: 'testuser123@email.com',
            };
            userDocument = await createUser(mockUser.username, mockUser.password, mockUser.email);
            userDocument = await populateUser(userDocument);
        });

        it('can login a user with a username and password', async () => {
            const res = await client.mutate({
                mutation: LOGIN_USER,
                variables: {
                    username: mockUser.username,
                    password: mockUser.password,
                },
            });
            const { user, token } = res.data.login;
            const expectedData = {
                user: {
                    id: userDocument.id,
                    username: mockUser.username,
                    password: mockUser.password,
                    email: mockUser.email,
                },
                token,
            };
            const decodedToken = await verifyJWT(token);
            const cachedUser = await getCachedUser(userDocument.id);

            expect(res.data.login).toEqual(expectedData);
            expect((decodedToken as any).id).toEqual(user.id);
            expect((decodedToken as any).username).toEqual(user.username);
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
            expect(res.errors[0].message).toEqual('User with username does not exist.');
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
            expect(res.errors[0].message).toEqual('Username and/or password is incorrect.');
        });
    });
});
