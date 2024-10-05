import { Request, Response } from "express";
import sequelize, {
  Genre,
  Movie,
  MovieGenre,
  Review,
  User,
  UserMovie,
  WatchList,
} from "../config/database";
import reviewSchema from "../helpers/reviewValidation";
import { Op } from "sequelize";

import path from "path";
import sharp from "sharp";
import multer from "multer";
import { upload } from "../helpers/multer";
import { Client as ElasticsearchClient } from "@elastic/elasticsearch";

// Elasticsearch client setup
const esClient = new ElasticsearchClient({
  node: "https://localhost:9200/",
  auth: {
    username: "elastic",
    password: "cmSUa+=J61MaYudG_TiL",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

//
//elastic query works without watchlist
// const getAllMovies = async (req: Request, res: Response) => {
//   try {
//     const page = parseInt(req.query.page as string) || 1;
//     const limit = parseInt(req.query.limit as string) || 20;
//     const from = (page - 1) * limit;

//     const { genre, rating, type, certificate, search } = req.query;

//     // Build Elasticsearch query
//     const esQuery: any = {
//       bool: {
//         must: [],
//         filter: [],
//       },
//     };

//     // Add search query if provided
//     if (search) {
//       esQuery.bool.must.push({
//         bool: {
//           should: [
//             {
//               prefix: {
//                 name: {
//                   value: search,
//                   boost: 3,
//                 },
//               },
//             },
//             {
//               match_phrase_prefix: {
//                 name: {
//                   query: search,
//                   boost: 2,
//                 },
//               },
//             },
//             {
//               match_phrase_prefix: {
//                 description: search,
//               },
//             },
//           ],
//           minimum_should_match: 1,
//         },
//       });
//     }
//     // Add filters
//     if (genre) {
//       esQuery.bool.filter.push({ term: { genres: genre } });
//     }
//     if (rating) {
//       switch (rating) {
//         case "1":
//           // Rating less than or equal to 5
//           esQuery.bool.filter.push({
//             range: { rating: { gte: 8 } },
//           });
//           break;
//         case "2":
//           // Rating greater than or equal to 8
//           // Rating between 5 and 8 (inclusive)
//           esQuery.bool.filter.push({
//             range: { rating: { gte: 5, lte: 8 } },
//           });
//           break;
//         case "3":
//           esQuery.bool.filter.push({
//             range: { rating: { lt: 5 } },
//           });
//           break;
//       }
//     }
//     if (type) {
//       esQuery.bool.filter.push({ term: { type: type } });
//     }
//     if (certificate) {
//       esQuery.bool.filter.push({ term: { certificate: certificate } });
//     }

//     // Execute Elasticsearch search
//     const searchResponse = await esClient.search({
//       index: "movies",
//       body: {
//         from,
//         size: limit,
//         query: esQuery,
//         sort: [{ createdAt: "desc" }],
//       },
//       track_total_hits: true,
//     });

//     // Extract hits and total from the response
//     const hits = searchResponse.hits.hits;
//     const totalMovies = searchResponse.hits.total as { value: number };

//     // Get all movie IDs from the Elasticsearch results
//     const movieIDs = hits.map((hit: any) => hit._id);

//     // Fetch current ratings from the database
//     const moviesWithRatings = await Movie.findAll({
//       attributes: ["movieID", "rating"],
//       where: { movieID: { [Op.in]: movieIDs } },
//     });

//     // Create a map of movieID to rating
//     const ratingMap = new Map(
//       moviesWithRatings.map((movie: any) => [movie.movieID, movie.rating])
//     );

//     // Map Elasticsearch results to the desired format
//     const movies = hits.map((hit: any) => ({
//       movieID: hit._id,
//       name: hit._source.name,
//       thumbnailUrl: hit._source.thumbnailUrl,
//       rating: ratingMap.get(parseInt(hit._id ?? "")) ?? null,
//       type: hit._source.type,
//       certificate: hit._source.certificate,
//       createdAt: hit._source.createdAt,
//       genres: hit._source.genres,
//     }));

//     const totalPages = Math.ceil(totalMovies.value / limit);

//     res.status(200).json({
//       message: "Movies fetched successfully",
//       currentPage: page,
//       totalPages,
//       totalMovies: totalMovies.value,
//       limit,
//       offset: from,
//       movies,
//     });
//   } catch (error) {
//     console.error("Error fetching movies:", error);
//     return res.status(400).json({
//       message: "Failed to fetch movies",
//       error: (error as Error).message,
//     });
//   }
// };

// export default getAllMovies;


//oldgetallmovies
// All movies with filtering
const getAllMovies = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const { genre, rating, type, certificate, search } = req.query;

    const whereClause: any = {};

    if (rating) {
      whereClause.rating = { [Op.gte]: parseInt(rating as string) };
    }
    if (type) {
      whereClause.type = type;
    }
    if (certificate) {
      whereClause.certificate = certificate;
    }
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const genreFilter = genre ? { genreName: genre } : {};

    const { rows: allMovies, count: totalMovies } = await Movie.findAndCountAll(
      {
        where: whereClause,
        include: [
          {
            model: Genre,
            where: genreFilter,
            attributes: ["genreName"],
            through: { attributes: [] },
          },
        ],
        attributes: [
          "movieID",
          "name",
          "thumbnailUrl",
          "rating",
          "type",
          "certificate",
          "createdAt",
        ],
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      }
    );

    const totalPages = Math.ceil(totalMovies / limit);

    res.status(200).json({
      message: "Movies fetched successfully",
      currentPage: page,
      totalPages,
      totalMovies,
      limit,
      offset,
      movies: allMovies,
    });
  } catch (error) {
    return res.status(400).json({ message: "Failed to fetch movies", error });
  }
};
// oldgetallmovies end

export const createMovie = async (req: Request, res: Response) => {
  if (!req.user || !req.user.userID) {
    return res
      .status(401)
      .json({ message: "Unauthorized: User not authenticated" });
  }
  const userID = parseInt(req.user?.userID);

  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: "Unknown error occurred" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      // Check if there's a file and retrieve its path
      let imagePath;
      if (req.file) {
        const compressedFileName = `compressed-${req.file.filename}`;
        const compressedImagePath = path.join("uploads", compressedFileName);

        // Compress and save the image locally
        await sharp(req.file.path)
          .resize(600) // Resize the image to 600px width
          .jpeg({ quality: 60 }) // Compress the image
          .toFile(compressedImagePath); // Save the compressed image locally

        imagePath = `/${compressedFileName}`; // Store the path to the compressed image without 'uploads'
      }
      const newMovie = await Movie.create({
        name: req.body.name,
        releaseYear: parseInt(req.body.releaseYear), //validTE LATER
        duration: parseInt(req.body.duration),
        type: req.body.type,
        certificate: req.body.certificate,
        description: req.body.description,
        thumbnailUrl: imagePath,
      });

      // Find or create genres and associate them
      // console.log(`req.body.genres    ${typeof req.body.genres}`);
      if (req.body.genres) {
        const genres = await Genre.findAll({
          where: { genreID: req.body.genres },
        });

        if (genres.length !== req.body.genres.length) {
          return res
            .status(400)
            .json({ error: "One or more genres are invalid" });
        }

        // Populate MovieGenre join table
        await MovieGenre.bulkCreate(
          genres.map((genre) => ({
            movieID: newMovie.movieID,
            genreID: genre.genreID,
          }))
        );
      }
      //populate usermovie table
      await UserMovie.create({
        movieID: newMovie.movieID,
        userID: userID,
      });

      return res.status(201).json(newMovie);
    } catch (error) {
      return res.status(400).json({ message: error });
    }
  });
};
//
//
//
//
//
//
//get all user m
export const getAllUserMovies = async (req: Request, res: Response) => {
  // Check if the user is authenticated
  if (!req.user || !req.user.userID) {
    return res
      .status(401)
      .json({ message: "Unauthorized: User not authenticated" });
  }

  const userID = parseInt(req.user.userID);

  try {
    // Find all movies created by the user using the UserMovie table
    const userMovies = await UserMovie.findAll({
      where: { userID },
      attributes: ["movieID"],
    });
    // console.log(`userMovies    ${JSON.stringify(userMovies)}`);
    if (!userMovies)
      return res
        .status(400)
        .json({ message: "User has not created any movies" });

    // Extract movieIDs from the result
    const movieIDs = userMovies.map((um) => um.movieID);

    // Now, fetch movie details for these movieIDs
    const movieDetails = await Movie.findAll({
      where: {
        movieID: {
          [Op.in]: movieIDs,
        },
      },
      attributes: [
        "movieID",
        "name",
        "releaseYear",
        "rating",
        "votes",
        "duration",
        "type",
        "certificate",
        "description",
        "thumbnailUrl",
        "createdAt",
      ],
      order: [["createdAt", "DESC"]], // Sort by createdAt in descending order
    });

    return res.status(200).json(movieDetails);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to retrieve user movies",
    });
  }
};

