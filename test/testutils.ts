import faker from 'faker';
import { UserDocument } from '../src/database/models/UserModel';
import { createUser } from '../src/database/dataAccess/User';
import { PostDocument } from '../src/database/models/PostModel';
import { createPost } from '../src/database/dataAccess/Post';

export async function createFakeUser(): Promise<UserDocument> {
    const fakeUser = await createUser(faker.internet.userName(), faker.internet.password(), faker.internet.email());
    return fakeUser;
}

export async function createMultipleFakeUsers(amount: number): Promise<Array<UserDocument>> {
    const fakeUsers = [];
    for (let i = 0; i < amount; i++) {
        const fakeUser = await createFakeUser();
        fakeUsers.push(fakeUser);
    }
    return fakeUsers;
}

export async function createFakePost(posterId: string, artistId: string): Promise<PostDocument> {
    const [fakePost] = await createPost(
        posterId,
        faker.lorem.sentence(),
        'artist',
        artistId,
        'text',
        faker.lorem.paragraph(),
    );
    return fakePost;
}
