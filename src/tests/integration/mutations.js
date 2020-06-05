const { gql } = require('apollo-server-express');

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

const FOLLOW_USER = gql`
    mutation FollowUser($targetUserId: String!) {
        follow(targetUserId: $targetUserId) {
            currentUser {
                id
                username
                email
                following {
                    id
                    username
                    email
                }
                followers {
                    id
                    username
                    email
                }
            }
            targetUser {
                id
                username
                email
                following {
                    id
                    username
                    email
                }
                followers {
                    id
                    username
                    email
                }
            }
        }
    }
`;

const UNFOLLOW_USER = gql`
    mutation UnfollowUser($targetUserId: String!) {
        unfollow(targetUserId: $targetUserId) {
            currentUser {
                id
                following {
                    id
                }
                followers {
                    id
                }
            }
            targetUser {
                id
                following {
                    id
                }
                followers {
                    id
                }
            }
        }
    }
`;

module.exports = { LOGIN_USER, REGISTER_USER, FOLLOW_USER, UNFOLLOW_USER };
