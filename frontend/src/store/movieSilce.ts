import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { getAllMovies } from "@/services/api";

interface Movie {
  movieID: number;
  name: string;
  thumbnailUrl: string;
  rating: number;
  type: string;
  certificate: string;
  createdAt: string;
}

interface MovieState {
  movies: Movie[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  searchQuery: string;
  error: string | null;
}

interface FetchMoviesParams {
  page: number;
  limit: number;
  filters: {
    genre?: string;
    rating?: string;
    type?: string;
    certificate?: string;
    search?: string;
  };
}

const initialState: MovieState = {
  movies: [],
  page: 1,
  hasMore: true,
  loading: false,
  searchQuery: "",
  error: null,
};
//refactor: two functions with similar functionality needs to be unified
export const fetchMovies = createAsyncThunk(
  "movies/fetchMovies",
  async ({ page, limit, filters }: FetchMoviesParams) => {
    console.log("Fetching movies:", { page, limit, filters });
    const movies = await getAllMovies(page, limit, filters);
    console.log("Fetched movies:", movies.length);
    return { movies, hasMore: movies.length === limit };
  }
);

export const fetchInitialMovies = createAsyncThunk(
  "movies/fetchInitialMovies",
  async ({ limit }: { limit: number }) => {
    const movies = await getAllMovies(1, limit, {});
    return { movies, hasMore: movies.length === limit };
  }
);
//
const movieSlice = createSlice({
  name: "movies",
  initialState,
  reducers: {
    incrementPage: (state) => {
      state.page += 1;
    },
    resetMovies: () => initialState,
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.page = 1;
      state.movies = [];
      state.hasMore = true;
    },
    setMovies: (state, action: PayloadAction<{ movies: Movie[]; hasMore: boolean }>) => {
      state.movies = action.payload.movies;
      state.hasMore = action.payload.hasMore;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMovies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMovies.fulfilled, (state, action) => {
        console.log("fetchMovies fulfilled:", action.payload);
        state.movies = [...state.movies, ...action.payload.movies];
        state.hasMore = action.payload.hasMore;
        state.loading = false;
      })
      .addCase(fetchMovies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "An error occurred";
      })
      .addCase(fetchInitialMovies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInitialMovies.fulfilled, (state, action) => {
        state.movies = action.payload.movies;
        state.hasMore = action.payload.hasMore;
        state.loading = false;
        state.page = 1;
      })
      .addCase(fetchInitialMovies.rejected, (state, action) => {
        console.log("fetchMovies rejected:", action.error);
        state.loading = false;
        state.error = action.error.message || "An error occurred";
      });
  },
});

export const { incrementPage, resetMovies, setSearchQuery } =
  movieSlice.actions;

export default movieSlice.reducer;