//update
// export const updateMovie = async (req: Request, res: Response) => {
//   if (!req.user || !req.user.userID) {
//     return res
//       .status(401)
//       .json({ message: "Unauthorized: User not authenticated" });
//   }
//   const userID = parseInt(req.user.userID);
//   const { id } = req.params;
//   const movieID = parseInt(id);

//   if (isNaN(movieID)) {
//     return res.status(400).json({ message: "Invalid movie ID" });
//   }

//   upload(req, res, async (err) => {
//     if (err instanceof multer.MulterError) {
//       return res.status(400).json({ error: err.message });
//     } else if (err) {
//       return res.status(400).json({ error: "Unknown error occurred" });
//     }

//     try {
//       // Check if the movie exists and belongs to the user
//       const userMovie = await UserMovie.findOne({
//         where: { userID, movieID },
//       });

//       if (!userMovie) {
//         return res
//           .status(404)
//           .json({ message: "Movie not found or does not belong to this user" });
//       }

//       const movie = await Movie.findByPk(movieID);
//       if (!movie) {
//         return res.status(404).json({ message: "Movie not found" });
//       }

//       // Process new image if uploaded
//       let imagePath = movie.thumbnailUrl;
//       if (req.file) {
//         const compressedFileName = `compressed-${req.file.filename}`;
//         const compressedImagePath = path.join("uploads", compressedFileName);

