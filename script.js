console.log($); // to verify that jquery loaded kapoy nakog debugging

function fetchPokemonData(pokemon) {
  return $.getJSON(`https://pokeapi.co/api/v2/pokemon/${pokemon}`);
}
// Fetch a list of pokemons
async function fetchPokemonList(offset, limit) {
  try {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`
    );
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error fetching Pokémon list:", error);
    return [];
  }
}

// Fetch details for a specific pokemon
async function fetchPokemonDetails(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Pokémon details:", error);
    return null;
  }
}

// Fetch pokemon species info
async function fetchPokemonSpecies(pokemonID) {
  try {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon-species/${pokemonID}`
    );
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Pokémon species:", error);
    return null;
  }
}

let offset = 0; // Track how many Pokémon we've already loaded
let limit = 20; // Limiter for efficiency
let isLoading = false; // Flag to prevent multiple simultaneous loads

// Function to render pokemons
async function renderPokemonCards(pokemonArray) {
  for (let i = 0; i < pokemonArray.length; i++) {
    const pokemonDetails = await fetchPokemonDetails(pokemonArray[i].url);
    if (!pokemonDetails) continue;

    console.log("Rendered Pokémon details:", pokemonDetails);

    let typeHtml = "";
    pokemonDetails.types.forEach((typeInfo) => {
      typeHtml += `<span class="${typeInfo.type.name}-type">${typeInfo.type.name}</span> `;
    });

    let newDiv = $("<div>", {
      class: "col-2",
      id: `pokemon-${pokemonDetails.id}`, // Unique ID for each Pokémon
      html: `
                <div class="pokemon-card border p-1 rounded text-center">
                    <div class="bg-overlay">
                        <img src="${
                          pokemonDetails.sprites.front_default || ""
                        }" alt="${pokemonDetails.name}" style="width:100px;">
                        <h3>${pokemonDetails.name}</h3>
                        <div class="d-flex justify-content-center">
                            ${typeHtml}
                        </div>
                    </div>
                </div>`,
    });

    $(".all-container").append(newDiv);
  }

  // Log a message when we're done rendering
  console.log(
    `Rendered ${pokemonArray.length} Pokémon, total offset now: ${offset}`
  );
}

// Handles scroll when user wants to see more
function handleScroll() {
  if (isLoading) {
    console.log("Loading in progress, ignoring scroll event");
    return; // Prevent multiple simultaneous loads
  }

  const windowHeight = $(window).height();
  const scrollTop = $(window).scrollTop();
  const documentHeight = $(document).height();
  const scrollBottom = windowHeight + scrollTop;
  const scrollRemaining = documentHeight - scrollBottom;

  console.log(
    `Scroll metrics - Window Height: ${windowHeight}, Scroll Top: ${scrollTop}, Document Height: ${documentHeight}, Remaining: ${scrollRemaining}`
  );

  // Check if the user is near the bottom (within 300px)
  if (scrollRemaining < 300) {
    console.log("Near bottom, loading more Pokémon");
    loadMorePokemon();
  }
}

// Loads more pokemon
async function loadMorePokemon() {
  if (isLoading) return;

  isLoading = true;
  console.log(`Loading more Pokémon starting at offset ${offset}`);

  // Add a loading indicator
  $(".all-container").append(
    '<div id="loading-indicator" class="col-12 text-center"><p>Loading more Pokémon...</p></div>'
  );

  // Fetch next batch of Pokémon
  const data = await fetchPokemonList(offset, limit);

  // Remove loading indicator
  $("#loading-indicator").remove();

  if (data.length > 0) {
    await renderPokemonCards(data);
    // Increase the offset for the next load
    offset += limit;
  } else {
    console.log("No more Pokémon to load");
    // Show end of list message
    $(".all-container").append(
      '<div class="col-12 text-center"><p>No more Pokémon to display</p></div>'
    );
  }

  isLoading = false;
}

// Main code
$(document).ready(() => {
  $("#allNav").addClass("page-item-active"); //makes nav active
  // Create container if it doesn't exist
  if ($(".all-container").length === 0) {
    $("body").append(
      '<div class="container"><div class="row all-container"></div></div>'
    );
  }

  // Load initial set of Pokémon
  loadMorePokemon();

  // Attach the scroll event listener
  $(window).on("scroll", handleScroll);
});

$("#allNav").click(() => {
  //makes nav active
  $("#allNav").addClass("page-item-active");
  //removes activeness to nav
  $("#topFiveNav").removeClass("page-item-active");
  //hide topfive, show main
  $("#topFive").hide();
  $("#all").show();
});

$("#topFive").hide();
$("#topFiveNav").click(() => {
  //show topfive, hide main
  $("#all").hide();
  $("#topFive").show();
  //removes activeness to nav
  $("#allNav").removeClass("page-item-active");
  //makes nav active
  $("#topFiveNav").addClass("page-item-active");
  //my top five pokemons
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
        if (entry.language.name === "en") {
          description = entry.flavor_text;
          break;
        }
      }

      $(`#poke-description${count}`).text(description);

      // Set the sprite image
      $(`#poke-sprite${count}`).attr("src", data.sprites.front_default);

      // Set the stats
      data.stats.forEach((stat) => {
        const statName = stat.stat.name.replace("-", "_");
        const statValue = stat.base_stat;
        $(`#stat-${statName}${count}`).text(statValue);
      });
    } catch (error) {
      console.error("Error fetching data for", pokemon, error);
    }
  });
});
