"use client";
import DiscoveryHeader from "@/components/base/DiscoveryHeader";
import { certificate, genre, ratings, type } from "@/utils/filter";
import LoaderSpinner from "@/utils/LoaderSpinner";
import MovieCard from "@/components/MovieCard";
import {
  fetchMovies,
  incrementPage,
  resetMovies,
  setSearchQuery,
} from "@/store/movieSilce";
import { AppDispatch, RootState } from "@/store/store";
import { fetchWatchlist } from "@/store/watchlistSlice";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { get } from "lodash";
import { getCacheKey } from "@/utils/cache";

// Define a type for our cache object
type CacheType = {
  [key: string]: {
    movies: any[];
    hasMore: boolean;
    timestamp: number;
  };
};



export default function Home() {
  const dispatch = useDispatch<AppDispatch>();
  const { movies, hasMore, loading } = useSelector(
    (state: RootState) => state.movies
  );
  const token = useSelector((state: RootState) => state.user.token);
  const searchQuery = useSelector(
    (state: RootState) => state.movies.searchQuery
  );
  const [filters, setFilters] = useState({});
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const limit = 20; // Number of movies per request
  const [currentPage, setCurrentPage] = useState(1);

  const isFetching = useRef(false);
  const isFetchingWatchlist = useRef(0);

  // Create a ref for our cache
  const cache = useRef<CacheType>({});
  const fetchMoviesCallback = useCallback(
    async (page: number, limit: number, appliedFilters = filters) => {
      if (isFetching.current) return;
      isFetching.current = true;

      try {
        const filterParams =
          searchQuery.trim() !== ""
            ? { ...appliedFilters, search: searchQuery }
            : appliedFilters;

        const cacheKey = getCacheKey(page, filterParams, searchQuery);
        const now = Date.now();
        const cacheDuration = 5 * 60 * 1000; // 5 minutes

        // Check if we have a valid cached result
        if (
          cache.current[cacheKey] &&
          now - cache.current[cacheKey].timestamp < cacheDuration
        ) {
          console.log("Using cached data");
          dispatch({
            type: "movies/setMovies",
            payload: {
              movies: cache.current[cacheKey].movies,
              hasMore: cache.current[cacheKey].hasMore,
            },
          });
        } else {
          console.log("Fetching new data");
          const result = await dispatch(
            fetchMovies({ page, limit, filters: filterParams })
          );

          if (fetchMovies.fulfilled.match(result)) {
            // Update cache
            cache.current[cacheKey] = {
              movies: result.payload.movies,
              hasMore: result.payload.hasMore,
              timestamp: now,
            };
          }
        }

        if (token && isFetchingWatchlist.current === 0) {
          isFetchingWatchlist.current = 1;
          dispatch(fetchWatchlist(token));
        }
        dispatch(incrementPage());
      } finally {
        isFetching.current = false;
        setInitialLoadDone(true);
      }
    },
    [dispatch, filters, searchQuery, token]
  );

  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 200 &&
      !loading &&
      hasMore
    ) {
      setCurrentPage((prevPage) => prevPage + 1);
      fetchMoviesCallback(currentPage + 1, limit);
    }
  }, [fetchMoviesCallback, loading, hasMore, currentPage, limit]);

  useEffect(() => {
    setInitialLoadDone(false);
    dispatch(resetMovies());
    setCurrentPage(1);
    fetchMoviesCallback(1, limit);
  }, [fetchMoviesCallback, limit]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    dispatch(resetMovies());
    setInitialLoadDone(false);
    fetchMoviesCallback(1, limit, newFilters);
  };

  const handleSearch = (query: string) => {
    dispatch(setSearchQuery(query));
    dispatch(resetMovies());
    setInitialLoadDone(false);
    fetchMoviesCallback(1, limit, filters);
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <DiscoveryHeader
          genre={genre}
          ratings={ratings}
          type={type}
          certificate={certificate}
          onFilterChange={handleFilterChange}
        />
      </div>
      <h1 className="text-2xl font-bold mb-2 text-white">Movies List</h1>
      {!initialLoadDone ? (
        <div className="flex justify-center items-center h-64">
          <LoaderSpinner />
        </div>
      ) : movies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 p-4">
          {movies.map((movie) => (
            <div
              key={movie.movieID}
              className="hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:scale-105"
            >
              <MovieCard
                movieID={movie.movieID}
                name={movie.name}
                thumbnailUrl={movie.thumbnailUrl}
                rating={movie.rating}
                type={movie.type}
                certificate={movie.certificate}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-8">
          No movies available
        </div>
      )}
      <div className="relative mt-8 flex justify-center">
        {loading && movies.length > 0 && <LoaderSpinner />}
      </div>
    </div>
  );
}

