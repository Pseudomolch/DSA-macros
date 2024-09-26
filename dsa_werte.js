// Get the selected tokens
let selectedTokens = canvas.tokens.controlled;

// Check if any tokens are selected
if (selectedTokens.length === 0) {
    // Construct the message content for no tokens selected
    let messageContent = `<div style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 5px; border-radius: 3px;">`;
    messageContent += `<strong>Keine Tokens ausgewählt</strong>`;
    messageContent += `</div>`;

    // Send the result to the chat
    ChatMessage.create({
        speaker: ChatMessage.getSpeaker(),
        content: messageContent
    });
} else {
    // Use the createTokenStatMessage function to construct and send the message for all selected tokens
    createTokenStatMessage(selectedTokens);
}

/**
 * Sets up click listeners for token links in chat messages.
 * Ensures that listeners are only added once to prevent duplicates.
 */
function setupTokenLinkListeners() {
    // Use jQuery to delegate the click event to all existing and future .token-link elements
    // This ensures that even if chat messages are re-rendered, the listener remains active
    $(document).off('click', '.token-link').on('click', '.token-link', async (event) => {
        event.preventDefault(); // Prevent default action

        const tokenId = event.currentTarget.dataset.tokenId;
        const token = canvas.tokens.get(tokenId);
        if (!token) return;

        const actor = token.actor;
        const tokenData = actor.data.data.base.resources;

        // Fetch special abilities
        let specialAbilities = actor.items
            .filter(item => item.type === "specialAbility")
            .map(ability => ability.name);

        // Create the HTML content for the dialog with editable LeP and AsP fields
        let dialogContent = `
            <form>
                <div class="form-group">
                    <label><strong>LeP:</strong></label><br>
                    <input type="number" id="lep-current" name="lep-current" value="${tokenData.vitality.value}" min="0" max="${tokenData.vitality.max}" style="width: 80px;"> / 
                    <input type="number" id="lep-max" name="lep-max" value="${tokenData.vitality.max}" min="0" style="width: 80px;">
                </div>
                <div class="form-group">
                    <label><strong>AsP:</strong></label><br>
                    <input type="number" id="asp-current" name="asp-current" value="${tokenData.astralEnergy.value}" min="0" max="${tokenData.astralEnergy.max}" style="width: 80px;"> / 
                    <input type="number" id="asp-max" name="asp-max" value="${tokenData.astralEnergy.max}" min="0" style="width: 80px;">
                </div>
                <div class="form-group">
                    <!-- Header List with Add Button -->
                    <ul id="abilities-header" style="margin-top: 5px; list-style-type: none; padding: 0;">
                        <li style="display: flex; align-items: center; margin-bottom: 5px;">
                            <label><strong>Sonderfertigkeiten:</strong></label>
                            <button type="button" id="add-ability" style="width: 30px; height: 30px; float: right;">+</button>
                        </li>
                    </ul>
                </div>
                <div class="form-group">
                    <!-- Abilities List -->
                    <ul id="abilities-list" style="margin-top: 5px; list-style-type: none; padding: 0;">
                        ${specialAbilities.map((ability, index) => `
                            <li style="display: flex; align-items: center; margin-bottom: 5px;">
                                <input type="text" value="${ability}" class="ability-input" placeholder="Ability Name" style="flex-grow: 1; margin-right: 5px;">
                                <button type="button" class="remove-ability" style="width: 30px; height: 30px;">x</button>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </form>
        `;

        // Create the dialog
        const dialog = new Dialog({
            title: `Edit ${token.name}`,
            content: dialogContent,
            buttons: {
                save: {
                    icon: '<i class="fas fa-save"></i>',
                    label: 'Save',
                    callback: async (html) => {
                        // Get updated LeP and AsP values
                        const newLeP = parseInt(html.find('#lep-current').val()) || 0;
                        const newLePMax = parseInt(html.find('#lep-max').val()) || tokenData.vitality.max;
                        const newAsP = parseInt(html.find('#asp-current').val()) || 0;
                        const newAsPMax = parseInt(html.find('#asp-max').val()) || tokenData.astralEnergy.max;

                        // Update token resources
                        await actor.update({
                            'data.base.resources.vitality.value': newLeP,
                            'data.base.resources.vitality.max': newLePMax,
                            'data.base.resources.astralEnergy.value': newAsP,
                            'data.base.resources.astralEnergy.max': newAsPMax
                        });

                        // Update special abilities
                        const abilities = [];
                        html.find('.ability-input').each(function() {
                            const abilityName = $(this).val().trim();
                            if (abilityName) {
                                abilities.push(abilityName);
                            }
                        });

                        // Remove existing special abilities
                        const existingAbilities = actor.items.filter(item => item.type === "specialAbility");
                        const existingIds = existingAbilities.map(ability => ability.id);
                        if (existingIds.length > 0) {
                            await actor.deleteEmbeddedDocuments("Item", existingIds);
                        }

                        // Add updated special abilities
                        if (abilities.length > 0) {
                            const newAbilities = abilities.map(name => ({
                                name: name,
                                type: "specialAbility",
                                data: {}
                            }));
                            await actor.createEmbeddedDocuments("Item", newAbilities);
                        }

                        // Output a chat message for the updated token
                        createTokenStatMessage([token]);
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel'
                }
            },
            default: "save",
            close: () => {
                // Clean up any event listeners or resources if necessary
            }
        });

        // Render the dialog
        dialog.render(true);

        // Use the rendered hook to set up event listeners after the dialog is fully rendered
        Hooks.once('renderDialog', (app, html, data) => {
            if (app === dialog) {
                // Event Listener for Adding Abilities
                html.find('#add-ability').on('click', () => {
                    const newAbility = `
                        <li style="display: flex; align-items: center; margin-bottom: 5px;">
                            <input type="text" value="" class="ability-input" placeholder="Ability Name" style="flex-grow: 1; margin-right: 5px;">
                            <button type="button" class="remove-ability" style="width: 30px; height: 30px;">x</button>
                        </li>
                    `;
                    html.find('#abilities-list').append(newAbility);
                });

                // Event Listener for Removing Abilities
                html.find('#abilities-list').on('click', '.remove-ability', function() {
                    $(this).closest('li').remove();
                });
            }
        });
    });
}

/**
 * Creates a chat message for a given array of tokens with their current stats.
 * @param {Token[]} tokens - The array of tokens to create the message for.
 */
function createTokenStatMessage(tokens) {
    let messageContent = `<div style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 5px; border-radius: 3px;">`;

    tokens.forEach(token => {
        let tokenData = token.actor.data.data.base.resources;
        let lepCurrent = tokenData.vitality.value;
        let lepMax = tokenData.vitality.max;
        let aspCurrent = tokenData.astralEnergy.value;
        let aspMax = tokenData.astralEnergy.max;

        // Get special abilities
        let specialAbilities = token.actor.items
            .filter(item => item.type === "specialAbility")
            .map(ability => ability.name);

        messageContent += `<span class="token-link" data-token-id="${token.id}" style="color: blue; text-decoration: underline; cursor: pointer;"><strong>${token.name}</strong></span>: LeP ${lepCurrent}/${lepMax}`;
        
        if (aspMax > 0) {
            messageContent += `, AsP ${aspCurrent}/${aspMax}`;
        }

        if (specialAbilities.length > 0) {
            let abilitiesList = specialAbilities.join(", ");
            messageContent += `, ${abilitiesList}`;
        }

        messageContent += `<br>`;
    });

    messageContent += `</div>`;

    // Send the result to the chat
    ChatMessage.create({
        speaker: ChatMessage.getSpeaker(),
        content: messageContent
    }).then(() => {
        // After creating the chat message, set up the click listeners
        setupTokenLinkListeners();
    });
}
