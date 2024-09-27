# TODO: Enhance Macro Functionality

Changelog:
- Created DamageDialog macro and updated Damage macro to use it.

## 1. Split Dialogs into Separate Macros
- [x] Create a new macro called "DamageDialog"
  - [x] Move the dialog portion from the Damage macro to DamageDialog
  - [x] Ensure DamageDialog returns the necessary input values
- [ ] Create a new macro called "WoundsDialog"
  - [ ] Move the dialog portion from the Wounds macro to WoundsDialog
  - [ ] Ensure WoundsDialog returns the necessary input values

## 2. Modify Existing Macros
- [x] Update the Damage macro
  - [x] Remove the dialog portion
  - [x] Add a call to DamageDialog to get input values
  - [ ] Implement logic to call the Wounds macro with the result
- [ ] Update the Wounds macro
  - [ ] Remove the dialog portion
  - [ ] Add a call to WoundsDialog to get input values
- [ ] Update the Attack macro
  - [ ] Add logic to call the Damage macro with the attack result

## 3. Implement Macro Chaining
- [ ] In the Damage macro:
  - [ ] After calculating damage, call the Wounds macro
  - [ ] Pass the damage result to the Wounds macro
- [ ] In the Attack macro:
  - [ ] After determining a successful hit, call the Damage macro
  - [ ] Pass relevant attack information to the Damage macro

## 4. Error Handling and Edge Cases
- [ ] Implement error checking in each macro
- [ ] Handle cases where a called macro returns unexpected results

## 5. Testing
- [ ] Test the Attack macro to ensure it correctly calls Damage
- [ ] Test the Damage macro to ensure it correctly calls Wounds
- [ ] Verify that dialog inputs are correctly passed between macros
- [ ] Test edge cases and error handling

## 6. Documentation
- [ ] Update comments in each macro to reflect new functionality
- [ ] Create or update user documentation explaining the new macro chain process

## 7. Optimization (if needed)
- [ ] Review the macro chain for any performance improvements
- [ ] Consider consolidating repeated code or calculations
