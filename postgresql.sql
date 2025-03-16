-- Part8 데이터베이스 ch01 SQL 
-- movie table 생성
create table
   movie (id serial primary key, title text, genre text);

-- movie table 삭제
drop table movie;

-- 데이터 추가
insert into
   movie (title, genre)
values
   ('Inception', 'Sci-Fi'),
   ('The Godfather', 'Crime'),
   ('The Dark Knight', 'Action'),
   ('Pulp Fiction', 'Crime'),
   ('Forrest Gump', 'Drama');

-- SELECT (조회)
select
   *
from
   movie;

select
   title,
   genre
from
   moive;

select
   *
from
   movie
where
   genre = 'Crime';

select
   *
from
   movie
order by
   id desc;

select
   count(*)
from
   movie;

select
   genre,
   count(*)
from
   movie
group by
   genre;

select
   genre,
   count(*)
from
   movie
group by
   genre
having
   count(*) > 1;

-- UPDATE (수정)
update movie
set
   genre = 'Science Fiction'
where
   title = 'Inception';

update movie
set
   genre = 'Drama'
where
   genre = 'Crime';

-- DELETE (삭제)
delete from movie
where
   title = 'Forrest Gump';

delete from movie
where
   genre = 'Drama';

-- Join (조인)
create table
   director (id serial primary key, name text);

insert into
   director (name)
values
   ('Christopher Nolan'),
   ('Francis Ford Coppola'),
   ('Quentin Tarantino');

select
   *
from
   director;

ALTER TABLE movie
ADD COLUMN director_id INTEGER,
Add CONSTRAINT fk_director foreign key (director_id) references director (id);

UPDATE movie
SET
   director_id = (
      select
         id
      from
         director
      where
         name = 'Christopher Nolan'
   )
where
   title in ('Inception', 'The Dark Knight');

UPDATE movie
SET
   director_id = (
      select
         id
      from
         director
      where
         name = 'Francis Ford Coppola'
   )
where
   title = 'The Godfather';

UPDATE movie
SET
   director_id = (
      select
         id
      from
         director
      where
         name = 'Quentin Tarantino'
   )
where
   title = 'Pulp Fiction';

SELECT
   m.title,
   m.genre,
   d.name
FROM
   movie m
   Join director d on m.director_id = d.id;