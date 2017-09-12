

export function questionTupleToObject(tuple) {
    let [
        questionStr,
        betDeadlineBlock,
        voteDeadlineBlock,
        yesVotes,
        noVotes,
        yesFunds,
        noFunds,
    ] = tuple

    return {
        questionStr,
        betDeadlineBlock,
        voteDeadlineBlock,
        yesVotes,
        noVotes,
        yesFunds,
        noFunds,
    }
}