create or replace view public.user_reputation_scores as
select
  p.id as user_id,
  coalesce(sum(e.points), 0)::integer as shell_score,
  greatest(0, coalesce(sum(
    case
      when e.action = 'topic_star_received' then 1
      when e.action = 'topic_star_removed' then -1
      else 0
    end
  ), 0))::integer as stars_received,
  greatest(0, coalesce(sum(
    case
      when e.action = 'reply_reaction_received' then 1
      when e.action = 'reply_reaction_removed' then -1
      else 0
    end
  ), 0))::integer as reply_reactions_received,
  greatest(0, coalesce(sum(
    case
      when e.action = 'topic_created' then 1
      when e.action = 'topic_deleted' then -1
      else 0
    end
  ), 0))::integer as topics_created,
  greatest(0, coalesce(sum(
    case
      when e.action = 'reply_created' then 1
      when e.action = 'reply_deleted' then -1
      else 0
    end
  ), 0))::integer as replies_created,
  case
    when coalesce(sum(e.points), 0) >= 1000 then 'Arquitecto'
    when coalesce(sum(e.points), 0) >= 500 then 'Referente'
    when coalesce(sum(e.points), 0) >= 250 then 'Conector'
    when coalesce(sum(e.points), 0) >= 50 then 'Aportador'
    else 'Visitante'
  end as level_name,
  case
    when coalesce(sum(e.points), 0) >= 1000 then '1000+'
    when coalesce(sum(e.points), 0) >= 500 then '500 - 999'
    when coalesce(sum(e.points), 0) >= 250 then '250 - 499'
    when coalesce(sum(e.points), 0) >= 50 then '50 - 249'
    else '0 - 49'
  end as level_range
from public.profiles p
left join public.user_reputation_events e on e.target_user_id = p.id
group by p.id;

create or replace view public.user_reputation_badges as
select
  s.user_id,
  array_remove(array[
    case when s.topics_created + s.replies_created >= 1 then 'Primer aporte' end,
    case when s.stars_received >= 10 then 'Chispa inicial' end,
    case when s.reply_reactions_received >= 25 then 'Voz útil' end,
    case when s.topics_created >= 25 then 'Constructor' end,
    case when s.replies_created >= 100 then 'Conversador' end,
    case when s.stars_received >= 50 then 'Referencia' end,
    case when s.shell_score >= 250 then 'Conector' end,
    case when s.shell_score >= 1000 then 'Arquitecto' end
  ], null) as badges
from public.user_reputation_scores s;
