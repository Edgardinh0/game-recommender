export function getAverage(scores: number[]): number {
    const sum = scores.reduce((acc, val) => acc + val, 0)
    return sum / scores.length
}

export function normalizeToPercent(average: number): number {
    return Math.round((average - 1) / 4 * 100)
}

export function groupAnswersByMotivator(answers: any[], motivators: any[]): Map<string, number[]> {
    const motivMap = new Map<string, number[]>()
    
    for (const ans of answers) {
        const motivator = motivators.find(m => m.id === ans.question_id)
        if (!motivator) continue
        
        if (!motivMap.has(motivator.target_motivator)) {
            motivMap.set(motivator.target_motivator, [ans.score])
        } else {
            const existing = motivMap.get(motivator.target_motivator) || []
            motivMap.set(motivator.target_motivator, [...existing, ans.score])
        }
    }
    
    return motivMap
}

export function calculateMotivatorScores(motivMap: Map<string, number[]>): Record<string, number> {
    const scores: Record<string, number> = {}
    
    motivMap.forEach((scoresArray, name) => {
        const average = getAverage(scoresArray)
        scores[name] = normalizeToPercent(average)
    })
    
    return scores
}

export function calculateResultVector(motivatorScores: any, motivatorVectors: any) {
    let resultVector = new Array(384).fill(0)
    
    for (let motivator of motivatorVectors) {
        const name = motivator.motivator_name
        const weight = motivatorScores[name] / 100
        
        for (let i = 0; i < 384; i++) {
            resultVector[i] = resultVector[i] + motivator.motivator_vector[i] * weight
        }
    }

    return resultVector
}