"use client";

import { genreOptions } from "@/components/filter";
import {
  createMovie,
  deleteMovie,
  getUserMovies,
  updateMovie,
} from "@/services/api";
import { RootState } from "@/store/store";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type MovieForm = {
  name: string;
  releaseYear: number;
  duration: number;
  description: string;
  type: "Film" | "Series";
  certificate:
    | "R"
    | "PG-13"
    | "TV-MA"
    | "TV-14"
    | "PG"
    | "Not Rated"
    | "Approved";
  thumbnail: FileList;
  genres: string[];
};

type Movie = {
  //for get movies
  movieID: number;
  name: string;
  releaseYear: number;
  rating: number;
  duration: number;
  description: string;
  type: "Film" | "Series";
  certificate:
    | "R"
    | "PG-13"
    | "TV-MA"
    | "TV-14"
    | "PG"
    | "Not Rated"
    | "Approved";
  thumbnailUrl: string;
};

export default function CreateMovie() {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.user.token);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MovieForm>();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingMovieID, setEditingMovieID] = useState<number | null>(null);
  const isFetching = useRef(false);
  // Fetch all user movies
  useEffect(() => {
    async function fetchMovies() {
      if (isFetching.current) return;
      try {
        isFetching.current = true;
        const userMovies = await getUserMovies(token);
        setMovies(userMovies || []);
      } catch (error) {
        console.error("Error fetching user movies:", error);
        toast.error("Error fetching user movies");
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    }
    fetchMovies();
  }, [token]);

  // Handle genre selection
  const handleGenreChange = (genreID: string) => {
    const updatedGenres = selectedGenres.includes(genreID)
      ? selectedGenres.filter((id) => id !== genreID) // Remove genre if already selected
      : [...selectedGenres, genreID]; // Add genre if not selected

    if (updatedGenres.length <= 3) {
      setSelectedGenres(updatedGenres); // Only allow up to 3 genres
    } else {
      toast.error("You can select up to 3 genres only.");
    }
  };

  // Submit movie form
  const onSubmit = async (data: MovieForm) => {
    if (selectedGenres.length < 1) {
      toast.error("Please select at least one genre.");
      return;
    }
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("releaseYear", data.releaseYear.toString());
    formData.append("duration", data.duration.toString());
    formData.append("description", data.description);
    formData.append("type", data.type);
    formData.append("certificate", data.certificate);
    formData.append("thumbnail", data.thumbnail[0]);
    // Append genres as an array instead of a string
    selectedGenres.forEach((genre) => formData.append("genres", genre));

    try {
      if (editingMovieID) {
        // If editing, update movie
        await updateMovie(editingMovieID, formData, token);
        toast.success("Movie updated successfully!");
      } else {
        // Create a new movie
        const newMovie = await createMovie(formData, token);
        setMovies((prevMovies) => [newMovie, ...prevMovies]);
        toast.success("Movie created successfully!");
      }
      reset();
      setEditingMovieID(null);
      setSelectedGenres([]); // Reset selected genres after submission
    } catch (error) {
      toast.error("Error while creating/updating movie");
    }
  };

  // Handle delete movie
  const handleDelete = async (e: any, id: number) => {
    e.stopPropagation(); // Prevent navigation
    try {
      const m = await deleteMovie(id, token);
      if (m) {
        setMovies(movies.filter((movie) => movie.movieID !== id));
      }
      toast.success("Movie deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete movie");
    }
  };

  // Handle edit movie
  const handleEdit = (e: any, movie: Movie) => {
    e.stopPropagation(); // Prevent navigation
    setEditingMovieID(movie.movieID);
    reset(movie);

    window.scrollTo({
      top: 0, // Scroll to the top of the page
      behavior: "smooth", // smooth scrolling effect
    });
  };

  const goToDetails = (id: any) => {
    router.push(`/movies/${id}`);
  };

  return (
    <div className="container mx-auto p-4">
      <ToastContainer autoClose={1000} /> {/* Toast container */}
      <h1 className="text-2xl font-bold mb-6 text-white">Create Movie</h1>
      <div>
        {/* Movie Creation Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 bg-third p-6 shadow-lg rounded-lg"
        >
          {/* Form fields */}
          <div>
            <label className="block mb-2 text-white">Movie Name</label>
            <input
              {...register("name", { required: "Movie Name is required" })}
              className="border p-2 w-full rounded-md bg-gray-400"
              type="text"
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="block mb-2 text-white">Release Year</label>
            <input
              {...register("releaseYear", {
                required: "Release Year is required",
                valueAsNumber: true,
              })}
              className="border p-2 w-full bg-gray-400"
              type="number"
            />
            {errors.releaseYear && (
              <p className="text-red-500 text-sm">
                {errors.releaseYear.message}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-white">
              Duration (in minutes)
            </label>
            <input
              {...register("duration", {
                required: "Duration is required",
                valueAsNumber: true,
              })}
              className="border p-2 w-full bg-gray-400"
              type="number"
            />
            {errors.duration && (
              <p className="text-red-500 text-sm">{errors.duration.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-white">Description</label>
            <textarea
              {...register("description", {
                required: "Description is required",
              })}
              className="border p-2 w-full bg-gray-400"
            />
            {errors.description && (
              <p className="text-red-500 text-sm">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-white">Type</label>
            <select
              {...register("type", { required: "Type is required" })}
              className="border p-2 w-full bg-gray-400"
            >
              <option value="Film">Film</option>
              <option value="Series">Series</option>
            </select>
            {errors.type && (
              <p className="text-red-500 text-sm">{errors.type.message}</p>
            )}
          </div>

          {/* Genre Selection */}
          <div>
            <label className="block mb-2 text-white">
              Genres (Select 1-3)
            </label>
            <div className="flex flex-wrap gap-2">
              {genreOptions.map((genre) => (
                <label key={genre.id} className="flex items-center text-white">
                  <input
                    type="checkbox"
                    value={genre.id}
                    checked={selectedGenres.includes(genre.id)}
                    onChange={() => handleGenreChange(genre.id)}
                    className="mr-2"
                  />
                  {genre.name}
                </label>
              ))}
            </div>
            <p className="text-sm text-white">
              Selected genres: {selectedGenres.length}/3
            </p>
          </div>

          <div>
            <label className="block mb-2 text-white">Certificate</label>
            <select
              {...register("certificate", {
                required: "Certificate is required",
              })}
              className="border p-2 w-full bg-gray-400"
            >
              <option value="R">R</option>
              <option value="PG-13">PG-13</option>
              <option value="TV-MA">TV-MA</option>
              <option value="TV-14">TV-14</option>
              <option value="PG">PG</option>
              <option value="Not Rated">Not Rated</option>
              <option value="Approved">Approved</option>
            </select>
            {errors.certificate && (
              <p className="text-red-500 text-sm">
                {errors.certificate.message}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-white">Thumbnail</label>
            <input
              {...register("thumbnail", { required: "Thumbnail is required" })}
              className="border p-2 w-full text-white"
              type="file"
              accept="image/*"
            />
            {errors.thumbnail && (
              <p className="text-red-500 text-sm">{errors.thumbnail.message}</p>
            )}
          </div>

          <button className="bg-blue-500 text-white p-2 rounded" type="submit">
            {editingMovieID ? "Update Movie" : "Create Movie"}
          </button>
        </form>
      </div>
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-4 text-white">Your Movies</h2>
        {movies.length > 0 ? (
          <div className="space-y-6">
            {movies.map((movie) => (
              <div
                key={movie.movieID}
                onClick={() => goToDetails(movie.movieID)}
                className="flex items-center justify-between bg-gray-500 shadow-lg hover:shadow-xl rounded-lg p-5 transition-shadow duration-300 ease-in-out"
              >
                <div className="flex items-center">
                  {movie.thumbnailUrl ? (
                    <img
                      src={
                        movie.thumbnailUrl.startsWith("http")
                          ? movie.thumbnailUrl
                          : `http://localhost:5000${movie.thumbnailUrl}`
                      }
                      alt={`${movie.name} thumbnail`}
                      className="w-16 h-24 object-cover rounded-lg mr-5 shadow-md hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="no-thumbnail">
                      <p>No Thumbnail Available</p>
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl text-white font-semibold">
                      {movie.name}
                    </h3>
                    <p className="text-white">
                      Release Year: {movie.releaseYear}
                    </p>
                    <p className="text-sm text-white">
                      <span className="inline text-yellow-500">★</span>
                      {movie.rating}/10
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <button
                    onClick={(e) => handleEdit(e, movie)}
                    className="bg-yellow-500 text-white px-4 py-2 mr-2 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, movie.movieID)}
                    className="bg-red-500 text-white px-4 py-2 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No movies created yet.</p>
        )}
      </div>
    </div>
  );
}

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
// three genre
// "use client";

// import { genreOptions } from "@/components/filter";
// import {
//   createMovie,
//   deleteMovie,
//   getUserMovies,
//   updateMovie,
// } from "@/services/api";
// import { RootState } from "@/store/store";
// import { useRouter } from "next/navigation";
// import { useEffect, useRef, useState } from "react";
// import { useForm } from "react-hook-form";
// import { useSelector } from "react-redux";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// type MovieForm = {
//   name: string;
//   releaseYear: number;
//   duration: number;
//   description: string;
//   type: "Film" | "Series";
//   certificate:
//     | "R"
//     | "PG-13"
//     | "TV-MA"
//     | "TV-14"
//     | "PG"
//     | "Not Rated"
//     | "Approved";
//   thumbnail: FileList;
//   genres: string[];
// };

// type Movie = {
//   //for get movies
//   movieID: number;
//   name: string;
//   releaseYear: number;
//   rating: number;
//   duration: number;
//   description: string;
//   type: "Film" | "Series";
//   certificate:
//     | "R"
//     | "PG-13"
//     | "TV-MA"
//     | "TV-14"
//     | "PG"
//     | "Not Rated"
//     | "Approved";
//   thumbnailUrl: string;
// };

// export default function CreateMovie() {
//   const router = useRouter();
//   const token = useSelector((state: RootState) => state.user.token);
//   const {
//     register,
//     handleSubmit,
//     reset,
//     formState: { errors },
//   } = useForm<MovieForm>();
//   const [movies, setMovies] = useState<Movie[]>([]);
//   const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [editingMovieID, setEditingMovieID] = useState<number | null>(null);
//   const isFetching = useRef(false);
//   // Fetch all user movies
//   useEffect(() => {
//     async function fetchMovies() {
//       if (isFetching.current) return;
//       try {
//         isFetching.current = true;
//         const userMovies = await getUserMovies(token);
//         setMovies(userMovies || []);
//       } catch (error) {
//         console.error("Error fetching user movies:", error);
//         toast.error("Error fetching user movies");
//       } finally {
//         setLoading(false);
//         isFetching.current = false;
//       }
//     }
//     fetchMovies();
//   }, [token]);

//   // Handle genre selection
//   const handleGenreChange = (genreID: string) => {
//     const updatedGenres = selectedGenres.includes(genreID)
//       ? selectedGenres.filter((id) => id !== genreID) // Remove genre if already selected
//       : [...selectedGenres, genreID]; // Add genre if not selected

//     if (updatedGenres.length <= 3) {
//       setSelectedGenres(updatedGenres); // Only allow up to 3 genres
//     } else {
//       toast.error("You can select up to 3 genres only.");
//     }
//   };

//   // Submit movie form
//   const onSubmit = async (data: MovieForm) => {
//     if (selectedGenres.length < 1) {
//       toast.error("Please select at least one genre.");
//       return;
//     }
//     const formData = new FormData();
//     formData.append("name", data.name);
//     formData.append("releaseYear", data.releaseYear.toString());
//     formData.append("duration", data.duration.toString());
//     formData.append("description", data.description);
//     formData.append("type", data.type);
//     formData.append("certificate", data.certificate);
//     formData.append("thumbnail", data.thumbnail[0]);
//     // Append genres as an array instead of a string
//     selectedGenres.forEach((genre) => formData.append("genres", genre));

//     try {
//       if (editingMovieID) {
//         // If editing, update movie
//         await updateMovie(editingMovieID, formData, token);
//         toast.success("Movie updated successfully!");
//       } else {
//         // Create a new movie
//         const newMovie = await createMovie(formData, token);
//         setMovies((prevMovies) => [newMovie, ...prevMovies]);
//         toast.success("Movie created successfully!");
//       }
//       reset();
//       setEditingMovieID(null);
//       setSelectedGenres([]); // Reset selected genres after submission
//     } catch (error) {
//       toast.error("Error while creating/updating movie");
//     }
//   };

//   // Handle delete movie
//   const handleDelete = async (e: any, id: number) => {
//     e.stopPropagation(); // Prevent navigation
//     try {
//       const m = await deleteMovie(id, token);
//       if (m) {
//         setMovies(movies.filter((movie) => movie.movieID !== id));
//       }
//       toast.success("Movie deleted successfully!");
//     } catch (error) {
//       toast.error("Failed to delete movie");
//     }
//   };

//   // Handle edit movie
//   const handleEdit = (e: any, movie: Movie) => {
//     e.stopPropagation(); // Prevent navigation
//     setEditingMovieID(movie.movieID);
//     reset(movie);

//     window.scrollTo({
//       top: 0, // Scroll to the top of the page
//       behavior: "smooth", // smooth scrolling effect
//     });
//   };

//   const goToDetails = (id: any) => {
//     router.push(`/movies/${id}`);
//   };

//   return (
//     <div className="container mx-auto p-4">
//       <ToastContainer autoClose={1000} /> {/* Toast container */}
//       <h1 className="text-2xl font-bold mb-6">Create Movie</h1>
//       <div>
//         {/* Movie Creation Form */}
//         <form
//           onSubmit={handleSubmit(onSubmit)}
//           className="space-y-4 bg-white p-6 shadow-lg rounded-lg"
//         >
//           {/* Form fields */}
//           <div>
//             <label className="block mb-2 text-gray-600">Movie Name</label>
//             <input
//               {...register("name", { required: "Movie Name is required" })}
//               className="border p-2 w-full rounded-md"
//               type="text"
//             />
//             {errors.name && (
//               <p className="text-red-500 text-sm">{errors.name.message}</p>
//             )}
//           </div>
//           <div>
//             <label className="block mb-2">Release Year</label>
//             <input
//               {...register("releaseYear", {
//                 required: "Release Year is required",
//                 valueAsNumber: true,
//               })}
//               className="border p-2 w-full"
//               type="number"
//             />
//             {errors.releaseYear && (
//               <p className="text-red-500 text-sm">
//                 {errors.releaseYear.message}
//               </p>
//             )}
//           </div>

//           <div>
//             <label className="block mb-2 text-gray-600">
//               Duration (in minutes)
//             </label>
//             <input
//               {...register("duration", {
//                 required: "Duration is required",
//                 valueAsNumber: true,
//               })}
//               className="border p-2 w-full"
//               type="number"
//             />
//             {errors.duration && (
//               <p className="text-red-500 text-sm">{errors.duration.message}</p>
//             )}
//           </div>

//           <div>
//             <label className="block mb-2 text-gray-600">Description</label>
//             <textarea
//               {...register("description", {
//                 required: "Description is required",
//               })}
//               className="border p-2 w-full"
//             />
//             {errors.description && (
//               <p className="text-red-500 text-sm">
//                 {errors.description.message}
//               </p>
//             )}
//           </div>

//           <div>
//             <label className="block mb-2 text-gray-600">Type</label>
//             <select
//               {...register("type", { required: "Type is required" })}
//               className="border p-2 w-full"
//             >
//               <option value="Film">Film</option>
//               <option value="Series">Series</option>
//             </select>
//             {errors.type && (
//               <p className="text-red-500 text-sm">{errors.type.message}</p>
//             )}
//           </div>

//           {/* Genre Selection */}
//           <div>
//             <label className="block mb-2 text-gray-600">
//               Genres (Select 1-3)
//             </label>
//             <div className="flex flex-wrap gap-2">
//               {genreOptions.map((genre) => (
//                 <label key={genre.id} className="flex items-center">
//                   <input
//                     type="checkbox"
//                     value={genre.id}
//                     checked={selectedGenres.includes(genre.id)}
//                     onChange={() => handleGenreChange(genre.id)}
//                     className="mr-2"
//                   />
//                   {genre.name}
//                 </label>
//               ))}
//             </div>
//             <p className="text-sm text-gray-500">
//               Selected genres: {selectedGenres.length}/3
//             </p>
//           </div>

//           <div>
//             <label className="block mb-2 text-gray-600">Certificate</label>
//             <select
//               {...register("certificate", {
//                 required: "Certificate is required",
//               })}
//               className="border p-2 w-full"
//             >
//               <option value="R">R</option>
//               <option value="PG-13">PG-13</option>
//               <option value="TV-MA">TV-MA</option>
//               <option value="TV-14">TV-14</option>
//               <option value="PG">PG</option>
//               <option value="Not Rated">Not Rated</option>
//               <option value="Approved">Approved</option>
//             </select>
//             {errors.certificate && (
//               <p className="text-red-500 text-sm">
//                 {errors.certificate.message}
//               </p>
//             )}
//           </div>

//           <div>
//             <label className="block mb-2 text-gray-600">Thumbnail</label>
//             <input
//               {...register("thumbnail", { required: "Thumbnail is required" })}
//               className="border p-2 w-full"
//               type="file"
//               accept="image/*"
//             />
//             {errors.thumbnail && (
//               <p className="text-red-500 text-sm">{errors.thumbnail.message}</p>
//             )}
//           </div>

//           <button className="bg-blue-500 text-white p-2 rounded" type="submit">
//             {editingMovieID ? "Update Movie" : "Create Movie"}
//           </button>
//         </form>
//       </div>
//       <div className="mt-10">
//         <h2 className="text-xl font-bold mb-4 text-gray-800">Your Movies</h2>
//         {movies.length > 0 ? (
//           <div className="space-y-6">
//             {movies.map((movie) => (
//               <div
//                 key={movie.movieID}
//                 onClick={() => goToDetails(movie.movieID)}
//                 className="flex items-center justify-between bg-white shadow-lg hover:shadow-xl rounded-lg p-5 transition-shadow duration-300 ease-in-out"
//               >
//                 <div className="flex items-center">
//                   {movie.thumbnailUrl ? (
//                     <img
//                       src={
//                         movie.thumbnailUrl.startsWith("http")
//                           ? movie.thumbnailUrl
//                           : `http://localhost:5000${movie.thumbnailUrl}`
//                       }
//                       alt={`${movie.name} thumbnail`}
//                       className="w-16 h-24 object-cover rounded-lg mr-5 shadow-md hover:scale-105 transition-transform duration-300"
//                     />
//                   ) : (
//                     <div className="no-thumbnail">
//                       <p>No Thumbnail Available</p>
//                     </div>
//                   )}
//                   <div>
//                     <h3 className="text-xl font-semibold text-gray-800">
//                       {movie.name}
//                     </h3>
//                     <p className="text-gray-600">
//                       Release Year: {movie.releaseYear}
//                     </p>
//                     <p className="text-sm text-gray-500">
//                       <span className="inline text-yellow-500">★</span>
//                       {movie.rating}/10
//                     </p>
//                   </div>
//                 </div>
//                 <div className="text-right">
//                   <button
//                     onClick={(e) => handleEdit(e, movie)}
//                     className="bg-yellow-500 text-white px-4 py-2 mr-2 rounded"
//                   >
//                     Edit
//                   </button>
//                   <button
//                     onClick={(e) => handleDelete(e, movie.movieID)}
//                     className="bg-red-500 text-white px-4 py-2 rounded"
//                   >
//                     Delete
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p>No movies created yet.</p>
//         )}
//       </div>
//     </div>
//   );
// }