//         await sharp(req.file.path)
//           .resize(600)
//           .jpeg({ quality: 60 })
//           .toFile(compressedImagePath);

//         imagePath = `/${compressedFileName}`;
//       }

//       // Update movie details
//       const updatedMovie = await movie.update({
//         name: req.body.name || movie.name,
//         releaseYear: parseInt(req.body.releaseYear) || movie.releaseYear,
//         duration: parseInt(req.body.duration) || movie.duration,
//         type: req.body.type || movie.type,
//         certificate: req.body.certificate || movie.certificate,
//         description: req.body.description || movie.description,
//         thumbnailUrl: imagePath,
//       });

//       // Update genres if provided
//       let genres: GenreAttributes[] = [];
//       if (req.body.genres) {
//         // Remove existing genres
//         await MovieGenre.destroy({ where: { movieID } });

//         // Add new genres
//         const genres = await Genre.findAll({
//           where: { genreID: req.body.genres },
//         });

//         if (genres.length !== req.body.genres.length) {
//           return res
//             .status(400)
//             .json({ error: "One or more genres are invalid" });
//         }

//         await MovieGenre.bulkCreate(
//           genres.map((genre) => ({
//             movieID: movie.movieID,
//             genreID: genre.genreID,
//           }))
//         );
//       } else {
//         // If genres are not provided, fetch existing genres
//         genres = await Genre.findAll({
//           include: [
//             {
//               model: Movie,
//               where: { movieID },
//               through: { attributes: [] },
//             },
//           ],
//         });
//       }
//       console.log("yoo bro = " + genres);
//       // Update the movie in Elasticsearch
//       const esDocument = {
//         name: updatedMovie.name,
//         releaseYear: updatedMovie.releaseYear,
//         duration: updatedMovie.duration,
//         type: updatedMovie.type,
//         certificate: updatedMovie.certificate,
//         description: updatedMovie.description,
//         thumbnailUrl: updatedMovie.thumbnailUrl,
//         genres: genres.map((genre) => genre.genreName),
//         updatedAt: new Date().toISOString(),
//       };

//       esClient.update({
//         index: "movies",
//         id: movieID.toString(),
//         body: {
//           doc: esDocument,
//         },
//       });

