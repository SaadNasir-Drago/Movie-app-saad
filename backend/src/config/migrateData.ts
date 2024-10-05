

import { faker } from "@faker-js/faker";
import sequelize, { Genre, Movie, MovieGenre } from "./database";

const insertFakeMoviesInChunks = async (chunkSize: number) => {
  try {
    // Ensure the connection is established
    await sequelize.authenticate();

    // Fetch all genres from the database
    const genres = await Genre.findAll();

    for (let i = 0; i < 10000; i += chunkSize) {
      const moviesData = [];
      const movieGenreData = [];

      for (let j = 0; j < chunkSize && i + j < 100000; j++) {
        // Create movie data
        const movie = {
          name: faker.lorem.words(3),
          releaseYear: faker.date.past({ years: 30 }).getFullYear(),
          rating: parseFloat((Math.random() * 10).toFixed(1)), // Rating between 0 and 10
          thumbnailUrl: faker.image.url(),
          votes: faker.number.int({ min: 1000, max: 50000 }),
          duration: faker.number.int({ min: 90, max: 180 }), // Duration between 90 and 180 mins
          type: faker.helpers.arrayElement(["Film", "Series"]),
          certificate: faker.helpers.arrayElement([
            "PG-13",
            "R",
            "TV-MA",
            "TV-14",
            "TV-PG",
            "PG",
            "TV-G",
            "(Banned)",
            "Not Rated",
            "E",
            "NC-17",
            "TV-Y7-FV",
            "TV-Y7",
            "Unrated",
            "Approved",
            "G",
            "TV-Y",
            "GP",
            "Passed",
            "M",
            "X",
            "M/PG",
          ]),
          description: faker.lorem.paragraph(),
        };

        moviesData.push(movie);

        // Randomly assign between 1 to 3 genres per movie
        const randomGenres = faker.helpers.arrayElements(
          genres,
          faker.number.int({ min: 1, max: 3 })
        );

        for (const genre of randomGenres) {
          movieGenreData.push({
            movieID: i + j + 1, // This assumes auto-increment starts at 1 and matches the index
            genreID: genre.genreID,
          });
        }
      }

      // Insert the movies in bulk
      await Movie.bulkCreate(moviesData, { ignoreDuplicates: true });

      // Insert the movie-genre relationships in bulk
      await MovieGenre.bulkCreate(movieGenreData, { ignoreDuplicates: true });

      console.log(`Inserted ${i + chunkSize} movies`);
    }

    console.log(
      "100,000 movies and their associated genres have been inserted."
    );
  } catch (error) {
    console.error("Error inserting data:", error);
  } finally {
    // Close the database connection
    await sequelize.close();
  }
};

// // Call the function to start inserting data in chunks of 10,000
insertFakeMoviesInChunks(1000);
//
//
//
//
//

//
//
//
//
//
//
//
//
//
//
// import sequelize, { Movie, Genre, MovieGenre } from "./database";

// // Helper function to get random elements from an array
// function getRandomGenres(genreIDs: number[], count: number): number[] {
//   const shuffled = [...genreIDs].sort(() => 0.5 - Math.random());
//   return shuffled.slice(0, count);
// }

// // Function to insert random genres for each movie
// async function insertRandomGenres() {
//   try {
//     // Start transaction
//     const transaction = await sequelize.transaction();

//     // Fetch all movieIDs
//     const movies = await Movie.findAll({
//       attributes: ["movieID"],
//       raw: true, // To get plain data
//     });

//     // Fetch all genreIDs
//     const genres = await Genre.findAll({
//       attributes: ["genreID"],
//       raw: true,
//     });

//     const genreIDs = genres.map((genre) => genre.genreID);

//     // For each movie, insert three random genres
//     for (const movie of movies) {
//       const movieID = movie.movieID;

//       // Get three random genreIDs
//       const randomGenres = getRandomGenres(genreIDs, 3);

//       // Insert into MovieGenre table
//       for (const genreID of randomGenres) {
//         await MovieGenre.create(
//           { movieID, genreID },
//           { transaction } // Ensure this runs inside the transaction
//         );
//       }
//     }

//     // Commit the transaction
//     await transaction.commit();
//     console.log("Random genres inserted successfully.");
//   } catch (error) {
//     console.error("Error inserting random genres:", error);
//     // Rollback in case of any error
//     // await sequelize.transaction.rollback();
//   }
// }

// // Execute the random genre insertion
// insertRandomGenres();
//
//
//
//
//
//
//
//
//
//

//
//
//
//
//
// import fs from "fs";
// import path from "path";
// import csvParser from "csv-parser";
// import sequelize, { Genre, Movie, MovieGenre } from "./database";

// const csvFilePath = path.join(__dirname, "imdb.csv");
// // Helper function to parse numbers safely
// function parseNumber(value: string | undefined | null): number | null {
//   if (
//     value === undefined ||
//     value === null ||
//     value === "NaN" ||
//     value === "No Rate"
//   ) {
//     return null;
//   }
//   const number = parseFloat(value);
//   return isNaN(number) ? null : number;
// }

