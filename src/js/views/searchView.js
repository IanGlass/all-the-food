import {elements} from './base'

export const getInput = () => elements.searchInput.value;

const limitRecipeTitle = (title, limit = 17) => {
    const newTitle = [];
    if (title.length > limit) {
        title.split(' ').reduce((acc, curr) => {
            if (acc + curr.length <= limit) {
                newTitle.push(curr);
            }
            return acc + curr.length;
        }, 0)
        return `${newTitle.join('')} ...`;
    }
    return title;
}

// Render a single recipe
const renderRecipe = recipe => {
    const markup = `
    <li>
        <a class="results__link results__link" href="#${recipe.recipe_id}">
            <figure class="results__fig">
                <img src=${recipe.image_url} alt="${recipe.title}">
            </figure>
            <div class="results__data">
                <h4 class="results__name">${limitRecipeTitle(recipe.title)}</h4>
                <p class="results__author">${recipe.publisher}</p>
            </div>
        </a>
    </li>`;
    elements.searchResultList.insertAdjacentHTML('beforeend', markup);
}

export const renderResults = (recipes) => {
    // Increment through recipe list and render each one
    recipes.forEach(element => renderRecipe(element));
}

export const clearResults = () => {
    // Clear the input field
    elements.searchInput.value = '';

    // Clear all results in recipe list
    elements.searchResultList.innerHTML = '';
}