// Maps BGG game mechanics to typical scoring categories for that mechanic.
// Used to auto-suggest score sheet rows when importing a game from BGG.

const MECHANIC_MAP: Record<string, string[]> = {
  'Set Collection':                  ['Sets Completed', 'Set Bonus'],
  'Area Control / Area Influence':   ['Territory Points', 'Area Majority Bonus'],
  'Area Majority / Influence':       ['Influence Points', 'Majority Bonus'],
  'Deck Building':                   ['Victory Points', 'Money'],
  'Deck, Bag, and Pool Building':    ['Victory Points', 'Resources'],
  'Worker Placement':                ['Resources', 'Buildings', 'End-game Bonus'],
  'Worker Placement, Different Worker Types': ['Resources', 'Buildings', 'End-game Bonus'],
  'Tile Placement':                  ['Tiles Placed', 'Pattern Bonus', 'Adjacency Points'],
  'Hand Management':                 ['Cards Played', 'Special Bonus'],
  'Drafting':                        ['Drafted Cards', 'Bonus Points'],
  'Network and Route Building':      ['Routes', 'Connections', 'Longest Route'],
  'Auction / Bidding':               ['Acquired Items', 'Money Remaining'],
  'Auction: English':                ['Items Won', 'Money Remaining'],
  'Push Your Luck':                  ['Items Collected', 'Bust Penalty'],
  'Trick-taking':                    ['Tricks Won', 'Special Card Bonus'],
  'Engine Building':                 ['Production Bonus', 'End-game Points'],
  'Pattern Building':                ['Patterns Completed', 'Bonus Points'],
  'Trading':                         ['Goods', 'Money', 'Trade Bonus'],
  'Resource Management':             ['Resources', 'Conversion Bonus'],
  'Variable Player Powers':          ['Ability Bonus', 'Victory Points'],
  'Cooperative Game':                ['Objectives Completed', 'Team Score'],
  'Semi-Cooperative Game':           ['Personal Goal', 'Team Objective'],
  'Point to Point Movement':         ['Destinations', 'Route Points'],
  'Modular Board':                   ['Territory', 'Special Tiles'],
  'Card Drafting':                   ['Card Sets', 'Bonus Points'],
  'Dice Rolling':                    ['Dice Results', 'Reroll Bonus'],
  'Roll / Spin and Move':            ['Spaces Collected', 'Bonus Items'],
  'Bag Building':                    ['Bag Contents', 'Victory Points'],
  'Tableau Building':                ['Tableau Points', 'Combo Bonus'],
  'Action Points':                   ['Actions Used', 'Efficiency Bonus'],
  'Simultaneous Action Selection':   ['Round Score', 'Bonus Points'],
  'Betting and Bluffing':            ['Chips Won', 'Bluff Bonus'],
  'Investment':                      ['Returns', 'Portfolio Value'],
  'Income':                          ['Income', 'Expenses', 'Net Worth'],
  'Enclosure':                       ['Enclosed Areas', 'Size Bonus'],
  'Contracts':                       ['Contracts Fulfilled', 'Bonus Points'],
  'Layering':                        ['Layers Completed', 'Bonus Points'],
  'Rondel':                          ['Track Position', 'Rondel Bonus'],
  'Race':                            ['Finishing Position', 'Time Bonus'],
  'Command Cards':                   ['Battle Results', 'Territory Gained'],
  'Grid Movement':                   ['Positions Captured', 'Bonus Points'],
  'Hex-and-Counter':                 ['Hexes Controlled', 'Unit Points'],
  'Take That':                       ['Attacks Made', 'Defense Points'],
}

/**
 * Given a list of BGG mechanics, returns de-duplicated suggested scoring categories.
 * Limits to the most relevant suggestions to keep the list manageable.
 */
export function suggestCategories(mechanics: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const mechanic of mechanics) {
    const cats = MECHANIC_MAP[mechanic] ?? []
    for (const cat of cats) {
      if (!seen.has(cat)) {
        seen.add(cat)
        result.push(cat)
      }
    }
    if (result.length >= 12) break // cap at 12 suggestions
  }

  // If nothing matched, return a sensible generic fallback
  if (result.length === 0) {
    return ['Round Score', 'Bonus Points']
  }

  return result
}
