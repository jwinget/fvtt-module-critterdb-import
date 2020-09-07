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
    // Determine if this is a single monster or a bestiary by checking for creatures array
    let parsedCritters = JSON.parse(critterJSON);
    let creatureArray = parsedCritters.creatures;

    if (creatureArray == null){ // One monster, load to catch-all compendium
      var bestiary = "MyCritters"
      // Create a length 1 array so we can use same iteration as for bestiary
      creatureArray = [parsedCritters]
    } else { // This is a bestiary, make a matching compendium
      var bestiary = parsedCritters.name.replace(/[ ,.]/g, "");
    }

    // Look for compendium
    let pack = game.packs.find(p => p.collection === `world.critterdb-${bestiary}`);

    if (pack == null) {
        // Create a new compendium
        await Compendium.create({
            name: `critterdb-${bestiary}`,
            label: `CritterDB - ${bestiary}`,
            collection: `critterdb-${bestiary}`,
            entity: "Actor"
          });
    }
    // Update pack object
    pack = game.packs.find(p => p.collection === `world.critterdb-${bestiary}`);

    // Probably need to loop over the critterDB stats.additionalAbilities
    // to generate Foundry "items" for attacks/spells/etc

    // Generate Foundry Actor data structure and load
    for (let c of creatureArray) {
      console.log(`Importing" ${c.name} into ${pack.collection}`);
      let tempActor = {
        name: c.name,
        type: "npc",
        data: {
          abilities: {
            str: {
              value: c.stats.abilityScores.strength
            },
            dex: {
              value: c.stats.abilityScores.dexterity
            },
            con: {
              value: c.stats.abilityScores.constitution
            },
            int: {
              value: c.stats.abilityScores.intelligence
            },
            wis: {
              value: c.stats.abilityScores.wisdom
            },
            cha: {
              value: c.stats.abilityScores.charisma
            }
          },
          attributes: {
            ac: {
              value: c.stats.armorClass
            },
            hp: {
              value: c.stats.hitPoints,
              max: c.stats.hitPoints,
              formula: c.stats.hitPointsStr.match(/\(([^)]+)\)/)[1]
            }
          },
          details: {
            alignment: c.stats.alignment,
            type: c.stats.race,
            cr: c.stats.challengeRating,
            xp: {
              value: c.stats.experiencePoints
            }
          },
          traits: {
            di: {
              value: c.stats.damageImmunities
            },
            dr: {
              value: c.stats.damageResistances
            },
            dv: {
              value: c.stats.damageVulnerabilities
            },
            ci: {
              value: c.stats.conditionImmunities
            },
            senses: c.stats.senses.join()
          }
        }
      };

      let thisActor = await Actor.create(tempActor,{'temporary':false, 'displaySheet': false})
      await pack.importEntity(thisActor);
      console.log(`Done importing ${c.name} into ${pack.collection}`);
      ui.notifications.info(`Done importing ${c.name} into ${pack.collection}`);
    }
  }
}