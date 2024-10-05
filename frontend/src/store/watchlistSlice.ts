import {
  addToWatchList,
  deleteFromWatchList,
  getWatchList,
} from "@/services/api";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

interface MovieData {
  movieID: number;
  name: string;
  thumbnailUrl: string;
  rating: number;
  type: string;
  certificate: string;
  releaseYear: number;
}

interface WatchlistMovie {
  userID: number;
  movieID: number;
  dateAdded: string;
  Movie: MovieData; 
}

interface WatchlistState {
  movies: WatchlistMovie[]; 
  count: number;
  loading: boolean;
}

const initialState: WatchlistState = {
  movies: [],
  count: 0,
  loading: false,
};

// Async thunk for fetching watchlist
export const fetchWatchlist = createAsyncThunk(
  "watchlist/fetchWatchlist",
  async (token: string | null, { rejectWithValue }) => {
    try {
      const movies = await getWatchList(token);
      return movies;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Async thunk for adding to watchlist
export const addMovieToWatchlist = createAsyncThunk(
  "watchlist/addMovieToWatchlist",
  async (
    { movieID, token }: { movieID: number; token: string | null },
    { rejectWithValue }
  ) => {
    try {
      const movie = await addToWatchList(movieID, token);
      return movie;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Async thunk for removing from watchlist
export const removeMovieFromWatchlist = createAsyncThunk(
  "watchlist/removeMovieFromWatchlist",
  async (
    { movieID, token }: { movieID: number; token: string | null },
    { rejectWithValue }
  ) => {
    try {
      await deleteFromWatchList(movieID, token);
      return movieID;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const watchlistSlice = createSlice({
  name: "watchlist",
  initialState,
  reducers: {
    clearWatchlist: (state) => {
      state.movies = [];
      state.count = 0;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWatchlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchWatchlist.fulfilled,
        (state, action: PayloadAction<WatchlistMovie[]>) => {
          state.movies = action.payload;
          state.count = action.payload.length;
          state.loading = false;
        }
      )
      .addCase(fetchWatchlist.rejected, (state) => {
        state.loading = false;
      })
      .addCase(
        addMovieToWatchlist.fulfilled,
        (state, action: PayloadAction<WatchlistMovie>) => {
          state.movies.push(action.payload);
          state.count = state.movies.length;
        }
      )
      .addCase(
        removeMovieFromWatchlist.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.movies = state.movies.filter(
            (movie) => movie.movieID !== action.payload
          );
          state.count = state.movies.length;
        }
      );
  },
});

export const { clearWatchlist } = watchlistSlice.actions;

export default watchlistSlice.reducer;
