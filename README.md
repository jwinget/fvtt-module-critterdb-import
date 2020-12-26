# fvtt-module-critterdb-import
Foundry VTT module to import homebrew bestiaries from CritterDB

This module is currently a work in progress and imported creatures should be checked carefully. Please report any bugs or feature request as GitHub Issues.

It will currently import major stats and some other flavor (size, type, etc), but does not fully handle attacks, actions, and spells.
Due to the way CritterDB data is (un)structured, automatically handling attacks and spells is next to impossible. This module will get you 90% of the way there, however you will need to edit the imported NPCs to make full use of rolls and other Foundry features.
It will attempt to automatically handle weapon attacks, however it assumes all melee weapons are STR and ranged weapons are DEX based. Damage rolls for simple attacks should be handled properly but should be checked carefully, especially for weapons with multiple damage parts (e.g. 2d8 bludgeoning plus 1d6 force).

## To use:
1. Copy some CritterDB JSON to the clipboard using the export functionality provided there
2. Go to the "Compendiums" tab in the Foundry sidebar and click the "CritterDB Import" button
3. Paste in your CritterDB JSON
4. Select if you would like to update existing creatures
5. Click "Import"
