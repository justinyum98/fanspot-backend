import { AlbumModel, AlbumDocument } from '../models/AlbumModel';

/**
 * Retrieves an Album by ObjectId.
 *
 * @export
 * @param {AlbumDocument['_id']} id - ObjectId of the Album
 * @returns {Promise<AlbumDocument>}
 */
export async function findAlbumById(id: AlbumDocument['_id']): Promise<AlbumDocument> {
    let album: AlbumDocument;
    try {
        album = await AlbumModel.findById(id).exec();
    } catch (error) {
        throw error;
    }
    return album;
}

/**
 * Retrieves an Album by it's title.
 *
 * @export
 * @param {AlbumDocument['title']} title - the album title
 * @returns {Promise<AlbumDocument>}
 */
export async function findAlbumByTitle(title: AlbumDocument['title']): Promise<AlbumDocument> {
    let album: AlbumDocument;
    try {
        album = await AlbumModel.findOne({ title }).exec();
    } catch (error) {
        throw error;
    }
    return album;
}

/**
 * Retrieves an Album by Spotify ID.
 *
 * @export
 * @param {AlbumDocument['spotifyId']} spotifyId - the album's Spotify ID
 * @returns {Promise<AlbumDocument>}
 */
export async function findAlbumBySpotifyId(spotifyId: AlbumDocument['spotifyId']): Promise<AlbumDocument> {
    let album: AlbumDocument;
    try {
        album = await AlbumModel.findOne({ spotifyId }).exec();
    } catch (error) {
        throw error;
    }
    return album;
}
