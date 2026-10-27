const container = document.getElementById("api-container");
const template = document.getElementById("match-card-template");

const accountID = 116169635;

const background = document.querySelector(".background");

window.addEventListener("scroll", () => {
    const scrollPosition = window.scrollY;

    background.style.transform = `translateY(${-scrollPosition * 0.1}px)`;
});

async function getMatchHistory() {
    try {
        const url = `https://api.deadlock-api.com/v1/players/${accountID}/match-history`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const matches = await response.json();

        const heroResponse = await fetch(
            "https://api.deadlock-api.com/v1/assets/heroes",
        );

        if (!heroResponse.ok) {
            throw new Error(`Hero assets API error: ${heroResponse.status}`);
        }

        const heroes = await heroResponse.json();

        const itemResponse = await fetch(
            "https://api.deadlock-api.com/v1/assets/items",
        );

        if (!itemResponse.ok) {
            throw new Error(`Item assets API error: ${itemResponse.status}`);
        }

        const items = await itemResponse.json();

        container.innerHTML = " ";

        const recentMatches = matches.slice(0, 12);
        const matchIds = recentMatches.map((match) => match.match_id);

        const metadataUrl = `https://api.deadlock-api.com/v1/matches/metadata?match_ids=${matchIds.join(",")}&include_player_info=true&include_player_stats=true&include_player_items=true`;

        const metadataResponse = await fetch(metadataUrl);

        if (!metadataResponse.ok) {
            throw new Error(`metadata API error: ${metadataResponse.status}`);
        }

        const matchMetadata = await metadataResponse.json();

        recentMatches.forEach((match) => {
            console.log(match.match_id);

            const card = template.content.cloneNode(true);
            const cardElement = card.querySelector(".match-card");

            const metadata = matchMetadata.find(
                (data) => data.match_id === match.match_id,
            );

            const player = metadata.players.find(
                (player) => player.account_id === accountID,
            );

            const finalItems = player.items.filter(
                (item) => item.upgrade_id === 1 && item.sold_time_s === 0,
            );

            const buildGrid = card.querySelector(".build-grid");
            const itemSlots = buildGrid.querySelectorAll(".build-slot");

            finalItems.forEach((event, index) => {
                const asset = items.find((item) => item.id === event.item_id);

                if (asset && itemSlots[index]) {
                    const icon = document.createElement("img");

                    icon.src = asset.shop_image_webp || asset.shop_image;
                    icon.alt = asset.name;
                    icon.title = asset.name;
                    icon.classList.add("item-icon");

                    itemSlots[index].appendChild(icon);
                }
            });

            const finalStats = player.stats.at(-1);

            const result = match.player_match_outcome === 1 ? "win" : "loss";
            cardElement.classList.add(result);

            const minutes = Math.floor(metadata.duration_s / 60);
            const seconds = metadata.duration_s % 60;

            card.querySelector(".match-duration").textContent =
                `${minutes}:${String(seconds)}`;

            const hero = heroes.find((hero) => hero.id === match.hero_id);

            if (hero) {
                card.querySelector(".hero-portrait").src =
                    hero.images.icon_hero_card_webp;

                card.querySelector(".hero-name").textContent = hero.name;
            } else {
                card.querySelector(".hero-name").textContent =
                    `Hero ID: ${match.hero_id}`;
            }

            card.querySelector(".result-badge").textContent = result;

            card.querySelector(".match-date").textContent = new Date(
                match.start_time * 1000,
            ).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
            });

            card.querySelector(".kills").textContent = match.player_kills;
            card.querySelector(".deaths").textContent = match.player_deaths;
            card.querySelector(".assists").textContent = match.player_assists;

            const kda =
                match.player_deaths === 0
                    ? match.player_kills + match.player_assists
                    : (match.player_kills + match.player_assists) /
                      match.player_deaths;

            card.querySelector(".kda-value").textContent = kda.toFixed(1);

            card.querySelector(".souls").textContent =
                finalStats.net_worth.toLocaleString();

            card.querySelector(".player-damage").textContent =
                finalStats.player_damage.toLocaleString();

            card.querySelector(".objective-damage").textContent =
                finalStats.boss_damage.toLocaleString();

            card.querySelector(".healing").textContent =
                finalStats.player_healing.toLocaleString();

            container.appendChild(card);
        });
    } catch (error) {
        console.error("Failed to get Match History:", error);
        container.textContent = "Couldn't load match History.";
    }
}

getMatchHistory();
