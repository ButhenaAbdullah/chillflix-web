// lib/tmdb.ts
const TMDB_API_KEY = '63a4397a8ce314a5764a51b22f7ef25e';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Netflix IDs
const NETFLIX_NETWORK_ID = 213; // للمسلسلات
const NETFLIX_COMPANY_ID = 2790; // للأفلام

// ==================== TYPES ====================
export interface Movie {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  backdrop: string;
  rating: string;
  year: string;
  duration: string;
  genres: string[];
  cast: string[];
  match: number;
  isTop10?: boolean;
  top10Rank?: number;
  seasons?: number;
  creator?: string;
  media_type?: 'movie' | 'tv';
  isNetflixOriginal?: boolean;
}

export interface TMDBMovie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: string;
  genre_ids?: number[];
}

export interface TMDBResult {
  id: number;
  media_type: "movie" | "tv";
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average: number;
  genre_ids?: number[];
}

// ==================== GENRES ====================
const genreMap: { [key: number]: string } = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

export const GENRES_KIDS = {
  ANIMATION: 16,
  FANTASY: 14,
};

// ==================== CONTENT FILTER ====================
// قائمة الكلمات المحظورة (محتوى للكبار فقط)
const BANNED_KEYWORDS = [
  'sex', 'porn', 'xxx', 'adult', 'erotic', 'nude', 'naked',
  'hentai', 'ecchi', 'explicit', 'nsfw', 'rated x', '18+',
  'sexual', 'sensual', 'seduction', 'desire', 'lust',
  'playboy', 'penthouse', 'hustler', 'brazzers',
  // إضافات عربية
  'جنس', 'إباحي', 'عاري', 'للكبار فقط', 'محتوى جنسي',
  // كلمات إضافية
  'softcore', 'hardcore', 'voyeur', 'fetish', 'bdsm'
];

// دالة فحص المحتوى
const isContentSafe = (title: string, overview: string): boolean => {
  const textToCheck = `${title} ${overview}`.toLowerCase();
  
  // فحص إذا في أي كلمة محظورة
  for (const keyword of BANNED_KEYWORDS) {
    if (textToCheck.includes(keyword.toLowerCase())) {
      console.warn(`🚫 Blocked content with keyword: "${keyword}" in "${title}"`);
      return false;
    }
  }
  
  return true;
};

