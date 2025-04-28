// Enhanced Pokédex JavaScript

// Core API Functions
function fetchPokemonData(pokemon) {
  return $.getJSON(`https://pokeapi.co/api/v2/pokemon/${pokemon}`);
}

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

// Global Variables
let offset = 0;
let limit = 20;
let isLoading = false;
let searchTimeout;

// Helper Functions
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function cleanDescription(text) {
  return text.replace(/\f/g, ' ').replace(/\n/g, ' ').replace(/\u000c/g, ' ');
}

function getEnglishDescription(speciesData) {
  if (!speciesData || !speciesData.flavor_text_entries) return "No description available";
  
  for (let entry of speciesData.flavor_text_entries) {
    if (entry.language.name === "en") {
      return cleanDescription(entry.flavor_text);
    }
  }
  return "No English description available";
}

// Rendering Functions
async function renderPokemonCards(pokemonArray) {
  const container = $(".all-container");
  
  for (let i = 0; i < pokemonArray.length; i++) {
    // Create a skeleton loader first
    const skeletonId = `skeleton-${offset + i}`;
    const skeletonCard = $("<div>", {
      class: "col-6 col-sm-4 col-md-3 col-lg-2",
      id: skeletonId,
      html: `
        <div class="pokemon-card">
          <div class="loading-skeleton" style="width: 120px; height: 120px; border-radius: 50%;"></div>
          <div class="loading-skeleton" style="width: 70%; height: 24px;"></div>
          <div class="loading-skeleton" style="width: 50%; height: 20px;"></div>
        </div>
      `
    });
    container.append(skeletonCard);
    
    // Fetch and render actual data
    const pokemonDetails = await fetchPokemonDetails(pokemonArray[i].url);
    if (!pokemonDetails) {
      $(`#${skeletonId}`).remove();
      continue;
    }
    
    let typeHtml = "";
    pokemonDetails.types.forEach((typeInfo) => {
      typeHtml += `<span class="${typeInfo.type.name}-type p-2 rounded-5 text-white">${typeInfo.type.name}</span>`;
    });
    
    const pokemonCard = $("<div>", {
      class: "col-6 col-sm-5 col-md-3 col-lg-2",
      id: `pokemon-${pokemonDetails.id}`,
      html: `
        <div class="pokemon-card">
          <img 
            src="${pokemonDetails.sprites.front_default || ""}" 
            alt="${pokemonDetails.name}" 
            loading="lazy"
          >
          <h3>${capitalizeFirstLetter(pokemonDetails.name)}</h3>
          <div class="d-flex justify-content-center">
            ${typeHtml}
          </div>
        </div>
      `
    });
    
    // Replace skeleton with actual card
    $(`#${skeletonId}`).replaceWith(pokemonCard);
    
    // Add click event to show details
    $(`#pokemon-${pokemonDetails.id}`).on("click", function() {
      showPokemonModal(pokemonDetails);
    });
  }
  
  console.log(`Rendered ${pokemonArray.length} Pokémon, total offset now: ${offset}`);
}

// Scroll Handler
function handleScroll() {
  if (isLoading) return;
  
  // Only trigger infinite scroll if the "all" tab is visible
  if ($("#all").is(":hidden")) return;
  
  const windowHeight = $(window).height();
  const scrollTop = $(window).scrollTop();
  const documentHeight = $(document).height();
  const scrollRemaining = documentHeight - (windowHeight + scrollTop);
  
  if (scrollRemaining < 300) {
    loadMorePokemon();
  }
}

// Load More Pokemon
async function loadMorePokemon() {
  if (isLoading) return;
  
  isLoading = true;
  
  // Add a loading indicator
  $(".all-container").append(`
    <div id="loading-indicator" class="col-12 text-center py-3">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading more Pokémon...</p>
    </div>
  `);
  
  // Fetch next batch of Pokémon
  const data = await fetchPokemonList(offset, limit);
  
  // Remove loading indicator
  $("#loading-indicator").remove();
  
  if (data.length > 0) {
    await renderPokemonCards(data);
    offset += limit;
  } else {
    $(".all-container").append(`
      <div class="col-12 text-center">
        <p>You've caught 'em all! No more Pokémon to display.</p>
      </div>
    `);
  }
  
  isLoading = false;
}

