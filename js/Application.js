!(function(){
  var handleOnLoad = function() {
    var dataTableLocation = document.getElementById('pricing-index-data');
    var errorElement = document.createElement('p');
    errorElement.classList.add('pricing-index-error');

    window.fetch('js/data.json')
      .then(function(response) {
        response.text()
          .then(function(responseText) {
            var finalPrices = [];
            var professionBonuses = {};
            var tableHeaderElement = document.getElementById('pricing-index-data-header');

            var data = JSON.parse(responseText);

            Object.keys(data.occupationBonusTiers).forEach(function(professionName) {
              professionBonuses[professionName] = data.tierBonuses[data.occupationBonusTiers[professionName]];
            });

            data.entities.forEach(function(item) {
              var priceEntry = {
                itemName: item.name,
                skill: item.skill || "N/A"
              };

              // Loop over the currencies and calculate their value(s)
              data.currencies.forEach(function(currency) {
                var finalPrice = currency.adjustment *
                  resolveSpeculativePriceForCurrencies(item.priceBase, item.skill, data.currencies,professionBonuses);

                priceEntry[currency.names.toLowerCase().replace(/[^\w]/, '-').replace(/-+/, '-')] =
                  finalPrice.toLocaleString(
                    undefined,
                    {
                      style: "decimal",
                      minimumFractionDigits: currency.precision,
                      maximumFractionDigits: currency.precision,
                    }
                  ) + resolveCurrencyDescriptor(finalPrice, currency);
              });

              finalPrices.push(priceEntry)
            })

            // Make the template set for the price(s)
            var priceTemplate = '';
            var columns = [
              "itemName"
            ];

            var itemNameColumnHeader = document.createElement('th');
            itemNameColumnHeader.innerText = 'Item Name';

            tableHeaderElement.appendChild(itemNameColumnHeader);

            data.currencies.forEach(function(currency) {
              var currencyColumnHeader = document.createElement('th');
              currencyColumnHeader.innerText = 'Price in ' + currency.names;

              tableHeaderElement.appendChild(currencyColumnHeader);

              priceTemplate = priceTemplate + '<td class="' + currency.names.toLowerCase().replace(/[^\w]/, '-').replace(/-+/, '-') + '"></td>';

              columns.push(currency.names.toLowerCase().replace(/[^\w]/, '-').replace(/-+/, '-'));
            });

            columns.push("skill");

            var skillNameColumnHeader = document.createElement('th');
            skillNameColumnHeader.innerText = 'Profession';

            tableHeaderElement.appendChild(skillNameColumnHeader);

            new List(dataTableLocation, {
              valueNames: columns,
              item: '<tr>' +
                  '<td class="itemName"></td>' +
                  priceTemplate +
                  '<td class="skill"></td>' +
                '</tr>',
              page: 25, // Page size
              pagination: true
            }, finalPrices)
          })
          .catch(function(error) {
            dataTableLocation.innerHTML = '';

            var errorNode = errorElement.cloneNode(true);
            errorNode.innerText = 'Unable to load pricing index for the following reason: ' + error.toString();

            dataTableLocation.append(errorNode);
            console.error(error);
          })

      })
      .catch(function(error) {
        dataTableLocation.innerHTML = '';

        var errorNode = errorElement.cloneNode(true);
        errorNode.innerText = 'Unable to load pricing index for the following reason: ' + error.toString();

        dataTableLocation.append(errorNode);
        console.error(error);
      });
  }

  var resolveSpeculativePriceForCurrencies = function(priceBase, profession, currencies, professionBonuses) {
    if (profession) {
      priceBase = priceBase * resolveSkillBonus(profession, professionBonuses);
    }

    return priceBase;
  }

  var resolveSkillBonus = function(profession, professionBonuses) {
    for (var _profession in professionBonuses) {
      if (professionBonuses.hasOwnProperty(_profession)) {
        if (profession.indexOf(_profession) === 0) {
          return professionBonuses[_profession];
        }
      }
    }

    return 0;
  }

  var resolveCurrencyDescriptor = function(finalPrice, currency) {
    if (finalPrice === 1) {
      return " " + currency.name;
    }

    if (finalPrice === Number(strPad('0.', '0', currency.precision + 1) + "1")) {
      return " " + currency.partial;
    }

    if (finalPrice < 1) {
      return " " + currency.partials;
    }

    return " " + currency.names;
  }

  var strPad = function(initial, padString, padLength, padLeft) {
    while (initial.length < padLength) {
      if (padLeft) {
        initial = padString + initial;
      } else {
        initial = initial + padString;
      }
    }

    return initial;
  }

  if ((document.readyState === 'interactive') || (document.readyState === 'complete')) {
    window.requestAnimationFrame(handleOnLoad);
  } else {
    document.addEventListener('DOMContentLoaded', handleOnLoad);
  }
}())