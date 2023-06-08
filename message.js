function battleReportDataReducer(accumulator, currentObject) {
    // Iterate over each key in the current object
    for (const key in currentObject) {
        // Check if the key exists in the accumulator object
        if (accumulator.hasOwnProperty(key)) {
            // Add the value to the existing sum for the key
            accumulator[key] += currentObject[key];
        } else {
            // Initialize the sum for the key if it doesn't exist in the accumulator
            accumulator[key] = currentObject[key];
        }
    }

    // Return the updated accumulator
    return accumulator;
}
function calculateMP(att, def) {
    return (att + def) / 200
}

const createTextMessage = (parsedJsonData, fleetLostDataParsed, finalReportUrl, user) => {
        const attacker = Object.values(parsedJsonData.ships.g.att)
        .reduce(battleReportDataReducer, {})
    const attackerMP = calculateMP(attacker.at, attacker.de).toFixed(1)
    const defender = Object.values(parsedJsonData.ships.g.def)
        .reduce(battleReportDataReducer, {})
    const defenderMP = calculateMP(defender.at, defender.de).toFixed(1)
    let resultResponse = ''
    if (parsedJsonData.loot.info.atter_couldloot) {
        if(parsedJsonData.loot.values && Object.values(parsedJsonData.loot.values).some(v => v > 0)) {
            resultResponse = '**Attacker won and looted ' +
                Object.values(parsedJsonData.loot.values)
                    .map((v) => v && v.toLocaleString())
                    .join('/') +
                ' resources! :tada:**'
        } else {
            resultResponse = '**Attacker won :tada: and looted nothing :face_holding_back_tears:!**'
        }
    } else {
        resultResponse = '**Defender won! :tada:**'
    }

    let fleetLostResponse = ''
    if(fleetLostDataParsed) {
        const attackerItems = fleetLostDataParsed.filter(v => v.front === 'att')
        const defenderItems = fleetLostDataParsed.filter(v => v.front === 'def')
        let defenderResponsePart = ''
        if(defenderItems.length === 0) {
            defenderResponsePart = 'Defender was a chicken and didn\'t engage in the fight but also hasn\'t lost any units :chicken:.'
        } else {
            const fightValues = defenderItems
                .map(v => v.fight)
                .reduce(battleReportDataReducer, {})
            const survivedItems = defenderItems
                .map(v => v.frest !== '' ? v.frest : {at: 0, de: 0, cn: 0})
                .reduce(battleReportDataReducer, {})
            const fightingMP = calculateMP(fightValues.at, fightValues.de)
            const survivedMP = calculateMP(survivedItems.at, survivedItems.de)
            const survivedMPPercent = (survivedMP / fightingMP * 100).toFixed(1)
            if(defenderItems.filter(v => v.survived === true).length > 0) {
                defenderResponsePart = `Defender lost some units but ${survivedMP.toFixed(1)}mp (${survivedMPPercent}%) survived :face_holding_back_tears:.`
            } else {
                defenderResponsePart = `Defender lost all units (${fightingMP.toFixed(1)}mp) :sob:.`
            }
        }
        let attackerResponsePart = attackerItems
        const fightValues = attackerItems
            .map(v => v.fight)
            .reduce(battleReportDataReducer, {})
        const survivedItems = attackerItems
            .map(v => v.frest !== '' ? v.frest : {at: 0, de: 0, cn: 0})
            .reduce(battleReportDataReducer, {})
        const fightingMP = calculateMP(fightValues.at, fightValues.de)
        const survivedMP = calculateMP(survivedItems.at, survivedItems.de)
        const survivedMPPercent = (survivedMP / fightingMP * 100).toFixed(1)
        if(attackerItems.filter(v => v.survived === true).length > 0) {
            if (survivedMPPercent === '100.0') {
                attackerResponsePart = `Attacker lost nothing :confetti_ball:.`
            } else {
                attackerResponsePart = `Attacker lost some units but ${survivedMP.toFixed(1)}mp (${survivedMPPercent}%) survived :piñata:.`
            }
        } else {
            attackerResponsePart = `Attacker lost all units (${fightingMP.toFixed(1)}mp) :sob:.`
        }

        fleetLostResponse = `
${attackerResponsePart}
${defenderResponsePart}
                `
    }

    const attackerAlliance = parsedJsonData.parties.attacker.planet.alliance ? '[' + parsedJsonData.parties.attacker.planet.alliance + '] ' : ''
    const defenderAlliance = parsedJsonData.parties.defender.planet.alliance ? '[' + parsedJsonData.parties.defender.planet.alliance + '] ' : ''
    return {
        text: `${user} shared a battle report: ${finalReportUrl}

**Attacker:** ${attackerAlliance}${parsedJsonData.parties.attacker.planet.user_alias} with **${attacker.cn.toLocaleString()}** ships and **${attackerMP}mp** (${attacker.at.toLocaleString()}/${attacker.de.toLocaleString()})
**Defender:** ${defenderAlliance}${parsedJsonData.parties.defender.planet.user_alias} with **${defender.cn.toLocaleString()}** ships/defense units and **${defenderMP}mp** (${defender.at.toLocaleString()}/${defender.de.toLocaleString()})
${fleetLostResponse}
${resultResponse}
${"-".repeat(100)}`
    }

}

module.exports.createTextMessage = createTextMessage
