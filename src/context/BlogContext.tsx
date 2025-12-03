"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: {
    name: string;
    avatar: string;
  };
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
  createPost: (post: Omit<BlogPost, "id" | "createdAt" | "updatedAt" | "views" | "likes">) => Promise<BlogPost>;
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

const BlogContext = createContext<BlogContextType | undefined>(undefined);

const categories = ["Trends", "Style Guide", "Behind the Scenes", "Tips & Tricks", "Culture", "Interviews"];

// Helper to convert Firestore timestamps to Date
const convertTimestamp = (timestamp: Timestamp | Date | null): Date | null => {
  if (!timestamp) return null;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp;
};

export function BlogProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to Firestore blogs collection
  useEffect(() => {
    const blogsRef = collection(db, "blogs");
    const q = query(blogsRef, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const blogPosts: BlogPost[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: data.content,
          coverImage: data.coverImage,
          category: data.category,
          tags: data.tags || [],
          author: data.author,
          status: data.status,
          publishedAt: convertTimestamp(data.publishedAt),
          scheduledFor: convertTimestamp(data.scheduledFor),
          readTime: data.readTime,
          views: data.views || 0,
          likes: data.likes || 0,
          createdAt: convertTimestamp(data.createdAt) || new Date(),
          updatedAt: convertTimestamp(data.updatedAt) || new Date(),
        } as BlogPost;
      });
      setPosts(blogPosts);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching blogs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getPost = (slug: string) => posts.find((p) => p.slug === slug);
  const getPostById = (id: string) => posts.find((p) => p.id === id);

  const createPost = async (postData: Omit<BlogPost, "id" | "createdAt" | "updatedAt" | "views" | "likes">): Promise<BlogPost> => {
    const docRef = await addDoc(collection(db, "blogs"), {
      ...postData,
      views: 0,
      likes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    const newPost: BlogPost = {
      ...postData,
      id: docRef.id,
      views: 0,
      likes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return newPost;
  };

  const updatePost = async (id: string, updates: Partial<BlogPost>) => {
    const docRef = doc(db, "blogs", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
    });
  };

  const deletePost = async (id: string) => {
    const docRef = doc(db, "blogs", id);
    await deleteDoc(docRef);
  };

  const publishPost = async (id: string) => {
    await updatePost(id, { status: "published", publishedAt: new Date() });
  };

  const unpublishPost = async (id: string) => {
    await updatePost(id, { status: "draft", publishedAt: null });
  };

  const incrementViews = async (id: string) => {
    const post = posts.find((p) => p.id === id);
    if (post) {
      const docRef = doc(db, "blogs", id);
      await updateDoc(docRef, { views: post.views + 1 });
    }
  };

  const likePost = async (id: string) => {
    const post = posts.find((p) => p.id === id);
    if (post) {
      const docRef = doc(db, "blogs", id);
      await updateDoc(docRef, { likes: post.likes + 1 });
    }
  };

  const getPublishedPosts = () =>
    posts.filter((p) => p.status === "published").sort((a, b) => 
      (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0)
    );

  const getPostsByCategory = (category: string) =>
    posts.filter((p) => p.category === category && p.status === "published");

  const searchPosts = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return posts.filter(
      (p) =>
        p.status === "published" &&
        (p.title.toLowerCase().includes(lowercaseQuery) ||
          p.excerpt.toLowerCase().includes(lowercaseQuery) ||
          p.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery)))
    );
  };

  return (
    <BlogContext.Provider
      value={{
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
      }}
    >
      {children}
    </BlogContext.Provider>
  );
}

export function useBlog() {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error("useBlog must be used within a BlogProvider");
  }
  return context;
}
