// CRED-style fluid micro animations and interactions
'use strict';

// Improved CSV parser for Google Sheets
const parseCSV = (text) => {
    const rows = [];
    const lines = text.split(/\r?\n/);
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const row = [];
        let cell = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
            const ch = line[j];
            
            if (inQuotes) {
                if (ch === '"') {
                    if (line[j + 1] === '"') {
                        cell += '"';
                        j++; // Skip escaped quote
                    } else {
                        inQuotes = false;
                    }
                } else {
                    cell += ch;
                }
            } else {
                if (ch === '"') {
                    inQuotes = true;
                } else if (ch === ',') {
                    row.push(cell.trim());
                    cell = '';
                } else {
                    cell += ch;
                }
            }
        }
        
        // Add the last cell
        row.push(cell.trim());
        
        // Only add non-empty rows
        if (row.some(c => c !== '')) {
            rows.push(row);
        }
    }
    
    return rows;
};

// Main initialization function
function initApp() {
    console.log('initApp called');
    // Smooth scrolling for navigation links
    const howCalculatesLink = document.querySelector('a[href="#how-calculates"]');
    if (howCalculatesLink) {
        howCalculatesLink.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = document.getElementById('how-calculates');
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }

    // Smooth scrolling for FAQ link
    const faqLink = document.querySelector('a[href="#faqs"]');
    if (faqLink) {
        faqLink.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = document.getElementById('faqs');
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }

    // 1) Load CSV from your published sheet directly
    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRwLgBkywXJZUQAHdXLrfoxHIdro9wrp7XnSa61OptNi--Y2Mt53kJvWa3CNqeFXOQRDsklfewfF98D/pub?output=csv';
    
    // Fallback sample data for testing (replace with real sheet once accessible)
    const SAMPLE_CSV_DATA = `GAME NAME,Genre/Theme,SCOPE/Avg. Playtime,Launch Price(Adj.)
Game1,Action,Compact 0-5h,15.99
Game2,Action,Compact 0-5h,18.99
Game3,Action,Compact 0-5h,12.99
Game4,Action,Compact 0-5h,22.99
Game5,Action,Compact 0-5h,16.99
Game6,Action,Standard 5-15h,29.99
Game7,Action,Standard 5-15h,34.99
Game8,Action,Standard 5-15h,27.99
Game9,Action,Standard 5-15h,31.99
Game10,Action,Standard 5-15h,25.99
Game11,Action,High 15h+,49.99
Game12,Action,High 15h+,59.99
Game13,Action,High 15h+,44.99
Game14,Action,High 15h+,54.99
Game15,Action,High 15h+,39.99
Game16,Action,Unscoped/Multiplayer,24.99
Game17,Action,Unscoped/Multiplayer,19.99
Game18,RPG,Compact 0-5h,19.99
Game19,RPG,Compact 0-5h,24.99
Game20,RPG,Compact 0-5h,17.99`;

    (async function loadSheet() {
      try {
        let csvText;
        try {
          const res = await fetch(CSV_URL, { 
            cache: 'no-store',
            mode: 'cors',
            headers: {
              'Accept': 'text/csv,text/plain,*/*'
            }
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          csvText = await res.text();
          console.log('✅ Successfully loaded from Google Sheet');
        } catch (fetchError) {
          console.log('⚠️ Failed to load from Google Sheet, using fallback data');
          console.error('Sheet load error details:', fetchError);
          csvText = SAMPLE_CSV_DATA;
        }
        console.log('Raw CSV text length:', csvText.length);
        console.log('Raw CSV text (first 500 chars):', csvText.substring(0, 500));
        console.log('Raw CSV text (last 200 chars):', csvText.substring(csvText.length - 200));
        
        const rows = parseCSV(csvText);
        console.log('Parsed rows:', rows.length);
        console.log('Expected rows: 341 (1 header + 340 games)');
        console.log('First row (headers):', rows[0]);
        console.log('Second row (first game):', rows[1]);
        console.log('Last row (should be game 340):', rows[rows.length - 1]);
        
        const [headers, ...data] = rows;
        
        console.log('=== GOOGLE SHEET DEBUG ===');
        console.log('Headers found:', headers);
        console.log('Total rows:', data.length);
        
        // 2) Convert rows to objects keyed by header
        console.log('Raw headers array:', headers);
        console.log('Headers with quotes/spaces visible:', headers.map((h, i) => `${i}: "${h}"`));
        
        const games = data.map((r, index) => {
            const gameObj = {};
            headers.forEach((h, i) => {
                const cleanHeader = h.trim();
                const cleanValue = (r[i] || '').trim();
                gameObj[cleanHeader] = cleanValue;
                
                if (index < 2) {
                    console.log(`Game ${index + 1}, Column ${i} "${cleanHeader}": "${cleanValue}"`);
                }
            });
            
            if (index < 3) {
                console.log(`Game ${index + 1} complete object:`, gameObj);
            }
            return gameObj;
        });
        
        // Debug first few games
        console.log('First 3 games:', games.slice(0, 3));
        console.log('Available columns:', Object.keys(games[0] || {}));
        
        // DEBUG: Show actual sheet structure immediately when it loads
        if (games.length > 0) {
            console.log('=== ACTUAL SHEET COLUMNS ===');
            console.log('All columns:', Object.keys(games[0]));
            console.log('First game complete data:', games[0]);
            console.log('Second game complete data:', games[1]);
            
            // Find genre/category columns
            Object.keys(games[0]).forEach(col => {
                if (col.toLowerCase().includes('genre') || col.toLowerCase().includes('category') || col.toLowerCase().includes('type')) {
                    console.log(`Found genre column "${col}":`, games.slice(0, 3).map(g => g[col]));
                }
            });
            
            // Find price columns  
            Object.keys(games[0]).forEach(col => {
                if (col.toLowerCase().includes('price') || col.toLowerCase().includes('cost') || col.toLowerCase().includes('usd')) {
                    console.log(`Found price column "${col}":`, games.slice(0, 3).map(g => g[col]));
                }
            });
        }
        
        console.log('Games data loaded successfully:', games.length, 'games');
        
        // 3) Find actual column names using fuzzy matching
        const findColumn = (games, searchTerms) => {
            if (!games || games.length === 0) return null;
            const columns = Object.keys(games[0]);
            
            for (const term of searchTerms) {
                const found = columns.find(col => 
                    col.toLowerCase().includes(term.toLowerCase()) ||
                    term.toLowerCase().includes(col.toLowerCase())
                );
                if (found) return found;
            }
            return null;
        };
        
        // Find actual column names
        const nameColumn = findColumn(games, ['GAME NAME', 'Game Name', 'Name', 'Title']);
        const genreColumn = findColumn(games, ['Genre/Theme', 'Genre', 'Theme', 'Category']);
        const scopeColumn = findColumn(games, ['SCOPE/Avg. Playtime', 'Scope', 'Playtime', 'Duration']);
        const priceColumn = findColumn(games, ['Launch Price(Adj.)', 'Price', 'Launch Price', 'Cost']);
        
        console.log('=== FOUND COLUMN MAPPINGS ===');
        console.log('Name column:', nameColumn);
        console.log('Genre column:', genreColumn);
        console.log('Scope column:', scopeColumn);
        console.log('Price column:', priceColumn);
        
        // Store column mappings globally
        window.columnMappings = {
            name: nameColumn,
            genre: genreColumn,
            scope: scopeColumn,
            price: priceColumn
        };
        
        // 4) Expose for your calculator logic
        window.gamesData = games;
        console.log('✅ Games data loaded successfully:', games.length, 'games');
        console.log('✅ Column mappings set:', window.columnMappings);

      } catch (e) {
        console.error('Sheet load error:', e);
      }
    })();

    // Calculate Price A (Average Market Price) - USING ACTUAL SHEET COLUMNS
    const calculatePriceC = (priceB) => {
        if (priceB === 'N/A' || priceB === 0) return 'N/A';
        
        // Price C = Price B + 25%
        const priceC = priceB * 1.25;
        const smartPrice = formatSmartPrice(priceC);
        console.log('Price C calculation: Price B * 1.25 =', priceC, 'Smart formatted:', smartPrice);
        return smartPrice;
    };

    const calculatePriceD = (priceB) => {
        if (priceB === 'N/A' || priceB === 0) return 'N/A';
        
        // Price D = Price B - 25%
        const priceD = priceB * 0.75;
        const smartPrice = formatSmartPrice(priceD);
        console.log('Price D calculation: Price B * 0.75 =', priceD, 'Smart formatted:', smartPrice);
        return smartPrice;
    };

    const calculatePriceB = (priceA) => {
        if (priceA === 'N/A' || priceA === 0) return 'N/A';
        
        let adjustedPrice = priceA;
        let adjustmentFactor = 1.0; // Start with no adjustment
        
        // Get input values from form fields
        const wishlistCount = parseInt(document.getElementById('wishlist-count')?.value) || 0;
        
        // Find development time dropdown
        const devTimeDropdown = Array.from(document.querySelectorAll('select.input-field')).find(select => {
            const label = select.closest('.input-group')?.querySelector('label')?.textContent;
            return label && label.toLowerCase().includes('development time');
        });
        const devTimeSelect = devTimeDropdown?.value || '';
        
        // Get team size from dropdown
        const teamSizeDropdown = Array.from(document.querySelectorAll('select.input-field')).find(select => {
            const label = select.closest('.input-group')?.querySelector('label')?.textContent;
            return label && label.toLowerCase().includes('team size');
        });
        const teamSize = parseInt(teamSizeDropdown?.value) || 0;
        
        // Find marketing cost input
        const marketingCostInput = Array.from(document.querySelectorAll('input.input-field')).find(input => {
            const label = input.closest('.input-group')?.querySelector('label')?.textContent;
            return label && label.toLowerCase().includes('marketing');
        });
        const marketingCost = parseFloat(marketingCostInput?.value) || 0;
        
        // Find country dropdown
        const countryDropdown = Array.from(document.querySelectorAll('select.input-field')).find(select => {
            const label = select.closest('.input-group')?.querySelector('label')?.textContent;
            return label && label.toLowerCase().includes('country');
        });
        const countryOrigin = countryDropdown?.value || '';
        
        // Get checkbox states from existing adjustments section
        const adjustmentCheckboxes = document.querySelectorAll('.adjustment-options input[type="checkbox"]');
        const steamCut = adjustmentCheckboxes[0]?.checked || false;
        const refundRate = adjustmentCheckboxes[1]?.checked || false;
        const chargebacks = adjustmentCheckboxes[2]?.checked || false;
        
        // Get general discounting value from existing input field
        const generalDiscountingInput = document.querySelector('.adjustments-section input[type="number"]');
        const generalDiscounting = parseFloat(generalDiscountingInput?.value) || 0;
        
        console.log('=== PRICE B CALCULATION DEBUG ===');
        console.log('Price A input:', priceA);
        console.log('Wishlist count:', wishlistCount);
        console.log('Dev time select value:', devTimeSelect);
        console.log('Team size:', teamSize);
        console.log('Marketing cost:', marketingCost);
        console.log('Country origin:', countryOrigin);
        console.log('Steam cut checked:', steamCut);
        console.log('Refund rate checked:', refundRate);
        console.log('Chargebacks checked:', chargebacks);
        console.log('General discounting value:', generalDiscounting);
        
        // 1. Wishlist count adjustments
        if (wishlistCount >= 30000) {
            adjustmentFactor -= 0.10; // Decrease 10%
            console.log('Wishlist >= 30k: -10%');
        } else if (wishlistCount < 20000 && wishlistCount > 0) {
            adjustmentFactor += 0.05; // Increase 5%
            console.log('Wishlist < 20k: +5%');
        }
        
        // 2. Development time and team size multiplication
        const devTimeMonths = parseInt(devTimeSelect.replace('months', '').replace('month', '').trim()) || 0;
        const devTeamMultiplication = devTimeMonths * teamSize;
        console.log('Dev time parsing:', devTimeSelect, '-> months:', devTimeMonths);
        console.log('Dev team multiplication:', devTimeMonths, 'x', teamSize, '=', devTeamMultiplication);
        
        if (devTeamMultiplication > 60) {
            adjustmentFactor += 0.08; // Increase 8%
            console.log('Dev time × team size > 60: +8%');
        } else if (devTeamMultiplication < 24 && devTeamMultiplication > 0) {
            adjustmentFactor -= 0.12; // Decrease 12%
            console.log('Dev time × team size < 24: -12%');
        }
        
        // 3. Marketing budget
        if (marketingCost >= 25000) {
            adjustmentFactor += 0.05; // Increase 5%
            console.log('Marketing >= $25k: +5%');
        }
        
        // 4. Player adjustments - these should increase the price to compensate for losses
        console.log('Applying player adjustments...');
        if (steamCut) {
            adjustmentFactor += 0.10; // Increase 10% to compensate for Steam's cut
            console.log('Steam cut applied: adjustment factor now', adjustmentFactor);
        }
        if (refundRate) {
            adjustmentFactor += 0.03; // Increase 3% for refund rate
            console.log('Refund rate applied: adjustment factor now', adjustmentFactor);
        }
        if (chargebacks) {
            adjustmentFactor += 0.02; // Increase 2% for chargebacks
            console.log('Chargebacks applied: adjustment factor now', adjustmentFactor);
        }
        if (generalDiscounting > 0) {
            adjustmentFactor += 0.05; // Increase 5% if any discounting is entered
            console.log('General discounting applied: adjustment factor now', adjustmentFactor);
        }
        
        // 5. Country of origin adjustments
        const developedCountries = ['us', 'ca', 'gb', 'de', 'fr', 'it', 'es', 'nl', 'be', 'ch', 'at', 'se', 'no', 'dk', 'fi', 'au', 'nz', 'jp', 'kr', 'sg'];
        const leastDevelopedCountries = ['af', 'bd', 'bf', 'bi', 'cf', 'td', 'km', 'cd', 'dj', 'er', 'et', 'gm', 'gn', 'gw', 'ht', 'kh', 'la', 'lr', 'mg', 'mw', 'ml', 'mr', 'mz', 'mm', 'ne', 'rw', 'st', 'sn', 'sl', 'so', 'ss', 'sd', 'tl', 'tg', 'ug', 'tz', 'ye', 'zm'];
        
        if (developedCountries.includes(countryOrigin)) {
            adjustmentFactor -= 0.05; // Decrease 5%
            console.log('Developed country: -5%');
        } else if (leastDevelopedCountries.includes(countryOrigin)) {
            adjustmentFactor -= 0.10; // Decrease 10%
            console.log('Least developed country: -10%');
        }
        // Developing countries: no change
        
        // Note: Scope is only used for filtering games in Price A calculation, not for Price B adjustments
        
        // Parse priceA to get numeric value for calculations
        const basePriceNumeric = parseFloat(priceA.toString().replace('$', '').replace(',', '')) || 0;
        
        console.log('Base price numeric for calculations:', basePriceNumeric);
        console.log('Final adjustment factor:', adjustmentFactor);
        
        // Apply all adjustments
        adjustedPrice = basePriceNumeric * adjustmentFactor;
        console.log('Adjusted price calculation:', basePriceNumeric, 'x', adjustmentFactor, '=', adjustedPrice);
        
        // Only apply smart pricing if there were actual adjustments
        if (adjustmentFactor !== 1.0) {
            const smartPrice = formatSmartPrice(Math.max(0, adjustedPrice));
            console.log('Smart formatted Price B (with adjustments):', smartPrice);
            return smartPrice;
        } else {
            // No adjustments made, return original price
            console.log('No adjustments applied, returning original Price A:', priceA);
            return priceA;
        }
    };

    // Smart pricing function to format prices with .99 logic
    const formatSmartPrice = (price) => {
        if (price === 'N/A' || isNaN(price) || price <= 0) return 'N/A';
        
        const wholePart = Math.floor(price);
        const decimalPart = price - wholePart;
        
        if (decimalPart >= 0.49) {
            // Round up to next whole number + .99
            return wholePart + 0.99;
        } else {
            // Round down to previous whole number + .99
            if (wholePart === 0) {
                return 0.99; // Special case for prices less than 1
            }
            return (wholePart - 1) + 0.99;
        }
    };

    const calculatePriceA = (selectedTags) => {
        console.log('=== CALCULATING PRICE A ===');
        console.log(`Processing ${selectedTags ? selectedTags.length : 0} selected genres:`, selectedTags);
        
        if (!selectedTags || selectedTags.length === 0) {
            console.log('No tags selected, returning N/A');
            return 'N/A';
        }
        
        // Check if window.gamesData exists
        if (!window.gamesData || !Array.isArray(window.gamesData) || window.gamesData.length === 0) {
            console.log('No games data available, returning N/A');
            return 'N/A';
        }
        
        // Check if column mappings exist
        if (!window.columnMappings) {
            console.log('No column mappings available, returning N/A');
            return 'N/A';
        }
        
        // Get selected scope
        const selectedScope = document.querySelector('.scope-btn.active');
        const scopeValue = selectedScope ? selectedScope.dataset.scope : null;
        console.log('Selected scope:', scopeValue);
        
        // Check if multiplayer is selected
        const gameType = document.querySelector('.type-btn.active');
        const isMultiplayer = gameType && gameType.dataset.type === 'multiplayer';
        console.log('Is multiplayer selected:', isMultiplayer);
        
        // Filter games that match selected criteria
        const matchingGames = window.gamesData.filter((game, index) => {
            const gameGenre = (game[window.columnMappings.genre] || '').trim();
            const gameScope = (game[window.columnMappings.scope] || '').trim();
            
            if (!gameGenre) return false;
            
            // Check genre match (exact match)
            const genreMatches = selectedTags.includes(gameGenre);
            if (!genreMatches) return false;
            
            // If multiplayer is selected, only use games from "Unscoped/Multiplayer" scope
            if (isMultiplayer) {
                const scopeMatches = gameScope === 'Unscoped/Multiplayer';
                if (!scopeMatches) return false;
                console.log('Multiplayer game found:', gameGenre, gameScope);
            } else {
                // For singleplayer, check scope match if scope is selected
                if (scopeValue) {
                    let scopeMatches = false;
                    if (scopeValue === 'compact') {
                        scopeMatches = gameScope === 'Compact 0-5h';
                    } else if (scopeValue === 'standard') {
                        scopeMatches = gameScope === 'Standard 5-15h';
                    } else if (scopeValue === 'high') {
                        scopeMatches = gameScope === 'High 15h+';
                    }
                    if (!scopeMatches) return false;
                }
            }
            
            return true;
        });
        
        console.log(`Found ${matchingGames.length} matching games`);
        
        if (matchingGames.length === 0) {
            console.log('❌ No matching games found');
            return 'N/A';
        }
        
        // For multiplayer, limit to 2 games per genre (5 genres × 2 games = 10 total)
        let finalMatchingGames = matchingGames;
        if (isMultiplayer) {
            const gamesByGenre = {};
            matchingGames.forEach(game => {
                const genre = game[window.columnMappings.genre].trim();
                if (!gamesByGenre[genre]) {
                    gamesByGenre[genre] = [];
                }
                if (gamesByGenre[genre].length < 2) {
                    gamesByGenre[genre].push(game);
                }
            });
            
            finalMatchingGames = [];
            Object.values(gamesByGenre).forEach(genreGames => {
                finalMatchingGames.push(...genreGames);
            });
            
            console.log(`Multiplayer: Limited to ${finalMatchingGames.length} games (2 per genre)`);
        }
        
        // Calculate average price
        const prices = finalMatchingGames.map(game => {
            const price = parseFloat(game[window.columnMappings.price]);
            return isNaN(price) ? 0 : price;
        }).filter(price => price > 0);
        
        if (prices.length === 0) {
            console.log('❌ No valid prices found');
            return 'N/A';
        }
        
        const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        console.log(`Average price calculated: $${averagePrice.toFixed(2)} from ${prices.length} games`);
        
        // Apply smart pricing
        const smartPrice = formatSmartPrice(averagePrice);
        console.log(`Smart price: ${smartPrice}`);
        
        return smartPrice;
    };

    // Game type selection with CRED-style animations
    const typeButtons = document.querySelectorAll('.type-btn');
    
    typeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            typeButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Check if multiplayer is selected
            const isMultiplayer = this.dataset.type === 'multiplayer';
            
            // Grey out or enable scope buttons based on selection
            const scopeButtons = document.querySelectorAll('.scope-btn');
            scopeButtons.forEach(scopeBtn => {
                if (isMultiplayer) {
                    // Grey out scope buttons for multiplayer
                    scopeBtn.style.opacity = '0.3';
                    scopeBtn.style.pointerEvents = 'auto'; // Allow clicks for shake effect
                    scopeBtn.classList.remove('active');
                    scopeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
                    scopeBtn.style.color = 'rgba(255, 255, 255, 0.4)';
                    scopeBtn.dataset.disabled = 'true';
                    
                    // Add shake animation when clicked while disabled
                    scopeBtn.addEventListener('click', function(e) {
                        if (this.dataset.disabled === 'true') {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // Don't allow selection - remove any active class and force greyed style
                            this.classList.remove('active');
                            this.style.opacity = '0.3';
                            this.style.background = 'rgba(255, 255, 255, 0.1)';
                            this.style.color = 'rgba(255, 255, 255, 0.4)';
                            
                            // Shake animation
                            this.style.animation = 'none';
                            this.style.transform = 'translateX(0)';
                            setTimeout(() => {
                                this.style.animation = 'shake-no 0.5s ease-in-out';
                            }, 10);
                            
                            // Reset animation after completion and maintain greyed style
                            setTimeout(() => {
                                this.style.animation = 'none';
                                this.style.transform = 'translateX(0)';
                                // Keep greyed out style
                                this.style.opacity = '0.3';
                                this.style.background = 'rgba(255, 255, 255, 0.1)';
                                this.style.color = 'rgba(255, 255, 255, 0.4)';
                            }, 500);
                            
                            return false; // Prevent any further event handling
                        }
                    });
                } else {
                    // Enable scope buttons for singleplayer
                    scopeBtn.style.opacity = '1';
                    scopeBtn.style.pointerEvents = 'auto';
                    scopeBtn.style.background = '';
                    scopeBtn.style.color = '';
                    scopeBtn.dataset.disabled = 'false';
                }
            });
            
            // Add subtle scale animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });

    
    // Scope buttons management
    function updateScopeButtons(isMultiplayer) {
        const scopeButtons = document.querySelectorAll('.scope-btn');
        scopeButtons.forEach(btn => {
            if (isMultiplayer) {
                btn.style.opacity = '0.4';
                btn.style.pointerEvents = 'none';
                btn.style.background = 'rgba(128, 128, 128, 0.2)';
                btn.classList.remove('active');
                btn.disabled = true;
            } else {
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
                btn.style.background = '';
                btn.disabled = false;
            }
        });
    }

    // Set initial state based on default selected button
    const defaultSelected = document.querySelector('.type-btn.active');
    if (defaultSelected) {
        updateScopeButtons(defaultSelected.dataset.type === 'multiplayer');
    }

    // Handle type button clicks with event delegation
    document.addEventListener('click', function(e) {
        const button = e.target.closest('.type-btn');
        if (!button) return;
        
        // Update active state
        document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update scope buttons state
        updateScopeButtons(button.dataset.type === 'multiplayer');
    });
    

    // Scope selection with CRED-style animations
    const scopeButtons = document.querySelectorAll('.scope-btn');
    scopeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Check if button is disabled (for multiplayer mode)
            if (this.dataset.disabled === 'true') {
                e.preventDefault();
                e.stopPropagation();
                
                // Force maintain greyed out appearance
                this.classList.remove('active');
                this.style.opacity = '0.3';
                this.style.background = 'rgba(255, 255, 255, 0.1)';
                this.style.color = 'rgba(255, 255, 255, 0.4)';
                
                return false; // Don't allow selection when disabled
            }
            
            scopeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Add subtle animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });

    // Input field focus animations
    const inputFields = document.querySelectorAll('.input-field');
    inputFields.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateY(-2px)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateY(0)';
        });
    });

    // Checkbox animations
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checkmark = this.nextElementSibling;
            if (this.checked) {
                checkmark.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    checkmark.style.transform = 'scale(1)';
                }, 150);
            }
        });
    });

    // Calculate button with CRED-style loading animation
    const calculateBtn = document.querySelector('#calcBtn');
    if (calculateBtn) {
        // Add initial animation when the button appears
        calculateBtn.style.opacity = '0';
        calculateBtn.style.transform = 'scale(0.9) translateY(20px)';
        calculateBtn.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        
        // Create observer for calculate button with bounce effect
        const btnObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        calculateBtn.style.opacity = '1';
                        calculateBtn.style.transform = 'scale(1) translateY(0)';
                    }, 800); // Delay to appear after form elements
                }
            });
        }, { threshold: 0.1 });
        
        btnObserver.observe(calculateBtn);
        
        calculateBtn.addEventListener('click', function() {
            console.log('=== CALCULATE BUTTON CLICKED ===');
            
            // Add loading state
            const originalText = this.textContent;
            this.textContent = 'Calculating...';
            this.style.pointerEvents = 'none';
            
            // Get selected game type (single player or multiplayer)
            const gameType = document.querySelector('.type-btn.active');
            const isMultiplayer = gameType && gameType.dataset.type === 'multiplayer';
            console.log('Game type selected:', gameType ? gameType.textContent : 'NONE');

            // Get selected scope
            const selectedScope = document.querySelector('.scope-btn.active');
            const scopeValue = selectedScope ? selectedScope.dataset.scope : '';
            console.log('Scope selected:', selectedScope ? selectedScope.textContent : 'NONE');

            // Get selected genre tags (max 5)
            const selectedTags = Array.from(document.querySelectorAll('.tag-btn.active'))
                .map(btn => btn.dataset.tag);
            console.log('Tags selected:', selectedTags);
        console.log('Number of selected tags:', selectedTags.length);
            
            // Check if we have the required data
            console.log('Google Sheet data available:', !!window.gamesData);
            console.log('Number of games in sheet:', window.gamesData ? window.gamesData.length : 0);
            console.log('Column mappings available:', !!window.columnMappings);
            console.log('Column mappings:', window.columnMappings);

            // Use setTimeout to prevent UI blocking
            setTimeout(function() {
                try {
                    // Calculate all prices - force fresh calculation each time
                    console.log('=== STARTING FRESH PRICE CALCULATION ===');
                    const priceA = calculatePriceA(selectedTags);
                    console.log('Price A calculated:', priceA);
                    
                    const priceB = calculatePriceB(priceA);
                    console.log('Price B calculated:', priceB);
                    
                    const priceC = calculatePriceC(priceB);
                    console.log('Price C calculated:', priceC);
                    
                    const priceD = calculatePriceD(priceB);
                    console.log('Price D calculated:', priceD);
                
                    console.log('=== FINAL PRICES ===');
                    console.log('A:', priceA, 'B:', priceB, 'C:', priceC, 'D:', priceD);
            
                    // Update modal with results
                    const priceAElement = document.getElementById('price-a-value');
                    const priceBElement = document.getElementById('price-b-value');
                    const priceCElement = document.getElementById('price-c-value');
                    const priceDElement = document.getElementById('price-d-value');
                    
                    if (priceAElement) {
                        priceAElement.textContent = priceA === 'N/A' ? 'N/A' : `$${priceA}`;
                        console.log('Price A updated to:', priceAElement.textContent);
                    }
                    if (priceBElement) {
                        priceBElement.textContent = priceB === 'N/A' ? 'N/A' : `$${priceB}`;
                        console.log('Price B updated to:', priceBElement.textContent);
                    }
                    if (priceCElement) {
                        priceCElement.textContent = priceC === 'N/A' ? 'N/A' : `$${priceC}`;
                        console.log('Price C updated to:', priceCElement.textContent);
                    }
                    if (priceDElement) {
                        priceDElement.textContent = priceD === 'N/A' ? 'N/A' : `$${priceD.toFixed(2)}`;
                        console.log('Price D updated to:', priceDElement.textContent);
                    }
                    
                    // Apply premium blur effects after results are shown
                    setTimeout(() => {
                        if (window.authManager && !window.authManager.isPremium) {
                            window.authManager.applyPremiumBlur();
                        }
                    }, 100);
                    
                    // Reset button state
                    this.textContent = originalText;
                    this.style.pointerEvents = 'auto';
                    
                    // Show modal
                    const modal = document.getElementById('results-modal');
                    modal.style.display = 'flex';
                    setTimeout(() => {
                        modal.classList.add('active');
                    }, 10);
                    
                } catch (error) {
                    console.error('Calculation error:', error);
                    console.error('Error stack:', error.stack);
                    
                    // Reset button state on error
                    this.textContent = originalText;
                    this.style.pointerEvents = 'auto';
                    
                    // Show detailed error in modal
                    const priceAElement = document.getElementById('price-a-value');
                    if (priceAElement) {
                        priceAElement.textContent = `Error: ${error.message}`;
                    }
                    
                    // Show modal with error
                    const modal = document.getElementById('results-modal');
                    modal.style.display = 'flex';
                    setTimeout(() => {
                        modal.classList.add('active');
                    }, 10);
                }
            }.bind(this), 100);
        });
    }

    // Results modal close with fluid animation
    const resultsClose = document.getElementById('resultsClose');
    const resultsModal = document.getElementById('results-modal');
    if (resultsClose && resultsModal) {
        resultsClose.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Add closing animation
            resultsModal.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            resultsModal.style.opacity = '0';
            resultsModal.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                resultsModal.classList.remove('active');
                resultsModal.style.display = 'none';
                resultsModal.style.opacity = '';
                resultsModal.style.transform = '';
            }, 400);
        });
        
        // Close when clicking outside modal
        resultsModal.addEventListener('click', (e) => { 
            if (e.target === resultsModal) {
                resultsModal.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                resultsModal.style.opacity = '0';
                resultsModal.style.transform = 'scale(0.95)';
                
                setTimeout(() => {
                    resultsModal.classList.remove('active');
                    resultsModal.style.display = 'none';
                    resultsModal.style.opacity = '';
                    resultsModal.style.transform = '';
                }, 400);
            }
        });
    }

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for scroll animations with staggered timing
    const animatedElements = document.querySelectorAll('.step, .pricing-card, .input-group');
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        el.style.transitionDelay = `${index * 0.1}s`; // Staggered delay based on element index
        observer.observe(el);
    });
    
    // Add animations to calculator form elements - but skip tag and scope buttons to prevent interaction issues
    const formElements = document.querySelectorAll('.input-field, select, .type-btn');
    formElements.forEach((el, index) => {
        // Set initial state
        el.style.opacity = '0';
        el.style.transform = 'translateY(15px)';
        el.style.transition = 'all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
        el.style.transitionDelay = `${0.2 + (index * 0.05)}s`; // Staggered delay
        
        // Create observer for form elements
        const formObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });
        
        formObserver.observe(el);
    });
    
    // Tag buttons handled by initializeTagButtons function only
    
    // Handle scope buttons separately with immediate visibility
    const scopeBtns = document.querySelectorAll('.scope-btn');
    scopeBtns.forEach(btn => {
        btn.style.opacity = '1';
        btn.style.transform = 'translateY(0)';
        btn.style.transition = 'all 0.3s ease';
    });

    // Header scroll effect
    let lastScrollTop = 0;
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            header.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });

    // Remove all transitions from interactive elements including tags
    const allInteractiveElements = document.querySelectorAll('button, .nav-link, .scope-btn, .type-btn, .tag-btn');
    allInteractiveElements.forEach(element => {
        element.style.transition = 'none';
    });
}

