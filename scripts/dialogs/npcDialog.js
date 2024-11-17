// NPC Dialog for DSA 4.1
export class NPCDialog {
    static async execute(abilities = [], currentAbility = null) {
        return new Promise((resolve) => {
            const abilityOptions = abilities.map(ability => 
                `<option value="${ability.name}" ${currentAbility === ability.name ? 'selected' : ''}>${ability.name}</option>`
            ).join('');

            new Dialog({
                title: "DSA 4.1 NSC-Aktion",
                content: `
                <style>
                    .dsa-dialog { 
                        display: grid; 
                        gap: 10px; 
                        padding-bottom: 10px;
                    }
                    .dsa-dialog select { 
                        width: 100%; 
                        margin-bottom: 10px;
                    }
                    .dsa-dialog label { 
                        display: block; 
                        margin-bottom: 5px; 
                    }
                </style>
                <form class="dsa-dialog">
                    <div>
                        <label for="ability">Fähigkeit</label>
                        <select id="ability" name="ability">
                            ${abilityOptions}
                        </select>
                    </div>
                </form>`,
                buttons: {
                    attack: {
                        label: "Attacke",
                        callback: (html) => {
                            const selectedAbility = html.find('#ability').val();
                            resolve({
                                ability: selectedAbility,
                                action: 'attack'
                            });
                        }
                    },
                    parade: {
                        label: "Parade",
                        callback: (html) => {
                            const selectedAbility = html.find('#ability').val();
                            resolve({
                                ability: selectedAbility,
                                action: 'parade'
                            });
                        }
                    },
                    cancel: {
                        label: "Abbrechen",
                        callback: () => resolve(null)
                    }
                },
                default: "attack",
                render: html => setTimeout(() => html.find('#ability').focus(), 0)
            }, {
                width: 300
            }).render(true);
        });
    }
}
