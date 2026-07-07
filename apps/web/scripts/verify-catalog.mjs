import { getCollection, getCatalogRegistrationErrors } from '../lib/collection-data.ts';
const all = getCollection();
const byRarity = {};
for (const c of all) byRarity[c.rarityCode] = (byRarity[c.rarityCode] || 0) + 1;
console.log('TOTAL', all.length);
console.log('BY_RARITY', JSON.stringify(byRarity));
console.log('REGISTRATION_ERRORS', getCatalogRegistrationErrors().length);
