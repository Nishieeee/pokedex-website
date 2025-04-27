$("document").ready(() => {

    const topFive = ["greninja", "blastoise", "mewtwo", "charizard",  "blaziken"];
    let count = 1;
    topFive.forEach(pokemon => {
        $.getJSON(`https://pokeapi.co/api/v2/pokemon/${pokemon}`, (data) => {

            $(`.pokedex-card${count}`).addClass(`${data.types[0].type.name}-type`); 
            $(`#poke-name${count}`).text(data.name);
            $(`#poke-type${count}`).text(data.types[0].type.name);           
            
            $(`#poke-sprite${count}`).attr("src", data.sprites.front_shiny);
            data.stats.forEach(stat => {
                const statName = stat.stat.name.replace("-", "_");
                const statValue = stat.base_stat;
    
                $(`#stat-${statName}${count}`).text(statValue);
            });

            count++;

            // const $newDiv = $("<div></div>");
            // $newDiv.addClass("poke-card");
            // $newDiv.text = (data.name);
            // $("row").append($newDiv);
        });
    
    });
    
});