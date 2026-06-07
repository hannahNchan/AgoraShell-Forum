create or replace function public.get_topic_reply_threads_page(
  p_topic_id uuid,
  p_limit integer default 20,
  p_offset integer default 0
)
returns setof public.replies
language sql
stable
security invoker
set search_path = public
as $$
  with recursive root_page as (
    select replies.id
    from public.replies
    where replies.topic_id = p_topic_id
      and replies.parent_id is null
    order by replies.created_at asc, replies.id asc
    limit greatest(p_limit, 0)
    offset greatest(p_offset, 0)
  ),
  thread_replies as (
    select replies.*
    from public.replies
    join root_page on root_page.id = replies.id

    union all

    select child.*
    from public.replies child
    join thread_replies parent on child.parent_id = parent.id
    where child.topic_id = p_topic_id
  )
  select *
  from thread_replies
  order by created_at asc, id asc;
$$;

create or replace function public.get_reply_thread_by_reply_id(
  p_reply_id uuid
)
returns setof public.replies
language sql
stable
security invoker
set search_path = public
as $$
  with recursive ancestors as (
    select replies.*
    from public.replies
    where replies.id = p_reply_id

    union all

    select parent.*
    from public.replies parent
    join ancestors child on child.parent_id = parent.id
  ),
  root_reply as (
    select ancestors.id, ancestors.topic_id
    from ancestors
    where ancestors.parent_id is null
    limit 1
  ),
  thread_replies as (
    select replies.*
    from public.replies
    join root_reply on root_reply.id = replies.id

    union all

    select child.*
    from public.replies child
    join thread_replies parent on child.parent_id = parent.id
    join root_reply on root_reply.topic_id = child.topic_id
  )
  select *
  from thread_replies
  order by created_at asc, id asc;
$$;