// Modal Display Function
function showPokemonModal(pokemonData) {
  console.log("Showing modal for:", pokemonData.name);
  // Check if modal exists, if not create it
  if ($("#pokemonModal").length === 0) {
    $("body").append(`
      <div class="modal fade" id="pokemonModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="modalPokemonName"></h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" id="modalContent">
              <!-- Content will be dynamically inserted -->
            </div>
          </div>
        </div>
      </div>
    `);
  }
  
  // Fetch additional data and populate modal
  fetchPokemonSpecies(pokemonData.id).then(speciesData => {
    const description = getEnglishDescription(speciesData);
    
    let typesHtml = "";
    pokemonData.types.forEach(type => {
      typesHtml += `<span class="${type.type.name}-type me-2">${type.type.name}</span>`;
    });
    
    let statsHtml = "";
    pokemonData.stats.forEach(stat => {
      const statName = stat.stat.name.replace("-", " ");
      statsHtml += `
        <div class="stat-item mb-2">
          <div class="d-flex justify-content-between">
            <span>${capitalizeFirstLetter(statName)}</span>
            <span>${stat.base_stat}</span>
          </div>
          <div class="progress" style="height: 8px;">
            <div class="progress-bar bg-danger" role="progressbar" 
                 style="width: ${Math.min(100, (stat.base_stat / 255) * 100)}%" 
                 aria-valuenow="${stat.base_stat}" aria-valuemin="0" aria-valuemax="255"></div>
          </div>
        </div>
      `;
    });
    
    // Update modal content
    $("#modalPokemonName").text(capitalizeFirstLetter(pokemonData.name));
    $("#modalContent").html(`
      <div class="text-center mb-3">
        <img src="${pokemonData.sprites.other['official-artwork'].front_default || pokemonData.sprites.front_default}" 
             alt="${pokemonData.name}" class="img-fluid" style="max-height: 200px;">
      </div>
      <div class="mb-3 text-center">
        ${typesHtml}
      </div>
      <p class="mb-3">${description}</p>
      <div class="row mb-3">
        <div class="col-6">
          <p><strong>Height:</strong> ${pokemonData.height / 10}m</p>
        </div>
        <div class="col-6">
          <p><strong>Weight:</strong> ${pokemonData.weight / 10}kg</p>
        </div>
      </div>
      <h6 class="mb-2">Base Stats</h6>
      <div class="stats">
        ${statsHtml}
      </div>
    `);
    
    // Show the modal
    new bootstrap.Modal(document.getElementById('pokemonModal')).show();
  });
}

// Top Five Pokemon Logic
function loadTopFivePokemon() {
  const topFive = ["greninja", "blastoise", "mewtwo", "38", "blaziken"];
  
  // Add loading indicators to each card
  for (let i = 1; i <= 5; i++) {
    $(`.pokedex-card${i}`).addClass("loading");
    $(`#poke-sprite${i}`).attr("src", "");
    $(`#poke-name${i}`).html('<div class="loading-skeleton" style="width: 80%; height: 30px;"></div>');
    $(`#poke-type${i}`).html('<div class="loading-skeleton" style="width: 60%; height: 20px;"></div>');
    $(`#poke-description${i}`).html('<div class="loading-skeleton" style="width: 100%; height: 15px;"></div>'.repeat(3));
  }
  
  // Process each Pokemon with a slight delay for visual effect
  topFive.forEach(async (pokemon, index) => {
    const count = index + 1;
    
    // Add a slight delay for cascading effect
    setTimeout(async () => {
      try {
        // Fetch data
        const data = await fetchPokemonData(pokemon);
        const speciesData = await fetchPokemonSpecies(data.id);
        
        // Get description
        const description = getEnglishDescription(speciesData);
        
        // Generate HTML for types
        let typesHtml = "";
        data.types.forEach(type => {
          typesHtml += `<span class="${type.type.name}-type">${type.type.name}</span>`;
        });
        
        // Update card
        $(`.pokedex-card${count}`).removeClass("loading");
        $(`#poke-sprite${count}`).attr("src", data.sprites.other['official-artwork'].front_default || data.sprites.front_default);
        $(`#poke-name${count}`).text(capitalizeFirstLetter(data.name));
        $(`#poke-type${count}`).html(typesHtml);
        $(`#poke-description${count}`).text(description);
        
        // Add click handler for detail view
        $(`.pokedex-card${count}`).off("click").on("click", function() {
          showPokemonModal(data);
        });
        
      } catch (error) {
        console.error(`Error loading top Pokémon ${pokemon}:`, error);
        $(`.pokedex-card${count}`).removeClass("loading");
        $(`#poke-name${count}`).text("Error loading");
        $(`#poke-description${count}`).text("Could not load this Pokémon. Please try again later.");
      }
    }, index * 300); // 300ms delay between each load for visual effect
  });
}
function handleSearchResultClick() {
  console.log("Search result clicked!");
  if (window.searchedPokemonData) {
    console.log("Showing modal for:", window.searchedPokemonData.name);
    showPokemonModal(window.searchedPokemonData);
  } else {
    console.error("No Pokémon data available");
  }
}
// Search Function
function setupSearch() {
  $("#searchInput").on("input", function() {
    const query = $(this).val().toLowerCase().trim();
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // If query is empty, reset to "all" view
    if (query === "") {
      $(".all-container").empty();
      offset = 0;
      loadMorePokemon();
      return;
    }
    
    // Set a small timeout to prevent excessive API calls
    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 500);
  });
}

