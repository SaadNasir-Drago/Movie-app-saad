export interface Review {
  reviewID: number;
  userID: number;
  rating: number;
  review: string;
  createdAt: string;
  User: { username: string };
}
export interface Genre {
  genreName: string;
}
export interface Movie {
  movieID: number;
  name: string;
  releaseYear: number;
  rating: number;
  thumbnailUrl: string;
  votes: number;
  duration: number;
  type: string;
  certificate: string;
  nudity: string;
  violence: string;
  profanity: string;
  alcohol: string;
  frightening: string;
  description: string | null;
  Reviews: Review[];
  Genres: Genre[];
}
