import { createContext, use, ReactNode, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: { name: string; avatar: string };
  status: "draft" | "published" | "scheduled";
  publishedAt: Date | null;
  scheduledFor: Date | null;
  readTime: number;
  views: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

interface BlogContextType {
  posts: BlogPost[];
  loading: boolean;
  getPost: (slug: string) => BlogPost | undefined;
  getPostById: (id: string) => BlogPost | undefined;
  createPost: (
    post: Omit<BlogPost, "id" | "createdAt" | "updatedAt" | "views" | "likes">
  ) => Promise<BlogPost>;
  updatePost: (id: string, updates: Partial<BlogPost>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  publishPost: (id: string) => Promise<void>;
  unpublishPost: (id: string) => Promise<void>;
  incrementViews: (id: string) => Promise<void>;
  likePost: (id: string) => Promise<void>;
  getPublishedPosts: () => BlogPost[];
  getPostsByCategory: (category: string) => BlogPost[];
  searchPosts: (query: string) => BlogPost[];
  categories: string[];
}

const categories = [
  "Trends",
  "Style Guide",
  "Behind the Scenes",
  "Tips & Tricks",
  "Culture",
  "Interviews",
];

const BlogContext = createContext<BlogContextType | undefined>(undefined);

function mapPost(p: {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: { name: string; avatar: string };
  status: "draft" | "published" | "scheduled";
  publishedAt: number | null;
  scheduledFor: number | null;
  readTime: number;
  views: number;
  likes: number;
  createdAt: number;
  updatedAt: number;
}): BlogPost {
  return {
    ...p,
    publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
    scheduledFor: p.scheduledFor ? new Date(p.scheduledFor) : null,
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt),
  };
}

export function BlogProvider({ children }: { children: ReactNode }) {
  const rawPosts = useQuery(api.blogs.list);
  const createMutation = useMutation(api.blogs.create);
  const updateMutation = useMutation(api.blogs.update);
  const publishMutation = useMutation(api.blogs.publish);
  const unpublishMutation = useMutation(api.blogs.unpublish);
  const removeMutation = useMutation(api.blogs.remove);
  const incViews = useMutation(api.blogs.incrementViews);
  const incLikes = useMutation(api.blogs.incrementLikes);

  const loading = rawPosts === undefined;
  const posts = rawPosts?.map(mapPost) ?? [];

  const getPost = (slug: string) => posts.find((p) => p.slug === slug);
  const getPostById = (id: string) => posts.find((p) => p.id === id);

  const createPost = async (
    postData: Omit<BlogPost, "id" | "createdAt" | "updatedAt" | "views" | "likes">
  ): Promise<BlogPost> => {
    const id = await createMutation({
      title: postData.title,
      slug: postData.slug,
      excerpt: postData.excerpt,
      content: postData.content,
      coverImage: postData.coverImage,
      category: postData.category,
      tags: postData.tags,
      author: postData.author,
      status: postData.status,
      publishedAt: postData.publishedAt?.getTime() ?? null,
      scheduledFor: postData.scheduledFor?.getTime() ?? null,
      readTime: postData.readTime,
    });
    return {
      ...postData,
      id,
      views: 0,
      likes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  const updatePost = async (id: string, updates: Partial<BlogPost>) => {
    await updateMutation({
      id,
      patch: {
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.slug !== undefined && { slug: updates.slug }),
        ...(updates.excerpt !== undefined && { excerpt: updates.excerpt }),
        ...(updates.content !== undefined && { content: updates.content }),
        ...(updates.coverImage !== undefined && { coverImage: updates.coverImage }),
        ...(updates.category !== undefined && { category: updates.category }),
        ...(updates.tags !== undefined && { tags: updates.tags }),
        ...(updates.author !== undefined && { author: updates.author }),
        ...(updates.status !== undefined && { status: updates.status }),
        ...(updates.publishedAt !== undefined && {
          publishedAt: updates.publishedAt?.getTime() ?? null,
        }),
        ...(updates.scheduledFor !== undefined && {
          scheduledFor: updates.scheduledFor?.getTime() ?? null,
        }),
        ...(updates.readTime !== undefined && { readTime: updates.readTime }),
        ...(updates.views !== undefined && { views: updates.views }),
        ...(updates.likes !== undefined && { likes: updates.likes }),
      },
    });
  };

  const deletePost = async (id: string) => {
    await removeMutation({ id });
  };

  const publishPost = async (id: string) => {
    await publishMutation({ id });
  };

  const unpublishPost = async (id: string) => {
    await unpublishMutation({ id });
  };

  const incrementViews = async (id: string) => {
    await incViews({ id });
  };

  const likePost = async (id: string) => {
    await incLikes({ id });
  };

  const getPublishedPosts = () =>
    posts
      .filter((p) => p.status === "published")
      .sort(
        (a, b) =>
          (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0)
      );

  const getPostsByCategory = (category: string) =>
    posts.filter((p) => p.category === category && p.status === "published");

  const searchPosts = (query: string) => {
    const q = query.toLowerCase();
    return posts.filter(
      (p) =>
        p.status === "published" &&
        (p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q)))
    );
  };

  const contextValue = useMemo(
    () => ({
        posts,
        loading,
        getPost,
        getPostById,
        createPost,
        updatePost,
        deletePost,
        publishPost,
        unpublishPost,
        incrementViews,
        likePost,
        getPublishedPosts,
        getPostsByCategory,
        searchPosts,
        categories,
      }),
    [
	createPost,
	deletePost,
	getPost,
	getPostById,
	getPostsByCategory,
	getPublishedPosts,
	incrementViews,
	likePost,
	loading,
	posts,
	publishPost,
	searchPosts,
	unpublishPost,
	updatePost
]
  );

  return (
    <BlogContext.Provider value={contextValue}>
      {children}
    </BlogContext.Provider>
  );
}

export function useBlog() {
  const context = use(BlogContext);
  if (!context) throw new Error("useBlog must be used within a BlogProvider");
  return context;
}
