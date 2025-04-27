function fetchPokemonData(pokemon) {
    return $.getJSON(`https://pokeapi.co/api/v2/pokemon/${pokemon}`);
}

function fetchPokemonSpecies(pokemonID) {
    return $.getJSON(`https://pokeapi.co/api/v2/pokemon-species/${pokemonID}`);
}

$("#topFive").hide();
$("#topFiveNav").click(() => {
    $("#topFive").show();
    $("#topFiveNav").addClass("page-item-active");

    const topFive = ["greninja", "blastoise", "mewtwo", "38", "blaziken"];

    // Loop through each Pokémon and process them one by one
    topFive.forEach(async (pokemon, index) => {
        const count = index + 1; // Use the index for unique IDs

        try {
            // Fetch main Pokémon data
            const data = await fetchPokemonData(pokemon);

            // Fetch species data for the description
            const speciesData = await fetchPokemonSpecies(data.id);

            //update ui
            // Add type-specific class to the card
            $(`.pokedex-card${count}`).addClass(`${data.types[0].type.name}-type`);
            
            // Set Pokémon name and type
            $(`#poke-name${count}`).text(data.name);
            $(`#poke-type${count}`).text(data.types[0].type.name);
            $(`#poke-type${count}`).addClass(`${data.types[0].type.name}-type`);
            // Find the English description
            let description = "No Description Available";
            for (let entry of speciesData.flavor_text_entries) {
                if (entry.language.name === 'en') {
                    description = entry.flavor_text;
                    break;
                }
            }
            
            $(`#poke-description${count}`).text(description);

            // Set the sprite image
            $(`#poke-sprite${count}`).attr("src", data.sprites.front_default);

            // Set the stats
            data.stats.forEach(stat => {
                const statName = stat.stat.name.replace("-", "_");
                const statValue = stat.base_stat;
                $(`#stat-${statName}${count}`).text(statValue);
            });

        } catch (error) {
            console.error("Error fetching data for", pokemon, error);
        }
    });
});
