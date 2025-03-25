'use strict'

document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const elements = {
        homeLink: document.getElementById('home-link'),
        miniaturasLink: document.getElementById('miniaturas-link'),
        drinksLink: document.getElementById('drinks-link'),
        miniaturasCta: document.getElementById('miniaturas-cta'),
        drinksCta: document.getElementById('drinks-cta'),
        homePage: document.getElementById('home-page'),
        miniaturasPage: document.getElementById('miniaturas-page'),
        drinksPage: document.getElementById('drinks-page'),
        backButton: document.getElementById('back-button'),
        searchMiniaturas: document.getElementById('search-miniaturas'),
        searchDrinks: document.getElementById('search-drinks'),
        miniaturasContainer: document.getElementById('miniaturas-container'),
        drinksContainer: document.getElementById('drinks-container'),
        drinkDetailsModal: document.getElementById('drink-details'),
        closeButton: document.querySelector('.close-button'),
        drinkDetailsContent: document.getElementById('drink-details-content')
    };

    // Estado da aplicação
    const state = {
        currentPage: 'home',
        allIngredients: [],
        allDrinks: [],
        currentDrinks: [],
        searchTimeout: null,
        previousPage: null
    };

    // Configuração da API
    const apiConfig = {
        baseUrl: 'https://www.thecocktaildb.com/api/json/v1/1/',
        endpoints: {
            ingredients: 'list.php?i=list',
            drinks: 'search.php?s=',
            drinksByIngredient: 'filter.php?i=',
            drinkDetails: 'lookup.php?i='
        },
        fallbackImage: 'https://www.thecocktaildb.com/images/media/drink/placeholder.png'
    };

    // Inicialização
    init();

    function init() {
        setupEventListeners();
        switchPage('home');
    }

    function setupEventListeners() {
        // Navegação
        elements.homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            switchPage('home');
        });

        elements.miniaturasLink.addEventListener('click', async (e) => {
            e.preventDefault();
            await fetchIngredients();
            switchPage('miniaturas');
        });

        elements.drinksLink.addEventListener('click', async (e) => {
            e.preventDefault();
            await fetchAllDrinks();
            switchPage('drinks');
        });

        // CTAs da página inicial
        elements.miniaturasCta.addEventListener('click', async (e) => {
            e.preventDefault();
            await fetchIngredients();
            switchPage('miniaturas');
        });

        elements.drinksCta.addEventListener('click', async (e) => {
            e.preventDefault();
            await fetchAllDrinks();
            switchPage('drinks');
        });

        elements.backButton.addEventListener('click', () => {
            if (state.currentPage === 'drinks' && state.currentDrinks !== state.allDrinks) {
                // Se estiver vendo drinks filtrados por ingrediente, volta para lista completa
                displayDrinks(state.allDrinks);
                state.currentDrinks = state.allDrinks;
                elements.searchDrinks.value = '';
            } else {
                switchPage(state.previousPage || 'home');
            }
        });

        // Busca em tempo real para ingredientes
        elements.searchMiniaturas.addEventListener('input', () => {
            clearTimeout(state.searchTimeout);
            state.searchTimeout = setTimeout(() => {
                filterIngredients(elements.searchMiniaturas.value);
            }, 300);
        });

        // Busca em tempo real para drinks
        elements.searchDrinks.addEventListener('input', () => {
            clearTimeout(state.searchTimeout);
            state.searchTimeout = setTimeout(() => {
                filterDrinks(elements.searchDrinks.value);
            }, 300);
        });

        // Modal
        elements.closeButton.addEventListener('click', () => {
            elements.drinkDetailsModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === elements.drinkDetailsModal) {
                elements.drinkDetailsModal.style.display = 'none';
            }
        });
    }

    // Funções de navegação
    function switchPage(page) {
        // Atualizar página anterior antes de mudar
        if (page !== 'home' && state.currentPage !== page) {
            state.previousPage = state.currentPage;
        }
        
        // Esconder todas as páginas
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        
        // Mostrar a página selecionada
        if (page === 'home') {
            elements.homePage.classList.add('active');
            elements.backButton.classList.add('hidden');
            state.currentPage = 'home';
        } else if (page === 'miniaturas') {
            elements.miniaturasPage.classList.add('active');
            elements.backButton.classList.remove('hidden');
            state.currentPage = 'miniaturas';
            elements.searchMiniaturas.value = '';
        } else if (page === 'drinks') {
            elements.drinksPage.classList.add('active');
            elements.backButton.classList.remove('hidden');
            state.currentPage = 'drinks';
            elements.searchDrinks.value = '';
        }
        
        // Rolagem para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Funções da API (mantidas as mesmas do código original)
    async function fetchData(endpoint) {
        try {
            const response = await fetch(`${apiConfig.baseUrl}${endpoint}`);
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data) {
                throw new Error('Resposta da API vazia');
            }
            
            return data;
        } catch (error) {
            console.error('Erro na requisição:', error);
            throw error;
        }
    }

    async function fetchIngredients() {
        try {
            showLoading(elements.miniaturasContainer, 'Carregando ingredientes...');
            
            const data = await fetchData(apiConfig.endpoints.ingredients);
            
            if (!data.drinks) {
                showError(elements.miniaturasContainer, 'Nenhum ingrediente encontrado');
                return;
            }
            
            state.allIngredients = data.drinks;
            displayIngredients(state.allIngredients);
        } catch (error) {
            showError(elements.miniaturasContainer, 'Erro ao carregar ingredientes');
        }
    }

    async function fetchAllDrinks() {
        try {
            // Se já tiver carregado os drinks antes, não precisa carregar de novo
            if (state.allDrinks.length > 0) {
                displayDrinks(state.allDrinks);
                return;
            }
            
            showLoading(elements.drinksContainer, 'Carregando drinks...');
            
            const data = await fetchData(apiConfig.endpoints.drinks);
            
            if (!data.drinks) {
                showError(elements.drinksContainer, 'Nenhum drink encontrado');
                return;
            }
            
            state.allDrinks = data.drinks.sort((a, b) => a.strDrink.localeCompare(b.strDrink));
            state.currentDrinks = state.allDrinks;
            displayDrinks(state.allDrinks);
        } catch (error) {
            showError(elements.drinksContainer, 'Erro ao carregar drinks');
        }
    }

    async function fetchDrinksByIngredient(ingredient) {
        try {
            showLoading(elements.drinksContainer, `Carregando drinks com ${ingredient}...`);
            
            const data = await fetchData(`${apiConfig.endpoints.drinksByIngredient}${encodeURIComponent(ingredient)}`);
            
            if (!data.drinks) {
                showError(elements.drinksContainer, 'Nenhum drink encontrado com este ingrediente');
                return;
            }
            
            state.currentDrinks = data.drinks.sort((a, b) => a.strDrink.localeCompare(b.strDrink));
            displayDrinks(state.currentDrinks);
            switchPage('drinks');
        } catch (error) {
            showError(elements.drinksContainer, 'Erro ao buscar drinks por ingrediente');
        }
    }

    async function showDrinkDetails(drinkId) {
        try {
            showLoading(elements.drinkDetailsContent, 'Carregando detalhes do drink...');
            elements.drinkDetailsModal.style.display = 'block';
            
            const data = await fetchData(`${apiConfig.endpoints.drinkDetails}${drinkId}`);
            
            if (!data.drinks || !data.drinks[0]) {
                throw new Error('Drink não encontrado');
            }
            
            const drink = data.drinks[0];
            displayDrinkDetails(drink);
        } catch (error) {
            showError(elements.drinkDetailsContent, 'Erro ao carregar detalhes do drink');
        }
    }

    // Funções de exibição
    function displayIngredients(ingredients) {
        if (!ingredients || ingredients.length === 0) {
            showError(elements.miniaturasContainer, 'Nenhum ingrediente encontrado');
            return;
        }
        
        elements.miniaturasContainer.innerHTML = '';
        
        ingredients.forEach(ingredient => {
            const card = document.createElement('div');
            card.className = 'drink-card';
            
            card.innerHTML = `
                <img src="https://www.thecocktaildb.com/images/ingredients/${ingredient.strIngredient1}-Medium.png" 
                     alt="${ingredient.strIngredient1}"
                     onerror="this.src='${apiConfig.fallbackImage}'">
                <h3>${ingredient.strIngredient1}</h3>
            `;
            
            card.addEventListener('click', () => {
                fetchDrinksByIngredient(ingredient.strIngredient1);
            });
            
            elements.miniaturasContainer.appendChild(card);
        });
    }

    function displayDrinks(drinks) {
        if (!drinks || drinks.length === 0) {
            showError(elements.drinksContainer, 'Nenhum drink encontrado');
            return;
        }
        
        elements.drinksContainer.innerHTML = '';
        
        drinks.forEach(drink => {
            const card = document.createElement('div');
            card.className = 'drink-card';
            
            card.innerHTML = `
                <img src="${drink.strDrinkThumb || apiConfig.fallbackImage}" 
                     alt="${drink.strDrink}"
                     onerror="this.src='${apiConfig.fallbackImage}'">
                <h3>${drink.strDrink}</h3>
            `;
            
            card.addEventListener('click', () => {
                showDrinkDetails(drink.idDrink);
            });
            
            elements.drinksContainer.appendChild(card);
        });
    }

    function displayDrinkDetails(drink) {
        const ingredients = [];
        for (let i = 1; i <= 15; i++) {
            const ingredient = drink[`strIngredient${i}`];
            const measure = drink[`strMeasure${i}`];
            
            if (ingredient) {
                ingredients.push({
                    ingredient,
                    measure: measure || 'A gosto'
                });
            }
        }
        
        elements.drinkDetailsContent.innerHTML = `
            <div class="drink-detail-header">
                <img src="${drink.strDrinkThumb || apiConfig.fallbackImage}" 
                     alt="${drink.strDrink}"
                     onerror="this.src='${apiConfig.fallbackImage}'">
                <div class="drink-info">
                    <h2>${drink.strDrink}</h2>
                    <p><strong>Categoria:</strong> ${drink.strCategory || 'Não especificado'}</p>
                    <p><strong>Tipo:</strong> ${drink.strAlcoholic || 'Não especificado'}</p>
                    <p><strong>Vidro:</strong> ${drink.strGlass || 'Não especificado'}</p>
                    <div class="ingredients-list">
                        <h3>Ingredientes:</h3>
                        <ul>
                            ${ingredients.map(item => `
                                <li>${item.measure} ${item.ingredient}</li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
            <div class="drink-instructions">
                <h3>Instruções:</h3>
                <p>${drink.strInstructions || 'Instruções não disponíveis'}</p>
                ${drink.strInstructionsES ? `
                    <h3>Instrucciones en Español:</h3>
                    <p>${drink.strInstructionsES}</p>
                ` : ''}
            </div>
        `;
    }

    // Funções auxiliares
    function filterIngredients(query) {
        if (!query) {
            displayIngredients(state.allIngredients);
            return;
        }
        
        const filtered = state.allIngredients.filter(ingredient => 
            ingredient.strIngredient1.toLowerCase().includes(query.toLowerCase())
        );
        displayIngredients(filtered);
    }

    function filterDrinks(query) {
        if (!query) {
            displayDrinks(state.allDrinks);
            state.currentDrinks = state.allDrinks;
            return;
        }
        
        const filtered = state.allDrinks.filter(drink => 
            drink.strDrink.toLowerCase().includes(query.toLowerCase())
        );
        state.currentDrinks = filtered;
        displayDrinks(filtered);
    }

    function showLoading(container, message) {
        container.innerHTML = `
            <div class="loading-message">
                <i class="fas fa-spinner fa-spin"></i>
                <p>${message}</p>
            </div>
        `;
    }

    function showError(container, message) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button onclick="window.location.reload()">
                    <i class="fas fa-sync-alt"></i> Tentar novamente
                </button>
            </div>
        `;
    }
});