//       return res
//         .status(200)
//         .json({ message: "Movie updated successfully", movie });
//     } catch (error) {
//       console.error("Error in updateMovie:", error);
//       return res.status(500).json({ message: "Failed to update movie" });
//     }
//   });
// };

//
//
//
//
//
//update movie dbquery
export const updateMovie = async (req: Request, res: Response) => {
  if (!req.user || !req.user.userID) {
    return res
      .status(401)
      .json({ message: "Unauthorized: User not authenticated" });
  }
  const userID = parseInt(req.user.userID);
  const { id } = req.params;
  const movieID = parseInt(id);

  if (isNaN(movieID)) {
    return res.status(400).json({ message: "Invalid movie ID" });
  }

  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: "Unknown error occurred" });
    }

    try {
      // Check if the movie exists and belongs to the user
      const userMovie = await UserMovie.findOne({
        where: { userID, movieID },
      });

      if (!userMovie) {
        return res
          .status(404)
          .json({ message: "Movie not found or does not belong to this user" });
      }

      const movie = await Movie.findByPk(movieID);
      if (!movie) {
        return res.status(404).json({ message: "Movie not found" });
      }

      // Process new image if uploaded
      let imagePath = movie.thumbnailUrl;
      if (req.file) {
        const compressedFileName = `compressed-${req.file.filename}`;
        const compressedImagePath = path.join("uploads", compressedFileName);

        await sharp(req.file.path)
          .resize(600)
          .jpeg({ quality: 60 })
          .toFile(compressedImagePath);

        imagePath = `/${compressedFileName}`;
      }

      // Update movie details
      await movie.update({
        name: req.body.name || movie.name,
        releaseYear: parseInt(req.body.releaseYear) || movie.releaseYear,
        duration: parseInt(req.body.duration) || movie.duration,
        type: req.body.type || movie.type,
        certificate: req.body.certificate || movie.certificate,
        description: req.body.description || movie.description,
        thumbnailUrl: imagePath,
      });

      // Update genres if provided
      if (req.body.genres) {
        // Remove existing genres
        await MovieGenre.destroy({ where: { movieID } });

        // Add new genres
        const genres = await Genre.findAll({
          where: { genreID: req.body.genres },
        });

        if (genres.length !== req.body.genres.length) {
          return res
            .status(400)
            .json({ error: "One or more genres are invalid" });
        }

        await MovieGenre.bulkCreate(
          genres.map((genre) => ({
            movieID: movie.movieID,
            genreID: genre.genreID,
          }))
        );
      }

      return res
        .status(200)
        .json({ message: "Movie updated successfully", movie });
    } catch (error) {
      console.error("Error in updateMovie:", error);
      return res.status(500).json({ message: "Failed to update movie" });
    }
  });
};

//
//
//
//
//
//
//
//

// const deleteMovie = async (req: Request, res: Response) => {
//   if (!req.user || !req.user.userID) {
//     return res
//       .status(401)
//       .json({ message: "Unauthorized: User not authenticated" });
//   }
//   const userID = parseInt(req.user.userID);
//   const { id } = req.params;
//   const movieID = parseInt(id);

//   if (isNaN(movieID)) {
//     return res.status(400).json({ message: "Invalid movie ID" });
//   }

//   try {
//     const userMovie = await UserMovie.findOne({
//       where: { userID, movieID },
//     });
//     if (!userMovie) {
//       return res
//         .status(404)
//         .json({ message: "Review not found or does not belong to this user" });
//     }
//     // Delete
//     await userMovie.destroy();
//     // Delete the movie from the user's watchlist
//     await WatchList.destroy({
//       where: { movieID },
//     });
//     // Check if the movie exists in the Movie table
//     const movie = await Movie.findOne({
//       where: { movieID },
//     });

//     if (movie) {
//       await movie.destroy();
//       // Delete from Elasticsearch index
//       try {
//         esClient.delete({
//           index: "movies",
//           id: movieID.toString(),
//         });
//       } catch (esError) {
//         console.error("Error deleting movie from Elasticsearch:", esError);
//         // Note: We're not returning here because we want to inform the user that
//         // the movie was deleted from the database even if Elasticsearch deletion failed
//       }
//     }
//     return res.status(200).json({ message: "Movie successfully deleted" });
//   } catch (error) {
//     return res.status(500).json({ message: "Failed to delete movie" });
//   }
// };