// Premium Modal Functions
function openPremiumModal() {
    const modal = document.getElementById('premiumModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closePremiumModal() {
    const modal = document.getElementById('premiumModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

    // Steam logo sticker hover effect
    const steamLogo = document.querySelector('.steam-logo-sticker');
    if (steamLogo) {
        steamLogo.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) rotate(5deg) scale(1.1)';
        });
        
        steamLogo.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) rotate(0deg) scale(1)';
        });
    }

    // FAQ list item hover animations
    const faqItems = document.querySelectorAll('.faq-list li');
    faqItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.paddingLeft = '10px';
            this.style.color = '#ffffff';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.paddingLeft = '0';
            this.style.color = 'rgba(255, 255, 255, 0.7)';
        });
    });

    // Footer link hover animations
    const footerLinks = document.querySelectorAll('.footer-links a');
    footerLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.paddingLeft = '5px';
            this.style.color = '#ffffff';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.paddingLeft = '0';
            this.style.color = 'rgba(255, 255, 255, 0.7)';
        });
    });

    // Logo animation
    const logo = document.querySelector('.logo-image');
    if (logo) {
        logo.addEventListener('mouseenter', function() {
            this.style.animation = 'float 2s ease-in-out infinite';
        });
        
        logo.addEventListener('mouseleave', function() {
            this.style.animation = 'none';
        });
    }

    // Add CSS keyframes for floating animation and shake effect
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0%, 100% { transform: translate3d(0, 0px, 0) scale(1.05); }
            50% { transform: translate3d(0, -5px, 0) scale(1.05); }
        }
        
        @keyframes shake-no {
            0% { transform: translateX(0); }
            10% { transform: translateX(-10px); }
            20% { transform: translateX(10px); }
            30% { transform: translateX(-10px); }
            40% { transform: translateX(10px); }
            50% { transform: translateX(-5px); }
            60% { transform: translateX(5px); }
            70% { transform: translateX(-3px); }
            80% { transform: translateX(3px); }
            90% { transform: translateX(-1px); }
            100% { transform: translateX(0); }
        }
    `;
    document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    
    // Wait a bit for DOM to be fully ready
    setTimeout(() => {
        console.log('Setting up event listeners...');
        
        // Initialize the app
        if (typeof initApp === 'function') {
            initApp();
        }
        
        // Tag button functionality with grid layout and displacement animation
        const tagButtons = document.querySelectorAll('.tag-btn');
        console.log('Found tag buttons:', tagButtons.length);
        
        if (tagButtons.length === 0) {
            console.error('No tag buttons found! Checking for tags-container...');
            const container = document.getElementById('tags-container');
            console.log('Tags container:', container);
        }

        // Uniform grid layout - 4 columns, 5 rows
        const gridPositions = [
            { top: '10%', left: '12.5%' },  // Row 1, Col 1 - Strategy
            { top: '10%', left: '37.5%' },  // Row 1, Col 2 - RPG
            { top: '10%', left: '62.5%' },  // Row 1, Col 3 - Action
            { top: '10%', left: '87.5%' },  // Row 1, Col 4 - Horror
            
            { top: '30%', left: '12.5%' },  // Row 2, Col 1 - Cozy
            { top: '30%', left: '37.5%' },  // Row 2, Col 2 - Sci-Fi
            { top: '30%', left: '62.5%' },  // Row 2, Col 3 - Adventure
            { top: '30%', left: '87.5%' },  // Row 2, Col 4 - Story Rich
            
            { top: '50%', left: '12.5%' },  // Row 3, Col 1 - Shooter
            { top: '50%', left: '37.5%' },  // Row 3, Col 2 - Puzzle Games
            { top: '50%', left: '62.5%' },  // Row 3, Col 3 - Sports
            { top: '50%', left: '87.5%' },  // Row 3, Col 4 - Simulation
            
            { top: '70%', left: '12.5%' },  // Row 4, Col 1 - Post Apocalyptic
            { top: '70%', left: '37.5%' },  // Row 4, Col 2 - Comedy
            { top: '70%', left: '62.5%' },  // Row 4, Col 3 - Survival
            { top: '70%', left: '87.5%' },  // Row 4, Col 4 - Cyberpunk
            
            { top: '90%', left: '12.5%' },  // Row 5, Col 1 - Noir/Detective
            { top: '90%', left: '37.5%' },  // Row 5, Col 2 - Dark Fantasy
            { top: '90%', left: '62.5%' },  // Row 5, Col 3 - Fantasy
            { top: '90%', left: '87.5%' }   // Row 5, Col 4 - Historical
        ];

        tagButtons.forEach((button, index) => {
            console.log(`Setting up tag button ${index}: ${button.textContent}`);
            
            // Apply grid position
            if (gridPositions[index]) {
                button.style.top = gridPositions[index].top;
                button.style.left = gridPositions[index].left;
            }
            
            // Force styles to ensure clickability
            button.style.pointerEvents = 'auto';
            button.style.cursor = 'pointer';
            button.style.userSelect = 'none';
            
            // Add click event for tag selection
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Tag clicked:', this.textContent);
                
                // Handle tag selection (max 5 tags)
                const isActive = this.classList.contains('active');
                if (isActive) {
                    this.classList.remove('active');
                    console.log('Removed active');
                } else {
                    const activeCount = document.querySelectorAll('.tag-btn.active').length;
                    if (activeCount < 5) {
                        this.classList.add('active');
                        console.log('Added active');
                    } else {
                        console.log('Max 5 tags reached - showing rejection feedback');
                        // Show red rejection feedback
                        this.classList.add('rejected');
                        setTimeout(() => {
                            this.classList.remove('rejected');
                        }, 600);
                    }
                }
            });
            
        });
        
        // FAQ Accordion functionality
        const faqQuestions = document.querySelectorAll('.faq-question');
        faqQuestions.forEach(question => {
            question.addEventListener('click', function() {
                const faqId = this.dataset.faq;
                const answer = document.getElementById(`faq-${faqId}`);
                const isActive = this.classList.contains('active');
                
                // Close all other FAQ items
                faqQuestions.forEach(q => {
                    q.classList.remove('active');
                    const otherId = q.dataset.faq;
                    const otherAnswer = document.getElementById(`faq-${otherId}`);
                    otherAnswer.classList.remove('active');
                });
                
                // Toggle current FAQ item
                if (!isActive) {
                    this.classList.add('active');
                    answer.classList.add('active');
                }
            });
        });
        
        // Scope button functionality
        const scopeButtons = document.querySelectorAll('.scope-btn');
        console.log('Found scope buttons:', scopeButtons.length);
        
        scopeButtons.forEach(button => {
            button.style.pointerEvents = 'auto';
            button.style.cursor = 'pointer';
            
            button.addEventListener('click', function(e) {
                console.log('Scope clicked:', this.textContent);
                
                // Check if button is disabled (multiplayer mode)
                if (this.disabled) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Remove any existing shake class first
                    this.classList.remove('scope-btn-shake');
                    
                    // Force reflow to ensure class removal is processed
                    this.offsetHeight;
                    
                    // Add shake effect for this specific disabled button
                    this.classList.add('scope-btn-shake');
                    
                    // Remove shake class after animation completes
                    setTimeout(() => {
                        this.classList.remove('scope-btn-shake');
                    }, 300);
                    return;
                }
                
                scopeButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
            });
        });
        
        // Calculate button functionality
        const calcButton = document.getElementById('calcBtn');
        if (calcButton) {
            console.log('Found calculate button');
            calcButton.style.pointerEvents = 'auto';
            calcButton.style.cursor = 'pointer';
            
            calcButton.addEventListener('click', function() {
                console.log('Calculate button clicked');
                
                // Get selected tags
                const selectedTags = Array.from(document.querySelectorAll('.tag-btn.active')).map(btn => btn.dataset.tag);
                console.log('Selected tags:', selectedTags);
                
                // Get selected scope
                const selectedScope = document.querySelector('.scope-btn.active');
                console.log('Selected scope:', selectedScope ? selectedScope.dataset.scope : 'none');
                
                if (selectedTags.length === 0) {
                    alert('Please select at least one genre tag');
                    return;
                }
                
                // Allow all users to use the calculator - no authentication blocking
                // The original calculation logic will run and show results
                // Premium blur effects will be applied in the results modal based on user status
            });
            
            // Add method to show upgrade prompt in results modal
            calcButton.addUpgradePromptToModal = function() {
                const modal = document.getElementById('results-modal');
                const existingPrompt = modal.querySelector('.upgrade-prompt');
                if (existingPrompt) return; // Already added
                
                const upgradePrompt = document.createElement('div');
                upgradePrompt.className = 'upgrade-prompt';
                upgradePrompt.innerHTML = `
                    <div style="background: rgba(255, 215, 0, 0.1); border: 1px solid #ffd700; border-radius: 8px; padding: 15px; margin: 15px 0; text-align: center;">
                        <h4 style="color: #ffd700; margin: 0 0 10px 0;">🔒 Unlock Full Pricing Analysis</h4>
                        <p style="margin: 0 0 15px 0; color: rgba(255, 255, 255, 0.9);">Get access to all 4 pricing strategies and detailed market analysis</p>
                        <button onclick="window.authManager.showPremiumModal()" style="background: #ffd700; color: #000; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">Upgrade to Premium</button>
                    </div>
                `;
                
                const resultsContent = modal.querySelector('.results-content');
                if (resultsContent) {
                    resultsContent.appendChild(upgradePrompt);
                }
            };
        }
        
        // Get Premium button - multiple selectors to catch all variants
        const premiumSelectors = ['.get-premium-btn', '.premium-btn', 'button[onclick*="openPremiumModal"]'];
        let targetBtn = null;
        
        for (const selector of premiumSelectors) {
            targetBtn = document.querySelector(selector);
            if (targetBtn) {
                console.log('Found premium button with selector:', selector);
                break;
            }
        }
        
        if (targetBtn) {
            // Remove any existing onclick handlers
            targetBtn.removeAttribute('onclick');
            targetBtn.style.pointerEvents = 'auto';
            targetBtn.style.cursor = 'pointer';
            
            // Add new click handler
            targetBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Premium button clicked!');
                
                const modal = document.getElementById('premiumModal');
                console.log('Modal element:', modal);
                
                if (modal) {
                    // Force show the modal with multiple methods
                    modal.style.display = 'flex';
                    modal.style.opacity = '1';
                    modal.style.visibility = 'visible';
                    modal.style.zIndex = '9999';
                    modal.classList.add('show');
                    
                    // Also try adding modal-open class to body
                    document.body.classList.add('modal-open');
                    
                    console.log('Premium modal should now be visible');
                    console.log('Modal styles:', {
                        display: modal.style.display,
                        opacity: modal.style.opacity,
                        visibility: modal.style.visibility
                    });
                } else {
                    console.error('Premium modal not found! Available modals:', 
                        document.querySelectorAll('[id*="modal"], [class*="modal"]'));
                }
            });
            
            console.log('Premium button event listener attached');
        } else {
            console.error('Premium button not found! Available buttons:', 
                document.querySelectorAll('button'));
        }
        
        // Close modal functionality
        const closeButtons = document.querySelectorAll('.close-modal');
        closeButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Close button clicked');
                const modal = document.getElementById('premiumModal');
                if (modal) {
                    modal.style.display = 'none';
                    modal.classList.remove('show');
                    document.body.classList.remove('modal-open');
                    console.log('Closed modal');
                }
            });
        });
        
        // Also close modal when clicking outside
        document.addEventListener('click', function(e) {
            const modal = document.getElementById('premiumModal');
            if (modal && e.target === modal) {
                modal.style.display = 'none';
                modal.classList.remove('show');
                document.body.classList.remove('modal-open');
                console.log('Closed modal by clicking outside');
            }
        });
        
        console.log('All event listeners set up');
    }, 500); // Wait 500ms for DOM to be fully ready
});