// // Helper function to parse integers safely
// function parseInteger(value: string | undefined | null): number | null {
//   if (
//     value === undefined ||
//     value === null ||
//     value === "NaN" ||
//     value === "No Rate"
//   ) {
//     return null;
//   }
//   const integer = parseInt(value, 10);
//   return isNaN(integer) ? null : integer;
// }

// // Function to insert or fetch genre from the database
// async function getOrCreateGenre(genreName: string): Promise<number> {
//   if (!genreName) return -1; // Return -1 for null/empty genres
//   const [genre, created] = await Genre.findOrCreate({
//     where: { genreName },
//   });
//   return genre.genreID;
// }

// // Function to migrate the CSV data to the database
// async function migrateData() {
//   const results: any[] = [];

//   // Read and parse the CSV file
//   fs.createReadStream(csvFilePath)
//     .pipe(csvParser())
//     .on("data", (data) => {
//       results.push(data);
//     })
//     .on("end", async () => {
//       try {
//         // Start transaction
//         const transaction = await sequelize.transaction();

//         // Process each row in the CSV file
//         for (const row of results) {
//           // Insert movie into the Movies table
//           const movie = await Movie.create(
//             {
//               name: row.Name,
//               releaseYear: parseInteger(row.Date),
//               rating: parseNumber(row.Rate),
//               thumbnailUrl: null, // Assuming no URL from CSV
//               votes: parseInteger(row.Votes),
//               duration: parseNumber(row.Duration),
//               type: row.Type,
//               certificate: row.Certificate,
//               episodes:
//                 row.Episodes !== "-" ? parseInteger(row.Episodes) : null,
//               nudity: row.Nudity,
//               violence: row.Violence,
//               profanity: row.Profanity,
//               alcohol: row.Alcohol,
//               frightening: row.Frightening,
//               description: null, // Assuming no description from CSV
//             },
//             { transaction }
//           );

//           // Insert genres into the Genres table and link with movies
//           const genre1ID = await getOrCreateGenre(row.Genre);
//           const genre2ID = await getOrCreateGenre(row["Genre 2"]);
//           const genre3ID = await getOrCreateGenre(row["Genre 3"]);

//           // Link movie to genres using the MovieGenre table
//           if (genre1ID !== -1) {
//             await MovieGenre.create(
//               { movieID: movie.movieID, genreID: genre1ID },
//               { transaction }
//             );
//           }
//           if (genre2ID !== -1) {
//             await MovieGenre.create(
//               { movieID: movie.movieID, genreID: genre2ID },
//               { transaction }
//             );
//           }
//           if (genre3ID !== -1) {
//             await MovieGenre.create(
//               { movieID: movie.movieID, genreID: genre3ID },
//               { transaction }
//             );
//           }
//         }

//         // Commit transaction
//         await transaction.commit();
//         console.log("Data migration completed successfully.");
//       } catch (error) {
//         console.error("Error during migration: ", error);
//       }
//     });
// }

// // Execute the migration script
// migrateData();

//
//
//
//
// const csvFilePath = path.join(__dirname, "movies_with_posters.csv");

// // Default thumbnail URL
// const defaultThumbnailUrl =
//   "https://res.cloudinary.com/di835w1z1/image/upload/v1726501367/samples/chair-and-coffee-table.jpg";

// // Function to migrate the CSV data to the movie table
// async function migrateThumbnails() {
//   const results: any[] = [];

//   // Read and parse the CSV file
//   fs.createReadStream(csvFilePath)
//     .pipe(csvParser())
//     .on("data", (data) => {
//       results.push(data);
//     })
//     .on("end", async () => {
//       try {
//         // Start transaction
//         const transaction = await sequelize.transaction();

//         // Process each row in the CSV file
//         for (const row of results) {
//           // Find the movie by name
//           const movie = await Movie.findOne({
//             where: { name: row.name },
//             transaction,
//           });

//           // If movie exists, update the thumbnail URL
//           if (movie) {
//             const newThumbnailUrl = row.thumbnailUrl || defaultThumbnailUrl;

//             await movie.update(
//               {
//                 thumbnailUrl: newThumbnailUrl,
//               },
//               { transaction }
//             );
//             console.log(
//               `Updated movie "${row.name}" with thumbnail: ${newThumbnailUrl}`
//             );
//           } else {
//             // If movie is not found, assign default thumbnail URL
//             console.log(
//               `Movie "${row.name}" not found, setting default thumbnail URL.`
//             );
//           }
//         }

//         // Commit transaction
//         await transaction.commit();
//         console.log("Thumbnail migration completed successfully.");
//       } catch (error) {
//         console.error("Error during thumbnail migration: ", error);
//       }
//     });
// }

// // Execute the migration script
// migrateThumbnails();

// // UPDATE public."Movies"
// // SET "thumbnailUrl" = 'https://res.cloudinary.com/di835w1z1/image/upload/v1726501367/samples/chair-and-coffee-table.jpg'
// // WHERE "thumbnailUrl" IS NULL;
