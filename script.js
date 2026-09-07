let items = [];
let activeCategory = "all";
let searchTerm = "";

const itemContainer = document.getElementById("items");
const categoryContainer = document.getElementById("category-filters");
const searchInput = document.getElementById("search");
const itemCount = document.getElementById("item-count");
const emptyState = document.getElementById("empty-state");
const resetButton = document.getElementById("reset-filters");

const dialog = document.getElementById("product-dialog");
const dialogContent = document.getElementById("dialog-content");
const closeDialogButton = document.getElementById("close-dialog");


async function loadItems() {
    try {
        const response = await fetch("items.yaml");

        if (!response.ok) {
            throw new Error("Could not load items.yaml");
        }

        const yamlText = await response.text();

        items = jsyaml.load(yamlText);

        createCategoryButtons();
        renderItems();

    } catch (error) {
        console.error(error);

        itemContainer.innerHTML = `
            <p>
                There was a problem loading the sale items.
            </p>
        `;
    }
}


function createCategoryButtons() {
    const categories = [
        ...new Set(
            items
                .map(item => item.category)
                .filter(Boolean)
        )
    ].sort();

    for (const category of categories) {
        const button = document.createElement("button");

        button.className = "category-button";
        button.dataset.category = category;

        button.textContent = category;

        categoryContainer.appendChild(button);
    }

    categoryContainer.addEventListener("click", event => {
        const button = event.target.closest(".category-button");

        if (!button) {
            return;
        }

        activeCategory = button.dataset.category;

        document
            .querySelectorAll(".category-button")
            .forEach(button => {
                button.classList.remove("active");
            });

        button.classList.add("active");

        renderItems();
    });
}


function getFilteredItems() {
    return items.filter(item => {

        const matchesCategory =
            activeCategory === "all" ||
            item.category === activeCategory;

        const searchableText = `
            ${item.name}
            ${item.category}
            ${item.description}
            ${item.condition}
        `.toLowerCase();

        const matchesSearch =
            searchableText.includes(searchTerm.toLowerCase());

        return matchesCategory && matchesSearch;
    });
}


function sortItems(itemsToSort) {
    const statusOrder = {
        available: 0,
        pending: 1,
        sold: 2
    };

    return [...itemsToSort].sort((a, b) => {

        const aStatus = statusOrder[a.status] ?? 99;
        const bStatus = statusOrder[b.status] ?? 99;

        if (aStatus !== bStatus) {
            return aStatus - bStatus;
        }

        return a.name.localeCompare(b.name);
    });
}


function renderItems() {
    const filteredItems = sortItems(getFilteredItems());

    itemContainer.innerHTML = "";

    itemCount.textContent =
        `${filteredItems.length} ${
            filteredItems.length === 1 ? "item" : "items"
        }`;

    emptyState.hidden = filteredItems.length !== 0;

    for (const item of filteredItems) {

        const article = document.createElement("article");

        article.className = `item-card ${item.status}`;

        const imageMarkup =
            item.images && item.images.length > 0
                ? `
                    <img
                        src="${item.images[0]}"
                        alt="${escapeHTML(item.name)}"
                    >
                `
                : `
                    <div class="image-placeholder">
                        Photo coming soon
                    </div>
                `;

        article.innerHTML = `
            <button
                class="item-image-button"
                aria-label="View ${escapeHTML(item.name)}"
            >

                ${imageMarkup}

                <span class="image-overlay">
                    <span class="view-label">
                        View item
                    </span>
                </span>

            </button>


            <div class="item-info">

                <div class="item-topline">

                    <h2 class="item-name">
                        ${escapeHTML(item.name)}
                    </h2>

                    <p class="item-price">
                        ${formatPrice(item.price)}
                    </p>

                </div>


                <div class="item-bottomline">
                    <p class="item-category">
                        ${escapeHTML(item.category)}
                    </p>

                    <p class="status ${item.status}">
                        ${escapeHTML(item.status)}
                    </p>

                </div>

            </div>
        `;

        article
            .querySelector(".item-image-button")
            .addEventListener("click", () => {
                openProductDialog(item);
            });

        itemContainer.appendChild(article);
    }
}


function openProductDialog(item) {

    const imageMarkup =
        item.images && item.images.length > 0
            ? `
                <img
                    src="${item.images[0]}"
                    alt="${escapeHTML(item.name)}"
                >
            `
            : `
                <div class="image-placeholder">
                    Photo coming soon
                </div>
            `;

    const interestButton =
        item.status === "available"
            ? `
                <a
                    class="interest-button"
                    href="mailto:samrizzo24@gmail.com?subject=${encodeURIComponent(
                        `Interested in ${item.name}`
                    )}"
                >
                    I'm interested
                </a>
            `
            : "";

    dialogContent.innerHTML = `
        <div class="dialog-layout">

            <div class="dialog-image">
                ${imageMarkup}
            </div>

            <div class="dialog-details">

                <p class="dialog-category">
                    ${escapeHTML(item.category)}
                </p>

                <h2>
                    ${escapeHTML(item.name)}
                </h2>

                <p class="dialog-price">
                    ${formatPrice(item.price)}
                </p>

                <p class="dialog-description">
                    ${escapeHTML(item.description)}
                </p>

                <div class="dialog-meta">

                    ${
                        item.retail_price
                            ? `
                                <div class="dialog-meta-row">
                                    <span>Retail price</span>
                                    <span>${formatPrice(item.retail_price)}</span>
                                </div>
                            `
                            : ""
                    }

                    <div class="dialog-meta-row">
                        <span>Condition</span>
                        <span>${escapeHTML(item.condition)}</span>
                    </div>

                    <div class="dialog-meta-row">
                        <span>Status</span>
                        <span>${capitalize(item.status)}</span>
                    </div>

                </div>

                ${interestButton}

            </div>

        </div>
    `;

    dialog.showModal();
}


function formatPrice(price) {
    if (price === 0 || price === "0") {
        return "Free";
    }

    return `$${Number(price).toLocaleString()}`;
}


function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}


function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


searchInput.addEventListener("input", event => {
    searchTerm = event.target.value.trim();

    renderItems();
});


resetButton.addEventListener("click", () => {

    activeCategory = "all";
    searchTerm = "";

    searchInput.value = "";

    document
        .querySelectorAll(".category-button")
        .forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.category === "all"
            );
        });

    renderItems();
});


closeDialogButton.addEventListener("click", () => {
    dialog.close();
});


dialog.addEventListener("click", event => {

    if (event.target === dialog) {
        dialog.close();
    }

});


loadItems();