async function performSearch(query) {
  // Show loading indicator
  $(".all-container").html(`
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Searching for "${query}"...</p>
    </div>
  `);
  
  try {
    // Fetch the Pokemon data
    const data = await fetchPokemonData(query);
    
    // Clear container and render single result
    $(".all-container").empty();
    
    let typeHtml = "";
    data.types.forEach((typeInfo) => {
      typeHtml += `<span class="${typeInfo.type.name}-type me-2">${typeInfo.type.name}</span>`;
    });
    
    const pokemonCard = $("<div>", {
      class: "col-sm-6 col-md-4 mx-auto",
      id: `pokemon-${data.id}`,
      html: `
        <div class="pokemon-card search-result">
          <img 
            src="${data.sprites.other['official-artwork'].front_default || data.sprites.front_default}" 
            alt="${data.name}" 
            class="img-fluid"
          >
          <h3>${capitalizeFirstLetter(data.name)}</h3>
          <div class="d-flex justify-content-center mb-3">
            ${typeHtml}
          </div>
          <button class="btn btn-primary view-details" id="view-details-${data.id}">View Details</button>
        </div>
      `
    });
    console.log(`Data: ${data}`);
    $(".all-container").append(pokemonCard);
    
    // Add click event with specific selector
    $(`#view-details-${data.id}`).on("click", function() {
      console.log("search is clicked");
      showPokemonModal(data);
    });
    
  } catch (error) {
    console.error("Search error:", error);
    $(".all-container").html(`
      <div class="col-12 text-center py-5">
        <p>No Pokémon found matching "${query}". Try another search.</p>
        <button id="resetSearch" class="btn btn-outline-danger mt-3">Show All Pokémon</button>
      </div>
    `);
    
    $("#resetSearch").on("click", function() {
      $("#searchInput").val("");
      $(".all-container").empty();
      offset = 0;
      loadMorePokemon();
    });
  }
}

// Tab Switching Logic
function setupTabs() {
  // Initially hide all tabs except the first one
  $(".tab-content").not(":first").hide();
  
  // Handle tab clicks
  $(".nav-link").on("click", function(e) {
    e.preventDefault();
    
    // Get target tab ID
    const targetId = $(this).attr("data-target");
    
    // Hide all tab content
    $(".tab-content").hide();
    
    // Show selected tab content
    $(targetId).show();
    
    // Update active state in navigation
    $(".nav-link").removeClass("active");
    $(this).addClass("active");
    
    // Reset scroll position
    window.scrollTo(0, 0);
    
    // If all tab is selected and empty, load initial data
    if (targetId === "#all" && $(".all-container").children().length === 0) {
      offset = 0;
      loadMorePokemon();
    }
  });
}

// Initialize the app
$(document).ready(function() {
  // Default to showing the home tab
  $("#all").show();
  $("#topFive").hide();
  
  // Set up event listeners
  setupTabs();
  setupSearch();
  
  // Load initial data
  loadTopFivePokemon();
  
  // Add scroll event listener for infinite scroll
  $(window).on("scroll", handleScroll);
  
  // Make sure the first tab is active
  $(".nav-link").first().addClass("active");
});