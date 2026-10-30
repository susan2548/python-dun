export const CORE_LESSONS = 3;

// phase is the current question index; it is not a count of accepted answers
// while an attack is playing. Track accepted answers explicitly for every exit.
export function ensureLessonProgress(battle) {
  battle.answeredQuestions ??= Math.max(0,battle.phase||0);
  return battle;
}
export function recordCorrectAnswer(battle) {
  ensureLessonProgress(battle);
  battle.answeredQuestions=Math.max(battle.answeredQuestions,battle.phase+1);
}
export function enemyHpFloor(battle) {
  return (battle.answeredQuestions ?? battle.phase ?? 0)>=CORE_LESSONS ? 0 : 1;
}
export function canClaimVictory(battle) {
  return battle.enemyHp<=0 && enemyHpFloor(battle)===0;
}
