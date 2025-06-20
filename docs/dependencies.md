Below is the guidance Adobe gives (both in its marketplace review checklist and in the SDK notes that ship with Illustrator) together with field-tested practices from shipping CEP/UXP panels.

1. Keep the extension self-contained  
   • Every file the plug-in needs **must live inside the package you upload** (ZXP for CEP, CCX for UXP).  
   • Reviewers will install the package on a clean Illustrator build. If any part of the UI, a menu item, or a feature fails because an action set or asset is missing, the submission is rejected.  
   • Do **not** rely on users running an external installer or copying files into Illustrator’s “Actions” folder.  

2. Bundling Illustrator Action Sets  
   • Ship the .aia file in your extension’s file tree (e.g. `/assets/actions/ProoferActions.aia`).  
   • On first launch, have the panel load/register the set silently:  

     ```javascript
     const actionFile = `${cep.fs.app.getSystemPath('extension')}/assets/actions/ProoferActions.aia`;
     csInterface.evalScript(`app.loadActionFile("${actionFile}")`);
     ```  

   • Guard with a version check: if the set is already present, don’t reload.  
   • If an action is critical to a command, test its existence and fall back to a scripted path or surface a clear error (“Required action ‘⚙ Flatten Preview’ not found. Click ‘Repair’ to reinstall action set.”).

3. Bundling Graphic Assets (.ai, .svg, etc.)  
   • Store them in the package just like your actions (e.g. `/assets/legends/…`).  
   • When the user triggers a function that needs one of these items, place it by opening the file in the background or by placing it as a linked item:  

     ```javascript
     csInterface.evalScript(`
       var doc = app.activeDocument;
       var legend = File("${legendPath}");
       doc.layerSets.add().name = "Proofer Legend";
       doc.placedItems.add().file = legend;
     `);
     ```  

   • Do **not** download assets at runtime; offline install is part of the review checklist.

4. Declare “dependencies” only in your manifest  
   For the Marketplace, the only dependency fields that matter are:  
   • `hostList` → Which CC apps/versions you support.  
   • `requiredRuntime` (CEP) / `host.minVersion` (UXP).  

   Everything else is expected to be satisfied by the package itself. In other words, Illustrator action sets and artwork are not “dependencies” in Adobe’s sense—they are simply assets that **must be shipped inside the extension**.

5. Minimise and isolate to stay future-proof  
   • If an operation can be done with the scripting DOM (JSX or UXP APIs) instead of an action, prefer the scripted route—actions can break when Adobe renames menu items or panels.  
   • When you do need actions (e.g. Live Trace, Expand Appearance), keep them laser-focused: one action per atomic operation, no UI stops, recorded on a vanilla workspace.  
   • Names and menu paths in actions must stay English-language; locale-specific action steps often fail on non-English machines.

6. Document for users—but automate for them  
   • Your README/guide should explain what the bundled actions do, but the extension itself should install/repair them without user effort.  
   • Surface a single “Repair Installation” command that reloads the action set and replaces any missing art assets.

Is your current approach OK?  
Yes—continuing to use Illustrator actions and bundled artwork is perfectly acceptable and common practice, provided you package and self-install them as described. If today your workflow expects the user to manually load “Proofer Actions.aia” or copy legend files into a specific folder, that is **not** Marketplace-ready. Automate those steps inside the panel and you’ll meet Adobe’s review requirements and keep future updates painless.

For further reading, Adobe’s extension guidelines on dependency minimisation stress the same principle for other platforms ([Adobe Developer – Module dependencies](https://developer.adobe.com/commerce/php/architecture/modules/dependencies/)). The takeaway is identical: ship everything you need, avoid hidden external requirements, and verify the presence of any critical component at runtime.