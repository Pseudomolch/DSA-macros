# TODO: Enhance Macro Functionality

Changelog:
- Created DamageDialog macro and updated Damage macro to use it.
- Fixed issues with macro execution and parameter passing between Damage and DamageDialog macros.
- Created WoundsDialog macro and updated Zone Wounds macro to use it.
- Updated Attack macro to include a clickable icon for calling the Damage macro.
- Tested Attack macro, confirmed it correctly calls Damage macro, and fixed related errors.

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
  - [ ] Implement logic to call the Wounds macro with the result
- [x] Update the Wounds macro
  - [x] Remove the dialog portion
  - [x] Add a call to WoundsDialog to get input values
  - [x] Implement wound application logic
- [x] Update the Attack macro
  - [x] Add clickable icon to call the Damage macro
  - [x] Pass critical hit and Wuchtschlag information to Damage macro

## 3. Implement Macro Chaining
- [ ] In the Damage macro:
  - [ ] After calculating damage, call the Wounds macro
  - [ ] Pass the damage result and hit location to the Wounds macro
- [x] In the Attack macro:
  - [x] After determining a successful hit, provide option to call the Damage macro
  - [x] Pass relevant attack information to the Damage macro

## 4. Error Handling and Edge Cases
- [ ] Implement error checking in Wounds macro
- [ ] Implement error checking in Damage macro
- [ ] Handle cases where a called macro returns unexpected results

## 5. Testing
- [x] Test the Attack macro to ensure it correctly calls Damage
- [ ] Test the Damage macro to ensure it correctly calls Wounds
- [ ] Verify that dialog inputs are correctly passed between macros
- [ ] Test edge cases and error handling

## 6. Documentation
- [ ] Update comments in each macro to reflect new functionality
- [ ] Create or update user documentation explaining the new macro chain process

## 7. Optimization (if needed)
- [ ] Review the macro chain for any performance improvements
- [ ] Consider consolidating repeated code or calculations

## 8. Additional Enhancements
- [ ] Implement a way to easily toggle between different weapon damages for the same character
- [ ] Add support for special abilities or effects that modify damage or wound calculations
- [ ] Create a user interface for managing zone armor values