//
//
//
//
//
//old dbquery
const deleteMovie = async (req: Request, res: Response) => {
  if (!req.user || !req.user.userID) {
    return res
      .status(401)
      .json({ message: "Unauthorized: User not authenticated" });
  }
  const userID = parseInt(req.user.userID);
  const { id } = req.params;
  const movieID = parseInt(id);
  if (isNaN(movieID)) {
    return res.status(400).json({ message: "Invalid movie ID" });
  }
  try {
    const userMovie = await UserMovie.findOne({
      where: { userID, movieID },
    });
    if (!userMovie) {
      return res
        .status(404)
        .json({ message: "Review not found or does not belong to this user" });
    }
    // Delete
    await userMovie.destroy();
    // Check if the movie exists in the Movie table
    const movie = await Movie.findOne({
      where: { movieID },
    });
    if (movie) {
      await movie.destroy();
    }
    return res.status(200).json({ message: "Movie successfully deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete movie" });
  }
};
//
//
//
//
//
//

//one movie details + reviews
//works but slow
// const getMoviebyPK = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;

//     // Fetch the current movie details with reviews and genres
//     const movie = await Movie.findByPk(id, {
//       include: [
//         {
//           model: Review,
//           attributes: ["reviewID", "userID", "rating", "review", "createdAt"],
//           include: [
//             {
//               model: User,
//               attributes: ["username"],
//             },
//           ],
//         },
//         {
//           model: Genre,
//           through: { attributes: [] }, // Prevents the junction table attributes from being returned
//           attributes: ["genreName"],
//         },
//       ],
//     });

//     if (!movie) return res.status(400).json({ message: "Movie not found" });

//     // Cast the movie result to MovieWithGenres
//     const movieWithGenres = movie as any;

//     // Extract the genre names of the current movie
//     const genres = movieWithGenres.Genres.map((genre: any) => genre.genreName);

//     // Fetch 6 random movies with at least one matching genre
//     const randomMovies = await Movie.findAll({
//       where: {
//         movieID: { [Op.ne]: id }, // Exclude the current movie
//       },
//       include: [
//         {
//           model: Genre,
//           attributes: [],
//           where: {
//             genreName: {
//               [Op.in]: genres, // Match genres with the current movie
//             },
//           },
//         },
//       ],
//       attributes: ["movieID", "name", "thumbnailUrl", "rating"],
//       order: sequelize.random(), // Get random movies
//       limit: 6,
//     });

//     // Respond with movie details and random movies
//     res.status(200).json({
//       message: "get movie details successful",
//       movie,
//       randomMovies,
//     });
//   } catch (error) {
//     return res.status(400).json({ message: "failed to fetch movie" });
//   }
// };
//okay code plus username
const getMoviebyPK = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findByPk(id, {
      include: [
        {
          model: Review,
          attributes: ["reviewID", "userID", "rating", "review", "createdAt"],
          include: [
            {
              model: User,
              attributes: ["username"],
            },
          ],
        },
        {
          model: Genre,
          through: { attributes: [] }, // This prevents the junction table attributes from being returned
          attributes: ["genreName"],
        },
      ],
    });
    if (!movie) return res.status(400).json({ message: "Movie not found" });
    res.status(200).json({ message: "get movie details successful", movie });
  } catch (error) {
    return res.status(400).json({ message: "failed to fetch movie" });
  }
};

const fetchReview = async (req: Request, res: Response) => {
  const { id } = req.params;
  const movieID = parseInt(id);
  try {
    const reviews = await Review.findAll({
      where: { movieID: movieID },
      attributes: ["reviewID", "userID", "rating", "review", "createdAt"],
    });
    res.json(reviews);
  } catch (error) {
    return res.status(400).json({ message: "failed to fetch reviews" });
  }
};

