const API_KEY = '2283c405a7e1d26a6b72a786916aad85';
const API_BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const categories = [
    { id: 10759, name: 'Action & Adventure' },
    { id: 35, name: 'Comedy' },
    { id: 18, name: 'Drama' },
    { id: 10765, name: 'Sci-Fi & Fantasy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' }
];

const state = {
    categoryPages: {},
    activeGenre: null
};

async function fetchTVShows(categoryId, page = 1) {
    try {
        const response = await axios.get(`${API_BASE_URL}/discover/tv`, {
            params: {
                api_key: API_KEY,
                with_genres: categoryId,
                sort_by: 'popularity.desc',
                page: page
            }
        });
        return response.data.results;
    } catch (error) {
        console.error('Error fetching TV shows:', error);
        return [];
    }
}

function createTVShowElement(show) {
    const showElement = document.createElement('div');
    showElement.className = 'movie'; // keeping class name for CSS compatibility
    showElement.innerHTML = `
        <img src="${IMG_BASE_URL}${show.poster_path}" alt="${show.name}">
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

function openModal(tmdbId) {
    const modal = document.getElementById('modal');
    const player = document.getElementById('player');
    player.src = `https://vidsrc.xyz/embed/tv/${tmdbId}/1/1`; // Default to Season 1, Episode 1
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('modal');
    const player = document.getElementById('player');
    modal.style.display = 'none';
    player.src = '';
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

createGenreFilter();
renderCategories();
