$(document).ready(function () {
    console.log("O script JavaScript está carregado e funcionando!");
    let currentPage = 1;
    const cardsPerPage = 16;
    let allCards = [];
    const cardContainer = $("#cardContainer");
    const pagination = $("#pagination");
    const searchNameInput = $("#searchName");
    const searchTypeInput = $("#searchType");
    const searchManaCostInput = $("#searchManaCost");
    const searchColorInput = $("#searchColor");
    const searchKeywordInput = $("#searchKeyword");
    const apiUrl = "https://mtgjson.com/api/v5/10E.json";
    const defaultImageUrl = "URL_TO_DEFAULT_IMAGE"; // Certifique-se de ter uma imagem padrão

    // Carregar anime.js apenas se necessário
    const animeCDN = document.createElement('script');
    animeCDN.src = 'https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js';
    animeCDN.type = 'text/javascript';

    animeCDN.onload = () => {
        fetchCards();
    }
    document.head.appendChild(animeCDN);

    setBackgroundColor("");

    function fetchCards() {
        $.ajax({
            url: apiUrl,
            method: "GET",
            dataType: "json",
            success: function (data) {
                console.log("Resposta da API:", data);

                if (data && data.data && data.data.cards) {
                    allCards = data.data.cards;
                    displayCards(allCards);
                } else {
                    console.error("Estrutura de dados inesperada:", data);
                    cardContainer.html(
                        "<p class='text-center text-danger'>Erro ao carregar cartas. Dados inesperados.</p>"
                    );
                }
            },
            error: function (error) {
                console.error("Erro ao buscar cartas:", error);
                cardContainer.html(
                    "<p class='text-center text-danger'>Erro ao carregar cartas.</p>"
                );
            },
        });
    }

    function displayCards(cards) {
        cardContainer.empty();

        const searchTermName = searchNameInput.val().toLowerCase();
        const searchTermType = searchTypeInput.val().toLowerCase();
        const searchTermManaCost = searchManaCostInput.val().toLowerCase();
        const searchTermColor = searchColorInput.val().toLowerCase();
        const searchTermKeyword = searchKeywordInput.val().toLowerCase();

        const filteredCards = cards.filter((card) => {
            if (!card) return false;

            const nameMatch = !searchTermName || (card.name && card.name.toLowerCase().includes(searchTermName));
            const typeMatch = !searchTermType || (card.type && card.type.toLowerCase().includes(searchTermType));
            const manaCostMatch = !searchTermManaCost || (card.manaValue != null && card.manaValue.toString().includes(searchTermManaCost));

            let colorIdentityMatch = false;

            if (searchTermColor === "colorless") {
                colorIdentityMatch = card.colorIdentity && card.colorIdentity.length === 0;
            } else {
                colorIdentityMatch = !searchTermColor || (card.colorIdentity && card.colorIdentity.some((color) => color.toLowerCase().includes(searchTermColor)));
            }

            const keywordMatch = !searchTermKeyword || (card.text && card.text.toLowerCase().includes(searchTermKeyword));

            return nameMatch && typeMatch && manaCostMatch && colorIdentityMatch && keywordMatch;
        });

        if (filteredCards.length === 0) {
            cardContainer.html(
                "<p class='text-center text-danger'>Nenhuma carta encontrada para a pesquisa.</p>"
            );
            updatePagination(0);
            return;
        }

        const startIndex = (currentPage - 1) * cardsPerPage;
        const endIndex = startIndex + cardsPerPage;
        const paginatedCards = filteredCards.slice(startIndex, endIndex);

        paginatedCards.forEach((card, index) => {
            const cardElement = $("<div>").addClass("card").css({ opacity: 0, transform: 'scale(0.8)' }); // Initial CSS for animation
            const imageUrl = card.identifiers?.scryfallId
                ? `https://api.scryfall.com/cards/${card.identifiers.scryfallId}/?format=image`
                : defaultImageUrl;

            const img = $("<img>")
                .attr("src", imageUrl)
                .addClass("card-img-top")
                .attr("alt", card.name)
                .on("error", function () {
                    $(this).attr("src", defaultImageUrl);
                });

            const cardImgContainer = $("<div>").addClass("card-img-container").append(img);
            cardElement.append(cardImgContainer);

            cardElement.on("click", (e) => {
                e.preventDefault();
                openCardPopup(card);
            });

            anime({
                targets: cardElement[0],
                opacity: 1,
                scale: 1,
                duration: 500,
                delay: index * 50,
                easing: 'easeOutQuad'
            });

            cardContainer.append(cardElement);
        });

        updatePagination(filteredCards.length);
    }

    function updatePagination(totalCards) {
        const totalPages = Math.ceil(totalCards / cardsPerPage);
        let paginationHtml = "";

        const createPageItem = (page, text, className = "", disabled = false) => {
            return `<li class="page-item ${className} ${disabled ? "disabled" : ""}">
                <a class="page-link" href="#" data-page="${page}">${text}</a>
            </li>`;
        };

        paginationHtml += createPageItem(currentPage - 1, "&laquo;", "", currentPage === 1);

        let startPage = Math.max(1, currentPage - 5);
        let endPage = Math.min(totalPages, currentPage + 4);

        if (totalPages <= 10) {
            for (let i = 1; i <= totalPages; i++) {
                paginationHtml += createPageItem(i, i, i === currentPage ? "active" : "");
            }
        } else {
            if (currentPage > 6) {
                paginationHtml += createPageItem(1, "1");
                if (currentPage > 7) {
                    paginationHtml += createPageItem(0, "...", "disabled");
                }
            }

            for (let i = startPage; i <= endPage; i++) {
                paginationHtml += createPageItem(i, i, i === currentPage ? "active" : "");
            }

            if (currentPage + 5 < totalPages) {
                if (currentPage + 6 < totalPages) {
                    paginationHtml += createPageItem(0, "...", "disabled");
                }
                paginationHtml += createPageItem(totalPages, totalPages);
            }
        }

        paginationHtml += createPageItem(currentPage + 1, "&raquo;", "", currentPage === totalPages || totalPages === 0);
        pagination.html(paginationHtml);
    }

    function setBackgroundColor(color) {
        let backgroundColor = "#d3d3d3"; // Default to grey

        switch (color) {
            case "w": backgroundColor = "#efe2d1"; break;
            case "u": backgroundColor = "#b7d7e8"; break;
            case "b": backgroundColor = "#b0b0b0"; break;
            case "r": backgroundColor = "#e6c0c0"; break;
            case "g": backgroundColor = "#c6e3bd"; break;
            case "colorless": backgroundColor = "#d3d3d3"; break;
        }

        $("body").css("background-color", backgroundColor);
    }

    $("#clearFilters").on("click", () => {
        searchNameInput.val("");
        searchTypeInput.val("");
        searchManaCostInput.val("");
        searchColorInput.val("");
        searchKeywordInput.val("");

        setBackgroundColor("");
        currentPage = 1;
        displayCards(allCards);
    });

    pagination.on("click", "a", function (e) {
        e.preventDefault();
        const pageNumber = parseInt($(this).data("page"));
        if (pageNumber && pageNumber > 0) {  // Verifica se o número da página é válido
            currentPage = pageNumber;
            displayCards(allCards);
        }
    });

    searchNameInput.on("keyup", () => {
        currentPage = 1;
        displayCards(allCards);
    });

    searchTypeInput.on("change", () => {
        currentPage = 1;
        displayCards(allCards);
    });

    searchManaCostInput.on("keyup", () => {
        currentPage = 1;
        displayCards(allCards);
    });

    searchColorInput.on("change", function () {
        currentPage = 1;
        setBackgroundColor($(this).val());
        displayCards(allCards);
    });

    searchKeywordInput.on("change", () => {
        currentPage = 1;
        displayCards(allCards);
    });

    function openCardPopup(card) {
        const imageUrl = card.identifiers?.scryfallId
            ? `https://api.scryfall.com/cards/${card.identifiers.scryfallId}/?format=image`
            : defaultImageUrl;

        const purchaseUrls = card.purchaseUrls || {};
        const increasedImageWidth = '80%'; 
        const increasedImageHeight = '64vh'; 

        Swal.fire({
            width: '90%',
            height: '93%',
            padding: '1em',
            showConfirmButton: false,
            showCloseButton: true,
            html: `
            <div style="position: relative; display: inline-block;">
                <img src="${imageUrl}" class="custom-image" alt="${card.name}" style="max-width: ${increasedImageWidth}; max-height: ${increasedImageHeight};">
                
            </div>
            <div class="card-details">
                <h2>${card.name}</h2>
                <p>
                    ${Object.entries(card.legalities).map(([format, status]) => {
                        return `<span><strong>${format.charAt(0).toUpperCase() + format.slice(1)}:</strong> ${status}</span>`;
                    }).join(' | ')}
                </p>
                <div class="purchase-options-below">
                  <button class="purchase-icon-button" id="purchaseIconBelow">
                    <img src="https://cdn3.iconfinder.com/data/icons/e-commerce-2-1/72/647-shop-store-basket-market-buy-ecommerce-512.png" alt="Opções de compra" class="purchase-icon">
                  </button>
                  <div class="purchase-links-below" style="display: none;">
                      ${Object.entries(purchaseUrls)
                          .map(([name, url]) => {
                              if (url) {
                                  const displayName = name.replace(/([A-Z])/g, ' $1').replace('card', 'Card').trim();
                                  return `<a href="${url}" target="_blank">${displayName}</a>`;
                              }
                              return '';
                          })
                          .join('')}
                  </div>
                </div>
            </div>
        `,
            customClass: {
                popup: 'custom-popup',
                image: 'custom-image',
            },
            didOpen: () => {
                // Event listener for purchase icon
                
                $('#purchaseIconBelow').on('click', function() {
                  $('.purchase-links-below').slideToggle();
              });
            }
        });
    }
});