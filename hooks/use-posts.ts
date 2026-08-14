import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, type Post, type PostPlatform, type PostStatus } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

/**
 * Calendario de Publicación — publicaciones planificadas por cliente.
 * Los datos viven en la tabla `posts` de Supabase (ver supabase/posts.sql).
 */
export function usePosts() {
  const { user } = useAuth({ autoFetch: false });
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ['posts', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId!)
        .order('publish_date', { ascending: true })
        .order('publish_time', { ascending: true, nullsFirst: true });

      if (error) throw error;
      return (data ?? []) as Post[];
    },
  });
}

export type NewPost = {
  client: string;
  platform: PostPlatform;
  title: string;
  content?: string;
  publish_date: string;
  publish_time?: string | null;
  status: PostStatus;
  link?: string | null;
};

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth({ autoFetch: false });
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: async (post: NewPost) => {
      if (!userId) throw new Error('Sesión no válida. Vuelve a iniciar sesión.');
      const { error } = await supabase.from('posts').insert([
        {
          user_id: userId,
          client: post.client,
          platform: post.platform,
          title: post.title,
          content: post.content || null,
          publish_date: post.publish_date,
          publish_time: post.publish_time || null,
          status: post.status,
          link: post.link || null,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<NewPost> & { id: string }) => {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (patch.client !== undefined) updates.client = patch.client;
      if (patch.platform !== undefined) updates.platform = patch.platform;
      if (patch.title !== undefined) updates.title = patch.title;
      if (patch.content !== undefined) updates.content = patch.content || null;
      if (patch.publish_date !== undefined) updates.publish_date = patch.publish_date;
      if (patch.publish_time !== undefined) updates.publish_time = patch.publish_time || null;
      if (patch.status !== undefined) updates.status = patch.status;
      if (patch.link !== undefined) updates.link = patch.link || null;

      const { error } = await supabase.from('posts').update(updates).eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });
}
