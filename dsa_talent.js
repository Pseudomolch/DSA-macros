// Prompt the user for the attributes, TaW, and modifier
let attributesAndTaW = await new Promise((resolve) => {
    let dialog = new Dialog({
        title: "DSA 4.1 Talentprobe",
        content: `
        <style>
            .dsa-dialog { 
                display: grid; 
                grid-template-columns: repeat(3, 1fr); 
                gap: 10px; 
                padding-bottom: 10px;
            }
            .dsa-dialog input[type="number"] { 
                width: 100%; 
                text-align: center; 
            }
            .dsa-dialog label { 
                display: block; 
                text-align: center; 
                margin-bottom: 2px; 
                margin-top: 10px;
            }
            .dsa-dialog .attributes {
                margin-bottom: 10px;
            }
            .dialog-buttons {
                margin-top: 10px;
            }
        </style>
        <form class="dsa-dialog">
            <div class="attributes">
                <input id="attribute1" type="number" placeholder="Attribut 1" required tabindex="1">
            </div>
            <div class="attributes">
                <input id="attribute2" type="number" placeholder="Attribut 2" required tabindex="2">
            </div>
            <div class="attributes">
                <input id="attribute3" type="number" placeholder="Attribut 3" required tabindex="3">
            </div>
            <div>
                <label for="taw">TaW</label>
                <input id="taw" type="number" required tabindex="4">
            </div>
            <div></div>
            <div>
                <label for="modifier">Mod</label>
                <input id="modifier" type="number" value="0" tabindex="5">
            </div>
        </form>
        `,
        buttons: {
            roll: {
                label: "Würfeln",
                callback: (html) => {
                    resolve({
                        attribute1: parseInt(html.find('#attribute1')[0].value),
                        attribute2: parseInt(html.find('#attribute2')[0].value),
                        attribute3: parseInt(html.find('#attribute3')[0].value),
                        taw: parseInt(html.find('#taw')[0].value),
                        modifier: parseInt(html.find('#modifier')[0].value) || 0
                    });
                }
            }
        },
        default: "roll",
        render: html => setTimeout(() => html.find('#attribute1').focus(), 0)
    }, {
        width: 300
    });
    
    dialog.render(true);
});

// Rest of the macro remains the same
let rolls = [new Roll('1d20').roll({async: false}).total, new Roll('1d20').roll({async: false}).total, new Roll('1d20').roll({async: false}).total];

let numOnes = rolls.filter(roll => roll === 1).length;
let numTwenties = rolls.filter(roll => roll === 20).length;
let criticalSuccess = numOnes >= 2;
let criticalFailure = numTwenties >= 2;

let { attribute1, attribute2, attribute3, taw, modifier } = attributesAndTaW;

let effectiveTaW = taw;
let effectiveAttributes = [attribute1, attribute2, attribute3];

if (modifier > 0) {
    effectiveTaW = Math.max(0, taw - modifier);
    let remainingMod = Math.max(0, modifier - taw);
    effectiveAttributes = effectiveAttributes.map(attr => Math.max(1, attr - remainingMod));
} else if (modifier < 0) {
    effectiveTaW = Math.min(taw, taw - modifier);
}

let remainingTaW = effectiveTaW;
let rollDetails = rolls.map((roll, index) => {
    let attribute = effectiveAttributes[index];
    let diff = roll - attribute;
    if (diff > 0) {
        remainingTaW -= diff;
        return `${roll}(-${diff})`;
    } else {
        return `${roll}`;
    }
});

let result;
let resultColor;
if (criticalSuccess) {
    result = "Kritischer Erfolg";
    resultColor = "green";
} else if (criticalFailure) {
    result = "Patzer";
    resultColor = "red";
} else if (remainingTaW >= 0) {
    result = "Erfolg";
    resultColor = "green";
} else {
    result = "Fehlschlag";
    resultColor = "red";
}

let messageContent = `<div style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 5px; border-radius: 3px;">`;
messageContent += `<strong>Talent:</strong> ${attribute1}/${attribute2}/${attribute3}, ${taw} TaW`;
if (modifier !== 0) {
    messageContent += `, ${modifier > 0 ? '+' : ''}${modifier} Mod`;
}
messageContent += `<br>`;
messageContent += `<strong>Wurf:</strong> ${rollDetails.join('/')}<br>`;
messageContent += `<span style="color: ${resultColor};">${result}</span>`;
if (remainingTaW >= 0 && !criticalSuccess) {
    messageContent += ` mit ${remainingTaW} TaW*`;
}
messageContent += `</div>`;

ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    content: messageContent
});