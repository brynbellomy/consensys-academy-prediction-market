

export function questionTupleToObject(tuple) {
    let [
        exists,
        question,
        betDeadlineBlock,
        voteDeadlineBlock,
        yesVotes,
        noVotes,
        yesFunds,
        noFunds,
    ] = tuple

    return {
        exists,
        question,
        betDeadlineBlock,
        voteDeadlineBlock,
        yesVotes,
        noVotes,
        yesFunds,
        noFunds,
    }
}