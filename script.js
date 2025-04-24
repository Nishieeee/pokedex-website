$("document").ready(() => {

    $.getJSON("https://pokeapi.co/api/v2/pokemon/charizard", (data) => {

        $("#poke-charizard").text(data.name);
        $("#poke-type").text(data.types[0].type.name);       
        $("#poke-charizardimg").attr("src", data.sprites.front_default);
        data.stats.forEach(stat => {
            const statName = stat.stat.name.replace("-", "_");
            const statValue = stat.base_stat;

            $(`#stat-${statName}`).text(statValue);
        });
    });

    $.getJSON("https://pokeapi.co/api/v2/pokemon/greninja", (data) => {
        $("#poke-greninja").text(data.name);
        $("#poke-type-g").text(data.types[0].type.name);
        $("#poke-greninja-img").attr("src", data.sprites.front_default);
        data.stats.forEach(stat => {
            const statName = stat.stat.name.replace("-", "_");
            const statValue = stat.base_stat;

            $(`#stat-${statName}-g`).text(statValue);
        });
    });

    
});