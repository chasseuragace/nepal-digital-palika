/**
 * Cross-layer E2E — blog posts.
 *
 * admin-panel palika_admin creates + publishes a blog post; m-place's real
 * `BlogPostRepository` + `SupabaseBlogPostDatasource` must see it.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SupabaseBlogPostDatasource } from '@/data/datasources/supabase/supabase-blog-post.datasource';
import { BlogPostRepository } from '@/data/repositories/blog-post.repository';
import {
  PALIKA_ID,
  loginPalikaAdmin,
  makeAdminFetch,
  mkReporter,
} from './helpers/context';

const blogDatasource = new SupabaseBlogPostDatasource();
const blogRepo = new BlogPostRepository(blogDatasource);

const runTag = `e2e-bp-${Date.now().toString(36)}`;
const { mark, print } = mkReporter('Blog post cross-layer E2E summary');

let fetchAdmin: ReturnType<typeof makeAdminFetch>;
let authorId: string | null = null;
let createdPostId: string | null = null;

beforeAll(async () => {
  const { cookie, user } = await loginPalikaAdmin();
  fetchAdmin = makeAdminFetch(cookie);
  // The logged-in admin is the author for this post (their admin_users.id).
  authorId = user.id;
  mark('admin.login', '✓', `${user.email} (author_id)`);
  expect(user.palika_id).toBe(PALIKA_ID);
});

afterAll(async () => {
  if (createdPostId && fetchAdmin) {
    try {
      await fetchAdmin(`/api/blog-posts/${createdPostId}`, {
        method: 'DELETE',
      });
    } catch {
      /* best effort */
    }
  }
  print();
});

describe('admin-panel creates blog post', () => {
  it('creates a published blog post authored by the logged-in admin', async () => {
    expect(authorId).toBeTruthy();
    // Service requires title_en/ne, palika_id, author_id, content.
    const payload = {
      title_en: `E2E Blog ${runTag}`,
      title_ne: `ई२ई ब्लग ${runTag}`,
      palika_id: PALIKA_ID,
      author_id: authorId,
      content: '<p>Cross-layer E2E test post. Safe to delete.</p>',
      excerpt: 'E2E test excerpt.',
      category: 'news',
      tags: ['e2e', 'test', runTag],
      status: 'published',
    };
    const { status, json } = await fetchAdmin('/api/blog-posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    expect(status).toBe(201);
    expect(json?.id).toBeTruthy();
    expect(json?.status).toBe('published');
    createdPostId = json.id;
    mark('admin.create', '✓', `id=${createdPostId}`);
  });
});

describe('m-place repo sees the blog post', () => {
  it('fetchBlogPostById returns the new post', async () => {
    expect(createdPostId).toBeTruthy();
    const post = await blogRepo.fetchBlogPostById(createdPostId!);
    expect(post?.id).toBe(createdPostId);
    expect(post?.status).toBe('published');
    expect(post?.palika_id).toBe(PALIKA_ID);
    mark('mplace.repo.fetchBlogPostById', '✓', post?.title_en ?? '');
  });

  it('fetchBlogPosts({palikaId}) lists the new post', async () => {
    const result = await blogRepo.fetchBlogPosts({
      palikaId: PALIKA_ID,
      page: 1,
      pageSize: 50,
    });
    const found = result.data.some((r: any) => r.id === createdPostId);
    expect(found).toBe(true);
    mark(
      'mplace.repo.fetchBlogPosts',
      '✓',
      `${result.meta.total} posts in palika ${PALIKA_ID}`
    );
  });

  it('fetchBlogPosts with tag filter finds it via tags[] contains', async () => {
    // Exercises the datasource's `.contains('tags', [...])` branch — not
    // covered by the palika-scoped list above.
    const result = await blogRepo.fetchBlogPosts({
      tags: [runTag],
      page: 1,
      pageSize: 20,
    });
    const found = result.data.some((r: any) => r.id === createdPostId);
    expect(found).toBe(true);
    mark('mplace.repo.tagFilter', '✓', `contains [${runTag}]`);
  });
});

describe('cleanup', () => {
  it('admin deletes the blog post', async () => {
    expect(createdPostId).toBeTruthy();
    const { status } = await fetchAdmin(`/api/blog-posts/${createdPostId}`, {
      method: 'DELETE',
    });
    expect(status).toBe(200);
    mark('admin.delete', '✓', `id=${createdPostId}`);
    const deletedId = createdPostId;
    createdPostId = null;

    const after = await blogRepo.fetchBlogPostById(deletedId!);
    expect(after).toBeNull();
    mark('mplace.repo.removed', '✓', 'fetchBlogPostById → null');
  });
});
