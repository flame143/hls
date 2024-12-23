const API_KEY = '2283c405a7e1d26a6b72a786916aad85';
const API_BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const VIDEO_API_URL = 'https://multiembed.mov/directstream.php';

const categories = [
    { id: 10759, name: 'Action & Adventure' },
    { id: 35, name: 'Comedy' },
    { id: 18, name: 'Drama' },
    { id: 10765, name: 'Sci-Fi & Fantasy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 10751, name: 'Family' },
    { id: 10768, name: 'War & Politics' },
    { id: 16, name: 'Anime & Animation' }
];

const state = {
    categoryPages: {},
    activeGenre: null,
    currentShow: {
        id: null,
        season: 1,
        episode: 1,
        totalSeasons: 1
    }
};

// API Functions
async function fetchTVShows(categoryId, page = 1) {
    try {
        const response = await axios.get(`${API_BASE_URL}/discover/tv`, {
            params: {
                api_key: API_KEY,
                with_genres: categoryId,
                sort_by: 'popularity.desc',
                page: page,
                ...(categoryId === 16 && {
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc'
                })
            }
        });
        return response.data.results;
    } catch (error) {
        console.error('Error fetching TV shows:', error);
        return [];
    }
}

async function fetchTVShowDetails(showId) {
    try {
        const response = await axios.get(`${API_BASE_URL}/tv/${showId}`, {
            params: {
                api_key: API_KEY
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching TV show details:', error);
        return null;
    }
}

async function fetchSeasonDetails(showId, seasonNumber) {
    try {
        const response = await axios.get(`${API_BASE_URL}/tv/${showId}/season/${seasonNumber}`, {
            params: {
                api_key: API_KEY
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching season details:', error);
        return null;
    }
}

async function searchTVShows(query) {
    try {
        const response = await axios.get(`${API_BASE_URL}/search/tv`, {
            params: {
                api_key: API_KEY,
                query: query
            }
        });
        return response.data.results;
    } catch (error) {
        console.error('Error searching TV shows:', error);
        return [];
    }
}

// UI Creation Functions
function createTVShowElement(show) {
    const showElement = document.createElement('div');
    showElement.className = 'movie';
    showElement.innerHTML = `
        <img src="${show.poster_path ? IMG_BASE_URL + show.poster_path : 'placeholder.jpg'}" alt="${show.name}">
        <div class="movie-info">
            <div class="movie-title">${show.name}</div>
            <div class="movie-rating">
                <i class="fas fa-star"></i> ${show.vote_average.toFixed(1)}
            </div>
        </div>
    `;
    showElement.addEventListener('click', () => openModal(show.id));
    return showElement;
}

async function createEpisodeSelector(showId, seasonNumber) {
    const seasonData = await fetchSeasonDetails(showId, seasonNumber);
    if (!seasonData) return;
    
    const episodeSelect = document.createElement('select');
    episodeSelect.id = 'episode-select';
    episodeSelect.className = 'episode-select';
    
    seasonData.episodes.forEach((episode) => {
        const option = document.createElement('option');
        option.value = episode.episode_number;
        option.textContent = `Episode ${episode.episode_number}: ${episode.name}`;
        episodeSelect.appendChild(option);
    });
    
    episodeSelect.addEventListener('change', (e) => {
        state.currentShow.episode = parseInt(e.target.value);
        updatePlayer();
    });
    
    return episodeSelect;
}

async function createSeasonSelector(showId, totalSeasons) {
    const seasonSelect = document.createElement('select');
    seasonSelect.id = 'season-select';
    seasonSelect.className = 'season-select';
    
    for (let i = 1; i <= totalSeasons; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Season ${i}`;
        seasonSelect.appendChild(option);
    }
    
    seasonSelect.addEventListener('change', async (e) => {
        const seasonNumber = parseInt(e.target.value);
        state.currentShow.season = seasonNumber;
        state.currentShow.episode = 1;
        
        const episodeSelect = await createEpisodeSelector(showId, seasonNumber);
        const oldEpisodeSelect = document.getElementById('episode-select');
        if (oldEpisodeSelect) {
            oldEpisodeSelect.replaceWith(episodeSelect);
        }
        
        updatePlayer();
    });
    
    return seasonSelect;
}

// Render Functions
async function renderCategory(category, container) {
    const categoryElement = document.createElement('div');
    categoryElement.className = 'category';
    categoryElement.innerHTML = `<h2>${category.name}</h2>`;
    const showsContainer = document.createElement('div');
    showsContainer.className = 'movies';
    
    state.categoryPages[category.id] = state.categoryPages[category.id] || 1;
    const shows = await fetchTVShows(category.id, state.categoryPages[category.id]);
    
    shows.forEach(show => {
        showsContainer.appendChild(createTVShowElement(show));
    });
    
    categoryElement.appendChild(showsContainer);
    
    const loadMoreButton = document.createElement('button');
    loadMoreButton.className = 'load-more';
    loadMoreButton.textContent = 'Load More';
    loadMoreButton.addEventListener('click', async () => {
        state.categoryPages[category.id]++;
        const newShows = await fetchTVShows(category.id, state.categoryPages[category.id]);
        newShows.forEach(show => {
            showsContainer.appendChild(createTVShowElement(show));
        });
    });
    
    categoryElement.appendChild(loadMoreButton);
    container.appendChild(categoryElement);
}

async function renderCategories() {
    const categoriesContainer = document.getElementById('categories');
    categoriesContainer.innerHTML = '';
    for (const category of categories) {
        if (!state.activeGenre || state.activeGenre === category.id) {
            await renderCategory(category, categoriesContainer);
        }
    }
}

// Modal Functions
function updatePlayer() {
    const player = document.getElementById('player');
    const videoUrl = `${VIDEO_API_URL}?video_id=${state.currentShow.id}&tmdb=1&s=${state.currentShow.season}&e=${state.currentShow.episode}`;
    player.src = videoUrl;
}

async function openModal(showId) {
    const modal = document.getElementById('modal');
    const showDetails = await fetchTVShowDetails(showId);
    
    if (!showDetails) return;
    
    state.currentShow = {
        id: showId,
        season: 1,
        episode: 1,
        totalSeasons: showDetails.number_of_seasons
    };
    
    let selectorContainer = document.getElementById('episode-selector-container');
    if (!selectorContainer) {
        selectorContainer = document.createElement('div');
        selectorContainer.id = 'episode-selector-container';
        selectorContainer.className = 'episode-selector-container';
        document.querySelector('.modal-content').insertBefore(selectorContainer, document.getElementById('player'));
    }
    
    selectorContainer.innerHTML = '';
    
    const seasonSelect = await createSeasonSelector(showId, showDetails.number_of_seasons);
    const episodeSelect = await createEpisodeSelector(showId, 1);
    
    selectorContainer.appendChild(seasonSelect);
    selectorContainer.appendChild(episodeSelect);
    
    updatePlayer();
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('modal');
    const player = document.getElementById('player');
    modal.style.display = 'none';
    player.src = '';
}

// Search Functions
async function handleSearch() {
    const query = searchInput.value.trim();
    const searchResults = document.getElementById('search-results');
    const categoriesContainer = document.getElementById('categories');

    if (query) {
        const results = await searchTVShows(query);
        searchResults.innerHTML = '<h2>Search Results</h2>';
        const showsContainer = document.createElement('div');
        showsContainer.className = 'movies';
        results.forEach(show => {
            showsContainer.appendChild(createTVShowElement(show));
        });
        searchResults.appendChild(showsContainer);
        searchResults.style.display = 'block';
        categoriesContainer.style.display = 'none';
    } else {
        searchResults.style.display = 'none';
        categoriesContainer.style.display = 'block';
    }
}

// Genre Filter
function createGenreFilter() {
    const genreFilter = document.getElementById('genre-filter');
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'genre-button';
        button.textContent = category.name;
        button.addEventListener('click', () => {
            if (state.activeGenre === category.id) {
                state.activeGenre = null;
                button.classList.remove('active');
            } else {
                state.activeGenre = category.id;
                document.querySelectorAll('.genre-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            }
            renderCategories();
        });
        genreFilter.appendChild(button);
    });
}

// Event Listeners
document.querySelector('.close').addEventListener('click', closeModal);
window.addEventListener('click', (event) => {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        closeModal();
    }
});

const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
searchInput.addEventListener('input', handleSearch);
searchButton.addEventListener('click', handleSearch);

// Initialize
createGenreFilter();
renderCategories();
