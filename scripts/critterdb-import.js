// Set up the user interface
Hooks.on("renderSidebarTab", async (app, html) => {
    if (app.options.id == "compendium") {
      let button = $("<button class='import-dd'><i class='fas fa-file-import'></i> CritterDB Import</button>")
   
      button.click(function () {
        new CritterDBImporter().render(true);
      });
      
      html.find(".directory-footer").append(button);
    }
  })

// Main module class
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

activateListeners(html) {
  super.activateListeners(html)
  html.find(".import-critter").click(async ev => {
    let critterJSON = html.find('[name=critterdb-json]').val();
    CritterDBImporter.parseCritter(critterJSON)
  });
  this.close();
}

  static async parseCritter(critterJSON) {
    // Parse CritterDB JSON data pasted in UI
    // Set up a default bestiary for single-mob imports
    let bestiary = "MyCritters";

    // Determine if this is a single monster or a bestiary by checking for creatures array
    let parsedCritters = JSON.parse(critterJSON);
    let creatureArray = parsedCritters.creatures;

    if (creatureArray == null){ // One monster, load to catch-all compendium
      let bestiary = "MyCritters"
      // Create a length 1 array so we can use same iteration as for bestiary
      creatureArray = [parsedCritters]
    } else { // This is a bestiary, make a matching compendium
      let bestiary = parsedCritters.name.replace(/[ ,.]/g, "");
    }

    // Create compendium
    let pack = game.packs.find(p => p.collection === `critterdb-${bestiary}`);

    if (pack == null) {
        // Create a new compendium
        await Compendium.create({
            name: `critterdb-${bestiary}`,
            label: `CritterDB - ${bestiary}`,
            entity: "Actor"
          });
    }

    // Generate Foundry-formatted JSON data
    for (let c of creatureArray) {
      console.log(c.name)
    }
    // This should be assigned to const content

    // I think the below should work once the JSON payload is correctly formatted
    // Create temporary Actor entities which impose structure on the imported data
    // Looks like you have to call individually Actor.create() now. createMany() doesn't work anymore
    // may also be able to use Actor.importFromJSON() 
    // const actors = Actor.createMany(content, {temporary: true});

    // Save each temporary Actor into the Compendium pack
    //for ( let a of actors ) {
    //  await pack.importEntity(a);
    //  console.log(`Imported Actor ${a.name} into Compendium pack ${pack.collection}`);
    //}
  }
}