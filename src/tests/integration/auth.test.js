const { createTestClient } = require('apollo-server-testing');
const {
    createTestServer,
    connectTestDatabase,
    closeTestDatabase,
    verifyJWT,
    getCachedUser,
    closeRedis,
} = require('../testUtils');
const { REGISTER_USER, LOGIN_USER } = require('./mutations');
const { findUserById, populateUser, createUser } = require('../../database/dataAccess/User');

describe('Authentication feature', () => {
    let connection;
    let server;
    let client;

    beforeAll(async () => {
        connection = await connectTestDatabase();
        server = createTestServer();
        client = createTestClient(server);
    });

    afterAll(async () => {
        await closeRedis();
        await closeTestDatabase(connection);
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
            let actualUser = await findUserById(user.id);
            actualUser = await populateUser(actualUser);
            const expectedData = {
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
            const decodedToken = verifyJWT(token);
            const cachedUser = await getCachedUser(actualUser.id);

            expect(actualUser).toBeDefined();
            expect(expectedData).toEqual(res.data.register);
            expect(decodedToken.id).toEqual(actualUser.id);
            expect(decodedToken.username).toEqual(mockUser.username);
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
        let mockUser;
        let userDocument;

        beforeAll(async () => {
            await connection.dropDatabase();
            mockUser = {
                username: 'testuser123',
                password: 'password',
                email: 'testuser123@email.com',
            };
            userDocument = await createUser({
                username: mockUser.username,
                password: mockUser.password,
                email: mockUser.email,
            });
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
            const decodedToken = verifyJWT(token);
            const cachedUser = await getCachedUser(userDocument.id);

            expect(res.data.login).toEqual(expectedData);
            expect(decodedToken.id).toEqual(user.id);
            expect(decodedToken.username).toEqual(user.username);
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
