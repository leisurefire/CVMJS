export default function DynamicDifficulty(mouse, difficulty) {
    const alternativesCount = mouse.alternative.length;
    if (alternativesCount === 0) {
        return new mouse();
    }
    else {
        const random = Math.random();
        switch (difficulty) {
            case 0:
                return new mouse();
            case 1:
                if (random < 0.5) {
                    return new mouse();
                }
                else {
                    const alternativeIndex = Math.floor((random - 0.5) * alternativesCount / 0.5);
                    return new mouse.alternative[alternativeIndex];
                }
            case 2:
                const totalOptions = alternativesCount + 1;
                const choiceIndex = Math.floor(random * totalOptions);
                if (choiceIndex === 0) {
                    return new mouse();
                }
                else {
                    return new mouse.alternative[choiceIndex - 1];
                }
            default:
                throw new Error(`Invalid difficulty ${difficulty}`);
        }
    }
}