//posting review
const addReview = async (req: Request, res: Response) => {
  const { id } = req.params;
  const movieID = parseInt(id);
  const { rating, review } = req.body;

  if (!req.user || !req.user.userID) {
    return res
      .status(401)
      .json({ message: "Unauthorized: User not authenticated" });
  }
  const userID = parseInt(req.user?.userID);

  try {
    const movie = await Movie.findByPk(movieID);
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    const reviewValidation = reviewSchema.safeParse({
      userID,
      movieID,
      rating,
      review,
    });

    if (!reviewValidation.success) {
      //validation for review inputs
      return res.status(400).json({
        errors: reviewValidation.error.format(),
      });
    }

    // Find if the user has already given a review/rating for this movie
    const existingReview = await Review.findOne({
      where: { movieID: movieID, userID: userID },
    });

    if (existingReview) {
      // If a review/rating exists, update it with the new values
      const updatedReview = await existingReview.update({
        rating: rating || existingReview.rating, // Preserve the old rating if no new one is provided
        review: review || existingReview.review, // Preserve the old review if no new one is provided
      });

      // No need to increment the vote count since it's an update
      const allReviews = await Review.findAll({ where: { movieID: movieID } });
      const totalRating = allReviews.reduce(
        (acc, curr) => acc + (curr.rating || 0),
        0
      );
      const averageRating = totalRating / allReviews.length;

      // Update the movie's average rating
      await movie.update({
        rating: averageRating,
      });

      return res.status(200).json(updatedReview);
    } else {
      // If no review/rating exists, create a new one
      const newReview = await Review.create({
        movieID: movieID,
        userID: userID,
        rating: rating || null,
        review: review || null,
      });

      const currentVotes = movie.votes ?? 0;
      const currentRating = movie.rating ?? 0;

      // Increment the vote count
      const newVoteCount = currentVotes + 1;
      const newTotalRating = currentRating * currentVotes + rating;
      const newAverageRating = newTotalRating / newVoteCount;

      // Update the movie with the new vote count and average rating
      await movie.update({
        votes: newVoteCount,
        rating: newAverageRating,
      });

      return res.status(201).json(newReview);
    }
  } catch (error) {
    return res.status(500).json({ error: "failed to add review/rating" });
  }
};

const deleteReview = async (req: Request, res: Response) => {
  const { id } = req.params;
  const movieID = parseInt(id);
  const { reviewID } = req.body;
  if (!req.user || !req.user.userID) {
    return res
      .status(401)
      .json({ message: "Unauthorized: User not authenticated" });
  }
  const userID = parseInt(req.user.userID);
  try {
    const review = await Review.findOne({
      where: { reviewID, movieID, userID },
    });
    if (!review) {
      return res
        .status(404)
        .json({ message: "Review not found or does not belong to this user" });
    }
    // Delete the review
    await review.destroy();

    // Recalculate the movie's votes and average rating
    const movie = await Movie.findByPk(movieID);
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    const currentVotes = movie.votes ?? 0;

    if (currentVotes > 1) {
      // Get all remaining reviews for this movie
      const allReviews = await Review.findAll({ where: { movieID } });
      const totalRating = allReviews.reduce(
        (acc, curr) => acc + (curr.rating || 0),
        0
      );
      const newAverageRating = Math.round(totalRating / allReviews.length);

      // Update movie votes and rating
      await movie.update({
        votes: currentVotes - 1,
        rating: newAverageRating,
      });
    } else {
      // If no more reviews, reset rating and votes
      await movie.update({
        votes: 0,
        rating: 0,
      });
    }

    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete review" });
  }
};

//old one
// const deleteReview = async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const movieID = parseInt(id);
//   const { reviewID } = req.body;
//   if (!req.user || !req.user.userID) {
//     return res
//       .status(401)
//       .json({ message: "Unauthorized: User not authenticated" });
//   }
//   const userID = parseInt(req.user.userID);
//   try {
//     // Find the review
//     const review = await Review.findOne({
//       where: { reviewID, movieID, userID },
//     });

//     // If the review does not exist or does not belong to the user, return 404
//     if (!review) {
//       return res
//         .status(404)
//         .json({ message: "Review not found or does not belong to this user" });
//     }

//     // Delete the review
//     await review.destroy();

//     return res.status(200).json({ message: "Review deleted successfully" });
//   } catch (error) {
//     return res.status(500).json({ message: "Failed to delete review" });
//   }
// };

export {
  getAllMovies,
  getMoviebyPK,
  fetchReview,
  addReview,
  deleteReview,
  deleteMovie,
};
