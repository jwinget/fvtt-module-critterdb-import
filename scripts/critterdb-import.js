// Need to link this all to a UI interface
// Like a button alongside "Create Compendium"
// Check how DungeonDraft importer does it
Hooks.on("renderSidebarTab", async (app, html) => {
    if (app.options.id == "compendium") {
      let button = $("<button class='import-dd'><i class='fas fa-file-import'></i> CritterDB Import</button>")
   
      button.click(function () {
        new CritterDBImporter().render(true);
      });
      
      html.find(".directory-footer").append(button);
    }
  })

class CritterDBImporter extends Application
{
  static get defaultOptions()
  {
      const options = super.defaultOptions;
      options.id = "critterdb-importer";
      options.template = "modules/critterdb-import/templates/critterdb_import_ui.html"
      options.classes.push("critterdb-importer");
      options.resizable = false;
      options.height = "auto";
      options.width = 400;
      options.minimizable = true;
      options.title = "CritterDB Importer"
      return options;
}

  async parseCritter() {
    // Set up a default bestiary for single-mob imports
let bestiary = "MyCritters";

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
        label: `CritterDB - ${bestiary}`,
        entity: "Actor"
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
  }
}