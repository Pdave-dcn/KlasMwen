import { BookmarkNotFoundError } from "../../../../core/error/custom/bookmark.error.js";
import { postService } from "../../../posts/service/PostService.js";
import { BookmarkRepository } from "../repositories/bookmarkRepository.js";

class BookmarkService {
  async getBookmarks(userId: string, limit: number, cursor?: string) {
    const result = await postService.query.getUserBookmarkedPosts(
      userId,
      limit,
      cursor,
    );
    return {
      data: result.posts,
      pagination: result.pagination,
    };
  }

  async createBookmark(userId: string, postId: string) {
    await postService.validate.verifyPostExists(postId);
    await BookmarkRepository.create(userId, postId);
  }

  async deleteBookmark(userId: string, postId: string): Promise<void> {
    const existing = await BookmarkRepository.findByUserAndPost(userId, postId);
    if (!existing) throw new BookmarkNotFoundError(postId);
    await BookmarkRepository.delete(userId, postId);
  }
}

const bookmarkService = new BookmarkService();
export { bookmarkService, BookmarkService };
