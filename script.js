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

    // 1) Load CSV from your published sheet via server proxy
    const CSV_URL = '/api/sheets';
    
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
          const res = await fetch(CSV_URL, { cache: 'no-store' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          csvText = await res.text();
          console.log('✅ Successfully loaded from Google Sheet');
        } catch (fetchError) {
          console.error('⚠️ Failed to load from Google Sheet:', fetchError.message);
          console.log('Using sample data as fallback');
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

      } catch (e) {
        console.error('Sheet load error:', e);
      }
    })();

    // Calculate Price A (Average Market Price) - USING ACTUAL SHEET COLUMNS
    const calculatePriceC = (priceB) => {
        if (priceB === 'N/A' || priceB === 0) return 'N/A';
        
        // Price C = Price B + 25%
        const priceC = priceB * 1.25;
        console.log('Price C calculation: Price B * 1.25 =', priceC);
        return priceC;
    };

    const calculatePriceD = (priceB) => {
        if (priceB === 'N/A' || priceB === 0) return 'N/A';
        
        // Price D = Price B - 25%
        const priceD = priceB * 0.75;
        console.log('Price D calculation: Price B * 0.75 =', priceD);
        return priceD;
    };

    const calculatePriceB = (priceA) => {
        if (priceA === 'N/A' || priceA === 0) return 'N/A';
        
        let adjustedPrice = priceA;
        let adjustmentFactor = 1.0; // Start with no adjustment
        
        // Get input values - use existing fields from main calculator
        const wishlistCount = parseInt(document.getElementById('wishlist-count')?.value) || 0;
        
        const devTimeSelect = document.getElementById('dev-time')?.value || '';
        
        // Get team size from existing dropdown (parallel to development time)
        const teamSizeDropdown = Array.from(document.querySelectorAll('select.input-field')).find(select => {
            const label = select.closest('.input-group')?.querySelector('label')?.textContent;
            return label && label.includes('Team Size');
        });
        const teamSize = parseInt(teamSizeDropdown?.value) || 0;
        const marketingCost = parseFloat(document.getElementById('marketing-cost')?.value) || 0;
        const countryOrigin = document.getElementById('country-origin')?.value || '';
        
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
        
        // 4. Player adjustments
        if (steamCut) {
            adjustmentFactor += 0.10; // Increase 10%
            console.log('Steam cut selected: +10%');
        }
        if (refundRate) {
            adjustmentFactor += 0.03; // Increase 3%
            console.log('Refund rate selected: +3%');
        }
        if (chargebacks) {
            // Random 2% increase each time
            const randomIncrease = 0.02;
            adjustmentFactor += randomIncrease;
            console.log('Chargebacks selected: +2%');
        }
        if (generalDiscounting > 0) {
            adjustmentFactor += 0.05; // Increase 5% if any discounting is entered
            console.log('General discounting entered: +5%');
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
        
        adjustedPrice = priceA * adjustmentFactor;
        
        console.log('Price B calculation:', {
            priceA: priceA,
            adjustmentFactor: adjustmentFactor,
            finalPriceB: adjustedPrice
        });
        
        return Math.max(0, adjustedPrice); // Ensure price doesn't go negative
    };

    const calculatePriceA = (selectedTags) => {
        console.log('=== CALCULATING PRICE A ===');
        console.log(`Processing ${selectedTags ? selectedTags.length : 0} selected genres:`, selectedTags);
        
        if (!window.gamesData) {
            console.log('No Google Sheet data loaded');
            return 'N/A';
        }
        
        console.log('Sheet has', window.gamesData.length, 'games');
        
        // Debug: Show all unique genres in the sheet
        const uniqueGenres = [...new Set(window.gamesData.map(g => g[window.columnMappings.genre]).filter(g => g))];
        console.log('All unique genres in sheet:', uniqueGenres.sort());
        
        // Debug: Show all unique scopes in the sheet
        const uniqueScopes = [...new Set(window.gamesData.map(g => g[window.columnMappings.scope]).filter(g => g))];
        console.log('All unique scopes in sheet:', uniqueScopes.sort());
        
        // Debug: Show what scope is selected
        const debugSelectedScope = document.querySelector('.scope-btn.active');
        const debugScopeValue = debugSelectedScope ? debugSelectedScope.dataset.scope : '';
        console.log('Selected scope value:', debugScopeValue);
        
        // Debug: Show problematic genres specifically
        const problematicGenres = ['darkfantasy', 'postapocalyptic', 'noir', 'scifi', 'storyrich'];
        problematicGenres.forEach(searchGenre => {
            const matchingGames = window.gamesData.filter(g => {
                const genre = (g[window.columnMappings.genre] || '').toLowerCase().trim();
                return genre.includes(searchGenre) || genre === searchGenre;
            });
            console.log(`${searchGenre} games in sheet:`, matchingGames.length);
            if (matchingGames.length > 0) {
                console.log(`First ${searchGenre} game:`, {
                    name: matchingGames[0][window.columnMappings.name],
                    genre: matchingGames[0][window.columnMappings.genre],
                    scope: matchingGames[0][window.columnMappings.scope],
                    price: matchingGames[0][window.columnMappings.price]
                });
            }
        });
        
        // Use the selectedTags parameter passed to the function
        if (!selectedTags || selectedTags.length === 0) {
            console.log('No tags selected');
            return 'N/A';
        }
        
        // Get selected scope
        const selectedScope = document.querySelector('.scope-btn.active');
        const scopeValue = selectedScope ? selectedScope.dataset.scope : '';
        
        // Get game type (singleplayer/multiplayer)
        const gameType = document.querySelector('.type-btn.active');
        const isMultiplayer = gameType && gameType.dataset.type === 'multiplayer';
        
        console.log('Selected tags:', selectedTags);
        console.log('Selected scope:', scopeValue);
        console.log('Is multiplayer:', isMultiplayer);
        
        if (!selectedTags || selectedTags.length === 0) {
            console.log('No tags selected, returning N/A');
            return 'N/A';
        }
        
        // Debug: Check actual data from your sheet with exact headers
        console.log('Available genres in sheet:', window.gamesData.map(g => g[window.columnMappings.genre]).slice(0, 20));
        console.log('Total games loaded:', window.gamesData.length);
        console.log('Expected: 340 games (20 genres × 17 games each)');
        console.log('Sample game data:', window.gamesData.slice(0, 5).map((g, i) => ({
            index: i,
            name: g[window.columnMappings.name],
            genre: g[window.columnMappings.genre],
            scope: g[window.columnMappings.scope],
            price: g[window.columnMappings.price],
            rawData: g
        })));
        
        // Debug: Show genre distribution and sequential layout
        const genreCount = {};
        const genreFirstAppearance = {};
        window.gamesData.forEach((game, index) => {
            const genre = game[window.columnMappings.genre];
            if (genre) {
                genreCount[genre] = (genreCount[genre] || 0) + 1;
                if (!genreFirstAppearance[genre]) {
                    genreFirstAppearance[genre] = index;
                }
            }
        });
        console.log('Genre distribution (should be 17 each):', genreCount);
        console.log('Genre first appearance indexes:', genreFirstAppearance);
        
        // Show scope distribution to understand what scopes exist in your sheet
        const scopeCount = {};
        window.gamesData.forEach((game, index) => {
            const scope = game[window.columnMappings.scope];
            if (scope) {
                scopeCount[scope] = (scopeCount[scope] || 0) + 1;
            }
        });
        console.log('Scope distribution in your sheet:', scopeCount);
        
        // Show first few games to verify sequential pattern
        console.log('First 20 games sequential check:');
        for (let i = 0; i < Math.min(20, window.gamesData.length); i++) {
            const genre = window.gamesData[i][window.columnMappings.genre];
            const scope = window.gamesData[i][window.columnMappings.scope];
            console.log(`Index ${i}: Genre="${genre}", Scope="${scope}"`);
        }
        
        let matchingGames = [];
        let genreMatchCounts = {};
        
        // Find games that match selected criteria by reading actual scope values from sheet
        window.gamesData.forEach((game, index) => {
            // Use dynamically found column names
            const gameGenre = (game[window.columnMappings.genre] || '').trim();
            
            if (!gameGenre) {
                return;
            }
            
            // Check if this game's genre matches ANY of the selected tags
            let matchedTag = null;
            const hasMatchingGenre = selectedTags.some(tag => {
                const tagLower = tag.toLowerCase().trim();
                const genreLower = gameGenre.toLowerCase().trim();
                
                // Direct exact match first - case insensitive
                let match = (genreLower === tagLower);
                
                // Debug for problematic genres specifically
                if (['darkfantasy', 'postapocalyptic', 'noir', 'scifi', 'storyrich'].includes(tagLower)) {
                    console.log(`🔍 ${tagLower} exact match check: "${genreLower}" === "${tagLower}" = ${match}`);
                    console.log(`🔍 Original gameGenre: "${gameGenre}"`);
                }
                
                // Also try exact match with original casing from sheet
                if (!match) {
                    // Map UI tags to exact sheet capitalization
                    const tagMappings = {
                        'darkfantasy': 'Dark Fantasy',
                        'scifi': 'Sci-fi', 
                        'noir': 'Noir/Detective',
                        'storyrich': 'Story Rich',
                        'postapocalyptic': 'Post Apocalyptic',
                        'fantasy': 'Fantasy',
                        'action': 'Action',
                        'rpg': 'RPG',
                        'strategy': 'Strategy',
                        'adventure': 'Adventure',
                        'simulation': 'Simulation',
                        'sports': 'Sports',
                        'racing': 'Racing',
                        'puzzle games': 'Puzzle Games',
                        'puzzle': 'Puzzle Games',
                        'horror': 'Horror',
                        'cozy': 'Cozy/Relaxing',
                        'survival': 'Survival',
                        'shooter': 'Shooter',
                        'platformer': 'Platformer',
                        'fighting': 'Fighting',
                        'mmo': 'MMO',
                        'indie': 'Indie',
                        'roguelike': 'Roguelike',
                        'sandbox': 'Sandbox',
                        'educational': 'Educational',
                        'cyberpunk': 'Cyberpunk/Dystopian',
                        'comedy': 'Comedy',
                        'historical': 'Historical'
                    };
                    
                    const exactSheetGenre = tagMappings[tagLower];
                    if (exactSheetGenre) {
                        match = (gameGenre === exactSheetGenre);
                        console.log(`🔍 Trying exact match: "${gameGenre}" === "${exactSheetGenre}" = ${match}`);
                        if (match) {
                            console.log(`✅ Mapped match: "${tag}" -> "${exactSheetGenre}" matches "${gameGenre}"`);
                        }
                    }
                }
                
                // Debug each tag matching attempt
                console.log(`Checking "${gameGenre}" against "${tag}": direct=${genreLower === tagLower}, match=${match}`);
                
                // Special debug for Fantasy conflicts
                if (tagLower === 'fantasy' || tagLower === 'dark fantasy' || genreLower.includes('fantasy')) {
                    console.log(`🔍 Fantasy debug: gameGenre="${gameGenre}", tagLower="${tagLower}", genreLower="${genreLower}", match=${match}`);
                    if (tagLower === 'dark fantasy') {
                        console.log(`🔍 Dark Fantasy specific: looking for exact match with "dark fantasy"`);
                    }
                }
                
                if (match) {
                    matchedTag = tag;
                    console.log(`✅ Genre match: "${gameGenre}" matches "${tag}" at index ${index}`);
                    
                    // Track which genres we find matches for (only count once per game)
                    if (!genreMatchCounts[tag]) {
                        genreMatchCounts[tag] = 0;
                    }
                    genreMatchCounts[tag]++;
                }
                return match;
            });
            
            if (!hasMatchingGenre) return;
            
            // Read actual scope value from the sheet row
            const gameScope = (game[window.columnMappings.scope] || '').toLowerCase().trim();
            
            // Debug: Show raw scope value before processing
            if (index < 5) {
                console.log(`Raw scope for game ${index}: "${game[window.columnMappings.scope]}" -> processed: "${gameScope}"`);
            }
            
            console.log(`Game ${index}: "${game[window.columnMappings.name]}" - Sheet scope: "${gameScope}"`);
            
            // ALWAYS filter by scope - must match exactly
            let scopeMatches = false;
            
            if (isMultiplayer) {
                // For multiplayer, match "Unscoped/Multiplayer" exactly
                scopeMatches = gameScope.includes('unscoped/multiplayer');
                console.log(`Multiplayer scope check: "${gameScope}" contains "unscoped/multiplayer" = ${scopeMatches}`);
            } else if (scopeValue) {
                // For singleplayer, match the selected scope against actual sheet values
                if (scopeValue === 'compact') {
                    scopeMatches = gameScope.includes('compact') && gameScope.includes('0-5');
                } else if (scopeValue === 'standard') {
                    scopeMatches = gameScope.includes('standard') && gameScope.includes('5-15');  
                } else if (scopeValue === 'high') {
                    scopeMatches = gameScope.includes('high') && gameScope.includes('15h+');
                }
                console.log(`Singleplayer scope check: "${gameScope}" matches "${scopeValue}" = ${scopeMatches}`);
            }
            
            console.log(`Scope matching: Sheet scope "${gameScope}" vs selected "${scopeValue}" (multiplayer: ${isMultiplayer}) = ${scopeMatches}`);
            
            // Debug: Show detailed scope matching logic
            if (scopeValue && scopeValue !== '') {
                console.log(`Detailed scope check for "${gameScope}":`);
                console.log(`- Looking for: ${scopeValue}`);
                console.log(`- Is multiplayer: ${isMultiplayer}`);
                if (!isMultiplayer) {
                    if (scopeValue === 'compact') {
                        console.log(`- Compact check: includes('compact')=${gameScope.includes('compact')}, includes('0-5')=${gameScope.includes('0-5')}`);
                    } else if (scopeValue === 'standard') {
                        console.log(`- Standard check: includes('standard')=${gameScope.includes('standard')}, includes('5-15')=${gameScope.includes('5-15')}`);
                    } else if (scopeValue === 'high') {
                        console.log(`- High check: includes('high')=${gameScope.includes('high')}, includes('15h+')=${gameScope.includes('15h+')}, includes('15+')=${gameScope.includes('15+')}`);
                    }
                }
            }
            
            if (scopeMatches) {
                // Use dynamically found column names
                const gameName = game[window.columnMappings.name] || '';
                const priceStr = (game[window.columnMappings.price] || '').toString().replace('$', '').trim();
                const gamePrice = parseFloat(priceStr);
                
                if (!isNaN(gamePrice) && gamePrice > 0 && gameName.trim()) {
                    matchingGames.push({ 
                        name: gameName.trim(), 
                        price: gamePrice, 
                        genre: gameGenre,
                        matchedTag: matchedTag 
                    });
                    console.log(`✅ Added game: ${gameName.trim()} - $${gamePrice} (genre: ${gameGenre}, matched tag: ${matchedTag})`);
                }
            }
        });

        console.log('Final matching games:', matchingGames.length);
        console.log('Matching games:', matchingGames);
        
        // Store matching games globally
        window.lastMatchingGames = matchingGames;
        
        // Group games by matched tag for debugging
        const gamesByTag = {};
        matchingGames.forEach(game => {
            if (!gamesByTag[game.matchedTag]) {
                gamesByTag[game.matchedTag] = [];
            }
            gamesByTag[game.matchedTag].push(game);
        });
        
        Object.keys(gamesByTag).forEach(tag => {
            console.log(`${tag}: ${gamesByTag[tag].length} games`);
            gamesByTag[tag].forEach(game => {
                console.log(`  - ${game.name} ($${game.price}) [${game.genre}]`);
            });
        });
        
        if (matchingGames.length === 0) {
            console.log('❌ No matching games found');
            console.log('Debug: Total games processed:', window.gamesData.length);
            console.log('Debug: Genre match counts:', genreMatchCounts);
            return 'N/A';
        }
        
        // Calculate average
        const totalPrice = matchingGames.reduce((sum, game) => sum + game.price, 0);
        const averagePrice = totalPrice / matchingGames.length;
        
        console.log(`✅ REAL CALCULATION FROM YOUR SHEET:`);
        console.log(`Total: $${totalPrice}, Count: ${matchingGames.length}, Average: $${averagePrice.toFixed(2)}`);
        console.log('Matching games:', matchingGames.map(g => `${g.name} ($${g.price})`));
        
        return averagePrice;
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
    
        // Update modal content with exact format requested
        const priceAElement = document.getElementById('price-a-value');
        const priceBElement = document.getElementById('price-b-value');
        const priceCElement = document.getElementById('price-c-value');
        const priceDElement = document.getElementById('price-d-value');
        
        console.log('Updating DOM elements...');
        console.log('Price A element found:', !!priceAElement);
        console.log('Price B element found:', !!priceBElement);
        
        if (priceAElement) {
            priceAElement.textContent = priceA === 'N/A' ? 'N/A' : `Average Market Price = $${priceA.toFixed(2)} USD`;
            console.log('Price A updated to:', priceAElement.textContent);
        }
        if (priceBElement) {
            priceBElement.textContent = priceB === 'N/A' ? 'N/A' : `$${priceB.toFixed(2)}`;
            console.log('Price B updated to:', priceBElement.textContent);
        }
        if (priceCElement) {
            priceCElement.textContent = priceC === 'N/A' ? 'N/A' : `$${priceC.toFixed(2)}`;
            console.log('Price C updated to:', priceCElement.textContent);
        }
        if (priceDElement) {
            priceDElement.textContent = priceD === 'N/A' ? 'N/A' : `$${priceD.toFixed(2)}`;
            console.log('Price D updated to:', priceDElement.textContent);
        }
        
            // Artwork showcase code removed to fix tag button interference
        
            // Reset button state
            this.textContent = originalText;
            this.style.pointerEvents = 'auto';
            
            // Show modal
            const modal = document.getElementById('results-modal');
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('active');
            }, 10);
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

    // Keep calculator container static - no scroll animations
    const calculatorContainer = document.querySelector('.calculator-container');
    if (calculatorContainer) {
        // Ensure calculator is always visible and in normal position
        calculatorContainer.style.opacity = '1';
        calculatorContainer.style.transform = 'none';
        calculatorContainer.style.transition = 'none';
    }

    // Smooth hover effects for interactive elements (excluding tag-btn to avoid conflicts)
    const interactiveElements = document.querySelectorAll('button:not(.tag-btn), .nav-link, .scope-btn, .type-btn');
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });
    });

    // Form validation with CRED-style feedback
    const formInputs = document.querySelectorAll('input, select');
    formInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                this.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            } else {
                this.style.borderColor = '#ffffff';
            }
        });
    });

    // Premium button special animation
    const premiumBtn = document.querySelector('.premium-btn');
    if (premiumBtn) {
        premiumBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.02)';
        });
        
        premiumBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    }
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
        
        // Tag button functionality with random positioning
        const tagButtons = document.querySelectorAll('.tag-btn');
        console.log('Found tag buttons:', tagButtons.length);
        
        if (tagButtons.length === 0) {
            console.error('No tag buttons found! Checking for tags-container...');
            const container = document.getElementById('tags-container');
            console.log('Tags container:', container);
        }
        
        // Compact uniform layout for half-height container
        const scatteredPositions = [
            { top: '10%', left: '15%' },  // Strategy
            { top: '10%', left: '45%' },  // RPG
            { top: '10%', left: '75%' },  // Action
            { top: '25%', left: '8%' },   // Horror
            { top: '25%', left: '32%' },  // Cozy
            { top: '25%', left: '58%' },  // Shooter
            { top: '25%', left: '82%' },  // Sports
            { top: '40%', left: '18%' },  // Simulation
            { top: '40%', left: '48%' },  // Post Apocalyptic
            { top: '40%', left: '78%' },  // Comedy
            { top: '55%', left: '12%' },  // Survival
            { top: '55%', left: '38%' },  // Cyberpunk
            { top: '55%', left: '65%' },  // Noir/Detective
            { top: '70%', left: '5%' },   // Dark Fantasy
            { top: '70%', left: '28%' },  // Sci-Fi
            { top: '70%', left: '52%' },  // Fantasy
            { top: '70%', left: '78%' },  // Historical
            { top: '85%', left: '18%' },  // Adventure
            { top: '85%', left: '48%' },  // Story Rich
            { top: '85%', left: '78%' }   // Puzzle Games
        ];

        tagButtons.forEach((button, index) => {
            console.log(`Setting up tag button ${index}: ${button.textContent}`);
            
            // Apply scattered position
            if (scatteredPositions[index]) {
                button.style.top = scatteredPositions[index].top;
                button.style.left = scatteredPositions[index].left;
            }
            
            // Force styles to ensure clickability
            button.style.pointerEvents = 'auto';
            button.style.cursor = 'pointer';
            button.style.userSelect = 'none';
            
            // Add multiple event types
            ['click', 'mousedown', 'touchstart'].forEach(eventType => {
                button.addEventListener(eventType, function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (eventType === 'click') {
                        console.log('Tag clicked:', this.textContent);
                        
                        // Add subtle scatter animation on click - keep position
                        const randomX = (Math.random() - 0.5) * 8; // -4px to +4px
                        const randomY = (Math.random() - 0.5) * 8; // -4px to +4px
                        const randomRotate = (Math.random() - 0.5) * 4; // -2deg to +2deg
                        
                        this.style.transform = `translate(-50%, -50%) translate(${randomX}px, ${randomY}px) rotate(${randomRotate}deg)`;
                        
                        // Don't reset position - keep the tag where it moved to
                        
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
                                console.log('Max 5 tags reached');
                            }
                        }
                    }
                });
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
                
                // Show results modal
                const modal = document.getElementById('results-modal');
                if (modal) {
                    modal.style.display = 'flex';
                    console.log('Showing results modal');
                    
                    // Calculate prices (simplified)
                    document.getElementById('priceA').textContent = '$19.99';
                    document.getElementById('priceB').textContent = '$24.99';
                    document.getElementById('priceC').textContent = '$29.99';
                    document.getElementById('priceD').textContent = '$14.99';
                }
            });
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
