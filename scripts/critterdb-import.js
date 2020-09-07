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
    let updateBool = html.find('[name=updateButton]').is(':checked');
    CritterDBImporter.parseCritter(critterJSON, updateBool)
  });
  this.close();
}

  static async parseCritter(critterJSON, updateBool) {
    // Parse CritterDB JSON data pasted in UI
    // Determine if this is a single monster or a bestiary by checking for creatures array
    let parsedCritters = JSON.parse(critterJSON);
    let creatureArray = parsedCritters.creatures;
    console.log(updateBool)

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

    // Dictionary to map monster size strings
    var size_dict = {
      "Tiny":"tiny",
      "Small":"sm",
      "Medium":"med",
      "Large":"lrg",
      "Huge":"huge",
      "Gargantuan":"grg"
    };

    // Generate Foundry Actor data structure and load
    for (let c of creatureArray) {
      console.log(`Importing ${c.name} into ${pack.collection}`);
      
      // Create the temporary actor data structure
      let tempActor = {
        name: c.name,
        type: "npc",
        img: c.flavor.imageUrl,
        token: {
          name: c.name,
          img: c.flavor.imageUrl
        },
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
            },
            source: `CritterDB - ${bestiary}`
          },
          traits: {
            size: size_dict[c.stats.size],
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
          },
        }
      };

      // Create the actor
      let thisActor = await Actor.create(tempActor,{'temporary':true, 'displaySheet': false});

      // Create owned "Items" for spells, actions, and abilities
      // WIP: Loop over the critterDB stats.additionalAbilities, actions, reactions, and legendaryActions
      // to generate Foundry "items" for attacks/spells/etc

      // Concatenate all of the arrays from CritterDB
      let action_array = c.stats.additionalAbilities.concat(c.stats.actions, c.stats.reactions, c.stats.legendaryActions);
      
      for (let a of action_array) {
        // Detect type of action where "Attack:" indicates a "weapon", otherwise a "feat"
        var atype = a.description.includes("Attack:");
        console.log(a.name);
        console.log(atype);

        // Set up the Item data
        let thisItem = {
          name: a.name,
          data: {
            description: {
              },
            damage: {
              parts: []
            }
            }
          };
        
        // Update properties that are different between weapons and feats
        if (atype) {
          thisItem.data.description.value = `<section class=\"secret\"><p>${a.description}</p>`;
          thisItem.type = "weapon";
          if (a.description.includes("Melee")) {
            thisItem.data.actionType = "mwak";
          } else if (a.description.includes("Ranged")) {
            thisItem.data.actionType = "rwak";
          }
          // This only handles attacks with one damage component. Need to again collect all parts from a.description :(
          thisItem.data.damage.parts.push([a.description.match(/\(([^)]+)\)/)[1], a.description.match(/\w+(?=\s+damage)/)[0].toLowerCase()]);
        } else {
          thisItem.data.description.value = `<p>${a.description}</p>`;
          thisItem.type = "feat";
        }

        // Create the item and add it to the actor
        let tempItem = await Item.create(thisItem, {'temporary': true, 'displaySheet': false});
        console.log(tempItem);
        thisActor.data.items.push(tempItem);
      };

      // Check if this actor already exists and handle update/replacement
      let existingActor = game.packs.find(p => p.collection === `world.critterdb-${bestiary}`).index.find(n => n.name === c.name);

      if (existingActor == null) {
      // Import the actor into the pack
      await pack.importEntity(thisActor);
      await pack.getIndex(); // Need to refresh the index to update it

      // Wrap up
      console.log(`Done importing ${c.name} into ${pack.collection}`);
      ui.notifications.info(`Done importing ${c.name} into ${pack.collection}`);
      } else if (updateBool == true) {
        // Need to pass _id to updateEntity
        tempActor._id = existingActor._id;
        
        // Don't update image or token in case these have been modified in Foundry
        // Could make this a check box later?
        delete tempActor.img;
        delete tempActor.token;

        await pack.updateEntity(tempActor);
        console.log(`Updated ${c.name} in ${pack.collection}`);
        ui.notifications.info(`Updated data for ${c.name} in ${pack.collection}`);
      } else {
        console.log(`${c.name} already exists. Skipping`);
        ui.notifications.error(`${c.name} already exists. Skipping`);
      }
    }
  }
}