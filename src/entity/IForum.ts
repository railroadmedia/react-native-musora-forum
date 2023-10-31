export interface IForum {
  id: number;
  title: string;
  slug: string;
  description: string;
  weight: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  brand: string;
  topic: string;
  icon: string;
  last_post_id: number;
  post_count: number;
  mobile_app_url: string;
  icon_path: string;
  latest_post: IPost;
}

export interface IThread {
  id: number;
  category_id: number;
  author_id: number;
  title: string;
  slug: string;
  pinned?: boolean;
  locked?: boolean;
  state: string;
  published_on: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  last_post_id: number;
  post_count: number;
  category_slug: string;
  category: string;
  is_read: boolean;
  is_followed?: boolean;
  mobile_app_url: string;
  author_display_name: string;
  author_avatar_url: string;
  author_access_level: string;
  published_on_formatted: string;
  latest_post: IPost;
  posts: IPost[];
  page: number;
}

export interface IPost {
  id: number;
  thread_id: number;
  author_id: number;
  prompting_post_id: number;
  content: string;
  state: string;
  published_on: string;
  edited_on: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  like_count: number;
  is_liked_by_viewer: boolean;
  is_reported_by_viewer: number;
  created_at_diff: string;
  published_on_formatted: string;
  author: IAuthor;
  url: string;
  author_display_name: string;
  author_avatar_url: string;
}

export interface IAuthor {
  id: number;
  display_name?: string;
  avatar_url?: string;
  total_posts?: number;
  days_as_member?: number;
  signature?: string;
  access_level?: string;
  xp?: number;
  xp_rank?: string;
  total_post_likes?: number;
  created_at?: string;
  level_rank?: string;
  associated_coach?: {
    id: number;
  };
  is_reported_by_viewer?: boolean;
}

export interface IUser {
  id?: number;
  profile_picture_url?: string;
  display_name?: string;
  totalXp?: number;
  xpRank?: string;
  level_rank?: string;
  access_level?: string;
  permission_level?: string;
}
