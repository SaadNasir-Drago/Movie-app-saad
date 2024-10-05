//db
import { Sequelize } from "sequelize";
import UserModel from "../models/User";
import MovieModel from "../models/Movie";
import GenreModel from "../models/Genre";
import MovieGenreModel from "../models/MovieGenre";
import ReviewModel from "../models/Review";
import WatchListModel from "../models/WatchList";
import UserMovieModel from "../models/UserMovie";

const sequelize = new Sequelize("moviewebapp", "postgres", "root", {
  host: "localhost",
  dialect: "postgres",
  // Disable automatic syncing
  // synchronize: false,
});

const User = UserModel(sequelize);
const Movie = MovieModel(sequelize);
const Genre = GenreModel(sequelize);
const MovieGenre = MovieGenreModel(sequelize);
const Review = ReviewModel(sequelize);
const WatchList = WatchListModel(sequelize);
const UserMovie = UserMovieModel(sequelize);

Movie.belongsToMany(Genre, {
  through: MovieGenre,
  foreignKey: "movieID",
  onDelete: "CASCADE",
});
Genre.belongsToMany(Movie, {
  through: MovieGenre,
  foreignKey: "genreID",
  onDelete: "CASCADE",
});

User.hasMany(Review, { foreignKey: "userID", onDelete: "CASCADE" });
Review.belongsTo(User, { foreignKey: "userID", onDelete: "CASCADE" });

Movie.hasMany(Review, { foreignKey: "movieID", onDelete: "CASCADE" });
Review.belongsTo(Movie, { foreignKey: "movieID", onDelete: "CASCADE" });

User.belongsToMany(Movie, {
  through: WatchList,
  foreignKey: "userID",
  onDelete: "CASCADE",
});
Movie.belongsToMany(User, {
  through: WatchList,
  foreignKey: "movieID",
  onDelete: "CASCADE",
});

// Define explicit associations between WatchList and User, Movie
WatchList.belongsTo(User, { foreignKey: "userID", onDelete: "CASCADE" });
WatchList.belongsTo(Movie, { foreignKey: "movieID", onDelete: "CASCADE" });

// Define associations for UserMovie
User.belongsToMany(Movie, {
  through: UserMovie,
  foreignKey: "userID",
  onDelete: "CASCADE",
});
Movie.belongsToMany(User, {
  through: UserMovie,
  foreignKey: "movieID",
  onDelete: "CASCADE",
});

export default sequelize;
export { User, Movie, Genre, MovieGenre, Review, WatchList, UserMovie };
