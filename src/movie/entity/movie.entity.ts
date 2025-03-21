import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { MovieDetail } from "./movie-detail.entity";
import { BaseTable } from "src/common/entity/base-table.entity";
import { Director } from "src/director/entitiy/director.entity";
import { Genre } from "src/genre/entities/genre.entity";

/// Many to One: Director -> 감독은 여러 개의 영화를 만들 수 있음
/// One to One: MovieDetail -> 영화는 하나의 상세 내용을 갖을 수 있음
/// Many to Many: Genre -> 영화는 여러 개의 장르를 갖을 수 있고, 여러 개의 영화에 속할 수 있음

@Entity()
export class Movie extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  title: string;

  @ManyToMany(
    () => Genre,
    genre => genre.movies,
  )
  @JoinTable()
  genres: Genre[];

  @OneToOne(
    () => MovieDetail,
    mvieDetail => mvieDetail.id,
    {
      cascade: true,
      nullable: false,
    }
  )
  @JoinColumn()
  detail: MovieDetail;

  @Column()
  movieFilePath: string;

  @ManyToOne(
    () => Director,
    director => director.id,
    {
      cascade: true,
      nullable: false,
    }
  )
  director: Director;
}