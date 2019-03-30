import axios from 'axios';
import {id, key, proxy} from '../config';
import { runInThisContext } from 'vm';

export default class Search {
    constructor(query) {
        this.query = query;
    }
    async getResults() {
        try {
            const res = await axios(`${proxy}https://api.edamam.com/search?q=${this.query}&app_id=${id}&app_key=${key}&from=0&to=30`);
            this.recipes = res.data.hits.map(hit => hit.recipe);
            this.recipes.forEach((recipe, index) => this.recipes[index].ingredients = this.standardizeIngredients(recipe.ingredientLines));
            this.tidyRecipes();
            this.createIDs();
            console.log(this.recipes);
        } catch (error) {
            alert(error);
        }
    };

    // Remove any failed recipes from the list
    tidyRecipes() {
        this.recipes = this.recipes.filter(recipe => recipe.ingredients.length > 0);
    }

    calculateServings() {
        this.servings = 4;
    };

    // Creates IDs from the URIs
    createIDs() {
        this.recipes.forEach((recipe, index) => this.recipes[index].id = recipe.uri.substring(recipe.uri.indexOf('_') + 1, recipe.uri.length));
    }

    standardizeIngredients(ingredients) {
        const unitsLong = ['tablespoons', 'tablespoon', 'ounce', 'ounces', 'ozs', 'teaspoon', 'teaspoons', 'cups', 'pounds', 'grams', 'gram'];
        const unitsShort = ['tbsp', 'tbsp', 'oz', 'oz', 'oz', 'tsp', 'tsp', 'cup', 'pound', 'g', 'g'];
        const units = [...unitsShort, 'kg','g'];

        try {
            ingredients = ingredients.map(element => {
                // Normalize units
                let ingredient = element.toLowerCase();
                unitsLong.forEach((unit, index) => {
                    ingredient = ingredient.replace(unit, unitsShort[index]);
                })
                
                // Remove parenthesis
                ingredient = ingredient.replace(/ *\([^)]*\) */g, " ");

                // Deal with bad unicode fractions
                ingredient = ingredient.replace(String.fromCharCode(188), ' 1/4');
                ingredient = ingredient.replace(String.fromCharCode(189), ' 1/2');
                ingredient = ingredient.replace(String.fromCharCode(190), ' 3/4');
                ingredient = ingredient.replace(String.fromCharCode(8532), ' 2/3');

                // First remove any trailing units which are suggestive at the end of recipes which breaks things i.e. 1 chicken, about 2-8 pounds
                unitsShort.forEach( (unit, index) => {
                    const commaIndex = ingredient.indexOf(',');
                    // If there is a comma then there may be more information with extra units
                    if (commaIndex > - 1){
                        const ind = ingredient.substring(commaIndex, ingredient.length).indexOf(unit);
                        // If the extra unit has been found, then remove everything after the comma for cleaness
                        if (ind > - 1) {
                            ingredient = ingredient.replace(ingredient.substring(commaIndex, ingredient.length), '');
                        }
                        // if (unit === arrayIngredients[index]) arrayIngredients.pop()
                    }
                });

                // Parse ingredients into count, unit and ingredient
                const arrayIngredients = ingredient.split(' ');

                // Remove any white space from the beginning of the ingredient
                if (arrayIngredients[0] === "") arrayIngredients.shift();

                // Find where in the array the unit is
                const unitIndex = arrayIngredients.findIndex(element2 => units.includes(element2));

                let objectIngredient;
                // This block deals with all the cases of recipe formats
                if (unitIndex > -1) {
                    // Grab all the ingredient counts i.e. 1 or 2 1/2
                    let count = '';
                    const arrayCount = arrayIngredients.slice(0, unitIndex);
                    if (arrayCount.length === 1 ) {
                            count = eval(arrayIngredients[0].replace('-', '+')).toFixed(2);
                    } else {
                        count = eval(arrayIngredients.slice(0, unitIndex).join('+')).toFixed(2);
                    }
                    objectIngredient = {
                        count,
                        unit: arrayIngredients[unitIndex],
                        ingredient: arrayIngredients.slice(unitIndex + 1).join(' ')
                    }

                } else if (parseFloat(arrayIngredients[0], 10)) {
                    // There is no unit but first element is a number
                    objectIngredient = {
                        count: parseFloat(arrayIngredients[0], 10),
                        unit: '',
                        ingredient: arrayIngredients.slice(1).join(' ')
                    }
                } else if (unitIndex === -1) {
                    objectIngredient = {
                        count: 1,
                        unit: '',
                        ingredient: ingredient.replace(',', '')
                    }
                }

                // Some post splitting tidy ups
                objectIngredient.ingredient = objectIngredient.ingredient.replace('-', '').replace('-', '');
                // Remove any starting white space
                if (objectIngredient.ingredient[0] === ' ') objectIngredient.ingredient = objectIngredient.ingredient.substring(1, ingredient.length);

                return objectIngredient;
            });
            return ingredients;
        } catch(error) {
            return []
        }
    };

    // Increase or decrease the ingredients count based on the number of servings
    updateServings (type) {
        const newServings = type === 'dec' ? this.servings - 1: this.servings + 1;

        this.ingredients.forEach(ingredient => {
            ingredient.count = ingredient.count * (newServings / this.servings);
        })

        this.servings = newServings;
    };
}