// ==================== HELPERS ====================
export const getImageUrl = (path: string | null, size: string = 'original'): string => {
  if (!path) return '/placeholder.svg';
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

export const getTitleLogo = (images: any): string | null => {
  const logos = images?.logos;
  if (!logos || logos.length === 0) return null;
  const englishLogo = logos.find((l: any) => l.iso_639_1 === "en");
  if (englishLogo) return `${TMDB_IMAGE_BASE_URL}/original${englishLogo.file_path}`;
  const neutralLogo = logos.find((l: any) => l.iso_639_1 === null);
  if (neutralLogo) return `${TMDB_IMAGE_BASE_URL}/original${neutralLogo.file_path}`;
  return `${TMDB_IMAGE_BASE_URL}/original${logos[0].file_path}`;
};

// تحويل بيانات TMDB إلى Movie جاهز (مع فلترة المحتوى)
export const convertTMDBToMovie = (tmdbMovie: TMDBMovie, media_type?: 'movie' | 'tv', isNetflixOriginal?: boolean): Movie | null => {
  // فحص المحتوى قبل التحويل
  const title = tmdbMovie.title || tmdbMovie.name || '';
  const overview = tmdbMovie.overview || '';
  
  if (!isContentSafe(title, overview)) {
    return null; // محتوى محظور
  }
  
  const genres = tmdbMovie.genre_ids?.map(id => genreMap[id]).filter(Boolean) || [];
  return {
    id: tmdbMovie.id,
    title: title || 'Unknown',
    description: overview || 'No description available',
    thumbnail: getImageUrl(tmdbMovie.poster_path, 'w500'),
    backdrop: getImageUrl(tmdbMovie.backdrop_path, 'original'),
    rating: media_type === 'tv' ? 'TV-14' : 'PG-13',
    year: (tmdbMovie.release_date || tmdbMovie.first_air_date || '').substring(0, 4),
    duration: media_type === 'tv' ? '1 Season' : '2h 15m',
    genres: genres.length > 0 ? genres : ['Drama'],
    cast: [],
    match: Math.round(tmdbMovie.vote_average * 10),
    media_type: media_type || (tmdbMovie.name ? 'tv' : 'movie'),
    isNetflixOriginal: isNetflixOriginal || false,
  };
};

// ==================== API ====================
async function fetchTMDB(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.append('api_key', TMDB_API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('TMDB Fetch Error');
  return res.json();
}

// ==================== FETCHERS ====================
export const tmdbApi = {
  getTrending: () => `${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}&language=en`,
  getNetflixOriginals: () => `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_networks=${NETFLIX_NETWORK_ID}&language=en`,
  getTopRated: () => `${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&language=en`,
  getActionMovies: () => `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=28&language=en`,
  getComedyMovies: () => `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=35&language=en`,
  getHorrorMovies: () => `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=27&language=en`,
  getRomanceMovies: () => `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=10749&language=en`,
  getDocumentaries: () => `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=99&language=en`,
  getMovieDetails: (id: number) => `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits,images,release_dates&language=en`,
  getTVDetails: (id: number) => `${TMDB_BASE_URL}/tv/${id}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits,images,content_ratings&language=en`,
  getSeasonDetails: (id: number, seasonNumber: number) => `${TMDB_BASE_URL}/tv/${id}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=en`,
  getSimilar: (id: number, type: 'movie' | 'tv') => `${TMDB_BASE_URL}/${type}/${id}/similar?api_key=${TMDB_API_KEY}&language=en`,
};

// ==================== SEARCH ====================
export async function searchMovies(query: string): Promise<Movie[]> {
  if (!query.trim()) return [];
  const data = await fetchTMDB('/search/multi', { query });
  
  // فلترة النتائج: فقط الأفلام/المسلسلات اللي عندها poster_path
  const filteredResults = data.results.filter((i: TMDBMovie) => 
    (i.media_type === 'movie' || i.media_type === 'tv') && i.poster_path
  );
  
  // تحويل مع فلترة المحتوى غير الآمن
  return filteredResults
    .map((i: TMDBMovie): Movie | null => convertTMDBToMovie(i, i.media_type as 'movie' | 'tv'))
    .filter((movie: Movie | null): movie is Movie => movie !== null);
}

// ==================== TOP 10 ====================
export async function getTop10Movies(): Promise<Movie[]> {
  const data = await fetchTMDB("/movie/top_rated");
  
  // فلترة الأفلام اللي عندها poster فقط
  const filtered = data.results.filter((i: TMDBMovie) => i.poster_path);
  
  return filtered.slice(0, 10)
    .map((i: TMDBMovie, index: number): Movie | null => {
      const movie = convertTMDBToMovie(i, 'movie');
      if (!movie) return null;
      movie.isTop10 = true;
      movie.top10Rank = index + 1;
      return movie;
    })
    .filter((movie: Movie | null): movie is Movie => movie !== null);
}

// ==================== NETFLIX ORIGINALS ====================
export async function getNetflixOriginalSeries(): Promise<Movie[]> {
  const data = await fetchTMDB('/discover/tv', {
    with_networks: String(NETFLIX_NETWORK_ID),
    sort_by: 'popularity.desc'
  });
  
  // فلترة المسلسلات اللي عندها poster
  const filtered = data.results.filter((i: TMDBMovie) => i.poster_path);
  return filtered
    .map((i: TMDBMovie): Movie | null => convertTMDBToMovie(i, 'tv', true))
    .filter((movie: Movie | null): movie is Movie => movie !== null);
}

export async function getNetflixOriginalMovies(): Promise<Movie[]> {
  const data = await fetchTMDB('/discover/movie', {
    with_companies: String(NETFLIX_COMPANY_ID),
    sort_by: 'popularity.desc'
  });
  
  // فلترة الأفلام اللي عندها poster
  const filtered = data.results.filter((i: TMDBMovie) => i.poster_path);
  return filtered
    .map((i: TMDBMovie): Movie | null => convertTMDBToMovie(i, 'movie', true))
    .filter((movie: Movie | null): movie is Movie => movie !== null);
}

// كل محتوى Netflix (أفلام ومسلسلات)
export async function getAllNetflixOriginals(): Promise<Movie[]> {
  const [series, movies] = await Promise.all([
    getNetflixOriginalSeries(),
    getNetflixOriginalMovies()
  ]);
  
  // دمج ومزج المحتوى
  const combined: Movie[] = [...series.slice(0, 15), ...movies.slice(0, 15)];
  
  // ترتيب حسب الشعبية
  return combined.sort((a, b) => b.match - a.match);
}

// Netflix Originals حسب النوع
export async function getNetflixOriginalsByGenre(genreId: number): Promise<Movie[]> {
  const [seriesData, moviesData] = await Promise.all([
    fetchTMDB('/discover/tv', {
      with_networks: String(NETFLIX_NETWORK_ID),
      with_genres: String(genreId),
      sort_by: 'popularity.desc'
    }),
    fetchTMDB('/discover/movie', {
      with_companies: String(NETFLIX_COMPANY_ID),
      with_genres: String(genreId),
      sort_by: 'popularity.desc'
    })
  ]);

  // فلترة فقط اللي عندهم poster
  const filteredSeries = seriesData.results.filter((i: TMDBMovie) => i.poster_path);
  const filteredMovies = moviesData.results.filter((i: TMDBMovie) => i.poster_path);

  const series = filteredSeries
    .map((i: TMDBMovie): Movie | null => convertTMDBToMovie(i, 'tv', true))
    .filter((movie: Movie | null): movie is Movie => movie !== null);
  const movies = filteredMovies
    .map((i: TMDBMovie): Movie | null => convertTMDBToMovie(i, 'movie', true))
    .filter((movie: Movie | null): movie is Movie => movie !== null);
  
  return [...series, ...movies];
}

// Top 10 Netflix Originals
export async function getTop10NetflixOriginals(): Promise<Movie[]> {
  const all = await getAllNetflixOriginals();
  return all.slice(0, 10).map((movie: Movie, index: number): Movie => ({
    ...movie,
    isTop10: true,
    top10Rank: index + 1
  }));
}

// Netflix Documentaries
export async function getNetflixDocumentaries(): Promise<Movie[]> {
  return getNetflixOriginalsByGenre(99); // 99 = Documentary
}

// Netflix Action
export async function getNetflixAction(): Promise<Movie[]> {
  return getNetflixOriginalsByGenre(28); // 28 = Action
}

// Netflix Comedy
export async function getNetflixComedy(): Promise<Movie[]> {
  return getNetflixOriginalsByGenre(35); // 35 = Comedy
}

// Netflix Drama
export async function getNetflixDrama(): Promise<Movie[]> {
  return getNetflixOriginalsByGenre(18); // 18 = Drama
}

// ==================== OTHER CATEGORIES ====================
export async function getCategoryMovies(genreId: number, media_type: 'movie' | 'tv' = 'movie'): Promise<Movie[]> {
  const endpoint = media_type === 'movie' ? '/discover/movie' : '/discover/tv';
  const data = await fetchTMDB(endpoint, { with_genres: String(genreId) });
  
  // فلترة فقط اللي عندهم poster
  const filtered = data.results.filter((i: TMDBMovie) => i.poster_path);
  return filtered
    .map((i: TMDBMovie): Movie | null => convertTMDBToMovie(i, media_type))
    .filter((movie: Movie | null): movie is Movie => movie !== null);
}

// فحص إذا الفيلم/المسلسل من Netflix
async function checkIfNetflixOriginal(id: number, media_type: 'movie' | 'tv'): Promise<boolean> {
  try {
    const endpoint = media_type === 'tv' ? `/tv/${id}` : `/movie/${id}`;
    const data = await fetchTMDB(endpoint);
    
    if (media_type === 'tv') {
      // فحص إذا المسلسل من Netflix Network
      return data.networks?.some((n: any) => n.id === NETFLIX_NETWORK_ID) || false;
    } else {
      // فحص إذا الفيلم من Netflix Production Company
      return data.production_companies?.some((c: any) => c.id === NETFLIX_COMPANY_ID) || false;
    }
  } catch (err) {
    return false;
  }
}

export async function getTrendingAll(): Promise<Movie[]> {
  const data = await fetchTMDB('/trending/all/week');
  
  // فلترة فقط اللي عندهم poster
  const filtered = data.results.filter((i: TMDBMovie) => 
    (i.media_type === 'movie' || i.media_type === 'tv') && i.poster_path
  );
  
  // تحويل وفحص كل فيلم
  const moviesWithNetflixCheck = await Promise.all(
    filtered.map(async (i: TMDBMovie): Promise<Movie | null> => {
      const mediaType = i.media_type as 'movie' | 'tv';
      const isNetflix = await checkIfNetflixOriginal(i.id, mediaType);
      return convertTMDBToMovie(i, mediaType, isNetflix);
    })
  );
  
  // إزالة المحتوى المحظور (null)
  return moviesWithNetflixCheck.filter((movie: Movie | null): movie is Movie => movie !== null);
}

// ==================== KIDS CONTENT ====================
export async function getKidsContent(): Promise<Movie[]> {
  const movies = await getCategoryMovies(GENRES_KIDS.ANIMATION, 'movie');
  const tv = await getCategoryMovies(GENRES_KIDS.ANIMATION, 'tv');
  return [...movies.slice(0, 10), ...tv.slice(0, 10)];
}

export async function getKidsTopRated(): Promise<Movie[]> {
  const movies = await getCategoryMovies(GENRES_KIDS.ANIMATION, 'movie');
  const tv = await getCategoryMovies(GENRES_KIDS.ANIMATION, 'tv');
  return [...movies, ...tv].sort((a, b) => b.match - a.match).slice(0, 10);
}

export async function getKidsFantasy(): Promise<Movie[]> {
  const movies = await getCategoryMovies(GENRES_KIDS.FANTASY, 'movie');
  const tv = await getCategoryMovies(GENRES_KIDS.FANTASY, 'tv');
  return [...movies.slice(0, 10), ...tv.slice(0, 10)];
}