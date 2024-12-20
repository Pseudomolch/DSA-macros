Changelog:
- Added ⚔️ quick-attack with damage formulas in NSC Aktion macro
- Created DamageDialog macro and updated Damage macro to use it.
- Fixed issues with macro execution and parameter passing between Damage and DamageDialog macros.
- Created WoundsDialog macro and updated Zone Wounds macro to use it.
- Updated Attack macro to include a clickable icon for calling the Damage macro.
- Tested Attack macro, confirmed it correctly calls Damage macro, and fixed related errors.
- Implemented wound application from Damage macro to Zone Wounds macro with clickable icon.
- Removed "Mit Wuchtschlag (x)" text from the Attack macro output.
- Updated icons in Damage macro: now using blood drop (🩸) for damage and adhesive bandage (🩹) for wounds.
- Implemented initiative reduction for head wounds, including multiple wounds applied at once.
- Implemented additional damage for Bauch and Brust wounds.
- Implemented additional damage for the third Kopfwunde.
- Updated README.md with a logical overview of the macro system and workflow.
- Update flag usage to use selected token instead of user
- Enhanced Damage macro to handle simple number inputs without dice rolls
- Created Parade macro with support for Meisterperson PA values and finte modifiers
- Created NSC Aktion macro to display Meisterperson stats and provide quick access to all related macros
- Implemented wounds on Meisterpersonen influencing AT and PA
- Enhanced NSC Aktion macro to display wound modifiers
- Updated NSC Aktion macro to support multiple attacks
- Updated Attack and Damage macros to support multiple attacks in Meisterpersonen, using the first attack as default
- Added clickable sword emoji (⚔️) in NSC Aktion macro to trigger attack rolls with default values and pass damage formulas through the entire macro chain.
- Improved NSC Aktion dialog layout and resizing behavior

## 1. Split Dialogs into Separate Macros
- [x] Create a new macro called "DamageDialog"
  - [x] Move the dialog portion from the Damage macro to DamageDialog
  - [x] Ensure DamageDialog returns the necessary input values
- [x] Create a new macro called "WoundsDialog"
  - [x] Move the dialog portion from the Wounds macro to WoundsDialog
  - [x] Ensure WoundsDialog returns the necessary input values

## 2. Modify Existing Macros
- [x] Update the Damage macro
  - [x] Remove the dialog portion
  - [x] Add a call to DamageDialog to get input values
  - [x] Implement logic to accept parameters from Attack macro
  - [x] Implement logic to call the Wounds macro with the result
- [x] Update the Wounds macro
  - [x] Remove the dialog portion
  - [x] Add a call to WoundsDialog to get input values
  - [x] Implement wound application logic
- [x] Update the Attack macro
  - [x] Add clickable icon to call the Damage macro
  - [x] Pass critical hit and Wuchtschlag information to Damage macro

## 3. Implement Macro Chaining
- [x] In the Damage macro:
  - [x] After calculating damage, call the Wounds macro
  - [x] Pass the damage result and hit location to the Wounds macro
- [x] In the Attack macro:
  - [x] After determining a successful hit, provide option to call the Damage macro
  - [x] Pass relevant attack information to the Damage macro

## 4. Add some macros and functionality
- [x] We no longer need to say "Mit Wuchtschlag (x)" in the Attack macro behind the Erfolg line.
- [x] We should choose a different icon for the clickable Wounds icon in the Damage macro.
- [x] We should address the remaining TODOs in the Wounds macro.
  - [x] We should decrease the Initiative for the token by -2W6 if a newly applied first or second Kopfwunde is rolled. Needs a new line in the output that says how much Initiative was lost.
  - [x] We should roll additional damage if a Bauchwunde is applied, 1W6 extra for each newly applied (!) first or second Bauchwunde. Needs a new line in the output that shows how much additional damage was rolled.
  - [x] We should roll additional damage if a third Kopfwunde is applied, 2W6 extra damage. Needs a new line in the output that shows how much additional damage was rolled.

## 5. Testing
- [x] Test the Attack macro to ensure it correctly calls Damage
- [x] Test the Damage macro to ensure it correctly calls Wounds
- [x] Verify that dialog inputs are correctly passed between macros

## 6. Documentation
- [x] Update README.md with a logical overview of the macro system

## 7. Optimization
- [x] Review the macro chain to use the proper Flags so players can use the macros

## 8. Additional Enhancements
- [x] Create a user interface for managing zone armor values
- [x] Implement a parade macro
- [x] Implement wounds on Meisterpersonen influencing AT and PA
- [x] Implement a way to easily toggle between different weapons

## 9. Bugfixes
- [x] Using the Damage macro on itself should be possible
- [x] Using the Wounds macro on itself should be possible
- [ ] The player that was hit should be able to click the buttons to apply the wounds and damage.
- [ ] Fix the handling of advanced damage dice like 2W20
