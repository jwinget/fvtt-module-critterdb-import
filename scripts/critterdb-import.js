// Parse CritterDB JSON data

// Determine if this is a single monster or a bestiary

// Generate Foundry-formatted JSON data

// Check to see if compendium exists already, create if it doesn't
// Reference a Compendium pack by it's collection ID
let pack = game.packs.find(p => p.collection === `critterdb-${bestiary}`);

if (pack == null) {
    // Create a new compendium
    await Compendium.create({
        name: `critterdb-${bestiary}`,
        label: `CritterDB Imported-${bestiary}`,
        entity: "Actor",
      });
}

// Load an external JSON data file which contains data for import
// Need to change this to instead use the translated JSON
const response = await fetch("worlds/myworld/data/import.json");
const content = await response.json();

// I think the below should work once the JSON payload is correctly formatted
// Create temporary Actor entities which impose structure on the imported data
const actors = Actor.createMany(content, {temporary: true});

// Save each temporary Actor into the Compendium pack
for ( let a of actors ) {
  await pack.importEntity(a);
  console.log(`Imported Actor ${a.name} into Compendium pack ${pack.collection}`);
}